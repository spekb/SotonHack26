"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Flow = "signin" | "signup" | "verify" | "reset" | "reset-sent" | "reset-new" | "success";

function Btn({ children, onClick, variant = "primary", style: sx }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  style?: React.CSSProperties;
}) {
  const bg = variant === "primary" ? "var(--accent-blue)" : variant === "danger" ? "var(--accent-red)" : "var(--bg-secondary)";
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", border: variant === "ghost" ? "0.5px solid var(--border-subtle)" : "none",
        borderRadius: 10, padding: "13px 0", fontSize: 13, fontWeight: 700,
        cursor: "pointer", fontFamily: "inherit", background: bg,
        color: variant === "ghost" ? "var(--text-muted)" : "#fff",
        transition: "opacity 0.15s", ...sx,
      } as React.CSSProperties}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {children}
    </button>
  );
}

function Field({ label, value, active, error, success, action, onAction }: {
  label: string; value: string; active?: boolean; error?: boolean; success?: boolean;
  action?: string; onAction?: () => void;
}) {
  const border = error ? "1.5px solid var(--accent-red)" : success ? "1.5px solid var(--accent-green)" : active ? "1.5px solid var(--accent-blue)" : "0.5px solid var(--border-subtle)";
  const labelColor = error ? "var(--accent-red)" : success ? "var(--accent-green)" : active ? "var(--accent-blue)" : "var(--text-faint)";
  return (
    <div style={{ background: "var(--bg-secondary)", border, borderRadius: 10, padding: "12px 14px", marginBottom: 10, position: "relative" }}>
      <p style={{ fontSize: 9, color: labelColor, fontWeight: 600, marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 13, color: value.startsWith("•") ? "var(--text-hint)" : "var(--text-primary)" }}>{value}</p>
      {success && (
        <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, borderRadius: "50%", background: "var(--accent-green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 8, height: 5, borderLeft: "1.5px solid #fff", borderBottom: "1.5px solid #fff", transform: "rotate(-45deg) translateY(-1px)" }} />
        </div>
      )}
      {action && (
        <button onClick={onAction} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--accent-blue)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          {action}
        </button>
      )}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
      <div style={{ flex: 1, height: 0.5, background: "var(--border-subtle)" }} />
      <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{label}</span>
      <div style={{ flex: 1, height: 0.5, background: "var(--border-subtle)" }} />
    </div>
  );
}

function SSORow() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
      {["Google", "GitHub", "Apple"].map((s) => (
        <button key={s} style={{
          background: "var(--bg-secondary)", border: "0.5px solid var(--border-subtle)",
          borderRadius: 10, padding: 11, cursor: "pointer", fontFamily: "inherit",
          transition: "border-color 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
        >
          <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, textAlign: "center" }}>{s}</p>
        </button>
      ))}
    </div>
  );
}

function TabSwitch({ active, onChange }: { active: "signin" | "signup"; onChange: (v: "signin" | "signup") => void }) {
  return (
    <div style={{ display: "flex", background: "var(--bg-tertiary)", borderRadius: 10, padding: 3, gap: 2, marginBottom: 20 }}>
      {(["signin", "signup"] as const).map((t) => (
        <button key={t} onClick={() => onChange(t)} style={{
          flex: 1, padding: "9px 0", textAlign: "center", fontSize: 12, fontWeight: 700,
          cursor: "pointer", borderRadius: 8, border: "none", fontFamily: "inherit",
          background: active === t ? "var(--bg-secondary)" : "transparent",
          color: active === t ? "var(--text-primary)" : "var(--text-faint)",
          transition: "all 0.15s",
        }}>
          {t === "signin" ? "Sign in" : "Create account"}
        </button>
      ))}
    </div>
  );
}

