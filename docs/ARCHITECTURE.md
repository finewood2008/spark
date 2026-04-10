# ARCHITECTURE.md - 火花技术架构文档

---

## 一、系统架构概览

```
┌──────────────────────────────────────────────────────────────────┐
│                        客户端层 (Client)                          │
│                     Electron Desktop App                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ 知识库UI  │ │ 内容工作台│ │ 品牌管理UI│ │   发布管理UI      │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │
└─────────────────────────────┬────────────────────────────────────┘
                              │ IPC (Electron IPC)
┌─────────────────────────────▼────────────────────────────────────┐
│                       服务层 (Services)                           │
│                     Node.js Backend Service                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Hermes Agent Core                      │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐            │    │
│  │  │  Intent   │ │   RAG     │ │  Content  │            │    │
│  │  │  Parser   │ │  Engine   │ │  Generator│            │    │
│  │  └───────────┘ └───────────┘ └───────────┘            │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐            │    │
│  │  │    VI     │ │ Publishing│ │  Memory   │            │    │
│  │  │  Manager  │ │  Engine   │ │  System   │            │    │
│  │  └───────────┘ └───────────┘ └───────────┘            │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     Tools Chain                          │    │
│  │  AI Provider │ Image Gen │ File Parser │ Platform APIs │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│                        存储层 (Storage)                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │  ChromaDB   │ │   SQLite    │ │    Local File System    │   │
│  │ (Vectors)   │ │   (Data)    │ │    (Assets/Configs)     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 二、核心模块设计

### 2.1 Hermes Agent 核心

```
SparkAgent
├── IntentParser        // 意图识别
│   └── 解析用户输入 → 结构化指令
├── RAGEngine          // 知识检索
│   ├── VectorSearch   // 语义搜索
│   ├── BM25Search     // 关键词搜索
│   └── HybridSearch   // 混合搜索
├── ContentGenerator   // 内容生成
│   ├── PlatformAdapter // 平台适配器
│   ├── StyleInjector  // 风格注入
│   └── VIApplicator   // VI应用
├── VIManager          // VI管理
│   ├── VIDetector     // VI检测
│   ├── VIGenerator    // VI生成
│   └── AssetManager   // 资产管理
├── PublishingEngine   // 发布引擎
│   ├── PlatformRouter // 平台路由
│   ├── Scheduler      // 定时调度
│   └── StatusTracker  // 状态追踪
└── MemorySystem       // 记忆系统
    ├── PreferenceStore // 偏好存储
    ├── BrandMemory    // 品牌记忆
    └── InteractionLog // 交互日志
```

### 2.2 目录结构

```
spark-project/
├── assets/
│   └── logo/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DESIGN.md
├── src/
│   ├── backend/
│   │   ├── index.ts                 # 后端入口
│   │   ├── agent/
│   │   │   ├── SparkAgent.ts        # Agent 主类
│   │   │   ├── IntentParser.ts      # 意图解析
│   │   │   ├── RAGEngine.ts         # RAG 引擎
│   │   │   ├── ContentGenerator.ts  # 内容生成
│   │   │   ├── VIManager.ts         # VI 管理
│   │   │   ├── PublishingEngine.ts  # 发布引擎
│   │   │   └── MemorySystem.ts      # 记忆系统
│   │   ├── tools/
│   │   │   ├── AIProvider.ts       # AI 提供商
│   │   │   ├── ImageGenerator.ts    # 图像生成
│   │   │   └── FileParser.ts        # 文件解析
│   │   ├── storage/
│   │   │   ├── VectorStore.ts       # ChromaDB
│   │   │   └── DataStore.ts         # SQLite
│   │   └── platforms/
│   │       ├── WeChat.ts            # 微信公众号
│   │       ├── XiaoHongShu.ts       # 小红书
│   │       ├── Douyin.ts            # 抖音
│   │       └── ...
│   ├── frontend/
│   │   ├── main.ts                  # Electron 主进程
│   │   ├── preload.ts               # 预加载脚本
│   │   ├── renderer/
│   │   │   ├── App.tsx             # React 根组件
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx   # 工作台
│   │   │   │   ├── KnowledgeBase.tsx
│   │   │   │   ├── Brand.tsx
│   │   │   │   ├── Publish.tsx
│   │   │   │   └── Settings.tsx
│   │   │   └── components/
│   │   │       ├── AIChat.tsx
│   │   │       ├── ContentPreview.tsx
│   │   │       └── ...
│   │   └── index.html
│   └── shared/
│       └── types.ts                 # 共享类型定义
└── tests/
```

---

## 三、数据模型

### 3.1 企业知识库 (KnowledgeBase)

```typescript
interface KnowledgeBase {
  id: string;
  brandId: string;
  updatedAt: Date;
  
  // 企业信息
  company: {
    name: string;
    industry: string;
    size: string;
    location: string;
    mission: string;
    vision: string;
    values: string[];
    advantages: string[];
  };
  
