import { useState } from "react";
import "./Units.css";

export default function Units() {
  const [search, setSearch] = useState("");

  const units = [
    {
      id: 1,
      subject: "Data Structures",
      unit: "Arrays",
    },
    {
      id: 2,
      subject: "Data Structures",
      unit: "Linked List",
    },
    {
      id: 3,
      subject: "Operating System",
      unit: "Process Management",
    },
    {
      id: 4,
      subject: "DBMS",
      unit: "Normalization",
    },
  ];

  const filteredUnits = units.filter(
    (item) =>
      item.unit.toLowerCase().includes(search.toLowerCase()) ||
      item.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="units-page">
      <div className="units-header">
        <h1>Units</h1>

        <button className="add-btn">
          + Add Unit
        </button>
      </div>

      <input
        type="text"
        className="search-box"
        placeholder="Search units..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="units-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Subject</th>
            <th>Unit</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredUnits.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.subject}</td>
              <td>{item.unit}</td>

              <td>
                <button className="edit-btn">
                  Edit
                </button>

                <button className="delete-btn">
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {filteredUnits.length === 0 && (
            <tr>
              <td colSpan="4" className="no-data">
                No units found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}