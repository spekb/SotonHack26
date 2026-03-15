"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { leaveQueue } from "@/lib/actions/matchmakingActions";

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

  const callId = searchParams.get("id") || "";
  const idFirst = `${callId}_1`;
  const idSecond = `${callId}_2`;
  const [callRole, setCallRole] = useState<"loading" | "first" | "second" | "full">("loading");

  const [activePrompt, setActivePrompt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [userInitial, setUserInitial] = useState("?");

  // ── Assign call role ────────────────────────────────────────────────────────
  useEffect(() => {
    const callId = searchParams.get("id");
    if (!callId) {
      const newId = Math.random().toString(36).substring(2, 8);
      const params = new URLSearchParams(searchParams.toString());
      params.set("id", newId);
      router.replace(`${pathname}?${params.toString()}`);
    } else {
      let userId = sessionStorage.getItem("call_user_id");
      if (!userId) {
        userId = Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem("call_user_id", userId);
      }
      fetch(`/api/call/${callId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === "full") {
            setCallRole("full");
          } else {
            const role = data.role as "first" | "second";
            setCallRole(role);

            // Start recording their own stream on the server
            // Note: In a real app we might want to record BOTH streams or composite them. 
            // For now, we ask the server to open their push stream id and record it.
            const streamIdToRecord = role === "first" ? `${callId}_1` : `${callId}_2`;
            fetch(`/api/call/${callId}/record`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "start", streamId: streamIdToRecord })
            }).catch(e => console.error("Failed to start recording:", e));
          }
        });
    }
  }, [searchParams, pathname, router]);

  // ── Elapsed timer + user initial ────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    setUserInitial(sessionStorage.getItem("ll_user_name")?.[0]?.toUpperCase() ?? "?");
    return () => clearInterval(t);
  }, []);

  // ── Poll for partner leaving ────────────────────────────────────────────────
  // Every 3 seconds, check how many participants are in the room.
  // If it drops to 1 (partner left), send this user back to /waiting.
  useEffect(() => {
    if (callRole === "loading" || callRole === "full") return;

    const id = searchParams.get("id");
    if (!id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/call/${id}/status`);
        const data = await res.json();
        if (data.participants < 2) {
          clearInterval(interval);
          const userId = sessionStorage.getItem("ll_user_name") ?? "anon";
          await leaveQueue(userId);
          router.push("/waiting");
        }
      } catch {
        // If the status check fails, don't boot the user — just try again next poll
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [callRole, searchParams, router]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleEndCall = async () => {
    const userId = sessionStorage.getItem("call_user_id") ?? "anon";
    const matchUserId = sessionStorage.getItem("ll_user_name") ?? "anon";
    if (callId) {
      await fetch(`/api/call/${callId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    }
    await leaveQueue(matchUserId);
    router.push("/dashboard");
  };

  const handleSkip = async () => {
    const userId = sessionStorage.getItem("call_user_id") ?? "anon";
    const matchUserId = sessionStorage.getItem("ll_user_name") ?? "anon";
    if (callId) {
      await fetch(`/api/call/${callId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    }
    await leaveQueue(matchUserId);
    router.push("/waiting");
  };

  // ── Early returns ───────────────────────────────────────────────────────────
  if (callRole === "full") {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg-quaternary)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-secondary)", flexDirection: "column", gap: 20,
      }}>
        <h2 style={{ color: "var(--accent-red)" }}>Call is Full</h2>
        <p>This room already has 2 participants. You cannot join as the third user.</p>
        <Link href="/dashboard" style={{
          background: "var(--accent-blue)", border: "none",
          color: "#fff", borderRadius: 8, padding: "9px 24px",
          fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
          textDecoration: "none", letterSpacing: "0.01em",
        }}>Go Back to Dashboard</Link>
      </div>
    );
  }

  if (callRole === "loading") {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg-quaternary)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-secondary)",
      }}>
        Connecting to call...
      </div>
    );
  }

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
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{
          fontSize: 10, color: "var(--accent-blue)", background: "rgba(10,132,255,0.15)",
          borderRadius: 6, padding: "3px 10px", fontWeight: 600, border: "0.5px solid rgba(10,132,255,0.3)",
        }}>{callRole === "first" ? "1st User (Host)" : "2nd User"}</div>
      </div>

      {/* Video feeds */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1 }}>

        {/* Partner */}
        <div style={{
          position: "relative", background: "#0e0e14",
          borderRight: "0.5px solid var(--border-subtle)",
          minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          <iframe
            src={`https://vdo.ninja/?view=${callRole === "first" ? idSecond : idFirst}&cc`}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", zIndex: 0 }}
            allow="camera; microphone; display-capture; autoplay"
          />
          {/* Transcription */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1, pointerEvents: "none",
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
          overflow: "hidden",
        }}>
          <iframe
            src={`https://vdo.ninja/?push=${callRole === "first" ? idFirst : idSecond}&chatbutton=0&nohangupbutton&as&vd=1&ad&wc&ns&trans=en-US`}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", zIndex: 0 }}
            allow="camera; microphone; display-capture; autoplay"
          />
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
            { label: "LEVEL", value: "A2", color: "var(--accent-blue)" },
            { label: "SESSIONS", value: "38", color: "var(--text-secondary)" },
            { label: "RATING", value: "4.8", color: "var(--accent-orange)" },
            { label: "MATCH", value: "94%", color: "var(--accent-purple)" },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 600, marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontSize: 14, color: s.color, fontWeight: 700 }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 22, padding: "10px 20px", alignItems: "center" }}>
          {[
            { label: "LEVEL", value: "B2", color: "var(--accent-green)" },
            { label: "SESSIONS", value: "142", color: "var(--text-secondary)" },
            { label: "VOCAB", value: "2,340", color: "var(--text-secondary)" },
            { label: "USED TODAY", value: "47", color: "var(--accent-orange)" },
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

        <button
          onClick={handleEndCall}
          style={{
            background: "var(--accent-red)", border: "none",
            color: "#fff", borderRadius: 8, padding: "10px 32px",
            fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
            letterSpacing: "0.01em", transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          onClick={() => {
            const currentCallId = searchParams.get("id");
            if (currentCallId) {
              const streamIdToStop = callRole === "first" ? `${currentCallId}_1` : `${currentCallId}_2`;
              fetch(`/api/call/${currentCallId}/record`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "stop", streamId: streamIdToStop })
              }).finally(() => {
                router.push("/dashboard");
              });
            } else {
              router.push("/dashboard");
            }
          }}
        >End call</button>
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
