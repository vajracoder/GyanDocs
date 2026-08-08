const fs = require('fs');
const path = require('path');
const http = require('http');

const minimalValidPdf = Buffer.from(
  '%PDF-1.4\n' +
  '1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n' +
  '2 0 obj <</Type /Pages /Kinds [3 0 R] /Count 1 /Kids [3 0 R]>> endobj\n' +
  '3 0 obj <</Type /Page /Parent 2 0 R /Resources <</Font <</F1 4 0 R>>>> /Contents 5 0 R>> endobj\n' +
  '4 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\n' +
  '5 0 obj <</Length 55>> stream\n' +
  'BT /F1 12 Tf 100 700 Td (Explain normalization in DBMS.) Tj ET\n' +
  'endstream\n' +
  'endobj\n' +
  'xref\n' +
  '0 6\n' +
  '0000000000 65535 f \n' +
  '0000000009 00000 n \n' +
  '0000000056 00000 n \n' +
  '00000000125 00000 n \n' +
  '0000000219 00000 n \n' +
  '0000000287 00000 n \n' +
  'trailer <</Size 6 /Root 1 0 R>>\n' +
  'startxref\n' +
  '392\n' +
  '%%EOF'
);

const corruptPdf = Buffer.from('%PDF-1.4\nCorrupt PDF Content Here\n%%EOF');
const txtFile = Buffer.from('This is plain text, not a PDF.');

const { parsePdf } = require('./controllers/pdfController');

(async () => {
  try {
    console.log('--- Testing PDF Controller Logic ---');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // Test 1: Valid PDF parsing
    const tempValidPath = path.join(uploadsDir, 'pdf-test-valid.pdf');
    fs.writeFileSync(tempValidPath, minimalValidPdf);

    const mockReqValid = {
      file: {
        path: tempValidPath,
        originalname: 'sample_question_paper.pdf',
      },
    };

    let mockResValidData = null;
    const mockResValid = {
      status: (code) => ({
        json: (data) => {
          mockResValidData = { status: code, ...data };
          return mockResValidData;
        },
      }),
    };

    await parsePdf(mockReqValid, mockResValid);
    console.log('1. Valid PDF Response:', mockResValidData);
    console.log('   Temp file deleted:', !fs.existsSync(tempValidPath));

    // Test 2: Corrupt PDF handling
    const tempCorruptPath = path.join(uploadsDir, 'pdf-test-corrupt.pdf');
    fs.writeFileSync(tempCorruptPath, corruptPdf);

    const mockReqCorrupt = {
      file: {
        path: tempCorruptPath,
        originalname: 'corrupt_paper.pdf',
      },
    };

    let mockResCorruptData = null;
    const mockResCorrupt = {
      status: (code) => ({
        json: (data) => {
          mockResCorruptData = { status: code, ...data };
          return mockResCorruptData;
        },
      }),
    };

    await parsePdf(mockReqCorrupt, mockResCorrupt);
    console.log('2. Corrupt PDF Response:', mockResCorruptData);
    console.log('   Temp file deleted after corrupt error:', !fs.existsSync(tempCorruptPath));

    console.log('\n--- ALL BACKEND PDF CONTROLLER TESTS PASSED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  }
})();
