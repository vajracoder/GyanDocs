import { useEffect, useState } from "react";
import "./Dashboard.css";

import { getSubjects } from "../../services/api";

import AddSubjectModal from "../components/AddSubjectModal";
import AcademicTree from "../components/AcademicTree";

export default function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadSubjects = async () => {
    try {
      setLoading(true);

      const res = await getSubjects();

      setSubjects(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const stats = [
    {
      title: "Subjects",
      value: subjects.length,
    },
    {
      title: "Units",
      value: 0,
    },
    {
      title: "Questions",
      value: 0,
    },
    {
      title: "PDFs Imported",
      value: 0,
    },
  ];

  return (
    <div className="dashboard">
      <h1>GyanDocs Admin</h1>

      <p>Manage your academic structure and question bank.</p>

      {/* Statistics */}
      <div className="dashboard-grid">
        {stats.map((item) => (
          <div className="dashboard-card" key={item.title}>
            <h2>{item.value}</h2>
            <p>{item.title}</p>
          </div>
        ))}
      </div>

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
          <AcademicTree subjects={subjects} />
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