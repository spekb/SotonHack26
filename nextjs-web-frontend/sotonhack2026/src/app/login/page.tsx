"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUserByName } from "@/lib/actions/dbActions";
import Link from "next/link";

const INPUT = {
  width: "100%", background: "var(--bg-tertiary)",
  border: "0.5px solid var(--border-subtle)", borderRadius: 8,
  padding: "11px 14px", fontSize: 14, color: "var(--text-primary)",
  outline: "none", fontFamily: "inherit",
} as const;

const LABEL = {
  fontSize: 11, color: "var(--text-faint)", fontWeight: 600,
  letterSpacing: "0.05em", marginBottom: 6, display: "block",
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (mode === "signup") {
      if (!name.trim()) return setError("Please enter your name.");
      if (!email.trim()) return setError("Please enter your email.");
      sessionStorage.setItem("ll_user_name", name.trim());
      sessionStorage.setItem("ll_user_email", email.trim());
      router.push("/onboarding");
    } else {
      if (!email.trim()) return setError("Please enter your email.");
      const displayName = email.trim().split("@")[0];
      const user = await getUserByName(email);
      if (user == null) {
        return setError("User account does not exist.");
      } else {
        sessionStorage.setItem("ll_user_name", displayName);
        sessionStorage.setItem("ll_user_id", user.id);
        sessionStorage.setItem("ll_native_lang", user.native_lang ?? "English");
        sessionStorage.setItem("ll_learn_lang", user.learning_langs?.[0] ?? "");
        sessionStorage.setItem("ll_skill_level", user.skill_level?.toString() ?? "");
        sessionStorage.setItem("ll_duo_score", user.skill_level?.toString() ?? "0");
        sessionStorage.setItem("ll_cefr", user.cefr_level ?? "A1");
        router.push("/dashboard");
      }
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-primary)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/dashboard" style={{
            fontSize: 26, fontWeight: 800, color: "var(--text-primary)",
            textDecoration: "none", letterSpacing: "-0.02em",
          }}>LinguaLink</Link>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8 }}>
            {mode === "login" ? "Welcome back" : "Start learning today"}
          </p>
        </div>

        <div style={{
          background: "var(--bg-secondary)", borderRadius: 16,
          padding: "30px 26px", border: "0.5px solid var(--border-subtle)",
        }}>
          {/* Tab toggle */}
          <div style={{
            display: "flex", background: "var(--bg-tertiary)",
            borderRadius: 9, padding: 3, marginBottom: 26, gap: 3,
          }}>
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "8px 0", borderRadius: 7, border: "none",
                background: mode === m ? "var(--bg-secondary)" : "transparent",
                color: mode === m ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: 13, fontWeight: mode === m ? 600 : 400,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
                transition: "all 0.15s",
              }}>
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <div>
                <label style={LABEL}>YOUR NAME</label>
                <input
                  type="text" value={name}
                  onChange={e => { setName(e.target.value); setError(""); }}
                  placeholder="Jane Smith" style={INPUT}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
              </div>
            )}

            <div>
              <label style={LABEL}>EMAIL</label>
              <input
                type="email" value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="you@example.com" style={INPUT}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {error && (
              <p style={{ fontSize: 12, color: "var(--accent-red)", marginTop: -4 }}>{error}</p>
            )}

            <button
              onClick={handleSubmit}
              style={{
                width: "100%", background: "var(--accent-blue)", color: "#fff",
                border: "none", borderRadius: 9, padding: "13px 0",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", marginTop: 4, transition: "opacity 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              {mode === "login" ? "Log in →" : "Continue →"}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-hint)", marginTop: 20 }}>
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
