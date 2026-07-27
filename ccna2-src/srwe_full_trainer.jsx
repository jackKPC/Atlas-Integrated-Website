import { useState } from "react";

// ══ console palette ══
const C = {
  bg: "#10151c", panel: "#1a222d", line: "#2b3a4a", ink: "#dce6f0",
  dim: "#8296ab", amber: "#f5a623", cyan: "#5fd7ff", ok: "#3ddc84", bad: "#ff5c5c",
  well: "#131a23", dark: "#0b1016", violet: "#b98cff",
};
const MONO = "'Cascadia Code','Fira Code',Consolas,monospace";
const box = (extra) => Object.assign({ background: C.well, border: "1px solid " + C.line, borderRadius: 8, padding: 12 }, extra || {});
const chip = (col) => ({ fontFamily: MONO, fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid " + col, color: col, display: "inline-block" });
const btnS = (bg, fg, bd) => ({ padding: "8px 16px", borderRadius: 8, border: "1px solid " + (bd || bg), background: bg, color: fg, fontWeight: 700, cursor: "pointer", fontSize: 13 });
const led = (on, size) => ({ width: size || 12, height: size || 12, borderRadius: "50%", background: on ? C.ok : C.bad, boxShadow: "0 0 10px " + (on ? C.ok : C.bad), display: "inline-block" });

// ══════════════════════════════════════════════════════════
//  VISUALIZATIONS — one per module, keyed by module index
// ══════════════════════════════════════════════════════════

// M0 · Basic Device Config — cable selector
function VizCable() {
  const devs = ["PC", "Router", "Switch", "Hub"];
  const grp = { PC: 1, Router: 1, Switch: 2, Hub: 2 };
  const [a, setA] = useState("PC"), [b, setB] = useState("Switch");
  const cross = grp[a] === grp[b];
  const pick = (v, set, cur) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {devs.map(d => <button key={d} onClick={() => set(d)} style={btnS(cur === d ? "#2a2416" : C.panel, cur === d ? C.amber : C.dim, cur === d ? C.amber : C.line)}>{d}</button>)}
    </div>
  );
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div><div style={{ fontSize: 12, color: C.dim, marginBottom: 6 }}>Device A</div>{pick(a, setA, a)}</div>
        <div><div style={{ fontSize: 12, color: C.dim, marginBottom: 6 }}>Device B</div>{pick(b, setB, b)}</div>
      </div>
      <div style={box({ marginTop: 14, textAlign: "center" })}>
        <span style={{ fontFamily: MONO, color: C.cyan }}>{a}</span>
        <span style={{ color: cross ? C.amber : C.ok, margin: "0 12px", fontFamily: MONO, fontWeight: 700 }}>──{cross ? "CROSSOVER" : "STRAIGHT-THRU"}──</span>
        <span style={{ fontFamily: MONO, color: C.cyan }}>{b}</span>
      </div>
      <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 10, lineHeight: 1.6 }}>
        Rule: group 1 = PC/Router (host-type), group 2 = Switch/Hub. <b style={{ color: C.ink }}>Same group → crossover; different groups → straight-through.</b> {a} and {b} are {cross ? "in the same group, so like-to-like → crossover" : "in different groups → straight-through"}. (Auto-MDIX makes this moot on modern gear, but the exam tests the manual rule.)
      </p>
    </div>
  );
}

// M1 · Switching Concepts — MAC learning + flood/forward
function VizMac() {
  const hosts = [{ n: "A", p: "Fa0/1", mac: "aaaa" }, { n: "B", p: "Fa0/2", mac: "bbbb" }, { n: "C", p: "Fa0/3", mac: "cccc" }, { n: "D", p: "Fa0/4", mac: "dddd" }];
  const [table, setTable] = useState({});
  const [log, setLog] = useState([]);
  const [src, setSrc] = useState("A"), [dst, setDst] = useState("B");
  const send = () => {
    const s = hosts.find(h => h.n === src), d = hosts.find(h => h.n === dst);
    const nt = Object.assign({}, table); nt[s.mac] = s.p;
    const known = nt[d.mac];
    setTable(nt);
    setLog([{ t: "learn " + s.mac + " → " + s.p + "; " + (known ? "dest known → forward only to " + known : "dest UNKNOWN → FLOOD all ports except " + s.p), flood: !known }].concat(log).slice(0, 5));
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: C.dim }}>Frame from</span>
        {hosts.map(h => <button key={h.n} onClick={() => setSrc(h.n)} style={btnS(src === h.n ? "#122430" : C.panel, src === h.n ? C.cyan : C.dim, src === h.n ? C.cyan : C.line)}>{h.n}</button>)}
        <span style={{ fontSize: 12, color: C.dim }}>to</span>
        {hosts.map(h => <button key={h.n} onClick={() => setDst(h.n)} style={btnS(dst === h.n ? "#2a2416" : C.panel, dst === h.n ? C.amber : C.dim, dst === h.n ? C.amber : C.line)}>{h.n}</button>)}
        <button onClick={send} style={btnS(C.amber, C.bg)}>Send</button>
        <button onClick={() => { setTable({}); setLog([]); }} style={btnS(C.well, C.dim, C.line)}>Reset</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={box()}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.cyan, marginBottom: 6 }}>MAC address table</div>
          {Object.keys(table).length === 0 ? <div style={{ color: C.dim, fontSize: 12 }}>empty — switch has learned nothing yet</div> :
            Object.keys(table).map(m => <div key={m} style={{ fontFamily: MONO, fontSize: 12, color: C.ink }}>{m}.{m}.{m} → {table[m]}</div>)}
        </div>
        <div style={box()}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.amber, marginBottom: 6 }}>action log</div>
          {log.length === 0 ? <div style={{ color: C.dim, fontSize: 12 }}>send a frame…</div> :
            log.map((l, i) => <div key={i} style={{ fontSize: 11.5, color: l.flood ? C.amber : C.ok, lineHeight: 1.5 }}>{l.t}</div>)}
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 10, lineHeight: 1.6 }}>Switches learn the <b style={{ color: C.ink }}>source</b> MAC + ingress port on every frame. If the <b style={{ color: C.ink }}>destination</b> MAC is already in the table, it forwards out that one port; if not, it floods everywhere except where it came in. Send A→B, then B→A, then A→B again and watch the second A→B forward instead of flood.</p>
    </div>
  );
}

// M2 · VLANs — trunk tagging + native VLAN
function VizTrunk() {
  const [srcVlan, setSrcVlan] = useState(10);
  const [nativeV, setNativeV] = useState(99);
  const vlans = [10, 20, 99];
  const tagged = srcVlan !== nativeV;
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: C.dim }}>Frame from VLAN</span>
        {vlans.map(v => <button key={v} onClick={() => setSrcVlan(v)} style={btnS(srcVlan === v ? "#122430" : C.panel, srcVlan === v ? C.cyan : C.dim, srcVlan === v ? C.cyan : C.line)}>{v}</button>)}
        <span style={{ fontSize: 12, color: C.dim, marginLeft: 8 }}>Native VLAN</span>
        {[1, 99].map(v => <button key={v} onClick={() => setNativeV(v)} style={btnS(nativeV === v ? "#2a2416" : C.panel, nativeV === v ? C.amber : C.dim, nativeV === v ? C.amber : C.line)}>{v}</button>)}
      </div>
      <div style={box({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 })}>
        <div style={{ textAlign: "center" }}><div style={{ fontFamily: MONO, color: C.cyan, fontSize: 13 }}>SW1</div><div style={{ fontSize: 10, color: C.dim }}>access VLAN {srcVlan}</div></div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim, marginBottom: 4 }}>═══ 802.1Q trunk ═══</div>
          <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 6, border: "1px solid " + (tagged ? C.amber : C.violet), color: tagged ? C.amber : C.violet, fontFamily: MONO, fontSize: 12 }}>
            {tagged ? "[TAG " + srcVlan + "] frame" : "frame (UNTAGGED)"}
          </div>
        </div>
        <div style={{ textAlign: "center" }}><div style={{ fontFamily: MONO, color: C.cyan, fontSize: 13 }}>SW2</div><div style={{ fontSize: 10, color: C.dim }}>native {nativeV}</div></div>
      </div>
      <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 10, lineHeight: 1.6 }}>
        {tagged
          ? <>VLAN {srcVlan} traffic is <b style={{ color: C.ink }}>tagged</b> with its VLAN ID as it crosses the trunk, so the far switch knows which VLAN it belongs to.</>
          : <>VLAN {srcVlan} matches the native VLAN, so it crosses the trunk <b style={{ color: C.ink }}>untagged</b>. That's the whole point of the native VLAN — one VLAN's frames ride the trunk with no 802.1Q tag.</>}
        {" "}Set both sides' native VLAN the same, and keep it off your data VLANs.
      </p>
    </div>
  );
}

// M3 · Inter-VLAN Routing — method comparison
function VizIVR() {
  const [tab, setTab] = useState(0);
  const [nv, setNv] = useState(4);
  const methods = [
    { n: "Legacy", ports: nv, cable: nv + " router ports + " + nv + " switch ports", scale: "Terrible — one physical port per VLAN", note: "Router interface per VLAN, each cabled to an access port. Runs out of ports fast." },
    { n: "Router-on-a-stick", ports: 1, cable: "1 trunk link", scale: "~50 VLANs max — one trunk bottleneck", note: "One physical link, one subinterface per VLAN (encapsulation dot1q). Cheap but the single trunk is shared." },
    { n: "Layer 3 switch (SVI)", ports: 0, cable: "no external router", scale: "Best — hardware switched, 1000s of VLANs", note: "interface vlan X per VLAN, routed inside the switch fabric. Fastest, scales highest, costs more." },
  ];
  const m = methods[tab];
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {methods.map((x, i) => <button key={i} onClick={() => setTab(i)} style={Object.assign(btnS(tab === i ? "#2a2416" : C.panel, tab === i ? C.amber : C.dim, tab === i ? C.amber : C.line), { flex: 1 })}>{x.n}</button>)}
      </div>
      {tab === 0 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: C.dim }}>VLANs to route: {nv}</span>
          <input type="range" min="2" max="12" value={nv} onChange={e => setNv(+e.target.value)} style={{ flex: 1, accentColor: C.amber }} />
        </div>
      )}
      <div style={box()}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: 13 }}>
          <span style={{ color: C.dim }}>Router ports</span><span style={{ fontFamily: MONO, color: m.ports > 2 ? C.bad : C.ok }}>{m.ports === 0 ? "none needed" : m.ports}</span>
          <span style={{ color: C.dim }}>Cabling</span><span style={{ color: C.ink }}>{m.cable}</span>
          <span style={{ color: C.dim }}>Scalability</span><span style={{ color: C.ink }}>{m.scale}</span>
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 10, lineHeight: 1.6 }}>{m.note}{tab === 0 && nv > 4 ? " With " + nv + " VLANs you'd burn " + nv + " router interfaces — this is why legacy doesn't scale." : ""}</p>
    </div>
  );
}

// M4 · STP — root bridge election
function VizSTP() {
  const [sw, setSw] = useState([
    { n: "SW1", pri: 32768, mac: "0011" },
    { n: "SW2", pri: 32768, mac: "0022" },
    { n: "SW3", pri: 32768, mac: "0033" },
  ]);
  const setPri = (i, v) => { const c = sw.map(s => Object.assign({}, s)); c[i].pri = v; setSw(c); };
  const winner = sw.reduce((best, s) => {
    if (s.pri < best.pri) return s;
    if (s.pri === best.pri && s.mac < best.mac) return s;
    return best;
  }, sw[0]);
  const opts = [4096, 8192, 32768];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {sw.map((s, i) => {
          const isRoot = s.n === winner.n;
          return (
            <div key={i} style={box({ border: "1px solid " + (isRoot ? C.ok : C.line), textAlign: "center" })}>
              <div style={{ fontFamily: MONO, color: isRoot ? C.ok : C.cyan, fontWeight: 700 }}>{s.n}</div>
              {isRoot && <div style={chip(C.ok)}>ROOT</div>}
              <div style={{ fontSize: 10, color: C.dim, margin: "6px 0 3px" }}>priority</div>
              <div style={{ display: "flex", gap: 3, justifyContent: "center", flexWrap: "wrap" }}>
                {opts.map(o => <button key={o} onClick={() => setPri(i, o)} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "1px solid " + (s.pri === o ? C.amber : C.line), background: s.pri === o ? "#2a2416" : C.panel, color: s.pri === o ? C.amber : C.dim, cursor: "pointer" }}>{o}</button>)}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: C.dim, marginTop: 6 }}>mac …{s.mac}</div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 10, lineHeight: 1.6 }}>
        Root = <b style={{ color: C.ink }}>lowest bridge ID</b> (priority first, then MAC as tiebreaker). Right now {winner.n} wins{sw.every(s => s.pri === sw[0].pri) ? " because all priorities tie, so the lowest MAC (…" + winner.mac + ") decides" : " on the lowest priority (" + winner.pri + ")"}. Lower a switch's priority to force it to become root — that's how you steer the tree.
      </p>
    </div>
  );
}

// M5 · EtherChannel — mode negotiation simulator
function VizEtherChannel() {
  const MODES = { LACP: ["active", "passive"], PAgP: ["desirable", "auto"], Static: ["on"] };
  const [p1, setP1] = useState("LACP"), [m1, setM1] = useState("active");
  const [p2, setP2] = useState("LACP"), [m2, setM2] = useState("passive");
  const neg = () => {
    if (p1 !== p2) return { ok: false, why: "Protocol mismatch — " + p1 + " can't negotiate with " + p2 + ". Same protocol both sides (or both 'on')." };
    if (p1 === "Static") return { ok: true, why: "on + on = forced bundle, no negotiation packets. If only one side is 'on', you risk a loop." };
    const init = { active: 1, desirable: 1, passive: 0, auto: 0 };
    if (init[m1] || init[m2]) return { ok: true, why: m1 + " + " + m2 + " works — at least one side initiates, the other agrees." };
    return { ok: false, why: m1 + " + " + m2 + " fails — both sides only respond, nobody starts the negotiation." };
  };
  const r = neg();
  const swBox = (label, proto, mode, setP, setM) => (
    <div style={box({ flex: 1, minWidth: 190 })}>
      <div style={{ fontFamily: MONO, color: C.cyan, fontSize: 13, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 11, color: C.dim, marginBottom: 3 }}>protocol</div>
      <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
        {Object.keys(MODES).map(p => <button key={p} onClick={() => { setP(p); setM(MODES[p][0]); }} style={{ flex: 1, fontSize: 11, padding: "5px 2px", borderRadius: 5, border: "1px solid " + (proto === p ? C.amber : C.line), background: proto === p ? "#2a2416" : C.panel, color: proto === p ? C.amber : C.dim, cursor: "pointer" }}>{p}</button>)}
      </div>
      <div style={{ fontSize: 11, color: C.dim, marginBottom: 3 }}>mode</div>
      <div style={{ display: "flex", gap: 5 }}>
        {MODES[proto].map(mo => <button key={mo} onClick={() => setM(mo)} style={{ flex: 1, fontSize: 11, fontFamily: MONO, padding: "5px 2px", borderRadius: 5, border: "1px solid " + (mode === mo ? C.cyan : C.line), background: mode === mo ? "#122430" : C.panel, color: mode === mo ? C.cyan : C.dim, cursor: "pointer" }}>{mo}</button>)}
      </div>
    </div>
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {swBox("S1 g0/1-2", p1, m1, setP1, setM1)}
        <div style={{ textAlign: "center", minWidth: 48 }}>
          <span style={led(r.ok, 14)} /><div style={{ fontFamily: MONO, fontSize: 10, color: r.ok ? C.ok : C.bad, marginTop: 4 }}>{r.ok ? "Po1 UP" : "DOWN"}</div>
        </div>
        {swBox("S2 g0/1-2", p2, m2, setP2, setM2)}
      </div>
      <div style={box({ marginTop: 12, background: C.dark, fontFamily: MONO, fontSize: 12 })}>
        <div style={{ color: C.dim }}>S1# show etherchannel summary</div>
        <div style={{ color: C.ink }}>Po1({r.ok ? <span style={{ color: C.ok }}>SU</span> : <span style={{ color: C.bad }}>SD</span>}){"   "}{p1 === "Static" ? "  -  " : p1}{"   "}Gi0/1({r.ok ? "P" : "D"}) Gi0/2({r.ok ? "P" : "D"})</div>
        <div style={{ color: C.cyan, marginTop: 6 }}>{r.why}</div>
      </div>
    </div>
  );
}

// M6 · DHCPv4 — DORA stepper
function VizDORA() {
  const steps = [
    { m: "DHCPDISCOVER", dir: "→", who: "client → broadcast", src: "0.0.0.0", dst: "255.255.255.255", d: "Client has no IP. Broadcasts to find any DHCP server." },
    { m: "DHCPOFFER", dir: "←", who: "server → client", src: "server IP", dst: "client MAC", d: "Server offers an address + lease details." },
    { m: "DHCPREQUEST", dir: "→", who: "client → broadcast", src: "0.0.0.0", dst: "255.255.255.255", d: "Client accepts ONE offer — broadcast implicitly declines the others." },
    { m: "DHCPACK", dir: "←", who: "server → client", src: "server IP", dst: "client", d: "Server confirms. Lease is now bound." },
  ];
  const [i, setI] = useState(0);
  const s = steps[i];
  return (
    <div>
      <div style={box({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 })}>
        <div style={{ textAlign: "center" }}><div style={{ fontFamily: MONO, color: C.cyan }}>CLIENT</div></div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 22, color: C.amber }}>{s.dir === "→" ? "──▶" : "◀──"}</div>
          <div style={{ fontFamily: MONO, fontSize: 13, color: C.amber, fontWeight: 700 }}>{s.m}</div>
        </div>
        <div style={{ textAlign: "center" }}><div style={{ fontFamily: MONO, color: C.cyan }}>SERVER</div></div>
      </div>
      <div style={box()}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", fontFamily: MONO, fontSize: 12 }}>
          <span style={{ color: C.dim }}>src IP</span><span style={{ color: C.ink }}>{s.src}</span>
          <span style={{ color: C.dim }}>dst IP</span><span style={{ color: C.ink }}>{s.dst}</span>
          <span style={{ color: C.dim }}>flow</span><span style={{ color: C.ink }}>{s.who}</span>
        </div>
        <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 8, lineHeight: 1.5, marginBottom: 0 }}>{s.d}</p>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        {steps.map((x, idx) => <div key={idx} style={{ flex: 1, height: 5, borderRadius: 3, background: idx <= i ? C.amber : C.line }} />)}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} style={btnS(C.well, i === 0 ? C.dim : C.cyan, C.line)}>Back</button>
        <button onClick={() => setI((i + 1) % 4)} style={btnS(C.amber, C.bg)}>{i === 3 ? "Restart" : "Next step"}</button>
        <span style={{ alignSelf: "center", fontFamily: MONO, fontSize: 11, color: C.dim }}>D-O-R-A</span>
      </div>
    </div>
  );
}

