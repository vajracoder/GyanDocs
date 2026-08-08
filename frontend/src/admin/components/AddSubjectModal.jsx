import { useState } from "react";
import { createSubject } from "../../services/api";
import "./AddSubjectModal.css";

export default function AddSubjectModal({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    semester: "",
    name: "",
    shortName: "",
    code: "",
    slug: "",
  });

  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      const generatedSlug = value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: generatedSlug,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const semester = Number(formData.semester);
    const name = formData.name.trim();
    const shortName = formData.shortName.trim();
    const code = formData.code.trim();
    const slug = formData.slug.trim();

    if (!semester || !name || !shortName || !code || !slug) {
      alert("Please fill in all required fields (Semester, Name, Short Name, Code, Slug).");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        semester,
        name,
        shortName,
        code,
        slug,
      };

      await createSubject(payload);

      setFormData({
        semester: "",
        name: "",
        shortName: "",
        code: "",
        slug: "",
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || "Failed to create subject";
      alert(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add Subject</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Semester *</label>

            <select
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              required
            >
              <option value="">Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subject Name *</label>

            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Database Management System"
              required
            />
          </div>

          <div className="form-group">
            <label>Short Name *</label>

            <input
              name="shortName"
              value={formData.shortName}
              onChange={handleChange}
              placeholder="DBMS"
              required
            />
          </div>

          <div className="form-group">
            <label>Subject Code *</label>

            <input
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="BCS501"
              required
            />
          </div>

          <div className="form-group">
            <label>Slug *</label>

            <input
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="database-management-system"
              required
            />
          </div>

          <div className="modal-buttons">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}