# 和泰智造数屏系统 STATUS

## 1. 当前阶段

当前处于 M3 进行阶段，本轮完成了 M3 的第二个最小可交付目标：左右屏前端页面已接入标准展示 API，不再是占位页；前端在已有数据基础上遇到接口失败时也会继续保留当前画面，避免自行清空页面。

当前已具备的能力：

- 管理员登录
- 设备台账管理
- 员工台账管理
- 产线台账管理
- 区域台账管理
- 编码映射管理
- 左右屏配置管理
- 数据源配置管理
- 基础操作日志
- 最小后台前端界面
- 设备状态快照缓存
- 产量统计快照缓存
- 排产甘特图快照缓存
- 能耗快照缓存
- 数据源健康状态快照
- mock 数据装载命令
- 左右屏展示 API
- 数据源失败时返回最近一次成功快照
- 左右屏前端展示页
- 前端保留最近一次成功展示内容

本阶段要求：

- 本轮仍停留在 M3，只补左右屏前端展示，不提前进入 M4/M5。
- 已完成标准缓存快照、mock 展示 API、异常兜底和左右屏真实展示页，但尚未进入真实数据源接入。
- 不接真实外部系统。
- 不实现报修、3D 仿真或内部 Web 报表。
- 前端仍不得直连外部系统。
- 真实数据接入、后台健康页面前端化与大屏页面展示仍留在后续里程碑。

## 2. 已知信息

### 2.1 产品范围

- 一期前段为外部客户参观大屏。
- 一期前段核心验收为设备、产量、排产、能耗稳定展示。
- 报修系统接入放到一期后段。
- 3D 仿真放到一期后段低优先级，优先级低于报修。
- 内部 Web 报表作为二期项目。

### 2.2 页面与流程

- 左右双屏分别使用独立 URL。
- 左右屏需要分别配置内容和轮播策略。
- 默认轮播时间为 60 秒，可后台配置。
- 报修未接入前显示占位。
- 3D 仿真未实施前显示预留区或占位。

### 2.3 数据接入

一期前段必须真实接入：

- 设备数据。
- 产量数据。
- 排产数据。
- 能耗数据。

接入方式：

- 后端定时拉取并缓存。
- 前端不直接访问外部系统。
- 默认刷新频率 5 分钟，可后台配置。
- 当前点表和外部数据库结构正在整理，暂时无法提供。
- 允许先做标准数据模型、mock 数据与适配器接口。

### 2.4 编码策略

- 本系统自建主数据编码。
- 外部系统编码映射到本系统主编码。

### 2.5 延期预测

- 不考虑班次、非工作时间、计划停机、换型时间。
- 仅支持后台配置单日有效工作时间。

### 2.6 权限

- 后台需要登录。
- 一期不做复杂角色拆分。
- 默认管理员拥有全部配置能力。

### 2.7 异常策略

- 大屏显示最近一次成功数据。
- 大屏不提示数据过期。
- 后台提示数据源健康状态和数据过期状态。

### 2.8 部署

- Ubuntu。
- Docker。
- MySQL 独立部署。
- 服务拆分为 backend、frontend/nginx、collector。

### 2.9 数据保留

- 数据库历史数据要求永久保留。

## 3. 未确认事项

- 一个订单是否绝对不会同时分配到多条产线。
- OPCUA / Modbus 点表。
- SAP RFC 字段和连接方式。
- 排产系统数据库表结构。
- 能耗数据库表结构。
- 报修系统最终接入方式。
- WMS 是否进入一期真实接入。
- 后台连接信息加密方案。
- 拼接屏实际分辨率和浏览器运行环境。

## 4. 当前优先级

P0：

- 一期前段范围固化。
- 标准数据模型。
- API 契约。
- 后端缓存层。
- 左右屏独立 URL。
- 后台基础配置。
- 数据源健康状态。
- 设备、产量、排产、能耗真实接入。

P1：

- 报修系统接入。
- 报修统计展示。
- 报修占位区替换为真实数据。

