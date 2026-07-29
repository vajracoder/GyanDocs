import { useState } from "react";
import "./Topics.css";

export default function Topics() {
  const [search, setSearch] = useState("");

  const topics = [
    {
      id: 1,
      subject: "Data Structures",
      unit: "Arrays",
      topic: "Introduction to Arrays",
    },
    {
      id: 2,
      subject: "Operating System",
      unit: "Process Management",
      topic: "CPU Scheduling",
    },
    {
      id: 3,
      subject: "DBMS",
      unit: "Normalization",
      topic: "Third Normal Form",
    },
  ];

  const filteredTopics = topics.filter((item) =>
    item.topic.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="topics-page">
      <div className="topics-header">
        <h1>Topics</h1>

        <button className="add-btn">
          + Add Topic
        </button>
      </div>

      <input
        type="text"
        className="search-box"
        placeholder="Search topics..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="topics-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Subject</th>
            <th>Unit</th>
            <th>Topic</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredTopics.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.subject}</td>
              <td>{item.unit}</td>
              <td>{item.topic}</td>

              <td>
                <button className="edit-btn">Edit</button>

                <button className="delete-btn">Delete</button>
              </td>
            </tr>
          ))}

          {filteredTopics.length === 0 && (
            <tr>
              <td colSpan="5" className="no-data">
                No topics found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}