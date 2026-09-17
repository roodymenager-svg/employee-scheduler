const crypto = require("node:crypto");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore} = require("firebase-admin/firestore");

initializeApp();

const ADMIN_EMAILS = defineSecret("ADMIN_EMAILS");
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

exports.createTeamLeaderAccount = onCall(
  {
    region: "northamerica-northeast1",
    secrets: [ADMIN_EMAILS],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Vous devez être connecté.");
    }

    const callerEmail = normalizeEmail(request.auth.token.email);
    const allowedEmails = ADMIN_EMAILS.value()
      .split(",")
      .map(normalizeEmail)
      .filter(Boolean);
    const isAdmin = request.auth.token.admin === true || allowedEmails.includes(callerEmail);
    if (!isAdmin) {
      throw new HttpsError("permission-denied", "Accès réservé aux administrateurs.");
    }

    const email = normalizeEmail(request.data?.email);
    const displayName = String(request.data?.displayName || "").trim().replace(/\s+/g, " ");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpsError("invalid-argument", "Adresse courriel invalide.");
    }
    if (!displayName || displayName.length > 120) {
      throw new HttpsError("invalid-argument", "Nom d’employé invalide.");
    }

    const shared = await getFirestore().doc("schedulerData/shared").get();
    const employees = shared.data()?.state?.employees || [];
    const employee = employees.find((item) =>
      normalizeEmail(item?.email) === email &&
      String(item?.name || "").trim().toLocaleLowerCase("fr-CA") === displayName.toLocaleLowerCase("fr-CA")
    );
    if (!employee) {
      throw new HttpsError(
        "failed-precondition",
        "Le nom et le courriel doivent correspondre à une fiche du répertoire des employés."
      );
    }

    const auth = getAuth();
    let userRecord;
    let created = false;
    try {
      userRecord = await auth.getUserByEmail(email);
      userRecord = await auth.updateUser(userRecord.uid, {displayName, disabled: false});
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
      userRecord = await auth.createUser({
        email,
        displayName,
        emailVerified: false,
        disabled: false,
        password: crypto.randomBytes(32).toString("base64url"),
      });
      created = true;
    }

    await auth.setCustomUserClaims(userRecord.uid, {
      ...(userRecord.customClaims || {}),
      role: "teamLeader",
      teamLeader: true,
      employeeEmail: email,
    });

    if (allowedEmails.includes(callerEmail) && request.auth.token.admin !== true) {
      const caller = await auth.getUser(request.auth.uid);
      await auth.setCustomUserClaims(caller.uid, {
        ...(caller.customClaims || {}),
        admin: true,
      });
    }

    return {email, displayName, uid: userRecord.uid, created};
  }
);
