from __future__ import annotations

from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone

from .models import (
    Area,
    DataSourceHealthSnapshot,
    Device,
    DeviceStatusSnapshot,
    DisplayContentConfig,
    EnergySnapshot,
    ProductionLine,
    ProductionSnapshot,
    RuntimeParameterConfig,
    ScheduleSnapshot,
    ScreenConfig,
)
from .serializers import (
    DataSourceHealthSnapshotSerializer,
    DeviceStatusSnapshotSerializer,
    EnergySnapshotSerializer,
    ProductionSnapshotSerializer,
    ScheduleSnapshotSerializer,
)


SNAPSHOT_KEY_DEFAULT = "default"
SCREEN_SOURCE_KEYS = {
    "left": ["device", "production", "energy"],
    "right": ["schedule"],
}
DEFAULT_SCREEN_CONFIGS = {
    "left": {
        "screenKey": "left",
        "title": "左屏综合运行展示",
        "subtitle": "外部参观综合运行视图",
        "rotationIntervalSeconds": 60,
        "pageKeys": ["overview"],
        "moduleSettings": {
            "deviceOverview": True,
            "productionOverview": True,
            "productionTrend": True,
            "energyOverview": True,
            "repairPlaceholder": True,
        },
        "themeSettings": {},
        "isActive": True,
    },
    "right": {
        "screenKey": "right",
        "title": "右屏生产动态展示",
        "subtitle": "外部参观生产动态视图",
        "rotationIntervalSeconds": 60,
        "pageKeys": ["schedule"],
        "moduleSettings": {
            "schedule": True,
            "delayLegend": True,
            "simulationPlaceholder": True,
        },
        "themeSettings": {},
        "isActive": True,
    },
}
DEFAULT_DISPLAY_CONTENT = {
    "configKey": "default",
    "companyName": "和泰智造",
    "welcomeMessage": "欢迎莅临参观指导",
    "logoUrl": "",
    "promoImageUrls": [],
    "isActive": True,
}
DEFAULT_RUNTIME_PARAMETERS = {
    "configKey": "default",
    "singleDayEffectiveWorkHours": "16.00",
    "defaultStandardCapacityPerHour": "120.00",
    "delayWarningBufferHours": "2.00",
    "ganttWindowDays": 30,
    "autoScrollEnabled": True,
    "autoScrollRowsThreshold": 10,
    "recentCapacityWindowHours": 2,
    "productionTrendWindowHours": 8,
    "notes": "",
    "isActive": True,
}
SOURCE_CATALOG = {
    "device": "设备数据",
    "production": "产量数据",
    "schedule": "排产数据",
    "energy": "能耗数据",
}
DEVICE_STATUS_DISPLAY = {
    Device.STATUS_RUNNING: {"label": "运行", "accent": "green"},
    Device.STATUS_STOPPED: {"label": "停机", "accent": "amber"},
    Device.STATUS_ALARM: {"label": "报警", "accent": "red"},
    Device.STATUS_OFFLINE: {"label": "离线", "accent": "muted"},
}
RISK_STATUS_DISPLAY = {
    "normal": {"label": "正常", "color": "#1f8b4c", "accent": "green"},
    "warning": {"label": "风险", "color": "#d28716", "accent": "amber"},
    "delayed": {"label": "延期", "color": "#c0362c", "accent": "red"},
    "paused": {"label": "暂停", "color": "#6b7280", "accent": "muted"},
}


