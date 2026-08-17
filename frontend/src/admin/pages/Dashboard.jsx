import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

import { getSubjects } from "../../services/api";

import AddSubjectModal from "../components/AddSubjectModal";
import AcademicTree from "../components/AcademicTree";

/* ── Stat card icons ── */
const IconSubjects = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const IconUnits = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconQuestions = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconPdf = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconUpload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

export default function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();

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

  const stats = [
    {
      title: "Subjects",
      value: subjects.length,
      icon: <IconSubjects />,
      color: "blue",
      empty: "No subjects yet",
    },
    {
      title: "Units",
      value: 0,
      icon: <IconUnits />,
      color: "violet",
      empty: "No units added yet",
    },
    {
      title: "Questions",
      value: 0,
      icon: <IconQuestions />,
      color: "amber",
      empty: "No questions yet",
    },
    {
      title: "PDFs Imported",
      value: 0,
      icon: <IconPdf />,
      color: "green",
      empty: "No PDFs imported yet",
    },
  ];

  return (
    <div className="dashboard">
      {/* ── Page Header ── */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Manage your academic content, subjects, units and question bank.
          </p>
        </div>
        <div className="system-status">
          <span className="status-dot" aria-hidden="true" />
          System operational
        </div>
      </div>

      {notice && (
        <p className="dashboard-notice" role="status">{notice}</p>
      )}

      {/* ── Statistics ── */}
      <div className="dashboard-grid">
        {stats.map((item) => (
          <div className={`dashboard-card stat-card stat-card--${item.color}`} key={item.title}>
            <div className="stat-icon-wrap">{item.icon}</div>
            <div className="stat-value">{item.value}</div>
            <div className="stat-label">{item.title}</div>
            {item.value === 0 && (
              <div className="stat-empty">{item.empty}</div>
            )}
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="quick-actions-section">
        <h2 className="section-heading">Quick Actions</h2>
        <div className="quick-actions">
          <button
            className="quick-action-btn quick-action-btn--primary"
            onClick={() => setShowModal(true)}
            id="qa-add-subject"
          >
            <IconPlus /> Add Subject
          </button>
          <button
            className="quick-action-btn quick-action-btn--secondary"
            onClick={() => navigate("/admin/pdf-import")}
            id="qa-import-pdf"
          >
            <IconUpload /> Import PDF
          </button>
          <button
            className="quick-action-btn quick-action-btn--secondary"
            onClick={() => navigate("/admin/academic-manager")}
            id="qa-academic-manager"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Academic Manager
          </button>
        </div>
      </div>

      {/* ── Academic Structure ── */}
      <div className="academic-manager">
        <div className="academic-header">
          <div>
            <h2 className="section-heading" style={{ marginBottom: 2 }}>Academic Structure</h2>
            <p className="section-subheading">
              {subjects.length} subject{subjects.length !== 1 ? "s" : ""} configured
            </p>
          </div>
          <button
            className="primary-btn"
            onClick={() => setShowModal(true)}
            id="add-subject-btn"
          >
            <IconPlus /> Add Subject
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" aria-label="Loading subjects" />
            <span>Loading subjects…</span>
          </div>
        ) : subjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <IconSubjects />
            </div>
            <h3>No Subjects Yet</h3>
            <p>Start by creating your first subject using the button above.</p>
          </div>
        ) : (
          <AcademicTree
            subjects={subjects}
            onSubjectDeleted={handleSubjectDeleted}
            onSubjectUpdated={handleSubjectUpdated}
          />
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