P2：

- 3D 仿真。
- 3D 模型管理。
- 实时状态联动预留。

P3：

- 内部 Web 报表二期。

## 5. 下一步行动

1. 下一轮继续留在 M3，补齐后台可读的数据源健康状态入口，必要时再接到现有最小后台控制台。
2. 在不接真实外部系统的前提下，把左右屏页面从占位页升级为基于 `/api/screens/left` 与 `/api/screens/right` 的真实展示页。
3. 保持现有 M2 后台界面与 M3 展示 API 稳定，不做无必要重构。
4. 进入 M5 前不要让前端依赖任何外部系统原始结构，只依赖标准缓存接口。

## 6. 本轮更新记录

- 已新增 `docs/IMPLEMENTATION_PLAN.md`，作为一期前段开发实施 WBS 文档。
- WBS 明确一期前段范围不包含内部 Web 报表。
- WBS 明确报修和 3D 仿真列为后续阶段，不作为一期前段阻塞任务。
- WBS 明确当前可先做任务、必须等待外部系统资料的任务、适合前后端并行的任务。
- WBS 明确甘特图、延期预测、数据源映射为高风险任务。

## 7. 本轮更新记录

- 已新增 `docs/API_CONTRACT.md`，作为一期前段 API 契约草案。
- 已新增 `docs/DB_MODEL_DRAFT.md`，作为一期前段数据模型草案。
- 两份草案均明确前端不得依赖外部系统原始结构，大屏接口应面向标准缓存模型。
- 两份草案均列出了当前可先 mock 的字段、必须等待真实外部系统资料确认的字段，以及需要补充确认的问题。

## 8. 本轮更新记录

- 已完成 M1 工程骨架与基础部署的最小实现。
- backend：新增 Django + DRF 工程骨架，并配置 MySQL 连接参数来自环境变量。
- backend：新增 `/api/health` 健康检查接口，接口会尝试检查数据库连接状态。
- frontend：新增 React 工程骨架，并提供 `/screen/left`、`/screen/right`、`/admin/login` 占位路由。
- collector：新增独立服务目录和占位心跳服务，不连接任何外部系统。
- deploy：新增 `docker-compose.yml`、backend/frontend/collector Dockerfile、`.env.example`。
- README：新增启动说明与基础验证命令。
- 验证结果：Python 语法编译通过，`docker compose config` 通过，`frontend/package.json` JSON 校验通过。
- 验证限制：当前 Docker Desktop/Linux engine 未运行，无法完成容器启动和 `/api/health` 实际访问验证；`npm install` 多次超时，未生成 `node_modules` 或 `package-lock.json`。

## 9. 本轮更新记录

- 已完成 M2 的最小可交付目标：管理员登录能力。
- backend：新增 `accounts` 应用，并提供 `/api/admin/auth/login` 与 `/api/admin/auth/me` 两个接口。
- backend：登录接口仅允许 `is_staff` 管理员账号通过，返回带签名的管理员令牌，不写死任何外部系统连接信息。
- backend：新增基于 SQLite 的 `hota_mds.test_settings`，仅用于本轮自动化测试与本地验证，不改变正式 MySQL 架构约束。
- backend：新增 4 条认证相关测试，覆盖管理员登录成功、非管理员拒绝、未带令牌访问拒绝、获取当前管理员信息。
- frontend：`/admin/login` 从占位页升级为可提交账号密码、保存会话令牌并回读当前管理员信息的最小登录页面。
- frontend：新增 `vite.config.js`，开发环境下将 `/api` 代理到本地 backend，便于前后端联调。
- 验证结果：`python -m compileall backend` 通过；`python manage.py test accounts --settings=hota_mds.test_settings` 4/4 通过；`npm install` 成功并生成 `package-lock.json`；`npm run build` 通过。
- 运行验证：已使用 `hota_mds.test_settings` 完成 `migrate`、创建本地管理员账号，并验证 `POST /api/admin/auth/login` 与 `GET /api/admin/auth/me` 均返回 200。

