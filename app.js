// Reid Media Plus – Prime style app.js (revised for robust player + fallbacks)
// depends on data.js which defines window.CATALOG:contentReference[oaicite:1]{index=1}

// ---------- HELPERS ----------
// NOTE: Billing/subscription gating and secondary profiles have been removed.
// This build is single-profile and does not redirect to a billing page.

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function formatTime(s) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}
function minToStr(m){
  const h = Math.floor(m/60);
  const mm = m%60;
  return h ? `${h}h ${mm}m` : `${mm}m`;
}
function ratingText(r){
  return (r || '').replace('+','');
}
// Safe background image: if url exists, use it; else use gradient
function safeBg(url) {
  if (url && typeof url === 'string' && url.trim() !== '') {
    return `url("${url}")`;
  }
  return 'radial-gradient(circle at 50% 20%, #243158 0%, #0a0f1a 60%)';
}

// NOTE: Settings/profile management UI was removed for the single-profile build.

// ---------- DATA GROUPS ----------
const groups = [
  {
    key: 'included',
    title: 'Included with Reid Media Plus',
    pill: true,
    filter: i => true
  },
  {
    key: 'movies',
    title: 'Movies',
    pill: false,
    filter: i => i.type === 'movie'
  },
  {
    key: 'series',
    title: 'Series',
    pill: false,
    filter: i => i.type === 'series'
  }
];

// ---------- DOM ELEMENTS ----------
const rowContainer       = $('#rowContainer');
const continueSection    = $('#continueSection');
const continueScroller   = $('#continueScroller');
const searchInput        = $('#searchInput');
const profileMenuBtn    = $('#profileMenuButton');
const profileMenu       = $('#profileMenu');
const profileMenuLogout = $('#profileMenuLogout');



// hero bits
const heroTitle          = $('#heroTitle');
const heroYear           = $('#heroYear');
const heroRating         = $('#heroRating');
const heroDuration       = $('#heroDuration');
const heroDesc           = $('#heroDesc');
const heroPosterFallback = $('#heroPosterFallback');
const heroTeaser         = $('#heroTeaser');
const heroPlayBtn        = $('#heroPlay');

// player bits
const playerShell      = $('#playerSection');
const playerFrame      = $('.player-frame');
const playerVideo      = $('#video');
const playerSource     = $('#videoSource');
const btnBack          = $('#btnBack');
const btnPlayPause     = $('#btnPlayPause');
const btnReplay        = $('#btnReplay');
const btnForward       = $('#btnForward');
const vol              = $('#vol');
const seek             = $('#seek');
const tcur             = $('#tcur');
const tdur             = $('#tdur');
const speedSel         = $('#speed');
const btnSubs          = $('#btnSubs');
const btnPiP           = $('#btnPiP');
const btnFS            = $('#btnFS');
const nowTitle         = $('#nowTitle');
const nowRating        = $('#nowRating');
const nowAdvice        = $('#nowAdvice');
const epActions        = $('#epActions');

const epPanel          = $('#episodesPanel');
const epList           = $('#episodesList');
const btnCloseEpisodes = $('#btnCloseEpisodes');

const nextUpCard       = $('#nextUp');
const nextUpImg        = $('#nextUpImg');
const nextUpTitle      = $('#nextUpTitle');
const nextUpCount      = $('#nextUpCount');
const nextUpPlay       = $('#nextUpPlay');
const nextUpCancel     = $('#nextUpCancel');

const yearEl           = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

let currentItem = null;
let wantAutoplay = false;
let nextTimer    = null;
let nextTarget   = null;
let nextRemain   = 5;

// ---------- CONTINUE WATCHING MEMORY ----------
function saveProgress(itemId, time) {
  if (!itemId) return;
  if (!isFinite(time) || time < 0) return;
  localStorage.setItem(`rmp-pos-${itemId}`, String(time || 0));
}
function loadProgress(itemId) {
  const v = localStorage.getItem(`rmp-pos-${itemId}`);
  return v ? parseFloat(v) : 0;
}
function listProgressItems() {
  // Return items that have a saved progress > 0
  return window.CATALOG.filter(entry => {
    const pos = loadProgress(entry.id);
    return pos && pos > 0;
  });
}
function renderContinueWatching() {
  const data = listProgressItems();
  if (!data.length) {
    continueSection.classList.add('hidden');
    return;
  }
  continueSection.classList.remove('hidden');
  continueScroller.innerHTML = '';
  for (const item of data) {
    continueScroller.appendChild(makeTile(item, /*compact=*/true));
  }
}

