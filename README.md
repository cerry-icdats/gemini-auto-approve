# Gemini Auto Approve for macOS

[English](#english) | [简体中文](#简体中文)

A lightweight, unofficial macOS utility for Gemini Desktop tool-permission dialogs. It uses built-in JavaScript for Automation (JXA) and macOS Accessibility APIs without simulating keyboard shortcuts.

## English

### Two versions

| Version | Start command | Behavior |
| --- | --- | --- |
| Observer (default) | `./observe.sh` | Detects permission dialogs without clicking. |
| Full Auto | `./auto-approve.sh` | Automatically clicks Allow on supported, unambiguous Gemini tool-permission dialogs. |

Full Auto does not require a tool-name allowlist or inspect request content. It is an explicit opt-in, not the default for the shared script.

### Install

Requirements: macOS, a compatible Gemini Desktop build (bundle ID `com.google.GeminiMacOS`), and Accessibility access for the script runner. No API key or third-party library is needed.

```sh
git clone https://github.com/cerry-icdats/gemini-auto-approve.git
cd gemini-auto-approve
osascript -l JavaScript gemini-auto-approve.jxa.js --self-test
```

If required, manually grant Accessibility access to the terminal or process running the script in System Settings > Privacy & Security > Accessibility.

### A. Observer

```sh
./observe.sh
```

### B. Full Auto

```sh
./auto-approve.sh
```

Once started, this version automatically handles supported dialogs without requiring confirmation for each tool. Press Control-C to stop. Running the shared JXA script without options defaults to observation.

### Supported dialogs

The detector looks for Gemini's permission message:

> Allow Gemini to run [tool name] on your machine?

It recognizes the corresponding Allow and Cancel buttons, including Allow Once and Deny variants, English and Simplified Chinese button labels, and supported keyboard-shortcut label variants. Example dialog tool names include Call Tool, Browse Execute and Browse Tabs. The implementation also recognizes other names matching the same message format; it does not click arbitrary buttons or unrelated system prompts.

Ambiguous dialogs, oversized requests and repeated pending clicks are guarded against. UI changes may require updates.

### Important safety information

Full Auto approves recognized requests without reviewing their operations. Depending on connected tools, it could approve file changes, deletion, commands or external transmission. Use only in a trusted, isolated environment with least-privilege tools and no sensitive information. It is not a security boundary. Keep Observer mode for sensitive work. The utility does not grant macOS permissions itself.

### Stop, diagnose and test

- Control-C stops monitoring.
- Append `--once` to either launcher for one scan.
- Logs: `~/Library/Logs/gemini-auto-approve-runtime.log`.
- If no dialogs are detected, check Gemini is running, Accessibility permission is granted, and the prompt matches the supported format.
- No login item or background service is installed automatically.
- The shared script also retains an optional exact-name allowlist mode using `--enable --allow-tool=NAME`; its heuristic checks are not a sandbox.
- Self-tests verify parsing and policy logic, not live UI behavior on every Gemini version.

## 简体中文

这是一个非官方 macOS 小工具，用来处理 Gemini 桌面端反复出现的工具授权弹窗。不需要 API Key 或第三方依赖。

### 两个版本

| 版本 | 启动命令 | 功能 |
| --- | --- | --- |
| 观察版（默认） | `./observe.sh` | 识别弹窗，不自动点击。 |
| 全自动版 | `./auto-approve.sh` | 对已识别的明确授权弹窗自动点击允许，无需逐个设置工具名。 |

### 安装

```sh
git clone https://github.com/cerry-icdats/gemini-auto-approve.git
cd gemini-auto-approve
osascript -l JavaScript gemini-auto-approve.jxa.js --self-test
```

如有需要，在 macOS「系统设置 → 隐私与安全性 → 辅助功能」手动授权运行脚本的终端或进程。

### 使用方式

观察版：

```sh
./observe.sh
```

全自动版：

```sh
./auto-approve.sh
```

启动全自动版后，符合识别规则的 Gemini 工具授权弹窗会自动点击允许，不用每次手动确认。按 Control-C 停止。

### 支持哪些弹窗？

匹配 Gemini 的通用工具授权提示：

> Allow Gemini to run [工具名称] on your machine?

支持 Call Tool、Browse Execute、Browse Tabs 等采用相同提示格式的工具授权，以及允许、允许一次、取消、拒绝等中英文按钮和已识别的快捷键标签。不会点击无关软件或 macOS 系统权限弹窗。多个弹窗无法明确区分时，不自动点击。

### 注意事项

全自动版不检查请求内容，也不依赖工具名称或内容关键词白名单。根据已连接工具的能力，它可能批准文件修改、删除、命令执行或数据外发。请仅在可信、隔离、最小权限且没有敏感信息的环境中使用。敏感工作建议使用观察版。

- 两个版本都支持追加 `--once` 只扫描一次。
- 日志位于 `~/Library/Logs/gemini-auto-approve-runtime.log`。
- 默认不安装开机启动服务。
- 自测覆盖识别逻辑和模式规则，不代表所有 Gemini 版本均已完成真实界面测试。

## License

MIT. Not affiliated with or endorsed by Google.
