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
  Image as ImageIcon,
} from "lucide-react";
import jsQR from "jsqr";
import {
  fetchApplications,
  fetchQrBank,
  createApplication,
  assignQrToApplication,
  markApplicationPaid,
  setApplicationStatus,
  lookupQr,
  uploadShopPhoto,
  login,
  logout,
  verifySession,
  getStoredUsername,
  AuthError,
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
/* Sidebar                                                                 */
/* ---------------------------------------------------------------------- */
function Sidebar({ area, setArea, username, onLogout }) {
  const partnerNav = [
    { key: "onboard", label: "New Onboarding", Icon: PlusCircle },
  ];
  const opsNav = [
    { key: "applications", label: "Applications", Icon: ListChecks },
    { key: "qrbank", label: "QR Bank", Icon: QrCode },
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
        Ops Console
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
function TopBar({ title, sub }) {
  return (
    <div className="flex items-center justify-between mb-7">
      <div>
        <h1 className="sb-display font-bold text-2xl" style={{ color: C.ink }}>
          {title}
        </h1>
        {sub && (
          <p className="text-sm sb-body mt-1" style={{ color: C.slate }}>
            {sub}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center relative"
          style={{ background: C.white, border: `1px solid ${C.line}` }}
        >
          <Bell size={17} color={C.slate} />
          <span
            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
            style={{ background: C.orange }}
          />
        </button>
        <div className="flex items-center gap-2 pl-1">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm sb-body"
            style={{ background: C.orangeSoft, color: C.orangeDeep }}
          >
            RK
          </div>
          <div className="hidden sm:block text-sm font-semibold sb-body" style={{ color: C.ink }}>
            Rohan
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Onboarding wizard                                                      */
/* ---------------------------------------------------------------------- */
const STEPS = ["Basic Details", "Shop Photos", "Preview", "Activate QR", "Payment", "Done"];

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
  const [step, setStep] = useState(resumeApplication ? 1 : 0);
  const [form, setForm] = useState(
    resumeApplication
      ? {
          shopName: resumeApplication.name || "",
          owner: resumeApplication.owner || "",
          phone: resumeApplication.phone || "",
          email: resumeApplication.email || "",
          address: resumeApplication.address || "",
          category: resumeApplication.category || "salon",
          hours: resumeApplication.hours || "9:00 AM – 9:00 PM (Mon–Sun)",
          services: resumeApplication.services || "Hair Cut, Hair Color, Facial, Bridal Makeup",
        }
      : {
          shopName: "",
          owner: "",
          phone: "",
          email: "",
          address: "",
          category: "salon",
          hours: "9:00 AM – 9:00 PM (Mon–Sun)",
          services: "Hair Cut, Hair Color, Facial, Bridal Makeup",
        }
  );
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
  const [assignedQr, setAssignedQr] = useState(null);
  const [method, setMethod] = useState("upi");
  const [errorMsg, setErrorMsg] = useState("");
  const [txnId] = useState(() => "SBP" + Math.floor(60000000 + Math.random() * 9000000));
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraFor, setCameraFor] = useState(null); // "front" | "inside" | null

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

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

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const appId = serverAppId;
      const result = await markApplicationPaid(appId, txnId, 499, method);
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
            <div className="flex gap-2 mb-6">
              {[
                { k: "salon", label: "Salon", Icon: Scissors },
                { k: "medical", label: "Hospital / Medical", Icon: Stethoscope },
              ].map((c) => (
                <button
                  key={c.k}
                  onClick={() => set("category")(c.k)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold sb-body"
                  style={{
                    background: form.category === c.k ? C.navy : C.sky,
                    color: form.category === c.k ? C.white : C.slate,
                  }}
                >
                  <c.Icon size={16} />
                  {c.label}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField label="Shop name" icon={Store} value={form.shopName} onChange={set("shopName")} placeholder="Glow & Style Salon" />
              <TextField label="Owner name" icon={User} value={form.owner} onChange={set("owner")} placeholder="Priya Sharma" />
              <TextField label="Mobile number" icon={Phone} value={form.phone} onChange={set("phone")} placeholder="98765 43210" />
              <TextField label="Email address" icon={Mail} value={form.email} onChange={set("email")} placeholder="owner@business.in" />
            </div>
            <div className="mt-4">
              <TextField label="Shop address" icon={MapPin} value={form.address} onChange={set("address")} placeholder="Shop No. 12, Station Road, Begusarai" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <TextField label="Business hours" icon={Clock} value={form.hours} onChange={set("hours")} />
              <TextField label="Services offered" icon={ListChecks} value={form.services} onChange={set("services")} />
            </div>
            <div className="flex justify-end mt-8">
              <PrimaryButton icon={ArrowRight} onClick={() => setStep(1)}>
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
              title="Add shop photos"
              sub="Clear, real photos of the shop front and interior for verification."
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
            <div className="flex justify-between mt-8">
              <GhostButton icon={ChevronLeft} onClick={() => setStep(0)}>
                Back
              </GhostButton>
              <PrimaryButton icon={ArrowRight} onClick={() => setStep(2)} disabled={uploadingFront || uploadingInside}>
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
            <PreviewRow label="Shop name" value={form.shopName || "—"} />
            <PreviewRow label="Owner" value={form.owner || "—"} />
            <PreviewRow label="Mobile" value={form.phone || "—"} />
            <PreviewRow label="Email" value={form.email || "—"} />
            <PreviewRow label="Address" value={form.address || "—"} />
            <PreviewRow label="Hours" value={form.hours} />
            <PreviewRow label="Services" value={form.services} last />
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
                      onClick={handleAssign}
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
              <div className="text-xs sb-body self-center" style={{ color: C.slateLight }}>
                Try <span className="sb-mono font-semibold" style={{ color: C.slate }}>QR-SB-000001</span> for a demo
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
                ₹499
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
              {submitting ? "Confirming payment..." : "Pay ₹499 and activate"}
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
                <Row k="Amount paid" v="₹499" last={!paymentResult?.partner_id} />
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
                    category: "salon",
                    hours: "9:00 AM – 9:00 PM (Mon–Sun)",
                    services: "Hair Cut, Hair Color, Facial, Bridal Makeup",
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
  const [tab, setTab] = useState("salon");
  const [query, setQuery] = useState("");

  const filtered = applications.filter(
    (a) => a.category === tab && a.name.toLowerCase().includes(query.toLowerCase())
  );

  const counts = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-7">
        <StatCard label="Total applications" value={counts.total} tone="navy" />
        <StatCard label="Pending review" value={counts.pending} tone="amber" />
        <StatCard label="Approved" value={counts.approved} tone="success" />
        <StatCard label="Rejected" value={counts.rejected} tone="danger" />
      </div>

      <div className="flex items-center gap-2 mb-5">
        {[
          { k: "salon", label: "Salon", Icon: Scissors, n: applications.filter((a) => a.category === "salon").length },
          { k: "medical", label: "Hospital / Medical", Icon: Stethoscope, n: applications.filter((a) => a.category === "medical").length },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold sb-body"
            style={{
              background: tab === t.k ? C.navy : C.white,
              color: tab === t.k ? C.white : C.slate,
              border: `1px solid ${tab === t.k ? C.navy : C.line}`,
            }}
          >
            <t.Icon size={15} /> {t.label} ({t.n})
          </button>
        ))}
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
              {a.category === "salon" ? <Scissors size={18} color={C.navy} /> : <Stethoscope size={18} color={C.navy} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold sb-body text-sm" style={{ color: C.ink }}>{a.name}</div>
              <div className="text-xs sb-body mt-0.5" style={{ color: C.slateLight }}>
                {a.owner} · {a.phone} · {a.city} · {a.date}
              </div>
              {a.qr && (
                <div className="text-xs sb-mono font-semibold mt-1" style={{ color: C.success }}>
                  {a.qr} linked
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StatusPill status={a.status} />
              <button
                onClick={() => onOpenApplication(a)}
                className="text-xs font-bold sb-body px-4 py-2.5 rounded-lg flex items-center gap-1.5"
                style={{ background: C.navy, color: C.white }}
              >
                Open Application
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-sm sb-body" style={{ color: C.slateLight }}>
            No applications match this search.
          </div>
        )}
      </div>
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

  const refreshAll = async () => {
    await Promise.all([refreshApplications(), refreshQrBank()]);
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
    applications: { title: "Applications", sub: "Review submissions from the SlotB partner app." },
    qrbank: { title: "QR bank", sub: "Every printed QR code and the shop it's permanently mapped to." },
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

  return (
    <div className="min-h-screen flex sb-body" style={{ background: C.sky }}>
      {FONTS}
      <Sidebar
        area={area}
        setArea={goToNewOnboarding}
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
          { k: "qrbank", label: "QR Bank", Icon: QrCode },
        ].map((n) => (
          <button
            key={n.k}
            onClick={() => (n.k === "onboard" ? goToNewOnboarding() : (setResumeApp(null), setArea(n.k)))}
            className="flex-1 flex flex-col items-center gap-1 py-2.5"
            style={{ color: area === n.k ? C.orange : "#8B93B8" }}
          >
            <n.Icon size={18} />
            <span className="text-[10px] sb-body">{n.label}</span>
          </button>
        ))}
      </div>

      <main className="flex-1 px-5 sm:px-10 py-8 pb-24 md:pb-8 max-w-6xl">
        <TopBar title={currentTitle.title} sub={currentTitle.sub} />

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
                onApplicationsChanged={refreshApplications}
                onQrBankChanged={refreshQrBank}
              />
            )}
            {area === "applications" && (
              <ApplicationsArea applications={applications} onOpenApplication={openApplication} />
            )}
            {area === "qrbank" && (
              <QrBankArea qrBank={qrBank} applications={applications} onDataChanged={refreshAll} />
            )}
          </>
        )}
      </main>
    </div>
  );
}