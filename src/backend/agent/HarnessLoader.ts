import * as fs from 'fs-extra';
import * as path from 'path';

export class HarnessLoader {
  private projectRoot: string;

  constructor() {
    // 假设在 src/backend/agent/ 下运行，项目根目录在 ../../../
    this.projectRoot = path.resolve(__dirname, '../../../');
  }

  async loadContextMap(): Promise<string> {
    return this.readFile('harness/context-map.md');
  }

  async loadSelfCheck(): Promise<string> {
    return this.readFile('harness/self-check.md');
  }

  async loadWorkflow(workflowName: string): Promise<string> {
    return this.readFile(`harness/workflows/${workflowName}.md`);
  }

  async loadStandard(standardName: string): Promise<string> {
    return this.readFile(`harness/standards/${standardName}.md`);
  }

  private async readFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.projectRoot, relativePath);
    try {
      if (await fs.pathExists(fullPath)) {
        return await fs.readFile(fullPath, 'utf-8');
      }
      return '';
    } catch (e) {
      console.warn(`[HarnessLoader] Failed to read ${relativePath}`, e);
      return '';
    }
  }

  /**
   * 根据任务意图和内容，自动加载相关的 Harness 上下文
   */
  async getHarnessContext(intentType: string, platform?: string): Promise<string> {
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
    } else if (intentType === 'manage_vi' || intentType === 'logo_design') {
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
