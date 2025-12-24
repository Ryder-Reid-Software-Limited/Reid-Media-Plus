// profile.js – runs on index.html
// Single-profile build:
//  - Redirects to login.html if not authed
//  - Auto-sets a single active profile in localStorage (no picker UI)

const firebaseConfig = {
  apiKey: "AIzaSyD5ZHEaio2BGXaLS_8Hr5dS0mr1_8Em4A4",
  authDomain: "rmplus-v4.firebaseapp.com",
  projectId: "rmplus-v4",
  storageBucket: "rmplus-v4.firebasestorage.app",
  messagingSenderId: "970646427618",
  appId: "1:970646427618:web:1b9f44902d45717c654bbb"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

function setSingleActiveProfile(user) {
  const name =
    user.displayName ||
    (user.email ? user.email.split('@')[0] : 'User');

  // Keep the same key used elsewhere in the app.
  localStorage.setItem('rmp-active-profile', JSON.stringify({
    id: 'primary',
    name,
    uid: user.uid,
  }));
}

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  setSingleActiveProfile(user);
});
