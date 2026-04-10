# 上下文映射 (Context Map)

在执行不同类型的任务时，Spark 需要加载不同的上下文文件。请根据下表在处理任务前读取相应的文件。

## 基础映射表

| 任务类型 | 需要读取的核心文件 | 需要参考的目录 |
| --- | --- | --- |
| **基础沟通** | `SOUL.md`, `BRAND.md` | - |
| **文案生成** | `BRAND.md`, `harness/standards/copywriting.md` | `assets/texts/` (历史文案参考) |
| **Logo设计** | `BRAND.md`, `harness/workflows/logo-design.md` | `assets/visuals/` (现有视觉资产) |
| **海报设计** | `BRAND.md`, `harness/standards/visual.md` | `assets/visuals/` (品牌色/字体) |
| **视频生成** | `BRAND.md`, `harness/workflows/video-generation.md` | `assets/videos/` (历史视频片段) |
| **VI管理**   | `BRAND.md`, `harness/standards/visual.md` | `assets/visuals/vi/` |

## 文件说明

* **SOUL.md**: Spark 的系统提示词和核心行为准则（不可修改）。
* **BRAND.md**: 当前服务的品牌的核心定位、价值观和基调（动态更新）。
* **harness/workflows/**: 执行复杂任务（如设计 Logo、制作视频）的具体多步骤流程。
* **harness/standards/**: 交付物的质量标准，例如排版规范、品牌色规范。
* **harness/self-check.md**: 每次输出结果前必做的最终检查清单。
* **harness/errors/log.md**: 错误日志与复盘，用于 Spark 自我修正。

## 动态加载规则

1. 每次接到用户指令，首先判断意图。
2. 匹配上面的任务类型。
3. 按照映射表，读取对应的 `workflow` 或 `standard`。
4. 如果任务跨越多个领域（比如带海报的文案），需要同时加载两者的标准。