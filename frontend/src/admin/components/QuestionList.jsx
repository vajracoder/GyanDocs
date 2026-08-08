import { useEffect, useState, useMemo } from "react";
import { getQuestionsByUnit, deleteQuestion } from "../../services/api";
import EditQuestionModal from "./EditQuestionModal";
import "./QuestionList.css";

export default function QuestionList({ unit, onQuestionChanged }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");

  // Edit Modal
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const unitId = unit?._id || unit?.id;

  const fetchQuestions = async () => {
    if (!unitId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getQuestionsByUnit(unitId);
      setQuestions(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [unitId]);

  const handleEditClick = (q) => {
    setEditingQuestion(q);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (q) => {
    const qId = q._id || q.id;
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      await deleteQuestion(qId);
      // Remove deleted question from state
      setQuestions((prev) => prev.filter((item) => (item._id || item.id) !== qId));
      onQuestionChanged?.();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to delete question");
    }
  };

  const handleEditSuccess = () => {
    fetchQuestions();
    onQuestionChanged?.();
  };

  // Dynamic list of unique available years across all questions in unit
  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    questions.forEach((q) => {
      if (Array.isArray(q.years)) {
        q.years.forEach((y) => yearsSet.add(y));
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [questions]);

  // Filter & Sort questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Priority filter
      if (priorityFilter !== "all" && Number(priorityFilter) !== (q.priority || 0)) {
        return false;
      }
      // Year filter
      if (yearFilter !== "all" && (!Array.isArray(q.years) || !q.years.includes(Number(yearFilter)))) {
        return false;
      }
      // Type filter
      if (typeFilter !== "all" && q.questionType?.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }
      // Search filter
      if (searchFilter.trim() !== "") {
        const text = (q.questionText || q.question || "").toLowerCase();
        if (!text.includes(searchFilter.trim().toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [questions, priorityFilter, yearFilter, typeFilter, searchFilter]);

  // Sorted questions:
  // 1. priority descending
  // 2. frequency descending (years.length)
  // 3. newest year descending
  const sortedQuestions = useMemo(() => {
    return [...filteredQuestions].sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      if (priorityB !== priorityA) return priorityB - priorityA;

      const freqA = Array.isArray(a.years) ? a.years.length : a.frequency || 0;
      const freqB = Array.isArray(b.years) ? b.years.length : b.frequency || 0;
      if (freqB !== freqA) return freqB - freqA;

      const maxYearA = Array.isArray(a.years) && a.years.length > 0 ? Math.max(...a.years) : 0;
      const maxYearB = Array.isArray(b.years) && b.years.length > 0 ? Math.max(...b.years) : 0;
      return maxYearB - maxYearA;
    });
  }, [filteredQuestions]);

  const renderStars = (priority) => {
    const starCount = Math.min(Math.max(priority || 1, 1), 5);
    return "★".repeat(starCount) + "☆".repeat(5 - starCount);
  };

  const formatYears = (years) => {
    if (!years || !Array.isArray(years) || years.length === 0) {
      return "None";
    }
    return years.join(" • ");
  };

  if (loading) {
    return <div className="question-list-loading">Loading questions...</div>;
  }

  if (error) {
    return <div className="question-list-error">{error}</div>;
  }

  return (
    <div className="question-list-wrapper">
      {/* Filter & Search Bar */}
      {questions.length > 0 && (
        <div className="question-filter-bar">
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              className="filter-search-input"
              placeholder="Search question text..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Priority:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="5">5 ★★★★★</option>
              <option value="4">4 ★★★★☆</option>
              <option value="3">3 ★★★☆☆</option>
              <option value="2">2 ★★☆☆☆</option>
              <option value="1">1 ★☆☆☆☆</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Year:</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="all">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="theory">Theory</option>
              <option value="numerical">Numerical</option>
              <option value="mcq">MCQ</option>
            </select>
          </div>
        </div>
      )}

      {/* Questions List */}
      {sortedQuestions.length === 0 ? (
        <div className="question-list-empty">
          {questions.length === 0
            ? "No questions found for this unit."
            : "No questions match the selected filters."}
        </div>
      ) : (
        sortedQuestions.map((q) => {
          const yearsCount = Array.isArray(q.years) ? q.years.length : q.frequency || 0;
          const qType = q.questionType
            ? q.questionType.charAt(0).toUpperCase() + q.questionType.slice(1)
            : "Theory";

          return (
            <div key={q._id || q.id} className="question-card">
              <div className="question-card-header">
                <div className="question-priority-stars">
                  {renderStars(q.priority)}
                </div>
                <span className="question-type-badge">{qType}</span>
              </div>

              <div className="question-text">
                {q.questionText || q.question}
              </div>

              <div className="question-meta-row">
                <div className="question-meta-left">
                  <div className="question-meta-item">
                    <strong>Years:</strong> {formatYears(q.years)}
                  </div>
                  <div className="question-meta-item">
                    <strong>Frequency:</strong> {yearsCount} {yearsCount === 1 ? "time" : "times"}
                  </div>
                  <div className="question-meta-item">
                    <strong>Marks:</strong> {q.marks !== undefined && q.marks !== null ? q.marks : "N/A"}
                  </div>
                </div>

                <div className="question-actions">
                  <button
                    className="edit-btn-sm"
                    onClick={() => handleEditClick(q)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn-sm"
                    onClick={() => handleDeleteClick(q)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Edit Question Modal */}
      <EditQuestionModal
        open={showEditModal}
        question={editingQuestion}
        unit={unit}
        onClose={() => {
          setShowEditModal(false);
          setEditingQuestion(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
