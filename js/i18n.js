window.I18N = {
    fr: {
        welcomeBack: "Bienvenue",
        loginDescription: "Connectez-vous ou créez un compte pour utiliser le planificateur des employés.",
        email: "Courriel",
        password: "Mot de passe",
        login: "Connexion",
        or: "ou",
        createAccount: "Créer un compte",
        importFailed: "Échec de l'importation :"
    },

    en: {
        welcomeBack: "Welcome back",
        loginDescription: "Please sign in or create an account to use the employee scheduler.",
        email: "Email",
        password: "Password",
        login: "Login",
        or: "or",
        createAccount: "Create account",
        importFailed: "Import failed:"
    }
};

window.currentLanguage = "fr";

window.t = function(key) {
    return window.I18N[window.currentLanguage][key] ?? key;
};

window.translatePage = function () {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        el.textContent = window.t(key);
    });
};