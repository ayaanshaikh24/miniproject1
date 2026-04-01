import { alerts as seedAlerts } from '../constants/mockData';

const ALERTS_STORAGE_KEY = 'pricewise-alerts';
const ALERTS_UPDATED_EVENT = 'pricewise-alerts-updated';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getStoredAlerts() {
  if (!isBrowser()) return seedAlerts;

  const raw = window.localStorage.getItem(ALERTS_STORAGE_KEY);
  if (!raw) return seedAlerts;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedAlerts;
  } catch {
    return seedAlerts;
  }
}

function persistAlerts(alerts) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  window.dispatchEvent(new CustomEvent(ALERTS_UPDATED_EVENT, { detail: alerts }));
}

export function createPriceAlert({ product, targetPrice, currentPrice, email }) {
  const alerts = getStoredAlerts();
  const nextAlert = {
    id: Date.now(),
    product,
    target_price: Number(targetPrice),
    current_price: Number(currentPrice),
    status: 'Active',
    email,
    created_at: new Date().toISOString(),
  };
  const nextAlerts = [nextAlert, ...alerts];
  persistAlerts(nextAlerts);
  return nextAlert;
}

export function removePriceAlert(id) {
  const nextAlerts = getStoredAlerts().filter((alert) => alert.id !== id);
  persistAlerts(nextAlerts);
  return nextAlerts;
}

export function subscribeToAlerts(callback) {
  if (!isBrowser()) return () => {};

  const handleCustom = (event) => callback(event.detail || getStoredAlerts());
  const handleStorage = (event) => {
    if (event.key === ALERTS_STORAGE_KEY) {
      callback(getStoredAlerts());
    }
  };

  window.addEventListener(ALERTS_UPDATED_EVENT, handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(ALERTS_UPDATED_EVENT, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}