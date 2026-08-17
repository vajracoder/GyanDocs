import { useState } from "react";
import QuestionList from "./QuestionList";
import AddQuestionModal from "./AddQuestionModal";
import EditUnitModal from "./EditUnitModal";

const IconChevronRight = () => (
  <svg className="chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const IconFolder = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

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
        <div className="unit-header-left">
          <span className={`chevron-wrap${expanded ? " chevron-wrap--open" : ""}`} aria-hidden="true">
            <IconChevronRight />
          </span>
          <span className="unit-folder-icon" aria-hidden="true">
            <IconFolder />
          </span>
          <div className="unit-info">
            <strong className="unit-number">Unit {unit.unitNumber}</strong>
            <span className="unit-name">{unit.name}</span>
          </div>
        </div>

        <div className="unit-header-right" onClick={(e) => e.stopPropagation()}>
          <span className="unit-question-count">
            {unit.questionsCount || 0} Q
          </span>
          <button
            type="button"
            className="edit-unit-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowEditModal(true);
            }}
            aria-label={`Edit unit ${unit.unitNumber}`}
          >
            Edit
          </button>
        </div>
      </div>

      {expanded && (
        <div className="unit-node-content">
          <QuestionList
            key={refreshKey}
            unit={unit}
            onQuestionChanged={onUnitUpdated}
          />
          <button
            className="add-question-btn"
            onClick={() => setShowAddModal(true)}
          >
            <IconPlus /> Add Question
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
