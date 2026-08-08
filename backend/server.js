require("dotenv").config();

console.log("__dirname =", __dirname);
console.log("MONGODB_URI =", process.env.MONGODB_URI);

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
    console.error("Failed to start server:", err);
  });