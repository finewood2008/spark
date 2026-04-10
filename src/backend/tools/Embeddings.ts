/**
 * Embeddings - 文本嵌入工具
 * 
 * 使用 OpenAI 或 vveai 的 Embeddings API 生成向量
 */

import { AIProvider } from './AIProvider';

export interface EmbeddingResult {
  embedding: number[];
  index: number;
}

export class Embeddings {
  private aiProvider: AIProvider;
  private model: string;

  constructor(aiProvider: AIProvider) {
    this.aiProvider = aiProvider;
    this.model = 'text-embedding-3-large';
  }

  /**
   * 生成单个文本的嵌入向量
   */
  async embed(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0].embedding;
  }

  /**
   * 批量生成嵌入向量
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) return [];

    try {
      const embeddings = await this.aiProvider.embed(texts);
      
      return embeddings.map((embedding, index) => ({
        embedding,
        index,
      }));
    } catch (error) {
      console.error('Embeddings error:', error);
      throw error;
    }
  }

  /**
   * 计算两个向量的余弦相似度
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * 找出最相似的文本
   */
  async findMostSimilar(
    query: string,
    texts: string[],
    topK: number = 5
  ): Promise<{ text: string; similarity: number }[]> {
    const queryEmbedding = await this.embed(query);
    const textEmbeddings = await this.embedBatch(texts);

    const similarities = texts.map((text, index) => ({
      text,
      similarity: this.cosineSimilarity(queryEmbedding, textEmbeddings[index].embedding),
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}