/* ── Step dots for multi-step sub-flows ── */
function FlowDots({ flow }: { flow: Flow }) {
  const signinMap: Record<string, number> = { signin: 0, verify: 1, success: 2 };
  const resetMap: Record<string, number> = { reset: 0, "reset-sent": 1, "reset-new": 2, success: 3 };
  const isReset = ["reset", "reset-sent", "reset-new"].includes(flow);
  const total = isReset ? 4 : 3;
  const current = isReset ? (resetMap[flow] ?? 0) : (signinMap[flow] ?? 0);

  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 6, width: i === current ? 18 : 6, borderRadius: 3,
          background: i < current ? "var(--accent-green)" : i === current ? "var(--accent-blue)" : "var(--bg-tertiary)",
          transition: "all 0.25s",
        }} />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [flow, setFlow] = useState<Flow>("signin");
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  const switchTab = (t: "signin" | "signup") => {
    setTab(t);
    setFlow(t);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Card */}
        <div style={{ background: "var(--bg-primary)", borderRadius: 16, overflow: "hidden" }}>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px", background: "var(--bg-secondary)",
            borderBottom: "0.5px solid var(--border-subtle)",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>LinguaLink</span>
            <FlowDots flow={flow} />
          </div>

          <div style={{ padding: "24px 22px" }}>

            {/* ── Sign in ── */}
            {flow === "signin" && (
              <div style={{ animation: "fadeIn 0.25s ease" }}>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 4 }}>WELCOME BACK</p>
                  <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Sign in</h2>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Good to see you again</p>
                </div>
                <TabSwitch active={tab} onChange={switchTab} />
                <Field label="EMAIL" value="yusuf@example.com" active />
                <Field label="PASSWORD" value="••••••••••••" action="Forgot?" onAction={() => setFlow("reset")} />

                {/* Keep signed in */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, cursor: "pointer" }} onClick={() => setKeepSignedIn((v) => !v)}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    background: keepSignedIn ? "var(--accent-blue)" : "var(--bg-secondary)",
                    border: `1.5px solid ${keepSignedIn ? "var(--accent-blue)" : "var(--border-subtle)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                    {keepSignedIn && <div style={{ width: 9, height: 6, borderLeft: "1.5px solid #fff", borderBottom: "1.5px solid #fff", transform: "rotate(-45deg) translateY(-1px)" }} />}
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Keep me signed in</span>
                </div>

                <div style={{ marginBottom: 0 }}><Btn onClick={() => setFlow("verify")}>Sign in →</Btn></div>
                <Divider label="or" />
                <SSORow />
                <p style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "var(--text-faint)" }}>
                  Don't have an account?{" "}
                  <button onClick={() => switchTab("signup")} style={{ fontSize: 11, color: "var(--accent-blue)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Create one</button>
                </p>
              </div>
            )}

            {/* ── Sign up ── */}
            {flow === "signup" && (
              <div style={{ animation: "fadeIn 0.25s ease" }}>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 4 }}>JOIN LINGUALINK</p>
                  <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Create account</h2>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Start practising languages today</p>
                </div>
                <TabSwitch active={tab} onChange={switchTab} />
                <div style={{ display: "flex", gap: 8, marginBottom: 0 }}>
                  <div style={{ flex: 1 }}><Field label="FIRST NAME" value="Yusuf" /></div>
                  <div style={{ flex: 1 }}><Field label="LAST NAME" value="Klein" /></div>
                </div>
                <Field label="EMAIL" value="yusuf@example.com" active />
                <Field label="PASSWORD" value="••••••••••••" />
                <Field label="CONFIRM PASSWORD" value="••••••••••••" success />

                {/* Strength */}
                <div style={{ background: "var(--bg-quaternary)", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
                  <p style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 6 }}>Password strength</p>
                  <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                    {[1,2,3,4].map((i) => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= 3 ? "var(--accent-green)" : "var(--bg-tertiary)" }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 10, color: "var(--accent-green)", fontWeight: 600 }}>Good — add a symbol to make it strong</p>
                </div>

                <div style={{ marginBottom: 0 }}><Btn onClick={() => setFlow("verify")}>Create account →</Btn></div>
                <Divider label="or" />
                <SSORow />
              </div>
            )}

            {/* ── Email verify ── */}
            {flow === "verify" && (
              <div style={{ animation: "fadeIn 0.25s ease" }}>
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 4 }}>STEP 2 OF 3</p>
                  <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Verify your email</h2>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>We sent a 6-digit code to</p>
                  <p style={{ fontSize: 13, color: "var(--accent-blue)", fontWeight: 600, marginTop: 2 }}>yusuf@example.com</p>
                </div>

                {/* PIN boxes */}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 20 }}>
                  {[3, 7, 4, 9, null, null].map((d, i) => (
                    <div key={i} style={{
                      width: "14%", aspectRatio: "1/1.15",
                      background: "var(--bg-secondary)",
                      border: d !== null ? (i < 4 ? "1.5px solid var(--accent-green)" : "1.5px solid var(--accent-blue)") : "0.5px solid var(--border-subtle)",
                      borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: d !== null ? 22 : 16, fontWeight: 700,
                      color: i < 4 ? "var(--accent-green)" : i === 4 ? "var(--accent-blue)" : "var(--text-hint)",
                      cursor: "pointer",
                    }}>
                      {d !== null ? d : i === 4 ? "_" : ""}
                    </div>
                  ))}
                </div>

                {/* Timer */}
                <div style={{
                  background: "var(--bg-quaternary)", borderRadius: 9, padding: "11px 14px",
                  marginBottom: 18, display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-orange)", flexShrink: 0 }} />
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Code expires in{" "}
                    <span style={{ color: "var(--accent-orange)", fontWeight: 700 }}>04:32</span>
                  </p>
                  <button style={{ marginLeft: "auto", fontSize: 11, color: "var(--accent-blue)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Resend</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Btn onClick={() => setFlow("success")}>Verify →</Btn>
                  <Btn variant="ghost" onClick={() => setFlow(tab)}>← Back</Btn>
                </div>
                <p style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "var(--text-faint)" }}>
                  Wrong email?{" "}
                  <button onClick={() => setFlow(tab)} style={{ fontSize: 11, color: "var(--accent-blue)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Change it</button>
                </p>
              </div>
            )}

            {/* ── Forgot password ── */}
            {flow === "reset" && (
              <div style={{ animation: "fadeIn 0.25s ease" }}>
                <div style={{ marginBottom: 22 }}>
                  <p style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 4 }}>FORGOT PASSWORD</p>
                  <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Reset password</h2>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Enter your email and we'll send a reset link</p>
                </div>
                <Field label="EMAIL ADDRESS" value="yusuf@example.com" active />
                <div style={{ height: 8 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Btn onClick={() => setFlow("reset-sent")}>Send reset link →</Btn>
                  <Btn variant="ghost" onClick={() => setFlow("signin")}>← Back to sign in</Btn>
                </div>
              </div>
            )}

            {/* ── Reset sent ── */}
            {flow === "reset-sent" && (
              <div style={{ animation: "fadeIn 0.25s ease", textAlign: "center", paddingTop: 10 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "var(--accent-green-bg)", border: "2px solid var(--accent-green)",
                  margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: 24, height: 16, borderLeft: "2.5px solid var(--accent-green)", borderBottom: "2.5px solid var(--accent-green)", transform: "rotate(-45deg) translateY(-3px)" }} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Check your inbox</h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 6 }}>We sent a reset link to</p>
                <p style={{ fontSize: 13, color: "var(--accent-blue)", fontWeight: 600, marginBottom: 24 }}>yusuf@example.com</p>

                <div style={{ background: "var(--bg-secondary)", borderRadius: 12, padding: "16px", marginBottom: 18, textAlign: "left" }}>
                  {[
                    "Open the email from LinguaLink",
                    "Click the reset link (valid for 15 minutes)",
                    "Choose a new password and sign back in",
                  ].map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < 2 ? 12 : 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: "var(--accent-blue-bg)", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "var(--accent-blue)",
                      }}>{i + 1}</div>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{step}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Btn onClick={() => setFlow("reset-new")}>I've clicked the link →</Btn>
                </div>
                <p style={{ marginTop: 14, fontSize: 11, color: "var(--text-faint)" }}>
                  Didn't get it?{" "}
                  <button onClick={() => setFlow("reset")} style={{ fontSize: 11, color: "var(--accent-blue)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Resend email</button>
                </p>
              </div>
            )}

            {/* ── New password ── */}
            {flow === "reset-new" && (
              <div style={{ animation: "fadeIn 0.25s ease" }}>
                <div style={{ marginBottom: 22 }}>
                  <p style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 4 }}>STEP 3 OF 4</p>
                  <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>New password</h2>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Make it something you'll remember</p>
                </div>
                <Field label="NEW PASSWORD" value="••••••••••••" active />
                <Field label="CONFIRM PASSWORD" value="••••••••••••" success />

                <div style={{ background: "var(--bg-quaternary)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                  <p style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 6 }}>Password strength</p>
                  <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                    {[1,2,3,4].map((i) => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--accent-green)" }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 10, color: "var(--accent-green)", fontWeight: 700 }}>Strong</p>
                </div>

                <div style={{
                  background: "var(--accent-green-bg)", border: "0.5px solid var(--accent-green-border)",
                  borderRadius: 9, padding: "12px 14px", marginBottom: 16,
                }}>
                  <p style={{ fontSize: 11, color: "var(--accent-green)", fontWeight: 700, marginBottom: 8 }}>Password requirements</p>
                  {["At least 8 characters", "One uppercase letter", "One number", "One special character"].map((r) => (
                    <div key={r} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-green)", flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{r}</span>
                    </div>
                  ))}
                </div>

                <Btn onClick={() => setFlow("success")}>Set new password →</Btn>
              </div>
            )}

            {/* ── Success ── */}
            {flow === "success" && (
              <div style={{ animation: "fadeIn 0.25s ease", textAlign: "center", padding: "16px 0" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "var(--accent-blue-bg)", border: "2px solid var(--accent-blue)",
                  margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: 28, height: 19, borderLeft: "3px solid var(--accent-blue)", borderBottom: "3px solid var(--accent-blue)", transform: "rotate(-45deg) translateY(-4px)" }} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>You're in!</h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24 }}>Welcome back, Yusuf</p>

                <div style={{ background: "var(--bg-secondary)", borderRadius: 12, overflow: "hidden", marginBottom: 20, textAlign: "left" }}>
                  {[
                    { label: "Signed in as",   value: "yusuf@example.com",    color: "var(--accent-blue)" },
                    { label: "Learning",        value: "🇩🇪 German · B2",       color: "var(--accent-green)" },
                    { label: "Last session",    value: "Yesterday · 24 min",   color: "var(--text-primary)" },
                  ].map((r, i) => (
                    <div key={r.label} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "13px 18px",
                      borderBottom: i < 2 ? "0.5px solid var(--border-subtle)" : "none",
                    }}>
                      <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 500 }}>{r.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: r.color }}>{r.value}</span>
                    </div>
                  ))}
                </div>

                <Btn onClick={() => router.push("/dashboard")} style={{ fontSize: 14, padding: "14px 0" }}>
                  Go to dashboard →
                </Btn>
              </div>
            )}

          </div>
        </div>

        {/* Footer link */}
        {(flow === "signin" || flow === "signup") && (
          <p style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "var(--text-faint)" }}>
            New user?{" "}
            <Link href="/onboarding" style={{ color: "var(--accent-blue)", fontWeight: 600, textDecoration: "none" }}>
              Start onboarding
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
