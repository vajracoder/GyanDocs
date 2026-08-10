import { useState, useEffect } from "react";
import { updateSubject } from "../../services/api";
import "./AddSubjectModal.css";

export default function EditSubjectModal({
  open,
  subject,
  onClose,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    semester: "",
    name: "",
    shortName: "",
    code: "",
    slug: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open && subject) {
      setFormData({
        semester: subject.semester ?? "",
        name: subject.name ?? "",
        shortName: subject.shortName ?? "",
        code: subject.code ?? "",
        slug: subject.slug ?? "",
      });
      setErrorMsg("");
    }
  }, [open, subject]);

  if (!open || !subject) return null;

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

    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const semester = Number(formData.semester);
    const name = formData.name.trim();
    const shortName = formData.shortName.trim();
    const code = formData.code.trim();
    const slug = formData.slug.trim();

    if (!semester || !name || !shortName || !code || !slug) {
      setErrorMsg("Please fill in all required fields (Semester, Name, Short Name, Code, Slug).");
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

      const result = await updateSubject(subject._id || subject.id, payload);

      setFormData({
        semester: "",
        name: "",
        shortName: "",
        code: "",
        slug: "",
      });

      onSuccess?.(result?.data || result);
      onClose();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || "Failed to update subject";
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Edit Subject</h2>

        <form onSubmit={handleSubmit}>
          {errorMsg && <div className="modal-error-banner">{errorMsg}</div>}

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
              {loading ? "Saving..." : "Update Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}