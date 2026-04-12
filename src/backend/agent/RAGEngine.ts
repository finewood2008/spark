/**
 * RAGEngine - 检索增强生成引擎
 * 
 * 双模式：
 *   1. QeeClaw 平台模式 — 通过 SDK knowledge 模块做向量检索
 *   2. 本地模式（fallback）— 关键词匹配 + 本地文件索引
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { QeeClawBridge } from '../qeeclaw/qeeclaw-client';

export interface SearchResult {
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

export interface IndexedDocument {
  id: string;
  content: string;
  metadata: {
    brandId: string;
    category: 'company' | 'product' | 'brand' | 'performance';
    source?: string;
    createdAt: string;
  };
}

export class RAGEngine {
  private dataPath: string;
  private collectionName: string;
  private documents: Map<string, IndexedDocument>;

  constructor(dataPath: string) {
    this.dataPath = dataPath;
    this.collectionName = 'spark_knowledge';
    this.documents = new Map();
  }

  // ─── 平台辅助 ──────────────────────────────────

  private getBridge(): QeeClawBridge | null {
    try {
      const bridge = QeeClawBridge.get();
      return bridge.online ? bridge : null;
    } catch {
      return null;
    }
  }

  // ─── 初始化 ────────────────────────────────────

  async initialize(brandId: string): Promise<void> {
    await fs.ensureDir(this.dataPath);
    const indexPath = path.join(this.dataPath, `${brandId}_index.json`);

    if (await fs.pathExists(indexPath)) {
      const data = await fs.readJson(indexPath);
      this.documents = new Map(Object.entries(data));
    }
  }

  // ─── 文档管理 ──────────────────────────────────

  async addDocument(doc: IndexedDocument): Promise<void> {
    this.documents.set(doc.id, doc);
    await this.saveIndex();

    // Sync to platform knowledge base (await so caller knows it completed)
    const bridge = this.getBridge();
    if (bridge) {
      try {
        await bridge.ingestKnowledge(doc.content, `spark_${doc.metadata.category}_${doc.id}`);
      } catch (e) {
        console.warn('[RAGEngine] Platform sync failed for doc', doc.id, e);
      }
    }
  }

  async addDocuments(docs: IndexedDocument[]): Promise<void> {
    for (const doc of docs) {
      this.documents.set(doc.id, doc);
    }
    await this.saveIndex();

    // Sync all to platform (await each so caller knows they completed)
    const bridge = this.getBridge();
    if (bridge) {
      for (const doc of docs) {
        try {
          await bridge.ingestKnowledge(doc.content, `spark_${doc.metadata.category}_${doc.id}`);
        } catch (e) {
          console.warn('[RAGEngine] Platform sync failed for doc', doc.id, e);
        }
      }
    }
  }

  // ─── 搜索（平台优先，本地 fallback） ──────────

  async search(query: string, topK: number = 5, brandId?: string): Promise<SearchResult[]> {
    // 尝试平台向量检索
    const bridge = this.getBridge();
    if (bridge) {
      try {
        const platformResult = await bridge.searchKnowledge(query, topK) as Record<string, unknown>;
        const items = (platformResult.results || platformResult.items || []) as Array<Record<string, unknown>>;
        if (items.length > 0) {
          return items.map((item) => ({
            content: (item.content || item.text || '') as string,
            metadata: (item.metadata || {}) as Record<string, unknown>,
            score: (item.score || item.similarity || 0.8) as number,
          }));
        }
      } catch {
        // 平台检索失败，走本地
      }
    }

    return this.searchLocal(query, topK, brandId);
  }

  /** 本地关键词匹配搜索 */
  private searchLocal(query: string, topK: number = 5, brandId?: string): SearchResult[] {
    const results: SearchResult[] = [];
    const docs = Array.from(this.documents.values());
    const queryWords = query.toLowerCase().split(/\s+/);

    for (const doc of docs) {
      if (brandId && doc.metadata.brandId !== brandId) continue;

      const contentLower = doc.content.toLowerCase();
      let matchScore = 0;

      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          matchScore += 1;
          const regex = new RegExp(word, 'gi');
          const matches = contentLower.match(regex);
          if (matches) {
            matchScore += matches.length * 0.1;
          }
        }
      }

      if (matchScore > 0) {
        const normalizedScore = Math.min(matchScore / queryWords.length, 1);
        results.push({
          content: doc.content,
          metadata: doc.metadata,
          score: normalizedScore,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  async searchByCategory(
    category: 'company' | 'product' | 'brand' | 'performance',
    brandId?: string
  ): Promise<SearchResult[]> {
    const docs = Array.from(this.documents.values());
    const results: SearchResult[] = [];

    for (const doc of docs) {
      if (doc.metadata.category !== category) continue;
      if (brandId && doc.metadata.brandId !== brandId) continue;

      results.push({
        content: doc.content,
        metadata: doc.metadata,
        score: 1,
      });
    }

    return results;
  }

  async deleteDocument(docId: string): Promise<boolean> {
    const deleted = this.documents.delete(docId);
    if (deleted) {
      await this.saveIndex();
    }
    return deleted;
  }

  async clearBrand(brandId: string): Promise<void> {
    const toDelete: string[] = [];

    for (const [id, doc] of this.documents.entries()) {
      if (doc.metadata.brandId === brandId) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.documents.delete(id);
    }

    await this.saveIndex();
  }

  getStats(brandId?: string): {
    totalDocs: number;
    byCategory: Record<string, number>;
  } {
    const docs = Array.from(this.documents.values());
    const filtered = brandId
      ? docs.filter(d => d.metadata.brandId === brandId)
      : docs;

    const byCategory: Record<string, number> = {};
    for (const doc of filtered) {
      const cat = doc.metadata.category;
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    return {
      totalDocs: filtered.length,
      byCategory,
    };
  }

  private async saveIndex(): Promise<void> {
    const data = Object.fromEntries(this.documents);
    await fs.writeJson(
      path.join(this.dataPath, `index.json`),
      data,
      { spaces: 2 }
    );
  }

  async exportKnowledge(brandId: string): Promise<string> {
    const docs = Array.from(this.documents.values())
      .filter(d => d.metadata.brandId === brandId);

    return JSON.stringify(docs, null, 2);
  }

  async importKnowledge(brandId: string, jsonStr: string): Promise<number> {
    try {
      const docs: IndexedDocument[] = JSON.parse(jsonStr);
      let count = 0;

      for (const doc of docs) {
        const newDoc: IndexedDocument = {
          ...doc,
          metadata: {
            ...doc.metadata,
            brandId,
          },
        };
        this.documents.set(newDoc.id, newDoc);
        count++;
      }

      await this.saveIndex();
      return count;
    } catch {
      return 0;
    }
  }

  isEmpty(brandId?: string): boolean {
    if (!brandId) {
      return this.documents.size === 0;
    }
    return Array.from(this.documents.values())
      .filter(d => d.metadata.brandId === brandId).length === 0;
  }
}
