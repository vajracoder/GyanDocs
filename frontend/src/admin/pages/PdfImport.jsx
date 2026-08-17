import { useEffect, useState, useRef } from "react";
import { getSubjects, getUnits, getTopicsByUnit, parsePdf, importPdf, createClassificationFeedback } from "../../services/api";
import "./PdfImport.css";

export default function PdfImport() {
  /* ─── Master state ─────────────────────────────────── */
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  /* ─── Extracted / review state ─────────────────────── */
  const [detectedYear, setDetectedYear] = useState(null);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [filename, setFilename] = useState("");

  /* ─── Possible-duplicate review state ──────────────── */
  const [pendingDuplicates, setPendingDuplicates] = useState([]);
  const [duplicateDecisions, setDuplicateDecisions] = useState({});

  /* ─── Import summary ────────────────────────────────── */
  const [importSummary, setImportSummary] = useState(null);

  const fileInputRef = useRef(null);

  /* ─────────────────────────────────────────────────────
     Load subjects on mount
  ───────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        setLoadingSubjects(true);
        const res = await getSubjects();
        setSubjects(res || []);
      } catch {
        setError("Failed to load subjects. Please refresh.");
      } finally {
        setLoadingSubjects(false);
      }
    })();
  }, []);

  /* ─────────────────────────────────────────────────────
     Subject change → load units
  ───────────────────────────────────────────────────── */
  const handleSubjectChange = async (e) => {
    const id = e.target.value;
    setSelectedSubject(id);
    setSelectedUnit("");
    setUnits([]);
    setError(null);
    if (!id) return;
    try {
      setLoadingUnits(true);
      const res = await getUnits(id);
      setUnits(res.data || []);
    } catch {
      setError("Failed to load units.");
    } finally {
      setLoadingUnits(false);
    }
  };

  /* ─────────────────────────────────────────────────────
     File validation helpers
  ───────────────────────────────────────────────────── */
  const validateAndSetFile = (file) => {
    if (!file) return;
    setError(null);
    setStatusMsg(null);
    setExtractedQuestions([]);
    setDetectedYear(null);
    setPendingDuplicates([]);
    setDuplicateDecisions({});
    setImportSummary(null);

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) { setError("Please select a valid PDF file."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("File size exceeds the 20 MB limit."); return; }

    setSelectedFile(file);
    setFilename(file.name);
  };

  const handleFileSelect = (e) => validateAndSetFile(e.target.files?.[0]);
  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); validateAndSetFile(e.dataTransfer.files?.[0]); };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setFilename("");
    setError(null);
    setStatusMsg(null);
    setExtractedQuestions([]);
    setDetectedYear(null);
    setPendingDuplicates([]);
    setDuplicateDecisions({});
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ─────────────────────────────────────────────────────
     STEP 1 — Parse PDF → extract questions
  ───────────────────────────────────────────────────── */
  const handleStartImport = async () => {
    if (!selectedFile) return;
    try {
      setParsing(true);
      setError(null);
      setStatusMsg("Uploading & extracting text from PDF…");

      // Pass subjectId so the backend can auto-classify each question
      // into a suggested unit + sub-unit.
      const response = await parsePdf(selectedFile, selectedSubject);
      if (!response?.success) {
        setError(response?.message || "Failed to extract questions.");
        setStatusMsg(null);
        return;
      }

      setDetectedYear(response.detectedYear || null);
      const qList = (response.questions || []).map((q, i) => ({
        id: i + 1,
        questionNumber: q.questionNumber || String(i + 1),
        questionText: q.questionText || "",
        marks: q.marks != null ? q.marks : "",
        co: q.co != null ? q.co : "",
        level: q.level || "",
        confidence: q.confidence || 0.85,
        // Classification suggestions from the backend
        suggestedUnitId: q.suggestedUnitId || "",
        suggestedUnitName: q.suggestedUnitName || "",
        suggestedUnitNumber: q.suggestedUnitNumber || "",
        suggestedTopicId: q.suggestedTopicId || "",
        suggestedTopicName: q.suggestedTopicName || "",
        unitConfidence: q.unitConfidence != null ? q.unitConfidence : null,
        topicConfidence: q.topicConfidence != null ? q.topicConfidence : null,
        classificationConfidence: q.classificationConfidence != null ? q.classificationConfidence : null,
        classificationLabel: q.classificationLabel || "LOW",
        needsManualReview: q.needsManualReview !== false,
        alternatives: q.alternatives || [],
        // Keep the original prediction so we can detect admin overrides
        originalSuggestedUnitId: q.suggestedUnitId || "",
        originalSuggestedTopicId: q.suggestedTopicId || "",
        kept: true,
      }));
      setExtractedQuestions(qList);
      setStatusMsg(`Extracted ${qList.length} question(s). Review classification & edit below, then click "Confirm & Save".`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error parsing PDF.");
      setStatusMsg(null);
    } finally {
      setParsing(false);
    }
  };

  /* ─────────────────────────────────────────────────────
     In-memory review actions
  ───────────────────────────────────────────────────── */
  const handleQTextChange  = (i, v) => { const u=[...extractedQuestions]; u[i].questionText=v; setExtractedQuestions(u); };
  const handleMarksChange  = (i, v) => { const u=[...extractedQuestions]; u[i].marks=v!==""?Number(v):""; setExtractedQuestions(u); };
  const handleCoChange     = (i, v) => { const u=[...extractedQuestions]; u[i].co=v!==""?Number(v):""; setExtractedQuestions(u); };
  const handleLevelChange  = (i, v) => { const u=[...extractedQuestions]; u[i].level=v; setExtractedQuestions(u); };
  const handleRemoveQ      = (i)    => setExtractedQuestions(extractedQuestions.filter((_, idx) => idx !== i));

  // Admin overrides the suggested unit for a question
  const handleUnitOverride = (i, unitId) => {
    const u = [...extractedQuestions];
    u[i].suggestedUnitId = unitId;
    // When the unit changes, clear the sub-unit (it belongs to the old unit)
    u[i].suggestedTopicId = "";
    u[i].suggestedTopicName = "";
    setExtractedQuestions(u);
  };

  // Admin overrides the suggested sub-unit (topic) for a question
  const handleTopicOverride = (i, topicId) => {
    const u = [...extractedQuestions];
    u[i].suggestedTopicId = topicId;
    setExtractedQuestions(u);
  };

  // Accept all high-confidence classifications (HIGH label)
  const handleAcceptAllHigh = () => {
    const u = extractedQuestions.map(q => {
      if (q.classificationLabel === "HIGH" && q.suggestedUnitId) {
        return { ...q, needsManualReview: false };
      }
      return q;
    });
    setExtractedQuestions(u);
  };

  /* ─────────────────────────────────────────────────────
     STEP 2 — Confirm & Save → call importPdf API
  ───────────────────────────────────────────────────── */
  const handleConfirmSave = async () => {
    const year = Number(detectedYear);
    if (!year || year < 2000 || year > 2100) {
      setError("Please enter a valid exam year (e.g. 2025) before saving.");
      return;
    }

    const keptQuestions = extractedQuestions.filter(q => q.kept !== false && q.questionText.trim());
    if (keptQuestions.length === 0) {
      setError("No questions to import. Please keep at least one question.");
      return;
    }

    try {
      setImporting(true);
      setError(null);
      setStatusMsg("Saving questions to database…");

      const payload = {
        subjectId: selectedSubject,
        unitId: selectedUnit,
        year,
        filename,
        questions: keptQuestions.map(q => ({
          questionText: q.questionText.trim(),
          marks: q.marks !== "" ? q.marks : null,
          co: q.co !== "" ? q.co : null,
          level: q.level || null,
          topicId: q.suggestedTopicId || null,
          classificationConfidence: q.classificationConfidence != null ? q.classificationConfidence : null,
          questionType: "theory",
          answer: "",
          source: filename,
        })),
      };

      const result = await importPdf(payload);

      if (result.success) {
        // ── Record classification feedback for admin overrides ──
        // When the admin changed the suggested unit/topic, record the
        // correction so the classifier can be improved later.
        try {
          for (const q of keptQuestions) {
            const originalUnitId = q.originalSuggestedUnitId;
            const originalTopicId = q.originalSuggestedTopicId;
            const finalUnitId = q.suggestedUnitId;
            const finalTopicId = q.suggestedTopicId;

            // Only record if the admin changed the unit or topic
            const unitChanged = originalUnitId && finalUnitId && originalUnitId !== finalUnitId;
            const topicChanged = originalTopicId && finalTopicId && originalTopicId !== finalTopicId;
            const wasUncertain = q.classificationLabel === "LOW" || q.classificationLabel === "MEDIUM";

            if ((unitChanged || topicChanged || wasUncertain) && finalUnitId) {
              await createClassificationFeedback({
                questionText: q.questionText.trim(),
                predictedUnitId: originalUnitId || null,
                predictedTopicId: originalTopicId || null,
                actualUnitId: finalUnitId,
                actualTopicId: finalTopicId || null,
                predictedConfidence: q.classificationConfidence != null ? q.classificationConfidence : null,
                correctedBy: "admin",
              });
            }
          }
        } catch (feedbackErr) {
          // Feedback recording is best-effort — never block the import.
          console.error("Failed to record classification feedback:", feedbackErr.message);
        }

        setImportSummary({
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          errors: result.errors || [],
        });
        setPendingDuplicates(result.possibleDuplicates || []);
        setDuplicateDecisions({});
        setStatusMsg(null);
        // Clear review state after successful import
        setExtractedQuestions([]);
      } else {
        setError(result.message || "Import failed.");
        setStatusMsg(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Import request failed.");
      setStatusMsg(null);
    } finally {
      setImporting(false);
    }
  };

  /* ─────────────────────────────────────────────────────
     Possible duplicate — admin decides
  ───────────────────────────────────────────────────── */
  const handleDuplicateDecision = async (dupItem, decision) => {
    setDuplicateDecisions(prev => ({ ...prev, [dupItem.existingId]: decision }));

    if (decision === "merge") {
      try {
        // Merge: send as a single-question import (backend will add year to existing)
        await importPdf({
          subjectId: selectedSubject,
          unitId: selectedUnit,
          year: dupItem.importedYear,
          filename,
          questions: [{
            questionText: dupItem.existingQuestion, // use the existing text to ensure ≥ 0.90 match
            marks: null,
            questionType: "theory",
            answer: "",
            source: filename,
          }],
        });
        setImportSummary(prev => prev ? { ...prev, updated: (prev.updated || 0) + 1 } : { created: 0, updated: 1, skipped: 0, errors: [] });
      } catch (err) {
        setError("Merge failed: " + (err.response?.data?.message || err.message));
      }
    }
    // "keep_separate": send the imported text as new question
    if (decision === "keep_separate") {
      try {
        await importPdf({
          subjectId: selectedSubject,
          unitId: selectedUnit,
          year: dupItem.importedYear,
          filename,
          questions: [{
            questionText: dupItem.importedQuestion,
            marks: null,
            questionType: "theory",
            answer: "",
            source: filename,
          }],
        });
        setImportSummary(prev => prev ? { ...prev, created: (prev.created || 0) + 1 } : { created: 1, updated: 0, skipped: 0, errors: [] });
      } catch (err) {
        setError("Save failed: " + (err.response?.data?.message || err.message));
      }
    }
    // "skip" → do nothing, just mark it
  };

  /* ─────────────────────────────────────────────────────
     Helpers
  ───────────────────────────────────────────────────── */
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024, sizes = ["B","KB","MB","GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isFormValid = selectedSubject && selectedUnit && selectedFile;
  const hasExtractedQuestions = extractedQuestions.length > 0;

  // Confidence display helper
  const confidencePct = (q) => {
    if (q.classificationConfidence == null) return null;
    return Math.round(q.classificationConfidence * 100);
  };

  const confidenceBadgeClass = (q) => {
    const pct = confidencePct(q);
    if (pct == null) return "low";
    if (pct >= 85) return "high";
    if (pct >= 65) return "medium";
    return "low";
  };

  const confidenceStatusText = (q) => {
    if (q.classificationLabel === "HIGH") return "Auto classified";
    if (q.classificationLabel === "MEDIUM") return "Please review";
    return "Manual classification required";
  };

  const confidenceEmoji = (q) => {
    if (q.classificationLabel === "HIGH") return "🟢";
    if (q.classificationLabel === "MEDIUM") return "🟡";
    return "🔴";
  };

  /* ─────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────── */
  return (
    <div className="pdf-import-page">

      {/* Heading */}
      <div className="pdf-import-header">
        <h1>PDF Import</h1>
        <p>Import previous-year question papers and review extracted questions before saving.</p>
      </div>

      {/* Upload Card */}
      <div className="pdf-import-card">
        <div className="selectors-grid">
          <div className="form-group-select">
            <label>Subject</label>
            <select value={selectedSubject} onChange={handleSubjectChange}
              disabled={loadingSubjects || parsing || importing}>
              <option value="">{loadingSubjects ? "Loading..." : "Select Subject"}</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.shortName || s.name} ({s.name})</option>
              ))}
            </select>
          </div>

          <div className="form-group-select">
            <label>Unit</label>
            <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}
              disabled={!selectedSubject || loadingUnits || parsing || importing}>
              <option value="">{!selectedSubject ? "Select Subject First" : loadingUnits ? "Loading..." : "Select Unit"}</option>
              {units.map(u => (
                <option key={u._id} value={u._id}>Unit {u.unitNumber} — {u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* File Input (hidden) */}
        <input type="file" ref={fileInputRef} accept="application/pdf"
          style={{ display: "none" }} onChange={handleFileSelect} />

        {/* Dropzone or File Card */}
        {!selectedFile ? (
          <div className={`dropzone-container ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}>
            <span className="dropzone-icon">📄</span>
            <div className="dropzone-title">
              Drag & drop your PDF here or <span className="browse-link">Choose PDF</span>
            </div>
            <div className="dropzone-hint">Supports single PDF files up to 20 MB</div>
          </div>
        ) : (
          <div className="selected-file-card">
            <div className="file-info">
              <span className="file-icon">📄</span>
              <div>
                <div className="file-name">{selectedFile.name}</div>
                <div className="file-size">{formatFileSize(selectedFile.size)}</div>
              </div>
            </div>
            <button type="button" className="remove-file-btn" onClick={handleRemoveFile} disabled={parsing || importing}>
              Remove
            </button>
          </div>
        )}

        {error    && <div className="pdf-error-banner">{error}</div>}
        {statusMsg && <div className="pdf-status-banner">{statusMsg}</div>}

        <div className="import-actions">
          <button className="start-import-btn" disabled={!isFormValid || parsing || importing} onClick={handleStartImport}>
            {parsing ? "Parsing PDF…" : "Start Import"}
          </button>
        </div>
      </div>

      {/* ── Import Summary ─────────────────────────────── */}
      {importSummary && (
        <div className="import-summary-card">
          <h2>✅ Import Complete</h2>
          <div className="summary-grid">
            <div className="summary-item"><span className="summary-count created">{importSummary.created}</span><span>Created</span></div>
            <div className="summary-item"><span className="summary-count updated">{importSummary.updated}</span><span>Updated</span></div>
            <div className="summary-item"><span className="summary-count skipped">{importSummary.skipped}</span><span>Skipped</span></div>
            <div className="summary-item"><span className="summary-count error-count">{importSummary.errors.length}</span><span>Errors</span></div>
          </div>
          {importSummary.errors.length > 0 && (
            <div className="summary-errors">
              {importSummary.errors.map((e, i) => (
                <div key={i} className="summary-error-row">❌ {e.questionText?.slice(0, 60)}… — {e.error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Possible Duplicates for Admin Review ──────── */}
      {pendingDuplicates.length > 0 && (
        <div className="review-section" style={{ marginTop: 24 }}>
          <h2>⚠️ Possible Duplicates ({pendingDuplicates.filter(d => !duplicateDecisions[d.existingId]).length} pending)</h2>
          <p className="dup-subtitle">These questions are similar to existing ones. Decide how to handle each.</p>
          {pendingDuplicates.map((dup, i) => {
            const decided = duplicateDecisions[dup.existingId];
            return (
              <div key={i} className={`dup-card ${decided ? "dup-decided" : ""}`}>
                <div className="dup-side">
                  <div className="dup-label">Existing Question</div>
                  <div className="dup-text">{dup.existingQuestion}</div>
                  <div className="dup-years">Years: {(dup.existingYears || []).join(" • ")}</div>
                </div>
                <div className="dup-divider">
                  <span className="similarity-badge">{dup.similarity}% similar</span>
                  <span className="dup-arrow">⟷</span>
                  <span className="dup-import-year">Year {dup.importedYear}</span>
                </div>
                <div className="dup-side">
                  <div className="dup-label">Imported Question</div>
                  <div className="dup-text">{dup.importedQuestion}</div>
                </div>
                <div className="dup-actions">
                  {decided ? (
                    <span className="dup-decided-label">
                      {decided === "merge" ? "✅ Merged" : decided === "keep_separate" ? "✅ Kept Separate" : "⏭ Skipped"}
                    </span>
                  ) : (
                    <>
                      <button className="dup-btn merge-btn" onClick={() => handleDuplicateDecision(dup, "merge")}>
                        Merge (add {dup.importedYear} to existing)
                      </button>
                      <button className="dup-btn separate-btn" onClick={() => handleDuplicateDecision(dup, "keep_separate")}>
                        Keep Separate
                      </button>
                      <button className="dup-btn skip-btn" onClick={() => handleDuplicateDecision(dup, "skip")}>
                        Skip
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Extracted Questions Review Table ──────────── */}
      <div className="review-section">
        <div className="review-header-bar">
          <h2>Extracted Questions{hasExtractedQuestions ? ` (${extractedQuestions.length})` : ""}</h2>

          {hasExtractedQuestions && (
            <div className="year-confirm-row">
              <div className="detected-year-box">
                <label>Exam Year</label>
                <input type="number" value={detectedYear || ""} placeholder="e.g. 2025"
                  onChange={e => setDetectedYear(e.target.value ? Number(e.target.value) : null)} />
              </div>
              <button className="accept-high-btn" disabled={importing}
                onClick={handleAcceptAllHigh}>
                ✓ Accept all high-confidence
              </button>
              <button className="confirm-save-btn" disabled={importing}
                onClick={handleConfirmSave}>
                {importing ? "Saving…" : "✅ Confirm & Save"}
              </button>
            </div>
          )}
        </div>

        {!hasExtractedQuestions ? (
          <div className="empty-state">
            <h3>No questions extracted yet.</h3>
            <p>Select a subject, unit, and PDF file, then click "Start Import".</p>
          </div>
        ) : (
          <div className="review-table-container">
            <table className="review-table">
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: "center" }}>#</th>
                  <th>Question Text</th>
                  <th style={{ width: 70 }}>Marks</th>
                  <th style={{ width: 60 }}>CO</th>
                  <th style={{ width: 60 }}>Level</th>
                  <th style={{ width: 160 }}>Suggested Unit</th>
                  <th style={{ width: 160 }}>Suggested Sub-unit</th>
                  <th style={{ width: 100 }}>Confidence</th>
                  <th style={{ width: 90, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {extractedQuestions.map((q, i) => {
                  const pct = confidencePct(q);
                  const confClass = confidenceBadgeClass(q);
                  return (
                    <tr key={i}>
                      <td className="q-num-col">{q.questionNumber}</td>
                      <td>
                        <textarea className="q-text-input" rows={2} value={q.questionText}
                          onChange={e => handleQTextChange(i, e.target.value)} />
                      </td>
                      <td>
                        <input type="number" className="q-marks-input" value={q.marks}
                          placeholder="—" onChange={e => handleMarksChange(i, e.target.value)} />
                      </td>
                      <td>
                        <input type="number" className="q-marks-input" value={q.co}
                          placeholder="—" onChange={e => handleCoChange(i, e.target.value)} />
                      </td>
                      <td>
                        <input type="text" className="q-marks-input" value={q.level}
                          placeholder="—" onChange={e => handleLevelChange(i, e.target.value)} />
                      </td>
                      <td>
                        <select className="q-class-select" value={q.suggestedUnitId}
                          onChange={e => handleUnitOverride(i, e.target.value)}>
                          <option value="">{q.needsManualReview && !q.suggestedUnitId ? "Needs manual classification" : "Select Unit"}</option>
                          {units.map(u => (
                            <option key={u._id} value={u._id}>Unit {u.unitNumber} — {u.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select className="q-class-select" value={q.suggestedTopicId}
                          onChange={e => handleTopicOverride(i, e.target.value)}
                          disabled={!q.suggestedUnitId}>
                          <option value="">{q.suggestedUnitId ? "Select Sub-unit" : "Select Unit first"}</option>
                          {q.suggestedUnitId && units.find(u => u._id === q.suggestedUnitId)?.topics?.map(t => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {pct != null ? (
                          <span className={`confidence-badge ${confClass}`}>
                            {confidenceEmoji(q)} {pct}% — {q.classificationLabel}
                            <div className="conf-status">{confidenceStatusText(q)}</div>
                          </span>
                        ) : (
                          <span className="confidence-badge low">🔴 Manual classification required</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button type="button" className="remove-q-btn" onClick={() => handleRemoveQ(i)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
