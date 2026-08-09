import { useState } from "react";
import { deleteSubject, getUnits } from "../../services/api";
import UnitNode from "./UnitNode";
import AddUnitModal from "./AddUnitModal";

export default function SubjectNode({ subject, onSubjectDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
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
      <div className="subject-node">
        <div className="subject-header" onClick={toggle}>
          <div>
            <h3>{subject.shortName || subject.name}</h3>
            <small>{subject.name} • Semester {subject.semester}</small>
          </div>
          <div className="subject-header-actions">
            <button type="button" className="delete-subject-btn" onClick={requestDelete}>Delete</button>
            <span>{expanded ? "▼" : "▶"}</span>
          </div>
        </div>

        {expanded && (
          <div className="unit-list">
            {loading ? <p>Loading units...</p> : <>
              {units.length === 0 ? <p>No units yet.</p> : units.map((unit) => <UnitNode key={unit._id || unit.id} unit={unit} onUnitUpdated={loadUnits} />)}
              <button className="add-unit-btn" onClick={() => setShowUnitModal(true)}>+ Add Unit</button>
            </>}
          </div>
        )}
      </div>

      <AddUnitModal open={showUnitModal} subject={subject} onClose={() => setShowUnitModal(false)} onSuccess={loadUnits} />

      {showDeleteConfirm && (
        <div className="subject-delete-overlay" role="presentation">
          <div className="subject-delete-dialog" role="dialog" aria-modal="true" aria-labelledby={`delete-subject-${subject._id || subject.id}`}>
            <h3 id={`delete-subject-${subject._id || subject.id}`}>Delete "{subject.name}"?</h3>
            <p>This will permanently delete the subject and its associated academic data.</p>
            {deleteError && <p className="subject-delete-error" role="alert">{deleteError}</p>}
            <div className="subject-delete-actions">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</button>
              <button type="button" className="delete-subject-confirm-btn" onClick={confirmDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