  // 产品信息
  products: Product[];
  
  // 品牌资产
  brand: {
    name: string;
    tagline: string;
    logoPath: string;
    colors: ColorPalette;
    fonts: FontSpec;
    style: string[];
  };
  
  // 运营数据
  performance: {
    topContent: ContentRef[];
    metrics: Metrics;
  };
}
```

### 3.2 品牌 VI (BrandVI)

```typescript
interface BrandVI {
  id: string;
  name: string;
  
  colors: {
    primary: string;      // #FF6B35
    secondary: string;    // #1E3A5F
    accent: string;       // #FFB347
    neutral: string;       // #2D2D2D
    background: string;    // #F5F5F5
  };
  
  fonts: {
    primary: string;       // Noto Sans SC
    secondary: string;     // Inter
  };
  
  logo: {
    path: string;
    variants: LogoVariant[];
  };
  
  styles: string[];        // ['专业', '活力', '科技']
}
```

### 3.3 内容 (Content)

```typescript
interface Content {
  id: string;
  brandId: string;
  platform: Platform;
  type: ContentType;
  
  title: string;
  body: string;
  media: MediaAsset[];
  
  viApplied: boolean;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  
  scheduledAt?: Date;
  publishedAt?: Date;
  
  metrics?: {
    views: number;
    likes: number;
    comments: number;
  };
}
```

### 3.4 用户偏好 (UserPreference)

```typescript
interface UserPreference {
  brandId: string;
  
  // 内容风格偏好
  contentStyle: {
    tone: 'formal' | 'casual' | 'humorous';
    length: 'short' | 'medium' | 'long';
    emojiUsage: 'none' | 'moderate' | 'heavy';
    hasktagStyle: string[];
  };
  
  // 常用平台
  platforms: Platform[];
  
  // 发布习惯
  publishing: {
    preferredTimes: string[];
    autoPublish: boolean;
  };
  
  // 反馈历史
  feedbackHistory: {
    contentId: string;
    action: 'accept' | 'edit' | 'reject';
    edits?: string;
    timestamp: Date;
  }[];
}
```

---

## 四、API 设计

### 4.1 内部 API (Frontend ↔ Backend)

基于 Electron IPC，暴露以下通道：

```typescript
// 知识库相关
'kb:create': (brandId: string) => Promise<KnowledgeBase>;
'kb:update': (brandId: string, data: Partial<KnowledgeBase>) => Promise<void>;
'kb:query': (brandId: string, query: string) => Promise<SearchResult[]>;

// 内容生成
'content:generate': (params: GenerateParams) => Promise<Content[]>;
'content:publish': (contentId: string, platforms: Platform[]) => Promise<PublishResult>;
'content:schedule': (contentId: string, schedule: Date) => Promise<void>;

// VI 相关
'vi:detect': (files: File[]) => Promise<VIDetectionResult>;
'vi:generate': (params: VIGenerateParams) => Promise<BrandVI>;
'vi:apply': (contentId: string, vi: BrandVI) => Promise<void>;

// 偏好相关
'preference:get': (brandId: string) => Promise<UserPreference>;
'preference:update': (brandId: string, pref: Partial<UserPreference>) => Promise<void>;
```

---

## 五、技术选型

### 5.1 前端

| 技术 | 用途 | 理由 |
|------|------|------|
| Electron | 桌面框架 | 本地优先、数据私密 |
| React 18 | UI 框架 | 生态成熟 |
| TypeScript | 语言 | 类型安全 |
| Tailwind CSS | 样式 | 快速开发 |
| Zustand | 状态管理 | 轻量 |
| Radix UI | 组件库 | 无样式、可访问 |

### 5.2 后端

| 技术 | 用途 | 理由 |
|------|------|------|
| Node.js 20 | 运行时 | 生态丰富 |
| TypeScript | 语言 | 类型安全 |
| ChromaDB | 向量数据库 | 本地、轻量 |
| better-sqlite3 | 关系数据 | 本地存储 |
| LangGraph | Agent 框架 | 状态机设计 |

### 5.3 AI 工具链

| 工具 | 用途 | 备注 |
|------|------|------|
| vveai API | 主 AI | Claude/GPT/Gemini |
| DALL-E 3 | 图像生成 | 封面图 |
| Whisper | 语音转写 | 音频处理 |
| FFmpeg | 媒体处理 | 视频处理 |

---

## 六、安全考虑

### 6.1 数据安全
- 所有数据本地存储，不上传第三方
- 平台 API Token 加密存储
- 支持离线使用

### 6.2 隐私
- 不收集用户数据
- 不追踪用户行为（仅记录在本地）
- 可完全删除所有数据

### 6.3 平台合规
- 仅使用官方 API
- 遵守各平台使用条款

---

*文档版本：v1.0*
*最后更新：2026-04-09*
