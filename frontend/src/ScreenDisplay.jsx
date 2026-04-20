import { useEffect, useMemo, useState } from "react";

function buildApiUrl(pathname) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
  return `${baseUrl}${pathname}`;
}

async function fetchScreenPayload(screenKey) {
  const response = await fetch(buildApiUrl(`/api/screens/${screenKey}`));
  const payload = await response.json().catch(() => ({
    success: false,
    message: "screen payload is invalid",
    data: null,
  }));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "screen request failed");
  }

  return payload.data;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return new Intl.NumberFormat("zh-CN").format(Number(value));
}

function useClock() {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  return currentTime;
}

function ScreenStatus({ errorMessage, usingFallback, lastSuccessfulAt }) {
  if (!errorMessage && !usingFallback) {
    return (
      <div className="screen-status">
        <span className="status-pill ok">数据正常</span>
        <span>最近成功更新 {formatDateTime(lastSuccessfulAt)}</span>
      </div>
    );
  }

  return (
    <div className="screen-status">
      <span className={usingFallback ? "status-pill warning" : "status-pill danger"}>
        {usingFallback ? "正在使用兜底数据" : "接口异常"}
      </span>
      <span>{errorMessage || `最近成功更新 ${formatDateTime(lastSuccessfulAt)}`}</span>
    </div>
  );
}

function MetricTile({ label, value, accent = "green" }) {
  return (
    <article className={`metric-tile accent-${accent}`}>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
    </article>
  );
}