// ---------- HERO SETUP ----------
function pickFeatured() {
  // Prefer first .featured=true, else first item
  const f = window.CATALOG.find(i => i.featured);
  return f || window.CATALOG[0];
}
function hydrateHero(item) {
  if (!item) return;
  heroTitle.textContent = item.title;
  heroYear.textContent = item.year || '';
  heroRating.textContent = ratingText(item.auRating);
  heroDuration.textContent = item.durationMin ? minToStr(item.durationMin) : 'Series';
  heroDesc.textContent = "Watch now on Reid Media Plus.";

  // Poster fallback always safe
  heroPosterFallback.style.backgroundImage = safeBg(item.poster);

  // Teaser: many mobile browsers block autoplay.
  // We'll attempt to load trailerSrc muted; if it fails, just hide video.
  if (item.trailerSrc) {
    heroTeaser.src = item.trailerSrc;
    heroTeaser.loop = true;
    heroTeaser.muted = true;
    heroTeaser.playsInline = true;
    heroTeaser.autoplay = true;

    heroTeaser.play().then(() => {
      // show teaser video, hide poster only visually if it actually played
      heroTeaser.style.display = 'block';
      heroPosterFallback.style.opacity = '0';
    }).catch(() => {
      // Autoplay blocked -> keep static poster, hide the <video> so layout doesn't flicker
      heroTeaser.style.display = 'none';
      heroPosterFallback.style.opacity = '1';
    });
  } else {
    // No trailerSrc, keep poster
    heroTeaser.style.display = 'none';
    heroPosterFallback.style.opacity = '1';
  }

  heroPlayBtn.onclick = () => openPlayer(item, /*autoplay*/true);
}

// ---------- TILE RENDERING ----------
function makeTile(item, compact=false){
  const tile = document.createElement('article');
  tile.className = 'tile';
  tile.tabIndex = 0;
  tile.setAttribute('role','button');
  tile.setAttribute('aria-label', `${item.title}, ${item.type}`);

  // Poster
  const poster = document.createElement('div');
  poster.className = 'tile-poster';
  poster.style.backgroundImage = safeBg(item.poster);
  tile.appendChild(poster);

  const body = document.createElement('div');
  body.className = 'tile-body';

  const titleEl = document.createElement('div');
  titleEl.className = 'tile-title';
  titleEl.textContent = item.title;
  body.appendChild(titleEl);

  const mini = document.createElement('div');
  mini.className = 'tile-mini';
  mini.innerHTML = `
    <span class="mini-rating">${ratingText(item.auRating)}</span>
    <span>${item.year || ''}</span>
    <span>${item.durationMin ? minToStr(item.durationMin) : 'Series'}</span>
  `;
  body.appendChild(mini);

  const acts = document.createElement('div');
  acts.className = 'tile-actions';
  acts.innerHTML = `
    <button class="icon-mini play" aria-label="Play ${item.title}">► Play</button>
    <button class="icon-mini" aria-label="Add ${item.title} to My List">＋ List</button>
  `;
  body.appendChild(acts);

  tile.appendChild(body);

  // events
  const playBtn = acts.querySelector('.play');
  playBtn.addEventListener('click', e => {
    e.stopPropagation();
    openPlayer(item, true);
  });
  tile.addEventListener('click', e => {
    if (!e.target.closest('.icon-mini')) openPlayer(item, true);
  });
  tile.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPlayer(item, true);
    }
  });

  if (compact) {
    tile.style.flex = '0 0 180px';
  }

  return tile;
}

