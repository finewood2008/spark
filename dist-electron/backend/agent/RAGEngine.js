"use strict";
/**
 * RAGEngine - 检索增强生成引擎
 *
 * 双模式：
 *   1. QeeClaw 平台模式 — 通过 SDK knowledge 模块做向量检索
 *   2. 本地模式（fallback）— 关键词匹配 + 本地文件索引
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGEngine = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const qeeclaw_client_1 = require("../qeeclaw/qeeclaw-client");
class RAGEngine {
    constructor(dataPath) {
        this.dataPath = dataPath;
        this.collectionName = 'spark_knowledge';
        this.documents = new Map();
    }
    // ─── 平台辅助 ──────────────────────────────────
    getBridge() {
        try {
            const bridge = qeeclaw_client_1.QeeClawBridge.get();
            return bridge.online ? bridge : null;
        }
        catch {
            return null;
        }
    }
    // ─── 初始化 ────────────────────────────────────
    async initialize(brandId) {
        await fs.ensureDir(this.dataPath);
        const indexPath = path.join(this.dataPath, `${brandId}_index.json`);
        if (await fs.pathExists(indexPath)) {
            const data = await fs.readJson(indexPath);
            this.documents = new Map(Object.entries(data));
        }
    }
    // ─── 文档管理 ──────────────────────────────────
    async addDocument(doc) {
        this.documents.set(doc.id, doc);
        await this.saveIndex();
        // Sync to platform knowledge base (await so caller knows it completed)
        const bridge = this.getBridge();
        if (bridge) {
            try {
                await bridge.ingestKnowledge(doc.content, `spark_${doc.metadata.category}_${doc.id}`);
            }
            catch (e) {
                console.warn('[RAGEngine] Platform sync failed for doc', doc.id, e);
            }
        }
    }
    async addDocuments(docs) {
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
                }
                catch (e) {
                    console.warn('[RAGEngine] Platform sync failed for doc', doc.id, e);
                }
            }
        }
    }
    // ─── 搜索（平台优先，本地 fallback） ──────────
    async search(query, topK = 5, brandId) {
        // 尝试平台向量检索
        const bridge = this.getBridge();
        if (bridge) {
            try {
                const platformResult = await bridge.searchKnowledge(query, topK);
                const items = (platformResult.results || platformResult.items || []);
                if (items.length > 0) {
                    return items.map((item) => ({
                        content: (item.content || item.text || ''),
                        metadata: (item.metadata || {}),
                        score: (item.score || item.similarity || 0.8),
                    }));
                }
            }
            catch {
                // 平台检索失败，走本地
            }
        }
        return this.searchLocal(query, topK, brandId);
    }
    /** 本地关键词匹配搜索 */
    searchLocal(query, topK = 5, brandId) {
        const results = [];
        const docs = Array.from(this.documents.values());
        const queryWords = query.toLowerCase().split(/\s+/);
        for (const doc of docs) {
            if (brandId && doc.metadata.brandId !== brandId)
                continue;
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
    async searchByCategory(category, brandId) {
        const docs = Array.from(this.documents.values());
        const results = [];
        for (const doc of docs) {
            if (doc.metadata.category !== category)
                continue;
            if (brandId && doc.metadata.brandId !== brandId)
                continue;
            results.push({
                content: doc.content,
                metadata: doc.metadata,
                score: 1,
            });
        }
        return results;
    }
    async deleteDocument(docId) {
        const deleted = this.documents.delete(docId);
        if (deleted) {
            await this.saveIndex();
        }
        return deleted;
    }
    async clearBrand(brandId) {
        const toDelete = [];
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
    getStats(brandId) {
        const docs = Array.from(this.documents.values());
        const filtered = brandId
            ? docs.filter(d => d.metadata.brandId === brandId)
            : docs;
        const byCategory = {};
        for (const doc of filtered) {
            const cat = doc.metadata.category;
            byCategory[cat] = (byCategory[cat] || 0) + 1;
        }
        return {
            totalDocs: filtered.length,
            byCategory,
        };
    }
    async saveIndex() {
        const data = Object.fromEntries(this.documents);
        await fs.writeJson(path.join(this.dataPath, `index.json`), data, { spaces: 2 });
    }
    async exportKnowledge(brandId) {
        const docs = Array.from(this.documents.values())
            .filter(d => d.metadata.brandId === brandId);
        return JSON.stringify(docs, null, 2);
    }
    async importKnowledge(brandId, jsonStr) {
        try {
            const docs = JSON.parse(jsonStr);
            let count = 0;
            for (const doc of docs) {
                const newDoc = {
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
        }
        catch {
            return 0;
        }
    }
    isEmpty(brandId) {
        if (!brandId) {
            return this.documents.size === 0;
        }
        return Array.from(this.documents.values())
            .filter(d => d.metadata.brandId === brandId).length === 0;
    }
}
exports.RAGEngine = RAGEngine;
