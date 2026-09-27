export default function Loading() {
  return (
    <div className="screen" style={{ animation: "fadeUp 0.2s ease" }}>
      <div className="page-row">
        <div>
          <div
            className="page-title"
            style={{
              width: 220,
              height: 26,
              background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite",
              borderRadius: 6,
            }}
          />
          <div
            className="page-subtitle"
            style={{
              width: 380,
              height: 16,
              marginTop: 6,
              background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite 0.1s",
              borderRadius: 4,
            }}
          />
        </div>
      </div>

      <div
        className="stats"
        aria-hidden
        style={{ pointerEvents: "none" }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-box">
            <div
              style={{
                width: 110,
                height: 12,
                background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                backgroundSize: "200% 100%",
                animation: `shimmer 1.4s infinite ${0.1 * i}s`,
                borderRadius: 4,
              }}
            />
            <div
              style={{
                width: 70,
                height: 30,
                marginTop: 8,
                background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                backgroundSize: "200% 100%",
                animation: `shimmer 1.4s infinite ${0.1 * i + 0.1}s`,
                borderRadius: 6,
              }}
            />
          </div>
        ))}
      </div>

      <div className="two-col">
        <div>
          <div
            style={{
              width: 140,
              height: 16,
              marginBottom: 12,
              background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite 0.3s",
              borderRadius: 4,
            }}
          />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
                background: "var(--bg-white)",
                padding: "18px 20px",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: 14,
                  background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                  backgroundSize: "200% 100%",
                  animation: `shimmer 1.4s infinite ${0.4 + 0.1 * i}s`,
                  borderRadius: 4,
                  marginBottom: 10,
                }}
              />
              <div
                style={{
                  width: "70%",
                  height: 12,
                  background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                  backgroundSize: "200% 100%",
                  animation: `shimmer 1.4s infinite ${0.45 + 0.1 * i}s`,
                  borderRadius: 4,
                }}
              />
            </div>
          ))}
        </div>

        <div>
          <div
            style={{
              width: 160,
              height: 16,
              marginBottom: 12,
              background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite 0.4s",
              borderRadius: 4,
            }}
          />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                background: "var(--bg-white)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 36,
                  background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                  backgroundSize: "200% 100%",
                  animation: `shimmer 1.4s infinite ${0.5 + 0.05 * i}s`,
                  borderRadius: 6,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: "90%",
                    height: 13,
                    background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                    backgroundSize: "200% 100%",
                    animation: `shimmer 1.4s infinite ${0.55 + 0.05 * i}s`,
                    borderRadius: 4,
                    marginBottom: 4,
                  }}
                />
                <div
                  style={{
                    width: "55%",
                    height: 11,
                    background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
                    backgroundSize: "200% 100%",
                    animation: `shimmer 1.4s infinite ${0.6 + 0.05 * i}s`,
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