// M7 · SLAAC/DHCPv6 — RA flag logic
function VizRA() {
  const [m, setM] = useState(0), [o, setO] = useState(0);
  let mode, addr, other;
  if (m === 1) { mode = "Stateful DHCPv6"; addr = "Server assigns the full address"; other = "Server provides DNS + everything"; }
  else if (o === 1) { mode = "SLAAC + Stateless DHCPv6"; addr = "Host builds its own (SLAAC from RA prefix)"; other = "Host asks DHCPv6 only for DNS etc."; }
  else { mode = "SLAAC only"; addr = "Host builds its own from the RA prefix"; other = "Everything comes from the RA"; }
  const tog = (val, set, label, colOn) => (
    <button onClick={() => set(val ? 0 : 1)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid " + (val ? colOn : C.line), background: val ? "#1a2a1a" : C.panel, color: val ? colOn : C.dim, cursor: "pointer", fontFamily: MONO, fontWeight: 700 }}>
      {label} = {val}
    </button>
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {tog(m, setM, "M flag (Managed)", C.amber)}
        {tog(o, setO, "O flag (Other)", C.cyan)}
      </div>
      <div style={box()}>
        <div style={{ fontFamily: MONO, fontSize: 13, color: C.ok, marginBottom: 8 }}>→ {mode}</div>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", fontSize: 12.5 }}>
          <span style={{ color: C.dim }}>address</span><span style={{ color: C.ink }}>{addr}</span>
          <span style={{ color: C.dim }}>other info</span><span style={{ color: C.ink }}>{other}</span>
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 10, lineHeight: 1.6 }}>The router advertisement's two flags decide everything. <b style={{ color: C.ink }}>M=1</b> → stateful (server hands out addresses). <b style={{ color: C.ink }}>M=0, O=1</b> → host self-addresses via SLAAC but gets DNS from DHCPv6. <b style={{ color: C.ink }}>Both 0</b> → pure SLAAC, the RA carries everything.</p>
    </div>
  );
}

// M8 · FHRP — active/standby failover
function VizFHRP() {
  const [activeFailed, setActiveFailed] = useState(false);
  const activeName = activeFailed ? "R2" : "R1";
  return (
    <div>
      <div style={box({ textAlign: "center", marginBottom: 12 })}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: C.violet }}>Virtual router (what hosts see)</div>
        <div style={{ fontFamily: MONO, fontSize: 13, color: C.ink, marginTop: 4 }}>IP 10.0.0.1 · MAC 0000.0c07.acXX</div>
        <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>unchanged no matter which router is active</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {["R1", "R2"].map(r => {
          const isActive = r === activeName;
          const dead = activeFailed && r === "R1";
          return (
            <div key={r} style={box({ border: "1px solid " + (dead ? C.bad : isActive ? C.ok : C.line), textAlign: "center", opacity: dead ? 0.55 : 1 })}>
              <div style={{ fontFamily: MONO, color: dead ? C.bad : C.cyan, fontWeight: 700 }}>{r}</div>
              <div style={chip(dead ? C.bad : isActive ? C.ok : C.dim)}>{dead ? "FAILED" : isActive ? "ACTIVE" : "STANDBY"}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => setActiveFailed(!activeFailed)} style={btnS(activeFailed ? C.well : "#2a1616", activeFailed ? C.cyan : C.bad, activeFailed ? C.line : C.bad)}>{activeFailed ? "Restore R1" : "Fail the active router"}</button>
      </div>
      <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 10, lineHeight: 1.6 }}>{activeFailed ? "R1 died and R2 took over as active — but the hosts never noticed. They still point at the same virtual IP and MAC." : "R1 is active, R2 stands by. Hosts use the virtual IP as their gateway."} That's FHRP: the gateway survives a router failure. (HSRP/GLBP are Cisco; VRRP is the open standard. GLBP additionally load-balances across both routers at once.)</p>
    </div>
  );
}

// M9 · LAN Security — attack → mitigation
function VizAttack() {
  const rows = [
    { atk: "MAC address table flooding", fix: "Port security", why: "Limit MACs per port; violation shuts it down. Table can't be overflowed." },
    { atk: "DHCP starvation / rogue server", fix: "DHCP snooping", why: "Trust only the real server's port; drop rogue offers and bogus leases." },
    { atk: "ARP spoofing / poisoning", fix: "Dynamic ARP Inspection", why: "Validate ARP against the DHCP snooping binding table; drop forged ARPs." },
    { atk: "IP / MAC spoofing", fix: "IP Source Guard", why: "Check source IP+MAC against snooping bindings on each port." },
    { atk: "VLAN hopping", fix: "Disable DTP (nonegotiate)", why: "Hard-set access mode so ports can't be tricked into trunking." },
  ];
  const [sel, setSel] = useState(0);
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((r, i) => (
          <button key={i} onClick={() => setSel(i)} style={{ textAlign: "left", padding: "9px 12px", borderRadius: 8, border: "1px solid " + (sel === i ? C.amber : C.line), background: sel === i ? "#2a2416" : C.panel, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <span style={{ color: sel === i ? C.amber : C.ink, fontSize: 13 }}>{r.atk}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: sel === i ? C.ok : C.dim }}>{sel === i ? "→ " + r.fix : ""}</span>
          </button>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 10, lineHeight: 1.6 }}><b style={{ color: C.ink }}>{rows[sel].fix}</b> — {rows[sel].why}</p>
    </div>
  );
}

// M10 · Switch Security — port security violation modes
function VizPortSec() {
  const modes = {
    protect: { c: C.cyan, drop: true, log: false, err: false, d: "Silently drops offending frames. No log, no counter, port stays up." },
    restrict: { c: C.amber, drop: true, log: true, err: false, d: "Drops frames AND logs + increments the violation counter. Port stays up." },
    shutdown: { c: C.bad, drop: true, log: true, err: true, d: "Err-disables the port (default mode). Recover with shutdown / no shutdown." },
  };
  const [mode, setMode] = useState("shutdown");
  const [violated, setViolated] = useState(false);
  const m = modes[mode];
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {Object.keys(modes).map(k => <button key={k} onClick={() => { setMode(k); setViolated(false); }} style={Object.assign(btnS(mode === k ? "#2a2416" : C.panel, mode === k ? modes[k].c : C.dim, mode === k ? modes[k].c : C.line), { flex: 1, fontFamily: MONO })}>{k}{k === "shutdown" ? " ★" : ""}</button>)}
      </div>
      <div style={box({ textAlign: "center" })}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: C.dim }}>Fa0/1 · max 1 MAC · violation mode {mode}</div>
        <div style={{ margin: "10px 0" }}>
          <span style={{ ...led(!(violated && m.err), 12) }} />
          <span style={{ fontFamily: MONO, fontSize: 12, color: violated && m.err ? C.bad : C.ok, marginLeft: 8 }}>{violated && m.err ? "err-disabled (down)" : "up / up"}</span>
        </div>
        <button onClick={() => setViolated(true)} style={btnS("#2a1616", C.bad, C.bad)}>Plug in a 2nd MAC (violate)</button>
      </div>
      {violated && (
        <div style={box({ marginTop: 10, fontFamily: MONO, fontSize: 12 })}>
          <div style={{ color: m.drop ? C.ok : C.dim }}>frame dropped: {m.drop ? "yes" : "no"}</div>
          <div style={{ color: m.log ? C.amber : C.dim }}>logged + counter: {m.log ? "yes" : "no"}</div>
          <div style={{ color: m.err ? C.bad : C.dim }}>port err-disabled: {m.err ? "YES" : "no"}</div>
        </div>
      )}
      <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 10, lineHeight: 1.6 }}><b style={{ color: C.ink }}>{mode}</b> — {m.d} ★ = the default violation mode.</p>
    </div>
  );
}

// M11 · WLAN Concepts — 2.4 GHz channel overlap
function VizChannels() {
  const [picked, setPicked] = useState([1, 6, 11]);
  const chans = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const toggle = (c) => setPicked(picked.includes(c) ? picked.filter(x => x !== c) : picked.length < 3 ? picked.concat([c]).sort((a, b) => a - b) : picked);
  // two channels overlap if within 5 of each other
  const overlaps = [];
  for (let i = 0; i < picked.length; i++) for (let j = i + 1; j < picked.length; j++) if (Math.abs(picked[i] - picked[j]) < 5) overlaps.push([picked[i], picked[j]]);
  const clean = overlaps.length === 0 && picked.length >= 2;
  return (
    <div>
      <div style={{ fontSize: 12, color: C.dim, marginBottom: 8 }}>Pick up to 3 channels:</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
        {chans.map(c => {
          const on = picked.includes(c);
          const bad = overlaps.some(o => o.includes(c));
          return <button key={c} onClick={() => toggle(c)} style={{ width: 40, padding: "8px 0", borderRadius: 6, border: "1px solid " + (on ? (bad ? C.bad : C.ok) : C.line), background: on ? (bad ? "#2a1616" : "#12241a") : C.panel, color: on ? (bad ? C.bad : C.ok) : C.dim, cursor: "pointer", fontFamily: MONO, fontWeight: 700 }}>{c}</button>;
        })}
      </div>
      <div style={{ position: "relative", height: 46, background: C.dark, borderRadius: 8, overflow: "hidden", border: "1px solid " + C.line }}>
        {picked.map((c, i) => {
          const left = ((c - 1) / 10) * 78;
          const bad = overlaps.some(o => o.includes(c));
          return <div key={i} style={{ position: "absolute", left: left + "%", top: 6, width: "22%", height: 34, borderRadius: 20, background: (bad ? C.bad : C.ok) + "44", border: "1px solid " + (bad ? C.bad : C.ok), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 11, color: bad ? C.bad : C.ok }}>ch{c}</div>;
        })}
      </div>
      <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 12, lineHeight: 1.6 }}>{clean ? <>These channels <b style={{ color: C.ok }}>don't overlap</b> — clean coexistence.</> : overlaps.length ? <>Overlap detected (<b style={{ color: C.bad }}>{overlaps.map(o => o.join("+")).join(", ")}</b>) — those APs interfere.</> : "Pick at least two."} Each 2.4 GHz channel is ~22 MHz wide but channels sit only 5 MHz apart, so neighbors bleed into each other. <b style={{ color: C.ink }}>Only 1, 6, and 11</b> are far enough apart to not overlap — try it.</p>
    </div>
  );
}

// M12 · WLAN Config — connection troubleshooter
function VizWlanTshoot() {
  const steps = [
    { q: "Is the wireless NIC enabled?", ok: "NIC on", d: "No radio, no connection. Check the hardware switch / adapter settings first." },
    { q: "Is the correct SSID selected?", ok: "SSID matched", d: "Wrong network = wrong everything. Pick the right one (it may be hidden → type it)." },
    { q: "Is the passphrase / credentials correct?", ok: "Auth passed", d: "WPA2-PSK needs the right key; Enterprise needs valid RADIUS credentials." },
    { q: "Did the client get an IP from DHCP?", ok: "IP leased", d: "Associated but no IP = DHCP problem. Check the scope on the router/WLC." },
  ];
  const [i, setI] = useState(0);
  const done = i >= steps.length;
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {steps.map((_, idx) => <div key={idx} style={{ flex: 1, height: 6, borderRadius: 3, background: idx < i ? C.ok : idx === i ? C.amber : C.line }} />)}
      </div>
      {done ? (
        <div style={box({ textAlign: "center", border: "1px solid " + C.ok })}>
          <div style={{ color: C.ok, fontWeight: 700 }}>Connected ✓</div>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>All four checks passed — that's the standard bottom-up path.</div>
        </div>
      ) : (
        <div style={box()}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{steps[i].q}</div>
          <p style={{ fontSize: 12.5, color: "#b8c7d6", margin: "8px 0", lineHeight: 1.5 }}>{steps[i].d}</p>
          <button onClick={() => setI(i + 1)} style={btnS(C.ok, C.bg)}>✓ {steps[i].ok}</button>
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        <button onClick={() => setI(0)} style={btnS(C.well, C.dim, C.line)}>Restart</button>
      </div>
      <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 10, lineHeight: 1.6 }}>Troubleshoot a WLAN client bottom-up: radio → association → authentication → addressing. The first two checks (NIC + SSID) catch most "can't connect" tickets.</p>
    </div>
  );
}

// M13 · Routing Concepts — administrative distance / route selection
function VizAD() {
  const sources = [
    { n: "Connected", ad: 0 }, { n: "Static", ad: 1 }, { n: "EIGRP", ad: 90 },
    { n: "OSPF", ad: 110 }, { n: "RIP", ad: 120 },
  ];
  const [a, setA] = useState(2), [b, setB] = useState(3);
  const win = sources[a].ad <= sources[b].ad ? a : b;
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.dim, marginBottom: 8 }}>Two routes to the SAME network, learned from different sources. Which installs?</div>
        <div style={{ display: "flex", gap: 10 }}>
          {[[a, setA], [b, setB]].map(([val, set], side) => (
            <div key={side} style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {sources.map((s, i) => <button key={i} onClick={() => set(i)} style={{ fontSize: 11, padding: "5px 8px", borderRadius: 5, border: "1px solid " + (val === i ? C.cyan : C.line), background: val === i ? "#122430" : C.panel, color: val === i ? C.cyan : C.dim, cursor: "pointer" }}>{s.n}</button>)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[a, b].map((idx, side) => {
          const isWin = (side === 0 ? a : b) === win && a !== b ? win === (side === 0 ? a : b) : false;
          const winner = (side === 0 && win === a && a !== b) || (side === 1 && win === b && a !== b) || (a === b && side === 0);
          return (
            <div key={side} style={box({ border: "1px solid " + (winner ? C.ok : C.line), textAlign: "center" })}>
              <div style={{ color: winner ? C.ok : C.cyan, fontFamily: MONO, fontWeight: 700 }}>{sources[idx].n}</div>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.ink, margin: "4px 0" }}>AD {sources[idx].ad}</div>
              {winner && <div style={chip(C.ok)}>INSTALLED</div>}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 10, lineHeight: 1.6 }}>Between different route sources, the <b style={{ color: C.ink }}>lowest administrative distance wins</b> — it's how much the router trusts each source. {a === b ? "Same source both sides — a tie would then be broken by metric." : sources[win].n + " (AD " + sources[win].ad + ") beats " + sources[win === a ? b : a].n + " (AD " + sources[win === a ? b : a].ad + ")."} Memorize: C=0, S=1, EIGRP=90, OSPF=110, RIP=120.</p>
    </div>
  );
}

// M14 · IP Static Routing — route type + floating AD
function VizStatic() {
  const [nh, setNh] = useState(true), [exit, setExit] = useState(false);
  let type, tc;
  if (nh && exit) { type = "Fully specified"; tc = C.ok; }
  else if (nh) { type = "Recursive"; tc = C.cyan; }
  else if (exit) { type = "Directly connected"; tc = C.amber; }
  else { type = "Invalid — needs a next hop or exit interface"; tc = C.bad; }
  const [ad, setAd] = useState(1);
  const floats = ad > 1;
  return (
    <div>
      <div style={{ fontSize: 12, color: C.dim, marginBottom: 8 }}>Build the route — toggle what you specify:</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button onClick={() => setNh(!nh)} style={Object.assign(btnS(nh ? "#122430" : C.panel, nh ? C.cyan : C.dim, nh ? C.cyan : C.line), { flex: 1 })}>next-hop IP {nh ? "✓" : "○"}</button>
        <button onClick={() => setExit(!exit)} style={Object.assign(btnS(exit ? "#2a2416" : C.panel, exit ? C.amber : C.dim, exit ? C.amber : C.line), { flex: 1 })}>exit interface {exit ? "✓" : "○"}</button>
      </div>
      <div style={box({ fontFamily: MONO, fontSize: 12.5 })}>
        <span style={{ color: C.dim }}>ip route 192.168.1.0 255.255.255.0 </span>
        <span style={{ color: exit ? C.amber : C.dim }}>{exit ? "GigabitEthernet0/0 " : ""}</span>
        <span style={{ color: nh ? C.cyan : C.dim }}>{nh ? "10.0.0.2 " : ""}</span>
        <span style={{ color: floats ? C.violet : C.dim }}>{floats ? ad : ""}</span>
      </div>
      <div style={{ marginTop: 10, textAlign: "center" }}><span style={chip(tc)}>{type}</span></div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, color: C.dim, marginBottom: 6 }}>Administrative distance: {ad} {floats ? "(floating backup)" : "(normal static)"}</div>
        <input type="range" min="1" max="250" value={ad} onChange={e => setAd(+e.target.value)} style={{ width: "100%", accentColor: floats ? C.violet : C.amber }} />
      </div>
      <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 10, lineHeight: 1.6 }}>Next-hop only = <b style={{ color: C.cyan }}>recursive</b>; exit interface only = <b style={{ color: C.amber }}>directly connected</b>; both = <b style={{ color: C.ok }}>fully specified</b>. Append an AD (&gt;1) to make it a <b style={{ color: C.violet }}>floating static</b> — a backup that only installs when a lower-AD route disappears. To back up EIGRP set AD&gt;90; to back up OSPF set AD&gt;110.</p>
    </div>
  );
}

