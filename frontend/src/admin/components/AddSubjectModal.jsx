import { useState } from "react";
import "./AddSubjectModal.css";

export default function AddSubjectModal({ open, onClose }) {
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log({
      subjectName,
      subjectCode,
    });

    setSubjectName("");
    setSubjectCode("");

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add Subject</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subject Name</label>

            <input
              type="text"
              placeholder="Enter Subject Name"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Subject Code</label>

            <input
              type="text"
              placeholder="Enter Subject Code"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              required
            />
          </div>

          <div className="modal-buttons">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
            >
              Save Subject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}