// ---------- ROW RENDER ----------
function renderRows(filteredCatalog=null){
  const catalog = filteredCatalog || window.CATALOG;
  rowContainer.innerHTML = '';

  for(const grp of groups){
    const items = catalog.filter(grp.filter);
    if(!items.length) continue;

    const rowTitle = document.createElement('h2');
    rowTitle.className = 'row-title';

    rowTitle.innerHTML = `
      <span>${grp.title}</span>
      ${grp.pill ? `<span class="row-title-pill">Included with Reid Media Plus</span>` : '' }
    `;

    const scroller = document.createElement('div');
    scroller.className = 'row-scroller';

    for(const it of items){
      scroller.appendChild(makeTile(it));
    }

    rowContainer.appendChild(rowTitle);
    rowContainer.appendChild(scroller);
  }
}

// ---------- EPISODES PANEL ----------
function openEpisodesDrawer(item){
  if(!item || item.type!=='series'){ return; }
  epList.innerHTML = '';

  const s = (item.seasons||[])[0];
  if (!s) return;

  for (const ep of (s.episodes||[])) {
    const card = document.createElement('article');
    card.className = 'ep-card';

    const thumb = document.createElement('div');
    thumb.className = 'ep-thumb';
    thumb.style.backgroundImage = safeBg(ep.poster);
    card.appendChild(thumb);

    const meta = document.createElement('div');
    meta.className = 'ep-meta';

    const t = document.createElement('div');
    t.className = 'ep-title';
    t.textContent = `E${ep.ep}: ${ep.title}`;
    meta.appendChild(t);

    const ti = document.createElement('div');
    ti.className = 'ep-time';
    ti.textContent = `${ep.durationMin||''}m`;
    meta.appendChild(ti);

    const d = document.createElement('div');
    d.className = 'ep-extra';
    d.textContent = (ep.advice || item.advice || []).join(', ');
    meta.appendChild(d);

    const playB = document.createElement('button');
    playB.className = 'ep-play-btn';
    playB.textContent = '► Play';
    playB.addEventListener('click', ()=> {
      playEpisode(item, s.season || 1, ep);
      closeEpisodesDrawer();
    });
    meta.appendChild(playB);

    card.appendChild(meta);

    epList.appendChild(card);
  }

  epPanel.classList.remove('hidden');
  epPanel.setAttribute('aria-hidden','false');
  playerShell.classList.add('drawer-open');
}

function closeEpisodesDrawer(){
  epPanel.classList.add('hidden');
  epPanel.setAttribute('aria-hidden','true');
  playerShell.classList.remove('drawer-open');
}
if (btnCloseEpisodes){
  btnCloseEpisodes.addEventListener('click', closeEpisodesDrawer);
}

// ---------- NEXT UP ----------
function hideNextUp(){
  nextUpCard.classList.add('hidden');
  nextUpCard.setAttribute('aria-hidden','true');
  if(nextTimer){ clearInterval(nextTimer); nextTimer=null; }
}
function scheduleNextUp(meta){
  if(!meta) return;
  nextTarget = meta;
  // fallback image safety
  if (meta.poster && meta.poster.trim() !== '') {
    nextUpImg.src = meta.poster;
  } else {
    // if we don't have a poster, just clear src; CSS gives safe bg
    nextUpImg.removeAttribute('src');
  }

  nextUpTitle.textContent = meta.title || '';
  nextRemain = 5;
  nextUpCount.textContent = nextRemain;

  nextUpCard.classList.remove('hidden');
  nextUpCard.setAttribute('aria-hidden','false');

  if(nextTimer) clearInterval(nextTimer);
  nextTimer = setInterval(()=>{
    nextRemain -= 1;
    nextUpCount.textContent = nextRemain;
    if(nextRemain <= 0){
      clearInterval(nextTimer); nextTimer=null;
      playNextEpisode();
    }
  },1000);
}
function findNextEpMeta(item){
  if(!item || item.type!=='series') return null;
  const s = (item.seasons||[])[0];
  if(!s) return null;
  const eps = s.episodes||[];
  if(item.__currentEp){
    const idx = eps.findIndex(e => e.ep === item.__currentEp.ep);
    if(idx>=0 && idx+1<eps.length){
      const nextEp = eps[idx+1];
      return {
        season: s.season || 1,
        ep: nextEp,
        poster: nextEp.poster,
        src: nextEp.src,
        title: `S${s.season||1}E${nextEp.ep}: ${nextEp.title}`
      };
    }
  }
  return null;
}
function playNextEpisode(){
  if(!nextTarget) { hideNextUp(); return; }
  setSourceAndMaybeResume(nextTarget.src, true, null);
  nowTitle.textContent = `${currentItem.title} • ${nextTarget.title}`;
  currentItem.__currentEp = nextTarget.ep;
  hideNextUp();
}
if (nextUpPlay)   nextUpPlay.onclick   = playNextEpisode;
if (nextUpCancel) nextUpCancel.onclick = hideNextUp;

