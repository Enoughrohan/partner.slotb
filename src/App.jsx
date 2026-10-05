import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Scissors,
  Stethoscope,
  QrCode,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Camera,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  Building2,
  ArrowRight,
  LayoutGrid,
  BarChart3,
  MessageSquare,
  Bell,
  ScanLine,
  Link2,
  Wallet,
  Landmark,
  ShieldCheck,
  Store,
  ListChecks,
  PlusCircle,
  X,
  Loader2,
  AlertTriangle,
  Lock,
  LogOut,
  Dumbbell,
  BookOpen,
  Wrench,
  Plus,
  Trash2,
  Users,
  IndianRupee,
  Check,
  Image as ImageIcon,
  History,
  BadgeCheck,
  Receipt,
  CircleUser,
} from "lucide-react";
import jsQR from "jsqr";
import ShopLocationPicker from "./ShopLocation";
import {
  fetchApplications,
  fetchQrBank,
  createApplication,
  assignQrToApplication,
  markApplicationPaid,
  setApplicationStatus,
  lookupQr,
  uploadShopPhoto,
  fetchCategories,
  fetchCategoryServices,
  sendOnboardingOtp,
  verifyOnboardingOtp,
  updateApplicationLocation,
  login,
  logout,
  verifySession,
  getStoredUsername,
  AuthError,
  fetchMe,
  fetchMyQr,
  claimQr,
  fetchMyPayments,
  fetchApplicationHistory,
  fetchOnboardingFee,
} from "./api";

/* ---------------------------------------------------------------------- */
/* Design tokens                                                          */
/* ---------------------------------------------------------------------- */
const C = {
  navy: "#0B1642",
  navyDeep: "#070F30",
  navySoft: "#16224F",
  ink: "#0F1730",
  orange: "#FF6A1A",
  orangeDeep: "#E85A0C",
  orangeSoft: "#FFF0E4",
  sky: "#F1F5FC",
  skyDeep: "#E7EDF9",
  slate: "#5B6478",
  slateLight: "#8890A3",
  line: "#E3E8F2",
  white: "#FFFFFF",
  success: "#1F9D55",
  successSoft: "#E7F7EE",
  danger: "#E1483F",
  dangerSoft: "#FDEAE9",
  amber: "#E39A0C",
  amberSoft: "#FDF3DE",
};

const FONTS = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
    .sb-display { font-family: 'Sora', sans-serif; }
    .sb-body { font-family: 'Inter', sans-serif; }
    .sb-mono { font-family: 'Sora', sans-serif; letter-spacing: 0.04em; }
    .sb-scroll::-webkit-scrollbar { width: 6px; }
    .sb-scroll::-webkit-scrollbar-thumb { background: #C9D2E6; border-radius: 4px; }
  `}</style>
);

/* ---------------------------------------------------------------------- */
/* Mock data                                                              */
/* ---------------------------------------------------------------------- */
const seedApplications = [
  { id: "A-118", name: "Glow & Style Salon", owner: "Priya Sharma", phone: "98765 43210", category: "salon", city: "Begusarai", date: "12 Sep 2025", status: "pending", qr: null },
  { id: "A-117", name: "Style Studio", owner: "Ravi Kumar", phone: "91234 56789", category: "salon", city: "Begusarai", date: "11 Sep 2025", status: "pending", qr: null },
  { id: "A-116", name: "Elite Cuts Salon", owner: "Aman Verma", phone: "74895 63210", category: "salon", city: "Begusarai", date: "10 Sep 2025", status: "approved", qr: "QR-SB-000198" },
  { id: "A-115", name: "Royal Touch Salon", owner: "Neha Singh", phone: "93012 34567", category: "salon", city: "Begusarai", date: "09 Sep 2025", status: "rejected", qr: null },
  { id: "A-114", name: "Trendy Hair Lounge", owner: "Vikash Kumar", phone: "91239 87654", category: "salon", city: "Begusarai", date: "09 Sep 2025", status: "approved", qr: null },
  { id: "A-113", name: "Sunrise Health Clinic", owner: "Dr. Meera Jha", phone: "90123 45678", category: "medical", city: "Begusarai", date: "08 Sep 2025", status: "approved", qr: "QR-SB-000203" },
  { id: "A-112", name: "CarePlus Diagnostics", owner: "Dr. Sanjay Rao", phone: "98700 11223", category: "medical", city: "Begusarai", date: "07 Sep 2025", status: "pending", qr: null },
];

const seedQrBank = [
  { id: "QR-SB-000198", status: "assigned", shop: "Elite Cuts Salon", date: "10 Sep 2025" },
  { id: "QR-SB-000199", status: "assigned", shop: "Sanjeevani Pharmacy", date: "05 Sep 2025" },
  { id: "QR-SB-000200", status: "available", shop: null, date: null },
  { id: "QR-SB-000201", status: "available", shop: null, date: null },
  { id: "QR-SB-000202", status: "available", shop: null, date: null },
  { id: "QR-SB-000203", status: "assigned", shop: "Sunrise Health Clinic", date: "08 Sep 2025" },
  { id: "QR-SB-000204", status: "available", shop: null, date: null },
  { id: "QR-SB-000205", status: "damaged", shop: null, date: null },
  { id: "QR-SB-000236", status: "available", shop: null, date: null },
  { id: "QR-SB-000237", status: "available", shop: null, date: null },
  { id: "QR-SB-000238", status: "available", shop: null, date: null },
  { id: "QR-SB-000239", status: "available", shop: null, date: null },
];

/* ---------------------------------------------------------------------- */
/* Small building blocks                                                  */
/* ---------------------------------------------------------------------- */
function StatusPill({ status }) {
  const map = {
    pending: { label: "Pending", bg: C.amberSoft, fg: C.amber, Icon: Clock },
    approved: { label: "Approved", bg: C.successSoft, fg: C.success, Icon: CheckCircle2 },
    rejected: { label: "Rejected", bg: C.dangerSoft, fg: C.danger, Icon: XCircle },
    available: { label: "Available", bg: C.successSoft, fg: C.success, Icon: CheckCircle2 },
    assigned: { label: "Assigned", bg: "#EAF0FF", fg: "#3653C7", Icon: Link2 },
    damaged: { label: "Damaged", bg: C.dangerSoft, fg: C.danger, Icon: XCircle },
  };
  const m = map[status] || map.pending;
  const I = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold sb-body"
      style={{ background: m.bg, color: m.fg }}
    >
      <I size={13} strokeWidth={2.5} />
      {m.label}
    </span>
  );
}

function StatCard({ label, value, tone }) {
  const tones = {
    navy: { bg: C.white, fg: C.navy, ring: C.line },
    amber: { bg: C.amberSoft, fg: C.amber, ring: "transparent" },
    success: { bg: C.successSoft, fg: C.success, ring: "transparent" },
    danger: { bg: C.dangerSoft, fg: C.danger, ring: "transparent" },
  };
  const t = tones[tone] || tones.navy;
  return (
    <div
      className="rounded-2xl px-5 py-4 flex-1 min-w-[130px]"
      style={{ background: t.bg, border: `1px solid ${t.ring}` }}
    >
      <div className="text-3xl font-bold sb-display" style={{ color: t.fg }}>
        {value}
      </div>
      <div className="text-xs mt-1 sb-body" style={{ color: t === tones.navy ? C.slate : t.fg }}>
        {label}
      </div>
    </div>
  );
}

function FieldShell({ label, icon, children }) {
  const Icon = icon;
  return (
    <div>
      <label className="text-xs font-semibold sb-body block mb-1.5" style={{ color: C.slate }}>
        {label}
      </label>
      <div
        className="flex items-center gap-2.5 rounded-xl px-3.5 py-3"
        style={{ background: C.sky, border: `1px solid ${C.line}` }}
      >
        {Icon && <Icon size={16} color={C.slateLight} />}
        {children}
      </div>
    </div>
  );
}

function TextField({ label, icon, value, onChange, placeholder, type = "text" }) {
  return (
    <FieldShell label={label} icon={icon}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none text-sm sb-body"
        style={{ color: C.ink }}
      />
    </FieldShell>
  );
}

function PrimaryButton({ children, onClick, icon, full, disabled, small }) {
  const Icon = icon;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold sb-body transition-transform active:scale-[0.98] ${
        full ? "w-full" : ""
      } ${small ? "px-4 py-2 text-sm" : "px-6 py-3.5 text-sm"}`}
      style={{
        background: disabled ? "#B9C0D6" : C.navy,
        color: C.white,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
      {Icon && <Icon size={16} />}
    </button>
  );
}

