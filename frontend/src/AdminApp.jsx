import { useEffect, useState } from "react";

import { ADMIN_TOKEN_STORAGE_KEY, apiRequest } from "./adminApi.js";
import AdminConsole from "./AdminConsole.jsx";

function LoginForm({ isSubmitting, message, onSubmit, password, setPassword, setUsername, username }) {
  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label className="field">
        <span>管理员账号</span>
        <input
          autoComplete="username"
          name="username"
          onChange={(event) => setUsername(event.target.value)}
          placeholder="请输入管理员账号"
          value={username}
        />
      </label>
      <label className="field">
        <span>密码</span>
        <input
          autoComplete="current-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入密码"
          type="password"
          value={password}
        />
      </label>
      <div className="actions">
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? "登录中..." : "登录"}
        </button>
      </div>
      <div className="status-box" aria-live="polite">
        <strong>管理员登录</strong>
        <p>{message}</p>
      </div>
    </form>
  );
}

function AdminApp({ pathname, navigate }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(() => window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? "");
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState("请输入管理员账号与密码。");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearSession(nextMessage) {
    window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setToken("");
    setCurrentUser(null);
    setPassword("");
    setMessage(nextMessage);
  }

  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      return;
    }

    let cancelled = false;

    async function fetchCurrentAdmin() {
      try {
        const payload = await apiRequest("/api/admin/auth/me", { token });
        if (!cancelled) {
          setCurrentUser(payload.data.user);
          setMessage("管理员身份校验通过。");
          if (pathname === "/admin/login") {
            navigate("/admin/console", true);
          }
        }
      } catch (error) {
        if (!cancelled) {
          clearSession(error.message || "管理员身份校验失败。");
        }
      }
    }

    fetchCurrentAdmin();

    return () => {
      cancelled = true;
    };
  }, [token, pathname, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("正在验证管理员身份...");

    try {
      const payload = await apiRequest("/api/admin/auth/login", {
        method: "POST",
        body: { username, password },
      });
      const nextToken = payload.data.token;

      window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, nextToken);
      setToken(nextToken);
      setPassword("");
      setMessage("登录成功，正在进入后台控制台。");
      navigate("/admin/console", true);
    } catch (error) {
      clearSession(error.message || "登录失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    clearSession("已退出当前管理员会话。");
    navigate("/admin/login", true);
  }

  if (currentUser) {
    return (
      <AdminConsole
        currentUser={currentUser}
        navigate={navigate}
        onLogout={handleLogout}
        onUnauthorized={() => clearSession("管理员会话已失效，请重新登录。")}
        token={token}
      />
    );
  }

  return (
    <main className="login-shell">
      <section className="login-layout">
        <section className="login-copy">
          <p className="eyebrow">HOTA MDS</p>
          <h1>后台管理入口</h1>
          <p>
            当前阶段提供最小后台控制台，可维护区域、产线、设备、编码映射、屏幕配置、展示内容、运行参数、数据源配置、数据源健康状态和操作日志。
          </p>
          <div className="quick-links" aria-label="基础路由">
            <a href="/admin/console">/admin/console</a>
            <a href="/screen/left">/screen/left</a>
            <a href="/screen/right">/screen/right</a>
          </div>
        </section>
        <section className="login-panel">
          <LoginForm
            isSubmitting={isSubmitting}
            message={message}
            onSubmit={handleSubmit}
            password={password}
            setPassword={setPassword}
            setUsername={setUsername}
            username={username}
          />
        </section>
      </section>
    </main>
  );
}

export default AdminApp;