// M15 · Troubleshoot — packet arrival decision flow
function VizPacketFlow() {
  const nodes = [
    { q: "Frame arrives — dest MAC = my interface MAC?", yes: 1, no: "Drop (not for me)" },
    { q: "Read EtherType, de-encapsulate to the packet", yes: 2, no: null },
    { q: "Dest IP — is there a route (or default)?", yes: 3, no: "Drop + send ICMP unreachable" },
    { q: "ARP entry for the next hop?", yes: 4, no: "Send ARP request, then forward" },
    { q: "Re-encapsulate with new L2 header → forward", yes: null, no: null, end: true },
  ];
  const [i, setI] = useState(0);
  const n = nodes[i];
  return (
    <div>
      <div style={box({ minHeight: 90 })}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim, marginBottom: 6 }}>step {i + 1} of {nodes.length}</div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: n.end ? C.ok : C.ink }}>{n.q}</div>
        {!n.end && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {n.yes !== null && <button onClick={() => setI(n.yes)} style={btnS(C.ok, C.bg)}>Yes →</button>}
            {n.no && <button onClick={() => setI(0)} style={btnS("#2a1616", C.bad, C.bad)}>No: {n.no}</button>}
            {n.no === null && n.yes !== null && i === 1 && <span style={{ alignSelf: "center", fontSize: 11, color: C.dim, fontFamily: MONO }}>(always continues)</span>}
          </div>
        )}
        {n.end && <div style={{ marginTop: 10 }}><span style={chip(C.ok)}>packet forwarded</span></div>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={() => setI(0)} style={btnS(C.well, C.dim, C.line)}>Restart</button>
      </div>
      <p style={{ fontSize: 12.5, color: "#b8c7d6", marginTop: 10, lineHeight: 1.6 }}>A router processes an inbound frame in a fixed order: <b style={{ color: C.ink }}>L2 check (dest MAC) → EtherType → de-encapsulate → L3 route lookup → ARP for next hop → re-encapsulate → forward</b>. No route and no default = drop. This ordering is exactly what the troubleshooting questions test.</p>
    </div>
  );
}

// registry
const VIZ = [VizCable, VizMac, VizTrunk, VizIVR, VizSTP, VizEtherChannel, VizDORA, VizRA, VizFHRP, VizAttack, VizPortSec, VizChannels, VizWlanTshoot, VizAD, VizStatic, VizPacketFlow];