def get_screen_payload(screen_key: str) -> dict:
    ensure_mock_snapshots()

    device_snapshot = DeviceStatusSnapshot.objects.get(snapshot_key=SNAPSHOT_KEY_DEFAULT)
    production_snapshot = ProductionSnapshot.objects.get(snapshot_key=SNAPSHOT_KEY_DEFAULT)
    schedule_snapshot = ScheduleSnapshot.objects.get(snapshot_key=SNAPSHOT_KEY_DEFAULT)
    energy_snapshot = EnergySnapshot.objects.get(snapshot_key=SNAPSHOT_KEY_DEFAULT)

    screen_config = _get_screen_config(screen_key)
    display_content = _get_display_content()
    runtime_parameters = _get_runtime_parameters()
    health_statuses = _get_health_statuses()
    relevant_statuses = [item for item in health_statuses if item["sourceKey"] in SCREEN_SOURCE_KEYS[screen_key]]
    last_success_at = _max_iso_datetime(
        [
            device_snapshot.last_success_at,
            production_snapshot.last_success_at,
            schedule_snapshot.last_success_at,
            energy_snapshot.last_success_at,
        ]
    )

    payload = {
        "screen": screen_config,
        "content": {
            "welcome": {
                "companyName": display_content["companyName"],
                "welcomeMessage": display_content["welcomeMessage"],
                "logoUrl": display_content["logoUrl"],
                "promoImageUrls": display_content["promoImageUrls"],
                "currentTime": timezone.localtime().isoformat(),
            },
        },
        "meta": {
            "lastSuccessfulAt": last_success_at,
            "usingFallback": any(item["fallbackInUse"] for item in relevant_statuses),
            "dataSources": relevant_statuses,
        },
    }

    if screen_key == "left":
        device_overview = DeviceStatusSnapshotSerializer(device_snapshot).data
        device_overview["statusItems"] = _build_device_status_items(device_snapshot.status_breakdown)
        payload["content"].update(
            {
                "deviceOverview": device_overview,
                "productionOverview": {
                    "totalTargetQuantity": production_snapshot.total_target_quantity,
                    "totalProducedQuantity": production_snapshot.total_produced_quantity,
                    "overallCompletionRate": str(production_snapshot.overall_completion_rate),
                    "lineSummaries": production_snapshot.line_summaries,
                },
                "productionTrend": production_snapshot.trend_points,
                "energyOverview": {
                    "totalConsumption": str(energy_snapshot.total_consumption),
                    "unit": energy_snapshot.unit,
                    "areaSummaries": energy_snapshot.area_summaries,
                },
                "repairPlaceholder": {
                    "title": "报修模块待一期后段接入",
                    "description": "当前阶段仅保留展示位置，不作为一期前段阻塞项。",
                    "enabled": bool(screen_config["moduleSettings"].get("repairPlaceholder", True)),
                },
            }
        )
    else:
        risk_counts = dict(schedule_snapshot.risk_summary.get("counts", {}))
        payload["content"].update(
            {
                "schedule": {
                    "windowDays": runtime_parameters["ganttWindowDays"],
                    "autoScrollEnabled": runtime_parameters["autoScrollEnabled"],
                    "autoScrollRowsThreshold": runtime_parameters["autoScrollRowsThreshold"],
                    "lineSchedules": schedule_snapshot.line_schedules,
                    "riskSummary": {
                        **schedule_snapshot.risk_summary,
                        "counts": risk_counts,
                        "items": _build_risk_summary_items(risk_counts),
                    },
                },
                "delayLegend": schedule_snapshot.legend_items,
                "simulationPlaceholder": {
                    "title": "3D 仿真待一期后段接入",
                    "description": "当前阶段只保留预留区，优先级低于一期前段核心展示链路。",
                    "enabled": bool(screen_config["moduleSettings"].get("simulationPlaceholder", True)),
                },
            }
        )

    return payload


def ensure_mock_snapshots() -> None:
    has_all_snapshots = (
        DeviceStatusSnapshot.objects.filter(snapshot_key=SNAPSHOT_KEY_DEFAULT).exists()
        and ProductionSnapshot.objects.filter(snapshot_key=SNAPSHOT_KEY_DEFAULT).exists()
        and ScheduleSnapshot.objects.filter(snapshot_key=SNAPSHOT_KEY_DEFAULT).exists()
        and EnergySnapshot.objects.filter(snapshot_key=SNAPSHOT_KEY_DEFAULT).exists()
    )
    if has_all_snapshots:
        return
    load_mock_display_data()


