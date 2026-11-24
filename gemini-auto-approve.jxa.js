#!/usr/bin/osascript -l JavaScript
// Gemini Desktop continuous tool-permission monitor.
// Uses macOS Accessibility APIs to observe Gemini Desktop permission prompts.
// Audit-only by default. Active approval requires an explicit tool allowlist.
ObjC.import('Cocoa');
ObjC.import('ApplicationServices');
ObjC.bindFunction('AXUIElementCreateApplication', ['id', ['unsigned int']]);
ObjC.bindFunction('AXUIElementCopyAttributeValue', ['int', ['id', 'id', 'id*']]);
ObjC.bindFunction('AXUIElementPerformAction', ['int', ['id', 'id']]);
const logPath = ObjC.unwrap($.NSHomeDirectory()) + '/Library/Logs/gemini-auto-approve-runtime.log';
const bundleID = 'com.google.GeminiMacOS';
function geminiIsRunning() {
  return $.NSRunningApplication.runningApplicationsWithBundleIdentifier(bundleID).count > 0;
}
function geminiIsFrontmost() {
  const app = $.NSWorkspace.sharedWorkspace.frontmostApplication;
  return app !== null && ObjC.unwrap(app.bundleIdentifier) === bundleID;
}
// Defense in depth only: keyword checks cannot establish that an operation is safe.
let allowedTools = [];
const blockedPatterns = [
  'rm -rf','rm -r ','rm -f ','sudo ','git push','git reset --hard',
  'git clean -fd','git clean -df','diskutil erase','mkfs',
  'shred ','dd if=','| bash','| sh','chmod -r','chown -r',
  'launchctl bootout','tccutil reset','drop table','truncate table','delete from '
];
function log(s) {
  const stamp = new Date().toISOString();
  const line = stamp + ' | JXA ' + s + '\n';
  const fm = $.NSFileManager.defaultManager;
  if (!fm.fileExistsAtPath(logPath)) {
    $(line).writeToFileAtomicallyEncodingError($(logPath), true, $.NSUTF8StringEncoding, null);
  } else {
    const f = $.NSFileHandle.fileHandleForWritingAtPath($(logPath));
    f.seekToEndOfFile;
    f.writeData($(line).dataUsingEncoding($.NSUTF8StringEncoding));
    f.closeFile;
  }
}
function get(el, attr) {
  let r = Ref();
  const rc = $.AXUIElementCopyAttributeValue(el, attr, r);
  if (rc !== 0) return null;
  return ObjC.deepUnwrap(r[0]);
}
function val(el, attr) {
  const s = get(el, attr);
  return (typeof s === 'string') ? s : '';
}
function kids(el) {
  const a = get(el, 'AXChildren');
  return Array.isArray(a) ? a : [];
}
function descend(root, cap) {
  const result = [], stack = [root];
  while (stack.length && result.length < cap) {
    const e = stack.pop();
    result.push(e);
    const children = kids(e);
    for (let i=children.length - 1; i >= 0; --i) stack.push(children[i]);
  }
  return result;
}
function toolOf(text) {
  const m = /^Allow Gemini to run ([^\r\n]+) on your machine\?$/.exec(text.trim());
  return m ? m[1] : null;
}
function buttonLabel(el) {
  if (val(el,'AXRole') !== 'AXButton') return '';
  return [val(el,'AXTitle').trim(), val(el,'AXDescription').trim()];
}
function cancel(el) {
  const labels = buttonLabel(el);
  return labels && labels.some(x => x === '取消' || x === 'Cancel' ||
    x === '拒绝' || x === 'Deny' ||
    x === '取消，键盘快捷键为 Escape' ||
    x === 'Cancel, keyboard shortcut Escape');
}
function allow(el) {
  const labels = buttonLabel(el);
  return labels && labels.some(x => x === '允许' || x === 'Allow' ||
    x === '允许一次' || x === 'Allow Once' ||
    x === '允许，键盘快捷键为 Command Return' ||
    x === 'Allow, keyboard shortcut Command Return');
}
// Fail closed for unknown tools, opaque requests and obvious sensitive actions.
function checkSafety(tool, detail) {
  if (!allowedTools.includes(tool)) return 'tool not explicitly allowlisted';
  if (/call tool|terminal|shell|execute|script|command|write|edit|delete|upload|send|permission/i.test(tool))
    return 'generic or potentially mutating tool';
  if (!detail.trim()) return 'request details unavailable';
  const lower = detail.toLowerCase();
  if (blockedPatterns.some(x => lower.includes(x))) return 'requires manual review';
  if (['/.ssh/', '/.aws/', '/.gnupg/', 'private_key', 'access_token',
       'password', 'secret', 'credential', 'api_key'].some(x => lower.includes(x)))
    return 'potentially sensitive content';
  return null;
}
let lastDiagnostic = null;
function diagnostic(reason) {
  if (reason !== lastDiagnostic) log('SKIPPED ' + reason);
  lastDiagnostic = reason;
}
function findCandidates() {
  const apps = $.NSRunningApplication.runningApplicationsWithBundleIdentifier(bundleID);
  const found = [];
  for (let j=0;j<apps.count;j++) {
    const root = $.AXUIElementCreateApplication(apps.objectAtIndex(j).processIdentifier);
    const windows = get(root, 'AXWindows') || [];
    for (const win of windows) {
      for (const e of descend(win, 1600)) {
        if (val(e,'AXRole') !== 'AXStaticText') continue;
        const tool = toolOf(val(e, 'AXValue'));
        if (!tool) continue;
        // Gemini nests the action buttons several groups above the prompt text.
        let parent = e, nodes = [], allows = [], cancels = [];
        for (let depth = 0; depth < 7; depth++) {
          parent = get(parent, 'AXParent');
          if (!parent) break;
          nodes = descend(parent, 320);
          allows = nodes.filter(allow);
          cancels = nodes.filter(cancel);
          if (allows.length === 1 && cancels.length === 1) break;
        }
        if (allows.length !== 1 || cancels.length !== 1) {
          diagnostic('buttons not found tool=' + tool);
          continue;
        }
        const detailTexts = nodes.filter(x => ['AXStaticText','AXTextArea'].includes(val(x,'AXRole')))
          .map(x => val(x,'AXValue'))
          .filter(x => x && !x.startsWith('Allow Gemini to run '));
        // Inspect all visible request details, including generic MCP wrappers.
        const detail = detailTexts.join('\n');
        if (detail.length > 12000) {
          diagnostic('oversized request tool=' + tool);
          continue;
        }
        found.push({tool:tool, allow:allows[0], detail:detail, signature:tool+'|'+detail});
      }
    }
  }
  return found;
}
let lastSignature=null, lastPressTime=0, attempts=0, lastBlocked=null;
function tick(dry) {
  if (!geminiIsRunning()) {
    lastSignature=null; attempts=0; lastBlocked=null;
    return;
  }
  const found = findCandidates();
  if (!found.length) { lastSignature=null; attempts=0; lastBlocked=null; return; }
  lastDiagnostic = null;
  if (found.length !== 1) {
    if (lastBlocked !== 'ambiguous') log('BLOCKED multiple permission dialogs');
    lastBlocked='ambiguous';
    return;
  }
  const c=found[0];
  if (dry) { diagnostic('AUDIT permission prompt: '+c.tool+'; no click'); return; }
  const issue=checkSafety(c.tool,c.detail);
  if (issue) {
    const reason='BLOCKED '+c.tool+': '+issue;
    if (lastBlocked !== reason) log(reason);
    lastBlocked=reason;
    return;
  }
  const same=c.signature === lastSignature;
  if (same && Date.now()-lastPressTime < 2000) return;
  if (same && attempts >= 2) {
    if (lastBlocked !== 'stillPending') log('STILL_PENDING '+c.tool+': 2 press attempts');
    lastBlocked='stillPending';
    return;
  }
  if (!same) attempts=0;
  lastBlocked=null;
  // Re-check immediately before clicking in case Gemini quit during the scan.
  if (!geminiIsRunning()) {
    lastSignature=null; attempts=0; lastBlocked=null;
    return;
  }
  const status = $.AXUIElementPerformAction(c.allow,'AXPress');
  if (status === 0) {
    lastSignature=c.signature;
    lastPressTime=Date.now();
    attempts++;
    log('APPROVED '+c.tool+' attempt='+attempts+' (AXPress succeeded)');
  } else {
    log('PRESS_FAILED '+c.tool+' AX='+status);
  }
}
function run(argv) {
  const once=argv.indexOf('--once')>=0;
  const dry=argv.indexOf('--enable')<0 || argv.indexOf('--dry-run')>=0;
  allowedTools=argv.filter(x=>x.startsWith('--allow-tool=')).map(x=>x.slice(13)).filter(Boolean);
  if (!dry && !allowedTools.length) throw Error('Active mode requires --allow-tool=EXACT_TOOL_NAME');

  if (argv.indexOf('--self-test') >= 0) {
    allowedTools=['Read Documentation', 'Call Tool', 'Terminal Task'];
    const cases = [
      [toolOf('Allow Gemini to run Read Documentation on your machine?') === 'Read Documentation', 'prompt recognition'],
      [toolOf('unrelated text') === null, 'unrelated prompt rejected'],
      [checkSafety('Unknown Tool', 'description') !== null, 'unknown tool blocked'],
      [checkSafety('Call Tool', 'description') !== null, 'opaque wrapper blocked'],
      [checkSafety('Read Documentation', '') !== null, 'empty details blocked'],
      [checkSafety('Read Documentation', 'Read public documentation') === null, 'allowlisted tool'],
      [checkSafety('Read Documentation', 'Read /.ssh/id_rsa') !== null, 'sensitive path blocked'],
      [checkSafety('Read Documentation', 'git push origin main') !== null, 'push blocked'],
      [checkSafety('Terminal Task', 'echo test') !== null, 'terminal blocked']
    ];
    if (cases.some(x => !x[0])) throw Error('SELF_TEST FAILED: '+cases.filter(x=>!x[0]).map(x=>x[1]).join(', '));
    return 'SELF_TEST PASS ('+cases.length+' cases)';
  }
  log('monitor started once='+once+' dry='+dry+' accessibilityTrusted='+$.AXIsProcessTrusted());
  if (once) { tick(dry); return 'done'; }
  let lastHeartbeat = 0;
  while (true) {
    try {
      if (Date.now()-lastHeartbeat > 300000) {
        log('HEARTBEAT running='+(geminiIsRunning()?'yes':'no')+' foreground='+(geminiIsFrontmost()?'Gemini':'other'));
        lastHeartbeat=Date.now();
      }
      tick(dry);
    } catch(e) { log('ERROR '+String(e).slice(0,170)); }
    delay(0.8);
  }
}
