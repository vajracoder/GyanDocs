import { useState } from "react";
import "./Subjects.css";
import AddSubjectModal from "../components/AddSubjectModal";

export default function Subjects() {
  const [subjects] = useState([
    {
      id: 1,
      name: "Data Structures",
      code: "CS201",
    },
    {
      id: 2,
      name: "Operating System",
      code: "CS301",
    },
  ]);

  const [openModal, setOpenModal] = useState(false);

  return (
    <div className="subjects-page">
      {/* Header */}
      <div className="subjects-header">
        <div>
          <h1>Subjects</h1>
          <p>Manage all subjects of GyanDoc</p>
        </div>

        <button
          className="add-btn"
          onClick={() => setOpenModal(true)}
        >
          + Add Subject
        </button>
      </div>

      {/* Search */}
      <input
        className="search-box"
        placeholder="Search Subject..."
      />

      {/* Table */}
      <table className="subjects-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Subject Name</th>
            <th>Code</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {subjects.map((subject, index) => (
            <tr key={subject.id}>
              <td>{index + 1}</td>
              <td>{subject.name}</td>
              <td>{subject.code}</td>

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
        </tbody>
      </table>

      {/* Add Subject Modal */}
      <AddSubjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </div>
  );
}