@transaction.atomic
def load_mock_display_data(*, simulate_failure: bool = False) -> dict:
    current_time = timezone.now()

    if simulate_failure:
        for source_key, display_name in SOURCE_CATALOG.items():
            existing = DataSourceHealthSnapshot.objects.filter(source_key=source_key).first()
            DataSourceHealthSnapshot.objects.update_or_create(
                source_key=source_key,
                defaults={
                    "display_name": display_name,
                    "status": DataSourceHealthSnapshot.STATUS_FAILED,
                    "last_success_at": existing.last_success_at if existing else None,
                    "last_attempt_at": current_time,
                    "is_stale": True,
                    "fallback_in_use": bool(existing and existing.last_success_at),
                    "error_message": "mock refresh failed; serving last successful snapshot",
                    "details": {"mode": "mock", "reason": "simulated_failure"},
                },
            )
        return {
            "mode": "failure",
            "healthCount": DataSourceHealthSnapshot.objects.count(),
        }

    runtime_parameters = _get_runtime_parameters()
    source_updated_at = current_time - timedelta(minutes=2)
    device_snapshot = _build_device_snapshot(current_time, source_updated_at)
    production_snapshot = _build_production_snapshot(current_time, source_updated_at, runtime_parameters)
    schedule_snapshot = _build_schedule_snapshot(current_time, source_updated_at, runtime_parameters, production_snapshot)
    energy_snapshot = _build_energy_snapshot(current_time, source_updated_at)

    DeviceStatusSnapshot.objects.update_or_create(
        snapshot_key=SNAPSHOT_KEY_DEFAULT,
        defaults=device_snapshot,
    )
    ProductionSnapshot.objects.update_or_create(
        snapshot_key=SNAPSHOT_KEY_DEFAULT,
        defaults=production_snapshot,
    )
    ScheduleSnapshot.objects.update_or_create(
        snapshot_key=SNAPSHOT_KEY_DEFAULT,
        defaults=schedule_snapshot,
    )
    EnergySnapshot.objects.update_or_create(
        snapshot_key=SNAPSHOT_KEY_DEFAULT,
        defaults=energy_snapshot,
    )

    for source_key, display_name in SOURCE_CATALOG.items():
        DataSourceHealthSnapshot.objects.update_or_create(
            source_key=source_key,
            defaults={
                "display_name": display_name,
                "status": DataSourceHealthSnapshot.STATUS_HEALTHY,
                "last_success_at": current_time,
                "last_attempt_at": current_time,
                "is_stale": False,
                "fallback_in_use": False,
                "error_message": "",
                "details": {"mode": "mock"},
            },
        )

    return {
        "mode": "success",
        "generatedAt": current_time.isoformat(),
        "snapshots": {
            "device": DeviceStatusSnapshotSerializer(DeviceStatusSnapshot.objects.get(snapshot_key=SNAPSHOT_KEY_DEFAULT)).data,
            "production": ProductionSnapshotSerializer(
                ProductionSnapshot.objects.get(snapshot_key=SNAPSHOT_KEY_DEFAULT)
            ).data,
            "schedule": ScheduleSnapshotSerializer(ScheduleSnapshot.objects.get(snapshot_key=SNAPSHOT_KEY_DEFAULT)).data,
            "energy": EnergySnapshotSerializer(EnergySnapshot.objects.get(snapshot_key=SNAPSHOT_KEY_DEFAULT)).data,
        },
        "health": _get_health_statuses(),
    }


def _build_device_snapshot(current_time, source_updated_at) -> dict:
    devices = list(Device.objects.filter(is_active=True).order_by("code"))
    status_breakdown = {
        Device.STATUS_RUNNING: 0,
        Device.STATUS_STOPPED: 0,
        Device.STATUS_ALARM: 0,
        Device.STATUS_OFFLINE: 0,
    }

    if devices:
        for device in devices:
            status_breakdown[device.default_status] = status_breakdown.get(device.default_status, 0) + 1
        total_count = len(devices)
    else:
        status_breakdown = {
            Device.STATUS_RUNNING: 4,
            Device.STATUS_STOPPED: 1,
            Device.STATUS_ALARM: 1,
            Device.STATUS_OFFLINE: 0,
        }
        total_count = 6

    running_count = status_breakdown.get(Device.STATUS_RUNNING, 0)
    abnormal_count = max(total_count - running_count, 0)
    return {
        "total_count": total_count,
        "running_count": running_count,
        "abnormal_count": abnormal_count,
        "status_breakdown": status_breakdown,
        "generated_at": current_time,
        "source_updated_at": source_updated_at,
        "last_success_at": current_time,
    }


