"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const ALL_LANGS = [
  { flag: "🇬🇧", name: "English" },
  { flag: "🇩🇪", name: "German" },
  { flag: "🇫🇷", name: "French" },
  { flag: "🇪🇸", name: "Spanish" },
  { flag: "🇮🇹", name: "Italian" },
  { flag: "🇧🇷", name: "Portuguese" },
  { flag: "🇯🇵", name: "Japanese" },
  { flag: "🇰🇷", name: "Korean" },
  { flag: "🇨🇳", name: "Mandarin" },
  { flag: "🇷🇺", name: "Russian" },
  { flag: "🇸🇦", name: "Arabic" },
  { flag: "🇳🇱", name: "Dutch" },
];

const CEFR_DATA: Record<CEFRLevel, {
  color: string; bg: string; border: string;
  label: string; short: string; desc: string;
  scoreMin: number; scoreMax: number;
}> = {
  A1: { color: "#ff9f0a", bg: "#2a1f0a", border: "#4a3010", label: "Beginner",          short: "Just starting out",       desc: "Can understand and use basic familiar phrases. Introduce yourself and ask simple questions.",                                    scoreMin: 0,   scoreMax: 20  },
  A2: { color: "#ff9f0a", bg: "#2a1f0a", border: "#4a3010", label: "Elementary",         short: "Know the basics",          desc: "Can communicate in simple tasks on familiar topics. Describe your immediate environment in simple terms.",                     scoreMin: 20,  scoreMax: 50  },
  B1: { color: "#30d158", bg: "#0f2a18", border: "#1a4828", label: "Intermediate",       short: "Getting comfortable",      desc: "Can handle most travel situations. Produce simple connected text on familiar topics and describe experiences.",                  scoreMin: 50,  scoreMax: 85  },
  B2: { color: "#0a84ff", bg: "#0a1e36", border: "#0a3060", label: "Upper Intermediate", short: "Conversationally fluent",  desc: "Can discuss complex topics fluently. Produce clear, detailed text on a wide range of subjects.",                              scoreMin: 85,  scoreMax: 115 },
  C1: { color: "#bf5af2", bg: "#1e0f2e", border: "#3a1a50", label: "Advanced",           short: "Near-native fluency",      desc: "Can express ideas fluently and spontaneously. Use language flexibly for social, academic and professional purposes.",            scoreMin: 115, scoreMax: 140 },
  C2: { color: "#ff375f", bg: "#2a0a14", border: "#4a1020", label: "Mastery",            short: "Fully fluent",             desc: "Can understand virtually everything heard or read. Express spontaneously with complete precision.",                             scoreMin: 140, scoreMax: 160 },
};

const CEFR_ORDER: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function scoreToCefr(score: number): CEFRLevel {
  if (score < 20)  return "A1";
  if (score < 50)  return "A2";
  if (score < 85)  return "B1";
  if (score < 115) return "B2";
  if (score < 140) return "C1";
  return "C2";
}

function scoreBand(score: number): { label: string; color: string; desc: string } {
  if (score < 20)  return { label: "Novice",        color: "#ff9f0a", desc: "0 – 19" };
  if (score < 50)  return { label: "Elementary",    color: "#ff9f0a", desc: "20 – 49" };
  if (score < 85)  return { label: "Intermediate",  color: "#30d158", desc: "50 – 84" };
  if (score < 115) return { label: "Advanced",      color: "#0a84ff", desc: "85 – 114" };
  if (score < 140) return { label: "Superior",      color: "#bf5af2", desc: "115 – 139" };
  return { label: "Distinguished", color: "#ff375f", desc: "140 – 160" };
}

function cefrMidScore(level: CEFRLevel): number {
  const d = CEFR_DATA[level];
  return Math.round((d.scoreMin + d.scoreMax) / 2);
}

