/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Page info module
 * ============================================================================
 * PURPOSE:
 * Provides the page-mode "Get info" dialogue. It fetches and displays Page
 * info (MediaWiki and XTools), Page assessment, What links here (backlinks
 * and transclusions), Move log, Abuse filter log, Protection log, and
 * Deletion log entries for a target page in a read-only dialogue panel.
 * Consumed by Tengu.js; exposes window.TenguPageInfo.create(deps).
 *
 * The module depends only on the MediaWiki globals (mw) and the helpers
 * passed in by Tengu.js: createDialog(opts), makeDisplaySection(title, icon),
 * makeBtn(label, variant), apiGet(params) and formatApiError(err).
 * create(deps) returns the async function getPageInfo(pageName).
 *
 * The page info statistics are adapted from the XTools PageInfo gadget
 * (GPL 3.0+); see the README credits and CHANGELOG.md v2.214.0.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguPageInfo = {
    create: function (deps) {
      const {
        createDialog,
        makeDisplaySection,
        makeBtn,
        apiGet,
        formatApiError,
      } = deps;

      return async function getPageInfo(pageName) {
        const { overlay, body, footer } = createDialog({
          title: "Page info: " + pageName,
          icon: "🔍",
          child: true,
        });

        function fmtTimestamp(ts) {
          if (!ts) return "Unknown";
          if (ts === "infinity" || ts === "infinite" || ts === "never")
            return "Indefinite";
          const d = new Date(ts);
          if (isNaN(d.getTime())) return "Indefinite";
          return d.toUTCString().replace("GMT", "UTC");
        }

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

        function makeEntry(rows) {
          const entry = document.createElement("div");
          entry.className = "tng-info-entry";
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

        function appendInfoGroup(pageInfoEntry, title, rows) {
          if (pageInfoEntry.childElementCount) {
            const spacer = document.createElement("div");
            spacer.style.marginTop = "6px";
            pageInfoEntry.appendChild(spacer);
          }

          const heading = document.createElement("div");
          heading.style.fontWeight = "bold";
          heading.style.marginBottom = "1px";
          heading.textContent = title;
          pageInfoEntry.appendChild(heading);

          const list = document.createElement("ul");
          list.style.margin = "0";
          list.style.paddingLeft = "20px";

          for (const [label, value] of rows) {
            const item = document.createElement("li");
            const b = document.createElement("b");
            b.textContent = label + ": ";
            item.appendChild(b);
            item.appendChild(document.createTextNode(value || "—"));
            list.appendChild(item);
          }

          pageInfoEntry.appendChild(list);
        }

        function classifyDeleteLogEntry(e) {
          const action = e.action;
          if (action === "delete") {
            return { kind: "delete", label: "🗑️ Delete" };
          }
          if (action === "restore") {
            return { kind: "restore", label: "♻️ Restore (undelete)" };
          }
          if (action === "revision") {
            return { kind: "revision", label: "👁️ Revision deletion" };
          }
          if (action === "event") {
            return { kind: "event", label: "📝 Log entry visibility change" };
          }
          return {
            kind: "unspecified",
            label:
              "❓ Unspecified delete-log action" +
              (action ? " (raw action: " + action + ")" : " (no action data)"),
          };
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

        // Build the display-only collapsible sections
        const {
          section: secCurrentRev,
          sectionBody: bodyCurrentRev,
          arrow: arrowCurrentRev,
        } = makeDisplaySection("Page info", "📊");
        const {
          section: secWhatLinksHere,
          sectionBody: bodyWhatLinksHere,
          arrow: arrowWhatLinksHere,
        } = makeDisplaySection("What links here", "⛓️");
        const {
          section: secAbuseLog,
          sectionBody: bodyAbuseLog,
          arrow: arrowAbuseLog,
        } = makeDisplaySection("Abuse filter log", "🛑");
        const {
          section: secProtectLog,
          sectionBody: bodyProtectLog,
          arrow: arrowProtectLog,
        } = makeDisplaySection("Protection log", "🛡️");
        const {
          section: secDeleteLog,
          sectionBody: bodyDeleteLog,
          arrow: arrowDeleteLog,
        } = makeDisplaySection("Deletion log", "🗑️");
        const {
          section: secMoveLog,
          sectionBody: bodyMoveLog,
          arrow: arrowMoveLog,
        } = makeDisplaySection("Move log", "📑");

        setLoading(bodyCurrentRev, "Loading page info...");
        setLoading(bodyWhatLinksHere, "Loading pages that link here...");
        setLoading(bodyAbuseLog, "Loading abuse filter log...");
        setLoading(bodyProtectLog, "Loading protection log...");
        setLoading(bodyDeleteLog, "Loading deletion log...");
        setLoading(bodyMoveLog, "Loading move log...");

        // --- XTools supplementary figures ---
        const xtoolsPromise = (async function () {
          try {
            const xtUrl =
              "https://xtools.wmcloud.org/api/page/pageinfo/" +
              mw.config.get("wgServerName") +
              "/" +
              encodeURIComponent(pageName.replace(/ /g, "_")) +
              "?format=json";
            const res = await fetch(xtUrl);
            if (!res.ok) return null;
            return await res.json();
          } catch (e) {
            return null;
          }
        })();

        // --- XTools helpers (Page info prose, Page assessment) ---
        const XTOOLS_FALLBACK_TEXT = "Unable to retrieve this information.";
        const xtoolsHostForWiki = mw.config.get("wgServerName");
        const xtoolsSlugForPage = encodeURIComponent(
          pageName.replace(/ /g, "_"),
        );

        async function fetchXtoolsPageData(path) {
          let timer = null;
          try {
            const controller =
              typeof AbortController === "function"
                ? new AbortController()
                : null;
            if (controller) {
              timer = setTimeout(function () {
                controller.abort();
              }, 15000);
            }
            const res = await fetch(
              "https://xtools.wmcloud.org/api/page/" + path,
              controller ? { signal: controller.signal } : undefined,
            );
            if (!res.ok) return null;
            const json = await res.json();
            return json && typeof json === "object" ? json : null;
          } catch (e) {
            return null;
          } finally {
            if (timer) clearTimeout(timer);
          }
        }

        function renderXtoolsFallback(container, message) {
          container.innerHTML = "";
          const msgEl = document.createElement("div");
          msgEl.className = "tng-info-empty";
          msgEl.textContent = message || XTOOLS_FALLBACK_TEXT;
          container.appendChild(msgEl);
        }

        const linksPromise = fetchXtoolsPageData(
          "links/" + xtoolsHostForWiki + "/" + xtoolsSlugForPage,
        );

        function renderProseEntry(entry) {
          const loadingEl = document.createElement("div");
          loadingEl.className = "tng-info-loading";
          loadingEl.textContent = "Loading content statistics...";
          entry.appendChild(loadingEl);

          fetchXtoolsPageData(
            "prose/" + xtoolsHostForWiki + "/" + xtoolsSlugForPage,
          ).then(function (data) {
            loadingEl.remove();

            if (!data) {
              renderXtoolsFallback(entry, "Page information is unavailable.");
              return;
            }

            const fmtProse = function (v) {
              return typeof v === "number"
                ? v.toLocaleString()
                : XTOOLS_FALLBACK_TEXT;
            };

            appendInfoGroup(entry, "Content", [
              ["Words", fmtProse(data.words)],
              ["Characters", fmtProse(data.characters)],
              ["Sections", fmtProse(data.sections)],
              ["References", fmtProse(data.references)],
              ["Unique references", fmtProse(data.unique_references)],
            ]);
          });
        }

        function nonEmptyString(v) {
          return typeof v === "string" && v.trim() ? v.trim() : null;
        }

        function makeAssessmentLine(classObj, importanceObj) {
          const line = document.createElement("div");
          line.className = "tng-info-value";
          line.style.cssText =
            "display:flex;align-items:center;flex-wrap:wrap;gap:6px;";

          const classVal = nonEmptyString(classObj && classObj.value);
          const badgeUrl = nonEmptyString(classObj && classObj.badge);
          if (badgeUrl) {
            const img = document.createElement("img");
            img.src = badgeUrl;
            img.alt = classVal || "";
            img.height = 16;
            img.style.cssText = "height:16px;width:auto;margin-right:4px;";
            line.appendChild(img);
          }
          const classEl = document.createElement("span");
          classEl.textContent = classVal || XTOOLS_FALLBACK_TEXT;
          line.appendChild(classEl);

          const impVal = nonEmptyString(importanceObj && importanceObj.value);
          const impColor = nonEmptyString(importanceObj && importanceObj.color);
          if (impVal) {
            const sep = document.createElement("span");
            sep.className = "tng-help";
            sep.style.margin = "0";
            sep.textContent = "·";
            line.appendChild(sep);

            if (impColor) {
              const dot = document.createElement("span");
              dot.style.cssText =
                "display:inline-block;width:8px;height:8px;border-radius:50%;border:1px solid #a2a9b1;background:" +
                impColor +
                ";";
              line.appendChild(dot);
            }
            const impEl = document.createElement("span");
            impEl.textContent = impVal === "???" ? "Unknown" : impVal;
            line.appendChild(impEl);
          }
          return line;
        }

        function makeAssessmentSubheading(text) {
          const h = document.createElement("div");
          h.className = "tng-user-rights-scope";
          h.style.marginTop = "6px";
          h.textContent = text;
          return h;
        }

        function renderAssessmentEntry(container, onContent) {
          container.innerHTML = "";
          const loadingEl = document.createElement("div");
          loadingEl.className = "tng-info-loading";
          loadingEl.textContent = "Loading page assessment...";
          container.appendChild(loadingEl);
          fetchXtoolsPageData(
            "assessments/" + xtoolsHostForWiki + "/" + xtoolsSlugForPage,
          ).then(function (data) {
            container.innerHTML = "";
            if (!data) {
              renderXtoolsFallback(
                container,
                "Page assessment is unavailable.",
              );
              return;
            }

            const pagesObj =
              data.pages && typeof data.pages === "object" ? data.pages : {};
            const pageKeys = Object.keys(pagesObj);
            const pageData =
              pageKeys.length &&
              pagesObj[pageKeys[0]] &&
              typeof pagesObj[pageKeys[0]] === "object"
                ? pagesObj[pageKeys[0]]
                : null;
            if (!pageData) {
              const emptyEl = document.createElement("div");
              emptyEl.className = "tng-info-empty";
              emptyEl.textContent = "No assessment available for this page.";
              container.appendChild(emptyEl);
              return;
            }

            const overall =
              pageData.assessment && typeof pageData.assessment === "object"
                ? {
                    value: pageData.assessment.class,
                    badge: pageData.assessment.badge,
                    color: pageData.assessment.color,
                  }
                : null;
            const wikiprojects =
              pageData.wikiprojects && typeof pageData.wikiprojects === "object"
                ? pageData.wikiprojects
                : {};
            const projectKeys = Object.keys(wikiprojects);

            if (!overall && !projectKeys.length) {
              const emptyEl = document.createElement("div");
              emptyEl.className = "tng-info-empty";
              emptyEl.textContent = "No assessment available for this page.";
              container.appendChild(emptyEl);
              return;
            }

            if (overall) {
              container.appendChild(makeAssessmentSubheading("Overall"));
              const overallLine = makeAssessmentLine(overall, null);
              overallLine.style.cssText =
                "font-weight:700;font-size:0.88em;margin-top:2px;";
              container.appendChild(overallLine);
            }

            if (projectKeys.length) {
              container.appendChild(makeAssessmentSubheading("WikiProjects"));
              const listEl = document.createElement("ul");
              listEl.style.cssText =
                "margin:2px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:2px;";
              projectKeys.forEach(function (key) {
                const wp =
                  wikiprojects[key] && typeof wikiprojects[key] === "object"
                    ? wikiprojects[key]
                    : {};
                const row = document.createElement("li");
                row.style.cssText =
                  "padding-left:2px;font-size:0.88em;line-height:1.5;";
                const nameEl = document.createElement("span");
                nameEl.style.cssText = "font-weight:600;word-break:break-word;";
                nameEl.textContent = nonEmptyString(wp.wikiproject) || key;
                row.appendChild(nameEl);
                row.appendChild(
                  makeAssessmentLine(
                    wp.class && typeof wp.class === "object" ? wp.class : null,
                    wp.importance && typeof wp.importance === "object"
                      ? wp.importance
                      : null,
                  ),
                );
                listEl.appendChild(row);
              });
              container.appendChild(listEl);
            }

            onContent();
          });
        }

        const {
          section: secAssessment,
          sectionBody: bodyAssessment,
          arrow: arrowAssessment,
        } = makeDisplaySection("Page assessment", "🏅");

        function expandAssessmentSection() {
          bodyAssessment.classList.remove("tng-hidden");
          arrowAssessment.classList.add("tng-arrow-up");
        }

        body.appendChild(secCurrentRev);
        body.appendChild(secAssessment);
        body.appendChild(secWhatLinksHere);
        renderAssessmentEntry(bodyAssessment, expandAssessmentSection);
        body.appendChild(secMoveLog);
        body.appendChild(secAbuseLog);
        body.appendChild(secProtectLog);
        body.appendChild(secDeleteLog);

        const btnClose = makeBtn("Close", "quiet");
        btnClose.addEventListener("click", () => overlay.closeHandler());
        footer.appendChild(btnClose);

        // --- Current revision ---
        (async function () {
          try {
            const [infoData, latestData, firstData] = await Promise.all([
              apiGet({
                action: "query",
                prop: "info",
                titles: pageName,
                formatversion: 2,
              }),
              apiGet({
                action: "query",
                prop: "revisions",
                titles: pageName,
                rvlimit: 1,
                rvdir: "older",
                rvprop: "user|timestamp|size",
                formatversion: 2,
              }),
              apiGet({
                action: "query",
                prop: "revisions",
                titles: pageName,
                rvlimit: 1,
                rvdir: "newer",
                rvprop: "user|timestamp",
                formatversion: 2,
              }),
            ]);

            const infoPage =
              infoData.query && infoData.query.pages && infoData.query.pages[0];
            if (!infoPage || infoPage.missing) {
              setEmpty(bodyCurrentRev, "This page does not currently exist.");
              return;
            }

            const latestPage =
              latestData.query &&
              latestData.query.pages &&
              latestData.query.pages[0];
            const latestRev =
              latestPage && latestPage.revisions && latestPage.revisions[0];

            const firstPage =
              firstData.query &&
              firstData.query.pages &&
              firstData.query.pages[0];
            const firstRev =
              firstPage && firstPage.revisions && firstPage.revisions[0];

            let revCountLabel = "—";
            try {
              const rcData = await apiGet({
                action: "query",
                prop: "revisions",
                titles: pageName,
                rvlimit: 500,
                rvprop: "ids",
                formatversion: 2,
              });
              const rcPage =
                rcData.query && rcData.query.pages && rcData.query.pages[0];
              const rcRevs = (rcPage && rcPage.revisions) || [];
              revCountLabel = rcData.continue
                ? rcRevs.length + "+"
                : String(rcRevs.length);
            } catch (e) {
              // Leave as "—" if this request fails.
            }

            const xt = await xtoolsPromise;
            const xtLinks = await linksPromise;

            const fmtNum = function (n) {
              return typeof n === "number" ? n.toLocaleString() : "—";
            };
            const fmtPct = function (n) {
              return typeof n === "number" ? n.toFixed(1) + "%" : "—";
            };
            const sharePct = function (part, total) {
              return typeof part === "number" &&
                typeof total === "number" &&
                total > 0
                ? (part / total) * 100
                : null;
            };

            const pageInfoEntry = makeEntry([]);

            appendInfoGroup(pageInfoEntry, "Page", [
              [
                "Page size",
                infoPage.length !== undefined
                  ? infoPage.length.toLocaleString() + " bytes"
                  : "—",
              ],
              ["Revision count", revCountLabel],
              ["Watchers", xt ? fmtNum(xt.watchers) : "—"],
              ["Pageviews", xt ? fmtNum(xt.pageviews) : "—"],
            ]);

            if (xtLinks) {
              appendInfoGroup(pageInfoEntry, "Links", [
                ["Incoming links", fmtNum(xtLinks.links_in_count)],
                ["Outgoing links", fmtNum(xtLinks.links_out_count)],
                ["External links", fmtNum(xtLinks.links_ext_count)],
                ["Redirects to this page", fmtNum(xtLinks.redirects_count)],
              ]);
            }

            appendInfoGroup(pageInfoEntry, "Editing", [
              ["Editors", xt ? fmtNum(xt.editors) : "—"],
              ["Last editor", (latestRev && latestRev.user) || "—"],
              [
                "Last edited",
                latestRev
                  ? fmtTimestamp(latestRev.timestamp) +
                    (fmtRelative(latestRev.timestamp)
                      ? " (" + fmtRelative(latestRev.timestamp) + ")"
                      : "")
                  : "—",
              ],
              [
                "Bot edits",
                xt ? fmtPct(sharePct(xt.bot_revisions, xt.revisions)) : "—",
              ],
              [
                "Anonymous edits",
                xt ? fmtPct(sharePct(xt.anon_revisions, xt.revisions)) : "—",
              ],
              [
                "Minor edits",
                xt ? fmtPct(sharePct(xt.minor_revisions, xt.revisions)) : "—",
              ],
            ]);

            appendInfoGroup(pageInfoEntry, "Creation", [
              ["Created by", (firstRev && firstRev.user) || "—"],
              [
                "Creation date",
                firstRev
                  ? fmtTimestamp(firstRev.timestamp) +
                    (fmtRelative(firstRev.timestamp)
                      ? " (" + fmtRelative(firstRev.timestamp) + ")"
                      : "")
                  : "—",
              ],
            ]);

            bodyCurrentRev.classList.remove("tng-hidden");
            arrowCurrentRev.classList.add("tng-arrow-up");
            bodyCurrentRev.innerHTML = "";
            bodyCurrentRev.appendChild(pageInfoEntry);

            renderProseEntry(pageInfoEntry);
          } catch (err) {
            setError(
              bodyCurrentRev,
              "Failed to load page info: " + formatApiError(err),
            );
          }
        })();

        // --- What links here ---
        (async function () {
          try {
            const [data, embedData] = await Promise.all([
              apiGet({
                action: "query",
                list: "backlinks",
                bltitle: pageName,
                bllimit: 100,
                formatversion: 2,
              }),
              apiGet({
                action: "query",
                list: "embeddedin",
                eititle: pageName,
                eilimit: 100,
                formatversion: 2,
              }).catch(function () {
                return null;
              }),
            ]);
            const linkEntries = (data.query && data.query.backlinks) || [];
            const embedEntries =
              (embedData && embedData.query && embedData.query.embeddedin) ||
              [];
            const hasMore = !!(
              data.continue ||
              (embedData && embedData.continue)
            );
            const entryMap = new Map();
            linkEntries.forEach(function (p) {
              entryMap.set(p.title, {
                title: p.title,
                isRedirect: !!p.redirect,
                isTransclusion: false,
              });
            });
            embedEntries.forEach(function (p) {
              const existing = entryMap.get(p.title);
              if (existing) {
                existing.isTransclusion = true;
              } else {
                entryMap.set(p.title, {
                  title: p.title,
                  isRedirect: !!p.redirect,
                  isTransclusion: true,
                });
              }
            });
            const entries = Array.from(entryMap.values());
            if (!entries.length) {
              setEmpty(
                bodyWhatLinksHere,
                "No pages link to or transclude this page.",
              );
              return;
            }
            bodyWhatLinksHere.classList.remove("tng-hidden");
            arrowWhatLinksHere.classList.add("tng-arrow-up");
            bodyWhatLinksHere.innerHTML = "";
            let wlhCount = 0;
            for (const page of entries) {
              wlhCount++;
              const rowEl = document.createElement("div");
              rowEl.style.cssText =
                "display:flex;gap:5px;padding:1px 0;font-size:0.88em;";
              const numEl = document.createElement("span");
              numEl.style.cssText =
                "flex-shrink:0;color:#72777d;min-width:2em;text-align:right;";
              numEl.textContent = wlhCount + ".";
              const linkEl = document.createElement("a");
              linkEl.href = mw.util.getUrl(page.title);
              linkEl.target = "_blank";
              linkEl.rel = "noopener noreferrer";
              linkEl.textContent = page.title;
              linkEl.style.cssText = "word-break:break-word;";
              const typeLabels = [];
              if (page.isRedirect) typeLabels.push("redirect");
              if (page.isTransclusion) typeLabels.push("transclusion");
              const nameWrap = document.createElement("span");
              nameWrap.style.cssText = "word-break:break-word;";
              nameWrap.appendChild(linkEl);
              if (typeLabels.length) {
                const typeEl = document.createElement("span");
                typeEl.style.cssText = "color:#72777d;";
                typeEl.textContent = " (" + typeLabels.join(", ") + ")";
                nameWrap.appendChild(typeEl);
              }
              rowEl.appendChild(numEl);
              rowEl.appendChild(nameWrap);
              bodyWhatLinksHere.appendChild(rowEl);
            }
            if (hasMore) {
              const wlhSpecialTitle = "Special:WhatLinksHere/" + pageName;
              const noteEl = document.createElement("div");
              noteEl.className = "tng-help";
              noteEl.style.marginTop = "6px";
              const notePre = document.createTextNode(
                "Showing up to the first 100 links and 100 transclusions. Visit ",
              );
              const noteLink = document.createElement("a");
              noteLink.href = mw.util.getUrl(wlhSpecialTitle);
              noteLink.target = "_blank";
              noteLink.rel = "noopener noreferrer";
              noteLink.textContent = wlhSpecialTitle;
              const notePost = document.createTextNode(" to see all links.");
              noteEl.appendChild(notePre);
              noteEl.appendChild(noteLink);
              noteEl.appendChild(notePost);
              bodyWhatLinksHere.appendChild(noteEl);
            }
          } catch (err) {
            setError(
              bodyWhatLinksHere,
              "Failed to load backlinks: " + formatApiError(err),
            );
          }
        })();

        // --- Abuse filter log ---
        (async function () {
          try {
            const data = await apiGet({
              action: "query",
              list: "abuselog",
              afltitle: pageName,
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
                  ["User", e.user || "—"],
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

        function classifyProtectLogEntry(e) {
          const action = e.action;
          if (action === "protect") {
            return { kind: "protect", label: "🛡️ Protect" };
          }
          if (action === "modify") {
            return { kind: "modify", label: "🛡️ Modify protection" };
          }
          if (action === "unprotect") {
            return { kind: "unprotect", label: "🔓 Unprotect" };
          }
          if (action === "move_prot") {
            return { kind: "move_prot", label: "🛡️ Protection moved" };
          }
          return {
            kind: "unspecified",
            label:
              "❓ Unspecified protection-log action" +
              (action ? " (raw action: " + action + ")" : " (no action data)"),
          };
        }

        function fmtProtectionDuration(fromTs, toTs) {
          const from = new Date(fromTs).getTime();
          const to = new Date(toTs).getTime();
          if (isNaN(from) || isNaN(to) || to <= from) return "";
          const sec = Math.round((to - from) / 1000);
          const unit = function (n, name) {
            return n + " " + name + (n !== 1 ? "s" : "");
          };
          if (sec < 60) return unit(sec, "second");
          const min = Math.round(sec / 60);
          if (min < 60) return unit(min, "minute");
          const hr = Math.round(min / 60);
          if (hr < 24) return unit(hr, "hour");
          const day = Math.round(hr / 24);
          if (day < 7) return unit(day, "day");
          if (day < 30) return unit(Math.round(day / 7), "week");
          if (day < 365) return unit(Math.round(day / 30.4375), "month");
          return unit(Math.round(day / 365.25), "year");
        }

        // --- Protection log ---
        (async function () {
          try {
            const data = await apiGet({
              action: "query",
              list: "logevents",
              letype: "protect",
              letitle: pageName,
              lelimit: "max",
              leprop: "user|timestamp|comment|details|type",
            });
            const entries = (data.query && data.query.logevents) || [];
            if (!entries.length) {
              setEmpty(bodyProtectLog, "No protection log entries found.");
              return;
            }
            bodyProtectLog.classList.remove("tng-hidden");
            arrowProtectLog.classList.add("tng-arrow-up");
            bodyProtectLog.innerHTML = "";
            for (const e of entries) {
              const protectDetails =
                e.params && e.params.details && e.params.details.length
                  ? e.params.details
                  : null;
              const levels = protectDetails
                ? protectDetails
                    .map(function (d) {
                      return d.type + ": " + (d.level || "all");
                    })
                    .join("; ")
                : "—";
              const expiryText = protectDetails
                ? protectDetails
                    .map(function (d) {
                      if (d.expiry === "infinity") {
                        return d.type + ": indefinite";
                      }
                      if (!d.expiry) {
                        return d.type + ": not specified";
                      }
                      const abs = fmtTimestamp(d.expiry);
                      const rel = fmtRelative(d.expiry);
                      const length = fmtProtectionDuration(
                        e.timestamp,
                        d.expiry,
                      );
                      return (
                        d.type +
                        ": " +
                        (length ? length + ", " : "") +
                        "until " +
                        abs +
                        (rel ? " (" + rel + ")" : "")
                      );
                    })
                    .join("; ")
                : null;
              const cascade = e.params && e.params.cascade ? "Yes" : "No";
              const { label: protectActionLabel } = classifyProtectLogEntry(e);
              bodyProtectLog.appendChild(
                makeEntry([
                  [
                    "Time",
                    fmtTimestamp(e.timestamp) +
                      (fmtRelative(e.timestamp)
                        ? " (" + fmtRelative(e.timestamp) + ")"
                        : ""),
                  ],
                  ["Action", protectActionLabel],
                  ["Performed by", e.user || "—"],
                  ["Levels", levels],
                  ...(expiryText ? [["Expiry", expiryText]] : []),
                  ["Cascading", cascade],
                  ["Reason", e.comment || "(no reason given)"],
                ]),
              );
            }
          } catch (err) {
            setError(
              bodyProtectLog,
              "Failed to load protection log: " + formatApiError(err),
            );
          }
        })();

        function formatRevisionsAffected(e, kind) {
          const params = (e && e.params) || {};

          function normaliseIds(val) {
            if (!val) return null;
            let arr = null;
            if (Array.isArray(val)) {
              arr = val;
            } else if (typeof val === "object") {
              arr = Object.values(val);
            }
            if (!arr) return null;
            const ids = arr.filter(function (v) {
              return typeof v === "number" || typeof v === "string";
            });
            return ids.length ? ids : null;
          }

          const ids =
            normaliseIds(params.ids) ||
            normaliseIds(params.old) ||
            normaliseIds(params.new);

          let count = null;
          if (typeof params.count === "number") {
            count = params.count;
          } else if (
            typeof params.count === "string" &&
            params.count.trim() !== "" &&
            !isNaN(Number(params.count))
          ) {
            count = Number(params.count);
          } else if (ids) {
            count = ids.length;
          }

          if (kind === "revision") {
            if (count === null && !ids) return null;
            let text =
              count !== null
                ? count + " revision" + (count !== 1 ? "s" : "")
                : "Unknown number of revisions";
            if (ids && ids.length) {
              text +=
                " (revision ID" +
                (ids.length !== 1 ? "s" : "") +
                ": " +
                ids.join(", ") +
                ")";
            }
            return text;
          }

          if (kind === "restore") {
            if (count === null && !ids) return null;
            let text =
              count !== null
                ? count + " revision" + (count !== 1 ? "s" : "")
                : "Unknown number of revisions";
            if (ids && ids.length) {
              text +=
                " (revision ID" +
                (ids.length !== 1 ? "s" : "") +
                ": " +
                ids.join(", ") +
                ")";
            }
            return text;
          }

          if (count !== null) return String(count);
          return null;
        }

        // --- Deletion log ---
        (async function () {
          try {
            const data = await apiGet({
              action: "query",
              list: "logevents",
              letype: "delete",
              letitle: pageName,
              lelimit: "max",
              leprop: "user|timestamp|comment|details|type",
            });
            const entries = (data.query && data.query.logevents) || [];
            if (!entries.length) {
              setEmpty(bodyDeleteLog, "No deletion log entries found.");
              return;
            }
            bodyDeleteLog.classList.remove("tng-hidden");
            arrowDeleteLog.classList.add("tng-arrow-up");
            bodyDeleteLog.innerHTML = "";
            for (const e of entries) {
              const { kind, label: actionLabel } = classifyDeleteLogEntry(e);
              const revisionsAffected = formatRevisionsAffected(e, kind);
              const rows = [
                [
                  "Time",
                  fmtTimestamp(e.timestamp) +
                    (fmtRelative(e.timestamp)
                      ? " (" + fmtRelative(e.timestamp) + ")"
                      : ""),
                ],
                ["Action", actionLabel],
                ["Performed by", e.user || "—"],
              ];
              if (kind === "revision" || kind === "restore") {
                rows.push([
                  "Revisions affected",
                  revisionsAffected || "Not available for this entry.",
                ]);
              } else if (revisionsAffected !== null) {
                rows.push(["Revisions affected", revisionsAffected]);
              }
              rows.push(["Reason", e.comment || "(no reason given)"]);
              bodyDeleteLog.appendChild(makeEntry(rows));
            }
          } catch (err) {
            setError(
              bodyDeleteLog,
              "Failed to load deletion log: " + formatApiError(err),
            );
          }
        })();

        // --- Move log ---
        (async function () {
          try {
            const titlesToCheck = [pageName];
            try {
              const blData = await apiGet({
                action: "query",
                list: "backlinks",
                bltitle: pageName,
                blfilterredir: "redirects",
                bllimit: "max",
                formatversion: 2,
              });
              const redirectTitles = (
                (blData.query && blData.query.backlinks) ||
                []
              ).map(function (b) {
                return b.title;
              });
              for (const t of redirectTitles) {
                if (!titlesToCheck.includes(t)) titlesToCheck.push(t);
              }
            } catch (e) {
              // Fall back to checking only the current title's own move log.
            }

            let entries = [];
            for (const t of titlesToCheck) {
              try {
                const data = await apiGet({
                  action: "query",
                  list: "logevents",
                  letype: "move",
                  letitle: t,
                  lelimit: "max",
                  leprop: "user|timestamp|comment|details",
                });
                const found = (data.query && data.query.logevents) || [];
                for (const e of found) {
                  e._tngSourceTitle = t;
                }
                entries = entries.concat(found);
              } catch (e) {
                // Skip this title on failure.
              }
            }

            const seenLogIds = new Set();
            entries = entries.filter(function (e) {
              if (e.logid && seenLogIds.has(e.logid)) return false;
              if (e.logid) seenLogIds.add(e.logid);
              return true;
            });
            entries.sort(function (a, b) {
              return (b.timestamp || "").localeCompare(a.timestamp || "");
            });

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
              const rows = [
                [
                  "Time",
                  fmtTimestamp(e.timestamp) +
                    (fmtRelative(e.timestamp)
                      ? " (" + fmtRelative(e.timestamp) + ")"
                      : ""),
                ],
                ["Performed by", e.user || "—"],
              ];
              if (e._tngSourceTitle && e._tngSourceTitle !== pageName) {
                rows.push(["Previous title", e._tngSourceTitle]);
              }
              rows.push(["Moved to", targetTitle]);
              rows.push(["Redirect suppressed", suppressedRedirect]);
              rows.push(["Reason", e.comment || "(no reason given)"]);
              bodyMoveLog.appendChild(makeEntry(rows));
            }
          } catch (err) {
            setError(
              bodyMoveLog,
              "Failed to load move log: " + formatApiError(err),
            );
          }
        })();
      };
    },
  };
})();
// </nowiki>
