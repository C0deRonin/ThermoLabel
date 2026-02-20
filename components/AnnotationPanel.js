// components/AnnotationPanel.js
// Компонент правой панели со списком аннотаций

import { THEME_COLORS } from "@/lib/constants";

export default function AnnotationPanel({
  annotations,
  selAnn,
  setSelAnn,
  setAnnotations,
  setUndoStack,
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

  const deleteAnnotation = (i) => {
    setAnnotations((as) => as.filter((_, ai) => ai !== i));
    if (selAnn === i) setSelAnn(null);
  };

  const clearAll = () => {
    setUndoStack((p) => [...p, annotations]);
    setAnnotations([]);
    setSelAnn(null);
  };

  return (
    <div
      style={{
        width: 210,
        background: cs.panel,
        borderLeft: `1px solid ${cs.border}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "13px 13px 9px",
          fontSize: 8,
          color: cs.dim,
          letterSpacing: 2.5,
        }}
      >
        АННОТАЦИИ · {annotations.length}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 9px 9px" }}>
        {annotations.length === 0 && (
          <div
            style={{
              fontSize: 9,
              color: "#1a2a34",
              textAlign: "center",
              padding: "24px 0",
              lineHeight: 2.2,
            }}
          >
            Нарисуй bbox или полигон на снимке
          </div>
        )}
        {[...annotations].reverse().map((ann, ri) => {
          const i = annotations.length - 1 - ri;
          return (
            <div
              key={ann.id}
              onClick={() => setSelAnn(selAnn === i ? null : i)}
              style={{
                marginBottom: 5,
                padding: "8px 9px",
                background: selAnn === i ? "#111820" : cs.bg,
                border: "1px solid",
                borderColor: selAnn === i ? ann.cls.color : cs.border,
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={{ color: ann.cls.color, fontSize: 9 }}>
                  {ann.type === "polygon" ? "⬡" : "▭"} #{i + 1} {ann.cls.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(i);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#1e3040",
                    cursor: "pointer",
                    fontSize: 11,
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: 8, color: "#2a4050", lineHeight: 1.9 }}>
                <span style={{ color: cs.accent }}>
                  {ann.tempStats.mean.toFixed(1)}°
                </span>
                <span style={{ color: "#1e3040" }}> avg  </span>
                <span style={{ color: "#ff3030" }}>
                  {ann.tempStats.max.toFixed(1)}°
                </span>
                <span style={{ color: "#1e3040" }}> max</span>
                <div style={{ color: "#1e3040" }}>
                  {Math.round(ann.w)}×{Math.round(ann.h)}px
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {annotations.length > 0 && (
        <div
          style={{
            padding: 9,
            borderTop: `1px solid ${cs.border}`,
          }}
        >
          <button
            onClick={clearAll}
            style={{
              ...buttonStyle(false, "#ff3030"),
              width: "100%",
              textAlign: "center",
              fontSize: 9,
            }}
          >
            ✕ Очистить всё
          </button>
        </div>
      )}
    </div>
  );
}