def _build_production_snapshot(current_time, source_updated_at, runtime_parameters: dict) -> dict:
    lines = list(ProductionLine.objects.filter(is_active=True).select_related("area").order_by("code"))
    if not lines:
        lines = [
            _FallbackLine("L01", "装配一线", "总装区"),
            _FallbackLine("L02", "装配二线", "总装区"),
            _FallbackLine("L03", "包装线", "包装区"),
        ]

    line_summaries = []
    total_target = 0
    total_produced = 0
    for index, line in enumerate(lines, start=1):
        target_quantity = 800 + index * 120
        produced_quantity = target_quantity - (120 + index * 15)
        completion_rate = _percentage(produced_quantity, target_quantity)
        total_target += target_quantity
        total_produced += produced_quantity
        line_summaries.append(
            {
                "lineCode": line.code,
                "lineName": line.name,
                "areaName": getattr(getattr(line, "area", None), "name", None) or getattr(line, "area_name", ""),
                "currentOrderCode": f"MO-{index:03d}",
                "targetQuantity": target_quantity,
                "producedQuantity": produced_quantity,
                "completionRate": completion_rate,
            }
        )

    trend_points = []
    trend_window_hours = runtime_parameters["productionTrendWindowHours"]
    for offset in range(trend_window_hours):
        hour_label_time = timezone.localtime(current_time - timedelta(hours=trend_window_hours - offset - 1))
        trend_points.append(
            {
                "hourLabel": hour_label_time.strftime("%H:00"),
                "producedQuantity": 80 + offset * 7,
            }
        )

    return {
        "total_target_quantity": total_target,
        "total_produced_quantity": total_produced,
        "overall_completion_rate": Decimal(str(_percentage(total_produced, total_target))),
        "line_summaries": line_summaries,
        "trend_points": trend_points,
        "generated_at": current_time,
        "source_updated_at": source_updated_at,
        "last_success_at": current_time,
    }


def _build_schedule_snapshot(current_time, source_updated_at, runtime_parameters: dict, production_snapshot: dict) -> dict:
    legend_items = [{"key": key, "label": item["label"], "color": item["color"]} for key, item in RISK_STATUS_DISPLAY.items()]
    line_schedules = []
    risk_counts = {"normal": 0, "warning": 0, "delayed": 0, "paused": 0}

    for index, line_summary in enumerate(production_snapshot["line_summaries"], start=1):
        risk_status = "warning" if index % 2 == 0 else "normal"
        if index == len(production_snapshot["line_summaries"]):
            risk_status = "delayed"

        planned_start = current_time + timedelta(days=index - 1)
        planned_end = planned_start + timedelta(days=2 + index)
        risk_counts[risk_status] += 1
        line_schedules.append(
            {
                "lineCode": line_summary["lineCode"],
                "lineName": line_summary["lineName"],
                "orders": [
                    {
                        "orderCode": f"PLAN-{index:03d}",
                        "materialCode": f"MAT-{index:03d}",
                        "status": "in_progress" if index == 1 else "planned",
                        "riskStatus": risk_status,
                        "targetQuantity": line_summary["targetQuantity"],
                        "producedQuantity": line_summary["producedQuantity"],
                        "plannedStartAt": planned_start.isoformat(),
                        "plannedEndAt": planned_end.isoformat(),
                        "displayStartAt": planned_start.date().isoformat(),
                        "displayEndAt": planned_end.date().isoformat(),
                        "completionRate": line_summary["completionRate"],
                    }
                ],
            }
        )

    return {
        "line_schedules": line_schedules,
        "risk_summary": {
            "windowDays": runtime_parameters["ganttWindowDays"],
            "counts": risk_counts,
        },
        "legend_items": legend_items,
        "generated_at": current_time,
        "source_updated_at": source_updated_at,
        "last_success_at": current_time,
    }