function GhostButton({ children, onClick, icon, small }) {
  const Icon = icon;
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold sb-body ${
        small ? "px-4 py-2 text-sm" : "px-6 py-3.5 text-sm"
      }`}
      style={{ background: C.white, color: C.navy, border: `1px solid ${C.line}` }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* Category model + category-specific form pieces                          */
/* ---------------------------------------------------------------------- */

// These three behave differently from salons / individual services.
const MEMBER_CATS = ["Gym", "Library", "Doctor"];

// Decide how the onboarding form should behave for a given category.
//   "salon"   -> Men/Women/Unisex + service picker
//   "member"  -> Gym / Library / Doctor structured fields
//   "service" -> individual services (AC, Plumber…) service picker
function catGroup(name, kind) {
  if (MEMBER_CATS.includes(name)) return "member";
  const n = (name || "").toLowerCase();
  if (kind === "salon" || n.includes("salon") || n.includes("parlour")) return "salon";
  return "service";
}

function catIcon(name) {
  if (MEMBER_CATS.includes(name)) {
    if (name === "Gym") return Dumbbell;
    if (name === "Library") return BookOpen;
    if (name === "Doctor") return Stethoscope;
  }
  const n = (name || "").toLowerCase();
  if (n.includes("salon") || n.includes("parlour")) return Scissors;
  return Wrench;
}

const SALON_TYPES = [
  { value: "mens", label: "Men's" },
  { value: "womens", label: "Women's" },
  { value: "unisex", label: "Unisex" },
];

function SelectField({ label, icon, value, onChange, options, placeholder = "Select…" }) {
  return (
    <FieldShell label={label} icon={icon}>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none text-sm sb-body"
        style={{ color: value ? C.ink : C.slateLight }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

// A small add/remove list of structured rows (plans, seat types, shifts…).
function RepeatRows({ label, cols, rows, onChange, addLabel = "Add row" }) {
  const update = (i, k, v) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const add = () => onChange([...rows, cols.reduce((a, c) => ({ ...a, [c.key]: "" }), {})]);
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i));
  return (
    <div>
      <label className="text-xs font-semibold sb-body block mb-1.5" style={{ color: C.slate }}>
        {label}
      </label>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            {cols.map((c) => (
              <input
                key={c.key}
                value={row[c.key] ?? ""}
                onChange={(e) => update(i, c.key, e.target.value)}
                placeholder={c.placeholder}
                type={c.type || "text"}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm sb-body rounded-xl px-3 py-2.5"
                style={{ background: C.sky, border: `1px solid ${C.line}`, color: C.ink }}
              />
            ))}
            <button
              onClick={() => remove(i)}
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: C.dangerSoft }}
              title="Remove"
            >
              <Trash2 size={15} color={C.danger} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold sb-body px-3 py-2 rounded-lg"
        style={{ background: C.sky, color: C.navy, border: `1px solid ${C.line}` }}
      >
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  );
}

// Service catalog picker for salon + individual-service categories.
function ServicePicker({ catalog, loading, selected, onChange }) {
  const isPicked = (name) => selected.some((s) => s.name === name);
  const toggle = (svc) => {
    if (isPicked(svc.name)) {
      onChange(selected.filter((s) => s.name !== svc.name));
    } else {
      onChange([...selected, { id: svc.id ?? null, name: svc.name, price: svc.price ?? "" }]);
    }
  };
  const setPrice = (name, price) => onChange(selected.map((s) => (s.name === name ? { ...s, price } : s)));

  return (
    <div>
      <label className="text-xs font-semibold sb-body block mb-1.5" style={{ color: C.slate }}>
        Services offered — tap to select, then set price
      </label>

      {loading ? (
        <div className="flex items-center gap-2 text-xs sb-body py-4" style={{ color: C.slateLight }}>
          <Loader2 size={14} className="animate-spin" /> Loading services…
        </div>
      ) : catalog.length === 0 ? (
        <div className="text-xs sb-body rounded-xl px-3 py-3" style={{ background: C.sky, color: C.slate }}>
          No services listed for this category yet. Admin can add them in the panel.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 mb-3">
          {catalog.map((svc) => {
            const on = isPicked(svc.name);
            return (
              <button
                key={svc.id ?? svc.name}
                onClick={() => toggle(svc)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sb-body"
                style={{
                  background: on ? C.navy : C.sky,
                  color: on ? C.white : C.slate,
                  border: `1px solid ${on ? C.navy : C.line}`,
                }}
              >
                {on && <Check size={13} />}
                {svc.name}
              </button>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-col gap-2">
          {selected.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <div className="flex-1 text-sm sb-body truncate" style={{ color: C.ink }}>
                {s.name}
              </div>
              <div
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2"
                style={{ background: C.sky, border: `1px solid ${C.line}` }}
              >
                <IndianRupee size={13} color={C.slateLight} />
                <input
                  value={s.price ?? ""}
                  onChange={(e) => setPrice(s.name, e.target.value)}
                  placeholder="Price"
                  type="number"
                  className="w-20 bg-transparent outline-none text-sm sb-body"
                  style={{ color: C.ink }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Suvidhayein (customer app me chips ki tarah dikhti hain)
const AMENITY_PRESETS = {
  Library: ["AC", "Wi-Fi", "Reading Hall", "Drinking Water", "Locker", "CCTV", "Power Backup", "Washroom", "Parking", "Newspaper"],
  Gym: ["AC", "Cardio", "Weights", "Personal Trainer", "Locker", "Shower", "Parking", "Music", "Steam", "Diet Plan"],
};

function AmenityChips({ category, value, onChange }) {
  const [custom, setCustom] = useState("");
  const list = Array.isArray(value) ? value : [];
  const presets = AMENITY_PRESETS[category] || [];
  const all = [...presets, ...list.filter((x) => !presets.includes(x))];
  const toggle = (a) => onChange(list.includes(a) ? list.filter((x) => x !== a) : [...list, a]);
  const add = () => {
    const parts = custom.split(",").map((x) => x.trim()).filter(Boolean);
    if (!parts.length) return;
    onChange([...list, ...parts.filter((x) => !list.includes(x))]);
    setCustom("");
  };
  return (
    <div>
      <div className="text-xs font-semibold sb-body mb-2" style={{ color: C.slate }}>Amenities (shown in the customer app)</div>
      <div className="flex flex-wrap gap-2 mb-2">
        {all.map((a) => {
          const on = list.includes(a);
          return (
            <button key={a} type="button" onClick={() => toggle(a)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sb-body"
              style={{ background: on ? C.navy : C.sky, color: on ? C.white : C.slate, border: `1px solid ${on ? C.navy : C.line}` }}>
              {on && <Check size={13} />}
              {a}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center rounded-xl px-3 py-2.5" style={{ background: C.sky, border: `1px solid ${C.line}` }}>
          <input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            placeholder="Add more, e.g. Cabin, Printer" className="w-full bg-transparent outline-none text-sm sb-body" style={{ color: C.ink }} />
        </div>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 rounded-xl px-3 text-xs font-semibold sb-body"
          style={{ background: C.white, color: C.navy, border: `1px solid ${C.line}` }}>
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

// Structured detail fields for Gym / Library / Doctor.
function DetailFields({ group, category, detail, setDetail }) {
  const d = (k) => (v) => setDetail({ ...detail, [k]: v });
  const dv = (k, def = "") => detail[k] ?? def;

  if (group !== "member") return null;

  if (category === "Doctor") {
    return (
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <TextField label="Specialization" icon={Stethoscope} value={dv("specialization")} onChange={d("specialization")} placeholder="Dentist, Physician…" />
        <TextField label="Qualification" icon={ListChecks} value={dv("qualification")} onChange={d("qualification")} placeholder="MBBS, MD…" />
        <TextField label="Medical reg. no." icon={ShieldCheck} value={dv("regNo")} onChange={d("regNo")} placeholder="Registration number" />
        <TextField label="Consultation fee (₹)" icon={IndianRupee} value={dv("consultationFee")} onChange={d("consultationFee")} type="number" placeholder="300" />
        <TextField label="Slot duration (min)" icon={Clock} value={dv("slotDuration")} onChange={d("slotDuration")} type="number" placeholder="15" />
        <TextField label="Available days" icon={Clock} value={dv("days")} onChange={d("days")} placeholder="Mon–Sat" />
      </div>
    );
  }

  if (category === "Gym") {
    return (
      <div className="flex flex-col gap-4 mt-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Number of batches" icon={Users} value={dv("batchCount")} onChange={d("batchCount")} type="number" placeholder="3" />
          <TextField label="Batch timings" icon={Clock} value={dv("batchTimings")} onChange={d("batchTimings")} placeholder="6–8 AM, 5–7 PM" />
        </div>
        <AmenityChips category="Gym" value={detail.amenities} onChange={(v) => setDetail({ ...detail, amenities: v })} />
        <TextField label="Admission fee (one-time, ₹)" icon={IndianRupee} value={dv("admissionFee")} onChange={d("admissionFee")} type="number" placeholder="0" />
        <RepeatRows
          label="Membership plans"
          addLabel="Add plan"
          rows={detail.plans && detail.plans.length ? detail.plans : [{ name: "", months: "", fee: "" }]}
          onChange={(rows) => setDetail({ ...detail, plans: rows })}
          cols={[
            { key: "name", placeholder: "Plan name" },
            { key: "months", placeholder: "Months", type: "number" },
            { key: "fee", placeholder: "Fee ₹", type: "number" },
          ]}
        />
      </div>
    );
  }

  if (category === "Library") {
    return (
      <div className="flex flex-col gap-4 mt-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Total seats" icon={Users} value={dv("totalSeats")} onChange={d("totalSeats")} type="number" placeholder="60" />
          <TextField label="Admission fee (one-time, ₹)" icon={IndianRupee} value={dv("admissionFee")} onChange={d("admissionFee")} type="number" placeholder="0" />
        </div>
        <AmenityChips category="Library" value={detail.amenities} onChange={(v) => setDetail({ ...detail, amenities: v })} />
        <RepeatRows
          label="Seat types & price"
          addLabel="Add seat type"
          rows={detail.seatTypes && detail.seatTypes.length ? detail.seatTypes : [{ type: "", price: "" }]}
          onChange={(rows) => setDetail({ ...detail, seatTypes: rows })}
          cols={[
            { key: "type", placeholder: "AC / Non-AC / Cabin" },
            { key: "price", placeholder: "Price ₹", type: "number" },
          ]}
        />
        <RepeatRows
          label="Shifts / slots"
          addLabel="Add shift"
          rows={detail.shifts && detail.shifts.length ? detail.shifts : [{ label: "", time: "", fee: "" }]}
          onChange={(rows) => setDetail({ ...detail, shifts: rows })}
          cols={[
            { key: "label", placeholder: "Morning / Full-day" },
            { key: "time", placeholder: "6 AM–12 PM" },
            { key: "fee", placeholder: "Fee ₹", type: "number" },
          ]}
        />
      </div>
    );
  }

  return null;
}

/* ---------------------------------------------------------------------- */
/* Sidebar                                                                 */
/* ---------------------------------------------------------------------- */
function Sidebar({ area, setArea, username, onLogout }) {
  const partnerNav = [
    { key: "onboard", label: "New Onboarding", Icon: PlusCircle },
    { key: "profile", label: "My Profile", Icon: CircleUser },
  ];
  const opsNav = [
    { key: "applications", label: "Applications", Icon: ListChecks },
    { key: "myqr", label: "My QR Codes", Icon: QrCode },
    { key: "payments", label: "Payment collected", Icon: Wallet },
  ];
  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 py-7 px-5"
      style={{ background: C.navyDeep }}
    >
      <div className="flex items-center gap-2 px-1 mb-9">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: C.orange }}
        >
          <MapPin size={18} color={C.white} strokeWidth={2.5} />
        </div>
        <div>
          <div className="sb-display font-bold text-lg leading-none" style={{ color: C.white }}>
            slotb
          </div>
          <div className="text-[10px] tracking-wide sb-body" style={{ color: "#8B93B8" }}>
            PARTNER SYSTEM
          </div>
        </div>
      </div>

      <div className="mb-2 px-1 text-[11px] font-semibold tracking-wide sb-body" style={{ color: "#5C6693" }}>
        Partner
      </div>
      <nav className="flex flex-col gap-1 mb-6">
        {partnerNav.map((n) => (
          <SideItem key={n.key} n={n} active={area === n.key} onClick={() => setArea(n.key)} />
        ))}
      </nav>

      <div className="mb-2 px-1 text-[11px] font-semibold tracking-wide sb-body" style={{ color: "#5C6693" }}>
        My Work
      </div>
      <nav className="flex flex-col gap-1">
        {opsNav.map((n) => (
          <SideItem key={n.key} n={n} active={area === n.key} onClick={() => setArea(n.key)} />
        ))}
      </nav>

      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between px-1 mb-3">
          <div className="text-xs sb-body truncate" style={{ color: "#8B93B8" }}>
            Logged in as <span className="font-semibold" style={{ color: C.white }}>{username}</span>
          </div>
          <button onClick={onLogout} title="Logout" className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#16224F" }}>
            <LogOut size={13} color="#8B93B8" />
          </button>
        </div>
        <div
          className="rounded-2xl p-4"
          style={{ background: "linear-gradient(155deg, #16224F, #0B1642)", border: "1px solid #232F63" }}
        >
          <ShieldCheck size={18} color={C.orange} />
          <div className="text-sm font-semibold sb-body mt-2" style={{ color: C.white }}>
            Local Business, Stronger Together
          </div>
          <div className="text-xs mt-1 sb-body" style={{ color: "#8B93B8" }}>
            Every QR is a permanent, unique record — one code, one shop.
          </div>
        </div>
      </div>
    </aside>
  );
}

function SideItem({ n, active, onClick }) {
  const Icon = n.Icon;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium sb-body text-left"
      style={{
        background: active ? "rgba(255,106,26,0.14)" : "transparent",
        color: active ? C.orange : "#B7BEDB",
      }}
    >
      <Icon size={17} strokeWidth={2.2} />
      {n.label}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* Top bar                                                                 */
/* ---------------------------------------------------------------------- */
function TopBar({ title, sub, profile, onProfile }) {
  const name = profile?.full_name || profile?.username || "";
  const initials = name.split(" ").map((x) => x[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "SB";
  return (
    <div className="flex items-center justify-between gap-4 mb-7">
      <div className="min-w-0">
        <h1 className="sb-display font-bold text-2xl" style={{ color: C.ink }}>
          {title}
        </h1>
        {sub && (
          <p className="text-sm sb-body mt-1" style={{ color: C.slate }}>
            {sub}
          </p>
        )}
      </div>
      <button onClick={onProfile} className="flex items-center gap-2 pl-1 shrink-0" title="My profile">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm sb-body"
          style={{ background: C.orangeSoft, color: C.orangeDeep }}
        >
          {initials}
        </div>
        <div className="hidden sm:block text-sm font-semibold sb-body text-left" style={{ color: C.ink }}>
          {name}
          {profile?.username && <div className="text-[11px] font-normal" style={{ color: C.slateLight }}>@{profile.username}</div>}
        </div>
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Onboarding wizard                                                      */
/* ---------------------------------------------------------------------- */
const STEPS = ["Basic Details", "Photos & Location", "Preview", "Activate QR", "Payment", "Done"];

function StepRail({ step }) {
  return (
    <div className="hidden lg:flex flex-col gap-1 w-56 shrink-0">
      {STEPS.map((s, i) => {
        const state = i < step ? "done" : i === step ? "active" : "todo";
        return (
          <div key={s} className="flex items-start gap-3 py-3">
            <div className="flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold sb-body shrink-0"
                style={{
                  background: state === "done" ? C.success : state === "active" ? C.orange : C.white,
                  color: state === "todo" ? C.slateLight : C.white,
                  border: state === "todo" ? `1.5px solid ${C.line}` : "none",
                }}
              >
                {state === "done" ? <CheckCircle2 size={15} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-px flex-1 mt-1" style={{ background: C.line, minHeight: 22 }} />
              )}
            </div>
            <div
              className="text-sm sb-body pt-0.5"
              style={{
                color: state === "todo" ? C.slateLight : C.ink,
                fontWeight: state === "active" ? 700 : 500,
              }}
            >
              {s}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl p-6 sm:p-8 ${className}`}
      style={{ background: C.white, border: `1px solid ${C.line}` }}
    >
      {children}
    </div>
  );
}

