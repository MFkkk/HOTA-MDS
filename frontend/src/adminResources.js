export const OMIT_VALUE = Symbol("omit-value");

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
    fields: [
      { key: "code", label: "编码", type: "text", required: true, defaultValue: "" },
      { key: "name", label: "名称", type: "text", required: true, defaultValue: "" },
      { key: "parentId", label: "上级区域", type: "resourceSelect", resource: "areas", allowBlank: true, defaultValue: "" },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
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
    fields: [
      { key: "code", label: "编码", type: "text", required: true, defaultValue: "" },
      { key: "name", label: "名称", type: "text", required: true, defaultValue: "" },
      { key: "areaId", label: "所属区域", type: "resourceSelect", resource: "areas", allowBlank: true, defaultValue: "" },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
    ],
  },
  devices: {
    label: "设备台账",
    endpoint: "/api/admin/devices",
    itemLabel: "设备",
    columns: [
      { key: "code", label: "编码" },
      { key: "name", label: "名称" },
      { key: "areaName", label: "区域" },
      { key: "productionLineName", label: "产线" },
      { key: "defaultStatus", label: "默认状态" },
    ],
    fields: [
      { key: "code", label: "编码", type: "text", required: true, defaultValue: "" },
      { key: "name", label: "名称", type: "text", required: true, defaultValue: "" },
      { key: "areaId", label: "所属区域", type: "resourceSelect", resource: "areas", allowBlank: true, defaultValue: "" },
      { key: "productionLineId", label: "所属产线", type: "resourceSelect", resource: "productionLines", allowBlank: true, defaultValue: "" },
      {
        key: "defaultStatus",
        label: "默认状态",
        type: "select",
        required: true,
        defaultValue: "stopped",
        options: [
          { value: "running", label: "运行" },
          { value: "stopped", label: "停机" },
          { value: "alarm", label: "报警" },
          { value: "offline", label: "离线" },
        ],
      },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
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
    fields: [
      { key: "employeeNo", label: "员工号", type: "text", required: true, defaultValue: "" },
      { key: "name", label: "姓名", type: "text", required: true, defaultValue: "" },
      {
        key: "role",
        label: "角色",
        type: "select",
        required: true,
        defaultValue: "employee",
        options: [
          { value: "employee", label: "员工" },
          { value: "team_leader", label: "班组长" },
          { value: "supervisor", label: "主管" },
        ],
      },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
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
    fields: [
      {
        key: "entityType",
        label: "对象类型",
        type: "select",
        required: true,
        defaultValue: "device",
        options: [
          { value: "device", label: "设备" },
          { value: "production_line", label: "产线" },
          { value: "area", label: "区域" },
          { value: "order", label: "订单" },
          { value: "material", label: "物料" },
        ],
      },
      { key: "sourceSystem", label: "来源系统", type: "text", required: true, defaultValue: "" },
      { key: "internalCode", label: "内部编码", type: "text", required: true, defaultValue: "" },
      { key: "externalCode", label: "外部编码", type: "text", required: true, defaultValue: "" },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
      { key: "notes", label: "备注", type: "textarea", defaultValue: "" },
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
    fields: [
      {
        key: "screenKey",
        label: "屏幕",
        type: "select",
        required: true,
        defaultValue: "left",
        options: [
          { value: "left", label: "左屏" },
          { value: "right", label: "右屏" },
        ],
      },
      { key: "title", label: "标题", type: "text", required: true, defaultValue: "" },
      { key: "subtitle", label: "副标题", type: "text", defaultValue: "" },
      { key: "rotationIntervalSeconds", label: "轮播秒数", type: "integer", required: true, defaultValue: 60 },
      { key: "pageKeys", label: "页面键列表", type: "json", defaultValue: ["overview"] },
      { key: "moduleSettings", label: "模块开关", type: "json", defaultValue: {} },
      { key: "themeSettings", label: "主题配置", type: "json", defaultValue: {} },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
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
    fields: [
      { key: "configKey", label: "配置键", type: "text", required: true, defaultValue: "default" },
      { key: "companyName", label: "公司名称", type: "text", required: true, defaultValue: "" },
      { key: "welcomeMessage", label: "欢迎语", type: "text", required: true, defaultValue: "" },
      { key: "logoUrl", label: "Logo 地址", type: "text", defaultValue: "" },
      { key: "promoImageUrls", label: "宣传图片地址列表", type: "json", defaultValue: [] },
      { key: "isActive", label: "启用", type: "checkbox", defaultValue: true },
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
    fields: [
      { key: "code", label: "编码", type: "text", required: true, defaultValue: "" },
      { key: "name", label: "名称", type: "text", required: true, defaultValue: "" },
      {
        key: "sourceType",
        label: "数据源类型",
        type: "select",
        required: true,
        defaultValue: "custom",
        options: [
          { value: "opcua", label: "OPCUA" },
          { value: "modbus_tcp", label: "Modbus TCP" },
          { value: "sap_rfc", label: "SAP RFC" },
          { value: "schedule_db", label: "排产数据库" },
          { value: "energy_db", label: "能耗数据库" },
          { value: "wms", label: "WMS" },
          { value: "repair", label: "报修系统" },
          { value: "custom", label: "自定义" },
        ],
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
    ],
  },
  operationLogs: {
    label: "操作日志",
    endpoint: "/api/admin/operation-logs",
    itemLabel: "日志",
    readOnly: true,
    columns: [
      { key: "createdAt", label: "时间" },
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


export function formatCellValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
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
