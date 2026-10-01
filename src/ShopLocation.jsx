import React, { useEffect, useRef, useState } from "react";
import { LocateFixed, Loader2, MapPin, RefreshCw, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";

/**
 * ShopLocationPicker
 * ---------------------------------------------------------------------
 * Dukaan pe khade hokar live GPS location lena + map pe pin.
 *  - "Use live location" -> phone ka GPS (high accuracy), jitna sahi signal
 *    milta jaaye utna pin sahi jagah aata jaata hai (live).
 *  - Pin ko khiska sakte hain, ya map pe tap karke pin laga sakte hain.
 *  - OpenStreetMap (free) — koi API key nahi.
 *
 * value    : { lat, lng, accuracy, source: "gps" | "pin" } | null
 * onChange : (value) => void
 * onAddress: (fullAddressText) => void   ("Address me bharein" ke liye)
 * autoFillAddress: true ho to address khaali hone par apne aap bhar deta hai
 * ---------------------------------------------------------------------
 */

const API_BASE = "https://slotb.in";
const DEFAULT_CENTER = [25.4182, 86.1272]; // Begusarai
const GOOD_ACCURACY = 20; // metre — itna sahi mil gaya to GPS band
const MAX_WATCH_MS = 30000;

const T = {
  navy: "#0B1642",
  ink: "#0F1730",
  orange: "#FF6A1A",
  sky: "#F1F5FC",
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

let leafletPromise = null;
function loadLeaflet() {
  if (typeof window !== "undefined" && window.L) return Promise.resolve(window.L);
  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      if (!document.getElementById("leaflet-css")) {
        const css = document.createElement("link");
        css.id = "leaflet-css";
        css.rel = "stylesheet";
        css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(css);
      }
      const s = document.createElement("script");
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.async = true;
      s.onload = () => (window.L ? resolve(window.L) : reject(new Error("Map load nahi hua")));
      s.onerror = () => {
        leafletPromise = null;
        reject(new Error("Map load nahi hua — internet check karein"));
      };
      document.head.appendChild(s);
    });
  }
  return leafletPromise;
}

