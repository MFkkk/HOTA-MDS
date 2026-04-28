import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiRequest } from "./adminApi.js";
import { humanizeAdminApiError, humanizeJsonFieldSyntaxError } from "./adminUserFacingMessages.js";
import {
  ADMIN_MENU_GROUPS,
  createEmptyForm,
  createEmptyQuery,
  createFormFromItem,
  DEFAULT_ADMIN_RESOURCE,
  formatCellValue,
  OMIT_VALUE,
  parseFieldValue,
  RESERVED_FIELD_KEYS,
  resourceDefinitions,
  SCREEN_PAGE_KEY_OPTIONS,
  stringifyJson,
} from "./adminResources.js";

const ADMIN_TOAST_MS = 5000;
const ACTIVE_RESOURCE_STORAGE_PREFIX = "hota-mds-admin-active-resource";

function buildActiveResourceStorageKey(username) {
  return `${ACTIVE_RESOURCE_STORAGE_PREFIX}:${username || "anonymous"}`;
}

function pickValidResource(resourceKey) {
  return resourceDefinitions[resourceKey] ? resourceKey : DEFAULT_ADMIN_RESOURCE;
}

function httpErrorToastVariant(status) {
  if (status === 403 || status === 404) {
    return "warning";
  }
  return "error";
}

function ThemeIcon({ theme }) {
  if (theme === "light") {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
    </svg>
  );
}

