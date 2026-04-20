# 和泰智造数屏系统 HANDOFF

## 1. 当前项目背景

本项目是和泰智造数屏系统，当前一期前段目标是建设面向外部客户参观的数字化工厂展示大屏。

大屏采用左右双屏展示：

- 左屏：综合运行展示。
- 右屏：生产动态展示。

一期前段只聚焦外部参观大屏，不包含内部 Web 报表。内部 Web 报表作为二期另行规划。

报修系统取数存在困难，因此报修接入作为一期后段项目。3D 仿真作为一期后段低优先级项目，优先级低于报修系统接入。

## 2. 已确认决策

### 2.1 范围决策

- 一期前段验收以设备、产量、排产、能耗稳定展示为核心。
- 报修不作为一期前段验收阻塞项。
- 3D 仿真不作为一期前段验收阻塞项。
- 内部 Web 报表不进入一期前段。

### 2.2 展示决策

- 左右屏分别使用独立 URL。
- 左右屏分别配置内容和轮播策略。
- 默认轮播时间为 60 秒，可后台配置。
- 报修未接入前显示占位。
- 3D 仿真未实施前显示预留区或占位。

### 2.3 数据决策

- 设备、产量、排产、能耗必须真实接入。
- 后端定时拉取并缓存外部系统数据。
- 前端不直接访问外部系统。
- 默认刷新频率 5 分钟，可后台配置。
- 当前外部点表和表结构未提供，允许先做标准模型、mock 数据和适配器接口。
- 数据库历史数据永久保留。

### 2.4 编码决策

- 本系统自建主数据编码。
- 其他系统编码映射到本系统主编码。
- 至少支持设备、产线、订单、物料、区域映射。

### 2.5 权限决策

- 后台需要登录。
- 一期不做复杂角色拆分。
- 默认管理员拥有全部后台配置权限。

### 2.6 异常决策

- 大屏显示最近一次成功数据。
- 大屏不提示数据过期。
- 后台显示数据源健康状态、最近成功更新时间和过期状态。

### 2.7 部署决策

- Ubuntu。
- Docker。
- MySQL 独立部署。
- 容器拆分为 backend、frontend/nginx、collector。
- 外部数据源连接信息只能在后台配置，不能写死在代码里。

## 3. 未完成事项

需求层面：

- 确认一个订单是否绝对不会同时分配到多条产线。
- 确认 WMS 是否进入一期真实接入。
- 确认拼接屏实际分辨率和浏览器环境。
- 确认后台连接信息加密方案。

外部系统资料：

- OPCUA / Modbus 点表。
- SAP RFC 字段和连接方式。
- 排产系统数据库表结构。
- 能耗数据库表结构。
- 报修系统接入方式。

实现层面：

- 已初始化 Django + DRF 后端工程骨架。
- 已初始化 React 前端工程骨架。
- 已初始化 collector 独立服务目录。
- 已新增 Docker Compose 基础部署结构。
- 已新增 `.env.example` 环境变量模板。
- 已新增 backend 基础健康检查接口 `/api/health`。
- 已新增后台管理员认证接口 `/api/admin/auth/login`、`/api/admin/auth/me`。
- 已将前端 `/admin/login` 从占位页升级为最小可用登录页。
- 已新增 M2 最小后台数据模型与管理 API。
- 已新增 M3 标准化缓存快照、mock 数据装载命令、左右屏展示 API 与左右屏前端展示页。
- 尚未接入外部系统。
- 尚未进入真实数据源驱动的大屏页面联调。
- 尚未把数据源健康状态接到后台前端控制台。

## 4. 下次开发前必须先阅读的文件

按顺序阅读：

1. `需求文档/PRD_和泰智屏系统.md`
2. `docs/SPEC.md`
3. `docs/PLAN.md`
4. `docs/STATUS.md`
5. `docs/HANDOFF.md`
6. `docs/IMPLEMENTATION_PLAN.md`
7. `docs/API_CONTRACT.md`
8. `docs/DB_MODEL_DRAFT.md`
9. `README.md`

