require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 GyanDoc server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    // Log a safe startup error without exposing credentials or the URI.
    console.error("Failed to start server:", err.message);
  });