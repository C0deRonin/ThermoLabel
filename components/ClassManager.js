// components/ClassManager.js
// Компонент для управления классами

import { THEME_COLORS } from "@/lib/constants";

export default function ClassManager({
  classes,
  setClasses,
  annotations,
  newName,
  setNewName,
  newColor,
  setNewColor,
}) {
  const cs = THEME_COLORS;

  const cardStyle = {
    background: cs.panel,
    border: `1px solid ${cs.border}`,
    borderRadius: 9,
    padding: 16,
  };

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

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 560,
        padding: 26,
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
        УПРАВЛЕНИЕ КЛАССАМИ
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
        {classes.map((cls) => (
          <div
            key={cls.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "9px 12px",
              ...cardStyle,
            }}
          >
            <div
              style={{
                width: 13,
                height: 13,
                borderRadius: 3,
                background: cls.color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: cs.text, flex: 1, fontSize: 10 }}>
              {cls.name}
            </span>
            <span style={{ color: cs.dim, fontSize: 9 }}>
              {cls.tempMin}°…{cls.tempMax}°
            </span>
            <span style={{ color: cs.dim, fontSize: 9 }}>
              {annotations.filter((a) => a.cls.id === cls.id).length} ann
            </span>
            {classes.length > 1 && (
              <button
                onClick={() =>
                  setClasses((cs) => cs.filter((c) => c.id !== cls.id))
                }
                style={{
                  ...buttonStyle(false, "#ff3030"),
                  padding: "2px 7px",
                  fontSize: 10,
                }}
              >
                ✕
              </button>
            )}
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
          ДОБАВИТЬ КЛАСС
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Название класса"
            style={{
              flex: 1,
              minWidth: 120,
              padding: "6px 9px",
              background: "#111820",
              border: `1px solid ${cs.border}`,
              color: cs.text,
              borderRadius: 5,
              fontSize: 10,
              fontFamily: "inherit",
            }}
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            style={{
              width: 34,
              height: 30,
              padding: 2,
              background: "#111820",
              border: `1px solid ${cs.border}`,
              borderRadius: 5,
              cursor: "pointer",
            }}
          />
          <button
            onClick={() => {
              if (!newName.trim()) return;
              const id = Math.max(0, ...classes.map((c) => c.id)) + 1;
              setClasses((cs) => [
                ...cs,
                {
                  id,
                  name: newName.trim(),
                  color: newColor,
                  tempMin: -20,
                  tempMax: 120,
                },
              ]);
              setNewName("");
            }}
            style={{
              ...buttonStyle(false, "#00cc66"),
              padding: "6px 14px",
            }}
          >
            + Добавить
          </button>
        </div>
      </div>
    </div>
  );
}