function SubmenuChevron({ expanded }) {
  return (
    <svg className={`submenu-chevron${expanded ? " expanded" : ""}`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ResourceSidebar({ activeResource, onChange, theme, onToggleTheme }) {
  const initialExpanded = useMemo(() => {
    const set = new Set();
    for (const group of ADMIN_MENU_GROUPS) {
      for (const item of group.items) {
        if (item && typeof item === "object" && item.kind === "submenu") {
          if (item.children?.includes(activeResource)) {
            set.add(item.id);
          }
        }
      }
    }
    return set;
  }, [activeResource]);

  const [expandedSubmenus, setExpandedSubmenus] = useState(initialExpanded);

  function toggleSubmenu(submenuId) {
    setExpandedSubmenus((prev) => {
      const next = new Set(prev);
      if (next.has(submenuId)) {
        next.delete(submenuId);
      } else {
        next.add(submenuId);
      }
      return next;
    });
  }

  function renderResourceTab(resourceKey, extraClass = "") {
    const resourceDefinition = resourceDefinitions[resourceKey];
    if (!resourceDefinition) {
      return null;
    }
    return (
      <button
        className={`resource-tab${activeResource === resourceKey ? " active" : ""}${extraClass ? ` ${extraClass}` : ""}`}
        key={resourceKey}
        onClick={() => onChange(resourceKey)}
        type="button"
      >
        {resourceDefinition.label}
      </button>
    );
  }

  return (
    <nav className="resource-nav" aria-label="后台资源">
      {ADMIN_MENU_GROUPS.map((group) => (
        <div className="resource-nav-group" key={group.id}>
          <div className="resource-nav-group-title" id={`nav-group-${group.id}`}>
            {group.label}
          </div>
          <div
            aria-labelledby={`nav-group-${group.id}`}
            className="resource-nav-group-items"
            role="group"
          >
            {group.items.map((item) => {
              if (typeof item === "string") {
                return renderResourceTab(item);
              }
              if (item && item.kind === "submenu") {
                const expanded = expandedSubmenus.has(item.id);
                const hasActiveChild = item.children?.includes(activeResource);
                return (
                  <div className="resource-submenu" key={item.id}>
                    <button
                      type="button"
                      className={`resource-tab resource-submenu-toggle${hasActiveChild ? " active-parent" : ""}`}
                      aria-expanded={expanded}
                      onClick={() => toggleSubmenu(item.id)}
                    >
                      <span>{item.label}</span>
                      <SubmenuChevron expanded={expanded} />
                    </button>
                    {expanded ? (
                      <div className="resource-submenu-children">
                        {item.children.map((childKey) => renderResourceTab(childKey, "resource-tab--child"))}
                      </div>
                    ) : null}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      ))}
      <div className="nav-footer">
        <button className="theme-toggle" onClick={onToggleTheme} type="button">
          <ThemeIcon theme={theme} />
          <span>{theme === "dark" ? "切换明亮主题" : "切换暗色主题"}</span>
        </button>
      </div>
    </nav>
  );
}


function ResourceTable({
  resourceDefinition,
  items,
  selectedId,
  onSelect,
  checkedIds,
  onToggleCheck,
  onToggleCheckAll,
  onEditRow,
  onDeleteRow,
  onShowHistory,
  onTestRowConnection,
  isTestingConnection,
}) {
  const showCheckbox = !resourceDefinition.readOnly;
  const showActions = Boolean(resourceDefinition.useModalForm);
  const showTestConnectionAction = Boolean(resourceDefinition.supportsTestConnection);
  const showHistoryColumn = Boolean(resourceDefinition.supportsHistory);
  const isDataSourceTable = Boolean(resourceDefinition.fixedSourceType);
  const allChecked = items.length > 0 && items.every((item) => checkedIds.has(item.id));
  const someChecked = items.some((item) => checkedIds.has(item.id));
  const totalColumns =
    resourceDefinition.columns.length +
    (showCheckbox ? 1 : 0) +
    (showHistoryColumn ? 1 : 0) +
    (showActions ? 1 : 0);

  return (
    <div className="table-wrap">
      <table className={`data-table${isDataSourceTable ? " data-table--datasource" : ""}`}>
        <thead>
          <tr>
            {showCheckbox ? (
              <th className="col-checkbox">
                <input
                  aria-label="全选"
                  checked={allChecked}
                  onChange={() => onToggleCheckAll(items)}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked && !allChecked;
                  }}
                  type="checkbox"
                />
              </th>
            ) : null}
            {resourceDefinition.columns.map((column) => (
              <th className={`col-${column.key}`} key={column.key}>{column.label}</th>
            ))}
            {showHistoryColumn ? <th className="col-history">历史数据</th> : null}
            {showActions ? <th className="col-actions">操作</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td className="empty-row" colSpan={totalColumns || 1}>
                还没有数据
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr
                className={selectedId === item.id ? "selected" : ""}
                key={item.id}
                onClick={() => onSelect(item)}
              >
                {showCheckbox ? (
                  <td className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                    <input
                      aria-label={`选择 ${item.id}`}
                      checked={checkedIds.has(item.id)}
                      onChange={() => onToggleCheck(item.id)}
                      type="checkbox"
                    />
                  </td>
                ) : null}
                {resourceDefinition.columns.map((column) => (
                  <td className={`col-${column.key}`} key={column.key}>{formatCellValue(item[column.key], column)}</td>
                ))}
                {showHistoryColumn ? (
                  <td className="col-history" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="row-action-button row-action-link"
                      onClick={() => onShowHistory(item)}
                      type="button"
                    >
                      查看历史
                    </button>
                  </td>
                ) : null}
                {showActions ? (
                  <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                    <div className="row-action-group">
                      {showTestConnectionAction ? (
                        <button
                          className="row-action-button row-action-link"
                          disabled={isTestingConnection}
                          onClick={() => onTestRowConnection(item)}
                          type="button"
                        >
                          测试连接
                        </button>
                      ) : null}
                      <button
                        className="row-action-button"
                        onClick={() => onEditRow(item)}
                        type="button"
                      >
                        编辑
                      </button>
                      <button
                        className="row-action-button row-action-danger"
                        onClick={() => onDeleteRow(item)}
                        type="button"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ResourcePagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div aria-label="分页" className="table-pagination" role="navigation">
      <div className="table-pagination-meta">
        共 {total} 条，当前第 {page}/{totalPages} 页
      </div>
      <div className="table-pagination-actions">
        <label className="table-page-size">
          每页
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          条
        </label>
        <button disabled={!canPrev} onClick={() => onPageChange(page - 1)} type="button">
          上一页
        </button>
        <button disabled={!canNext} onClick={() => onPageChange(page + 1)} type="button">
          下一页
        </button>
      </div>
    </div>
  );
}


function parseScreenPageTargetKeys(rawJson, validKeys, screenKey) {
  let parsed = [];
  try {
    const p = JSON.parse(rawJson || "[]");
    parsed = Array.isArray(p) ? p.filter((k) => typeof k === "string") : [];
  } catch {
    parsed = [];
  }
  const filtered = parsed.filter((k) => validKeys.includes(k));
  if (filtered.length > 0) {
    return filtered;
  }
  return screenKey === "right" ? ["schedule"] : ["overview"];
}

function ScreenPageTransferField({ field, formState, setFormState }) {
  const screenKeyField = field.screenKeyField ?? "screenKey";
  const screenKey = formState[screenKeyField] || "left";
  const options = SCREEN_PAGE_KEY_OPTIONS[screenKey] || {};
  const validKeys = Object.keys(options);

  const targetKeys = parseScreenPageTargetKeys(formState[field.key], validKeys, screenKey);
  const sourceKeys = validKeys.filter((k) => !targetKeys.includes(k));

  const [pickedSource, setPickedSource] = useState(() => new Set());
  const [pickedTarget, setPickedTarget] = useState(() => new Set());

  useEffect(() => {
    const normalized = parseScreenPageTargetKeys(formState[field.key], validKeys, screenKey);
    let currentParsed = [];
    try {
      const p = JSON.parse(formState[field.key] || "[]");
      currentParsed = Array.isArray(p) ? p.filter((x) => typeof x === "string") : [];
    } catch {
      currentParsed = [];
    }
    if (JSON.stringify(normalized) !== JSON.stringify(currentParsed)) {
      setFormState((current) => ({
        ...current,
        [field.key]: stringifyJson(normalized),
      }));
    }
  }, [screenKey, validKeys.join(","), field.key, formState[field.key], setFormState]);

  useEffect(() => {
    setPickedSource(new Set());
    setPickedTarget(new Set());
  }, [screenKey]);

  function commitTargetKeys(nextKeys) {
    setFormState((current) => ({
      ...current,
      [field.key]: stringifyJson(nextKeys),
    }));
    setPickedSource(new Set());
    setPickedTarget(new Set());
  }

  function moveToTarget() {
    if (pickedSource.size === 0) {
      return;
    }
    const toAdd = validKeys.filter((k) => pickedSource.has(k));
    commitTargetKeys([...targetKeys, ...toAdd]);
  }

  function moveToSource() {
    if (pickedTarget.size === 0) {
      return;
    }
    const remove = new Set([...pickedTarget]);
    const next = targetKeys.filter((k) => !remove.has(k));
    const defaults = screenKey === "right" ? ["schedule"] : ["overview"];
    commitTargetKeys(next.length > 0 ? next : defaults);
  }

  function toggleSource(key) {
    setPickedSource((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleTarget(key) {
    setPickedTarget((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const allSourcePicked = sourceKeys.length > 0 && sourceKeys.every((k) => pickedSource.has(k));
  const allTargetPicked = targetKeys.length > 0 && targetKeys.every((k) => pickedTarget.has(k));

  function toggleAllSource(checked) {
    if (checked) {
      setPickedSource(new Set(sourceKeys));
    } else {
      setPickedSource(new Set());
    }
  }

  function toggleAllTarget(checked) {
    if (checked) {
      setPickedTarget(new Set(targetKeys));
    } else {
      setPickedTarget(new Set());
    }
  }

  return (
    <div className="field field--screen-transfer">
      <span>{field.label}</span>
      <p className="field-hint screen-transfer-hint">右侧顺序即为大屏轮播子页面的先后顺序；选项随「屏幕」左/右切换。</p>
      <div className="admin-transfer" role="group" aria-label={field.label}>
        <div className="admin-transfer-panel">
          <div className="admin-transfer-panel-head">
            <label className="admin-transfer-select-all">
              <input
                checked={allSourcePicked}
                disabled={sourceKeys.length === 0}
                onChange={(event) => toggleAllSource(event.target.checked)}
                type="checkbox"
              />
              <span className="admin-transfer-count">{sourceKeys.length} 项</span>
              <span className="admin-transfer-title">备选项</span>
            </label>
          </div>
          <div className="admin-transfer-body">
            {sourceKeys.length === 0 ? (
              <div className="admin-transfer-empty">暂无备选项</div>
            ) : (
              <ul className="admin-transfer-list">
                {sourceKeys.map((key) => (
                  <li key={key}>
                    <label className="admin-transfer-row">
                      <input checked={pickedSource.has(key)} onChange={() => toggleSource(key)} type="checkbox" />
                      <span>{options[key] ?? key}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="admin-transfer-actions">
          <button
            className="admin-transfer-btn"
            disabled={pickedSource.size === 0}
            onClick={moveToTarget}
            title="加入已选"
            type="button"
          >
            ›
          </button>
          <button
            className="admin-transfer-btn"
            disabled={pickedTarget.size === 0}
            onClick={moveToSource}
            title="移回备选"
            type="button"
          >
            ‹
          </button>
        </div>

        <div className="admin-transfer-panel">
          <div className="admin-transfer-panel-head">
            <label className="admin-transfer-select-all">
              <input
                checked={allTargetPicked}
                disabled={targetKeys.length === 0}
                onChange={(event) => toggleAllTarget(event.target.checked)}
                type="checkbox"
              />
              <span className="admin-transfer-count">{targetKeys.length} 项</span>
              <span className="admin-transfer-title">已选择（轮播顺序）</span>
            </label>
          </div>
          <div className="admin-transfer-body">
            {targetKeys.length === 0 ? (
              <div className="admin-transfer-empty">请从左侧添加</div>
            ) : (
              <ol className="admin-transfer-list admin-transfer-list--ordered">
                {targetKeys.map((key) => (
                  <li key={key}>
                    <label className="admin-transfer-row">
                      <input checked={pickedTarget.has(key)} onChange={() => toggleTarget(key)} type="checkbox" />
                      <span>{options[key] ?? key}</span>
                    </label>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceField({ field, formState, setFormState, relatedOptions }) {
  const value = formState[field.key];

  function updateValue(nextValue) {
    setFormState((current) => ({
      ...current,
      [field.key]: nextValue,
    }));
  }

  if (field.type === "screenPageTransfer") {
    return <ScreenPageTransferField field={field} formState={formState} setFormState={setFormState} />;
  }

  if (field.type === "checkbox") {
    return (
      <label className="checkbox-field">
        <input
          checked={Boolean(value)}
          onChange={(event) => updateValue(event.target.checked)}
          type="checkbox"
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.type === "textarea" || field.type === "json") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <textarea
          onChange={(event) => updateValue(event.target.value)}
          placeholder={field.placeholder ?? ""}
          rows={field.type === "json" ? 6 : 4}
          value={value ?? ""}
        />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <select onChange={(event) => updateValue(event.target.value)} value={value ?? ""}>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "resourceSelect") {
    const options = relatedOptions[field.resource] ?? [];
    return (
      <label className="field">
        <span>{field.label}</span>
        <select onChange={(event) => updateValue(event.target.value)} value={value ?? ""}>
          <option value="">{field.allowBlank ? "不设置" : "请选择"}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.code ? `${option.code} - ${option.name}` : option.name}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="field">
      <span>{field.label}</span>
      <input
        onChange={(event) => updateValue(event.target.value)}
        placeholder={field.placeholder ?? ""}
        type={field.key === "password" ? "password" : "text"}
        value={value ?? ""}
      />
    </label>
  );
}


function ResourceQueryBar({ queryFields, queryState, relatedOptions, onChange, onSearch, onReset, disabled }) {
  if (!queryFields || !queryFields.length) {
    return null;
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      onSearch();
    }
  }

  function renderQueryField(field) {
    const value = queryState[field.key] ?? "";
    const updateValue = (nextValue) => onChange(field.key, nextValue);

    if (field.type === "select") {
      return (
        <label className="query-field" key={field.key}>
          <span>{field.label}</span>
          <select disabled={disabled} onChange={(event) => updateValue(event.target.value)} value={value}>
            <option value="">全部</option>
            {(field.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (field.type === "resourceSelect") {
      const options = relatedOptions[field.resource] ?? [];
      return (
        <label className="query-field" key={field.key}>
          <span>{field.label}</span>
          <select disabled={disabled} onChange={(event) => updateValue(event.target.value)} value={value}>
            <option value="">全部</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.code ? `${option.code} - ${option.name}` : option.name}
              </option>
            ))}
          </select>
        </label>
      );
    }

    return (
      <label className="query-field" key={field.key}>
        <span>{field.label}</span>
        <input
          disabled={disabled}
          onChange={(event) => updateValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder ?? ""}
          type={field.type === "date" ? "date" : "text"}
          value={value}
        />
      </label>
    );
  }

  return (
    <div className="resource-query-bar">
      <div className="resource-query-grid">{queryFields.map(renderQueryField)}</div>
      <div className="resource-query-actions">
        <button disabled={disabled} onClick={onSearch} type="button">
          查询
        </button>
        <button className="ghost-button" disabled={disabled} onClick={onReset} type="button">
          重置
        </button>
      </div>
    </div>
  );
}


function ResourceModalForm({
  resourceDefinition,
  initialItem,
  relatedOptions,
  onCancel,
  onSubmit,
  onTestConnection,
  isSaving,
  isTesting,
}) {
  const [formState, setFormState] = useState(() =>
    initialItem ? createFormFromItem(resourceDefinition, initialItem) : createEmptyForm(resourceDefinition),
  );

  const isEdit = Boolean(initialItem?.id);
  const supportsTest = Boolean(resourceDefinition.supportsTestConnection);

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(formState);
  }

  function handleTest() {
    onTestConnection(formState);
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget && !isSaving && !isTesting) {
      onCancel();
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdropClick}>
      <div
        className={`modal-dialog${resourceDefinition.wideModal ? " modal-dialog--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${isEdit ? "编辑" : "新建"}${resourceDefinition.itemLabel}`}
      >
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-header">
            <h3>{isEdit ? `编辑${resourceDefinition.itemLabel}` : `新建${resourceDefinition.itemLabel}`}</h3>
            <button
              aria-label="关闭"
              className="modal-close"
              disabled={isSaving || isTesting}
              onClick={onCancel}
              type="button"
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            <div className="editor-grid">
              {resourceDefinition.fields
                .filter((field) => !field.hideInForm)
                .map((field) => (
                  <ResourceField
                    field={field}
                    formState={formState}
                    key={field.key}
                    relatedOptions={relatedOptions}
                    setFormState={setFormState}
                  />
                ))}
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="ghost-button"
              disabled={isSaving || isTesting}
              onClick={onCancel}
              type="button"
            >
              取消
            </button>
            <button disabled={isSaving || isTesting} type="submit">
              {isSaving ? "保存中..." : "保存"}
            </button>
            {supportsTest ? (
              <button
                className="secondary-button"
                disabled={isSaving || isTesting}
                onClick={handleTest}
                type="button"
              >
                {isTesting ? "测试中..." : "测试连接"}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}


function HistoryDialog({ resourceDefinition, item, token, onClose, onUnauthorized, showToast }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const response = await apiRequest(
          `${resourceDefinition.endpoint}/${item.id}/history?page=${page}&pageSize=${pageSize}`,
          { token },
        );
        if (cancelled) return;
        setItems(response.data.items ?? []);
        setTotal(response.data.total ?? 0);
      } catch (error) {
        if (cancelled) return;
        if (error.status === 401) {
          onUnauthorized();
          return;
        }
        showToast(error.message || "历史数据加载失败", { variant: "error" });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [item.id, page, pageSize, resourceDefinition.endpoint, token, onUnauthorized, showToast]);

  function formatTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdropClick}>
      <div className="modal-dialog modal-dialog--wide" role="dialog" aria-modal="true" aria-label="OPC UA 历史数据">
        <div className="modal-header">
          <h3>OPC UA 历史数据 - {item.name || item.code}</h3>
          <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className="modal-body modal-body--table">
          {isLoading ? (
            <div className="modal-empty">正在加载...</div>
          ) : items.length === 0 ? (
            <div className="modal-empty">该数据源暂无历史数据</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>采样时间</th>
                    <th>节点 ID</th>
                    <th>采样值</th>
                    <th>质量</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td>{formatTime(row.sampledAt)}</td>
                      <td>{row.nodeId}</td>
                      <td>{row.value}</td>
                      <td>{row.qualityLabel || row.quality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer modal-footer--between">
          <div className="table-pagination-meta">
            共 {total} 条，当前第 {page}/{totalPages} 页
          </div>
          <div className="table-pagination-actions">
            <label className="table-page-size">
              每页
              <select value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }}>
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              条
            </label>
            <button disabled={page <= 1 || isLoading} onClick={() => setPage(page - 1)} type="button">上一页</button>
            <button disabled={page >= totalPages || isLoading} onClick={() => setPage(page + 1)} type="button">下一页</button>
            <button className="ghost-button" onClick={onClose} type="button">关闭</button>
          </div>
        </div>
      </div>
    </div>
  );
}


function buildPayloadFromForm(resourceDefinition, formState) {
  const payload = {};
  const nestedBuckets = {};

  for (const field of resourceDefinition.fields) {
    let parsedValue;
    try {
      parsedValue = parseFieldValue(field, formState[field.key], formState);
    } catch (parseErr) {
      if (parseErr instanceof SyntaxError && (field.type === "json" || field.type === "screenPageTransfer")) {
        throw { kind: "json", field, error: parseErr };
      }
      throw parseErr;
    }
    if (field.type === "integer" && parsedValue !== null && Number.isNaN(parsedValue)) {
      throw { kind: "integer", field };
    }
    if (parsedValue === OMIT_VALUE) {
      continue;
    }

    if (field.storage) {
      if (!nestedBuckets[field.storage]) {
        nestedBuckets[field.storage] = {};
      }
      if (parsedValue !== null && parsedValue !== "") {
        nestedBuckets[field.storage][field.key] = parsedValue;
      }
    } else {
      payload[field.key] = parsedValue;
    }
  }

  for (const [storageKey, bucket] of Object.entries(nestedBuckets)) {
    payload[storageKey] = bucket;
  }

  if (resourceDefinition.fixedSourceType) {
    payload.sourceType = resourceDefinition.fixedSourceType;
  }

  return payload;
}


function ResourceEditor({ activeResource, token, onUnauthorized }) {
  const resourceDefinition = resourceDefinitions[activeResource];
  const useModalForm = Boolean(resourceDefinition.useModalForm);

  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formState, setFormState] = useState(createEmptyForm(resourceDefinition));
  const [relatedOptions, setRelatedOptions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [queryDraft, setQueryDraft] = useState(createEmptyQuery(resourceDefinition));
  const [queryApplied, setQueryApplied] = useState(createEmptyQuery(resourceDefinition));
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [modalState, setModalState] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const toastTimerRef = useRef(null);

  const buildResourceListPath = useCallback(
    (targetPage, targetPageSize, queryState) => {
      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("pageSize", String(targetPageSize));
      if (queryState) {
        Object.entries(queryState).forEach(([key, value]) => {
          const normalized = typeof value === "string" ? value.trim() : value;
          if (normalized !== "" && normalized !== null && normalized !== undefined) {
            params.set(key, String(normalized));
          }
        });
      }
      if (resourceDefinition.fixedListParams) {
        Object.entries(resourceDefinition.fixedListParams).forEach(([key, value]) => {
          params.set(key, String(value));
        });
      }
      return `${resourceDefinition.endpoint}?${params.toString()}`;
    },
    [resourceDefinition.endpoint, resourceDefinition.fixedListParams],
  );

  const fetchAllItems = useCallback(
    async (endpoint) => {
      const allItems = [];
      let currentPage = 1;
      const fixedPageSize = 200;
      let totalCount = 0;
      do {
        const response = await apiRequest(`${endpoint}?page=${currentPage}&pageSize=${fixedPageSize}`, { token });
        const pageItems = response.data.items ?? [];
        totalCount = response.data.total ?? pageItems.length;
        allItems.push(...pageItems);
        currentPage += 1;
      } while (allItems.length < totalCount);
      return allItems;
    },
    [token],
  );

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((text, { variant = "info" } = {}) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    const trimmed = typeof text === "string" ? text.trim() : "";
    if (!trimmed) {
      setToast(null);
      return;
    }
    const normalizedVariant =
      variant === "success" || variant === "warning" || variant === "error" || variant === "info" ? variant : "info";
    setToast({ text: trimmed, variant: normalizedVariant });
    toastTimerRef.current = window.setTimeout(() => {
      toastTimerRef.current = null;
      setToast(null);
    }, ADMIN_TOAST_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const resourceDependencies = useMemo(() => {
    const nextDependencies = new Set();
    for (const field of resourceDefinition.fields) {
      if (field.type === "resourceSelect") {
        nextDependencies.add(field.resource);
      }
    }
    for (const field of resourceDefinition.queryFields ?? []) {
      if (field.type === "resourceSelect") {
        nextDependencies.add(field.resource);
      }
    }
    return [...nextDependencies];
  }, [resourceDefinition]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      dismissToast();
      setIsLoading(true);
      setSelectedItem(null);
      setFormState(createEmptyForm(resourceDefinition));
      setPage(1);
      setCheckedIds(new Set());
      setModalState(null);
      setHistoryTarget(null);
      const initialQuery = createEmptyQuery(resourceDefinition);
      setQueryDraft(initialQuery);
      setQueryApplied(initialQuery);

      try {
        const listPromise = apiRequest(buildResourceListPath(1, pageSize, initialQuery), { token });
        const dependencyPromises = resourceDependencies.map((dependencyKey) =>
          fetchAllItems(resourceDefinitions[dependencyKey].endpoint),
        );
        const [listResponse, ...dependencyItemsGroup] = await Promise.all([listPromise, ...dependencyPromises]);

        if (cancelled) {
          return;
        }

        setItems(listResponse.data.items ?? []);
        setTotal(listResponse.data.total ?? 0);
        const nextRelatedOptions = {};
        resourceDependencies.forEach((dependencyKey, index) => {
          nextRelatedOptions[dependencyKey] = dependencyItemsGroup[index] ?? [];
        });
        setRelatedOptions(nextRelatedOptions);
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (error.status === 401) {
          onUnauthorized();
          return;
        }
        showToast(humanizeAdminApiError(error, resourceDefinition.fields, { fallback: "列表加载失败，请稍后重试。" }), {
          variant: httpErrorToastVariant(error.status),
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [resourceDefinition, resourceDependencies, token, onUnauthorized, dismissToast, showToast, buildResourceListPath, fetchAllItems, pageSize]);

  function handleSelectItem(item) {
    setSelectedItem(item);
    if (!resourceDefinition.readOnly && !useModalForm) {
      setFormState(createFormFromItem(resourceDefinition, item));
    }
  }

  function handleCreateNew() {
    setSelectedItem(null);
    setFormState(createEmptyForm(resourceDefinition));
    if (useModalForm) {
      setModalState({ mode: "create", item: null });
    } else {
      showToast(`正在创建新的${resourceDefinition.itemLabel}。`, { variant: "info" });
    }
  }

  async function reloadCurrentResource(nextSelectedId = null, targetPage = page, targetPageSize = pageSize, queryState = queryApplied) {
    const payload = await apiRequest(buildResourceListPath(targetPage, targetPageSize, queryState), { token });
    const nextItems = payload.data.items ?? [];
    setItems(nextItems);
    setTotal(payload.data.total ?? 0);
    setPage(targetPage);
    setPageSize(targetPageSize);
    setCheckedIds(new Set());

    if (nextSelectedId) {
      const nextSelectedItem = nextItems.find((item) => item.id === nextSelectedId) ?? null;
      setSelectedItem(nextSelectedItem);
      if (nextSelectedItem && !resourceDefinition.readOnly && !useModalForm) {
        setFormState(createFormFromItem(resourceDefinition, nextSelectedItem));
      }
    } else {
      setSelectedItem(null);
      if (!resourceDefinition.readOnly && !useModalForm) {
        setFormState(createEmptyForm(resourceDefinition));
      }
    }
  }

  async function handlePageChange(nextPage) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const bounded = Math.min(Math.max(nextPage, 1), totalPages);
    if (bounded === page || isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      await reloadCurrentResource(null, bounded, pageSize, queryApplied);
    } catch (error) {
      if (error.status === 401) {
        onUnauthorized();
        return;
      }
      showToast(humanizeAdminApiError(error, resourceDefinition.fields, { fallback: "分页加载失败，请稍后重试。" }), {
        variant: httpErrorToastVariant(error.status),
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePageSizeChange(nextPageSize) {
    if (nextPageSize === pageSize || isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      await reloadCurrentResource(null, 1, nextPageSize, queryApplied);
    } catch (error) {
      if (error.status === 401) {
        onUnauthorized();
        return;
      }
      showToast(humanizeAdminApiError(error, resourceDefinition.fields, { fallback: "分页加载失败，请稍后重试。" }), {
        variant: httpErrorToastVariant(error.status),
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function persistFormState(values, { editingItem }) {
    setIsSaving(true);
    showToast("正在保存...", { variant: "info" });

    try {
      let payload;
      try {
        payload = buildPayloadFromForm(resourceDefinition, values);
      } catch (formErr) {
        if (formErr && formErr.kind === "json") {
          showToast(humanizeJsonFieldSyntaxError(formErr.field, formErr.error), { variant: "error" });
          return false;
        }
        if (formErr && formErr.kind === "integer") {
          showToast(`「${formErr.field.label}」须填写有效整数。`, { variant: "error" });
          return false;
        }
        throw formErr;
      }

      for (const key of RESERVED_FIELD_KEYS) {
        payload[key] = "";
      }

      const isEdit = Boolean(editingItem?.id);
      const path = isEdit ? `${resourceDefinition.endpoint}/${editingItem.id}` : resourceDefinition.endpoint;
      const method = isEdit ? "PATCH" : "POST";
      const response = await apiRequest(path, { method, token, body: payload });
      await reloadCurrentResource(response.data.id, page, pageSize, queryApplied);
      showToast(isEdit ? "更新成功。" : "创建成功。", { variant: "success" });
      return true;
    } catch (error) {
      if (error.status === 401) {
        onUnauthorized();
        return false;
      }
      showToast(humanizeAdminApiError(error, resourceDefinition.fields, { fallback: "保存失败，请检查表单后重试。" }), {
        variant: httpErrorToastVariant(error.status),
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await persistFormState(formState, { editingItem: selectedItem });
  }

  async function handleModalSubmit(values) {
    const editingItem = modalState?.item ?? null;
    const success = await persistFormState(values, { editingItem });
    if (success) {
      setModalState(null);
    }
  }

  async function handleTestConnection(values) {
    setIsTestingConnection(true);
    try {
      let payload;
      try {
        payload = buildPayloadFromForm(resourceDefinition, values);
      } catch (formErr) {
        if (formErr && formErr.kind === "json") {
          showToast(humanizeJsonFieldSyntaxError(formErr.field, formErr.error), { variant: "error" });
          return;
        }
        if (formErr && formErr.kind === "integer") {
          showToast(`「${formErr.field.label}」须填写有效整数。`, { variant: "error" });
          return;
        }
        throw formErr;
      }

      const response = await apiRequest(`${resourceDefinition.endpoint}/test-connection`, {
        method: "POST",
        token,
        body: payload,
      });
      showToast(response.data?.message || "连接测试成功。", { variant: "success" });
    } catch (error) {
      if (error.status === 401) {
        onUnauthorized();
        return;
      }
      showToast(error.message || "连接测试失败。", { variant: httpErrorToastVariant(error.status) });
    } finally {
      setIsTestingConnection(false);
    }
  }

  async function handleTestConnectionByItem(item) {
    if (!item) {
      return;
    }
    const values = createFormFromItem(resourceDefinition, item);
    await handleTestConnection(values);
  }

  async function handleDelete() {
    if (!selectedItem?.id) {
      return;
    }

    setIsDeleting(true);
    showToast("正在删除...", { variant: "info" });
    try {
      await apiRequest(`${resourceDefinition.endpoint}/${selectedItem.id}`, {
        method: "DELETE",
        token,
      });
      await reloadCurrentResource(null, page, pageSize, queryApplied);
      showToast("删除成功。", { variant: "success" });
    } catch (error) {
      if (error.status === 401) {
        onUnauthorized();
        return;
      }
      showToast(humanizeAdminApiError(error, resourceDefinition.fields, { fallback: "删除失败，请稍后再试。" }), {
        variant: httpErrorToastVariant(error.status),
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteRow(item) {
    if (!item?.id) return;
    if (!window.confirm(`确认删除${resourceDefinition.itemLabel}「${item.name || item.code || item.id}」吗？`)) {
      return;
    }
    setIsDeleting(true);
    showToast("正在删除...", { variant: "info" });
    try {
      await apiRequest(`${resourceDefinition.endpoint}/${item.id}`, { method: "DELETE", token });
      await reloadCurrentResource(null, page, pageSize, queryApplied);
      showToast("删除成功。", { variant: "success" });
    } catch (error) {
      if (error.status === 401) {
        onUnauthorized();
        return;
      }
      showToast(humanizeAdminApiError(error, resourceDefinition.fields, { fallback: "删除失败，请稍后再试。" }), {
        variant: httpErrorToastVariant(error.status),
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function handleEditRow(item) {
    setSelectedItem(item);
    setModalState({ mode: "edit", item });
  }

  function handleShowHistory(item) {
    setHistoryTarget(item);
  }

  function handleToggleCheck(itemId) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  function handleToggleCheckAll(currentItems) {
    const allChecked = currentItems.length > 0 && currentItems.every((item) => checkedIds.has(item.id));
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(currentItems.map((item) => item.id)));
    }
  }

  async function handleBatchDelete() {
    if (checkedIds.size === 0) {
      return;
    }
    const count = checkedIds.size;
    if (!window.confirm(`确定要批量删除选中的 ${count} 条${resourceDefinition.itemLabel}吗？此操作不可撤销。`)) {
      return;
    }

    setIsBatchDeleting(true);
    showToast(`正在批量删除 ${count} 条记录...`, { variant: "info" });
    try {
      await apiRequest(`${resourceDefinition.endpoint}/batch-delete`, {
        method: "POST",
        token,
        body: { ids: [...checkedIds] },
      });
      await reloadCurrentResource(null, 1, pageSize, queryApplied);
      showToast(`成功删除 ${count} 条${resourceDefinition.itemLabel}。`, { variant: "success" });
    } catch (error) {
      if (error.status === 401) {
        onUnauthorized();
        return;
      }
      showToast(humanizeAdminApiError(error, resourceDefinition.fields, { fallback: "批量删除失败，请稍后再试。" }), {
        variant: httpErrorToastVariant(error.status),
      });
    } finally {
      setIsBatchDeleting(false);
    }
  }

  function handleQueryFieldChange(fieldKey, value) {
    setQueryDraft((current) => ({
      ...current,
      [fieldKey]: value,
    }));
  }

  async function handleSearch() {
    setIsLoading(true);
    setQueryApplied(queryDraft);
    try {
      await reloadCurrentResource(null, 1, pageSize, queryDraft);
    } catch (error) {
      if (error.status === 401) {
        onUnauthorized();
        return;
      }
      showToast(humanizeAdminApiError(error, resourceDefinition.fields, { fallback: "查询失败，请稍后重试。" }), {
        variant: httpErrorToastVariant(error.status),
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetQuery() {
    const emptyQuery = createEmptyQuery(resourceDefinition);
    setQueryDraft(emptyQuery);
    setQueryApplied(emptyQuery);
    setIsLoading(true);
    try {
      await reloadCurrentResource(null, 1, pageSize, emptyQuery);
    } catch (error) {
      if (error.status === 401) {
        onUnauthorized();
        return;
      }
      showToast(humanizeAdminApiError(error, resourceDefinition.fields, { fallback: "重置查询失败，请稍后重试。" }), {
        variant: httpErrorToastVariant(error.status),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className={`resource-shell${useModalForm ? " resource-shell--single" : ""}`}>
      {toast ? (
        <div aria-live="polite" className={`admin-toast admin-toast--${toast.variant}`} role="status">
          <span className="admin-toast-text">{toast.text}</span>
          <button aria-label="关闭提示" className="admin-toast-close" onClick={dismissToast} type="button">
            ×
          </button>
        </div>
      ) : null}
      <div className="resource-header">
        <div className="resource-header-left">
          <h2>{resourceDefinition.label}</h2>
          {checkedIds.size > 0 && !resourceDefinition.readOnly ? (
            <span className="batch-selection-info">
              已选 {checkedIds.size} 条
              <button
                className="batch-delete-button"
                disabled={isBatchDeleting}
                onClick={handleBatchDelete}
                type="button"
              >
                {isBatchDeleting ? "删除中..." : "批量删除"}
              </button>
            </span>
          ) : null}
        </div>
        {!resourceDefinition.readOnly ? (
          <button onClick={handleCreateNew} type="button">
            新建{resourceDefinition.itemLabel}
          </button>
        ) : null}
      </div>

      <div className={`resource-body${useModalForm ? " resource-body--single" : ""}`}>
        <section className="resource-section">
          <div className="table-panel">
            <ResourceQueryBar
              disabled={isLoading}
              onChange={handleQueryFieldChange}
              onReset={handleResetQuery}
              onSearch={handleSearch}
              queryFields={resourceDefinition.queryFields ?? []}
              queryState={queryDraft}
              relatedOptions={relatedOptions}
            />
            <div className="table-panel-scroll">
              <ResourceTable
                checkedIds={checkedIds}
                isTestingConnection={isTestingConnection}
                items={items}
                onDeleteRow={handleDeleteRow}
                onEditRow={handleEditRow}
                onSelect={handleSelectItem}
                onShowHistory={handleShowHistory}
                onTestRowConnection={handleTestConnectionByItem}
                onToggleCheck={handleToggleCheck}
                onToggleCheckAll={handleToggleCheckAll}
                resourceDefinition={resourceDefinition}
                selectedId={selectedItem?.id ?? null}
              />
            </div>
            <ResourcePagination
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              page={page}
              pageSize={pageSize}
              total={total}
            />
          </div>
        </section>

        {!useModalForm ? (
          <section className="resource-section resource-section--editor">
            {resourceDefinition.readOnly ? (
              <div className="resource-panel-scroll">
                <div className="readonly-detail">
                  <h3>日志详情</h3>
                  <pre>{selectedItem ? stringifyJson(selectedItem) : "点击左侧日志查看详情"}</pre>
                </div>
              </div>
            ) : (
              <div className="resource-panel-scroll resource-panel-scroll--has-footer">
                <form className="editor-form" onSubmit={handleSubmit}>
                  <div className="editor-form-scroll">
                    <h3>{selectedItem ? `编辑${resourceDefinition.itemLabel}` : `新建${resourceDefinition.itemLabel}`}</h3>
                    <div className="editor-grid">
                      {resourceDefinition.fields
                        .filter((field) => !field.hideInForm)
                        .map((field) => (
                          <ResourceField
                            field={field}
                            formState={formState}
                            key={field.key}
                            relatedOptions={relatedOptions}
                            setFormState={setFormState}
                          />
                        ))}
                    </div>
                  </div>
                  <div className="actions">
                    <button disabled={isLoading || isSaving} type="submit">
                      {isSaving ? "保存中..." : "保存"}
                    </button>
                    {selectedItem ? (
                      <button className="danger-button" disabled={isDeleting} onClick={handleDelete} type="button">
                        {isDeleting ? "删除中..." : "删除"}
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>
            )}
          </section>
        ) : null}
      </div>

      {modalState && useModalForm ? (
        <ResourceModalForm
          initialItem={modalState.item}
          isSaving={isSaving}
          isTesting={isTestingConnection}
          onCancel={() => {
            if (!isSaving && !isTestingConnection) setModalState(null);
          }}
          onSubmit={handleModalSubmit}
          onTestConnection={handleTestConnection}
          relatedOptions={relatedOptions}
          resourceDefinition={resourceDefinition}
        />
      ) : null}

      {historyTarget ? (
        <HistoryDialog
          item={historyTarget}
          onClose={() => setHistoryTarget(null)}
          onUnauthorized={onUnauthorized}
          resourceDefinition={resourceDefinition}
          showToast={showToast}
          token={token}
        />
      ) : null}
    </section>
  );
}


function AdminConsole({ currentUser, navigate, onLogout, onUnauthorized, theme, onToggleTheme, token }) {
  const activeResourceStorageKey = useMemo(
    () => buildActiveResourceStorageKey(currentUser?.username),
    [currentUser?.username],
  );
  const [activeResource, setActiveResource] = useState(() => {
    const saved = window.localStorage.getItem(activeResourceStorageKey);
    return pickValidResource(saved || DEFAULT_ADMIN_RESOURCE);
  });

  useEffect(() => {
    const saved = window.localStorage.getItem(activeResourceStorageKey);
    setActiveResource(pickValidResource(saved || DEFAULT_ADMIN_RESOURCE));
  }, [activeResourceStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(activeResourceStorageKey, pickValidResource(activeResource));
  }, [activeResource, activeResourceStorageKey]);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">HOTA MDS</p>
          <h1>后台管理控制台</h1>
          <p>当前已接入 M2 最小后台能力，供管理员维护基础台账、展示配置、参数配置和数据源配置。</p>
        </div>
        <div className="header-actions">
          <div className="admin-identity">
            <strong>{currentUser.displayName}</strong>
            <span>{currentUser.username}</span>
          </div>
          <button className="ghost-button" onClick={onLogout} type="button">
            退出登录
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <ResourceSidebar
          activeResource={activeResource}
          onChange={setActiveResource}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
        <ResourceEditor activeResource={activeResource} onUnauthorized={onUnauthorized} token={token} />
      </div>
    </main>
  );
}

export default AdminConsole;