function Btn({
  children, onClick, variant = "primary", disabled = false, style: sx,
}: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary" | "ghost" | "danger"; disabled?: boolean; style?: React.CSSProperties;
}) {
  const bg = variant === "primary" ? "var(--accent-blue)"
    : variant === "danger" ? "var(--accent-red)"
    : "var(--bg-secondary)";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", border: variant === "ghost" ? "0.5px solid var(--border-subtle)" : "none",
      borderRadius: 10, padding: "14px 0", fontSize: 14, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
      background: disabled ? "var(--bg-tertiary)" : bg,
      color: disabled ? "var(--text-hint)" : (variant === "ghost" ? "var(--text-muted)" : "#fff"),
      transition: "opacity 0.15s", ...(sx as object),
    }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
    >{children}</button>
  );
}

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 6, width: i === step ? 18 : 6, borderRadius: 3,
          background: i < step ? "var(--accent-green)" : i === step ? "var(--accent-blue)" : "var(--bg-tertiary)",
          transition: "all 0.25s ease",
        }} />
      ))}
    </div>
  );
}

function FieldBox({ label, value, active, success, placeholder }: {
  label: string; value?: string; active?: boolean; success?: boolean; placeholder?: string;
}) {
  const border = success ? "1.5px solid var(--accent-green)" : active ? "1.5px solid var(--accent-blue)" : "0.5px solid var(--border-subtle)";
  const lc = success ? "var(--accent-green)" : active ? "var(--accent-blue)" : "var(--text-faint)";
  return (
    <div style={{ background: "var(--bg-secondary)", border, borderRadius: 10, padding: "13px 15px", marginBottom: 10 }}>
      <p style={{ fontSize: 11, color: lc, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, color: value ? "var(--text-primary)" : "var(--text-hint)" }}>
        {value || placeholder || ""}
      </p>
    </div>
  );
}

/* ── Step 1: Account ── */
function StepAccount({ userName, userEmail, onNext }: {
  userName: string; userEmail: string; onNext: () => void;
}) {
  const firstName = userName.split(" ")[0] || userName;
  const lastName  = userName.split(" ").slice(1).join(" ") || "";

  return (
    <div style={{ animation: "fadeIn 0.25s ease" }}>
      <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7 }}>STEP 1 OF 5</p>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 5 }}>Create your account</h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 22 }}>Join thousands of language learners worldwide</p>

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}><FieldBox label="FIRST NAME" value={firstName || undefined} active placeholder="First name" /></div>
        <div style={{ flex: 1 }}><FieldBox label="LAST NAME"  value={lastName || undefined} placeholder="Last name" /></div>
      </div>
      <FieldBox label="EMAIL"    value={userEmail || undefined} success={!!userEmail} placeholder="you@example.com" />
      <FieldBox label="PASSWORD" value="••••••••••••" />

      <div style={{ background: "var(--bg-quaternary)", borderRadius: 8, padding: "11px 14px", marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 7, fontWeight: 600 }}>PASSWORD STRENGTH</p>
        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= 3 ? "var(--accent-green)" : "var(--bg-tertiary)" }} />
          ))}
        </div>
        <p style={{ fontSize: 11, color: "var(--accent-green)", fontWeight: 600 }}>Good — add a symbol to make it strong</p>
      </div>

      <Btn onClick={onNext}>Continue →</Btn>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
        <div style={{ flex: 1, height: "0.5px", background: "var(--border-subtle)" }} />
        <span style={{ fontSize: 11, color: "var(--text-faint)" }}>or sign up with</span>
        <div style={{ flex: 1, height: "0.5px", background: "var(--border-subtle)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {["Google","GitHub","Apple"].map(s => (
          <button key={s} style={{
            background: "var(--bg-secondary)", border: "0.5px solid var(--border-subtle)",
            borderRadius: 10, padding: "12px", cursor: "pointer", fontFamily: "inherit",
            transition: "border-color 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-blue)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}
          >
            <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, textAlign: "center" }}>{s}</p>
          </button>
        ))}
      </div>

      <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--text-faint)" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--accent-blue)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
      </p>
    </div>
  );
}

