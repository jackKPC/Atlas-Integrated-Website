// ══════════════════════════════════════════════════════════
// PowerShell SANDBOX — a small, honest simulator.
//
// This is NOT a PowerShell interpreter. It recognizes a curated set of
// cmdlets/aliases/patterns pulled directly from the CCTC PowerShell
// lesson (module 1) and simulates them against a persistent in-memory
// virtual filesystem + process/service list, so a sequence of commands
// composes the way it would on a real box (create a file, then see it
// in dir, then delete it; kill a process, then it's gone from
// Get-Process). Anything outside that curated set either returns a
// curated "reference" blob (things like CIM/WMI/WinRM/.NET calls that
// need a real machine to be meaningful) or a realistic
// "not recognized" PowerShell error — never a silently wrong answer.
//
// Pure functions only: runCommand(state, line) -> { state, lines }.
// No DOM/React here, so it's easy to reason about and test standalone.
//
// Filesystem model: state.fs is a FLAT map of full-path -> entry
// ({isDir:true} or {isDir:false, content}). There is no separate
// parent/children mirror — Get-ChildItem derives a directory's
// listing by scanning for keys whose immediate parent is the target
// path. Single source of truth, so create/delete can never leave a
// stale duplicate lying around.
// ══════════════════════════════════════════════════════════

const ROOT = "C:\\labs\\cctc";

function dirEntry() { return { isDir: true }; }
function fileEntry(content) { return { isDir: false, content: content || "" }; }

