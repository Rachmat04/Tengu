/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Recently active admins module
 * ============================================================================
 * PURPOSE:
 * Provides the "Recently active admins & rights holders" dialogue. It lists
 * administrators and other advanced rights holders who were active within the
 * last 24 hours, sorted by most recent activity first.
 * Consumed by Tengu.js; exposes window.TenguActiveAdmins.create(deps).
 *
 * Recent changes and log events are each fetched in a single bulk query rather
 * than one query per user, so a user's most recent action could be missed if it
 * falls outside the latest 500 entries returned by either query on a very
 * active wiki.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
window.TenguActiveAdmins = {
  /**
   * Returns the function that opens the dialogue.
   *
   * @param {Object} deps  Helpers supplied by Tengu.js:
   *   createDialog(opts), makeBtn(label, variant), apiGet(params),
   *   foreignApiGet(params) and formatApiError(err).
   * @returns {Function}   Async function that builds and shows the dialogue.
   */
  create: function (deps) {
    const createDialog = deps.createDialog;
    const makeBtn = deps.makeBtn;
    const apiGet = deps.apiGet;
    const foreignApiGet = deps.foreignApiGet;
    const formatApiError = deps.formatApiError;

    return async function getActiveAdmins() {
      const { overlay, body, footer } = createDialog({
        title: "Recently active admins & rights holders",
        icon: "👮",
        child: true,
      });

      const loadingEl = document.createElement("div");
      loadingEl.className = "tng-info-loading";
      loadingEl.textContent =
        "Loading recently active administrators and rights holders...";
      body.appendChild(loadingEl);

      const btnClose = makeBtn("Close", "quiet");
      btnClose.addEventListener("click", () => overlay.closeHandler());
      footer.appendChild(btnClose);

      function fmtTimestamp(ts) {
        if (!ts) return "Unknown";
        const d = new Date(ts);
        if (isNaN(d.getTime())) return "Unknown";
        return d.toUTCString().replace("GMT", "UTC");
      }

      function fmtRelative(ts) {
        if (!ts) return "";
        const d = new Date(ts);
        if (isNaN(d.getTime())) return "";
        const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diffSec < 60) return "just now";
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60)
          return diffMin + " minute" + (diffMin !== 1 ? "s" : "") + " ago";
        const diffHr = Math.floor(diffMin / 60);
        return diffHr + " hour" + (diffHr !== 1 ? "s" : "") + " ago";
      }

      try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Local wiki groups considered "advanced rights" for this list.
        // Sysop is kept for backward compatibility with the original
        // "active administrators" feature.
        const LOCAL_RIGHT_BADGES = [
          {
            group: "sysop",
            label: "Sysop",
            cssClass: "tng-userright-sysop",
          },
          {
            group: "bureaucrat",
            label: "Bureaucrat",
            cssClass: "tng-userright-bureaucrat",
          },
          {
            group: "checkuser",
            label: "CheckUser",
            cssClass: "tng-userright-checkuser",
          },
          {
            group: "interface-admin",
            label: "Interface admin",
            cssClass: "tng-userright-interface-admin",
          },
        ];
        // Global (CentralAuth) groups, fetched from Meta-Wiki.
        const GLOBAL_RIGHT_BADGES = [
          {
            group: "global-sysop",
            label: "Global sysop",
            cssClass: "tng-userright-global-sysop",
          },
          {
            group: "steward",
            label: "Steward",
            cssClass: "tng-userright-steward",
          },
        ];

        // A failed group-membership fetch is treated as an empty list
        // (via .catch()) rather than aborting the whole feature, so
        // partial results are still shown if one group query fails.
        const localGroupPromises = LOCAL_RIGHT_BADGES.map(function (cfg) {
          return apiGet({
            action: "query",
            list: "allusers",
            augroup: cfg.group,
            aulimit: "max",
            formatversion: 2,
          })
            .then(function (data) {
              return {
                cfg,
                users: (data.query && data.query.allusers) || [],
              };
            })
            .catch(function () {
              return { cfg, users: [] };
            });
        });
        // list=globalallusers with agugroup has not been
        // independently confirmed against a live wiki
        const globalGroupPromises = GLOBAL_RIGHT_BADGES.map(function (cfg) {
          return foreignApiGet({
            action: "query",
            list: "globalallusers",
            agugroup: cfg.group,
            agulimit: "max",
            formatversion: 2,
          })
            .then(function (data) {
              return {
                cfg,
                users: (data.query && data.query.globalallusers) || [],
              };
            })
            .catch(function () {
              return { cfg, users: [] };
            });
        });

        const [localGroupResults, globalGroupResults, rcData, leData] =
          await Promise.all([
            Promise.all(localGroupPromises),
            Promise.all(globalGroupPromises),
            apiGet({
              action: "query",
              list: "recentchanges",
              rctype: "edit",
              rcprop: "user|timestamp",
              rcdir: "older",
              rcend: cutoff,
              rclimit: 500,
              formatversion: 2,
            }),
            apiGet({
              action: "query",
              list: "logevents",
              leprop: "user|timestamp",
              ledir: "older",
              leend: cutoff,
              lelimit: 500,
              formatversion: 2,
            }),
          ]);

        // Maps username -> array of { label, cssClass } badge descriptors,
        // one per matching right, so a user with multiple advanced rights
        // shows all applicable badges rather than only the first found.
        const userRightsMap = new Map();
        const addRightsToMap = function (results) {
          results.forEach(function (result) {
            result.users.forEach(function (u) {
              const name = u.name;
              if (!name) return;
              if (!userRightsMap.has(name)) userRightsMap.set(name, []);
              const list = userRightsMap.get(name);
              if (
                !list.some(function (r) {
                  return r.label === result.cfg.label;
                })
              ) {
                list.push({
                  label: result.cfg.label,
                  cssClass: result.cfg.cssClass,
                });
              }
            });
          });
        };
        addRightsToMap(localGroupResults);
        addRightsToMap(globalGroupResults);

        // Maps username -> latest ISO timestamp seen for that user, across
        // both the recent-changes and log-events queries.
        const latest = new Map();

        const considerActivity = function (user, timestamp) {
          if (!user || !timestamp || !userRightsMap.has(user)) return;
          const existing = latest.get(user);
          if (!existing || timestamp > existing) {
            latest.set(user, timestamp);
          }
        };

        const rcEntries = (rcData.query && rcData.query.recentchanges) || [];
        for (const e of rcEntries) considerActivity(e.user, e.timestamp);

        const leEntries = (leData.query && leData.query.logevents) || [];
        for (const e of leEntries) considerActivity(e.user, e.timestamp);

        const activeAdmins = Array.from(latest.entries())
          .map(function ([user, timestamp]) {
            return { user, timestamp };
          })
          .sort(function (a, b) {
            return b.timestamp.localeCompare(a.timestamp);
          });

        body.removeChild(loadingEl);

        if (!activeAdmins.length) {
          const emptyEl = document.createElement("div");
          emptyEl.className = "tng-info-empty";
          emptyEl.textContent =
            "No administrators or advanced rights holders appear to have been active within the last 24 hours.";
          body.appendChild(emptyEl);
          return;
        }

        for (const admin of activeAdmins) {
          const entry = document.createElement("div");
          entry.className = "tng-info-entry";
          entry.style.flexDirection = "row";
          entry.style.alignItems = "center";
          entry.style.justifyContent = "space-between";
          entry.style.gap = "8px";

          const infoWrap = document.createElement("div");
          const nameRow = document.createElement("div");
          nameRow.style.cssText =
            "display:flex;align-items:center;flex-wrap:wrap;gap:2px;";
          const link = document.createElement("a");
          link.href = mw.util.getUrl("User:" + admin.user);
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = admin.user;
          link.style.fontWeight = "700";
          nameRow.appendChild(link);
          // Renders every applicable right as its own badge, so a user
          // holding multiple advanced rights (e.g. sysop and CheckUser)
          // shows all of them rather than only the first match.
          const rightsForUser = userRightsMap.get(admin.user) || [];
          rightsForUser.forEach(function (r) {
            const badge = document.createElement("span");
            badge.className = "tng-userright-badge " + r.cssClass;
            badge.textContent = r.label;
            nameRow.appendChild(badge);
          });
          infoWrap.appendChild(nameRow);
          const tsLine = document.createElement("div");
          tsLine.className = "tng-help";
          tsLine.style.margin = "0";
          tsLine.textContent =
            fmtTimestamp(admin.timestamp) +
            " (" +
            fmtRelative(admin.timestamp) +
            ")";
          infoWrap.appendChild(tsLine);
          entry.appendChild(infoWrap);

          const actionsWrap = document.createElement("div");
          actionsWrap.style.cssText = "display:flex;gap:4px;flex-shrink:0;";

          const btnTalk = makeBtn("💬", "quiet");
          btnTalk.className += " tng-btn-sm";
          btnTalk.title = "Open user talk page in a new tab";
          btnTalk.addEventListener("click", function () {
            window.open(
              mw.util.getUrl("User talk:" + admin.user),
              "_blank",
              "noopener,noreferrer",
            );
          });
          actionsWrap.appendChild(btnTalk);

          const btnEmail = makeBtn("📧", "quiet");
          btnEmail.className += " tng-btn-sm";
          btnEmail.title = "Open Special:EmailUser in a new tab";
          btnEmail.addEventListener("click", function () {
            window.open(
              mw.util.getUrl("Special:EmailUser/" + admin.user),
              "_blank",
              "noopener,noreferrer",
            );
          });
          actionsWrap.appendChild(btnEmail);

          entry.appendChild(actionsWrap);
          body.appendChild(entry);
        }
      } catch (e) {
        body.removeChild(loadingEl);
        const errEl = document.createElement("div");
        errEl.className = "tng-log-err";
        errEl.style.padding = "6px 0";
        errEl.textContent =
          "⚠️ Failed to load recently active administrators and rights holders: " +
          formatApiError(e);
        body.appendChild(errEl);
      }
    };
  },
};
