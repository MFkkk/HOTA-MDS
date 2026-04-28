import { useEffect, useMemo, useRef, useState } from "react";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PAGE_KEYS = {
  left: ["overview"],
  right: ["schedule"],
};
const PAGE_PRESETS = {
  left: {
    overview: {
      key: "overview",
      label: "综合总览",
      sections: ["deviceOverview", "productionOverview", "productionTrend", "energyOverview", "repairPlaceholder"],
    },
    operations: {
      key: "operations",
      label: "运行与产量",
      sections: ["deviceOverview", "productionOverview", "productionTrend"],
    },
    energy: {
      key: "energy",
      label: "能耗与占位",
      sections: ["energyOverview", "repairPlaceholder", "deviceOverview"],
    },
  },
  right: {
    schedule: {
      key: "schedule",
      label: "排产总览",
      sections: ["schedule", "delayLegend", "simulationPlaceholder"],
    },
    risk: {
      key: "risk",
      label: "风险说明",
      sections: ["delayLegend", "schedule"],
    },
    simulation: {
      key: "simulation",
      label: "仿真预留",
      sections: ["simulationPlaceholder", "delayLegend"],
    },
  },
};
const EMBEDDED_SECTION_HOSTS = {
  energyOverview: "productionTrend",
  repairPlaceholder: "deviceOverview",
  delayLegend: "schedule",
};

function buildApiUrl(pathname) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
  return `${baseUrl}${pathname}`;
}

async function fetchScreenPayload(screenKey) {
  const response = await fetch(buildApiUrl(`/api/screens/${screenKey}`));
  const responseText = await response.text();
  let payload = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      `screen request failed (${response.status})`;
    throw new Error(message);
  }

  if (!payload) {
    const sample = responseText.trim().slice(0, 120);
    const hint = sample ? `, response starts with: ${sample}` : "";
    throw new Error(`screen payload is invalid${hint}`);
  }

  if (payload.success === false) {
    throw new Error(payload.message || "screen request failed");
  }

  if (payload.data && typeof payload.data === "object") {
    return payload.data;
  }

  if (payload.screen && payload.content) {
    return payload;
  }

  throw new Error("screen payload is invalid");
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function startOfDay(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildWindowDays(windowDays) {
  const safeWindowDays = Math.max(Number(windowDays) || 30, 1);
  const windowStart = startOfDay(new Date()) ?? new Date();
  return Array.from({ length: safeWindowDays }, (_, index) => {
    return new Date(windowStart.getTime() + index * DAY_MS);
  });
}

function formatWindowLabel(date, index) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  if (index === 0 || index === 29 || date.getDate() === 1 || index % 5 === 0) {
    return `${month}/${day}`;
  }
  return day;
}

function getGanttBarLayout(order, windowStart, windowDays) {
  const plannedStart = startOfDay(order?.plannedStartAt ?? order?.displayStartAt);
  const plannedEnd = startOfDay(order?.plannedEndAt ?? order?.displayEndAt);

  if (!plannedStart || !plannedEnd) {
    return null;
  }

  const rawStart = Math.floor((plannedStart.getTime() - windowStart.getTime()) / DAY_MS);
  const rawEnd = Math.floor((plannedEnd.getTime() - windowStart.getTime()) / DAY_MS) + 1;
  const normalizedEnd = Math.max(rawEnd, rawStart + 1);
  const clippedStart = clamp(rawStart, 0, windowDays);
  const clippedEnd = clamp(normalizedEnd, 0, windowDays);

  if (clippedEnd <= clippedStart) {
    return null;
  }

  const spanDays = Math.max(clippedEnd - clippedStart, 1);
  return {
    offsetDays: clippedStart,
    spanDays,
    leftPercent: (clippedStart / windowDays) * 100,
    widthPercent: (spanDays / windowDays) * 100,
    clippedStart: rawStart < 0,
    clippedEnd: normalizedEnd > windowDays,
  };
}

function getGanttBarDensity(layout) {
  if (!layout) {
    return "full";
  }

  if (layout.spanDays <= 1 || layout.widthPercent <= 4.5) {
    return "tiny";
  }

  if (layout.spanDays <= 2 || layout.widthPercent <= 8) {
    return "compact";
  }

  return "full";
}