function PhotoUpload({ label, sub, image, onPick, onOpenCamera }) {
  const inputRef = useRef(null);
  return (
    <div>
      <div
        className="relative rounded-xl overflow-hidden flex flex-col items-center justify-center text-center"
        style={{
          height: 170,
          background: image ? "transparent" : C.sky,
          border: image ? "none" : `1.5px dashed ${C.line}`,
        }}
      >
        {image ? (
          <img src={image} alt={label} className="w-full h-full object-cover" />
        ) : (
          <>
            <Camera size={22} color={C.slateLight} />
            <div className="text-sm font-semibold sb-body mt-2" style={{ color: C.ink }}>
              {label}
            </div>
            <div className="text-xs sb-body mt-0.5" style={{ color: C.slateLight }}>
              {sub}
            </div>
          </>
        )}
        {image && (
          <div
            className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs font-semibold sb-body"
            style={{ background: "rgba(11,22,66,0.72)", color: C.white }}
          >
            {label}
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={onOpenCamera}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold sb-body py-2 rounded-lg"
          style={{ background: C.navy, color: C.white }}
        >
          <Camera size={13} /> {image ? "Retake" : "Take Photo"}
        </button>
        <button
          type="button"
          onClick={() => inputRef.current && inputRef.current.click()}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold sb-body py-2 rounded-lg"
          style={{ background: C.sky, color: C.slate, border: `1px solid ${C.line}` }}
        >
          <ImageIcon size={13} /> {image ? "Replace" : "Choose File"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          if (f) onPick(URL.createObjectURL(f), f);
        }}
      />
    </div>
  );
}

function useCameraStream(constraints, active) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setReady(false);
    setError("");

    (async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera is not supported in this browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e) {
        setError(
          e.name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access in your browser settings and try again."
            : e.message || "Could not access the camera."
        );
      }
    })();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [active]);

  return { videoRef, ready, error };
}

