function showAuthView(showLogin) {
  const loginView = document.getElementById('loginView');
  const appView = document.getElementById('appView');
  if (!loginView || !appView) return;

  if (showLogin) {
    loginView.classList.remove('hidden');
    appView.classList.add('hidden');
  } else {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
  }
}

function setAuthMessage(message, isError) {
  const el = document.getElementById('authMessage');
  if (!el) return;
  el.textContent = message || '';
  el.className = `auth-message${isError ? ' error' : ''}`;
}

function signIn(email, password) {
  return window.auth.signInWithEmailAndPassword(email, password);
}

function signUp(email, password) {
  return window.auth.createUserWithEmailAndPassword(email, password);
}

function signOut() {
  return window.auth.signOut();
}

function initAuthUI() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const logoutButton = document.getElementById('logoutButton');

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      setAuthMessage('Signing in…');
      try {
        await signIn(email, password);
      } catch (error) {
        setAuthMessage(error.message, true);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;
      setAuthMessage('Creating account…');
      try {
        await signUp(email, password);
      } catch (error) {
        setAuthMessage(error.message, true);
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        await signOut();
      } catch (error) {
        setAuthMessage(error.message, true);
      }
    });
  }
}

function handleAuthState(user) {
  if (!user) {
    showAuthView(true);
    setAuthMessage('Please sign in to access the scheduler.');
    document.getElementById('userEmail').textContent = '';
    return;
  }

  showAuthView(false);
  document.getElementById('userEmail').textContent = user.email || 'Signed in';
  setAuthMessage('');
  loadSchedulerData();
}

window.addEventListener('DOMContentLoaded', () => {
  initAuthUI();
  window.auth.onAuthStateChanged(handleAuthState);
});
