import "./Dashboard.css";

export default function Dashboard() {
  const cards = [
    {
      title: "Subjects",
      value: "0",
    },
    {
      title: "Units",
      value: "0",
    },
    {
      title: "Topics",
      value: "0",
    },
    {
      title: "Questions",
      value: "0",
    },
  ];

  return (
    <div>
      <h1>Dashboard</h1>

      <p>Welcome to GyanDoc Admin Panel</p>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <div className="dashboard-card" key={card.title}>
            <h2>{card.value}</h2>
            <p>{card.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}