## 5. 建议下一轮优先任务

下一轮建议继续留在 M3，不要直接接外部系统。

建议顺序：

1. 在现有最小后台控制台中补一个只读的数据源健康状态入口。
2. 继续完善左右屏前端页面细节，但仍只消费 `/api/screens/left`、`/api/screens/right`，不依赖外部系统原始结构。
3. 保持现有 M2 后台 API、M3 mock 快照结构和展示接口稳定，不做无必要重构。
4. 在真实外部系统资料到位前，只扩标准缓存模型和 mock 链路，不让前端依赖外部原始结构。

## 6. 特别注意

- 不要把报修和 3D 仿真做成一期前段阻塞项。
- 不要把内部 Web 报表纳入一期前段。
- 不要让前端直连外部系统。
- 不要把外部系统连接信息写死在代码中。
- 不要在大屏端显示“数据过期”提示。
- 在外部点表和表结构未提供前，先做标准模型、mock 数据和适配器接口。
- 数据库历史数据要求永久保留，后续设计归档和清理策略时不得默认删除历史数据。

## 7. 本轮交接记录

- 本轮新增 `docs/IMPLEMENTATION_PLAN.md`，用于记录一期前段开发实施 WBS。
- 文档按 M0、M1、M2、M3、M4、M6、M5、UAT 拆分，并将 M7 报修、M8 3D 仿真、M9 内部 Web 报表列为后续阶段。
- 后续开发建议先按 `docs/IMPLEMENTATION_PLAN.md` 的推荐顺序推进，优先完成 M0 到 M1，不直接接外部系统。

## 8. 本轮交接记录

- 本轮新增 `docs/API_CONTRACT.md` 与 `docs/DB_MODEL_DRAFT.md`。
- API 契约草案覆盖后台登录、台账维护、编码映射、左右屏配置、数据源配置、数据源健康状态、左屏展示数据、右屏展示数据。
- 数据模型草案覆盖主数据、编码映射、标准缓存模型、数据源配置、左右屏配置、页面模块开关、操作日志。
- 后续进入工程实现前，应先基于这两份草案确认歧义问题，尤其是订单与产线关系、近 8 小时产量统计口径、延期预测阈值、能耗统计口径和连接信息加密方案。

## 9. 本轮交接记录

- 本轮完成 M1 工程骨架与基础部署，不包含任何真实业务功能或真实外部系统接入。
- 新增 backend、frontend、collector、Docker Compose、`.env.example` 和 README。
- backend 使用 Django + DRF，并通过环境变量配置 MySQL；未写死任何外部系统连接信息。
- frontend 使用 React，并提供 `/screen/left`、`/screen/right`、`/admin/login` 三个占位路由。
- collector 目前仅为独立服务占位和心跳输出，不连接 OPCUA、Modbus、SAP、排产库、能耗库或报修系统。
- frontend 的 Vite 仅作为 React 构建工具使用，不代表引入新的业务技术栈。
- 本地验证已通过 Python 语法编译、Docker Compose 配置解析和 `package.json` JSON 校验。
- 当前 Docker Desktop/Linux engine 未运行，容器启动、MySQL 实际连接和 `/api/health` 运行时访问尚未完成。
- 当前 npm 依赖安装多次超时，未生成 `node_modules` 或 `package-lock.json`；后续在网络或 registry 可用时需重新执行前端依赖安装与构建验证。

## 10. 本轮交接记录

