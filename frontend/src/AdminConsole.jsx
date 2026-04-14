import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "./adminApi.js";
import {
  createEmptyForm,
  createFormFromItem,
  formatCellValue,
  OMIT_VALUE,
  parseFieldValue,
  resourceDefinitions,
  stringifyJson,
} from "./adminResources.js";


function ResourceSidebar({ activeResource, onChange }) {
  return (
    <nav className="resource-nav" aria-label="后台资源">
      {Object.entries(resourceDefinitions).map(([resourceKey, resourceDefinition]) => (
        <button
          className={activeResource === resourceKey ? "resource-tab active" : "resource-tab"}
          key={resourceKey}
          onClick={() => onChange(resourceKey)}
          type="button"
        >
          {resourceDefinition.label}
        </button>
      ))}
    </nav>
  );
}


function ResourceTable({ resourceDefinition, items, selectedId, onSelect }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {resourceDefinition.columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td className="empty-row" colSpan={resourceDefinition.columns.length}>
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
                {resourceDefinition.columns.map((column) => (
                  <td key={column.key}>{formatCellValue(item[column.key])}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
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
        type="text"
        value={value ?? ""}
      />
    </label>
  );
}


function ResourceEditor({ activeResource, token, onUnauthorized }) {
  const resourceDefinition = resourceDefinitions[activeResource];
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formState, setFormState] = useState(createEmptyForm(resourceDefinition));
  const [relatedOptions, setRelatedOptions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("正在读取数据...");

  const resourceDependencies = useMemo(() => {
    const nextDependencies = new Set();
    for (const field of resourceDefinition.fields) {
      if (field.type === "resourceSelect") {
        nextDependencies.add(field.resource);
      }
    }
    return [...nextDependencies];
  }, [resourceDefinition]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      setSelectedItem(null);
      setFormState(createEmptyForm(resourceDefinition));
      setMessage("正在读取数据...");

      try {
        const requests = [
          apiRequest(resourceDefinition.endpoint, { token }),
          ...resourceDependencies.map((dependencyKey) => apiRequest(resourceDefinitions[dependencyKey].endpoint, { token })),
        ];
        const responses = await Promise.all(requests);

        if (cancelled) {
          return;
        }

        setItems(responses[0].data.items ?? []);
        const nextRelatedOptions = {};
        resourceDependencies.forEach((dependencyKey, index) => {
          nextRelatedOptions[dependencyKey] = responses[index + 1].data.items ?? [];
        });
        setRelatedOptions(nextRelatedOptions);
        setMessage(`${resourceDefinition.label}已加载。`);
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (error.status === 401) {
          onUnauthorized();
          return;
        }
        setMessage(error.message || "读取失败。");
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
  }, [resourceDefinition, resourceDependencies, token, onUnauthorized]);

  function handleSelectItem(item) {
    setSelectedItem(item);
    if (!resourceDefinition.readOnly) {
      setFormState(createFormFromItem(resourceDefinition, item));
    }
  }

  function handleCreateNew() {
    setSelectedItem(null);
    setFormState(createEmptyForm(resourceDefinition));
    setMessage(`正在创建新的${resourceDefinition.itemLabel}。`);
  }

  async function reloadCurrentResource(nextSelectedId = null) {
    const payload = await apiRequest(resourceDefinition.endpoint, { token });
    const nextItems = payload.data.items ?? [];
    setItems(nextItems);

    if (nextSelectedId) {
      const nextSelectedItem = nextItems.find((item) => item.id === nextSelectedId) ?? null;
      setSelectedItem(nextSelectedItem);
      if (nextSelectedItem && !resourceDefinition.readOnly) {
        setFormState(createFormFromItem(resourceDefinition, nextSelectedItem));
      }
    } else {
      setSelectedItem(null);
      if (!resourceDefinition.readOnly) {
        setFormState(createEmptyForm(resourceDefinition));
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("正在保存...");

    try {
      const payload = {};
      for (const field of resourceDefinition.fields) {
        const parsedValue = parseFieldValue(field, formState[field.key]);
        if (parsedValue !== OMIT_VALUE) {
          payload[field.key] = parsedValue;
        }
      }

      const isEdit = Boolean(selectedItem?.id);
      const path = isEdit ? `${resourceDefinition.endpoint}/${selectedItem.id}` : resourceDefinition.endpoint;
      const method = isEdit ? "PATCH" : "POST";
      const response = await apiRequest(path, { method, token, body: payload });
      await reloadCurrentResource(response.data.id);
      setMessage(isEdit ? "更新成功。" : "创建成功。");
    } catch (error) {
      if (error.status === 401) {
        onUnauthorized();
        return;
      }
      setMessage(error.message || "保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedItem?.id) {
      return;
    }

    setIsDeleting(true);
    setMessage("正在删除...");
    try {
      await apiRequest(`${resourceDefinition.endpoint}/${selectedItem.id}`, {
        method: "DELETE",
        token,
      });
      await reloadCurrentResource();
      setMessage("删除成功。");
    } catch (error) {
      if (error.status === 401) {
        onUnauthorized();
        return;
      }
      setMessage(error.message || "删除失败。");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="resource-shell">
      <div className="resource-header">
        <div>
          <h2>{resourceDefinition.label}</h2>
          <p>{message}</p>
        </div>
        {!resourceDefinition.readOnly ? (
          <button onClick={handleCreateNew} type="button">
            新建{resourceDefinition.itemLabel}
          </button>
        ) : null}
      </div>

      <div className="resource-body">
        <section className="resource-section">
          <ResourceTable
            items={items}
            onSelect={handleSelectItem}
            resourceDefinition={resourceDefinition}
            selectedId={selectedItem?.id ?? null}
          />
        </section>

        <section className="resource-section">
          {resourceDefinition.readOnly ? (
            <div className="readonly-detail">
              <h3>日志详情</h3>
              <pre>{selectedItem ? stringifyJson(selectedItem) : "点击左侧日志查看详情"}</pre>
            </div>
          ) : (
            <form className="editor-form" onSubmit={handleSubmit}>
              <h3>{selectedItem ? `编辑${resourceDefinition.itemLabel}` : `新建${resourceDefinition.itemLabel}`}</h3>
              <div className="editor-grid">
                {resourceDefinition.fields.map((field) => (
                  <ResourceField
                    field={field}
                    formState={formState}
                    key={field.key}
                    relatedOptions={relatedOptions}
                    setFormState={setFormState}
                  />
                ))}
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
          )}
        </section>
      </div>
    </section>
  );
}


function AdminConsole({ currentUser, navigate, onLogout, onUnauthorized, token }) {
  const [activeResource, setActiveResource] = useState("areas");

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
          <button className="ghost-button" onClick={() => navigate("/admin/login")} type="button">
            返回登录页
          </button>
          <button className="ghost-button" onClick={onLogout} type="button">
            退出登录
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <ResourceSidebar activeResource={activeResource} onChange={setActiveResource} />
        <ResourceEditor activeResource={activeResource} onUnauthorized={onUnauthorized} token={token} />
      </div>
    </main>
  );
}

export default AdminConsole;