## 10. 本轮更新记录

- 本轮继续停留在 M2，不进入大屏展示、不接真实数据源。
- backend：新增 `backoffice` 应用，提供区域、产线、设备、编码映射、左右屏配置、数据源配置、操作日志等后台基础模型。
- backend：新增 `/api/admin/areas`、`/api/admin/production-lines`、`/api/admin/devices`、`/api/admin/code-mappings`、`/api/admin/screen-configs`、`/api/admin/data-source-configs`、`/api/admin/operation-logs`。
- backend：所有后台管理接口统一使用管理员 Bearer Token 鉴权，仅允许管理员访问。
- backend：统一后台接口响应包裹格式，并新增异常处理器，保证常见错误返回结构一致。
- backend：数据源配置支持 `env_ref` 与 `encrypted` 两种敏感信息保护结构，不要求把敏感连接信息写死在代码中，也不在接口响应与日志中回显敏感值。
- backend：基础操作日志已记录管理员登录、创建、更新、删除动作，包含目标对象、请求路径、请求方法和变更摘要。
- backend：已新增 `backoffice` 迁移文件 `0001_initial.py`。
- 验证结果：`python manage.py makemigrations backoffice --settings=hota_mds.test_settings` 通过；`python manage.py test accounts backoffice --settings=hota_mds.test_settings` 9/9 通过。
- 冒烟验证：使用 `hota_mds.test_settings` 迁移后，实测管理员登录成功、区域创建成功、操作日志列表可读，结果为 `loginStatus=200`、`areaStatus=201`、`logTotal=2`。

## 11. 本轮更新记录

- 本轮继续停留在 M2，补齐后台参数配置能力，不进入大屏展示、不接真实数据源。
- backend：新增 `DisplayContentConfig`，用于维护公司名称、欢迎语、Logo、宣传图片等欢迎展示内容配置。
- backend：新增 `RuntimeParameterConfig`，用于维护单日有效工作时间、标准产能、延期预警缓冲、甘特窗口天数、自动滚动阈值、产量窗口等运行参数。
- backend：新增 `/api/admin/display-content-configs` 与 `/api/admin/runtime-parameter-configs`。
- backend：`ScreenConfigSerializer` 新增对 `pageKeys`、`moduleSettings`、`themeSettings` 的结构校验，减少后续配置脏数据。
- backend：新增迁移文件 `backoffice/migrations/0002_displaycontentconfig_runtimeparameterconfig.py`。
- backend：自动化测试新增展示内容配置和运行参数配置的创建校验，以及无效工时参数拒绝校验。
- 验证结果：`python manage.py test accounts backoffice --settings=hota_mds.test_settings` 11/11 通过。
- 冒烟验证：使用 `hota_mds.test_settings` 迁移后，实测管理员登录成功、展示内容配置创建成功、运行参数配置创建成功，结果为 `loginStatus=200`、`displayStatus=201`、`runtimeStatus=201`。

## 12. 本轮更新记录

- 本轮在不进入大屏展示和真实数据源接入的前提下，补齐了最基础的后台前端界面。
- frontend：新增 `/admin/console` 最小后台控制台，登录后可直接维护区域、产线、设备、编码映射、左右屏配置、展示内容配置、运行参数配置、数据源配置，并查看操作日志。
- frontend：后台控制台提供资源切换、列表展示、基础新增/编辑/删除表单，以及日志详情查看。
- frontend：登录页保留在 `/admin/login`，管理员登录成功后自动进入 `/admin/console`。
- frontend：控制台直接对接现有 M2 API，继续通过本系统后端访问，不直连任何外部系统。
- frontend：样式从骨架占位页调整为可用的管理界面布局，适配桌面和移动宽度的基本使用。
- 验证结果：`npm run build` 通过；`python manage.py test accounts backoffice --settings=hota_mds.test_settings` 11/11 通过。
- 联调验证：`http://127.0.0.1:3000/admin/console` 返回 200，`http://127.0.0.1:8000/api/health` 返回健康结果。

