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
     * 调用图像生成 API
     * 直连 Gemini Proxy（SDK 未覆盖图片生成时的 fallback）
     */
    async generateImage(prompt, filename) {
        try {
            await fs.ensureDir(this.outputPath);
            const filepath = path_1.default.join(this.outputPath, `${filename}.png`);
            // 优先使用 QeeClaw SDK
            try {
                const { QeeClawBridge } = require('../qeeclaw/qeeclaw-client');
                const bridge = QeeClawBridge.get();
                if (bridge.online && bridge.sdk.models.invoke) {
                    const result = await bridge.sdk.models.invoke({
                        prompt: prompt,
                        route: "image-gen", // mock image generation route
                        stream: false
                    });
                    // If the SDK returns a valid response, assume it's the image URL or base64 (adapt based on actual SDK response structure for images)
                    // Note: The actual SDK might have a separate models.generateImage, but assuming invoke handles multimodal for now based on context
                    // For now, let's fall back to our existing CF proxy logic if SDK route for images isn't fully set up yet
                    // but we wrap the proxy call to use the environment fallback key.
                }
            }
            catch (e) {
                // ignore SDK error for image generation, fall through to proxy
            }
            // fallback to proxy
            const response = await fetch(`https://gemini-proxy.finewood2008.workers.dev/v1/images/generations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.FALLBACK_API_KEY || 'dummy'}`
                },
                body: JSON.stringify({
                    prompt,
                    model: 'dall-e-3', // explicitly specifying for CF proxy format compatibility
                    n: 1,
                    size: '1024x1024',
                }),
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Image generation API error ${response.status}: ${errText}`);
            }
            const json = await response.json();
            const imageData = json.data?.[0];
            if (!imageData) {
                throw new Error('No image data returned from API');
            }
            if (imageData.b64_json) {
                // API returned base64 — write directly to file
                const buffer = Buffer.from(imageData.b64_json, 'base64');
                await fs.writeFile(filepath, buffer);
            }
            else if (imageData.url) {
                // API returned a URL — download the image
                const imgResponse = await fetch(imageData.url);
                if (!imgResponse.ok)
                    throw new Error(`Failed to download image from ${imageData.url}`);
                const arrayBuf = await imgResponse.arrayBuffer();
                await fs.writeFile(filepath, Buffer.from(arrayBuf));
            }
            else {
                throw new Error('API returned neither b64_json nor url');
            }
            console.log(`[ImageGenerator] Generated image: ${filepath}`);
            return filepath;
        }
        catch (error) {
            console.error('[ImageGenerator] Image generation failed:', error);
            throw error;
        }
    }
    /**
     * 使用 Gemini Proxy 的图像生成能力（公共 API 方法）
     * 直连 Gemini Proxy（SDK 未覆盖图片生成时的 fallback）
     */
    async generateWithAPI(prompt, filename) {
        return this.generateImage(prompt, filename);
    }
}
exports.ImageGenerator = ImageGenerator;
