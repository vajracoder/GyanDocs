import { useState } from "react";
import { createQuestion } from "../../services/api";
import "./AddQuestionModal.css";

export default function AddQuestionModal({
  open,
  onClose,
  unit,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    questionText: "",
    yearsInput: "",
    marks: "",
    questionType: "theory",
    answer: "",
    source: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!open || !unit) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errorMsg) setErrorMsg("");
  };

  const parseYears = (rawInput) => {
    if (!rawInput) return [];
    const parts = rawInput.split(/[\s,]+/);
    const validYears = parts
      .map((p) => Number(p.trim()))
      .filter((y) => !isNaN(y) && y > 1900 && y < 2100);

    return Array.from(new Set(validYears)).sort((a, b) => b - a);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const questionText = formData.questionText.trim();
    if (!questionText) {
      setErrorMsg("Question text is required.");
      return;
    }

    const subjectId = typeof unit.subjectId === "object" ? unit.subjectId._id : unit.subjectId;
    const unitId = unit._id || unit.id;

    if (!unitId) {
      setErrorMsg("Unit ID is missing.");
      return;
    }

    if (!subjectId) {
      setErrorMsg("Subject ID is missing on this unit.");
      return;
    }

    const years = parseYears(formData.yearsInput);
    if (years.length === 0) {
      setErrorMsg("At least one valid year (e.g. 2025, 2023) is required.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        subjectId,
        unitId,
        questionText,
        years,
        marks: formData.marks !== "" ? Number(formData.marks) : undefined,
        questionType: formData.questionType,
        answer: formData.answer ? formData.answer.trim() : "",
        source: formData.source ? formData.source.trim() : "",
      };

      await createQuestion(payload);

      // Reset form state on successful creation
      setFormData({
        questionText: "",
        yearsInput: "",
        marks: "",
        questionType: "theory",
        answer: "",
        source: "",
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || "Failed to create question";
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-question">
        <h2>Add Question</h2>
        <div className="modal-question-sub">
          Unit {unit.unitNumber}: <strong>{unit.name}</strong>
        </div>

        {errorMsg && <div className="modal-error-banner">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Question Text *</label>
            <textarea
              name="questionText"
              rows={3}
              value={formData.questionText}
              onChange={handleChange}
              placeholder="e.g. Explain normalization in DBMS with examples."
              required
            />
          </div>

          <div className="modal-grid-2">
            <div className="form-group">
              <label>Years (Comma-separated) *</label>
              <input
                type="text"
                name="yearsInput"
                value={formData.yearsInput}
                onChange={handleChange}
                placeholder="e.g. 2025, 2023, 2021"
                required
              />
              <small>Priority calculated automatically by backend based on year count</small>
            </div>

            <div className="form-group">
              <label>Marks</label>
              <input
                type="number"
                name="marks"
                value={formData.marks}
                onChange={handleChange}
                placeholder="e.g. 10"
                min={0}
              />
            </div>
          </div>

          <div className="modal-grid-2">
            <div className="form-group">
              <label>Question Type</label>
              <select
                name="questionType"
                value={formData.questionType}
                onChange={handleChange}
              >
                <option value="theory">Theory</option>
                <option value="numerical">Numerical</option>
                <option value="mcq">MCQ</option>
              </select>
            </div>

            <div className="form-group">
              <label>Source (Optional)</label>
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="e.g. Endsem 2023"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Answer / Solution (Optional)</label>
            <textarea
              name="answer"
              rows={3}
              value={formData.answer}
              onChange={handleChange}
              placeholder="Provide answer explanation or reference notes..."
            />
          </div>

          <div className="modal-buttons">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