function resolveConfiguredPages(screenKey, pageKeys) {
  const presets = PAGE_PRESETS[screenKey] ?? {};
  const configuredKeys = Array.isArray(pageKeys) ? pageKeys : [];
  const resolvedPages = configuredKeys.map((pageKey) => presets[pageKey]).filter(Boolean);

  if (resolvedPages.length > 0) {
    return resolvedPages;
  }

  return DEFAULT_PAGE_KEYS[screenKey].map((pageKey) => presets[pageKey]).filter(Boolean);
}

function isModuleEnabled(moduleSettings, moduleKey) {
  return moduleSettings?.[moduleKey] !== false;
}

function resolveVisibleSections(activeSections, moduleSettings) {
  const resolved = [];
  const seen = new Set();

  activeSections.forEach((sectionKey) => {
    if (!isModuleEnabled(moduleSettings, sectionKey)) {
      return;
    }

    const hostKey = EMBEDDED_SECTION_HOSTS[sectionKey] ?? sectionKey;
    if (hostKey !== sectionKey && !isModuleEnabled(moduleSettings, hostKey)) {
      return;
    }
    if (seen.has(hostKey)) {
      return;
    }

    seen.add(hostKey);
    resolved.push(hostKey);
  });

  return resolved;
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

function useFullscreen(targetRef) {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    function handleFullscreenChange() {
      const target = targetRef.current;
      if (!target) {
        setIsFullscreen(Boolean(document.fullscreenElement));
        return;
      }
      setIsFullscreen(document.fullscreenElement === target);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [targetRef]);

  async function toggleFullscreen() {
    const target = targetRef.current;
    if (!target || !document.fullscreenEnabled) {
      return;
    }

    if (document.fullscreenElement === target) {
      await document.exitFullscreen();
      return;
    }

    await target.requestFullscreen();
  }

  return {
    canFullscreen: Boolean(document.fullscreenEnabled),
    isFullscreen,
    toggleFullscreen,
  };
}

function usePageRotation(pages, rotationIntervalSeconds) {
  const [activePageIndex, setActivePageIndex] = useState(0);

  useEffect(() => {
    setActivePageIndex(0);
  }, [pages]);

  useEffect(() => {
    const safeInterval = Number(rotationIntervalSeconds) || 0;
    if (pages.length <= 1 || safeInterval <= 0) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setActivePageIndex((currentIndex) => (currentIndex + 1) % pages.length);
    }, safeInterval * 1000);

    return () => window.clearInterval(timerId);
  }, [pages, rotationIntervalSeconds]);

  return [activePageIndex, setActivePageIndex];
}

function useAutoVerticalScroll(containerRef, enabled) {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      const element = containerRef.current;
      if (!element) {
        return;
      }

      const maxScrollTop = element.scrollHeight - element.clientHeight;
      if (maxScrollTop <= 8) {
        return;
      }

      const nextScrollTop = element.scrollTop + 1;
      if (nextScrollTop >= maxScrollTop - 1) {
        element.scrollTop = 0;
        return;
      }

      element.scrollTop = nextScrollTop;
    }, 40);

    return () => window.clearInterval(timerId);
  }, [containerRef, enabled]);
}

/** When `active`, observes container size and auto-scrolls only if content overflows (vertical marquee). */
function useOverflowAutoScroll(containerRef, active) {
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (!active) {
      setIsOverflowing(false);
      return undefined;
    }

    const el = containerRef.current;
    if (!el) {
      setIsOverflowing(false);
      return undefined;
    }

    const measure = () => {
      setIsOverflowing(el.scrollHeight - el.clientHeight > 8);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, active]);

  useAutoVerticalScroll(containerRef, isOverflowing);

  return isOverflowing;
}

function ScreenStatus({ errorMessage, usingFallback, lastSuccessfulAt }) {
  const metaDisplay = lastSuccessfulAt?.display ?? {};
  const lastSuccessfulAtLabel = metaDisplay.lastSuccessfulAtLabel || formatDateTime(lastSuccessfulAt?.value || lastSuccessfulAt);

  if (!errorMessage && !usingFallback) {
    return (
      <div className="screen-status">
        <span className="status-pill ok">数据正常</span>
        <span>最近成功更新 {lastSuccessfulAtLabel}</span>
      </div>
    );
  }

  return (
    <div className="screen-status">
      <span className={usingFallback ? "status-pill warning" : "status-pill danger"}>
        {usingFallback ? "正在使用兜底数据" : "接口异常"}
      </span>
      <span>{errorMessage || `最近成功更新 ${lastSuccessfulAtLabel}`}</span>
    </div>
  );
}

