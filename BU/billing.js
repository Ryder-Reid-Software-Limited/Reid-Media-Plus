// billing.js – front-end subscription prototype using localStorage
const SUB_KEY = 'rmp-subscription';

function saveSubscription(plan, source, durationDays) {
  const now = Date.now();
  const validUntil = durationDays
    ? now + durationDays * 24 * 60 * 60 * 1000
    : null;

  const sub = {
    plan,           // 'standard' | 'plus'
    source,         // 'code' | 'stripe'
    status: 'active',
    createdAt: now,
    validUntil,
  };

  localStorage.setItem(SUB_KEY, JSON.stringify(sub));
  return sub;
}

function getSubscription() {
  try {
    return JSON.parse(localStorage.getItem(SUB_KEY) || 'null');
  } catch {
    return null;
  }
}

function describePlan(sub) {
  if (!sub || sub.status !== 'active') return 'Not subscribed';
  if (sub.plan === 'standard') return 'Standard';
  if (sub.plan === 'plus') return 'Plus';
  return 'Active plan';
}


function hasActiveSubscription() {
  try {
    const sub = JSON.parse(localStorage.getItem(SUB_KEY) || 'null');
    if (!sub || sub.status !== 'active') return false;
    if (sub.validUntil && Date.now() > sub.validUntil) return false;
    return true;
  } catch {
    return false;
  }
}

// If already subscribed, skip billing
if (hasActiveSubscription()) {
  // optional: send straight to home
  // window.location.href = 'index.html';
}

const backHomeBtn = document.getElementById('billingBackHome');
if (backHomeBtn) {
  backHomeBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

// Show current plan at top of billing page
const billingPlanLabel = document.getElementById('billingCurrentPlanLabel');
if (billingPlanLabel) {
  const sub = getSubscription();
  billingPlanLabel.textContent = describePlan(sub);
}

// ----- Redeem code -----
const redeemForm    = document.getElementById('redeemForm');
const redeemCodeInp = document.getElementById('redeemCode');
const redeemMsg     = document.getElementById('redeemMessage');

if (redeemForm) {
  redeemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!redeemCodeInp) return;

    const code = redeemCodeInp.value.trim();
    redeemMsg.textContent = '';
    redeemMsg.className = 'billing-message';

    if (!code) {
      redeemMsg.textContent = 'Please enter a code.';
      redeemMsg.classList.add('error');
      return;
    }

    // *** DEMO LOGIC ***
    // Here you should really call a secure backend (Cloud Function / server)
    // that validates the code and records the subscription in your database.
    //
    // For now we just check the prefix:
    let plan = null;
    if (code.toUpperCase().startsWith('RMP-PLUS')) {
      plan = 'plus';
    } else if (code.toUpperCase().startsWith('RMP-STD')) {
      plan = 'standard';
    } else {
      redeemMsg.textContent = 'That code is not recognised.';
      redeemMsg.classList.add('error');
      return;
    }

    // Pretend this gives 30 days
    saveSubscription(plan, 'code', 30);

    redeemMsg.textContent = `Code redeemed! Your ${plan.toUpperCase()} plan is now active. Redirecting…`;
    redeemMsg.classList.add('success');

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);
  });
}

// ----- Stripe buttons (placeholder) -----
const planButtons = document.querySelectorAll('.plan-btn');

planButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const plan = btn.dataset.plan; // 'standard' or 'plus'

    // TODO: Replace this with a call to your Stripe Checkout backend.
    // For now, we just mark as active locally:
    saveSubscription(plan, 'stripe', 30); // pretend 30 days

    alert(
      `In a real app, this would redirect to Stripe Checkout for the ${plan} plan.\n\n` +
      `For now, we activated the plan locally for demo purposes.`
    );

    window.location.href = 'index.html';
  });
});
