"use strict";
/**
 * ImageGenerator - 图像生成器
 *
 * 使用 DALL-E 等生成封面图、配图、Logo 等
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
exports.ImageGenerator = void 0;
const fs = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class ImageGenerator {
    constructor(aiProvider) {
        this.aiProvider = aiProvider;
        this.outputPath = path_1.default.join(process.cwd(), 'generated_images');
    }
    setOutputPath(outputPath) {
        this.outputPath = outputPath;
    }
    /**
     * 生成 Logo
     */
    async generateLogo(params) {
        const { brandName, industry, primaryColor, style } = params;
        const prompt = this.buildLogoPrompt({
            brandName,
            industry,
            primaryColor,
            style: style || ['专业', '现代'],
        });
        const results = [];
        // 生成 3 个 Logo 概念
        for (let i = 0; i < 3; i++) {
            const imagePath = await this.generateImage(prompt, `logo_${brandName}_${i + 1}`);
            results.push({
                path: imagePath,
                prompt,
                model: 'dalle-3',
            });
        }
        return results;
    }
    /**
     * 生成封面图
     */
    async generateCover(params) {
        const { topic, brandName, vi, platform } = params;
        const prompt = this.buildCoverPrompt({
            topic,
            brandName,
            primaryColor: vi?.primaryColor || '#FF6B35',
            secondaryColor: vi?.secondaryColor || '#1E3A5F',
            platform,
        });
        const imagePath = await this.generateImage(prompt, `cover_${topic.slice(0, 20)}`);
        return {
            path: imagePath,
            prompt,
            model: 'dalle-3',
        };
    }
    /**
     * 生成配图
     */
    async generateIllustration(topic, style) {
        const prompt = `${topic}, ${style || '现代插画风格'}, 高质量`;
        const imagePath = await this.generateImage(prompt, `illustration_${topic.slice(0, 20)}`);
        return {
            path: imagePath,
            prompt,
            model: 'dalle-3',
        };
    }
    /**
     * 生成社交媒体配图
     */
    async generateSocialImage(content, platform, vi) {
        const platformSpecs = {
            wechat: { width: 900, height: 383 },
            xiaohongshu: { width: 1242, height: 1660 },
            douyin: { width: 1080, height: 1920 },
            weibo: { width: 1080, height: 1080 },
        };
        const specs = platformSpecs[platform] || platformSpecs.wechat;
        const color = vi?.primaryColor || '#FF6B35';
        const prompt = `
      社交媒体配图，尺寸 ${specs.width}x${specs.height}，
      主题：${content}，
      主色调：${color}，
      现代简约风格，白底，高质量
    `.trim();
        const imagePath = await this.generateImage(prompt, `social_${platform}_${content.slice(0, 10)}`);
        return {
            path: imagePath,
            prompt,
            model: 'dalle-3',
        };
    }
    /**
     * 构建 Logo prompt
     */
    buildLogoPrompt(params) {
        return `
      设计一个专业的品牌 Logo：
      - 品牌名：${params.brandName}
      - 行业：${params.industry}
      - 主色调：${params.primaryColor}
      - 风格：${params.style.join('、')}
      
      要求：
      - 简洁现代，易于识别
      - 可用于各种尺寸（从 favicon 到大型广告）
      - 矢量风格，边缘清晰
      - 白色背景
    `.trim();
    }
    /**
     * 构建封面图 prompt
     */
    buildCoverPrompt(params) {
        const sizeMap = {
            wechat: '900 x 383 像素（公众号封面）',
            xiaohongshu: '1242 x 1660 像素（小红书封面）',
            douyin: '1080 x 1920 像素（抖音封面）',
        };
        const size = sizeMap[params.platform || 'wechat'] || '1080 x 1080';
        return `
      设计一个吸引人的社交媒体封面图：
      - 主题：${params.topic}
      - 品牌：${params.brandName}
      - 尺寸：${size}
      - 主色调：${params.primaryColor}
      - 辅助色：${params.secondaryColor}
      
      要求：
      - 视觉冲击力强，能在 3 秒内吸引注意力
      - 文字清晰可读
      - 现代简约风格
      - 高质量，适合发布
    `.trim();
    }
    /**
     * 调用 DALL-E 生成图像
     */
    async generateImage(prompt, filename) {
        // 检查是否有 AI Provider
        if (!this.aiProvider) {
            console.warn('No AI provider configured for image generation');
            return '';
        }
        try {
            // 实际使用 DALL-E API
            // 这里需要调用 OpenAI 的图像生成 API
            // 由于没有实际调用，返回占位符
            await fs.ensureDir(this.outputPath);
            const filepath = path_1.default.join(this.outputPath, `${filename}.png`);
            // 占位符 - 实际会调用 DALL-E
            console.log(`Would generate image: ${prompt.slice(0, 100)}...`);
            return filepath;
        }
        catch (error) {
            console.error('Image generation failed:', error);
            throw error;
        }
    }
    /**
     * 使用 vveai 的图像生成能力
     */
    async generateWithAPI(prompt, filename) {
        // 如果配置了 vveai 的图像生成模型
        // 可以通过 AI Provider 调用
        console.log(`Image generation with vveai: ${prompt.slice(0, 100)}...`);
        return '';
    }
}
exports.ImageGenerator = ImageGenerator;
