"""Real connection-testing helpers for data source configurations.

The ``database`` and ``opcua`` source types perform an actual network probe
against the target server.  Other source types (Modbus TCP, SAP RFC, 报修系统)
still rely on parameter validation only; extend this module if a real probe
is required for them as well.
"""

from __future__ import annotations

import asyncio
import concurrent.futures
import logging
import socket
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlparse


logger = logging.getLogger(__name__)


TCP_PROBE_TIMEOUT_SECONDS = 5
DB_CONNECT_TIMEOUT_SECONDS = 15
DB_READ_TIMEOUT_SECONDS = 15
OPCUA_DEFAULT_PORT = 4840
OPCUA_TIMEOUT_SECONDS = 8


def _looks_like_handshake_failure(message: str) -> bool:
    lowered = message.lower()
    return (
        "lost connection to" in lowered
        or "reading initial communication packet" in lowered
        or "reading authorization packet" in lowered
    )


def _annotate_handshake_error(engine: str, raw: str) -> str:
    return (
        f"{engine} 握手失败: {raw}\n"
        "可能原因：\n"
        " 1) 服务器对客户端 IP 做反向 DNS 解析超时（设置 my.cnf [mysqld] skip-name-resolve）；\n"
        " 2) 客户端在 max_connect_errors 内已多次失败，服务器临时拉黑客户端 IP（执行 FLUSH HOSTS 或重启服务）；\n"
        " 3) 服务器要求 TLS/SSL 而客户端未启用；\n"
        " 4) bind-address 仅监听其它网卡，与本机不通。"
    )

DEFAULT_DATABASE_PORTS = {
    "mysql": 3306,
    "mariadb": 3306,
    "postgresql": 5432,
    "postgres": 5432,
    "sqlserver": 1433,
    "mssql": 1433,
    "oracle": 1521,
}


@dataclass
class ConnectionTestResult:
    ok: bool
    message: str
    detail: Optional[str] = None


def _coerce_int(value, default: Optional[int] = None) -> Optional[int]:
    if value in (None, ""):
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _tcp_probe(host: str, port: int) -> Optional[str]:
    """Quickly check that the host/port is reachable.

    Returns ``None`` on success, or a human-readable error string on failure.
    """

    try:
        with socket.create_connection((host, port), timeout=TCP_PROBE_TIMEOUT_SECONDS):
            return None
    except socket.gaierror as exc:
        return f"无法解析主机 {host}: {exc}"
    except (socket.timeout, TimeoutError):
        return f"连接 {host}:{port} 超时（{TCP_PROBE_TIMEOUT_SECONDS}s）"
    except OSError as exc:
        return f"连接 {host}:{port} 失败: {exc}"


def test_database_connection(connection_config: dict) -> ConnectionTestResult:
    engine_raw = (connection_config.get("engine") or "mysql").strip().lower()
    host = (connection_config.get("host") or "").strip()
    database = (connection_config.get("database") or "").strip()
    username = (connection_config.get("username") or "").strip()
    password = connection_config.get("password") or ""
    port = _coerce_int(
        connection_config.get("port"),
        default=DEFAULT_DATABASE_PORTS.get(engine_raw),
    )

    if not host:
        return ConnectionTestResult(False, "数据库主机不能为空")
    if port is None:
        return ConnectionTestResult(False, "数据库端口不能为空")
    if port <= 0 or port > 65535:
        return ConnectionTestResult(False, f"数据库端口 {port} 不合法")

    if engine_raw in ("mysql", "mariadb"):
        return _test_mysql(host, port, username, password, database)
    if engine_raw in ("postgresql", "postgres"):
        return _test_postgresql(host, port, username, password, database)
    if engine_raw in ("sqlserver", "mssql"):
        return _test_sqlserver(host, port, username, password, database)
    if engine_raw == "oracle":
        return _test_oracle(host, port, username, password, database)

    tcp_error = _tcp_probe(host, port)
    if tcp_error:
        return ConnectionTestResult(False, tcp_error)
    return ConnectionTestResult(
        True,
        f"已连通 {host}:{port}（未知数据库类型 {engine_raw}，仅完成 TCP 探测）",
    )