function seedProcesses() {
  return [
    { ProcessName: "System", Id: 4, Handles: 1240, WS: 212, CPU: 12.4, Path: null },
    { ProcessName: "svchost", Id: 812, Handles: 480, WS: 18, CPU: 3.1, Path: "C:\\Windows\\System32\\svchost.exe" },
    { ProcessName: "svchost", Id: 940, Handles: 610, WS: 24, CPU: 1.8, Path: "C:\\Windows\\System32\\svchost.exe" },
    { ProcessName: "svchost", Id: 1112, Handles: 322, WS: 15, CPU: 0.4, Path: "C:\\Windows\\System32\\svchost.exe" },
    { ProcessName: "lsass", Id: 700, Handles: 890, WS: 9, CPU: 0.2, Path: "C:\\Windows\\System32\\lsass.exe" },
    { ProcessName: "explorer", Id: 2140, Handles: 1530, WS: 84, CPU: 2.6, Path: "C:\\Windows\\explorer.exe" },
    { ProcessName: "MsMpEng", Id: 3388, Handles: 940, WS: 130, CPU: 5.7, Path: "C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\MsMpEng.exe" },
    { ProcessName: "powershell", Id: 4420, Handles: 660, WS: 62, CPU: 1.1, Path: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" },
    { ProcessName: "dwm", Id: 1988, Handles: 410, WS: 45, CPU: 1.9, Path: "C:\\Windows\\System32\\dwm.exe" },
    { ProcessName: "RuntimeBroker", Id: 5124, Handles: 210, WS: 11, CPU: 0.1, Path: "C:\\Windows\\System32\\RuntimeBroker.exe" },
  ];
}
function seedServices() {
  return [
    { Name: "BITS", DisplayName: "Background Intelligent Transfer Service", Status: "Running" },
    { Name: "wuauserv", DisplayName: "Windows Update", Status: "Running" },
    { Name: "Spooler", DisplayName: "Print Spooler", Status: "Stopped" },
    { Name: "WinRM", DisplayName: "Windows Remote Management (WS-Management)", Status: "Running" },
    { Name: "Fax", DisplayName: "Fax", Status: "Stopped" },
    { Name: "WSearch", DisplayName: "Windows Search", Status: "Running" },
    { Name: "Themes", DisplayName: "Themes", Status: "Running" },
    { Name: "RemoteRegistry", DisplayName: "Remote Registry", Status: "Stopped" },
  ];
}

const DEFAULT_ALIASES = {
  dir: "Get-ChildItem", gci: "Get-ChildItem", ls: "Get-ChildItem",
  cat: "Get-Content", type: "Get-Content", gc: "Get-Content",
  echo: "Write-Output", write: "Write-Output",
  cls: "Clear-Host", clear: "Clear-Host",
  gm: "Get-Member", select: "Select-Object", where: "Where-Object", "?": "Where-Object",
  sort: "Sort-Object", ft: "Format-Table", fl: "Format-List",
  gl: "Get-Location", pwd: "Get-Location", cd: "Set-Location", sl: "Set-Location",
  kill: "Stop-Process", ps: "Get-Process", gps: "Get-Process",
  gsv: "Get-Service", gal: "Get-Alias", gv: "Get-Variable",
  gcm: "Get-Command", ghelp: "Get-Help", man: "Get-Help",
  ni: "New-Item", ri: "Remove-Item", rm: "Remove-Item", del: "Remove-Item", erase: "Remove-Item",
  gh: "Get-History", history: "Get-History",
};

function initialSandboxState() {
  return {
    cwd: ROOT,
    fs: {
      "C:\\": dirEntry(),
      "C:\\labs": dirEntry(),
      [ROOT]: dirEntry(),
      "C:\\Windows": dirEntry(),
      "C:\\Windows\\System32": dirEntry(),
      "C:\\Users": dirEntry(),
      "C:\\Users\\Student": dirEntry(),
      [ROOT + "\\reminder.txt"]: fileEntry("Always try your best"),
    },
    vars: {},
    aliases: { ...DEFAULT_ALIASES },
    functions: {},
    processes: seedProcesses(),
    services: seedServices(),
    history: [],
    nextPid: 9001,
  };
}

// ── path helpers ──
function normSep(p) { return p.replace(/\//g, "\\"); }
function resolvePath(cwd, p) {
  if (!p) return cwd;
  p = normSep(p);
  const base = /^[A-Za-z]:\\/.test(p) ? p : cwd.replace(/\\$/, "") + "\\" + p;
  const parts = base.split("\\").filter((x) => x !== "");
  const drive = parts.shift() + "\\";
  const out = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") { out.pop(); continue; }
    out.push(part);
  }
  return (drive + out.join("\\")).replace(/\\$/, "") || drive.replace(/\\$/, "");
}
function parentPath(absPath) {
  if (/^[A-Za-z]:$/.test(absPath)) return absPath; // drive root is its own parent
  const idx = absPath.lastIndexOf("\\");
  if (idx <= 2) return absPath.slice(0, 2); // "C:\foo" -> "C:"
  return absPath.slice(0, idx);
}
function baseName(absPath) { return absPath.slice(absPath.lastIndexOf("\\") + 1); }
function driveRootOf(p) { return p.slice(0, 2) + "\\"; } // "C:\"

// ── tokenizing ──
function splitPipeline(line) {
  const stages = []; let cur = "", inS = false, inD = false;
  for (const ch of line) {
    if (ch === "'" && !inD) inS = !inS;
    else if (ch === '"' && !inS) inD = !inD;
    if (ch === "|" && !inS && !inD) { stages.push(cur); cur = ""; continue; }
    cur += ch;
  }
  stages.push(cur);
  return stages.map((s) => s.trim()).filter(Boolean);
}
function tokenize(s) {
  const out = []; let cur = "", inS = false, inD = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "'" && !inD) { inS = !inS; continue; }
    if (ch === '"' && !inS) { inD = !inD; continue; }
    if (/\s/.test(ch) && !inS && !inD) { if (cur) { out.push(cur); cur = ""; } continue; }
    if ((ch === "," ) && !inS && !inD) { if (cur) { out.push(cur); cur = ""; } continue; }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}
// crude but effective: split top-level ">" not inside quotes, for `echo text > file`
function splitRedirect(s) {
  let inS = false, inD = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "'" && !inD) inS = !inS;
    else if (ch === '"' && !inS) inD = !inD;
    else if (ch === ">" && !inS && !inD) {
      const append = s[i + 1] === ">";
      return { head: s.slice(0, i).trim(), target: s.slice(i + (append ? 2 : 1)).trim(), append };
    }
  }
  return null;
}

function parseArgs(tokens) {
  const flags = {}, positional = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.startsWith("-") && !/^-?\d/.test(t.slice(1))) {
      const name = t.slice(1);
      const next = tokens[i + 1];
      if (next !== undefined && !(next.startsWith("-") && !/^-?\d/.test(next.slice(1)))) { flags[name.toLowerCase()] = next; i++; }
      else flags[name.toLowerCase()] = true;
    } else positional.push(t);
  }
  return { flags, positional };
}