// ---------- PLAYER CORE ----------
function setSourceAndMaybeResume(src, autoplay, item){
  if(!src) return;
  wantAutoplay = autoplay;

  // Stop current video safely
  try { playerVideo.pause(); } catch {}

  playerSource.src = src;
  playerVideo.load();

  // Resume previously saved position for this item (movies only)
  if(item){
    const resume = loadProgress(item.id);
    if(isFinite(resume) && resume > 0){
      // We can't set currentTime until metadata is loaded,
      // so we store it and apply in 'loadedmetadata'
      pendingResumeTime = resume;
    } else {
      pendingResumeTime = 0;
    }
  } else {
    pendingResumeTime = 0;
  }
}

// 'pendingResumeTime' lets us seek AFTER metadata is ready
let pendingResumeTime = 0;

function openPlayer(item, autoplay){
  currentItem = item;

  // metadata in chrome
  nowTitle.textContent = item.title;
  nowRating.textContent = ratingText(item.auRating);
  nowAdvice.textContent = (item.advice || []).join(', ');
  nowRating.className = 'rating-pill';

  // NEW: set a splash/poster image for the video area
  if (item.poster) {
    playerVideo.poster = item.poster;
  } else {
    playerVideo.removeAttribute('poster');
  }

  // actions row: Episodes / Trailer
  epActions.innerHTML = '';
  if(item.type === 'series'){
    const b = document.createElement('button');
    b.className = 'icon-btn small';
    b.textContent = 'Episodes';
    b.addEventListener('click', ()=> {
      if(epPanel.classList.contains('hidden')) openEpisodesDrawer(item);
      else closeEpisodesDrawer();
    });
    epActions.appendChild(b);
  }
  if(item.type === 'movie' && item.trailerSrc){
    const t = document.createElement('button');
    t.className = 'icon-btn small';
    t.textContent = 'Trailer';
    t.addEventListener('click', ()=>{
      setSourceAndMaybeResume(item.trailerSrc, true, item);
    });
    epActions.appendChild(t);
  }

  // show overlay
  playerShell.classList.remove('hidden');
  playerShell.setAttribute('aria-hidden','false');

  // choose what to load
  if(item.type === 'movie' && item.src){
    closeEpisodesDrawer();
    setSourceAndMaybeResume(item.src, autoplay, item);
  } else if(item.type === 'series'){
    // don't autoplay immediately, show picker
    playerSource.src = '';
    playerVideo.load();         // keeps poster visible
    openEpisodesDrawer(item);
  }

  // focus video for keyboard controls
  playerVideo.focus({ preventScroll: true });

  // (if you have it) auto-hide init call can stay here
  if (typeof initChromeAutoHide === 'function') {
    initChromeAutoHide();
  }
}

function closePlayer(){
  closeEpisodesDrawer();
  hideNextUp();
  playerShell.classList.add('hidden');
  playerShell.setAttribute('aria-hidden','true');

  // ensure UI is visible on next open
  playerShell.classList.remove('chrome-hidden');

  try { playerVideo.pause(); } catch {}
}



// play a specific series episode
function playEpisode(item, seasonNum, ep){
  // OPTIONAL: episode-specific poster fallback
  if (ep.poster || item.poster) {
    playerVideo.poster = ep.poster || item.poster;
  } else {
    playerVideo.removeAttribute('poster');
  }

  setSourceAndMaybeResume(ep.src, true, item);
  nowTitle.textContent = `${item.title} • S${seasonNum}E${ep.ep}: ${ep.title}`;
  item.__currentEp = ep;
}

// ---------- PLAYER CONTROLS / EVENTS ----------
btnBack && (btnBack.onclick = closePlayer);

