# 灵动岛日历面板设计

## 概述

在灵动岛（Dynamic Island）中新增第 4 个面板——日历面板。待办事项可以关联到日历的某一天的某一时间（或全天），到达时间段后灵动岛自动展开为 quick 模式展示该任务并提供快捷完成按钮。

## 数据模型

### 任务结构扩展

当前任务结构（`island-app.js`）：
```js
{ id, text, done, due_time, source, notified, created_at }
```

扩展后：
```js
{
  id: string,
  text: string,
  done: boolean,
  due_time: string | null,   // ISO 格式，开始提醒时间
  end_time: string | null,   // ISO 格式，过期时间，默认 = due_time + 1h
  all_day: boolean,          // 是否全天事件
  source: string,            // 'user' | 'ai'
  notified: boolean,
  created_at: number
}
```

存储位置：`localStorage` key `island_tasks`，Tasks 面板和 Calendar 面板共享同一数据源。

## 面板架构

灵动岛从 3 面板扩展为 4 面板：
- Panel 0：天气/时间
- Panel 1：音乐
- Panel 2：任务列表
- Panel 3：**日历**（新增）

面板切换逻辑（swipe、wheel、dot indicator）需要更新以支持 4 个面板。

## 日历面板 UI（Panel 3）

### 布局（日程列表 + 迷你月历头）

```
┌─────────────────────────────────┐
│  ◀  7月7日 - 7月13日  ▶    📅   │  ← 周选择器 + 月历按钮
│  一  二  三  四  五  六  日      │  ← 星期标头
│  7   8  [9] 10  11  12  13     │  ← 日期行，当天高亮
├─────────────────────────────────┤
│  📋 7月9日 周三                  │  ← 当日标题
│                                 │
│  ⬜ 全天 · 完成项目报告     ✓ ✕  │  ← 全天任务
│  ⬜ 14:30 · 团队站会         ✓ ✕ │  ← 定时任务
│  ⬜ 16:00 · 提交代码         ✓ ✕ │
│                                 │
├─────────────────────────────────┤
│  + 新增日程...                   │  ← 添加区域
│     ⏰ 选择时间  [全天] [添加]    │
└─────────────────────────────────┘
```

### 交互细节

1. **周选择器**：`◀ ▶` 箭头切换周，显示当前周范围（如 "7月7日 - 7月13日"）
2. **日期行**：展示当前周 7 天，有任务的日期下方显示小绿点。点击切换选中日期，当天蓝色高亮
3. **月历浮层**：点击右上 📅 弹出迷你月历（整月网格），可点击跳转到任意日期
4. **当日任务列表**：滚动区域，每行 = 勾选框 + 时间/全天标签 + 任务文字 + ✓完成 + ✕删除
5. **添加区域**：输入框 + 时间选择器（点击弹出简易组件，可选具体时间或全天）+ 添加按钮

### 月历浮层（Mini Month Picker）

点击 📅 时弹出：
- 当前月或选中日期所在月的完整日历网格
- 有任务的日期打小绿点
- 点击任意日期关闭浮层并跳转到该日
- 左右箭头切换月份

## Quick 模式提醒

### 触发条件

`checkTaskReminders()` 每 30 秒轮询。当 `due_time <= now < end_time` 且 `task.done === false` 时触发。

### 行为

- 灵动岛自动从 `still` → `still` 维持，但切换到提醒显示
- 岛宽自动调整为 **310px**（quick 模式宽度）
- 显示：⏰ 图标 + 任务文字 + **[完成]** 快捷按钮
- **持续显示**，不自动消失
- 按下 [完成] → `task.done = true`，提醒消失，岛退回 normal still 模式

```
┌──────────────────────────────────────┐
│  ⏰  提交代码                [完成]   │
└──────────────────────────────────────┘
```

### 过期处理

- 默认 `end_time = due_time + 1 小时`
- 当 `now >= end_time`：提醒自动消失，`notified` 重置，岛退回 normal
- 用户可在日历面板手动设置 `end_time`

### 多任务并发

如果有多个任务同时到期，显示最早到期的那个。处理完后自动显示下一个。如果当前提醒被 dismiss（点击任务文字区域外），则展开 large 模式到日历面板查看所有到期任务。

## MCP 工具变更

### 修改现有工具

`island_task_create` 参数扩展：
- `text` (required)
- `due_time` (optional, ISO)
- `end_time` (optional, ISO，默认 due_time + 1h)
- `all_day` (optional, boolean)

### 新增工具

| 工具名 | 参数 | 描述 |
|--------|------|------|
| `island_calendar_list` | `date` (optional, ISO date) | 列出指定日期的所有任务 |
| `island_calendar_month` | `year`, `month` | 返回指定月每天的任务数，用于打点 |

## 涉及文件

| 文件 | 变更内容 |
|------|---------|
| `static/island.html` | 新增 Panel 3 HTML 模板，点指示器加第 4 个点，quick 模式加持久提醒态 |
| `static/island-app.js` | 扩展数据模型（end_time, all_day），新增日历相关计算属性/方法，更新 swipe/panel 逻辑，更新 checkTaskReminders，新增 MCP 工具注册 |
| `static/css/island.css` | 新增日历面板样式、月历浮层样式、quick 模式持久提醒样式 |

## 不涉及

- 不修改 `main.js`（Electron 窗口创建逻辑不变）
- 不修改 `py/dynamic_island.py`（后端工具注册逻辑不变，前端自行处理）
- 不修改 `server.py`
- 不修改 Tasks 面板 UI（保持现状，仅共享数据）
