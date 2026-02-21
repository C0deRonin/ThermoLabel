import React, { useState, useRef } from "react";
import apiService from "@/lib/services/apiService";

const DatabaseDumpModal = ({ isOpen, onClose, t = (k) => k }) => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [clearBeforeImport, setClearBeforeImport] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleExport = async (dataOnly = false) => {
    setMessage(null);
    setExporting(true);
    try {
      const { blob, filename } = await apiService.exportDump(dataOnly);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: "success", text: t("dump_export_success") });
    } catch (err) {
      setMessage({ type: "error", text: err.message || t("error") });
    } finally {
      setExporting(false);
    }
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0];
    setImportFile(file || null);
    setMessage(null);
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage({ type: "error", text: t("dump_choose_file") });
      return;
    }
    const ext = (importFile.name || "").toLowerCase().slice(-5);
    if (!ext.endsWith(".sql") && !ext.endsWith(".dump")) {
      setMessage({ type: "error", text: t("dump_format_hint") });
      return;
    }
    setMessage(null);
    setImporting(true);
    try {
      const result = await apiService.importDump(importFile, clearBeforeImport);
      setMessage({
        type: "success",
        text: result?.message || t("dump_import_success"),
      });
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setMessage({ type: "error", text: err.message || t("error") });
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dump-modal-title"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        <h2 id="dump-modal-title">{t("dump_modal_title")}</h2>
        <p style={{ fontSize: 12, color: "var(--color-dim)", marginBottom: 16 }}>
          {t("dump_modal_hint")}
        </p>

        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, marginBottom: 8 }}>{t("dump_export")}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              onClick={() => handleExport(false)}
              disabled={exporting}
              style={{
                padding: "8px 14px",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                background: "var(--color-surface)",
                color: "var(--color-text)",
                cursor: exporting ? "wait" : "pointer",
                fontFamily: "inherit",
                fontSize: 12,
              }}
            >
              {exporting ? "…" : t("dump_download")}
            </button>
            <button
              type="button"
              onClick={() => handleExport(true)}
              disabled={exporting}
              style={{
                padding: "8px 14px",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                background: "var(--color-surface)",
                color: "var(--color-text)",
                cursor: exporting ? "wait" : "pointer",
                fontFamily: "inherit",
                fontSize: 12,
              }}
            >
              {exporting ? "…" : t("dump_download_data_only")}
            </button>
          </div>
        </section>

        <section style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, marginBottom: 8 }}>{t("dump_import")}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={clearBeforeImport}
                onChange={(e) => setClearBeforeImport(e.target.checked)}
                name="clearBeforeImport"
                id="dump-clear-before"
              />
              {t("dump_import_clear_before")}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".sql,.dump"
              onChange={handleImportFileChange}
              style={{ fontSize: 12 }}
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || !importFile}
              style={{
                padding: "8px 14px",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                background: "var(--color-surface)",
                color: "var(--color-text)",
                cursor: importing || !importFile ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {importing ? "…" : t("dump_import_btn")}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--color-dim)", marginTop: 6 }}>
            .sql или .dump
          </p>
        </section>

        {message && (
          <p
            style={{
              fontSize: 12,
              padding: 8,
              borderRadius: 4,
              background:
                message.type === "error"
                  ? "rgba(200, 80, 80, 0.15)"
                  : "rgba(80, 160, 80, 0.15)",
              color:
                message.type === "error"
                  ? "var(--color-error, #c44)"
                  : "var(--color-success, #4a4)",
            }}
          >
            {message.text}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 16,
            padding: "6px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: 5,
            background: "transparent",
            color: "var(--color-dim)",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {t("dump_close")}
        </button>
      </div>
    </div>
  );
};

export default DatabaseDumpModal;
