from rest_framework.response import Response
from rest_framework.views import exception_handler


def _extract_message(detail):
    if isinstance(detail, list) and detail:
        return _extract_message(detail[0])
    if isinstance(detail, dict) and detail:
        first_value = next(iter(detail.values()))
        return _extract_message(first_value)
    return str(detail)


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    detail = response.data.get("detail", response.data)
    code = "ERROR"
    if response.status_code == 400:
        code = "INVALID_INPUT"
    elif response.status_code == 401:
        code = "UNAUTHORIZED"
    elif response.status_code == 403:
        code = "FORBIDDEN"
    elif response.status_code == 404:
        code = "NOT_FOUND"

    return Response(
        {
            "success": False,
            "code": code,
            "message": _extract_message(detail),
            "data": response.data,
        },
        status=response.status_code,
    )