- 本轮进入 M2，并完成“管理员登录最小可交付目标”。
- backend 新增 `accounts` 应用，提供 `/api/admin/auth/login` 与 `/api/admin/auth/me`。
- 认证策略为最小实现：校验 Django 用户名密码，仅允许 `is_staff` 用户登录，返回带签名的短期令牌。
- 本轮未引入复杂权限体系，未实现后台业务配置页，符合一期不做复杂角色拆分的约束。
- frontend 的 `/admin/login` 已支持账号密码提交、会话令牌存储、当前管理员信息读取与清除会话。
- 新增 `frontend/vite.config.js`，开发环境下 `/api` 代理到 backend，便于本地联调。
- 本轮验证已通过后端编译、4 条认证测试、前端 `npm install`、前端生产构建，以及基于 `hota_mds.test_settings` 的本地登录链路实测。
- `hota_mds.test_settings` 仅用于本地测试与验证；项目正式约束仍然是 Django + DRF + MySQL，不应误用为生产配置。

## 11. 本轮交接记录

- 本轮范围严格限制在 M2 最小后台能力，不进入大屏展示、不接真实数据源、不做报修、不做 3D 仿真、不做内部报表。
- backend 新增 `backoffice` 应用，落地了区域、产线、设备、编码映射、左右屏配置、数据源配置、操作日志等模型与 API。
- 后台接口统一走管理员 Bearer Token 鉴权，保持与 `/api/admin/auth/login`、`/api/admin/auth/me` 一致的管理域风格。
- 数据源配置支持两类敏感信息保护结构：
  - `env_ref`：通过环境变量名引用敏感值
  - `encrypted`：预留密文和密钥版本字段
- 数据源配置接口不会在返回结果和操作日志中暴露敏感密文或敏感键值内容。
- 操作日志已覆盖管理员登录、创建、更新、删除四类基础动作，便于后续后台审计。
- 本轮新增统一异常处理器，后台管理接口在常见错误场景下也返回一致的 `success/code/message/data` 结构。
- 本轮自动化验证已通过：
  - `python manage.py test accounts backoffice --settings=hota_mds.test_settings`
  - 9 个测试全部通过
- 本轮运行态冒烟验证已通过：
- 管理员登录接口返回 200
- 区域创建接口返回 201
- 操作日志列表可正常返回
- 下一轮更适合继续留在 M2，补后台页面入口、参数配置、模块开关等，使这批 API 真正可维护；不要直接跳到 M3/M4。

## 12. 本轮交接记录

- 本轮继续停留在 M2，补齐了后台参数配置能力，没有进入大屏展示，也没有接真实数据源。
- backend 新增两个配置模型：
  - `DisplayContentConfig`：欢迎语、Logo、宣传图片等展示内容
  - `RuntimeParameterConfig`：单日有效工作时间、标准产能、延期预警缓冲、甘特窗口、自动滚动阈值、产量窗口等运行参数
- backend 新增两个管理接口：
  - `/api/admin/display-content-configs`
  - `/api/admin/runtime-parameter-configs`
- 现有 `ScreenConfig` 继续负责左右屏自身配置；本轮新增配置更偏全局参数与欢迎展示内容。
- `ScreenConfigSerializer` 已补结构校验，要求 `pageKeys` 为数组、`moduleSettings`/`themeSettings` 为对象。
- 本轮新增迁移文件 `backoffice/migrations/0002_displaycontentconfig_runtimeparameterconfig.py`。
- 本轮自动化验证已通过：
  - `python manage.py test accounts backoffice --settings=hota_mds.test_settings`
  - 11 个测试全部通过
- 本轮运行态冒烟验证已通过：
- 管理员登录接口返回 200
- 展示内容配置创建接口返回 201
- 运行参数配置创建接口返回 201
- 下一轮最适合继续留在 M2，把这批后台 API 接到最小管理界面上，或者补 Django Admin 运维入口；之后再进入 M3。

## 13. 本轮交接记录

- 本轮继续按 M2 边界工作，没有进入大屏展示，也没有接真实数据源。
- frontend 新增最小后台前端界面：
  - `/admin/login`：管理员登录页
  - `/admin/console`：后台控制台
- 控制台已接入以下资源的最小维护能力：
- 区域台账
- 产线台账
- 设备台账
- 员工台账
- 编码映射
  - 左右屏配置
  - 欢迎展示配置
  - 运行参数配置
  - 数据源配置
  - 操作日志查看