function ScreenHeader({
  currentTime,
  logoUrl,
  onToggleFullscreen,
  pageIndex,
  pages,
  screen,
  statusNode,
  welcome,
  canFullscreen,
  isFullscreen,
  setPageIndex,
}) {
  const subtitle = screen.subtitle || welcome.welcomeMessage || "面向访客的数字化工厂展示";

  return (
    <header className="screen-header">
      <div className="screen-hero">
        <div className="screen-brand">
          <div className="screen-logo">
            {logoUrl ? <img alt={welcome.companyName || "HOTA"} src={logoUrl} /> : <span>HT</span>}
          </div>
          <div className="screen-brand-copy">
            <p className="screen-tag">HOTA MDS</p>
            <h1>{screen.title || "和泰智造数屏系统"}</h1>
            <p className="screen-subtitle">{subtitle}</p>
          </div>
        </div>

        <div className="screen-toolbar">
          <div className="screen-toolbar-meta">
            <strong>{welcome.companyName || "和泰智造"}</strong>
            <span>{formatDateTime(currentTime.toISOString())}</span>
            <span className="screen-toolbar-hint">双击画面或点击按钮进入全屏</span>
          </div>
          {canFullscreen ? (
            <button className="screen-action-button" onClick={onToggleFullscreen} type="button">
              {isFullscreen ? "退出全屏" : "进入全屏"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="screen-control-bar">
        <div className="screen-page-switcher" role="tablist" aria-label="页面轮播">
          {pages.map((page, index) => (
            <button
              aria-selected={pageIndex === index}
              className={pageIndex === index ? "screen-page-chip active" : "screen-page-chip"}
              key={page.key}
              onClick={() => setPageIndex(index)}
              type="button"
            >
              {page.label}
            </button>
          ))}
        </div>
        <div className="screen-control-status">{statusNode}</div>
      </div>
    </header>
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

function SectionEmpty({ description, title = "当前模块暂无数据" }) {
  return (
    <div className="section-empty">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function LeftScreen({ payload, errorMessage, fullscreenState, screenRef }) {
  const clock = useClock();
  const screen = payload?.screen ?? {};
  const content = payload?.content ?? {};
  const meta = payload?.meta ?? {};
  const welcome = content.welcome ?? {};
  const deviceOverview = content.deviceOverview ?? {};
  const productionOverview = content.productionOverview ?? {};
  const energyOverview = content.energyOverview ?? {};
  const repairPlaceholder = content.repairPlaceholder ?? {};
  const productionTrend = content.productionTrend ?? [];
  const lineSummaries = productionOverview.lineSummaries ?? [];
  const areaSummaries = energyOverview.areaSummaries ?? [];
  const productionDisplay = productionOverview.display ?? {};
  const energyDisplay = energyOverview.display ?? {};
  const deviceDisplay = deviceOverview.display ?? {};
  const moduleSettings = screen.moduleSettings ?? {};
  const pages = useMemo(() => resolveConfiguredPages("left", screen.pageKeys), [screen.pageKeys]);
  const [activePageIndex, setActivePageIndex] = usePageRotation(pages, screen.rotationIntervalSeconds);
  const activeSections = pages[activePageIndex]?.sections ?? [];
  const visibleSections = useMemo(
    () => resolveVisibleSections(activeSections, moduleSettings),
    [activeSections, moduleSettings],
  );
  const trendMax = Math.max(
    ...productionTrend.map((item) => Number(item?.producedQuantity ?? 0)),
    1,
  );
  const lineSummaryScrollRef = useRef(null);
  const energySummaryScrollRef = useRef(null);
  const energyModuleOn = isModuleEnabled(moduleSettings, "energyOverview");
  const lineScrollActive = lineSummaries.length > 0;
  const energyScrollActive = energyModuleOn && areaSummaries.length > 0;

  const lineListOverflowing = useOverflowAutoScroll(lineSummaryScrollRef, lineScrollActive);
  const energyListOverflowing = useOverflowAutoScroll(energySummaryScrollRef, energyScrollActive);

  const sectionNodes = {
    deviceOverview: (
      <section className="screen-panel panel-span-4" key="deviceOverview">
        <div className="panel-header">
          <h2>设备运行概览</h2>
          <span>数据更新时间 {deviceDisplay.sourceUpdatedAtLabel || formatDateTime(deviceOverview.sourceUpdatedAt)}</span>
        </div>
        <div className="metric-grid metric-grid-three">
          <MetricTile accent="teal" label="设备总数" value={deviceDisplay.totalCountLabel || formatNumber(deviceOverview.totalCount)} />
          <MetricTile accent="green" label="运行设备" value={deviceDisplay.runningCountLabel || formatNumber(deviceOverview.runningCount)} />
          <MetricTile accent="amber" label="异常设备" value={deviceDisplay.abnormalCountLabel || formatNumber(deviceOverview.abnormalCount)} />
        </div>
        {isModuleEnabled(moduleSettings, "repairPlaceholder") ? (
          <div className="embedded-panel-block">
            <div className="embedded-panel-header">
              <h3>报修占位区</h3>
              <span>一期后段</span>
            </div>
            <div className="placeholder-copy embedded-placeholder-copy">
              <strong>{repairPlaceholder.title || "报修模块待接入"}</strong>
              <p>{repairPlaceholder.description || "当前阶段仅保留占位区，不阻塞一期前段大屏。"}</p>
            </div>
          </div>
        ) : null}
      </section>
    ),
    productionOverview: (
      <section className="screen-panel panel-span-4 production-overview-panel" key="productionOverview">
        <div className="panel-header">
          <h2>产量执行概览</h2>
          <span>
            {`产线 ${lineSummaries.length} 条`}
            {lineListOverflowing ? " · 自动滚动中" : ""}
          </span>
        </div>
        <div className="metric-grid metric-grid-two">
          <MetricTile
            accent="blue"
            label="目标产量"
            value={productionDisplay.totalTargetQuantityLabel || formatNumber(productionOverview.totalTargetQuantity)}
          />
          <MetricTile
            accent="teal"
            label="已产数量"
            value={productionDisplay.totalProducedQuantityLabel || formatNumber(productionOverview.totalProducedQuantity)}
          />
        </div>
        <div className="production-overview-summary">
          <span>完成率 {productionDisplay.overallCompletionRateLabel || `${productionOverview.overallCompletionRate ?? "-"}%`}</span>
        </div>
        {lineSummaries.length > 0 ? (
          <div
            className={
              lineListOverflowing
                ? "line-summary-list production-overview-list line-summary-list-scrollable"
                : "line-summary-list production-overview-list"
            }
            ref={lineSummaryScrollRef}
          >
            {lineSummaries.map((item) => {
              const itemDisplay = item.display ?? {};
              const completionRateValue = clamp(Number(item?.completionRate ?? 0), 0, 100);
              const progressAccent = itemDisplay.progressAccent || (item.isDelayed ? "red" : "blue");
              return (
                <article className="line-summary-item" key={item.lineCode}>
                  <div className="line-summary-main">
                    <div className="line-summary-head">
                      <strong>{item.lineName}</strong>
                    </div>
                    <span>{itemDisplay.currentOrderLabel || item.currentOrderCode || "当前订单待补充"}</span>
                  </div>
                  <div className="line-summary-meta">
                    <span>{itemDisplay.targetQuantityLabel || `目标 ${formatNumber(item.targetQuantity)}`}</span>
                    <span>{itemDisplay.producedQuantityLabel || `已产 ${formatNumber(item.producedQuantity)}`}</span>
                  </div>
                  <div className="line-summary-progress-row">
                    <div
                      aria-hidden="true"
                      className={`line-summary-progress accent-${progressAccent}`}
                    >
                      <div
                        className={`line-summary-progress-fill accent-${progressAccent}`}
                        style={{ width: `${completionRateValue}%` }}
                      />
                    </div>
                    <span className="line-summary-progress-value">
                      {itemDisplay.completionRateLabel || `${item.completionRate ?? "-"}%`}
                    </span>
                  </div>
                  <div className="line-summary-timeline">
                    <span>{itemDisplay.plannedRangeLabel || `${item.plannedStartAt || "-"} - ${item.plannedEndAt || "-"}`}</span>
                    <span>{`预计完成 ${itemDisplay.estimatedCompletionLabel || item.estimatedCompletionAt || "-"}`}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <SectionEmpty description="当前没有可展示的产线产量摘要。" />
        )}
      </section>
    ),
    productionTrend: (
      <section
        className={`screen-panel panel-span-4 production-trend-panel${energyModuleOn ? " production-trend-panel--with-energy" : ""}`}
        key="productionTrend"
      >
        <div className="panel-header">
          <h2>近 8 小时产量趋势</h2>
          <span>后端缓存数据</span>
        </div>
        {productionTrend.length > 0 ? (
          <div className="trend-bars production-trend-chart">
            {productionTrend.map((item) => {
              const itemDisplay = item.display ?? {};
              const producedQuantity = Number(item?.producedQuantity ?? 0);

              return (
                <div className="trend-bar-item" key={item.hourLabel}>
                  <span className="trend-bar-value">{itemDisplay.producedQuantityLabel || formatNumber(item.producedQuantity)}</span>
                  <div className="trend-bar-track">
                    <div
                      className="trend-bar-fill"
                      style={{ height: `${Math.max((producedQuantity / trendMax) * 100, 10)}%` }}
                    />
                  </div>
                  <span className="trend-bar-label">{itemDisplay.timeLabel || item.hourLabel}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <SectionEmpty description="产量趋势点暂未返回，当前不会影响其他模块展示。" />
        )}
        {energyModuleOn ? (
          <div className="embedded-panel-block embedded-panel-block-fill">
            <div className="embedded-panel-header">
              <h3>区域能耗概览</h3>
              <span>{energyDisplay.totalConsumptionLabel || `总能耗 ${formatNumber(energyOverview.totalConsumption)} ${energyOverview.unit ?? ""}`}</span>
            </div>
            <div className="embedded-panel-summary">
              <span>
                {`区域 ${areaSummaries.length} 个`}
                {energyListOverflowing ? " · 自动滚动中" : ""}
              </span>
            </div>
            {areaSummaries.length > 0 ? (
              <div
                className={
                  energyListOverflowing
                    ? "energy-list energy-list-embedded energy-list-scrollable"
                    : "energy-list energy-list-embedded"
                }
                ref={energySummaryScrollRef}
              >
                {areaSummaries.map((item) => {
                  const itemDisplay = item.display ?? {};
                  return (
                    <article className="energy-item energy-item-embedded" key={item.areaCode}>
                      <div>
                        <strong>{item.areaName}</strong>
                        <span>{item.areaCode}</span>
                      </div>
                      <strong>{itemDisplay.consumptionLabel || `${formatNumber(item.consumption)} ${item.unit ?? ""}`}</strong>
                    </article>
                  );
                })}
              </div>
            ) : (
              <SectionEmpty description="当前没有可展示的区域能耗数据。" />
            )}
          </div>
        ) : null}
      </section>
    ),
  };

  return (
    <main className="screen-shell screen-left" onDoubleClick={fullscreenState.toggleFullscreen} ref={screenRef}>
      <ScreenHeader
        canFullscreen={fullscreenState.canFullscreen}
        currentTime={clock}
        isFullscreen={fullscreenState.isFullscreen}
        logoUrl={welcome.logoUrl}
        onToggleFullscreen={fullscreenState.toggleFullscreen}
        pageIndex={activePageIndex}
        pages={pages}
        screen={screen}
        setPageIndex={setActivePageIndex}
        statusNode={
          <ScreenStatus
            errorMessage={errorMessage}
            lastSuccessfulAt={{ value: meta.lastSuccessfulAt, display: meta.display }}
            usingFallback={meta.usingFallback}
          />
        }
        welcome={welcome}
      />

      <section className="screen-page screen-grid screen-grid-left">
        {visibleSections.length > 0 ? (
          visibleSections.map((sectionKey) => sectionNodes[sectionKey]).filter(Boolean)
        ) : (
          <section className="screen-panel panel-span-12">
            <SectionEmpty
              title="当前轮播页没有可展示模块"
              description="请检查该屏幕的 moduleSettings 或 pageKeys 配置。"
            />
          </section>
        )}
      </section>
    </main>
  );
}

function GanttBoard({ lineSchedules, schedule }) {
  const barSlotHeight = 98;
  const barTopOffset = 10;
  const rowBottomPadding = 18;
  const windowDays = Math.max(Number(schedule?.windowDays) || 30, 1);
  const windowDates = useMemo(() => buildWindowDays(windowDays), [windowDays]);
  const windowStart = windowDates[0] ? startOfDay(windowDates[0]) : startOfDay(new Date());
  const scrollRef = useRef(null);
  const rowsActive = lineSchedules.length > 0;
  const rowsOverflowing = useOverflowAutoScroll(scrollRef, rowsActive);
  const totalOrders = lineSchedules.reduce((count, line) => count + (line.orders?.length ?? 0), 0);

  return (
    <div className="gantt-shell">
      <div className="gantt-meta">
        <span>按产线分组</span>
        <span>{`产线 ${lineSchedules.length} 条`}</span>
        <span>{`订单 ${totalOrders} 单`}</span>
        <span>{schedule?.display?.windowDaysLabel || `${windowDays} 天窗口`}</span>
        <span>{rowsOverflowing ? "超量自动纵向滚动中" : "窗口内静态展示"}</span>
      </div>

      <div className="gantt-board">
        <div className="gantt-days">
          <div className="gantt-days-spacer">产线</div>
          <div className="gantt-days-track" style={{ "--gantt-window-days": windowDays }}>
            {windowDates.map((date, index) => (
              <span className="gantt-day-label" key={date.toISOString()}>
                {formatWindowLabel(date, index)}
              </span>
            ))}
          </div>
        </div>

        <div className="gantt-rows" ref={scrollRef}>
          {lineSchedules.length > 0 ? (
            lineSchedules.map((line) => {
              const visibleOrders = (line.orders ?? [])
                .map((order) => {
                  const layout = getGanttBarLayout(order, windowStart, windowDays);
                  return layout ? { order, layout } : null;
                })
                .filter(Boolean);
              const rowHeight = Math.max(visibleOrders.length, 1) * barSlotHeight + barTopOffset + rowBottomPadding;

              return (
                <article className="gantt-row" key={line.lineCode}>
                  <div className="gantt-line-meta">
                    <strong>{line.lineName}</strong>
                    <span>{line.lineCode}</span>
                    <span>{line.areaName || "演示区域"}</span>
                    <span>{`可见订单 ${visibleOrders.length} 单`}</span>
                  </div>
                  <div className="gantt-track-shell">
                    <div className="gantt-track" style={{ "--gantt-window-days": windowDays, minHeight: `${rowHeight}px` }}>
                      <div className="gantt-grid">
                        {windowDates.map((date) => (
                          <span className="gantt-grid-cell" key={date.toISOString()} />
                        ))}
                      </div>

                        {visibleOrders.length > 0 ? (
                          visibleOrders.map(({ order, layout }, orderIndex) => {
                            const display = order.display ?? {};
                            const accent = display.riskAccent ?? "muted";
                            const density = getGanttBarDensity(layout);
                            const barClassName = ["gantt-bar", `accent-${accent}`, `gantt-bar--${density}`]
                              .filter(Boolean)
                              .join(" ");
                            const barTitle = [
                              order.orderCode,
                              order.materialCode || "-",
                              display.timeRangeLabel || `${order.displayStartAt} - ${order.displayEndAt}`,
                              display.completionRateLabel || `${order.completionRate ?? "-"}%`,
                            ].join(" | ");

                            return (
                              <div
                                className={barClassName}
                                key={`${line.lineCode}-${order.orderCode}`}
                                style={{
                                  left: `${layout.leftPercent}%`,
                                  top: `${orderIndex * barSlotHeight + barTopOffset}px`,
                                  width: `${layout.widthPercent}%`,
                                }}
                                title={barTitle}
                              >
                                {density === "tiny" ? (
                                  <div className="gantt-bar-mini">
                                    <strong>{order.orderCode}</strong>
                                  </div>
                                ) : density === "compact" ? (
                                  <div className="gantt-bar-compact">
                                    <strong>{order.orderCode}</strong>
                                  </div>
                                ) : (
                                  <>
                                    <div className="gantt-bar-head">
                                      <strong>{order.orderCode}</strong>
                                    </div>
                                    <div className="gantt-bar-body">
                                      <span>{order.materialCode || "-"}</span>
                                      <span>{display.completionRateLabel || `${order.completionRate ?? "-"}%`}</span>
                                    </div>
                                    <div className="gantt-bar-foot">
                                      <span>{display.timeRangeLabel || `${order.displayStartAt} - ${order.displayEndAt}`}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })
                      ) : (
                        <div className="gantt-empty-row">当前产线在未来窗口内无可见订单</div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="gantt-empty-state">当前没有可展示的未完工订单排产数据。</div>
          )}
        </div>
      </div>
    </div>
  );
}

function RightScreen({ payload, errorMessage, fullscreenState, screenRef }) {
  const clock = useClock();
  const screen = payload?.screen ?? {};
  const content = payload?.content ?? {};
  const meta = payload?.meta ?? {};
  const welcome = content.welcome ?? {};
  const schedule = content.schedule ?? {};
  const riskItems = schedule?.riskSummary?.items ?? [];
  const scheduleRows = schedule.lineSchedules ?? [];
  const scheduleDisplay = schedule.display ?? {};
  const moduleSettings = screen.moduleSettings ?? {};
  const pages = useMemo(() => resolveConfiguredPages("right", screen.pageKeys), [screen.pageKeys]);
  const [activePageIndex, setActivePageIndex] = usePageRotation(pages, screen.rotationIntervalSeconds);
  const activeSections = pages[activePageIndex]?.sections ?? [];
  const visibleSections = useMemo(
    () => resolveVisibleSections(activeSections, moduleSettings),
    [activeSections, moduleSettings],
  );

  const simulationScrollRef = useRef(null);
  const simulationScrollActive = visibleSections.includes("simulationPlaceholder");
  const simulationOverflowing = useOverflowAutoScroll(simulationScrollRef, simulationScrollActive);

  const sectionNodes = {
    schedule: (
      <section className="screen-panel panel-span-8 schedule-panel" key="schedule">
        <div className="panel-header">
          <h2>未完工订单排产展示</h2>
          <span>未来窗口 {scheduleDisplay.windowDaysLabel || `${formatNumber(schedule.windowDays)} 天`}</span>
        </div>
        {riskItems.length > 0 ? (
          <div className="risk-summary-row">
            {riskItems.map((item) => (
              <article className={`risk-summary-tile accent-${item.accent}`} key={item.key}>
                <span>{item.label}</span>
                <strong>{item.countLabel || formatNumber(item.count)}</strong>
              </article>
            ))}
          </div>
        ) : null}
        <GanttBoard lineSchedules={scheduleRows} schedule={schedule} />
      </section>
    ),
    simulationPlaceholder: (
      <section className="screen-panel panel-span-4 placeholder-panel simulation-panel" key="simulationPlaceholder">
        <div className="panel-header">
          <h2>3D 仿真占位区</h2>
          <span>
            一期后段
            {simulationOverflowing ? " · 自动滚动中" : ""}
          </span>
        </div>
        <div className="placeholder-copy placeholder-copy-wide simulation-placeholder-body" ref={simulationScrollRef}>
          <strong>{content.simulationPlaceholder?.title || "3D 仿真待一期后段接入"}</strong>
          <p>{content.simulationPlaceholder?.description || "当前阶段只保留预留区，不阻塞一期前段大屏。"}</p>
        </div>
      </section>
    ),
  };

  return (
    <main className="screen-shell screen-right" onDoubleClick={fullscreenState.toggleFullscreen} ref={screenRef}>
      <ScreenHeader
        canFullscreen={fullscreenState.canFullscreen}
        currentTime={clock}
        isFullscreen={fullscreenState.isFullscreen}
        logoUrl={welcome.logoUrl}
        onToggleFullscreen={fullscreenState.toggleFullscreen}
        pageIndex={activePageIndex}
        pages={pages}
        screen={screen}
        setPageIndex={setActivePageIndex}
        statusNode={
          <ScreenStatus
            errorMessage={errorMessage}
            lastSuccessfulAt={{ value: meta.lastSuccessfulAt, display: meta.display }}
            usingFallback={meta.usingFallback}
          />
        }
        welcome={welcome}
      />

      <section className="screen-page screen-grid screen-grid-right">
        {visibleSections.length > 0 ? (
          visibleSections.map((sectionKey) => sectionNodes[sectionKey]).filter(Boolean)
        ) : (
          <section className="screen-panel panel-span-12">
            <SectionEmpty
              title="当前轮播页没有可展示模块"
              description="请检查该屏幕的 moduleSettings 或 pageKeys 配置。"
            />
          </section>
        )}
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
  const screenRef = useRef(null);
  const fullscreenState = useFullscreen(screenRef);

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

  if (!payload) {
    return <ScreenFallback errorMessage={errorMessage} screenKey={screenKey} />;
  }

  if (screenKey === "left") {
    return (
      <LeftScreen
        errorMessage={errorMessage}
        fullscreenState={fullscreenState}
        payload={payload}
        screenRef={screenRef}
      />
    );
  }

  return (
    <RightScreen
      errorMessage={errorMessage}
      fullscreenState={fullscreenState}
      payload={payload}
      screenRef={screenRef}
    />
  );
}

export default ScreenDisplay;