def _test_mysql(host: str, port: int, user: str, password: str, db: str) -> ConnectionTestResult:
    try:
        import MySQLdb  # type: ignore
        from MySQLdb import OperationalError  # type: ignore
    except ImportError:
        tcp_error = _tcp_probe(host, port)
        if tcp_error:
            return ConnectionTestResult(False, tcp_error)
        return ConnectionTestResult(
            True,
            f"已连通 {host}:{port}（未安装 mysqlclient，未执行登录测试）",
        )

    kwargs = {
        "host": host,
        "port": port,
        "user": user,
        "passwd": password,
        "connect_timeout": DB_CONNECT_TIMEOUT_SECONDS,
        "read_timeout": DB_READ_TIMEOUT_SECONDS,
        "write_timeout": DB_READ_TIMEOUT_SECONDS,
        "charset": "utf8mb4",
    }
    if db:
        kwargs["db"] = db

    try:
        conn = MySQLdb.connect(**kwargs)
    except OperationalError as exc:
        raw = str(exc.args[-1] if exc.args else exc)
        if _looks_like_handshake_failure(raw):
            return ConnectionTestResult(False, _annotate_handshake_error("MySQL", raw))
        return ConnectionTestResult(False, f"MySQL 连接失败: {raw}")
    except Exception as exc:  # noqa: BLE001 - surface driver errors verbatim
        raw = str(exc)
        if _looks_like_handshake_failure(raw):
            return ConnectionTestResult(False, _annotate_handshake_error("MySQL", raw))
        return ConnectionTestResult(False, f"MySQL 连接失败: {raw}")

    try:
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.fetchone()
        cur.close()
    finally:
        conn.close()
    return ConnectionTestResult(True, f"成功连接 MySQL {host}:{port}")


def _test_postgresql(host: str, port: int, user: str, password: str, db: str) -> ConnectionTestResult:
    try:
        import psycopg2  # type: ignore
    except ImportError:
        try:
            import psycopg  # type: ignore  # psycopg3
            psycopg2 = None
        except ImportError:
            tcp_error = _tcp_probe(host, port)
            if tcp_error:
                return ConnectionTestResult(False, tcp_error)
            return ConnectionTestResult(
                True,
                f"已连通 {host}:{port}（未安装 psycopg2/psycopg，未执行登录测试）",
            )
    else:
        psycopg = None

    try:
        if psycopg2 is not None:
            conn = psycopg2.connect(
                host=host,
                port=port,
                user=user or None,
                password=password or None,
                dbname=db or None,
                connect_timeout=DB_CONNECT_TIMEOUT_SECONDS,
            )
        else:
            conn = psycopg.connect(  # type: ignore[union-attr]
                host=host,
                port=port,
                user=user or None,
                password=password or None,
                dbname=db or None,
                connect_timeout=DB_CONNECT_TIMEOUT_SECONDS,
            )
    except Exception as exc:  # noqa: BLE001
        return ConnectionTestResult(False, f"PostgreSQL 连接失败: {exc}")

    try:
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.fetchone()
        cur.close()
    finally:
        conn.close()
    return ConnectionTestResult(True, f"成功连接 PostgreSQL {host}:{port}")


def _test_sqlserver(host: str, port: int, user: str, password: str, db: str) -> ConnectionTestResult:
    try:
        import pyodbc  # type: ignore
    except ImportError:
        try:
            import pymssql  # type: ignore
        except ImportError:
            tcp_error = _tcp_probe(host, port)
            if tcp_error:
                return ConnectionTestResult(False, tcp_error)
            return ConnectionTestResult(
                True,
                f"已连通 {host}:{port}（未安装 pyodbc/pymssql，未执行登录测试）",
            )
        try:
            conn = pymssql.connect(
                server=host,
                port=port,
                user=user or None,
                password=password or None,
                database=db or None,
                login_timeout=DB_CONNECT_TIMEOUT_SECONDS,
            )
        except Exception as exc:  # noqa: BLE001
            return ConnectionTestResult(False, f"SQL Server 连接失败: {exc}")
        try:
            cur = conn.cursor()
            cur.execute("SELECT 1")
            cur.fetchone()
            cur.close()
        finally:
            conn.close()
        return ConnectionTestResult(True, f"成功连接 SQL Server {host}:{port} (pymssql)")

    drivers = [d for d in pyodbc.drivers() if "SQL Server" in d]
    if not drivers:
        tcp_error = _tcp_probe(host, port)
        if tcp_error:
            return ConnectionTestResult(False, tcp_error)
        return ConnectionTestResult(
            True,
            f"已连通 {host}:{port}（未发现 ODBC SQL Server 驱动，未执行登录测试）",
        )
    driver = drivers[0]
    conn_str = (
        f"DRIVER={{{driver}}};SERVER={host},{port};"
        f"UID={user};PWD={password};Connection Timeout={DB_CONNECT_TIMEOUT_SECONDS};"
    )
    if db:
        conn_str += f"DATABASE={db};"
    try:
        conn = pyodbc.connect(conn_str, timeout=DB_CONNECT_TIMEOUT_SECONDS)
    except Exception as exc:  # noqa: BLE001
        return ConnectionTestResult(False, f"SQL Server 连接失败: {exc}")
    try:
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.fetchone()
        cur.close()
    finally:
        conn.close()
    return ConnectionTestResult(True, f"成功连接 SQL Server {host}:{port} ({driver})")


