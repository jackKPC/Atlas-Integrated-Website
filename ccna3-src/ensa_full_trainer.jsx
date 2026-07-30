import { useState, useEffect, useRef, useContext, createContext } from "react";
import DATA from "./data/ccna3-data.json";

// ══ HOLO palette — light, futuristic ══
const C = {
  bg: "#f6f4ff", well: "#f0edff", panel: "rgba(255,255,255,0.74)",
  line: "rgba(124,58,237,0.18)", ink: "#171029", dim: "#6c6580",
  amber: "#ff8a3d", cyan: "#06b6d4", ok: "#10b981", bad: "#ef4444", violet: "#7c3aed",
  magenta: "#ec4899", dark: "#0d0b1a",
};
const DISPLAY = "'Orbitron', sans-serif";
const HEAD = "'Rajdhani', sans-serif";
const BODY = "'Space Grotesk', 'Segoe UI', system-ui, sans-serif";
const MONO = "'Cascadia Code','Fira Code',Consolas,monospace";

const box = (extra) => Object.assign({ background: C.well, border: "1px solid " + C.line, borderRadius: 10, padding: 12 }, extra || {});
const chip = (col) => ({ fontFamily: HEAD, fontWeight: 700, fontSize: 11.5, padding: "3px 9px", borderRadius: 999, border: "1px solid " + col, color: col, display: "inline-block", letterSpacing: .3 });
const gradText = {
  fontFamily: DISPLAY, fontWeight: 900,
  background: "linear-gradient(90deg,#7c3aed,#06b6d4,#ec4899,#7c3aed)",
  backgroundSize: "300% 100%", WebkitBackgroundClip: "text", backgroundClip: "text",
  color: "transparent", animation: "gradient-flow 6s ease infinite",
};

// ══════════════════════════════════════════════════════════
//  GLOBAL STYLE — fonts already linked in ccna3.html; here we inject
//  keyframes, the qhtml content rules, and a couple of resets.
// ══════════════════════════════════════════════════════════
let globalStyleInjected = false;
function useGlobalStyle() {
  useEffect(() => {
    if (globalStyleInjected) return;
    globalStyleInjected = true;
    const style = document.createElement("style");
    style.textContent = `
      @keyframes gradient-flow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes spin-slow-rev { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
      @keyframes float-y { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
      @keyframes float-y-sm { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      @keyframes draw-path { to{stroke-dashoffset:0} }
      @keyframes pulse-op { 0%,100%{opacity:.35} 50%{opacity:.85} }
      @keyframes card-in { from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:translateY(0)} }
      @media (max-width: 760px) { .wire-deco { display:none !important; } }
      ::selection { background: rgba(124,58,237,.25); }
      .qhtml img { max-width: 100%; height: auto; display: block; margin: 12px 0; border-radius: 12px; border: 1px solid ${C.line}; box-shadow: 0 10px 30px -14px rgba(76,29,149,.35); }
      .qhtml p { margin: 0 0 10px; }
      .qhtml p:last-child { margin-bottom: 0; }
      .qhtml code { font-family: ${MONO}; background: ${C.dark}; padding: 2px 7px; border-radius: 5px; font-size: 0.9em; color: #5ef2c0; }
      .qhtml strong { color: ${C.magenta}; }
      .qhtml ul, .qhtml ol { margin: 6px 0 10px; padding-left: 20px; }
    `;
    document.head.appendChild(style);
  }, []);
}
function Html({ html, style }) {
  if (!html) return null;
  return <div className="qhtml" style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}
