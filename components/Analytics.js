// components/Analytics.js
// Компонент для показа аналитики датасета

import { THEME_COLORS } from "@/lib/constants";

export default function Analytics({ annotations, classes, W, H }) {
  const cs = THEME_COLORS;

  const cardStyle = {
    background: cs.panel,
    border: `1px solid ${cs.border}`,
    borderRadius: 9,
    padding: 16,
  };

  const classStats = classes.map((cls) => {
    const ca = annotations.filter((a) => a.cls.id === cls.id);
    const temps = ca.map((a) => a.tempStats.mean);
    return {
      ...cls,
      count: ca.length,
      avgTemp: temps.length > 0 ? temps.reduce((s, v) => s + v, 0) / temps.length : 0,
      maxTemp: temps.length > 0 ? Math.max(...temps) : 0,
    };
  });

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 860,
        padding: 26,
        overflowY: "auto",
        maxHeight: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: 8,
          color: cs.dim,
          letterSpacing: 2.5,
          marginBottom: 18,
        }}
      >
        АНАЛИТИКА · {annotations.length} АННОТАЦИЙ
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 10,
          marginBottom: 18,
        }}
      >
        {[
          ["Аннотаций", annotations.length, "#cce8ff"],
          [
            "Классов",
            classStats.filter((c) => c.count > 0).length,
            "#cce8ff",
          ],
          [
            "Max темп",
            annotations.length
              ? Math.max(...annotations.map((a) => a.tempStats.max)).toFixed(1) + "°"
              : "—",
            "#ff3030",
          ],
          [
            "Min темп",
            annotations.length
              ? Math.min(...annotations.map((a) => a.tempStats.min)).toFixed(1) + "°"
              : "—",
            "#4488ff",
          ],
        ].map(([l, v, c]) => (
          <div key={l} style={cardStyle}>
            <div
              style={{
                fontSize: 8,
                color: cs.dim,
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              {l}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Distribution and Temperature Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={cardStyle}>
          <div
            style={{
              fontSize: 8,
              color: cs.dim,
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            РАСПРЕДЕЛЕНИЕ КЛАССОВ
          </div>
          {classStats.map((cls) => (
            <div key={cls.id} style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                  fontSize: 9,
                }}
              >
                <span style={{ color: cls.color }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      background: cls.color,
                      borderRadius: 1,
                      marginRight: 5,
                    }}
                  />
                  {cls.name}
                </span>
                <span style={{ color: cs.dim }}>
                  {cls.count} ·{" "}
                  {annotations.length
                    ? Math.round((cls.count / annotations.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  background: "#1a2332",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${
                      annotations.length
                        ? (cls.count / annotations.length) * 100
                        : 0
                    }%`,
                    height: "100%",
                    background: cls.color,
                    borderRadius: 2,
                    transition: "width 0.5s",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <div
            style={{
              fontSize: 8,
              color: cs.dim,
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            ТЕМПЕРАТУРЫ ПО КЛАССАМ
          </div>
          {classStats.filter((c) => c.count > 0).length === 0 && (
            <div
              style={{
                fontSize: 9,
                color: cs.text,
                textAlign: "center",
                padding: 16,
              }}
            >
              Нет аннотаций
            </div>
          )}
          {classStats
            .filter((c) => c.count > 0)
            .map((cls) => (
              <div
                key={cls.id}
                style={{
                  marginBottom: 8,
                  padding: "8px 10px",
                  background: "#111820",
                  borderRadius: 6,
                  borderLeft: `3px solid ${cls.color}`,
                }}
              >
                <div style={{ color: cls.color, fontSize: 9, marginBottom: 5 }}>
                  {cls.name}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 6,
                    fontSize: 9,
                  }}
                >
                  <div>
                    <span style={{ color: cs.dim }}>avg </span>
                    <span style={{ color: cs.text }}>
                      {cls.avgTemp.toFixed(1)}°
                    </span>
                  </div>
                  <div>
                    <span style={{ color: cs.dim }}>max </span>
                    <span style={{ color: "#ff3030" }}>
                      {cls.maxTemp.toFixed(1)}°
                    </span>
                  </div>
                  <div>
                    <span style={{ color: cs.dim }}>n </span>
                    <span style={{ color: "#cce8ff" }}>{cls.count}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Scatter Plot */}
      <div style={cardStyle}>
        <div
          style={{
            fontSize: 8,
            color: cs.dim,
            letterSpacing: 2,
            marginBottom: 10,
          }}
        >
          SCATTER: ПОЗИЦИИ АННОТАЦИЙ
        </div>
        <div
          style={{
            position: "relative",
            height: 160,
            background: cs.bg,
            borderRadius: 5,
            border: `1px solid ${cs.border}`,
            overflow: "hidden",
          }}
        >
          {annotations.map((ann, i) => {
            const px = ((ann.x + ann.w / 2) / W) * 100;
            const py = ((ann.y + ann.h / 2) / H) * 100;
            const size = Math.max(6, Math.min(28, Math.sqrt(ann.w * ann.h) / 5));
            return (
              <div
                key={ann.id}
                title={`${ann.cls.name} ${ann.tempStats.mean.toFixed(1)}°C`}
                style={{
                  position: "absolute",
                  left: `${px}%`,
                  top: `${py}%`,
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  background: ann.cls.color + "88",
                  border: `1px solid ${ann.cls.color}`,
                  transform: "translate(-50%,-50%)",
                  cursor: "pointer",
                  transition: "transform 0.1s",
                }}
              />
            );
          })}
          {!annotations.length && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                color: cs.text,
              }}
            >
              Добавь аннотации
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