function CameraCaptureModal({ onCapture, onClose }) {
  const { videoRef, ready, error } = useCameraStream({ video: { facingMode: { ideal: "environment" } }, audio: false }, true);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `shop-photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(URL.createObjectURL(blob), file);
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(11,22,66,0.85)" }}>
      <div className="rounded-2xl overflow-hidden w-full max-w-md" style={{ background: C.navyDeep }}>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="text-sm font-semibold sb-body" style={{ color: C.white }}>Take a photo</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#16224F" }}>
            <X size={15} color={C.white} />
          </button>
        </div>
        <div className="relative" style={{ aspectRatio: "4 / 3", background: "#000" }}>
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={22} color={C.white} className="animate-spin" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs sb-body" style={{ color: C.white }}>
              {error}
            </div>
          )}
        </div>
        <div className="px-4 py-5 flex justify-center">
          <button
            onClick={capture}
            disabled={!ready}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: ready ? C.orange : "#3A4270" }}
          >
            <Camera size={24} color={C.white} />
          </button>
        </div>
      </div>
    </div>
  );
}

function QrScannerModal({ onDetect, onClose }) {
  const { videoRef, ready, error } = useCameraStream({ video: { facingMode: { ideal: "environment" } }, audio: false }, true);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const doneRef = useRef(false);

  if (!canvasRef.current) canvasRef.current = document.createElement("canvas");

  useEffect(() => {
    if (!ready) return;
    doneRef.current = false;

    const tick = () => {
      if (doneRef.current) return;
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          doneRef.current = true;
          onDetect(code.data);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      doneRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(11,22,66,0.85)" }}>
      <div className="rounded-2xl overflow-hidden w-full max-w-md" style={{ background: C.navyDeep }}>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="text-sm font-semibold sb-body" style={{ color: C.white }}>Scan partner QR</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#16224F" }}>
            <X size={15} color={C.white} />
          </button>
        </div>
        <div className="relative" style={{ aspectRatio: "4 / 3", background: "#000" }}>
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          {ready && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 rounded-2xl" style={{ border: `3px solid ${C.orange}` }} />
            </div>
          )}
          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={22} color={C.white} className="animate-spin" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs sb-body" style={{ color: C.white }}>
              {error}
            </div>
          )}
        </div>
        <div className="px-4 py-4 text-center text-xs sb-body" style={{ color: "#8B93B8" }}>
          Point the camera at the QR code printed on the partner kit.
        </div>
      </div>
    </div>
  );
}

function extractQrId(raw) {
  const trimmed = (raw || "").trim();
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    return (parts[parts.length - 1] || trimmed).toUpperCase();
  } catch {
    return trimmed.toUpperCase();
  }
}

function OnboardingArea({ onApplicationsChanged, onQrBankChanged, resumeApplication, onExitResume }) {
  // QR pehle lag chuka ho (payment baaki) to seedha payment step
  const [step, setStep] = useState(resumeApplication ? (resumeApplication.qr ? 4 : 1) : 0);
  const [fee, setFee] = useState(499);
  useEffect(() => { fetchOnboardingFee().then(setFee); }, []);
  // onboarding partner ki ID par jo QR hain (sirf wahi laga sakta hai)
  const [myQr, setMyQr] = useState([]);
  const [myQrLoading, setMyQrLoading] = useState(false);
  const [form, setForm] = useState(
    resumeApplication
      ? {
          shopName: resumeApplication.name || "",
          owner: resumeApplication.owner || "",
          phone: resumeApplication.phone || "",
          email: resumeApplication.email || "",
          address: resumeApplication.address || "",
          category: resumeApplication.category || "",
          salonType: resumeApplication.salonType || "",
          hours: resumeApplication.hours || "9:00 AM – 9:00 PM (Mon–Sun)",
          services: resumeApplication.services || "",
          detail: resumeApplication.detail || {},
          selectedServices: [],
          location:
            resumeApplication.latitude != null && resumeApplication.longitude != null
              ? {
                  lat: Number(resumeApplication.latitude),
                  lng: Number(resumeApplication.longitude),
                  accuracy: resumeApplication.locationAccuracy ?? null,
                  source: "saved",
                }
              : null,
        }
      : {
          shopName: "",
          owner: "",
          phone: "",
          email: "",
          address: "",
          category: "",
          salonType: "",
          hours: "9:00 AM – 9:00 PM (Mon–Sun)",
          services: "",
          detail: {},
          selectedServices: [],
          location: null,
        }
  );

  // Category list (from backend) + services for the picked category.
  const [categories, setCategories] = useState([]);
  const [catsLoaded, setCatsLoaded] = useState(false);
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Email OTP verification
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMsg, setOtpMsg] = useState("");

  const changeEmail = (v) => {
    setForm((f) => ({ ...f, email: v }));
    // email badla to verification reset
    setEmailVerified(false);
    setOtpSent(false);
    setOtpCode("");
    setOtpMsg("");
  };

  const handleSendOtp = async () => {
    const email = (form.email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setOtpMsg("Please enter a valid email address");
      return;
    }
    setOtpBusy(true);
    setOtpMsg("");
    try {
      await sendOnboardingOtp(email);
      setOtpSent(true);
      setOtpMsg("OTP sent successfully. Please check your email.");
    } catch (e) {
      setOtpMsg(e.message || "Could not send OTP. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) return;
    setOtpBusy(true);
    setOtpMsg("");
    try {
      await verifyOnboardingOtp((form.email || "").trim(), otpCode.trim());
      setEmailVerified(true);
      setOtpMsg("");
    } catch (e) {
      setOtpMsg(e.message || "Invalid or expired OTP");
    } finally {
      setOtpBusy(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setCategories(await fetchCategories());
      } catch {
        setCategories([]);
      } finally {
        setCatsLoaded(true);
      }
    })();
  }, []);

  // group of the currently selected category
  const selectedCat = categories.find((c) => c.name === form.category);
  const group = form.category ? catGroup(form.category, selectedCat?.kind) : null;
  const needsServicePicker = group === "salon" || group === "service";

  // load services whenever the category changes (only where a picker is shown)
  useEffect(() => {
    if (!form.category || !needsServicePicker) {
      setServiceCatalog([]);
      return;
    }
    let alive = true;
    (async () => {
      setServicesLoading(true);
      try {
        const list = await fetchCategoryServices(form.category);
        if (alive) setServiceCatalog(list);
      } catch {
        if (alive) setServiceCatalog([]);
      } finally {
        if (alive) setServicesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category]);
  const [front, setFront] = useState(resumeApplication?.photoFront || null);
  const [inside, setInside] = useState(resumeApplication?.photoInside || null);
  const [frontUrl, setFrontUrl] = useState(resumeApplication?.photoFront || null);
  const [insideUrl, setInsideUrl] = useState(resumeApplication?.photoInside || null);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingInside, setUploadingInside] = useState(false);
  const [serverAppId, setServerAppId] = useState(resumeApplication ? resumeApplication.id : null);
  const [qrInput, setQrInput] = useState("");
  const [qrLookup, setQrLookup] = useState(null); // {id,status} | 'notfound' | null
  const [looking, setLooking] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assignedQr, setAssignedQr] = useState(resumeApplication?.qr || null);
  const [method, setMethod] = useState("upi");
  const [errorMsg, setErrorMsg] = useState("");
  const [txnId] = useState(() => "SBP" + Math.floor(60000000 + Math.random() * 9000000));
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraFor, setCameraFor] = useState(null); // "front" | "inside" | null

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setLocation = React.useCallback((loc) => setForm((f) => ({ ...f, location: loc })), []);

  const handlePickFront = async (previewUrl, file) => {
    setFront(previewUrl);
    setUploadingFront(true);
    setErrorMsg("");
    try {
      const url = await uploadShopPhoto(file);
      setFrontUrl(url);
    } catch (e) {
      setErrorMsg("Photo upload failed: " + e.message);
    } finally {
      setUploadingFront(false);
    }
  };

  const handlePickInside = async (previewUrl, file) => {
    setInside(previewUrl);
    setUploadingInside(true);
    setErrorMsg("");
    try {
      const url = await uploadShopPhoto(file);
      setInsideUrl(url);
    } catch (e) {
      setErrorMsg("Photo upload failed: " + e.message);
    } finally {
      setUploadingInside(false);
    }
  };

  const handleLookup = async () => {
    const clean = qrInput.trim().toUpperCase();
    if (!clean) return;
    setLooking(true);
    setErrorMsg("");
    try {
      const found = await lookupQr(clean);
      setQrLookup(found ? found : "notfound");
    } catch (e) {
      setErrorMsg("QR lookup failed: " + e.message);
    } finally {
      setLooking(false);
    }
  };

  const handleAssign = async (qrOverride) => {
    const target = qrOverride || qrLookup;
    if (!target || target === "notfound") return;
    setAssigning(true);
    setErrorMsg("");
    try {
      let appId = serverAppId;
      if (!appId) {
        // No application row exists yet (fresh onboarding, not a resumed one) — create it now.
        const created = await createApplication(form, frontUrl, insideUrl, "ops_console");
        appId = created.id;
        setServerAppId(appId);
      } else if (form.location) {
        // Partner app se aayi (ya pehle bani) application — ground pe li gayi location save karo.
        await updateApplicationLocation(appId, form.location);
      }
      await assignQrToApplication(appId, target.id, form.shopName || "New Partner");
      setAssignedQr(target.id);
      onQrBankChanged();
      setStep(4);
    } catch (e) {
      setErrorMsg("QR activation failed: " + e.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleScanResult = async (rawValue) => {
    setScannerOpen(false);
    const clean = extractQrId(rawValue);
    setQrInput(clean);
    setLooking(true);
    setErrorMsg("");
    try {
      const found = await lookupQr(clean);
      setQrLookup(found ? found : "notfound");
      if (found && found.status === "available") {
        await handleAssign(found);
      }
    } catch (e) {
      setErrorMsg("QR lookup failed: " + e.message);
    } finally {
      setLooking(false);
    }
  };

  const [paymentResult, setPaymentResult] = useState(null);

  const loadMyQr = React.useCallback(async () => {
    setMyQrLoading(true);
    try {
      const d = await fetchMyQr();
      setMyQr((d.qr_codes || []).filter((q) => q.status === "available"));
    } catch {
      setMyQr([]);
    } finally {
      setMyQrLoading(false);
    }
  }, []);
  useEffect(() => {
    if (step === 3) loadMyQr();
  }, [step, loadMyQr]);

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const appId = serverAppId;
      const result = await markApplicationPaid(appId, txnId, fee, method);
      setPaymentResult(result);
      onApplicationsChanged();
      setStep(5);
    } catch (e) {
      setErrorMsg("Payment confirmation failed: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex gap-10">
      <StepRail step={step} />
      <div className="flex-1 max-w-2xl">
        {resumeApplication && (
          <div
            className="rounded-xl px-4 py-3 mb-5 flex items-center gap-2.5"
            style={{ background: C.orangeSoft }}
          >
            <ListChecks size={16} color={C.orangeDeep} className="shrink-0" />
            <div className="text-xs sb-body" style={{ color: C.orangeDeep }}>
              Continuing <span className="font-semibold">{resumeApplication.name}</span> ({resumeApplication.id}) —
              basic details already received from the partner app.
            </div>
          </div>
        )}
        {/* STEP 0 — basic details */}
        {step === 0 && (
          <Card>
            <SectionHeading
              eyebrow="Step 1 of 5"
              title="Tell us about the business"
              sub="This information appears on the partner's public SlotB listing."
            />
            {/* Category picker — dropdown, dynamic from backend */}
            <div className="mb-5">
              {!catsLoaded ? (
                <FieldShell label="Business category" icon={LayoutGrid}>
                  <span className="text-sm sb-body flex items-center gap-2" style={{ color: C.slateLight }}>
                    <Loader2 size={14} className="animate-spin" /> Loading…
                  </span>
                </FieldShell>
              ) : (
                <>
                  <SelectField
                    label="Business category"
                    icon={LayoutGrid}
                    value={form.category}
                    onChange={(name) =>
                      setForm((f) => ({ ...f, category: name, salonType: "", detail: {}, selectedServices: [] }))
                    }
                    placeholder="Select a business category"
                    options={categories.map((c) => ({ value: c.name, label: c.name }))}
                  />
                  {categories.length === 0 && (
                    <div className="text-xs sb-body mt-1.5" style={{ color: C.danger }}>
                      Could not load categories. Please refresh the page. If the problem continues, check the backend.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Salon type — only for salon categories */}
            {group === "salon" && (
              <div className="mb-5">
                <label className="text-xs font-semibold sb-body block mb-1.5" style={{ color: C.slate }}>
                  Salon type
                </label>
                <div className="flex gap-2">
                  {SALON_TYPES.map((t) => {
                    const on = form.salonType === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => set("salonType")(t.value)}
                        className="flex-1 rounded-xl py-2.5 text-sm font-semibold sb-body"
                        style={{
                          background: on ? C.navy : C.sky,
                          color: on ? C.white : C.slate,
                          border: `1px solid ${on ? C.navy : C.line}`,
                        }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <TextField label="Shop / business name" icon={Store} value={form.shopName} onChange={set("shopName")} placeholder="Glow & Style Salon" />
              <TextField label="Owner name" icon={User} value={form.owner} onChange={set("owner")} placeholder="Priya Sharma" />
              <TextField label="Mobile number" icon={Phone} value={form.phone} onChange={set("phone")} placeholder="98765 43210" />
            </div>

            {/* Email + OTP verification */}
            <div className="mt-4">
              <label className="text-xs font-semibold sb-body block mb-1.5" style={{ color: C.slate }}>
                Email address {emailVerified && <span style={{ color: C.success }}>· verified</span>}
              </label>
              <div className="flex gap-2">
                <div
                  className="flex-1 flex items-center gap-2.5 rounded-xl px-3.5 py-3"
                  style={{ background: C.sky, border: `1px solid ${emailVerified ? C.success : C.line}` }}
                >
                  <Mail size={16} color={emailVerified ? C.success : C.slateLight} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => changeEmail(e.target.value)}
                    placeholder="owner@business.in"
                    disabled={emailVerified}
                    className="w-full bg-transparent outline-none text-sm sb-body"
                    style={{ color: C.ink }}
                  />
                  {emailVerified && <CheckCircle2 size={17} color={C.success} />}
                </div>
                {!emailVerified && (
                  <button
                    onClick={handleSendOtp}
                    disabled={otpBusy}
                    className="px-4 rounded-xl text-sm font-semibold sb-body shrink-0"
                    style={{ background: C.navy, color: C.white, opacity: otpBusy ? 0.6 : 1 }}
                  >
                    {otpBusy ? "..." : otpSent ? "Resend OTP" : "Send OTP"}
                  </button>
                )}
              </div>

              {otpSent && !emailVerified && (
                <div className="flex gap-2 mt-2">
                  <div
                    className="flex-1 flex items-center gap-2.5 rounded-xl px-3.5 py-3"
                    style={{ background: C.white, border: `1px solid ${C.line}` }}
                  >
                    <Lock size={15} color={C.slateLight} />
                    <input
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="6-digit OTP"
                      inputMode="numeric"
                      maxLength={6}
                      className="w-full bg-transparent outline-none text-sm sb-mono font-semibold tracking-widest"
                      style={{ color: C.ink }}
                    />
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpBusy || otpCode.trim().length < 4}
                    className="px-4 rounded-xl text-sm font-semibold sb-body shrink-0"
                    style={{
                      background: C.success,
                      color: C.white,
                      opacity: otpBusy || otpCode.trim().length < 4 ? 0.5 : 1,
                    }}
                  >
                    Verify
                  </button>
                </div>
              )}

              {otpMsg && (
                <div className="text-xs sb-body mt-2" style={{ color: emailVerified ? C.success : C.slate }}>
                  {otpMsg}
                </div>
              )}
            </div>

            <div className="mt-4">
              <TextField label="Address" icon={MapPin} value={form.address} onChange={set("address")} placeholder="Shop No. 12, Station Road, Begusarai" />
            </div>
            <div className="mt-4">
              <TextField label="Business hours" icon={Clock} value={form.hours} onChange={set("hours")} />
            </div>

            {/* Category-specific section */}
            {needsServicePicker && (
              <div className="mt-5">
                <ServicePicker
                  catalog={serviceCatalog}
                  loading={servicesLoading}
                  selected={form.selectedServices}
                  onChange={(list) => set("selectedServices")(list)}
                />
              </div>
            )}
            {group === "member" && (
              <DetailFields
                group={group}
                category={form.category}
                detail={form.detail}
                setDetail={(d) => set("detail")(d)}
              />
            )}
            {!emailVerified && (
              <div className="mt-5 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs sb-body" style={{ background: C.amberSoft, color: C.amber }}>
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                Please verify the email address with OTP to continue.
              </div>
            )}
            <div className="flex justify-end mt-8">
              <PrimaryButton
                icon={ArrowRight}
                onClick={() => setStep(1)}
                disabled={!form.category || !form.shopName.trim() || !form.owner.trim() || !form.phone.trim() || !emailVerified}
              >
                Continue
              </PrimaryButton>
            </div>
          </Card>
        )}

        {/* STEP 1 — photos */}
        {step === 1 && (
          <Card>
            <SectionHeading
              eyebrow="Step 2 of 5"
              title="Shop photos & location"
              sub="Clear, real photos of the shop, and its exact location so customers can find it."
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <PhotoUpload label="Shop front photo" sub={uploadingFront ? "Uploading..." : "Tap to upload"} image={front} onPick={handlePickFront} onOpenCamera={() => setCameraFor("front")} />
              <PhotoUpload label="Shop inside photo" sub={uploadingInside ? "Uploading..." : "Tap to upload"} image={inside} onPick={handlePickInside} onOpenCamera={() => setCameraFor("inside")} />
            </div>
            {errorMsg && (
              <div className="mt-4 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs sb-body" style={{ background: C.dangerSoft, color: C.danger }}>
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                {errorMsg}
              </div>
            )}
            <div
              className="mt-5 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs sb-body"
              style={{ background: C.sky, color: C.slate }}
            >
              <ImageIcon size={15} className="mt-0.5 shrink-0" color={C.slateLight} />
              Use well-lit, original photos that show the shop name board where possible. Max 5 MB, JPG or PNG.
            </div>
            <div className="mt-6">
              <ShopLocationPicker
                value={form.location}
                onChange={setLocation}
                onAddress={set("address")}
                autoFillAddress={!form.address.trim()}
              />
            </div>
            {!form.location && (
              <div className="mt-4 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs sb-body" style={{ background: C.amberSoft, color: C.amber }}>
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                Please set the shop location to continue.
              </div>
            )}
            <div className="flex justify-between mt-8">
              <GhostButton icon={ChevronLeft} onClick={() => setStep(0)}>
                Back
              </GhostButton>
              <PrimaryButton icon={ArrowRight} onClick={() => setStep(2)} disabled={uploadingFront || uploadingInside || !form.location}>
                {uploadingFront || uploadingInside ? "Uploading photos..." : "Continue"}
              </PrimaryButton>
            </div>
          </Card>
        )}

        {/* STEP 2 — preview */}
        {step === 2 && (
          <Card>
            <SectionHeading eyebrow="Step 3 of 5" title="Review before submitting" sub="Double-check every detail — this becomes the partner's live profile." />
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {[front, inside].map((img, i) => (
                <div key={i} className="rounded-xl overflow-hidden h-32" style={{ background: C.sky }}>
                  {img ? (
                    <img src={img} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={20} color={C.slateLight} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <PreviewRow label="Category" value={form.category + (form.salonType ? ` (${form.salonType})` : "")} />
            <PreviewRow label="Shop name" value={form.shopName || "—"} />
            <PreviewRow label="Owner" value={form.owner || "—"} />
            <PreviewRow label="Mobile" value={form.phone || "—"} />
            <PreviewRow label="Email" value={form.email || "—"} />
            <PreviewRow label="Address" value={form.address || "—"} />
            <PreviewRow
              label="Location"
              value={
                form.location ? (
                  <a
                    href={`https://www.google.com/maps?q=${form.location.lat},${form.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: C.navy, textDecoration: "underline" }}
                  >
                    {form.location.lat.toFixed(5)}, {form.location.lng.toFixed(5)}
                    {form.location.accuracy != null ? ` (±${form.location.accuracy} m)` : " (pin)"}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <PreviewRow label="Hours" value={form.hours} />
            {form.selectedServices.length > 0 && (
              <PreviewRow
                label="Services"
                value={form.selectedServices
                  .map((s) => (s.price !== "" && s.price != null ? `${s.name} (₹${s.price})` : s.name))
                  .join(", ")}
              />
            )}
            {group === "member" &&
              Object.entries(form.detail || {})
                .filter(([, v]) => v && (!Array.isArray(v) || v.length))
                .map(([k, v]) => (
                  <PreviewRow
                    key={k}
                    label={k}
                    value={
                      Array.isArray(v)
                        ? v
                            .map((row) =>
                              Object.values(row)
                                .filter(Boolean)
                                .join(" · ")
                            )
                            .filter(Boolean)
                            .join("  |  ")
                        : String(v)
                    }
                  />
                ))}
            <PreviewRow label="Verified by" value="On-ground onboarding partner" last />
            <div className="flex justify-between mt-8">
              <GhostButton icon={ChevronLeft} onClick={() => setStep(1)}>
                Back
              </GhostButton>
              <PrimaryButton icon={ArrowRight} onClick={() => setStep(3)}>
                Looks good, continue
              </PrimaryButton>
            </div>
          </Card>
        )}

        {/* STEP 3 — QR activation (unique ID system) */}
        {step === 3 && (
          <Card>
            <SectionHeading
              eyebrow="Step 4 of 5"
              title="Activate the physical QR"
              sub="Every printed QR card carries a unique ID. Enter or scan it to link this exact code to this shop — permanently."
            />

            <div className="rounded-xl p-4 mb-4" style={{ background: C.sky, border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-xs font-bold sb-body" style={{ color: C.ink }}>QR codes on your ID ({myQr.length})</div>
                {myQrLoading && <Loader2 size={14} className="animate-spin" color={C.slateLight} />}
              </div>
              {myQr.length === 0 && !myQrLoading ? (
                <div className="text-xs sb-body" style={{ color: C.slate }}>
                  There are no QR codes on your ID. Go to "My QR Codes" first and scan the QR codes you have to add them to your ID.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {myQr.map((q) => (
                    <button
                      key={q.id}
                      disabled={assigning}
                      onClick={() => { setQrInput(q.id); setQrLookup({ id: q.id, status: "available", shop: null }); }}
                      className="px-3 py-2 rounded-lg text-xs font-semibold sb-mono"
                      style={{
                        background: qrInput === q.id ? C.navy : C.white,
                        color: qrInput === q.id ? C.white : C.ink,
                        border: `1px solid ${qrInput === q.id ? C.navy : C.line}`,
                      }}
                    >
                      {q.id}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setScannerOpen(true)}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold sb-body py-3.5 rounded-xl mb-4"
              style={{ background: C.navy, color: C.white }}
            >
              <ScanLine size={16} /> Scan QR with camera
            </button>

            <div className="text-center text-xs sb-body mb-4" style={{ color: C.slateLight }}>
              — or enter the code manually —
            </div>

            <div
              className="rounded-xl px-4 py-3.5 flex items-center gap-3 mb-5"
              style={{ background: C.sky, border: `1px solid ${C.line}` }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.white, border: `1px solid ${C.line}` }}>
                <QrCode size={18} color={C.navy} />
              </div>
              <div className="flex-1">
                <input
                  value={qrInput}
                  onChange={(e) => {
                    setQrInput(e.target.value);
                    setQrLookup(null);
                  }}
                  placeholder="QR-SB-000237"
                  className="w-full bg-transparent outline-none text-sm sb-mono font-semibold uppercase"
                  style={{ color: C.ink }}
                />
                <div className="text-[11px] sb-body" style={{ color: C.slateLight }}>
                  Printed on the base of the partner kit stand
                </div>
              </div>
              <button
                onClick={handleLookup}
                disabled={looking}
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: C.navy, opacity: looking ? 0.6 : 1 }}
              >
                {looking ? <Loader2 size={16} color={C.white} className="animate-spin" /> : <Search size={16} color={C.white} />}
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs sb-body" style={{ background: C.dangerSoft, color: C.danger }}>
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                {errorMsg}
              </div>
            )}

            {qrLookup === "notfound" && (
              <LookupResult tone="danger" title="QR ID not recognised" body="Check the code on the kit and try again, or request a replacement kit." />
            )}
            {qrLookup && qrLookup !== "notfound" && qrLookup.status === "assigned" && (
              <LookupResult tone="danger" title={`${qrLookup.id} is already linked`} body={`This code is permanently mapped to ${qrLookup.shop}. Each QR can only ever belong to one partner.`} />
            )}
            {qrLookup && qrLookup !== "notfound" && qrLookup.status === "damaged" && (
              <LookupResult tone="danger" title={`${qrLookup.id} is marked damaged`} body="This code has been retired from the active pool. Pick another QR from the kit." />
            )}
            {qrLookup && qrLookup !== "notfound" && qrLookup.status === "available" && (
              <LookupResult
                tone="success"
                title={`${qrLookup.id} is available`}
                body="Assigning this code will create a permanent mapping to the shop below."
                footer={
                  <div className="flex items-center justify-between mt-3 rounded-lg px-3 py-2.5" style={{ background: C.white }}>
                    <div className="flex items-center gap-2 text-sm sb-body font-semibold" style={{ color: C.ink }}>
                      <span className="sb-mono" style={{ color: C.navy }}>{qrLookup.id}</span>
                      <ArrowRight size={14} color={C.slateLight} />
                      {form.shopName || "New Partner"}
                    </div>
                    <button
                      onClick={() => handleAssign()}
                      disabled={assigning}
                      className="text-xs font-bold sb-body px-3 py-1.5 rounded-md"
                      style={{ background: C.success, color: C.white, opacity: assigning ? 0.6 : 1 }}
                    >
                      {assigning ? "Activating..." : "Assign & activate"}
                    </button>
                  </div>
                }
              />
            )}

            <div className="flex justify-between mt-8">
              <GhostButton icon={ChevronLeft} onClick={() => setStep(2)}>
                Back
              </GhostButton>
              <div className="text-xs sb-body self-center text-right" style={{ color: C.slateLight }}>
                Only QR codes on your ID can be used
              </div>
            </div>
          </Card>
        )}

        {/* STEP 4 — payment */}
        {step === 4 && (
          <Card>
            <SectionHeading eyebrow="Step 5 of 5" title="Complete payment" sub="One-time activation fee. No monthly charges." />

            <div
              className="rounded-xl px-4 py-3.5 flex items-center gap-3 mb-5"
              style={{ background: C.successSoft }}
            >
              <QrCode size={18} color={C.success} />
              <div className="text-sm sb-body font-semibold" style={{ color: C.success }}>
                {assignedQr} activated for {form.shopName || "this partner"}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl px-4 py-4 mb-6" style={{ background: C.sky }}>
              <div>
                <div className="text-sm font-semibold sb-body" style={{ color: C.ink }}>
                  Partner activation fee
                </div>
                <div className="text-xs sb-body mt-0.5" style={{ color: C.slateLight }}>
                  One-time payment · No hidden fees
                </div>
              </div>
              <div className="text-2xl font-bold sb-display" style={{ color: C.navy }}>
                ₹{fee}
              </div>
            </div>

            <div className="text-xs font-semibold sb-body mb-2" style={{ color: C.slate }}>
              Choose payment method
            </div>
            <div className="flex flex-col gap-2 mb-7">
              {[
                { k: "upi", label: "UPI", sub: "PhonePe, Google Pay, Paytm", Icon: Wallet },
                { k: "card", label: "Debit / Credit card", sub: "Visa, Mastercard, RuPay", Icon: CreditCard },
                { k: "netbanking", label: "Net banking", sub: "All major banks", Icon: Landmark },
              ].map((m) => (
                <button
                  key={m.k}
                  onClick={() => setMethod(m.k)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-left"
                  style={{
                    background: C.white,
                    border: `1.5px solid ${method === m.k ? C.navy : C.line}`,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ border: `1.5px solid ${method === m.k ? C.navy : C.slateLight}` }}
                  >
                    {method === m.k && <div className="w-2 h-2 rounded-full" style={{ background: C.navy }} />}
                  </div>
                  <m.Icon size={17} color={C.slate} />
                  <div>
                    <div className="text-sm font-semibold sb-body" style={{ color: C.ink }}>{m.label}</div>
                    <div className="text-xs sb-body" style={{ color: C.slateLight }}>{m.sub}</div>
                  </div>
                </button>
              ))}
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs sb-body" style={{ background: C.dangerSoft, color: C.danger }}>
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                {errorMsg}
              </div>
            )}

            <PrimaryButton full icon={ArrowRight} onClick={handleSubmitApplication} disabled={submitting}>
              {submitting ? "Confirming payment..." : `Pay ₹${fee} and activate`}
            </PrimaryButton>
            <div className="text-center text-xs sb-body mt-3 flex items-center justify-center gap-1.5" style={{ color: C.slateLight }}>
              <ShieldCheck size={13} /> 100% secure payment
            </div>
          </Card>
        )}

        {/* STEP 5 — success */}
        {step === 5 && (
          <Card>
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: C.successSoft }}>
                <CheckCircle2 size={30} color={C.success} />
              </div>
              <h2 className="sb-display font-bold text-2xl" style={{ color: C.ink }}>
                Partner is live on SlotB
              </h2>
              <p className="text-sm sb-body mt-2 max-w-sm" style={{ color: C.slate }}>
                {form.shopName || "This partner"} can now receive bookings. The QR mapping is permanent and cannot be reassigned.
              </p>

              <div className="w-full rounded-xl px-5 py-4 mt-7 text-left" style={{ background: C.sky }}>
                <Row k="Shop" v={form.shopName || "—"} />
                <Row k="QR ID" v={assignedQr} mono />
                <Row k="Transaction ID" v={"#" + txnId} mono />
                <Row k="Amount paid" v={`₹${fee}`} last={!paymentResult?.partner_id} />
                {paymentResult?.partner_id && <Row k="Partner login ID" v={paymentResult.partner_id} mono last />}
              </div>

              {paymentResult?.partner_id && (
                <div
                  className="w-full rounded-xl px-4 py-3 mt-3 flex items-start gap-2.5 text-xs sb-body text-left"
                  style={{
                    background: paymentResult.welcome_email_sent ? C.successSoft : C.amberSoft,
                    color: paymentResult.welcome_email_sent ? C.success : C.amber,
                  }}
                >
                  {paymentResult.welcome_email_sent ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
                  {paymentResult.welcome_email_sent
                    ? "Login ID and password have been emailed to the partner."
                    : "Partner account was created, but the welcome email could not be sent — check the shop's email address, then share the login ID manually if needed."}
                </div>
              )}

              <PrimaryButton
                full
                icon={resumeApplication ? ListChecks : LayoutGrid}
                onClick={() => {
                  if (resumeApplication) {
                    onExitResume();
                    return;
                  }
                  setForm({
                    shopName: "",
                    owner: "",
                    phone: "",
                    email: "",
                    address: "",
                    category: "",
                    salonType: "",
                    hours: "9:00 AM – 9:00 PM (Mon–Sun)",
                    services: "",
                    detail: {},
                    selectedServices: [],
                    location: null,
                  });
                  setFront(null);
                  setInside(null);
                  setFrontUrl(null);
                  setInsideUrl(null);
                  setServerAppId(null);
                  setPaymentResult(null);
                  setQrInput("");
                  setQrLookup(null);
                  setAssignedQr(null);
                  setErrorMsg("");
                  setEmailVerified(false);
                  setOtpSent(false);
                  setOtpCode("");
                  setOtpMsg("");
                  setStep(0);
                }}
              >
                {resumeApplication ? "Back to Applications" : "Onboard another partner"}
              </PrimaryButton>
            </div>
          </Card>
        )}
      </div>

      {cameraFor && (
        <CameraCaptureModal
          onClose={() => setCameraFor(null)}
          onCapture={(url, file) => {
            if (cameraFor === "front") handlePickFront(url, file);
            else handlePickInside(url, file);
            setCameraFor(null);
          }}
        />
      )}

      {scannerOpen && (
        <QrScannerModal onClose={() => setScannerOpen(false)} onDetect={handleScanResult} />
      )}
    </div>
  );
}

