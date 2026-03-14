export type DashboardStats = {
  new_words_this_week: string[];
  most_used_words: [string, number][];
  total_interactions: number;
  total_convo_time_seconds: number;
  activity_heatmap: Record<string, number>;
  popular_topics: [string, number][];
  avg_words_per_session: number;
  avg_words_per_turn: number;
  new_words_per_minute: number;
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

  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}