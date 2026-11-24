# Gemini Auto Approve for macOS

An unofficial, local macOS utility that observes Gemini Desktop tool-permission dialogs using JavaScript for Automation (JXA) and Accessibility APIs. No network service, API keys, or external dependencies are required by the script.

## Safety first

Default mode is audit-only: no buttons are clicked. Active mode is opt-in and requires exact, user-selected tool names. Generic wrappers, command execution, obviously mutating tools, missing request details, and certain sensitive text are blocked. These are heuristic checks, not a sandbox or a security guarantee. A tool name or visible prompt can be misleading. Only allow tools you have independently verified to be low-risk and read-only. Keep manual approval for sensitive data, writes, shell commands and external actions. Do not use on an untrusted machine or with untrusted prompts.

## Requirements

- macOS and Gemini Desktop (bundle identifier `com.google.GeminiMacOS`).
- Accessibility permission for the process running JXA, granted manually in System Settings > Privacy & Security > Accessibility.
- A compatible Gemini permission dialog. UI changes or localization may affect detection.

## Usage

Run from the repository directory:

```sh
osascript -l JavaScript gemini-auto-approve.jxa.js --self-test
osascript -l JavaScript gemini-auto-approve.jxa.js --once --dry-run
osascript -l JavaScript gemini-auto-approve.jxa.js --dry-run
```

The last command monitors continuously without clicking. Press Control-C to stop. Logs are written locally to `~/Library/Logs/gemini-auto-approve-runtime.log`; request bodies are not intentionally logged. Active mode requires `--enable` and one or more `--allow-tool=EXACT_TOOL_NAME` arguments. Use only exact names from dialogs you have manually inspected. Omit `--enable` to return to audit mode.

No background service is installed by default. The self-test checks parsing and policy logic, not live Accessibility interaction. Actual compatibility depends on your Gemini build and permissions.

## 中文简介

这是一个非官方 macOS 工具，用于识别 Gemini 桌面端的工具授权弹窗。默认只观察，不点击；主动批准需显式开启并指定已确认安全的工具名称。关键词过滤不能代替真正的权限隔离，不建议用于敏感数据、终端命令或高风险操作。安装和授权均由使用者自行控制。

## License

MIT. Not affiliated with or endorsed by Google.
