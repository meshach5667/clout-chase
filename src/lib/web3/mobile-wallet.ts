import { useSyncExternalStore } from "react";

/**
 * Detects if the current user agent is a mobile device (iOS or Android phone/tablet).
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTouchScreen = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isSmallViewport = window.innerWidth <= 820;
  return isMobileUA || (isTouchScreen && isSmallViewport);
}

/**
 * Checks if the user is currently inside an in-app Web3 wallet browser
 * (e.g. MetaMask Mobile browser, Rabby, Coinbase Wallet browser).
 */
export function isInAppWallet(): boolean {
  if (typeof window === "undefined") return false;
  const anyWin = window as unknown as { ethereum?: unknown };
  return Boolean(anyWin.ethereum);
}

/**
 * True if on a mobile device but outside an in-app Web3 wallet browser.
 */
export function isMobileWithoutWallet(): boolean {
  return isMobileDevice() && !isInAppWallet();
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Generates the universal deep link to open the current page inside MetaMask Mobile.
 * Format: https://metamask.app.link/dapp/[hostname][pathname][search]
 */
export function getMetaMaskDeepLink(url?: string): string {
  if (typeof window === "undefined") return "https://metamask.app.link";
  const target = url || window.location.host + window.location.pathname + window.location.search;
  const clean = target.replace(/^https?:\/\//, "");
  return `https://metamask.app.link/dapp/${clean}`;
}

export function getRainbowDeepLink(url?: string): string {
  if (typeof window === "undefined") return "https://rnbwapp.com";
  const target = url || window.location.href;
  return `https://rnbwapp.com/dapp?url=${encodeURIComponent(target)}`;
}

export function getPhantomDeepLink(url?: string): string {
  if (typeof window === "undefined") return "https://phantom.app";
  const target = url || window.location.href;
  return `https://phantom.app/ul/browse/${encodeURIComponent(target)}?ref=${encodeURIComponent(target)}`;
}

export function getDownloadUrls() {
  const ios = isIOS();
  const android = isAndroid();

  return {
    isIOS: ios,
    isAndroid: android,
    metaMask: ios
      ? "https://apps.apple.com/app/metamask/id1438144202"
      : android
        ? "https://play.google.com/store/apps/details?id=io.metamask"
        : "https://metamask.io/download/",
    rainbow: ios
      ? "https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021"
      : android
        ? "https://play.google.com/store/apps/details?id=me.rainbow"
        : "https://rainbow.me/download",
    phantom: ios
      ? "https://apps.apple.com/app/phantom-solana-wallet/id1598432977"
      : android
        ? "https://play.google.com/store/apps/details?id=app.phantom"
        : "https://phantom.app/download",
  };
}

let isModalOpen = false;
const listeners = new Set<() => void>();

export function openMobileWalletModal() {
  isModalOpen = true;
  listeners.forEach((listener) => listener());
}

export function closeMobileWalletModal() {
  isModalOpen = false;
  listeners.forEach((listener) => listener());
}

export function useMobileWalletModal() {
  const isOpen = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => isModalOpen,
    () => false,
  );

  return {
    isOpen,
    open: openMobileWalletModal,
    close: closeMobileWalletModal,
  };
}