function LeftScreen({ payload, errorMessage }) {
  const clock = useClock();
  const { screen, content, meta } = payload;
  const deviceOverview = content.deviceOverview;
  const productionOverview = content.productionOverview;
  const energyOverview = content.energyOverview;
  const productionTrend = content.productionTrend ?? [];
  const lineSummaries = productionOverview.lineSummaries ?? [];
  const areaSummaries = energyOverview.areaSummaries ?? [];
  const statusItems = deviceOverview.statusItems ?? [];
  const trendMax = Math.max(...productionTrend.map((item) => item.producedQuantity || 0), 1);

  return (
    <main className="screen-shell screen-left">
      <header className="screen-topbar">
        <div>
          <p className="screen-tag">HOTA MDS</p>
          <h1>{screen.title}</h1>
          <p className="screen-subtitle">{content.welcome.welcomeMessage}</p>
        </div>
        <div className="screen-clock-group">
          <strong>{content.welcome.companyName}</strong>
          <span>{formatDateTime(clock.toISOString())}</span>
        </div>
      </header>

      <ScreenStatus
        errorMessage={errorMessage}
        lastSuccessfulAt={meta.lastSuccessfulAt}
        usingFallback={meta.usingFallback}
      />

      <section className="screen-grid screen-grid-left">
        <section className="screen-panel panel-span-4">
          <div className="panel-header">
            <h2>设备运行概览</h2>
            <span>数据更新时间 {formatDateTime(deviceOverview.sourceUpdatedAt)}</span>
          </div>
          <div className="metric-grid metric-grid-three">
            <MetricTile accent="teal" label="设备总数" value={formatNumber(deviceOverview.totalCount)} />
            <MetricTile accent="green" label="运行设备" value={formatNumber(deviceOverview.runningCount)} />
            <MetricTile accent="amber" label="异常设备" value={formatNumber(deviceOverview.abnormalCount)} />
          </div>
          <div className="status-breakdown">
            {statusItems.map((item) => (
              <div className="status-row" key={item.key}>
                <span>{item.label}</span>
                <strong>{formatNumber(item.count)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="screen-panel panel-span-4">
          <div className="panel-header">
            <h2>产量执行概览</h2>
            <span>完成率 {productionOverview.overallCompletionRate}%</span>
          </div>
          <div className="metric-grid metric-grid-two">
            <MetricTile accent="green" label="目标产量" value={formatNumber(productionOverview.totalTargetQuantity)} />
            <MetricTile accent="teal" label="已产数量" value={formatNumber(productionOverview.totalProducedQuantity)} />
          </div>
          <div className="line-summary-list">
            {lineSummaries.map((item) => (
              <article className="line-summary-item" key={item.lineCode}>
                <div>
                  <strong>{item.lineName}</strong>
                  <span>{item.currentOrderCode}</span>
                </div>
                <div>
                  <span>目标 {formatNumber(item.targetQuantity)}</span>
                  <span>已产 {formatNumber(item.producedQuantity)}</span>
                </div>
                <strong>{item.completionRate}%</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="screen-panel panel-span-4">
          <div className="panel-header">
            <h2>近 8 小时产量趋势</h2>
            <span>后端缓存数据</span>
          </div>
          <div className="trend-bars">
            {productionTrend.map((item) => (
              <div className="trend-bar-item" key={item.hourLabel}>
                <span className="trend-bar-value">{formatNumber(item.producedQuantity)}</span>
                <div className="trend-bar-track">
                  <div
                    className="trend-bar-fill"
                    style={{ height: `${Math.max((item.producedQuantity / trendMax) * 100, 8)}%` }}
                  />
                </div>
                <span className="trend-bar-label">{item.hourLabel}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="screen-panel panel-span-7">
          <div className="panel-header">
            <h2>区域能耗概览</h2>
            <span>
              总能耗 {formatNumber(energyOverview.totalConsumption)} {energyOverview.unit}
            </span>
          </div>
          <div className="energy-list">
            {areaSummaries.map((item) => (
              <article className="energy-item" key={item.areaCode}>
                <div>
                  <strong>{item.areaName}</strong>
                  <span>{item.areaCode}</span>
                </div>
                <strong>
                  {formatNumber(item.consumption)} {item.unit}
                </strong>
              </article>
            ))}
          </div>
        </section>

        <section className="screen-panel panel-span-5 placeholder-panel">
          <div className="panel-header">
            <h2>报修概览</h2>
            <span>一期后段</span>
          </div>
          <div className="placeholder-copy">
            <strong>{content.repairPlaceholder.title}</strong>
            <p>{content.repairPlaceholder.description}</p>
          </div>
        </section>
      </section>
    </main>
  );
}

function RightScreen({ payload, errorMessage }) {
  const clock = useClock();
  const { screen, content, meta } = payload;
  const schedule = content.schedule;
  const riskItems = schedule.riskSummary.items ?? [];
  const scheduleRows = schedule.lineSchedules ?? [];
  const legends = content.delayLegend ?? [];

  return (
    <main className="screen-shell screen-right">
      <header className="screen-topbar">
        <div>
          <p className="screen-tag">HOTA MDS</p>
          <h1>{screen.title}</h1>
          <p className="screen-subtitle">{content.welcome.welcomeMessage}</p>
        </div>
        <div className="screen-clock-group">
          <strong>{content.welcome.companyName}</strong>
          <span>{formatDateTime(clock.toISOString())}</span>
        </div>
      </header>

      <ScreenStatus
        errorMessage={errorMessage}
        lastSuccessfulAt={meta.lastSuccessfulAt}
        usingFallback={meta.usingFallback}
      />

      <section className="screen-grid screen-grid-right">
        <section className="screen-panel panel-span-8">
          <div className="panel-header">
            <h2>未完工订单排产</h2>
            <span>窗口 {formatNumber(schedule.windowDays)} 天</span>
          </div>
          <div className="schedule-list">
            {scheduleRows.map((line) => (
              <article className="schedule-row" key={line.lineCode}>
                <div className="schedule-line-meta">
                  <strong>{line.lineName}</strong>
                  <span>{line.lineCode}</span>
                </div>
                <div className="schedule-order-list">
                  {line.orders.map((order) => (
                    <div className={`schedule-order risk-${order.riskStatus}`} key={order.orderCode}>
                      <div className="schedule-order-top">
                        <strong>{order.orderCode}</strong>
                        <span>{order.materialCode}</span>
                      </div>
                      <div className="schedule-order-bottom">
                        <span>
                          {order.displayStartAt} - {order.displayEndAt}
                        </span>
                        <strong>{order.completionRate}%</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="screen-panel panel-span-4">
          <div className="panel-header">
            <h2>延期风险概览</h2>
            <span>后端标准判定</span>
          </div>
          <div className="metric-grid metric-grid-two">
            {riskItems.map((item) => (
              <MetricTile
                key={item.key}
                accent={item.accent}
                label={item.label}
                value={formatNumber(item.count)}
              />
            ))}
          </div>
          <div className="legend-list">
            {legends.map((item) => (
              <div className="legend-item" key={item.key}>
                <span className="legend-color" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="screen-panel panel-span-12 placeholder-panel">
          <div className="panel-header">
            <h2>3D 仿真预留区</h2>
            <span>一期后段</span>
          </div>
          <div className="placeholder-copy placeholder-copy-wide">
            <strong>{content.simulationPlaceholder.title}</strong>
            <p>{content.simulationPlaceholder.description}</p>
          </div>
        </section>
      </section>
    </main>
  );
}

function ScreenFallback({ screenKey, errorMessage }) {
  const screenName = screenKey === "left" ? "左屏" : "右屏";

  return (
    <main className="screen-shell screen-fallback">
      <section className="screen-panel fallback-panel">
        <p className="screen-tag">HOTA MDS</p>
        <h1>{screenName}展示页暂时不可用</h1>
        <p>{errorMessage || "后端展示接口暂时未返回数据。"}</p>
        <div className="quick-links" aria-label="快速入口">
          <a href="/screen/left">/screen/left</a>
          <a href="/screen/right">/screen/right</a>
          <a href="/admin/login">/admin/login</a>
        </div>
      </section>
    </main>
  );
}

function ScreenDisplay({ screenKey }) {
  const [payload, setPayload] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadScreen() {
      try {
        const nextPayload = await fetchScreenPayload(screenKey);
        if (cancelled) {
          return;
        }
        setPayload(nextPayload);
        setErrorMessage("");
      } catch (error) {
        if (cancelled) {
          return;
        }
        setErrorMessage(error.message || "screen request failed");
      }
    }

    loadScreen();
    const timerId = window.setInterval(loadScreen, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(timerId);
    };
  }, [screenKey]);

  const screenView = useMemo(() => {
    if (!payload) {
      return null;
    }

    if (screenKey === "left") {
      return <LeftScreen errorMessage={errorMessage} payload={payload} />;
    }

    return <RightScreen errorMessage={errorMessage} payload={payload} />;
  }, [errorMessage, payload, screenKey]);

  if (!screenView) {
    return <ScreenFallback errorMessage={errorMessage} screenKey={screenKey} />;
  }

  return screenView;
}

export default ScreenDisplay;