- 前端继续通过本系统后端 API 工作，没有直连 SAP、排产库、能耗库、OPCUA、Modbus 或其他外部系统。
- 本轮本地验证已通过：
- `npm run build`
- `/admin/console` 路由可访问
- backend 健康检查接口可访问
- `python manage.py test accounts backoffice --settings=hota_mds.test_settings`
- 到当前为止，M2 的“最小后台能力 + 最小后台界面”已基本具备，下一轮更适合进入 M3，开始标准展示数据模型、缓存层与 mock 展示 API。

## 15. 本轮交接记录

- 本轮根据数据库结构审阅意见补充了员工台账。
- backend 新增员工模型 `Employee`，当前字段范围严格收敛为：
  - `employee_no`
  - `name`
  - `role`
  - `is_active`
  - `notes`
- 员工号当前仅允许英文和数字，不允许连字符、空格或其他特殊字符。
- 员工角色当前固定为三类：
  - `employee`
  - `team_leader`
  - `supervisor`
- frontend 后台控制台已新增“员工台账”入口，可直接管理该表。
- docs 已同步补录到：
  - `docs/DECISIONS.md`
  - `docs/DB_MODEL_DRAFT.md`
  - `docs/API_CONTRACT.md`

## 14. 本轮交接记录

- 已新增 `docs/DECISIONS.md`，专门记录开发过程中“为什么这样实现”的技术决策。
- 这份文档用于补充 `STATUS.md` 和 `HANDOFF.md` 不便展开说明的实现背景，后续有新的架构、认证、缓存、配置、安全、前后端协作等决策时都应继续追加。
## 16. 本轮收尾交接

### 本轮目标

- 根据数据库结构审阅结果，补充缺失的员工表和员工台账。
- 员工号支持英文及数字。
- 增加员工角色字段，范围限定为员工、班组长、主管。
- 完成后同步更新状态、交接和决策文档。

### 本轮实际完成

- 后端新增 `Employee` 模型与迁移文件。
- 员工号字段 `employee_no` 已限制为仅允许英文和数字。
- 角色字段 `role` 已固定为 `employee`、`team_leader`、`supervisor`。
- 新增员工台账接口 `/api/admin/employees`，纳入管理员鉴权和基础操作日志。
- 前端后台控制台新增“员工台账”资源入口。
- 已更新 `STATUS.md`、`HANDOFF.md`、`DECISIONS.md`、`API_CONTRACT.md`、`DB_MODEL_DRAFT.md`。
- 已完成编译、测试、迁移和接口冒烟验证。

### 本轮未完成

- 未扩展员工与部门、班组、管理员账号的关联关系。
- 未增加员工导入导出、批量维护能力。
- 未进入 M3 的缓存模型、mock 展示数据和左右屏展示 API。
- 未接入真实数据源。

### 修改文件清单

- `backend/backoffice/models.py`
- `backend/backoffice/serializers.py`
- `backend/backoffice/views.py`
- `backend/backoffice/urls.py`
- `backend/backoffice/tests.py`
- `backend/backoffice/migrations/0003_employee.py`
- `frontend/src/adminResources.js`
- `docs/API_CONTRACT.md`
- `docs/DB_MODEL_DRAFT.md`
- `docs/DECISIONS.md`
- `docs/STATUS.md`
- `docs/HANDOFF.md`

### 遇到的问题

- 本轮未发现员工模型或接口设计上的阻塞性问题。
- 在本地 shell 冒烟验证时，`APIClient` 默认 host 会触发 400，请显式传入 `HTTP_HOST=localhost` 后再执行接口链路验证。
- 当前联调仍以 `hota_mds.test_settings` 为主，尚未在正式 MySQL 环境完成实际验证。

### 建议下一轮优先任务

- 按既定计划进入 M3，先做标准化缓存模型、mock 数据装载和左右屏展示 API。
- 第一优先级是把“最近一次成功数据兜底”机制做进缓存和展示接口，继续保持不接真实外部系统。

