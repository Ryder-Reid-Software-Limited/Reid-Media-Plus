// profile.js – runs on index.html
//  - Redirects to login.html if not authed
//  - Shows Netflix-style profile selector if authed

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
const db   = firebase.firestore();

const profileShell  = document.getElementById('profileShell');
const profileListEl = document.getElementById('profileList');
const profileAddBtn = document.getElementById('profileAddBtn');
const profileLogout = document.getElementById('profileLogoutBtn');

// ensure at least one profile exists
async function ensureDefaultProfile(user, preferredName) {
  const userRef = db.collection('users').doc(user.uid);
  const profilesRef = userRef.collection('profiles');
  const snap = await profilesRef.get();
  if (!snap.empty) return;

  const name =
    preferredName ||
    user.displayName ||
    (user.email ? user.email.split('@')[0] : 'Profile');

  await userRef.set(
    { createdAt: firebase.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
  await profilesRef.add({
    name,
    isKids: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

async function renderProfiles(user) {
  const userRef = db.collection('users').doc(user.uid);
  const snap = await userRef.collection('profiles').get();

  profileListEl.innerHTML = '';
  snap.forEach(doc => {
    const prof = doc.data();
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'profile-card';
    btn.innerHTML = `
      <div class="profile-avatar">${prof.name.charAt(0).toUpperCase()}</div>
      <div class="profile-name">${prof.name}</div>
    `;
    btn.addEventListener('click', () => {
      localStorage.setItem('rmp-active-profile', JSON.stringify({
        id: doc.id,
        name: prof.name,
        uid: user.uid,
      }));
      profileShell.classList.add('hidden');
      profileShell.setAttribute('aria-hidden', 'true');
    });
    profileListEl.appendChild(btn);
  });
}

if (profileAddBtn) {
  profileAddBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;
    const name = prompt('Profile name:');
    if (!name) return;
    const userRef = db.collection('users').doc(user.uid);
    await userRef.collection('profiles').add({
      name: name.trim(),
      isKids: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    renderProfiles(user);
  });
}

if (profileLogout) {
  profileLogout.addEventListener('click', () => auth.signOut());
}

// Guard + picker
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    // not logged in -> go to login page
    window.location.href = 'login.html';
    return;
  }

  await ensureDefaultProfile(user, user.displayName);
  await renderProfiles(user);

  profileShell.classList.remove('hidden');
  profileShell.setAttribute('aria-hidden', 'false');
});
