from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from accounts.authentication import AdminTokenAuthentication
from hota_mds.responses import success_response

from .audit import log_operation
from .display_services import ensure_mock_snapshots, get_screen_payload
from .models import (
    Area,
    CodeMapping,
    DataSourceConfig,
    DataSourceHealthSnapshot,
    Device,
    Employee,
    DisplayContentConfig,
    OperationLog,
    ProductionLine,
    RuntimeParameterConfig,
    ScreenConfig,
)
from .serializers import (
    AreaSerializer,
    CodeMappingSerializer,
    DataSourceConfigSerializer,
    DataSourceHealthSnapshotSerializer,
    DeviceSerializer,
    EmployeeSerializer,
    DisplayContentConfigSerializer,
    OperationLogSerializer,
    ProductionLineSerializer,
    RuntimeParameterConfigSerializer,
    ScreenConfigSerializer,
)


class AdminApiViewSet(viewsets.ModelViewSet):
    authentication_classes = [AdminTokenAuthentication]
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    target_type = ""

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return success_response("list loaded", {"items": serializer.data, "total": queryset.count()})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response("detail loaded", serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        output = self.get_serializer(instance)
        log_operation(
            actor=request.user,
            action="CREATE",
            target_type=self.target_type,
            target_id=instance.pk,
            target_label=str(instance),
            request=request,
            change_summary=output.data,
        )
        return success_response("created", output.data, status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()
        output = self.get_serializer(updated_instance)
        log_operation(
            actor=request.user,
            action="UPDATE",
            target_type=self.target_type,
            target_id=updated_instance.pk,
            target_label=str(updated_instance),
            request=request,
            change_summary={"changedFields": list(request.data.keys()), "current": output.data},
        )
        return success_response("updated", output.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        target_label = str(instance)
        target_id = instance.pk
        snapshot = self.get_serializer(instance).data
        self.perform_destroy(instance)
        log_operation(
            actor=request.user,
            action="DELETE",
            target_type=self.target_type,
            target_id=target_id,
            target_label=target_label,
            request=request,
            change_summary=snapshot,
        )
        return success_response("deleted", None)


class AreaViewSet(AdminApiViewSet):
    queryset = Area.objects.select_related("parent").all()
    serializer_class = AreaSerializer
    target_type = "area"


class ProductionLineViewSet(AdminApiViewSet):
    queryset = ProductionLine.objects.select_related("area").all()
    serializer_class = ProductionLineSerializer
    target_type = "production_line"


class DeviceViewSet(AdminApiViewSet):
    queryset = Device.objects.select_related("area", "production_line").all()
    serializer_class = DeviceSerializer
    target_type = "device"


class EmployeeViewSet(AdminApiViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    target_type = "employee"


class CodeMappingViewSet(AdminApiViewSet):
    queryset = CodeMapping.objects.all()
    serializer_class = CodeMappingSerializer
    target_type = "code_mapping"


class ScreenConfigViewSet(AdminApiViewSet):
    queryset = ScreenConfig.objects.all()
    serializer_class = ScreenConfigSerializer
    target_type = "screen_config"


class DisplayContentConfigViewSet(AdminApiViewSet):
    queryset = DisplayContentConfig.objects.all()
    serializer_class = DisplayContentConfigSerializer
    target_type = "display_content_config"


class RuntimeParameterConfigViewSet(AdminApiViewSet):
    queryset = RuntimeParameterConfig.objects.all()
    serializer_class = RuntimeParameterConfigSerializer
    target_type = "runtime_parameter_config"


class DataSourceConfigViewSet(AdminApiViewSet):
    queryset = DataSourceConfig.objects.all()
    serializer_class = DataSourceConfigSerializer
    target_type = "data_source_config"


class DataSourceHealthSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    authentication_classes = [AdminTokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = DataSourceHealthSnapshotSerializer
    queryset = DataSourceHealthSnapshot.objects.all()
    http_method_names = ["get", "head", "options"]

    def get_queryset(self):
        ensure_mock_snapshots()
        return super().get_queryset()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return success_response("list loaded", {"items": serializer.data, "total": queryset.count()})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response("detail loaded", serializer.data)


class OperationLogViewSet(viewsets.ReadOnlyModelViewSet):
    authentication_classes = [AdminTokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = OperationLogSerializer
    queryset = OperationLog.objects.select_related("actor").all()
    http_method_names = ["get", "head", "options"]

    def get_queryset(self):
        queryset = super().get_queryset()
        action = self.request.query_params.get("action")
        target_type = self.request.query_params.get("targetType")
        if action:
            queryset = queryset.filter(action=action)
        if target_type:
            queryset = queryset.filter(target_type=target_type)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return success_response("list loaded", {"items": serializer.data, "total": queryset.count()})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response("detail loaded", serializer.data)


class ScreenDisplayView(APIView):
    permission_classes = [AllowAny]
    screen_key = ""

    def get(self, request, *args, **kwargs):
        payload = get_screen_payload(self.screen_key)
        return success_response("screen payload loaded", payload)


class LeftScreenDisplayView(ScreenDisplayView):
    screen_key = "left"


class RightScreenDisplayView(ScreenDisplayView):
    screen_key = "right"
