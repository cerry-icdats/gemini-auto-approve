# Gemini Auto Approve for macOS

[English](#english) | [简体中文](#简体中文)

A lightweight, unofficial Gemini Desktop permission-dialog utility using macOS JavaScript for Automation (JXA) and Accessibility APIs.

## English

### Two versions, one engine

| Version | Launcher | Default configuration |
| --- | --- | --- |
| Blank / Custom (default) | `./observe.sh` | Empty allowlist; observes without clicking. |
| Preset | `./auto-approve.sh` | Three previously observed browser tool names. |

Both use the same code and exact-name approval policy. Only their initial configuration differs. Unlisted or ambiguous dialogs remain manual. There is no unrestricted approve-all mode in this version.

### Install

```sh
git clone https://github.com/cerry-icdats/gemini-auto-approve.git
cd gemini-auto-approve
./observe.sh --self-test
```

Requirements: macOS, a compatible Gemini Desktop build (bundle ID `com.google.GeminiMacOS`), and Accessibility permission for the process running the script. Grant this manually in System Settings > Privacy & Security > Accessibility if needed. No API key or third-party libraries are required.

### A. Blank / Custom

```sh
./observe.sh
```

Initially no requests are automatically approved. To add your own tool names, copy and edit the local configuration:

```sh
cp -n config.example.json config.json
```

Example:

```json
{
  "allowed_tools": ["Browse  Tabs", "Browse  Status"]
}
```

Use the exact tool names shown in a supported dialog or local log. Spaces and capitalization matter. Stop the monitor with Control-C and restart after editing.

### B. Preset

```sh
./auto-approve.sh
```

The shipped `config.preset.json` contains:

```json
{
  "allowed_tools": [
    "Browse  Execute",
    "Browse  Tabs",
    "Browse  Status"
  ]
}
```

These are generic browser tool names observed in actual permission dialogs. To customize the preset without changing tracked files:

```sh
cp -n config.preset.json config.preset.local.json
```

Edit the local copy and restart. Both local configuration files are ignored by Git.

### Supported dialogs and safety

Matches the Gemini message `Allow Gemini to run [tool name] on your machine?` with recognized Allow/Cancel buttons, including English and Simplified Chinese button labels. Does not click unrelated applications or macOS system prompts. Unlisted names, generic command wrappers, missing request details, obvious sensitive keyword matches and ambiguous dialogs remain manual. Wildcards are not supported.

Browser execution can still change websites or transmit information. Keyword filters and exact names are not a sandbox and cannot prove a request safe. Only approve tools you trust in a least-privilege isolated environment. Leave sensitive work in observation mode.

### Diagnose and stop

```sh
./observe.sh --check-config
./auto-approve.sh --check-config
./auto-approve.sh --dry-run
tail -f ~/Library/Logs/gemini-auto-approve-runtime.log
```

- Control-C stops monitoring.
- Append `--once` for one scan, or `--dry-run` to prevent all clicks.
- Invalid configuration fails closed. Restart to reload configuration.
- No login item is automatically installed.
- Self-tests check parsing and policy, not live compatibility with every Gemini release.
- To prevent macOS JXA autorelease-pool memory growth during multi-day runs, the script releases Accessibility CF objects and automatically recycles the `osascript` worker every 15 minutes (`--max-runtime=900`, set `--max-runtime=0` to disable); `./observe.sh` and `./auto-approve.sh` respawn it automatically.

## 简体中文

这是一个非官方 macOS 小工具，识别 Gemini 桌面版的工具授权弹窗，无需 API Key 或第三方依赖。

### 两个版本，同一套代码

| 版本 | 启动命令 | 默认配置 |
| --- | --- | --- |
| 空白／自定义版（默认） | `./observe.sh` | 白名单为空，只观察不点击。 |
| 预设版 | `./auto-approve.sh` | 已预设三种实际识别过的浏览器工具名称。 |

两版使用完全相同的核心代码和审批逻辑，仅默认配置不同。不在名单里的请求仍手动确认，不提供无限制全自动模式。

### 安装

```sh
git clone https://github.com/cerry-icdats/gemini-auto-approve.git
cd gemini-auto-approve
./observe.sh --self-test
```

如有需要，在 macOS「系统设置 → 隐私与安全性 → 辅助功能」手动授权运行脚本的进程。

### A. 空白／自定义版

```sh
./observe.sh
```

默认不自动同意任何弹窗。想自动同意自己选定的工具时，先复制配置：

```sh
cp -n config.example.json config.json
```

用文本编辑器打开 `config.json`，例如：

```json
{
  "allowed_tools": ["Browse  Tabs", "Browse  Status"]
}
```

工具名称以实际弹窗或日志为准，注意大小写和空格。修改后按 Control-C 停止，再重新启动。

### B. 预设版

```sh
./auto-approve.sh
```

预设配置 `config.preset.json`：

```json
{
  "allowed_tools": [
    "Browse  Execute",
    "Browse  Tabs",
    "Browse  Status"
  ]
}
```

这些是实际授权弹窗中识别过的通用浏览器工具名称。想修改预设版时，先复制配置：

```sh
cp -n config.preset.json config.preset.local.json
```

编辑本地副本，再重启程序。两份个人配置均不纳入 Git。

### 识别范围与安全说明

匹配 Gemini 的通用工具授权提示：

> Allow Gemini to run [工具名称] on your machine?

支持已识别的中英文允许、取消按钮。不点击其他软件或 macOS 系统权限弹窗。未列入白名单、通用命令包装器、缺少请求详情、命中通用敏感关键词或无法明确识别的弹窗均保留手动确认。不支持通配符。

浏览器执行工具仍可能操作网页或传输数据。关键词与工具名过滤不是安全沙箱，不能保证所有请求安全。建议只在可信、隔离、最小权限的环境中使用，敏感工作使用纯观察模式。

### 查看工具名称、检查配置和停止

```sh
./observe.sh --check-config
./auto-approve.sh --check-config
./auto-approve.sh --dry-run
tail -f ~/Library/Logs/gemini-auto-approve-runtime.log
```

按 Control-C 停止。追加 `--once` 仅扫描一次，追加 `--dry-run` 强制不点击。配置错误时停止，不会自动放宽权限。默认不安装开机启动项。自测不等于所有 Gemini 版本的真实界面验证。
- 为避免长时间运行时 macOS JXA 自动释放池占用持续增长，脚本会显式释放 Accessibility CF 对象并每 15 分钟自动重启一次 `osascript` 工作进程（`--max-runtime=900`，传 `--max-runtime=0` 可关闭）；`./observe.sh` 与 `./auto-approve.sh` 会自动拉起新进程。

## License

MIT. Not affiliated with or endorsed by Google.