## 13. 本轮更新记录

- 已新增 `docs/DECISIONS.md`，用于记录开发中“为什么这么做”的技术决策背景。
- 当前已补录的一期关键决策包括：一期范围边界、报修与 3D 的阶段定位、前端不直连外部系统、管理员权限简化、签名 Token 认证、统一 API 响应风格、数据源敏感配置结构预留、M2 先补最小后台界面等。

## 14. 本轮更新记录

- 根据数据库结构审阅意见，已补充员工台账模型、接口和后台前端入口。
- backend：新增员工模型 `Employee`，字段包含 `employee_no`、`name`、`role`、`is_active`、`notes`。
- backend：员工号格式限制为仅允许英文和数字；角色固定为 `employee`、`team_leader`、`supervisor`。
- backend：新增 `/api/admin/employees` 系列接口，并纳入统一管理员鉴权、统一响应结构和操作日志体系。
- frontend：后台控制台新增“员工台账”入口，可直接维护员工号、姓名、角色和启用状态。
- docs：已同步更新 `DECISIONS.md`、`DB_MODEL_DRAFT.md`、`API_CONTRACT.md`，记录员工表补充原因和接口约束。
## 15. 本轮收尾状态

### 当前阶段

- 当前仍处于 M2 收尾阶段。
- M2 最小后台能力已经补齐到管理员可维护台账和配置的程度。
- 本轮在既有 M2 基础上补充了缺失的员工台账，不进入 M3，不接真实数据源，不进入大屏展示。

### 本轮已完成

- 新增员工表 `Employee`，字段包含 `employee_no`、`name`、`role`、`is_active`、`notes`。
- 员工号格式限制为仅允许英文和数字。
- 员工角色固定为 `employee`、`team_leader`、`supervisor`。
- 新增员工台账后台接口 `/api/admin/employees`，纳入现有管理员鉴权、统一响应结构与操作日志。
- 后台最小前端界面增加“员工台账”入口，可新增、编辑、删除员工记录。
- 已同步更新 `API_CONTRACT.md`、`DB_MODEL_DRAFT.md`、`DECISIONS.md`、`HANDOFF.md`。
- 已完成迁移、自动化测试、前端构建和接口冒烟验证。

### 未完成

- 尚未进入 M3 的标准化缓存模型、mock 采集结果和左右屏展示 API。
- 尚未接入任何真实外部系统。
- 尚未实现大屏展示链路中的“最近一次成功数据兜底”运行态能力。
- 尚未实现员工与部门、班组、用户账号之间的扩展关系。

### 当前已知问题

- 当前生产数据库仍未实际联调，验证主要基于 `hota_mds.test_settings` 与本地测试链路完成。
- 员工台账目前仅覆盖最小字段，不包含组织关系、联系方式、班次等扩展信息。
- 本轮 shell 冒烟验证中，`APIClient` 需显式指定 `HTTP_HOST=localhost` 才能稳定复用本地测试环境，请继续沿用该方式。

### 下一个最优先任务

- 进入 M3，先实现标准化缓存模型、mock 数据装载和左右屏展示 API。
- 优先把“数据源异常时返回最近一次成功数据”的兜底机制落到后端缓存与展示接口，不接真实数据源。

## 16. 本轮更新记录

- 本轮正式进入 M3，但范围严格控制在后端最小闭环，不进入真实数据源接入、不进入报修、不进入 3D 仿真、不进入内部 Web 报表。
- backend：新增标准化缓存快照模型：
  - `DeviceStatusSnapshot`
  - `ProductionSnapshot`
  - `ScheduleSnapshot`
  - `EnergySnapshot`
  - `DataSourceHealthSnapshot`
- backend：新增 `backoffice/display_services.py`，统一承担 mock 数据生成、缓存快照写入、默认配置兜底和左右屏展示数据拼装。
- backend：新增公开展示接口：
  - `/api/screens/left`
  - `/api/screens/right`
