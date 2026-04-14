# Campus Planner

移动端优先的校园课表 / DDL 工具，强调录入快、查看快、改动成本低。

当前定位：
- 课表以学期、节次、重复规则为核心
- DDL 不进入课表网格，单独按时间分组管理
- 当前导入导出仅支持 JSON
- Excel 半自动导入是后续重点功能

## 项目简介

这是一个基于 Web/PWA 的校园日程工具，面向“课程 + DDL + 常见异常调课”这类高频场景。项目优先保证移动端单手可用、信息密度合理、实现简单可维护。

## 技术栈

- Vite
- React
- TypeScript
- Tailwind CSS
- Dexie.js
- dayjs
- lucide-react

## 当前已实现功能

- 移动端优先的基础 app shell
- 三个主页面：`Timetable`、`Deadlines`、`Settings`
- Dexie 本地数据库 schema
- 学期、作息、节次、事件、重复规则、异常事件、DDL、显示设置的数据模型
- 首次启动自动插入一份演示数据
- 周课表计算：
  - 根据 `weekOneStartDate` 推导当前教学周
  - 根据 `RecurringEventRule` 生成当前周课表
  - 支持 `all / odd / even / custom`
- 异常事件支持：
  - 停课 `cancel`
  - 换教室 `relocate`
  - 调课 `reschedule`
  - 补课 `extra`
- 课程活动创建
- DDL 创建
- DDL 完成状态切换并写回数据库
- 课程活动删除
- DDL 删除
- 设置页可用：
  - 查看 / 新增 / 切换当前学期
  - 查看当前作息方案
  - 查看、新增、编辑 `TimeSlot`
  - 保存基础显示设置
- JSON 级别导入导出：
  - 导出全部本地数据
  - 导入并覆盖本地数据

## 当前未实现功能

- 普通活动与课程活动的统一录入体验
- 课程活动编辑
- DDL 编辑
- 异常事件编辑 / 撤销
- 多事件同格显示优化
- 主题、背景图等视觉设置
- 通知提醒落地
- PWA 安装、离线体验细化
- CSV 导入
- Excel 半自动导入

## 本地运行方式

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 数据模型概览

核心实体：

- `Semester`
  - 学期范围、第一周开始时间、总周数、当前作息方案
- `ScheduleProfile`
  - 学期对应的作息方案
- `TimeSlot`
  - 节次标签、开始时间、结束时间、顺序
- `Event`
  - 课程、考试、会议、活动等统一活动实体
- `RecurringEventRule`
  - 课程重复规则，决定周几、哪一节、哪些周生效
- `EventException`
  - 单次停课、调课、补课、换教室
- `DeadlineItem`
  - DDL，不进入课表网格
- `DisplaySettings`
  - 课表显示项和默认首页设置

当前课表渲染链路：

1. 读取当前学期、节次、事件、重复规则、异常事件
2. 根据 `weekOneStartDate` 和当前日期计算教学周
3. 展开当前周课表
4. 应用 `EventException` 覆盖原始结果

## 目录说明

```text
src/
  components/
    common/        通用 UI
    deadline/      DDL 列表与详情组件
    forms/         EventForm / DeadlineForm
    timetable/     课表网格、详情、头部组件
  db/
    repositories/  基础 CRUD
    schema.ts      Dexie schema
    demoData.ts    首次演示数据
  features/
    timetable/
    deadline/
    settings/
  lib/
    importExport/  JSON 导入导出
    recurrence/    重复规则判断
    timetable/     周课表与 exception 计算
  types/           核心类型定义
```

## JSON 备份格式

当前 JSON 导出格式为：

```json
{
  "version": 1,
  "exportedAt": "2026-04-08T12:34:56.000Z",
  "data": {
    "semesters": [],
    "scheduleProfiles": [],
    "timeSlots": [],
    "events": [],
    "recurringEventRules": [],
    "eventExceptions": [],
    "deadlines": [],
    "displaySettings": []
  }
}
```

## 下一步开发建议

1. 完成课程活动编辑与 DDL 编辑，补齐真正的 CRUD。
2. 把异常事件从 `prompt` 交互升级为轻量表单。
3. 让 `Settings` 中的学期切换和节次修改更实时地影响课表页。
4. 增加提醒配置，把 `DeadlineItem` 和 `ReminderConfig` 真正串起来。
5. 在 `src/lib/importExport` 下继续扩展 CSV / Excel 半自动导入。

