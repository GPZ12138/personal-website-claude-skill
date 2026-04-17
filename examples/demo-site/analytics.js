/* Peizhong Gao — lightweight visit tracker.
 *
 * Runs on every page load. Stores up to 500 visits in localStorage so the
 * admin dashboard (admin/) can read them. If window.PG_ANALYTICS_BACKEND
 * is set (e.g., to a deployed Cloudflare Worker endpoint), visits are also
 * POSTed to {backend}/beacon so they aggregate across visitors.
 *
 * Respects Do-Not-Track: if the visitor has DNT enabled, this file records
 * nothing and makes no network calls.
 */

(() => {
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;

  const CFG = {
    backend:    window.PG_ANALYTICS_BACKEND || null,
    visitsKey:  "pg-visits",
    visitorKey: "pg-visitor",
    sessionKey: "pg-session",
    maxLocal:   500,
    geoUrl:     "https://ipwho.is/",
  };

  const uuid = () =>
    crypto.randomUUID?.() ||
    ("xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }));

  const safeGet = (store, key) => { try { return store.getItem(key); } catch { return null; } };
  const safeSet = (store, key, val) => { try { store.setItem(key, val); } catch {} };

  let visitorId = safeGet(localStorage, CFG.visitorKey);
  if (!visitorId) {
    visitorId = uuid();
    safeSet(localStorage, CFG.visitorKey, visitorId);
  }

  let sessionId = safeGet(sessionStorage, CFG.sessionKey);
  const isNewSession = !sessionId;
  if (!sessionId) {
    sessionId = uuid();
    safeSet(sessionStorage, CFG.sessionKey, sessionId);
  }

  const baseVisit = {
    id:             uuid(),
    ts:             new Date().toISOString(),
    visitor:        visitorId,
    session:        sessionId,
    isNewSession,
    path:           location.pathname + location.search,
    referrer:       document.referrer || null,
    ua:             navigator.userAgent,
    lang:           navigator.language || null,
    screen:         screen.width + "x" + screen.height,
    tzOffsetMin:    new Date().getTimezoneOffset(),
  };

  const fetchGeo = () =>
    fetch(CFG.geoUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

  const persistLocal = (visit) => {
    try {
      const raw = safeGet(localStorage, CFG.visitsKey);
      const list = raw ? JSON.parse(raw) : [];
      list.push(visit);
      if (list.length > CFG.maxLocal) list.splice(0, list.length - CFG.maxLocal);
      safeSet(localStorage, CFG.visitsKey, JSON.stringify(list));
    } catch {}
  };

  const sendBeacon = (visit) => {
    if (!CFG.backend) return;
    const url = CFG.backend.replace(/\/$/, "") + "/beacon";
    try {
      const body = JSON.stringify(visit);
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
          mode: "cors",
        }).catch(() => {});
      }
    } catch {}
  };

  fetchGeo().then((geo) => {
    const visit = {
      ...baseVisit,
      ip:          geo?.ip || null,
      country:     geo?.country || null,
      countryCode: geo?.country_code || null,
      region:      geo?.region || null,
      city:        geo?.city || null,
      asn:         geo?.connection?.asn || null,
      org:         geo?.connection?.org || null,
      isp:         geo?.connection?.isp || null,
      timezone:    geo?.timezone?.id || null,
    };
    persistLocal(visit);
    sendBeacon(visit);
  });
})();
