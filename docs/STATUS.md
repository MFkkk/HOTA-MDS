# 和泰智造数屏系统 STATUS

## 1. 当前阶段

**M2 已全部完成，可以正式进入 M3。**

已具备的 M2 全部后台能力：

- 管理员登录
- 设备台账管理
- 员工台账管理
- 产线台账管理
- 区域台账管理
- 物料台账管理
- 订单台账管理
- 编码映射管理
- 左右屏配置管理
- 页面模块开关管理（独立模型）
- 展示内容配置管理
- 运行参数配置管理
- 数据源配置管理
- 基础操作日志
- 最小后台前端界面
- 正式 MySQL 全量冒烟回归通过

下一步：

- 进入 M3：标准数据模型、缓存层与 mock 展示 API。
- 不接真实外部系统。
- 不实现报修、3D 仿真或内部 Web 报表。
- 前端仍不得直连外部系统。

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

1. 下一轮建议进入 M3：标准数据模型、缓存层与 mock 展示 API。

2. M3 仍不要接真实外部系统，先基于标准缓存模型和 mock 数据把展示数据链路跑通。

3. 后台继续沿用本轮已完成的最小管理界面，不无必要重构。

4. 数据源异常兜底与最近一次成功数据保留能力应在 M3/M6 路径内提前考虑。

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

## 15. 本轮收尾状态（M2 最终版）

### 当前阶段

- **M2 已全部完成**，可以正式进入 M3。
- 本轮在既有 M2 基础上补齐了订单/物料主数据模型、独立页面模块开关模型，并以正式 MySQL 完成全量冒烟回归。

### 本轮已完成

- 新增 Material 物料台账模型（code、name、specification、unit、is_active、notes + 5 预留字段）。
- 新增 Order 订单台账模型（order_no、material FK PROTECT、production_line FK PROTECT、quantity、completed_quantity、unit、status 四元组、planned_start/end、actual_start/end + 5 预留字段）。
- 新增 PageModuleSwitch 独立模型（screen_key + module_key 联合唯一、label、is_enabled、sort_order + 5 预留字段）。
- 新增 /api/admin/materials、/api/admin/orders、/api/admin/page-module-switches 三套管理接口。
- 前端后台控制台新增“物料台账”、“订单台账”和“页面模块开关”入口。
- 27/27 后端 SQLite 测试通过；npm run build 通过。
- 正式 MySQL 全量冒烟回归 20/20 通过。

### 未完成

- 尚未进入 M3 的标准化缓存模型、mock 采集结果和左右屏展示 API。
- 尚未接入任何真实外部系统。
- 尚未实现大屏展示链路中的“最近一次成功数据兜底”运行态能力。
- 尚未实现员工与部门、班组、用户账号之间的扩展关系。
- ScreenConfig 中的 module_settings JSON 字段仍保留，未删除；新的独立 PageModuleSwitch 为正式来源，后续 M3/M4 应优先读取 PageModuleSwitch。

### 当前已知问题

- 员工台账目前仅覆盖最小字段，不包含组织关系、联系方式、班次等扩展信息。
- shell 冒烟验证中 APIClient 需显式指定 HTTP_HOST=localhost，后续继续沿用。
- Order 模型的 planned_start/end、actual_start/end 当前为可空 DateTimeField，前端传入格式为文本框，后续可升级。
- 一个订单是否绝对不会同时分配到多条产线仍未确认；当前模型为单产线 FK。

### 下一个最优先任务

- 正式进入 M3：标准数据模型、缓存层与 mock 展示 API。
- 第一优先级把“最近一次成功数据兜底”机制落到后端缓存与展示接口，不接真实数据源。

## 16. 本轮更新记录

- 本轮继续停留在 M2 收尾阶段，根据表结构扩展需求完成以下调整，不进入 M3，不接真实数据源。
- backend：Device 模型新增 ip 字段（CharField, max_length=64），用于记录设备 IP 地址。
- backend：新增 ReservedFieldsMixin 抽象模型，提供 reserved_1 到 reserved_5 五个通用预留字段（CharField, max_length=255）。
- backend：以下 9 个业务模型均已继承 ReservedFieldsMixin，每张表新增 5 个预留字段：Area、ProductionLine、Device、Employee、CodeMapping、ScreenConfig、DisplayContentConfig、RuntimeParameterConfig、DataSourceConfig。
- backend：OperationLog 为系统日志表，不加预留字段。
- backend：所有序列化器已同步暴露 ip（仅 Device）和 reserved_1 ~ reserved_5 字段。
- backend：新增迁移文件 backoffice/migrations/0004。
- frontend：设备台账列表新增 IP 列，表单新增设备IP输入框。
- frontend：所有非只读资源的编辑表单均新增预留字段1~预留字段5输入框。
- 验证结果：14/14 后端测试通过；npm run build 通过。

## 17. 本轮更新记录

- 本轮完成 M2 最后收尾：补齐订单/物料主数据模型、独立页面模块开关模型，并通过正式 MySQL 全量冒烟回归。
- backend：新增 Material 物料台账模型（code、name、specification、unit、is_active、notes + 预留字段）。
- backend：新增 Order 订单台账模型（order_no、material FK、production_line FK、quantity、completed_quantity、unit、status、planned_start/end、actual_start/end、is_active、notes + 预留字段）。订单状态支持 planned / in_progress / completed / cancelled 四种。Material 和 ProductionLine 通过 PROTECT 外键保护。
- backend：新增 PageModuleSwitch 独立模型（screen_key、module_key、label、is_enabled、sort_order、notes + 预留字段），screen_key + module_key 联合唯一约束，取代 ScreenConfig.module_settings JSON 字段承担模块开关职责。
- backend：新增 `/api/admin/materials`、`/api/admin/orders`、`/api/admin/page-module-switches` 三套管理接口，纳入统一鉴权、响应结构和操作日志体系。
- backend：新增迁移文件 backoffice/migrations/0006_material_order_pagemoduleswitch。
- frontend：后台控制台"基础台账"分组新增"物料台账"和"订单台账"入口；"大屏配置"分组新增"页面模块开关"入口。
- 验证结果：27/27 后端测试通过（SQLite）；npm run build 通过。
- MySQL 冒烟回归：migrate 到正式 MySQL 后，20/20 冒烟检查全部通过（登录、me、区域、产线、设备、员工、物料、订单、编码映射、左右屏配置、页面模块开关、欢迎展示配置、运行参数配置、数据源配置、操作日志、健康检查）。
- 至此 M2 全部规划内容已完成，可以正式进入 M3。