// ══════════════════════════════════════════════════════════
//  DATA — intro (prose) · concepts · facts · questions
// ══════════════════════════════════════════════════════════
const DATA = [
{ n: "Basic Device Configuration", c: "1.6.4",
intro: "This module is about getting a switch or router from box to working state: how it boots, how you connect to it, and how you secure and verify that access. Most of it is muscle-memory CLI plus knowing what each boot stage and LED is telling you.",
concepts: [
"A device boots in stages — POST (hardware self-test) → bootstrap → load the IOS image → load the startup-config. Knowing the order tells you where a boot is failing.",
"You reach a device three ways: console (physical, always works, needed for password recovery), and remote via Telnet (plaintext, insecure) or SSH (encrypted, preferred).",
"An SVI (switch virtual interface) is how a Layer 2 switch gets an IP for management — it only comes 'up' when a live access port exists in that VLAN.",
"Cable choice is mechanical: like-type devices need a crossover, unlike-type need straight-through (unless auto-MDIX handles it).",
"LEDs and show commands are your eyes — amber = trouble, and show interfaces / show ip interface brief expose errors and Layer 1/2 status.",
],
f: [
"Boot order: POST → bootstrap → load IOS → load startup-config (setup mode if none)",
"POST always runs first at power-up; the boot-loader recovery prompt is switch:",
"VLAN 1 = default SVI and default management interface (best practice: move management off it)",
"SSH encrypts the whole session; Telnet sends everything, passwords included, in cleartext",
"Cable rule: same group (PC/router, or switch/hub) → crossover; different groups → straight-through",
"Loopback = logical interface, comes up automatically, you can have several — great for testing/router-IDs",
"login local checks the local user database — create username <name> secret <pass> first or you lock yourself out",
"show interfaces = error counters (runts, giants, collisions); show ip interface brief = quick IP + L1/L2 status",
"Password recovery needs physical console access — the security backstop",
"System LED amber = powered but malfunctioning; port speed LED green = 100 Mbps",
],
q: [
["What can the command history feature do?", ["Recall past commands and set the buffer size","Save all commands to a log file","Autocorrect mistyped commands","Store 15 lines by default"], 0, "It recalls previous commands and lets you resize the buffer. Default is 10 lines, and it never writes log files."],
["The System LED on a Catalyst switch is amber. Meaning?", ["Switch is off","Powered on but not operating properly","Normal operation","Running on backup power"], 1, "Amber system LED = receiving power but malfunctioning. Green = healthy."],
["Two switches are cabled together and neither supports auto-MDIX. Cable type?", ["Straight-through","Crossover","Rollover","Coax"], 1, "Like devices (switch-switch, router-router) need crossover when auto-MDIX is off."],
["What is the main advantage of SSH over Telnet?", ["Faster sessions","Encryption of the session","Requires no authentication","Uses UDP"], 1, "SSH encrypts everything. Both do authentication and TCP — encryption is the differentiator."],
["SVI for VLAN 99 shows up/down (line protocol down). Fix?", ["Reboot the switch","Assign an active port to VLAN 99","Give VLAN 99 a second IP","Enable Telnet"], 1, "An SVI comes up only when at least one active port belongs to that VLAN."],
["Which statement about SVIs is true?", ["An SVI exists for VLAN 1 by default","SVIs are physical ports","Each port needs its own SVI","SVIs cannot take IPs"], 0, "The VLAN 1 SVI exists out of the box — that's the default management interface."],
["A switch crashed and boots to a recovery prompt. What does it show?", ["switch:","rommon>","boot#","recovery$"], 0, "The boot loader prompt on a Catalyst is switch: — your way in when the OS is broken."],
["Correct router boot sequence?", ["Load IOS, POST, load config","POST/bootstrap, load IOS, load startup-config","Load config, POST, load IOS","Bootstrap, config, IOS"], 1, "POST + bootstrap first, then IOS, then startup-config (or setup mode if none)."],
["The very first thing a switch does at power-on?", ["Load vlan.dat","POST","Send BPDUs","Load startup-config"], 1, "Power-On Self Test always runs first."],
["What does switch password recovery require?", ["A TFTP server","Physical access to the console port","An SNMP string","Telnet access"], 1, "You need to be physically on the console — that's the security backstop."],
["Which command must exist for login local to work on vty lines?", ["enable secret <pass>","username <name> secret <pass>","service password-encryption","line password <pass>"], 1, "login local checks the local username database — create the account first or you lock yourself out."],
["Where do you see runts, giants, and collisions?", ["show ip interface brief","show interfaces","show version","show vlan"], 1, "show interfaces carries the per-port error counters."],
["Default management interface on a Catalyst 2960?", ["VLAN 1","VLAN 99","FastEthernet0/1","Console 0"], 0, "VLAN 1 is the default — best practice moves management off it, but default is 1."],
["After a reload you land at Switch> immediately. What two things are true?", ["POST failed; config loaded","POST passed; no startup-config was found","IOS missing; POST passed","Boot loader took over"], 1, "Clean POST plus straight-to-prompt means there was no saved startup-config to load."],
["Full-duplex Fast Ethernet gives you…", ["Half the bandwidth of half duplex","Simultaneous send/receive with no collisions","More collisions, more speed","Only 10 Mbps"], 1, "Both directions at once, collision-free — better effective throughput."],
["Port LED in speed mode shows solid green. Port speed?", ["10 Mbps","100 Mbps","1000 Mbps","Port disabled"], 1, "Speed mode: off = 10, green = 100, blinking green = 1000."],
["Purpose of the boot loader?", ["Runs routing protocols","Provides a recovery environment if the OS is missing or damaged","Stores the VLAN database","Encrypts passwords"], 1, "It's the fallback environment when IOS can't load."],
["A directly attached host is dropping packets. Best command to investigate the port?", ["show interfaces","show vlan brief","show history","show flash"], 0, "show interfaces shows errors, drops, and duplex/speed mismatches on that port."],
["Why is Telnet considered insecure?", ["It uses UDP","Credentials cross the wire in plaintext","It cannot authenticate","It only works on VLAN 1"], 1, "Everything, including passwords, is cleartext. SSH encrypts it."],
["Which is true of IPv4 loopback interfaces on a router?", ["Physical port needed","Logical, automatically up, and you can have several","Only one allowed","Goes down with any physical port"], 1, "Loopbacks are virtual, always up once configured, and multiple are fine."],
["show ip interface brief displays…", ["Full routing table","Interface IPs plus Layer 1/2 status","MAC table","NAT translations"], 1, "It's the quick health check: IP, status, protocol per interface."],
["A router connects to a switch, no auto-MDIX anywhere. Cable?", ["Crossover","Straight-through","Rollover","Serial"], 1, "Unlike devices (router-switch, host-switch) use straight-through."],
["Which statement about a loopback is accurate?", ["It's an internal virtual interface used for testing/IDs","It must match a physical port","It requires no IP","It passes user traffic only"], 0, "Virtual, internal, great for testing and stable router IDs."],
["Before enabling login local on vty lines, you should…", ["Set an enable password only","Create a local username and secret","Disable SSH","Erase startup-config"], 1, "No local account + login local = locked out of remote access."],
]},

{ n: "Switching Concepts", c: "2.3.2",
intro: "A switch's entire job is moving frames intelligently: learn where devices are, forward only where needed, and avoid collisions. This module covers how it builds its MAC table, the two forwarding methods, and how switches carve a network into collision domains.",
concepts: [
"A switch learns by SOURCE MAC (recording which port each device is on) but forwards by DESTINATION MAC. Learning and forwarding use opposite ends of the frame.",
"If the destination MAC is unknown, the switch floods the frame everywhere except the ingress port — that's how it handles first contact.",
"Store-and-forward reads the whole frame and checks the FCS before sending (accurate, allows mixed speeds); cut-through starts forwarding after the destination MAC (fast, no error check).",
"Every switch port is its own collision domain, so full-duplex links have no collisions at all. Only a router ends a broadcast domain.",
"Buffers absorb bursts and bridge speed mismatches (e.g., a 10 Gbps uplink feeding 1 Gbps ports).",
],
f: [
"Learn from SOURCE MAC + ingress port; forward by DESTINATION MAC",
"Unknown destination MAC → flood out every port except the one it arrived on",
"Store-and-forward = receives whole frame + FCS check; enables mixed port speeds",
"Cut-through = forwards after the destination MAC (first 6 bytes), no error check",
"Fragment-free (a cut-through variant) reads the first 64 bytes to catch collision-window errors",
"Every switch port = its own collision domain; only a router bounds a broadcast domain",
"Full duplex = send + receive simultaneously, zero collisions",
"Frame buffers absorb congestion and speed mismatches",
"Idle MAC table entries age out after ~300 seconds",
"Port density = how many ports the switch provides",
],
q: [
["You add another switch to a LAN. What happens to the broadcast domain?", ["It shrinks","It gets larger","It splits in two","Nothing"], 1, "Switches forward broadcasts, so more switch ports = bigger broadcast domain. Routers are what split it."],
["A Layer 2 switch decides where to send a frame using…", ["Source IP","Destination MAC","Destination IP","Port number"], 1, "Forwarding is by destination MAC lookup in the table."],
["Collision domains: hub vs switch?", ["Both make one big domain","Hub = one big domain; switch = one per port","Switch = one big domain","Neither has collision domains"], 1, "Every switch port is its own collision domain; a hub shares one."],
["Frame arrives for a MAC not in the table. The switch…", ["Drops it","Floods it out all ports except the ingress port","Sends it to the router","Queues it until the MAC appears"], 1, "Unknown unicast = flood everywhere except where it came from."],
["A 10 Gbps server port feeds 1 Gbps client ports. What makes this work?", ["Cut-through switching","Frame buffering","STP","Auto-MDIX"], 1, "Buffers hold frames while the slower ports drain — that's how mixed speeds coexist."],
["Which switching method uses the FCS to check for errors?", ["Cut-through","Fragment-free","Store-and-forward","Fast-forward"], 2, "Store-and-forward receives the whole frame and validates the FCS before sending."],
["'Port density' refers to…", ["Cable thickness","Number of ports on the switch","Frames per second","MAC table size"], 1, "Simply how many ports the box gives you."],
["A switch keeps its MAC table current by examining…", ["Destination MAC of frames","Source MAC + the port it arrived on","ARP replies only","IP headers"], 1, "Source MAC + ingress port build and refresh the table."],
["Full duplex vs half duplex?", ["Half is faster","Full = simultaneous both ways, higher effective bandwidth","Full causes collisions","No difference on switches"], 1, "Full duplex removes collisions and doubles usable direction capacity."],
["Which address ADDS entries to the MAC table?", ["Destination MAC","Source MAC","Source IP","Multicast MAC"], 1, "Learning is always from the source MAC."],
["Which statement describes store-and-forward?", ["Forwards after the first 6 bytes","Delivers only error-checked frames","Never buffers","Fastest method"], 1, "It FCS-checks every frame, so what leaves the switch is verified clean."],
["Which device splits a Layer 2 broadcast domain?", ["Hub","Switch","Router","Repeater"], 2, "Only a Layer 3 boundary (router) stops broadcasts."],
["The purpose of frame buffers is to…", ["Encrypt frames","Hold frames during congestion or speed mismatch","Tag VLANs","Check FCS"], 1, "They're the shock absorber between fast and slow ports."],
["Cut-through switching begins forwarding after reading…", ["The whole frame","The destination MAC","The FCS","64 bytes"], 1, "It launches as soon as the destination MAC (first 6 bytes) is in — no error check."],
["Fragment-free switching reads how much before forwarding?", ["6 bytes","The first 64 bytes","The whole frame","Only the FCS"], 1, "64 bytes covers the collision window where most damaged frames show errors."],
["How long does an idle MAC table entry live by default?", ["30 seconds","About 300 seconds","24 hours","Forever"], 1, "Roughly 5 minutes of silence and the entry ages out."],
]},

{ n: "VLANs", c: "3.6.4",
intro: "VLANs slice one physical switch into many logical broadcast domains, so you can separate departments, voice, and management without buying more hardware. Trunks then carry multiple VLANs between switches by tagging frames — except the native VLAN, which crosses untagged.",
concepts: [
"A VLAN is a broadcast domain. Ports in different VLANs can't talk without a router, which is the whole security/segmentation win.",
"Trunks use 802.1Q tagging to carry many VLANs over one link; the tag tells the far switch which VLAN each frame belongs to.",
"The native VLAN is the one exception — its frames cross the trunk untagged. It must match on both ends and should be an unused VLAN.",
"VLAN databases live in two places: normal-range (1-1005) in vlan.dat in flash, extended-range (1006-4094) in running-config.",
"Deleting a VLAN doesn't relocate its ports — they go inactive until you reassign them, which is a common 'why is this port dead' gotcha.",
"DTP (dynamic trunking) is Cisco-only, so trunks to other vendors must be set statically.",
],
f: [
"A VLAN = one broadcast domain; inter-VLAN traffic needs a router or L3 switch",
"Normal VLANs 1-1005 live in vlan.dat (flash); extended 1006-4094 live in running-config",
"Delete a VLAN with ports in it → those ports go INACTIVE (they do NOT fall back to VLAN 1)",
"Native VLAN carries untagged traffic; match it both ends and keep it unused",
"DTP is Cisco proprietary — trunk to other vendors with switchport mode trunk + nonegotiate",
"switchport trunk allowed vlan X REPLACES the list; use 'add' to append",
"Voice VLAN = a separate VLAN for phones (adds QoS)",
"Management VLAN = the VLAN carrying the SVI you remotely administer",
"Full VLAN wipe: erase startup-config + delete vlan.dat + reload",
"show interfaces trunk = native + allowed VLANs; show interfaces switchport = mode/voice/encapsulation",
],
q: [
["VLAN 10 is deleted while ports are still assigned to it. Those ports…", ["Move to VLAN 1","Become inactive and pass no traffic","Become trunks","Keep working normally"], 1, "Orphaned ports go dark until reassigned. They never auto-move to the default VLAN."],
["Normal-range VLAN configs are stored…", ["In running-config","In vlan.dat in flash","In NVRAM only","On the TFTP server"], 1, "Normal range (1-1005) persists in the vlan.dat file in flash."],
["A trunk between a Cisco and a non-Cisco switch will not auto-negotiate. Why?", ["Bad cable","The other vendor does not support DTP","VLAN mismatch","STP is blocking"], 1, "DTP is Cisco proprietary — third-party gear cannot negotiate, so configure statically."],
["What is vlan.dat?", ["The startup-config","The VLAN database file","An IOS image","A log file"], 1, "It's the stored VLAN database."],
["Why define a native VLAN that is separate from data VLANs?", ["Faster trunking","Keeps untagged frames away from user traffic","Required by 802.1Q","Enables DTP"], 1, "Untagged frames land in the native VLAN — isolating it protects data VLANs."],
["An untagged frame arrives on an 802.1Q trunk. Which VLAN gets it?", ["VLAN 1 always","The native VLAN","The lowest allowed VLAN","It is dropped"], 1, "Untagged traffic on a trunk belongs to the native VLAN, whatever it is set to."],
["Two legitimate uses of a point-to-point trunk?", ["Switch-to-switch multi-VLAN + link to an 802.1Q-capable server","Hub-to-hub + PC links","Console access + SNMP","Voice-only links"], 0, "Trunks carry multiple VLANs between switches, and to servers that speak 802.1Q."],
["Three benefits of VLANs?", ["Security, lower cost, more efficient IT management","Fewer trunk links, faster CPU, no broadcasts","More collisions, more bandwidth, less config","Automatic routing, security, speed"], 0, "Segmentation = security + cheaper infrastructure + easier admin. VLANs do NOT reduce trunk links."],
["Extended-range VLAN configs are stored…", ["vlan.dat","Running-config","NVRAM","Flash log"], 1, "Extended range (1006-4094) lives only in running-config."],
["Where does a switch keep normal-range VLAN info by default?", ["RAM","Flash","NVRAM","ROM"], 1, "In flash, inside vlan.dat."],
["Which VLAN is used for remote switch administration?", ["Voice VLAN","Native VLAN","Management VLAN","Data VLAN"], 2, "The management VLAN carries the SVI you SSH into."],
["Which command shows the native VLAN and allowed VLAN list?", ["show vlan brief","show interfaces trunk","show running-config vlan","show mac address-table"], 1, "show interfaces trunk is the trunk status one-stop."],
["The vlan.dat file lives in…", ["NVRAM","Flash","RAM","ROM"], 1, "Flash memory."],
["Users complain about choppy IP-phone audio. Best fix?", ["Bigger MTU","A dedicated voice VLAN","More trunks","Disable STP"], 1, "A voice VLAN separates and prioritizes phone traffic."],
["A trunk allows 1-4094, then you enter switchport trunk allowed vlan 30. Result?", ["30 added to the list","Only VLAN 30 is now allowed","30 removed","Command rejected"], 1, "The command REPLACES the allowed list. Use 'add' to append."],
["Which three statements are accurate?", ["Management VLAN for admin; default VLAN holds all ports at boot; 802.1Q trunks carry tagged + untagged","Native VLAN must be 1; voice VLAN is default; trunks tag everything","Default VLAN can be deleted; management VLAN is 99 always; trunks drop untagged","VLANs share one broadcast domain"], 0, "Those three are the textbook truths. Native ≠ must-be-1, and trunks pass untagged (native) frames."],
["Traffic with no VLAN tag on a trunk is assigned to…", ["The management VLAN","The native VLAN","VLAN 4094","The voice VLAN"], 1, "Same rule, asked again: untagged = native."],
["Two primary benefits of VLANs?", ["Cost reduction + IT staff efficiency","More trunks + faster POST","Bigger broadcast domain + speed","No routers needed + free QoS"], 0, "The two-answer version drops security. Watch the required count in the stem."],
["Which command shows a port's access mode, voice VLAN, and encapsulation?", ["show interfaces trunk","show interfaces switchport","show vlan","show ip interface"], 1, "show interfaces switchport is the per-port VLAN detail view."],
["Fa0/1 is in VLAN 2. Move it to VLAN 3 with…", ["no switchport access vlan 2, then add 3","switchport access vlan 3","switchport trunk vlan 3","vlan 3 apply fa0/1"], 1, "One command — the new assignment overwrites the old."],
["To return a switch to factory VLAN state you must…", ["erase startup-config only","erase startup-config + delete vlan.dat + reload","reload twice","delete running-config"], 1, "The VLAN database is separate from startup-config — delete both, then reload."],
["Which two facts describe extended-range VLANs?", ["IDs 1006-4094; stored in running-config","IDs 1-1005; stored in flash","IDs 4095+; stored in NVRAM","Cisco-only; auto-saved"], 0, "Extended range = 1006-4094, running-config only."],
["After their VLAN is deleted, member ports…", ["Cannot communicate with anything","Join the native VLAN","Become trunks","Flap continuously"], 0, "Inactive until an admin reassigns them."],
["Best config for a trunk to a non-Cisco switch?", ["mode dynamic desirable","mode trunk + nonegotiate","mode access","mode dynamic auto"], 1, "Force the trunk and turn DTP off — the other side can't negotiate anyway."],
]},

{ n: "Inter-VLAN Routing", c: "4.5.4",
intro: "VLANs can't talk to each other on their own — you need Layer 3 routing between them. There are three ways to do it, and this module is mostly about knowing which to pick: legacy (a router port per VLAN), router-on-a-stick (subinterfaces on one trunk), or a Layer 3 switch using SVIs.",
concepts: [
"Legacy routing gives each VLAN its own physical router interface — simple but it runs out of ports immediately, so it's obsolete.",
"Router-on-a-stick (ROAS) uses one trunk with a subinterface per VLAN; each subinterface is tagged with encapsulation dot1q and holds that VLAN's gateway IP. Cheap, but the single link is a shared bottleneck (~50 VLAN ceiling).",
"A Layer 3 switch routes between VLANs internally using SVIs (interface vlan X) — hardware-fast, scales to thousands of VLANs, no external router. Costs more.",
"On a multilayer switch, no switchport turns a port into a routed Layer 3 port (IP, no VLAN membership) — different from an SVI.",
"The switch port feeding a ROAS router must be a trunk, because all VLANs share that one link.",
],
f: [
"3 methods: legacy (one router port per VLAN), ROAS (subinterfaces on a trunk), L3-switch SVIs",
"ROAS tops out around 50 VLANs; the L3 switch scales biggest and fastest",
"Subinterface recipe: encapsulation dot1q <vlan-id>, then the gateway IP (that IP is the VLAN's default gateway)",
"The switch port facing a ROAS router = trunk",
"Routed port = no switchport + an IP; no VLANs, no DTP on it",
"L3 switch routes between VLANs via SVIs (interface vlan X), one SVI per VLAN",
"Multilayer switch disadvantage = higher cost; advantage = speed + no external router",
"Verify ROAS VLAN/subinterface config with show ip interface + show running-config",
],
q: [
["Which option gives the highest Layer 3 forwarding rate as the VLAN gateway?", ["Legacy router, one port per VLAN","Router-on-a-stick","Multilayer switch routing","A hub"], 2, "Hardware-based L3 switching beats any router-arm design."],
["Which method scales to 1000+ VLANs?", ["ROAS","Legacy inter-VLAN routing","Internal routing on a Layer 3 switch","Hub-and-spoke"], 2, "Only the L3 switch scales that far. ROAS chokes long before."],
["In ROAS, where is each IP address configured?", ["On the physical interface","On each subinterface","On the switch SVI","On VLAN 1"], 1, "One subinterface per VLAN, each with that VLAN's gateway IP."],
["Legacy inter-VLAN routing requires…", ["A trunk to the router","A router with multiple LAN interfaces, each in an access VLAN","Subinterfaces","An SVI per VLAN"], 1, "One physical router port per VLAN, cabled to access ports."],
["Main disadvantage of a multilayer switch as the gateway?", ["Slow forwarding","Higher cost","No VLAN support","Needs subinterfaces"], 1, "You pay for the performance."],
["Which design uses multiple subinterfaces on one router port?", ["Legacy routing","Router-on-a-stick","SVI routing","Routed-port design"], 1, "That's the definition of ROAS."],
["ROAS is generally not recommended beyond roughly how many VLANs?", ["5","50","500","5000"], 1, "The curriculum's ceiling: ~50 VLANs, because the single trunk bottlenecks."],
["In encapsulation dot1Q 10, the 10 is…", ["The subinterface number","The VLAN ID","The metric","The port number"], 1, "It binds the subinterface to VLAN 10's tagged traffic."],
["What does no switchport do on a multilayer switch port?", ["Disables the port","Makes it a routed Layer 3 port","Makes it a trunk","Resets VLANs"], 1, "It strips L2 behavior so the port can take an IP."],
["On a 3560, you enter no switchport on Gi0/1. The port is now…", ["An access port","A routed port","A trunk","Err-disabled"], 1, "Same fact, switch-model flavor: routed port."],
["The switch port connecting to a ROAS router must be…", ["Access mode","Trunk mode","Routed","Shut down"], 1, "All the VLANs ride one link, so it has to trunk."],
["Which is true of the SVI inter-VLAN method?", ["One SVI serves all VLANs","An SVI is needed for each routed VLAN","SVIs are physical","SVIs replace trunks"], 1, "One interface vlan X per VLAN you want routed."],
["A multilayer switch routes between VLAN 10 and VLAN 20 using…", ["Subinterfaces","Internal SVIs","An external router","NAT"], 1, "SVIs, not subinterfaces — subinterfaces are the router-side concept."],
["Router-on-a-stick requires…", ["Multiple routers","One router interface configured with subinterfaces","A Layer 3 switch","One port per VLAN"], 1, "Single physical link, logically split."],
["Best two commands to check ROAS subinterface/VLAN assignment?", ["show vlan + show controllers","show ip interface + show running-config","show ip protocols + show arp","show cdp + show flash"], 1, "Those two show the subinterface config and status. The distractors show nothing useful here."],
["A router has 2 FastEthernet ports and must route 4 VLANs with minimal interfaces. Use…", ["Legacy routing","Router-on-a-stick","Two routers","A hub"], 1, "Subinterfaces let one port serve all four VLANs."],
["Key difference: legacy vs ROAS?", ["Legacy uses subinterfaces","Legacy needs one physical port per network; ROAS uses subinterfaces on one port","ROAS needs more cabling","No difference"], 1, "Physical ports vs logical subinterfaces."],
["To make G0/1.10 the VLAN 10 gateway, the first subinterface command is…", ["encapsulation vlan 10","encapsulation dot1q 10","switchport access vlan 10","vlan 10 routing"], 1, "encapsulation dot1q 10, then the IP. 'encapsulation vlan 10' is not a real command."],
["Important subinterface consideration?", ["Its IP must be that VLAN's default gateway","It needs its own cable","It must use DHCP","Number must match the port"], 0, "Hosts in the VLAN point at the subinterface IP."],
["Enabling ROAS takes which two actions?", ["Create VLANs + trunk on the switch; matching subinterfaces on the router","SVIs on both devices","no switchport on the router","Routing protocol on the switch"], 0, "Switch side: VLANs + trunk. Router side: dot1q subinterfaces."],
["Two advantages of subinterfaces over legacy?", ["Fewer router ports + simpler physical wiring","Faster than L3 switching + free","No trunk needed + no config","More bandwidth per VLAN"], 0, "You save ports and cables. Bandwidth is actually shared — that's the tradeoff."],
["Correct command and prompt to tag VLAN 20 on a subinterface?", ["R1(config-if)# encapsulation dot1q 20","R1(config-subif)# encapsulation dot1q 20","R1(config)# dot1q 20","R1(config-subif)# encapsulation 802.1q 20"], 1, "Subinterface prompt + dot1q keyword. '802.1q' spelled out is invalid."],
["Two disadvantages of ROAS in large networks?", ["Does not scale + needs a dedicated router","Too fast + too cheap","No VLAN support + no trunking","Requires L3 switch"], 0, "One trunk bottleneck and an extra box to buy/manage."],
["Which describes a routed port on a multilayer switch?", ["Created with no switchport; no trunking or VLAN membership","A trunk with an IP","An SVI","Any access port"], 0, "L3-only port: IP yes, VLANs/DTP no."],
["Two advantages of SVI routing over ROAS?", ["Faster (hardware switched) + no external router needed","Cheaper hardware + simpler licenses","Unlimited bandwidth + auto-config","Works without VLANs"], 0, "Everything stays inside the switch fabric."],
]},

{ n: "STP Concepts", c: "5.4.2",
intro: "Redundant links prevent outages but create Layer 2 loops that melt a network. Spanning Tree Protocol solves this by electing a root bridge and blocking just enough ports to leave one loop-free path — then reactivating them if a link fails.",
concepts: [
"STP elects one root bridge, then every other switch finds its lowest-cost path to it and blocks redundant links. Loop-free now, failover-ready.",
"The bridge ID = priority + extended system ID (the VLAN) + MAC. Lowest BID wins the root election; with equal priorities, the lowest MAC breaks the tie.",
"PVST+ (the Catalyst default) runs a separate spanning tree per VLAN, so you can make different switches root for different VLANs and load-share across uplinks.",
"Port roles/states matter: root port (best path to root), designated port (forwarding on a segment), and the transition states — Rapid PVST+ uses discarding/learning/forwarding.",
"PortFast skips the transition states on end-device ports for instant connectivity; BPDU guard protects those ports by err-disabling them if a BPDU ever arrives.",
],
f: [
"STP blocks redundant paths to kill Layer 2 loops; PVST+ = Catalyst default (per-VLAN tree)",
"Bridge ID = priority + extended system ID (VLAN) + MAC; lowest BID becomes root",
"All defaults? Lowest MAC address wins the root election",
"Root port = the lowest total path cost toward the root",
"Rapid PVST+ port states: discarding, learning, forwarding",
"Classic STP states: blocking → listening (BPDUs only) → learning (learns MACs) → forwarding",
"PortFast: access ports jump straight to forwarding; must never receive BPDUs",
"BPDU guard err-disables a PortFast port that hears a BPDU",
"PVST+ lets you set different root bridges per VLAN for load sharing (cost: more CPU)",
"Verify the root with show spanning-tree",
],
q: [
["A port configured with PortFast comes up in which state?", ["Blocking","Listening","Learning","Forwarding"], 3, "PortFast skips the transition states entirely — instant forwarding."],
["After the root bridge is elected, how do other switches pick their path to it?", ["Fewest hops","Lowest cumulative port cost","Highest bandwidth link only","Lowest MAC neighbor"], 1, "Lowest total path cost to root wins."],
["Default spanning-tree mode on Cisco Catalyst switches?", ["802.1D classic STP","PVST+","Rapid PVST+","MSTP"], 1, "PVST+ — a separate STP instance per VLAN — is the Catalyst default."],
["Every switch has default priority. Who becomes root?", ["Lowest MAC address","Highest MAC","Fastest CPU","Random"], 0, "Priorities tie, so the lowest MAC breaks it."],
["First step of root election?", ["Ports go blocking","Every switch claims to be root in its BPDUs","Root ports chosen","Costs compared"], 1, "Everyone advertises itself as root until better BPDUs arrive."],
["Two terms for ports connecting only to end devices?", ["Root port + designated port","PortFast + edge port","Trunk + access","Blocked + alternate"], 1, "End-device ports = edge ports, enabled via PortFast."],
["The three Rapid PVST+ port states?", ["Blocking, listening, forwarding","Discarding, learning, forwarding","Disabled, learning, blocking","Listening, learning, forwarding"], 1, "Rapid PVST+ collapses to discarding / learning / forwarding."],
["Which classic STP state sends/receives BPDUs but forwards no data and learns no MACs?", ["Blocking","Listening","Learning","Forwarding"], 1, "Listening = BPDUs only. Learning adds MAC learning; forwarding adds data."],
["The port with the best path toward the root bridge is the…", ["Designated port","Root port","Alternate port","Edge port"], 1, "Each non-root switch has exactly one root port."],
["Two true statements about PortFast?", ["Immediate forwarding + should never receive BPDUs","Slower convergence + trunk only","Blocks BPDUs + requires RSTP","For root bridges only"], 0, "It jumps to forwarding and belongs only where BPDUs never appear (end devices)."],
["STP has failed entirely and a broadcast storm is running. Immediate fix?", ["Reboot everything","Physically remove redundant links to break the loop","Enable PortFast everywhere","Add more switches"], 1, "No STP = manually break the loop, then fix the protocol."],
["The 12-bit extended system ID in a BPDU carries…", ["The MAC address","The VLAN ID","The port cost","The hello timer"], 1, "It embeds the VLAN number into the bridge ID."],
["Which command confirms a switch is the root bridge?", ["show spanning-tree","show vlan","show root","show bpdu"], 0, "show spanning-tree states 'This bridge is the root' per VLAN."],
["In networking, redundancy means…", ["Duplicate broadcasts","Multiple paths so there is no single point of failure","Extra VLANs","Backup passwords"], 1, "Alternate paths keep the network alive when a link dies."],
["The three components of the bridge ID?", ["Priority + extended system ID + MAC address","IP + mask + gateway","Cost + port + VLAN","Priority + hostname + serial"], 0, "Priority, then VLAN (extended system ID), then MAC."],
["A real advantage of PVST+?", ["Less CPU usage","Per-VLAN root bridges allow load sharing","One instance for all VLANs","Faster than RSTP"], 1, "Different roots per VLAN let you split traffic across uplinks. Cost: more CPU. 'One instance for all VLANs' is classic 802.1D — the thing PVST+ replaced."],
["Which two states populate the MAC table while processing BPDUs?", ["Blocking + listening","Learning + forwarding","Disabled + learning","Listening + forwarding"], 1, "Learning and forwarding both learn MACs; forwarding also passes data."],
["Two features of an STP-enabled redundant design?", ["Redundant links + no single point of failure","Loops + storms","One path only + fast failover","No BPDUs needed"], 0, "You get the safety of redundancy without the loops."],
["Which feature protects PortFast edge ports from rogue BPDUs?", ["Root guard","BPDU guard","Loop guard","Storm control"], 1, "BPDU guard err-disables the port the moment a BPDU shows up."],
["The core benefit of STP is that it…", ["Speeds up frames","Temporarily disables redundant paths to prevent loops","Encrypts BPDUs","Replaces routing"], 1, "Blocked-but-ready links: loop-free now, failover later."],
["Pick the true PortFast pair (yes, the bank asks twice).", ["Immediate forwarding + never expects BPDUs","Trunk-only + slow","Root-only + blocking","Requires BPDU filter + MST"], 0, "Same fact, second wording — the real quiz repeats it too."],
]},

{ n: "EtherChannel", c: "6.4.4",
intro: "EtherChannel bundles several physical links into one logical link, giving you more bandwidth and redundancy while STP treats the bundle as a single connection (so it doesn't block the extra links). The exam lives in the negotiation-mode matrix: which combinations of PAgP and LACP modes actually form a channel.",
concepts: [
"A bundle of 2-8 same-type links acts as one logical port channel. STP sees one link, so no member gets blocked — that's how you use all the bandwidth.",
"Two negotiation protocols: PAgP (Cisco, modes desirable/auto) and LACP (open standard 802.3ad, modes active/passive). They can't talk to each other.",
"A channel forms only if at least one side actively initiates: active or desirable. Two responders (auto+auto, passive+passive) never start. 'on' forces a bundle with no negotiation and only pairs with 'on'.",
"Member ports must match on speed, duplex, and VLAN/trunk settings, or they suspend. The channel-group number is only locally significant.",
"If one link dies the channel keeps forwarding at lower bandwidth with no STP recalculation.",
],
f: [
"Bundle 2-8 same-type links into one logical port channel; STP sees one link",
"PAgP (Cisco): desirable initiates / auto responds. LACP (802.3ad): active initiates / passive responds",
"Forms: on+on, active+active, active+passive, desirable+desirable, desirable+auto",
"Never forms: auto+auto, passive+passive, any cross-protocol pairing, on+anything-but-on",
"Must match on members: speed, duplex, VLAN/trunk settings. Channel-group number is local only",
"Load balance: source-dest MAC or source-dest IP; a single flow always rides one link",
"One member link dies → channel keeps forwarding, no STP recalculation",
"show etherchannel summary: SU = L2 up/in-use, SD = down; P bundled, s suspended, I stand-alone",
"PAgP is Cisco-only (duplex must match, 2+ ports); LACP works multivendor",
"Congested trunk between two switches? Bundle the links with EtherChannel",
],
q: [
["An LACP EtherChannel is up between S1 and S2. Which mode combination could be in use?", ["passive + passive","on + active","on + passive","passive + active"], 3, "LACP forms with active+active or active+passive (or on+on). Two passives never start."],
["Which PAgP mode INITIATES negotiation?", ["active","desirable","passive","auto"], 1, "desirable sends PAgP unconditionally; auto only responds. active/passive are LACP."],
["Which THREE interface parameters must match for the channel to form?", ["allowed VLANs, native VLAN, trunking mode","PortFast, STP state, allowed VLANs","EtherChannel mode, native VLAN, speed","STP state, mode, trunking"], 0, "Trunk settings must match. Mode can differ (desirable+auto works); PortFast/STP state don't matter."],
["Which is NOT an advantage of EtherChannel?", ["Config on the port-channel interface","No STP recalc when one link fails","STP shuts down unused bundle members","No link upgrades needed"], 2, "STP treats the bundle as one link — it never shuts members down."],
["One physical port in a two-port channel fails. Result?", ["STP recalculates","The channel fails","Stops until restart","Keeps transmitting at reduced bandwidth"], 3, "One logical link, no topology change — just less throughput."],
["Bundled interfaces form which logical connection?", ["port channel","loopback","VLAN interface","interface range"], 0, "The logical interface is Port-channelX."],
["Which PAgP mode bundles ONLY if it hears PAgP from the far side?", ["desirable","active","auto","passive"], 2, "auto = PAgP responder. passive is LACP's responder — classic swap trap."],
["Which TWO load-balancing methods does EtherChannel use?", ["src-dst MAC and src-dst IP","dst IP-dst MAC pairs","Per-frame round robin","Per-VLAN rotation"], 0, "Hash on src-dst MAC or src-dst IP. Never round-robin."],
["EtherChannel's function is…", ["Multiple VLANs on one link","Spreading WAN traffic","Time-slicing bandwidth","One logical link from multiple physical links between switches"], 3, "That's the definition. Multi-VLAN-on-one-link = trunking, the favorite distractor."],
["Which TWO combos successfully negotiate?", ["desirable+desirable and active+passive","active+on and passive+auto","auto+auto and passive+passive","on+desirable and auto+active"], 0, "Working set: on+on, active+active/passive, desirable+desirable/auto."],
["Which TWO are link aggregation protocols?", ["PAgP and 802.3ad","STP and RSTP","EtherChannel and STP","DTP and VTP"], 0, "PAgP (Cisco) + LACP/802.3ad (open). EtherChannel is the tech, not a protocol."],
["Which command makes a port INITIATE an LACP channel?", ["channel-group 1 mode active","channel-group 1 mode auto","channel-group 1 mode desirable","channel-group 1 mode passive"], 0, "active = LACP unconditional."],
["A bundle port gets moved to a different VLAN than its siblings. Result?", ["The EtherChannel fails","Stays up with PAgP","Stays up with LACP","No effect"], 0, "All members must match VLAN config — mismatch kills the channel regardless of protocol."],
["Which LACP mode runs ONLY when it receives LACP packets?", ["auto","passive","desirable","active"], 1, "passive = LACP responder."],
["A FastEthernet trunk between two 2960s is saturated. Best fix?", ["Add routers between them","Bundle ports with EtherChannel","Make smaller VLANs","Use the bandwidth command"], 1, "Aggregate links. The bandwidth command changes metrics, not real speed."],
["Which is true about PAgP?", ["Requires full duplex","It is Cisco proprietary","Needs an even port count","Works multivendor"], 1, "Cisco-only. Duplex must MATCH both ends (not necessarily full). Multivendor = LACP."],
["Which describes an EtherChannel?", ["Max 4 links","Can mix 100M and 1G links","Same-type physical links seen as one link between switches","Switch-to-router only"], 2, "Same type/speed, up to 8, one logical link."],
["Two advantages of LACP specifically?", ["Automatic bundle formation + multivendor support","Kills STP + adds L3 redundancy","Less config + test simulator","Faster links + proprietary security"], 0, "Open standard that negotiates automatically with any vendor."],
["Which THREE settings must match for ports to bundle?", ["speed, duplex, same VLAN on non-trunk ports","channel-group number, speed, SNMP","port security, duplex, group number","SNMP, VLAN, port security"], 0, "Speed + duplex + VLAN. Group number is locally significant; SNMP/port-security irrelevant."],
["In show etherchannel summary, Po1(SU) means…", ["Suspended, unused","Layer 2 channel, in use","Layer 3 channel, up","Standby unit"], 1, "S=Layer2, U=in use — healthy. Bonus: P bundled, D down, s suspended, I standalone."],
]},

{ n: "DHCPv4", c: "7.4.4",
intro: "DHCP automates IPv4 addressing so you don't hand-configure every host. The whole protocol is a four-message conversation (DORA), and the exam tests who broadcasts what, and how to relay DHCP across subnets when the server isn't local.",
concepts: [
"DORA: the client broadcasts DISCOVER, the server sends an OFFER, the client broadcasts REQUEST (which implicitly declines all other offers), and the server sends ACK to bind the lease.",
"Before it has an address, the client uses source 0.0.0.0 and destination 255.255.255.255 — that's why those packets are broadcasts.",
"A DHCP relay (ip helper-address on the gateway interface) forwards client broadcasts to a server on another subnet — and it relays several UDP services, not just DHCP.",
"ip dhcp excluded-address reserves addresses (for static devices) so the pool won't hand them out; ip address dhcp turns a router interface into a client, common on SOHO WAN links.",
"show ip dhcp binding shows the live address-to-MAC lease table.",
],
f: [
"DORA: Discover, Offer, Request, Ack",
"Client broadcasts Discover + Request; server aims Offer/Ack at the client's MAC",
"Pre-lease packets use source 0.0.0.0, destination 255.255.255.255",
"The broadcast REQUEST also implicitly declines every other server's offer",
"Renewal = a unicast REQUEST straight to the leasing server (at ~50% lease time)",
"ip helper-address on the gateway's LAN interface relays broadcasts to a remote server (and relays multiple UDP services)",
"ip dhcp excluded-address reserves addresses for statics",
"ip address dhcp makes an interface a DHCP client (SOHO WAN / ISP-assigned)",
"Dynamic allocation = leased/reclaimable; automatic = permanent from the pool",
"show ip dhcp binding = who holds which lease",
],
q: [
["Which TWO messages does a client send as broadcasts?", ["DISCOVER and REQUEST","OFFER and ACK","DISCOVER and ACK","OFFER and REQUEST"], 0, "The client broadcasts Discover and Request; the server's Offer and Ack come back the other way."],
["ip address dhcp on a router interface makes the router a…", ["DHCP server","DHCP relay","DHCPv4 client","DNS server"], 2, "That interface now asks for its own address — client mode."],
["Why is the initial DHCPREQUEST broadcast instead of unicast?", ["Client has no gateway yet only","It implicitly tells all other servers their offers were declined","Servers can't receive unicast","It's faster"], 1, "One broadcast accepts the chosen offer AND declines the rest."],
["A packet has source 0.0.0.0 and destination 255.255.255.255. Which DHCP message?", ["OFFER","DISCOVER","ACK","NAK"], 1, "A client with no address yet broadcasting for servers = DISCOVER."],
["A freshly booted host wanting an IP first sends…", ["DHCPREQUEST","DHCPDISCOVER broadcast","ARP request","DHCPACK"], 1, "Discovery starts the DORA sequence."],
["A client's lease is about to expire. It sends…", ["A new DISCOVER","A DHCPREQUEST to renew","A DHCPRELEASE","Nothing"], 1, "Renewal is a Request (unicast to the known server at 50% lease time)."],
["Destination IP of the first DHCPDISCOVER?", ["0.0.0.0","255.255.255.255","The server's IP","224.0.0.1"], 1, "The client doesn't know the server yet — limited broadcast."],
["Correct order with multiple servers present?", ["Offer, discover, ack, request","Discover, offer, request, acknowledgment","Request, offer, discover, ack","Discover, request, offer, ack"], 1, "D-O-R-A, always."],
["A router's WAN port acting as a DHCP client is typical of…", ["Enterprise core","A SOHO/home broadband router","A data center","An IXP"], 1, "Home routers lease their WAN address from the ISP."],
["Which allocation method hands out addresses for a limited time?", ["Static allocation","Automatic allocation","Dynamic allocation","Manual binding"], 2, "Dynamic = leased, reclaimable. Automatic = permanent from the pool."],
["The broadcast REQUEST also serves to…", ["Renew DNS","Notify other servers the offered address was taken","Ping the gateway","Reset the lease timer"], 1, "Second phrasing of the implicit-decline fact — the bank repeats it."],
["How does a DISCOVER reach a same-subnet server?", ["Unicast","As a broadcast","Via the gateway","Multicast to 224.0.0.2"], 1, "It's broadcast at both L2 (FFFF.FFFF.FFFF) and L3."],
["The very first Discover's destination address is…", ["The relay agent","255.255.255.255","The DNS server","The default gateway"], 1, "Asked twice in the bank. Limited broadcast."],
["Two scenarios where a router is a DHCP client?", ["ISP requires it + SOHO gateway WAN","Core routing + BGP peering","ACL testing + NAT pool","Never happens"], 0, "ISP-assigned addressing on consumer/SOHO gear."],
["A DHCPOFFER is addressed to…", ["255.255.255.255 always","The client's hardware (MAC) address","The relay agent MAC","The gateway"], 1, "The server targets the client's L2 address from the Discover."],
["To accept an offered address, the client sends…", ["A unicast ACK","A broadcast DHCPREQUEST","A DISCOVER","An ARP reply"], 1, "Broadcast Request = acceptance + decline-the-rest."],
["An advantage of using a router as relay agent is that it…", ["Encrypts DHCP","Relays several UDP service broadcasts, not just DHCP","Replaces the server","Speeds up leases"], 1, "ip helper-address forwards multiple UDP services (DNS, TFTP, DHCP…)."],
["Hosts can't get leases from a server on another subnet. Fix?", ["Bigger pool","ip helper-address <server> on the gateway's LAN interface","Static IPs everywhere","Enable CDP"], 1, "The relay turns the client broadcast into a unicast toward the remote server."],
["ip dhcp excluded-address 10.10.4.1 10.10.4.5 means…", ["Those hosts are blocked","The server never leases those addresses","Clients can't use the subnet","The pool is deleted"], 1, "Reserved for printers/servers/statics — the pool skips them."],
["Restore a Windows host's DHCP config with…", ["ipconfig /all","ipconfig /release then ipconfig /renew","netsh reset","arp -d"], 1, "Release the old lease, request a new one."],
["Which command shows lease-to-MAC mappings on a router DHCP server?", ["show ip dhcp pool","show ip dhcp binding","show arp","show ip lease"], 1, "Bindings = address, MAC, lease expiry."],
["Which statement about DHCP is true?", ["Offers are broadcast to everyone","A booting client broadcasts DHCPDISCOVER to locate a server","Requests are always unicast","ACK comes before Offer"], 1, "The Discover broadcast is the trigger for everything else."],
]},

{ n: "SLAAC and DHCPv6", c: "8.5.3",
intro: "IPv6 hosts can configure themselves without a server using SLAAC, or lean on DHCPv6, and a router advertisement's two flags decide which. This module is about those flags (M and O), the SLAAC process, and the DHCPv6 message flow.",
concepts: [
"A router advertisement (RA) carries the prefix and two flags. M (Managed) and O (Other) together tell the host whether to self-configure (SLAAC), fetch extras from a stateless server, or get everything from a stateful DHCPv6 server.",
"In SLAAC the host builds its own address from the RA prefix plus an interface ID (EUI-64 or random), and takes the RA's source as its default gateway — no server involved.",
"Before using any new IPv6 address the host runs DAD (Duplicate Address Detection): it sends a Neighbor Solicitation for its own address; a reply means it's taken.",
"DHCPv6 has its own four-message flow — SOLICIT, ADVERTISE, REQUEST, REPLY — and SOLICIT goes to the all-DHCPv6-servers multicast FF02::1:2.",
"Router side: ipv6 unicast-routing enables RAs. Client side: ipv6 address autoconfig = SLAAC, ipv6 address dhcp = stateful client — don't swap them.",
],
f: [
"RA flags: M=1 → stateful DHCPv6; M=0/O=1 → SLAAC address + stateless DHCPv6 for extras; both 0 → pure SLAAC",
"SLAAC: host builds its own GUA from the RA prefix (EUI-64 or random); gateway = the RA's source",
"DAD = send a Neighbor Solicitation for your own new address to check uniqueness before use",
"DHCPv6 flow: SOLICIT → ADVERTISE → REQUEST → REPLY",
"DHCPv6 SOLICIT is sent to FF02::1:2 (all DHCPv6 servers)",
"Stateless DHCPv6 uses INFORMATION-REQUEST for DNS/options only (no address)",
"Stateful server tracks leases; stateless only hands out info like DNS",
"Router side: ipv6 unicast-routing turns on RAs",
"Client side: ipv6 address autoconfig = SLAAC vs ipv6 address dhcp = stateful client",
],
q: [
["How does a SLAAC host confirm its new address is unique?", ["Pings the gateway","Sends an ICMPv6 Neighbor Solicitation targeting its own address (DAD)","Asks the DHCPv6 server","It doesn't check"], 1, "DAD: if anyone answers the NS, the address is taken."],
["Where does a SLAAC client learn its default gateway?", ["DHCPv6 REPLY","The source of the Router Advertisement","DNS","ARP"], 1, "The RA's source link-local address becomes the gateway."],
["Two ways a SLAAC host can build its interface ID?", ["EUI-64 or random generation","DHCP or static","MAC copy only","Hash of the prefix"], 0, "EUI-64 (from MAC) or a random 64-bit value."],
["Immediately after generating a SLAAC address, the host must…", ["Register with DNS","Perform DAD before using it","Send an RS","Renew the lease"], 1, "No using the address until DAD confirms it's unique."],
["Which command makes a router interface a stateful DHCPv6 client?", ["ipv6 address autoconfig","ipv6 address dhcp","ipv6 dhcp client","ipv6 enable"], 1, "ipv6 address dhcp = go get an address from a DHCPv6 server."],
["An RA telling hosts to get their address from DHCPv6 has…", ["M flag = 1","O flag = 1 only","Both flags 0","No flags"], 0, "M (Managed) = 1 means stateful DHCPv6 for addressing."],
["A DHCPv6 SOLICIT is sent to…", ["FF02::1","FF02::1:2","FF02::2","The server unicast"], 1, "FF02::1:2 = all-DHCPv6-servers multicast."],
["In which method does the router alone provide everything the host needs?", ["Stateful DHCPv6","SLAAC","Stateless DHCPv6","Static"], 1, "Pure SLAAC: prefix, gateway — all from the RA."],
["In stateless DHCPv6, the host requests DNS and extras using…", ["SOLICIT only","INFORMATION-REQUEST","REBIND","RENEW"], 1, "Address came from SLAAC; INFORMATION-REQUEST fetches the other parameters."],
["The ICMPv6 process that verifies address uniqueness is called…", ["NUD","DAD","RS/RA","Path MTU"], 1, "Duplicate Address Detection."],
["RA flags M=0 and O=0 mean…", ["Stateful DHCPv6","SLAAC only — the RA carries everything","Stateless DHCPv6","No IPv6"], 1, "Both flags off = pure SLAAC."],
["RA flags M=0 and O=1 mean…", ["SLAAC for the address + DHCPv6 for extras like DNS","Full stateful DHCPv6","Static only","RA is ignored"], 0, "O (Other) = 1: self-address via SLAAC, then INFORMATION-REQUEST for options."],
["Stateful vs stateless DHCPv6?", ["Stateful tracks leases; stateless hands out info only","Stateless tracks leases","Both track leases","Neither provides DNS"], 0, "The 'state' is the lease table."],
["Correct DHCPv6 four-message order?", ["SOLICIT, ADVERTISE, REQUEST, REPLY","DISCOVER, OFFER, REQUEST, ACK","ADVERTISE, SOLICIT, REPLY, REQUEST","RS, RA, NS, NA"], 0, "SARR — the v6 cousin of DORA."],
["Which command enables a router to send RAs (and thus SLAAC) on its LANs?", ["ipv6 route ::/0","ipv6 unicast-routing","ipv6 nd ra on","ipv6 dhcp server"], 1, "Global ipv6 unicast-routing switches on IPv6 routing + RA generation."],
["Which command sets a client interface to configure itself via SLAAC?", ["ipv6 address dhcp","ipv6 address autoconfig","ipv6 slaac","ipv6 nd autoconfig"], 1, "autoconfig = SLAAC; dhcp = stateful client. Don't swap them."],
]},

{ n: "FHRP Concepts", c: "9.3.2",
intro: "If a network's default gateway router dies, every host on that subnet loses its way out — unless you have gateway redundancy. First Hop Redundancy Protocols make two or more routers share one virtual gateway so hosts keep working through a failure.",
concepts: [
"Hosts point at a virtual router — a shared virtual IP and virtual MAC — not at any one physical router. If the active router fails, a standby takes over the same virtual address and hosts never notice.",
"HSRP and GLBP are Cisco proprietary; VRRP is the open standard (and VRRPv3 adds IPv6).",
"HSRP is active/standby only: one router forwards, the other waits. No load balancing.",
"GLBP goes further — one virtual IP but multiple virtual MACs — so several routers forward simultaneously, giving real load balancing.",
],
f: [
"FHRP = a redundant default gateway that survives a router failure",
"The virtual router shares one virtual IP + one virtual MAC with the real routers",
"HSRP + GLBP = Cisco proprietary; VRRP = open standard",
"VRRPv3 adds IPv6 support",
"HSRP = active/standby only — the standby is idle, no load balancing",
"GLBP = one virtual IP, multiple virtual MACs → true load balancing across routers",
"The three FHRP options: HSRP, VRRP, GLBP",
],
q: [
["The purpose of HSRP is to…", ["Speed up routing","Keep gateway connectivity alive if the active router fails","Encrypt LAN traffic","Replace STP"], 1, "First-hop redundancy: hosts keep the same gateway even when a router dies."],
["Which IPv4 gateway-redundancy protocol is NOT proprietary?", ["HSRP","GLBP","VRRPv2","HSRPv2"], 2, "VRRP is the open standard. HSRP and GLBP are Cisco-only."],
["Which is true of VRRPv3?", ["IPv4 only","Supports both IPv4 and IPv6","Cisco proprietary","No virtual IP"], 1, "v3 brought IPv6 into VRRP."],
["A disadvantage of HSRP compared to GLBP?", ["No virtual MAC","Failover only — the standby sits idle, no load balancing","Requires IPv6","Open standard"], 1, "HSRP's standby does nothing until the active dies. GLBP shares the load."],
["Which FHRP makes the best use of all gateway routers simultaneously?", ["HSRP","VRRPv2","GLBP","Proxy ARP"], 2, "GLBP load-balances across every member router."],
["Which TWO things do the routers share as the virtual router?", ["IP address and MAC address","Hostname and serial","Routing table and ARP cache","Priority and cost"], 0, "Hosts see one virtual IP + one virtual MAC, regardless of which physical box answers."],
["The illusion of a single gateway device is called the…", ["Phantom router","Virtual router","Root bridge","Designated router"], 1, "The virtual router is the shared identity."],
["Which THREE are first-hop redundancy options?", ["HSRP, VRRP, GLBP","STP, RSTP, MST","OSPF, EIGRP, RIP","NAT, PAT, ACL"], 0, "The FHRP family. The others are loop prevention and routing protocols."],
["Which TWO protocols provide Layer 3 gateway redundancy?", ["HSRP and VRRP","STP and VTP","CDP and LLDP","DTP and PAgP"], 0, "Both create a redundant default gateway."],
["Which TWO FHRPs are Cisco proprietary?", ["HSRP and GLBP","VRRP and GLBP","HSRP and VRRP","VRRPv2 and v3"], 0, "HSRP + GLBP. VRRP is the open one."],
["Which describes GLBP addressing?", ["Multiple virtual IPs, one MAC","One virtual IP, multiple virtual MACs","One IP, one MAC","No virtual addresses"], 1, "One gateway IP; each member router answers ARP with a different virtual MAC."],
["The standout feature of GLBP is…", ["Fastest hellos","Load balancing across multiple routers","IPv6 only","Open standard"], 1, "That's the G — Gateway Load Balancing Protocol."],
]},

{ n: "LAN Security Concepts", c: "10.6.2",
intro: "Layer 2 is often the softest target in a network, and this module surveys the threats and the framework for controlling access. It covers AAA and 802.1X for authentication, plus the specific switch attacks and the features that stop them.",
concepts: [
"AAA is the access-control framework: Authentication proves who you are, Authorization defines what you may do, Accounting logs what you did. RADIUS and TACACS+ are the server protocols; local AAA uses on-device credentials as a fallback.",
"802.1X is port-based access control with three roles: the supplicant (client), the authenticator (switch), and the authentication server.",
"Each Layer 2 attack has a matching mitigation — MAC flooding → port security; DHCP attacks → DHCP snooping; ARP spoofing → Dynamic ARP Inspection; IP/MAC spoofing → IP Source Guard.",
"Layer 2 is the weakest link because compromising it undermines everything above; risky defaults like CDP leak device info and should be disabled where untrusted.",
"Endpoint/perimeter appliances (ESA for email, WSA for web, NAC for admission) round out the defenses.",
],
f: [
"AAA = Authentication (who), Authorization (what you may do), Accounting (logging)",
"RADIUS + TACACS+ = server-based AAA; local AAA = on-device usernames (a fallback)",
"802.1X roles: supplicant (client) → authenticator (switch) → authentication server",
"Port security stops MAC flooding / CAM-table overflow",
"DHCP snooping stops rogue servers + starvation; DAI stops ARP spoofing; IPSG stops IP/MAC spoofing",
"Layer 2 is the weakest link; CDP is on by default and leaks device info",
"Appliances: ESA = email/SMTP, WSA = web, NAC = network admission control",
"Ransomware encrypts files for payment; IP spoofing uses a legitimate host's IP",
],
q: [
["Which TWO protocols provide server-based AAA authentication?", ["RADIUS and TACACS+","SNMP and SSH","HTTPS and SFTP","CDP and LLDP"], 0, "RADIUS and TACACS+ are the AAA server protocols."],
["Which Cisco service is on by default and considered a security risk?", ["SSH","CDP","NTP","Syslog"], 1, "CDP advertises device details to anyone listening — disable where untrusted."],
["Attackers usually target which OSI layer as the weakest link?", ["Layer 7","Layer 4","Layer 2","Layer 1"], 2, "Compromise L2 and everything above it falls."],
["A switch starts flooding every frame out all ports. Which attack?", ["DHCP starvation","MAC address table overflow","ARP poisoning","VLAN hopping"], 1, "Fill the CAM table and the switch fails open — acting like a hub."],
["Benefit of server-based AAA with a local database configured too?", ["Faster logins","A fallback if the AAA server is unreachable","No passwords needed","Encrypted CDP"], 1, "Local creds are the backup when RADIUS/TACACS+ is down."],
["Which of these is a server-based AAA protocol?", ["SSH","RADIUS","SNMP","Syslog"], 1, "RADIUS (or TACACS+)."],
["Which feature prevents MAC and IP address spoofing?", ["Port security","IP Source Guard","BPDU guard","Storm control"], 1, "IPSG checks source IP/MAC against the DHCP snooping bindings."],
["AAA accounting is used to…", ["Grant access","Verify identity","Collect and report usage/activity","Encrypt sessions"], 2, "Accounting = the audit trail."],
["Legit users can't get IP addresses because the pool is exhausted by bogus requests. Attack?", ["DHCP spoofing","DHCP starvation","ARP flood","Smurf"], 1, "Starvation leases out the whole pool with fake MACs."],
["Which THREE are endpoint/perimeter security products?", ["NAC, Web Security Appliance, Email Security Appliance","OSPF, EIGRP, BGP","VTP, DTP, CDP","NAT, ACL, QoS"], 0, "NAC + WSA + ESA."],
["True or false framing: in 802.1X the client device is the supplicant.", ["True","False — it's the authenticator","False — it's the server","False — it's the agent"], 0, "Supplicant = the device asking to join."],
["IP spoofing is best described as…", ["Stealing a MAC","A rogue node using a legitimate host's IP address","Flooding ARP","Cloning DHCP"], 1, "Hijack the trusted IP, inherit its access."],
["The three components of AAA?", ["Authentication, authorization, accounting","Access, audit, alert","Admin, agent, appliance","Attack, analyze, act"], 0, "Who you are, what you can do, what you did."],
["A user may only use FTP and nothing else. Which AAA component enforces this?", ["Authentication","Authorization","Accounting","Auditing"], 1, "Authorization defines the allowed actions after login."],
["Best mitigation for a CAM-overflow DoS?", ["BPDU filter","Port security","Bigger switch","Static ARP"], 1, "Limit MACs per port and the flood attack dies."],
["Malware that encrypts your files and demands payment is…", ["Spyware","Ransomware","A worm","Adware"], 1, "Pay-to-decrypt = ransomware."],
["Which appliance monitors and secures SMTP traffic?", ["WSA","ESA","NAC","ASA only"], 1, "Email Security Appliance handles SMTP."],
["Which AAA component decides what resources a user can reach?", ["Accounting","Authorization","Authentication","Association"], 1, "Same fact, second stem — authorization = permissions."],
["Authentication against usernames stored on the device itself is called…", ["Server-based AAA","Local AAA authentication","802.1X","Kerberos"], 1, "Local AAA = the device's own database."],
["In 802.1X, the switch between client and server plays which role?", ["Supplicant","Authenticator","Authentication server","Broker"], 1, "The switch relays credentials — it's the authenticator."],
["In 802.1X, the device requesting access is the…", ["Authenticator","Supplicant","Server","Proxy"], 1, "Asked twice in the bank: client = supplicant."],
["Which feature prevents the MAC flooding attack?", ["DAI","Port security","IPSG","DHCP snooping"], 1, "And again — port security is THE answer to MAC flooding."],
]},

{ n: "Switch Security Configuration", c: "11.6.4",
intro: "This module turns the LAN-security concepts into actual switch config: locking down unused ports, hardening trunks and the native VLAN, and enabling port security, DHCP snooping, DAI, and PortFast/BPDU guard. It's the hands-on hardening checklist.",
concepts: [
"Unused ports are a liability — shut them and park them in an unused VLAN so nobody can plug in and get on the network.",
"Port security limits how many MACs a port learns; the default violation action is shutdown (err-disable), with protect and restrict as quieter options. Sticky learning saves learned MACs to the config.",
"VLAN hopping is stopped by hard-setting access mode and disabling DTP so a port can't be tricked into trunking; keep the native VLAN unused and off VLAN 1.",
"DHCP snooping classifies ports as trusted (the real server) or untrusted (everyone else) and is the prerequisite for Dynamic ARP Inspection.",
"PortFast belongs on access ports for instant connectivity, always paired with BPDU guard to err-disable the port if a rogue switch's BPDU appears.",
],
f: [
"Unused ports: shutdown and place them in an unused VLAN",
"Native VLAN: a dedicated unused VLAN — never VLAN 1, never the management VLAN",
"Stop VLAN hopping: statically set access mode + disable DTP (nonegotiate)",
"Port security default violation = shutdown (err-disabled); protect drops silently; restrict drops + logs",
"Sticky learning (mac-address sticky) saves learned MACs into the running config",
"Recover an err-disabled port: fix the cause, then shutdown / no shutdown",
"DHCP snooping starts with global ip dhcp snooping; ports become trusted or untrusted",
"DAI (Dynamic ARP Inspection) requires the DHCP snooping binding table",
"PortFast + BPDU guard belong together on access ports",
],
q: [
["Best practice for the native VLAN on trunks?", ["Leave it as VLAN 1","Move it to a dedicated unused VLAN","Match the management VLAN","Use the voice VLAN"], 1, "Unused, non-1, not management — nothing should live in it."],
["PortFast should be enabled on…", ["Trunk ports","All access ports serving end devices","Uplinks","Every port"], 1, "End-device access ports only — never toward other switches."],
["The single best command for an unused switch port?", ["description unused","shutdown","switchport mode dynamic","no cdp"], 1, "Dead ports stay administratively down."],
["Which TWO features mitigate DHCP attacks?", ["DHCP snooping and port security","BPDU guard and root guard","CDP and LLDP","QoS and NAT"], 0, "Snooping blocks rogue servers; port security blunts starvation's MAC churn."],
["Which pair of actions prevents VLAN hopping?", ["Statically set access mode + disable DTP negotiation","Enable DTP + use VLAN 1","PortFast + BPDU guard","Bigger MTU + QoS"], 0, "No auto-trunking = no hop. Also keep the native VLAN off access ports."],
["A prerequisite step to mitigate ARP spoofing with DAI is…", ["Enable DHCP snooping on the VLANs","Enable CDP","Disable STP","Static ARP everywhere"], 0, "DAI validates ARP against the snooping binding table — snooping comes first."],
["DHCP snooping classifies ports as…", ["Open and closed","Trusted and untrusted","Active and passive","Edge and core"], 1, "Server-facing = trusted; everything else untrusted."],
["Two valid ways to enable PortFast?", ["Interface spanning-tree portfast, or global spanning-tree portfast default","Only via BPDU guard","vlan portfast","stp fast on"], 0, "Per-interface, or globally for all access ports."],
["A port went err-disabled. After fixing the cause you recover it with…", ["reload","shutdown then no shutdown","clear errdisable","no port-security"], 1, "Bounce the port (or configure errdisable recovery)."],
["The first command to turn on DHCP snooping?", ["ip dhcp snooping vlan 10","ip dhcp snooping (global)","ip dhcp trust","service dhcp"], 1, "Global enable first, then per-VLAN, then trust the server port."],
["Default port-security violation mode?", ["protect","restrict","shutdown","alert"], 2, "Violation = port err-disables. Protect/restrict drop quietly/with logs."],
["Which command makes learned MACs stick in the running config?", ["switchport port-security mac-address sticky","mac-address save","port-security static","sticky-learn on"], 0, "Sticky learning converts dynamic MACs into saved secure entries."],
["Dynamic ARP Inspection depends on…", ["The routing table","The DHCP snooping binding table","CDP neighbors","The MAC table only"], 1, "No bindings, no ARP validation."],
["BPDU guard is designed to protect…", ["Trunk uplinks","PortFast-enabled access ports from receiving BPDUs","The root bridge only","Routed ports"], 1, "A BPDU on an edge port = err-disable, instantly."],
]},

{ n: "WLAN Concepts", c: "12.8.2",
intro: "Wireless trades the certainty of a cable for shared radio spectrum, so this module covers how Wi-Fi organizes itself (SSIDs, BSS/ESS), how devices avoid stepping on each other, the standards and bands, and the security options. Channel planning and the security order are the high-value bits.",
concepts: [
"The SSID is the network name; APs announce themselves and their SSID with periodic beacon frames. Clients either listen passively for beacons or actively probe (which requires knowing the SSID).",
"Wireless can't detect collisions mid-air, so it uses CSMA/CA — carrier sense with collision avoidance — instead of CSMA/CD.",
"In the 2.4 GHz band, channels are only 5 MHz apart but ~22 MHz wide, so neighbors overlap; only channels 1, 6, and 11 are far enough apart not to interfere. 5 GHz has more clean channels but shorter range.",
"Topologies: a BSS is one AP's cell; an ESS is multiple BSSs joined by a wired distribution system (enabling roaming); ad hoc (IBSS) is peer-to-peer with no AP.",
"Security strength runs WEP < WPA < WPA2 (AES) < WPA3; a lightweight AP is managed by a WLC over CAPWAP (UDP 5246 control / 5247 data), versus a standalone autonomous AP.",
],
f: [
"SSID = the network name; APs broadcast it in periodic beacon frames",
"Security strength: WEP < WPA < WPA2 (AES) < WPA3",
"2.4 GHz: only channels 1 / 6 / 11 don't overlap; 5 GHz = more channels, shorter range",
"802.11n = first dual-band standard + MIMO (multiple antennas) for higher rates",
"Wireless uses CSMA/CA (collision avoidance), not CSMA/CD",
"BSS = one AP; ESS = multiple BSSs wired together (roaming); ad hoc/IBSS = no AP",
"CAPWAP (lightweight AP ↔ WLC): UDP 5246 control, 5247 data",
"Join sequence: discover (probe/beacon) → authenticate → associate",
"Autonomous AP = standalone; lightweight AP = WLC-managed",
"Active scan = client probes (needs SSID); passive scan = listen for beacons",
],
q: [
["Sharing your phone's cellular connection with a laptop is called…", ["Roaming","Tethering / hotspot","Bridging","Pairing"], 1, "The phone becomes the gateway."],
["Which technology lets 802.11n hit higher data rates?", ["Wider cables","MIMO (multiple antennas)","CSMA/CD","WEP"], 1, "Multiple-input multiple-output antennas multiply throughput."],
["Strongest authentication among WEP, WPA, WPA2?", ["WEP","WPA","WPA2","They're equal"], 2, "WPA2 with AES. (WPA3 is stronger still when offered.)"],
["The parameter that names a wireless network is the…", ["BSSID","SSID","ESSID key","Channel"], 1, "Service Set Identifier."],
["A client in ACTIVE discovery mode…", ["Waits for beacons","Sends probe requests and must know the SSID","Uses DHCP first","Never scans"], 1, "Active = probing (needed when SSID broadcast is off). Passive = listen for beacons."],
["First standard to operate in BOTH 2.4 GHz and 5 GHz?", ["802.11a","802.11g","802.11n","802.11b"], 2, "802.11n went dual-band; a was 5 only, b/g were 2.4 only."],
["An autonomous AP is…", ["WLC-managed","A standalone, self-contained AP","A repeater","A mesh node"], 1, "Configured on its own, no controller."],
["A SOHO wireless router integrates which TWO functions besides routing?", ["Access point and Ethernet switch","Firewall and IDS only","Modem and printer","WLC and RADIUS"], 0, "Home boxes = router + AP + small switch in one."],
["CAPWAP between AP and WLC uses…", ["TCP 443","UDP 5246 (control) and 5247 (data)","UDP 69","TCP 22"], 1, "Control on 5246, data on 5247."],
["The non-overlapping 2.4 GHz channels are…", ["1, 6, 11","1, 5, 9","2, 7, 12","All of them"], 0, "Everything else overlaps — plan around 1/6/11."],
["Best internet option for a ship at sea?", ["DSL","Cable","Satellite","Cellular"], 2, "Only satellite reaches open ocean."],
["Bluetooth headphones with a phone form which topology?", ["Infrastructure","Ad hoc","ESS","Mesh backhaul"], 1, "Direct device-to-device = ad hoc."],
["Two or more BSSs joined by a wired distribution system form an…", ["IBSS","ESS","VLAN","MBSS"], 1, "Extended Service Set — roaming across APs."],
["Which frame does an AP send to announce itself?", ["Probe request","Beacon","RTS","ACK"], 1, "Beacons broadcast SSID + capabilities on a timer."],
["Which management frame is transmitted periodically without being asked?", ["Association request","Beacon","Authentication","CTS"], 1, "Same fact, second stem: beacons are the periodic broadcast."],
["The most secure wireless option available today is…", ["WPA2-PSK","WPA3","WEP-128","Open + MAC filter"], 1, "WPA3 where supported."],
["Wireless media contention is handled by…", ["CSMA/CD","CSMA/CA","Token passing","Polling only"], 1, "Radios can't detect collisions mid-air — they avoid them."],
["5 GHz compared to 2.4 GHz offers…", ["More non-overlapping channels but shorter range","Longer range and fewer channels","Identical behavior","No interference ever"], 0, "More clean spectrum, less wall penetration."],
["Correct order for a client joining a WLAN?", ["Associate, authenticate, discover","Discover (probe/beacon), authenticate, associate","Authenticate, discover, associate","DHCP, associate, probe"], 1, "Find it, prove yourself, then associate."],
]},

{ n: "WLAN Configuration", c: "13.5.4",
intro: "This module is the practical side of wireless: standing up a WLAN on a home router or a WLC, securing it, and troubleshooting clients that won't connect. Know the hardening basics, what a WPA2-Enterprise WLAN needs, and the bottom-up troubleshooting order.",
concepts: [
"Harden any new router/WLC first by changing the default admin password (and SSID and management IP) — defaults are public knowledge. Hiding the SSID and MAC filtering are weak, easily-defeated extras, not real security.",
"WPA2-Enterprise needs a RADIUS server and per-user credentials (802.1X), and on a WLC the WLAN maps to a VLAN/dynamic interface you create first. WPA2-PSK just uses a shared passphrase.",
"A WLC hands clients addresses from a DHCP scope (an address pool) and is monitored via SNMP.",
"2.4 GHz suffers interference from microwaves, cordless phones, and Bluetooth; QoS is what prioritizes voice and video.",
"Troubleshoot a client bottom-up: is the NIC enabled, is the right SSID selected, are the credentials right, did DHCP assign an address.",
],
f: [
"First move on a new router/WLC: change the default admin password (also SSID, management IP)",
"Hiding the SSID and MAC filtering are weak protections on their own (SSIDs/MACs are easily observed)",
"WPA2-Enterprise = RADIUS + per-user credentials; on a WLC the WLAN needs its VLAN/interface first",
"WLC DHCP scope = the client address pool; SNMP monitors the WLC",
"2.4 GHz interference sources: microwaves, cordless phones, Bluetooth",
"QoS prioritizes voice/video traffic",
"Home routers use private IPs + NAT; 192.168.0.1 + admin = factory defaults",
"Client can't connect? Check NIC enabled + correct SSID first (bottom-up)",
],
q: [
["To keep casual neighbors from seeing your WLAN name…", ["Enable WPA3","Disable SSID broadcast","Change the channel","Lower power"], 1, "Beacons stop carrying the name. Weak alone — pair with real encryption."],
["A small office LAN behind a wireless router typically uses…", ["Public IPs per host","Private addressing with NAT","IPv6 only","Static /30s"], 1, "RFC 1918 space translated at the edge."],
["The FIRST security step on a new wireless router?", ["Enable DMZ","Change the default administrator password","Turn off DHCP","Add MAC filters"], 1, "Default creds are in every manual on the internet."],
["Which protocol lets an admin monitor a WLC's health and stats?", ["FTP","SNMP","DTP","ICMP only"], 1, "SNMP is the monitoring channel for the controller."],
["Before creating a new WPA2-Enterprise WLAN on a WLC, you should…", ["Reboot the WLC","Create the VLAN/dynamic interface for it","Disable CAPWAP","Set channel 14"], 1, "The WLAN maps to an interface/VLAN — build that first (plus the RADIUS server entry)."],
["On a WLC, a DHCP scope is…", ["A rogue-AP filter","A pool of IP addresses handed to wireless clients","An SNMP view","A channel plan"], 1, "The controller can lease client addresses itself."],
["The point of setting a WLAN passphrase is…", ["Faster roaming","Authenticating clients that join","Hiding the SSID","Enabling QoS"], 1, "PSK = the shared proof-of-membership."],
["Wi-Fi slows to a crawl whenever the microwave runs. Cause?", ["DHCP exhaustion","2.4 GHz RF interference","DNS failure","Bad passphrase"], 1, "Microwaves and cordless phones stomp on 2.4 GHz."],
["A teleworker needs reliable voice and video over the WLAN. Enable…", ["Port security","QoS","MAC filtering","SSID hiding"], 1, "Prioritize real-time traffic."],
["Browsing to 192.168.0.1 shows the admin page accepts default credentials. Conclusion?", ["Router is hacked","The router still has factory-default settings","DNS is broken","NAT is off"], 1, "Factory IP + factory login = nothing was changed yet."],
["A laptop can't see the office WLAN. First TWO checks?", ["Reinstall the OS + replace the AP","Wireless NIC enabled + correct SSID selected","Change router + ISP","Disable antivirus + firewall"], 1, "Start at the basics: radio on, right network."],
["WPA2-Enterprise differs from WPA2-PSK because it requires…", ["A longer passphrase","A RADIUS server with per-user credentials","MAC filtering","A hidden SSID"], 1, "Enterprise = 802.1X against RADIUS, no shared passphrase."],
["To relieve 2.4 GHz congestion on a dual-band router…", ["Disable 5 GHz","Steer capable clients to 5 GHz (band steering)","Boost 2.4 power","Use channel 14"], 1, "Move what can move; leave 2.4 for legacy gear."],
["MAC address filtering is considered weak because…", ["It slows the AP","MAC addresses are easily observed and spoofed","It breaks DHCP","It disables WPA2"], 1, "An attacker clones an allowed MAC in seconds."],
]},

{ n: "Routing Concepts", c: "14.6.2",
intro: "This module is the foundation of how routers choose paths: what routes come from where, how a router decides between competing routes, and the difference between static and dynamic routing. The two number systems — administrative distance and metric — are the core of it.",
concepts: [
"A router's job is to connect networks and pick the best path to each destination. Directly connected networks appear automatically as C (network) and L (local) routes when an interface comes up with an IP.",
"When two routes to the same network come from different sources, administrative distance decides — it ranks how trustworthy each source is, and lower wins (C=0, S=1, EIGRP=90, OSPF=110, RIP=120).",
"When multiple routes to the same network come from the same protocol, the metric decides — lower is better. AD compares across protocols; metric compares within one.",
"A default route (0.0.0.0/0 or ::/0) is the gateway of last resort for anything with no specific match.",
"Static routing is secure and low-overhead but manual; dynamic routing discovers networks, adapts to failures automatically, and scales — at the cost of CPU/bandwidth. CEF (FIB + adjacency tables) does the fast forwarding.",
],
f: [
"A router connects multiple IP networks and determines the best path",
"AD = trust of the route SOURCE (C=0, S=1, EIGRP=90, OSPF=110, RIP=120); lower wins between protocols",
"Metric compares routes WITHIN one protocol; lower wins",
"C = connected, L = local — created automatically when an interface is up with an IP",
"Default route (0.0.0.0/0 or ::/0) = the gateway of last resort",
"Static routing: secure, predictable, low CPU/bandwidth — but manual and doesn't scale",
"Dynamic routing: discovers networks + auto-reroutes on failure + scales (uses more CPU/bandwidth)",
"An exit interface going down removes its static route from the table",
"CEF = FIB + adjacency tables (fast hardware forwarding)",
"[AD/metric] format: in [1/0], the 1 is administrative distance",
],
q: [
["A packet matches no specific route. What forwards it?", ["The longest prefix","The gateway of last resort (default route)","ARP","It always drops"], 1, "If a default route exists, unmatched traffic follows it."],
["Three advantages of static routing?", ["More secure, predictable path, minimal CPU/bandwidth","Auto-failover, scales, self-healing","Zero config, encrypted, fast","Learns neighbors, load balances, cheap"], 0, "Nothing is advertised, the path is known, and there's no protocol overhead. The middle set describes DYNAMIC routing."],
["Two functions of dynamic routing protocols?", ["Discover remote networks + maintain up-to-date routing tables","Assign IPs + resolve names","Encrypt routes + filter MACs","Block loops + tag VLANs"], 0, "Discovery and table maintenance are the core jobs."],
["The key advantage of dynamic over static routing?", ["Less CPU","Automatically reroutes when the topology changes","More secure","No bandwidth used"], 1, "Failover without human hands."],
["The value that ranks the trustworthiness of a route SOURCE is…", ["Metric","Administrative distance","Cost","TTL"], 1, "AD compares protocols/sources; metric compares routes inside one protocol."],
["Which forwarding mechanism uses a FIB plus an adjacency table?", ["Process switching","Fast switching","Cisco Express Forwarding","Flooding"], 2, "CEF pre-builds both tables for wire-speed decisions."],
["A company border router pointing all external traffic to the ISP uses a…", ["Host route","Default route","Summary of RFC1918","Floating loopback"], 1, "One default route covers the entire internet."],
["Two primary functions of a router?", ["Connect multiple IP networks + determine the best path","Extend collision domains + flood frames","Assign MACs + tag VLANs","Encrypt + compress"], 0, "Interconnection and path selection."],
["Several routes to the same destination exist from ONE protocol. Which wins?", ["Lowest AD","Lowest metric","Newest route","Highest bandwidth always"], 1, "Same protocol = same AD, so the metric decides."],
["Which TWO route codes appear automatically when an interface comes up with an IP?", ["C and L","S and D","O and R","C and S"], 0, "Connected (network) and Local (the /32 or /128 of the interface itself)."],
["In [1/0] next to a route, the 1 is…", ["The metric","The administrative distance","The hop count","The interface number"], 1, "AD/metric — AD first."],
["Which route creates a gateway of last resort?", ["A host route","A default static route","A connected route","A local route"], 1, "ip route 0.0.0.0 0.0.0.0 ... (or a protocol-injected default)."],
["Two static route types commonly found in production tables?", ["Static to a specific network + default static","Floating dynamic + local","Summary local + host dynamic","Recursive OSPF + flat RIP"], 0, "Specific-network statics and the default."],
["Two reasons to choose static over dynamic routing?", ["Less processing/bandwidth + more secure","Scales better + self-heals","Auto-discovery + multivendor","Faster convergence + no admin"], 0, "The static tradeoff: efficiency and secrecy for manual labor."],
["The IPv6 default static route destination is written…", ["0::0/128","::/0","FF02::1/8","2000::/3"], 1, "::/0 — all zeroes, zero-length prefix."],
["Two advantages of static routes (second phrasing in the bank)?", ["More secure + fewer router resources","Auto-updating + scalable","Loop-free + encrypted","Free + self-documenting"], 0, "Same pair, different stem: security + low overhead."],
["A route that forwards traffic when no other route matches is a…", ["Summary route","Default route","Child route","Backup VLAN"], 1, "Asked repeatedly: that's the default route."],
["ip route 172.16.1.0 255.255.255.0 172.16.2.2 appears in the table as…", ["C 172.16.1.0/24","S 172.16.1.0/24 [1/0] via 172.16.2.2","O 172.16.1.0 [110/2]","L 172.16.2.2/32"], 1, "Static code S, AD 1, via the next hop."],
["The exit interface for a static route goes down. The route…", ["Stays with AD 255","Is removed from the routing table","Becomes dynamic","Loops"], 1, "No usable exit = the static is withdrawn until the interface returns."],
["ALL packets without a specific table match are sent to the…", ["Broadcast address","Default static route's next hop","Loopback","DNS server"], 1, "Gateway of last resort again — the bank loves this one."],
["Dynamic routing is the better fit for…", ["Tiny stub LANs","Networks whose topology changes frequently","One-router sites","Labs only"], 1, "Frequent change = let the protocol do the updating."],
["To compare multiple routes learned by the SAME protocol, the router uses…", ["AD","The metric","Uptime","Interface speed"], 1, "Metric decides inside a protocol."],
["A directly connected network is missing from the table. Most likely cause?", ["Wrong AD","The interface is down / not activated (needs no shutdown)","Missing metric","ACL blocks it"], 1, "C/L routes only exist while the interface is up/up with an IP."],
]},

{ n: "IP Static Routing", c: "15.6.4",
intro: "This module is the hands-on version of static routing: the three ways to write a static route, default routes, host routes, and floating statics used as backups. The recursive vs directly-connected vs fully-specified distinction and the floating-AD math are what the questions hammer.",
concepts: [
"A static route can be written three ways: recursive (next-hop IP only — the router looks up how to reach that next hop), directly connected (exit interface only), or fully specified (both exit interface and next hop).",
"A default route (ip route 0.0.0.0 0.0.0.0 ... / ipv6 route ::/0 ...) matches anything with no more-specific entry. A host route is a single address — /32 in IPv4, /128 in IPv6.",
"A floating static route is the same route with a deliberately higher administrative distance, so it stays out of the table until the preferred (lower-AD) route fails. To back up EIGRP set AD>90; to back up OSPF set AD>110.",
"An IPv6 static using a link-local next hop must also include the exit interface, because link-local addresses aren't globally unique.",
"Longest-prefix match always wins — a more specific route beats a less specific one regardless of AD.",
],
f: [
"Recursive = next hop only; directly connected = exit interface only; fully specified = both",
"Floating static = the same route with a HIGHER AD → a hidden backup",
"Backing up EIGRP (90) needs AD > 90; backing up OSPF (110) needs AD > 110",
"Defaults: ip route 0.0.0.0 0.0.0.0 ... / ipv6 route ::/0 ...",
"A link-local IPv6 next hop MUST include the exit interface",
"Host route = /32 (IPv4) or /128 (IPv6)",
"Longest prefix match beats everything, including AD",
"Test a floating route: shut the primary interface, then show ip route",
"A global IPv6 next hop can stand alone; only link-local needs the interface",
],
q: [
["ip route 0.0.0.0 0.0.0.0 209.165.200.226 creates…", ["A host route","A default route for all unmatched traffic","A summary of 209.x","A floating route"], 1, "Quad-zero network + mask = match everything."],
["A static route configured with ONLY an exit interface is called…", ["Recursive","Directly connected","Fully specified","Floating"], 1, "Interface-only = directly connected static."],
["Your floating static replaced the EIGRP route instead of backing it up. Why?", ["Wrong mask","Its AD was not higher than 90","Missing exit interface","EIGRP is down"], 1, "To float above EIGRP the AD must exceed 90 — otherwise it wins and takes over."],
["A static route listing BOTH the exit interface and the next hop is…", ["Recursive","Directly connected","Fully specified","Summary"], 2, "Both pieces = fully specified."],
["Which command creates a floating static toward 10.0.0.1?", ["ip route 192.168.1.0 255.255.255.0 10.0.0.1","ip route 192.168.1.0 255.255.255.0 10.0.0.1 120","ip route 10.0.0.1 float","ip route 192.168.1.0 float 10.0.0.1"], 1, "Append the higher AD (here 120) at the end."],
["An IPv6 static specifying ONLY the next-hop address is…", ["Fully specified","Recursive","Directly connected","Illegal"], 1, "Next-hop-only = recursive (the router resolves the exit itself)."],
["A route pointing at one single server is a…", ["Default route","Host route","Summary route","Null route"], 1, "/32 (or /128) — one address."],
["Which IPv6 default route is valid?", ["ipv6 route ::/0 fe80::1","ipv6 route ::/0 s0/0/0 fe80::1","ipv6 route 0/0 fe80::1","ipv6 route ::/128 fe80::1"], 1, "A link-local next hop is ambiguous alone — the exit interface must be included."],
["Which characteristic defines a default static route?", ["Matches the biggest network only","Acts as the gateway for everything with no better match","Always AD 90","IPv6 only"], 1, "The catch-all."],
["The purpose of a floating static route is…", ["Load balancing","A standby backup used when the primary path fails","Faster convergence","Route summarization"], 1, "It sits invisible until the better route disappears."],
["To back up an OSPF-learned route, a floating static needs an AD of…", ["1","90","110","Anything above 110, e.g., 200"], 3, "It must lose to OSPF (110) until OSPF is gone."],
["How do you verify a floating static actually works?", ["reload","Shut the primary interface, then check show ip route","clear ip route *","debug all"], 1, "Kill the primary and confirm the backup is installed."],
["A static route that includes the distance parameter is a…", ["Host route","Floating static route","Recursive route","Connected route"], 1, "The appended AD is what makes it float."],
["Why give a floating static a HIGHER AD than the primary?", ["To prefer it","So it stays hidden until the primary dies","To disable it","Higher = faster"], 1, "Backup semantics: worse AD = benched until needed."],
["The IPv4 default route network and mask are…", ["255.255.255.255 0.0.0.0","0.0.0.0 0.0.0.0","0.0.0.0 255.255.255.255","127.0.0.1 /8"], 1, "Quad-zero, quad-zero."],
["You configured ip route ... 5 as a backup. To test it…", ["Wait a week","Manually shut the primary interface","Change the metric","Ping the backup next hop only"], 1, "Same test, second stem: force the failover."],
["Among connected, static, EIGRP, and OSPF routes — which source has the HIGHEST AD?", ["Connected","Static","EIGRP","OSPF"], 3, "0 / 1 / 90 / 110 — OSPF trails this list."],
["Routes exist for 172.16.0.0/16, 172.16.1.0/24, and a default. A packet to 172.16.1.1 uses…", ["The default","172.16.0.0/16","172.16.1.0/24","It drops"], 2, "Longest prefix match always wins."],
["A fully specified static route contains…", ["AD only","Exit interface + next-hop address","Two next hops","A name"], 1, "Second phrasing — both parameters."],
["The standard backup for a dynamically learned route is a…", ["Second protocol","Floating static route","Host route","Summary"], 1, "Floating static = the designed safety net."],
["Default static routes are typically configured on…", ["Core mesh routers","A stub/edge router pointing at the provider","Every switch","DNS servers"], 1, "One exit = one default."],
["Which is a valid IPv6 default static route via a GLOBAL next hop?", ["ipv6 route ::/0 2001:db8:acad:2::2","ipv6 route ::/0 fe80::2 (alone)","ipv6 route ::/64 2001:db8::1","ipv6 default 2001:db8::1"], 0, "A global next hop can stand alone; only link-local needs the interface."],
["Final check that a floating route takes over correctly?", ["show version","Shut the primary and watch show ip route","debug spanning-tree","Nothing needed"], 1, "Third repetition in the bank — they really want you to know the test."],
]},

{ n: "Troubleshoot Static & Default Routes", c: "16.3.4",
intro: "The final module is diagnostic: how a router processes an inbound packet step by step, and the commands you use when a static or default route isn't working. Know the packet-handling order and the show/ping toolkit.",
concepts: [
"A router handles an inbound frame in a fixed order: check the destination MAC (is it for me?), read the EtherType, de-encapsulate to the packet, look up the destination IP, resolve the next-hop MAC via ARP, then re-encapsulate and forward.",
"Forwarding across networks means stripping the old Layer 2 header and building a new one for the next segment — the packet inside is preserved, the framing changes.",
"The core troubleshooting trio: ping (is the next hop / destination reachable?), show ip route (is the route in the table?), and show ip interface brief (is the exit interface up?).",
"A static route only installs when its exit interface is up; if the interface goes down, the route is withdrawn. No matching route and no default route means the packet is dropped.",
"show cdp neighbors detail confirms Layer 1/2 connectivity to a directly connected Cisco device and reveals its IP; no route removed with the no ip route command.",
],
f: [
"Inbound frame order: dest MAC → EtherType → de-encapsulate → dest IP lookup",
"Forwarding = strip the old L2 header, route, then re-encapsulate with a new L2 header",
"Troubleshooting trio: ping + show ip route + show ip interface brief",
"show ip interface brief answers 'is the exit up?'; ping answers 'is the next hop alive?'",
"No table match + no default route = silent drop (with ICMP unreachable)",
"No ARP entry for the next hop → send an ARP request first",
"no ip route <route> removes a static route",
"An interface going down removes its static route from the table",
"show cdp neighbors detail = the directly connected Cisco device + its IP",
"C = connected, L = local, S = static in show ip route",
],
q: [
["Correct order when a router receives a frame?", ["Check dest IP, de-encapsulate, check MAC","Check dest MAC, identify the EtherType, de-encapsulate, look up dest IP","De-encapsulate first, then MAC","ARP, then route, then MAC"], 1, "L2 checks first, then unwrap, then the L3 lookup."],
["The THREE go-to commands for static route troubleshooting?", ["ping, show ip route, show ip interface brief","traceroute, show flash, show users","debug all, reload, show clock","show vlan, show mac, show cdp"], 0, "Reachability, table contents, interface status — that trio solves most of it."],
["Which command confirms the exit interface is up/up?", ["show ip route","show ip interface brief","show controllers","show arp"], 1, "The quick status column view."],
["A static route points at a network that no longer exists. Remove it with…", ["delete ip route","no ip route <that route>","clear ip route","erase static"], 1, "Prefix the original command with no."],
["Forwarding a packet toward another network, the router…", ["Keeps the original frame intact","De-encapsulates, selects the path, re-encapsulates with new L2 headers","Only rewrites the IP","Broadcasts it"], 1, "New segment = new Layer 2 framing; the packet inside persists."],
["show cdp neighbors is used to learn about…", ["Any vendor's devices","Directly connected Cisco devices","Remote subnets","DNS servers"], 1, "CDP = Cisco-to-Cisco discovery, one hop away."],
["Which TWO commands verify the exit interface is up AND the next hop answers?", ["show ip interface brief + ping","show flash + traceroute","show arp + show vlan","debug ip + reload"], 0, "Status check + reachability check."],
["A correctly typed static route never appears in the table. Check…", ["The DNS config","That the exit (serial) interface is up","The MAC table","NTP sync"], 1, "Routes install only when their exit interface is usable."],
["No matching route and no default route configured. The router…", ["Floods the packet","Drops the packet","ARPs for the destination","Queues it"], 1, "No path = drop (with an ICMP unreachable back)."],
["The code C in show ip route marks…", ["A CEF route","A directly connected network","A candidate default","A child route"], 1, "C = connected."],
["An interface used by a static route goes down. The route…", ["Persists as backup","Is removed from the table","Turns into L","Gets AD 255"], 1, "Same behavior tested again — pulled until the interface recovers."],
["The router has the route but no ARP entry for the next hop's MAC. It will…", ["Drop the packet","Send an ARP request first","Broadcast the data","Use CDP"], 1, "Resolve L2 first, then forward."],
["To verify Layer 1/2 connectivity to a directly attached Cisco device, use…", ["ping only","show cdp neighbors detail","show ip route","telnet"], 1, "CDP working = L1/L2 working, and it names the neighbor + its IP."],
]},
];

