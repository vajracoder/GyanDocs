/**
 * Server-side script to grant the admin custom claim to a Firebase user.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@example.com node scripts/setAdminClaim.js
 *
 * This script must be run by someone with access to the Firebase service
 * account credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
 * FIREBASE_PRIVATE_KEY). It does NOT grant admin to every user.
 */
require("dotenv").config();
const admin = require("../config/firebaseAdmin");

async function setAdminClaim() {
  const email = process.env.ADMIN_EMAIL;

  if (!email) {
    console.error("Missing ADMIN_EMAIL environment variable.");
    console.error("Usage: ADMIN_EMAIL=admin@example.com node scripts/setAdminClaim.js");
    process.exit(1);
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Admin claim granted to: ${email}`);
  } catch (error) {
    console.error("Failed to set admin claim:", error.code || error.message);
    process.exit(1);
  }
}

setAdminClaim();