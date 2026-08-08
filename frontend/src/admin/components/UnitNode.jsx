import QuestionList from "./QuestionList";

export default function UnitNode({ unit }) {
  return (
    <div className="unit-node">
      <div className="unit-node-header">
        <div>
          <strong>📁 Unit {unit.unitNumber}</strong>
          <p style={{ margin: "4px 0 0 0", color: "#374151" }}>{unit.name}</p>
        </div>
        <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          {unit.questionsCount || 0} Questions
        </span>
      </div>
      <QuestionList unit={unit} />
    </div>
  );
}