function Row({ k, v, mono, last }) {
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={{ borderBottom: last ? "none" : `1px solid ${C.line}` }}
    >
      <span className="text-xs sb-body" style={{ color: C.slateLight }}>{k}</span>
      <span className={`text-sm font-semibold ${mono ? "sb-mono" : "sb-body"}`} style={{ color: C.ink }}>{v}</span>
    </div>
  );
}

function LookupResult({ tone, title, body, footer }) {
  const bg = tone === "success" ? C.successSoft : C.dangerSoft;
  const fg = tone === "success" ? C.success : C.danger;
  const Icon = tone === "success" ? CheckCircle2 : XCircle;
  return (
    <div className="rounded-xl px-4 py-3.5 mb-5" style={{ background: bg }}>
      <div className="flex items-start gap-2.5">
        <Icon size={17} color={fg} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-semibold sb-body" style={{ color: fg }}>{title}</div>
          <div className="text-xs sb-body mt-0.5" style={{ color: C.slate }}>{body}</div>
          {footer}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, sub }) {
  return (
    <div className="mb-6">
      <div className="text-xs font-bold sb-body mb-1.5" style={{ color: C.orange }}>{eyebrow}</div>
      <h2 className="sb-display font-bold text-xl" style={{ color: C.ink }}>{title}</h2>
      {sub && <p className="text-sm sb-body mt-1.5" style={{ color: C.slate }}>{sub}</p>}
    </div>
  );
}

