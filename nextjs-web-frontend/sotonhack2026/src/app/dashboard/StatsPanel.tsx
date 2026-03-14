import { fetchDashboardStats } from "./dashboardService";

// Replace with however you get the current user
async function getCurrentUser() {
  // TODO: fetch from your session/db
  return {
    id: "1",
    name: "Test User",
    total_time: 18540,
    conversations: [],
    vocab: [],
  };
}

export default async function StatsPanel() {
  const user = await getCurrentUser();
//   const stats = await fetchDashboardStats(user);

const data = await fetchDashboardStats(user);

if (!data.stats) {
  return (
    <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "20px 0" }}>
      No conversations yet — start a call to see your stats!
    </div>
  );
}

const stats = data.stats;

  const topics = stats.popular_topics.map(([label, count], i) => {
    const colors = [
      "var(--accent-blue)", "var(--accent-green)",
      "var(--accent-orange)", "var(--accent-purple)", "var(--accent-red)"
    ];
    const max = stats.popular_topics[0][1];
    return { label, pct: Math.round((count / max) * 100), color: colors[i] };
  });

  const totalMins = Math.round(stats.total_convo_time_seconds / 60);

  return (
    <>
      {/* Stat cards */}
      <div className="dash-grid-4" style={{ marginBottom: 14 }}>
        {[
          { label: "SESSIONS",      value: stats.total_interactions.toString(),   sub: `+${stats.new_words_this_week.length} new words this week`, subColor: "var(--accent-green)" },
          { label: "WORDS LEARNED", value: stats.most_used_words.length.toString(), sub: `avg ${stats.avg_words_per_session.toFixed(1)} per session`, subColor: "var(--accent-blue)" },
          { label: "TOTAL TIME",    value: `${totalMins}m`,  sub: `${stats.avg_words_per_turn.toFixed(1)} words/turn avg`, subColor: "var(--accent-orange)" },
          { label: "NEW THIS WEEK", value: stats.new_words_this_week.length.toString(), sub: `${stats.new_words_per_minute.toFixed(1)} new words/min`, subColor: "var(--accent-purple)" },
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

      {/* Popular topics */}
      <div style={{ background: "var(--bg-secondary)", borderRadius: 12, padding: "18px 20px", border: "0.5px solid var(--border-subtle)" }}>
        <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, letterSpacing: "0.07em", marginBottom: 14 }}>POPULAR TOPICS</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {topics.map((t) => (
            <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", width: 100, flexShrink: 0 }}>{t.label}</span>
              <div style={{ flex: 1, background: "var(--bg-tertiary)", borderRadius: 3, height: 5 }}>
                <div style={{ height: "100%", background: t.color, borderRadius: 3, width: `${t.pct}%` }} />
              </div>
              <span style={{ fontSize: 11, color: "var(--text-faint)", minWidth: 32, textAlign: "right" }}>{t.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}