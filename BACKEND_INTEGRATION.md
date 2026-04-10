# Spark 前后端对接文档 (API / IPC 接口规范)

本文档旨在说明 Spark (火花) 前端 UI 壳与未来后端（或真实 Agent）对接的标准接口。

前端采用的是 **Agent-UI 双栏架构 (Chat-First)**，所有的交互由左侧的 Chat 组件发起，然后由右侧的 Workspace 面板来渲染丰富的媒体与组件内容。

---

## 1. 核心设计理念：UI 驱动与消息编排

前端不需要知道大模型是什么、API Key 在哪、Harness 如何加载。前端**只负责展现**，并将用户的自然语言指令通过 IPC 通道交给后端。

后端（你的自有服务 / Hermes 引擎）负责解析意图、调用模型、执行工具，并将结构化的 JSON 返回给前端渲染。

## 2. IPC 通道接口列表

所有的对接都在 `src/electron/preload.ts` 中暴露，并在 `src/electron/main.ts` 或 `agent-ipc.ts` 中实现。
前端通过全局对象 `window.spark.*` 来调用。

### 2.1 核心对话接口 `window.spark.agent.chat`

这是最重要的通道。用户在左侧输入任何内容，都会通过此接口发送。

**前端调用：**
```typescript
const response = await window.spark.agent.chat("帮我写一篇关于咖啡的推文");
```

**后端期望返回的格式 (Response Interface)：**

后端不仅可以返回纯文本，还可以返回结构化的卡片数据，让前端在右侧渲染出对应的工作台工具。

```typescript
// 统一返回结构
interface AgentResponse {
  success: boolean;       // 请求是否成功处理
  type: 'text' | 'content' | 'error'; // 决定前端如何渲染
  message: string;        // Agent 在左侧对话框里回答的口水话文本
  data?: any;             // 如果 type 是 content，这里放入供右侧渲染的数据对象
}
```

**示例 A：纯文本聊天**
```json
{
  "success": true,
  "type": "text",
  "message": "好的！我已经记下了您说的这个品牌色。以后做海报我会优先使用红色。"
}
```

**示例 B：生成结构化内容卡片（文案/物料）**
```json
{
  "success": true,
  "type": "content",
  "message": "我已经为您准备好了第一版文案草稿。您可以在右侧工作台查看详情。",
  "data": {
    "title": "一杯唤醒灵感的好咖啡 ☕️",
    "body": "早上好！打工人的续命神器来啦~ 今天尝试了新豆子，入口微酸但回甘无穷...\n大家平时喜欢喝什么口味的咖啡？评论区见👇",
    "hashtags": ["#每日咖啡", "#好物分享", "#打工人日常"],
    "platform": "xiaohongshu",
    "id": "draft_1001"
  }
}
```
*注：当返回 `type: "content"` 时，前端左侧会渲染一个精简卡片，右侧面板会自动弹出并渲染 `data` 中的完整内容。*

---

### 2.2 用户反馈接口 `window.spark.agent.feedback`

当用户在右侧预览卡片时，如果不满意或者点击了某些操作，将触发此接口，后端可以将其记录为“负样本”存入记忆，完成进化。

**前端调用：**
```typescript
await window.spark.agent.feedback("draft_1001", "reject", "语气太活泼了，我们品牌是很严肃的科技公司。");
```

---

### 2.3 品牌规范与记忆库持久化接口

用于右侧【品牌视觉】和【记忆库】的配置保存与读取。

- `window.spark.brand.load(brandId)`: 返回当前品牌的 VI 数据字典（如主色调，字体列表）。
- `window.spark.brand.save(brandId, configData)`: 前端编辑后，保存品牌 VI 数据。
- `window.spark.kb.load(brandId)`: 返回目前知识库（RAG 索引文档）列表。
- `window.spark.kb.save(brandId, kbData)`: 新增知识文档。

---

## 3. 下一步后端实现建议

因为你们计划使用自己的方式来实现后端（可能是一个独立的 Go/Python 服务器，或者自定义的 Hermes 封装器），建议在 `src/electron/main.ts` 中：

1. 删除或覆盖 `setupRealAgentIPC()` 里的 OpenAI / 模拟代码。
2. 将 `ipcMain.handle('agent:chat', ...)` 内部改为发起一个 HTTP 请求到你的本地服务（例如 `http://localhost:8080/v1/chat`）。
3. 让你的服务遵循第 2 节的 JSON 响应格式即可，前端“壳”的渲染即可完美跑通。