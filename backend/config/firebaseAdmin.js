// Firebase Admin SDK v14+ modular API.
// v14 removed the legacy namespace pattern (admin.credential.cert, admin.auth)
// and requires these modular exports.
const { initializeApp, cert, getApps, getApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// ────────────────────────────────────────────────────────────
// Credentials are provided via FIREBASE_PROJECT_ID,
// FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (with literal
// \n newlines in the key). No credentials are hardcoded.
// ────────────────────────────────────────────────────────────
let firebaseApp = null;

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "Firebase Admin SDK not initialized: missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY environment variables."
    );
  } else {
    firebaseApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }
} else {
  firebaseApp = getApp();
}

// Export a compatible object so existing consumers such as
// authMiddleware.js can continue calling admin.auth().verifyIdToken().
// If Firebase is not initialized, auth() returns undefined and callers
// fail closed (authMiddleware returns 401).
module.exports = {
  initializeApp,
  cert,
  getApps,
  get app() {
    return firebaseApp;
  },
  auth() {
    if (!firebaseApp) return undefined;
    return getAuth(firebaseApp);
  },
};