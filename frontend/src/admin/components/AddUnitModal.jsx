import { useState } from "react";
import { createUnit } from "../../services/api";
import "./AddUnitModal.css";

export default function AddUnitModal({
  open,
  onClose,
  subject,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    unitNumber: "",
    name: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  if (!open || !subject) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const slug = formData.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-");

      await createUnit({
        subjectId: subject._id || subject.id,
        unitNumber: Number(formData.unitNumber),
        name: formData.name,
        slug,
        description: formData.description,
      });

      setFormData({
        unitNumber: "",
        name: "",
        description: "",
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to create unit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add Unit</h2>

        <p>
          Subject: <strong>{subject.shortName || subject.name}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Unit Number</label>
            <input
              type="number"
              name="unitNumber"
              value={formData.unitNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Unit Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Normalization"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
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
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Unit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
