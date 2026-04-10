"use strict";
/**
 * RAGEngine - 检索增强生成引擎
 *
 * 负责企业知识库的构建、索引和检索
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
class RAGEngine {
    constructor(dataPath, embeddings = null) {
        this.dataPath = dataPath;
        this.collectionName = 'spark_knowledge';
        this.documents = new Map();
        this.embeddings = embeddings;
    }
    /**
     * 初始化知识库
     */
    async initialize(brandId) {
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
    async addDocument(doc) {
        this.documents.set(doc.id, doc);
        await this.saveIndex();
    }
    /**
     * 批量添加文档
     */
    async addDocuments(docs) {
        for (const doc of docs) {
            this.documents.set(doc.id, doc);
        }
        await this.saveIndex();
    }
    /**
     * 搜索知识库
     */
    async search(query, topK = 5, brandId) {
        const results = [];
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
    /**
     * 删除文档
     */
    async deleteDocument(docId) {
        const deleted = this.documents.delete(docId);
        if (deleted) {
            await this.saveIndex();
        }
        return deleted;
    }
    /**
     * 清空品牌知识库
     */
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
    /**
     * 获取文档统计
     */
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
    /**
     * 保存索引到磁盘
     */
    async saveIndex() {
        const data = Object.fromEntries(this.documents);
        await fs.writeJson(path.join(this.dataPath, `index.json`), data, { spaces: 2 });
    }
    /**
     * 导出知识库
     */
    async exportKnowledge(brandId) {
        const docs = Array.from(this.documents.values())
            .filter(d => d.metadata.brandId === brandId);
        return JSON.stringify(docs, null, 2);
    }
    /**
     * 导入知识库
     */
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
    /**
     * 检查是否为空
     */
    isEmpty(brandId) {
        if (!brandId) {
            return this.documents.size === 0;
        }
        return Array.from(this.documents.values())
            .filter(d => d.metadata.brandId === brandId).length === 0;
    }
}
exports.RAGEngine = RAGEngine;