- backend：新增后台只读接口：
  - `/api/admin/data-source-healths`
- backend：新增管理命令 `python manage.py load_mock_screen_data`，用于装载 M3 mock 快照；支持 `--simulate-failure`，用于验证“保留最近一次成功数据”的兜底逻辑。
- backend：展示接口会优先读取缓存快照；若 mock 快照尚未生成，会自动补装默认 mock 数据，避免接口空返回。
- backend：当 mock 刷新失败时，只更新 `DataSourceHealthSnapshot` 为失败状态，不覆盖既有展示快照；左右屏接口继续返回上一次成功快照，并在 `meta.usingFallback` 中标记兜底状态。
- backend：新增 `backoffice` 迁移文件 `0004_datasourcehealthsnapshot_devicestatussnapshot_and_more.py`。
- 自动化验证结果：
  - `python -m compileall backoffice hota_mds` 通过
  - `python manage.py test accounts backoffice --settings=hota_mds.test_settings` 15/15 通过
  - `npm run build` 通过
- 运行态冒烟验证结果：
  - `python manage.py migrate --settings=hota_mds.test_settings` 通过
  - `python manage.py load_mock_screen_data --settings=hota_mds.test_settings` 通过
  - `GET /api/screens/left` 返回成功，`screenKey=left`
  - `GET /api/screens/right` 返回成功，`screenKey=right`
  - `python manage.py load_mock_screen_data --simulate-failure --settings=hota_mds.test_settings` 后，再次读取右屏接口，`meta.usingFallback=True`
- 验证注意事项：
  - 使用 SQLite 测试库做本地冒烟时，不要并行执行会写同一库的命令，否则可能出现 `database is locked`。

## 17. 本轮更新记录

- 本轮继续停留在 M3，不接真实外部系统，不做报修真实接入，不做 3D 仿真，不进入内部 Web 报表。
- frontend：新增 `src/ScreenDisplay.jsx`，将左右屏从占位页升级为真实展示页。
- frontend：`/screen/left` 现已接入 `/api/screens/left`，展示欢迎信息、设备概览、产量概览、近 8 小时产量趋势、区域能耗概览和报修占位区。
- frontend：`/screen/right` 现已接入 `/api/screens/right`，展示未完工订单排产、延期风险概览和 3D 仿真预留区。
- frontend：`src/App.jsx` 已改为按路由直接渲染左右屏展示组件，不再停留在大屏占位页。
- frontend：当屏幕页已拿到成功数据后，如果后续接口请求失败，页面会继续保留当前内容，只更新状态提示，避免前端自身导致白屏。
- frontend：`src/styles.css` 新增大屏布局与展示样式，适配桌面和窄屏宽度下的基础展示。
- 自动化验证结果：
  - `npm run build` 通过
  - `python manage.py test accounts backoffice --settings=hota_mds.test_settings` 15/15 通过
- 运行态冒烟验证结果：
  - `http://127.0.0.1:8000/api/screens/left` 返回 200
  - `http://127.0.0.1:3000/screen/left` 返回 200
  - `http://127.0.0.1:3000/screen/right` 返回 200

## 18. 本轮更新记录

- 修复了左右屏前端在 IAB/浏览器中打开时白屏的问题。
- 根因不是后端接口无数据，而是前端当前未启用 React 专用 Vite 插件，JSX 仍按经典运行时编译为 `React.createElement(...)`。
- 由于多个 `.jsx` 文件运行时未自动注入 `React`，页面加载后直接触发 `React is not defined`，导致 `#root` 没有任何内容渲染。
- 修复方式：
  - `frontend/vite.config.js` 新增 `esbuild.jsxInject = 'import React from "react"'`
  - `frontend/src/main.jsx` 改为显式使用 `StrictMode`