btnPlayPause && (btnPlayPause.onclick = () => {
  if(playerVideo.paused) playerVideo.play();
  else playerVideo.pause();
});

playerVideo.addEventListener('play',  ()=> { btnPlayPause.textContent = '❚❚'; });
playerVideo.addEventListener('pause', ()=> { btnPlayPause.textContent = '►'; });

// -10s / +10s (guard duration/currentTime)
function safeSeek(delta){
  const dur = playerVideo.duration;
  if(!isFinite(dur) || dur <= 0) return;
  const cur = playerVideo.currentTime || 0;
  let next = cur + delta;
  if(next < 0) next = 0;
  if(next > dur) next = dur;
  playerVideo.currentTime = next;
}

btnReplay  && (btnReplay.onclick  = ()=> safeSeek(-10));
btnForward && (btnForward.onclick = ()=> safeSeek(10));

// volume
vol && (vol.oninput = e => {
  const v = e.target.valueAsNumber;
  if(isFinite(v)) playerVideo.volume = v;
});

// speed
if (speedSel) {
  speedSel.onchange = e => {
    const rate = parseFloat(e.target.value);
    if(isFinite(rate) && rate > 0) playerVideo.playbackRate = rate;
  };
}

// CC toggle (check existence)
btnSubs && (btnSubs.onclick = () => {
  if (!playerVideo.textTracks || !playerVideo.textTracks[0]) return;
  const track = playerVideo.textTracks[0];
  const isOn = track.mode === 'showing';
  track.mode = isOn ? 'disabled' : 'showing';
  btnSubs.setAttribute('aria-pressed', String(!isOn));
});

// Picture-in-Picture (mobile browsers that don't support get silently caught)
btnPiP && (btnPiP.onclick = async ()=>{
  try{
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled && !playerVideo.disablePictureInPicture) {
      await playerVideo.requestPictureInPicture();
    }
  }catch{}
});

