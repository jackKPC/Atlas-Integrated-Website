import { useState, useEffect, useRef } from "react";
import DATA from "./data/ccna3-data.json";

// ══ console palette (matches the CCNA2/SRWE trainer) ══
const C = {
  bg: "#10151c", panel: "#1a222d", line: "#2b3a4a", ink: "#dce6f0",
  dim: "#8296ab", amber: "#f5a623", cyan: "#5fd7ff", ok: "#3ddc84", bad: "#ff5c5c",
  well: "#131a23", dark: "#0b1016", violet: "#b98cff",
};
const MONO = "'Cascadia Code','Fira Code',Consolas,monospace";
const box = (extra) => Object.assign({ background: C.well, border: "1px solid " + C.line, borderRadius: 8, padding: 12 }, extra || {});
const chip = (col) => ({ fontFamily: MONO, fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid " + col, color: col, display: "inline-block" });
const btnS = (bg, fg, bd) => ({ padding: "8px 16px", borderRadius: 8, border: "1px solid " + (bd || bg), background: bg, color: fg, fontWeight: 700, cursor: "pointer", fontSize: 13 });

// ══════════════════════════════════════════════════════════
//  QUESTION HTML — renders the real questionHtml/explanationHtml/
//  option HTML strings from the source question bank, which contain
//  <strong>, <code>, <br>, and real exhibit <img> tags.
// ══════════════════════════════════════════════════════════
let qhtmlStyleInjected = false;
function useQhtmlStyle() {
  useEffect(() => {
    if (qhtmlStyleInjected) return;
    qhtmlStyleInjected = true;
    const style = document.createElement("style");
    style.textContent = `
      .qhtml img { max-width: 100%; height: auto; display: block; margin: 10px 0; border-radius: 8px; border: 1px solid ${C.line}; }
      .qhtml p { margin: 0 0 10px; }
      .qhtml p:last-child { margin-bottom: 0; }
      .qhtml code { font-family: ${MONO}; background: ${C.dark}; padding: 2px 6px; border-radius: 4px; font-size: 0.92em; color: ${C.cyan}; }
      .qhtml strong { color: ${C.amber}; }
      .qhtml ul, .qhtml ol { margin: 6px 0 10px; padding-left: 20px; }
      .qhtml br { content: ""; display: block; margin: 4px 0; }
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
//  CODE BLOCK — CLI command / output snippet
// ══════════════════════════════════════════════════════════
function CodeBlock({ code }) {
  if (!code) return null;
  return (
    <pre style={{
      fontFamily: MONO, fontSize: 12.5, color: C.ok, background: C.dark,
      border: "1px solid " + C.line, borderRadius: 8, padding: "8px 12px",
      overflowX: "auto", whiteSpace: "pre", margin: 0, lineHeight: 1.5,
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
    let bd = C.cyan, bg = "#122430", fg = C.cyan;
    if (checked) {
      const rowIdx = slots.indexOf(idx);
      const ok = rowIdx !== -1 && checked[rowIdx];
      bd = ok ? C.ok : C.bad;
      bg = ok ? "#12241a" : "#2a1616";
      fg = ok ? C.ok : C.bad;
    }
    return {
      fontSize: 12.5, padding: "8px 12px", borderRadius: 6, border: "1px solid " + bd,
      background: bg, color: fg, cursor: locked || checked ? "default" : "grab",
      userSelect: "none", touchAction: "none", opacity: dragging && dragging.idx === idx ? 0.3 : 1,
      display: "inline-block", width: placedInSlot ? "100%" : "auto", boxSizing: "border-box",
    };
  };

  return (
    <div ref={containerRef}>
      <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 13, color: C.ink, padding: "8px 10px", background: C.well, borderRadius: 6, border: "1px solid " + C.line }}>{row.prompt}</div>
            <div
              data-dropzone={String(rowIdx)}
              style={{ minHeight: 38, border: "1.5px dashed " + (slots[rowIdx] === null ? C.line : "transparent"), borderRadius: 6, display: "flex", alignItems: "center", padding: slots[rowIdx] === null ? "0 10px" : 0 }}
            >
              {slots[rowIdx] === null ? (
                <span style={{ fontSize: 11.5, color: C.dim, fontFamily: MONO }}>drop here</span>
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

      <div data-dropzone="pool" style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 44, padding: 10, background: C.dark, borderRadius: 8, border: "1px dashed " + C.line, marginBottom: 12 }}>
        {pool.length === 0 && <span style={{ fontSize: 11.5, color: C.dim, fontFamily: MONO }}>(all placed — drag back here to undo)</span>}
        {pool.map((idx) => (
          <div key={idx} onPointerDown={(e) => startDrag(idx, e)} onTouchStart={(e) => startDrag(idx, e)} style={chipStyle(idx, false)}>
            {chipLabel(idx)}
          </div>
        ))}
      </div>

      {!checked && (
        <button data-testid="check-matches" onClick={check} disabled={!allFilled} style={btnS(allFilled ? C.amber : C.panel, allFilled ? C.bg : C.dim, allFilled ? C.amber : C.line)}>
          Check matches
        </button>
      )}

      {dragging && (
        <div style={{ position: "fixed", left: dragging.x - 40, top: dragging.y - 18, pointerEvents: "none", zIndex: 999, width: 120 }}>
          <div style={{ ...chipStyle(dragging.idx, false), textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,.5)" }}>{chipLabel(dragging.idx)}</div>
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
//  ENGINE + APP
// ══════════════════════════════════════════════════════════
export default function ENSATrainer() {
  useQhtmlStyle();
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

  const page = { minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "24px 16px 64px" };
  const wrap = { maxWidth: 900, margin: "0 auto" };
  const panel = { background: C.panel, border: "1px solid " + C.line, borderRadius: 10, padding: 18, marginBottom: 16 };
  const btn = (bg, fg, bd) => ({ padding: "9px 18px", borderRadius: 8, border: "1px solid " + (bd || bg), background: bg, color: fg, fontWeight: 700, cursor: "pointer", fontSize: 14 });
  const secLabel = (col) => ({ fontFamily: MONO, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: col, marginBottom: 8 });

  if (view === "home") {
    return (
      <div style={page}><div style={wrap}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: C.dim }}>CCNA 3 · ENSA v7.0 · all 14 modules · {ALL.length} drill items</div>
        <h1 style={{ fontSize: 30, margin: "6px 0 2px", fontWeight: 800 }}>ENSA <span style={{ color: C.amber }}>Adaptive Trainer</span></h1>
        <p style={{ color: C.dim, fontSize: 14, marginTop: 4, lineHeight: 1.6 }}>Real exam-bank questions with real Cisco IOS commands and exhibits, organized into the 14 official ENSA modules. Some questions are drag-to-match. Ask the tutor anything after you answer.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "14px 0 20px" }}>
          <button onClick={() => startDrill("all")} style={btn(C.amber, C.bg)}>Drill everything</button>
          <button onClick={() => { if (weakCount) startDrill("weak"); }} style={btn(weakCount ? "#2a1616" : C.panel, weakCount ? C.bad : C.dim, weakCount ? C.bad : C.line)}>Weak spots ({weakCount})</button>
          <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 12, color: C.dim, alignSelf: "center" }}>answered {answered} · {answered ? Math.round((correct / answered) * 100) : 0}% · mastered {masteredCount}/{ALL.length}</div>
        </div>
        {DATA.map((m, mi) => {
          const pct = mastery(mi);
          return (
            <div key={mi} style={{ background: C.panel, border: "1px solid " + C.line, borderRadius: 10, padding: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.cyan, minWidth: 74 }}>Module {m.num}</div>
              <div style={{ fontWeight: 700, flex: 1, minWidth: 200 }}>{m.title} <span style={{ color: C.dim, fontWeight: 400, fontSize: 12 }}>· {m.questions.length} q</span></div>
              <div style={{ width: 110, height: 6, background: C.well, borderRadius: 3, overflow: "hidden" }}><div style={{ width: pct + "%", height: "100%", background: pct === 100 ? C.ok : C.amber, transition: "width .3s" }} /></div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: pct === 100 ? C.ok : C.dim, width: 36 }}>{pct}%</div>
              <button onClick={() => { setStudyMi(mi); resetTutor(); setView("study"); }} style={btn("#122430", C.cyan, C.cyan)}>Study</button>
              <button onClick={() => startDrill(mi)} style={btn("#2a2416", C.amber, C.amber)}>Drill</button>
            </div>
          );
        })}
        <p style={{ color: C.dim, fontSize: 12, marginTop: 14 }}>Progress is session-only (resets on reload).</p>
      </div></div>
    );
  }

  if (view === "study") {
    const m = DATA[studyMi];
    return (
      <div style={page}><div style={wrap}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <button onClick={() => setView("home")} style={btn(C.well, C.dim, C.line)}>← Modules</button>
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.cyan }}>Module {m.num}</div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{m.title}</div>
          <button onClick={() => startDrill(studyMi)} style={Object.assign(btn(C.amber, C.bg), { marginLeft: "auto" })}>Drill this module →</button>
        </div>

        <div style={panel}>
          <div style={secLabel(C.amber)}>Overview</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: C.ink, margin: 0 }}>{m.summary}</p>
        </div>

        {m.commands.length > 0 && (
          <div style={panel}>
            <div style={secLabel(C.cyan)}>Commands — cheat sheet</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {m.commands.map((cmd, i) => (
                <div key={i}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                    <CodeBlock code={cmd.command} />
                    {cmd.mode && <span style={chip(C.violet)}>{cmd.mode}</span>}
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.55, color: "#c3d0dd", margin: "2px 0 0" }}>{cmd.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {m.terms.length > 0 && (
          <div style={panel}>
            <div style={secLabel(C.violet)}>Terms — glossary</div>
            <div style={{ display: "grid", gap: 10 }}>
              {m.terms.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12.5, color: C.violet, flexShrink: 0, minWidth: 64, fontWeight: 700 }}>{t.acronym}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.55, color: "#c3d0dd" }}><strong style={{ color: C.ink }}>{t.full}</strong> — {t.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={panel}>
          <div style={secLabel(C.ok)}>Facts — quick reference</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {m.facts.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
                <span style={{ color: C.ok, fontSize: 12, flexShrink: 0 }}>▸</span>
                <span style={{ fontSize: 13, lineHeight: 1.55, color: "#c3d0dd" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 8 }}>
          <button onClick={() => startDrill(studyMi)} style={btn(C.amber, C.bg)}>Drill this module →</button>
        </div>
      </div></div>
    );
  }

  // ── DRILL ──
  const p = getP(cur.key);
  const scopeName = scope === "all" ? "Full course" : scope === "weak" ? "Weak spots" : DATA[scope].title;
  const inp = { flex: 1, background: C.dark, border: "1px solid " + C.line, borderRadius: 8, padding: "9px 12px", color: C.ink, fontSize: 13, fontFamily: "inherit", outline: "none" };
  const isMatching = cur.kind === "matching";
  const isMulti = !isMatching && cur.type === "multiple";
  const isDone = isMatching ? matchDone !== null : mcLocked;
  const wasRight = isMatching ? !!matchDone : isMulti ? sameSet(picked, correctIndices(cur.options)) : picked.length === 1 && !!cur.options[picked[0]].correct;

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
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.cyan }}>Module {DATA[cur.mi].num} · {DATA[cur.mi].title}</span>
          <span style={chip(BOX_COLOR[p.box])}>{BOX_NAME[p.box]}</span>
          {p.wrong > 0 && <span style={{ fontFamily: MONO, fontSize: 11, color: C.bad }}>missed {p.wrong}x</span>}
          {isMatching && <span style={chip(C.violet)}>drag to match</span>}
          {isMulti && <span style={chip(C.amber)}>select all correct</span>}
        </div>
        <Html html={cur.questionHtml} style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, marginBottom: 12 }} />

        {isMatching ? (
          <MatchQuestion choices={cur.choices} rows={cur.rows} locked={matchDone !== null} onCheck={answerMatch} />
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {cur.options.map((opt, i) => {
              let bd = C.line, bg = C.well, fg = C.ink;
              const selected = picked.includes(i);
              if (mcLocked) {
                if (opt.correct) { bd = C.ok; bg = "#12241a"; fg = C.ok; }
                else if (selected) { bd = C.bad; bg = "#2a1616"; fg = C.bad; }
                else fg = C.dim;
              } else if (isMulti && selected) {
                bd = C.cyan; bg = "#122430"; fg = C.cyan;
              }
              return (
                <button
                  key={i}
                  data-testid="mc-option"
                  onClick={() => (isMulti ? toggleMulti(i) : chooseSingle(i))}
                  style={{ textAlign: "left", padding: "11px 14px", borderRadius: 8, border: "1px solid " + bd, background: bg, color: fg, fontSize: 14, cursor: mcLocked ? "default" : "pointer", transition: "all .15s", display: "flex", gap: 10, alignItems: "flex-start" }}
                >
                  {isMulti && <span style={{ fontFamily: MONO, fontSize: 12, flexShrink: 0, marginTop: 2 }}>{selected ? "☑" : "☐"}</span>}
                  <Html html={opt.html} style={{ flex: 1 }} />
                </button>
              );
            })}
            {isMulti && !mcLocked && (
              <button data-testid="submit-multi" onClick={submitMulti} disabled={!picked.length} style={btnS(picked.length ? C.amber : C.panel, picked.length ? C.bg : C.dim, picked.length ? C.amber : C.line)}>
                Submit answer
              </button>
            )}
          </div>
        )}

        {isDone && (
          <div style={{ marginTop: 14 }}>
            {!wasRight && <div style={{ fontFamily: MONO, fontSize: 12, color: C.bad, marginBottom: 6 }}>Wrong — reset to "new". This one comes back within the next few cards.</div>}
            <div style={{ fontSize: 13.5, color: "#b8c7d6", lineHeight: 1.6, margin: "0 0 12px", borderLeft: "3px solid " + (wasRight ? C.ok : C.bad), paddingLeft: 10 }}>
              <Html html={cur.explanationHtml} />
            </div>

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
              <button data-testid="next" onClick={next} style={btn(C.amber, C.bg)}>Next</button>
              {convo.length === 0 && <button onClick={breakdown} disabled={deepLoading} style={btn(C.well, deepLoading ? C.dim : C.cyan, deepLoading ? C.line : C.cyan)}>{deepLoading ? "Thinking…" : "Break it down"}</button>}
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