## 17. 本轮交接记录

- 本轮已正式从 M2 收尾推进到 M3 的第一个最小可交付目标。
- 后端新增 5 类标准化缓存快照模型：
  - `DeviceStatusSnapshot`
  - `ProductionSnapshot`
  - `ScheduleSnapshot`
  - `EnergySnapshot`
  - `DataSourceHealthSnapshot`
- 后端新增 `backoffice/display_services.py`，统一处理 mock 数据生成、快照装载、默认配置兜底和左右屏展示数据拼装。
- 后端新增公开展示接口：
  - `/api/screens/left`
  - `/api/screens/right`
- 后端新增后台只读健康状态接口：
  - `/api/admin/data-source-healths`
- 后端新增管理命令：
  - `python manage.py load_mock_screen_data`
  - `python manage.py load_mock_screen_data --simulate-failure`
- 当前兜底策略已经落地：
  - mock 刷新成功时更新快照和数据源健康状态
  - mock 刷新失败时仅更新健康状态为失败，不覆盖原快照
  - 左右屏展示接口继续返回最近一次成功快照，并通过 `meta.usingFallback` 表示当前处于兜底
- 本轮没有接任何真实外部系统，没有实现报修真实数据，没有实现 3D 仿真，没有进入内部 Web 报表。
- 本轮验证已通过：
  - `python -m compileall backoffice hota_mds`
  - `python manage.py test accounts backoffice --settings=hota_mds.test_settings`
  - `npm run build`
  - `python manage.py migrate --settings=hota_mds.test_settings`
  - `python manage.py load_mock_screen_data --settings=hota_mds.test_settings`
  - 本地读取 `/api/screens/left`、`/api/screens/right` 均成功
  - 执行 `python manage.py load_mock_screen_data --simulate-failure --settings=hota_mds.test_settings` 后，右屏接口仍成功返回，且 `meta.usingFallback=True`
- 本轮修改文件清单：
  - `backend/backoffice/models.py`
  - `backend/backoffice/serializers.py`
  - `backend/backoffice/views.py`
  - `backend/backoffice/urls.py`
  - `backend/backoffice/display_services.py`
  - `backend/backoffice/tests.py`
  - `backend/backoffice/management/commands/load_mock_screen_data.py`
  - `backend/backoffice/migrations/0004_datasourcehealthsnapshot_devicestatussnapshot_and_more.py`
  - `backend/hota_mds/urls.py`
  - `docs/STATUS.md`
  - `docs/HANDOFF.md`

## 18. 本轮交接记录

- 本轮继续停留在 M3，并完成了第二个最小可交付目标：左右屏前端展示页正式接入标准展示 API，不再停留在占位页。
- frontend 新增 `src/ScreenDisplay.jsx`，按 `screenKey` 区分左屏和右屏展示：
  - 左屏展示欢迎信息、设备运行概览、产量执行概览、近 8 小时产量趋势、区域能耗概览和报修占位区
  - 右屏展示未完工订单排产、延期风险概览和 3D 仿真预留区
- frontend `src/App.jsx` 已切换为在 `/screen/left`、`/screen/right` 直接渲染真实屏幕组件。
- frontend `src/styles.css` 已新增大屏样式，当前以全屏深色展示布局为主，适配桌面与窄屏场景。
- 前端当前也实现了最小白屏保护：
  - 首次加载成功后，如果后续接口请求失败，页面继续保留上一次成功内容
  - 页面顶部会显示当前是否处于兜底数据展示中
- 本轮没有改动后台管理 API 的行为，没有接真实外部系统，没有做报修真实接入，没有做 3D 仿真真实开发。
- 本轮验证已通过：
  - `npm run build`
  - `python manage.py test accounts backoffice --settings=hota_mds.test_settings`
  - `http://127.0.0.1:8000/api/screens/left` 返回 200
  - `http://127.0.0.1:3000/screen/left` 返回 200
  - `http://127.0.0.1:3000/screen/right` 返回 200