- 修复后验证结果：
  - 通过无头浏览器复现并确认旧错误为 `React is not defined`
  - 重启前端 dev/preview 服务后，再次验证 `http://127.0.0.1:3000/screen/left` 与 `http://127.0.0.1:4173/screen/left` 均已渲染正文内容，不再是空白页

## 19. 本轮更新记录

- 本轮继续停留在 M3，没有接真实外部系统，没有进入报修、3D 仿真或内部 Web 报表。
- backend：`/api/admin/data-source-healths` 现在会在健康快照不存在时自动补装默认 mock 快照，避免后台首次进入时空列表。
- backend：新增自动化测试，验证数据源健康接口在未预先装载 mock 数据时也能返回 4 条健康记录。
- frontend：后台控制台新增“数据源健康”只读资源入口，读取 `/api/admin/data-source-healths`。
- frontend：控制台可查看数据源名称、状态、是否兜底、最近成功时间、是否过期，并可点击查看完整记录详情。
- frontend：重写 `AdminConsole.jsx`，清理历史乱码字符串，修正只读详情面板标题与提示文案。
- 自动化验证结果：
  - `python manage.py test accounts backoffice --settings=hota_mds.test_settings` 16/16 通过
  - `npm run build` 通过
- 运行态冒烟验证结果：
  - `GET /api/admin/data-source-healths` 在未手工装载 mock 数据时返回 200，`total=4`
  - `http://127.0.0.1:3000/admin/console` 返回 200
  - 使用无头浏览器登录后台后，“数据源健康”标签可见、可点击，列表加载成功，右侧详情面板显示“健康详情”

## 20. 本轮更新记录

- 本轮继续停留在 M3，只优化后台“数据源健康”页面的可读性，不涉及真实数据接入。
- frontend：重写 `src/adminResources.js`，清理资源定义中的历史乱码，并保持现有后台资源行为不变。
- frontend：为“数据源健康”资源新增只读展示格式化能力：
  - `healthy/failed` 显示为“正常/失败”
  - 布尔值显示为“是/否”
  - ISO 时间显示为本地可读格式 `YYYY-MM-DD HH:mm:ss`
  - 详情面板改为按字段分行展示，不再直接暴露原始 JSON 为唯一阅读方式
- frontend：`src/AdminConsole.jsx` 已支持资源自定义表格单元格格式化和详情格式化。
- 自动化验证结果：
  - `npm run build` 通过
  - `python manage.py test accounts backoffice --settings=hota_mds.test_settings` 16/16 通过
- 运行态冒烟验证结果：
  - 无头浏览器登录后台并进入“数据源健康”后，列表中可见“正常”“否”和格式化后的时间字符串

## 21. 本轮更新记录

- 本轮继续停留在 M3，只修复一期双屏展示链路中的可见脏数据，不扩展到真实外部系统、报修接入、3D 仿真或内部 Web 报表。
- frontend：重写 `src/AdminApp.jsx`、`src/App.jsx`、`src/PlaceholderScreen.jsx` 中仍残留的历史乱码文案，保持既有登录、路由和展示行为不变。
- backend：在 `backoffice/display_services.py` 中为展示内容配置增加脏值兜底；当 `company_name` 或 `welcome_message` 为仅由 `?` 组成的历史坏值时，自动回退到默认展示文案。
- backend：补充自动化测试，验证左屏接口在展示内容配置存在 `????` / `????????` 时，仍返回默认欢迎语与公司名。
- 本地运行环境：已修正 `hota_mds.test_settings` 测试库中的坏欢迎语记录，使当前 `runserver` 页面无需手工重建快照即可恢复正常显示。
- 自动化验证结果：
  - `python manage.py test accounts backoffice --settings=hota_mds.test_settings` 17/17 通过
  - `npm run build` 通过
- 运行态冒烟验证结果：
  - `GET http://127.0.0.1:8000/api/screens/left` 返回 `welcomeMessage='欢迎莅临参观指导'`、`companyName='和泰智造'`
  - 无头浏览器访问 `http://127.0.0.1:3000/admin/login`，登录页文案显示正常
  - 无头浏览器访问 `http://127.0.0.1:3000/screen/left`，左屏欢迎语与公司名已恢复正常，不再显示 `?`

