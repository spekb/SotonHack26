"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { joinQueue, leaveQueue } from "@/lib/actions/matchmakingActions";

const POLL_INTERVAL_MS = 3000;
const MAX_WAIT_MS = 120_000;

export default function WaitingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"joining" | "waiting" | "matched" | "timeout" | "error">("joining");
  const [elapsed, setElapsed] = useState(0);
  const [dotCount, setDotCount] = useState(1);
  const [learningLang, setLearningLang] = useState("—");
  const [skillLevel, setSkillLevel] = useState(0);
  const [tolerance, setTolerance] = useState(15);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());

  const getUserInfo = () => ({
    userId:       sessionStorage.getItem("ll_user_id")       ?? sessionStorage.getItem("ll_user_name") ?? "anon",
    userName:     sessionStorage.getItem("ll_user_name")     ?? "User",
    learningLang: sessionStorage.getItem("ll_learn_lang")    ?? "Unknown",
    skillLevel:   Number(sessionStorage.getItem("ll_skill_level") ?? "70"),
  });

  const stopPolling = () => {
    if (pollRef.current)  clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleCancel = async () => {
    stopPolling();
    const { userId } = getUserInfo();
    await leaveQueue(userId);
    router.push("/dashboard");
  };

  const startPolling = (userId: string) => {
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/match?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.status === "matched") {
        stopPolling();
        setStatus("matched");
        setTimeout(() => {
          router.push(`/call?id=${data.sessionId}`);
        }, 800);
      } else if (data.status === "waiting" && data.currentTolerance !== undefined) {
        setTolerance(data.currentTolerance);
      }
    }, POLL_INTERVAL_MS);
  };

  useEffect(() => {
    const { userId, userName, learningLang, skillLevel } = getUserInfo();

    // Surface to UI
    setLearningLang(learningLang);
    setSkillLevel(skillLevel);

    // Join the queue
    joinQueue(userId, userName, learningLang, skillLevel).then(({ error }) => {
      if (error) { setStatus("error"); return; }
      setStatus("waiting");
    });

    // Elapsed timer + animated dots + timeout check
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(secs);
      setDotCount(d => (d % 3) + 1);

      if (Date.now() - startRef.current >= MAX_WAIT_MS) {
        stopPolling();
        leaveQueue(userId);
        setStatus("timeout");
      }
    }, 1000);

    // Poll for a match
    startPolling(userId);

    return () => stopPolling();
  }, []);

  const handleTryAgain = () => {
    setStatus("joining");
    setElapsed(0);
    startRef.current = Date.now();
    const { userId, userName, learningLang, skillLevel } = getUserInfo();
    joinQueue(userId, userName, learningLang, skillLevel).then(() => setStatus("waiting"));

    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(secs);
      setDotCount(d => (d % 3) + 1);
      if (Date.now() - startRef.current >= MAX_WAIT_MS) {
        stopPolling();
        leaveQueue(userId);
        setStatus("timeout");
      }
    }, 1000);

    startPolling(userId);
  };

  const fmtElapsed = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const dots = ".".repeat(dotCount);

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-primary)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>

        {/* Logo */}
        <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 40 }}>
          LinguaLink
        </p>

        {/* State: joining */}
        {status === "joining" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Getting ready{dots}</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Joining the queue</p>
          </div>
        )}

        {/* State: waiting */}
        {status === "waiting" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Animated pulse ring */}
            <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 28px" }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: "2px solid var(--accent-blue)",
                animation: "pulse-dot 1.5s ease-in-out infinite",
              }} />
              <div style={{
                position: "absolute", inset: 8, borderRadius: "50%",
                border: "2px solid var(--accent-blue)",
                animation: "pulse-dot 1.5s ease-in-out infinite 0.3s",
              }} />
              <div style={{
                position: "absolute", inset: 16, borderRadius: "50%",
                background: "var(--accent-blue-bg)", border: "2px solid var(--accent-blue)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}>🔍</div>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              Finding a match{dots}
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
              Looking for another <strong style={{ color: "var(--text-primary)" }}>{learningLang}</strong> learner near your level
            </p>

            {/* Match criteria card */}
            <div style={{
              background: "var(--bg-secondary)", borderRadius: 12,
              padding: "16px 20px", border: "0.5px solid var(--border-subtle)",
              marginBottom: 24, textAlign: "left",
            }}>
              <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 12 }}>
                MATCHING ON
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Language</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-green)" }}>{learningLang}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Skill level</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-blue)" }}>{skillLevel} / 160</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Tolerance</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>±{tolerance} points</span>
                </div>
              </div>
            </div>

            {/* Elapsed time */}
            <p style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 20, fontFamily: "monospace" }}>
              {fmtElapsed(elapsed)}
            </p>

            <button onClick={handleCancel} style={{
              background: "none", border: "0.5px solid var(--border-subtle)",
              borderRadius: 9, padding: "10px 28px", fontSize: 13,
              color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit",
              fontWeight: 500, transition: "color 0.15s, border-color 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-red)"; e.currentTarget.style.borderColor = "var(--accent-red)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* State: matched */}
        {status === "matched" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "var(--accent-green-bg)", border: "2px solid var(--accent-green)",
              margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32,
            }}>✓</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Match found!</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Starting your call{dots}</p>
          </div>
        )}

        {/* State: timeout */}
        {status === "timeout" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>😔</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No match found</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
              No one else was waiting at your level right now. Try again in a moment.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={handleTryAgain} style={{
                background: "var(--accent-blue)", color: "#fff",
                border: "none", borderRadius: 9, padding: "11px 26px",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                Try again
              </button>
              <button onClick={() => router.push("/dashboard")} style={{
                background: "none", border: "0.5px solid var(--border-subtle)",
                borderRadius: 9, padding: "11px 26px", fontSize: 13,
                color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit",
              }}>
                Back
              </button>
            </div>
          </div>
        )}

        {/* State: error */}
        {status === "error" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
              Couldn't join the queue. Check your connection and try again.
            </p>
            <button onClick={() => router.push("/dashboard")} style={{
              background: "var(--accent-blue)", color: "#fff",
              border: "none", borderRadius: 9, padding: "11px 26px",
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>
              Back to dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