- 本轮本地运行地址：
  - 前端：`http://127.0.0.1:3000/screen/left`
  - 前端：`http://127.0.0.1:3000/screen/right`
  - 后端展示 API：`http://127.0.0.1:8000/api/screens/left`
  - 后端展示 API：`http://127.0.0.1:8000/api/screens/right`
- 本轮修改文件清单：
  - `frontend/src/App.jsx`
  - `frontend/src/ScreenDisplay.jsx`
  - `frontend/src/styles.css`
  - `docs/STATUS.md`
  - `docs/HANDOFF.md`

## 19. 本轮交接记录

- 本轮修复了左右屏在 IAB/浏览器内打开时白屏的问题。
- 问题根因：
  - 前端当前没有接入 `@vitejs/plugin-react`
  - Vite/esbuild 仍按经典 JSX 运行时输出 `React.createElement(...)`
  - 但项目中的 `.jsx` 文件并没有统一把 `React` 注入到运行时作用域
  - 页面打开后直接报错 `React is not defined`，导致只剩网页标题，`#root` 里没有内容
- 修复措施：
  - 在 `frontend/vite.config.js` 中增加 `esbuild.jsxInject = 'import React from "react"'`
  - 在 `frontend/src/main.jsx` 中将根节点包裹改为 `StrictMode`
  - 重启前端 dev 服务和 preview 服务，使新配置生效
- 验证结果：
  - 通过无头浏览器抓到旧报错：`React is not defined`
  - 修复并重启后，再次使用无头浏览器验证：
    - `http://127.0.0.1:3000/screen/left` 已能渲染正文
    - `http://127.0.0.1:4173/screen/left` 已能渲染正文
  - 当前仍可见一条 404 资源日志，但不影响页面主内容渲染，属于非阻塞问题
- 本轮修改文件清单：
  - `frontend/src/main.jsx`
  - `frontend/vite.config.js`
  - `docs/STATUS.md`
  - `docs/HANDOFF.md`

## 20. 本轮交接记录

- 本轮继续停留在 M3，目标是把“数据源健康状态”接到现有后台控制台，不涉及真实数据接入。
- backend 调整：
  - `GET /api/admin/data-source-healths` 现在在健康快照还不存在时会自动调用 mock 快照装载逻辑
  - 这样后台第一次进入健康状态页时，不需要先手工执行 `load_mock_screen_data`
- backend 测试补充：
  - 新增健康状态接口自动补装 mock 快照的测试
- frontend 调整：
  - `frontend/src/adminResources.js` 新增只读资源 `dataSourceHealths`
  - `frontend/src/AdminConsole.jsx` 已重写为干净版本，去掉历史乱码字符串，并支持按资源显示对应详情标题
  - 后台控制台现在可直接查看数据源健康状态列表和详情
- 本轮验证已通过：
  - `python manage.py test accounts backoffice --settings=hota_mds.test_settings`
  - `npm run build`
  - 本地实测 `GET /api/admin/data-source-healths` 返回 200 且 `total=4`
  - `http://127.0.0.1:3000/admin/console` 返回 200
- 本轮修改文件清单：
  - `backend/backoffice/views.py`
  - `backend/backoffice/tests.py`
  - `frontend/src/adminResources.js`
  - `frontend/src/AdminConsole.jsx`
  - `docs/STATUS.md`
  - `docs/HANDOFF.md`

## 21. 本轮交接记录

- 本轮继续停留在 M3，只做后台“数据源健康”页面的可读性优化，不扩展到真实数据源接入。
- frontend 调整：
  - 重写 `frontend/src/adminResources.js`，清理历史乱码资源定义
  - 为“数据源健康”资源补充表格格式化和详情格式化
  - `frontend/src/AdminConsole.jsx` 现已支持按资源定制表格单元格显示和只读详情显示
