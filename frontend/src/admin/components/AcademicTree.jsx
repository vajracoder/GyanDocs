import SubjectNode from "./SubjectNode";
import "./AcademicTree.css";

export default function AcademicTree({ subjects, onSubjectDeleted, onSubjectUpdated }) {
  if (!subjects || subjects.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Subjects Yet</h3>
        <p>Create your first subject to get started.</p>
      </div>
    );
  }

  return (
    <div className="academic-tree">
      {subjects.map((subject) => (
        <SubjectNode key={subject._id || subject.id} subject={subject} onSubjectDeleted={onSubjectDeleted} onSubjectUpdated={onSubjectUpdated} />
      ))}
    </div>
  );
}
