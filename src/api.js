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
  let detail = null;
  if (row.detail_json) {
    try {
      detail = JSON.parse(row.detail_json);
    } catch {
      detail = null;
    }
  }
  return {
    id: row.id,
    name: row.shop_name,
    owner: row.owner_name,
    phone: row.phone,
    email: row.email,
    category: row.category,
    salonType: row.salon_type || null,
    city: row.city,
    address: row.address,
    hours: row.business_hours,
    services: row.services,
    detail,
    photoFront: row.photo_front,
    photoInside: row.photo_inside,
    date: row.created_at ? row.created_at.split(" ")[0] : "",
    status: row.status,
    qr: row.qr_id,
    paymentStatus: row.payment_status,
    assignedTo: row.assigned_to || null,
    assignedName: row.assigned_name || null,
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
  // free-text summary of selected services, for back-compat display
  const servicesSummary =
    Array.isArray(form.selectedServices) && form.selectedServices.length
      ? form.selectedServices.map((s) => s.name).join(", ")
      : form.services || "";

  const payload = {
    shop_name: form.shopName,
    owner_name: form.owner,
    phone: form.phone,
    email: form.email,
    category: form.category,
    salon_type: form.salonType || null,
    city: form.city || "Begusarai",
    address: form.address,
    business_hours: form.hours,
    services: servicesSummary,
    detail: form.detail || null,
    services_list: Array.isArray(form.selectedServices) ? form.selectedServices : [],
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

/* ---------------------------- Categories ------------------------------ */

// All active categories for the picker. Uses the SAME endpoint the customer
// site uses, and is tolerant of whatever shape it returns (array at top,
// { categories: [...] }, { data: [...] }, or a grouped object).
export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/api_services.php?action=get_categories`);
  const data = await res.json().catch(() => ({}));

  let list = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(data.categories)) {
    list = data.categories;
  } else if (Array.isArray(data.data)) {
    list = data.data;
  } else if (data.categories && typeof data.categories === "object") {
    // grouped like { categories: { salon: [...], service: [...] } }
    list = Object.values(data.categories).flat();
  } else {
    // last resort: gather any array-of-objects in the response
    Object.values(data || {}).forEach((v) => {
      if (Array.isArray(v)) list = list.concat(v);
    });
  }

  return list
    .filter((c) => c && (c.name || c.category_name || c.title))
    .map((c) => {
      const salonType = c.salon_type || c.salonType || null;
      return {
        name: c.name || c.category_name || c.title,
        kind: c.kind || (salonType ? "salon" : "service"),
        salonType,
        image: c.image_url || c.image || null,
      };
    });
}

// Services inside one category, flattened to [{ id, name, price, section }].
export async function fetchCategoryServices(category) {
  const res = await fetch(
    `${API_BASE}/api_category_services.php?action=list&category=${encodeURIComponent(category)}`
  );
  const data = await res.json().catch(() => ({}));
  const out = [];
  (data.sections || []).forEach((sec) => {
    (sec.items || []).forEach((it) => {
      out.push({
        id: it.id,
        name: it.name,
        price: it.price ?? null,
        section: sec.heading || "Services",
      });
    });
  });
  return out;
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

/* ---------------------------- Email OTP -------------------------------- */

export async function sendOnboardingOtp(email) {
  const res = await fetch(`${API_BASE}/api_onboarding_otp.php`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "send_otp", email }),
  });
  return handle(res); // { sent: true }
}

export async function verifyOnboardingOtp(email, code) {
  const res = await fetch(`${API_BASE}/api_onboarding_otp.php`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "verify_otp", email, code }),
  });
  return handle(res); // { verified: true }
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