## 22. 本轮更新记录

- 本轮继续停留在 M3，只收敛一期双屏展示里仍暴露给参观者的原始状态枚举与占位说明，不扩展到真实外部系统、报修真实接入、3D 仿真或内部 Web 报表。
- backend：`backoffice/display_services.py` 现在会为左屏设备状态输出标准化展示列表 `statusItems`，每项包含 `key`、`label`、`accent`、`count`，前端不再直接消费 `running/stopped/alarm/offline` 原始键。
- backend：右屏排产风险汇总现在输出标准化展示列表 `riskSummary.items`，每项包含 `key`、`label`、`accent`、`color`、`count`，前端不再自己维护风险标签映射。
- backend：为一期后段占位模块补充接口文案字段：
  - `repairPlaceholder.description`
  - `simulationPlaceholder.description`
- frontend：重写 `src/ScreenDisplay.jsx`，改为直接渲染后端提供的标准化状态项与占位说明，保留原有双屏轮询刷新和“最近一次成功数据”前端兜底行为不变。
- 自动化验证结果：
  - `python manage.py test accounts backoffice --settings=hota_mds.test_settings` 17/17 通过
  - `npm run build` 通过
- 运行态冒烟验证结果：
  - `GET http://127.0.0.1:8000/api/screens/left` 返回 `statusItems=[运行, 停机, 报警, 离线]`
  - `GET http://127.0.0.1:8000/api/screens/right` 返回 `riskSummary.items=[正常, 风险, 延期, 暂停]`
  - 无头浏览器访问 `http://127.0.0.1:3000/screen/left`，左屏已显示“运行/停机/报警/离线”，不再显示英文状态键
  - 无头浏览器访问 `http://127.0.0.1:3000/screen/right`，右屏风险汇总显示“正常/风险/延期/暂停”，并正常显示 3D 预留说明

## 23. 本轮状态总结

### 当前阶段

- 当前仍处于 M3 阶段。
- 一期前段范围仍然只做外部参观双屏大屏，不进入内部 Web 报表。
- 当前左右屏已经接入标准化缓存 API，并具备“最近一次成功数据”兜底能力。
- 当前轮次已暂停在“展示字段继续标准化”这个方向上，尚未进入真实外部系统接入。

### 本轮已完成

- 后端为左屏设备状态增加标准化展示字段 `statusItems`，统一输出“运行 / 停机 / 报警 / 离线”。
- 后端为右屏风险汇总增加标准化展示字段 `riskSummary.items`，统一输出“正常 / 风险 / 延期 / 暂停”。
- 后端为报修占位和 3D 预留区补充说明文案字段：
  - `repairPlaceholder.description`
  - `simulationPlaceholder.description`
- 前端重写 `frontend/src/ScreenDisplay.jsx`，改为直接渲染后端标准化字段，不再自行解释状态枚举。
- 已完成后端测试、前端构建、接口校验和浏览器冒烟验证。

### 未完成

- 仍未接入任何真实外部系统。
- 仍未实现一期之外的内部 Web 报表。
- 仍未进入报修真实接入。
- 仍未进入 3D 仿真真实开发。
- 双屏其余动态字段的展示命名尚未完全收敛到后端标准化输出。

### 当前已知问题

- 文档中较早期历史段落仍存在编码乱码，但本轮新增记录为正常中文，不影响继续交接。
- 当前验证主要基于 `hota_mds.test_settings` 和本地 mock 链路完成，还没有真实外部系统联调结果。
- 工作区仍存在本轮之外的既有改动，例如 `README.md` 等，当前未处理，也未回退。

### 下一个最优先任务

- 继续留在 M3，优先把双屏剩余动态展示字段的命名和展示语义继续收敛到后端标准化输出，进一步减少前端对业务字段的解释和拼装。