// ── property resolution — case-insensitive, with the couple of
//    friendly aliases real PowerShell exposes (Name -> ProcessName, etc). ──
const PROP_ALIASES = {
  Process: { name: "ProcessName", id: "Id" },
};
function getProp(item, typeName, requested) {
  if (!item) return undefined;
  const aliasMap = PROP_ALIASES[typeName] || {};
  const canonical = aliasMap[String(requested).toLowerCase()] || requested;
  const key = Object.keys(item).find((k) => k.toLowerCase() === String(canonical).toLowerCase());
  return key ? item[key] : undefined;
}

// ── value shapes ──
// { kind:"objects", items:[...], typeName }  | { kind:"text", text } | { kind:"scalar", value }
const DEFAULT_COLUMNS = {
  Process: ["ProcessName", "Id", "Handles", "WS", "CPU"],
  Service: ["Status", "Name", "DisplayName"],
  FileInfo: ["Mode", "Name", "Length"],
  Alias: ["Name", "Definition"],
  Variable: ["Name", "Value"],
};

function objVal(items, typeName) { return { kind: "objects", items, typeName }; }
function textVal(text) { return { kind: "text", text }; }
function scalarVal(value) { return { kind: "scalar", value }; }

function padCell(s, w) { s = String(s); return s.length >= w ? s : s + " ".repeat(w - s.length); }
function renderTable(items, cols) {
  if (!items.length) return "";
  const widths = cols.map((c) => Math.max(c.length, ...items.map((it) => String(it[c] ?? "").length)));
  const header = cols.map((c, i) => padCell(c, widths[i])).join("  ");
  const rule = widths.map((w) => "-".repeat(w)).join("  ");
  const rows = items.map((it) => cols.map((c, i) => padCell(it[c] ?? "", widths[i])).join("  "));
  return [header, rule, ...rows].join("\n");
}
function renderList(items, cols) {
  return items.map((it) => cols.map((c) => `${c.padEnd(14)}: ${it[c] ?? ""}`).join("\n")).join("\n\n");
}
function formatValue(v, opts) {
  opts = opts || {};
  if (!v) return "";
  if (v.kind === "text") return v.text;
  if (v.kind === "scalar") return String(v.value);
  if (v.kind === "objects") {
    if (!v.items.length) return "";
    const cols = opts.props || DEFAULT_COLUMNS[v.typeName] || Object.keys(v.items[0]).slice(0, 5);
    return opts.list ? renderList(v.items, cols) : renderTable(v.items, cols);
  }
  return "";
}

