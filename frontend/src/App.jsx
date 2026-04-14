import { useEffect, useState } from "react";

import AdminApp from "./AdminApp.jsx";
import PlaceholderScreen from "./PlaceholderScreen.jsx";


const screenRoutes = {
  "/screen/left": {
    title: "左屏综合运行展示",
    subtitle: "一期前段展示页仍未启动，本轮继续聚焦 M2 后台管理能力。",
  },
  "/screen/right": {
    title: "右屏生产动态展示",
    subtitle: "一期前段展示页仍未启动，本轮继续聚焦 M2 后台管理能力。",
  },
};


function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(nextPathname, replace = false) {
    if (replace) {
      window.history.replaceState({}, "", nextPathname);
    } else {
      window.history.pushState({}, "", nextPathname);
    }
    setPathname(nextPathname);
  }

  return [pathname, navigate];
}


function App() {
  const [pathname, navigate] = usePathname();

  if (pathname === "/admin/login" || pathname === "/admin/console") {
    return <AdminApp navigate={navigate} pathname={pathname} />;
  }

  const route = screenRoutes[pathname] ?? {
    title: "和泰智造数屏系统",
    subtitle: "当前优先级仍在 M2 后台能力建设，请访问 /admin/login 或 /admin/console。",
  };

  return <PlaceholderScreen route={route} />;
}

export default App;
