/**
 * RAGEngine - 检索增强生成引擎
 * 
 * 负责企业知识库的构建、索引和检索
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { Embeddings } from '../tools/Embeddings';

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
  private embeddings: Embeddings | null;

  constructor(dataPath: string, embeddings: Embeddings | null = null) {
    this.dataPath = dataPath;
    this.collectionName = 'spark_knowledge';
    this.documents = new Map();
    this.embeddings = embeddings;
  }

  /**
   * 初始化知识库
   */
  async initialize(brandId: string): Promise<void> {
    await fs.ensureDir(this.dataPath);
    const indexPath = path.join(this.dataPath, `${brandId}_index.json`);
    
    if (await fs.pathExists(indexPath)) {
      const data = await fs.readJson(indexPath);
      this.documents = new Map(Object.entries(data));
    }
  }

  /**
   * 添加文档到知识库
   */
  async addDocument(doc: IndexedDocument): Promise<void> {
    this.documents.set(doc.id, doc);
    await this.saveIndex();
  }

  /**
   * 批量添加文档
   */
  async addDocuments(docs: IndexedDocument[]): Promise<void> {
    for (const doc of docs) {
      this.documents.set(doc.id, doc);
    }
    await this.saveIndex();
  }

  /**
   * 搜索知识库
   */
  async search(query: string, topK: number = 5, brandId?: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const docs = Array.from(this.documents.values());

    // 简单的关键词匹配搜索
    // 实际生产中应该使用向量相似度搜索
    const queryWords = query.toLowerCase().split(/\s+/);

    for (const doc of docs) {
      if (brandId && doc.metadata.brandId !== brandId) {
        continue;
      }

      const contentLower = doc.content.toLowerCase();
      let matchScore = 0;

      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          matchScore += 1;
          // 计算词频
          const regex = new RegExp(word, 'gi');
          const matches = contentLower.match(regex);
          if (matches) {
            matchScore += matches.length * 0.1;
          }
        }
      }

      if (matchScore > 0) {
        // 归一化分数
        const normalizedScore = Math.min(matchScore / queryWords.length, 1);
        results.push({
          content: doc.content,
          metadata: doc.metadata,
          score: normalizedScore,
        });
      }
    }

    // 按分数排序
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK);
  }

  /**
   * 按类别搜索
   */
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

  /**
   * 删除文档
   */
  async deleteDocument(docId: string): Promise<boolean> {
    const deleted = this.documents.delete(docId);
    if (deleted) {
      await this.saveIndex();
    }
    return deleted;
  }

  /**
   * 清空品牌知识库
   */
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

  /**
   * 获取文档统计
   */
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

  /**
   * 保存索引到磁盘
   */
  private async saveIndex(): Promise<void> {
    const data = Object.fromEntries(this.documents);
    await fs.writeJson(
      path.join(this.dataPath, `index.json`),
      data,
      { spaces: 2 }
    );
  }

  /**
   * 导出知识库
   */
  async exportKnowledge(brandId: string): Promise<string> {
    const docs = Array.from(this.documents.values())
      .filter(d => d.metadata.brandId === brandId);
    
    return JSON.stringify(docs, null, 2);
  }

  /**
   * 导入知识库
   */
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

  /**
   * 检查是否为空
   */
  isEmpty(brandId?: string): boolean {
    if (!brandId) {
      return this.documents.size === 0;
    }
    return Array.from(this.documents.values())
      .filter(d => d.metadata.brandId === brandId).length === 0;
  }
}
