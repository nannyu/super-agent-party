# py/mode_change.py

import logging
import platform
from py.get_setting import load_settings, save_settings
from py.ws_manager import ws_manager

logger = logging.getLogger("app")

async def update_workspace_settings(
    cli_enabled: bool = None,
    engine: str = None,
    local_permission_mode: str = None,
    ds_permission_mode: str = None,
    acp_permission_mode: str = None,
    wsl_permission_mode: str = None,
):
    """
    动态调整工作区工具的开启状态、执行引擎以及权限模式。
    支持本地环境(local)、Docker沙箱(ds)、ACP协议(acp)和WSL沙箱(wsl)四种引擎。
    WSL 引擎仅在 Windows 上可用。
    """
    try:
        settings = await load_settings()
        changed = False

        # 1. 主开关和引擎
        if cli_enabled is not None:
            settings["CLISettings"]["enabled"] = cli_enabled
            changed = True
        
        wsl_allowed = platform.system() == "Windows"
        valid_engines = ["local", "ds", "acp"]
        if wsl_allowed:
            valid_engines.append("wsl")
        
        if engine in valid_engines:
            settings["CLISettings"]["engine"] = engine
            changed = True

        # 2. 本地环境权限
        if local_permission_mode in ["plan", "default", "auto-approve", "yolo", "cowork", "goal"]:
            if "localEnvSettings" not in settings:
                settings["localEnvSettings"] = {}
            settings["localEnvSettings"]["permissionMode"] = local_permission_mode
            changed = True

        # 3. Docker Sandbox 权限
        if ds_permission_mode in ["plan", "default", "auto-approve", "yolo", "cowork", "goal"]:
            if "dsSettings" not in settings:
                settings["dsSettings"] = {}
            settings["dsSettings"]["permissionMode"] = ds_permission_mode
            changed = True

        # 4. ★ ACP 协议权限
        if acp_permission_mode in ["plan", "default", "auto-approve", "yolo", "cowork", "goal"]:
            if "acpSettings" not in settings:
                settings["acpSettings"] = {}
            settings["acpSettings"]["permissionMode"] = acp_permission_mode
            changed = True

        # 5. ★ WSL 沙盒权限（仅 Windows）
        if wsl_permission_mode in ["plan", "default", "auto-approve", "yolo", "cowork", "goal"]:
            if "wslSettings" not in settings:
                settings["wslSettings"] = {}
            settings["wslSettings"]["permissionMode"] = wsl_permission_mode
            changed = True

        if changed:
            await save_settings(settings)
            await ws_manager.broadcast_settings_update(settings)
            
            # 构建状态消息
            parts = ["Workspace settings updated."]
            
            if cli_enabled is not None:
                parts.append(f"CLI tools: {'enabled' if cli_enabled else 'disabled'}.")
            
            if engine:
                engine_names = {"local": "Local", "ds": "Docker Sandbox", "acp": "ACP Protocol", "wsl": "WSL Sandbox"}
                parts.append(f"Engine: {engine_names.get(engine, engine)}.")
            
            if local_permission_mode and local_permission_mode in ["yolo", "cowork"]:
                parts.append("Local: YOLO/COWORK mode active, commands will execute without confirmation.")
            
            if ds_permission_mode and ds_permission_mode in ["yolo", "cowork"]:
                parts.append("Docker: YOLO/COWORK mode active, commands will execute without confirmation.")
            
            if acp_permission_mode and acp_permission_mode in ["yolo", "cowork"]:
                parts.append("ACP: YOLO/COWORK mode active, sub-agents will run with full autonomy.")
            
            return " ".join(parts)
        else:
            return "No valid setting changes detected."

    except Exception as e:
        logger.error(f"Failed to update workspace settings: {e}")
        return f"Settings update failed: {str(e)}"


mode_change_tool = {
    "type": "function",
    "function": {
        "name": "update_workspace_settings",
    "description": (
        "Manage workspace CLI tool settings. "
        "Can enable/disable CLI tools, switch execution engine "
        "(Local / Docker Sandbox / WSL Sandbox (Windows only) / ACP Protocol), "
        "and change permission modes for each engine.\n\n"
        "Permission modes:\n"
        "  plan         - Read-only, deny all operations\n"
        "  default      - Interactive, confirm each action\n"
        "  auto-approve - Allow writes, deny destructive ops\n"
        "  yolo         - Full autonomy, no confirmations\n"
        "  cowork       - Same as yolo, collaborative mode"
    ),
        "parameters": {
            "type": "object",
            "properties": {
                "cli_enabled": {
                    "type": "boolean",
                    "description": "Enable or disable CLI tools master switch"
                },
                "engine": {
                    "type": "string",
                    "enum": ["local", "ds", "wsl", "acp"],
                    "description": (
                        "Execution engine: "
                        "local (local environment), "
                        "ds (Docker Sandbox), "
                        "wsl (WSL Sandbox - Windows only), "
                        "acp (ACP Protocol - unified CLI agent interface)"
                    )
                },
                "local_permission_mode": {
                    "type": "string",
                    "enum": ["plan", "default", "auto-approve", "yolo", "cowork", "goal"],
                    "description": "Permission mode for local environment"
                },
                "ds_permission_mode": {
                    "type": "string",
                    "enum": ["plan", "default", "auto-approve", "yolo", "cowork", "goal"],
                    "description": "Permission mode for Docker Sandbox environment"
                },
                "acp_permission_mode": {
                    "type": "string",
                    "enum": ["plan", "default", "auto-approve", "yolo", "cowork", "goal"],
                    "description": "Permission mode for ACP Protocol sub-agents"
                },
                "wsl_permission_mode": {
                    "type": "string",
                    "enum": ["plan", "default", "auto-approve", "yolo", "cowork", "goal"],
                    "description": "Permission mode for WSL Sandbox environment (Windows only)"
                }
            }
        }
    }
}