// ── comparison for Where-Object ──
const OPS = {
  eq: (a, b) => String(a).toLowerCase() === String(b).toLowerCase(),
  ne: (a, b) => String(a).toLowerCase() !== String(b).toLowerCase(),
  gt: (a, b) => Number(a) > Number(b),
  ge: (a, b) => Number(a) >= Number(b),
  lt: (a, b) => Number(a) < Number(b),
  le: (a, b) => Number(a) <= Number(b),
  like: (a, b) => new RegExp("^" + String(b).replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i").test(String(a)),
  match: (a, b) => { try { return new RegExp(b, "i").test(String(a)); } catch (e) { return false; } },
  contains: (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
};
// {$_.Prop -op "val"} — strips the enclosing braces/quotes robustly.
function parseScriptBlockFilter(expr) {
  const m = expr.match(/\$_\.(\w+)\s+-(\w+)\s+([\s\S]+)/);
  if (!m) return null;
  let [, prop, op, rhs] = m;
  rhs = rhs.replace(/\}\s*$/, "").trim().replace(/^["']|["']$/g, "");
  return { prop, op: op.toLowerCase(), rhs };
}

const HELP_TEXT = {
  "get-process": "Gets the processes running on the local computer.\nSyntax: Get-Process [[-Name] <string[]>]",
  "get-service": "Gets the services on the local computer.\nSyntax: Get-Service [[-Name] <string[]>]",
  "get-command": "Lists commands (cmdlets, functions, aliases) available in the session.",
  "get-member": "Displays the properties and methods of objects (TypeName, MemberType).",
  "get-help": "Displays help about PowerShell cmdlets and concepts. Try 'Get-Help <cmdlet> -online'.",
  "get-childitem": "Gets the items and child items in a filesystem location. Alias: dir, gci, ls.",
  "get-content": "Gets the content of a file. Alias: cat, type, gc.",
  "where-object": "Filters objects from a collection based on a property value or script block.",
  "select-object": "Selects specified properties, or the first/last N objects, from a collection.",
  "get-executionpolicy": "Gets the execution policies for the current session (default: Restricted).",
  "get-alias": "Gets the aliases for the current session.",
  "get-variable": "Gets the variables in the current console.",
  "about_automatic_variables": "Describes variables created and maintained by PowerShell, e.g. $_, $?, $PSVersionTable, $PROFILE, $HOME.",
  "about_command_syntax": "Describes the syntax diagrams used to document PowerShell cmdlets: [-Name] is a required positional parameter, [-Name <type>] is optional.",
};

// Reference-only output for commands that need a real machine/network to be meaningful.
// These are NOT stateful — same output every time — and are clearly labeled in the UI.
const REFERENCE_OUTPUT = {
  "get-ciminstance": "TypeName: Root/cimv2/Win32_BIOS\n\nSMBIOSBIOSVersion : 2.10.0\nManufacturer      : American Megatrends Inc.\nName              : 2.10.0\nSerialNumber      : CCTC-LAB-0001\nVersion           : LENOVO - 1",
  "get-wmiobject": "__GENUS          : 2\n__CLASS          : Win32_BIOS\nManufacturer     : American Megatrends Inc.\nSMBIOSBIOSVersion: 2.10.0\nSerialNumber     : CCTC-LAB-0001",
  "get-cimclass": "NameSpace: ROOT/cimv2\n\nCimClassName                        CimClassMethods    CimClassProperties\n------------                        ---------------    ------------------\nWin32_Process                       {Create, Terminate} {Caption, ProcessId, ...}\nWin32_Service                       {StartService, ...} {Name, State, ...}\nWin32_LogicalDisk                   {}                  {DeviceID, DriveType, ...}",
  "get-pssessionconfiguration": "Name          : Microsoft.PowerShell\nPermission    : BUILTIN\\Administrators AccessAllowed\nEnabled       : True",
  "winrm": "WinRM configuration:\n  MaxTimeoutms = 60000\n  MaxBatchItems = 32000\n  service:\n    AllowRemoteAccess = true\n    Auth: Kerberos = true, Negotiate = true, Basic = false\n  transport: HTTP port 5985, HTTPS port 5986",
  "invoke-command": "[Reference example] Runs the script block on the named remote computer(s) over WinRM and returns the results. Requires PowerShell Remoting to be enabled on the target.",
  "start-transcript": "Transcript started, output file is C:\\labs\\cctc\\transcript-001.txt",
  "stop-transcript": "Transcript stopped, output file is C:\\labs\\cctc\\transcript-001.txt",
};

function errNotRecognized(cmd) {
  return {
    isError: true,
    text: `${cmd} : The term '${cmd}' is not recognized as the name of a cmdlet, function, script file, or operable\nprogram. Check the spelling of the name, or if a path was included, verify that the path is correct and try again.\n+ ${cmd}\n+ ~~~~~~~~~~~~~~~~\n    + CategoryInfo          : ObjectNotFound: (${cmd}:String) [], CommandNotFoundException\n    + FullyQualifiedErrorId : CommandNotFoundException`,
  };
}

function resolveCmd(state, name) {
  const low = name.toLowerCase();
  if (state.aliases[low]) return state.aliases[low];
  return name;
}

// ── main pipeline evaluation ──
function runStage(state, stageText, input) {
  const tokens = tokenize(stageText);
  if (!tokens.length) return { value: input, text: null, isError: false, state };
  const name = resolveCmd(state, tokens[0]);
  const rest = tokens.slice(1);
  const { flags, positional } = parseArgs(rest);
  const canon = name.toLowerCase();

  // ---- pipe-stage generic operators (only meaningful with an input value) ----
  if (canon === "where-object") {
    if (!input || input.kind !== "objects") return { value: input, isError: false, state };
    let items = input.items;
    const scriptBlock = rest.some((t) => t.startsWith("{"));
    if (scriptBlock) {
      const f = parseScriptBlockFilter(stageText);
      if (f && OPS[f.op]) items = items.filter((it) => OPS[f.op](getProp(it, input.typeName, f.prop), f.rhs));
    } else {
      const prop = flags.property || positional[0];
      const opKey = Object.keys(flags).find((k) => OPS[k]);
      const rhs = flags.value !== undefined ? flags.value : (opKey && typeof flags[opKey] === "string" ? flags[opKey] : positional[1]);
      if (prop && opKey && rhs !== undefined) items = items.filter((it) => OPS[opKey](getProp(it, input.typeName, prop), rhs));
    }
    return { value: objVal(items, input.typeName), isError: false, state };
  }
  if (canon === "select-object") {
    if (!input || input.kind !== "objects") return { value: input, isError: false, state };
    let items = input.items;
    if (flags.first) items = items.slice(0, Number(flags.first));
    if (flags.last) items = items.slice(-Number(flags.last));
    const propsArg = flags.property || positional.join(",");
    if (propsArg) {
      const props = propsArg.split(",").map((p) => p.trim()).filter(Boolean);
      const typeName = input.typeName;
      items = items.map((it) => { const o = {}; props.forEach((p) => (o[p] = getProp(it, typeName, p))); return o; });
      return { value: objVal(items, null), isError: false, state, forcedProps: props };
    }
    return { value: objVal(items, input.typeName), isError: false, state };
  }
  if (canon === "sort-object") {
    if (!input || input.kind !== "objects") return { value: input, isError: false, state };
    const prop = positional[0] || flags.property;
    const typeName = input.typeName;
    const items = input.items.slice().sort((a, b) => {
      const av = getProp(a, typeName, prop), bv = getProp(b, typeName, prop);
      return av > bv ? 1 : av < bv ? -1 : 0;
    });
    if (flags.descending) items.reverse();
    return { value: objVal(items, input.typeName), isError: false, state };
  }
  if (canon === "format-table" || canon === "format-list") {
    if (!input) return { value: input, isError: false, state };
    return { value: input, isError: false, state, forceList: canon === "format-list" };
  }
  if (canon === "get-member") {
    if (!input || input.kind !== "objects" || !input.items.length) return { value: textVal(""), isError: false, state };
    const props = Object.keys(input.items[0]).map((p) => ({ Name: p, MemberType: "Property", Definition: typeof input.items[0][p] }));
    const methodRows = (input.typeName === "Process")
      ? [{ Name: "Kill", MemberType: "Method", Definition: "void Kill()" }, { Name: "Start", MemberType: "Method", Definition: "bool Start()" }]
      : [];
    return { value: objVal([...methodRows, ...props], "PSMemberInfo"), isError: false, state };
  }
  if (canon === "measure-object" || canon === "count") {
    if (!input) return { value: scalarVal(0), isError: false, state };
    const n = input.kind === "objects" ? input.items.length : (input.kind === "text" ? input.text.split("\n").filter(Boolean).length : 1);
    return { value: scalarVal(n), isError: false, state };
  }

  // ---- source / action cmdlets ----
  switch (canon) {
    case "get-host":
      return { value: objVal([{ Name: "ConsoleHost", Version: "5.1.19041.1682" }], "Host"), isError: false, state };
    case "get-process": {
      let items = state.processes;
      const nameArg = positional[0] || flags.name;
      if (nameArg) { const re = wildcardToRegex(nameArg); items = items.filter((p) => re.test(p.ProcessName)); }
      return { value: objVal(items, "Process"), isError: false, state };
    }
    case "get-service": {
      let items = state.services;
      const nameArg = positional[0] || flags.name;
      if (nameArg) { const re = wildcardToRegex(nameArg); items = items.filter((s) => re.test(s.Name)); }
      return { value: objVal(items, "Service"), isError: false, state };
    }
    case "start-process": {
      const nm = (positional[0] || flags.filepath || "process").replace(/\.exe$/i, "");
      const pid = state.nextPid;
      const proc = { ProcessName: nm, Id: pid, Handles: 250 + Math.floor(Math.random() * 400), WS: 20 + Math.floor(Math.random() * 60), CPU: +(Math.random() * 3).toFixed(1), Path: `C:\\Windows\\System32\\${nm}.exe` };
      const ns = { ...state, processes: [...state.processes, proc], nextPid: pid + 1 };
      return { value: null, text: `Started ${nm} (PID ${pid}).`, isError: false, state: ns };
    }
    case "stop-process": {
      const nameArg = positional[0] || flags.name;
      const idArg = flags.id;
      const killed = [];
      const items = state.processes.filter((p) => {
        const match = idArg ? String(p.Id) === String(idArg) : nameArg ? wildcardToRegex(nameArg).test(p.ProcessName) : false;
        if (match) killed.push(p);
        return !match;
      });
      const ns = { ...state, processes: items };
      if (!killed.length) return { value: null, text: `Stop-Process : Cannot find a process with the name "${nameArg || idArg}". Verify the process name and call the cmdlet again.`, isError: true, state };
      return { value: null, text: killed.map((k) => `Stopped ${k.ProcessName} (PID ${k.Id}).`).join("\n"), isError: false, state: ns };
    }
    case "get-childitem": case "test-path": case "get-content": case "set-content": case "add-content":
    case "new-item": case "remove-item": case "set-location": case "get-location":
      return fsCommand(state, canon, tokens, flags, positional);
    case "get-alias": {
      let entries = Object.entries(state.aliases).map(([k, v]) => ({ Name: k, Definition: v }));
      const nameArg = positional[0] || flags.name;
      if (nameArg) entries = entries.filter((e) => e.Name.toLowerCase() === nameArg.toLowerCase());
      return { value: objVal(entries, "Alias"), isError: false, state };
    }
    case "new-alias": {
      const nm = flags.name || positional[0], val = flags.value || positional[1];
      if (!nm || !val) return { value: null, text: "New-Alias : Missing -Name or -Value.", isError: true, state };
      const ns = { ...state, aliases: { ...state.aliases, [nm.toLowerCase()]: val } };
      return { value: null, text: "", isError: false, state: ns };
    }
    case "get-variable": {
      let entries = Object.entries(state.vars).map(([k, v]) => ({ Name: k, Value: Array.isArray(v) ? v.join(" ") : String(v) }));
      const nameArg = positional[0] || flags.name;
      if (nameArg) entries = entries.filter((e) => e.Name === nameArg);
      return { value: objVal(entries, "Variable"), isError: false, state };
    }
    case "clear-variable": case "remove-variable": {
      const nm = positional[0] || flags.name;
      const nv = { ...state.vars }; delete nv[nm];
      return { value: null, text: "", isError: false, state: { ...state, vars: nv } };
    }
    case "get-history": {
      const items = state.history.map((h, i) => ({ Id: i + 1, CommandLine: h }));
      return { value: objVal(items, "History"), isError: false, state };
    }
    case "get-command": {
      const universe = ["Get-Process", "Get-Service", "Get-ChildItem", "Get-Content", "Set-Content", "New-Item", "Remove-Item",
        "Where-Object", "Select-Object", "Sort-Object", "Get-Member", "Get-Alias", "New-Alias", "Get-Variable", "Clear-Variable",
        "Get-History", "Start-Process", "Stop-Process", "Set-Location", "Get-Location", "Test-Path", "Get-ExecutionPolicy",
        "Set-ExecutionPolicy", "Get-Help", "Get-Command", "Get-Verb", "Get-Host", "Write-Output", "Get-Date"];
      return { value: objVal(universe.map((u) => ({ CommandType: "Cmdlet", Name: u })), "Command"), isError: false, state };
    }
    case "get-verb":
      return { value: objVal(["Get", "Set", "New", "Remove", "Start", "Stop", "Clear", "Test", "Select", "Sort", "Format", "Invoke", "Write", "Read"].map((v) => ({ Verb: v })), "Verb"), isError: false, state };
    case "get-executionpolicy":
      return { value: flags.list ? textVal("        Scope ExecutionPolicy\n        ----- ---------------\nMachinePolicy       Undefined\n   UserPolicy       Undefined\n      Process       Undefined\n  CurrentUser       Undefined\n LocalMachine       Restricted") : scalarVal("Restricted"), isError: false, state };
    case "set-executionpolicy":
      return { value: null, text: "", isError: false, state };
    case "get-help": {
      const topic = (positional[0] || "").toLowerCase();
      const txt = HELP_TEXT[topic] || `Get-Help : No help content found for "${positional[0] || ""}". Try Get-Help about_command_syntax or Get-Help get-process.`;
      return { value: null, text: (flags.online ? "[Reference] Would open https://learn.microsoft.com help for '" + positional[0] + "' in a browser.\n\n" : "") + txt, isError: false, state };
    }
    case "write-output": case "write-host":
      return { value: textVal(rest.join(" ").replace(/^["']|["']$/g, "")), isError: false, state };
    case "clear-host":
      return { value: null, text: "\x1bCLEAR\x1b", isError: false, state };
    case "get-date":
      return { value: textVal(new Date().toString()), isError: false, state };
    default: {
      if (REFERENCE_OUTPUT[canon]) return { value: null, text: "[Reference example — not a live query in this sandbox]\n" + REFERENCE_OUTPUT[canon], isError: false, state, reference: true };
      if (state.functions[canon]) return { value: textVal(state.functions[canon]), isError: false, state };
      return { ...errNotRecognized(tokens[0]), value: null, state };
    }
  }
}

function wildcardToRegex(pat) {
  return new RegExp("^" + pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i");
}

function listChildren(state, absDir) {
  const out = [];
  for (const p of Object.keys(state.fs)) {
    if (p === absDir) continue;
    if (parentPath(p) === absDir) out.push(p);
  }
  return out;
}
function pathExists(state, p) {
  if (state.fs[p]) return true;
  // an implicit ancestor directory (e.g. "C:\labs" exists because "C:\labs\cctc" does)
  return Object.keys(state.fs).some((k) => k !== p && k.startsWith(p + "\\"));
}

function fsCommand(state, canon, tokens, flags, positional) {
  const target = positional[0] || flags.path;
  if (canon === "get-location") return { value: textVal(state.cwd), isError: false, state };
  if (canon === "set-location") {
    const p = resolvePath(state.cwd, target || ROOT);
    if (!pathExists(state, p) || (state.fs[p] && !state.fs[p].isDir)) return { value: null, text: `Set-Location : Cannot find path '${p}' because it does not exist.`, isError: true, state };
    return { value: null, text: "", isError: false, state: { ...state, cwd: p } };
  }
  if (canon === "get-childitem") {
    const p = resolvePath(state.cwd, target || ".");
    if (!pathExists(state, p)) return { value: null, text: `Get-ChildItem : Cannot find path '${p}' because it does not exist.`, isError: true, state };
    const items = listChildren(state, p).map((full) => {
      const e = state.fs[full];
      return { Mode: e.isDir ? "d-----" : "-a----", Name: baseName(full), Length: e.isDir ? "" : e.content.length };
    });
    return { value: objVal(items, "FileInfo"), isError: false, state };
  }
  if (canon === "test-path") {
    const p = resolvePath(state.cwd, target);
    return { value: scalarVal(pathExists(state, p)), isError: false, state };
  }
  if (canon === "get-content") {
    const p = resolvePath(state.cwd, target);
    const entry = state.fs[p];
    if (!entry || entry.isDir) return { value: null, text: `Get-Content : Cannot find path '${p}' because it does not exist.`, isError: true, state };
    return { value: textVal(entry.content), isError: false, state };
  }
  if (canon === "set-content" || canon === "add-content") {
    const p = resolvePath(state.cwd, target);
    const valueArg = flags.value || positional.slice(1).join(" ");
    const existing = state.fs[p];
    const content = canon === "add-content" && existing ? existing.content + "\n" + valueArg : valueArg;
    const ns = { ...state, fs: { ...state.fs, [p]: fileEntry(content) } };
    return { value: null, text: "", isError: false, state: ns };
  }
  if (canon === "new-item") {
    const p = resolvePath(state.cwd, target);
    if (state.fs[p] && !flags.force) return { value: null, text: `New-Item : The item '${p}' already exists.`, isError: true, state };
    const isDirType = (flags.type || flags.itemtype || "").toLowerCase() === "directory";
    const ns = { ...state, fs: { ...state.fs, [p]: isDirType ? dirEntry() : fileEntry("") } };
    return { value: null, text: `\n    Directory: ${parentPath(p)}\n\nMode                 Name\n----                 ----\n${isDirType ? "d-----" : "-a----"}               ${baseName(p)}`, isError: false, state: ns };
  }
  if (canon === "remove-item") {
    const p = resolvePath(state.cwd, target);
    if (!state.fs[p]) {
      if (flags.erroraction && String(flags.erroraction).toLowerCase() === "silentlycontinue") return { value: null, text: "", isError: false, state };
      return { value: null, text: `Remove-Item : Cannot find path '${p}' because it does not exist.`, isError: true, state };
    }
    const nf = { ...state.fs };
    delete nf[p];
    if (state.fs[p].isDir) { for (const k of Object.keys(nf)) { if (k.startsWith(p + "\\")) delete nf[k]; } }
    const ns = { ...state, fs: nf };
    return { value: null, text: flags.verbose ? `Performing the operation "Remove File" on target "${p}".` : "", isError: false, state: ns };
  }
  return { value: null, text: "", isError: false, state };
}

// ── entry point ──
export function runCommand(state, rawLine) {
  // Classic DOS/cmd.exe muscle memory — "cd.." / "cd..." / "cd." with no
  // space — is valid shorthand real PowerShell/cmd.exe both accept. Our
  // tokenizer splits purely on whitespace, so normalize it to "cd .." first.
  const line = (rawLine || "").trim().replace(/^(cd|sl)(\.{1,})(\s|$)/i, "$1 $2$3");
  if (!line) return { state, lines: [] };
  const history = [...state.history, line].slice(-50);
  let s = { ...state, history };

  // `$var = expr` assignment (only handles a source pipeline on the RHS, or a literal)
  const assign = line.match(/^\$(\w+)\s*=\s*(.+)$/);
  if (assign) {
    const [, varName, rhs] = assign;
    const rhsTrim = rhs.trim();
    if (/^\d+\.\.\d+$/.test(rhsTrim)) {
      const [a, b] = rhsTrim.split("..").map(Number);
      const arr = []; for (let i = a; i <= b; i++) arr.push(i);
      return { state: { ...s, vars: { ...s.vars, [varName]: arr } }, lines: [] };
    }
    if (/^[\d,\s]+$/.test(rhsTrim) && /\d/.test(rhsTrim)) {
      const arr = rhsTrim.split(",").map((x) => Number(x.trim()));
      return { state: { ...s, vars: { ...s.vars, [varName]: arr } }, lines: [] };
    }
    const result = runPipeline(s, rhs);
    s = result.state;
    const v = result.value;
    const stored = v && v.kind === "objects" ? v.items : v && v.kind === "text" ? v.text : v && v.kind === "scalar" ? v.value : null;
    return { state: { ...s, vars: { ...s.vars, [varName]: stored } }, lines: [] };
  }

  // `function Name { body }` — stored verbatim, not truly executed
  const fn = line.match(/^function\s+([\w-]+)\s*\{([\s\S]*)\}\s*$/i);
  if (fn) {
    s = { ...s, functions: { ...s.functions, [fn[1].toLowerCase()]: "(function '" + fn[1] + "' defined — call it by name to see this note; full script-block execution isn't simulated)" } };
    return { state: s, lines: [] };
  }

  const redirect = splitRedirect(line);
  if (redirect) {
    const outValResult = runPipeline(s, redirect.head);
    s = outValResult.state;
    const text = outValResult.value ? formatValue(outValResult.value) : (outValResult.text || "");
    const p = resolvePath(s.cwd, redirect.target);
    const existing = s.fs[p];
    const content = redirect.append && existing ? (existing.content || "") + "\n" + text : text;
    const ns = { ...s, fs: { ...s.fs, [p]: fileEntry(content) } };
    return { state: ns, lines: [] };
  }

  const result = runPipeline(s, line);
  s = result.state;
  const out = [];
  if (result.text) out.push(result.text);
  else if (result.value) out.push(formatValue(result.value, { list: result.forceList, props: result.forcedProps }));
  if (result.isError && !result.text) out.push(errNotRecognized(line).text);
  return { state: s, lines: out.filter((l) => l !== ""), isError: !!result.isError };
}

function runPipeline(state, line) {
  const stages = splitPipeline(line);
  let s = state, value = null, text = null, isError = false, forceList = false, forcedProps = null, reference = false;
  for (const stage of stages) {
    const r = runStage(s, stage, value);
    s = r.state;
    value = r.value !== undefined ? r.value : value;
    text = r.text != null ? r.text : text;
    isError = r.isError || isError;
    if (r.forceList) forceList = true;
    if (r.forcedProps) forcedProps = r.forcedProps;
    if (r.reference) reference = true;
    if (isError && !text) break;
  }
  return { state: s, value, text, isError, forceList, forcedProps, reference };
}

export { initialSandboxState, formatValue };
