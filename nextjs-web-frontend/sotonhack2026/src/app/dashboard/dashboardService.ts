export type DashboardStats = {
  new_words_this_week: string[];
  most_used_words: [string, number][];
  total_interactions: number;
  total_convo_time_seconds: number;
  activity_heatmap: Record<string, number>;
  popular_topics: [string, number][];
  avg_words_per_session: number;
  new_words_per_minute: number;
  weekly_conversation_counts: number[];
  skill_level: number;
  cefr_level: string;   // ← ADD THIS
  cefr_index: number;
  learning_lang: string;
  vocab_size: number;
};

export type DashboardResponse = {
  stats: DashboardStats | null;
  error?: string;
};

export async function fetchDashboardStats(user: object): Promise<DashboardResponse> {
  const res = await fetch("http://localhost:8000/api/process-conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Backend error:", res.status, errorText);
    throw new Error("Failed to fetch stats");
  }
  return res.json();
}