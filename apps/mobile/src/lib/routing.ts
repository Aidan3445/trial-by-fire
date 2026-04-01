import { type PendingDeepLink } from '~/types/routing';

let pendingDeepLink: PendingDeepLink = null;

export function setPendingDeepLink(link: PendingDeepLink) {
  pendingDeepLink = link;
}

export function getPendingDeepLink() {
  return pendingDeepLink;
}

export function clearPendingDeepLink() {
  pendingDeepLink = null;
}
