// Quick module-load smoke test
try {
  require("./services/classifier");
  console.log("classifier OK");
} catch (e) {
  console.error("classifier FAIL:", e.message);
  process.exit(1);
}

try {
  require("./controllers/pdfController");
  console.log("pdfController OK");
} catch (e) {
  console.error("pdfController FAIL:", e.message);
  process.exit(1);
}

try {
  require("./controllers/questionController");
  console.log("questionController OK");
} catch (e) {
  console.error("questionController FAIL:", e.message);
  process.exit(1);
}

try {
  require("./controllers/searchController");
  console.log("searchController OK");
} catch (e) {
  console.error("searchController FAIL:", e.message);
  process.exit(1);
}

try {
  require("./controllers/topicController");
  console.log("topicController OK");
} catch (e) {
  console.error("topicController FAIL:", e.message);
  process.exit(1);
}

try {
  require("./controllers/unitController");
  console.log("unitController OK");
} catch (e) {
  console.error("unitController FAIL:", e.message);
  process.exit(1);
}

try {
  require("./models/Question");
  console.log("Question model OK");
} catch (e) {
  console.error("Question model FAIL:", e.message);
  process.exit(1);
}

console.log("\n--- ALL BACKEND MODULES LOAD SUCCESSFULLY ---");