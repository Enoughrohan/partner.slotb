/**
 * src/api.js
 * ---------------------------------------------------------------------
 * All backend calls for the Partner Onboarding console live here.
 * Points at the PHP APIs on slotb.in (same host as your existing
 * api_auth.php / api_shops.php).
 * ---------------------------------------------------------------------
 */

const API_BASE = "https://slotb.in";
const TOKEN_KEY = "slotb_ops_token";
const USERNAME_KEY = "slotb_ops_username";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUsername() {
  return localStorage.getItem(USERNAME_KEY);
}

function setSession(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export class AuthError extends Error {}

function authHeaders(extra = {}) {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearSession();
    throw new AuthError(data.error || "Session expired. Please log in again.");
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

/* -------------------------------- Auth ---------------------------------- */

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api_ops_auth.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  const data = await handle(res);
  setSession(data.token, data.username);
  return data.username;
}

export async function logout() {
  const token = getToken();
  clearSession();
  if (!token) return;
  try {
    await fetch(`${API_BASE}/api_ops_auth.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout", token }),
    });
  } catch {
    // best-effort — session is already cleared locally
  }
}

export async function verifySession() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api_ops_auth.php?action=verify`, {
      headers: authHeaders(),
    });
    const data = await handle(res);
    return data.username;
  } catch {
    return null;
  }
}

function normalizeApplication(row) {
  return {
    id: row.id,
    name: row.shop_name,
    owner: row.owner_name,
    phone: row.phone,
    email: row.email,
    category: row.category,
    city: row.city,
    address: row.address,
    hours: row.business_hours,
    services: row.services,
    photoFront: row.photo_front,
    photoInside: row.photo_inside,
    date: row.created_at ? row.created_at.split(" ")[0] : "",
    status: row.status,
    qr: row.qr_id,
    paymentStatus: row.payment_status,
  };
}

function normalizeQr(row) {
  return {
    id: row.id,
    status: row.status,
    shop: row.shop_name,
    date: row.assigned_at ? row.assigned_at.split(" ")[0] : row.created_at ? row.created_at.split(" ")[0] : null,
  };
}

/* ---------------------------- Applications ---------------------------- */

export async function fetchApplications() {
  const res = await fetch(`${API_BASE}/api_partner_applications.php?action=list`, {
    headers: authHeaders(),
  });
  const data = await handle(res);
  return (data.applications || []).map(normalizeApplication);
}

export async function createApplication(form, photoFrontUrl, photoInsideUrl, source = "ops_console") {
  const payload = {
    shop_name: form.shopName,
    owner_name: form.owner,
    phone: form.phone,
    email: form.email,
    category: form.category,
    city: form.city || "Begusarai",
    address: form.address,
    business_hours: form.hours,
    services: form.services,
    photo_front: photoFrontUrl || null,
    photo_inside: photoInsideUrl || null,
    source,
  };
  const res = await fetch(`${API_BASE}/api_partner_applications.php`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return handle(res); // { id, status }
}

export async function setApplicationStatus(id, action) {
  const res = await fetch(`${API_BASE}/api_partner_applications.php`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ id, action }),
  });
  return handle(res);
}

export async function assignQrToApplication(id, qrId, shopName) {
  const res = await fetch(`${API_BASE}/api_partner_applications.php`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ id, action: "assign_qr", qr_id: qrId, shop_name: shopName }),
  });
  return handle(res);
}

export async function markApplicationPaid(id, txnId, amount, method) {
  const res = await fetch(`${API_BASE}/api_partner_applications.php`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ id, action: "mark_paid", txn_id: txnId, amount, method }),
  });
  return handle(res);
}

/* ------------------------------ QR Bank -------------------------------- */

export async function fetchQrBank() {
  const res = await fetch(`${API_BASE}/api_qr_bank.php?action=list`, {
    headers: authHeaders(),
  });
  const data = await handle(res);
  return (data.qr_codes || []).map(normalizeQr);
}

export async function lookupQr(qrId) {
  const res = await fetch(`${API_BASE}/api_qr_bank.php?action=lookup&id=${encodeURIComponent(qrId)}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  const row = await handle(res);
  return normalizeQr(row);
}

/* ------------------------------- Photos --------------------------------- */

export async function uploadShopPhoto(file) {
  const form = new FormData();
  form.append("photo", file);
  const res = await fetch(`${API_BASE}/upload_shop_photo.php`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  const data = await handle(res);
  return data.url;
}