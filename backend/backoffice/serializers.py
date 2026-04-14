from rest_framework import serializers

from .models import (
    Area,
    CodeMapping,
    DataSourceConfig,
    Device,
    Employee,
    DisplayContentConfig,
    OperationLog,
    ProductionLine,
    RuntimeParameterConfig,
    ScreenConfig,
)


class CamelCaseModelSerializer(serializers.ModelSerializer):
    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = {self._to_snake_case(key): value for key, value in data.items()}
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {self._to_camel_case(key): value for key, value in data.items()}

    def _to_camel_case(self, value):
        parts = value.split("_")
        return parts[0] + "".join(part.capitalize() for part in parts[1:])

    def _to_snake_case(self, value):
        converted = []
        for char in value:
            if char.isupper():
                converted.append("_")
                converted.append(char.lower())
            else:
                converted.append(char)
        return "".join(converted)


class AreaSerializer(CamelCaseModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(source="parent", queryset=Area.objects.all(), allow_null=True, required=False)
    parent_name = serializers.CharField(source="parent.name", read_only=True)

    class Meta:
        model = Area
        fields = ["id", "code", "name", "parent_id", "parent_name", "is_active", "notes", "created_at", "updated_at"]


class ProductionLineSerializer(CamelCaseModelSerializer):
    area_id = serializers.PrimaryKeyRelatedField(source="area", queryset=Area.objects.all(), allow_null=True, required=False)
    area_name = serializers.CharField(source="area.name", read_only=True)

    class Meta:
        model = ProductionLine
        fields = ["id", "code", "name", "area_id", "area_name", "is_active", "notes", "created_at", "updated_at"]


class DeviceSerializer(CamelCaseModelSerializer):
    area_id = serializers.PrimaryKeyRelatedField(source="area", queryset=Area.objects.all(), allow_null=True, required=False)
    area_name = serializers.CharField(source="area.name", read_only=True)
    production_line_id = serializers.PrimaryKeyRelatedField(
        source="production_line",
        queryset=ProductionLine.objects.all(),
        allow_null=True,
        required=False,
    )
    production_line_name = serializers.CharField(source="production_line.name", read_only=True)

    class Meta:
        model = Device
        fields = [
            "id",
            "code",
            "name",
            "area_id",
            "area_name",
            "production_line_id",
            "production_line_name",
            "default_status",
            "is_active",
            "notes",
            "created_at",
            "updated_at",
        ]


class EmployeeSerializer(CamelCaseModelSerializer):
    role_label = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = Employee
        fields = [
            "id",
            "employee_no",
            "name",
            "role",
            "role_label",
            "is_active",
            "notes",
            "created_at",
            "updated_at",
        ]


class CodeMappingSerializer(CamelCaseModelSerializer):
    class Meta:
        model = CodeMapping
        fields = [
            "id",
            "entity_type",
            "source_system",
            "internal_code",
            "external_code",
            "is_active",
            "notes",
            "created_at",
            "updated_at",
        ]


class ScreenConfigSerializer(CamelCaseModelSerializer):
    def validate_page_keys(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("pageKeys must be a list")
        return value

    def validate_module_settings(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("moduleSettings must be an object")
        return value

    def validate_theme_settings(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("themeSettings must be an object")
        return value

    class Meta:
        model = ScreenConfig
        fields = [
            "id",
            "screen_key",
            "title",
            "subtitle",
            "rotation_interval_seconds",
            "page_keys",
            "module_settings",
            "theme_settings",
            "is_active",
            "created_at",
            "updated_at",
        ]


class DisplayContentConfigSerializer(CamelCaseModelSerializer):
    def validate_promo_image_urls(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("promoImageUrls must be a list")
        return value

    class Meta:
        model = DisplayContentConfig
        fields = [
            "id",
            "config_key",
            "company_name",
            "welcome_message",
            "logo_url",
            "promo_image_urls",
            "is_active",
            "created_at",
            "updated_at",
        ]


class RuntimeParameterConfigSerializer(CamelCaseModelSerializer):
    class Meta:
        model = RuntimeParameterConfig
        fields = [
            "id",
            "config_key",
            "single_day_effective_work_hours",
            "default_standard_capacity_per_hour",
            "delay_warning_buffer_hours",
            "gantt_window_days",
            "auto_scroll_enabled",
            "auto_scroll_rows_threshold",
            "recent_capacity_window_hours",
            "production_trend_window_hours",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        instance = getattr(self, "instance", None) or RuntimeParameterConfig()
        for attr, value in attrs.items():
            setattr(instance, attr, value)

        try:
            instance.clean()
        except Exception as exc:
            raise serializers.ValidationError(str(exc))

        return attrs


class DataSourceConfigSerializer(CamelCaseModelSerializer):
    secret_config = serializers.JSONField(write_only=True, required=False)
    secret_summary = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DataSourceConfig
        fields = [
            "id",
            "code",
            "name",
            "source_type",
            "is_enabled",
            "refresh_interval_seconds",
            "timeout_seconds",
            "connection_config",
            "secret_config",
            "secret_summary",
            "notes",
            "created_at",
            "updated_at",
        ]

    def validate_secret_config(self, value):
        if value is None:
            return {"storageType": DataSourceConfig.STORAGE_NONE}
        if not isinstance(value, dict):
            raise serializers.ValidationError("secretConfig must be an object")

        storage_type = value.get("storageType")
        valid_types = {
            DataSourceConfig.STORAGE_NONE,
            DataSourceConfig.STORAGE_ENV_REF,
            DataSourceConfig.STORAGE_ENCRYPTED,
        }
        if storage_type not in valid_types:
            raise serializers.ValidationError("unsupported secret storage type")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        secret_config = attrs.pop("secret_config", None)
        instance = getattr(self, "instance", None)

        if secret_config is None and instance is None:
            secret_config = {"storageType": DataSourceConfig.STORAGE_NONE}

        if secret_config is not None:
            storage_type = secret_config.get("storageType", DataSourceConfig.STORAGE_NONE)
            attrs["secret_storage_type"] = storage_type
            attrs["secret_env_mapping"] = secret_config.get("envMapping", {}) if storage_type == DataSourceConfig.STORAGE_ENV_REF else {}
            attrs["secret_ciphertext"] = secret_config.get("ciphertext", "") if storage_type == DataSourceConfig.STORAGE_ENCRYPTED else ""
            attrs["secret_key_version"] = secret_config.get("keyVersion", "") if storage_type == DataSourceConfig.STORAGE_ENCRYPTED else ""

        probe_instance = instance or DataSourceConfig()
        for attr, value in attrs.items():
            setattr(probe_instance, attr, value)

        try:
            probe_instance.clean()
        except Exception as exc:
            raise serializers.ValidationError(str(exc))

        return attrs

    def get_secret_summary(self, obj):
        return {
            "storageType": obj.secret_storage_type,
            "envKeys": sorted(obj.secret_env_mapping.keys()),
            "hasEncryptedSecret": bool(obj.secret_ciphertext),
            "keyVersion": obj.secret_key_version or None,
        }


class OperationLogSerializer(CamelCaseModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = OperationLog
        fields = [
            "id",
            "actor_username",
            "action",
            "target_type",
            "target_id",
            "target_label",
            "request_method",
            "request_path",
            "change_summary",
            "created_at",
        ]