function stripHtml(html) {
  return (html || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// ══════════════════════════════════════════════════════════
//  WIREFRAME DECORATIONS — pure ornament, no interaction.
// ══════════════════════════════════════════════════════════
function WireGlobe({ style, size = 190, color = C.violet, dur = 60 }) {
  return (
    <svg className="wire-deco" viewBox="0 0 200 200" width={size} height={size}
      style={{ position: "absolute", opacity: .16, pointerEvents: "none", animation: `spin-slow ${dur}s linear infinite`, ...style }}>
      <circle cx="100" cy="100" r="90" fill="none" stroke={color} strokeWidth="1" />
      <ellipse cx="100" cy="100" rx="90" ry="28" fill="none" stroke={color} strokeWidth="1" />
      <ellipse cx="100" cy="100" rx="90" ry="58" fill="none" stroke={color} strokeWidth="1" />
      <ellipse cx="100" cy="100" rx="28" ry="90" fill="none" stroke={color} strokeWidth="1" />
      <ellipse cx="100" cy="100" rx="58" ry="90" fill="none" stroke={color} strokeWidth="1" />
      <line x1="10" y1="100" x2="190" y2="100" stroke={color} strokeWidth="1" />
      <line x1="100" y1="10" x2="100" y2="190" stroke={color} strokeWidth="1" />
    </svg>
  );
}
function WireHex({ style, size = 140, color = C.cyan }) {
  return (
    <svg className="wire-deco" viewBox="0 0 140 140" width={size} height={size}
      style={{ position: "absolute", opacity: .16, pointerEvents: "none", animation: "float-y 8s ease-in-out infinite", ...style }}>
      <polygon points="70,4 132,38 132,102 70,136 8,102 8,38" fill="none" stroke={color} strokeWidth="1.4" />
      <polygon points="70,24 112,48 112,92 70,116 28,92 28,48" fill="none" stroke={color} strokeWidth="1" />
      <line x1="70" y1="4" x2="70" y2="136" stroke={color} strokeWidth=".7" />
      <line x1="8" y1="38" x2="132" y2="102" stroke={color} strokeWidth=".7" />
      <line x1="8" y1="102" x2="132" y2="38" stroke={color} strokeWidth=".7" />
    </svg>
  );
}
function WireOrbit({ style, size = 170, color = C.magenta }) {
  return (
    <svg className="wire-deco" viewBox="0 0 160 160" width={size} height={size}
      style={{ position: "absolute", opacity: .18, pointerEvents: "none", ...style }}>
      <circle cx="80" cy="80" r="70" fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 6" />
      <circle cx="80" cy="80" r="45" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2 5" />
      <circle cx="80" cy="80" r="3" fill={color} />
      <g style={{ transformOrigin: "80px 80px", animation: "spin-slow 16s linear infinite" }}><circle cx="150" cy="80" r="4" fill={color} /></g>
      <g style={{ transformOrigin: "80px 80px", animation: "spin-slow-rev 10s linear infinite" }}><circle cx="80" cy="35" r="3" fill={color} /></g>
    </svg>
  );
}
function WireCircuit({ style, w = 220, h = 120, color = C.violet }) {
  return (
    <svg className="wire-deco" viewBox={`0 0 ${w} ${h}`} width={w} height={h}
      style={{ position: "absolute", opacity: .16, pointerEvents: "none", ...style }}>
      <path d="M4 60 H50 V20 H110 V90 H160 V50 H216" fill="none" stroke={color} strokeWidth="1.4" strokeDasharray="6 6" strokeDashoffset="240" style={{ animation: "draw-path 4s linear infinite" }} />
      {[[50, 60], [110, 20], [110, 90], [160, 50]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" fill={color} style={{ animation: "pulse-op 2.4s ease-in-out infinite" }} />)}
    </svg>
  );
}
function BackgroundArt({ variant }) {
  if (variant === "home") {
    return (
      <>
        <WireGlobe style={{ top: -40, right: -50 }} size={220} />
        <WireHex style={{ top: 260, left: -40 }} size={120} color={C.cyan} />
        <WireOrbit style={{ bottom: 40, right: -30 }} size={160} color={C.magenta} />
        <WireCircuit style={{ bottom: -10, left: -20 }} w={220} h={110} color={C.violet} />
      </>
    );
  }
  if (variant === "study") {
    return (
      <>
        <WireHex style={{ top: 40, right: -40 }} size={110} color={C.violet} />
        <WireOrbit style={{ bottom: 100, left: -50 }} size={140} color={C.cyan} />
      </>
    );
  }
  return (
    <>
      <WireGlobe style={{ bottom: -60, right: -60 }} size={200} dur={80} color={C.cyan} />
      <WireHex style={{ top: 100, left: -40 }} size={100} color={C.magenta} />
    </>
  );
}

// ══════════════════════════════════════════════════════════
//  GLOW BUTTON — light-theme gradient/ghost button with hover lift
// ══════════════════════════════════════════════════════════
const VARIANT = {
  primary: { bg: "linear-gradient(135deg,#7c3aed,#ec4899)", fg: "#fff", glow: "124,58,237" },
  cyan: { bg: "linear-gradient(135deg,#06b6d4,#3b82f6)", fg: "#fff", glow: "6,182,212" },
  ghost: { bg: "#ffffff", fg: C.ink, glow: "124,58,237", border: C.line },
  danger: { bg: "linear-gradient(135deg,#ef4444,#f97316)", fg: "#fff", glow: "239,68,68" },
  dangerGhost: { bg: "#fff", fg: C.bad, glow: "239,68,68", border: "rgba(239,68,68,.4)" },
};
function GButton({ variant = "ghost", onClick, disabled, children, style, ...rest }) {
  const [hover, setHover] = useState(false);
  const v = VARIANT[variant] || VARIANT.ghost;
  return (
    <button
      onClick={onClick} disabled={disabled} {...rest}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        padding: "10px 20px", borderRadius: 999, fontWeight: 700, fontSize: 14.5, fontFamily: HEAD, letterSpacing: .4,
        background: v.bg, color: v.fg, border: v.border ? "1.5px solid " + v.border : "none",
        cursor: disabled ? "default" : "pointer", opacity: disabled ? .45 : 1,
        boxShadow: disabled ? "none" : `0 ${hover ? 10 : 5}px ${hover ? 26 : 14}px -8px rgba(${v.glow},${hover ? .55 : .3})`,
        transform: hover && !disabled ? "translateY(-2px)" : "translateY(0)",
        transition: "all .18s cubic-bezier(.2,.8,.2,1)",
        ...style,
      }}
    >{children}</button>
  );
}

// ══════════════════════════════════════════════════════════
//  CODE BLOCK — dark terminal inset for real CLI commands
// ══════════════════════════════════════════════════════════
function CodeBlock({ code }) {
  if (!code) return null;
  return (
    <pre style={{
      fontFamily: MONO, fontSize: 12.5, color: "#5ef2c0", background: C.dark,
      border: "1px solid rgba(139,92,246,.35)", borderRadius: 10, padding: "10px 14px",
      overflowX: "auto", whiteSpace: "pre", margin: 0, lineHeight: 1.5,
      boxShadow: "0 8px 22px -12px rgba(20,10,50,.5)",
    }}>{code}</pre>
  );
}

// ══════════════════════════════════════════════════════════
//  MATCH QUESTION — pointer-based drag-to-match
//  choices: string[] (may include unused distractors, e.g. "Not used")
//  rows: [{ prompt, answer }]  — answer is an index into choices
// ══════════════════════════════════════════════════════════
function shuffledIndices(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function MatchQuestion({ choices, rows, locked, onCheck }) {
  const [slots, setSlots] = useState(() => Array(rows.length).fill(null));
  const [pool, setPool] = useState(() => shuffledIndices(choices.length));
  const [dragging, setDragging] = useState(null); // { idx, x, y }
  const [checked, setChecked] = useState(null); // array of booleans, or null
  const containerRef = useRef(null);

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      const t = e.touches ? e.touches[0] : e;
      setDragging((d) => (d ? { ...d, x: t.clientX, y: t.clientY } : d));
    };
    const up = (e) => {
      const t = e.changedTouches ? e.changedTouches[0] : e;
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const target = el && el.closest("[data-dropzone]");
      setDragging((d) => {
        if (!d) return null;
        if (target) {
          const zone = target.getAttribute("data-dropzone");
          if (zone === "pool") {
            setSlots((s) => s.map((v) => (v === d.idx ? null : v)));
            setPool((p) => (p.includes(d.idx) ? p : p.concat([d.idx])));
          } else {
            const slotIndex = Number(zone);
            setSlots((s) => {
              const next = s.slice();
              const displaced = next[slotIndex];
              const fromSlot = next.indexOf(d.idx);
              if (fromSlot !== -1) next[fromSlot] = null;
              next[slotIndex] = d.idx;
              if (displaced !== null && displaced !== d.idx) {
                setPool((p) => p.filter((x) => x !== displaced).concat([displaced]));
              }
              return next;
            });
            setPool((p) => p.filter((x) => x !== d.idx));
          }
        }
        return null;
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [dragging]);

  const startDrag = (idx, e) => {
    if (locked || checked) return;
    const t = e.touches ? e.touches[0] : e;
    setDragging({ idx, x: t.clientX, y: t.clientY });
  };

  const check = () => {
    const results = slots.map((choiceIdx, rowIdx) => choiceIdx === rows[rowIdx].answer);
    setChecked(results);
    onCheck(results.every(Boolean));
  };

  const chipLabel = (idx) => choices[idx];
  const allFilled = slots.every((s) => s !== null);

  const chipStyle = (idx, placedInSlot) => {
    let bd = C.violet, bg = "#f5f3ff", fg = C.violet;
    if (checked) {
      const rowIdx = slots.indexOf(idx);
      const ok = rowIdx !== -1 && checked[rowIdx];
      bd = ok ? C.ok : C.bad;
      bg = ok ? "#ecfdf5" : "#fef2f2";
      fg = ok ? C.ok : C.bad;
    }
    return {
      fontSize: 12.5, fontFamily: BODY, fontWeight: 600, padding: "8px 12px", borderRadius: 8, border: "1.5px solid " + bd,
      background: bg, color: fg, cursor: locked || checked ? "default" : "grab",
      userSelect: "none", touchAction: "none", opacity: dragging && dragging.idx === idx ? 0.3 : 1,
      display: "inline-block", width: placedInSlot ? "100%" : "auto", boxSizing: "border-box",
      boxShadow: "0 2px 8px -4px rgba(76,29,149,.25)",
    };
  };

  return (
    <div ref={containerRef}>
      <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 13, fontFamily: BODY, color: C.ink, padding: "8px 10px", background: "#fff", borderRadius: 8, border: "1px solid " + C.line }}>{row.prompt}</div>
            <div
              data-dropzone={String(rowIdx)}
              style={{ minHeight: 38, border: "1.5px dashed " + (slots[rowIdx] === null ? C.line : "transparent"), borderRadius: 8, display: "flex", alignItems: "center", padding: slots[rowIdx] === null ? "0 10px" : 0 }}
            >
              {slots[rowIdx] === null ? (
                <span style={{ fontSize: 11.5, color: C.dim, fontFamily: HEAD, fontWeight: 600 }}>drop here</span>
              ) : (
                <div
                  onPointerDown={(e) => startDrag(slots[rowIdx], e)}
                  onTouchStart={(e) => startDrag(slots[rowIdx], e)}
                  style={chipStyle(slots[rowIdx], true)}
                >{chipLabel(slots[rowIdx])}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div data-dropzone="pool" style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 44, padding: 10, background: C.well, borderRadius: 10, border: "1px dashed " + C.line, marginBottom: 12 }}>
        {pool.length === 0 && <span style={{ fontSize: 11.5, color: C.dim, fontFamily: HEAD, fontWeight: 600 }}>(all placed — drag back here to undo)</span>}
        {pool.map((idx) => (
          <div key={idx} onPointerDown={(e) => startDrag(idx, e)} onTouchStart={(e) => startDrag(idx, e)} style={chipStyle(idx, false)}>
            {chipLabel(idx)}
          </div>
        ))}
      </div>

      {!checked && (
        <GButton data-testid="check-matches" variant={allFilled ? "primary" : "ghost"} onClick={check} disabled={!allFilled}>
          Check matches
        </GButton>
      )}

      {dragging && (
        <div style={{ position: "fixed", left: dragging.x - 40, top: dragging.y - 18, pointerEvents: "none", zIndex: 999, width: 120 }}>
          <div style={{ ...chipStyle(dragging.idx, false), textAlign: "center", boxShadow: "0 10px 26px -8px rgba(76,29,149,.5)" }}>{chipLabel(dragging.idx)}</div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  DATA — real question bank + real cheat-sheet study content,
//  sourced from the user's local CCNA-3-Final-Study-Guide app
//  (offline-questions.js + config.js + cheat-sheet.html), bucketed
//  into the 14 official ENSA v7 modules.
// ══════════════════════════════════════════════════════════
const ALL = [];
DATA.forEach((m, mi) => m.questions.forEach((q) => ALL.push(Object.assign({ mi }, q))));
const BOX_W = [8, 4, 2, 1];
const BOX_NAME = ["new", "learning", "review", "mastered"];
const BOX_COLOR = [C.dim, C.amber, C.cyan, C.ok];

function correctIndices(options) {
  const out = [];
  options.forEach((o, i) => { if (o.correct) out.push(i); });
  return out;
}
function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((x) => sb.has(x));
}

// ══════════════════════════════════════════════════════════
//  TOOLTIP ENGINE — ported verbatim from cheat-sheet.html:
//  every glossary term is hoverable everywhere it appears (term
//  chips, command rows, and inline mentions inside facts/descriptions),
//  showing a floating definition card. Hover to preview, click/tap or
//  focus to pin it open, Escape or an outside click to unpin.
// ══════════════════════════════════════════════════════════
const GLOSSARY = new Map();
DATA.forEach((m) => m.terms.forEach((t) => { if (!GLOSSARY.has(t.acronym)) GLOSSARY.set(t.acronym, t); }));
const TERM_REGEX = (() => {
  const keys = Array.from(GLOSSARY.keys()).sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return keys.length ? new RegExp("\\b(" + keys.join("|") + ")\\b", "g") : null;
})();

const TooltipCtx = createContext(null);

function useTooltip() {
  const [tip, setTip] = useState(null); // { head, body, mod }
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [pinnedKey, setPinnedKey] = useState(null);
  const tipRef = useRef(null);
  const anchorRect = useRef(null);

  useEffect(() => {
    if (!tip || !tipRef.current) return;
    const tw = tipRef.current.offsetWidth, th = tipRef.current.offsetHeight;
    const r = anchorRect.current;
    let left = r.left + r.width / 2 - tw / 2;
    let top = r.top - th - 10;
    if (top < 8) top = r.bottom + 10;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    setPos({ left, top });
  }, [tip]);

  useEffect(() => {
    if (!pinnedKey) return;
    const onDocClick = (e) => { if (tipRef.current && tipRef.current.contains(e.target)) return; setPinnedKey(null); setTip(null); };
    const onKey = (e) => { if (e.key === "Escape") { setPinnedKey(null); setTip(null); } };
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onDocClick, true); document.removeEventListener("keydown", onKey); };
  }, [pinnedKey]);

  const show = (e, content) => { if (pinnedKey) return; anchorRect.current = e.currentTarget.getBoundingClientRect(); setTip(content); };
  const hide = () => { if (pinnedKey) return; setTip(null); };
  const triggerProps = (key, content) => ({
    tabIndex: 0,
    onMouseEnter: (e) => show(e, content),
    onMouseLeave: hide,
    onFocus: (e) => show(e, content),
    onBlur: hide,
    onClick: (e) => {
      e.stopPropagation();
      if (pinnedKey === key) { setPinnedKey(null); setTip(null); return; }
      anchorRect.current = e.currentTarget.getBoundingClientRect();
      setPinnedKey(key); setTip(content);
    },
  });

  return { tip, pos, pinnedKey, tipRef, triggerProps };
}

function linkTermsNodes(text, skipAcr) {
  if (!TERM_REGEX || !text) return [text];
  const out = [];
  let last = 0, m;
  TERM_REGEX.lastIndex = 0;
  while ((m = TERM_REGEX.exec(text))) {
    if (skipAcr && m[0] === skipAcr) continue;
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<TermLink key={m.index + "-" + m[0]} acr={m[0]} />);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const termLinkStyle = { borderBottom: "1.5px dotted " + C.violet, cursor: "help", fontWeight: 700 };

function TermLink({ acr }) {
  const t = GLOSSARY.get(acr);
  const tt = useContext(TooltipCtx);
  if (!t || !tt) return acr;
  const key = "term:" + acr + ":" + t.module;
  const content = { head: t.acronym + " — " + t.full, body: t.description, mod: "M" + t.module };
  const pinned = tt.pinnedKey === key;
  return (
    <span style={{ ...termLinkStyle, background: pinned ? "rgba(124,58,237,.16)" : "transparent", borderRadius: 3 }} {...tt.triggerProps(key, content)}>{acr}</span>
  );
}

function TooltipHost() {
  const tt = useContext(TooltipCtx);
  if (!tt || !tt.tip) return null;
  return (
    <div
      ref={tt.tipRef}
      data-testid="tooltip"
      style={{
        position: "fixed", left: tt.pos.left, top: tt.pos.top, maxWidth: 340,
        background: "linear-gradient(160deg,#1c1533,#0d0b1a)", color: "#f0eaff", padding: "12px 14px", borderRadius: 12,
        fontSize: 12.5, fontFamily: BODY, lineHeight: 1.5, boxShadow: "0 20px 50px -14px rgba(76,29,149,.55), 0 0 0 1px rgba(139,92,246,.4)",
        zIndex: 1000, pointerEvents: tt.pinnedKey ? "auto" : "none",
      }}
    >
      <div style={{ fontFamily: MONO, fontWeight: 700, marginBottom: 4, fontSize: 12, color: "#5ef2c0" }}>
        {tt.tip.head}
        {tt.tip.mod && <span style={{ float: "right", opacity: .7, fontWeight: 400, color: C.cyan }}>{tt.tip.mod}</span>}
      </div>
      <div>{linkTermsNodes(tt.tip.body)}</div>
    </div>
  );
}

function TermChip({ t }) {
  const tt = useContext(TooltipCtx);
  const key = "termchip:" + t.acronym + ":" + t.module;
  const content = { head: t.acronym + " — " + t.full, body: t.description, mod: "M" + t.module };
  const pinned = tt.pinnedKey === key;
  return (
    <div
      {...tt.triggerProps(key, content)}
      style={{
        display: "flex", flexDirection: "column", gap: 2, padding: "9px 12px", borderRadius: 10, cursor: "help",
        background: pinned ? "rgba(124,58,237,.10)" : "#fff", border: "1.5px solid " + (pinned ? C.violet : C.line), minWidth: 150,
        boxShadow: pinned ? "0 6px 18px -8px rgba(124,58,237,.5)" : "0 2px 8px -5px rgba(76,29,149,.2)",
        transition: "all .15s",
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: 12, color: C.violet, fontWeight: 700 }}>{t.acronym}</span>
      <span style={{ fontSize: 12, fontFamily: BODY, color: C.ink }}>{t.full}</span>
    </div>
  );
}

function CmdRow({ cmd }) {
  const tt = useContext(TooltipCtx);
  const key = "cmd:" + cmd.command + ":" + cmd.module;
  const content = { head: cmd.command, body: cmd.description, mod: "M" + cmd.module };
  const pinned = tt.pinnedKey === key;
  return (
    <div
      {...tt.triggerProps(key, content)}
      style={{
        display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", cursor: "help",
        padding: "6px 8px", borderRadius: 10, background: pinned ? "rgba(6,182,212,.10)" : "transparent",
        border: "1.5px solid " + (pinned ? C.cyan : "transparent"), transition: "all .15s",
      }}
    >
      <CodeBlock code={cmd.command} />
      {cmd.mode && <span style={chip(C.violet)}>{cmd.mode}</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ENGINE + APP
// ══════════════════════════════════════════════════════════
export default function ENSATrainer() {
  useGlobalStyle();
  const tt = useTooltip();
  const [view, setView] = useState("home");
  const [scope, setScope] = useState("all");
  const [studyMi, setStudyMi] = useState(0);
  const [prog, setProg] = useState({});
  const [inject, setInject] = useState([]);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [cur, setCur] = useState(null);
  const [picked, setPicked] = useState([]); // array of chosen option indices
  const [mcLocked, setMcLocked] = useState(false);
  const [matchDone, setMatchDone] = useState(null);
  const [deep, setDeep] = useState(null);
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepErr, setDeepErr] = useState(false);
  const [ask, setAsk] = useState("");
  const [convo, setConvo] = useState([]);

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

  const startDrill = (sc) => { const nxt = pickNext(sc, inject, null, answered); if (!nxt) return; setScope(sc); setCur(nxt.q); setPicked([]); setMcLocked(false); setMatchDone(null); resetTutor(); setView("drill"); };

  const recordResult = (key, isRight) => {
    const p = getP(key), np = Object.assign({}, prog);
    if (isRight) { np[key] = { box: Math.min(3, p.box + 1), wrong: p.wrong, seen: p.seen + 1 }; setCorrect(c => c + 1); setInject(inj => inj.filter(j => j.key !== key)); }
    else { np[key] = { box: 0, wrong: p.wrong + 1, seen: p.seen + 1 }; setInject(inj => inj.filter(j => j.key !== key).concat([{ key, due: answered + 4 }])); }
    setProg(np); setAnswered(a => a + 1);
  };

  const chooseSingle = (i) => {
    if (mcLocked) return;
    setPicked([i]);
    setMcLocked(true);
    recordResult(cur.key, !!cur.options[i].correct);
  };
  const toggleMulti = (i) => {
    if (mcLocked) return;
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.concat([i])));
  };
  const submitMulti = () => {
    if (mcLocked || !picked.length) return;
    setMcLocked(true);
    recordResult(cur.key, sameSet(picked, correctIndices(cur.options)));
  };

  const answerMatch = (isRight) => {
    if (matchDone !== null) return;
    setMatchDone(isRight);
    recordResult(cur.key, isRight);
  };

  const next = () => {
    resetTutor();
    const nxt = pickNext(scope, inject, cur.key, answered);
    if (!nxt) { setView("home"); return; }
    if (nxt.injIdx >= 0) setInject(inject.filter((_, idx) => idx !== nxt.injIdx));
    setCur(nxt.q); setPicked([]); setMcLocked(false); setMatchDone(null);
  };

  const callLLM = async (userMsg, isFirstBreakdown) => {
    let qDesc;
    if (cur.kind === "matching") {
      qDesc = "a matching exercise: " + stripHtml(cur.questionHtml) + " — " + cur.rows.map(r => r.prompt + " -> " + cur.choices[r.answer]).join("; ");
    } else {
      const correctText = correctIndices(cur.options).map(i => stripHtml(cur.options[i].html)).join(" / ");
      const wrongPicks = mcLocked ? picked.filter(i => !cur.options[i].correct).map(i => stripHtml(cur.options[i].html)) : [];
      qDesc = "\"" + stripHtml(cur.questionHtml) + "\" Options: " + cur.options.map(o => stripHtml(o.html)).join(" | ") + ". Correct answer: \"" + correctText + "\".";
      if (wrongPicks.length) qDesc += " The student had chosen the wrong option(s): \"" + wrongPicks.join(", ") + "\".";
    }
    const ctx = "You are a patient CCNA3 ENSA (Enterprise Networking, Security, and Automation) tutor. The student has already mastered CCNA1 and CCNA2 fundamentals. Focus your teaching on the ENSA-level concept this question tests. Current practice item: " + qDesc +
      " Answer in plain, easy English, under 180 words, no markdown or bullet symbols. Use short sentences and a tiny concrete example when it helps.";
    const messages = [];
    if (isFirstBreakdown) {
      messages.push({ role: "user", content: ctx + " Teach the underlying concept from the ground up so the correct answer becomes obvious." });
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
    if (deepLoading || !cur) return;
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

  const mastery = (mi) => { let s = 0; DATA[mi].questions.forEach((q) => s += getP(q.key).box); return Math.round((s / (3 * DATA[mi].questions.length)) * 100); };
  const masteredCount = ALL.filter(q => getP(q.key).box === 3).length;
  const weakCount = ALL.filter(q => { const p = getP(q.key); return p.wrong > 0 && p.box < 3; }).length;

  const page = {
    minHeight: "100vh", position: "relative", overflow: "hidden",
    background: "radial-gradient(circle at 12% 15%, rgba(139,92,246,.12), transparent 42%), radial-gradient(circle at 88% 12%, rgba(6,182,212,.12), transparent 40%), radial-gradient(circle at 50% 95%, rgba(236,72,153,.10), transparent 45%), " + C.bg,
    color: C.ink, fontFamily: BODY, padding: "24px 16px 64px",
  };
  const wrap = { maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 };
  const panel = {
    background: C.panel, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
    border: "1px solid " + C.line, borderRadius: 18, padding: 20, marginBottom: 18,
    boxShadow: "0 10px 34px -16px rgba(76,29,149,.22)", animation: "card-in .45s cubic-bezier(.2,.8,.2,1)",
  };
  const secLabel = (col) => ({ fontFamily: HEAD, fontWeight: 700, fontSize: 13, letterSpacing: 1.8, textTransform: "uppercase", color: col, marginBottom: 10 });

  if (view === "home") {
    return (
      <div style={page}>
        <BackgroundArt variant="home" />
        <div style={wrap}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: C.dim }}>CCNA 3 · ENSA v7.0 · all 14 modules · {ALL.length} drill items</div>
        <h1 style={{ fontSize: 40, margin: "8px 0 4px", lineHeight: 1.05, ...gradText }}>ENSA<br />ADAPTIVE TRAINER</h1>
        <p style={{ color: C.dim, fontSize: 14.5, marginTop: 4, lineHeight: 1.6, maxWidth: 620 }}>Real exam-bank questions with real Cisco IOS commands and exhibits, organized into the 14 official ENSA modules. Some questions are drag-to-match. Ask the tutor anything after you answer.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "16px 0 22px" }}>
          <GButton variant="primary" onClick={() => startDrill("all")}>⚡ Drill everything</GButton>
          <GButton variant={weakCount ? "dangerGhost" : "ghost"} onClick={() => { if (weakCount) startDrill("weak"); }} disabled={!weakCount}>Weak spots ({weakCount})</GButton>
          <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 12, color: C.dim, alignSelf: "center" }}>answered {answered} · {answered ? Math.round((correct / answered) * 100) : 0}% · mastered {masteredCount}/{ALL.length}</div>
        </div>
        {DATA.map((m, mi) => {
          const pct = mastery(mi);
          return (
            <div key={mi} style={{ background: C.panel, backdropFilter: "blur(10px)", border: "1px solid " + C.line, borderRadius: 14, padding: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 6px 20px -14px rgba(76,29,149,.25)" }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 12, color: C.violet, minWidth: 74 }}>MOD {String(m.num).padStart(2, "0")}</div>
              <div style={{ fontWeight: 700, fontFamily: HEAD, fontSize: 16, flex: 1, minWidth: 200 }}>{m.title} <span style={{ color: C.dim, fontWeight: 500, fontSize: 12.5, fontFamily: BODY }}>· {m.questions.length} q</span></div>
              <div style={{ width: 110, height: 8, background: C.well, borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: pct + "%", height: "100%", borderRadius: 999, background: pct === 100 ? "linear-gradient(90deg,#10b981,#06b6d4)" : "linear-gradient(90deg,#7c3aed,#ec4899,#06b6d4)", backgroundSize: "200% 100%", animation: pct > 0 ? "gradient-flow 3s ease infinite" : "none", transition: "width .4s cubic-bezier(.2,.8,.2,1)" }} />
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: pct === 100 ? C.ok : C.dim, width: 36 }}>{pct}%</div>
              <GButton variant="cyan" onClick={() => { setStudyMi(mi); resetTutor(); setView("study"); }}>Study</GButton>
              <GButton variant="primary" onClick={() => startDrill(mi)}>Drill</GButton>
            </div>
          );
        })}
        <p style={{ color: C.dim, fontSize: 12, marginTop: 14 }}>Progress is session-only (resets on reload).</p>
        </div>
      </div>
    );
  }

  if (view === "study") {
    const m = DATA[studyMi];
    return (
      <TooltipCtx.Provider value={tt}>
      <div style={page}>
        <BackgroundArt variant="study" />
        <div style={wrap}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <GButton variant="ghost" onClick={() => setView("home")}>← Modules</GButton>
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.violet }}>MOD {m.num}</div>
          <div style={{ fontWeight: 800, fontFamily: HEAD, fontSize: 22 }}>{m.title}</div>
          <div style={{ marginLeft: "auto" }}><GButton variant="primary" onClick={() => startDrill(studyMi)}>Drill this module →</GButton></div>
        </div>

        <div style={panel}>
          <div style={secLabel(C.amber)}>Overview</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: C.ink, margin: 0 }}>{m.summary}</p>
        </div>

        {m.commands.length > 0 && (
          <div style={panel}>
            <div style={secLabel(C.cyan)}>Commands — cheat sheet <span style={{ textTransform: "none", color: C.dim, fontWeight: 500, letterSpacing: 0 }}>(hover for details)</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {m.commands.map((cmd, i) => <CmdRow key={i} cmd={cmd} />)}
            </div>
          </div>
        )}

        {m.terms.length > 0 && (
          <div style={panel}>
            <div style={secLabel(C.violet)}>Terms — glossary <span style={{ textTransform: "none", color: C.dim, fontWeight: 500, letterSpacing: 0 }}>(hover for details)</span></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {m.terms.map((t, i) => <TermChip key={i} t={t} />)}
            </div>
          </div>
        )}

        <div style={panel}>
          <div style={secLabel(C.ok)}>Facts — quick reference</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {m.facts.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
                <span style={{ color: C.ok, fontSize: 13, flexShrink: 0 }}>▸</span>
                <span style={{ fontSize: 13, lineHeight: 1.55, color: "#3a3550" }}>{linkTermsNodes(f)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 8 }}>
          <GButton variant="primary" onClick={() => startDrill(studyMi)}>Drill this module →</GButton>
        </div>
        </div>
      </div>
      <TooltipHost />
      </TooltipCtx.Provider>
    );
  }

  // ── DRILL ──
  const p = getP(cur.key);
  const scopeName = scope === "all" ? "Full course" : scope === "weak" ? "Weak spots" : DATA[scope].title;
  const inp = { flex: 1, background: "#fff", border: "1.5px solid " + C.line, borderRadius: 10, padding: "10px 13px", color: C.ink, fontSize: 13, fontFamily: BODY, outline: "none" };
  const isMatching = cur.kind === "matching";
  const isMulti = !isMatching && cur.type === "multiple";
  const isDone = isMatching ? matchDone !== null : mcLocked;
  const wasRight = isMatching ? !!matchDone : isMulti ? sameSet(picked, correctIndices(cur.options)) : picked.length === 1 && !!cur.options[picked[0]].correct;

  return (
    <div style={page}>
      <BackgroundArt variant="drill" />
      <div style={wrap}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <GButton variant="ghost" onClick={() => setView("home")}>← Modules</GButton>
        <div style={{ fontWeight: 700, fontFamily: HEAD, fontSize: 16 }}>{scopeName}</div>
        <GButton variant="cyan" onClick={() => { setStudyMi(cur.mi); resetTutor(); setView("study"); }}>Study this topic</GButton>
        <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 12, color: C.dim }}>answered {answered} · {answered ? Math.round((correct / answered) * 100) : 0}% · mastered {masteredCount}/{ALL.length}</div>
      </div>

      <div style={panel} key={cur.key}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.violet }}>MOD {DATA[cur.mi].num} · {DATA[cur.mi].title}</span>
          <span style={chip(BOX_COLOR[p.box])}>{BOX_NAME[p.box]}</span>
          {p.wrong > 0 && <span style={{ fontFamily: MONO, fontSize: 11, color: C.bad }}>missed {p.wrong}x</span>}
          {isMatching && <span style={chip(C.violet)}>drag to match</span>}
          {isMulti && <span style={chip(C.amber)}>select all correct</span>}
        </div>
        <Html html={cur.questionHtml} style={{ fontSize: 16.5, fontFamily: HEAD, fontWeight: 600, lineHeight: 1.5, marginBottom: 12, color: C.ink }} />

        {isMatching ? (
          <MatchQuestion choices={cur.choices} rows={cur.rows} locked={matchDone !== null} onCheck={answerMatch} />
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {cur.options.map((opt, i) => {
              let bd = C.line, bg = "#fff", fg = C.ink;
              const selected = picked.includes(i);
              if (mcLocked) {
                if (opt.correct) { bd = C.ok; bg = "#ecfdf5"; fg = "#047857"; }
                else if (selected) { bd = C.bad; bg = "#fef2f2"; fg = "#b91c1c"; }
                else fg = C.dim;
              } else if (isMulti && selected) {
                bd = C.violet; bg = "#f5f3ff"; fg = C.violet;
              }
              return (
                <button
                  key={i}
                  data-testid="mc-option"
                  onClick={() => (isMulti ? toggleMulti(i) : chooseSingle(i))}
                  style={{ textAlign: "left", padding: "12px 15px", borderRadius: 12, border: "1.5px solid " + bd, background: bg, color: fg, fontSize: 14, fontFamily: BODY, cursor: mcLocked ? "default" : "pointer", transition: "all .15s", display: "flex", gap: 10, alignItems: "flex-start", boxShadow: "0 2px 10px -8px rgba(76,29,149,.3)" }}
                >
                  {isMulti && <span style={{ fontFamily: MONO, fontSize: 13, flexShrink: 0, marginTop: 2 }}>{selected ? "☑" : "☐"}</span>}
                  <Html html={opt.html} style={{ flex: 1 }} />
                </button>
              );
            })}
            {isMulti && !mcLocked && (
              <GButton data-testid="submit-multi" variant={picked.length ? "primary" : "ghost"} onClick={submitMulti} disabled={!picked.length}>
                Submit answer
              </GButton>
            )}
          </div>
        )}

        {isDone && (
          <div style={{ marginTop: 16 }}>
            {!wasRight && <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 12.5, color: C.bad, marginBottom: 8, letterSpacing: .3 }}>✗ WRONG — reset to "new". This one comes back within the next few cards.</div>}
            <div style={{ fontSize: 13.5, color: "#3a3550", lineHeight: 1.6, margin: "0 0 12px", background: wasRight ? "rgba(16,185,129,.06)" : "rgba(239,68,68,.06)", borderLeft: "3px solid " + (wasRight ? C.ok : C.bad), borderRadius: 8, padding: "10px 12px" }}>
              <Html html={cur.explanationHtml} />
            </div>

            {convo.length > 0 && (
              <div style={{ background: "linear-gradient(160deg,#1c1533,#0d0b1a)", border: "1px solid rgba(139,92,246,.4)", borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: "0 14px 34px -18px rgba(76,29,149,.5)" }}>
                {convo.map((mm, i) => (
                  <div key={i} style={{ marginBottom: i < convo.length - 1 ? 12 : 0 }}>
                    <div style={{ fontFamily: MONO, fontSize: 10.5, color: mm.role === "tutor" ? "#5ef2c0" : C.amber, marginBottom: 4, fontWeight: 700, letterSpacing: .5 }}>{mm.role === "tutor" ? "TUTOR" : "YOU"}</div>
                    <p style={{ fontSize: 13.5, color: "#f0eaff", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", fontFamily: BODY }}>{mm.text}</p>
                  </div>
                ))}
              </div>
            )}
            {deepErr && <div style={{ fontFamily: MONO, fontSize: 12, color: C.bad, marginBottom: 10 }}>Tutor call failed — try again.</div>}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <GButton data-testid="next" variant="primary" onClick={next}>Next →</GButton>
              {convo.length === 0 && <GButton variant="cyan" onClick={breakdown} disabled={deepLoading}>{deepLoading ? "Thinking…" : "✨ Break it down"}</GButton>}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input value={ask} onChange={e => setAsk(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendAsk(); }} placeholder="Ask your own question about this…" style={inp} />
              <GButton variant={ask.trim() && !deepLoading ? "cyan" : "ghost"} onClick={sendAsk} disabled={deepLoading || !ask.trim()}>{deepLoading ? "…" : "Ask"}</GButton>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
