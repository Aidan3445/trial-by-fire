export const BUY_ME_A_COFFEE_LINK = 'https://www.buymeacoffee.com/aidanweinberg';

const PENDING_KEY = 'donation-pending';
// Ignore focus events that fire as the new tab opens; only count a real return
const MIN_AWAY_MS = 3000;

/**
  * Remember that the user left to donate, so the app can ask how it went when
  * they come back. Call from any link to Buy Me a Coffee.
  */
export function markDonationPending() {
  try {
    sessionStorage.setItem(PENDING_KEY, `${Date.now()}`);
  } catch {
    // Storage blocked; they just won't be asked on return
  }
}

/** Whether the user left to donate and is back, clearing it so they're asked once */
export function takeDonationPending() {
  try {
    const leftAt = Number(sessionStorage.getItem(PENDING_KEY));
    if (!leftAt || Date.now() - leftAt < MIN_AWAY_MS) return false;
    sessionStorage.removeItem(PENDING_KEY);
    return true;
  } catch {
    return false;
  }
}

export function startDonation() {
  markDonationPending();
  window.open(BUY_ME_A_COFFEE_LINK, '_blank', 'noopener,noreferrer');
}
