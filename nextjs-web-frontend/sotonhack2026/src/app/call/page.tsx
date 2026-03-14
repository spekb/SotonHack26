"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const PROMPTS = [
  "Describe your morning routine using past tense verbs.",
  "What's your favourite childhood memory?",
  "Explain a local tradition from your region.",
  "Describe your weekend plans in detail.",
  "What does your home city look like?",
  "Talk about the last film you watched.",
];

function CallScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const callId = searchParams.get("id");
    if (!callId) {
      const newId = Math.random().toString(36).substring(2, 8);
      const params = new URLSearchParams(searchParams.toString());
      params.set("id", newId);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, pathname, router]);

  const [activePrompt, setActivePrompt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [userInitial, setUserInitial] = useState("?");

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    setUserInitial(sessionStorage.getItem("ll_user_name")?.[0]?.toUpperCase() ?? "?");
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-quaternary)", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "11px 18px", background: "var(--bg-secondary)",
        borderBottom: "0.5px solid var(--border-subtle)",
        gap: 10,
      }}>
        <div className="live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-red)" }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>LinguaLink</span>
        <span style={{ fontSize: 12, color: "var(--text-faint)" }}>·</span>
        <span style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: "var(--font-mono, monospace)" }}>{fmt(elapsed)}</span>
      </div>

      {/* Video feeds */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1 }}>

        {/* Partner */}
        <div style={{
          position: "relative", background: "#0e0e14",
          borderRight: "0.5px solid var(--border-subtle)",
          minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 78, height: 78, borderRadius: "50%",
              background: "var(--accent-blue-bg)", border: "2px solid var(--accent-blue)",
              margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 700, color: "var(--accent-blue)",
            }}>M</div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", fontWeight: 500 }}>Maria</p>
          </div>

          {/* Transcription */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "rgba(0,0,0,0.65)", padding: "10px 16px",
            borderTop: "0.5px solid var(--border-subtle)",
          }}>
            <p style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 3 }}>Transcription</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.45 }}>
              "Eu aprendo alemão há dois anos..."
            </p>
          </div>
        </div>

        {/* Self */}
        <div style={{
          position: "relative", background: "#111113",
          minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 78, height: 78, borderRadius: "50%",
              background: "var(--accent-green-bg)", border: "2px solid var(--accent-green)",
              margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 700, color: "var(--accent-green)",
            }}>{userInitial}</div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", fontWeight: 500 }}>You</p>
          </div>

          {/* Mic / cam controls */}
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
            {[
              { label: micOn ? "🎤" : "🔇", active: micOn, toggle: () => setMicOn((v) => !v) },
              { label: camOn ? "📷" : "🚫", active: camOn, toggle: () => setCamOn((v) => !v) },
            ].map((b, i) => (
              <button key={i} onClick={b.toggle} style={{
                width: 32, height: 32, borderRadius: "50%",
                background: b.active ? "rgba(44,44,46,0.85)" : "rgba(255,55,95,0.3)",
                border: `0.5px solid ${b.active ? "var(--border-subtle)" : "var(--accent-red)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 13, transition: "all 0.15s",
              }}>{b.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        background: "var(--bg-secondary)", borderTop: "0.5px solid var(--border-subtle)",
        borderBottom: "0.5px solid var(--border-subtle)",
      }}>
        <div style={{ display: "flex", gap: 22, padding: "10px 20px", borderRight: "0.5px solid var(--border-subtle)", alignItems: "center" }}>
          {[
            { label: "LEVEL",    value: "A2",  color: "var(--accent-blue)" },
            { label: "SESSIONS", value: "38",  color: "var(--text-secondary)" },
            { label: "RATING",   value: "4.8", color: "var(--accent-orange)" },
            { label: "MATCH",    value: "94%", color: "var(--accent-purple)" },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 600, marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontSize: 14, color: s.color, fontWeight: 700 }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 22, padding: "10px 20px", alignItems: "center" }}>
          {[
            { label: "LEVEL",      value: "B2",    color: "var(--accent-green)" },
            { label: "SESSIONS",   value: "142",   color: "var(--text-secondary)" },
            { label: "VOCAB",      value: "2,340", color: "var(--text-secondary)" },
            { label: "USED TODAY", value: "47",    color: "var(--accent-orange)" },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 600, marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontSize: 14, color: s.color, fontWeight: 700 }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt panel */}
      <div style={{ padding: "14px 20px", background: "var(--bg-primary)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: "1.1" }}>
            <p style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7 }}>
              CURRENT TOPIC
            </p>
            <div style={{
              fontSize: 13, color: "var(--text-primary)",
              background: "var(--bg-secondary)", border: "0.5px solid var(--border-subtle)",
              borderLeft: "2.5px solid var(--accent-blue)",
              borderRadius: 8, padding: "10px 14px", lineHeight: 1.5,
            }}>
              "{PROMPTS[activePrompt]}"
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7 }}>
              MORE PROMPTS
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {PROMPTS.filter((_, i) => i !== activePrompt).slice(0, 4).map((p, i) => (
                <button
                  key={i}
                  onClick={() => setActivePrompt(PROMPTS.indexOf(p))}
                  style={{
                    fontSize: 11, color: "var(--text-secondary)",
                    background: "var(--bg-secondary)", border: "0.5px solid var(--border-subtle)",
                    borderRadius: 6, padding: "6px 11px", cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-blue)"; e.currentTarget.style.color = "var(--accent-blue)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  {p.length > 28 ? p.slice(0, 28) + "…" : p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        padding: "13px 20px", background: "var(--bg-secondary)",
        borderTop: "0.5px solid var(--border-subtle)",
      }}>
        <button style={{
          background: "var(--bg-tertiary)", border: "none",
          color: "var(--text-muted)", borderRadius: 8, padding: "9px 20px",
          fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
        }}>Report</button>
        <Link href="/dashboard" style={{
          background: "var(--accent-red)", border: "none",
          color: "#fff", borderRadius: 8, padding: "10px 32px",
          fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
          textDecoration: "none", letterSpacing: "0.01em", transition: "opacity 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >End call</Link>
        <button style={{
          background: "var(--accent-blue)", border: "none",
          color: "#fff", borderRadius: 8, padding: "10px 26px",
          fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
          letterSpacing: "0.01em", transition: "opacity 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >Skip / Next →</button>
      </div>
    </div>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "var(--bg-quaternary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
        Loading call...
      </div>
    }>
      <CallScreen />
    </Suspense>
  );
}
