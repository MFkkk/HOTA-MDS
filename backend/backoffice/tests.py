from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import DataSourceConfig, OperationLog


class BackofficeApiTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        user_model.objects.create_user(
            username="admin",
            password="admin123456",
            is_staff=True,
        )
        self.client = APIClient()
        login_response = self.client.post(
            "/api/admin/auth/login",
            {"username": "admin", "password": "admin123456"},
            format="json",
        )
        token = login_response.data["data"]["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_area_line_and_device_crud_flow(self):
        area_response = self.client.post(
            "/api/admin/areas",
            {"code": "A01", "name": "总装区", "isActive": True},
            format="json",
        )
        self.assertEqual(area_response.status_code, 201)
        area_id = area_response.data["data"]["id"]

        line_response = self.client.post(
            "/api/admin/production-lines",
            {"code": "L01", "name": "一号线", "areaId": area_id, "isActive": True},
            format="json",
        )
        self.assertEqual(line_response.status_code, 201)
        line_id = line_response.data["data"]["id"]

        device_response = self.client.post(
            "/api/admin/devices",
            {
                "code": "D01",
                "name": "贴标机",
                "areaId": area_id,
                "productionLineId": line_id,
                "defaultStatus": "running",
                "isActive": True,
            },
            format="json",
        )
        self.assertEqual(device_response.status_code, 201)
        self.assertEqual(device_response.data["data"]["productionLineName"], "一号线")

        list_response = self.client.get("/api/admin/devices")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.data["data"]["total"], 1)

    def test_employee_crud_and_role_validation(self):
        create_response = self.client.post(
            "/api/admin/employees",
            {
                "employeeNo": "EMP001A",
                "name": "张三",
                "role": "team_leader",
                "isActive": True,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(create_response.data["data"]["employeeNo"], "EMP001A")
        self.assertEqual(create_response.data["data"]["role"], "team_leader")

        invalid_response = self.client.post(
            "/api/admin/employees",
            {
                "employeeNo": "EMP-001",
                "name": "李四",
                "role": "employee",
                "isActive": True,
            },
            format="json",
        )
        self.assertEqual(invalid_response.status_code, 400)
        self.assertEqual(invalid_response.data["code"], "INVALID_INPUT")

    def test_code_mapping_and_screen_config_crud(self):
        mapping_response = self.client.post(
            "/api/admin/code-mappings",
            {
                "entityType": "device",
                "sourceSystem": "sap_rfc",
                "internalCode": "D01",
                "externalCode": "EQP-001",
                "isActive": True,
            },
            format="json",
        )
        self.assertEqual(mapping_response.status_code, 201)

        screen_response = self.client.post(
            "/api/admin/screen-configs",
            {
                "screenKey": "left",
                "title": "左屏展示",
                "subtitle": "综合运行",
                "rotationIntervalSeconds": 60,
                "pageKeys": ["overview"],
                "moduleSettings": {"repairPlaceholder": True},
                "themeSettings": {"logoUrl": "/assets/logo.png"},
                "isActive": True,
            },
            format="json",
        )
        self.assertEqual(screen_response.status_code, 201)
        self.assertEqual(screen_response.data["data"]["screenKey"], "left")

    def test_display_content_config_and_runtime_parameter_config_crud(self):
        display_response = self.client.post(
            "/api/admin/display-content-configs",
            {
                "configKey": "default",
                "companyName": "和泰智造",
                "welcomeMessage": "欢迎莅临参观指导",
                "logoUrl": "/assets/hota-logo.png",
                "promoImageUrls": ["/assets/visit-1.png", "/assets/visit-2.png"],
                "isActive": True,
            },
            format="json",
        )
        self.assertEqual(display_response.status_code, 201)
        self.assertEqual(display_response.data["data"]["configKey"], "default")

        runtime_response = self.client.post(
            "/api/admin/runtime-parameter-configs",
            {
                "configKey": "default",
                "singleDayEffectiveWorkHours": "16.50",
                "defaultStandardCapacityPerHour": "120.00",
                "delayWarningBufferHours": "2.00",
                "ganttWindowDays": 30,
                "autoScrollEnabled": True,
                "autoScrollRowsThreshold": 12,
                "recentCapacityWindowHours": 2,
                "productionTrendWindowHours": 8,
                "notes": "一期前段默认参数",
                "isActive": True,
            },
            format="json",
        )
        self.assertEqual(runtime_response.status_code, 201)
        self.assertEqual(runtime_response.data["data"]["singleDayEffectiveWorkHours"], "16.50")

    def test_runtime_parameter_config_rejects_invalid_work_hours(self):
        response = self.client.post(
            "/api/admin/runtime-parameter-configs",
            {
                "configKey": "bad-hours",
                "singleDayEffectiveWorkHours": "25.00",
                "defaultStandardCapacityPerHour": "100.00",
                "delayWarningBufferHours": "1.00",
                "ganttWindowDays": 30,
                "autoScrollEnabled": True,
                "autoScrollRowsThreshold": 10,
                "recentCapacityWindowHours": 2,
                "productionTrendWindowHours": 8,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "INVALID_INPUT")

    def test_data_source_config_supports_env_ref_secret_structure(self):
        response = self.client.post(
            "/api/admin/data-source-configs",
            {
                "code": "sap-main",
                "name": "SAP 主数据源",
                "sourceType": "sap_rfc",
                "isEnabled": True,
                "refreshIntervalSeconds": 300,
                "timeoutSeconds": 30,
                "connectionConfig": {
                    "host": "sap.internal",
                    "client": "100",
                    "username": "svc_hota",
                },
                "secretConfig": {
                    "storageType": "env_ref",
                    "envMapping": {"password": "SAP_MAIN_PASSWORD"},
                },
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["data"]["secretSummary"]["storageType"], "env_ref")
        self.assertEqual(response.data["data"]["secretSummary"]["envKeys"], ["password"])
        self.assertEqual(DataSourceConfig.objects.count(), 1)

    def test_data_source_config_rejects_invalid_secret_structure(self):
        response = self.client.post(
            "/api/admin/data-source-configs",
            {
                "code": "energy-main",
                "name": "能耗库",
                "sourceType": "energy_db",
                "secretConfig": {"storageType": "encrypted", "ciphertext": ""},
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "INVALID_INPUT")

    def test_operation_logs_record_admin_actions(self):
        self.client.post("/api/admin/areas", {"code": "A02", "name": "测试区"}, format="json")
        response = self.client.get("/api/admin/operation-logs")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data["data"]["total"], 1)
        self.assertTrue(OperationLog.objects.filter(action="CREATE", target_type="area").exists())
