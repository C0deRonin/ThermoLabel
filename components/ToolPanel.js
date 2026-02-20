// components/ToolPanel.js
// Компонент левой панели с инструментами

import { PALETTES, getPaletteNames } from "@/lib/services/paletteService";
import { TOOLS, THEME_COLORS } from "@/lib/constants";
import Histogram from "./Histogram";

export default function ToolPanel({
  tool,
  setTool,
  palette,
  setPalette,
  classes,
  selClass,
  setSelClass,
  hovered,
  raw,
  threshold,
  setThreshold,
  applyThreshold,
  polyPts,
  setPolyPts,
  finishPolygon,
}) {
  const cs = THEME_COLORS;

  const buttonStyle = (isActive, color = cs.accent) => ({
    padding: "5px 9px",
    border: "1px solid",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 10,
    borderRadius: 5,
    transition: "all 0.12s",
    borderColor: isActive ? color : cs.border,
    background: isActive ? color + "14" : "transparent",
    color: isActive ? color : "#4a6880",
  });

  const labelStyle = {
    fontSize: 9,
    color: "#2a4050",
    letterSpacing: 2.5,
    display: "block",
    marginBottom: 8,
    textTransform: "uppercase",
  };

  return (
    <div
      style={{
        width: 196,
        background: cs.panel,
        borderRight: `1px solid ${cs.border}`,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Tools Section */}
      <div
        style={{
          padding: "13px 13px 11px",
          borderBottom: `1px solid ${cs.border}`,
        }}
      >
        <span style={labelStyle}>Инструмент</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {[
            [TOOLS.bbox, "▭  Bounding Box"],
            [TOOLS.polygon, "⬡  Полигон"],
            [TOOLS.threshold, "⚡  Порог"],
          ].map(([t, l]) => (
            <button
              key={t}
              onClick={() => {
                setTool(t);
                setPolyPts([]);
              }}
              style={{ ...buttonStyle(tool === t), textAlign: "left" }}
            >
              {l}
            </button>
          ))}
        </div>
        {tool === TOOLS.polygon && polyPts.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 9, color: "#3a5570" }}>
            {polyPts.length} точек ·{" "}
            <span
              style={{ color: cs.accent, cursor: "pointer" }}
              onClick={finishPolygon}
            >
              Закрыть
            </span>{" "}
            ·{" "}
            <span
              style={{ color: "#ff4040", cursor: "pointer" }}
              onClick={() => setPolyPts([])}
            >
              Сброс
            </span>
          </div>
        )}
        {tool === TOOLS.threshold && (
          <div style={{ marginTop: 9 }}>
            <div style={{ fontSize: 9, color: cs.dim, marginBottom: 4 }}>
              Порог: <span style={{ color: cs.accent }}>{threshold}°C</span>
            </div>
            <input
              type="range"
              min="-20"
              max="120"
              value={threshold}
              onChange={(e) => setThreshold(+e.target.value)}
              style={{ width: "100%", accentColor: cs.accent }}
            />
            <button
              onClick={applyThreshold}
              style={{
                ...buttonStyle(false, "#ff3030"),
                width: "100%",
                marginTop: 6,
                textAlign: "center",
              }}
            >
              Применить авто
            </button>
          </div>
        )}
      </div>

      {/* Palette Section */}
      <div
        style={{
          padding: "13px 13px 11px",
          borderBottom: `1px solid ${cs.border}`,
        }}
      >
        <span style={labelStyle}>Палитра</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {getPaletteNames().map((p) => (
            <button
              key={p}
              onClick={() => setPalette(p)}
              style={{
                ...buttonStyle(palette === p),
                display: "flex",
                alignItems: "center",
                gap: 6,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 8,
                  borderRadius: 2,
                  flexShrink: 0,
                  background: `linear-gradient(to right,${PALETTES[p]
                    .slice(0, 6)
                    .map((c) => `rgb(${c})`)
                    .join(",")})`,
                }}
              />
              <span style={{ fontSize: 9 }}>{p.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Classes Section */}
      <div
        style={{
          padding: "13px 13px 11px",
          borderBottom: `1px solid ${cs.border}`,
        }}
      >
        <span style={labelStyle}>Класс</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelClass(cls)}
              style={{
                ...buttonStyle(selClass.id === cls.id, cls.color),
                textAlign: "left",
                fontSize: 9,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  <span
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 7,
                      borderRadius: 1,
                      background: cls.color,
                      marginRight: 5,
                    }}
                  />
                  {cls.name}
                </span>
                <span style={{ fontSize: 8, opacity: 0.55 }}>
                  {cls.tempMin}…{cls.tempMax}°
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cursor Info */}
      <div
        style={{
          padding: "12px 13px 10px",
          borderBottom: `1px solid ${cs.border}`,
        }}
      >
        <span style={labelStyle}>Курсор</span>
        {hovered ? (
          <div style={{ fontSize: 10, lineHeight: 1.8, color: "#3a5570" }}>
            <span style={{ color: "#5a8090" }}>X</span>{" "}
            <span style={{ color: cs.text }}>{Math.floor(hovered.x)}</span>
            {"  "}
            <span style={{ color: "#5a8090" }}>Y</span>{" "}
            <span style={{ color: cs.text }}>{Math.floor(hovered.y)}</span>
            <br />
            <span style={{ color: "#5a8090" }}>T</span>{" "}
            <span
              style={{
                color:
                  hovered.temp > 45
                    ? "#ff3030"
                    : hovered.temp > 35
                    ? cs.accent
                    : cs.text,
                fontWeight: 700,
              }}
            >
              {hovered.temp.toFixed(1)}°C
            </span>
          </div>
        ) : (
          <div style={{ fontSize: 9, color: "#1e2e38" }}>
            Наведи на изображение
          </div>
        )}
      </div>

      {/* Histogram */}
      <div style={{ padding: "12px 13px" }}>
        <span style={labelStyle}>Гистограмма</span>
        <Histogram raw={raw} />
      </div>
    </div>
  );
}
