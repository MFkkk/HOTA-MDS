export const OMIT_VALUE = Symbol("omit-value");

const RESERVED_FIELDS = [
  { key: "reserved1", label: "预留字段1", type: "text", defaultValue: "", hideInForm: true },
  { key: "reserved2", label: "预留字段2", type: "text", defaultValue: "", hideInForm: true },
  { key: "reserved3", label: "预留字段3", type: "text", defaultValue: "", hideInForm: true },
  { key: "reserved4", label: "预留字段4", type: "text", defaultValue: "", hideInForm: true },
  { key: "reserved5", label: "预留字段5", type: "text", defaultValue: "", hideInForm: true },
];

/** Keys always sent as empty strings on POST/PATCH; not shown in admin form. */
export const RESERVED_FIELD_KEYS = RESERVED_FIELDS.map((field) => field.key);

const DEVICE_STATUS_OPTIONS = [
  { value: "running", label: "运行" },
  { value: "stopped", label: "停机" },
  { value: "alarm", label: "报警" },
  { value: "offline", label: "离线" },
];

const ACTIVE_STATUS_OPTIONS = [
  { value: "true", label: "启用" },
  { value: "false", label: "停用" },
];

const EMPLOYEE_ROLE_OPTIONS = [
  { value: "employee", label: "员工" },
  { value: "team_leader", label: "班组长" },
  { value: "supervisor", label: "主管" },
];

