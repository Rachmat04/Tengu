/**
 * ============================================================================
 * Tengu-userinfo.js
 * User info dialogue module for Tengu (天狗)
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguUserInfo = {
    create: function (deps) {
      const {
        createDialog,
        makeDisplaySection,
        makeBtn,
        apiGet,
        foreignApiGet,
        formatApiError,
      } = deps;

      // ============================================================================
      // Get user info (user mode)
      // Fetches and displays block log entries, access rights changes, and abuse
      // filter log entries for a target user in a read-only dialogue panel.
      // Collapsible sections are rendered in parallel; each fires its own API
      // request independently so a failure in one does not block the others.
      // ============================================================================
      return async function getUserInfo(username, isMultiTarget) {
        const { overlay, body, footer } = createDialog({
          title: "User info: " + username,
          icon: "🔍",
          child: true,
        });

        // Format an ISO timestamp as a human-readable UTC string.
        function fmtTimestamp(ts) {
          if (!ts) return "Unknown";
          if (ts === "infinity" || ts === "infinite" || ts === "never")
            return "Indefinite";
          const d = new Date(ts);
          if (isNaN(d.getTime())) return "Indefinite";
          return d.toUTCString().replace("GMT", "UTC");
        }

        // Return a relative time string for a given ISO timestamp, correctly
        // distinguishing past ("3 days ago") from future ("in 3 weeks")
        // timestamps.
        function fmtRelative(ts) {
          if (!ts) return "";
          const d = new Date(ts);
          if (isNaN(d.getTime())) return "";
          const rawDiffSec = Math.floor((d.getTime() - Date.now()) / 1000);
          const isFuture = rawDiffSec > 0;
          const diffSec = Math.abs(rawDiffSec);
          const suffix = function (n, unit) {
            const plural = unit + (n !== 1 ? "s" : "");
            return isFuture
              ? "in " + n + " " + plural
              : n + " " + plural + " ago";
          };
          if (diffSec < 60) return "just now";
          const diffMin = Math.floor(diffSec / 60);
          if (diffMin < 60) return suffix(diffMin, "minute");
          const diffHr = Math.floor(diffMin / 60);
          if (diffHr < 24) return suffix(diffHr, "hour");
          const diffDay = Math.floor(diffHr / 24);
          if (diffDay < 7) return suffix(diffDay, "day");
          if (diffDay < 30) {
            const diffWeek = Math.floor(diffDay / 7);
            return suffix(diffWeek, "week");
          }
          if (diffDay < 365) {
            const diffMonth = Math.max(1, Math.floor(diffDay / 30.4375));
            return suffix(diffMonth, "month");
          }
          const diffYear = Math.max(1, Math.round(diffDay / 365.25));
          return suffix(diffYear, "year");
        }

        // Build a bordered entry card with labelled rows. extraClass, if given, is
        // appended to the entry's class list.
        function makeEntry(rows, extraClass) {
          const entry = document.createElement("div");
          entry.className =
            "tng-info-entry" + (extraClass ? " " + extraClass : "");
          for (const [label, value] of rows) {
            const line = document.createElement("div");
            const b = document.createElement("b");
            b.textContent = label + ": ";
            line.appendChild(b);
            line.appendChild(document.createTextNode(value || "—"));
            entry.appendChild(line);
          }
          return entry;
        }

        function setLoading(container, msg) {
          container.innerHTML = "";
          const el = document.createElement("div");
          el.className = "tng-info-loading";
          el.textContent = msg || "Loading...";
          container.appendChild(el);
        }

        function setEmpty(container, msg) {
          container.innerHTML = "";
          const el = document.createElement("div");
          el.className = "tng-info-empty";
          el.textContent = msg || "No entries found.";
          container.appendChild(el);
        }

        function setError(container, msg) {
          container.innerHTML = "";
          const el = document.createElement("div");
          el.className = "tng-log-err";
          el.style.padding = "6px 0";
          el.textContent = "⚠ " + msg;
          container.appendChild(el);
        }

        // Build the display-only collapsible log sections
        const {
          section: secBlockLog,
          sectionBody: bodyBlockLog,
          arrow: arrowBlockLog,
        } = makeDisplaySection("Block log", "⛔️");
        const {
          section: secMoveLog,
          sectionBody: bodyMoveLog,
          arrow: arrowMoveLog,
        } = makeDisplaySection("Move log", "📑");
        const {
          section: secRights,
          sectionBody: bodyRights,
          arrow: arrowRights,
        } = makeDisplaySection("Rights changes", "🔐");
        const {
          section: secAbuseLog,
          sectionBody: bodyAbuseLog,
          arrow: arrowAbuseLog,
        } = makeDisplaySection("Abuse filter log", "🛑");

        setLoading(bodyBlockLog, "Loading block log...");
        setLoading(bodyMoveLog, "Loading move log...");
        setLoading(bodyRights, "Loading rights changes...");
        setLoading(bodyAbuseLog, "Loading abuse filter log...");

        const isTargetIP = mw.util.isIPAddress(username);
        const localWikiId =
          mw.config.get("wgDBname") ||
          mw.config.get("wgSiteName") ||
          "this wiki";

        // --- Account info section ---
        const isTargetTempAccount = /^~\d{4}-\d+-\d+$/.test(username);
        const {
          section: secAccountInfo,
          sectionBody: bodyAccountInfo,
          arrow: arrowAccountInfo,
        } = makeDisplaySection("Account info", "🛂");
        const accountInfoEntry = document.createElement("div");
        accountInfoEntry.className = "tng-info-entry";

        function makeAccountInfoRow(labelText) {
          const line = document.createElement("div");
          const lbl = document.createElement("b");
          lbl.textContent = labelText + ": ";
          const valueEl = document.createElement("span");
          valueEl.className = "tng-info-loading";
          valueEl.textContent = "Loading...";
          line.appendChild(lbl);
          line.appendChild(valueEl);
          accountInfoEntry.appendChild(line);
          return valueEl;
        }

        const localEditsBody = makeAccountInfoRow(
          "Local edits (" + localWikiId + ")",
        );
        const globalEditsBody = makeAccountInfoRow("Global edits");
        if (isTargetIP) {
          globalEditsBody.className = "tng-info-empty";
          globalEditsBody.textContent = "Not applicable for IP addresses.";
        }
        const registrationBody = makeAccountInfoRow("Registration date");
        const lastEditBody = makeAccountInfoRow("Last edit");
        const genderBody = isTargetIP ? null : makeAccountInfoRow("Gender");
        const previousNamesBody =
          isTargetIP || isTargetTempAccount
            ? null
            : makeAccountInfoRow("Previous usernames");

        // --- Account activity ---
        if (!isTargetIP) {
          const activityHeading = document.createElement("div");
          activityHeading.style.fontWeight = "bold";
          activityHeading.style.marginTop = "6px";
          activityHeading.textContent = "Account activity";
          accountInfoEntry.appendChild(activityHeading);

          const activityBody = document.createElement("div");
          activityBody.className = "tng-info-loading";
          activityBody.textContent = "Loading account activity...";
          accountInfoEntry.appendChild(activityBody);

          (async function () {
            if (isTargetTempAccount || isMultiTarget) {
              activityBody.className = "tng-info-empty";
              activityBody.textContent = isTargetTempAccount
                ? "Account activity is not available for temporary accounts."
                : "Account activity is not available when multiple targets are selected.";
              return;
            }
            try {
              const res = await fetch(
                "https://xtools.wmcloud.org/api/user/log_counts/" +
                  mw.config.get("wgServerName") +
                  "/" +
                  encodeURIComponent(username.replace(/ /g, "_")),
              );
              if (!res.ok) throw new Error("HTTP " + res.status);
              const json = await res.json();
              const counts = (json && json.log_counts) || null;
              if (!counts || typeof counts !== "object") {
                throw new Error("No log counts returned");
              }

              const sumKeys = function (keys) {
                return keys.reduce(function (total, key) {
                  return (
                    total + (typeof counts[key] === "number" ? counts[key] : 0)
                  );
                }, 0);
              };
              const reviewKeys = Object.keys(counts).filter(function (key) {
                return key.indexOf("review-") === 0;
              });

              const categories = [
                ["Pages created", sumKeys(["create-create"])],
                ["Pages deleted", sumKeys(["delete-delete"])],
                ["Pages restored", sumKeys(["delete-restore"])],
                ["Pages moved", sumKeys(["move-move", "move-move_redir"])],
                [
                  "Pages protected",
                  sumKeys(["protect-protect", "protect-modify"]),
                ],
                ["Pages unprotected", sumKeys(["protect-unprotect"])],
                [
                  "Users blocked",
                  sumKeys(["block-block", "block-reblock", "block-unblock"]),
                ],
                ["Rights changes", sumKeys(["rights-rights"])],
                ["Patrols", sumKeys(["patrol-patrol"])],
                ["Reviews", sumKeys(reviewKeys)],
              ].filter(function (c) {
                return c[1] > 0;
              });

              if (!categories.length) {
                activityBody.className = "tng-info-empty";
                activityBody.textContent = "No logged actions found.";
                return;
              }

              const activityList = document.createElement("ul");
              activityList.style.margin = "0";
              activityList.style.paddingLeft = "20px";
              categories.forEach(function (c) {
                const item = document.createElement("li");
                const b = document.createElement("b");
                b.textContent = c[0] + ": ";
                item.appendChild(b);
                item.appendChild(
                  document.createTextNode(c[1].toLocaleString()),
                );
                activityList.appendChild(item);
              });
              activityBody.replaceWith(activityList);
            } catch (err) {
              activityBody.className = "tng-info-empty";
              activityBody.textContent = "Account activity is unavailable.";
            }
          })();
        }

        bodyAccountInfo.appendChild(accountInfoEntry);
        bodyAccountInfo.classList.remove("tng-hidden");
        arrowAccountInfo.classList.add("tng-arrow-up");
        body.appendChild(secAccountInfo);

        // --- SUL info section ---
        const {
          section: secSul,
          sectionBody: bodySul,
          arrow: arrowSul,
        } = makeDisplaySection("SUL info", "🖥️");
        body.appendChild(secSul);

        (async function () {
          if (isTargetIP) {
            setEmpty(bodySul, "Not applicable for IP addresses.");
            return;
          }
          if (isTargetTempAccount) {
            setEmpty(
              bodySul,
              "SUL info is not available for temporary accounts.",
            );
            return;
          }
          setLoading(bodySul, "Loading SUL info...");
          try {
            const data = await apiGet({
              action: "query",
              meta: "globaluserinfo",
              guiuser: username,
              guiprop: "merged",
            });
            const gui = data.query && data.query.globaluserinfo;
            if (!gui || gui.missing !== undefined) {
              setEmpty(bodySul, "No global account found.");
              return;
            }
            const merged = Array.isArray(gui.merged) ? gui.merged : [];
            const wikis = merged.filter(function (m) {
              return m && typeof m.wiki === "string" && m.wiki;
            });
            if (!wikis.length) {
              setEmpty(bodySul, "No attached wikis found.");
              return;
            }
            const homeWiki = typeof gui.home === "string" ? gui.home : null;
            const globalName =
              typeof gui.name === "string" && gui.name ? gui.name : username;
            wikis.sort(function (a, b) {
              return a.wiki.localeCompare(b.wiki);
            });

            const sulEntry = document.createElement("div");
            sulEntry.className = "tng-info-entry";
            const sulLine = document.createElement("div");
            const sulLabel = document.createElement("b");
            sulLabel.textContent = "Attached wikis (" + wikis.length + "): ";
            sulLine.appendChild(sulLabel);

            wikis.forEach(function (w, i) {
              if (i > 0) sulLine.appendChild(document.createTextNode(" · "));
              if (typeof w.url === "string" && /^https?:\/\//i.test(w.url)) {
                const wikiUserName =
                  typeof w.username === "string" && w.username
                    ? w.username
                    : globalName;
                const link = document.createElement("a");
                link.href =
                  w.url.replace(/\/+$/, "") +
                  "/wiki/User:" +
                  encodeURIComponent(wikiUserName.replace(/ /g, "_"));
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = w.wiki;
                sulLine.appendChild(link);
              } else {
                sulLine.appendChild(document.createTextNode(w.wiki));
              }
              if (homeWiki && w.wiki === homeWiki) {
                const homeBadge = document.createElement("span");
                homeBadge.className = "tng-sul-home-badge";
                homeBadge.textContent = "🏠";
                homeBadge.title = "Home wiki (where the account was created)";
                sulLine.appendChild(homeBadge);
              }
            });

            sulEntry.appendChild(sulLine);
            bodySul.innerHTML = "";
            bodySul.appendChild(sulEntry);
            bodySul.classList.remove("tng-hidden");
            arrowSul.classList.add("tng-arrow-up");
          } catch (err) {
            setError(
              bodySul,
              "Failed to load SUL info: " + formatApiError(err),
            );
          }
        })();

        // --- Access rights card ---
        const rightsCard = document.createElement("div");
        rightsCard.className = "tng-user-rights-card";

        const rightsCardHdr = document.createElement("div");
        rightsCardHdr.className = "tng-user-rights-header";
        const rightsCardHdrTitle = document.createElement("span");
        rightsCardHdrTitle.textContent = "🎩 Access rights";
        rightsCardHdr.appendChild(rightsCardHdrTitle);
        const rightsCardArrow = document.createElement("span");
        rightsCardArrow.className = "tng-section-arrow tng-arrow-up";
        rightsCardHdr.appendChild(rightsCardArrow);
        rightsCardHdr.addEventListener("click", function () {
          const isHidden = rightsCardBody.classList.toggle("tng-hidden");
          rightsCardArrow.classList.toggle("tng-arrow-up", !isHidden);
        });
        rightsCard.appendChild(rightsCardHdr);

        const rightsCardBody = document.createElement("div");
        rightsCardBody.className = "tng-user-rights-body";
        rightsCard.appendChild(rightsCardBody);

        // Local groups/rights row
        const localRow = document.createElement("div");
        localRow.className = "tng-user-rights-row";
        const localScope = document.createElement("div");
        localScope.className = "tng-user-rights-scope";
        localScope.textContent = "Local — " + localWikiId;
        localRow.appendChild(localScope);
        const localBadgesEl = document.createElement("div");
        localBadgesEl.className = "tng-user-rights-badges";
        const localLoadingEl = document.createElement("span");
        localLoadingEl.className = "tng-info-loading";
        localLoadingEl.textContent = "Loading...";
        localBadgesEl.appendChild(localLoadingEl);
        localRow.appendChild(localBadgesEl);
        const localRightsListEl = document.createElement("div");
        localRightsListEl.className = "tng-user-rights-list tng-hidden";
        localRow.appendChild(localRightsListEl);
        rightsCardBody.appendChild(localRow);

        const rightsHr = document.createElement("hr");
        rightsHr.className = "tng-user-rights-divider";
        rightsCardBody.appendChild(rightsHr);

        // Global groups/rights row
        const globalRow = document.createElement("div");
        globalRow.className = "tng-user-rights-row";
        const globalScope = document.createElement("div");
        globalScope.className = "tng-user-rights-scope";
        globalScope.textContent = "Global (Wikimedia / CentralAuth)";
        globalRow.appendChild(globalScope);
        const globalBadgesEl = document.createElement("div");
        globalBadgesEl.className = "tng-user-rights-badges";
        const globalLoadingEl = document.createElement("span");
        globalLoadingEl.className = isTargetIP
          ? "tng-info-empty"
          : "tng-info-loading";
        globalLoadingEl.textContent = isTargetIP
          ? "Not applicable for IP addresses."
          : "Loading...";
        globalBadgesEl.appendChild(globalLoadingEl);
        globalRow.appendChild(globalBadgesEl);
        const globalRightsListEl = document.createElement("div");
        globalRightsListEl.className = "tng-user-rights-list tng-hidden";
        globalRow.appendChild(globalRightsListEl);
        rightsCardBody.appendChild(globalRow);

        const globalLockHr = document.createElement("hr");
        globalLockHr.className = "tng-user-rights-divider";
        rightsCardBody.appendChild(globalLockHr);

        // Global lock / block status row
        const globalLockRow = document.createElement("div");
        globalLockRow.className = "tng-user-rights-row";
        const globalLockScope = document.createElement("div");
        globalLockScope.className = "tng-user-rights-scope";
        globalLockScope.textContent = isTargetIP
          ? "Global block"
          : "Global lock / block";
        globalLockRow.appendChild(globalLockScope);
        const globalLockBadgesEl = document.createElement("div");
        globalLockBadgesEl.className = "tng-user-rights-badges";
        const globalLockLoadingEl = document.createElement("span");
        globalLockLoadingEl.className = "tng-info-loading";
        globalLockLoadingEl.textContent = "Loading...";
        globalLockBadgesEl.appendChild(globalLockLoadingEl);
        globalLockRow.appendChild(globalLockBadgesEl);
        rightsCardBody.appendChild(globalLockRow);

        body.insertBefore(rightsCard, secSul);

        function renderTargetRights(
          badgesEl,
          rightsListEl,
          groups,
          rights,
          scopeLabel,
        ) {
          badgesEl.innerHTML = "";
          if (!groups || !groups.length) {
            const none = document.createElement("span");
            none.className = "tng-rights-badge tng-rights-badge-none";
            none.textContent = "No " + scopeLabel + " groups";
            badgesEl.appendChild(none);
          } else {
            for (const g of groups) {
              const b = document.createElement("span");
              b.className = "tng-rights-badge tng-rights-badge-group";
              b.textContent = g;
              badgesEl.appendChild(b);
            }
          }
          if (rights && rights.length) {
            rightsListEl.textContent = "Rights: " + rights.join(", ");
            rightsListEl.classList.remove("tng-hidden");
          }
        }

        function appendReasonLine(container, label, reason) {
          const el = document.createElement("div");
          el.className = "tng-user-rights-list";
          const b = document.createElement("b");
          b.textContent = label + " reason: ";
          el.appendChild(b);
          el.appendChild(document.createTextNode(reason));
          container.appendChild(el);
        }

        // Local rights, edit count, registration date, gender, and active block
        (async function () {
          try {
            const data = await apiGet({
              action: "query",
              list: "users",
              ususers: username,
              usprop: "groups|rights|editcount|registration|gender|blockinfo",
            });
            const userEntry =
              data.query && data.query.users && data.query.users[0];
            if (!userEntry || userEntry.missing !== undefined) {
              localBadgesEl.innerHTML = "";
              const msg = document.createElement("span");
              msg.className = "tng-info-empty";
              msg.textContent = "Account not found on this wiki.";
              localBadgesEl.appendChild(msg);
              localEditsBody.className = "tng-info-empty";
              localEditsBody.textContent = "Account not found on this wiki.";
              registrationBody.className = "tng-info-empty";
              registrationBody.textContent = "Account not found on this wiki.";
            } else {
              const groups = (userEntry.groups || []).filter(function (g) {
                return g !== "*" && g !== "user";
              });
              const rights = userEntry.rights || [];
              renderTargetRights(
                localBadgesEl,
                localRightsListEl,
                groups,
                rights,
                "local",
              );

              if (userEntry.blockedby) {
                const blockBadge = document.createElement("span");
                blockBadge.className = "tng-rights-badge tng-rights-lack";
                blockBadge.textContent =
                  userEntry.blockpartial !== undefined
                    ? "Blocked (partial)"
                    : "Blocked";
                localBadgesEl.appendChild(blockBadge);
                appendReasonLine(
                  localRow,
                  "Block",
                  userEntry.blockreason || "(no reason given)",
                );
              }

              localEditsBody.className = "tng-info-value";
              localEditsBody.textContent =
                userEntry.editcount !== undefined
                  ? userEntry.editcount.toLocaleString()
                  : "—";

              registrationBody.className = "tng-info-value";
              registrationBody.textContent = userEntry.registration
                ? fmtTimestamp(userEntry.registration) +
                  (fmtRelative(userEntry.registration)
                    ? " (" + fmtRelative(userEntry.registration) + ")"
                    : "")
                : "Unknown (may predate registration logging)";

              if (genderBody) {
                genderBody.className = "tng-info-value";
                const genderSymbols = {
                  male: "👦 Male",
                  female: "👧 Female",
                };
                genderBody.textContent =
                  genderSymbols[userEntry.gender] || "Unspecified";
              }
            }
          } catch (err) {
            setError(
              localBadgesEl,
              "Failed to load local rights: " + formatApiError(err),
            );
            localEditsBody.className = "tng-info-empty";
            localEditsBody.textContent = "Failed to load.";
            registrationBody.className = "tng-info-empty";
            registrationBody.textContent = "Failed to load.";
            if (genderBody) {
              genderBody.className = "tng-info-empty";
              genderBody.textContent = "Failed to load.";
            }
          }
        })();

        // Last edit
        (async function () {
          try {
            const data = await apiGet({
              action: "query",
              list: "usercontribs",
              ucuser: username,
              uclimit: 1,
              ucprop: "timestamp|title",
            });
            const contribs = (data.query && data.query.usercontribs) || [];
            if (!contribs.length) {
              lastEditBody.className = "tng-info-empty";
              lastEditBody.textContent = "No edits found.";
              return;
            }
            const c = contribs[0];
            lastEditBody.className = "tng-info-value";
            const relTime = fmtRelative(c.timestamp);
            lastEditBody.textContent =
              fmtTimestamp(c.timestamp) + (relTime ? " (" + relTime + ")" : "");
          } catch (err) {
            lastEditBody.className = "tng-info-empty";
            lastEditBody.textContent = "Failed to load.";
          }
        })();

        // Global rights & global edit count (skipped for IP addresses)
        if (!isTargetIP) {
          (async function () {
            try {
              const data = await apiGet({
                action: "query",
                meta: "globaluserinfo",
                guiuser: username,
                guiprop: "groups|rights|editcount",
              });
              const gui = data.query && data.query.globaluserinfo;
              if (!gui || gui.missing !== undefined) {
                globalBadgesEl.innerHTML = "";
                const msg = document.createElement("span");
                msg.className = "tng-info-empty";
                msg.textContent = "No global account found.";
                globalBadgesEl.appendChild(msg);
                globalEditsBody.className = "tng-info-empty";
                globalEditsBody.textContent = "No global account found.";
              } else {
                const groups = gui.groups || [];
                const rights = gui.rights || [];
                renderTargetRights(
                  globalBadgesEl,
                  globalRightsListEl,
                  groups,
                  rights,
                  "global",
                );
                globalEditsBody.className = "tng-info-value";
                globalEditsBody.textContent =
                  gui.editcount !== undefined
                    ? gui.editcount.toLocaleString()
                    : "—";
              }
            } catch (err) {
              setError(
                globalBadgesEl,
                "Failed to load global rights: " + formatApiError(err),
              );
              globalEditsBody.className = "tng-info-empty";
              globalEditsBody.textContent = "Failed to load.";
            }
          })();
        }

        // --- Previous usernames ---
        if (previousNamesBody) {
          (async function () {
            const chain = [];
            const seen = new Set([username]);
            let currentName = username;
            let initialLookupFailed = false;

            while (currentName) {
              let oldUser = null;
              try {
                const data = await foreignApiGet({
                  action: "query",
                  list: "logevents",
                  letype: "gblrename",
                  letitle: "Special:CentralAuth/" + currentName,
                  lelimit: 50,
                  leprop: "details|timestamp",
                });
                const entries =
                  (data && data.query && data.query.logevents) || [];
                for (const e of entries) {
                  const params = e.params || {};
                  if (params.newuser === currentName && params.olduser) {
                    oldUser = params.olduser;
                    break;
                  }
                }
                if (!oldUser) {
                  for (const e of entries) {
                    const params = e.params || {};
                    if (params.olduser) {
                      oldUser = params.olduser;
                      break;
                    }
                  }
                }
              } catch (err) {
                if (currentName === username) initialLookupFailed = true;
                break;
              }

              if (oldUser && !seen.has(oldUser)) {
                chain.push(oldUser);
                seen.add(oldUser);
                currentName = oldUser;
              } else {
                currentName = null;
              }
            }

            if (initialLookupFailed) {
              previousNamesBody.className = "tng-info-empty";
              previousNamesBody.textContent =
                "Could not load previous usernames.";
            } else if (chain.length) {
              previousNamesBody.className = "tng-info-value";
              previousNamesBody.textContent =
                chain.slice().reverse().concat(username).join(" → ") + " ";
              const currentLabelEl = document.createElement("span");
              currentLabelEl.className = "tng-info-current-label";
              currentLabelEl.textContent = "(current)";
              previousNamesBody.appendChild(currentLabelEl);
            } else {
              previousNamesBody.className = "tng-info-empty";
              previousNamesBody.textContent = "No previous usernames found.";
            }
          })();
        }

        async function fetchGlobalLockReason(name) {
          const data = await foreignApiGet({
            action: "query",
            list: "logevents",
            letype: "globalauth",
            letitle: "User:" + name + "@global",
            lelimit: 50,
            leprop: "user|timestamp|comment|details",
            formatversion: 2,
          });
          const entries = (data.query && data.query.logevents) || [];
          const toArr = function (v) {
            if (Array.isArray(v)) return v;
            return typeof v === "string" && v ? v.split(/[,\s]+/) : [];
          };
          for (const e of entries) {
            const p = e.params || {};
            if (toArr(p.added).indexOf("locked") !== -1) {
              if (e.commenthidden) return "(reason hidden)";
              return e.comment || "(no reason given)";
            }
            if (toArr(p.removed).indexOf("locked") !== -1) return null;
          }
          return null;
        }

        // --- Global lock / block status ---
        (async function () {
          const fmtExpiry = function (ts) {
            if (!ts || ts === "infinity") return "indefinite";
            const d = new Date(ts);
            return isNaN(d.getTime())
              ? "indefinite"
              : d.toUTCString().replace("GMT", "UTC");
          };
          try {
            if (isTargetIP) {
              const data = await apiGet({
                action: "query",
                list: "globalblocks",
                bgip: username,
                bglimit: 1,
                bgprop: "address|by|expiry|reason",
              });
              const blocks = (data.query && data.query.globalblocks) || [];
              globalLockBadgesEl.innerHTML = "";
              if (blocks.length) {
                const b = blocks[0];
                const badge = document.createElement("span");
                badge.className = "tng-rights-badge tng-rights-lack";
                badge.textContent = "Globally blocked";
                badge.title =
                  "Blocked by: " +
                  (b.by || "—") +
                  " · Expires: " +
                  fmtExpiry(b.expiry) +
                  " · Reason: " +
                  (b.reason || "(no reason given)");
                globalLockBadgesEl.appendChild(badge);
                appendReasonLine(
                  globalLockRow,
                  "Global block",
                  b.reason || "(no reason given)",
                );
              } else {
                const badge = document.createElement("span");
                badge.className = "tng-rights-badge tng-rights-have";
                badge.textContent = "Not globally blocked";
                globalLockBadgesEl.appendChild(badge);
              }
            } else {
              const [lockData, blockData] = await Promise.all([
                apiGet({
                  action: "query",
                  meta: "globaluserinfo",
                  guiuser: username,
                }),
                apiGet({
                  action: "query",
                  list: "globalblocks",
                  bgtargets: username,
                  bglimit: 1,
                  bgprop: "address|by|expiry|reason",
                }),
              ]);
              const gui = lockData.query && lockData.query.globaluserinfo;
              const blocks =
                (blockData.query && blockData.query.globalblocks) || [];
              const isLocked =
                gui &&
                gui.missing === undefined &&
                Object.prototype.hasOwnProperty.call(gui, "locked");
              const isGlobalBlocked = blocks.length > 0;
              globalLockBadgesEl.innerHTML = "";
              if (!gui || gui.missing !== undefined) {
                const msg = document.createElement("span");
                msg.className = "tng-info-empty";
                msg.textContent = "No global account found.";
                globalLockBadgesEl.appendChild(msg);
              } else {
                if (isLocked) {
                  const badge = document.createElement("span");
                  badge.className = "tng-rights-badge tng-rights-lack";
                  badge.textContent = "Globally locked";
                  globalLockBadgesEl.appendChild(badge);
                  fetchGlobalLockReason(username)
                    .then(function (reason) {
                      appendReasonLine(
                        globalLockRow,
                        "Lock",
                        reason || "(reason unavailable)",
                      );
                    })
                    .catch(function () {
                      appendReasonLine(
                        globalLockRow,
                        "Lock",
                        "(reason unavailable)",
                      );
                    });
                }
                if (isGlobalBlocked) {
                  const b = blocks[0];
                  const badge = document.createElement("span");
                  badge.className = "tng-rights-badge tng-rights-lack";
                  badge.textContent = "Globally blocked";
                  badge.title =
                    "Blocked by: " +
                    (b.by || "—") +
                    " · Expires: " +
                    fmtExpiry(b.expiry) +
                    " · Reason: " +
                    (b.reason || "(no reason given)");
                  globalLockBadgesEl.appendChild(badge);
                  appendReasonLine(
                    globalLockRow,
                    "Global block",
                    b.reason || "(no reason given)",
                  );
                }
                if (!isLocked && !isGlobalBlocked) {
                  const badge = document.createElement("span");
                  badge.className = "tng-rights-badge tng-rights-have";
                  badge.textContent = "Not globally locked or blocked";
                  globalLockBadgesEl.appendChild(badge);
                }
              }
            }
          } catch (err) {
            globalLockBadgesEl.innerHTML = "";
            const msg = document.createElement("span");
            msg.className = "tng-info-empty";
            msg.textContent = isTargetIP
              ? "Could not load global block status."
              : "Could not load global lock / block status.";
            globalLockBadgesEl.appendChild(msg);
          }
        })();

        body.appendChild(secBlockLog);
        body.appendChild(secMoveLog);
        body.appendChild(secRights);
        body.appendChild(secAbuseLog);

        const btnClose = makeBtn("Close", "quiet");
        btnClose.addEventListener("click", () => overlay.closeHandler());
        footer.appendChild(btnClose);

        function classifyBlockLogEntry(e) {
          const action = e.action || "";
          const hasBlockParams = !!(
            e.params &&
            (e.params.duration !== undefined || e.params.expiry !== undefined)
          );
          let isUnblock;
          if (action === "unblock") {
            isUnblock = true;
          } else if (action === "block" || action === "reblock") {
            isUnblock = false;
          } else {
            isUnblock = !hasBlockParams;
          }
          const label = isUnblock
            ? "🔓 Unblock"
            : action === "reblock"
              ? "⛔️ Reblock"
              : "⛔️ Block";
          return { isUnblock, label };
        }

        // --- Block log ---
        (async function () {
          try {
            const data = await apiGet({
              action: "query",
              list: "logevents",
              letype: "block",
              letitle: "User:" + username,
              lelimit: "max",
              leprop: "user|timestamp|comment|details",
            });
            const entries = (data.query && data.query.logevents) || [];
            if (!entries.length) {
              setEmpty(bodyBlockLog, "No block log entries found.");
              return;
            }
            bodyBlockLog.classList.remove("tng-hidden");
            arrowBlockLog.classList.add("tng-arrow-up");
            bodyBlockLog.innerHTML = "";
            for (const e of entries) {
              const duration = (e.params && e.params.duration) || "—";
              const expiry =
                e.params && e.params.expiry
                  ? e.params.expiry === "infinity"
                    ? "Indefinite"
                    : fmtTimestamp(e.params.expiry) +
                      (fmtRelative(e.params.expiry)
                        ? " (" + fmtRelative(e.params.expiry) + ")"
                        : "")
                  : "—";
              const { label: actionLabel } = classifyBlockLogEntry(e);
              bodyBlockLog.appendChild(
                makeEntry([
                  [
                    "Time",
                    fmtTimestamp(e.timestamp) +
                      (fmtRelative(e.timestamp)
                        ? " (" + fmtRelative(e.timestamp) + ")"
                        : ""),
                  ],
                  ["Action", actionLabel],
                  ["Performed by", e.user || "—"],
                  ["Duration", duration],
                  ["Expiry", expiry],
                  ["Reason", e.comment || "(no reason given)"],
                ]),
              );
            }
          } catch (err) {
            setError(
              bodyBlockLog,
              "Failed to load block log: " + formatApiError(err),
            );
          }
        })();

        // --- Move log ---
        (async function () {
          try {
            const data = await apiGet({
              action: "query",
              list: "logevents",
              letype: "move",
              leuser: username,
              lelimit: "max",
              leprop: "title|timestamp|comment|details",
            });
            const entries = (data.query && data.query.logevents) || [];
            if (!entries.length) {
              setEmpty(bodyMoveLog, "No move log entries found.");
              return;
            }
            bodyMoveLog.classList.remove("tng-hidden");
            arrowMoveLog.classList.add("tng-arrow-up");
            bodyMoveLog.innerHTML = "";
            for (const e of entries) {
              const targetTitle = (e.params && e.params.target_title) || "—";
              const suppressedRedirect =
                e.params && e.params.suppressredirect !== undefined
                  ? e.params.suppressredirect
                    ? "Yes (no redirect left)"
                    : "No (redirect left)"
                  : "—";
              bodyMoveLog.appendChild(
                makeEntry([
                  [
                    "Time",
                    fmtTimestamp(e.timestamp) +
                      (fmtRelative(e.timestamp)
                        ? " (" + fmtRelative(e.timestamp) + ")"
                        : ""),
                  ],
                  ["Moved from", e.title || "—"],
                  ["Moved to", targetTitle],
                  ["Redirect suppressed", suppressedRedirect],
                  ["Reason", e.comment || "(no reason given)"],
                ]),
              );
            }
          } catch (err) {
            setError(
              bodyMoveLog,
              "Failed to load move log: " + formatApiError(err),
            );
          }
        })();

        // --- Rights changes ---
        (async function () {
          try {
            const data = await apiGet({
              action: "query",
              list: "logevents",
              letype: "rights",
              letitle: "User:" + username,
              lelimit: "max",
              leprop: "user|timestamp|comment|details",
            });
            const entries = (data.query && data.query.logevents) || [];
            if (!entries.length) {
              setEmpty(bodyRights, "No rights change entries found.");
              return;
            }
            bodyRights.classList.remove("tng-hidden");
            arrowRights.classList.add("tng-arrow-up");
            bodyRights.innerHTML = "";
            for (const e of entries) {
              const oldGroups =
                e.params && e.params.oldgroups && e.params.oldgroups.length
                  ? e.params.oldgroups.join(", ")
                  : "(none)";
              const newGroups =
                e.params && e.params.newgroups && e.params.newgroups.length
                  ? e.params.newgroups.join(", ")
                  : "(none)";
              const newMetadata = (e.params && e.params.newmetadata) || null;
              const rows = [
                [
                  "Time",
                  fmtTimestamp(e.timestamp) +
                    (fmtRelative(e.timestamp)
                      ? " (" + fmtRelative(e.timestamp) + ")"
                      : ""),
                ],
                ["Changed by", e.user || "—"],
                ["Previous groups", oldGroups],
                ["New groups", newGroups],
              ];
              if (newMetadata && newMetadata.length) {
                const expiryText = newMetadata
                  .map(function (m) {
                    const groupLabel = m.group || "—";
                    if (!m.expiry) return groupLabel + ": indefinite";
                    const abs = fmtTimestamp(m.expiry);
                    const rel = fmtRelative(m.expiry);
                    return (
                      groupLabel + ": " + abs + (rel ? " (" + rel + ")" : "")
                    );
                  })
                  .join("; ");
                rows.push(["Expiry", expiryText]);
              }
              rows.push(["Reason", e.comment || "(no reason given)"]);
              bodyRights.appendChild(makeEntry(rows));
            }
          } catch (err) {
            setError(
              bodyRights,
              "Failed to load rights changes: " + formatApiError(err),
            );
          }
        })();

        // --- Abuse filter log ---
        (async function () {
          try {
            const data = await apiGet({
              action: "query",
              list: "abuselog",
              afluser: username,
              afllimit: "max",
              aflprop: "ids|user|title|action|result|timestamp|filter",
            });
            const entries = (data.query && data.query.abuselog) || [];
            if (!entries.length) {
              setEmpty(bodyAbuseLog, "No abuse filter log entries found.");
              return;
            }
            bodyAbuseLog.classList.remove("tng-hidden");
            arrowAbuseLog.classList.add("tng-arrow-up");
            bodyAbuseLog.innerHTML = "";
            for (const e of entries) {
              const filterLabel = e.filter_id
                ? "#" + e.filter_id + (e.filter ? " (" + e.filter + ")" : "")
                : "—";
              bodyAbuseLog.appendChild(
                makeEntry([
                  [
                    "Time",
                    fmtTimestamp(e.timestamp) +
                      (fmtRelative(e.timestamp)
                        ? " (" + fmtRelative(e.timestamp) + ")"
                        : ""),
                  ],
                  ["Page", e.title || "—"],
                  ["Action", e.action || "—"],
                  ["Filter", filterLabel],
                  ["Result", e.result || "(none)"],
                ]),
              );
            }
          } catch (err) {
            setError(
              bodyAbuseLog,
              "Failed to load abuse filter log: " + formatApiError(err),
            );
          }
        })();
      };
    },
  };
})();
// </nowiki>