def _build_energy_snapshot(current_time, source_updated_at) -> dict:
    areas = list(Area.objects.filter(is_active=True).order_by("code"))
    if not areas:
        areas = [
            _FallbackArea("A01", "总装区"),
            _FallbackArea("A02", "包装区"),
            _FallbackArea("A03", "仓储区"),
        ]

    total_consumption = Decimal("0.00")
    area_summaries = []
    for index, area in enumerate(areas, start=1):
        consumption = Decimal(str(480 + index * 65)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_consumption += consumption
        area_summaries.append(
            {
                "areaCode": area.code,
                "areaName": area.name,
                "consumption": str(consumption),
                "unit": "kWh",
            }
        )

    return {
        "total_consumption": total_consumption,
        "unit": "kWh",
        "area_summaries": area_summaries,
        "generated_at": current_time,
        "source_updated_at": source_updated_at,
        "last_success_at": current_time,
    }


def _get_screen_config(screen_key: str) -> dict:
    config = ScreenConfig.objects.filter(screen_key=screen_key, is_active=True).first()
    if not config:
        return DEFAULT_SCREEN_CONFIGS[screen_key]
    return {
        "screenKey": config.screen_key,
        "title": config.title,
        "subtitle": config.subtitle,
        "rotationIntervalSeconds": config.rotation_interval_seconds,
        "pageKeys": config.page_keys,
        "moduleSettings": config.module_settings,
        "themeSettings": config.theme_settings,
        "isActive": config.is_active,
    }


def _get_display_content() -> dict:
    config = DisplayContentConfig.objects.filter(is_active=True).order_by("config_key").first()
    if not config:
        return DEFAULT_DISPLAY_CONTENT
    return {
        "configKey": config.config_key,
        "companyName": _coalesce_display_text(config.company_name, DEFAULT_DISPLAY_CONTENT["companyName"]),
        "welcomeMessage": _coalesce_display_text(config.welcome_message, DEFAULT_DISPLAY_CONTENT["welcomeMessage"]),
        "logoUrl": config.logo_url,
        "promoImageUrls": config.promo_image_urls,
        "isActive": config.is_active,
    }


def _get_runtime_parameters() -> dict:
    config = RuntimeParameterConfig.objects.filter(is_active=True).order_by("config_key").first()
    if not config:
        return DEFAULT_RUNTIME_PARAMETERS
    return {
        "configKey": config.config_key,
        "singleDayEffectiveWorkHours": str(config.single_day_effective_work_hours),
        "defaultStandardCapacityPerHour": str(config.default_standard_capacity_per_hour),
        "delayWarningBufferHours": str(config.delay_warning_buffer_hours),
        "ganttWindowDays": config.gantt_window_days,
        "autoScrollEnabled": config.auto_scroll_enabled,
        "autoScrollRowsThreshold": config.auto_scroll_rows_threshold,
        "recentCapacityWindowHours": config.recent_capacity_window_hours,
        "productionTrendWindowHours": config.production_trend_window_hours,
        "notes": config.notes,
        "isActive": config.is_active,
    }


def _get_health_statuses() -> list[dict]:
    statuses = DataSourceHealthSnapshot.objects.order_by("source_key")
    return DataSourceHealthSnapshotSerializer(statuses, many=True).data


def _percentage(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    value = Decimal(numerator) * Decimal("100.00") / Decimal(denominator)
    return float(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _max_iso_datetime(values) -> str | None:
    filtered_values = [value for value in values if value is not None]
    if not filtered_values:
        return None
    return max(filtered_values).isoformat()


def _coalesce_display_text(value: str | None, fallback: str) -> str:
    if value is None:
        return fallback

    normalized = value.strip()
    if not normalized:
        return fallback

    if set(normalized) == {"?"}:
        return fallback

    return normalized


def _build_device_status_items(status_breakdown: dict) -> list[dict]:
    items = []
    for key, display in DEVICE_STATUS_DISPLAY.items():
        items.append(
            {
                "key": key,
                "label": display["label"],
                "accent": display["accent"],
                "count": status_breakdown.get(key, 0),
            }
        )
    return items


def _build_risk_summary_items(risk_counts: dict) -> list[dict]:
    items = []
    for key, display in RISK_STATUS_DISPLAY.items():
        items.append(
            {
                "key": key,
                "label": display["label"],
                "accent": display["accent"],
                "color": display["color"],
                "count": risk_counts.get(key, 0),
            }
        )
    return items


class _FallbackArea:
    def __init__(self, code: str, name: str):
        self.code = code
        self.name = name


class _FallbackLine:
    def __init__(self, code: str, name: str, area_name: str):
        self.code = code
        self.name = name
        self.area_name = area_name
