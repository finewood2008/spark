"use strict";
/**
 * FileParser - 文件解析器
 *
 * 支持多种格式的文件解析，提取知识库内容
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileParser = void 0;
const fs = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class FileParser {
    constructor() { }
    /**
     * 解析文件
     */
    async parse(source, data) {
        if (source === 'user_input' && typeof data === 'string') {
            return this.parseText(data);
        }
        if (source === 'file' && typeof data === 'string') {
            const filePath = data;
            const ext = path_1.default.extname(filePath).toLowerCase();
            switch (ext) {
                case '.txt':
                case '.md':
                    return this.parseTextFile(filePath);
                case '.pdf':
                    return this.parsePDF(filePath);
                case '.docx':
                case '.doc':
                    return this.parseWord(filePath);
                case '.xlsx':
                case '.xls':
                    return this.parseExcel(filePath);
                case '.pptx':
                case '.ppt':
                    return this.parsePowerPoint(filePath);
                case '.json':
                    return this.parseJSON(filePath);
                case '.csv':
                    return this.parseCSV(filePath);
                case '.png':
                case '.jpg':
                case '.jpeg':
                case '.gif':
                case '.svg':
                    return this.parseImage(filePath);
                case '.mp3':
                case '.wav':
                case '.m4a':
                    return this.parseAudio(filePath);
                default:
                    return this.parseTextFile(filePath);
            }
        }
        return [];
    }
    /**
     * 解析文本
     */
    async parseText(text) {
        return [{
                id: `doc_${Date.now()}`,
                content: text,
                metadata: {
                    type: 'text',
                    name: 'user_input',
                    size: text.length,
                    extractedAt: new Date().toISOString(),
                },
            }];
    }
    /**
     * 解析文本文件
     */
    async parseTextFile(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');
        const name = path_1.default.basename(filePath);
        return [{
                id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                content,
                metadata: {
                    type: path_1.default.extname(filePath).slice(1),
                    name,
                    size: (await fs.stat(filePath)).size,
                    extractedAt: new Date().toISOString(),
                },
            }];
    }
    /**
     * 解析 PDF
     */
    async parsePDF(filePath) {
        // 实际使用中需要使用 pdf-parse 或 similar
        // 这里返回占位符
        console.log(`PDF parsing not implemented for: ${filePath}`);
        return [{
                id: `doc_${Date.now()}`,
                content: `[PDF content from ${path_1.default.basename(filePath)}]`,
                metadata: {
                    type: 'pdf',
                    name: path_1.default.basename(filePath),
                    size: 0,
                    extractedAt: new Date().toISOString(),
                },
            }];
    }
    /**
     * 解析 Word 文档
     */
    async parseWord(filePath) {
        // 使用 mammoth 或 similar
        console.log(`Word parsing not implemented for: ${filePath}`);
        return [{
                id: `doc_${Date.now()}`,
                content: `[Word content from ${path_1.default.basename(filePath)}]`,
                metadata: {
                    type: 'doc',
                    name: path_1.default.basename(filePath),
                    size: 0,
                    extractedAt: new Date().toISOString(),
                },
            }];
    }
    /**
     * 解析 Excel
     */
    async parseExcel(filePath) {
        // 使用 xlsx 库
        console.log(`Excel parsing not implemented for: ${filePath}`);
        return [{
                id: `doc_${Date.now()}`,
                content: `[Excel content from ${path_1.default.basename(filePath)}]`,
                metadata: {
                    type: 'xlsx',
                    name: path_1.default.basename(filePath),
                    size: 0,
                    extractedAt: new Date().toISOString(),
                },
            }];
    }
    /**
     * 解析 PowerPoint
     */
    async parsePowerPoint(filePath) {
        // 使用 pptx-parser 或 similar
        console.log(`PowerPoint parsing not implemented for: ${filePath}`);
        return [{
                id: `doc_${Date.now()}`,
                content: `[PowerPoint content from ${path_1.default.basename(filePath)}]`,
                metadata: {
                    type: 'pptx',
                    name: path_1.default.basename(filePath),
                    size: 0,
                    extractedAt: new Date().toISOString(),
                },
            }];
    }
    /**
     * 解析 JSON
     */
    async parseJSON(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        // 展平 JSON 为文本
        const text = JSON.stringify(parsed, null, 2);
        return [{
                id: `doc_${Date.now()}`,
                content: text,
                metadata: {
                    type: 'json',
                    name: path_1.default.basename(filePath),
                    size: (await fs.stat(filePath)).size,
                    extractedAt: new Date().toISOString(),
                },
            }];
    }
    /**
     * 解析 CSV
     */
    async parseCSV(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        // 简单解析 CSV
        const text = lines.map(line => {
            const cells = line.split(',');
            return cells.join(' | ');
        }).join('\n');
        return [{
                id: `doc_${Date.now()}`,
                content: text,
                metadata: {
                    type: 'csv',
                    name: path_1.default.basename(filePath),
                    size: (await fs.stat(filePath)).size,
                    extractedAt: new Date().toISOString(),
                },
            }];
    }
    /**
     * 解析图片（OCR）
     */
    async parseImage(filePath) {
        // 使用 AI Vision API 或 Tesseract OCR
        console.log(`Image parsing not implemented for: ${filePath}`);
        return [{
                id: `doc_${Date.now()}`,
                content: `[Image content from ${path_1.default.basename(filePath)}]`,
                metadata: {
                    type: 'image',
                    name: path_1.default.basename(filePath),
                    size: 0,
                    extractedAt: new Date().toISOString(),
                },
            }];
    }
    /**
     * 解析音频（Whisper）
     */
    async parseAudio(filePath) {
        // 使用 Whisper API
        console.log(`Audio parsing not implemented for: ${filePath}`);
        return [{
                id: `doc_${Date.now()}`,
                content: `[Audio transcription from ${path_1.default.basename(filePath)}]`,
                metadata: {
                    type: 'audio',
                    name: path_1.default.basename(filePath),
                    size: 0,
                    extractedAt: new Date().toISOString(),
                },
            }];
    }
}
exports.FileParser = FileParser;
