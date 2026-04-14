# 和泰智造数屏系统

首先阅读DOCS_OVERVIEW.md！

一期前段目标是建设面向外部参观的左右双屏大屏。当前代码状态已完成 `M1` 工程骨架，并已落地 `M2` 最小后台能力，用于管理员维护基础台账与配置；尚未进入真实数据源接入，也尚未进入左右屏展示联调。

## 当前状态

当前已完成：

- 管理员登录
- 区域台账管理
- 产线台账管理
- 设备台账管理
- 员工台账管理
- 编码映射管理
- 左右屏配置管理
- 欢迎展示配置管理
- 运行参数配置管理
- 数据源配置管理
- 基础操作日志
- 最小后台前端界面：`/admin/login`、`/admin/console`

当前未完成：

- 真实外部系统接入
- 标准化缓存模型与 mock 展示 API
- 左右屏正式展示链路
- 报修
- 3D 仿真
- 内部 Web 报表

## 技术栈

| 模块 | 技术 |
| --- | --- |
| backend | Django + Django REST Framework |
| frontend | React + Vite |
| collector | Python 独立服务目录 |
| database | MySQL |
| deploy | Docker Compose |
| target runtime | Ubuntu |

## 关键约束

- 一期前段只做外部参观双屏大屏，不做内部 Web 报表。
- 报修与 3D 仿真不是一期前段阻塞项。
- 前端不得直连外部系统。
- 后端负责定时拉取、标准化、缓存并对前端提供 API。
- 数据源异常时，大屏必须显示最近一次成功数据，不允许白屏。
- 一期后台只做管理员权限，不做复杂 RBAC。
- 敏感连接信息不得写死在代码中。

## 本地启动

1. 准备环境变量

```bash
cp .env.example .env
```

2. 使用 Docker Compose 启动

```bash
docker compose up --build
```

3. 访问基础路由

| 路由 | 说明 |
| --- | --- |
| `http://localhost:8000/api/health` | 后端健康检查 |
| `http://localhost:3000/screen/left` | 左屏占位页 |
| `http://localhost:3000/screen/right` | 右屏占位页 |
| `http://localhost:3000/admin/login` | 后台登录页 |
| `http://localhost:3000/admin/console` | 后台控制台 |

## 本地开发

### 后端

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

说明：

- 前端开发环境通过 Vite 代理访问本地 backend 的 `/api`。
- 项目正式约束仍是 MySQL；`hota_mds.test_settings` 仅用于本地测试与验证。

## 验证命令

### Docker 基础验证

```bash
docker compose config
docker compose up --build
curl http://localhost:8000/api/health
```

### 后端测试验证

```bash
cd backend
python -m compileall .
python manage.py test accounts backoffice --settings=hota_mds.test_settings
python manage.py migrate --settings=hota_mds.test_settings
```

### 前端构建验证

```bash
cd frontend
npm run build
```

## 当前后台能力

当前后台接口前缀为 `/api/admin/`，已覆盖以下资源：

- `auth/login`
- `auth/me`
- `areas`
- `production-lines`
- `devices`
- `employees`
- `code-mappings`
- `screen-configs`
- `display-content-configs`
- `runtime-parameter-configs`
- `data-source-configs`
- `operation-logs`

## 文档入口

开始继续开发前，应先阅读以下文件：

1. `需求文档/PRD_和泰智屏系统.md`
2. `docs/SPEC.md`
3. `docs/PLAN.md`
4. `docs/STATUS.md`
5. `docs/HANDOFF.md`
6. `docs/AGENTS.md`

补充文档：

- `docs/API_CONTRACT.md`
- `docs/DB_MODEL_DRAFT.md`
- `docs/DECISIONS.md`
- `DOCS_OVERVIEW.md`
