import { useEffect, useState } from "react";
import "./Dashboard.css";

import { getSubjects } from "../../services/api";

import AddSubjectModal from "../components/AddSubjectModal";
import AcademicTree from "../components/AcademicTree";

export default function AcademicManager() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState("");

  const loadSubjects = async () => {
    try {
      setLoading(true);

      const subjects = await getSubjects();

      setSubjects(subjects || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectDeleted = async (subjectName) => {
    await loadSubjects();
    setNotice(`${subjectName} was deleted successfully.`);
  };

  const handleSubjectUpdated = async (subjectName) => {
    await loadSubjects();
    setNotice(`${subjectName} was updated successfully.`);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  return (
    <div className="dashboard">
      <h1>Academic Manager</h1>

      <p>Manage your academic structure and question bank.</p>
      {notice && <p className="dashboard-notice" role="status">{notice}</p>}

      {/* Academic Manager */}
      <div className="academic-manager">
        <div className="academic-header">
          <h2>Academic Structure</h2>

          <button
            className="primary-btn"
            onClick={() => setShowModal(true)}
          >
            + Add Subject
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : subjects.length === 0 ? (
          <div className="empty-state">
            <h3>No Subjects Yet</h3>
            <p>Start by creating your first subject.</p>
          </div>
        ) : (
          <AcademicTree subjects={subjects} onSubjectDeleted={handleSubjectDeleted} onSubjectUpdated={handleSubjectUpdated} />
        )}
      </div>

      <AddSubjectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadSubjects}
      />
    </div>
  );
}