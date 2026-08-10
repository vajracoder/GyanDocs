import { useState } from "react";
import QuestionList from "./QuestionList";
import AddQuestionModal from "./AddQuestionModal";
import EditUnitModal from "./EditUnitModal";

export default function UnitNode({ unit, onUnitUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    onUnitUpdated?.();
  };

  return (
    <div className="unit-node">
      <div
        className="unit-node-header"
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: "pointer", userSelect: "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{expanded ? "▼" : "▶"}</span>
          <div>
            <strong>📁 Unit {unit.unitNumber}</strong>
            <p style={{ margin: "2px 0 0 0", color: "#374151" }}>{unit.name}</p>
          </div>
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            className="edit-unit-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowEditModal(true);
            }}
          >
            Edit
          </button>
          <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            {unit.questionsCount || 0} Questions
          </span>
        </span>
      </div>

      {expanded && (
        <div className="unit-node-content" style={{ marginTop: "12px" }}>
          <QuestionList
            key={refreshKey}
            unit={unit}
            onQuestionChanged={onUnitUpdated}
          />

          <button
            className="add-question-btn"
            style={{
              marginTop: "12px",
              padding: "8px 14px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
            onClick={() => setShowAddModal(true)}
          >
            + Add Question
          </button>
        </div>
      )}

      <AddQuestionModal
        open={showAddModal}
        unit={unit}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
      />

      <EditUnitModal
        open={showEditModal}
        unit={unit}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
