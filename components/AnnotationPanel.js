// components/AnnotationPanel.js
// Компонент правой панели со списком аннотаций

import { THEME_COLORS } from "@/lib/constants";

export default function AnnotationPanel({
  annotations,
  selAnn,
  setSelAnn,
  setAnnotations,
  setUndoStack,
  setRedoStack,
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
    color: isActive ? color : cs.dim,
  });

  const deleteAnnotation = (i) => {
    setUndoStack((p) => [...p, annotations]);
    setRedoStack([]);
    setAnnotations((as) => as.filter((_, ai) => ai !== i));
    if (selAnn === i) setSelAnn(null);
  };

  const clearAll = () => {
    setUndoStack((p) => [...p, annotations]);
    setRedoStack([]);
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
              color: cs.text,
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
                    color: cs.dim,
                    cursor: "pointer",
                    fontSize: 11,
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: 8, color: cs.dim, lineHeight: 1.9 }}>
                <span style={{ color: cs.accent }}>
                  {ann.tempStats.mean.toFixed(1)}°
                </span>
                <span style={{ color: cs.dim }}> avg  </span>
                <span style={{ color: "#ff3030" }}>
                  {ann.tempStats.max.toFixed(1)}°
                </span>
                <span style={{ color: cs.dim }}> max</span>
                <div style={{ color: cs.dim }}>
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
