"use client";
// import DashboardShell from "./DashboardShell";
import { fetchDashboardStats, DashboardStats } from "./dashboardService";
import { getUserByName } from "@/lib/actions/dbActions";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// const TOPICS = [
//   { label: "Daily life",    pct: 82, color: "var(--accent-blue)" },
//   { label: "Travel",        pct: 67, color: "var(--accent-green)" },
//   { label: "Food & culture",pct: 54, color: "var(--accent-orange)" },
//   { label: "Work & career", pct: 40, color: "var(--accent-purple)" },
//   { label: "Grammar",       pct: 28, color: "var(--accent-red)" },
// ];

const WEEKS = [32, 52, 47, 68, 60, 65, 80, 90];
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const CEFR_ACTIVE = 3;

// function generateHeatmap() {
//   const shades = ["#3a3a3c", "#1a3a4a", "#0a5080", "#0a84ff"];
//   return Array.from({ length: 24 }, () =>
//     Array.from({ length: 7 }, () => {
//       const v = Math.random();
//       return v < 0.38 ? shades[0] : v < 0.58 ? shades[1] : v < 0.78 ? shades[2] : shades[3];
//     })
//   );
// }

function buildHeatmap(activityHeatmap: Record<string, number>): string[] {
  const shades = ["#3a3a3c", "#1a3a4a", "#0a5080", "#0a84ff"];
  const max = Math.max(...Object.values(activityHeatmap), 1);
  
  // Build last 168 days (24 weeks × 7 days)
  const days: string[] = [];
  for (let i = 167; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split("T")[0];
    const count = activityHeatmap[key] || 0;
    const ratio = count / max;
    const color = ratio === 0 ? shades[0] : ratio < 0.33 ? shades[1] : ratio < 0.66 ? shades[2] : shades[3];
    days.push(color);
  }
  return days;
}

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const router = useRouter();
  // const [heatmap, setHeatmap] = useState<string[][]>([]);
  const [userInitial, setUserInitial] = useState("?");

  // useEffect(() => {
  //   // setHeatmap(generateHeatmap());
  //   const storedName = sessionStorage.getItem("ll_user_name") || "";
  //   setUserInitial(storedName.charAt(0).toUpperCase() || "?");

  //   // Fetch stats once on mount
  //   const user = {
  //     id: "1",
  //     name: storedName,
  //     total_time: 0,
  //     conversations: [],
  //     vocab: [],
  //     native_lang: sessionStorage.getItem("ll_native_lang") || "English",
  //     learning_langs: [sessionStorage.getItem("ll_learning_lang") || ""],
  //     skill_level: Number(sessionStorage.getItem("ll_duo_score")) || 0,
  //     cefr_level: sessionStorage.getItem("ll_cefr") || "A1",
  //   };

  //   fetchDashboardStats(user)
  //   .then(data => {
  //     console.log("stats response:", data);
  //     setStats(data.stats);
  //     setStatsLoading(false);
  //   })
  //   .catch((err) => {
  //     console.error("stats fetch failed:", err);
  //     setStatsLoading(false);
  //   });
  // }, []);

  useEffect(() => {
    const storedName = sessionStorage.getItem("ll_user_name") || "";
    setUserInitial(storedName.charAt(0).toUpperCase() || "?");

    const isRefresh = searchParams.get("refresh") === "true";
  
    // Fetch real user from MongoDB first
    getUserByName(storedName).then(realUser => {
      if (!realUser) { setStatsLoading(false); return; }
  
      const user = {
        id: realUser.id,
        name: realUser.name,
        total_time: realUser.total_time,
        conversations: realUser.conversations,
        vocab: realUser.vocab,
        native_lang: realUser.native_lang,
        learning_langs: realUser.learning_langs,
        skill_level: realUser.skill_level,
        cefr_level: realUser.cefr_level ?? "A1",
      };
  
      fetchDashboardStats(user)
        .then(data => {
          console.log("stats response:", data);
          setStats(data.stats);
          setStatsLoading(false);
        })
        .catch((err) => {
          console.error("stats fetch failed:", err);
          setStatsLoading(false);
        });
    });
  }, [searchParams]);

  const handleLogout = () => {
    sessionStorage.removeItem("ll_user_name");
    router.push("/login");
  };

  return (
    <>
      <style>{`
        .dash-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .dash-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 700px) {
          .dash-grid-4 { grid-template-columns: repeat(2, 1fr); }
          .dash-grid-2 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>

        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", background: "var(--bg-secondary)",
          borderBottom: "0.5px solid var(--border-subtle)",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <Link href="/dashboard" style={{
            fontSize: 17, fontWeight: 700, color: "var(--text-primary)", textDecoration: "none",
          }}>
            LinguaLink
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={handleLogout} style={{
              fontSize: 13, fontWeight: 500, color: "var(--text-muted)",
              background: "none", border: "0.5px solid var(--border-subtle)",
              borderRadius: 7, padding: "6px 14px", cursor: "pointer",
              fontFamily: "inherit", transition: "color 0.15s, border-color 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-red)"; e.currentTarget.style.borderColor = "var(--accent-red)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
            >
              Log out
            </button>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "var(--accent-green-bg)", border: "1.5px solid var(--accent-green)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: "var(--accent-green)",
            }}>{userInitial}</div>
          </div>
        </nav>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px" }}>

          {/* CTA */}
          {/* <div style={{
            background: "var(--bg-secondary)", borderRadius: 14,
            padding: "20px 22px", marginBottom: 14,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
            border: "0.5px solid var(--border-subtle)",
          }}>
            <div>
              <p style={{ fontSize: 11, color: "var(--accent-blue)", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 4 }}>READY TO PRACTICE</p>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>German · B2</h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Match with speakers near your level</p>
            </div>
            <Link href="/waiting" style={{
              background: "var(--accent-green)", color: "#fff", borderRadius: 10,
              padding: "13px 28px", fontSize: 14, fontWeight: 700,
              textDecoration: "none", whiteSpace: "nowrap",
            }}>Start call</Link>
          </div> */}
          <div style={{
            background: "var(--bg-secondary)", borderRadius: 14,
            padding: "20px 22px", marginBottom: 14,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
            border: "0.5px solid var(--border-subtle)",
          }}>
            <div>
              <p style={{ fontSize: 11, color: "var(--accent-blue)", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 4 }}>READY TO PRACTICE</p>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                {stats ? `${stats.learning_lang} · ${stats.cefr_level}` : "Loading..."}
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Match with speakers near your level</p>
            </div>
            <Link href="/waiting" style={{
              background: "var(--accent-green)", color: "#fff", borderRadius: 10,
              padding: "13px 28px", fontSize: 14, fontWeight: 700,
              textDecoration: "none", whiteSpace: "nowrap",
            }}>Start call</Link>
          </div>

          {/* Stat cards */}
          {/* <div className="dash-grid-4" style={{ marginBottom: 14 }}>
            {[
              { label: "SESSIONS",      value: "142",   sub: "+8 this week",       subColor: "var(--accent-green)" },
              { label: "WORDS LEARNED", value: "2,340", sub: "+120 this week",     subColor: "var(--accent-blue)" },
              { label: "TOTAL TIME",    value: "48h",   sub: "avg 20 min/session", subColor: "var(--accent-orange)" },
              { label: "PARTNERS",      value: "389",   sub: "all time",           subColor: "var(--accent-purple)" },
            ].map((s) => (
              <div key={s.label} style={{
                background: "var(--bg-secondary)", borderRadius: 12,
                padding: "16px 18px", border: "0.5px solid var(--border-subtle)",
              }}>
                <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, marginBottom: 5 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: s.subColor }}>{s.sub}</p>
              </div>
            ))}
          </div> */}

          {/* <DashboardShell /> */}

          {statsLoading ? (
            <div className="dash-grid-4" style={{ marginBottom: 14 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                  background: "var(--bg-secondary)", borderRadius: 12,
                  padding: "16px 18px", border: "0.5px solid var(--border-subtle)",
                  display: "flex", flexDirection: "column", gap: 8,
                }}>
                  <div style={{ height: 10, width: "50%", background: "var(--bg-tertiary)", borderRadius: 4 }} />
                  <div style={{ height: 26, width: "70%", background: "var(--bg-tertiary)", borderRadius: 4 }} />
                  <div style={{ height: 10, width: "60%", background: "var(--bg-tertiary)", borderRadius: 4 }} />
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="dash-grid-4" style={{ marginBottom: 14 }}>
              {[
                { label: "SESSIONS",      value: stats.total_interactions.toString(),        sub: `+${stats.new_words_this_week.length} new words this week`, subColor: "var(--accent-green)" },
                { label: "WORDS LEARNED", value: `${stats.vocab_size}`,    sub: `avg ${stats.avg_words_per_session.toFixed(1)} per session`,  subColor: "var(--accent-blue)" },
                { label: "TOTAL TIME",    value: `${Math.round(stats.total_convo_time_seconds / 60)}m`,    subColor: "var(--accent-orange)" },
                { label: "NEW THIS WEEK", value: stats.new_words_this_week.length.toString(), sub: `${stats.new_words_per_minute.toFixed(1)} new words/min`,      subColor: "var(--accent-purple)" },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "var(--bg-secondary)", borderRadius: 12,
                  padding: "16px 18px", border: "0.5px solid var(--border-subtle)",
                }}>
                  <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 6 }}>{s.label}</p>
                  <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, marginBottom: 5 }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: s.subColor }}>{s.sub}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "20px 0" }}>
              No conversations yet — start a call to see your stats!
            </div>
          )}

          {/* Heatmap */}
          {/* <div style={{
            background: "var(--bg-secondary)", borderRadius: 12,
            padding: "18px 20px", marginBottom: 14,
            border: "0.5px solid var(--border-subtle)",
          }}>
            <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 12 }}>
              CONVERSATION ACTIVITY · LAST 24 WEEKS
            </p>
            <div style={{ display: "flex", gap: 3 }}>
              {heatmap.length > 0 ? heatmap.map((col, ci) => (
                <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
                  {col.map((color, ri) => (
                    <div key={ri} style={{ height: 8, borderRadius: 2, background: color }} />
                  ))}
                </div>
              )) : (
                <div style={{ height: 80, width: "100%", background: "var(--bg-tertiary)", borderRadius: 6 }} />
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, color: "var(--text-hint)" }}>less</span>
              {["#3a3a3c","#1a3a4a","#0a5080","#0a84ff"].map((c) => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
              ))}
              <span style={{ fontSize: 11, color: "var(--text-hint)" }}>more</span>
            </div>
          </div> */}

          {/* Heatmap */}
          <div style={{
            background: "var(--bg-secondary)", borderRadius: 12,
            padding: "18px 20px", marginBottom: 14,
            border: "0.5px solid var(--border-subtle)",
          }}>
            <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 12 }}>
              CONVERSATION ACTIVITY · LAST 24 WEEKS
            </p>
            <div style={{ display: "flex", gap: 3 }}>
              {(() => {
                const days = stats ? buildHeatmap(stats.activity_heatmap) : Array(168).fill("#3a3a3c");
                const cols: string[][] = [];
                for (let i = 0; i < 24; i++) cols.push(days.slice(i * 7, i * 7 + 7));
                return cols.map((col, ci) => (
                  <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
                    {col.map((color, ri) => (
                      <div key={ri} style={{ height: 8, borderRadius: 2, background: color }} />
                    ))}
                  </div>
                ));
              })()}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, color: "var(--text-hint)" }}>less</span>
              {["#3a3a3c","#1a3a4a","#0a5080","#0a84ff"].map((c) => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
              ))}
              <span style={{ fontSize: 11, color: "var(--text-hint)" }}>more</span>
            </div>
          </div>

          {/* Bottom row */}
          {/* <div className="dash-grid-2">

            <div style={{ background: "var(--bg-secondary)", borderRadius: 12, padding: "18px 20px", border: "0.5px solid var(--border-subtle)" }}>
              <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 14 }}>AVG SESSION LENGTH · WEEKS (MIN)</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 64, marginBottom: 10 }}>
                {WEEKS.map((h, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", gap: 4 }}>
                    <div style={{
                      width: "100%", height: `${h}%`, borderRadius: "3px 3px 0 0",
                      background: i === WEEKS.length - 1 ? "var(--accent-blue)" : i >= 4 ? "#0a5080" : "var(--bg-tertiary)",
                      border: i === WEEKS.length - 1 ? "0.5px solid #5ab0ff" : "none",
                    }} />
                    <span style={{ fontSize: 10, color: i === WEEKS.length - 1 ? "var(--accent-blue)" : "var(--text-hint)" }}>w{i + 1}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>avg this week</span>
                <span style={{ fontSize: 12, color: "var(--accent-blue)", fontWeight: 600 }}>22 min</span>
              </div>
              <div style={{ borderTop: "0.5px solid var(--border-subtle)", paddingTop: 12 }}>
                <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>CEFR · German</p>
                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                  {CEFR_LEVELS.map((l, i) => (
                    <div key={l} style={{
                      flex: 1, height: 5, borderRadius: 3,
                      background: i < CEFR_ACTIVE ? "var(--accent-green)" : i === CEFR_ACTIVE ? "var(--accent-blue)" : "var(--bg-tertiary)",
                    }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  {CEFR_LEVELS.map((l, i) => (
                    <span key={l} style={{
                      fontSize: 10,
                      color: i === CEFR_ACTIVE ? "var(--accent-blue)" : "var(--text-hint)",
                      fontWeight: i === CEFR_ACTIVE ? 700 : 400,
                    }}>{l}</span>
                  ))}
                </div>
              </div>
            </div>

          </div> */}

        {/* Bottom row */}
        <div className="dash-grid-2">
          {/* Weekly bar chart */}
          <div style={{ background: "var(--bg-secondary)", borderRadius: 12, padding: "18px 20px", border: "0.5px solid var(--border-subtle)" }}>
            <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 14 }}>CONVERSATIONS PER WEEK · LAST 8 WEEKS</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 64, marginBottom: 10 }}>
              {(stats?.weekly_conversation_counts ?? WEEKS).map((h, i) => {
                const max = Math.max(...(stats?.weekly_conversation_counts ?? WEEKS), 1);
                const pct = Math.round((h / max) * 100);
                const isLast = i === 7;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", gap: 4 }}>
                    <div style={{
                      width: "100%", height: `${pct}%`, borderRadius: "3px 3px 0 0",
                      background: isLast ? "var(--accent-blue)" : i >= 4 ? "#0a5080" : "var(--bg-tertiary)",
                      border: isLast ? "0.5px solid #5ab0ff" : "none",
                    }} />
                    <span style={{ fontSize: 10, color: isLast ? "var(--accent-blue)" : "var(--text-hint)" }}>w{i + 1}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>this week</span>
              <span style={{ fontSize: 12, color: "var(--accent-blue)", fontWeight: 600 }}>
                {stats?.weekly_conversation_counts?.[7] ?? 0} convos
              </span>
            </div>

            {/* CEFR */}
            <div style={{ borderTop: "0.5px solid var(--border-subtle)", paddingTop: 12 }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>
                CEFR · {stats?.learning_lang ?? "..."}
              </p>
              {(() => {
                // skill_level is 1-6 mapping to A1-C2
                const cefrActive = stats ? stats.cefr_index : CEFR_ACTIVE;
                return (
                  <>
                    <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                      {CEFR_LEVELS.map((l, i) => (
                        <div key={l} style={{
                          flex: 1, height: 5, borderRadius: 3,
                          background: i < cefrActive ? "var(--accent-green)" : i === cefrActive ? "var(--accent-blue)" : "var(--bg-tertiary)",
                        }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      {CEFR_LEVELS.map((l, i) => (
                        <span key={l} style={{
                          fontSize: 10,
                          color: i === cefrActive ? "var(--accent-blue)" : "var(--text-hint)",
                          fontWeight: i === cefrActive ? 700 : 400,
                        }}>{l}</span>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Popular topics */}
          <div style={{ background: "var(--bg-secondary)", borderRadius: 12, padding: "18px 20px", border: "0.5px solid var(--border-subtle)" }}>
            <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 14 }}>POPULAR TOPICS</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {(stats?.popular_topics ?? []).map(([label, count], i) => {
                const colors = ["var(--accent-blue)", "var(--accent-green)", "var(--accent-orange)", "var(--accent-purple)", "var(--accent-red)"];
                const max = stats?.popular_topics?.[0]?.[1] ?? 1;
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)", width: 100, flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, background: "var(--bg-tertiary)", borderRadius: 3, height: 5 }}>
                      <div style={{ height: "100%", background: colors[i], borderRadius: 3, width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-faint)", minWidth: 32, textAlign: "right" }}>{pct}%</span>
                  </div>
                );
              })}
              {!stats?.popular_topics?.length && (
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No topics yet</p>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
