import { useState } from "react";
import { createSubject } from "../../services/api";
import "./AddSubjectModal.css";

export default function AddSubjectModal({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    semester: "",
    name: "",
    code: "",
    slug: "",
  });

  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "name") {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-");

      setFormData({
        ...formData,
        name: value,
        slug,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createSubject(formData);

      setFormData({
        semester: "",
        name: "",
        code: "",
        slug: "",
      });

      onSuccess?.();
      onClose();

    } catch (err) {
      alert(err.response?.data?.message || "Failed to create subject");
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
            <label>Semester</label>

            <select
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              required
            >
              <option value="">Select Semester</option>

              {[1,2,3,4,5,6,7,8].map((sem)=>(
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subject Name</label>

            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Database Management System"
              required
            />
          </div>

          <div className="form-group">
            <label>Subject Code</label>

            <input
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="KCS501"
              required
            />
          </div>

          <div className="form-group">
            <label>Slug</label>

            <input
              name="slug"
              value={formData.slug}
              readOnly
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