const ORDER_STATUS_OPTIONS = [
  { value: "planned", label: "计划" },
  { value: "in_progress", label: "生产中" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
];

const SCREEN_KEY_OPTIONS = [
  { value: "left", label: "左屏" },
  { value: "right", label: "右屏" },
];

const ENTITY_TYPE_OPTIONS = [
  { value: "device", label: "设备" },
  { value: "production_line", label: "产线" },
  { value: "area", label: "区域" },
  { value: "order", label: "订单" },
  { value: "material", label: "物料" },
];

const DATA_SOURCE_TYPE_OPTIONS = [
  { value: "opcua", label: "OPCUA" },
  { value: "modbus_tcp", label: "Modbus TCP" },
  { value: "sap_rfc", label: "SAP RFC" },
  { value: "schedule_db", label: "排产数据库" },
  { value: "energy_db", label: "能耗数据库" },
  { value: "wms", label: "WMS" },
  { value: "repair", label: "报修系统" },
  { value: "custom", label: "自定义" },
];

/** 后台侧栏一级分组与二级资源键（顺序即展示顺序）。 */
export const ADMIN_MENU_GROUPS = [
  {
    id: "basic",
    label: "基础台账",
    items: ["devices", "productionLines", "areas", "employees", "materials", "orders"],
  },
  {
    id: "screen",
    label: "大屏配置",
    items: ["screenConfigs", "pageModuleSwitches", "displayContentConfigs", "runtimeParameterConfigs"],
  },
  {
    id: "system",
    label: "系统设置",
    items: ["codeMappings", "dataSourceConfigs", "operationLogs"],
  },
];

export const DEFAULT_ADMIN_RESOURCE = "devices";

export const resourceDefinitions = {
  areas: {
    label: "区域台账",
    endpoint: "/api/admin/areas",
    itemLabel: "区域",
    columns: [
      { key: "code", label: "编码" },
      { key: "name", label: "名称" },
      { key: "parentName", label: "上级区域" },
      { key: "isActive", label: "启用" },
    ],
    queryFields: [
      { key: "keyword", label: "关键字", type: "text", placeholder: "编码/名称/备注" },
      { key: "is_active", label: "启用状态", type: "select", options: ACTIVE_STATUS_OPTIONS },
      { key: "parent_id", label: "上级区域", type: "resourceSelect", resource: "areas", allowBlank: true },
      { key: "created_at_start", label: "创建开始", type: "date" },
      { key: "created_at_end", label: "创建结束", type: "date" },
    ],
    fields: [
      { key: "code", label: "编码", type: "text", required: true, defaultValue: "" },
      { key: "name", label: "名称", type: "text", required: true, defaultValue: "" },
      { key: "parentId", label: "上级区域", type: "resourceSelect", resource: "areas", allowBlank: true, defaultValue: "" },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
      ...RESERVED_FIELDS,
    ],
  },
  productionLines: {
    label: "产线台账",
    endpoint: "/api/admin/production-lines",
    itemLabel: "产线",
    columns: [
      { key: "code", label: "编码" },
      { key: "name", label: "名称" },
      { key: "areaName", label: "所属区域" },
      { key: "isActive", label: "启用" },
    ],
    queryFields: [
      { key: "keyword", label: "关键字", type: "text", placeholder: "编码/名称/区域/备注" },
      { key: "is_active", label: "启用状态", type: "select", options: ACTIVE_STATUS_OPTIONS },
      { key: "area_id", label: "所属区域", type: "resourceSelect", resource: "areas", allowBlank: true },
      { key: "created_at_start", label: "创建开始", type: "date" },
      { key: "created_at_end", label: "创建结束", type: "date" },
    ],
    fields: [
      { key: "code", label: "编码", type: "text", required: true, defaultValue: "" },
      { key: "name", label: "名称", type: "text", required: true, defaultValue: "" },
      { key: "areaId", label: "所属区域", type: "resourceSelect", resource: "areas", allowBlank: true, defaultValue: "" },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
      ...RESERVED_FIELDS,
    ],
  },
  devices: {
    label: "设备台账",
    endpoint: "/api/admin/devices",
    itemLabel: "设备",
    columns: [
      { key: "code", label: "编码" },
      { key: "name", label: "名称" },
      { key: "ip", label: "IP" },
      { key: "areaName", label: "区域" },
      { key: "productionLineName", label: "产线" },
      { key: "defaultStatus", label: "状态", options: DEVICE_STATUS_OPTIONS },
    ],
    queryFields: [
      { key: "keyword", label: "关键字", type: "text", placeholder: "编码/名称/IP/区域/产线" },
      { key: "default_status", label: "状态", type: "select", options: DEVICE_STATUS_OPTIONS },
      { key: "is_active", label: "启用状态", type: "select", options: ACTIVE_STATUS_OPTIONS },
      { key: "area_id", label: "区域", type: "resourceSelect", resource: "areas", allowBlank: true },
      { key: "production_line_id", label: "产线", type: "resourceSelect", resource: "productionLines", allowBlank: true },
      { key: "created_at_start", label: "创建开始", type: "date" },
      { key: "created_at_end", label: "创建结束", type: "date" },
    ],
    fields: [
      { key: "code", label: "编码", type: "text", required: true, defaultValue: "" },
      { key: "name", label: "名称", type: "text", required: true, defaultValue: "" },
      { key: "ip", label: "设备IP", type: "text", defaultValue: "" },
      { key: "areaId", label: "所属区域", type: "resourceSelect", resource: "areas", allowBlank: true, defaultValue: "" },
      { key: "productionLineId", label: "所属产线", type: "resourceSelect", resource: "productionLines", allowBlank: true, defaultValue: "" },
      {
        key: "defaultStatus",
        label: "状态",
        type: "select",
        required: true,
        defaultValue: "stopped",
        options: DEVICE_STATUS_OPTIONS,
      },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
      ...RESERVED_FIELDS,
    ],
  },
  employees: {
    label: "员工台账",
    endpoint: "/api/admin/employees",
    itemLabel: "员工",
    columns: [
      { key: "employeeNo", label: "员工号" },
      { key: "name", label: "姓名" },
      { key: "roleLabel", label: "角色" },
      { key: "isActive", label: "启用" },
    ],
    queryFields: [
      { key: "keyword", label: "关键字", type: "text", placeholder: "工号/姓名/备注" },
      { key: "role", label: "角色", type: "select", options: EMPLOYEE_ROLE_OPTIONS },
      { key: "is_active", label: "启用状态", type: "select", options: ACTIVE_STATUS_OPTIONS },
      { key: "created_at_start", label: "创建开始", type: "date" },
      { key: "created_at_end", label: "创建结束", type: "date" },
    ],
    fields: [
      { key: "employeeNo", label: "员工号", type: "text", required: true, defaultValue: "" },
      { key: "name", label: "姓名", type: "text", required: true, defaultValue: "" },
      {
        key: "role",
        label: "角色",
        type: "select",
        required: true,
        defaultValue: "employee",
        options: EMPLOYEE_ROLE_OPTIONS,
      },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
      ...RESERVED_FIELDS,
    ],
  },
  materials: {
    label: "物料台账",
    endpoint: "/api/admin/materials",
    itemLabel: "物料",
    columns: [
      { key: "code", label: "编码" },
      { key: "name", label: "名称" },
      { key: "specification", label: "规格" },
      { key: "unit", label: "单位" },
      { key: "isActive", label: "启用" },
    ],
    queryFields: [
      { key: "keyword", label: "关键字", type: "text", placeholder: "编码/名称/规格/备注" },
      { key: "is_active", label: "启用状态", type: "select", options: ACTIVE_STATUS_OPTIONS },
      { key: "created_at_start", label: "创建开始", type: "date" },
      { key: "created_at_end", label: "创建结束", type: "date" },
    ],
    fields: [
      { key: "code", label: "编码", type: "text", required: true, defaultValue: "" },
      { key: "name", label: "名称", type: "text", required: true, defaultValue: "" },
      { key: "specification", label: "规格", type: "text", defaultValue: "" },
      { key: "unit", label: "单位", type: "text", defaultValue: "" },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
      ...RESERVED_FIELDS,
    ],
  },
  orders: {
    label: "订单台账",
    endpoint: "/api/admin/orders",
    itemLabel: "订单",
    columns: [
      { key: "orderNo", label: "订单号" },
      { key: "materialName", label: "物料" },
      { key: "productionLineName", label: "产线" },
      { key: "quantity", label: "计划数量" },
      { key: "completedQuantity", label: "完成数量" },
      { key: "statusLabel", label: "状态" },
    ],
    queryFields: [
      { key: "keyword", label: "关键字", type: "text", placeholder: "订单号/物料/产线/备注" },
      { key: "status", label: "状态", type: "select", options: ORDER_STATUS_OPTIONS },
      { key: "is_active", label: "启用状态", type: "select", options: ACTIVE_STATUS_OPTIONS },
      { key: "material_id", label: "物料", type: "resourceSelect", resource: "materials", allowBlank: true },
      { key: "production_line_id", label: "产线", type: "resourceSelect", resource: "productionLines", allowBlank: true },
      { key: "created_at_start", label: "创建开始", type: "date" },
      { key: "created_at_end", label: "创建结束", type: "date" },
    ],
    fields: [
      { key: "orderNo", label: "订单号", type: "text", required: true, defaultValue: "" },
      { key: "materialId", label: "物料", type: "resourceSelect", resource: "materials", allowBlank: true, defaultValue: "" },
      { key: "productionLineId", label: "产线", type: "resourceSelect", resource: "productionLines", allowBlank: true, defaultValue: "" },
      { key: "quantity", label: "计划数量", type: "decimal", required: true, defaultValue: "0.00" },
      { key: "completedQuantity", label: "完成数量", type: "decimal", defaultValue: "0.00" },
      { key: "unit", label: "单位", type: "text", defaultValue: "" },
      {
        key: "status",
        label: "状态",
        type: "select",
        required: true,
        defaultValue: "planned",
        options: ORDER_STATUS_OPTIONS,
      },
      { key: "plannedStart", label: "计划开始", type: "text", defaultValue: "", placeholder: "YYYY-MM-DD HH:MM:SS" },
      { key: "plannedEnd", label: "计划结束", type: "text", defaultValue: "", placeholder: "YYYY-MM-DD HH:MM:SS" },
      { key: "actualStart", label: "实际开始", type: "text", defaultValue: "", placeholder: "YYYY-MM-DD HH:MM:SS" },
      { key: "actualEnd", label: "实际结束", type: "text", defaultValue: "", placeholder: "YYYY-MM-DD HH:MM:SS" },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
      ...RESERVED_FIELDS,
    ],
  },
  codeMappings: {
    label: "编码映射",
    endpoint: "/api/admin/code-mappings",
    itemLabel: "编码映射",
    columns: [
      { key: "entityType", label: "对象类型" },
      { key: "sourceSystem", label: "来源系统" },
      { key: "internalCode", label: "内部编码" },
      { key: "externalCode", label: "外部编码" },
    ],
    queryFields: [
      { key: "keyword", label: "关键字", type: "text", placeholder: "来源系统/内外编码/备注" },
      { key: "entity_type", label: "对象类型", type: "select", options: ENTITY_TYPE_OPTIONS },
      { key: "is_active", label: "启用状态", type: "select", options: ACTIVE_STATUS_OPTIONS },
      { key: "created_at_start", label: "创建开始", type: "date" },
      { key: "created_at_end", label: "创建结束", type: "date" },
    ],
    fields: [
      {
        key: "entityType",
        label: "对象类型",
        type: "select",
        required: true,
        defaultValue: "device",
        options: ENTITY_TYPE_OPTIONS,
      },
      { key: "sourceSystem", label: "来源系统", type: "text", required: true, defaultValue: "" },
      { key: "internalCode", label: "内部编码", type: "text", required: true, defaultValue: "" },
      { key: "externalCode", label: "外部编码", type: "text", required: true, defaultValue: "" },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
      ...RESERVED_FIELDS,
    ],
  },
  screenConfigs: {
    label: "左右屏配置",
    endpoint: "/api/admin/screen-configs",
    itemLabel: "屏幕配置",
    columns: [
      { key: "screenKey", label: "屏幕" },
      { key: "title", label: "标题" },
      { key: "rotationIntervalSeconds", label: "轮播秒数" },
      { key: "isActive", label: "启用" },
    ],
    queryFields: [
      { key: "keyword", label: "关键字", type: "text", placeholder: "屏幕键/标题/副标题" },
      { key: "screen_key", label: "屏幕", type: "select", options: SCREEN_KEY_OPTIONS },
      { key: "is_active", label: "启用状态", type: "select", options: ACTIVE_STATUS_OPTIONS },
    ],
    fields: [
      {
        key: "screenKey",
        label: "屏幕",
        type: "select",
        required: true,
        defaultValue: "left",
        options: SCREEN_KEY_OPTIONS,
      },
      { key: "title", label: "标题", type: "text", required: true, defaultValue: "" },
      { key: "subtitle", label: "副标题", type: "text", defaultValue: "" },
      { key: "rotationIntervalSeconds", label: "轮播秒数", type: "integer", required: true, defaultValue: 60 },
      { key: "pageKeys", label: "页面键列表", type: "json", defaultValue: ["overview"] },
      { key: "moduleSettings", label: "模块开关", type: "json", defaultValue: {} },
      { key: "themeSettings", label: "主题配置", type: "json", defaultValue: {} },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      ...RESERVED_FIELDS,
    ],
  },
  pageModuleSwitches: {
    label: "页面模块开关",
    endpoint: "/api/admin/page-module-switches",
    itemLabel: "模块开关",
    columns: [
      { key: "screenKey", label: "屏幕", options: SCREEN_KEY_OPTIONS },
      { key: "moduleKey", label: "模块标识" },
      { key: "label", label: "模块名称" },
      { key: "sortOrder", label: "排序" },
      { key: "isEnabled", label: "启用" },
    ],
    queryFields: [
      { key: "keyword", label: "关键字", type: "text", placeholder: "模块标识/名称/备注" },
      { key: "screen_key", label: "屏幕", type: "select", options: SCREEN_KEY_OPTIONS },
      { key: "is_enabled", label: "启用状态", type: "select", options: ACTIVE_STATUS_OPTIONS },
    ],
    fields: [
      {
        key: "screenKey",
        label: "屏幕",
        type: "select",
        required: true,
        defaultValue: "left",
        options: SCREEN_KEY_OPTIONS,
      },
      { key: "moduleKey", label: "模块标识", type: "text", required: true, defaultValue: "" },
      { key: "label", label: "模块名称", type: "text", required: true, defaultValue: "" },
      { key: "isEnabled", label: "启用", type: "checkbox", defaultValue: true },
      { key: "sortOrder", label: "排序", type: "integer", required: true, defaultValue: 0 },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
      ...RESERVED_FIELDS,
    ],
  },
  displayContentConfigs: {
    label: "欢迎展示配置",
    endpoint: "/api/admin/display-content-configs",
    itemLabel: "展示内容配置",
    columns: [
      { key: "configKey", label: "配置键" },
      { key: "companyName", label: "公司名称" },
      { key: "welcomeMessage", label: "欢迎语" },
      { key: "isActive", label: "启用" },
    ],
    queryFields: [
      { key: "keyword", label: "关键字", type: "text", placeholder: "配置键/公司名/欢迎语" },
      { key: "is_active", label: "启用状态", type: "select", options: ACTIVE_STATUS_OPTIONS },
      { key: "created_at_start", label: "创建开始", type: "date" },
      { key: "created_at_end", label: "创建结束", type: "date" },
    ],
    fields: [
      { key: "configKey", label: "配置键", type: "text", required: true, defaultValue: "default" },
      { key: "companyName", label: "公司名称", type: "text", required: true, defaultValue: "" },
      { key: "welcomeMessage", label: "欢迎语", type: "text", required: true, defaultValue: "" },
      { key: "logoUrl", label: "Logo 地址", type: "text", defaultValue: "" },
      { key: "promoImageUrls", label: "宣传图片地址列表", type: "json", defaultValue: [] },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      ...RESERVED_FIELDS,
    ],
  },
  runtimeParameterConfigs: {
    label: "运行参数配置",
    endpoint: "/api/admin/runtime-parameter-configs",
    itemLabel: "运行参数",
    columns: [
      { key: "configKey", label: "配置键" },
      { key: "singleDayEffectiveWorkHours", label: "日有效工时" },
      { key: "defaultStandardCapacityPerHour", label: "标准产能/小时" },
      { key: "ganttWindowDays", label: "甘特窗口天数" },
    ],
    queryFields: [
      { key: "keyword", label: "关键字", type: "text", placeholder: "配置键/备注" },
      { key: "is_active", label: "启用状态", type: "select", options: ACTIVE_STATUS_OPTIONS },
    ],
    fields: [
      { key: "configKey", label: "配置键", type: "text", required: true, defaultValue: "default" },
      { key: "singleDayEffectiveWorkHours", label: "单日有效工作时长", type: "decimal", required: true, defaultValue: "16.00" },
      { key: "defaultStandardCapacityPerHour", label: "默认标准产能/小时", type: "decimal", required: true, defaultValue: "0.00" },
      { key: "delayWarningBufferHours", label: "延期预警缓冲小时", type: "decimal", required: true, defaultValue: "0.00" },
      { key: "ganttWindowDays", label: "甘特窗口天数", type: "integer", required: true, defaultValue: 30 },
      { key: "autoScrollEnabled", label: "启用自动滚动", type: "checkbox", defaultValue: true },
      { key: "autoScrollRowsThreshold", label: "自动滚动行数阈值", type: "integer", required: true, defaultValue: 10 },
      { key: "recentCapacityWindowHours", label: "最近产能窗口小时", type: "integer", required: true, defaultValue: 2 },
      { key: "productionTrendWindowHours", label: "产量趋势窗口小时", type: "integer", required: true, defaultValue: 8 },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      ...RESERVED_FIELDS,
    ],
  },
  dataSourceConfigs: {
    label: "数据源配置",
    endpoint: "/api/admin/data-source-configs",
    itemLabel: "数据源",
    columns: [
      { key: "code", label: "编码" },
      { key: "name", label: "名称" },
      { key: "sourceType", label: "类型" },
      { key: "secretSummary", label: "密钥保护" },
    ],
    queryFields: [
      { key: "keyword", label: "关键字", type: "text", placeholder: "编码/名称/备注" },
      { key: "source_type", label: "类型", type: "select", options: DATA_SOURCE_TYPE_OPTIONS },
      { key: "is_enabled", label: "启用状态", type: "select", options: ACTIVE_STATUS_OPTIONS },
      { key: "created_at_start", label: "创建开始", type: "date" },
      { key: "created_at_end", label: "创建结束", type: "date" },
    ],
    fields: [
      { key: "code", label: "编码", type: "text", required: true, defaultValue: "" },
      { key: "name", label: "名称", type: "text", required: true, defaultValue: "" },
      {
        key: "sourceType",
        label: "数据源类型",
        type: "select",
        required: true,
        defaultValue: "custom",
        options: DATA_SOURCE_TYPE_OPTIONS,
      },
      { key: "isEnabled", label: "启用", type: "checkbox", defaultValue: true },
      { key: "refreshIntervalSeconds", label: "刷新秒数", type: "integer", required: true, defaultValue: 300 },
      { key: "timeoutSeconds", label: "超时秒数", type: "integer", required: true, defaultValue: 30 },
      { key: "connectionConfig", label: "连接配置", type: "json", defaultValue: {} },
      {
        key: "secretConfig",
        label: "密钥配置",
        type: "json",
        defaultValue: {},
        omitIfBlank: true,
        placeholder: '{\n  "storageType": "env_ref",\n  "envMapping": {\n    "password": "SAP_MAIN_PASSWORD"\n  }\n}',
      },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
      ...RESERVED_FIELDS,
    ],
  },
  operationLogs: {
    label: "操作日志",
    endpoint: "/api/admin/operation-logs",
    itemLabel: "日志",
    readOnly: true,
    columns: [
      { key: "createdAt", label: "时间", cellFormat: "cstDateTime" },
      { key: "actorUsername", label: "管理员" },
      { key: "action", label: "动作" },
      { key: "targetType", label: "对象类型" },
      { key: "targetLabel", label: "对象" },
    ],
    fields: [],
  },
};


export function stringifyJson(value) {
  return JSON.stringify(value, null, 2);
}


export function createEmptyForm(resourceDefinition) {
  const nextState = {};
  for (const field of resourceDefinition.fields) {
    if (field.type === "json") {
      const rawDefault = field.defaultValue ?? {};
      nextState[field.key] = Object.keys(rawDefault).length === 0 && field.omitIfBlank ? "" : stringifyJson(rawDefault);
    } else if (field.type === "checkbox") {
      nextState[field.key] = Boolean(field.defaultValue);
    } else {
      nextState[field.key] = field.defaultValue ?? "";
    }
  }
  return nextState;
}


export function createEmptyQuery(resourceDefinition) {
  const nextState = {};
  for (const field of resourceDefinition.queryFields ?? []) {
    nextState[field.key] = "";
  }
  return nextState;
}


export function createFormFromItem(resourceDefinition, item) {
  const nextState = {};
  for (const field of resourceDefinition.fields) {
    const value = item?.[field.key];
    if (field.type === "json") {
      if (value === undefined && field.omitIfBlank) {
        nextState[field.key] = "";
      } else {
        nextState[field.key] = stringifyJson(value ?? field.defaultValue ?? {});
      }
    } else if (field.type === "checkbox") {
      nextState[field.key] = Boolean(value);
    } else if (value === null || value === undefined) {
      nextState[field.key] = field.defaultValue ?? "";
    } else {
      nextState[field.key] = value;
    }
  }
  return nextState;
}


export function parseFieldValue(field, rawValue) {
  if (field.type === "checkbox") {
    return Boolean(rawValue);
  }
  if (field.type === "integer") {
    return rawValue === "" ? null : Number.parseInt(rawValue, 10);
  }
  if (field.type === "decimal") {
    return rawValue === "" ? null : String(rawValue);
  }
  if (field.type === "resourceSelect") {
    return rawValue === "" ? null : Number(rawValue);
  }
  if (field.type === "json") {
    if (rawValue === "" && field.omitIfBlank) {
      return OMIT_VALUE;
    }
    if (rawValue === "") {
      return field.defaultValue ?? {};
    }
    return JSON.parse(rawValue);
  }
  return rawValue;
}


function formatCstDateTime(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map = {};
  for (const { type, value: partValue } of parts) {
    if (type !== "literal") {
      map[type] = partValue;
    }
  }
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
}


export function formatCellValue(value, column) {
  if (column?.cellFormat === "cstDateTime") {
    return formatCstDateTime(value);
  }
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  if (Array.isArray(column?.options)) {
    const hit = column.options.find((opt) => opt.value === value);
    if (hit) {
      return hit.label;
    }
  }
  if (typeof value === "boolean") {
    return value ? "是" : "否";
  }
  if (typeof value === "object") {
    if (value.storageType) {
      return `${value.storageType}${value.hasEncryptedSecret ? " / 已有密文" : ""}`;
    }
    return stringifyJson(value);
  }
  return String(value);
}