/* ── Step 2: Native language ── */
function StepNative({ native, setNative, onNext, onBack }: {
  native: string; setNative: (v: string) => void; onNext: () => void; onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = ALL_LANGS.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ animation: "fadeIn 0.25s ease" }}>
      <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7 }}>STEP 2 OF 5</p>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 5 }}>What's your native language?</h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
        This helps us find people who share a language with you to practise with
      </p>

      <div style={{
        background: "var(--bg-secondary)", border: "1.5px solid var(--accent-blue)",
        borderRadius: 10, padding: "11px 14px", marginBottom: 12,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 15, color: "var(--text-faint)" }}>🔍</span>
        <input type="text" placeholder="Search languages…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "var(--text-primary)", fontFamily: "inherit" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
        {filtered.map(l => {
          const sel = native === l.name;
          return (
            <div key={l.name} onClick={() => setNative(l.name)} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: sel ? "var(--accent-blue-bg)" : "var(--bg-secondary)",
              border: sel ? "1.5px solid var(--accent-blue)" : "0.5px solid var(--border-subtle)",
              borderRadius: 10, padding: "12px 15px", cursor: "pointer", transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 24 }}>{l.flag}</span>
              <span style={{ fontSize: 14, color: sel ? "var(--text-primary)" : "var(--text-muted)", fontWeight: sel ? 600 : 400, flex: 1 }}>{l.name}</span>
              {sel && (
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 9, height: 6, borderLeft: "2px solid #fff", borderBottom: "2px solid #fff", transform: "rotate(-45deg) translateY(-1px)" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
        <Btn onClick={onNext} disabled={!native}>Continue →</Btn>
        <Btn variant="ghost" onClick={onBack}>← Back</Btn>
      </div>
    </div>
  );
}

/* ── Step 3: Learning language ── */
function StepLearn({ native, learn, setLearn, onNext, onBack }: {
  native: string; learn: string; setLearn: (v: string) => void; onNext: () => void; onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const available = ALL_LANGS.filter(l => l.name !== native);
  const filtered = available.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ animation: "fadeIn 0.25s ease" }}>
      <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7 }}>STEP 3 OF 5</p>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 5 }}>What do you want to learn?</h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
        We'll match you with other learners of this language at a similar level — practise together through real conversation
      </p>

      <div style={{
        background: "var(--bg-secondary)", border: "1.5px solid var(--accent-green)",
        borderRadius: 10, padding: "11px 14px", marginBottom: 12,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 15, color: "var(--text-faint)" }}>🔍</span>
        <input type="text" placeholder="Search languages…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "var(--text-primary)", fontFamily: "inherit" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
        {filtered.map(l => {
          const sel = learn === l.name;
          return (
            <div key={l.name} onClick={() => setLearn(l.name)} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: sel ? "var(--accent-green-bg)" : "var(--bg-secondary)",
              border: sel ? "1.5px solid var(--accent-green)" : "0.5px solid var(--border-subtle)",
              borderRadius: 10, padding: "12px 15px", cursor: "pointer", transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 24 }}>{l.flag}</span>
              <span style={{ fontSize: 14, color: sel ? "var(--text-primary)" : "var(--text-muted)", fontWeight: sel ? 600 : 400, flex: 1 }}>{l.name}</span>
              {sel && (
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent-green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 9, height: 6, borderLeft: "2px solid #fff", borderBottom: "2px solid #fff", transform: "rotate(-45deg) translateY(-1px)" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
        <Btn onClick={onNext} disabled={!learn}>Continue →</Btn>
        <Btn variant="ghost" onClick={onBack}>← Back</Btn>
      </div>
    </div>
  );
}

/* ── Step 4: Skill level ── */
type SkillMethod = "cefr" | "duolingo" | "unsure";

function StepSkill({ learnLang, cefr, setCefr, duoScore, setDuoScore, onNext, onBack }: {
  learnLang: string; cefr: CEFRLevel; setCefr: (v: CEFRLevel) => void;
  duoScore: number; setDuoScore: (v: number) => void; onNext: () => void; onBack: () => void;
}) {
  const [method, setMethod] = useState<SkillMethod>("cefr");
  const cd = CEFR_DATA[cefr];
  const scoreCefr = scoreToCefr(duoScore);
  const scoreCd = CEFR_DATA[scoreCefr];
  const band = scoreBand(duoScore);

  useEffect(() => {
    if (method === "duolingo") setCefr(scoreToCefr(duoScore));
  }, [duoScore, method]);

  const methodBtnStyle = (m: SkillMethod): React.CSSProperties => ({
    flex: 1, padding: "11px 8px", borderRadius: 9, cursor: "pointer",
    fontFamily: "inherit", fontWeight: 600, fontSize: 13,
    border: method === m ? `1.5px solid ${m === "cefr" ? "var(--accent-blue)" : m === "duolingo" ? "#58cc02" : "var(--accent-orange)"}` : "0.5px solid var(--border-subtle)",
    background: method === m ? (m === "cefr" ? "var(--accent-blue-bg)" : m === "duolingo" ? "#0f2200" : "var(--accent-orange-bg)") : "var(--bg-secondary)",
    color: method === m ? (m === "cefr" ? "var(--accent-blue)" : m === "duolingo" ? "#58cc02" : "var(--accent-orange)") : "var(--text-muted)",
    transition: "all 0.15s",
  });

  return (
    <div style={{ animation: "fadeIn 0.25s ease" }}>
      <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7 }}>STEP 4 OF 5</p>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 5 }}>Your {learnLang} level</h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
        We'll match you with learners at a similar stage so conversations feel natural and productive
      </p>

      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        <button style={methodBtnStyle("cefr")}     onClick={() => setMethod("cefr")}>CEFR score</button>
        <button style={methodBtnStyle("duolingo")}  onClick={() => setMethod("duolingo")}>Duolingo score</button>
        <button style={methodBtnStyle("unsure")}    onClick={() => setMethod("unsure")}>Not sure</button>
      </div>

      {method === "cefr" && (
        <div style={{ animation: "fadeIn 0.2s ease" }}>
          <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 10 }}>SELECT YOUR CEFR LEVEL</p>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {CEFR_ORDER.map(l => {
              const d = CEFR_DATA[l]; const sel = cefr === l;
              return (
                <button key={l} onClick={() => setCefr(l)} style={{
                  flex: 1, borderRadius: 9, padding: "13px 4px", textAlign: "center",
                  cursor: "pointer", fontFamily: "inherit",
                  border: sel ? `1.5px solid ${d.color}` : "0.5px solid var(--border-subtle)",
                  background: sel ? d.color : "var(--bg-secondary)",
                  color: sel ? "#fff" : "var(--text-muted)",
                  fontWeight: 700, fontSize: 14, transition: "all 0.15s",
                }}>{l}</button>
              );
            })}
          </div>
          <div style={{ background: cd.bg, border: `0.5px solid ${cd.border}`, borderRadius: 11, padding: "15px 17px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ background: cd.color, borderRadius: 7, padding: "4px 10px" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{cefr}</span>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: cd.color }}>{cd.label}</span>
              <span style={{ fontSize: 12, color: "var(--text-faint)", marginLeft: "auto" }}>{cd.short}</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{cd.desc}</p>
          </div>
          <div style={{ background: "var(--bg-secondary)", borderRadius: 10, padding: "13px 15px" }}>
            <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, marginBottom: 10 }}>PROFICIENCY SCALE</p>
            <div style={{ position: "relative", height: 8, background: "var(--bg-tertiary)", borderRadius: 4, marginBottom: 8 }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 4, width: `${(CEFR_ORDER.indexOf(cefr) + 1) / 6 * 100}%`, background: cd.color, transition: "width 0.4s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {CEFR_ORDER.map(l => (
                <span key={l} style={{ fontSize: 11, fontWeight: l === cefr ? 700 : 400, color: l === cefr ? cd.color : "var(--text-hint)" }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {method === "duolingo" && (
        <div style={{ animation: "fadeIn 0.2s ease" }}>
          <div style={{ background: "#0f2200", border: "0.5px solid #2a5500", borderRadius: 10, padding: "11px 15px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🦉</span>
            <p style={{ fontSize: 12, color: "#a0e060", lineHeight: 1.5 }}>
              Your <span style={{ fontWeight: 700 }}>Duolingo Score</span> ranges from 0 to 160 and measures overall language proficiency — find it in your Duolingo profile under "Progress".
            </p>
          </div>

          <div style={{ background: "var(--bg-secondary)", border: "0.5px solid var(--border-subtle)", borderRadius: 12, padding: "22px 20px", marginBottom: 14 }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 8 }}>YOUR DUOLINGO SCORE</p>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 6 }}>
                <span style={{ fontSize: 56, fontWeight: 800, color: band.color, lineHeight: 1, transition: "color 0.3s ease" }}>{duoScore}</span>
                <span style={{ fontSize: 18, color: "var(--text-faint)", marginBottom: 8 }}>/160</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, background: "var(--bg-quaternary)", borderRadius: 20, padding: "5px 16px", border: `0.5px solid ${band.color}40` }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: band.color }} />
                <span style={{ fontSize: 13, color: band.color, fontWeight: 700 }}>{band.label}</span>
                <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{band.desc}</span>
              </div>
            </div>

            <input type="range" min={0} max={160} step={1} value={duoScore}
              onChange={e => setDuoScore(Number(e.target.value))}
              style={{ width: "100%", marginBottom: 6 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: "var(--text-hint)" }}>0</span>
              <span style={{ fontSize: 11, color: "var(--text-hint)" }}>160</span>
            </div>

            <div style={{ position: "relative", marginBottom: 6 }}>
              <div style={{ height: 6, borderRadius: 3, overflow: "hidden", display: "flex", marginBottom: 8 }}>
                {[
                  { color: "#ff9f0a", w: 20/160*100 },
                  { color: "#ff9f0a", w: 30/160*100 },
                  { color: "#30d158", w: 35/160*100 },
                  { color: "#0a84ff", w: 30/160*100 },
                  { color: "#bf5af2", w: 25/160*100 },
                  { color: "#ff375f", w: 20/160*100 },
                ].map((seg, i) => (
                  <div key={i} style={{
                    width: `${seg.w}%`, height: "100%", background: seg.color,
                    opacity: duoScore >= [0,20,50,85,115,140][i] ? 1 : 0.25, transition: "opacity 0.3s",
                  }} />
                ))}
              </div>
              <div style={{
                position: "absolute", top: -2, left: `calc(${duoScore / 160 * 100}% - 5px)`,
                width: 10, height: 10, borderRadius: "50%",
                background: band.color, border: "2px solid var(--bg-secondary)",
                transition: "left 0.1s, background 0.3s",
              }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {["A1","A2","B1","B2","C1","C2"].map((l) => (
                <span key={l} style={{ fontSize: 11, fontWeight: l === scoreCefr ? 700 : 400, color: l === scoreCefr ? scoreCd.color : "var(--text-hint)", transition: "color 0.3s" }}>{l}</span>
              ))}
            </div>
          </div>

          <div style={{ background: scoreCd.bg, border: `0.5px solid ${scoreCd.border}`, borderRadius: 10, padding: "14px 15px", display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, marginBottom: 6 }}>EQUIVALENT CEFR LEVEL</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ background: scoreCd.color, borderRadius: 6, padding: "4px 10px" }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{scoreCefr}</span>
                </div>
                <span style={{ fontSize: 14, color: scoreCd.color, fontWeight: 700 }}>{scoreCd.label}</span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto", maxWidth: 160, textAlign: "right" }}>{scoreCd.short}</p>
          </div>
        </div>
      )}

      {method === "unsure" && (
        <div style={{ animation: "fadeIn 0.2s ease" }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
            No problem — just give us a rough idea and we'll refine your match over time.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "I'm a complete beginner",        emoji: "🌱", level: "A1" as CEFRLevel },
              { label: "I know a few words and phrases", emoji: "📖", level: "A2" as CEFRLevel },
              { label: "I can hold basic conversations", emoji: "💬", level: "B1" as CEFRLevel },
              { label: "I'm fairly comfortable",         emoji: "🗣️", level: "B2" as CEFRLevel },
              { label: "I'm quite advanced",             emoji: "🎓", level: "C1" as CEFRLevel },
              { label: "I'm nearly fluent",              emoji: "⭐", level: "C2" as CEFRLevel },
            ].map(opt => {
              const sel = cefr === opt.level; const d = CEFR_DATA[opt.level];
              return (
                <div key={opt.level} onClick={() => { setCefr(opt.level); setDuoScore(cefrMidScore(opt.level)); }} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: sel ? d.bg : "var(--bg-secondary)",
                  border: sel ? `1.5px solid ${d.color}` : "0.5px solid var(--border-subtle)",
                  borderRadius: 10, padding: "14px 15px", cursor: "pointer", transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                  <span style={{ fontSize: 14, color: sel ? d.color : "var(--text-secondary)", fontWeight: sel ? 700 : 400, flex: 1 }}>{opt.label}</span>
                  <div style={{ background: sel ? d.color : "var(--bg-tertiary)", borderRadius: 5, padding: "3px 9px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: sel ? "#fff" : "var(--text-hint)" }}>{opt.level}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
        <Btn onClick={onNext}>Continue →</Btn>
        <Btn variant="ghost" onClick={onBack}>← Back</Btn>
      </div>
    </div>
  );
}

/* ── Step 5: Confirmation ── */
function StepConfirm({ userName, userEmail, native, learn, cefr, duoScore, onBack }: {
  userName: string; userEmail: string; native: string; learn: string;
  cefr: CEFRLevel; duoScore: number; onBack: () => void;
}) {
  const router = useRouter();
  const cd = CEFR_DATA[cefr];
  const band = scoreBand(duoScore);
  const nFlag = ALL_LANGS.find(l => l.name === native)?.flag ?? "🏳️";
  const lFlag = ALL_LANGS.find(l => l.name === learn)?.flag ?? "🏳️";
  const initial = userName.charAt(0).toUpperCase() || "?";

  return (
    <div style={{ animation: "fadeIn 0.25s ease" }}>
      <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 7 }}>STEP 5 OF 5</p>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 5 }}>You're all set!</h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 22 }}>Here's your profile — we'll use this to match your calls</p>

      <div style={{ background: "var(--bg-secondary)", borderRadius: 12, overflow: "hidden", marginBottom: 14, border: "0.5px solid var(--border-subtle)" }}>
        <div style={{ padding: "17px 19px", borderBottom: "0.5px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "var(--accent-green-bg)", border: "2px solid var(--accent-green)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 800, color: "var(--accent-green)", flexShrink: 0,
          }}>{initial}</div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700 }}>{userName}</p>
            <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{userEmail}</p>
          </div>
          <button onClick={onBack} style={{
            marginLeft: "auto", fontSize: 12, color: "var(--accent-blue)",
            fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
          }}>Edit</button>
        </div>

        <div style={{ padding: "17px 19px", borderBottom: "0.5px solid var(--border-subtle)" }}>
          <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, marginBottom: 12 }}>LANGUAGE PAIR</p>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1, background: "var(--accent-blue-bg)", border: "0.5px solid var(--accent-blue-border)", borderRadius: "10px 0 0 10px", padding: "13px 15px", textAlign: "center" }}>
              <span style={{ fontSize: 26 }}>{nFlag}</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-blue)", marginTop: 5 }}>{native}</p>
              <p style={{ fontSize: 11, color: "var(--text-faint)" }}>I speak</p>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg-tertiary)", border: "0.5px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "var(--text-muted)", flexShrink: 0 }}>⇄</div>
            <div style={{ flex: 1, background: "var(--accent-green-bg)", border: "0.5px solid var(--accent-green-border)", borderRadius: "0 10px 10px 0", padding: "13px 15px", textAlign: "center" }}>
              <span style={{ fontSize: 26 }}>{lFlag}</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-green)", marginTop: 5 }}>{learn}</p>
              <p style={{ fontSize: 11, color: "var(--text-faint)" }}>I'm learning</p>
            </div>
          </div>
        </div>

        <div style={{ padding: "15px 19px" }}>
          <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, marginBottom: 12 }}>SKILL LEVEL</p>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, background: cd.bg, border: `0.5px solid ${cd.border}`, borderRadius: 10, padding: "13px 15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ background: cd.color, borderRadius: 6, padding: "3px 9px" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{cefr}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: cd.color }}>{cd.label}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{cd.short}</p>
            </div>
            {duoScore > 0 && (
              <div style={{ background: "var(--bg-tertiary)", borderRadius: 10, padding: "13px 15px", textAlign: "center", minWidth: 96 }}>
                <span style={{ fontSize: 18 }}>🦉</span>
                <p style={{ fontSize: 24, fontWeight: 800, color: band.color, marginTop: 4, lineHeight: 1 }}>{duoScore}</p>
                <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>/ 160</p>
                <p style={{ fontSize: 11, color: band.color, fontWeight: 700, marginTop: 3 }}>{band.label}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--accent-blue-bg)", border: "0.5px solid var(--accent-blue-border)", borderRadius: 10, padding: "13px 15px", marginBottom: 18, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-blue)", flexShrink: 0, marginTop: 4 }} />
        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          You'll be matched with other{" "}
          <span style={{ color: "var(--accent-blue)", fontWeight: 700 }}>{learn} learners</span>
          {" "}at{" "}
          <span style={{ color: cd.color, fontWeight: 700 }}>{cefr} level</span>
          {" "}— practise together through real conversations and improve at the same pace
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Btn onClick={() => router.push("/dashboard")} style={{ fontSize: 15, padding: "15px 0" }}>
          Start my first call →
        </Btn>
        <Btn variant="ghost" onClick={onBack}>← Back</Btn>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function OnboardingPage() {
  const [step, setStep]           = useState(1);
  const [native, setNative]       = useState("English");
  const [learn, setLearn]         = useState("");
  const [cefr, setCefr]           = useState<CEFRLevel>("B1");
  const [duoScore, setDuoScore]   = useState(0);
  const [userName, setUserName]   = useState("");
  const [userEmail, setUserEmail] = useState("");

  const TOTAL = 5;

  useEffect(() => {
    const name  = sessionStorage.getItem("ll_user_name")  || "";
    const email = sessionStorage.getItem("ll_user_email") || "";
    setUserName(name);
    setUserEmail(email);
    if (name) setStep(2);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "15px 22px", background: "var(--bg-secondary)",
          borderRadius: "14px 14px 0 0", borderBottom: "0.5px solid var(--border-subtle)",
        }}>
          <Link href="/dashboard" style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", textDecoration: "none" }}>LinguaLink</Link>
          <StepDots step={step - 1} total={TOTAL} />
        </div>

        <div style={{ background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "26px 24px" }}>
          {step === 1 && <StepAccount userName={userName} userEmail={userEmail} onNext={() => setStep(2)} />}
          {step === 2 && <StepNative native={native} setNative={setNative} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <StepLearn native={native} learn={learn} setLearn={setLearn} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && <StepSkill learnLang={learn || "your target language"} cefr={cefr} setCefr={setCefr} duoScore={duoScore} setDuoScore={setDuoScore} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
          {step === 5 && <StepConfirm userName={userName} userEmail={userEmail} native={native} learn={learn} cefr={cefr} duoScore={duoScore} onBack={() => setStep(4)} />}
        </div>
      </div>
    </div>
  );
}