// Fullscreen toggle that works cross-browser-ish
btnFS && (btnFS.onclick = async ()=>{
  try {
    if (!document.fullscreenElement &&
        !(document.webkitFullscreenElement || document.msFullscreenElement)) {
      if (playerFrame.requestFullscreen) {
        await playerFrame.requestFullscreen();
      } else if (playerFrame.webkitRequestFullscreen) {
        playerFrame.webkitRequestFullscreen();
      } else if (playerFrame.msRequestFullscreen) {
        playerFrame.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }catch(e){}
});

// keep .fullscreen class in sync with ANY browser fullscreen impl
function syncFullscreenClass() {
  const isFs =
    !!document.fullscreenElement ||
    !!document.webkitFullscreenElement ||
    !!document.msFullscreenElement;
  playerFrame.classList.toggle('fullscreen', isFs);
}
document.addEventListener('fullscreenchange', syncFullscreenClass);
document.addEventListener('webkitfullscreenchange', syncFullscreenClass);
document.addEventListener('msfullscreenchange', syncFullscreenClass);

// seeking UI
function updateSeekFill(){
  const dur = playerVideo.duration;
  if(!seek || !isFinite(dur) || dur<=0) return;
  const pct = (playerVideo.currentTime / dur) * 100;
  seek.style.setProperty('--seek', `${pct}%`);
}

seek && (seek.oninput = e => {
  const dur = playerVideo.duration;
  if(!isFinite(dur) || dur<=0) return;
  const wanted = e.target.valueAsNumber;
  if(isFinite(wanted)) {
    // clamp
    playerVideo.currentTime = Math.min(dur, Math.max(0, wanted));
    updateSeekFill();
  }
});

// metadata loaded -> duration, resume
playerVideo.addEventListener('loadedmetadata', ()=>{
  const dur = playerVideo.duration;
  if (seek && isFinite(dur) && dur > 0) seek.max = dur;
  if (tdur) tdur.textContent = formatTime(dur);

  // apply pending resume seek if we had saved position
  if (pendingResumeTime && isFinite(pendingResumeTime) && pendingResumeTime > 0 && dur > pendingResumeTime) {
    playerVideo.currentTime = pendingResumeTime;
  }
  pendingResumeTime = 0;

  updateSeekFill();

  if (wantAutoplay){
    playerVideo.play().catch(()=>{});
    wantAutoplay = false;
  }
});

// timeupdate -> keep UI in sync, handle next-up, save progress
playerVideo.addEventListener('timeupdate', ()=>{
  const cur = playerVideo.currentTime;
  const dur = playerVideo.duration;

  if(seek && isFinite(dur) && dur > 0) seek.value = cur;
  if(tcur) tcur.textContent = formatTime(cur);
  updateSeekFill();

  // save current progress
  if(currentItem && currentItem.id){
    saveProgress(currentItem.id, cur);
  }

  // show "next up" near the end if it's a series ep
  if(currentItem && currentItem.type === 'series' && isFinite(dur) && dur > 0){
    const remain = dur - cur;
    if(remain <= 12 && !nextTimer){
      const nxt = findNextEpMeta(currentItem);
      if(nxt) scheduleNextUp(nxt);
    }
  }
});

playerVideo.addEventListener('ended', ()=>{
  // autoplay next ep on end too
  if(currentItem && currentItem.type === 'series'){
    const nxt = findNextEpMeta(currentItem);
    if(nxt) scheduleNextUp(nxt);
  }
});

// ---------- KEYBOARD SHORTCUTS ----------
document.addEventListener('keydown', e => {
  const inPlayer = !playerShell.classList.contains('hidden');
  if(!inPlayer) return;

  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    btnPlayPause.click();
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    closePlayer();
  }
  if (e.key === 'f' || e.key === 'F') {
    e.preventDefault();
    btnFS.click();
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    safeSeek(10);
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    safeSeek(-10);
  }
});

// ---------- SEARCH ----------
function applySearchFilter() {
  const q = (searchInput?.value || '').toLowerCase().trim();
  if(!q){
    renderRows();
    renderContinueWatching();
    return;
  }
  const filtered = window.CATALOG.filter(item =>
    item.title.toLowerCase().includes(q)
  );
  renderRows(filtered);
}
if (searchInput){
  searchInput.addEventListener('input', applySearchFilter);
}

// ---------- INIT ----------
(function init(){
  hydrateHero(pickFeatured());   // hero content
  renderRows();                  // rows
  renderContinueWatching();      // "Continue Watching"
})();

// ===== AUTO HIDE PLAYER CHROME =====
let chromeHideTimer = null;

function initChromeAutoHide() {
  const shell = document.querySelector('.player-shell');
  if (!shell) return;

  const resetTimer = () => {
    shell.classList.remove('chrome-hidden');   // show UI
    clearTimeout(chromeHideTimer);
    chromeHideTimer = setTimeout(() => {
      shell.classList.add('chrome-hidden');    // hide UI after 2s
    }, 2000);
  };

  // Mouse / touch / keyboard activity inside the player keeps UI alive
  ['mousemove', 'mousedown', 'touchstart', 'keydown'].forEach(evt => {
    shell.addEventListener(evt, resetTimer);
  });

  // start the initial countdown when player opens
  resetTimer();
}

// ----- PROFILE MENU -----
if (profileMenuBtn && profileMenu) {
  profileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = profileMenu.classList.toggle('hidden');
    profileMenuBtn.setAttribute('aria-expanded', String(!isHidden));
  });

  document.addEventListener('click', (e) => {
    if (!profileMenu.contains(e.target) && !profileMenuBtn.contains(e.target)) {
      if (!profileMenu.classList.contains('hidden')) {
        profileMenu.classList.add('hidden');
        profileMenuBtn.setAttribute('aria-expanded', 'false');
      }
    }
  });
}

if (profileMenuLogout) {
  profileMenuLogout.addEventListener('click', () => {
    // Single action: sign out (if Firebase is loaded) then go back to login
    try {
      if (window.firebase && typeof window.firebase.auth === 'function') {
        window.firebase.auth().signOut();
      }
    } catch {}
    window.location.href = 'login.html';
  });
}

const isSmallScreen = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;

if (isSmallScreen || !item.trailerSrc) {
  heroTeaser.pause?.();
  heroTeaser.removeAttribute('src');
  heroTeaser.load?.();
  heroTeaser.style.display = 'none';
  heroPosterFallback.style.opacity = '1';
} else {
  // attempt autoplay on larger screens
}
