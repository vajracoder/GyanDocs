import { useState, useEffect } from "react";
import { updateUnit } from "../../services/api";
import "./AddUnitModal.css";

export default function EditUnitModal({
  open,
  unit,
  onClose,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    unitNumber: "",
    name: "",
    description: "",
    slug: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open && unit) {
      setFormData({
        unitNumber: unit.unitNumber ?? "",
        name: unit.name ?? "",
        description: unit.description ?? "",
        slug: unit.slug ?? "",
      });
      setErrorMsg("");
    }
  }, [open, unit]);

  if (!open || !unit) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      const generatedSlug = value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-");

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

    const unitNumber = Number(formData.unitNumber);
    const name = formData.name.trim();
    const slug = formData.slug.trim();

    if (!unitNumber || !name || !slug) {
      setErrorMsg("Please fill in all required fields (Unit Number, Name).");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        unitNumber,
        name,
        slug,
        description: formData.description.trim(),
      };

      await updateUnit(unit._id || unit.id, payload);

      setFormData({
        unitNumber: "",
        name: "",
        description: "",
        slug: "",
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || "Failed to update unit";
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Edit Unit</h2>

        <form onSubmit={handleSubmit}>
          {errorMsg && <div className="modal-error-banner">{errorMsg}</div>}

          <div className="form-group">
            <label>Unit Number *</label>
            <input
              type="number"
              name="unitNumber"
              value={formData.unitNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Unit Name *</label>
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
              disabled={loading}
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