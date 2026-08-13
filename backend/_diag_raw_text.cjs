/**
 * TEMPORARY DIAGNOSTIC SCRIPT — will be deleted after diagnosis.
 * Replicates the EXACT production flow in pdfController.js:
 *   PDFParse.getText()  →  print RAW text (BEFORE parsePdfText)
 *   parsePdfText(text)  →  print extracted questions
 *
 * Usage: node _diag_raw_text.cjs <path-to-pdf>
 */
const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const { parsePdfText } = require("./utils/questionParser");

(async () => {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error("Usage: node _diag_raw_text.cjs <path-to-pdf>");
    process.exit(1);
  }
  if (!fs.existsSync(pdfPath)) {
    console.error("File not found:", pdfPath);
    process.exit(1);
  }

  const dataBuffer = fs.readFileSync(pdfPath);

  // ── EXACT same extraction as pdfController.js lines 59-61 ──
  const parser = new PDFParse({ data: dataBuffer });
  await parser.load();
  const result = await parser.getText();
  const text = result.text || "";

  console.log("══════════════════════════════════════════════════");
  console.log("RAW TEXT FROM pdf-parse getText() — BEFORE parsePdfText()");
  console.log("══════════════════════════════════════════════════");
  console.log("Total pages:", result.total);
  console.log("Raw text length:", text.length);
  console.log("──────────────────────────────────────────────────");
  console.log("RAW TEXT WITH LINE NUMBERS:");
  console.log("──────────────────────────────────────────────────");
  const lines = text.split(/\r?\n/);
  lines.forEach((l, i) => {
    console.log(String(i + 1).padStart(4) + " | " + l);
  });

  console.log("\n══════════════════════════════════════════════════");
  console.log("PARSER OUTPUT (parsePdfText)");
  console.log("══════════════════════════════════════════════════");
  const out = parsePdfText(text);
  console.log("detectedYear:", out.detectedYear);
  console.log("question count:", out.questions.length);
  out.questions.forEach((q, i) => {
    console.log(
      `[${i + 1}] #${q.questionNumber} marks=${q.marks} co=${q.co} level=${q.level} conf=${q.confidence}`
    );
    console.log(`    text: ${JSON.stringify(q.questionText)}`);
  });
})();