- 当前“数据源健康”页的展示效果：
  - 状态字段显示为“正常/失败”
  - 布尔字段显示为“是/否”
  - 时间字段显示为 `YYYY-MM-DD HH:mm:ss`
  - 详情面板按名称、来源键、状态、最近成功、最近尝试、是否过期、是否使用兜底、错误信息、附加信息分项展示
- 本轮验证已通过：
  - `npm run build`
  - `python manage.py test accounts backoffice --settings=hota_mds.test_settings`
  - 使用无头浏览器登录后台后进入“数据源健康”，列表和详情均按新的友好格式展示
- 本轮修改文件清单：
  - `frontend/src/adminResources.js`
  - `frontend/src/AdminConsole.jsx`
  - `docs/STATUS.md`
  - `docs/HANDOFF.md`

## 22. 本轮交接记录

- 本轮目标：清理一期双屏展示与后台入口中仍残留的历史乱码，并修复左屏欢迎语/公司名显示为 `?` 的问题。
- 范围控制：
  - 没有接入真实外部系统
  - 没有进入报修真实接入
  - 没有做 3D 仿真开发
  - 没有进入内部 Web 报表
- frontend 调整：
  - 重写 `frontend/src/AdminApp.jsx`，清理登录页与状态提示文案中的历史乱码
  - 重写 `frontend/src/App.jsx`，清理根路由占位页标题与副标题文案
  - 重写 `frontend/src/PlaceholderScreen.jsx`，清理快速入口区域的无障碍标签文案
- backend 调整：
  - `backend/backoffice/display_services.py` 新增展示文案兜底逻辑
  - 当激活中的 `DisplayContentConfig.company_name` 或 `welcome_message` 只包含问号时，左/右屏接口自动回退到默认文案，而不是继续把坏值直接返回给前端
- 测试补充：
  - `backend/backoffice/tests.py` 新增用例，验证左屏接口在展示配置为 `????` / `????????` 时仍返回默认欢迎语和公司名
- 本地环境处理：
  - 已将当前 `hota_mds.test_settings` 测试库中 `DisplayContentConfig(config_key='default')` 的坏值修正为正常中文，当前运行中的 `127.0.0.1:8000` 服务已恢复正常输出
- 本轮验证已通过：
  - `python manage.py test accounts backoffice --settings=hota_mds.test_settings`
  - `npm run build`
  - `GET http://127.0.0.1:8000/api/screens/left`
  - 无头浏览器验证 `http://127.0.0.1:3000/admin/login`
  - 无头浏览器验证 `http://127.0.0.1:3000/screen/left`
- 当前可直接访问：
  - 前端左屏：`http://127.0.0.1:3000/screen/left`
  - 前端右屏：`http://127.0.0.1:3000/screen/right`
  - 后台登录：`http://127.0.0.1:3000/admin/login`
  - 后端左屏 API：`http://127.0.0.1:8000/api/screens/left`
- 下一步建议：
  - 继续留在 M3，优先把双屏剩余展示文案与状态枚举做一轮统一整理，确保外部参观双屏所有可见字段都来自稳定、可控的后端标准化输出
- 本轮修改文件清单：
  - `backend/backoffice/display_services.py`
  - `backend/backoffice/tests.py`
  - `frontend/src/AdminApp.jsx`
  - `frontend/src/App.jsx`
  - `frontend/src/PlaceholderScreen.jsx`
  - `docs/STATUS.md`
  - `docs/HANDOFF.md`

## 23. 本轮交接记录

- 本轮目标：把一期双屏中仍暴露给参观者的原始状态枚举收敛为后端标准化展示字段，让前端只负责渲染。
- 范围控制：
  - 没有接入真实外部系统
  - 没有进入报修真实接入
  - 没有做 3D 仿真开发
  - 没有进入内部 Web 报表
- backend 调整：
  - `backend/backoffice/display_services.py` 新增设备状态展示映射 `DEVICE_STATUS_DISPLAY`
  - 左屏 `deviceOverview` 新增 `statusItems`，标准输出“运行/停机/报警/离线”及对应数量与视觉强调色
  - 右屏 `schedule.riskSummary` 新增 `items`，标准输出“正常/风险/延期/暂停”及对应数量、颜色、视觉强调色
  - 为一期后段占位模块补充说明文案：
    - `repairPlaceholder.description`
    - `simulationPlaceholder.description`