function PreviewRow({ label, value, last }) {
  return (
    <div className="flex items-start justify-between py-2.5" style={{ borderBottom: last ? "none" : `1px solid ${C.line}` }}>
      <span className="text-xs sb-body w-28 shrink-0" style={{ color: C.slateLight }}>{label}</span>
      <span className="text-sm sb-body text-right flex-1" style={{ color: C.ink }}>{value}</span>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Ops — Applications                                                      */
/* ---------------------------------------------------------------------- */
function ApplicationsArea({ applications, onOpenApplication }) {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [historyFor, setHistoryFor] = useState(null);

  // Build category tabs dynamically from whatever categories are present.
  const catNames = Array.from(new Set(applications.map((a) => a.category).filter(Boolean))).sort();
  const tabs = [{ k: "all", label: "All" }, ...catNames.map((c) => ({ k: c, label: c }))];

  const filtered = applications.filter((a) => {
    const matchCat = tab === "all" || a.category === tab;
    const q = query.toLowerCase();
    const matchQ =
      (a.name || "").toLowerCase().includes(q) || (a.owner || "").toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const counts = {
    total: applications.length,
    pending: applications.filter((a) => !a.isComplete && a.status !== "rejected").length,
    approved: applications.filter((a) => a.isComplete).length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-7">
        <StatCard label="Total applications" value={counts.total} tone="navy" />
        <StatCard label="Pending" value={counts.pending} tone="amber" />
        <StatCard label="Complete" value={counts.approved} tone="success" />
        <StatCard label="Rejected" value={counts.rejected} tone="danger" />
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {tabs.map((t) => {
          const n = t.k === "all" ? applications.length : applications.filter((a) => a.category === t.k).length;
          const on = tab === t.k;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold sb-body"
              style={{
                background: on ? C.navy : C.white,
                color: on ? C.white : C.slate,
                border: `1px solid ${on ? C.navy : C.line}`,
              }}
            >
              {t.label} ({n})
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: C.white, border: `1px solid ${C.line}` }}>
          <Search size={15} color={C.slateLight} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by business or owner name..."
            className="w-full bg-transparent outline-none text-sm sb-body"
          />
        </div>
        <GhostButton icon={SlidersHorizontal} small>Filter</GhostButton>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((a) => (
          <div key={a.id} className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: C.white, border: `1px solid ${C.line}` }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.sky }}>
              {(() => {
                const Icon = catIcon(a.category);
                return <Icon size={18} color={C.navy} />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold sb-body text-sm" style={{ color: C.ink }}>{a.name}</div>
              <div className="text-xs sb-body mt-0.5" style={{ color: C.slateLight }}>
                {a.category}{a.salonType ? ` (${a.salonType})` : ""} · {a.owner} · {a.phone} · {a.city} · {a.date}
              </div>
              {a.qr && (
                <div className="text-xs sb-mono font-semibold mt-1" style={{ color: C.success }}>
                  {a.qr} linked
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {a.isComplete ? (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold sb-body" style={{ background: C.successSoft, color: C.success }}>
                  <Lock size={12} strokeWidth={2.5} /> Complete
                </span>
              ) : (
                <StatusPill status={a.status} />
              )}
              {a.isComplete || a.status === "rejected" ? (
                <button
                  onClick={() => (a.isComplete ? setHistoryFor(a) : null)}
                  disabled={!a.isComplete}
                  className="text-xs font-bold sb-body px-4 py-2.5 rounded-lg flex items-center gap-1.5"
                  style={{ background: C.white, color: C.navy, border: `1px solid ${C.line}`, opacity: a.isComplete ? 1 : 0.5 }}
                >
                  <History size={13} /> History
                </button>
              ) : (
                <button
                  onClick={() => onOpenApplication(a)}
                  className="text-xs font-bold sb-body px-4 py-2.5 rounded-lg flex items-center gap-1.5"
                  style={{ background: C.navy, color: C.white }}
                >
                  {a.qr ? "Payment pending" : "Start onboarding"}
                  <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-sm sb-body" style={{ color: C.slateLight }}>
            No applications match this search.
          </div>
        )}
      </div>
      {historyFor && <HistoryModal app={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Ops — QR Bank                                                           */
/* ---------------------------------------------------------------------- */
function QrBankArea({ qrBank, applications, onDataChanged }) {
  const [query, setQuery] = useState("");
  const [assignFor, setAssignFor] = useState(null); // qr id currently being assigned
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  const counts = {
    total: qrBank.length,
    available: qrBank.filter((q) => q.status === "available").length,
    assigned: qrBank.filter((q) => q.status === "assigned").length,
    damaged: qrBank.filter((q) => q.status === "damaged").length,
  };

  const filtered = qrBank.filter((q) => q.id.toLowerCase().includes(query.toLowerCase()));
  const unlinkedApproved = applications.filter((a) => a.status === "approved" && !a.qr);

  const doAssign = async (qrId, application) => {
    setAssigning(true);
    setAssignError("");
    try {
      await assignQrToApplication(application.id, qrId, application.name);
      await onDataChanged();
      setAssignFor(null);
    } catch (e) {
      setAssignError(e.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-7">
        <StatCard label="Total QR codes" value={counts.total} tone="navy" />
        <StatCard label="Available" value={counts.available} tone="success" />
        <StatCard label="Assigned" value={counts.assigned} tone="amber" />
        <StatCard label="Damaged / retired" value={counts.damaged} tone="danger" />
      </div>

      <div
        className="rounded-2xl p-5 mb-6 flex items-start gap-3"
        style={{ background: "linear-gradient(155deg, #16224F, #0B1642)" }}
      >
        <QrCode size={20} color={C.orange} className="mt-0.5 shrink-0" />
        <div>
          <div className="text-sm font-semibold sb-body" style={{ color: C.white }}>
            Every physical QR carries a unique, permanent ID
          </div>
          <div className="text-xs sb-body mt-1" style={{ color: "#B7BEDB" }}>
            Once a code is assigned to a shop the mapping cannot be changed — reprint and retire the card instead of reassigning it.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: C.white, border: `1px solid ${C.line}` }}>
          <Search size={15} color={C.slateLight} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search QR ID, e.g. QR-SB-000237"
            className="w-full bg-transparent outline-none text-sm sb-mono"
          />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, background: C.white }}>
        <div
          className="grid grid-cols-[1.3fr_1fr_1.4fr_1fr] px-5 py-3 text-xs font-semibold sb-body"
          style={{ background: C.sky, color: C.slateLight }}
        >
          <div>QR ID</div>
          <div>Status</div>
          <div>Linked shop</div>
          <div className="text-right">Action</div>
        </div>
        <div className="max-h-[420px] overflow-y-auto sb-scroll">
          {filtered.map((q) => (
            <div key={q.id} className="grid grid-cols-[1.3fr_1fr_1.4fr_1fr] px-5 py-3.5 items-center" style={{ borderTop: `1px solid ${C.line}` }}>
              <div className="text-sm font-semibold sb-mono" style={{ color: C.ink }}>{q.id}</div>
              <div><StatusPill status={q.status} /></div>
              <div className="text-sm sb-body" style={{ color: q.shop ? C.ink : C.slateLight }}>
                {q.shop || "—"}
              </div>
              <div className="text-right">
                {q.status === "available" && (
                  <button
                    onClick={() => setAssignFor(q.id)}
                    className="text-xs font-bold sb-body px-3 py-1.5 rounded-lg"
                    style={{ background: C.navy, color: C.white }}
                  >
                    Assign
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {assignFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(11,22,66,0.55)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: C.white }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold sb-body" style={{ color: C.ink }}>
                Assign <span className="sb-mono" style={{ color: C.navy }}>{assignFor}</span>
              </div>
              <button onClick={() => setAssignFor(null)}>
                <X size={17} color={C.slateLight} />
              </button>
            </div>
            <div className="text-xs sb-body mb-3" style={{ color: C.slateLight }}>
              Approved partners waiting for a QR code
            </div>
            {assignError && (
              <div className="mb-3 rounded-xl px-3 py-2.5 flex items-start gap-2 text-xs sb-body" style={{ background: C.dangerSoft, color: C.danger }}>
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {assignError}
              </div>
            )}
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto sb-scroll">
              {unlinkedApproved.length === 0 && (
                <div className="text-sm sb-body py-6 text-center" style={{ color: C.slateLight }}>
                  No approved partners are waiting for a QR right now.
                </div>
              )}
              {unlinkedApproved.map((a) => (
                <button
                  key={a.id}
                  onClick={() => doAssign(assignFor, a)}
                  disabled={assigning}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-left"
                  style={{ background: C.sky, opacity: assigning ? 0.6 : 1 }}
                >
                  <div>
                    <div className="text-sm font-semibold sb-body" style={{ color: C.ink }}>{a.name}</div>
                    <div className="text-xs sb-body" style={{ color: C.slateLight }}>{a.owner}</div>
                  </div>
                  <ChevronRight size={15} color={C.slateLight} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Helpers (profile / QR / payments)                                       */
/* ---------------------------------------------------------------------- */
const inr = (v) => "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
function fmtWhen(v) {
  if (!v) return "";
  const d = new Date(String(v).replace(" ", "T"));
  if (isNaN(d)) return v;
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
}
const METHOD_LABEL = { upi: "UPI", cash: "Cash", razorpay: "Razorpay", bank: "Bank", other: "Other" };

function MiniStat({ label, value, tone = "navy", sub }) {
  const fg = { navy: C.navy, success: C.success, amber: C.amber, orange: C.orangeDeep }[tone] || C.navy;
  return (
    <div className="rounded-2xl px-5 py-4" style={{ background: C.white, border: `1px solid ${C.line}` }}>
      <div className="text-xs sb-body" style={{ color: C.slate }}>{label}</div>
      <div className="text-2xl font-bold sb-display mt-1" style={{ color: fg }}>{value}</div>
      {sub && <div className="text-[11px] sb-body mt-1" style={{ color: C.slateLight }}>{sub}</div>}
    </div>
  );
}

function AreaLoader() {
  return (
    <div className="flex items-center gap-2 text-sm sb-body py-16 justify-center" style={{ color: C.slateLight }}>
      <Loader2 size={16} className="animate-spin" /> Loading...
    </div>
  );
}

function AreaError({ msg, onRetry }) {
  return (
    <div className="rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs sb-body" style={{ background: C.dangerSoft, color: C.danger }}>
      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      <div className="flex-1">{msg}</div>
      {onRetry && <button onClick={onRetry} className="font-bold underline">Retry</button>}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Meri Profile                                                            */
/* ---------------------------------------------------------------------- */
function ProfileArea({ me, onReload, onGo }) {
  if (!me) return <AreaLoader />;
  const p = me.profile || {};
  const s = me.stats || {};
  const initials = (p.full_name || p.username || "SB").split(" ").map((x) => x[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <div>
      <div className="rounded-2xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-5" style={{ background: "linear-gradient(155deg, #16224F, #0B1642)" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold sb-display shrink-0" style={{ background: C.orange, color: C.white }}>{initials}</div>
        <div className="flex-1 min-w-0">
          <div className="sb-display font-bold text-xl" style={{ color: C.white }}>{p.full_name || p.username}</div>
          <div className="text-sm sb-body mt-0.5" style={{ color: "#B7BEDB" }}>@{p.username} · Onboarding partner</div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-xs sb-body" style={{ color: "#D5DAEE" }}>
            {p.phone && <span className="inline-flex items-center gap-1.5"><Phone size={13} /> {p.phone}</span>}
            {p.email && <span className="inline-flex items-center gap-1.5"><Mail size={13} /> {p.email} <BadgeCheck size={13} color="#34D399" /></span>}
            {p.city && <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {p.city}</span>}
          </div>
        </div>
        <div className="text-xs sb-body" style={{ color: "#8B93B8" }}>Joined {fmtWhen(p.created_at).split(",")[0]}</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MiniStat label="My applications" value={s.applications ?? 0} sub={`${s.in_progress ?? 0} in progress`} />
        <MiniStat label="Completed" value={s.completed ?? 0} tone="success" />
        <MiniStat label="QR codes in hand" value={s.qr_in_hand ?? 0} tone="orange" sub={`${s.qr_used ?? 0} installed at shops`} />
        <MiniStat label="Payment collected" value={inr(s.collected)} tone="success" sub={`Today ${inr(s.collected_today)}`} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          ["New onboarding", "Onboard a new shop", PlusCircle, "onboard"],
          ["My QR Codes", "Scan QR codes to add them to your ID", QrCode, "myqr"],
          ["Payment collected", "View the payments you have collected", Wallet, "payments"],
        ].map(([t, sub, Icon, k]) => (
          <button key={k} onClick={() => onGo(k)} className="rounded-2xl p-4 text-left flex items-center gap-3" style={{ background: C.white, border: `1px solid ${C.line}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.sky }}><Icon size={18} color={C.navy} /></div>
            <div className="flex-1"><div className="text-sm font-semibold sb-body" style={{ color: C.ink }}>{t}</div><div className="text-xs sb-body" style={{ color: C.slateLight }}>{sub}</div></div>
            <ChevronRight size={16} color={C.slateLight} />
          </button>
        ))}
      </div>
      <button onClick={onReload} className="mt-5 text-xs font-semibold sb-body" style={{ color: C.navy }}>Refresh</button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Mere QR — scan karke apni ID par chadhana                               */
/* ---------------------------------------------------------------------- */
function ClaimScannerModal({ onClose, onClaimed }) {
  const { videoRef, ready, error } = useCameraStream({ video: { facingMode: { ideal: "environment" } }, audio: false }, true);
  const canvasRef = useRef(null);
  const busyRef = useRef(false);
  const lastRef = useRef({ text: "", at: 0 });
  const [log, setLog] = useState([]); // [{ok, text}]
  if (!canvasRef.current) canvasRef.current = document.createElement("canvas");

  useEffect(() => {
    if (!ready) return;
    let raf;
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      const video = videoRef.current;
      if (!busyRef.current && video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height);
        const now = Date.now();
        if (code && code.data && !(code.data === lastRef.current.text && now - lastRef.current.at < 4000)) {
          lastRef.current = { text: code.data, at: now };
          busyRef.current = true;
          try { navigator.vibrate && navigator.vibrate(60); } catch { /* ignore */ }
          try {
            const r = await claimQr(code.data);
            setLog((l) => [{ ok: true, text: r.message || `${r.qr_id} added to your ID` }, ...l].slice(0, 6));
            onClaimed();
          } catch (e) {
            setLog((l) => [{ ok: false, text: e.message }, ...l].slice(0, 6));
          }
          setTimeout(() => { busyRef.current = false; }, 900);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; cancelAnimationFrame(raf); };
  }, [ready]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(11,22,66,0.85)" }}>
      <div className="rounded-2xl overflow-hidden w-full max-w-md" style={{ background: C.navyDeep }}>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="text-sm font-semibold sb-body" style={{ color: C.white }}>Scan QR codes to add them to your ID</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#16224F" }} aria-label="Close">
            <X size={15} color={C.white} />
          </button>
        </div>
        <div className="relative" style={{ aspectRatio: "4 / 3", background: "#000" }}>
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          {ready && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 rounded-2xl" style={{ border: `3px solid ${C.orange}` }} />
            </div>
          )}
          {!ready && !error && <div className="absolute inset-0 flex items-center justify-center"><Loader2 size={22} color={C.white} className="animate-spin" /></div>}
          {error && <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs sb-body" style={{ color: C.white }}>{error}</div>}
        </div>
        <div className="px-4 py-3 text-center text-xs sb-body" style={{ color: "#8B93B8" }}>
          Hold each QR code in front of the camera, one at a time. Each QR code will be added to your ID automatically.
        </div>
        {log.length > 0 && (
          <div className="px-4 pb-4 flex flex-col gap-1.5">
            {log.map((l, i) => (
              <div key={i} className="rounded-lg px-3 py-2 text-xs sb-body flex items-start gap-2" style={{ background: l.ok ? "rgba(31,157,85,0.18)" : "rgba(225,72,63,0.18)", color: l.ok ? "#86EFAC" : "#FCA5A5" }}>
                {l.ok ? <CheckCircle2 size={14} className="shrink-0 mt-px" /> : <XCircle size={14} className="shrink-0 mt-px" />} {l.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MyQrArea({ onChanged }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [scan, setScan] = useState(false);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [tab, setTab] = useState("available");

  const load = React.useCallback(async () => {
    try { setErr(""); setData(await fetchMyQr()); } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const addManual = async () => {
    if (!manual.trim()) return;
    setBusy(true); setMsg(null);
    try { const r = await claimQr(manual.trim()); setMsg({ ok: true, text: r.message }); setManual(""); load(); onChanged(); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(false); }
  };

  if (!data && !err) return <AreaLoader />;
  const list = (data?.qr_codes || []).filter((q) => (tab === "available" ? q.status === "available" : q.status !== "available"));
  const c = data?.counts || {};

  return (
    <div>
      {err && <div className="mb-4"><AreaError msg={err} onRetry={load} /></div>}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MiniStat label="In hand (ready to install)" value={c.available ?? 0} tone="orange" />
        <MiniStat label="Installed at shops" value={c.assigned ?? 0} tone="success" />
      </div>

      <div className="rounded-2xl p-5 mb-6" style={{ background: C.white, border: `1px solid ${C.line}` }}>
        <div className="text-sm font-semibold sb-body mb-1" style={{ color: C.ink }}>Add your QR codes to your ID</div>
        <div className="text-xs sb-body mb-4" style={{ color: C.slateLight }}>
          Only QR codes that are in the admin list and not held by anyone else can be added. Only QR codes on your ID can be installed at a shop.
        </div>
        <button onClick={() => setScan(true)} className="w-full flex items-center justify-center gap-2 text-sm font-bold sb-body py-3.5 rounded-xl mb-3" style={{ background: C.navy, color: C.white }}>
          <ScanLine size={16} /> Scan QR with camera
        </button>
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: C.sky, border: `1px solid ${C.line}` }}>
          <QrCode size={16} color={C.slateLight} />
          <input value={manual} onChange={(e) => setManual(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addManual()} placeholder="Or enter QR ID: QR-SB-000237" className="w-full bg-transparent outline-none text-sm sb-mono uppercase" style={{ color: C.ink }} />
          <button onClick={addManual} disabled={busy || !manual.trim()} className="text-xs font-bold sb-body px-3 py-2 rounded-lg shrink-0" style={{ background: C.navy, color: C.white, opacity: busy || !manual.trim() ? 0.5 : 1 }}>
            {busy ? "..." : "Add"}
          </button>
        </div>
        {msg && (
          <div className="mt-3 rounded-xl px-3.5 py-2.5 text-xs sb-body flex items-start gap-2" style={{ background: msg.ok ? C.successSoft : C.dangerSoft, color: msg.ok ? C.success : C.danger }}>
            {msg.ok ? <CheckCircle2 size={14} className="shrink-0 mt-px" /> : <AlertTriangle size={14} className="shrink-0 mt-px" />} {msg.text}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {[["available", `In hand (${c.available ?? 0})`], ["used", `Used (${(c.assigned ?? 0) + (c.damaged ?? 0)})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className="px-4 py-2.5 rounded-xl text-sm font-semibold sb-body" style={{ background: tab === k ? C.navy : C.white, color: tab === k ? C.white : C.slate, border: `1px solid ${tab === k ? C.navy : C.line}` }}>{l}</button>
        ))}
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, background: C.white }}>
        {list.length === 0 ? (
          <div className="text-center py-12 text-sm sb-body" style={{ color: C.slateLight }}>{tab === "available" ? "No QR codes on your ID yet. Scan above to add them." : "No QR codes have been installed at a shop yet."}</div>
        ) : list.map((q, i) => (
          <div key={q.id} className="flex items-center gap-3 px-5 py-3.5" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.sky }}><QrCode size={16} color={C.navy} /></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold sb-mono" style={{ color: C.ink }}>{q.id}</div>
              <div className="text-xs sb-body truncate" style={{ color: C.slateLight }}>
                {q.status === "assigned" ? `${q.shop_name || "Shop"} · ${fmtWhen(q.assigned_at)}` : `${q.category || "QR"} · Added to ID ${fmtWhen(q.held_at)}`}
              </div>
            </div>
            <StatusPill status={q.status} />
          </div>
        ))}
      </div>
      {scan && <ClaimScannerModal onClose={() => { setScan(false); load(); }} onClaimed={() => { load(); onChanged(); }} />}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Payment collected                                                       */
/* ---------------------------------------------------------------------- */
function PaymentsArea() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const load = React.useCallback(async () => {
    try { setErr(""); setData(await fetchMyPayments()); } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (!data && !err) return <AreaLoader />;
  const t = data?.totals || {};
  const items = data?.items || [];
  return (
    <div>
      {err && <div className="mb-4"><AreaError msg={err} onRetry={load} /></div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MiniStat label="Today" value={inr(t.today)} tone="success" />
        <MiniStat label="This month" value={inr(t.month)} tone="success" />
        <MiniStat label="Total collected" value={inr(t.total)} tone="navy" sub={`${t.count || 0} shops`} />
        <MiniStat label="Cash / UPI" value={`${inr((t.by_method || {}).cash)} / ${inr((t.by_method || {}).upi)}`} tone="orange" />
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, background: C.white }}>
        <div className="px-5 py-3 text-xs font-semibold sb-body" style={{ background: C.sky, color: C.slateLight }}>All payments</div>
        {items.length === 0 ? (
          <div className="text-center py-12 text-sm sb-body" style={{ color: C.slateLight }}>No payments collected yet.</div>
        ) : items.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 px-5 py-3.5" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.successSoft }}><Receipt size={16} color={C.success} /></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold sb-body truncate" style={{ color: C.ink }}>{p.shop_name}</div>
              <div className="text-xs sb-body truncate" style={{ color: C.slateLight }}>{p.id} · {METHOD_LABEL[p.payment_method] || p.payment_method || "-"}{p.payment_txn_id ? ` · ${p.payment_txn_id}` : ""} · {fmtWhen(p.paid_at)}</div>
            </div>
            <div className="text-sm font-bold sb-display" style={{ color: C.success }}>{inr(p.payment_amount)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Complete application — sirf history (edit nahi)                          */
/* ---------------------------------------------------------------------- */
function HistoryModal({ app, onClose }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetchApplicationHistory(app.id).then(setData).catch((e) => setErr(e.message));
  }, [app.id]);
  const a = data?.application;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4" style={{ background: "rgba(11,22,66,0.55)" }}>
      <div className="w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl" style={{ background: C.white }}>
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="min-w-0">
            <div className="text-base font-bold sb-display truncate" style={{ color: C.ink }}>{app.name}</div>
            <div className="text-xs sb-body mt-0.5" style={{ color: C.slateLight }}>{app.id} · {app.category}</div>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={18} color={C.slateLight} /></button>
        </div>
        <div className="overflow-y-auto sb-scroll px-5 py-4">
          <div className="rounded-xl px-3.5 py-3 mb-4 flex items-start gap-2.5 text-xs sb-body" style={{ background: C.successSoft, color: C.success }}>
            <Lock size={14} className="shrink-0 mt-px" />
            This application is complete and can no longer be edited. You can only view its details and history.
          </div>
          {err && <AreaError msg={err} />}
          {!data && !err && <AreaLoader />}
          {a && (
            <>
              <div className="rounded-xl mb-5" style={{ border: `1px solid ${C.line}` }}>
                <PreviewRow label="Owner" value={`${a.owner_name} · ${a.phone}`} />
                {a.email && <PreviewRow label="Email" value={a.email} />}
                <PreviewRow label="QR" value={a.qr_id} />
                <PreviewRow label="Payment" value={`${inr(a.payment_amount)} · ${METHOD_LABEL[a.payment_method] || a.payment_method || "-"}`} />
                <PreviewRow label="Address" value={[a.address, a.city].filter(Boolean).join(", ") || "-"} last />
              </div>
              <div className="text-xs font-bold sb-body mb-3 flex items-center gap-1.5" style={{ color: C.slate }}><History size={14} /> HISTORY</div>
              <ol className="relative ml-1.5 pl-5" style={{ borderLeft: `2px solid ${C.line}` }}>
                {(data.history || []).map((h, i) => (
                  <li key={i} className="relative pb-4">
                    <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full" style={{ background: C.navy, boxShadow: `0 0 0 4px ${C.white}` }} />
                    <div className="text-sm font-semibold sb-body" style={{ color: C.ink }}>{h.label}{h.detail ? <span className="font-normal" style={{ color: C.slate }}> · {h.detail}</span> : null}</div>
                    <div className="text-xs sb-body" style={{ color: C.slateLight }}>{fmtWhen(h.at)}{h.by ? ` · ${h.by}` : ""}</div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Login                                                                   */
/* ---------------------------------------------------------------------- */
function LoginPage({ onLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setBusy(true);
    setError("");
    try {
      const loggedInUsername = await login(username.trim(), password);
      onLoggedIn(loggedInUsername);
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: C.navyDeep }}>
      {FONTS}
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: C.white }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.navy }}>
            <ShieldCheck size={18} color={C.white} />
          </div>
          <div className="sb-display font-extrabold text-xl" style={{ color: C.ink }}>
            slotb
          </div>
        </div>
        <div className="text-xs sb-body mb-6" style={{ color: C.slateLight }}>
          Partner Onboarding — Ops Console
        </div>

        <div className="sb-display font-bold text-lg mb-5" style={{ color: C.ink }}>
          Login to continue
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5 text-xs sb-body" style={{ background: C.dangerSoft, color: C.danger }}>
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <label className="text-xs font-semibold sb-body mb-1.5 block" style={{ color: C.slate }}>
          Username
        </label>
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-3 mb-4" style={{ background: C.sky }}>
          <User size={15} color={C.slateLight} />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="slotb-admin"
            autoFocus
            className="w-full bg-transparent outline-none text-sm sb-body"
            style={{ color: C.ink }}
          />
        </div>

        <label className="text-xs font-semibold sb-body mb-1.5 block" style={{ color: C.slate }}>
          Password
        </label>
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-3 mb-6" style={{ background: C.sky }}>
          <Lock size={15} color={C.slateLight} />
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-transparent outline-none text-sm sb-body"
            style={{ color: C.ink }}
          />
          <button type="button" onClick={() => setShowPw((s) => !s)} className="text-xs font-semibold sb-body shrink-0" style={{ color: C.navy }}>
            {showPw ? "Hide" : "Show"}
          </button>
        </div>

        <PrimaryButton full icon={ArrowRight} disabled={busy}>
          {busy ? "Logging in..." : "Login"}
        </PrimaryButton>
      </form>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* App                                                                     */
/* ---------------------------------------------------------------------- */
export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [username, setUsername] = useState(null);
  const [area, setArea] = useState("onboard");
  const [applications, setApplications] = useState([]);
  const [qrBank, setQrBank] = useState([]);
  const [resumeApp, setResumeApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [me, setMe] = useState(null);

  const handleAuthError = (e) => {
    if (e instanceof AuthError) {
      setUsername(null);
      return true;
    }
    return false;
  };

  const refreshApplications = async () => {
    try {
      setApplications(await fetchApplications());
    } catch (e) {
      if (!handleAuthError(e)) setLoadError(e.message);
    }
  };

  const refreshQrBank = async () => {
    try {
      setQrBank(await fetchQrBank());
    } catch (e) {
      if (!handleAuthError(e)) setLoadError(e.message);
    }
  };

  const refreshMe = async () => {
    try {
      setMe(await fetchMe());
    } catch (e) {
      handleAuthError(e);
    }
  };

  const refreshAll = async () => {
    await Promise.all([refreshApplications(), refreshQrBank(), refreshMe()]);
  };

  useEffect(() => {
    (async () => {
      const existingUsername = getStoredUsername();
      if (existingUsername) {
        const verified = await verifySession();
        setUsername(verified);
      }
      setAuthChecked(true);
    })();
  }, []);

  useEffect(() => {
    if (!username) return;
    (async () => {
      setLoading(true);
      setLoadError("");
      await refreshAll();
      setLoading(false);
    })();
  }, [username]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.navyDeep }}>
        <Loader2 size={22} color={C.white} className="animate-spin" />
      </div>
    );
  }

  if (!username) {
    return <LoginPage onLoggedIn={setUsername} />;
  }

  const titles = {
    onboard: { title: "New partner onboarding", sub: "Register a shop, verify it, and activate a physical QR — end to end." },
    applications: { title: "Applications", sub: "Shops assigned to you. Once an application is complete, only its history is shown." },
    qrbank: { title: "QR bank", sub: "Every printed QR code and the shop it's permanently mapped to." },
    profile: { title: "My profile", sub: "Your details and work so far." },
    myqr: { title: "My QR codes", sub: "Scan the QR codes you have to add them to your ID." },
    payments: { title: "Payment collected", sub: "Onboarding fees you have collected from shops." },
  };

  const currentTitle =
    area === "onboard" && resumeApp
      ? {
          title: `Continue onboarding — ${resumeApp.name}`,
          sub: "Basic details were already submitted from the partner app. Complete the remaining steps.",
        }
      : titles[area];

  const openApplication = (app) => {
    setResumeApp(app);
    setArea("onboard");
  };

  const exitResume = async () => {
    setResumeApp(null);
    setArea("applications");
    await refreshApplications();
  };

  const goToNewOnboarding = () => {
    setResumeApp(null);
    setArea("onboard");
  };

  // Sidebar / bottom nav: kisi bhi section par jao
  const goTo = (key) => {
    setResumeApp(null);
    setArea(key);
    if (key === "profile") refreshMe();
    if (key === "applications") refreshApplications();
  };

  return (
    <div className="min-h-screen flex sb-body" style={{ background: C.sky }}>
      {FONTS}
      <Sidebar
        area={area}
        setArea={goTo}
        username={username}
        onLogout={async () => {
          await logout();
          setUsername(null);
        }}
      />

      {/* mobile top nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex" style={{ background: C.navyDeep }}>
        {[
          { k: "onboard", label: "Onboard", Icon: PlusCircle },
          { k: "applications", label: "Applications", Icon: ListChecks },
          { k: "myqr", label: "My QR", Icon: QrCode },
          { k: "payments", label: "Payment", Icon: Wallet },
          { k: "profile", label: "Profile", Icon: CircleUser },
        ].map((n) => (
          <button
            key={n.k}
            onClick={() => goTo(n.k)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5"
            style={{ color: area === n.k ? C.orange : "#8B93B8" }}
          >
            <n.Icon size={18} />
            <span className="text-[10px] sb-body">{n.label}</span>
          </button>
        ))}
      </div>

      <main className="flex-1 px-5 sm:px-10 py-8 pb-24 md:pb-8 max-w-6xl">
        <TopBar title={currentTitle.title} sub={currentTitle.sub} profile={me?.profile} onProfile={() => goTo("profile")} />

        {loadError && (
          <div
            className="rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5 text-xs sb-body"
            style={{ background: C.dangerSoft, color: C.danger }}
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            Couldn't reach the backend: {loadError}. Check that the API files are uploaded to slotb.in and the
            database credentials in db_config.php are correct.
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm sb-body py-16 justify-center" style={{ color: C.slateLight }}>
            <Loader2 size={16} className="animate-spin" /> Loading live data...
          </div>
        ) : (
          <>
            {area === "onboard" && (
              <OnboardingArea
                key={resumeApp ? resumeApp.id : "new"}
                resumeApplication={resumeApp}
                onExitResume={exitResume}
                onApplicationsChanged={() => { refreshApplications(); refreshMe(); }}
                onQrBankChanged={refreshQrBank}
              />
            )}
            {area === "applications" && (
              <ApplicationsArea applications={applications} onOpenApplication={openApplication} />
            )}
            {area === "qrbank" && (
              <QrBankArea qrBank={qrBank} applications={applications} onDataChanged={refreshAll} />
            )}
            {area === "profile" && <ProfileArea me={me} onReload={refreshMe} onGo={goTo} />}
            {area === "myqr" && <MyQrArea onChanged={refreshMe} />}
            {area === "payments" && <PaymentsArea />}
          </>
        )}
      </main>
    </div>
  );
}
