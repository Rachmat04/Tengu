/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Emergency lockdown module
 * ============================================================================
 * PURPOSE:
 * Provides the emergency lockdown control. Tengu reads a script page on
 * id.wikipedia.org as plain text (it is never executed) and looks for one line:
 *   TENGU_LOCKDOWN = true;   (lockdown active)
 *   TENGU_LOCKDOWN = false;  (lockdown inactive)
 * While the lockdown is active, only the maintainer account can use Tengu. If
 * the status cannot be verified (network error, missing page, or no valid flag
 * line), Tengu is blocked for everyone except the maintainer.
 * Consumed by Tengu.js; exposes window.TenguEmergency.create(deps).
 *
 * The module depends only on the MediaWiki globals (mw) and the helpers passed
 * in by Tengu.js: createDialog(opts) and makeBtn(label, variant). create(deps)
 * returns an object containing LOCKDOWN_MAINTAINER, getLockdownState(fresh),
 * lockdownPermits(state) and ensureTenguAllowed(fresh).
 *
 * The lockdown flag page (Pengguna:Rachmat04/Tengu-lockdown.js) is separate
 * from this module and is not changed.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguEmergency = {
    create: function (deps) {
      const createDialog = deps.createDialog;
      const makeBtn = deps.makeBtn;

      const LOCKDOWN_MAINTAINER = "Rachmat04";
      const LOCKDOWN_API = "https://id.wikipedia.org/w/api.php";
      const LOCKDOWN_PAGE = "Pengguna:Rachmat04/Tengu-lockdown.js";

      // Reads the lockdown flag from the on-wiki page. Resolves to
      // "allowed", "locked", or "unverified". The maintainer check is
      // applied separately in fetchLockdownState() below.
      async function fetchLockdownFlag() {
        let timer = null;
        try {
          const controller =
            typeof AbortController === "function"
              ? new AbortController()
              : null;
          if (controller) {
            timer = setTimeout(function () {
              controller.abort();
            }, 10000);
          }
          const url =
            LOCKDOWN_API +
            "?action=query&prop=revisions&rvprop=content&rvslots=main" +
            "&format=json&formatversion=2&origin=*&maxage=0&smaxage=0" +
            "&titles=" +
            encodeURIComponent(LOCKDOWN_PAGE);
          const res = await fetch(
            url,
            Object.assign(
              { cache: "no-store" },
              controller ? { signal: controller.signal } : {},
            ),
          );
          if (!res.ok) return "unverified";
          const json = await res.json();
          const page = json && json.query && json.query.pages;
          const rev =
            page &&
            page[0] &&
            !page[0].missing &&
            page[0].revisions &&
            page[0].revisions[0];
          const content =
            rev && rev.slots && rev.slots.main && rev.slots.main.content;
          if (typeof content !== "string") return "unverified";
          // Only the first matching line is read. Comment lines start with
          // "//" and do not match.
          const m = content.match(
            /^[ \t]*(?:var[ \t]+)?TENGU_LOCKDOWN[ \t]*=[ \t]*(true|false)[ \t]*;?[ \t]*(?:\/\/.*)?$/m,
          );
          if (!m) return "unverified";
          return m[1] === "true" ? "locked" : "allowed";
        } catch (e) {
          return "unverified";
        } finally {
          if (timer) clearTimeout(timer);
        }
      }

      // Resolves to "allowed", "locked", "unverified", or
      // "maintainer-active". The last value means the lockdown is active
      // but the current user is the maintainer, who may still use Tengu.
      // Regular users never receive it. A maintainer whose status cannot
      // be verified keeps the previous behaviour ("allowed").
      async function fetchLockdownState() {
        const flag = await fetchLockdownFlag();
        if (mw.config.get("wgUserName") === LOCKDOWN_MAINTAINER) {
          return flag === "locked" ? "maintainer-active" : "allowed";
        }
        return flag;
      }

      // True when the given state lets the current user use Tengu.
      function lockdownPermits(state) {
        return state === "allowed" || state === "maintainer-active";
      }

      // Cached for the page session. Pass fresh = true to re-check.
      let lockdownPromise = null;
      function getLockdownState(fresh) {
        if (fresh || !lockdownPromise) {
          lockdownPromise = fetchLockdownState();
        }
        return lockdownPromise;
      }

      function showLockdownDialog(state) {
        const isLocked = state === "locked";
        const { overlay, body, footer } = createDialog({
          title: isLocked
            ? "Tengu is temporarily disabled"
            : "Tengu is unavailable",
          icon: "🔒",
          child: true,
        });
        const p1 = document.createElement("p");
        p1.style.margin = "0 0 8px 0";
        const p2 = document.createElement("p");
        p2.style.margin = "0";
        if (isLocked) {
          p1.innerHTML =
            "<b>Tengu has been temporarily disabled by its maintainer.</b>";
          p2.textContent =
            "An emergency lockdown is active. Tengu cannot be used until the maintainer lifts it. Please try again later. No action was taken.";
        } else {
          p1.innerHTML =
            "<b>Tengu could not confirm that its emergency lockdown is inactive.</b>";
          p2.textContent =
            "Tengu has been blocked as a precaution. Check your connection and try again. If this continues, contact Rachmat04. No action was taken.";
        }
        body.appendChild(p1);
        body.appendChild(p2);
        const btnClose = makeBtn("Close", "primary");
        btnClose.addEventListener("click", function () {
          overlay.closeHandler();
        });
        footer.appendChild(btnClose);
      }

      // Returns true when Tengu may run. Otherwise shows the lockdown
      // dialogue and returns false.
      async function ensureTenguAllowed(fresh) {
        const state = await getLockdownState(fresh);
        if (lockdownPermits(state)) return true;
        showLockdownDialog(state);
        return false;
      }

      return {
        LOCKDOWN_MAINTAINER: LOCKDOWN_MAINTAINER,
        getLockdownState: getLockdownState,
        lockdownPermits: lockdownPermits,
        ensureTenguAllowed: ensureTenguAllowed,
      };
    },
  };
})();
// </nowiki>
