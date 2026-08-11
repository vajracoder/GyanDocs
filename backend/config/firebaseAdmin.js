const admin = require("firebase-admin");

// Initialize Firebase Admin SDK using environment variables.
// Credentials are provided via FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
// and FIREBASE_PRIVATE_KEY (the private key with literal \n newlines).
if (!admin.apps || admin.apps.length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "Firebase Admin SDK not initialized: missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY environment variables."
    );
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }
}

module.exports = admin;