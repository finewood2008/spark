# 火花 Spark - 企业 AI 营销内容平台

> 让每一个中小企业，都能拥有专业、一致、有质感的品牌视觉形象。

## 功能特性

- **AI 内容创作**：输入主题，自动生成微信公众号、小红书、抖音等平台适配内容
- **企业知识库**：上传品牌资料、产品文档，AI 学习后生成更精准的内容
- **VI 自动生成**：输入品牌名和行业，自动生成配色方案和 Logo 概念
- **多平台发布**：一键发布到多个平台，支持定时发布
- **自我进化**：AI 学习你的偏好，越用越懂你

## 技术架构

```
├── src/
│   ├── backend/
│   │   ├── agent/          # AI Agent 核心
│   │   │   ├── SparkAgent.ts      # 大脑核心
│   │   │   ├── IntentParser.ts    # 意图解析
│   │   │   ├── RAGEngine.ts       # 知识库检索
│   │   │   ├── ContentGenerator.ts # 内容生成
│   │   │   ├── VIManager.ts       # VI 管理
│   │   │   ├── PublishingEngine.ts # 发布引擎
│   │   │   └── MemorySystem.ts    # 自我进化
│   │   └── tools/         # 工具链
│   │       ├── AIProvider.ts      # AI 提供商
│   │       ├── Embeddings.ts      # 向量化
│   │       ├── FileParser.ts      # 文件解析
│   │       └── ImageGenerator.ts  # 图像生成
│   └── frontend/           # Electron 桌面应用
│       ├── main.ts / preload.ts
│       └── renderer/       # React 前端
```

## 快速开始

### 1. 安装依赖

```bash
cd ~/Desktop/spark-project
npm install
```

### 2. 配置 API Key

在 `.env` 文件中配置：

```
VVEAI_API_KEY=your_api_key_here
```

### 3. 运行开发模式

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
```

## 支持的平台

| 平台 | 状态 | 说明 |
|------|------|------|
| 微信公众号 | ✅ | 文章发布 |
| 小红书 | ✅ | 图文笔记 |
| 抖音 | ✅ | 短视频脚本 |
| 微博 | ✅ | 动态发布 |
| 知乎 | ✅ | 文章回答 |
| B站 | ✅ | 视频稿件 |

## 品牌色

- **主色**：#FF6B35（火焰橙）
- **辅助色**：#1E3A5F（深海蓝）
- **点缀色**：#FFB347（日出金）

## 技术栈

- **前端**：React 18 + TypeScript + Vite
- **桌面**：Electron 28
- **AI**：Claude / GPT / Gemini via vveai API
- **知识库**：ChromaDB 向量数据库
- **样式**：Tailwind CSS

## License

MIT
