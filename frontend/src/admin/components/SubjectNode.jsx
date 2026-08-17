import { useState } from "react";
import { deleteSubject, getUnits } from "../../services/api";
import UnitNode from "./UnitNode";
import AddUnitModal from "./AddUnitModal";
import EditSubjectModal from "./EditSubjectModal";

const IconChevronRight = () => (
  <svg className="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export default function SubjectNode({ subject, onSubjectDeleted, onSubjectUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function loadUnits() {
    try {
      setLoading(true);
      const response = await getUnits(subject._id || subject.id);
      setUnits(response.data || []);
    } catch (err) {
      console.error("Error loading units:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    if (!expanded && units.length === 0) await loadUnits();
    setExpanded(!expanded);
  }

  function requestDelete(event) {
    event.stopPropagation();
    setDeleteError("");
    setShowDeleteConfirm(true);
  }

  async function confirmDelete() {
    try {
      setDeleting(true);
      setDeleteError("");
      await deleteSubject(subject._id || subject.id);
      setShowDeleteConfirm(false);
      await onSubjectDeleted?.(subject.name);
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || "Unable to delete this subject. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className={`subject-node${expanded ? " subject-node--expanded" : ""}`}>
        <div className="subject-header" onClick={toggle}>
          <div className="subject-header-left">
            <span className={`chevron-wrap${expanded ? " chevron-wrap--open" : ""}`} aria-hidden="true">
              <IconChevronRight />
            </span>
            <div className="subject-info">
              <h3 className="subject-short-name">{subject.shortName || subject.name}</h3>
              <small className="subject-meta">{subject.name} &bull; Semester {subject.semester}</small>
            </div>
          </div>

          <div className="subject-header-actions" onClick={(e) => e.stopPropagation()}>
            <span className="subject-unit-count">{units.length > 0 ? `${units.length} Unit${units.length !== 1 ? "s" : ""}` : ""}</span>
            <button
              type="button"
              className="edit-subject-btn"
              onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
              aria-label={`Edit ${subject.name}`}
            >
              Edit
            </button>
            <button
              type="button"
              className="delete-subject-btn"
              onClick={requestDelete}
              aria-label={`Delete ${subject.name}`}
            >
              Delete
            </button>
          </div>
        </div>

        {expanded && (
          <div className="unit-list">
            {loading ? (
              <p className="unit-loading">Loading units…</p>
            ) : (
              <>
                {units.length === 0 ? (
                  <p className="unit-empty">No units added yet.</p>
                ) : (
                  units.map((unit) => (
                    <UnitNode key={unit._id || unit.id} unit={unit} onUnitUpdated={loadUnits} />
                  ))
                )}
                <button className="add-unit-btn" onClick={() => setShowUnitModal(true)}>
                  <IconPlus /> Add Unit
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <AddUnitModal open={showUnitModal} subject={subject} onClose={() => setShowUnitModal(false)} onSuccess={loadUnits} />

      <EditSubjectModal
        open={showEditModal}
        subject={subject}
        onClose={() => setShowEditModal(false)}
        onSuccess={(updatedSubject) => {
          const name = updatedSubject?.name || subject.name;
          onSubjectUpdated?.(name);
        }}
      />

      {showDeleteConfirm && (
        <div className="subject-delete-overlay" role="presentation">
          <div className="subject-delete-dialog" role="dialog" aria-modal="true" aria-labelledby={`delete-subject-${subject._id || subject.id}`}>
            <h3 id={`delete-subject-${subject._id || subject.id}`}>Delete "{subject.name}"?</h3>
            <p>This will permanently delete the subject and its associated academic data.</p>
            {deleteError && <p className="subject-delete-error" role="alert">{deleteError}</p>}
            <div className="subject-delete-actions">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</button>
              <button type="button" className="delete-subject-confirm-btn" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