- frontend 调整：
  - 重写 `frontend/src/ScreenDisplay.jsx`
  - 左屏设备状态区不再遍历原始 `statusBreakdown` 键，而是直接渲染后端给出的 `statusItems`
  - 右屏风险概览不再在前端硬编码风险标签，而是直接渲染后端给出的 `riskSummary.items`
  - 报修占位和 3D 预留区改为直接显示接口返回的说明文案
- 测试补充：
  - `backend/backoffice/tests.py` 补充断言，验证：
    - 左屏接口会返回标准化 `statusItems`
    - 左屏接口会返回 `repairPlaceholder.description`
    - 右屏接口会返回标准化 `riskSummary.items`
    - 右屏接口会返回 `simulationPlaceholder.description`
- 本轮验证已通过：
  - `python manage.py test accounts backoffice --settings=hota_mds.test_settings`
  - `npm run build`
  - `GET http://127.0.0.1:8000/api/screens/left`
  - `GET http://127.0.0.1:8000/api/screens/right`
  - 无头浏览器验证 `http://127.0.0.1:3000/screen/left`
  - 无头浏览器验证 `http://127.0.0.1:3000/screen/right`
- 当前验证结果：
  - 左屏设备状态已经显示为“运行/停机/报警/离线”，不再出现 `running/stopped/alarm/offline`
  - 右屏风险汇总已经显示为“正常/风险/延期/暂停”
  - 右屏 3D 预留区说明文案显示正常
- 下一步建议：
  - 继续留在 M3，优先把双屏剩余动态字段的展示命名也统一收口到后端标准化输出，进一步降低前端拼装和解释业务含义的比例
- 本轮修改文件清单：
  - `backend/backoffice/display_services.py`
  - `backend/backoffice/tests.py`
  - `frontend/src/ScreenDisplay.jsx`
  - `docs/STATUS.md`
  - `docs/HANDOFF.md`

## 24. 暂停前交接摘要

### 本轮目标

- 在不扩展一期范围的前提下，把双屏中仍直接暴露给参观者的原始状态枚举收敛为后端标准化展示字段。

### 本轮实际完成

- 后端新增左屏设备状态展示映射，接口返回 `statusItems`。
- 后端新增右屏风险汇总展示映射，接口返回 `riskSummary.items`。
- 后端为报修占位和 3D 预留区补充说明文案字段。
- 前端重写 `frontend/src/ScreenDisplay.jsx`，改为直接消费后端标准化字段。
- 已完成 `python manage.py test accounts backoffice --settings=hota_mds.test_settings`、`npm run build`、左右屏接口读取和浏览器冒烟验证。

### 本轮未完成

- 未接入真实外部系统。
- 未进入内部 Web 报表。
- 未做报修真实接入。
- 未做 3D 仿真真实开发。
- 未完成双屏其余动态字段的全部标准化收口。

### 修改文件清单

- `backend/backoffice/display_services.py`
- `backend/backoffice/tests.py`
- `frontend/src/ScreenDisplay.jsx`
- `docs/STATUS.md`
- `docs/HANDOFF.md`
- `docs/DECISIONS.md`

### 遇到的问题

- 双屏展示链路中仍有部分字段历史上由前端自行解释状态含义，不符合“后端负责标准化、前端负责展示”的项目规则。
- 文档早期历史内容存在编码乱码，阅读体验较差，但不影响本轮新增记录和继续交接。
- 当前验证环境仍以本地 mock + `hota_mds.test_settings` 为主，尚未具备真实外部系统联调依据。

### 建议下一轮优先任务

- 继续留在 M3，优先把双屏剩余动态字段的展示名称、状态枚举和提示语继续统一收敛到后端标准化输出。
