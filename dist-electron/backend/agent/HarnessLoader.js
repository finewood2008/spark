"use strict";
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
exports.HarnessLoader = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class HarnessLoader {
    constructor() {
        // 假设在 src/backend/agent/ 下运行，项目根目录在 ../../../
        this.projectRoot = path.resolve(__dirname, '../../../');
    }
    async loadContextMap() {
        return this.readFile('harness/context-map.md');
    }
    async loadSelfCheck() {
        return this.readFile('harness/self-check.md');
    }
    async loadWorkflow(workflowName) {
        return this.readFile(`harness/workflows/${workflowName}.md`);
    }
    async loadStandard(standardName) {
        return this.readFile(`harness/standards/${standardName}.md`);
    }
    async readFile(relativePath) {
        const fullPath = path.join(this.projectRoot, relativePath);
        try {
            if (await fs.pathExists(fullPath)) {
                return await fs.readFile(fullPath, 'utf-8');
            }
            return '';
        }
        catch (e) {
            console.warn(`[HarnessLoader] Failed to read ${relativePath}`, e);
            return '';
        }
    }
    /**
     * 根据任务意图和内容，自动加载相关的 Harness 上下文
     */
    async getHarnessContext(intentType, platform) {
        let context = '';
        // 加载全局自检标准
        const selfCheck = await this.loadSelfCheck();
        if (selfCheck) {
            context += `\n\n【系统内置自检标准（必须遵守）】:\n${selfCheck}\n`;
        }
        if (intentType === 'create_content') {
            const copyStandard = await this.loadStandard('copywriting');
            if (copyStandard) {
                context += `\n【文案生成标准】:\n${copyStandard}\n`;
            }
            const visualStandard = await this.loadStandard('visual');
            if (visualStandard) {
                context += `\n【视觉参考标准】:\n${visualStandard}\n`;
            }
        }
        else if (intentType === 'manage_vi' || intentType === 'logo_design') {
            const logoWorkflow = await this.loadWorkflow('logo-design');
            if (logoWorkflow) {
                context += `\n【设计工作流指导】:\n${logoWorkflow}\n`;
            }
            const visualStandard = await this.loadStandard('visual');
            if (visualStandard) {
                context += `\n【视觉执行标准】:\n${visualStandard}\n`;
            }
        }
        return context;
    }
}
exports.HarnessLoader = HarnessLoader;