function pinIcon(L) {
  return L.divIcon({
    className: "",
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 1C8.2 1 1 8 1 16.7 1 28.5 17 43 17 43s16-14.5 16-26.3C33 8 25.8 1 17 1z" fill="${T.navy}" stroke="#fff" stroke-width="2"/>
      <circle cx="17" cy="16.5" r="6" fill="${T.orange}"/></svg>`,
  });
}

function accTone(acc) {
  if (acc == null) return { color: T.slate, bg: T.sky, text: "Pin se lagaya gaya" };
  if (acc <= 30) return { color: T.success, bg: T.successSoft, text: `Sahi location · ±${acc} m` };
  if (acc <= 100) return { color: T.amber, bg: T.amberSoft, text: `Theek-thaak · ±${acc} m` };
  return { color: T.danger, bg: T.dangerSoft, text: `Kamzor signal · ±${acc} m` };
}

export default function ShopLocationPicker({ value, onChange, onAddress, autoFillAddress }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const watchRef = useRef(null);
  const timerRef = useRef(null);
  const bestRef = useRef(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [mapErr, setMapErr] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [gpsErr, setGpsErr] = useState("");
  const [geo, setGeo] = useState(null); // { label, full }
  const [geoBusy, setGeoBusy] = useState(false);
  const autoFilledRef = useRef(false);

  /* ---------- map setup ---------- */
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        const start = valueRef.current ? [valueRef.current.lat, valueRef.current.lng] : DEFAULT_CENTER;
        const map = L.map(mapEl.current, { zoomControl: true, attributionControl: true }).setView(
          start,
          valueRef.current ? 18 : 13
        );
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(map);

        map.on("click", (e) => {
          stopWatch();
          setGpsErr("");
          onChangeRef.current({ lat: +e.latlng.lat.toFixed(7), lng: +e.latlng.lng.toFixed(7), accuracy: null, source: "pin" });
        });

        mapRef.current = map;
        setMapReady(true);
        // container size settle hone ke baad
        setTimeout(() => map.invalidateSize(), 200);
      })
      .catch((e) => !cancelled && setMapErr(e.message));
    return () => {
      cancelled = true;
      stopWatch();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- value -> marker + accuracy circle ---------- */
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map || !mapReady) return;
    if (!value) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }
      return;
    }
    const ll = [value.lat, value.lng];
    if (!markerRef.current) {
      markerRef.current = L.marker(ll, { draggable: true, icon: pinIcon(L) }).addTo(map);
      markerRef.current.on("dragend", () => {
        stopWatch();
        setGpsErr("");
        const p = markerRef.current.getLatLng();
        onChangeRef.current({ lat: +p.lat.toFixed(7), lng: +p.lng.toFixed(7), accuracy: null, source: "pin" });
      });
    } else {
      markerRef.current.setLatLng(ll);
    }
    if (value.accuracy != null) {
      if (!circleRef.current) {
        circleRef.current = L.circle(ll, {
          radius: value.accuracy,
          color: T.navy,
          weight: 1,
          fillColor: T.navy,
          fillOpacity: 0.08,
        }).addTo(map);
      } else {
        circleRef.current.setLatLng(ll).setRadius(value.accuracy);
      }
    } else if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }
    if (value.source === "gps") map.setView(ll, Math.max(map.getZoom(), 17));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng, value?.accuracy, mapReady]);

  /* ---------- reverse geocode (thoda ruk kar) ---------- */
  useEffect(() => {
    if (!value) {
      setGeo(null);
      return;
    }
    let alive = true;
    const t = setTimeout(async () => {
      setGeoBusy(true);
      try {
        const res = await fetch(`${API_BASE}/api_location.php?action=reverse&lat=${value.lat}&lng=${value.lng}`);
        const d = await res.json();
        if (!alive) return;
        if (d.status === "ok") {
          setGeo({ label: d.label, full: d.full });
          if (autoFillAddress && !autoFilledRef.current && d.full) {
            autoFilledRef.current = true;
            onAddress?.(d.full);
          }
        } else {
          setGeo(null);
        }
      } catch {
        if (alive) setGeo(null);
      } finally {
        if (alive) setGeoBusy(false);
      }
    }, 900);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  /* ---------- live GPS ---------- */
  function stopWatch() {
    if (watchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    clearTimeout(timerRef.current);
    setTracking(false);
  }

  function startGps() {
    setGpsErr("");
    if (!("geolocation" in navigator)) {
      setGpsErr("Is browser me location support nahi hai. Map pe tap karke pin lagaiye.");
      return;
    }
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      setGpsErr("Location sirf https site pe milti hai.");
      return;
    }
    stopWatch();
    bestRef.current = null;
    setTracking(true);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = Math.round(pos.coords.accuracy || 0);
        const best = bestRef.current;
        if (!best || acc <= best.accuracy) {
          const next = {
            lat: +pos.coords.latitude.toFixed(7),
            lng: +pos.coords.longitude.toFixed(7),
            accuracy: acc,
            source: "gps",
          };
          bestRef.current = next;
          onChangeRef.current(next);
        }
        if (acc <= GOOD_ACCURACY) stopWatch();
      },
      (err) => {
        stopWatch();
        if (err.code === 1) {
          setGpsErr(
            "Location ki permission band hai. Browser ke address bar me lock icon dabakar Location ko Allow karein, phir dobara try karein — ya map pe tap karke pin lagaiye."
          );
        } else if (err.code === 3) {
          setGpsErr(
            bestRef.current
              ? ""
              : "GPS signal nahi mila. Dukaan ke bahar khule me aakar dobara try karein, ya map pe pin lagaiye."
          );
        } else {
          setGpsErr("Location nahi mil paayi. Phone ki Location (GPS) on karke dobara try karein.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
    timerRef.current = setTimeout(stopWatch, MAX_WATCH_MS);
  }

  const tone = value ? accTone(value.accuracy) : null;

  return (
    <div>
      <label className="text-xs font-semibold sb-body block mb-1.5" style={{ color: T.slate }}>
        Shop location (map)
      </label>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.line}` }}>
        <div className="relative" style={{ height: 260, background: T.sky, isolation: "isolate", zIndex: 0 }}>
          <div ref={mapEl} style={{ position: "absolute", inset: 0, zIndex: 0 }} data-testid="shop-map" />
          {!mapReady && !mapErr && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs sb-body" style={{ color: T.slateLight }}>
              <Loader2 size={14} className="animate-spin" /> Map load ho raha hai…
            </div>
          )}
          {mapErr && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs sb-body" style={{ color: T.danger }}>
              {mapErr}
            </div>
          )}
        </div>

        <div className="p-3.5 flex flex-col gap-3" style={{ background: T.white }}>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startGps}
              disabled={tracking}
              className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold sb-body"
              style={{ background: T.navy, color: T.white, opacity: tracking ? 0.75 : 1 }}
            >
              {tracking ? <Loader2 size={16} className="animate-spin" /> : value?.source === "gps" ? <RefreshCw size={16} /> : <LocateFixed size={16} />}
              {tracking ? "Live GPS le rahe hain…" : value?.source === "gps" ? "Location refresh karein" : "Use live location"}
            </button>
            {tracking && (
              <button
                type="button"
                onClick={stopWatch}
                className="rounded-xl px-4 py-3 text-sm font-semibold sb-body"
                style={{ background: T.white, color: T.navy, border: `1px solid ${T.line}` }}
              >
                Yahi theek hai
              </button>
            )}
          </div>

          {value ? (
            <div className="rounded-xl px-3.5 py-2.5 flex items-start gap-2.5" style={{ background: tone.bg }}>
              {value.accuracy != null && value.accuracy > 100 ? (
                <AlertTriangle size={16} color={tone.color} className="mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 size={16} color={tone.color} className="mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold sb-body" style={{ color: tone.color }}>
                  {tone.text}
                  {tracking ? " · sudhar raha hai" : ""}
                </div>
                <div className="text-xs sb-body mt-0.5" style={{ color: T.ink }}>
                  {geoBusy ? "Address dhoondh rahe hain…" : geo?.full || geo?.label || `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  <a
                    href={`https://www.google.com/maps?q=${value.lat},${value.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold sb-body"
                    style={{ color: T.navy }}
                  >
                    <ExternalLink size={12} /> Map me dekhein
                  </a>
                  {geo?.full && onAddress && (
                    <button
                      type="button"
                      onClick={() => onAddress(geo.full)}
                      className="inline-flex items-center gap-1 text-xs font-semibold sb-body"
                      style={{ color: T.orange }}
                    >
                      <MapPin size={12} /> Address me bharein
                    </button>
                  )}
                </div>
                {value.accuracy != null && value.accuracy > 50 && !tracking && (
                  <div className="text-[11px] sb-body mt-1.5" style={{ color: T.slate }}>
                    Pin dukaan ke darwaze par nahi hai to use khiskakar sahi jagah rakhiye.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs sb-body" style={{ color: T.slate }}>
              Dukaan ke andar ya darwaze par khade hokar <b>Use live location</b> dabaiye. GPS na chale to map pe tap karke pin lagaiye.
            </div>
          )}

          {gpsErr && (
            <div className="rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 text-xs sb-body" style={{ background: T.dangerSoft, color: T.danger }}>
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              {gpsErr}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
