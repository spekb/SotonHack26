export default function StatsPanelSkeleton() {
    return (
      <>
        {/* Skeleton stat cards */}
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
  
        {/* Skeleton topics */}
        <div style={{
          background: "var(--bg-secondary)", borderRadius: 12,
          padding: "18px 20px", border: "0.5px solid var(--border-subtle)",
          display: "flex", alignItems: "center", justifyContent: "center",
          height: 160,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            border: "3px solid var(--accent-blue)",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </>
    );
  }