// ══════════════════════════════════════════════════════════
//  ENGINE + APP
// ══════════════════════════════════════════════════════════
const ALL = [];
DATA.forEach((m, mi) => m.q.forEach((t, qi) => ALL.push({ key: mi + "-" + qi, mi, q: t[0], a: t[1], c: t[2], x: t[3] })));
const BOX_W = [8, 4, 2, 1];
const BOX_NAME = ["new", "learning", "review", "mastered"];
const BOX_COLOR = [C.dim, C.amber, C.cyan, C.ok];

export default function SRWETrainer() {
  const [view, setView] = useState("home");      // home | study | drill
  const [scope, setScope] = useState("all");
  const [studyMi, setStudyMi] = useState(0);
  const [prog, setProg] = useState({});
  const [inject, setInject] = useState([]);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [cur, setCur] = useState(null);
  const [picked, setPicked] = useState(null);
  // AI tutor state
  const [deep, setDeep] = useState(null);
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepErr, setDeepErr] = useState(false);
  const [ask, setAsk] = useState("");
  const [convo, setConvo] = useState([]);        // [{role, text}]

  const getP = (k) => prog[k] || { box: 0, wrong: 0, seen: 0 };
  const poolFor = (sc) => sc === "all" ? ALL : sc === "weak" ? ALL.filter(q => { const p = getP(q.key); return p.wrong > 0 && p.box < 3; }) : ALL.filter(q => q.mi === sc);

  const pickNext = (sc, injList, last, ansCount) => {
    const pool = poolFor(sc);
    if (!pool.length) return null;
    for (let i = 0; i < injList.length; i++) {
      if (injList[i].due <= ansCount) { const q = pool.find(p => p.key === injList[i].key); if (q && q.key !== last) return { q, injIdx: i }; }
    }
    let total = 0;
    const w = pool.map(q => { if (q.key === last && pool.length > 1) return 0; const wt = BOX_W[getP(q.key).box]; total += wt; return wt; });
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return { q: pool[i], injIdx: -1 }; }
    return { q: pool[0], injIdx: -1 };
  };

  const resetTutor = () => { setDeep(null); setDeepLoading(false); setDeepErr(false); setAsk(""); setConvo([]); };

  const startDrill = (sc) => { const nxt = pickNext(sc, inject, null, answered); if (!nxt) return; setScope(sc); setCur(nxt.q); setPicked(null); resetTutor(); setView("drill"); };

  const answer = (i) => {
    if (picked !== null) return;
    setPicked(i);
    const p = getP(cur.key), isRight = i === cur.c, np = Object.assign({}, prog);
    if (isRight) { np[cur.key] = { box: Math.min(3, p.box + 1), wrong: p.wrong, seen: p.seen + 1 }; setCorrect(correct + 1); setInject(inject.filter(j => j.key !== cur.key)); }
    else { np[cur.key] = { box: 0, wrong: p.wrong + 1, seen: p.seen + 1 }; setInject(inject.filter(j => j.key !== cur.key).concat([{ key: cur.key, due: answered + 4 }])); }
    setProg(np); setAnswered(answered + 1);
  };

  const next = () => { resetTutor(); const nxt = pickNext(scope, inject, cur.key, answered); if (!nxt) { setView("home"); return; } if (nxt.injIdx >= 0) setInject(inject.filter((_, idx) => idx !== nxt.injIdx)); setCur(nxt.q); setPicked(null); };

  // shared LLM call — builds context from the current card + running convo
  const callLLM = async (userMsg, isFirstBreakdown) => {
    const wrongPick = picked !== null && picked !== cur.c ? cur.a[picked] : null;
    const ctx = "You are a patient CCNA SRWE (course 2) tutor. The student has ALREADY mastered all CCNA 1 'Introduction to Networks' fundamentals — OSI/TCP-IP layers, IPv4/IPv6 addressing and subnetting, binary/hex, Ethernet framing, MAC vs IP, ARP, basic cabling, ping/traceroute, and core CLI. Do NOT re-explain those from scratch; assume them and reference them in passing at most. Focus your teaching on the SRWE-level concept the question is actually testing, and pitch it at someone who already knows the groundwork. Current practice question: \"" + cur.q + "\" Options: " + cur.a.join(" | ") +
      ". Correct answer: \"" + cur.a[cur.c] + "\"." + (wrongPick ? " The student had chosen the wrong option: \"" + wrongPick + "\"." : "") +
      " Answer in plain, easy English, under 180 words, no markdown or bullet symbols. Use short sentences and a tiny concrete example when it helps.";
    const messages = [];
    if (isFirstBreakdown) {
      messages.push({ role: "user", content: ctx + " Teach the underlying concept from the ground up so the correct answer becomes obvious" + (wrongPick ? ", and explain specifically why the chosen option is wrong and what it actually describes." : ".") });
    } else {
      messages.push({ role: "user", content: ctx + " The student is asking a follow-up. Prior exchange: " + convo.map(m => m.role + ": " + m.text).join(" || ") + " || Student now asks: " + userMsg });
    }
    const res = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages }) });
    if (!res.ok) throw new Error("tutor request failed");
    const data = await res.json();
    const txt = (data.text || "").trim();
    if (!txt) throw new Error("empty");
    return txt;
  };

  const breakdown = async () => {
    if (deepLoading || !cur || picked === null) return;
    setDeepLoading(true); setDeepErr(false);
    try { const txt = await callLLM(null, true); setDeep(txt); setConvo([{ role: "tutor", text: txt }]); }
    catch (e) { setDeepErr(true); }
    setDeepLoading(false);
  };

  const sendAsk = async () => {
    const q = ask.trim();
    if (!q || deepLoading) return;
    setDeepLoading(true); setDeepErr(false);
    const newConvo = convo.concat([{ role: "student", text: q }]);
    setConvo(newConvo); setAsk("");
    try { const txt = await callLLM(q, false); setConvo(newConvo.concat([{ role: "tutor", text: txt }])); if (!deep) setDeep(txt); }
    catch (e) { setDeepErr(true); }
    setDeepLoading(false);
  };

  const mastery = (mi) => { let s = 0; DATA[mi].q.forEach((_, qi) => s += getP(mi + "-" + qi).box); return Math.round((s / (3 * DATA[mi].q.length)) * 100); };
  const masteredCount = ALL.filter(q => getP(q.key).box === 3).length;
  const weakCount = ALL.filter(q => { const p = getP(q.key); return p.wrong > 0 && p.box < 3; }).length;

  const page = { minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "24px 16px 64px" };
  const wrap = { maxWidth: 900, margin: "0 auto" };
  const panel = { background: C.panel, border: "1px solid " + C.line, borderRadius: 10, padding: 18, marginBottom: 16 };
  const btn = (bg, fg, bd) => ({ padding: "9px 18px", borderRadius: 8, border: "1px solid " + (bd || bg), background: bg, color: fg, fontWeight: 700, cursor: "pointer", fontSize: 14 });
  const secLabel = (col) => ({ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: col, marginBottom: 8 });

  // ── HOME ──
  if (view === "home") {
    return (
      <div style={page}><div style={wrap}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: C.dim }}>CCNA 2 · SRWE v7 · all 16 modules · {ALL.length} drill items</div>
        <h1 style={{ fontSize: 30, margin: "6px 0 2px", fontWeight: 800 }}>SRWE <span style={{ color: C.amber }}>Adaptive Trainer</span></h1>
        <p style={{ color: C.dim, fontSize: 14, marginTop: 4, lineHeight: 1.6 }}>Open a module to study it — explanation, concepts, facts, and a live visualization — then drill. Miss a question and it resets to "new" and returns within a few cards. Ask the tutor anything after you answer.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "14px 0 20px" }}>
          <button onClick={() => startDrill("all")} style={btn(C.amber, C.bg)}>Drill everything</button>
          <button onClick={() => { if (weakCount) startDrill("weak"); }} style={btn(weakCount ? "#2a1616" : C.panel, weakCount ? C.bad : C.dim, weakCount ? C.bad : C.line)}>Weak spots ({weakCount})</button>
          <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 12, color: C.dim, alignSelf: "center" }}>answered {answered} · {answered ? Math.round((correct / answered) * 100) : 0}% · mastered {masteredCount}/{ALL.length}</div>
        </div>
        {DATA.map((m, mi) => {
          const pct = mastery(mi);
          return (
            <div key={mi} style={{ background: C.panel, border: "1px solid " + C.line, borderRadius: 10, padding: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.cyan, minWidth: 48 }}>{m.c}</div>
              <div style={{ fontWeight: 700, flex: 1, minWidth: 170 }}>{m.n} <span style={{ color: C.dim, fontWeight: 400, fontSize: 12 }}>· {m.q.length} q</span></div>
              <div style={{ width: 110, height: 6, background: C.well, borderRadius: 3, overflow: "hidden" }}><div style={{ width: pct + "%", height: "100%", background: pct === 100 ? C.ok : C.amber, transition: "width .3s" }} /></div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: pct === 100 ? C.ok : C.dim, width: 36 }}>{pct}%</div>
              <button onClick={() => { setStudyMi(mi); resetTutor(); setView("study"); }} style={btn("#122430", C.cyan, C.cyan)}>Study</button>
              <button onClick={() => startDrill(mi)} style={btn("#2a2416", C.amber, C.amber)}>Drill</button>
            </div>
          );
        })}
        <p style={{ color: C.dim, fontSize: 12, marginTop: 14 }}>Progress is session-only (resets on reload). Questions are reworded from the published practice bank so you learn the concept, not the letter.</p>
      </div></div>
    );
  }

  // ── STUDY PAGE ──
  if (view === "study") {
    const m = DATA[studyMi];
    const Viz = VIZ[studyMi];
    return (
      <div style={page}><div style={wrap}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <button onClick={() => setView("home")} style={btn(C.well, C.dim, C.line)}>← Modules</button>
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.cyan }}>{m.c}</div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{m.n}</div>
          <button onClick={() => startDrill(studyMi)} style={Object.assign(btn(C.amber, C.bg), { marginLeft: "auto" })}>Drill this module →</button>
        </div>

        <div style={panel}>
          <div style={secLabel(C.amber)}>Explanation</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: C.ink, margin: 0 }}>{m.intro}</p>
        </div>

        <div style={panel}>
          <div style={secLabel(C.cyan)}>Concepts — the why</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {m.concepts.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 10 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: C.cyan, flexShrink: 0, marginTop: 1 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.6, color: "#c3d0dd" }}>{c}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={panel}>
          <div style={secLabel(C.ok)}>Facts — quick reference</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {m.f.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
                <span style={{ color: C.ok, fontSize: 12, flexShrink: 0 }}>▸</span>
                <span style={{ fontSize: 13, lineHeight: 1.55, color: "#c3d0dd" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={panel}>
          <div style={secLabel(C.violet)}>Interactive — try it</div>
          <Viz />
        </div>

        <div style={{ textAlign: "center", marginTop: 8 }}>
          <button onClick={() => startDrill(studyMi)} style={btn(C.amber, C.bg)}>Drill this module →</button>
        </div>
      </div></div>
    );
  }

  // ── DRILL ──
  const p = getP(cur.key);
  const scopeName = scope === "all" ? "Full course" : scope === "weak" ? "Weak spots" : DATA[scope].n;
  const inp = { flex: 1, background: C.dark, border: "1px solid " + C.line, borderRadius: 8, padding: "9px 12px", color: C.ink, fontSize: 13, fontFamily: "inherit", outline: "none" };
  return (
    <div style={page}><div style={wrap}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={() => setView("home")} style={btn(C.well, C.dim, C.line)}>← Modules</button>
        <div style={{ fontWeight: 700 }}>{scopeName}</div>
        <button onClick={() => { setStudyMi(cur.mi); resetTutor(); setView("study"); }} style={btn("#122430", C.cyan, C.cyan)}>Study this topic</button>
        <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 12, color: C.dim }}>answered {answered} · {answered ? Math.round((correct / answered) * 100) : 0}% · mastered {masteredCount}/{ALL.length}</div>
      </div>

      <div style={panel}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.cyan }}>{DATA[cur.mi].c} · {DATA[cur.mi].n}</span>
          <span style={chip(BOX_COLOR[p.box])}>{BOX_NAME[p.box]}</span>
          {p.wrong > 0 && <span style={{ fontFamily: MONO, fontSize: 11, color: C.bad }}>missed {p.wrong}x</span>}
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, marginTop: 0 }}>{cur.q}</p>
        <div style={{ display: "grid", gap: 8 }}>
          {cur.a.map((opt, i) => {
            let bd = C.line, bg = C.well, fg = C.ink;
            if (picked !== null) { if (i === cur.c) { bd = C.ok; bg = "#12241a"; fg = C.ok; } else if (i === picked) { bd = C.bad; bg = "#2a1616"; fg = C.bad; } else fg = C.dim; }
            return <button key={i} onClick={() => answer(i)} style={{ textAlign: "left", padding: "11px 14px", borderRadius: 8, border: "1px solid " + bd, background: bg, color: fg, fontSize: 14, cursor: picked === null ? "pointer" : "default", transition: "all .15s" }}>{opt}</button>;
          })}
        </div>

        {picked !== null && (
          <div style={{ marginTop: 14 }}>
            {picked !== cur.c && <div style={{ fontFamily: MONO, fontSize: 12, color: C.bad, marginBottom: 6 }}>Wrong — reset to "new". This one comes back within the next few cards.</div>}
            <p style={{ fontSize: 13.5, color: "#b8c7d6", lineHeight: 1.6, margin: "0 0 12px", borderLeft: "3px solid " + (picked === cur.c ? C.ok : C.bad), paddingLeft: 10 }}>{cur.x}</p>

            {convo.length > 0 && (
              <div style={{ background: C.dark, border: "1px solid " + C.cyan, borderRadius: 8, padding: 14, marginBottom: 12 }}>
                {convo.map((mm, i) => (
                  <div key={i} style={{ marginBottom: i < convo.length - 1 ? 12 : 0 }}>
                    <div style={{ fontFamily: MONO, fontSize: 10.5, color: mm.role === "tutor" ? C.cyan : C.amber, marginBottom: 4 }}>{mm.role === "tutor" ? "TUTOR" : "YOU"}</div>
                    <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{mm.text}</p>
                  </div>
                ))}
              </div>
            )}
            {deepErr && <div style={{ fontFamily: MONO, fontSize: 12, color: C.bad, marginBottom: 10 }}>Tutor call failed — try again.</div>}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <button onClick={next} style={btn(C.amber, C.bg)}>Next</button>
              {convo.length === 0 && <button onClick={breakdown} disabled={deepLoading} style={btn(C.well, deepLoading ? C.dim : C.cyan, deepLoading ? C.line : C.cyan)}>{deepLoading ? "Thinking…" : (picked === cur.c ? "Break it down anyway" : "Break it down")}</button>}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input value={ask} onChange={e => setAsk(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendAsk(); }} placeholder="Ask your own question about this…" style={inp} />
              <button onClick={sendAsk} disabled={deepLoading || !ask.trim()} style={btn(ask.trim() && !deepLoading ? "#122430" : C.panel, ask.trim() && !deepLoading ? C.cyan : C.dim, C.line)}>{deepLoading ? "…" : "Ask"}</button>
            </div>
          </div>
        )}
      </div>
    </div></div>
  );
}
