// login.js – handles Firebase auth + RMG-gated signup
// Redirects to index.html after login/signup, where profiles are picked.

// ---------- Firebase init ----------
const firebaseConfig = {
  apiKey: "AIzaSyD5ZHEaio2BGXaLS_8Hr5dS0mr1_8Em4A4",
  authDomain: "rmplus-v4.firebaseapp.com",
  projectId: "rmplus-v4",
  storageBucket: "rmplus-v4.firebasestorage.app",
  messagingSenderId: "970646427618",
  appId: "1:970646427618:web:1b9f44902d45717c654bbb"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// ---------- DOM ----------
const loginForm   = document.getElementById('loginForm');
const signupForm  = document.getElementById('signupForm');
const authTabs    = document.querySelectorAll('.auth-tab');
const authErrorEl = document.getElementById('authError');

function showError(msg) {
  console.error(msg);
  if (authErrorEl) authErrorEl.textContent = msg;
}
function clearError() {
  if (authErrorEl) authErrorEl.textContent = '';
}

// tab switching
function switchAuthTab(which) {
  authTabs.forEach(btn => {
    const active = btn.dataset.authTab === which;
    btn.classList.toggle('auth-tab-active', active);
  });
  if (which === 'login') {
    loginForm.classList.remove('auth-form-hidden');
    signupForm.classList.add('auth-form-hidden');
  } else {
    signupForm.classList.remove('auth-form-hidden');
    loginForm.classList.add('auth-form-hidden');
  }
}
authTabs.forEach(btn => {
  btn.addEventListener('click', () => switchAuthTab(btn.dataset.authTab));
});

// ---------- RMG invite code validation ----------
// Firestore: collection 'signupCodes', doc ID = code string
async function validateInviteCode(code) {
  const trimmed = code.trim();
  if (!trimmed) throw new Error('Please enter your RMG access code.');

  const ref = db.collection('signupCodes').doc(trimmed);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error('That code is invalid. Contact RMG.');
  }
  const data = snap.data();
  if (data.used) {
    throw new Error('That code has already been used.');
  }
  return { ref, data };
}

// ---------- Profile helper (default profile name from signup name) ----------
async function ensureDefaultProfile(user, preferredName) {
  const userRef = db.collection('users').doc(user.uid);
  const profilesRef = userRef.collection('profiles');

  const snap = await profilesRef.get();
  if (!snap.empty) return; // already has profiles

  const displayName =
    preferredName ||
    user.displayName ||
    (user.email ? user.email.split('@')[0] : 'Profile');

  await userRef.set(
    { createdAt: firebase.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );

  await profilesRef.add({
    name: displayName,
    isKids: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

// ---------- SIGNUP ----------
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const name  = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const pass  = document.getElementById('signupPassword').value;
    const code  = document.getElementById('signupCode').value.trim();

    if (!name)  return showError('Please enter your name.');
    if (!email) return showError('Please enter your email.');

    try {
      // RMG code check
      const { ref: codeRef } = await validateInviteCode(code);

      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      const user = cred.user;

      // name shows up in Firebase + used later for profile
      await user.updateProfile({ displayName: name });

      // mark invite code as used
      await codeRef.set(
        {
          used: true,
          usedBy: user.uid,
          usedAt: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await ensureDefaultProfile(user, name);
      // onAuthStateChanged will redirect
    } catch (err) {
      showError(err.message || 'Could not create account.');
    }
  });
}

// ---------- LOGIN ----------
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPassword').value;

    try {
      await auth.signInWithEmailAndPassword(email, pass);
      // onAuthStateChanged will redirect
    } catch (err) {
      showError(err.message || 'Login failed.');
    }
  });
}

// ---------- Auth state → redirect to main app ----------
auth.onAuthStateChanged(async (user) => {
  clearError();
  if (!user) return;           // stay on login page

  await ensureDefaultProfile(user, user.displayName);
  window.location.href = 'index.html';
});
