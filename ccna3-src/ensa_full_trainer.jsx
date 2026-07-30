import { useState, useEffect, useRef } from "react";

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
//  CODE BLOCK — CLI command / output snippet
// ══════════════════════════════════════════════════════════
function CodeBlock({ code }) {
  if (!code) return null;
  return (
    <pre style={{
      fontFamily: MONO, fontSize: 12.5, color: C.ok, background: C.dark,
      border: "1px solid " + C.line, borderRadius: 8, padding: "12px 14px",
      overflowX: "auto", whiteSpace: "pre", margin: "0 0 12px", lineHeight: 1.6,
    }}>{code}</pre>
  );
}

// ══════════════════════════════════════════════════════════
//  NETWORK DIAGRAM — simple generic topology renderer
// ══════════════════════════════════════════════════════════
const KIND_GLYPH = { router: "R", switch: "SW", pc: "PC", ap: "AP", cloud: "☁", server: "SRV" };
const KIND_COLOR = { router: C.cyan, switch: C.amber, pc: C.ok, ap: C.violet, cloud: C.dim, server: C.bad };

function NetworkDiagram({ diagram }) {
  if (!diagram || !diagram.nodes || !diagram.nodes.length) return null;
  const { nodes, links } = diagram;
  const n = nodes.length;
  const W = 640, H = n <= 3 ? 140 : 220;
  const cols = Math.min(n, 4);
  const rows = Math.ceil(n / cols);
  const pos = {};
  nodes.forEach((node, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    pos[node.id] = {
      x: (W / (cols + 1)) * (col + 1),
      y: (H / (rows + 1)) * (row + 1),
    };
  });
  return (
    <div style={box({ marginBottom: 12, overflowX: "auto" })}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }}>
        {(links || []).map((l, i) => {
          const a = pos[l.from], b = pos[l.to];
          if (!a || !b) return null;
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.line} strokeWidth="2" />
              {l.label && (
                <text x={mx} y={my - 6} fill={C.dim} fontSize="10" fontFamily={MONO} textAnchor="middle">{l.label}</text>
              )}
            </g>
          );
        })}
        {nodes.map((node) => {
          const p = pos[node.id];
          const col = KIND_COLOR[node.kind] || C.ink;
          return (
            <g key={node.id}>
              <rect x={p.x - 30} y={p.y - 18} width="60" height="36" rx="8" fill={C.panel} stroke={col} strokeWidth="1.5" />
              <text x={p.x} y={p.y - 2} fill={col} fontSize="11" fontFamily={MONO} fontWeight="700" textAnchor="middle">{KIND_GLYPH[node.kind] || "?"}</text>
              <text x={p.x} y={p.y + 12} fill={C.ink} fontSize="10" fontFamily={MONO} textAnchor="middle">{node.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  MATCH QUESTION — pointer-based drag-to-match
// ══════════════════════════════════════════════════════════
function shuffledIndices(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function MatchQuestion({ pairs, locked, onCheck }) {
  const [slots, setSlots] = useState(() => Array(pairs.length).fill(null));
  const [pool, setPool] = useState(() => shuffledIndices(pairs.length));
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
    const results = slots.map((rightIdx, leftIdx) => rightIdx === leftIdx);
    setChecked(results);
    onCheck(results.every(Boolean));
  };

  const chipLabel = (idx) => pairs[idx][1];
  const allFilled = slots.every((s) => s !== null);

  const chipStyle = (idx, placedInSlot) => {
    let bd = C.cyan, bg = "#122430", fg = C.cyan;
    if (checked) {
      const leftIdx = slots.indexOf(idx);
      const ok = leftIdx !== -1 && checked[leftIdx];
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
        {pairs.map((pair, leftIdx) => (
          <div key={leftIdx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 13, color: C.ink, padding: "8px 10px", background: C.well, borderRadius: 6, border: "1px solid " + C.line }}>{pair[0]}</div>
            <div
              data-dropzone={String(leftIdx)}
              style={{ minHeight: 38, border: "1.5px dashed " + (slots[leftIdx] === null ? C.line : "transparent"), borderRadius: 6, display: "flex", alignItems: "center", padding: slots[leftIdx] === null ? "0 10px" : 0 }}
            >
              {slots[leftIdx] === null ? (
                <span style={{ fontSize: 11.5, color: C.dim, fontFamily: MONO }}>drop here</span>
              ) : (
                <div
                  onPointerDown={(e) => startDrag(slots[leftIdx], e)}
                  onTouchStart={(e) => startDrag(slots[leftIdx], e)}
                  style={chipStyle(slots[leftIdx], true)}
                >{chipLabel(slots[leftIdx])}</div>
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
        <button onClick={check} disabled={!allFilled} style={btnS(allFilled ? C.amber : C.panel, allFilled ? C.bg : C.dim, allFilled ? C.amber : C.line)}>
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
//  DATA — filled in after content workflows complete
// ══════════════════════════════════════════════════════════
const DATA = [
  {
    "n": "OSPF Concepts and Configuration",
    "c": "Modules 1-2",
    "intro": "OSPFv2 is a link-state IGP: instead of gossiping routes hop-by-hop like a distance-vector protocol, every router in an area builds an identical map of the topology (the link-state database) and independently runs Dijkstra's SPF algorithm to compute the best path to each destination. Neighbors form adjacencies with Hello packets, exchange link-state advertisements, and converge on a shared topology table -- after that, only real topology changes trigger immediate flooding (unlike distance-vector's full periodic updates), though OSPF still refreshes each LSA every 30 minutes as a background heartbeat so the LSDB never goes stale. Most of the \"gotcha\" exam questions come down to three mechanics: the timer math behind hello/dead intervals, the non-preemptive DR/BDR election, and how router ID and cost get chosen by default.",
    "concepts": [
      "OSPF is link-state, not distance-vector: every router in an area holds the exact same link-state database (LSDB) and independently runs SPF (Dijkstra) against it -- nobody just trusts a neighbor's word for the best path, they compute it themselves from raw topology data.",
      "Neighbor formation is a state-machine handshake: Down -> Init (heard a hello) -> Two-Way (bidirectional, sees itself in the neighbor's hello) -> ExStart (negotiate master/slave) -> Exchange (trade DBD summaries) -> Loading (request missing LSAs) -> Full (LSDBs identical). Only DR/BDR pairs and point-to-point neighbors reach Full; other DROthers stop at Two-Way with each other.",
      "Hello packets do double duty: they discover neighbors and they're the keepalive. The dead interval defaults to 4x the hello interval (40s/10s on broadcast and point-to-point links), and changing the hello interval on an interface auto-recalculates the dead interval to match unless you set the dead interval separately.",
      "On multiaccess (Ethernet) segments, OSPF elects a DR and BDR so routers don't form a full adjacency mesh -- everyone adjacencies with just the DR/BDR, cutting LSA flooding from O(n^2) down to O(n). Point-to-point links skip DR/BDR entirely since there are only ever two routers on the link.",
      "DR/BDR election uses priority (default 1, higher wins, 0 means never eligible) and breaks ties with the highest router ID. It's non-preemptive: a router with a higher priority joining late does NOT knock out the current DR -- only a fresh election (like after a full segment reboot) changes it, and if the DR itself fails, the BDR is promoted immediately with no new election needed.",
      "Router ID selection order is: manually configured via the router-id command, then the highest IP on any UP loopback interface, then the highest IP on any UP physical interface. That's exactly why Cisco best practice is to hardcode it -- otherwise a flapping physical interface can silently change the router's identity and force adjacencies to reset.",
      "Cost, not hop count, is OSPF's metric: cost = reference bandwidth / interface bandwidth, with a default reference bandwidth of 100 Mb/s. That means every link at or above 100 Mb/s (Fast Ethernet, Gig, 10-Gig) computes to the same cost of 1 unless you raise the reference bandwidth with auto-cost reference-bandwidth -- a real problem on modern all-Gig networks where every path looks equally cheap.",
      "Multiarea OSPF exists to contain SPF recalculation: a link flap inside one non-backbone area only forces SPF reruns for routers in that area, since other areas just see a summarized route, not the raw topology event. Every non-backbone area must connect to area 0 (the backbone), and OSPF does not auto-summarize between areas -- you configure that by hand."
    ],
    "f": [
      "OSPF is link-state; SPF (Dijkstra) computes the best path from an identical LSDB held by every router in the area",
      "Default hello/dead timers: 10s/40s on broadcast and point-to-point links, 30s/120s on NBMA -- dead is always 4x hello by default",
      "Default OSPF router priority = 1; a priority of 0 means that router can never become DR or BDR",
      "DR/BDR election happens only on multiaccess networks like Ethernet; point-to-point links never elect a DR",
      "Router ID pick order: manual router-id command > highest IP on an active loopback > highest IP on an active physical interface",
      "Best practice: set the router ID manually with router-id so a flapping interface can't silently change router identity",
      "Cost = reference bandwidth (default 100 Mb/s) / interface bandwidth; any link >=100 Mb/s defaults to a cost of 1",
      "auto-cost reference-bandwidth raises the default 100 so Gig/10-Gig links get distinct, meaningful costs",
      "OSPF packet types: Hello (discover/maintain neighbors), DBD (summarize LSDB contents), LSR (request specific LSAs), LSU (deliver the actual LSAs), LSAck (acknowledge receipt)",
      "Neighbor states in order: Down -> Init -> Two-Way -> ExStart -> Exchange -> Loading -> Full",
      "show ip ospf neighbor confirms adjacencies; show ip protocols confirms OSPF is running and which networks are advertised; show ip ospf interface shows per-interface timers, cost, and DR/BDR role",
      "network <address> <wildcard> area <id> both enables OSPF on matching interfaces and advertises that subnet -- get the wildcard mask wrong and the interface silently doesn't participate",
      "LSU packets refresh even unchanged LSAs every 30 minutes by default to keep the LSDB from going stale",
      "If the current DR fails, the BDR is promoted straight to DR with no new election -- a new BDR election is then held",
      "Multiarea OSPF requires every area to touch the backbone (area 0), directly or via a virtual link; SPF reruns stay contained inside the affected area",
      "clear ip ospf process is how you make a changed router ID (or other process-level change) take effect without a reload"
    ],
    "q": [
      {
        "type": "mc",
        "q": "What is a function of OSPF hello packets?",
        "options": [
          "to send specifically requested link-state records",
          "to discover neighbors and build adjacencies between them",
          "to ensure database synchronization between routers",
          "to request specific link-state records from neighbor routers"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Hello packets are OSPF's discovery and keepalive mechanism -- they find neighbors and negotiate the parameters needed to form an adjacency."
      },
      {
        "type": "mc",
        "q": "Which OSPF packet type contains the actual link-state advertisements (LSAs) that get flooded to neighbors?",
        "options": [
          "Hello packet",
          "Database description (DBD) packet",
          "Link-state request (LSR) packet",
          "Link-state update (LSU) packet"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "LSUs are the packet type that actually carries one or more LSAs; DBDs only summarize what's in the LSDB and LSRs only ask for specific entries."
      },
      {
        "type": "mc",
        "q": "Which three statements describe features of the OSPF topology table (LSDB)? (Choose three.)",
        "options": [
          "It's a link-state database representing the topology, it's identical on every router in a converged area, and it can be viewed with show ip ospf database",
          "Its contents result from running the SPF algorithm, it only holds feasible successor routes, and it only keeps the lowest-cost entry once converged",
          "It's a link-state database representing the topology, but it only keeps the lowest-cost route entries once converged",
          "Its contents result from running the SPF algorithm, and it holds feasible successor routes for backup paths"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The LSDB is raw topology data (not SPF output), stays identical across all routers in the area once converged, and show ip ospf database is the command to view it -- feasible successors and lowest-cost-only filtering are EIGRP/routing-table concepts, not LSDB properties."
      },
      {
        "type": "mc",
        "q": "What does an OSPF area contain?",
        "options": [
          "routers that share the same router ID",
          "routers whose SPF trees are identical",
          "routers that have the same link-state information in their LSDBs",
          "routers that share the same process ID"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "An area is defined by routers holding identical link-state information -- router ID, process ID, and SPF tree shape are all independent of area membership."
      },
      {
        "type": "mc",
        "q": "What is used to facilitate hierarchical routing in OSPF?",
        "options": [
          "the use of multiple areas",
          "frequent SPF calculations",
          "autosummarization",
          "the election of designated routers"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Splitting a domain into multiple areas anchored on a backbone is exactly what makes OSPF's routing hierarchical and contains SPF recalculation."
      },
      {
        "type": "mc",
        "q": "Which OSPF data structure is identical on all OSPF routers that share the same area?",
        "options": [
          "forwarding database",
          "link-state database",
          "adjacency database",
          "routing table"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The LSDB is built from flooded LSAs and converges to be identical for every router inside the same area; the routing table and adjacency database are locally computed and can differ."
      },
      {
        "type": "mc",
        "q": "Which step does an OSPF-enabled router take immediately after establishing an adjacency with another router?",
        "options": [
          "builds the topology table",
          "exchanges link-state advertisements",
          "chooses the best path",
          "executes the SPF algorithm"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Once two routers reach a full adjacency they exchange LSAs; only after LSAs are exchanged and the LSDB is built does SPF run to choose paths."
      },
      {
        "type": "mc",
        "q": "A network engineer has manually configured the hello interval to 15 seconds on an interface of a router running OSPFv2. By default, how will the dead interval on the interface be affected?",
        "options": [
          "The dead interval will not change from the default value.",
          "The dead interval will now be 30 seconds.",
          "The dead interval will now be 60 seconds.",
          "The dead interval will now be 15 seconds."
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Cisco IOS automatically recalculates the dead interval as 4x the hello interval unless the dead interval is set separately, so 15s hello becomes 60s dead."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. A network administrator has configured the OSPF timers on R1 and R2, and the values are mismatched. What is the result?",
        "options": [
          "R1 automatically adjusts its own timers to match the R2 timers.",
          "The R1 dead timer expires between hello packets from R2.",
          "The hello timer on R2 expires every ten seconds.",
          "The neighbor adjacency has formed."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "OSPF requires matching hello and dead intervals between neighbors -- when they're mismatched, one side's dead timer can expire before it hears the next hello, so the adjacency never forms or drops."
      },
      {
        "type": "mc",
        "q": "To establish a neighbor adjacency, two OSPF routers exchange hello packets. Which two values in the hello packets must match on both routers? (Choose two.)",
        "options": [
          "dead interval and hello interval",
          "router priority and list of neighbors",
          "router ID and list of neighbors",
          "router priority and hello interval"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Hello and dead intervals must match exactly for two routers to become neighbors; priority and router ID are used for DR/BDR election and identification, not neighbor-matching, and router IDs must actually be unique, not matching."
      },
      {
        "type": "mc",
        "q": "What is the default router priority value for all Cisco OSPF routers?",
        "options": [
          "0",
          "1",
          "10",
          "255"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Every OSPF-enabled interface starts with priority 1 by default, which is why ties are commonly broken by router ID."
      },
      {
        "type": "mc",
        "q": "Which type of OSPFv2 packet contains an abbreviated list of the LSDB of a sending router and is used by receiving routers to check against the local LSDB?",
        "options": [
          "database description",
          "link-state update",
          "link-state request",
          "link-state acknowledgment"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The DBD packet is a summary (headers only) of the sender's LSDB, letting the receiver spot which LSAs it's missing."
      },
      {
        "type": "mc",
        "q": "In an OSPF network, when are DR and BDR elections required?",
        "options": [
          "when the two adjacent neighbors are interconnected over a point-to-point link",
          "when all the routers in an OSPF area cannot form adjacencies",
          "when the routers are interconnected over a common Ethernet network",
          "when the two adjacent neighbors are in two different networks"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "DR/BDR elections only happen on multiaccess broadcast segments like Ethernet, where more than two routers could otherwise form a full adjacency mesh; point-to-point links never elect a DR."
      },
      {
        "type": "mc",
        "q": "When an OSPF network is converged and no topology change has been detected, how often will LSU packets be sent to neighboring routers?",
        "options": [
          "every 5 minutes",
          "every 10 minutes",
          "every 30 minutes",
          "every 60 minutes"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Even with no changes, OSPF refreshes each LSA every 30 minutes by default to keep the LSDB from going stale."
      },
      {
        "type": "mc",
        "q": "What will an OSPF router prefer to use first as a router ID?",
        "options": [
          "a loopback interface configured with the highest IP address on the router",
          "any IP address that is configured using the router-id command",
          "the highest active interface IP configured on the router",
          "the highest active interface that participates in the routing process because of a network statement"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The router-id command is the top priority in router ID selection -- it overrides both loopback and physical interface addresses."
      },
      {
        "type": "mc",
        "q": "What are two purposes of an OSPF router ID? (Choose two.)",
        "options": [
          "to uniquely identify the router within the OSPF domain and to facilitate the DR/BDR election",
          "to enable the SPF algorithm to compute lowest-cost paths and to facilitate network convergence",
          "to facilitate network convergence and to facilitate transition of the neighbor state to Full",
          "to uniquely identify the router and to enable SPF to compute lowest-cost paths"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The router ID's two real jobs are giving the router a unique identity in the OSPF domain and serving as the tiebreaker input for DR/BDR elections -- it plays no role in the SPF cost math or the neighbor state machine itself."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. If no router ID was manually configured, what would router Branch1 use as its OSPF router ID?",
        "options": [
          "10.0.0.1",
          "10.1.0.1",
          "192.168.1.100",
          "209.165.201.1"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "With no router-id command set, OSPF falls back to the highest IP address on an active loopback interface -- here that's 192.168.1.100, ahead of any physical interface IP."
      },
      {
        "type": "mc",
        "q": "A technician configures 'router ospf 11' followed by a network statement. What does the number 11 represent?",
        "options": [
          "the OSPF process ID on R1",
          "the cost of the link to R1",
          "the autonomous system number to which R1 belongs",
          "the administrative distance manually assigned to R1"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The number after router ospf is a locally-significant process ID -- it doesn't need to match between routers and has nothing to do with AS number or cost."
      },
      {
        "type": "mc",
        "q": "Which three statements describe the results of the OSPF DR/BDR election in the topology shown? (Choose three.)",
        "options": [
          "R2 will be elected DR, R3 will be elected BDR, and the R4 router ID is 172.16.1.1",
          "The R4 FastEthernet 0/0 priority is 128, R1 will be elected BDR, and R2's router ID is its loopback interface",
          "R2 will be elected DR, but R1 will be elected BDR instead of R3",
          "R4's router ID is 172.16.1.1, but R1 (not R3) is elected BDR"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Based on priority and router ID in the exhibit, R2 wins DR, R3 comes in as BDR, and R4's router ID resolves to 172.16.1.1 -- the other bundles mix in the wrong BDR or a fabricated priority/loopback claim."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. If the switch reboots and all routers must re-establish OSPF adjacencies, which routers will become the new DR and BDR?",
        "options": [
          "Router R4 will become the DR and router R1 will become the BDR.",
          "Router R2 will become the DR and router R3 will become the BDR.",
          "Router R1 will become the DR and router R2 will become the BDR.",
          "Router R4 will become the DR and router R3 will become the BDR."
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A full reboot of the shared segment wipes the existing DR/BDR state, so a fresh election runs and the highest-priority (or, on a tie, highest router ID) routers -- R4 and R1 here -- win DR and BDR respectively."
      },
      {
        "type": "mc",
        "q": "By default, what is the OSPF cost for any link with a bandwidth of 100 Mb/s or greater?",
        "options": [
          "100000000",
          "10000",
          "1",
          "100"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Cost = reference bandwidth (100 Mb/s by default) / interface bandwidth, so any interface at or above 100 Mb/s computes to a cost of 1 -- Fast Ethernet, Gig, and 10-Gig all tie unless you raise the reference bandwidth."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. What is the OSPF cost to reach router A's LAN 172.16.1.0/24 from router B?",
        "options": [
          "782",
          "74",
          "128",
          "65"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Summing the per-link OSPF costs (reference bandwidth divided by interface bandwidth) along the path from B to that LAN totals 65."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. On which router would a default route be statically configured in a corporate environment running single-area OSPF?",
        "options": [
          "R0-A",
          "ISP, R0-A, R0-B, and R0-C",
          "ISP",
          "R0-B and R0-C"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Only the edge router with the actual connection to the ISP (R0-A) needs a static default route -- it then redistributes that as a default route into OSPF for the rest of the internal routers to use."
      },
      {
        "type": "mc",
        "q": "What command would be used to determine if a routing-protocol-initiated relationship had been made with an adjacent router?",
        "options": [
          "ping",
          "show ip ospf neighbor",
          "show ip interface brief",
          "show ip protocols"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "show ip ospf neighbor lists every OSPF neighbor and its adjacency state (e.g., FULL), which is exactly what confirms a formed relationship."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Which command did an administrator issue to produce the interface-specific OSPF timer and cost output shown?",
        "options": [
          "show ip ospf interface serial0/0/1",
          "show ip route ospf",
          "show ip ospf",
          "show ip ospf neighbor"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Per-interface detail like hello/dead timers, cost, and DR/BDR status for one specific interface only comes from show ip ospf interface <interface>."
      },
      {
        "type": "mc",
        "q": "Which command verifies that OSPF is enabled and also lists the networks being advertised by the router?",
        "options": [
          "show ip interface brief",
          "show ip ospf interface",
          "show ip protocols",
          "show ip route ospf"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "show ip protocols summarizes the running routing protocol, including its process ID and the networks configured under it."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. A network administrator has configured OSPFv2 on two routers but PC1 cannot reach PC2. What is the most likely problem?",
        "options": [
          "Interface Fa0/0 has not been activated for OSPFv2 on router R2.",
          "Interface Fa0/0 is configured as a passive-interface on router R2.",
          "Interface S0/0 is configured as a passive-interface on router R2.",
          "Interface s0/0 has not been activated for OSPFv2 on router R2."
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "If R2's LAN-facing Fa0/0 was never included in an OSPF network statement, that subnet is never advertised, so remote routers have no route back to PC2."
      },
      {
        "type": "mc",
        "q": "What is the recommended Cisco best practice for configuring an OSPF router so it's easily identified when troubleshooting?",
        "options": [
          "Configure a value using the router-id command.",
          "Use the highest active interface IP address on the router.",
          "Use a loopback interface configured with the highest IP address.",
          "Use the highest IP address assigned to an active interface participating in routing."
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Manually setting the router ID with router-id is the recommended practice because it's stable and won't silently change if a physical interface goes down."
      },
      {
        "type": "mc",
        "q": "Which step in the link-state routing process is described by a router running an algorithm to determine the best path to each destination?",
        "options": [
          "load balancing equal-cost paths",
          "declaring a neighbor to be inaccessible",
          "choosing the best route",
          "executing the SPF algorithm"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Running Dijkstra's algorithm against the LSDB to compute best paths is literally the 'execute SPF' step, distinct from actually inserting the results into the routing table."
      },
      {
        "type": "mc",
        "q": "An administrator is advertising 192.168.223.0 255.255.254.0 in OSPF. What wildcard mask should be used in the network statement?",
        "options": [
          "0.0.1.255",
          "0.0.7.255",
          "0.0.15.255",
          "0.0.31.255"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Invert the subnet mask octet by octet: 255.255.254.0 inverts to 0.0.1.255."
      },
      {
        "type": "mc",
        "q": "What is the format of the router ID on an OSPF-enabled router?",
        "options": [
          "a unique router host name configured on the router",
          "a unique phrase with no more than 16 characters",
          "a 32-bit number formatted like an IPv4 address",
          "an 8-bit number with a decimal value between 0 and 255"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A router ID is a 32-bit value displayed in dotted-decimal, IPv4-address-style notation, even though it doesn't have to correspond to a real, reachable interface."
      },
      {
        "type": "mc",
        "q": "After modifying the router ID on an OSPF router, what is the preferred method to make the new router ID take effect?",
        "options": [
          "copy running-config startup-config",
          "resume",
          "clear ip route *",
          "clear ip ospf process"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "clear ip ospf process forces OSPF to restart its process and immediately renegotiate adjacencies using the new router ID, without needing a reload."
      },
      {
        "type": "mc",
        "q": "In an OSPFv2 configuration, what is the effect of entering the command 'network 192.168.1.1 0.0.0.0 area 0'?",
        "options": [
          "It allows all 192.168.1.0 networks to be advertised.",
          "It tells the router which interface to turn on for the OSPF routing process.",
          "It changes the router ID of the router to 192.168.1.1.",
          "It enables OSPF on all interfaces on the router."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The network command with a host wildcard (0.0.0.0) matches exactly one interface IP, enabling OSPF on that specific interface -- it doesn't touch the router ID or other interfaces."
      },
      {
        "type": "mc",
        "q": "What is the reason for a network engineer to alter the default reference bandwidth parameter when configuring OSPF?",
        "options": [
          "to force a specific link to be used in the destination route",
          "to more accurately reflect the cost of links greater than 100 Mb/s",
          "to enable the link for OSPF routing",
          "to increase the speed of the link"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Since default cost bottoms out at 1 for anything at or above 100 Mb/s, raising the reference bandwidth is required to give Gig and 10-Gig links distinct, meaningful costs relative to each other."
      },
      {
        "type": "mc",
        "q": "In a Packet Tracer activity, which task must be performed on Router 1 for it to establish an OSPF adjacency with Router 2?",
        "options": [
          "Issue the clear ip ospf process command.",
          "Change the subnet mask of interface FastEthernet 0/0 to 255.255.255.0.",
          "Remove the passive-interface command from interface FastEthernet 0/0.",
          "Add the network 10.0.1.0 0.0.0.255 area 0 command to the OSPF process."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A subnet mask mismatch on the shared link means the two interfaces aren't actually on the same IP subnet, so hello packets can't even be exchanged -- fixing the mask is the prerequisite."
      },
      {
        "type": "mc",
        "q": "In OSPF terminology, what is the term for a domain where every router lives entirely within the backbone area?",
        "options": [
          "single-area OSPF",
          "multiarea OSPF",
          "totally stubby area",
          "virtual-link domain"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Single-area OSPF just means every router is in area 0 -- simplest to configure, but it loses the SPF-containment benefit that multiarea design provides."
      },
      {
        "type": "mc",
        "q": "What is a benefit of multiarea OSPF routing?",
        "options": [
          "Topology changes in one area do not cause SPF recalculations in other areas.",
          "Routers in all areas share the same link-state database and have a complete picture of the entire network.",
          "A backbone area is not required.",
          "Automatic route summarization occurs by default between areas."
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Splitting into areas contains an LSDB change and its SPF rerun to the area where it happened -- other areas only see a summarized route, not the raw event."
      },
      {
        "type": "mc",
        "q": "In the OSPF neighbor state machine, which state comes fourth, immediately before Exchange?",
        "options": [
          "ExStart state",
          "Two-way state",
          "Loading state",
          "Full state"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The order is Down -> Init -> Two-Way -> ExStart -> Exchange -> Loading -> Full, so ExStart is the fourth state, where routers negotiate master/slave roles before exchanging DBDs."
      },
      {
        "type": "mc",
        "q": "What indicates to a link-state router that a neighbor is unreachable?",
        "options": [
          "if the router no longer receives hello packets",
          "if the router receives an update with a hop count of 16",
          "if the router receives an LSP with previously learned information",
          "if the router no longer receives routing updates"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Since hello packets are the keepalive, missing them until the dead interval expires is what tells OSPF a neighbor has gone down -- hop-count-16 is a distance-vector (RIP) concept, not OSPF."
      },
      {
        "type": "mc",
        "q": "Which three OSPF states are involved when two routers are first forming an adjacency, before any LSDB content is exchanged? (Choose three.)",
        "options": [
          "Down, Init, and Two-Way",
          "ExStart, Exchange, and Loading",
          "Down, ExStart, and Loading",
          "Init, Exchange, and Two-Way"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Down, Init, and Two-Way are the early discovery states before any LSDB content is negotiated; ExStart, Exchange, and Loading come afterward once the routers start trading DBD and LSA data."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Routers B, C, and D have default priority and router A has priority 0. Which conclusion can be drawn about the DR/BDR election?",
        "options": [
          "If the priority of router C is changed to 255, then it will become the DR.",
          "Router A will become the DR and router D will become the BDR.",
          "If the DR fails, the new DR will be router B.",
          "If a new router with a higher priority is added to this network, it will become the DR."
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "OSPF's DR/BDR election is non-preemptive -- if the current DR fails, the existing BDR (router B) is promoted straight to DR rather than triggering a brand-new election, and a priority-0 router (A) can never become DR or BDR at all."
      },
      {
        "type": "mc",
        "q": "An administrator is advertising 64.102.0.0 255.255.255.128 in OSPF. What wildcard mask should be used?",
        "options": [
          "0.0.31.255",
          "0.0.0.63",
          "0.0.63.255",
          "0.0.0.127"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Inverting 255.255.255.128 octet by octet gives 0.0.0.127."
      },
      {
        "type": "mc",
        "q": "Which command verifies the configured hello and dead timer intervals on a point-to-point WAN link between two routers running OSPFv2?",
        "options": [
          "show ipv6 ospf interface serial 0/0/0",
          "show ip ospf neighbor",
          "show ip ospf interface fastethernet 0/1",
          "show ip ospf interface serial 0/0/0"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "show ip ospf interface for the correct interface -- the serial WAN link, not the LAN Fast Ethernet one, and not the IPv6 command -- is what displays hello/dead timer values."
      },
      {
        "type": "mc",
        "q": "An administrator is advertising 128.107.0.0 255.255.255.192 in OSPF. What wildcard mask should be used?",
        "options": [
          "0.0.63.255",
          "0.0.0.63",
          "0.0.0.3",
          "0.0.0.7"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Inverting 255.255.255.192 gives 0.0.0.63."
      },
      {
        "type": "mc",
        "q": "Which OSPF packet type is used to query another router for additional link-state information it's missing?",
        "options": [
          "link-state request packet",
          "hello packet",
          "database description packet",
          "link-state update packet"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "After comparing DBD summaries and spotting a gap, a router sends an LSR to explicitly ask a neighbor for the full LSAs it's missing."
      },
      {
        "type": "mc",
        "q": "An administrator is advertising 192.168.181.0 255.255.254.0 in OSPF. What wildcard mask should be used?",
        "options": [
          "0.0.63.255",
          "0.0.15.255",
          "0.0.1.255",
          "0.0.31.255"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Inverting 255.255.254.0 gives 0.0.1.255."
      },
      {
        "type": "mc",
        "q": "An administrator is advertising 198.19.0.0 255.255.252.0 in OSPF. What wildcard mask should be used?",
        "options": [
          "0.0.63.255",
          "0.0.3.255",
          "0.0.31.255",
          "0.0.0.255"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Inverting 255.255.252.0 gives 0.0.3.255."
      },
      {
        "type": "mc",
        "q": "An administrator is advertising 128.107.0.0 255.255.252.0 in OSPF. What wildcard mask should be used?",
        "options": [
          "0.0.3.255",
          "0.0.0.7",
          "0.0.0.3",
          "0.0.63.255"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Inverting 255.255.252.0 gives 0.0.3.255."
      },
      {
        "type": "mc",
        "q": "Which step in the link-state routing process is described by a router flooding link-state and cost information about each of its directly connected links?",
        "options": [
          "building the topology table",
          "selecting the router ID",
          "exchanging link-state advertisements",
          "injecting the default route"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Flooding LSAs describing directly connected links to all neighbors is the LSA-exchange step, which happens before any router builds its topology table from that flooded data."
      },
      {
        "type": "mc",
        "q": "Which step in the link-state routing process is described by a router sending Hello packets out all of its OSPF-enabled interfaces?",
        "options": [
          "electing the designated router",
          "establishing neighbor adjacencies",
          "injecting the default route",
          "exchanging link-state advertisements"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Sending hellos to discover and form relationships with directly connected routers is the neighbor-adjacency-establishment step -- LSA exchange only happens afterward, once adjacencies exist."
      },
      {
        "type": "mc",
        "q": "An administrator is advertising 64.100.0.0 255.255.255.0 in OSPF. What wildcard mask should be used?",
        "options": [
          "0.0.0.31",
          "0.0.0.255",
          "0.0.0.63",
          "0.0.0.127"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Inverting a full /24 mask (255.255.255.0) gives 0.0.0.255."
      },
      {
        "type": "mc",
        "q": "Which step in the link-state routing process is described by a router inserting the best paths into its routing table?",
        "options": [
          "declaring a neighbor to be inaccessible",
          "executing the SPF algorithm",
          "load balancing equal-cost paths",
          "choosing the best route"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Choosing the best route is the final step, where SPF's output actually gets installed into the routing table -- running SPF itself is a separate, earlier step."
      },
      {
        "type": "mc",
        "q": "What type of address is 64.101.198.197?",
        "options": [
          "public",
          "private",
          "multicast",
          "loopback"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "It falls outside all the RFC 1918 private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), the 224.0.0.0/4 multicast range, and the 127.0.0.0/8 loopback range, so it's a public, globally-routable address."
      },
      {
        "type": "mc",
        "q": "An OSPF router has three directly connected /24 networks: 172.16.0.0, 172.16.1.0, and 172.16.2.0. Which network command advertises only the 172.16.1.0 network?",
        "options": [
          "network 172.16.1.0 0.0.255.255 area 0",
          "network 172.16.0.0 0.0.15.255 area 0",
          "network 172.16.1.0 0.0.0.255 area 0",
          "network 172.16.1.0 0.0.0.0 area 0"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "For a /24 network, the matching wildcard mask is 0.0.0.255 -- that covers the whole 172.16.1.0/24 subnet without sweeping in the neighboring /24s."
      },
      {
        "type": "mc",
        "q": "Which step in the link-state routing process is described by a router building a link-state (topology) database based on received LSAs?",
        "options": [
          "selecting the router ID",
          "declaring a neighbor to be inaccessible",
          "executing the SPF algorithm",
          "building the topology table"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Once LSAs from all neighbors have been received, the router compiles them into its topology table (LSDB) -- SPF then runs against that completed table, not before it."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. A network administrator has configured the OSPF hello and dead timers to the values shown in the graphic. What is the result of having those manually configured timers?",
        "options": [
          "R1 automatically adjusts its own timers to match the R2 timers.",
          "The R1 dead timer expires between hello packets from R2.",
          "The hello timer on R2 expires every ten seconds.",
          "The neighbor adjacency has formed."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "R1",
              "label": "R1 (Hello 5 / Dead 20)",
              "kind": "router"
            },
            {
              "id": "SW1",
              "label": "SW1",
              "kind": "switch"
            },
            {
              "id": "R2",
              "label": "R2 (Hello 25 / Dead 100)",
              "kind": "router"
            }
          ],
          "links": [
            {
              "from": "R1",
              "to": "SW1",
              "label": "Fa0/0"
            },
            {
              "from": "SW1",
              "to": "R2",
              "label": "Fa0/0"
            }
          ]
        },
        "explanation": "R1's dead interval is only 20 seconds while R2 only sends a hello every 25 seconds, so R1 will declare R2 dead before the next hello ever arrives; mismatched hello/dead timers like this prevent the neighbor adjacency from ever forming."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. If no router ID was manually configured, what would router Branch1 use as its OSPF router ID?",
        "options": [
          "10.0.0.1",
          "10.1.0.1",
          "192.168.1.100",
          "209.165.201.1"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "PC1",
              "label": "PC",
              "kind": "pc"
            },
            {
              "id": "SW1",
              "label": "SW1",
              "kind": "switch"
            },
            {
              "id": "Branch1",
              "label": "Branch1 (Lo0 192.168.1.100)",
              "kind": "router"
            },
            {
              "id": "Cloud1",
              "label": "209.165.201.0/29",
              "kind": "cloud"
            },
            {
              "id": "Branch2",
              "label": "Branch2",
              "kind": "router"
            }
          ],
          "links": [
            {
              "from": "PC1",
              "to": "SW1",
              "label": ""
            },
            {
              "from": "SW1",
              "to": "Branch1",
              "label": "G0/0 10.1.0.1/16"
            },
            {
              "from": "Branch1",
              "to": "Cloud1",
              "label": "209.165.201.1"
            },
            {
              "from": "Branch1",
              "to": "Branch2",
              "label": "10.0.0.0/16"
            }
          ]
        },
        "explanation": "With no router-id command configured, OSPFv2 next prefers the highest IPv4 address among any configured loopback interfaces before ever considering physical interfaces, so Branch1's Loopback0 address of 192.168.1.100 is chosen as the router ID even though 209.165.201.1 is numerically higher on a physical interface."
      },
      {
        "type": "mc",
        "q": "A network technician issues the following commands when configuring a router. What does the number 11 represent?",
        "options": [
          "the OSPF process ID on R1",
          "the cost of the link to R1",
          "the autonomous system number to which R1 belongs",
          "the area number where R1 is located"
        ],
        "correct": 0,
        "pairs": [],
        "code": "R1(config)# router ospf 11\nR1(config-router)# network 10.10.10.0 0.0.0.255 area 0",
        "diagram": null,
        "explanation": "In 'router ospf 11', 11 is the OSPF process ID, a locally significant value chosen by the administrator that is never exchanged with other routers, unlike EIGRP's autonomous system number; the area number (0 here) is set separately at the end of the network statement."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Which statement correctly describes a result of the OSPF DR/BDR election process in this topology?",
        "options": [
          "R2 will be elected DR.",
          "R1 will be elected BDR.",
          "The router ID on R2 is the loopback interface.",
          "The R4 FastEthernet 0/0 priority is 128."
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "SW1",
              "label": "SW1",
              "kind": "switch"
            },
            {
              "id": "R1",
              "label": "R1 RID 1.1.1.1, pri 1",
              "kind": "router"
            },
            {
              "id": "R2",
              "label": "R2 pri 255",
              "kind": "router"
            },
            {
              "id": "R3",
              "label": "R3 Fa0/0 192.168.1.4, pri 1",
              "kind": "router"
            },
            {
              "id": "R4",
              "label": "R4 Lo0 172.16.1.1, pri 1",
              "kind": "router"
            }
          ],
          "links": [
            {
              "from": "SW1",
              "to": "R1",
              "label": "Fa0/0"
            },
            {
              "from": "SW1",
              "to": "R2",
              "label": "Fa0/0"
            },
            {
              "from": "SW1",
              "to": "R3",
              "label": "Fa0/0"
            },
            {
              "from": "SW1",
              "to": "R4",
              "label": "Fa0/0"
            }
          ]
        },
        "explanation": "R2 has a manually configured priority of 255, the highest on the segment, so it wins the DR election outright; R3, not R1, becomes BDR because among the remaining priority-1 routers it has the numerically highest router ID (192.168.1.4, since it has no loopback), R2 itself has no loopback configured, and R4's Fa0/0 priority is actually the default value of 1, not 128."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. If the switch reboots and all routers have to re-establish OSPF adjacencies, which routers will become the new DR and BDR?",
        "options": [
          "Router R4 will become the DR and router R1 will become the BDR.",
          "Router R2 will become the DR and router R3 will become the BDR.",
          "Router R1 will become the DR and router R2 will become the BDR.",
          "Router R4 will become the DR and router R3 will become the BDR."
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "SW1",
              "label": "SW1",
              "kind": "switch"
            },
            {
              "id": "R1",
              "label": "R1 RID 1.1.1.1, pri 2",
              "kind": "router"
            },
            {
              "id": "R2",
              "label": "R2 RID 2.2.2.2, pri 1",
              "kind": "router"
            },
            {
              "id": "R3",
              "label": "R3 RID 3.3.3.3, pri 1",
              "kind": "router"
            },
            {
              "id": "R4",
              "label": "R4 RID 4.4.4.4, pri 2",
              "kind": "router"
            }
          ],
          "links": [
            {
              "from": "SW1",
              "to": "R1",
              "label": "10.0.0.0/16"
            },
            {
              "from": "SW1",
              "to": "R2",
              "label": "10.0.0.0/16"
            },
            {
              "from": "SW1",
              "to": "R3",
              "label": "10.0.0.0/16"
            },
            {
              "from": "SW1",
              "to": "R4",
              "label": "10.0.0.0/16"
            }
          ]
        },
        "explanation": "R1 and R4 both have the highest configured priority (2), so the tie is broken by the highest router ID: R4's 4.4.4.4 beats R1's 1.1.1.1, making R4 the DR and R1 the BDR, while R2 and R3, left at the default priority of 1, are not in contention."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. What is the OSPF cost to reach router A's LAN, 172.16.1.0/24, from router B?",
        "options": [
          "782",
          "74",
          "128",
          "65"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "B",
              "label": "B",
              "kind": "router"
            },
            {
              "id": "A",
              "label": "A",
              "kind": "router"
            },
            {
              "id": "C",
              "label": "C",
              "kind": "router"
            },
            {
              "id": "LAN_A",
              "label": "172.16.1.0/24",
              "kind": "switch"
            }
          ],
          "links": [
            {
              "from": "B",
              "to": "A",
              "label": "1544 Kbps"
            },
            {
              "from": "A",
              "to": "C",
              "label": "64 Kbps"
            },
            {
              "from": "B",
              "to": "C",
              "label": "1544 Kbps"
            },
            {
              "from": "A",
              "to": "LAN_A",
              "label": "G0/0"
            }
          ]
        },
        "explanation": "Using Cost = 100,000,000 / bandwidth, the direct 1544 Kbps serial link from B to A costs 64, and A's Gigabit Ethernet (G0/0) link to its own LAN costs 1, giving a total path cost of 64 + 1 = 65, which is cheaper than the alternate path through C over the 64 Kbps link."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. On which router or routers would a default route be statically configured in a corporate environment that uses single-area OSPF as the routing protocol?",
        "options": [
          "R0-A",
          "ISP",
          "R0-A, R0-B, and R0-C",
          "ISP and R0-A"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "ISP",
              "label": "ISP / The World",
              "kind": "cloud"
            },
            {
              "id": "R0A",
              "label": "R0-A",
              "kind": "router"
            },
            {
              "id": "R0B",
              "label": "R0-B",
              "kind": "router"
            },
            {
              "id": "R0C",
              "label": "R0-C",
              "kind": "router"
            }
          ],
          "links": [
            {
              "from": "ISP",
              "to": "R0A",
              "label": ""
            },
            {
              "from": "R0A",
              "to": "R0B",
              "label": "Area 0"
            },
            {
              "from": "R0A",
              "to": "R0C",
              "label": "Area 0"
            }
          ]
        },
        "explanation": "Only R0-A has a link out to the ISP, so the static default route belongs there; R0-A then redistributes that default route into OSPF so R0-B and R0-C learn it dynamically instead of needing it configured locally on routers with no Internet-facing link."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Which command did an administrator issue on R1 to produce this output?",
        "options": [
          "R1# show ip ospf interface serial0/0/1",
          "R1# show ip route ospf",
          "R1# show ip ospf",
          "R1# show ip ospf neighbor"
        ],
        "correct": 0,
        "pairs": [],
        "code": "Serial0/0/1 is up, line protocol is up\n  Internet Address 172.16.30.1/30, Area 0, Attached via Network Statement\n  Process ID 10, Router ID 2.2.2.2, Network Type POINT_TO_POINT, Cost: 64\n  Topology-MTID    Cost    Disabled    Shutdown    Topology Name\n        0           64        no          no             Base\n  Transmit Delay is 1 sec, State POINT_TO_POINT\n  Timer intervals configured, Hello 5, Dead 20, Wait 20, Retransmit 5\n    oob-resync timeout 40\n    Hello due in 00:00:02\n  Supports Link-local Signaling (LLS)\n  Cisco NSF helper support enabled\n  IETF NSF helper support enabled\n  Index 2/2, flood queue length 0\n  Next 0x0(0)/0x0(0)\n  Last flood scan length is 1, maximum is 1\n  Last flood scan time is 0 msec, maximum is 0 msec\n  Neighbor Count is 1, Adjacent neighbor count is 1\n    Adjacent with neighbor 1.1.1.1\n  Suppress hello for 0 neighbor(s)\n  Message digest authentication enabled\n    Youngest key id is 1\nR1#",
        "diagram": null,
        "explanation": "The per-interface detail shown here — network type, configured hello/dead timers, cost, and the adjacent-neighbor state for Serial0/0/1 specifically — is exactly what 'show ip ospf interface serial0/0/1' displays; show ip ospf gives process-wide summary information, show ip route ospf lists learned routes, and show ip ospf neighbor gives a one-line-per-neighbor summary table instead."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. A network administrator has configured OSPFv2 on the two Cisco routers, but PC1 is unable to connect to PC2. The output shown was captured on R2. What is the most likely problem?",
        "options": [
          "Interface Fa0/0 has not been activated for OSPFv2 on router R2.",
          "Interface Fa0/0 is configured as a passive-interface on router R2.",
          "Interface S0/0 is configured as a passive-interface on router R2.",
          "Interface s0/0 has not been activated for OSPFv2 on router R2."
        ],
        "correct": 0,
        "pairs": [],
        "code": "R2# show ip protocols\n<output omitted>\n  Routing Protocol is \"ospf 99\"\n    Router ID 192.168.30.254\n    Maximum path: 4\n    Routing for Networks:\n      192.168.20.2 0.0.0.0 area 0\n      192.168.3.0 0.0.0.255 area 0\n    Routing Information Sources:\n      Gateway          Distance      Last Update\n      192.168.20.1        110          00:02:11\n    Distance: (default is 110)",
        "diagram": {
          "nodes": [
            {
              "id": "PC1",
              "label": "PC1",
              "kind": "pc"
            },
            {
              "id": "R1",
              "label": "R1",
              "kind": "router"
            },
            {
              "id": "R2",
              "label": "R2",
              "kind": "router"
            },
            {
              "id": "PC2",
              "label": "PC2",
              "kind": "pc"
            }
          ],
          "links": [
            {
              "from": "PC1",
              "to": "R1",
              "label": "Fa0/0 192.168.10.0/24"
            },
            {
              "from": "R1",
              "to": "R2",
              "label": "S0/0 192.168.20.0/30"
            },
            {
              "from": "R2",
              "to": "PC2",
              "label": "Fa0/0 192.168.30.0/24"
            }
          ]
        },
        "explanation": "R2's 'Routing for Networks' list shows a network statement of 192.168.3.0 0.0.0.255, which does not match R2's actual Fa0/0 subnet of 192.168.30.0/24, so that LAN interface (and PC2's network) was never activated for OSPFv2 and is never advertised, while the S0/0 adjacency to R1 (192.168.20.2 0.0.0.0) is clearly up and working. (The exhibit's earlier draft also listed Fa0/0 under 'Passive Interface(s)' and repeated R2's own router ID as a routing information source for itself — both were removed as inconsistent noise: a passive interface's connected network is still advertised into OSPF, so that would not explain the outage, and a router cannot be a routing-information source for its own routes.)"
      },
      {
        "type": "mc",
        "q": "In an OSPFv2 configuration, what is the effect of entering the following command?",
        "options": [
          "It allows all 192.168.1.0 networks to be advertised.",
          "It tells the router which interface to turn on for the OSPF routing process.",
          "It changes the router ID of the router to 192.168.1.1.",
          "It enables OSPF on all interfaces on the router."
        ],
        "correct": 1,
        "pairs": [],
        "code": "router(config-router)# network 192.168.1.1 0.0.0.0 area 0",
        "diagram": null,
        "explanation": "A wildcard mask of 0.0.0.0 requires an exact match, so this command enables OSPF only on the single interface configured with IP address 192.168.1.1; it does not advertise the whole 192.168.1.0/24 block, enable OSPF network-wide, or change the router ID."
      },
      {
        "type": "match",
        "q": "Match the description to the term. (Not all options are used.)",
        "options": [],
        "correct": -1,
        "pairs": [
          [
            "Shortest Path First",
            "This is the algorithm used by OSPF."
          ],
          [
            "Adjacency database",
            "This is where the details of the neighboring routers can be found."
          ],
          [
            "Single-area OSPF",
            "All the routers are in the backbone area."
          ],
          [
            "Link-state database",
            "This is where you can find the topology table."
          ]
        ],
        "code": "",
        "diagram": null,
        "explanation": "OSPF uses the Shortest Path First (SPF) algorithm (DUAL is used by EIGRP instead); the adjacency database records details about neighboring routers; single-area OSPF means every router belongs to the one backbone area; and the link-state database, viewable with show ip ospf database, is the topology table."
      },
      {
        "type": "match",
        "q": "Match each OSPF neighbor state with the order in which it occurs during adjacency formation. (Not all options are used.)",
        "options": [],
        "correct": -1,
        "pairs": [
          [
            "Down state",
            "first state"
          ],
          [
            "Init state",
            "second state"
          ],
          [
            "Two-way state",
            "third state"
          ],
          [
            "Exstart state",
            "fourth state"
          ],
          [
            "Exchange state",
            "fifth state"
          ],
          [
            "Loading state",
            "sixth state"
          ],
          [
            "Full state",
            "seventh state"
          ]
        ],
        "code": "",
        "diagram": null,
        "explanation": "OSPF neighbor states progress in a fixed order toward adjacency: Down (1st), Init (2nd), Two-Way (3rd), ExStart (4th), Exchange (5th), Loading (6th), and Full (7th); the Active and Passive states offered as distractors actually belong to EIGRP, not OSPF."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Routers B, C, and D have the default OSPF priority, and router A has a priority of 0. Which conclusion can be drawn from the DR/BDR election process?",
        "options": [
          "If the priority of router C is changed to 255, then it will become the DR.",
          "Router A will become the DR and router D will become the BDR.",
          "If the DR fails, the new DR will be router B.",
          "If a new router with a higher priority is added to this network, it will become the DR."
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "SW1",
              "label": "SW1",
              "kind": "switch"
            },
            {
              "id": "C",
              "label": "C RID 1.1.1.1",
              "kind": "router"
            },
            {
              "id": "D",
              "label": "D RID 3.3.3.3",
              "kind": "router"
            },
            {
              "id": "A",
              "label": "A RID 4.4.4.4, pri 0",
              "kind": "router"
            },
            {
              "id": "B",
              "label": "B RID 2.2.2.2",
              "kind": "router"
            }
          ],
          "links": [
            {
              "from": "SW1",
              "to": "C",
              "label": "G0/0"
            },
            {
              "from": "SW1",
              "to": "D",
              "label": "G0/0"
            },
            {
              "from": "SW1",
              "to": "A",
              "label": "G0/0"
            },
            {
              "from": "SW1",
              "to": "B",
              "label": "G0/0"
            }
          ]
        },
        "explanation": "With A's priority set to 0 it can never become DR or BDR, so among the default-priority routers B, C, and D, router D (highest router ID, 3.3.3.3) is elected DR and B (next-highest router ID, 2.2.2.2) is elected BDR; because OSPF elections are non-preemptive, if D later fails, B is promoted to DR rather than any router whose priority is changed afterward."
      },
      {
        "type": "match",
        "q": "Match each OSPF packet type to how it is used by a router. (Not all options are used.)",
        "options": [],
        "correct": -1,
        "pairs": [
          [
            "link-state request packet",
            "query another router for additional information"
          ],
          [
            "hello packet",
            "establish and maintain adjacencies"
          ],
          [
            "database description packet",
            "compare local topology to that sent by another router"
          ],
          [
            "link-state update packet",
            "advertise new information"
          ]
        ],
        "code": "",
        "diagram": null,
        "explanation": "OSPF's hello packet establishes and maintains adjacencies, the database description packet lets a router compare its local topology to a neighbor's, the link-state request packet queries a neighbor for additional or more recent link-state information, and the link-state update packet advertises new information; the link-state acknowledgment packet is the unused fifth type."
      }
    ]
  },
  {
    "n": "Network Security",
    "c": "Modules 3-5",
    "intro": "Modules 3-5 cover the two big pillars of ENSA security: understanding who attacks networks and how (malware, reconnaissance, DoS/DDoS, MITM, social engineering), and the CIA-triad tools used to defend against them (encryption, hashing, authentication). Then it pivots hard into Access Control Lists — the everyday tool for actually enforcing traffic policy on a router. Expect heavy ACL math: wildcard masks, ACE ordering, and deciding where standard vs. extended lists belong.",
    "concepts": [
      "Threat actor motivation drives the label: cybercriminals want money, hacktivists want to make a political/social statement, state-sponsored actors serve national interests — same skills, different goal.",
      "The CIA triad plus authentication and non-repudiation define 'secure communications': confidentiality comes from encryption, integrity comes from hashing (MD5/SHA), availability comes from redundancy/uptime.",
      "Symmetric crypto uses one shared secret key for both directions (fast, but distributing the key safely is the hard part); asymmetric crypto uses a mathematically linked public/private key pair — whichever key encrypts, only its partner key can decrypt.",
      "ACLs process entries top-down and stop at the first match, with an invisible 'deny all' automatically appended at the very end — so ACE order and an explicit trailing 'permit any' completely change what actually gets through.",
      "A wildcard mask is the inverse logic of a subnet mask: a 0 bit means 'must match exactly,' a 1 bit means 'don't care' — most ACL scenario questions are just subnetting problems wearing a different hat.",
      "Standard ACLs can only filter on source IP address, so best practice puts them close to the destination (to avoid accidentally blocking that source from reaching other legitimate places); extended ACLs filter source, destination, protocol, and port, so best practice puts them close to the source (to drop unwanted traffic as early as possible).",
      "Named ACLs (and sequence-numbered entries generally) allow inserting or deleting one ACE without rebuilding the whole list; a plain numbered ACL without sequence numbers usually forces a full delete-and-recreate.",
      "Malware types are distinguished by behavior: a virus needs a host file and user action to run, a worm self-replicates and spreads across the network on its own, a Trojan hides malicious code inside something that looks legitimate, and a botnet is an army of remote-controlled 'zombie' hosts used for coordinated attacks like DDoS."
    ],
    "f": [
      "DDoS = many sources flooding one target simultaneously, usually via a botnet of zombie hosts",
      "Buffer overflow = writing more data into a memory location than it was sized to hold",
      "Confidentiality->encryption, Integrity->hashing (MD5/SHA), Availability->redundancy/uptime",
      "Symmetric encryption = one shared secret key; asymmetric = public/private key pair, either key encrypts, only its pair decrypts",
      "Standard ACL = filters source IP only, numbered 1-99 or 1300-1999, best placed close to the destination",
      "Extended ACL = filters source + destination + protocol + port, numbered 100-199 or 2000-2699, best placed close to the source",
      "Every ACL ends with an implicit 'deny all' -- add an explicit 'permit any' if anything else should get through",
      "Wildcard mask logic is inverted from a subnet mask: 0 = must match, 1 = don't care",
      "'host' keyword = wildcard 0.0.0.0 (exactly one address); 'any' keyword = wildcard 255.255.255.255 (every address)",
      "'established' keyword lets return traffic of an existing TCP session back in without opening the door to new inbound connections",
      "access-class applies an ACL to vty lines; ip access-group applies an ACL to a physical/logical interface",
      "SYN flood = attacker sends a stream of TCP SYNs (often spoofed) to exhaust a target with half-open connections",
      "DNS cache poisoning redirects users via falsified DNS records; a rogue DHCP server can hand out a fake gateway/DNS to set up a MITM",
      "IPS can actively drop malicious packets inline; an IDS can only detect and alert",
      "'no access-list <num>' removes an entire numbered ACL from running-config; a named/sequenced ACL lets you delete just one ACE by its sequence number",
      "Worm spreads itself across the network unaided; virus needs a host file plus user action; Trojan hides inside legitimate-looking software"
    ],
    "q": [
      {
        "type": "mc",
        "q": "The IT department reports that a company web server is receiving an abnormally high number of web page requests from different locations simultaneously. Which type of security attack is occurring?",
        "options": [
          "adware",
          "DDoS",
          "phishing",
          "spyware"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A DDoS attack floods a target with traffic from many simultaneous sources (often a botnet), overwhelming its ability to serve legitimate requests."
      },
      {
        "type": "mc",
        "q": "What causes a buffer overflow?",
        "options": [
          "attempting to write more data to a memory location than that location can hold",
          "sending too much information to two or more interfaces of the same device, causing dropped packets",
          "sending repeated connections such as Telnet to a device, denying other data sources",
          "downloading and installing too many software updates at one time"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A buffer overflow happens when a program writes more data into a fixed-size buffer than it was allocated, corrupting adjacent memory and potentially letting an attacker run code."
      },
      {
        "type": "mc",
        "q": "Which objective of secure communications is achieved by encrypting data?",
        "options": [
          "authentication",
          "availability",
          "confidentiality",
          "integrity"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Encryption scrambles data so only authorized parties holding the key can read it — that's the definition of confidentiality."
      },
      {
        "type": "mc",
        "q": "What type of malware has the primary objective of spreading across the network?",
        "options": [
          "worm",
          "virus",
          "Trojan horse",
          "botnet"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A worm is self-replicating code that spreads across networks on its own, unlike a virus (needs a host file) or a Trojan (needs a user to run it)."
      },
      {
        "type": "mc",
        "q": "What commonly motivates cybercriminals to attack networks as compared to hacktivists or state-sponsored hackers?",
        "options": [
          "financial gain",
          "fame seeking",
          "status among peers",
          "political reasons"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Cybercriminals are primarily driven by profit, while hacktivists act on political/social causes and state-sponsored hackers serve national interests."
      },
      {
        "type": "mc",
        "q": "Which type of hacker is motivated to protest against political and social issues?",
        "options": [
          "hacktivist",
          "cybercriminal",
          "script kiddie",
          "vulnerability broker"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Hacktivists use hacking as a form of protest to advance political or social causes, unlike cybercriminals who chase money."
      },
      {
        "type": "mc",
        "q": "What is a ping sweep?",
        "options": [
          "a query and response protocol that identifies domain information",
          "a scanning technique that examines a range of TCP or UDP ports on a host",
          "a software application that captures all packets sent across a LAN",
          "a network scanning technique that indicates the live hosts in a range of IP addresses"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A ping sweep sends ICMP echo requests across a range of addresses to discover which hosts are alive — a common reconnaissance step."
      },
      {
        "type": "mc",
        "q": "In what type of attack is a cybercriminal attempting to prevent legitimate users from accessing network services?",
        "options": [
          "address spoofing",
          "MITM",
          "session hijacking",
          "DoS"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A denial-of-service attack's specific goal is making a service unavailable to its legitimate users."
      },
      {
        "type": "mc",
        "q": "Which requirement of secure communications is ensured by the implementation of MD5 or SHA hash generating algorithms?",
        "options": [
          "nonrepudiation",
          "authentication",
          "integrity",
          "confidentiality"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Hash algorithms produce a fixed-size digest that changes if the data changes, proving the data wasn't altered — that's integrity."
      },
      {
        "type": "mc",
        "q": "If an asymmetric algorithm uses a public key to encrypt data, what is used to decrypt it?",
        "options": [
          "a digital certificate",
          "a different public key",
          "a private key",
          "DH"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Asymmetric cryptography uses a mathematically linked key pair; whichever key encrypts, only its complementary partner key can decrypt."
      },
      {
        "type": "mc",
        "q": "Which two ACLs would permit only the two LAN networks attached to R1 to access the network connected to R2's G0/1 interface? (Choose two.)",
        "options": [
          "access-list 1 permit 192.168.10.0 0.0.0.127, and access-list 5 permit 192.168.10.0 0.0.0.63 / access-list 5 permit 192.168.10.64 0.0.0.63",
          "access-list 2 permit host 192.168.10.9 and access-list 2 permit host 192.168.10.69",
          "access-list 3 permit 192.168.10.128 0.0.0.63",
          "access-list 4 permit 192.168.10.0 0.0.0.255"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "ACL 1's wildcard 0.0.0.127 summarizes both LAN /26 subnets in one range, and ACL 5's two lines cover the same two subnets individually — both correctly match only the two R1 LANs."
      },
      {
        "type": "mc",
        "q": "Which two packet filters could a network administrator use on an IPv4 extended ACL? (Choose two.)",
        "options": [
          "destination UDP port number and ICMP message type",
          "computer type and destination MAC address",
          "destination MAC address and source TCP hello address",
          "computer type and source TCP hello address"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Extended ACLs can match Layer 3/4 fields such as protocol, IP addresses, TCP/UDP ports, and ICMP message type — not Layer 2 MAC addresses."
      },
      {
        "type": "mc",
        "q": "What type of ACL offers greater flexibility and control over network access?",
        "options": [
          "numbered standard",
          "named standard",
          "extended",
          "flexible"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Extended ACLs filter on source, destination, protocol, and port, giving far more granular control than standard ACLs."
      },
      {
        "type": "mc",
        "q": "What is the quickest way to remove a single ACE from a named ACL?",
        "options": [
          "Use the no keyword and the sequence number of the ACE to be removed",
          "Copy the ACL into a text editor, remove the ACE, then copy it back",
          "Create a new ACL with a different number and apply it to the interface",
          "Use no access-list to remove the entire ACL, then recreate it without the ACE"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Named (and sequence-numbered) ACLs let you delete one entry with 'no <sequence-number>' without rebuilding the whole list."
      },
      {
        "type": "mc",
        "q": "A network administrator is configuring a standard IPv4 ACL. What is the effect after the command no access-list 10 is entered?",
        "options": [
          "ACL 10 is removed from both the running configuration and the interface",
          "ACL 10 is removed from the running configuration",
          "ACL 10 is disabled on the interface only",
          "ACL 10 will be disabled and removed after the router restarts"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "no access-list 10 deletes the ACL from the running configuration immediately."
      },
      {
        "type": "mc",
        "q": "Users on the 172.31.1.0/24 network cannot forward traffic through router CiscoVille even though ACL 9 looks correct. What is the most likely cause of the traffic failure?",
        "options": [
          "The established keyword is not specified",
          "The sequence of the ACEs is incorrect",
          "The port number for the traffic has not been identified with the eq keyword",
          "The permit statement specifies an incorrect wildcard mask"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "ACL entries are processed top-down; a broader deny listed before a more specific permit matches first, so the permit never gets evaluated."
      },
      {
        "type": "mc",
        "q": "A network administrator needs a standard ACL so that only workstation 192.168.15.23 can access the router's virtual terminal. Which two configuration commands achieve this? (Choose two.)",
        "options": [
          "access-list 10 permit 192.168.15.23 0.0.0.0, or equivalently access-list 10 permit host 192.168.15.23",
          "access-list 10 permit 192.168.15.23 0.0.0.255",
          "access-list 10 permit 192.168.15.23 255.255.255.255",
          "access-list 10 permit 192.168.15.23 255.255.255.0"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A wildcard mask of 0.0.0.0 matches only the exact address, and the 'host' keyword is shorthand for that exact same wildcard mask."
      },
      {
        "type": "mc",
        "q": "Which command would be used in a standard ACL to allow only devices on the network attached to R2's G0/0 interface to access the networks attached to R1?",
        "options": [
          "access-list 1 permit 192.168.10.128 0.0.0.63",
          "access-list 1 permit 192.168.10.0 0.0.0.255",
          "access-list 1 permit 192.168.10.96 0.0.0.31",
          "access-list 1 permit 192.168.10.0 0.0.0.63"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The wildcard mask 0.0.0.31 matches a /27 subnet, which is the exact network attached to R2's G0/0 interface in this topology."
      },
      {
        "type": "mc",
        "q": "A network administrator is writing a standard ACL that will deny traffic from 172.16.0.0/16 but permit all other traffic. Which two commands should be used? (Choose two.)",
        "options": [
          "access-list 95 deny 172.16.0.0 0.0.255.255, followed by access-list 95 permit any",
          "access-list 95 deny 172.16.0.0 255.255.0.0, followed by access-list 95 deny any",
          "access-list 95 host 172.16.0.0, followed by access-list 95 permit any",
          "access-list 95 172.16.0.0 255.255.255.255, followed by access-list 95 deny any"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "ACLs need a wildcard mask (0.0.255.255), not a subnet mask, and because of the implicit deny-all at the end, an explicit permit any must be added to let other traffic through."
      },
      {
        "type": "mc",
        "q": "An ACL denying subnet 172.16.4.0/24 into 172.16.3.0/24, with all other traffic meant to be permitted, was applied outbound on Fa0/0. Which conclusion can be drawn?",
        "options": [
          "The ACL should be applied outbound on all interfaces of R1",
          "The ACL should be applied inbound on Fa0/0 instead",
          "All traffic will be blocked, not just traffic from 172.16.4.0/24",
          "An extended ACL must be used in this situation"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A standard ACL only matches source address; without an explicit permit any at the end, the implicit deny blocks everything, not just the intended subnet."
      },
      {
        "type": "mc",
        "q": "The TRAFFIC-CONTROL ACL already contains the entry '10 permit ip 172.23.0.0 0.0.255.255 any' at sequence 10. A network administrator needs to add a new ACE that denies IP traffic from subnet 172.23.16.0/20 before that broader permit statement is reached. Which ACE will meet this requirement?",
        "options": [
          "30 deny 172.23.16.0 0.0.15.255",
          "15 deny 172.23.16.0 0.0.15.255",
          "5 deny 172.23.16.0 0.0.15.255",
          "5 deny 172.23.16.0 0.0.255.255"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The wildcard 0.0.15.255 correctly matches a /20, and the new deny needs a sequence number lower than 10 (i.e., 5) so it is evaluated before the existing broader permit statement; sequence numbers 15 or 30 would place it after that permit, where it would never be reached."
      },
      {
        "type": "mc",
        "q": "A network administrator configures an extended ACL. Which statement describes the result: an ACE permits TCP port 22 from 192.168.25.18 to 172.16.45.16?",
        "options": [
          "An SSH connection is allowed from 172.16.45.16 to 192.168.25.18",
          "An SSH connection is allowed from 192.168.25.18 to 172.16.45.16",
          "A Telnet connection is allowed from 192.168.25.18 to 172.16.45.16",
          "A Telnet connection is allowed from 172.16.45.16 to 192.168.25.18"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "In an extended ACL, the first address is the source and the second is the destination; TCP port 22 identifies SSH traffic."
      },
      {
        "type": "mc",
        "q": "Refer to the show access-lists output: there are zero matches shown for the ACE denying Telnet from 10.35.80.22 to 10.23.77.101. What can be determined from this output?",
        "options": [
          "The ACL is missing the deny ip any any ACE",
          "The ACL is only monitoring traffic destined for 10.23.77.101 from three specific hosts",
          "Because there are no matches for that line, the ACL is not working",
          "The router has not had any Telnet packets from 10.35.80.22 destined for 10.23.77.101"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A zero match counter on an ACE simply means no traffic has yet matched that specific entry — it doesn't mean the ACL is broken."
      },
      {
        "type": "mc",
        "q": "A network administrator wants to permit only host 192.168.1.1 to access server 192.168.2.1 using ACL best placement practices. Which three commands achieve this? (Choose three.)",
        "options": [
          "interface fastethernet 0/0, then access-list 101 permit ip host 192.168.1.1 host 192.168.2.1, then ip access-group 101 in",
          "interface fastethernet 0/1, then access-list 101 permit ip host 192.168.1.1 host 192.168.2.1, then ip access-group 101 out",
          "interface fastethernet 0/0, then access-list 101 permit ip 192.168.1.0 255.255.255.0 192.168.2.0 255.255.255.0, then ip access-group 101 in",
          "interface fastethernet 0/0, then access-list 101 permit ip any any, then ip access-group 101 in"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Extended ACLs go closest to the source, so it's applied inbound on the interface facing the source host, using the host keyword to match the single source and destination address exactly."
      },
      {
        "type": "mc",
        "q": "An access list is applied inbound on a router Gigabit Ethernet port with IP 192.168.10.254 (permit host 192.168.10.1 any; deny icmp 192.168.10.0 0.0.0.255 any echo; permit ip any any). Which two actions result? (Choose two.)",
        "options": [
          "A Telnet or SSH session is allowed from any device on 192.168.10.0/24 into the router, and devices on 192.168.10.0/24 are allowed to reply to ping requests",
          "Only Layer 3 connections are allowed from the router to other devices, and devices on 192.168.10.0/24 are not allowed to reply to pings",
          "Only 192.168.10.1 is allowed to access the router, and devices on 192.168.10.0/24 can ping the 192.168.11.0 network",
          "Devices on 192.168.10.0/24 are not allowed to reply to pings, and only 192.168.10.1 is allowed to access the router"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The host ACE permits management access from 192.168.10.1, the ICMP ACE blocks echo requests (not replies) from the subnet, and the final permit ip any any allows everything else, including Telnet/SSH and ping replies."
      },
      {
        "type": "mc",
        "q": "The named ACL 'Managers' already exists on the router. What happens when the network administrator issues more ACE configuration commands under the same ACL name?",
        "options": [
          "The commands are added at the end of the existing Managers ACL",
          "The commands overwrite the existing Managers ACL",
          "The commands are added at the beginning of the existing Managers ACL",
          "An error is generated stating the ACL already exists"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Entering configuration commands inside an existing named ACL appends new ACEs to the bottom of the list unless a sequence number is specified."
      },
      {
        "type": "mc",
        "q": "In which TCP attack is the cybercriminal attempting to overwhelm a target host with half-open TCP connections?",
        "options": [
          "port scan attack",
          "SYN flood attack",
          "session hijacking attack",
          "reset attack"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A SYN flood sends a barrage of TCP SYNs (often spoofed) and never completes the handshake, exhausting the target's connection table with half-open sessions."
      },
      {
        "type": "mc",
        "q": "Which protocol is attacked when a cybercriminal provides an invalid gateway to create a man-in-the-middle attack?",
        "options": [
          "DHCP",
          "DNS",
          "ICMP",
          "HTTP or HTTPS"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A rogue DHCP server can hand out a bogus default gateway (or DNS server), routing victim traffic through the attacker — a DHCP spoofing MITM attack."
      },
      {
        "type": "mc",
        "q": "A standard ACL is applied outbound on serial 0/0/0. What happens to traffic not matching any of the ACL statements?",
        "options": [
          "The traffic is dropped",
          "The source IP is checked; if no match, it's routed out serial 0/0/1",
          "The resulting action is determined by the destination IP",
          "The action is determined by the destination IP and port"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Every ACL ends with an implicit deny all; any packet that doesn't match a preceding permit statement is dropped."
      },
      {
        "type": "mc",
        "q": "PCs on VLAN 10 should print to P1 on VLAN 12, while PCs on VLAN 20 must be blocked from that same printer. Where should the standard ACL be placed? (Choose two: both the interface and the direction.)",
        "options": [
          "Apply the ACL outbound on R1 Gi0/1.12",
          "Apply the ACL inbound on R2 S0/0/1",
          "Apply the ACL outbound on R1 S0/0/0",
          "Apply the ACL inbound on R2 Gi0/1.20"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Standard ACLs can only filter by source, so best practice places them close to the destination — outbound on the sub-interface leading to the P1 printer's VLAN."
      },
      {
        "type": "mc",
        "q": "Which statement describes a characteristic of standard IPv4 ACLs?",
        "options": [
          "They are configured only in interface configuration mode",
          "They filter traffic based on source address and source port",
          "They can be created with a number but not a name",
          "They filter traffic based on source IP addresses only"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Standard ACLs only look at the source IP address, which is why they're placed close to the destination to avoid over-blocking."
      },
      {
        "type": "mc",
        "q": "What is considered a best practice when configuring ACLs on vty lines?",
        "options": [
          "Place identical restrictions on all vty lines",
          "Remove the vty password since the ACL restricts access",
          "Apply the ip access-group command inbound instead of access-class",
          "Use only extended access lists on vty lines"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Because a user could connect on any vty line, applying the same access-class restriction to every line prevents an attacker from simply trying a different line number."
      },
      {
        "type": "mc",
        "q": "An extended ACL currently contains '10 permit icmp any any' and '20 permit tcp any any eq 23'. An administrator removes line 20, adds a new line 5 permitting TCP port 22 (SSH), and adds a new line 20 denying all UDP traffic. Which two conclusions can be drawn? (Choose two.)",
        "options": [
          "Ping and SSH packets will both be permitted",
          "TFTP and Telnet packets will both be permitted",
          "All TCP and UDP packets will be denied",
          "Telnet packets will be permitted but ping packets will be denied"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Line 10 (the ICMP permit) is untouched by the edit, so ping is still allowed, and the new line 5 explicitly permits SSH; Telnet's old permit was deleted and replaced with a UDP deny, but that doesn't change the ping/SSH outcome."
      },
      {
        "type": "mc",
        "q": "Which two ACEs allow all users on 192.168.10.0/24 to access a web server at 172.17.80.1 but prevent Telnet? (Choose two.)",
        "options": [
          "permit tcp 192.168.10.0 0.0.0.255 host 172.17.80.1 eq 80, then deny tcp 192.168.10.0 0.0.0.255 any eq 23",
          "deny tcp host 192.168.10.0 any eq 23, then permit tcp host 192.168.10.1 eq 80",
          "permit 192.168.10.0 0.0.0.255 host 172.17.80.1, then deny tcp 192.168.10.0 0.0.0.255 any eq telnet",
          "permit tcp 192.168.10.0 0.0.0.255 any eq 80, then deny tcp 192.168.10.0 0.0.0.255 any eq 23"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The permit line needs protocol tcp, the correctly wildcard-masked source, the specific destination host, and eq 80 for HTTP; the deny line then blocks Telnet from the same source afterward since ACL order matters."
      },
      {
        "type": "mc",
        "q": "What is the term used to describe a mechanism that takes advantage of a vulnerability?",
        "options": [
          "exploit",
          "threat",
          "mitigation",
          "risk"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "An exploit is the tool or technique used to take advantage of a vulnerability; the vulnerability is the weakness itself, and a threat is the potential danger."
      },
      {
        "type": "mc",
        "q": "A network administrator at 192.168.11.10 needs to manage router R1 remotely. What is the best ACL type and placement?",
        "options": [
          "extended ACL outbound on R2's WAN interface toward the internet",
          "standard ACL inbound on R1's vty lines",
          "extended ACLs inbound on R1's G0/0 and G0/1",
          "extended ACL outbound on R2's S0/0/1"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Management access is controlled by filtering on source address applied to the vty lines themselves — a standard ACL is sufficient and simplest here."
      },
      {
        "type": "mc",
        "q": "When would a technician use the 'any' configuration keyword in an ACL?",
        "options": [
          "to add a text entry for documentation purposes",
          "to generate an informational message when the ACE is matched",
          "to identify any IP address",
          "to identify one specific IP address"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The 'any' keyword is shorthand for an address of 0.0.0.0 with wildcard mask 255.255.255.255 — matching every possible address."
      },
      {
        "type": "mc",
        "q": "Which statement accurately characterizes the evolution of threats to network security?",
        "options": [
          "Internet architects planned for security from the very beginning",
          "Early users of the internet often engaged in harmful activities",
          "Internal threats can cause even greater damage than external threats",
          "Threats have become less sophisticated while attacker knowledge has grown"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Insiders already have legitimate access and knowledge of the network, so a malicious or careless employee can often do more damage than an outside attacker who first has to break in."
      },
      {
        "type": "mc",
        "q": "A user receives a phone call requesting confirmation of a username and password for a supposed audit. Which security threat does this describe?",
        "options": [
          "spam",
          "social engineering",
          "DDoS",
          "keylogging"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "This is a pretexting/social engineering tactic — manipulating a person into voluntarily giving up credentials by impersonating legitimate authority."
      },
      {
        "type": "mc",
        "q": "In what way are zombies used in security attacks?",
        "options": [
          "They target individuals to gather personal or corporate information",
          "They probe a group of machines for open ports",
          "They are malicious code segments that replace legitimate applications",
          "They are infected machines that carry out a DDoS attack"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Zombies are compromised hosts under an attacker's remote control, assembled into a botnet and directed to flood a target simultaneously — a DDoS attack."
      },
      {
        "type": "mc",
        "q": "Which attack involves threat actors positioning themselves between a source and destination to transparently monitor, capture, and control the communication?",
        "options": [
          "man-in-the-middle attack",
          "SYN flood attack",
          "DoS attack",
          "ICMP attack"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "By definition, a man-in-the-middle attack inserts the attacker's system into the communication path between two legitimate parties."
      },
      {
        "type": "mc",
        "q": "Which two keywords can be used in an ACL to replace a wildcard mask or an address-and-wildcard-mask pair? (Choose two.)",
        "options": [
          "host and any",
          "most and all",
          "gt and some",
          "all and gt"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "'host' is shorthand for a /32 wildcard mask (0.0.0.0) matching one address, and 'any' is shorthand for matching every address (wildcard 255.255.255.255)."
      },
      {
        "type": "mc",
        "q": "Which statement describes a difference between the operation of inbound and outbound ACLs?",
        "options": [
          "Inbound ACLs are processed before packets are routed, while outbound ACLs are processed after routing is completed",
          "Inbound ACLs can filter on multiple criteria while outbound ACLs cannot",
          "More than one inbound ACL can be configured on an interface but only one outbound ACL",
          "Inbound ACLs can be used on routers and switches but outbound ACLs only on routers"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Inbound ACLs are checked immediately as packets arrive, before a routing lookup; outbound ACLs are checked only after the router has already chosen the exit interface."
      },
      {
        "type": "mc",
        "q": "What effect would the command permit tcp 172.16.4.0 0.0.0.255 any eq www have when implemented inbound on the f0/0 interface?",
        "options": [
          "All TCP traffic is permitted, and all other traffic is denied",
          "Traffic originating from 172.16.4.0/24 is permitted to all TCP port 80 destinations",
          "All traffic from 172.16.4.0/24 is permitted anywhere on any port",
          "The command is rejected by the router because it is incomplete"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The source is the /24 network, the destination is 'any', and 'eq www' restricts the match to TCP port 80 (HTTP) traffic only."
      },
      {
        "type": "mc",
        "q": "Which ACE will permit a packet that originates from any network and is destined for a web server at 192.168.1.1?",
        "options": [
          "access-list 101 permit tcp any host 192.168.1.1 eq 80",
          "access-list 101 permit tcp host 192.168.1.1 eq 80 any",
          "access-list 101 permit tcp host 192.168.1.1 any eq 80",
          "access-list 101 permit tcp any eq 80 host 192.168.1.1"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "In an extended ACL the order is always protocol, source, destination, then port — source any, destination host 192.168.1.1, eq 80 for the web server."
      },
      {
        "type": "mc",
        "q": "A new policy requires an ACL denying FTP and Telnet access to a Corp file server from all interns, but after implementing it, no one in the Corp network can access any of the servers. What is the problem?",
        "options": [
          "Inbound ACLs must be routed before they are processed",
          "The ACL is implicitly denying access to all the servers",
          "Named ACLs require the use of port numbers",
          "The ACL is applied to the interface using the wrong direction"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Because the ACL only contained deny statements for FTP/Telnet from interns, the implicit deny-all at the end blocked every other host and server too — a permit statement for the rest of the traffic was missing."
      },
      {
        "type": "mc",
        "q": "When would a technician use the access-class 20 in configuration command?",
        "options": [
          "to secure administrative access to the router",
          "to remove an ACL from an interface",
          "to remove a configured ACL entirely",
          "to apply a standard ACL to a physical interface"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The access-class command applies a standard ACL to the vty lines to control who is allowed to open a remote management session."
      },
      {
        "type": "mc",
        "q": "What is the term used to describe the same pre-shared key, known by both sender and receiver, used to encrypt and decrypt data?",
        "options": [
          "symmetric encryption algorithm",
          "data integrity",
          "exploit",
          "risk"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Symmetric algorithms use one shared secret key for both encrypting and decrypting, unlike asymmetric algorithms which use a public/private key pair."
      },
      {
        "type": "mc",
        "q": "An employee's internet privileges have been revoked because of abuse but the employee still needs access to company resources. What is the best ACL type and placement?",
        "options": [
          "standard ACL inbound on R2's WAN interface connecting to the internet",
          "standard ACL outbound on R2's WAN interface towards the internet",
          "standard ACL inbound on R1's G0/0",
          "standard ACL outbound on R1's G0/0"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Filtering only that user's source address as it leaves the network toward the internet blocks internet access while leaving internal resource access untouched; standard ACLs are placed close to the destination."
      },
      {
        "type": "mc",
        "q": "A student on H1 keeps launching extended pings at a student on H2. The administrator wants to stop this but still allow both students access to web-based assignments. What is the best plan?",
        "options": [
          "Apply an inbound extended ACL on R1 Gi0/0",
          "Apply an inbound standard ACL on R1 Gi0/0",
          "Apply an inbound extended ACL on R2 Gi0/1",
          "Apply an outbound extended ACL on R1 S0/0/1"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Blocking ICMP specifically (but not HTTP) requires an extended ACL, applied inbound on R1's interface closest to H1, the source of the unwanted ping traffic."
      },
      {
        "type": "mc",
        "q": "When would a technician use the ip access-group 101 in configuration command?",
        "options": [
          "to apply an extended ACL to an interface",
          "to secure management traffic into the router",
          "to secure administrative access to the router",
          "to display all restricted traffic"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The ip access-group command binds a numbered or named ACL to an interface in a given direction; number 101 falls in the extended ACL range (100-199)."
      },
      {
        "type": "mc",
        "q": "In which type of attack is falsified information used to redirect users to malicious internet sites?",
        "options": [
          "DNS amplification and reflection",
          "ARP cache poisoning",
          "DNS cache poisoning",
          "domain generation"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "DNS cache poisoning inserts fake DNS records into a resolver's cache so legitimate domain names resolve to attacker-controlled IP addresses."
      },
      {
        "type": "mc",
        "q": "What is a feature of an IPS?",
        "options": [
          "It can stop malicious packets",
          "It is deployed in offline mode only",
          "It has no impact on network latency",
          "It is primarily focused on identifying possible incidents, not stopping them"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Unlike an IDS, which only monitors and alerts, an IPS sits inline and can actively drop or block malicious traffic in real time."
      },
      {
        "type": "mc",
        "q": "What is the term used to describe a potential danger to a company's assets, data, or network functionality?",
        "options": [
          "vulnerability",
          "threat",
          "asset",
          "exploit"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A threat is the potential for harm; a vulnerability is the weakness that makes the harm possible, and an exploit is what actually takes advantage of it."
      },
      {
        "type": "mc",
        "q": "Network 192.168.30.0/24 contains all the company servers. Policy dictates that traffic from the servers to networks 192.168.10.0 and 192.168.11.0 be limited to replies for original requests. What is the best ACL type and placement?",
        "options": [
          "extended ACL inbound on R3 G0/0",
          "extended ACL inbound on R1 G0/0",
          "standard ACL inbound on R1 G0/1",
          "standard ACL inbound on R1 vty lines"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The traffic being restricted (via the established keyword, replies only) originates from the servers, so best practice places an extended ACL as close to that source as possible — inbound on R3's interface facing the server LAN."
      },
      {
        "type": "mc",
        "q": "What does the CLI prompt change to after entering ip access-list standard aaa from global configuration mode?",
        "options": [
          "Router(config-line)#",
          "Router(config-std-nacl)#",
          "Router(config)#",
          "Router(config-router)#"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Entering 'ip access-list standard <name>' moves you into named-standard-ACL configuration submode, shown as the config-std-nacl prompt."
      },
      {
        "type": "mc",
        "q": "Employees are wasting company time accessing social media on their work computers. What is the best ACL type and placement to stop this?",
        "options": [
          "extended ACL outbound on R2's WAN interface towards the internet",
          "standard ACL outbound on R2's WAN interface towards the internet",
          "standard ACL outbound on R2's S0/0/0",
          "extended ACLs inbound on R1's G0/0 and G0/1"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Blocking specific websites/ports requires an extended ACL, and because employees connect from two separate LANs on R1, it must be applied inbound on both R1 interfaces to catch all of them close to the source."
      },
      {
        "type": "mc",
        "q": "When would a technician use the 40 deny host 192.168.23.8 configuration command?",
        "options": [
          "to remove all ACLs from the router",
          "to create an entry in a numbered ACL",
          "to apply an ACL to all router interfaces",
          "to secure administrative access to the router"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A line consisting of a sequence number, action, and address is exactly the syntax for adding one access control entry (ACE) inside a numbered ACL."
      },
      {
        "type": "mc",
        "q": "What is the best description of Trojan horse malware?",
        "options": [
          "It is malware that can only be distributed over the internet",
          "It appears as useful software but hides malicious code",
          "It is software that causes annoying but not fatal computer problems",
          "It is the most easily detected form of malware"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A Trojan disguises itself as a legitimate, desirable program to trick the user into installing it, then carries out hidden malicious functions."
      },
      {
        "type": "mc",
        "q": "What wildcard mask will match networks 172.16.0.0 through 172.19.0.0?",
        "options": [
          "0.0.3.255",
          "0.252.255.255",
          "0.3.255.255",
          "0.0.255.255"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "172.16 through 172.19 share the top 14 bits of the address; a wildcard letting the remaining bits vary while matching only those four networks is 0.3.255.255."
      },
      {
        "type": "mc",
        "q": "What is the term used to describe gray hat hackers who publicly protest organizations or governments by posting articles, leaking sensitive information, and performing network attacks?",
        "options": [
          "white hat hackers",
          "grey hat hackers",
          "hacktivists",
          "state-sponsored hackers"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Hacktivists use their hacking skills to publicize a political or social message, often through leaks, defacements, or disruptive attacks, placing them in the 'gray hat' category."
      },
      {
        "type": "mc",
        "q": "When would a technician use the no ip access-list 101 configuration command?",
        "options": [
          "to apply an ACL to all router interfaces",
          "to secure administrative access to the router",
          "to remove a configured ACL",
          "to display all restricted traffic"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The 'no' form of the access-list command deletes that entire ACL from the running configuration."
      },
      {
        "type": "mc",
        "q": "What is the term used to describe unethical criminals who compromise computer and network security for personal gain or malicious reasons?",
        "options": [
          "hacktivists",
          "vulnerability broker",
          "black hat hackers",
          "script kiddies"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Black hat hackers violate computer security for personal gain or malice, distinguishing them from white hats (authorized) and gray hats (ambiguous ethics)."
      },
      {
        "type": "mc",
        "q": "What is the term used to describe a guarantee that a message is not a forgery and does actually come from whoever it states?",
        "options": [
          "origin authentication",
          "mitigation",
          "exploit",
          "data non-repudiation"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Origin authentication verifies that a message genuinely came from the claimed sender, typically through digital signatures or HMACs."
      },
      {
        "type": "mc",
        "q": "When would a technician use the remark configuration command in an ACL?",
        "options": [
          "to generate and send an informational message whenever the ACE is matched",
          "to add a text entry for documentation purposes",
          "to identify one specific IP address",
          "to restrict specific traffic access through an interface"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The remark keyword lets an administrator embed a plain-text comment inside an ACL to document its purpose, with no effect on traffic filtering."
      },
      {
        "type": "mc",
        "q": "The company CEO demands that one ACL permit email traffic to the internet and deny FTP access. What is the best ACL type and placement?",
        "options": [
          "extended ACL outbound on R2's WAN interface towards the internet",
          "standard ACL outbound on R2's S0/0/0",
          "extended ACL inbound on R2's S0/0/0",
          "standard ACL inbound on R2's WAN interface connecting to the internet"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Filtering by application (email vs. FTP ports) requires an extended ACL, and placing it outbound at the single internet exit point inspects all users' traffic in one place."
      },
      {
        "type": "mc",
        "q": "When would a technician use the established configuration option in an ACL?",
        "options": [
          "to add a text entry for documentation purposes",
          "to display all restricted traffic",
          "to allow specified traffic through an interface",
          "to allow returning reply traffic to enter the internal network"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The established keyword matches TCP segments that are part of an existing session (ACK/RST set), letting return traffic back in without opening a permanent hole for new inbound connections."
      },
      {
        "type": "mc",
        "q": "When would a technician use the deny configuration keyword in an ACL?",
        "options": [
          "to identify one specific IP address",
          "to display all restricted traffic",
          "to restrict specific traffic access through an interface",
          "to generate an informational message whenever the ACE is matched"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The deny keyword in an ACE blocks packets matching its criteria from passing through the interface where the ACL is applied."
      },
      {
        "type": "mc",
        "q": "Only authorized remote users are allowed remote access to company server 192.168.30.10. What is the best ACL type and placement?",
        "options": [
          "extended ACLs inbound on R1's G0/0 and G0/1",
          "extended ACL outbound on R2's WAN interface towards the internet",
          "extended ACL inbound on R2's S0/0/0",
          "extended ACL inbound on R2's WAN interface connected to the internet"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Filtering by source address, destination server, and service/port requires an extended ACL, applied inbound where internet traffic first enters the network — closest to that traffic's source."
      },
      {
        "type": "mc",
        "q": "Employees on 192.168.11.0/24 work on critically sensitive information and are not allowed access off their own network. What is the best ACL type and placement?",
        "options": [
          "standard ACL inbound on R1's vty lines",
          "extended ACL inbound on R1's G0/0",
          "standard ACL inbound on R1's G0/1",
          "extended ACL inbound on R3's S0/0/1"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Blocking a whole subnet from going anywhere else only requires filtering on source address, so a standard ACL close to that subnet (inbound where it enters R1) is sufficient and simplest."
      },
      {
        "type": "mc",
        "q": "When would a technician use the host configuration keyword in an ACL?",
        "options": [
          "to add a text entry for documentation purposes",
          "to generate an informational message whenever the ACE is matched",
          "to identify any IP address",
          "to identify one specific IP address"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The host keyword is shorthand for a wildcard mask of 0.0.0.0, restricting a match to exactly one address."
      },
      {
        "type": "mc",
        "q": "The company has provided IP phones to employees on the 192.168.10.0/24 network and voice traffic needs priority over data traffic. What is the best ACL type and placement?",
        "options": [
          "extended ACL inbound on R1's G0/0",
          "extended ACL outbound on R2's WAN interface towards the internet",
          "extended ACL outbound on R2's S0/0/1",
          "extended ACLs inbound on R1's G0/0 and G0/1"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Identifying voice traffic for QoS prioritization requires an extended ACL, applied inbound closest to the phones' source LAN on R1."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Router R1 has two LAN networks attached to it. Which ACL would permit only those two LANs to reach the network that connects to the R2 G0/1 interface?",
        "options": [
          "access-list 1 permit 192.168.10.0 0.0.0.127",
          "access-list 2 permit host 192.168.10.9\naccess-list 2 permit host 192.168.10.69",
          "access-list 3 permit 192.168.10.128 0.0.0.63",
          "access-list 4 permit 192.168.10.0 0.0.0.255"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "LAN1",
              "label": "192.168.10.0/26",
              "kind": "cloud"
            },
            {
              "id": "LAN2",
              "label": "192.168.10.64/26",
              "kind": "cloud"
            },
            {
              "id": "R1",
              "label": "R1",
              "kind": "router"
            },
            {
              "id": "R2",
              "label": "R2",
              "kind": "router"
            },
            {
              "id": "NET",
              "label": "Net @ G0/1",
              "kind": "cloud"
            }
          ],
          "links": [
            {
              "from": "LAN1",
              "to": "R1"
            },
            {
              "from": "LAN2",
              "to": "R1"
            },
            {
              "from": "R1",
              "to": "R2"
            },
            {
              "from": "R2",
              "to": "NET",
              "label": "G0/1"
            }
          ]
        },
        "explanation": "The wildcard mask 0.0.0.127 ignores the last 7 bits, matching the combined range 192.168.10.0-192.168.10.127, which is exactly the two /26 LANs attached to R1; the other choices match only two hosts, a different /26 not attached to R1, or over-include a third network."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. A network administrator has configured ACL 9 on router CiscoVille, but users on the 172.31.1.0/24 network still cannot forward traffic through the router even though an explicit permit exists for their network. What is the most likely cause of the traffic failure?",
        "options": [
          "The established keyword is not specified.",
          "The sequence of the ACEs is incorrect.",
          "The port number for the traffic has not been identified with the eq keyword.",
          "The permit statement specifies an incorrect wildcard mask."
        ],
        "correct": 1,
        "pairs": [],
        "code": "CiscoVille(config)# access-list 9 deny 172.31.0.0 0.0.255.255\nCiscoVille(config)# access-list 9 permit 172.31.1.0 0.0.0.255",
        "diagram": null,
        "explanation": "ACL statements are evaluated top-down, and because the broader deny for 172.31.0.0/16 appears before the more specific permit for 172.31.1.0/24, every packet from that subnet matches the deny first and is dropped, so the ACEs must be reordered with the specific permit above the broader deny."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. A network administrator configured the following extended ACL entry on a router. Which statement describes the result of this configuration?",
        "options": [
          "An SSH connection is allowed from a workstation with IP 172.16.45.16 to a device with IP 192.168.25.18.",
          "An SSH connection is allowed from a workstation with IP 192.168.25.18 to a device with IP 172.16.45.16.",
          "A Telnet connection is allowed from a workstation with IP 192.168.25.18 to a device with IP 172.16.45.16.",
          "A Telnet connection is allowed from a workstation with IP 172.16.45.16 to a device with IP 192.168.25.18."
        ],
        "correct": 1,
        "pairs": [],
        "code": "R1(config)# access-list 101 permit tcp host 192.168.25.18 host 172.16.45.16 eq 22",
        "diagram": null,
        "explanation": "In an extended ACL the first address after the protocol keyword is always the source and the second is the destination, and TCP port 22 is reserved for SSH (Telnet uses port 23), so this entry permits an SSH session from 192.168.25.18 to 172.16.45.16."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit, which shows the output of a show access-lists command for an ACL named MyACL. What can be determined from this output?",
        "options": [
          "The ACL is missing the deny ip any any ACE.",
          "The ACL is only monitoring traffic destined for 10.23.77.101 from three specific hosts.",
          "Because there are no matches for line 10, the ACL is not working.",
          "The router has not had any Telnet packets from 10.35.80.22 that are destined for 10.23.77.101."
        ],
        "correct": 3,
        "pairs": [],
        "code": "Router# show access-lists MyACL\nExtended IP access list MyACL\n    10 permit tcp host 10.35.80.22 host 10.23.77.101 eq telnet",
        "diagram": null,
        "explanation": "Cisco appends a \"(x matches)\" counter to an ACE only after it has matched traffic, so the absence of any match counter on line 10 simply means no Telnet packets from 10.35.80.22 to 10.23.77.101 have yet been seen, not that the ACL is broken."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. A network administrator wants to permit only host 192.168.1.1 to reach server 192.168.2.1, using extended-ACL best-placement practice. R2 connects to the host's network through FastEthernet 0/0 and to the server's network through FastEthernet 0/1. On which interface and in which direction should the ACL be applied?",
        "options": [
          "FastEthernet 0/0, inbound",
          "FastEthernet 0/0, outbound",
          "FastEthernet 0/1, inbound",
          "FastEthernet 0/1, outbound"
        ],
        "correct": 0,
        "pairs": [],
        "code": "R2(config)# access-list 101 permit ip host 192.168.1.1 host 192.168.2.1",
        "diagram": {
          "nodes": [
            {
              "id": "PC1",
              "label": "PC 192.168.1.1",
              "kind": "pc"
            },
            {
              "id": "R2",
              "label": "R2",
              "kind": "router"
            },
            {
              "id": "SRV",
              "label": "Server 192.168.2.1",
              "kind": "server"
            }
          ],
          "links": [
            {
              "from": "PC1",
              "to": "R2",
              "label": "Fa0/0"
            },
            {
              "from": "R2",
              "to": "SRV",
              "label": "Fa0/1"
            }
          ]
        },
        "explanation": "Extended ACLs should be placed as close to the traffic source as possible, so the ACL belongs inbound on R2's FastEthernet 0/0, the interface facing host 192.168.1.1, filtering the traffic immediately as it enters the router rather than after it has already crossed the network."
      },
      {
        "type": "mc",
        "q": "Consider the following access list applied inbound on a router Gigabit Ethernet port assigned IP address 192.168.10.254. Which action is a result of this configuration for devices on the 192.168.10.0/24 network?",
        "options": [
          "A Telnet or SSH session is allowed from any device on the 192.168.10.0 network into the router with this access list assigned.",
          "Only the network device assigned the IP address 192.168.10.1 is allowed to access the router.",
          "Devices on the 192.168.10.0/24 network are not allowed to reply to any ping requests.",
          "Devices on the 192.168.10.0/24 network can successfully ping devices on the 192.168.11.0 network."
        ],
        "correct": 0,
        "pairs": [],
        "code": "access-list 100 permit ip host 192.168.10.1 any\naccess-list 100 deny icmp 192.168.10.0 0.0.0.255 any echo\naccess-list 100 permit ip any any",
        "diagram": null,
        "explanation": "The second ACE only denies ICMP echo (ping requests) sourced from 192.168.10.0/24, and the third ACE permits all remaining IP traffic, so TCP-based sessions such as Telnet or SSH from any host on that network are still allowed into the router."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. R1 and R2 use Gigabit subinterfaces numbered to match their VLANs: R1 Gi0/1.10 serves VLAN 10 PCs, R1 Gi0/1.12 serves printer P1 on VLAN 12, and R2 Gi0/1.20 serves VLAN 20 PCs, with R1 and R2 linked via S0/0/0-S0/0/1. PCs on VLAN 10 should be able to print to P1, but PCs on VLAN 20 should not. Where should a standard ACL be placed to satisfy this?",
        "options": [
          "R1 Gi0/1.12, outbound",
          "R1 Gi0/1.12, inbound",
          "R2 Gi0/1.20, outbound",
          "R1 S0/0/0, outbound"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "PC10",
              "label": "PC VLAN 10",
              "kind": "pc"
            },
            {
              "id": "R1",
              "label": "R1",
              "kind": "router"
            },
            {
              "id": "P1",
              "label": "Printer P1 VLAN 12",
              "kind": "server"
            },
            {
              "id": "R2",
              "label": "R2",
              "kind": "router"
            },
            {
              "id": "PC20",
              "label": "PC VLAN 20",
              "kind": "pc"
            }
          ],
          "links": [
            {
              "from": "PC10",
              "to": "R1",
              "label": "Gi0/1.10"
            },
            {
              "from": "R1",
              "to": "P1",
              "label": "Gi0/1.12"
            },
            {
              "from": "R1",
              "to": "R2",
              "label": "S0/0/0-S0/0/1"
            },
            {
              "from": "R2",
              "to": "PC20",
              "label": "Gi0/1.20"
            }
          ]
        },
        "explanation": "A standard ACL filters only on source address, so it must sit as close to the destination as possible; applying it outbound on R1's Gi0/1.12, the printer's own subinterface, permits the VLAN 10 source range while blocking VLAN 20 traffic right before it reaches the printer."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. An administrator configured extended ACL 101 and then edited it with the commands shown below. Based on the resulting configuration, which type of traffic will be permitted?",
        "options": [
          "SSH packets will be permitted.",
          "Telnet packets will be permitted.",
          "TFTP packets will be permitted.",
          "All TCP and UDP packets will be denied."
        ],
        "correct": 0,
        "pairs": [],
        "code": "Router(config)# ip access-list extended 101\nRouter(config-ext-nacl)# no 20\nRouter(config-ext-nacl)# 5 permit tcp any any eq 22\nRouter(config-ext-nacl)# 20 deny udp any any",
        "diagram": null,
        "explanation": "Removing sequence 20 and inserting \"permit tcp any any eq 22\" at sequence 5 places a permit for SSH (TCP port 22) ahead of the later \"deny udp any any\" entry, so SSH packets are matched and permitted before that or any other later ACE is evaluated."
      },
      {
        "type": "mc",
        "q": "What effect would the Router1(config-ext-nacl)# permit tcp 172.16.4.0 0.0.0.255 any eq www command have when implemented inbound on the F0/0 interface?",
        "options": [
          "The command is rejected by the router because it is incomplete.",
          "All traffic from 172.16.4.0/24 is permitted to any destination on any port.",
          "All TCP traffic is permitted, and all other traffic is denied.",
          "Traffic originating from 172.16.4.0/24 is permitted to all TCP port 80 destinations."
        ],
        "correct": 3,
        "pairs": [],
        "code": "Router1(config-ext-nacl)# permit tcp 172.16.4.0 0.0.0.255 any eq www",
        "diagram": null,
        "explanation": "The \"eq www\" keyword restricts the match to TCP port 80, so only traffic sourced from the 172.16.4.0/24 network destined to any host on port 80 (HTTP) is permitted by this ACE when applied inbound on F0/0."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Employees on the 192.168.11.0/24 network, which connects to R1's G0/1 interface, work with critically sensitive information and must not be allowed access to any network beyond their own, including the network reached via R3. What is the best ACL type and placement to enforce this?",
        "options": [
          "standard ACL inbound on R1 G0/1",
          "standard ACL inbound on R1 vty lines",
          "extended ACL inbound on R1 G0/0",
          "extended ACL inbound on R3 S0/0/1"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "LAN11",
              "label": "192.168.11.0/24",
              "kind": "cloud"
            },
            {
              "id": "R1",
              "label": "R1",
              "kind": "router"
            },
            {
              "id": "LAN10",
              "label": "Other LAN",
              "kind": "cloud"
            },
            {
              "id": "R3",
              "label": "R3",
              "kind": "router"
            }
          ],
          "links": [
            {
              "from": "LAN11",
              "to": "R1",
              "label": "G0/1"
            },
            {
              "from": "LAN10",
              "to": "R1",
              "label": "G0/0"
            },
            {
              "from": "R1",
              "to": "R3",
              "label": "S0/0/1"
            }
          ]
        },
        "explanation": "Because only the source network needs to be matched, a standard ACL is sufficient, and placing it inbound on R1's G0/1, the interface directly facing the 192.168.11.0/24 LAN, blocks that traffic from being routed anywhere else as soon as it enters the router."
      }
    ]
  },
  {
    "n": "WAN Concepts",
    "c": "Modules 6-8",
    "intro": "Modules 6-8 zoom out from LAN switching to how sites talk to each other and to the Internet. NAT solves IPv4 address scarcity by translating private addresses at the network edge, while WAN technologies and VPNs are what actually carry traffic between geographically separate sites — some over private, carrier-owned links, some tunneled securely across the public Internet. The exam leans heavily on NAT terminology (inside/outside, local/global) and on knowing exactly which security service (confidentiality, integrity, key exchange) each IPsec building block provides.",
    "concepts": [
      "NAT terminology is directional and paired: inside local is a host's real private address, inside global is the address that same host is translated to for the outside world; outside global/outside local mirror that for the remote host. Get the pairing right and translation-table questions become easy.",
      "Static NAT is a permanent one-to-one mapping (one inside local <-> one inside global), so it's used for servers that need a fixed, predictable public address; dynamic NAT pulls from a pool of addresses on a first-come basis, but still needs one public address per simultaneous inside host.",
      "PAT (NAT overload) is what makes NAT scale: many inside hosts share one or a few public addresses by tacking a unique source port number onto each translation, so the router can un-translate replies back to the correct internal host.",
      "NAT's biggest cost is breaking end-to-end addressing — anything that embeds an IP address in its payload or needs true traceability back to the origin host can misbehave once the address is rewritten in flight.",
      "WAN infrastructure splits into private (leased lines, Frame Relay, ATM, Ethernet WAN/MetroE, MPLS — carrier-provisioned dedicated capacity) and public (DSL, cable, cellular, satellite, and VPNs over the plain Internet) — private buys guaranteed bandwidth and SLAs, public buys low cost and ubiquity.",
      "A VPN doesn't need a private circuit — it builds an encrypted virtual tunnel over whatever network is already there (usually the Internet), which is why site-to-site VPNs have largely replaced expensive leased lines for connecting branch offices.",
      "IPsec is a framework, not one algorithm: confidentiality comes from an encryption cipher (AES/3DES), integrity/authenticity comes from a hash (MD5/SHA, run through HMAC), and key exchange (Diffie-Hellman) lets two peers agree on a shared secret without ever transmitting it.",
      "GRE tunnels can carry multicast, broadcast, and non-IP traffic that plain IPsec can't, but GRE itself has no encryption — wrapping GRE inside IPsec is how routing-protocol updates and multicast traffic get to run securely between sites."
    ],
    "f": [
      "Inside local = real private address of an inside host; inside global = that host's translated public address",
      "Outside global = the real address of an outside host; outside local = how that outside host's address looks from inside (rarely different)",
      "Static NAT: fixed 1-to-1 mapping, used for servers that need a consistent public address",
      "Dynamic NAT: pool of public addresses, still 1-to-1 at any given moment -- pool can run out",
      "PAT / NAT overload: many inside hosts share one public address, disambiguated by source port number",
      "show ip nat translations = view the live translation table; show ip nat statistics = view the ACL, hit counts, and NAT types in use",
      "ip nat inside / ip nat outside must be applied to the correct interfaces or NAT never triggers, even with a correct static/pool mapping",
      "Biggest NAT downside: breaks end-to-end traceability; can break protocols that embed IP addresses in the payload",
      "Private WAN infra: leased line, Frame Relay, ATM, Ethernet WAN/MetroE, MPLS -- carrier-dedicated capacity",
      "Public WAN infra: DSL, cable, cellular (3G/4G/5G), satellite, VPN over the Internet -- shared/cheap, no guaranteed bandwidth",
      "Remote-access VPN connects individual users in (clientless SSL via browser, or client-based IPsec); site-to-site VPN permanently joins two networks via gateways",
      "IPsec confidentiality = encryption algorithm (AES, 3DES); integrity/authenticity = hashing algorithm (MD5, SHA) run through HMAC",
      "Diffie-Hellman (DH) = key exchange only; it doesn't encrypt or hash data, it just lets both peers derive the same shared secret",
      "GRE = simple tunneling, no encryption, supports multicast/broadcast/multiprotocol; GRE over IPsec adds the encryption GRE lacks",
      "MPLS VPN can be Layer 2 or Layer 3, run across the provider's own backbone -- a private WAN option",
      "RFC 1918 private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 -- addresses outside those three blocks are generally public/routable, with the exception of other reserved special-use ranges (e.g., 127.0.0.0/8 loopback, 169.254.0.0/16 link-local, 224.0.0.0/4 multicast)"
    ],
    "q": [
      {
        "type": "mc",
        "q": "Which two statements accurately describe an advantage or a disadvantage of deploying NAT for IPv4? (Choose two.)",
        "options": [
          "NAT provides a solution to slow the depletion of available IPv4 addresses, and it introduces problems for some applications that require end-to-end connectivity",
          "NAT speeds up router lookups by removing the need to alter the IPv4 checksum, and it is required for OSPF to function",
          "NAT works transparently with every encryption protocol, and it removes the need for a default route",
          "NAT is compatible with every third-party routing vendor by default, and it removes the need for access control lists"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "NAT conserves scarce public IPv4 space by translating private addresses at the edge, but rewriting headers breaks apps/protocols that depend on consistent end-to-end addressing."
      },
      {
        "type": "mc",
        "q": "A network administrator wants to examine the active NAT translations on a border router. Which command should be issued?",
        "options": [
          "Router# show ip route",
          "Router# show ip nat translations",
          "Router# show running-config",
          "Router# show interfaces"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "show ip nat translations lists the current inside-local/inside-global (and outside) address pairs the router has translated."
      },
      {
        "type": "mc",
        "q": "What are two tasks that must be completed when configuring static NAT for an internal server? (Choose two.)",
        "options": [
          "Configure a DHCP pool for the inside network, and enable a dynamic routing protocol between the inside and outside interfaces",
          "Create an access list permitting all inside global addresses, and disable NAT on the outside interface",
          "Create a static mapping between the server's inside local and inside global address, and mark the correct interfaces as inside/outside",
          "Assign an inside local address to the ISP-facing interface, and enable PAT overload on the inside interface"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Static NAT needs both a one-to-one ip nat inside source static mapping and ip nat inside / ip nat outside applied to the right interfaces, or translation never triggers."
      },
      {
        "type": "mc",
        "q": "What is a disadvantage of NAT?",
        "options": [
          "It increases the number of public IPv4 addresses a network requires",
          "It prevents private hosts from reaching the Internet without a static route",
          "It disables the use of access control lists on the router",
          "There is no end-to-end addressing, so traceability and some address-embedding applications break"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Because NAT rewrites source/destination addresses, packets can't be traced end-to-end and protocols that embed IP addresses in their payload can misbehave."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit: a router (R1) running NAT connects an internal LAN to the Internet using public address 209.165.200.225 on its outside interface, translating an inside host at 192.168.10.10. From R1's perspective, which address is the inside global address?",
        "options": [
          "209.165.200.225",
          "192.168.10.10",
          "209.165.200.245",
          "10.1.0.13"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The inside global address is the translated, publicly routable address representing the inside network to the outside world -- R1's own outside-facing address."
      },
      {
        "type": "mc",
        "q": "What three pieces of information can an administrator verify from show ip nat statistics output? (Choose three.)",
        "options": [
          "The router's OSPF neighbor states, DHCP lease times, and STP root bridge",
          "Whether a standard ACL is used to define translatable traffic, whether translations are actually happening, and which NAT type(s) -- static, dynamic, or PAT -- are enabled",
          "The number of configured VLANs, trunk mode of each interface, and native VLAN",
          "The routing protocol in use, the default gateway, and the DNS server"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "show ip nat statistics reports the ACL identifying NAT-eligible traffic, hit counts proving translation is occurring, and which NAT types are active."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit showing a NAT translation table where many internal hosts share one outside interface address, distinguished by different port numbers for each session. What type of NAT has been implemented?",
        "options": [
          "Static NAT",
          "Dynamic NAT using a pool of public addresses",
          "PAT (NAT overload) using the outside interface address",
          "NAT64"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Many inside hosts mapped to one outside address, told apart only by source port number, is the signature of PAT/NAT overload."
      },
      {
        "type": "mc",
        "q": "From the perspective of users on the Internet, what NAT address type is 209.165.201.1, the address that represents an internal server?",
        "options": [
          "Outside global",
          "Outside local",
          "Inside local",
          "Inside global"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The address outside hosts use to reach an inside device is that device's inside global address, regardless of its real (inside local) private address internally."
      },
      {
        "type": "mc",
        "q": "An administrator needs a server with private address 10.1.0.13 to be reachable from the Internet at 209.165.201.1. Which two addresses are used in the static NAT command? (Choose two.)",
        "options": [
          "10.1.0.13 (inside local) and 209.165.201.1 (inside global)",
          "209.165.201.1 (inside local) and 10.1.0.13 (inside global)",
          "10.1.0.13 (outside local) and 209.165.201.1 (outside global)",
          "192.168.0.1 (inside local) and 209.165.201.1 (inside global)"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "ip nat inside source static 10.1.0.13 209.165.201.1 maps the server's real private address to the public address the Internet uses to reach it."
      },
      {
        "type": "mc",
        "q": "What is the purpose of the overload keyword in a NAT configuration?",
        "options": [
          "It extends the NAT translation table timeout indefinitely",
          "It allows a group of inside hosts to share one or a few inside global addresses by also tracking port numbers",
          "It permits static and dynamic NAT to run on the same interface simultaneously",
          "It forces translation of outside global addresses instead of inside local ones"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "overload converts dynamic NAT into PAT, multiplexing many inside hosts onto few public addresses using unique source ports."
      },
      {
        "type": "mc",
        "q": "Which situation describes a scenario where a WAN, not a LAN, is being used?",
        "options": [
          "A user prints a document from a laptop to a printer in the same office",
          "A workstation streams video from a media server in the same building",
          "An employee shares a database file with a co-worker in a branch office located across the city",
          "Two PCs in the same room share files through a switch"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Once traffic must cross to a different site through a provider's network, that's WAN territory; communication within one site/building stays on the LAN."
      },
      {
        "type": "mc",
        "q": "Which two technologies are examples of private WAN infrastructure used to interconnect sites? (Choose two.)",
        "options": [
          "DSL and cable",
          "3G/4G cellular and satellite",
          "SSL VPN and cable",
          "Frame Relay and Metro Ethernet (MetroE)"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Private WAN infrastructure is carrier-provisioned dedicated capacity -- leased lines, Frame Relay, ATM, Ethernet WAN/MetroE, MPLS -- unlike shared public-Internet access like DSL, cable, or cellular."
      },
      {
        "type": "mc",
        "q": "Which network scenario would require the use of a WAN?",
        "options": [
          "An employee who is traveling needs to connect to the corporate email server through a VPN",
          "A user connects a wireless printer to a home Wi-Fi network",
          "A student streams a movie from a NAS in the same dorm room",
          "Two switches in the same closet are connected with a crossover cable"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Remote access back into a corporate network over the Internet is a classic WAN use case; the other options never leave a single local network."
      },
      {
        "type": "mc",
        "q": "Which two hashing algorithms are used with IPsec AH to guarantee authenticity? (Choose two.)",
        "options": [
          "AES and 3DES",
          "MD5 and SHA",
          "DH and RSA",
          "AES and SHA"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "AH (Authentication Header) runs a keyed hash -- MD5 or SHA -- over the packet to prove origin and integrity; it doesn't encrypt anything, so ciphers like AES/3DES aren't part of AH."
      },
      {
        "type": "mc",
        "q": "Which two algorithms provide encryption and hashing, respectively, within an IPsec policy? (Choose two.)",
        "options": [
          "DES for hashing and MD5 for encryption",
          "RSA for encryption and DH for hashing",
          "AES for encryption and SHA for hashing",
          "3DES for hashing and AES for hashing"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "AES is a symmetric cipher used for confidentiality; SHA is a hash algorithm used for integrity -- together they cover two of IPsec's core security services."
      },
      {
        "type": "mc",
        "q": "Which VPN solution lets a remote user connect securely to an ASA using only a standard web browser, without installing client software?",
        "options": [
          "Client-based IPsec VPN",
          "GRE over IPsec",
          "Site-to-site IPsec VPN",
          "Clientless SSL VPN"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Clientless SSL VPN uses HTTPS in an ordinary browser to reach internal resources through the ASA -- no pre-installed VPN client required."
      },
      {
        "type": "mc",
        "q": "Which IPsec security function ensures that data has not been altered in transit?",
        "options": [
          "Integrity",
          "Confidentiality",
          "Authentication",
          "Anti-replay"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Integrity uses a hash (via HMAC) so the receiver can detect any modification of the packet in transit."
      },
      {
        "type": "mc",
        "q": "Which two technologies are examples of enterprise-managed remote-access VPN solutions? (Choose two.)",
        "options": [
          "GRE tunnel and MPLS VPN",
          "Clientless SSL VPN and client-based IPsec VPN",
          "Frame Relay and leased line",
          "PAT and static NAT"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Remote-access VPNs let individual users connect in, either through a browser (clientless SSL) or a full client (IPsec); the other options are WAN transport or NAT technologies, not VPN types."
      },
      {
        "type": "mc",
        "q": "Which is a requirement of a site-to-site VPN?",
        "options": [
          "It requires VPN client software installed on every host",
          "It only functions over a private WAN link, never the public Internet",
          "It requires a VPN gateway at each end of the tunnel to encrypt and decrypt traffic",
          "It requires each host to negotiate its own individual IPsec tunnel"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "In a site-to-site VPN, gateways (routers/firewalls) at each site handle encryption/decryption transparently, so end hosts need no special software."
      },
      {
        "type": "mc",
        "q": "What is the function of Diffie-Hellman (DH) within the IPsec framework?",
        "options": [
          "It encrypts the user data payload",
          "It provides the hashing algorithm for data integrity",
          "It authenticates peers using digital certificates",
          "It allows two peers to establish a shared secret key over an insecure channel"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "DH is a key-exchange algorithm -- both peers compute the same secret without ever transmitting it -- which IPsec then uses to derive session keys."
      },
      {
        "type": "mc",
        "q": "What does NAT overloading (PAT) use to keep track of which translation belongs to which internal host?",
        "options": [
          "Port numbers",
          "MAC addresses",
          "VLAN tags",
          "TCP sequence numbers"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "PAT maps many inside local addresses to one inside global address by assigning each session a unique source port number."
      },
      {
        "type": "mc",
        "q": "Which type of IPv4 address is 192.168.7.98?",
        "options": [
          "Public",
          "Private",
          "Multicast",
          "Loopback"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "192.168.0.0/16 is one of the three RFC 1918 private ranges, so it isn't routable on the public Internet."
      },
      {
        "type": "mc",
        "q": "Which type of IPv4 address is 128.107.240.239?",
        "options": [
          "Private",
          "Link-local",
          "Public",
          "Multicast"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "It falls outside all three RFC 1918 ranges (10/8, 172.16/12, 192.168/16), so it's a publicly routable address."
      },
      {
        "type": "mc",
        "q": "Which VPN implementation typically uses a public key infrastructure and digital certificates to authenticate connections through a standard web browser?",
        "options": [
          "GRE",
          "Frame Relay",
          "PAT",
          "SSL VPN"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "SSL VPNs rely on the same PKI/certificate trust model as HTTPS to authenticate the gateway (and optionally the user) to the browser."
      },
      {
        "type": "mc",
        "q": "Which two WAN services are examples of a private, dedicated connection between sites? (Choose two.)",
        "options": [
          "Frame Relay and a leased line (T1/E1)",
          "DSL and cable",
          "3G/4G cellular and satellite Internet",
          "SSL VPN and cable"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Leased lines and Frame Relay are dedicated, carrier-provisioned private circuits; DSL, cable, cellular, and satellite are shared public-access technologies instead."
      },
      {
        "type": "mc",
        "q": "Which two statements are true about the relationship between LANs and WANs? (Choose two.)",
        "options": [
          "WANs always use fiber cabling, and LANs never span more than one building",
          "WANs are typically operated across multiple service providers while LANs are usually owned by a single organization, and WANs connect LANs together at lower bandwidth than devices connect within a LAN",
          "LANs require a router to connect two hosts, and WANs never use routers",
          "WANs are limited to a single building, and LANs can span multiple cities"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A LAN is a single, privately-owned network in one location; a WAN stitches multiple LANs together over distance, usually through one or more providers, at lower per-link bandwidth than a local switch fabric."
      },
      {
        "type": "mc",
        "q": "Which two WAN options are examples of a private WAN architecture? (Choose two.)",
        "options": [
          "DSL and municipal Wi-Fi",
          "Cable and satellite",
          "Leased line and Ethernet WAN",
          "3G/4G cellular and a public Wi-Fi hotspot"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Leased lines and carrier Ethernet WAN circuits are dedicated, privately contracted links, unlike shared public broadband and wireless access."
      },
      {
        "type": "mc",
        "q": "Under which circumstance would a company most likely need to implement a WAN?",
        "options": [
          "When two departments on the same floor need to share a printer",
          "When a single office adds a second switch",
          "When a home user wants faster Wi-Fi",
          "When its employees become distributed across many branch locations that all need to reach central resources"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "WANs exist to connect geographically separated sites; once a company has multiple branch offices, it needs WAN links (or Internet VPNs) to unify them into one network."
      },
      {
        "type": "mc",
        "q": "Which statement describes a characteristic of site-to-site VPNs?",
        "options": [
          "It is a static configuration set up in advance, typically between two VPN gateways",
          "It is dynamically established each time a remote user opens a browser",
          "It requires a software client on every end host on both networks",
          "It only works over MPLS, never over the public Internet"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Site-to-site VPNs are pre-configured, always-on tunnels between two gateways -- the hosts behind them don't do anything special."
      },
      {
        "type": "mc",
        "q": "How is tunneling accomplished in a VPN?",
        "options": [
          "The original IP header is stripped and never replaced",
          "New headers from one or more VPN protocols encapsulate the original packets",
          "The payload of the original packet is deleted and replaced with a hash",
          "A dedicated physical cable is run between the two endpoints"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Tunneling wraps the original packet inside a new header (e.g., GRE, IPsec ESP) so it can cross a network it wouldn't otherwise traverse, then gets unwrapped at the far end."
      },
      {
        "type": "mc",
        "q": "Which statement accurately describes a VPN?",
        "options": [
          "VPNs require a dedicated leased line between every pair of sites",
          "VPNs can only be established between devices from the same vendor",
          "VPNs use virtual connections to create a private network through a public network such as the Internet",
          "VPNs eliminate the need for any encryption because tunnels are inherently private"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A VPN's whole purpose is to carry private traffic securely over shared/public infrastructure through an encrypted virtual tunnel, rather than needing a dedicated physical circuit."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit: a router has NAT configured, but PC-A still cannot reach the Internet. The running-config shows the ip nat inside and ip nat outside commands applied to the wrong interfaces. What is the most likely cause of the problem?",
        "options": [
          "The access list referenced by the NAT statement permits too many addresses",
          "The NAT pool has run out of available addresses",
          "The default route is missing from the routing table",
          "The NAT inside and outside interfaces are not correctly assigned"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "NAT only translates traffic crossing between the interfaces marked ip nat inside and ip nat outside; if those roles are swapped, translation never happens."
      },
      {
        "type": "mc",
        "q": "An administrator has a correct static NAT mapping configured, but outbound translation still isn't occurring. What is most likely missing to complete the configuration?",
        "options": [
          "The Internet-facing interface (e.g., S0/0/0) needs the ip nat outside command applied",
          "The static mapping should be removed and replaced with a NAT pool",
          "The inside interface needs an access list denying all traffic",
          "The router needs a static default route pointing back to the LAN"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Even a correct ip nat inside source static mapping does nothing until the inside and outside interfaces are explicitly marked with ip nat inside / ip nat outside."
      },
      {
        "type": "mc",
        "q": "In NAT terminology, which term refers to the actual, globally routable IPv4 address of a destination host on the Internet?",
        "options": [
          "Inside local address",
          "Outside global address",
          "Outside local address",
          "Inside global address"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The outside global address is the real public address of an external host exactly as it exists on the Internet, independent of any NAT translation."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit showing show ip nat translations output. Which two statements are correct? (Choose two.)",
        "options": [
          "The output was generated with the show ip nat statistics command, and no translations have occurred yet",
          "The output shows OSPF neighbor adjacencies, and DHCP is disabled",
          "The output was generated with the show ip nat translations command, and the entries confirm that translation between inside and outside addresses is currently active",
          "The output lists VLAN trunk ports, and NAT is not configured on this router"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "show ip nat translations displays the live table of address pairs, and populated entries prove NAT is actively translating traffic."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit showing show ip nat translations output on RT2. How is translation occurring for the host at 192.168.254.253?",
        "options": [
          "It is not being translated",
          "It is translated using a dynamic NAT pool",
          "It is translated using PAT keyed on a specific port",
          "It is translated to 192.0.2.88 using static NAT"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A single, always-present one-to-one entry mapping that inside address to one outside address indicates a static NAT mapping, not a pooled or PAT entry."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit showing R2's PAT (NAT overload) configuration, which is not translating traffic as expected. Why is R2's configuration incorrect?",
        "options": [
          "The NAT pool (NAT-POOL2) is bound to the wrong access control list",
          "The overload keyword is missing from the ip nat inside source command",
          "The inside and outside interfaces are on the same subnet",
          "PAT cannot be combined with a named NAT pool"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "PAT only translates traffic matched by the ACL referenced in the ip nat inside source list ... pool ... command; if that ACL doesn't match the intended traffic, nothing gets translated correctly."
      },
      {
        "type": "mc",
        "q": "Which protocol creates a virtual point-to-point connection that can tunnel unencrypted, multiprotocol traffic between Cisco routers?",
        "options": [
          "IPsec ESP",
          "GRE",
          "SSL",
          "PPPoE"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "GRE (Generic Routing Encapsulation) builds a simple tunnel that carries almost any protocol, including multicast and broadcast, but by itself provides no encryption."
      },
      {
        "type": "mc",
        "q": "What is a disadvantage that occurs when both the source and destination networks use PAT?",
        "options": [
          "The number of usable VLANs is reduced",
          "Routing protocols can no longer form adjacencies through the router",
          "End-to-end IPv4 traceability is lost, and protocols that embed IP addresses in the payload can break",
          "The router can no longer forward broadcast traffic"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Because PAT rewrites addresses and ports on both ends, tracing a flow back to the true originating host becomes impossible, and application data containing embedded IP addresses can be broken."
      },
      {
        "type": "mc",
        "q": "Which VPN technology has implementations at both Layer 2 and Layer 3 and is typically deployed by a service provider across its own backbone?",
        "options": [
          "Clientless SSL VPN",
          "GRE over IPsec",
          "IPsec virtual tunnel interface (VTI)",
          "MPLS VPN"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "MPLS VPNs can be provisioned as Layer 2 or Layer 3 services, run across a shared provider backbone that logically separates each customer's traffic."
      },
      {
        "type": "mc",
        "q": "Which VPN implementation would allow multicast and broadcast traffic (such as routing protocol updates) to be forwarded across a secure site-to-site tunnel?",
        "options": [
          "GRE over IPsec",
          "Clientless SSL VPN",
          "Plain IPsec tunnel mode",
          "PAT"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Plain IPsec can't carry multicast/broadcast or routing-protocol traffic by itself; wrapping GRE inside IPsec lets GRE handle that while IPsec supplies the encryption."
      },
      {
        "type": "mc",
        "q": "What is the function of HMAC in setting up an IPsec VPN?",
        "options": [
          "It encrypts the payload of every packet",
          "It guarantees message integrity by combining a hash function with a secret key",
          "It exchanges the Diffie-Hellman shared secret",
          "It negotiates the IKE Phase 1 policy"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "HMAC runs a hash over the packet plus a shared secret key, so the receiver can verify the data wasn't altered and that it came from a peer holding the correct key."
      },
      {
        "type": "mc",
        "q": "Which algorithm is used within the IPsec framework to provide data confidentiality?",
        "options": [
          "SHA",
          "Diffie-Hellman",
          "AES",
          "MD5"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "AES is a symmetric block cipher that actually encrypts the payload; SHA/MD5 are hash algorithms for integrity, and DH only establishes the shared key."
      },
      {
        "type": "mc",
        "q": "Which two devices can serve as the other endpoint of a site-to-site VPN configured on a Cisco ASA? (Choose two.)",
        "options": [
          "A wireless access point and a Layer 2 switch",
          "A DHCP server and a DNS server",
          "A hub and a repeater",
          "Another Cisco ASA and a Cisco IOS router"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Site-to-site VPN peers must be capable of IPsec/IKE negotiation -- ASAs and IOS routers qualify; switches, APs, and basic servers don't terminate VPN tunnels."
      },
      {
        "type": "match",
        "q": "Match the WAN connectivity scenario to the appropriate WAN solution. (Not all options are used.)",
        "options": [],
        "correct": -1,
        "pairs": [
          [
            "A company has a headquarters and four remote locations. The headquarters site will require more bandwidth than the four remote sites.",
            "Frame Relay"
          ],
          [
            "A company requires higher download speeds than upload speeds and wants to use existing phone lines.",
            "DSL"
          ],
          [
            "A company would like guaranteed bandwidth using a point-to-point link that requires minimal expertise to install and maintain.",
            "T1 (leased line)"
          ],
          [
            "A teleworker would like to bundle the Internet connection with other phone and TV services.",
            "cable"
          ],
          [
            "A multisite college wants to connect using Ethernet technology between the sites.",
            "MetroE"
          ]
        ],
        "code": "",
        "diagram": null,
        "explanation": "Frame Relay's hub-and-spoke PVCs suit an asymmetric headquarters-to-branch design, DSL rides existing telephone lines with faster downstream than upstream speed, a T1 leased line gives dedicated guaranteed bandwidth with minimal install expertise, cable bundles Internet with TV/phone over the same coax, and Metro Ethernet extends Ethernet technology across a multisite metro-area campus; VSAT is the unused distractor."
      },
      {
        "type": "match",
        "q": "Refer to the exhibit. The PC (10.130.5.76) is sending a packet to the Server (203.0.113.5) on a remote network, and router R1 is performing NAT overload using its S0/0/0 interface address of 192.0.2.1. From the perspective of the PC, match the NAT address type with the correct IP address. (Not all options are used.)",
        "options": [],
        "correct": -1,
        "pairs": [
          [
            "Inside global",
            "192.0.2.1"
          ],
          [
            "Inside local",
            "10.130.5.76"
          ],
          [
            "Outside global",
            "203.0.113.5"
          ]
        ],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "PC",
              "label": "PC",
              "kind": "pc"
            },
            {
              "id": "R1",
              "label": "R1",
              "kind": "router"
            },
            {
              "id": "INET",
              "label": "Internet",
              "kind": "cloud"
            },
            {
              "id": "R2",
              "label": "R2",
              "kind": "router"
            },
            {
              "id": "SRV",
              "label": "Server",
              "kind": "server"
            }
          ],
          "links": [
            {
              "from": "PC",
              "to": "R1",
              "label": "10.130.5.76"
            },
            {
              "from": "R1",
              "to": "INET",
              "label": "S0/0/0 192.0.2.1/30"
            },
            {
              "from": "INET",
              "to": "R2",
              "label": "S0/0/1 192.0.2.2/30"
            },
            {
              "from": "R2",
              "to": "SRV",
              "label": "203.0.113.5"
            }
          ]
        },
        "explanation": "With NAT overload (PAT), the inside local address is the PC's own real address (10.130.5.76), the inside global address is R1's public exit-interface address the PC's traffic is translated to (192.0.2.1), and since the Server sits behind no NAT, its outside global address equals its real address (203.0.113.5); outside local is the unused option because no translation occurs on the destination side."
      },
      {
        "type": "match",
        "q": "Match each WAN connection component to its description. (Not all options are used.)",
        "options": [],
        "correct": -1,
        "pairs": [
          [
            "devices that put data on the local loop",
            "data communications equipment (DCE)"
          ],
          [
            "customer devices that pass the data from a customer network or host computer for transmission over the WAN",
            "data terminal equipment (DTE)"
          ],
          [
            "point that is established in a building or complex to separate customer equipment from service provider equipment",
            "demarcation point"
          ],
          [
            "devices and inside wiring located on the enterprise edge and which connect to a carrier link",
            "customer premises equipment (CPE)"
          ]
        ],
        "code": "",
        "diagram": null,
        "explanation": "DCE (such as a modem or CSU/DSU) actually places signals onto the local loop, DTE is the customer's own equipment that hands data to the DCE for transmission, the demarcation point is the physical boundary where the provider's cabling responsibility ends, and CPE is the general term for equipment and wiring on the customer's side of that boundary."
      },
      {
        "type": "match",
        "q": "Match the steps, in order, to the actions that occur when an internal host at 192.168.10.10 sends a packet to an external server at 209.165.200.254 across router R1, which is running dynamic NAT. (Not all options are used.)",
        "options": [],
        "correct": -1,
        "pairs": [
          [
            "Step 1",
            "The host sends packets that request a connection to the server at the address 209.165.200.254."
          ],
          [
            "Step 2",
            "R1 checks the NAT configuration to determine if this packet should be translated."
          ],
          [
            "Step 3",
            "If there is no translation entry for this IP address, R1 determines that the source address 192.168.10.10 must be translated."
          ],
          [
            "Step 4",
            "R1 selects an available global address from the dynamic address pool."
          ],
          [
            "Step 5",
            "R1 replaces the address 192.168.10.10 with a translated inside global address."
          ]
        ],
        "code": "",
        "diagram": null,
        "explanation": "Dynamic NAT first checks whether an existing translation entry applies, then, finding none, allocates the next free address from the configured pool and substitutes it for the packet's source address before forwarding; the unused option describing translation of return packets from 209.165.200.254 back to 192.168.10.10 belongs to the reverse path, not this outbound sequence."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Given the configuration commands shown, how many hosts on the internal LAN attached to R1 can have simultaneous NAT translations on R1?",
        "options": [
          "244",
          "10",
          "1",
          "255"
        ],
        "correct": 2,
        "pairs": [],
        "code": "R1(config)# ip nat inside source static 192.168.0.10 209.165.200.225\n\nR1(config)# interface gigabitEthernet 0/0\nR1(config-if)# ip address 192.168.0.1 255.255.255.0\nR1(config-if)# ip nat inside\nR1(config-if)# exit\n\nR1(config)# interface Serial0/0/0\nR1(config-if)# ip address 209.165.200.225 255.255.255.224\nR1(config-if)# ip nat outside",
        "diagram": null,
        "explanation": "The configuration only creates a single static NAT entry mapping one specific inside host (192.168.0.10) to one specific inside global address (209.165.200.225), so only that one host can have an active NAT translation at a time."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit, showing the output of show ip nat statistics on R1. Which statement is correct based on this output?",
        "options": [
          "The pool named NAT has all three of its addresses currently allocated to hosts.",
          "A standard access list numbered 1 was used to identify which inside addresses are eligible for translation into pool NAT.",
          "The name of the NAT address pool is refCount.",
          "R1 is configured to use only dynamic NAT, not static NAT."
        ],
        "correct": 1,
        "pairs": [],
        "code": "R1# show ip nat statistics\nTotal translations: 6 (2 static, 4 dynamic, 4 extended)\nOutside interfaces:\n  Serial0/2/1\nInside interfaces:\n  Serial0/2/0, FastEthernet0/0.10, FastEthernet0/0.11, FastEthernet0/0.12\nHits: 3   Misses: 4\nExpired translations: 0\nDynamic mappings:\n-- Inside Source\naccess-list 1 pool NAT refCount 4\n pool NAT: netmask 255.255.255.248\n      start 209.165.200.228 end 209.165.200.230\n      type generic, total addresses 3, allocated 1 (33%), misses 0",
        "diagram": null,
        "explanation": "The line \"access-list 1 pool NAT refCount 4\" shows that standard ACL 1 defines which inside addresses pool NAT can translate; only 1 of the pool's 3 addresses (33%) is currently allocated, and \"Total translations: 6 (2 static, 4 dynamic...)\" confirms both static and dynamic NAT are configured on R1."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Static NAT is being configured on the router labeled NAT so that PC1 (behind R2, across the 209.165.201.0/29 link) can reach the Web Server on the internal network. Which command correctly completes the configuration?",
        "options": [
          "ip nat inside source static 10.1.0.13 209.165.201.1",
          "ip nat inside source static 10.1.0.13 209.165.201.7",
          "ip nat inside source static 209.165.201.2 10.1.0.13",
          "ip nat inside source static 10.1.0.13 10.0.254.5"
        ],
        "correct": 0,
        "pairs": [],
        "code": "NAT(config)# ip nat inside source static <A> <B>",
        "diagram": {
          "nodes": [
            {
              "id": "SRV",
              "label": "Web Server",
              "kind": "server"
            },
            {
              "id": "NAT",
              "label": "NAT",
              "kind": "router"
            },
            {
              "id": "R2",
              "label": "R2",
              "kind": "router"
            },
            {
              "id": "PC1",
              "label": "PC1",
              "kind": "pc"
            }
          ],
          "links": [
            {
              "from": "SRV",
              "to": "NAT",
              "label": "10.1.0.13 / G0/0 10.1.0.1"
            },
            {
              "from": "NAT",
              "to": "R2",
              "label": "209.165.201.0/29 (.1-.2)"
            },
            {
              "from": "R2",
              "to": "PC1",
              "label": "G0/0 10.0.54.1/28 / 10.0.54.5"
            }
          ]
        },
        "explanation": "The syntax is ip nat inside source static <inside-local> <inside-global>; the Web Server's real address, 10.1.0.13, is the inside local value, and 209.165.201.1 — the NAT router's own outside-facing interface address on the 209.165.201.0/29 link — is used as the inside global value so PC1 can reach the server."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Static NAT has been configured on R1 as shown, but it is not working. What has to be done in order to complete the static NAT configuration on R1?",
        "options": [
          "Interface Fa0/0 should be configured with the command no ip nat inside.",
          "Interface S0/0/0 should be configured with the command ip nat outside.",
          "R1 should be configured with the command ip nat inside source static 209.165.200.200 192.168.11.11.",
          "R1 should be configured with the command ip nat inside source static 209.165.200.1 192.168.11.11."
        ],
        "correct": 1,
        "pairs": [],
        "code": "R1(config)# ip nat inside source static 192.168.11.11 209.165.200.1\nR1(config)# interface FastEthernet0/0\nR1(config-if)# ip nat inside",
        "diagram": {
          "nodes": [
            {
              "id": "PC1",
              "label": "PC1",
              "kind": "pc"
            },
            {
              "id": "SW1",
              "label": "SW1",
              "kind": "switch"
            },
            {
              "id": "R1",
              "label": "R1",
              "kind": "router"
            },
            {
              "id": "INET",
              "label": "Internet",
              "kind": "cloud"
            },
            {
              "id": "SRV",
              "label": "Server",
              "kind": "server"
            }
          ],
          "links": [
            {
              "from": "PC1",
              "to": "SW1",
              "label": "192.168.11.11/24"
            },
            {
              "from": "SW1",
              "to": "R1",
              "label": "Fa0/0 192.168.11.254/24"
            },
            {
              "from": "R1",
              "to": "INET",
              "label": "S0/0/0 209.165.200.1/27"
            },
            {
              "from": "INET",
              "to": "SRV",
              "label": "209.165.200.200"
            }
          ]
        },
        "explanation": "NAT requires both an inside interface and an outside interface to be marked; Fa0/0 was correctly set with ip nat inside, but S0/0/0 was never configured with ip nat outside, so R1 cannot identify the public-facing interface and the static translation will not take effect."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit, which shows the output of a router command. Which statement correctly describes this output?",
        "options": [
          "The output is the result of the show ip nat statistics command.",
          "The host mapped to 209.165.200.235 will respond to requests by using a source address of 209.165.200.235.",
          "The output is from show ip nat translations, and the host mapped to 209.165.200.235 will respond to requests using its inside local address of 192.168.10.10.",
          "Traffic destined for a public web server will be sourced from the IP address 192.168.1.10."
        ],
        "correct": 2,
        "pairs": [],
        "code": "Pro  Inside global        Inside local        Outside local   Outside global\n---  209.165.200.225      192.168.1.10        ---             ---\n---  209.165.200.235      192.168.10.10       ---             ---",
        "diagram": null,
        "explanation": "This table format, with no protocol/port column populated, is exactly what show ip nat translations produces for static entries, and because NAT only rewrites the source address on outbound packets, the host mapped to 209.165.200.235 still uses its own real inside local address, 192.168.10.10, to originate or reply to traffic."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit showing output from router RT2. Which statement correctly describes the NAT translation occurring on RT2?",
        "options": [
          "The traffic from source address 192.0.2.88 is being translated to reach destination 192.168.254.253.",
          "The traffic from a source IPv4 address of 192.168.254.253 is being translated to 192.0.2.88 by means of static NAT.",
          "A public address that originates traffic on the Internet would be able to reach private internal addresses directly.",
          "The traffic from source address 192.168.2.20 is being translated to reach destination 192.0.2.254."
        ],
        "correct": 1,
        "pairs": [],
        "code": "RT2# show ip interface brief\nInterface          IP-Address       OK? Method Status                  Protocol\nFastEthernet0/0     10.0.10.5        YES manual up                      up\nFastEthernet0/1     192.0.2.254      YES manual up                      up\nSerial0/0/0         10.0.10.1        YES manual up                      up\nSerial0/0/1         unassigned       YES unset   administratively down  down\nVlan1               unassigned       YES unset   administratively down  down\n\nRT2# show ip nat translations\nPro  Inside global         Inside local              Outside local          Outside global\nicmp 192.0.2.254:13        192.168.2.20:13           203.0.113.20:13        203.0.113.20:13\n---  192.0.2.88            192.168.254.253           ---                    ---\ntcp  192.0.2.88:80         192.168.254.253:80        203.0.113.20:1025      203.0.113.20:1025",
        "diagram": null,
        "explanation": "The second translation entry shows no protocol or port number, unlike the icmp and tcp overload entries above and below it, which is the signature of a static NAT entry — here permanently mapping the inside local address 192.168.254.253 to the inside global address 192.0.2.88."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. A network administrator configured R2 for PAT as shown, but it is not working. Why is the configuration incorrect?",
        "options": [
          "NAT-POOL2 is bound to the wrong ACL number in the ip nat inside source command.",
          "The access list does not define the addresses to be translated.",
          "The overload keyword should not have been applied.",
          "A static NAT entry is missing."
        ],
        "correct": 0,
        "pairs": [],
        "code": "R2(config)# ip nat pool NAT-POOL2 209.165.200.226 209.165.200.240 netmask 255.255.255.224\nR2(config)# access-list 1 permit 192.168.0.0 0.255.255.255\nR2(config)# ip nat inside source list 100 pool NAT-POOL2 overload\nR2(config)# interface Serial0/0/0\nR2(config-if)# ip nat inside\nR2(config)# interface Serial0/1/0\nR2(config-if)# ip nat outside",
        "diagram": null,
        "explanation": "The administrator created standard access-list 1 to permit the 192.168.0.0-based range, but the ip nat inside source command references list 100 instead of list 1, so it points to a nonexistent ACL and no traffic will ever be matched for translation into NAT-POOL2."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit from a Packet Tracer activity. PC-A and PC-B sit on the same LAN behind switch SW1, which connects to router R1 and then to the Internet. PC-B can ping a web server at 64.100.0.100, but PC-A cannot. What is most likely causing PC-A to be unable to communicate with the Internet?",
        "options": [
          "The ip nat inside source command refers to the wrong interface.",
          "The NAT interfaces (ip nat inside / ip nat outside) are not correctly assigned on R1.",
          "The static route should reference the outside address instead of the exit interface.",
          "The access list used in the NAT process is referencing the wrong subnet."
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "PCA",
              "label": "PC-A",
              "kind": "pc"
            },
            {
              "id": "PCB",
              "label": "PC-B",
              "kind": "pc"
            },
            {
              "id": "SW1",
              "label": "SW1",
              "kind": "switch"
            },
            {
              "id": "R1",
              "label": "R1",
              "kind": "router"
            },
            {
              "id": "INET",
              "label": "Internet",
              "kind": "cloud"
            }
          ],
          "links": [
            {
              "from": "PCA",
              "to": "SW1",
              "label": ""
            },
            {
              "from": "PCB",
              "to": "SW1",
              "label": ""
            },
            {
              "from": "SW1",
              "to": "R1",
              "label": ""
            },
            {
              "from": "R1",
              "to": "INET",
              "label": ""
            }
          ]
        },
        "explanation": "Because PC-A and PC-B share the same LAN, router, and NAT configuration, a fault that disables NAT altogether — missing ip nat inside/outside role assignment, a bad exit-interface reference, or a wrong outside interface on the inside-source command — would break Internet access for both PCs equally, not just one. Since PC-B still works, the problem must single out PC-A specifically: an access list whose network/wildcard mask does not fully cover PC-A's address (e.g., it matches only part of the subnet) would leave PC-A's traffic unmatched and therefore untranslated while PC-B's traffic is still translated normally."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Host A (10.0.0.121/28) sits behind the router labeled NAT, which connects across a 209.165.201.0/29 link to R2; R2's own LAN happens to reuse the same 10.0.0.0/28 addressing for its Web server. From the perspective of users behind the NAT router, what type of NAT address is 209.165.201.1?",
        "options": [
          "inside global",
          "outside global",
          "outside local",
          "inside local"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "HOSTA",
              "label": "Host A",
              "kind": "pc"
            },
            {
              "id": "NAT",
              "label": "NAT",
              "kind": "router"
            },
            {
              "id": "R2",
              "label": "R2",
              "kind": "router"
            },
            {
              "id": "SRV",
              "label": "Web Server",
              "kind": "server"
            }
          ],
          "links": [
            {
              "from": "HOSTA",
              "to": "NAT",
              "label": "10.0.0.121/28"
            },
            {
              "from": "NAT",
              "to": "R2",
              "label": "209.165.201.0/29 (.1-.2)"
            },
            {
              "from": "R2",
              "to": "SRV",
              "label": "10.0.0.121/28"
            }
          ]
        },
        "explanation": "209.165.201.1 is the address that the outside world (R2 and beyond) sees representing the inside host Host A after translation, which by definition is the inside global address, even though it happens to be configured directly on the NAT router's own outside-facing interface."
      }
    ]
  },
  {
    "n": "Optimize, Monitor, and Troubleshoot Networks",
    "c": "Modules 9-12",
    "intro": "This checkpoint covers Modules 9-12 of ENSA: how QoS keeps voice and video usable on a congested network, how you manage and monitor devices day to day (SNMP, syslog, NTP, IOS file management), how Cisco's three-tier hierarchical design (access/distribution/core) keeps failures contained, and the structured methodology for actually finding what broke. Most questions are pattern-matching a symptom to the right layer, the right queuing method, or the right IOS command, so know the traffic tolerances (voice vs. video vs. data) and the command names cold.",
    "concepts": [
      "Jitter and latency are different measurements: latency is the delay of a packet (often measured round-trip via ping), while jitter is the variation in that delay between consecutive packets -- QoS exists to control both for real-time traffic.",
      "The three QoS models sit on a spectrum: best-effort reserves nothing and treats every packet the same (how the plain Internet works), IntServ reserves resources end-to-end before sending (accurate but doesn't scale), and DiffServ classifies and marks traffic so devices can give it hop-by-hop priority (the scalable choice enterprises actually deploy).",
      "Marking should happen as close to the source as possible, ideally by a trusted endpoint like an IP phone or access point; the trust boundary is the point where the rest of the network starts believing those markings, and Layer 3 (DSCP) marking survives end-to-end while Layer 2 (CoS) marking only survives one hop.",
      "Queuing algorithms escalate in sophistication: FIFO treats everything the same in one queue, WFQ/CBWFQ classify traffic into multiple queues and share bandwidth fairly, and LLQ adds one strict-priority queue on top so voice always gets serviced first no matter what else is queued.",
      "Network management relies on three protocols doing three separate jobs: SNMP (a manager polls agents with get/set, agents can push unsolicited traps, and the data lives in a device's local MIB), syslog (gathers, filters by severity, and forwards log messages to a destination), and NTP (keeps every device's clock synchronized so those logs actually line up in time).",
      "IOS file management centers on the boot system command (which image to load, tried in the order configured) and the configuration register (0x2102 for a normal boot, 0x2142 to skip startup-config for password recovery), with copy running-config/startup-config to/from tftp: as the standard way to back up or restore configs.",
      "The three-tier hierarchical design (access = user entry point, distribution = policy/aggregation/L3 boundary, core = high-speed backbone) can collapse into a two-tier design for smaller sites, and switch blocks (paired distribution switches with split access uplinks) contain failure domains so one device dying doesn't take down the whole network.",
      "Structured troubleshooting narrows a fault methodically: gather symptoms, narrow the scope to a layer (access/distribution/core), then divide-and-conquer -- verify one OSI layer works and assume everything below it also works, which is far faster than blindly testing top-down or bottom-up."
    ],
    "f": [
      "Jitter = variation in delay between packets; latency = the delay itself",
      "Voice traffic: <=150 ms latency, <=30 ms jitter, <=1% loss, ~30 kbps+ bandwidth, smooth and predictable",
      "Video traffic: <=400 ms latency, less loss-tolerant than voice, bursty/unpredictable, high data volume per packet",
      "Data traffic priority depends on whether it's interactive/mission-critical (non-critical data gets only leftover bandwidth); ordinary data also tolerates latency/jitter/loss without a noticeable effect on the user, unlike real-time voice/video",
      "Best-effort QoS = no reservation, no guarantee, all packets treated equally (default Internet behavior)",
      "IntServ = end-to-end resource reservation before sending (e.g. RSVP) -- accurate but scales poorly",
      "DiffServ = classify and mark traffic for hop-by-hop treatment -- the scalable enterprise QoS model",
      "LLQ = strict priority queue for delay-sensitive traffic like voice; FIFO = single queue, no prioritization at all",
      "SNMPv3 adds authentication and encryption (auth/priv levels); SNMPv1/v2c use plaintext community strings only",
      "The MIB lives locally on the managed device; NMS uses get to read and set to write, agent sends unsolicited traps",
      "Syslog has 3 jobs: gather logging info, select what gets logged, specify where logged messages are sent",
      "ntp server <ip> synchronizes a device's clock to that time source",
      "Configuration register 0x2102 = normal boot; 0x2142 = ignore startup-config (password recovery)",
      "boot system <location> tells the router which IOS image to load, tried in the order configured",
      "Three-tier design: access (user access) -> distribution (policy, aggregation, L3 boundary) -> core (backbone); two-tier collapses distribution+core",
      "A switch block (paired distribution switches + split access uplinks) contains a failure domain so one failure doesn't affect the whole network"
    ],
    "q": [
      {
        "type": "mc",
        "q": "What is the term used to indicate a variation of delay?",
        "options": [
          "Latency",
          "Serialization delay",
          "Speed mismatch",
          "Jitter"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Jitter is the variation in the delay of received packets, distinct from latency which is the delay itself."
      },
      {
        "type": "mc",
        "q": "A network engineer performs a ping test and receives a value that shows the time it takes for a packet to travel from a source to a destination device and return. Which term describes the value?",
        "options": [
          "Jitter",
          "Latency",
          "Priority",
          "Bandwidth"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Latency is the delay between sending and receiving a packet, and a round-trip ping measurement is a common way to measure it."
      },
      {
        "type": "mc",
        "q": "What role do network devices play in the IntServ QoS model?",
        "options": [
          "Network devices ensure that resources are available before traffic is allowed to be sent by a host through the network.",
          "Network devices provide a best-effort approach to forwarding traffic.",
          "Network devices are configured to service multiple classes of traffic and handle traffic as it arrives.",
          "Network devices use QoS on a hop-by-hop basis to provide excellent scalability."
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "IntServ uses signaling (like RSVP) so every device along the path reserves resources before traffic is sent, which is why it scales poorly on large networks."
      },
      {
        "type": "mc",
        "q": "Which device would be classified as a trusted endpoint?",
        "options": [
          "Switch",
          "Router",
          "Firewall",
          "IP phone"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Trusted endpoints, like IP phones and wireless access points, are devices capable of marking their own application traffic at Layer 2 or Layer 3 before it enters the network."
      },
      {
        "type": "mc",
        "q": "What is the benefit of deploying Layer 3 QoS marking across an enterprise network?",
        "options": [
          "Layer 3 marking can carry the QoS information end-to-end.",
          "Layer 3 marking can carry QoS information on switches that are not IP aware.",
          "Layer 3 marking can be carried in the 802.1Q fields.",
          "Layer 3 marking can be used to carry non-IP traffic."
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Because the DSCP value lives in the IP header, Layer 3 marking survives across every hop from source to destination, unlike Layer 2 CoS which only exists on one link."
      },
      {
        "type": "mc",
        "q": "What is the function of a QoS trust boundary?",
        "options": [
          "A trust boundary identifies the location where traffic cannot be remarked.",
          "A trust boundary only allows traffic to enter if it has previously been marked.",
          "A trust boundary identifies which devices trust the marking on packets that enter a network.",
          "A trust boundary only allows traffic from trusted endpoints to enter the network."
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The trust boundary is set as close to the source as possible and marks the point where the network starts honoring the QoS markings on incoming packets."
      },
      {
        "type": "mc",
        "q": "What are two approaches to prevent packet loss due to congestion on an interface? (Choose two.)",
        "options": [
          "Drop lower-priority packets and increase link capacity",
          "Decrease buffer space and disable queuing mechanisms",
          "Prevent bursts of traffic and decrease buffer space",
          "Disable queuing mechanisms and prevent bursts of traffic"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The real approaches to prevent congestion-related loss are increasing link capacity, increasing buffer space, and dropping lower-priority packets first; decreasing buffer space or disabling queuing only makes congestion worse."
      },
      {
        "type": "mc",
        "q": "What configuration scenario would offer the most protection to SNMP get and set messages?",
        "options": [
          "SNMPv2 for in-band management with read-write community strings",
          "SNMPv1 with out-of-band management in a private subnet",
          "SNMPv3 configured with the auth security level",
          "SNMP community strings"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "SNMPv3 is the only version that supports authentication and encryption of management traffic; v1 and v2c rely on plaintext community strings."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. The network administrator enters copy running-config tftp on R1 and is prompted for the address or name of the remote host. What IP address should the administrator enter at the prompt?",
        "options": [
          "192.168.9.254",
          "192.168.10.2",
          "192.168.11.252",
          "192.168.11.254"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The prompt asks for the address of the TFTP server itself, not the router's own interface or gateway address."
      },
      {
        "type": "mc",
        "q": "The command ntp server 10.1.1.1 is issued on a router. What impact does this command have?",
        "options": [
          "Determines which server to send system log files to",
          "Synchronizes the system clock with the time source with IP address 10.1.1.1",
          "Identifies the server on which to store backup configurations",
          "Ensures that all logging will have a time stamp associated with it"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The ntp server command points the device to an authoritative time source so its clock stays synchronized."
      },
      {
        "type": "mc",
        "q": "As the network administrator you have been asked to implement EtherChannel on the corporate network. What does this configuration consist of?",
        "options": [
          "Providing redundant links that dynamically block or forward traffic",
          "Grouping two devices to share a virtual IP address",
          "Grouping multiple physical ports to increase bandwidth between two switches",
          "Providing redundant devices to allow traffic to flow in the event of device failure"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "EtherChannel bundles several physical switch ports into one logical link, multiplying available bandwidth between two switches while STP treats the bundle as a single link."
      },
      {
        "type": "mc",
        "q": "What is a definition of a two-tier LAN network design?",
        "options": [
          "Access and core layers collapsed into one tier, and the distribution layer on a separate tier",
          "Distribution and core layers collapsed into one tier, and the access layer on a separate tier",
          "Access, distribution, and core layers collapsed into one tier, with a separate backbone layer",
          "Access and distribution layers collapsed into one tier, and the core layer on a separate tier"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A two-tier design merges the distribution and core functions into a single tier, which is sufficient for smaller sites that don't need three full tiers."
      },
      {
        "type": "mc",
        "q": "What are two reasons to create a network baseline? (Choose two.)",
        "options": [
          "To identify future abnormal network behavior and determine if the network can deliver the required policies",
          "To select a routing protocol and to design a network according to a proper model",
          "To determine what kind of equipment to implement and to evaluate security vulnerabilities",
          "To design a network according to a proper model and evaluate security vulnerabilities"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A baseline captures normal performance so later abnormal behavior stands out, and it verifies the network can actually deliver the policies it was designed for."
      },
      {
        "type": "mc",
        "q": "A computer can access devices on the same network but cannot access devices on other networks. What is the probable cause of this problem?",
        "options": [
          "The computer has an incorrect subnet mask.",
          "The computer has an invalid default gateway address.",
          "The cable is not connected properly to the NIC.",
          "The computer has an invalid IP address."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Local communication doesn't need a gateway, but reaching any other network does -- a missing or wrong default gateway is the classic cause of this exact symptom."
      },
      {
        "type": "mc",
        "q": "In which step of gathering symptoms does the network engineer determine if the problem is at the core, distribution, or access layer of the network?",
        "options": [
          "Gather information.",
          "Narrow the scope.",
          "Document the symptoms.",
          "Determine ownership."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Narrowing the scope is specifically where the engineer decides which layer of the hierarchy the fault lives in before digging into individual devices."
      },
      {
        "type": "mc",
        "q": "A network administrator is deploying QoS with the ability to provide a special queue for voice traffic so that voice traffic is forwarded before network traffic in other queues. Which queuing method would be the best choice?",
        "options": [
          "LLQ",
          "CBWFQ",
          "WFQ",
          "FIFO"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "LLQ adds a strict-priority queue on top of CBWFQ so delay-sensitive traffic like voice is always serviced first."
      },
      {
        "type": "mc",
        "q": "What are two characteristics of voice traffic? (Choose two.)",
        "options": [
          "Voice traffic latency should not exceed 150 ms, and dropped voice packets are not retransmitted",
          "Voice traffic is unpredictable and inconsistent, and requires at least 384 kbps of bandwidth",
          "Voice traffic consumes lots of network resources, and requires at least 384 kbps of bandwidth",
          "Voice traffic is unpredictable and inconsistent, and consumes lots of network resources"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Voice is smooth, predictable, and low-bandwidth, but very delay-sensitive -- it needs under 150 ms latency and lost packets are simply dropped rather than resent."
      },
      {
        "type": "mc",
        "q": "Which type of network traffic cannot be managed using congestion avoidance tools?",
        "options": [
          "TCP",
          "ICMP",
          "IP",
          "UDP"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Congestion avoidance relies on TCP's ability to throttle back, so connectionless UDP traffic has no such mechanism and can't be managed the same way."
      },
      {
        "type": "mc",
        "q": "When QoS is implemented in a converged network, which two factors can be controlled to improve network performance for real-time traffic? (Choose two.)",
        "options": [
          "Delay and jitter",
          "Packet addressing and packet routing",
          "Link speed and packet routing",
          "Packet addressing and link speed"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "QoS mechanisms exist specifically to control delay and jitter, the two factors that matter most for real-time voice and video."
      },
      {
        "type": "mc",
        "q": "An administrator wants to replace the configuration file on a Cisco router by loading a new configuration file from a TFTP server. What two things does the administrator need to know before performing this task? (Choose two.)",
        "options": [
          "Name of the configuration file on the TFTP server, and the TFTP server IP address",
          "Name of the configuration file currently on the router, and the configuration register value",
          "Router IP address, and configuration register value",
          "Name of the configuration file currently on the router, and router IP address"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "To pull a specific file from a TFTP server the router needs the server's address and the exact file name -- the router's current config name is irrelevant since it's being replaced."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Which of the three Cisco IOS images shown will load into RAM?",
        "options": [
          "The router selects an image depending on the boot system command in the configuration.",
          "The router selects an image depending on the value of the configuration register.",
          "The router selects the third Cisco IOS image because it is the most recent IOS image.",
          "The router selects the third Cisco IOS image because it contains the advipservicesk9 image."
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "When boot system commands are present in the configuration, they explicitly tell the router which IOS image to load, in the order listed."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. What two types of devices are connected to R1? (Choose two.)",
        "options": [
          "A switch and a router",
          "A hub and a repeater",
          "A repeater and a Source Route Bridge",
          "A hub and a Source Route Bridge"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The neighbor discovery output identifies the connected platforms as a Cisco switch and another Cisco router."
      },
      {
        "type": "mc",
        "q": "What are three functions provided by the syslog service? (Choose three.)",
        "options": [
          "To gather logging information, select what is logged, and specify the destination of captured messages",
          "To periodically poll agents for data and provide traffic analysis",
          "To provide statistics on packets flowing through a device and provide traffic analysis",
          "To periodically poll agents for data and provide statistics on packets"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Syslog's three jobs are gathering log data, letting you choose what gets logged, and sending it to a chosen destination -- polling agents and traffic statistics are SNMP/NetFlow functions, not syslog."
      },
      {
        "type": "mc",
        "q": "What is the function of the MIB element as part of a network management system?",
        "options": [
          "To collect data from SNMP agents",
          "To send and retrieve network management information",
          "To change configurations on SNMP agents",
          "To store data about a device"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The Management Information Base is a local database on the managed device that stores the operational data the SNMP agent exposes."
      },
      {
        "type": "mc",
        "q": "What network design would contain the scope of disruptions on a network should a failure occur?",
        "options": [
          "The reduction in the number of redundant devices and connections in the network core",
          "The installation of only enterprise class equipment throughout the network",
          "The deployment of distribution layer switches in pairs and the division of access layer switch connections between them",
          "The configuration of all access layer devices to share a single gateway"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Pairing distribution switches and splitting access-layer uplinks between them creates a switch block, so a single failure only affects that block."
      },
      {
        "type": "mc",
        "q": "Which action should be taken when planning for redundancy on a hierarchical network design?",
        "options": [
          "Add alternate physical paths for data to traverse the network",
          "Continually purchase backup equipment for the network",
          "Implement STP portfast between the switches on the network",
          "Immediately replace a non-functioning module, service or device on a network"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Redundancy is built by installing alternate physical paths so traffic can reroute around a failed link or device."
      },
      {
        "type": "mc",
        "q": "What are two benefits of extending access layer connectivity to users through a wireless medium? (Choose two.)",
        "options": [
          "Increased flexibility and reduced costs",
          "Increased network management options and decreased critical points of failure",
          "Decreased critical points of failure and increased bandwidth availability",
          "Increased network management options and increased bandwidth availability"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Wireless access extends connectivity flexibly and cheaply without running new cable -- it doesn't add bandwidth or reduce failure points."
      },
      {
        "type": "mc",
        "q": "What is a basic function of the Cisco Borderless Architecture access layer?",
        "options": [
          "Aggregates Layer 2 broadcast domains",
          "Provides access to the user",
          "Aggregates Layer 3 routing boundaries",
          "Provides fault isolation"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The access layer's job is granting end devices entry to the network; aggregation and routing boundaries are distribution-layer functions, and fault isolation is a core-layer function."
      },
      {
        "type": "mc",
        "q": "Which characteristic would most influence a network design engineer to select a multilayer switch over a Layer 2 switch?",
        "options": [
          "Ability to have multiple forwarding paths through the switched network based on VLAN number(s)",
          "Ability to build a routing table",
          "Ability to provide power to directly-attached devices and the switch itself",
          "Ability to aggregate multiple ports for maximum data throughput"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Only a multilayer (Layer 3) switch can build and use a routing table to route between VLANs, which a pure Layer 2 switch cannot do."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Why are routers R1 and R2 not able to establish an OSPF adjacency?",
        "options": [
          "The serial interfaces are not in the same area.",
          "The process numbers are not the same in both routers.",
          "A backbone router cannot establish an adjacency with an ABR router.",
          "The router ID values are not the same in both routers."
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "OSPF neighbors on a shared link must be configured in the same area; the process number can differ between routers and doesn't need to match."
      },
      {
        "type": "mc",
        "q": "When is the most appropriate time to measure network operations to establish a network performance baseline?",
        "options": [
          "Whenever high network use is detected, so that how the network performs under stress can be monitored",
          "During quiet vacation periods, so that the level of non-data traffic can be determined",
          "At the same time each day across a set period of average working days, so that typical traffic patterns can be established",
          "At random times during a 10 week period, so that abnormal traffic levels can be detected"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A useful baseline reflects typical, average conditions, so it should be measured consistently during normal working periods, not during unusual spikes or quiet times."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. A user has configured a NIC on the PC as shown but finds that the PC is unable to access the Internet. What is the problem?",
        "options": [
          "The preferred DNS address is incorrect.",
          "The default gateway address is incorrect.",
          "The settings were not validated upon exit.",
          "There should not be an alternate DNS server."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Without a correct default gateway, a host can't send traffic beyond its own subnet, which blocks all Internet access even if DNS and IP settings are fine."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. A network engineer configured an ACL preventing Telnet and HTTP access to the HQ web server from guest users. After implementing the ACL, no one can access any of the HQ servers. What is the problem?",
        "options": [
          "Inbound ACLs must be routed before they are processed.",
          "The ACL is implicitly denying access to all the servers.",
          "Named ACLs require the use of port numbers.",
          "The ACL is applied to the interface using the wrong direction."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Every ACL ends with an implicit deny-all, so unless a permit statement was added for other legitimate traffic, that traffic gets silently blocked too."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. A network administrator has configured OSPFv2 on the two Cisco routers as shown. PC1 is unable to connect to PC2. What should the administrator do first when troubleshooting the OSPFv2 implementation?",
        "options": [
          "Disconnect the serial link between router R1 and R2.",
          "Turn off OSPFv2.",
          "Implement the network 192.168.255.0 0.0.0.3 area 0 command on router R1.",
          "Test Layer 3 connectivity between the directly connected routers."
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "OSPF adjacencies require working Layer 3 connectivity first, so confirming the routers can ping each other directly is the logical first troubleshooting step."
      },
      {
        "type": "mc",
        "q": "What type of traffic is described as requiring latency to be no more than 150 milliseconds (ms)?",
        "options": [
          "Voice",
          "Video",
          "Data",
          "Control traffic"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Voice is the most delay-sensitive traffic type and needs one-way latency kept under 150 ms to sound natural."
      },
      {
        "type": "mc",
        "q": "A network manager wants to add a time to log messages so that there is record of when the message was generated. What command should the administrator use on a Cisco router?",
        "options": [
          "show cdp interface",
          "ntp server 10.10.14.9",
          "service timestamps log datetime",
          "clock timezone PST -7"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The service timestamps log datetime command is what actually stamps each log message with the date and time it was generated."
      },
      {
        "type": "mc",
        "q": "In the three-tier hierarchical network design, which pair of functions belongs to the access layer?",
        "options": [
          "Represents the network edge, and provides network access to the user",
          "Implements network access policy, and establishes Layer 3 routing boundaries",
          "Provides high-speed backbone connectivity, and aggregates all the campus blocks",
          "Filters malicious traffic, and performs deep packet inspection"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The access layer is the network edge that end devices plug into -- policy enforcement and routing boundaries are distribution-layer jobs, and backbone aggregation is the core layer's job."
      },
      {
        "type": "mc",
        "q": "Which borderless switched network design principle satisfies user expectations of keeping the network always on?",
        "options": [
          "Resiliency",
          "Hierarchical",
          "Modularity",
          "Flexibility"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Resiliency is the design principle specifically about the network staying available and recovering quickly from failures."
      },
      {
        "type": "mc",
        "q": "What are two characteristics of the best-effort QoS model? (Choose two.)",
        "options": [
          "It does not provide a delivery guarantee, and it treats all network packets in the same way",
          "It allows end hosts to signal their QoS needs, and it uses a connection-oriented approach",
          "It provides preferential treatment for voice packets, and uses a connection-oriented approach",
          "It allows end hosts to signal their QoS needs, and provides preferential treatment for voice packets"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Best-effort is the default Internet model: no signaling, no reservations, and every packet gets identical treatment with no delivery guarantee."
      },
      {
        "type": "mc",
        "q": "Why is QoS an important issue in a converged network that combines voice, video, and data communications?",
        "options": [
          "Data communications are sensitive to jitter.",
          "Legacy equipment is unable to transmit voice and video without QoS.",
          "Voice and video communications are more sensitive to latency.",
          "Data communications must be given the first priority."
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Without QoS, delay-sensitive voice and video get dropped or delayed at the same rate as ordinary data, which noticeably degrades call and video quality."
      },
      {
        "type": "mc",
        "q": "A network administrator configures a router with the commands 'boot system tftp://c1900-universalk9-mz.SPA.152-4.M3.bin' then 'boot system rom'. What is the effect of the command sequence?",
        "options": [
          "On next reboot, the router will load the IOS image from ROM.",
          "The router will search and load a valid IOS image in the sequence of flash, TFTP, and ROM.",
          "The router will copy the IOS image from the TFTP server and then reboot the system.",
          "The router will load IOS from the TFTP server. If the image fails to load, it will load the IOS image from ROM."
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Multiple boot system commands are tried in the order they're configured, so the router tries TFTP first and falls back to the ROM image only if that fails."
      },
      {
        "type": "mc",
        "q": "Which statement describes SNMP operation?",
        "options": [
          "An SNMP agent that resides on a managed device collects information about the device and stores that information remotely in the MIB that is located on the NMS.",
          "A set request is used by the NMS to change configuration variables in the agent device.",
          "An NMS periodically polls the SNMP agents that are residing on managed devices by using traps to query the devices for data.",
          "A get request is used by the SNMP agent to query the device for data."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The NMS uses a set request to push configuration changes down to an agent; the MIB actually lives locally on the managed device, and it's the NMS (not the agent) that issues get requests."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. A network administrator issues the show lldp neighbors command on a switch. What are two conclusions that can be drawn? (Choose two.)",
        "options": [
          "Dev1 is connected to interface Fa0/5 of S1, and Dev2 is a switch",
          "Dev1 is a switch with mixed types of interfaces, and S1 has only two interfaces",
          "Dev1 is connected to interface Fa0/4 of Dev2, and S1 has only two interfaces",
          "Dev1 is a switch with mixed types of interfaces, and Dev1 is connected to Fa0/4 of Dev2"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The LLDP capability field shows a bridge (switch) code next to Dev2, and the local interface column shows Dev1 is off Fa0/5 on S1."
      },
      {
        "type": "mc",
        "q": "What are the three layers of the switch hierarchical design model? (Choose three.)",
        "options": [
          "Access, distribution, and core",
          "Network access, data link, and enterprise",
          "Access, data link, and enterprise",
          "Network access, distribution, and enterprise"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The three-tier switch hierarchy is access (user connectivity), distribution (policy/aggregation), and core (high-speed backbone) -- the other terms are OSI layers or unrelated labels, not design tiers."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Which devices exist in the failure domain when switch S3 loses power?",
        "options": [
          "S4 and PC_2",
          "PC_3 and PC_2",
          "PC_3 and AP_2",
          "S1 and S4"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A failure domain includes only the devices whose sole path to the rest of the network runs through the failed device -- here that's PC_3 and AP_2, which hang off S3."
      },
      {
        "type": "mc",
        "q": "A network designer is considering whether to implement a switch block on the company network. What is the primary advantage of deploying a switch block?",
        "options": [
          "This is network application software that prevents the failure of a single network device.",
          "The failure of a switch block will not impact all end users.",
          "This is a security feature that is available on all new Catalyst switches.",
          "A single core router provides all the routing between VLANs."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Switch blocks contain failures to just that block, so a problem in one block doesn't take down every user on the network."
      },
      {
        "type": "mc",
        "q": "Which troubleshooting tool would a network administrator use to check the Layer 2 header of frames that are leaving a particular host?",
        "options": [
          "Knowledge base",
          "Protocol analyzer",
          "CiscoView",
          "Baselining tool"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A protocol analyzer such as Wireshark can capture and display frame headers at any OSI layer, including Layer 2."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. R1 and R3 are connected to each other via the local serial 0/0/0 interface. Why are they not forming an adjacency?",
        "options": [
          "They have different routing processes.",
          "They have different router IDs.",
          "They are in different subnets.",
          "The connecting interfaces are configured as passive."
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "OSPF neighbors on a common link must share the same subnet; mismatched subnets on the connecting interfaces prevent the adjacency from forming, while differing process numbers or router IDs are actually fine."
      },
      {
        "type": "mc",
        "q": "What type of traffic is described as not resilient to loss?",
        "options": [
          "Video",
          "Data",
          "Voice",
          "Control traffic"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Video is more sensitive to dropped packets than voice, since lost video data causes more visible quality degradation per packet."
      },
      {
        "type": "mc",
        "q": "A network manager wants to list the contents of flash. What command should the administrator use on a Cisco router?",
        "options": [
          "show file systems",
          "dir",
          "lldp enable",
          "service timestamps log datetime"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The dir command lists the files stored in the current (or specified) file system, such as flash."
      },
      {
        "type": "mc",
        "q": "Voice packets are being received in a continuous stream by an IP phone, but because of network congestion the delay between each packet varies and is causing broken conversations. What term describes the cause of this condition?",
        "options": [
          "Buffering",
          "Latency",
          "Queuing",
          "Jitter"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Jitter specifically describes uneven spacing between packets that should be arriving at a steady interval, which is exactly what's breaking up the call."
      },
      {
        "type": "mc",
        "q": "A user is unable to reach the website when typing http://www.cisco.com in a web browser, but can reach the same site by typing the numeric IP address. What is the issue?",
        "options": [
          "DHCP",
          "DNS",
          "Default Gateway",
          "TCP/IP Protocol stack"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Since the site loads fine by IP address, basic connectivity and routing work -- the failure to resolve the name means DNS is the problem."
      },
      {
        "type": "mc",
        "q": "What type of traffic is described as tending to be unpredictable, inconsistent, and bursty?",
        "options": [
          "Audio",
          "Video",
          "Data",
          "Voice"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Video traffic varies heavily with scene complexity and motion, making its data rate unpredictable and bursty compared to the steady stream of voice traffic."
      },
      {
        "type": "mc",
        "q": "A network manager wants to determine the size of the Cisco IOS image file on the networking device. What command should the administrator use on a Cisco router?",
        "options": [
          "show flash0:",
          "copy flash: tftp:",
          "config-register 0x2102",
          "confreg 0x2142"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Viewing the contents of the flash file system (for example, show flash0:) reveals each file's size, including the IOS image."
      },
      {
        "type": "mc",
        "q": "What is the principle that is applied when a network technician is troubleshooting a network fault by using the divide-and-conquer method?",
        "options": [
          "Testing is performed at Layer 7 and at Layer 1, then at Layers 6 and 2, and so on, working towards the middle of the stack until all layers are verified as operational.",
          "Once it is verified that components in a particular layer are functioning properly, it can then be assumed that components in the layers below it are also functional.",
          "Testing is performed at all layers of the OSI model until a non-functioning component is found.",
          "Once it is verified that a component in a particular layer is functioning properly, testing can then be performed on any other layer."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Because upper layers depend on lower layers working correctly, confirming a middle layer works lets you safely assume everything below it is also fine, which is the core time-saving idea behind divide-and-conquer."
      },
      {
        "type": "mc",
        "q": "Which queuing algorithm has only a single queue and treats all packets equally?",
        "options": [
          "CBWFQ",
          "FIFO",
          "LLQ",
          "WFQ"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "FIFO (first-in, first-out) has no concept of priority or classification -- it's just one queue served strictly in arrival order."
      },
      {
        "type": "mc",
        "q": "What type of traffic is described as traffic that requires at least 30 Kbps of bandwidth?",
        "options": [
          "Voice",
          "Data",
          "Video",
          "Control traffic"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Voice codecs are compact and predictable, needing only about 30 kbps or more, far less bandwidth than video traffic."
      },
      {
        "type": "mc",
        "q": "What type of traffic is described as being able to tolerate a certain amount of latency, jitter, and loss without any noticeable effects?",
        "options": [
          "Voice",
          "Video",
          "Data",
          "Control traffic"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Ordinary data traffic isn't real-time, so it can absorb noticeable latency, jitter, and packet loss without a perceptible effect on the user, unlike voice and video which have strict, narrow tolerances for all three."
      },
      {
        "type": "mc",
        "q": "A network manager wants to view the amount of available and free memory, the type of file system, and its permissions. What command should the administrator use on a Cisco router?",
        "options": [
          "ntp server 10.10.14.9",
          "lldp enable",
          "clock timezone PST -7",
          "show file systems"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The show file systems command lists each available file system along with its size, free space, type, and permissions."
      },
      {
        "type": "mc",
        "q": "What type of traffic is described as requiring latency to be no more than 400 milliseconds (ms)?",
        "options": [
          "Voice",
          "Data",
          "Video",
          "Control traffic"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Video traffic tolerates more one-way delay than voice, needing latency under about 400 ms rather than voice's stricter 150 ms limit."
      },
      {
        "type": "mc",
        "q": "What type of traffic is described as consisting of traffic that requires a higher priority if interactive?",
        "options": [
          "Data",
          "Voice",
          "Video",
          "Control traffic"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Data traffic priority depends on the application -- interactive, mission-critical data gets bumped up in priority, while voice and video are always treated as high priority regardless."
      },
      {
        "type": "mc",
        "q": "A network manager wants to configure the router to load a new image from flash during bootup. What command should the administrator use on a Cisco router?",
        "options": [
          "copy flash: tftp:",
          "boot system",
          "clock set 14:25:00 nov 13 2018",
          "copy tftp startup-config"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The boot system global configuration command tells the router which IOS image and location to use when it boots."
      },
      {
        "type": "mc",
        "q": "What type of traffic is described as predictable and smooth?",
        "options": [
          "Data",
          "Video",
          "Voice",
          "Control traffic"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Voice generates a steady, evenly-paced stream of small packets, unlike the bursty nature of video or the irregular nature of general data traffic."
      },
      {
        "type": "mc",
        "q": "A network manager wants to ensure that the device will ignore the startup config file during startup and bypass the required passwords. What command should the administrator use on a Cisco router?",
        "options": [
          "copy usbflash0:/R1-Config",
          "copy running-config tftp",
          "confreg 0x2142",
          "config-register 0x2102"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Setting the configuration register to 0x2142 tells the router to skip the startup-config on boot, which is the basis of the password recovery procedure."
      },
      {
        "type": "mc",
        "q": "What type of traffic is described as having a high volume of data per packet?",
        "options": [
          "Video",
          "Voice",
          "Data",
          "Control traffic"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Video packets carry far more data per packet than the small, fixed-size voice packets, since video encodes much richer content."
      },
      {
        "type": "mc",
        "q": "A network manager wants to backup the running configuration to a file server. What command should the administrator use on a Cisco router?",
        "options": [
          "cd usbflash0:",
          "show file systems",
          "copy running-config tftp",
          "dir"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Copying the running-config to a TFTP server is the standard way to back up the active configuration to a remote file server."
      },
      {
        "type": "mc",
        "q": "What type of traffic is described as consisting of traffic that gets a lower priority if it is not mission-critical?",
        "options": [
          "Voice",
          "Data",
          "Video",
          "Control traffic"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Data traffic that isn't interactive or mission-critical is only given whatever bandwidth is left over after voice, video, and priority data are served."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. The network administrator enters the shown command sequence into the R1 router to back up its configuration to a TFTP server. When the router prompts for an address or remote host name, what IP address should the administrator enter at the prompt?",
        "options": [
          "192.168.9.254",
          "192.168.10.2",
          "192.168.11.252",
          "192.168.11.254"
        ],
        "correct": 2,
        "pairs": [],
        "code": "R1# copy running-config tftp\nAddress or name of remote host [ ]?",
        "diagram": {
          "nodes": [
            {
              "id": "PC",
              "label": "PC-A (192.168.10.2)",
              "kind": "pc"
            },
            {
              "id": "R1",
              "label": "R1 (Fa0/0 192.168.10.1, Fa0/1 192.168.9.254)",
              "kind": "router"
            },
            {
              "id": "R2",
              "label": "R2 (Fa0/1 192.168.11.254)",
              "kind": "router"
            },
            {
              "id": "TFTP",
              "label": "TFTP Server (192.168.11.252)",
              "kind": "server"
            }
          ],
          "links": [
            {
              "from": "PC",
              "to": "R1",
              "label": "192.168.10.0/24 LAN"
            },
            {
              "from": "R1",
              "to": "R2",
              "label": "WAN link"
            },
            {
              "from": "R2",
              "to": "TFTP",
              "label": "192.168.11.0/24 LAN"
            }
          ]
        },
        "explanation": "The copy running-config tftp command prompts for the address of the TFTP server itself, not any local router or PC interface address; in the exhibited topology the TFTP server is reachable at 192.168.11.252, while 192.168.11.254 is R2's own LAN interface in that same subnet, 192.168.10.2 is PC-A's address, and 192.168.9.254 is R1's other local interface."
      },
      {
        "type": "mc",
        "q": "The following command is issued on a router. What impact does this command have?",
        "options": [
          "It determines which server to send system log files to.",
          "It synchronizes the system clock with the time source at IP address 10.1.1.1.",
          "It identifies the server on which to store backup configurations.",
          "It ensures that all logging will have a time stamp associated with it."
        ],
        "correct": 1,
        "pairs": [],
        "code": "R1(config)# ntp server 10.1.1.1",
        "diagram": null,
        "explanation": "The ntp server command configures a router to synchronize its system clock with an external Network Time Protocol source, here the device at 10.1.1.1, so that the router's time is accurate and consistent with the rest of the network."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Routers R1 and R2 are connected to each other over a directly connected serial link, but they are not able to establish an OSPF adjacency. Why?",
        "options": [
          "The serial interfaces are not in the same area.",
          "The process numbers are not the same in both routers.",
          "A backbone router cannot establish an adjacency with an ABR router.",
          "The router ID values are not the same in both routers."
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "R1",
              "label": "R1 (Area 0)",
              "kind": "router"
            },
            {
              "id": "R2",
              "label": "R2 (Area 1)",
              "kind": "router"
            }
          ],
          "links": [
            {
              "from": "R1",
              "to": "R2",
              "label": "Serial link - area mismatch"
            }
          ]
        },
        "explanation": "OSPF requires the connecting interfaces on both ends of a link to be configured in the same area to form a neighbor adjacency; here R1's serial interface is in area 0 while R2's matching interface is in area 1, so no adjacency can form even though the process numbers and router IDs are irrelevant to this failure."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. A network engineer configured an ACL to block Telnet and HTTP access to the HQ web server (192.168.1.10) from guest users on the Branch LAN (192.168.10.0/24). After applying the ACL, no one, including legitimate HQ users, can reach any of the HQ servers. What is the problem?",
        "options": [
          "Inbound ACLs must be routed before they are processed.",
          "The ACL is implicitly denying access to all the servers.",
          "Named ACLs require the use of port numbers.",
          "The ACL is applied to the interface using the wrong direction."
        ],
        "correct": 1,
        "pairs": [],
        "code": "access-list 101 deny tcp 192.168.10.0 0.0.0.255 host 192.168.1.10 eq 23\naccess-list 101 deny tcp 192.168.10.0 0.0.0.255 host 192.168.1.10 eq 80\n!\ninterface GigabitEthernet0/1\n ip access-group 101 in",
        "diagram": null,
        "explanation": "Every ACL ends with an implicit deny-all statement, and because no permit statements were added after the two explicit deny entries, the ACL blocks all other traffic to every HQ server rather than only the intended Telnet and HTTP traffic from the guest network."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. R1 and R2 run OSPFv2 across their directly connected serial link. PC1, attached to R1's LAN, is unable to connect to PC2, attached to R2's LAN. What should the administrator do first when troubleshooting this OSPFv2 implementation?",
        "options": [
          "Disconnect the serial link between router R1 and R2.",
          "Turn off OSPFv2.",
          "Implement the network 192.168.255.0 0.0.0.3 area 0 command on router R1.",
          "Test Layer 3 connectivity between the directly connected routers."
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "PC1",
              "label": "PC1",
              "kind": "pc"
            },
            {
              "id": "R1",
              "label": "R1",
              "kind": "router"
            },
            {
              "id": "R2",
              "label": "R2",
              "kind": "router"
            },
            {
              "id": "PC2",
              "label": "PC2",
              "kind": "pc"
            }
          ],
          "links": [
            {
              "from": "PC1",
              "to": "R1",
              "label": "LAN"
            },
            {
              "from": "R1",
              "to": "R2",
              "label": "Serial link - OSPFv2"
            },
            {
              "from": "R2",
              "to": "PC2",
              "label": "LAN"
            }
          ]
        },
        "explanation": "Before troubleshooting routing-protocol specifics, the administrator should first verify basic Layer 3 reachability (such as a ping) between R1 and R2 across the directly connected serial link, since a routing protocol cannot form adjacencies or exchange routes over a link that lacks basic IP connectivity."
      },
      {
        "type": "match",
        "q": "Match the functions to the corresponding hierarchical network design layer. (Not all options are used.)",
        "options": [],
        "correct": -1,
        "pairs": [
          [
            "Represents the network edge",
            "Access layer"
          ],
          [
            "Provides network access to the user",
            "Access layer"
          ],
          [
            "Implements network access policy",
            "Distribution layer"
          ],
          [
            "Establishes Layer 3 routing boundaries",
            "Distribution layer"
          ],
          [
            "Provides high-speed backbone connectivity",
            "Core layer"
          ],
          [
            "Functions as an aggregator for all the campus blocks",
            "Core layer"
          ]
        ],
        "code": "",
        "diagram": null,
        "explanation": "In the Cisco three-tier hierarchical design, the access layer gives end users their network edge connection, the distribution layer aggregates access-layer traffic while enforcing policy and establishing Layer 3 boundaries, and the core layer provides high-speed, resilient backbone connectivity between distribution blocks."
      },
      {
        "type": "match",
        "q": "Match the borderless switched network guideline description to its design principle. (Not all options are used.)",
        "options": [],
        "correct": -1,
        "pairs": [
          [
            "Facilitates understanding the role of each device at every tier, simplifying deployment and troubleshooting",
            "Hierarchical"
          ],
          [
            "Satisfies user expectations for keeping the network always on",
            "Resiliency"
          ],
          [
            "Allows seamless network expansion and integrated service enablement without redesigning the existing network",
            "Modularity"
          ],
          [
            "Allows intelligent traffic load sharing by using all available network resources",
            "Flexibility"
          ]
        ],
        "code": "",
        "diagram": null,
        "explanation": "The Cisco borderless switched network design guidelines each map to a distinct principle: hierarchical design gives every device a clear tiered role, modularity lets the network expand without redesign, resiliency keeps the network always on, and flexibility enables intelligent load sharing across all resources."
      },
      {
        "type": "mc",
        "q": "A network administrator configures a router with the following command sequence. What is the effect of this command sequence?",
        "options": [
          "On next reboot, the router will load the IOS image from ROM.",
          "The router will search and load a valid IOS image in the sequence of flash, TFTP, and ROM.",
          "The router will copy the IOS image from the TFTP server and then reboot the system.",
          "The router will load IOS from the TFTP server. If the image fails to load, it will load the IOS image from ROM."
        ],
        "correct": 3,
        "pairs": [],
        "code": "R1(config)# boot system tftp://c1900-universalk9-mz.SPA.152-4.M3.bin\nR1(config)# boot system rom",
        "diagram": null,
        "explanation": "Multiple boot system commands are tried in the order they were entered, so the router first attempts to load the IOS image from the TFTP server and only falls back to loading the image from ROM if that first attempt fails."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit, which shows the output of the show lldp neighbors command entered on switch S1. Which conclusion can be drawn from this output?",
        "options": [
          "Dev1 is a switch with mixed types of interfaces.",
          "Dev2 is a switch.",
          "Dev1 is connected to interface Fa0/4 of Dev2.",
          "S1 has only two interfaces."
        ],
        "correct": 1,
        "pairs": [],
        "code": "S1# show lldp neighbors\nCapability codes:\n    (R) Router, (B) Bridge, (T) Telephone, (C) DOCSIS Cable Device\n    (W) WLAN Access Point, (P) Repeater, (S) Station, (O) Other\n\nDevice ID      Local Intf     Hold-time   Capability   Port ID\nDev1           Fa0/5          120         T            Fa0/1\nDev2           Fa0/8          120         B            Gi0/1\n\nTotal entries displayed: 2",
        "diagram": null,
        "explanation": "The Capability field shows 'B' (Bridge) for Dev2, identifying it as a switch, whereas Dev1's entry shows a Telephone (T) capability and is reached off S1's Fa0/5 port rather than being connected through Dev2's Fa0/4, and S1 clearly has more than two local interfaces since both Fa0/5 and Fa0/8 appear in the table."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Distribution switch S1 connects to access switches S3 and S4. S3 provides access-layer connectivity to PC_3 and AP_2, while S4 provides access-layer connectivity to PC_2. Which devices lose network connectivity when switch S3 loses power?",
        "options": [
          "S4 and PC_2",
          "PC_3 and PC_2",
          "PC_3 and AP_2",
          "S1 and S4"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "S1",
              "label": "S1 (Distribution)",
              "kind": "switch"
            },
            {
              "id": "S3",
              "label": "S3 (Access)",
              "kind": "switch"
            },
            {
              "id": "S4",
              "label": "S4 (Access)",
              "kind": "switch"
            },
            {
              "id": "PC_3",
              "label": "PC_3",
              "kind": "pc"
            },
            {
              "id": "AP_2",
              "label": "AP_2",
              "kind": "ap"
            },
            {
              "id": "PC_2",
              "label": "PC_2",
              "kind": "pc"
            }
          ],
          "links": [
            {
              "from": "S1",
              "to": "S3",
              "label": "Uplink"
            },
            {
              "from": "S1",
              "to": "S4",
              "label": "Uplink"
            },
            {
              "from": "S3",
              "to": "PC_3",
              "label": ""
            },
            {
              "from": "S3",
              "to": "AP_2",
              "label": ""
            },
            {
              "from": "S4",
              "to": "PC_2",
              "label": ""
            }
          ]
        },
        "explanation": "PC_3 and AP_2 are single-homed to access switch S3, so they lose their only path to the network when S3 loses power, while S4 and the devices attached to it (such as PC_2) are unaffected because S4 has its own independent uplink to distribution switch S1, illustrating how containing failure domains at the access layer limits the impact of a single device failure."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Routers R1 and R3 are directly connected to each other via their local Serial0/0/0 interfaces, but the two routers are not forming an OSPF adjacency. Why?",
        "options": [
          "They have different routing processes.",
          "They have different router IDs.",
          "They are in different subnets.",
          "The connecting interfaces are configured as passive."
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": {
          "nodes": [
            {
              "id": "R1",
              "label": "R1 (Se0/0/0 - subnet A)",
              "kind": "router"
            },
            {
              "id": "R3",
              "label": "R3 (Se0/0/0 - subnet B)",
              "kind": "router"
            }
          ],
          "links": [
            {
              "from": "R1",
              "to": "R3",
              "label": "Serial0/0/0 to Serial0/0/0 - different subnets"
            }
          ]
        },
        "explanation": "For two OSPF routers to form a neighbor adjacency over a directly connected link, their connecting interfaces must belong to the same IP subnet; here R1's and R3's Serial0/0/0 interfaces are addressed in different subnets, so OSPF hello packets cannot establish a neighbor relationship even though the process IDs, router IDs, and passive-interface settings are not the issue."
      }
    ]
  },
  {
    "n": "Emerging Network Technologies",
    "c": "Modules 13-14",
    "intro": "Modules 13-14 shift from box-by-box CLI work to how modern networks and data centers actually get built and run: cloud computing, server virtualization, software-defined networking, and automation. The throughline is abstraction — separating what a service does (the application) from the hardware underneath it, and separating network intelligence (the control plane) from the boxes that just forward traffic (the data plane). Layered on top of that is automation: instead of typing commands into every device by hand, engineers use RESTful APIs and data formats like JSON, XML, and YAML, driven by tools like Puppet, Chef, Ansible, and SaltStack, to configure networks programmatically.",
    "concepts": [
      "Cloud computing separates the application from the hardware — you consume a service (storage, compute, an app) without owning the physical gear behind it; virtualization is the underlying technology that usually makes this possible by letting one physical machine run many virtual ones.",
      "A hypervisor creates and manages virtual machines. Type 1 (bare-metal) installs directly on server hardware and is what data centers use for performance and scale; Type 2 (hosted) installs on top of an existing OS — like running a Windows VM on a MacBook — fine for a laptop but not for a data center.",
      "Every traditional network device bundles a control plane (the 'brains' — routing/switching decisions) and a data plane (the 'muscle' — actually forwarding frames/packets). SDN pulls the control plane out of individual devices and centralizes it in a controller that programs switches via a protocol like OpenFlow, so forwarding logic is managed from one place instead of box by box.",
      "Cisco Application Centric Infrastructure (ACI) is Cisco's SDN answer for the data center: the Application Policy Infrastructure Controller (APIC) is the centralized brain that translates application/business policy into the actual configuration pushed down to Nexus 9000 switches.",
      "Network automation replaces manual CLI typing with machine-readable instructions. Each configuration management tool has its own name for a 'script': Puppet uses a manifest, Chef uses a cookbook, Ansible uses a playbook, SaltStack uses pillar data — this pairing is a favorite exam trap, so memorize it directly.",
      "RESTful APIs let applications talk to devices/services over HTTP using standard verbs (GET=read, POST=create, PUT/PATCH=update, DELETE=delete). A REST call targets an API server address and a resource (the path/object requested); appended after the resource is a query string built from parameters (input values) and often a key (authenticates the caller).",
      "Data moving between apps and APIs is written in JSON, XML, or YAML. JSON uses braces and key:value pairs; XML uses custom-defined tags (unlike HTML's fixed tag set); YAML uses indentation instead of brackets and punctuation, and is technically a superset of JSON — any valid JSON is also valid YAML.",
      "A site-to-site VPN uses a VPN gateway at each end of the tunnel (never client software on individual hosts) to encrypt traffic between two networks, and it's always configured statically — the hosts on either side have no idea the VPN even exists. This exam bank also touches how attackers abuse trust in core protocols: a rogue DHCP server handing out a false gateway sets up a man-in-the-middle, and flooding half-open TCP connections (a SYN flood) is a classic denial-of-service technique."
    ],
    "f": [
      "Cloud computing = consuming a service (SaaS/PaaS/IaaS) over the network; virtualization = one physical machine running many VMs via a hypervisor -- related but not the same thing",
      "Type 1 hypervisor = installed directly on bare-metal hardware (data centers); Type 2 hypervisor = installed on top of a host OS (laptops/desktops)",
      "Control plane = makes forwarding decisions (routing, ARP, STP); data plane = actually forwards traffic using those decisions",
      "SDN centralizes the control plane in a controller; OpenFlow is the standard southbound protocol used to program flow tables in SDN",
      "Cisco ACI's APIC (Application Policy Infrastructure Controller) is the centralized brain that translates policy into configuration for Nexus 9000 switches",
      "CEF's FIB (Forwarding Information Base) is pre-populated from the routing table; the adjacency table is built from ARP/Layer 2 info",
      "Public cloud = open to anyone; private cloud = dedicated to one org; community cloud = shared by orgs with common concerns; hybrid cloud = a mix of two or more",
      "SaaS = a full application delivered over the network (e.g., cloud-based payroll); IaaS = virtualized infrastructure like routers, switches, and servers delivered as a service",
      "Configuration tool -> its script name: Puppet = manifest, Chef = cookbook, Ansible = playbook, SaltStack = pillar",
      "Puppet and Chef are both written in Ruby and use agent-based master/agent architectures; Ansible is Python-based and agentless (SSH-driven, no software installed on managed nodes); SaltStack is also Python-based but uses an agent -- called a minion -- in a master/minion architecture",
      "REST CRUD mapping: GET = read, POST = create, PUT/PATCH = update, DELETE = delete -- REST is the most widely used API style for web services",
      "A REST API query string is built from key (authentication), format (response type, e.g. json), and parameters (input data) -- separate from the API server address and the resource path",
      "JSON uses {key:value} braces and brackets; XML uses custom open/close tags; YAML uses indentation and is technically a superset of JSON",
      "Public API = open to any developer with no restrictions; partner API = shared under a formal business agreement between two orgs; private/internal API = restricted to one organization's own use",
      "Site-to-site VPN = statically configured, with a VPN gateway (not client software) at each end doing the encrypt/decrypt -- internal hosts never know it exists",
      "DHCP spoofing (a rogue server handing out a false default gateway) sets up a man-in-the-middle; a SYN flood overwhelms a target with half-open TCP connections -- both abuse trust in normal protocol behavior"
    ],
    "q": [
      {
        "type": "mc",
        "q": "A company uses a cloud-based payroll system. Which cloud computing technology is this company using?",
        "options": [
          "browser as a service (BaaS)",
          "infrastructure as a service (IaaS)",
          "software as a service (SaaS)",
          "wireless as a service (WaaS)"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "SaaS delivers a complete, ready-to-use application (like payroll) over the network, so the company never manages the underlying servers or infrastructure."
      },
      {
        "type": "mc",
        "q": "For a data center, what is the difference in the server virtualization data traffic compared with the traditional client-server model?",
        "options": [
          "Data traffic from clients will be routed to multiple virtual servers.",
          "There are significant data exchanges between virtual servers.",
          "There is more data traffic flowing from virtual servers to clients.",
          "More network control traffic is generated between virtual servers and clients."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Multiple VMs sharing one host generate heavy east-west (server-to-server) traffic that doesn't exist in the traditional model, where servers mostly just answer client requests."
      },
      {
        "type": "mc",
        "q": "Which component in a traditional infrastructure device provides Layer 2 and Layer 3 functions to create data paths within a network?",
        "options": [
          "data plane",
          "control plane",
          "adjacency table",
          "forwarding information base"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The control plane runs the Layer 2 (e.g., STP) and Layer 3 (e.g., routing protocol) logic that establishes the paths data will travel; the data plane then just forwards packets along those already-built paths."
      },
      {
        "type": "mc",
        "q": "Which network traffic management technology is a basic element in SDN implementations?",
        "options": [
          "OpenFlow",
          "OpenStack",
          "IEEE 802.1aq",
          "Interface to the Routing System"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "OpenFlow is the standard southbound protocol SDN controllers use to install forwarding entries into switches."
      },
      {
        "type": "mc",
        "q": "Which type of hypervisor would most likely be used in a data center?",
        "options": [
          "Type 2",
          "Type 1",
          "Nexus",
          "Hadoop"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Type 1 (bare-metal) hypervisors run directly on server hardware, giving the performance and scale data centers need."
      },
      {
        "type": "mc",
        "q": "Which is a characteristic of a Type 1 hypervisor?",
        "options": [
          "installed directly on a server",
          "best suited for consumers and not for an enterprise environment",
          "does not require management console software",
          "installed on an existing operating system"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Type 1 hypervisors install directly on the bare-metal server hardware, with no host operating system underneath them."
      },
      {
        "type": "mc",
        "q": "Which two layers of the OSI model are associated with SDN network control plane functions that make forwarding decisions?",
        "options": [
          "Layer 2 and Layer 3",
          "Layer 1 and Layer 4",
          "Layer 3 and Layer 4",
          "Layer 4 and Layer 5"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Forwarding decisions are Layer 2 (switching/MAC) and Layer 3 (routing/IP) functions — that's the traffic the control plane decides how to move."
      },
      {
        "type": "mc",
        "q": "What pre-populates the FIB on Cisco devices that use CEF to process packets?",
        "options": [
          "the routing table",
          "the adjacency table",
          "the ARP table",
          "the DSP"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "CEF builds its Forwarding Information Base directly from the routing table (with the adjacency table filled from ARP) so lookups are pre-computed instead of done per-packet."
      },
      {
        "type": "mc",
        "q": "What is a function of the data plane of a network device?",
        "options": [
          "sending information to the CPU for processing",
          "building the routing table",
          "resolving MAC addresses",
          "forwarding traffic flows"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The data plane's whole job is moving/forwarding traffic flows using the tables the control plane already built."
      },
      {
        "type": "mc",
        "q": "Which statement describes the concept of cloud computing?",
        "options": [
          "separation of application from hardware",
          "separation of management plane from control plane",
          "separation of operating system from hardware",
          "separation of control plane from data plane"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Cloud computing is defined by decoupling the application/service you consume from the specific physical hardware running it."
      },
      {
        "type": "mc",
        "q": "Which cloud model provides services for a specific organization or entity?",
        "options": [
          "a public cloud",
          "a hybrid cloud",
          "a private cloud",
          "a community cloud"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A private cloud is built and dedicated for a single organization, unlike public (anyone) or community (shared by orgs with common needs) clouds."
      },
      {
        "type": "mc",
        "q": "What two benefits are gained when an organization adopts cloud computing and virtualization?",
        "options": [
          "Pay-as-you-go cost model for compute/storage, and the ability to rapidly respond to growing data volume needs",
          "Distributed processing of terabyte-sized data sets, and elimination of cyberattack vulnerabilities",
          "Elimination of cyberattack vulnerabilities, and increased dependence on onsite IT resources",
          "Distributed processing of terabyte-sized data sets, and increased dependence on onsite IT resources"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Cloud/virtualization let a company treat computing as a pay-as-you-go utility and scale quickly with data growth — they don't eliminate security risk or reduce the need for IT."
      },
      {
        "type": "mc",
        "q": "Which type of Hypervisor is implemented when a user with a laptop running the Mac OS installs a Windows virtual OS instance?",
        "options": [
          "type 2",
          "virtual machine",
          "type 1",
          "bare metal"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Installing a guest OS on top of an already-running host OS (macOS) is the definition of a Type 2 (hosted) hypervisor."
      },
      {
        "type": "mc",
        "q": "A small company is considering moving many of its data center functions to the cloud. What are three advantages of this plan?",
        "options": [
          "Pay only for the processing/storage capacity actually used, scale capacity up or down as needed, and avoid managing in-house growth in demand",
          "Fixed-fee billing no matter how much is used, easy growth of single-tenant data centers, and owning your own servers",
          "Owning and administering your own servers, fixed-fee billing regardless of usage, and easy single-tenant scaling",
          "Easy single-tenant data center scaling, fixed-fee billing, and full ownership of servers and storage"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Cloud economics are built on elastic, pay-for-what-you-use scaling — the opposite of fixed fees, single-tenant limits, and owning your own hardware."
      },
      {
        "type": "mc",
        "q": "How does virtualization help with disaster recovery within a data center?",
        "options": [
          "support of live migration",
          "guarantee of power",
          "improvement of business practices",
          "supply of consistent air flow"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Virtualization lets a running VM be live-migrated to another host, so a hardware failure or outage doesn't have to take a service down."
      },
      {
        "type": "mc",
        "q": "What technology allows users to access data anywhere and at any time?",
        "options": [
          "Cloud computing",
          "virtualization",
          "micromarketing",
          "data analytics"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Cloud computing delivers data and applications over the Internet, so they're reachable from any location at any time."
      },
      {
        "type": "mc",
        "q": "Which action takes place in the assurance element of the IBN model?",
        "options": [
          "verification and corrective action",
          "configuring systems",
          "translation of policies",
          "integrity checks"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Assurance is the continuous-verification stage of Intent-Based Networking — it checks that the network matches intent and triggers corrective action when it doesn't."
      },
      {
        "type": "mc",
        "q": "Which data format represents information using curly braces { } with comma-separated key:value pairs, and is commonly used to represent data for network automation applications?",
        "options": [
          "XML",
          "YAML",
          "HTML",
          "JSON"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "JSON's signature syntax is curly-brace-delimited key:value pairs, which is why it's so common in network automation and REST API payloads."
      },
      {
        "type": "mc",
        "q": "What is the function of the key contained in most RESTful APIs?",
        "options": [
          "It is the top-level object of the API query.",
          "It is used to authenticate the requesting source.",
          "It represents the main query components in the API request.",
          "It is used in the encryption of the message by an API request."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "An API key identifies and authenticates whoever is making the request, similar to a password."
      },
      {
        "type": "mc",
        "q": "Which two configuration management tools are developed using Ruby?",
        "options": [
          "Puppet and Chef",
          "Ansible and SaltStack",
          "SaltStack and RESTCONF",
          "Ansible and RESTCONF"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Puppet and Chef are both written in Ruby with agent-based architectures; Ansible and SaltStack are both Python-based, but only Ansible is truly agentless — SaltStack still relies on an agent called a minion."
      },
      {
        "type": "mc",
        "q": "Which term is used to describe a set of instructions for execution by the configuration management tool Puppet?",
        "options": [
          "Playbook",
          "Cookbook",
          "Manifest",
          "Pillar"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Puppet calls its configuration instructions a manifest, written in Puppet's declarative language."
      },
      {
        "type": "mc",
        "q": "Which term is used to describe a set of instructions for execution by the configuration management tool SaltStack?",
        "options": [
          "Cookbook",
          "Manifest",
          "Pillar",
          "Playbook"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "SaltStack stores configuration data for its minions in files called pillars."
      },
      {
        "type": "mc",
        "q": "Which scenario describes the use of a public API?",
        "options": [
          "It requires a license.",
          "It can be used with no restrictions.",
          "It is used between a company and its business partners.",
          "It is used only within an organization."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Public (open) APIs are freely available to any developer with no special agreement needed — unlike partner or private APIs."
      },
      {
        "type": "mc",
        "q": "What is YAML?",
        "options": [
          "It is a scripting language.",
          "It is a data format and superset of JSON.",
          "It is a compiled programming language.",
          "It is a web application."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "YAML is a human-readable data-serialization format, and every valid JSON document is also valid YAML."
      },
      {
        "type": "mc",
        "q": "Which RESTFul operation corresponds to the HTTP GET method?",
        "options": [
          "post",
          "patch",
          "update",
          "read"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "In REST's CRUD mapping, HTTP GET corresponds to 'read' — retrieving a resource without changing it."
      },
      {
        "type": "mc",
        "q": "Which technology virtualizes the network control plane and moves it to a centralized controller?",
        "options": [
          "SDN",
          "fog computing",
          "cloud computing",
          "IaaS"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Software-Defined Networking centralizes the control plane in an SDN controller instead of leaving it distributed across every device."
      },
      {
        "type": "mc",
        "q": "What are two functions of hypervisors?",
        "options": [
          "To manage virtual machines, and to allocate physical system resources to virtual machines",
          "To partition the hard drive, and to protect the host from malware from the virtual machines",
          "To protect the host from malware, and to share antivirus software across virtual machines",
          "To partition the hard drive, and to share antivirus software across virtual machines"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Hypervisors create/manage VMs and divide the host's CPU, memory, and storage among them; they don't handle antivirus or malware protection."
      },
      {
        "type": "mc",
        "q": "What is a difference between the functions of Cloud computing and virtualization?",
        "options": [
          "Cloud computing requires hypervisor technology whereas virtualization is a fault tolerance technology.",
          "Cloud computing separates the application from the hardware whereas virtualization separates the OS from the underlying hardware.",
          "Cloud computing provides services on web-based access whereas virtualization provides services on data access through virtualized Internet connections.",
          "Cloud computing utilizes data center technology whereas virtualization is not used in data centers."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Cloud computing abstracts the application away from any specific hardware, while virtualization abstracts an OS/VM away from the physical machine underneath it."
      },
      {
        "type": "mc",
        "q": "How is the YAML data format structure different from JSON?",
        "options": [
          "It uses indentations.",
          "It uses end tags.",
          "It uses hierarchical levels of nesting.",
          "It uses brackets and commas."
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "YAML shows structure through whitespace indentation instead of JSON's brackets and commas."
      },
      {
        "type": "mc",
        "q": "What is the most widely used API for web services?",
        "options": [
          "XML-RPC",
          "SOAP",
          "JSON-RPC",
          "REST"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "REST's simplicity over plain HTTP has made it the dominant API style for web services, ahead of SOAP and XML-RPC."
      },
      {
        "type": "mc",
        "q": "What is REST?",
        "options": [
          "It is a way to store and interchange data in a structured format.",
          "It is an architecture style for designing web service applications.",
          "It is a human readable data structure that is used by applications for storing, transforming, and reading data.",
          "It is a protocol that allows administrators to manage nodes on an IP network."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "REST (Representational State Transfer) is an architectural style with a set of constraints, not a protocol or data format itself."
      },
      {
        "type": "mc",
        "q": "What is a difference between the XML and HTML data formats?",
        "options": [
          "XML does not use predefined tags whereas HTML does use predefined tags.",
          "XML encloses data within a pair of tags whereas HTML uses a pair of quotation marks to enclose data.",
          "XML formats data in binary whereas HTML formats data in plain text.",
          "XML does not require indentation for each key/value pair but HTML does require indentation."
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "XML lets you invent your own custom tags to describe data, while HTML has a fixed, predefined tag set for displaying pages."
      },
      {
        "type": "mc",
        "q": "To avoid purchasing new hardware, a company wants to take advantage of idle system resources and consolidate the number of servers while allowing for multiple operating systems on a single hardware platform. What service or technology would support this requirement?",
        "options": [
          "dedicated servers",
          "Cisco ACI",
          "virtualization",
          "software defined networking"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Virtualization lets multiple OS instances share one physical server, exploiting idle capacity instead of buying new hardware."
      },
      {
        "type": "mc",
        "q": "In the RESTful API request http://www.mapquestapi.com/directions/v2/route?outFormat=json&key=KEY&from=San+Jose,Ca&to=Monterey,Ca, which part represents the 'resources' component?",
        "options": [
          "http://www.mapquestapi.com",
          "directions/v2/route",
          "outFormat=json&key=KEY&from=San+Jose,Ca&to=Monterey,Ca",
          "key=KEY"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The resources portion is the path identifying the specific object/endpoint being requested — here, directions/v2/route — separate from the API server address, the full query string, and the key."
      },
      {
        "type": "mc",
        "q": "Which cloud computing opportunity would provide the use of network hardware such as routers and switches for a particular company?",
        "options": [
          "software as a service (SaaS)",
          "wireless as a service (WaaS)",
          "infrastructure as a service (IaaS)",
          "browser as a service (BaaS)"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "IaaS provides virtualized computing infrastructure — including network hardware like routers and switches — as a service."
      },
      {
        "type": "mc",
        "q": "What component is considered the brains of the ACI architecture and translates application policies?",
        "options": [
          "the Application Network Profile endpoints",
          "the Nexus 9000 switch",
          "the hypervisor",
          "the Application Policy Infrastructure Controller"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The APIC is Cisco ACI's centralized controller, translating application-level policy into actual switch configuration."
      },
      {
        "type": "mc",
        "q": "Which statement describes the concept of cloud computing?",
        "options": [
          "separation of management plane from control plane",
          "separation of control plane from data plane",
          "separation of application from hardware",
          "separation of operating system from hardware"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Cloud computing's core idea is decoupling the application from any specific underlying hardware."
      },
      {
        "type": "mc",
        "q": "In which situation would a partner API be appropriate?",
        "options": [
          "an internet search engine allowing developers to integrate the search engine into their own software applications",
          "company sales staff accessing internal sales data from their mobile devices",
          "someone creating an account on an external app or website by using his or her social media credentials",
          "a vacation service site interacting with hotel databases to display information from all the hotels on its web site"
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A partner API is shared under a formal business agreement between two specific organizations, like a travel site and its hotel partners."
      },
      {
        "type": "mc",
        "q": "Because of enormous growth in web traffic, a company has planned to purchase additional servers to help handle the web traffic. What service or technology would support this requirement?",
        "options": [
          "virtualization",
          "data center",
          "dedicated servers",
          "cloud services"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Adding more dedicated servers directly increases capacity to match growing web traffic."
      },
      {
        "type": "mc",
        "q": "ABCTech is investigating the use of automation for some of its products. In order to control and test these products, the programmers require Windows, Linux, and MAC OS on their computers. What service or technology would support this requirement?",
        "options": [
          "dedicated servers",
          "software defined networking",
          "virtualization",
          "Cisco ACI"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Virtualization lets each programmer run Windows, Linux, and macOS as separate VMs on one machine instead of needing three physical computers."
      },
      {
        "type": "mc",
        "q": "What are three components used in the query portion of a typical RESTful API request?",
        "options": [
          "Format, parameters, and key",
          "API server, resources, and protocol",
          "Resources, key, and API server",
          "Protocol, format, and API server"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "The query string is built from the key (authentication), format (response type), and parameters (input values) — the API server, protocol, and resource path are separate parts of the URL."
      },
      {
        "type": "mc",
        "q": "A company has recently become multinational. Employees are working remotely, in different time zones, and they need access to company services from any place at any time. What service or technology would support this requirement?",
        "options": [
          "dedicated servers",
          "cloud services",
          "Cisco ACI",
          "virtualization"
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Cloud services give remote, multinational employees anytime/anywhere access to company applications over the Internet."
      },
      {
        "type": "mc",
        "q": "Following a multicontinent advertising campaign for a new product, a company finds its client database and volume of orders are overloading its on-site computer systems but the company does not have any room to expand. What service or technology would support this requirement?",
        "options": [
          "cloud services",
          "dedicated servers",
          "data center",
          "virtualization"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Cloud services let the company burst capacity elastically without needing physical room to add on-site hardware."
      },
      {
        "type": "mc",
        "q": "A network administrator has been tasked with creating a disaster recovery plan. As part of this plan, the administrator is looking for a backup site for all of the data on the company servers. What service or technology would support this requirement?",
        "options": [
          "virtualization",
          "software defined networking",
          "data center",
          "dedicated servers"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A (often offsite/cloud) data center provides the backup storage location a disaster recovery plan needs."
      },
      {
        "type": "mc",
        "q": "Which is a requirement of a site-to-site VPN?",
        "options": [
          "It requires hosts to use VPN client software to encapsulate traffic.",
          "It requires a VPN gateway at each end of the tunnel to encrypt and decrypt traffic.",
          "It requires the placement of a VPN server at the edge of the company network.",
          "It requires a client/server architecture."
        ],
        "correct": 1,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A site-to-site VPN encrypts/decrypts traffic at a VPN gateway on each end of the tunnel — individual hosts run no VPN client at all."
      },
      {
        "type": "mc",
        "q": "Which statement describes an important characteristic of a site-to-site VPN?",
        "options": [
          "It must be statically set up.",
          "After the initial connection is established, it can dynamically change connection information.",
          "It requires using a VPN client on the host PC.",
          "It is ideally suited for use by mobile workers."
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "Site-to-site VPNs are configured statically between two fixed gateways — unlike remote-access VPNs, they aren't built for mobile workers or client software."
      },
      {
        "type": "mc",
        "q": "Which protocol is attacked when a cybercriminal provides an invalid gateway in order to create a man-in-the-middle attack?",
        "options": [
          "DHCP",
          "ICMP",
          "DNS",
          "HTTP or HTTPS"
        ],
        "correct": 0,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A rogue DHCP server can hand out a false default gateway address, routing victim traffic through the attacker — a DHCP spoofing man-in-the-middle attack."
      },
      {
        "type": "mc",
        "q": "In which TCP attack is the cybercriminal attempting to overwhelm a target host with half-open TCP connections?",
        "options": [
          "reset attack",
          "session hijacking attack",
          "SYN flood attack",
          "port scan attack"
        ],
        "correct": 2,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A SYN flood sends a barrage of SYN packets without completing the handshake, leaving the target with exhausted half-open connections."
      },
      {
        "type": "mc",
        "q": "Which statement describes a VPN?",
        "options": [
          "VPNs use logical connections to create public networks through the Internet.",
          "VPNs use open source virtualization software to create the tunnel through the Internet.",
          "VPNs use dedicated physical connections to transfer data between remote users.",
          "VPNs use virtual connections to create a private network through a public network."
        ],
        "correct": 3,
        "pairs": [],
        "code": "",
        "diagram": null,
        "explanation": "A VPN creates a private, encrypted virtual connection tunneled through a public network like the Internet."
      },
      {
        "type": "mc",
        "q": "Refer to the exhibit. Which data format is used to represent the data for network automation applications?",
        "options": [
          "XML",
          "YAML",
          "HTML",
          "JSON"
        ],
        "correct": 3,
        "pairs": [],
        "code": "{\n  \"message\": \"success\",\n  \"username\": \"jsmith01\",\n  \"user_info\": {\n    \"First_name\": \"John\",\n    \"Last_name\": \"Smith\"\n  }\n}",
        "diagram": null,
        "explanation": "The exhibit shows data expressed as key/value pairs enclosed in braces with keys in double quotation marks separated from values by a colon, which is the structure of JSON (JavaScript Object Notation); XML would instead enclose each value in a matching pair of tags, YAML would use indentation without quotes, braces, or commas, and HTML is a markup language for web page layout rather than a general data-interchange format."
      },
      {
        "type": "match",
        "q": "Match each HTTP method used in a RESTful API request to the CRUD (Create, Read, Update, Delete) database operation it performs.",
        "options": [],
        "correct": -1,
        "pairs": [
          [
            "POST",
            "Create"
          ],
          [
            "GET",
            "Read"
          ],
          [
            "PUT/PATCH",
            "Update"
          ],
          [
            "DELETE",
            "Delete"
          ]
        ],
        "code": "",
        "diagram": null,
        "explanation": "RESTful APIs map the four CRUD operations onto standard HTTP methods: POST creates a new resource, GET reads or retrieves an existing resource, PUT or PATCH updates an existing resource, and DELETE removes a resource."
      },
      {
        "type": "match",
        "q": "Refer to the exhibit. Match each term to the corresponding component of the RESTful API request shown below.",
        "options": [],
        "correct": -1,
        "pairs": [
          [
            "API server",
            "http://www.mapquestapi.com"
          ],
          [
            "resources",
            "directions/v2/route"
          ],
          [
            "query",
            "outFormat=json&key=KEY&from=San+Jose,Ca&to=Monterey,Ca"
          ],
          [
            "format",
            "outFormat=json"
          ],
          [
            "key",
            "key=KEY"
          ],
          [
            "parameters",
            "from=San+Jose,Ca&to=Monterey,Ca"
          ]
        ],
        "code": "http://www.mapquestapi.com/directions/v2/route?outFormat=json&key=KEY&from=San+Jose,Ca&to=Monterey,Ca",
        "diagram": null,
        "explanation": "In this RESTful API request, the API server is the host being contacted (http://www.mapquestapi.com), resources identifies the object or service being accessed (directions/v2/route), the query is everything after the '?' that specifies what is being requested (outFormat=json&key=KEY&from=San+Jose,Ca&to=Monterey,Ca), format specifies the returned data type (outFormat=json), key authenticates the requesting source (key=KEY), and parameters carry the specific values being sent (from=San+Jose,Ca&to=Monterey,Ca)."
      }
    ]
  }
];

const ALL = [];
DATA.forEach((m, mi) => m.q.forEach((t, qi) => ALL.push(Object.assign({ key: mi + "-" + qi, mi }, t))));
const BOX_W = [8, 4, 2, 1];
const BOX_NAME = ["new", "learning", "review", "mastered"];
const BOX_COLOR = [C.dim, C.amber, C.cyan, C.ok];

// ══════════════════════════════════════════════════════════
//  ENGINE + APP
// ══════════════════════════════════════════════════════════
export default function ENSATrainer() {
  const [view, setView] = useState("home");
  const [scope, setScope] = useState("all");
  const [studyMi, setStudyMi] = useState(0);
  const [prog, setProg] = useState({});
  const [inject, setInject] = useState([]);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [cur, setCur] = useState(null);
  const [picked, setPicked] = useState(null);
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

  const startDrill = (sc) => { const nxt = pickNext(sc, inject, null, answered); if (!nxt) return; setScope(sc); setCur(nxt.q); setPicked(null); setMatchDone(null); resetTutor(); setView("drill"); };

  const recordResult = (key, isRight) => {
    const p = getP(key), np = Object.assign({}, prog);
    if (isRight) { np[key] = { box: Math.min(3, p.box + 1), wrong: p.wrong, seen: p.seen + 1 }; setCorrect(c => c + 1); setInject(inj => inj.filter(j => j.key !== key)); }
    else { np[key] = { box: 0, wrong: p.wrong + 1, seen: p.seen + 1 }; setInject(inj => inj.filter(j => j.key !== key).concat([{ key, due: answered + 4 }])); }
    setProg(np); setAnswered(a => a + 1);
  };

  const answer = (i) => {
    if (picked !== null) return;
    setPicked(i);
    recordResult(cur.key, i === cur.correct);
  };

  const answerMatch = (isRight) => {
    if (matchDone !== null) return;
    setMatchDone(isRight);
    recordResult(cur.key, isRight);
  };

  const next = () => { resetTutor(); const nxt = pickNext(scope, inject, cur.key, answered); if (!nxt) { setView("home"); return; } if (nxt.injIdx >= 0) setInject(inject.filter((_, idx) => idx !== nxt.injIdx)); setCur(nxt.q); setPicked(null); setMatchDone(null); };

  const callLLM = async (userMsg, isFirstBreakdown) => {
    const wrongPick = cur.type === "mc" && picked !== null && picked !== cur.correct ? cur.options[picked] : null;
    const qDesc = cur.type === "match"
      ? "a matching exercise: " + cur.pairs.map(p => p[0] + " -> " + p[1]).join("; ")
      : "\"" + cur.q + "\" Options: " + cur.options.join(" | ") + ". Correct answer: \"" + cur.options[cur.correct] + "\".";
    const ctx = "You are a patient CCNA3 ENSA (Enterprise Networking, Security, and Automation) tutor. The student has already mastered CCNA1 and CCNA2 fundamentals. Focus your teaching on the ENSA-level concept this question tests. Current practice item: " + qDesc +
      (wrongPick ? " The student had chosen the wrong option: \"" + wrongPick + "\"." : "") +
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

  const mastery = (mi) => { let s = 0; DATA[mi].q.forEach((_, qi) => s += getP(mi + "-" + qi).box); return Math.round((s / (3 * DATA[mi].q.length)) * 100); };
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
        <p style={{ color: C.dim, fontSize: 14, marginTop: 4, lineHeight: 1.6 }}>Open a module to study it, then drill. Some questions are drag-to-match, some show real CLI output, some reference a topology diagram. Ask the tutor anything after you answer.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "14px 0 20px" }}>
          <button onClick={() => startDrill("all")} style={btn(C.amber, C.bg)}>Drill everything</button>
          <button onClick={() => { if (weakCount) startDrill("weak"); }} style={btn(weakCount ? "#2a1616" : C.panel, weakCount ? C.bad : C.dim, weakCount ? C.bad : C.line)}>Weak spots ({weakCount})</button>
          <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 12, color: C.dim, alignSelf: "center" }}>answered {answered} · {answered ? Math.round((correct / answered) * 100) : 0}% · mastered {masteredCount}/{ALL.length}</div>
        </div>
        {DATA.map((m, mi) => {
          const pct = mastery(mi);
          return (
            <div key={mi} style={{ background: C.panel, border: "1px solid " + C.line, borderRadius: 10, padding: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.cyan, minWidth: 90 }}>{m.c}</div>
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

  if (view === "study") {
    const m = DATA[studyMi];
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
  const isDone = cur.type === "match" ? matchDone !== null : picked !== null;

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
          {cur.type === "match" && <span style={chip(C.violet)}>drag to match</span>}
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, marginTop: 0 }}>{cur.q}</p>

        <CodeBlock code={cur.code} />
        <NetworkDiagram diagram={cur.diagram} />

        {cur.type === "mc" ? (
          <div style={{ display: "grid", gap: 8 }}>
            {cur.options.map((opt, i) => {
              let bd = C.line, bg = C.well, fg = C.ink;
              if (picked !== null) { if (i === cur.correct) { bd = C.ok; bg = "#12241a"; fg = C.ok; } else if (i === picked) { bd = C.bad; bg = "#2a1616"; fg = C.bad; } else fg = C.dim; }
              return <button key={i} onClick={() => answer(i)} style={{ textAlign: "left", padding: "11px 14px", borderRadius: 8, border: "1px solid " + bd, background: bg, color: fg, fontSize: 14, cursor: picked === null ? "pointer" : "default", transition: "all .15s" }}>{opt}</button>;
            })}
          </div>
        ) : (
          <MatchQuestion pairs={cur.pairs} locked={matchDone !== null} onCheck={answerMatch} />
        )}

        {isDone && (
          <div style={{ marginTop: 14 }}>
            {cur.type === "mc" && picked !== cur.correct && <div style={{ fontFamily: MONO, fontSize: 12, color: C.bad, marginBottom: 6 }}>Wrong — reset to "new". This one comes back within the next few cards.</div>}
            {cur.type === "match" && !matchDone && <div style={{ fontFamily: MONO, fontSize: 12, color: C.bad, marginBottom: 6 }}>Not all matched — reset to "new". This one comes back within the next few cards.</div>}
            <p style={{ fontSize: 13.5, color: "#b8c7d6", lineHeight: 1.6, margin: "0 0 12px", borderLeft: "3px solid " + ((cur.type === "mc" ? picked === cur.correct : matchDone) ? C.ok : C.bad), paddingLeft: 10 }}>{cur.explanation}</p>

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
