"use strict";
/**
 * VIManager - 品牌视觉管理
 *
 * 负责 VI 的检测、生成、应用和管理
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
exports.VIManager = void 0;
const ImageGenerator_1 = require("../tools/ImageGenerator");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const DEFAULT_PALETTES = {
    default: {
        primary: '#FF6B35',
        secondary: '#1E3A5F',
        accent: '#FFB347',
        neutral: '#2D2D2D',
        background: '#F5F5F5',
    },
    tech: {
        primary: '#0066FF',
        secondary: '#1A1A2E',
        accent: '#00D4FF',
        neutral: '#333333',
        background: '#F8FAFC',
    },
    fashion: {
        primary: '#E91E63',
        secondary: '#1A1A1A',
        accent: '#FFD700',
        neutral: '#424242',
        background: '#FAFAFA',
    },
    food: {
        primary: '#FF5722',
        secondary: '#4CAF50',
        accent: '#FFC107',
        neutral: '#5D4037',
        background: '#FFF8E1',
    },
    medical: {
        primary: '#2196F3',
        secondary: '#0D47A1',
        accent: '#4CAF50',
        neutral: '#616161',
        background: '#E3F2FD',
    },
};
class VIManager {
    constructor(aiProvider, dataPath) {
        this.aiProvider = aiProvider;
        this.imageGenerator = new ImageGenerator_1.ImageGenerator();
        this.dataPath = dataPath;
    }
    /**
     * 检测现有 VI
     */
    async detectVI(files) {
        const result = {
            hasVI: false,
            colors: [],
            logoFound: false,
        };
        for (const file of files) {
            if (file.type.includes('image')) {
                // TODO: 使用图像识别检测配色和 Logo
                // 暂时简单处理
                if (file.name.toLowerCase().includes('logo')) {
                    result.logoFound = true;
                }
            }
        }
        result.hasVI = result.logoFound || result.colors.length >= 3;
        return result;
    }
    /**
     * 生成 VI
     */
    async generateVI(params) {
        try {
            // 确定行业类型
            const industryType = this.categorizeIndustry(params.industry);
            // 使用对应行业的默认配色作为基础
            const basePalette = DEFAULT_PALETTES[industryType] || DEFAULT_PALETTES.default;
            // 如果用户指定了颜色，合并
            const colors = {
                ...basePalette,
                ...params.colors,
            };
            // 使用 AI 分析品牌特征，生成风格描述
            const styleDescription = await this.generateStyleDescription(params);
            // 生成 Logo 概念
            const logoConcepts = await this.imageGenerator.generateLogo({
                brandName: params.brandName,
                industry: params.industry,
                primaryColor: colors.primary,
                style: params.style || ['专业', '现代'],
            });
            // 构建 VI 规范
            const vi = {
                id: `vi_${Date.now()}`,
                name: params.brandName,
                colors,
                fonts: {
                    primary: 'Noto Sans SC',
                    secondary: 'Inter',
                    numbers: 'DIN Alternate',
                },
                logo: {
                    path: logoConcepts[0]?.path || '',
                    variants: [
                        { type: 'horizontal', path: logoConcepts[0]?.path || '' },
                        { type: 'icon', path: logoConcepts[1]?.path || logoConcepts[0]?.path || '' },
                    ],
                },
                styles: params.style || ['专业', '现代', '活力'],
                industry: params.industry,
                generated: true,
                createdAt: new Date().toISOString(),
            };
            // 保存到本地
            await this.saveVI(vi);
            return {
                success: true,
                vi,
                suggestions: [
                    '查看完整 VI 手册',
                    '下载 Logo 文件',
                    '应用到内容生成',
                ],
                message: `已为 ${params.brandName} 生成一套完整的品牌视觉规范`,
            };
        }
        catch (error) {
            console.error('VI generation failed:', error);
            return {
                success: false,
                message: 'VI 生成失败，请稍后重试',
            };
        }
    }
    /**
     * 加载 VI
     */
    async loadVI(brandId) {
        const viPath = path.join(this.dataPath, 'brands', brandId, 'vi.json');
        if (await fs.pathExists(viPath)) {
            return fs.readJson(viPath);
        }
        return null;
    }
    /**
     * 保存 VI
     */
    async saveVI(vi) {
        const viDir = path.join(this.dataPath, 'brands', vi.name);
        await fs.ensureDir(viDir);
        const viPath = path.join(viDir, 'vi.json');
        await fs.writeJson(viPath, vi, { spaces: 2 });
        // 保存 logo 文件
        if (vi.logo.path) {
            const logoDir = path.join(viDir, 'logo');
            await fs.ensureDir(logoDir);
            // logo 文件已生成并保存
        }
    }
    /**
     * 应用 VI 到内容
     */
    applyVIToContent(vi, content) {
        // 在内容中注入品牌色彩标识
        // 实际应用中，前端会根据 VI 规范渲染
        return {
            styledBody: content.body,
            styledTitle: content.title,
        };
    }
    /**
     * 生成风格描述
     */
    async generateStyleDescription(params) {
        const prompt = `
品牌：${params.brandName}
行业：${params.industry}
目标客群：${params.targetAudience || '普通消费者'}
风格偏好：${params.style?.join('、') || '专业、现代'}

请用 50 字以内描述这个品牌的视觉风格。
`;
        try {
            const response = await this.aiProvider.chat([
                { role: 'user', content: prompt }
            ]);
            return response.trim();
        }
        catch {
            return '专业、现代、充满活力的品牌形象';
        }
    }
    /**
     * 行业分类
     */
    categorizeIndustry(industry) {
        const lower = industry.toLowerCase();
        if (lower.includes('科技') || lower.includes('互联网') || lower.includes('软件')) {
            return 'tech';
        }
        if (lower.includes('时尚') || lower.includes('服装') || lower.includes('美妆')) {
            return 'fashion';
        }
        if (lower.includes('餐饮') || lower.includes('食物') || lower.includes('美食')) {
            return 'food';
        }
        if (lower.includes('医疗') || lower.includes('健康') || lower.includes('制药')) {
            return 'medical';
        }
        return 'default';
    }
}
exports.VIManager = VIManager;
