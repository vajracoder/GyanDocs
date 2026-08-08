import { useState } from "react";
import { getUnits } from "../../services/api";
import UnitNode from "./UnitNode";
import AddUnitModal from "./AddUnitModal";

export default function SubjectNode({ subject }) {
  const [expanded, setExpanded] = useState(false);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  async function loadUnits() {
    try {
      setLoading(true);
      const res = await getUnits(subject._id || subject.id);
      setUnits(res.data || []);
    } catch (err) {
      console.error("Error loading units:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    if (!expanded && units.length === 0) {
      await loadUnits();
    }
    setExpanded(!expanded);
  }

  return (
    <>
      <div className="subject-node">
        <div className="subject-header" onClick={toggle}>
          <div>
            <h3>{subject.shortName || subject.name}</h3>
            <small>
              {subject.name} • Semester {subject.semester}
            </small>
          </div>
          <span>{expanded ? "▼" : "▶"}</span>
        </div>

        {expanded && (
          <div className="unit-list">
            {loading ? (
              <p>Loading units...</p>
            ) : (
              <>
                {units.length === 0 ? (
                  <p>No units yet.</p>
                ) : (
                  units.map((unit) => (
                    <UnitNode key={unit._id || unit.id} unit={unit} />
                  ))
                )}

                <button
                  className="add-unit-btn"
                  onClick={() => setShowUnitModal(true)}
                >
                  + Add Unit
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <AddUnitModal
        open={showUnitModal}
        subject={subject}
        onClose={() => setShowUnitModal(false)}
        onSuccess={loadUnits}
      />
    </>
  );
}