def _test_oracle(host: str, port: int, user: str, password: str, db: str) -> ConnectionTestResult:
    driver_module = None
    try:
        import oracledb as driver_module  # type: ignore
    except ImportError:
        try:
            import cx_Oracle as driver_module  # type: ignore
        except ImportError:
            tcp_error = _tcp_probe(host, port)
            if tcp_error:
                return ConnectionTestResult(False, tcp_error)
            return ConnectionTestResult(
                True,
                f"已连通 {host}:{port}（未安装 oracledb/cx_Oracle，未执行登录测试）",
            )

    service = db or "XE"
    dsn = f"{host}:{port}/{service}"
    try:
        conn = driver_module.connect(user=user, password=password, dsn=dsn)
    except Exception as exc:  # noqa: BLE001
        return ConnectionTestResult(False, f"Oracle 连接失败: {exc}")
    try:
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM DUAL")
        cur.fetchone()
        cur.close()
    finally:
        conn.close()
    return ConnectionTestResult(True, f"成功连接 Oracle {dsn}")


def _parse_opcua_endpoint(endpoint_url: str) -> tuple[str, int]:
    """Return ``(host, port)`` parsed from an ``opc.tcp://host:port[/path]`` URL."""

    parsed = urlparse(endpoint_url)
    host = parsed.hostname or ""
    port = parsed.port or OPCUA_DEFAULT_PORT
    return host, port


def test_opcua_connection(connection_config: dict) -> ConnectionTestResult:
    """Connect to the OPC UA server, optionally read the configured node."""

    endpoint = (connection_config.get("endpointUrl") or "").strip()
    node_id = (connection_config.get("nodeId") or "").strip()
    username = (connection_config.get("username") or "").strip()
    password = connection_config.get("password") or ""

    if not endpoint:
        return ConnectionTestResult(False, "OPC UA 服务器地址不能为空")
    if not endpoint.startswith("opc.tcp://"):
        return ConnectionTestResult(False, "OPC UA 服务器地址需以 opc.tcp:// 开头")

    host, port = _parse_opcua_endpoint(endpoint)
    if not host:
        return ConnectionTestResult(False, f"无法从 {endpoint} 解析主机名")

    tcp_error = _tcp_probe(host, port)
    if tcp_error:
        return ConnectionTestResult(False, tcp_error)

    try:
        from asyncua.sync import Client  # type: ignore
    except ImportError:
        return ConnectionTestResult(
            True,
            f"已连通 {host}:{port}（未安装 asyncua，未执行 OPC UA 握手）",
        )

    client = Client(url=endpoint, timeout=OPCUA_TIMEOUT_SECONDS)
    if username:
        client.set_user(username)
        client.set_password(password or "")

    try:
        client.connect()
    except (asyncio.TimeoutError, concurrent.futures.TimeoutError):
        return ConnectionTestResult(
            False,
            f"OPC UA 连接超时（{OPCUA_TIMEOUT_SECONDS}s）：服务器在握手阶段无响应，"
            "请确认 endpointUrl 路径是否正确，或服务器是否要求安全策略 (Sign/Sign&Encrypt)。",
        )
    except Exception as exc:  # noqa: BLE001 - surface stack-level OPC UA errors
        logger.exception("OPC UA connect failed: endpoint=%s", endpoint)
        return ConnectionTestResult(False, f"OPC UA 连接失败: {_describe_exception(exc)}")

    try:
        try:
            server_node = client.get_server_node()
            product_uri = server_node.get_child(["0:ServerStatus", "0:BuildInfo", "0:ProductUri"])
            product_value = product_uri.read_value()
        except Exception as exc:  # noqa: BLE001
            logger.exception("OPC UA read server info failed: endpoint=%s", endpoint)
            return ConnectionTestResult(
                False,
                f"OPC UA 握手成功但读取服务器信息失败: {_describe_exception(exc)}",
            )

        if node_id:
            try:
                node = client.get_node(node_id)
                value = node.read_value()
            except Exception as exc:  # noqa: BLE001
                logger.exception("OPC UA read node failed: endpoint=%s node=%s", endpoint, node_id)
                return ConnectionTestResult(
                    False,
                    f"OPC UA 已连接，但节点 {node_id} 读取失败: {_describe_exception(exc)}",
                )
            return ConnectionTestResult(
                True,
                f"成功连接 OPC UA {endpoint}（{product_value}），节点 {node_id} 当前值: {value}",
            )

        return ConnectionTestResult(
            True,
            f"成功连接 OPC UA {endpoint}（{product_value}）",
        )
    finally:
        try:
            client.disconnect()
        except Exception:  # noqa: BLE001 - disconnect best-effort
            pass


def _describe_exception(exc: BaseException) -> str:
    """Format an exception so the human-facing message is never empty."""

    cls = exc.__class__.__name__
    text = str(exc).strip()
    if text:
        return f"{cls}: {text}"
    rep = repr(exc).strip()
    if rep in ("", f"{cls}()", f"{cls}('')"):
        return cls
    return f"{cls}: {rep}"
