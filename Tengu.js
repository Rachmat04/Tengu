/**
 * ============================================================================
 * Tengu — 天狗
 * Version 2.77.2
 * All-in-one wiki moderation tool
 * ============================================================================
 * PURPOSE:
 * An all-in-one moderation script for MediaWiki that streamlines user blocking,
 * rollbacks, page deletions, page undeletions, page protections, and revision deletions from a single interface.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
$(function () {
  mw.loader.load(
    "https://id.wikipedia.org/w/index.php?title=Pengguna:Rachmat04/Tengu.css&action=raw&ctype=text/css",
    "text/css",
  );
  mw.loader.using(["mediawiki.util", "mediawiki.api"], function () {
    mw.loader
      .getScript(
        "https://id.wikipedia.org/w/index.php?title=Pengguna:Rachmat04/Tengu-reasons.js&action=raw&ctype=text/javascript",
      )
      .then(function () {
        return mw.loader.getScript(
          "https://id.wikipedia.org/w/index.php?title=Pengguna:Rachmat04/Tengu-warn.js&action=raw&ctype=text/javascript",
        );
      })
      .then(function () {
        return mw.loader.getScript(
          "https://id.wikipedia.org/w/index.php?title=Pengguna:Rachmat04/Tengu-packages.js&action=raw&ctype=text/javascript",
        );
      })
      .then(function () {
        const INDONESIAN_LANGS = new Set([
          "id",
          "ace",
          "ban",
          "bjn",
          "map-bms",
          "bbc",
          "bew",
          "bug",
          "gor",
          "jv",
          "kge",
          "mad",
          "btm",
          "min",
          "nia",
          "su",
        ]);
        const useIndonesian = INDONESIAN_LANGS.has(
          mw.config.get("wgContentLanguage"),
        );

        const tenguReasonsObj = window.TenguReasons.get(useIndonesian);
        const ROLLBACK_REASONS = tenguReasonsObj.ROLLBACK_REASONS;
        const BLOCK_REASONS = tenguReasonsObj.BLOCK_REASONS;
        const PAGE_DELETE_REASONS = tenguReasonsObj.PAGE_DELETE_REASONS;
        const PROTECTION_REASONS = tenguReasonsObj.PROTECTION_REASONS;
        const REVDEL_REASONS = tenguReasonsObj.REVDEL_REASONS;
        const UNDELETE_REASONS = tenguReasonsObj.UNDELETE_REASONS;
        const UNBLOCK_REASONS = tenguReasonsObj.UNBLOCK_REASONS;
        const PROTECT_RECREATION_REASONS =
          tenguReasonsObj.PROTECT_RECREATION_REASONS;
        const MOVE_TO_SANDBOX_REASONS = tenguReasonsObj.MOVE_TO_SANDBOX_REASONS;
        const MOVE_REASONS = tenguReasonsObj.MOVE_REASONS;
        const GLOBAL_SYSOPS_REPORT_REASONS =
          tenguReasonsObj.GLOBAL_SYSOPS_REPORT_REASONS;
        const SRG_REPORT_REASONS = tenguReasonsObj.SRG_REPORT_REASONS;

        const tenguWarnObj = window.TenguWarn.get(useIndonesian);
        const WARN_MESSAGES = tenguWarnObj.WARN_MESSAGES;
        const tenguPackagesObj = window.TenguPackages.get(useIndonesian);
        const DEFAULT_PACKAGE = tenguPackagesObj.DEFAULT_PACKAGE;
        const NATIVE_PRESETS = tenguPackagesObj.NATIVE_PRESETS;
        const PAGE_NATIVE_PRESETS = tenguPackagesObj.PAGE_NATIVE_PRESETS;

        // ============================================================================
        // [Section 00] State
        // Stores runtime configurations and dialogue initialisation flags.
        // ============================================================================
        let config = {};
        let inited = false;
        let cssInited = false; // CSS injected once on first dialogue open
        let escListenerBound = false; // Escape key listener registered once on first overlay

        // Light/dark theme. Defaults to a saved preference if one exists,
        // otherwise falls back to the browser's prefers-color-scheme setting.
        let theme = "light";
        try {
          const storedTheme = localStorage.getItem("tengu-theme");
          if (storedTheme === "dark" || storedTheme === "light") {
            theme = storedTheme;
          } else if (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
          ) {
            theme = "dark";
          }
        } catch (e) {
          // Storage unavailable; keep the "light" default.
        }

        // ============================================================================
        // [Section 01] Stylesheet
        // The CSS components were moved to an external file, [[Pengguna:Rachmat04/Tengu.css]], to allow easier maintenance and quicker iteration without needing to edit the main script.
        // ============================================================================
        const TNG_CSS = ``;

        // ============================================================================
        // [Section 02] Overlay stack
        // Tracks active overlays. The global Escape key listener is registered once,
        // lazily, the first time an overlay is created — not at script load time.
        // ============================================================================
        const overlayStack = [];

        function createOverlay() {
          const overlay = document.createElement("div");
          overlay.className =
            "tng-overlay" + (theme === "dark" ? " tng-theme-dark" : "");
          document.body.appendChild(overlay);

          overlay.closeHandler = function () {
            overlay.remove();
            const idx = overlayStack.indexOf(overlay);
            if (idx > -1) overlayStack.splice(idx, 1);
          };

          overlayStack.push(overlay);

          // Register the Escape key listener once, the first time an overlay is created.
          if (!escListenerBound) {
            escListenerBound = true;
            document.addEventListener(
              "keydown",
              function (e) {
                if (e.key === "Escape" || e.keyCode === 27) {
                  e.preventDefault();
                  e.stopPropagation();
                  const top = overlayStack[overlayStack.length - 1];
                  if (top) {
                    top.closeHandler();
                  }
                }
              },
              true,
            );
          }

          return overlay;
        }

        // Updates the active theme, persists the choice, and immediately
        // re-themes every currently open dialogue (overlayStack may hold
        // more than one if a confirmation or info dialogue is stacked above
        // the main one).
        function setTheme(newTheme) {
          theme = newTheme === "dark" ? "dark" : "light";
          try {
            localStorage.setItem("tengu-theme", theme);
          } catch (e) {
            // Storage unavailable (e.g. private browsing); the choice still
            // applies for the rest of this session, just not persisted.
          }
          for (const ov of overlayStack) {
            ov.classList.add("tng-theme-transitioning");
            ov.classList.toggle("tng-theme-dark", theme === "dark");
            setTimeout(function () {
              ov.classList.remove("tng-theme-transitioning");
            }, 300);
          }
        }

        // ============================================================================
        // [Section 03] Dialogue builder
        // Utility functions to create layout layers and build primary dialogue modal frames.
        // ============================================================================
        function createDialog(opts) {
          const overlay = createOverlay();
          if (opts && opts.onClose) {
            const orig = overlay.closeHandler;
            overlay.closeHandler = function () {
              orig();
              opts.onClose();
            };
          }
          const dialog = document.createElement("div");
          dialog.className =
            "tng-dialog" + (opts && opts.child ? " tng-dialog-child" : "");
          const header = document.createElement("div");
          header.className = "tng-dialog-header";
          const headerLeft = document.createElement("div");
          headerLeft.className = "tng-dialog-header-left";
          headerLeft.innerHTML =
            (opts && opts.icon ? opts.icon + " " : "⛩️ ") +
            mw.html.escape((opts && opts.title) || "Tengu");
          const closeBtn = document.createElement("button");
          closeBtn.className = "tng-dialog-close";
          closeBtn.textContent = "✕";
          closeBtn.title = "Close";
          closeBtn.addEventListener("click", () => overlay.closeHandler());
          header.appendChild(headerLeft);
          header.appendChild(closeBtn);
          const body = document.createElement("div");
          body.className = "tng-dialog-body";
          const footer = document.createElement("div");
          footer.className = "tng-dialog-footer";
          dialog.appendChild(header);
          dialog.appendChild(body);
          dialog.appendChild(footer);
          overlay.appendChild(dialog);
          overlay.addEventListener("click", (e) => {
            if (e.target === overlay) overlay.closeHandler();
          });
          return { overlay, dialog, body, footer };
        }

        // ============================================================================
        // [Section 04] DOM helpers
        // Standardised DOM element generation scripts for form inputs, checkboxes, and section boxes.
        // Includes showNotification(), which applies an inline error state to a target input field,
        // and clearInputError(), which reverts it. Also includes formatApiError(), which annotates
        // permission-related API error strings with a plain-language hint so users understand why
        // an action may have failed.
        // ============================================================================
        function makeRow(labelText) {
          const row = document.createElement("div");
          row.className = "tng-row";
          const lbl = document.createElement("label");
          lbl.className = "tng-label";
          lbl.textContent = labelText;
          const field = document.createElement("div");
          field.className = "tng-field";
          row.appendChild(lbl);
          row.appendChild(field);
          return { row, field };
        }
        function makeSelect(items, cls) {
          const sel = document.createElement("select");
          sel.className = "tng-select" + (cls ? " " + cls : "");
          for (const item of items) {
            if (item.group) {
              const og = document.createElement("optgroup");
              og.label = item.group;
              for (const sub of item.items) {
                const opt = document.createElement("option");
                opt.value = sub.value;
                opt.textContent = sub.label;
                og.appendChild(opt);
              }
              sel.appendChild(og);
            } else {
              const opt = document.createElement("option");
              opt.value = item.value !== undefined ? item.value : item.label;
              opt.textContent = item.label;
              sel.appendChild(opt);
            }
          }
          return sel;
        }
        // Wraps a <select> in a .tng-select-wrap container that provides the custom
        // chevron arrow via ::after. Pass a CSS flex value to apply it to the wrapper
        // when the wrapper itself is a flex item (e.g. in a flex row alongside an input).
        function wrapSelect(sel, flex) {
          const wrap = document.createElement("div");
          wrap.className = "tng-select-wrap";
          if (flex) wrap.style.flex = flex;
          wrap.appendChild(sel);
          return wrap;
        }

        // Wraps a <select> in a container with a filter text box above it.
        // Typing in the box hides non-matching options in real time; clearing it
        // restores all options. Works with both flat lists and <optgroup> elements.
        // Returns { wrap, filter } — wrap replaces the bare <select> in the DOM,
        // filter is the <input> element (exposed so callers can clear it if needed).
        function makeFilteredSelect(sel) {
          const wrap = document.createElement("div");
          wrap.className = "tng-filtered-select";

          const filter = document.createElement("input");
          filter.type = "text";
          filter.className = "tng-input tng-filtered-select-input";
          filter.placeholder = "Filter options...";
          filter.setAttribute("aria-label", "Filter options");

          wrap.appendChild(filter);
          wrap.appendChild(wrapSelect(sel));

          // Collect all <option> elements once, preserving their original parent
          // (<select> or <optgroup>) so they can be moved in and out cleanly.
          const allOptions = Array.from(sel.querySelectorAll("option"));

          filter.addEventListener("input", function () {
            const query = filter.value.toLowerCase().trim();

            if (!query) {
              // Restore everything in original order
              allOptions.forEach(function (opt) {
                opt.hidden = false;
              });
              // Re-show all optgroups
              Array.from(sel.querySelectorAll("optgroup")).forEach(
                function (og) {
                  og.hidden = false;
                },
              );
              return;
            }

            // Hide non-matching options; show matching ones
            allOptions.forEach(function (opt) {
              opt.hidden = !opt.textContent.toLowerCase().includes(query);
            });

            // Hide any optgroup whose every child option is now hidden
            Array.from(sel.querySelectorAll("optgroup")).forEach(function (og) {
              const visible = Array.from(og.querySelectorAll("option")).some(
                function (o) {
                  return !o.hidden;
                },
              );
              og.hidden = !visible;
            });

            // If the currently selected option has become hidden, move focus to
            // the first visible option so the <select> value stays meaningful.
            const selectedOpt = sel.options[sel.selectedIndex];
            if (selectedOpt && selectedOpt.hidden) {
              const firstVisible = allOptions.find(function (o) {
                return !o.hidden;
              });
              if (firstVisible) sel.value = firstVisible.value;
            }
          });

          return { wrap, filter };
        }

        function makeInput(placeholder, cls) {
          const inp = document.createElement("input");
          inp.type = "text";
          inp.className = "tng-input" + (cls ? " " + cls : "");
          if (placeholder) inp.placeholder = placeholder;
          return inp;
        }
        function makeCheckbox(labelText, checked) {
          const wrap = document.createElement("label");
          wrap.className = "tng-checkrow";
          const chk = document.createElement("input");
          chk.type = "checkbox";
          chk.checked = !!checked;
          wrap.appendChild(chk);
          wrap.appendChild(document.createTextNode(" " + labelText));
          return { wrap, chk };
        }
        function makeBtn(label, variant) {
          const btn = document.createElement("button");
          btn.className = "tng-btn tng-btn-" + (variant || "quiet");
          btn.textContent = label;
          return btn;
        }
        function makeSection(title, icon, enabledByDefault) {
          const section = document.createElement("div");
          section.className =
            "tng-section" + (enabledByDefault ? "" : " tng-disabled");
          const hdr = document.createElement("div");
          hdr.className = "tng-section-header";
          const { wrap: chkWrap, chk: enableChk } = makeCheckbox(
            icon + " " + title,
            enabledByDefault,
          );
          enableChk.style.marginRight = "4px";
          hdr.appendChild(chkWrap);
          const arrow = document.createElement("span");
          arrow.className =
            "tng-section-arrow" + (enabledByDefault ? " tng-arrow-up" : "");
          hdr.appendChild(arrow);
          const sectionBody = document.createElement("div");
          sectionBody.className =
            "tng-section-body" + (enabledByDefault ? "" : " tng-hidden");
          section.appendChild(hdr);
          section.appendChild(sectionBody);
          // Checkbox controls enabled/disabled state only.
          // Enabling also opens the section body if it was collapsed.
          enableChk.addEventListener("change", function () {
            section.classList.toggle("tng-disabled", !enableChk.checked);
            if (enableChk.checked) {
              sectionBody.classList.remove("tng-hidden");
              arrow.classList.add("tng-arrow-up");
            }
          });
          // Header click (outside the checkbox label) toggles section open/closed.
          // Locked sections (checkbox disabled) cannot be expanded.
          hdr.addEventListener("click", function (e) {
            if (chkWrap.contains(e.target)) return;
            if (enableChk.disabled) return;
            const isHidden = sectionBody.classList.toggle("tng-hidden");
            arrow.classList.toggle("tng-arrow-up", !isHidden);
          });
          return { section, sectionBody, enableChk };
        }
        // Displays a validation error directly within the target input field.
        // Applies an error border and sets the placeholder to the message text,
        // then reverts automatically after 5 seconds or when the user types.
        function showNotification(parent, message) {
          const inp = parent.querySelector(".tng-input") || parent;
          if (!inp.classList.contains("tng-input-error")) {
            inp.dataset.tngOrigPlaceholder = inp.placeholder;
          }
          if (inp._tngErrTimeout) clearTimeout(inp._tngErrTimeout);
          inp.classList.add("tng-input-error");
          inp.placeholder = "️️⚠️️️ " + message;
          inp._tngErrTimeout = setTimeout(function () {
            inp.classList.remove("tng-input-error");
            inp.placeholder = inp.dataset.tngOrigPlaceholder || "";
            delete inp.dataset.tngOrigPlaceholder;
          }, 5000);
        }
        // Clears an active inline field error, restoring the original placeholder.
        function clearInputError(inp) {
          if (inp._tngErrTimeout) clearTimeout(inp._tngErrTimeout);
          inp.classList.remove("tng-input-error");
          inp.placeholder = inp.dataset.tngOrigPlaceholder || "";
          delete inp.dataset.tngOrigPlaceholder;
        }
        // Formats a raw API error string with a plain-language hint when the error
        // indicates a permission problem. Helps users understand why an action failed —
        // particularly when they lack the rights required for block, protect, delete,
        // revdel, or oversight operations.
        function formatApiError(rawError) {
          const e = String(rawError);
          const permissionCodes = [
            "permissiondenied",
            "noedit",
            "notallowed",
            "blocked",
            "autoblocked",
            "protectedpage",
            "cascadeprotected",
            "nosuppress",
            "badaccess-groups",
          ];
          for (const code of permissionCodes) {
            if (e === code || e.startsWith(code + ":")) {
              return (
                e +
                " — you may not have the necessary permissions to perform this action."
              );
            }
          }
          return e;
        }

        // Translates a MediaWiki duration string into Indonesian for use in
        // Indonesian-language notifications. Returns the original string unchanged
        // if no mapping is found.
        function translateDurationId(duration) {
          if (!duration) return duration;
          const units = {
            second: "detik",
            seconds: "detik",
            minute: "menit",
            minutes: "menit",
            hour: "jam",
            hours: "jam",
            day: "hari",
            days: "hari",
            week: "minggu",
            weeks: "minggu",
            month: "bulan",
            months: "bulan",
            year: "tahun",
            years: "tahun",
          };
          return duration.replace(
            /(\d+)\s*(seconds|second|minutes|minute|hours|hour|days|day|weeks|week|months|month|years|year)/gi,
            function (_, n, unit) {
              return n + " " + (units[unit.toLowerCase()] || unit);
            },
          );
        }

        // Creates a read-only collapsible section without an enable/disable checkbox.
        // Used by the user info panel to display log entries in an expandable container.
        function makeDisplaySection(title, icon) {
          const section = document.createElement("div");
          section.className = "tng-section";
          const hdr = document.createElement("div");
          hdr.className = "tng-section-header";
          const titleSpan = document.createElement("span");
          titleSpan.textContent = icon + " " + title;
          hdr.appendChild(titleSpan);
          const arrow = document.createElement("span");
          arrow.className = "tng-section-arrow";
          hdr.appendChild(arrow);
          const sectionBody = document.createElement("div");
          sectionBody.className = "tng-section-body tng-hidden";
          sectionBody.style.maxHeight = "360px";
          hdr.addEventListener("click", function () {
            const isHidden = sectionBody.classList.toggle("tng-hidden");
            arrow.classList.toggle("tng-arrow-up", !isHidden);
          });
          section.appendChild(hdr);
          section.appendChild(sectionBody);
          return { section, sectionBody, arrow };
        }

        // ============================================================================
        // [Section 05] Shared API instance and promisified wrappers
        // A single mw.Api instance is shared across work() and getUserInfo().
        // Promisified wrappers convert jQuery Deferred objects to standard ES6 promises,
        // defined once here rather than duplicated inside each function.
        // ============================================================================
        const api = new mw.Api();

        const apiGet = (params) =>
          new Promise((resolve, reject) => {
            api
              .get(params)
              .done(resolve)
              .fail((code, err) =>
                reject(
                  code +
                    (err && err.error && err.error.info
                      ? ": " + err.error.info
                      : ""),
                ),
              );
          });

        const apiPost = (params) =>
          new Promise((resolve, reject) => {
            api
              .postWithEditToken(params)
              .done(resolve)
              .fail((code, err) =>
                reject(
                  code +
                    (err && err.error && err.error.info
                      ? ": " + err.error.info
                      : ""),
                ),
              );
          });

        const apiRollback = (title, user, params) =>
          new Promise((resolve, reject) => {
            api
              .rollback(title, user, params)
              .done(resolve)
              .fail((code, err) =>
                reject(
                  code +
                    (err && err.error && err.error.info
                      ? ": " + err.error.info
                      : ""),
                ),
              );
          });

        // Checks whether a page currently exists. Used before posting a
        // notification to a talk page: an existing page may already contain
        // earlier discussion, so two blank lines keep the new notice visually
        // separated from it, but a page that does not exist yet should not
        // start with leading blank lines.
        const pageExists = async (title) => {
          try {
            const data = await apiGet({
              action: "query",
              titles: title,
              formatversion: 2,
            });
            const page = data.query && data.query.pages && data.query.pages[0];
            return !!(page && !page.missing);
          } catch (e) {
            // If the check fails, assume the page exists so the existing
            // separator behaviour is kept rather than risking a malformed post.
            return true;
          }
        };

        // Loads mw.ForeignApi and returns an instance pointed at Meta-Wiki.
        function getMetaForeignApi() {
          return new Promise((resolve, reject) => {
            mw.loader.using(
              "mediawiki.ForeignApi",
              function () {
                try {
                  resolve(
                    new mw.ForeignApi("https://meta.wikimedia.org/w/api.php"),
                  );
                } catch (e) {
                  reject(e);
                }
              },
              reject,
            );
          });
        }

        // Appends a pre-built report line to the bottom of Meta-Wiki's
        // Global sysops/Requests page via action=edit + appendtext, avoiding
        // a separate fetch-then-save round trip. Not marked as a bot edit, so
        // the report stays visible in normal recent-changes views.
        // summaryText is built by the caller so it can reflect whether an
        // account or a page is being reported.
        async function submitGlobalSysopsReport(reportLine, summaryText) {
          const foreignApi = await getMetaForeignApi();
          await new Promise((resolve, reject) => {
            foreignApi
              .postWithEditToken({
                action: "edit",
                title: "Global sysops/Requests",
                appendtext: "\n" + reportLine,
                summary: summaryText,
              })
              .done(resolve)
              .fail((code, err) =>
                reject(
                  code +
                    (err && err.error && err.error.info
                      ? ": " + err.error.info
                      : ""),
                ),
              );
          });
        }

        // Fetches a promisified GET response from Meta-Wiki via
        // mw.ForeignApi. Used to read page content for duplicate-report
        // checks before submitting to a cross-wiki venue, since the local
        // apiGet() helper above only talks to the current wiki.
        async function foreignApiGet(params) {
          const foreignApi = await getMetaForeignApi();
          return new Promise((resolve, reject) => {
            foreignApi
              .get(params)
              .done(resolve)
              .fail((code, err) =>
                reject(
                  code +
                    (err && err.error && err.error.info
                      ? ": " + err.error.info
                      : ""),
                ),
              );
          });
        }

        // Title of the Steward requests/Global (SRG) page on Meta-Wiki.
        const SRG_PAGE_TITLE = "Steward requests/Global";

        // Section headings used as insertion anchors on the SRG page. A new
        // global block request is inserted immediately above the heading
        // that starts the lock section (i.e. at the end of the block
        // section); a new global lock request is inserted immediately above
        // the "See also" heading near the foot of the page (i.e. at the end
        // of the lock section).
        const SRG_INSERT_BEFORE = {
          block: "== Requests for global (un)lock and (un)hiding ==",
          lock: "== See also ==",
        };

        // Submits a report to Steward requests/Global, inserting the new
        // section immediately above the relevant anchor heading rather than
        // appending to the bottom of the page (cf. submitGlobalSysopsReport()
        // above, which appends to the very end of Global sysops/Requests).
        // Throws, without submitting, if a report referencing the same
        // target already appears to be open, to reduce the chance of
        // duplicate filings.
        async function submitSRGReport(
          kind,
          target,
          sectionWikitext,
          summaryText,
        ) {
          const data = await foreignApiGet({
            action: "query",
            prop: "revisions",
            titles: SRG_PAGE_TITLE,
            rvslots: "main",
            rvprop: "content",
            formatversion: 2,
          });
          const page = data.query && data.query.pages && data.query.pages[0];
          const content =
            (page &&
              page.revisions &&
              page.revisions[0] &&
              page.revisions[0].slots &&
              page.revisions[0].slots.main &&
              page.revisions[0].slots.main.content) ||
            "";

          const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const dupRe = new RegExp(
            "\\{\\{(?:Status|LockHide|MultiLock|Luxotool)[^}]*\\b" +
              escapedTarget +
              "\\b",
            "i",
          );
          if (dupRe.test(content)) {
            throw new Error(
              "a report for this target already appears to be open on Steward requests/Global",
            );
          }

          const anchor = SRG_INSERT_BEFORE[kind];
          const anchorIndex = content.indexOf(anchor);
          let newContent;
          if (anchorIndex === -1) {
            // Anchor heading not found; fall back to appending at the end
            // rather than failing outright.
            newContent =
              content.replace(/\s*$/, "") + "\n\n" + sectionWikitext + "\n";
          } else {
            newContent =
              content.slice(0, anchorIndex) +
              sectionWikitext +
              "\n\n" +
              content.slice(anchorIndex);
          }

          const foreignApi = await getMetaForeignApi();
          await new Promise((resolve, reject) => {
            foreignApi
              .postWithEditToken({
                action: "edit",
                title: SRG_PAGE_TITLE,
                text: newContent,
                summary: summaryText,
              })
              .done(resolve)
              .fail((code, err) =>
                reject(
                  code +
                    (err && err.error && err.error.info
                      ? ": " + err.error.info
                      : ""),
                ),
              );
          });
        }

        // Hostnames of wikis known to fall outside the scope of the global
        // sysops service. This is now the sole source of truth for global
        // sysops eligibility, read directly by globalSysopsScopePromise
        // (Section 09). A prior version fell back to a CentralAuth
        // list=wikisets lookup for hosts not on this list, but that request
        // returns the full wikisincluded array for every wikiset and was
        // slow on every wiki not listed here — i.e. most eligible wikis —
        // so it was removed in favour of relying on this list alone. Keep
        // this list accurate and up to date, since there is no longer an
        // API-based fallback to catch omissions.
        const GS_INELIGIBLE_HOSTS = new Set([
          "an.wikipedia.org",
          "ar.wikipedia.org",
          "bg.wikipedia.org",
          "bn.wikipedia.org",
          "ca.wikipedia.org",
          "cs.wikipedia.org",
          "cy.wikipedia.org",
          "da.wikipedia.org",
          "de.wikipedia.org",
          "el.wikipedia.org",
          "en.wikipedia.org",
          "eo.wikipedia.org",
          "es.wikipedia.org",
          "et.wikipedia.org",
          "eu.wikipedia.org",
          "fa.wikipedia.org",
          "fi.wikipedia.org",
          "fr.wikipedia.org",
          "he.wikipedia.org",
          "hr.wikipedia.org",
          "hu.wikipedia.org",
          "id.wikipedia.org",
          "is.wikipedia.org",
          "it.wikipedia.org",
          "ja.wikipedia.org",
          "ka.wikipedia.org",
          "ko.wikipedia.org",
          "lv.wikipedia.org",
          "mk.wikipedia.org",
          "ml.wikipedia.org",
          "mr.wikipedia.org",
          "nl.wikipedia.org",
          "nn.wikipedia.org",
          "no.wikipedia.org",
          "pl.wikipedia.org",
          "pt.wikipedia.org",
          "ro.wikipedia.org",
          "ru.wikipedia.org",
          "simple.wikipedia.org",
          "sk.wikipedia.org",
          "sl.wikipedia.org",
          "sv.wikipedia.org",
          "ta.wikipedia.org",
          "te.wikipedia.org",
          "th.wikipedia.org",
          "tr.wikipedia.org",
          "ur.wikipedia.org",
          "zh.wikipedia.org",
          "zh-yue.wikipedia.org",
          "cs.wiktionary.org",
          "de.wiktionary.org",
          "en.wiktionary.org",
          "fr.wiktionary.org",
          "nl.wiktionary.org",
          "pl.wiktionary.org",
          "de.wikisource.org",
          "en.wikisource.org",
          "fr.wikisource.org",
          "he.wikisource.org",
          "pl.wikisource.org",
          "wikisource.org",
          "de.wikivoyage.org",
          "commons.wikimedia.org",
          "www.wikidata.org",
          "meta.wikimedia.org",
          "login.wikimedia.org",
          "pl.wikimedia.org",
          "se.wikimedia.org",
          "test.wikipedia.org",
        ]);

        // ============================================================================
        // [Section 06] Dropdown list reasons
        // Houses pre-populated reason sets for rollbacks, page deletions, and block actions.
        // MOVED to [[Tengu-reasons.js]]
        // ============================================================================

        // ============================================================================
        // [Section 07] Main work function
        // Executes API orchestration loops for user blocks, rollbacks, deletions, and page undeletions whilst piping execution log messages.
        // ============================================================================
        const work = async function () {
          let isAborted = false;
          const stats = {
            block: 0,
            unblock: 0,
            rollback: 0,
            revdel: 0,
            delete: 0,
            undelete: 0,
            move: 0,
            protect: 0,
            unlink: 0,
            report: 0,
            error: 0,
          };
          const toolTag = " · [[w:id:Pengguna:Rachmat04/Tengu.js|⛩️]]";
          // Inter-request throttle delay (ms). Applied after each write API call
          // to spread requests out and reduce the risk of hitting the wiki's rate
          // limits during large batch operations. Centralised here so the value
          // can be adjusted in one place.
          const THROTTLE_MS = 50;

          // Build progress UI
          const { overlay, body, footer } = createDialog({
            title: "Processing Tengu tasks",
            icon: "⛩️",
            child: true,
            onClose: () => {
              window.location.href = mw.util.getUrl(
                mw.config.get("wgPageName"),
              );
            },
          });

          // Helper function to update status dynamically
          const updateStatusDisplay = () => {
            const statusText = isAborted ? "Aborted." : "Processing...";
            const summaryLine = `<b>Status:</b> ${statusText}<br/>Summary: <b>${stats.rollback}</b> reverted | <b>${stats.delete}</b> deleted | <b>${stats.undelete}</b> undeleted | <b>${stats.move}</b> moved | <b>${stats.unlink}</b> unlinked | <b>${stats.protect}</b> protected | <b>${stats.revdel}</b> hidden | <b>${stats.report}</b> reported | <b>${stats.error}</b> errors.`;
            statusLbl.innerHTML = summaryLine;
          };

          const statusLbl = document.createElement("div");
          statusLbl.innerHTML =
            "<b>Status:</b> Processing...<br/>Summary: <b>0</b> reverted | <b>0</b> deleted | <b>0</b> undeleted | <b>0</b> moved | <b>0</b> unlinked | <b>0</b> protected | <b>0</b> hidden | <b>0</b> reported | <b>0</b> errors.";
          statusLbl.style.marginBottom = "8px";

          const logBox = document.createElement("div");
          logBox.className = "tng-log-box";

          body.appendChild(statusLbl);
          body.appendChild(logBox);

          const btnAbort = document.createElement("button");
          btnAbort.className = "tng-btn tng-btn-destructive";
          btnAbort.textContent = "Abort operations";
          btnAbort.addEventListener("click", () => {
            if (!isAborted) {
              isAborted = true;
              btnAbort.disabled = true;
              btnAbort.textContent = "Aborting...";
              addLog("️️⚠️️️ Operations are being aborted...");
            }
          });
          footer.appendChild(btnAbort);

          const btnClose = document.createElement("button");
          btnClose.className = "tng-btn tng-btn-primary";
          btnClose.textContent = "Close and reload";
          btnClose.disabled = true; // Disabled until all tasks are complete
          btnClose.addEventListener("click", () => overlay.closeHandler());
          footer.appendChild(btnClose);

          // Helper function to append log entries.
          // isErr: true = error (red), "warn" = warning (amber), omit/false = success (green).
          let logCount = 0;
          const addLog = (msg, isErr) => {
            const d = document.createElement("div");
            logCount++;
            const _n = new Date();
            const _ts =
              _n.getUTCFullYear() +
              "-" +
              String(_n.getUTCMonth() + 1).padStart(2, "0") +
              "-" +
              String(_n.getUTCDate()).padStart(2, "0") +
              " " +
              String(_n.getUTCHours()).padStart(2, "0") +
              ":" +
              String(_n.getUTCMinutes()).padStart(2, "0") +
              ":" +
              String(_n.getUTCSeconds()).padStart(2, "0") +
              " UTC";
            d.textContent = logCount + ". [" + _ts + "] " + msg;
            if (isErr === "warn") {
              d.className = "tng-log-warn";
            } else if (isErr) {
              d.className = "tng-log-err";
              stats.error++;
              updateStatusDisplay();
            } else {
              d.className = "tng-log-succ";
            }
            logBox.appendChild(d);
            logBox.scrollTop = logBox.scrollHeight;
          };

          // Add clear visibility notice that the automated process is currently ongoing
          addLog("⏳ Processing operations... please wait...");

          const targetVal = config.target;

          const notifySummaryBlock =
            (useIndonesian
              ? "Notifikasi: Pemberitahuan pemblokiran akun"
              : "Notification: Account block notice") + toolTag;
          const notifySummaryDelete =
            (useIndonesian
              ? "Notifikasi: Pemberitahuan penghapusan halaman"
              : "Notification: Page deletion notice") + toolTag;
          const notifySummaryProtect =
            (useIndonesian
              ? "Notifikasi: Pemberitahuan perlindungan halaman"
              : "Notification: Page protection notice") + toolTag;

          const notifySummaryWarn =
            (useIndonesian
              ? "Notifikasi: Peringatan pengguna"
              : "Notification: User warning") + toolTag;

          // --- User warning ---
          // Only runs in user mode; config.warn is only set when the warn
          // section is enabled and a message template has been selected.
          if (config.warn && config.mode === "user" && !isAborted) {
            const talkTitle = new mw.Title(targetVal, 3).getPrefixedText();
            const notice = config.warnNotice;
            try {
              const talkExists = await pageExists(talkTitle);
              await apiPost({
                action: "edit",
                title: talkTitle,
                appendtext: (talkExists ? "\n\n" : "") + notice,
                summary: notifySummaryWarn,
                bot: true,
              });
              addLog(`[Warn] Warning posted to: ${talkTitle}`);
            } catch (e) {
              addLog(
                `[Warn] Failed to post warning to ${talkTitle}: ${formatApiError(e)}`,
                "warn",
              );
            }
          }

          // --- Block ---
          if (config.block && config.mode === "user" && !isAborted) {
            let proceedWithBlock = true;

            // Show a confirmation dialogue only when the target account matches the current user.
            const isSelfBlock =
              targetVal.toLowerCase() ===
              (mw.config.get("wgUserName") || "").toLowerCase();
            if (isSelfBlock) {
              const confirmed = await new Promise((resolve) => {
                const { overlay, dialog, body, footer } = createDialog({
                  title: "Self-block confirmation",
                  icon: "️️⚠️️️",
                  child: true,
                  onClose: () => resolve(false),
                });
                body.innerHTML =
                  "<p>You are about to block your own account. Are you certain you wish to proceed?</p>";
                const btnCancel = makeBtn("Cancel", "quiet");
                btnCancel.addEventListener("click", () => {
                  overlay.closeHandler();
                  resolve(false);
                });
                const btnConfirm = makeBtn("Proceed", "destructive");
                btnConfirm.addEventListener("click", () => {
                  overlay.closeHandler();
                  resolve(true);
                });
                footer.appendChild(btnCancel);
                footer.appendChild(btnConfirm);
              });
              if (!confirmed) {
                addLog("[Block] Self-block cancelled", "warn");
                proceedWithBlock = false;
              }
            }

            if (proceedWithBlock) {
              const data = {
                action: "block",
                user: targetVal,
                expiry: config.blockDur,
                reason: config.blockReason + toolTag,
              };
              // If hardblock is checked, we do NOT want anononly=1 (registered users should be blocked too)
              if (config.isIP) {
                if (!config.blockAnon) {
                  data.anononly = 1; // Standard anonymous-only block
                }
                // If config.blockAnon is true (meaning chkHardblock was checked), we omit data.anononly or set it to 0
              } else {
                if (config.blockAuto) data.autoblock = 1;
              }
              if (config.blockCreate) data.nocreate = 1;
              if (!config.blockTalk) data.allowusertalk = 1;
              if (config.blockMail) data.noemail = 1;
              if (config.blockHide) data.hidename = 1;

              try {
                await apiPost(data);
                addLog(`[Block] Successfully blocked user ${targetVal}`);
                stats.block++;
              } catch (e) {
                addLog(
                  `[Block] Failed to block ${targetVal}: ${formatApiError(e)}`,
                  true,
                );
              }

              // Post notification to user talk page (separate from block action above,
              // so a notification failure does not misreport the block as having failed)
              if (stats.block > 0 && config.notifyBlock) {
                const talkTitle = new mw.Title(targetVal, 3).getPrefixedText();
                const isBlockIndef = config.blockDur === "never";

                const notice = useIndonesian
                  ? isBlockIndef
                    ? `== Pemberitahuan pemblokiran akun ==\nHalo ${targetVal},\n\nAkun "${targetVal}" telah diblokir secara tidak terbatas dengan alasan berikut: ${config.blockReason}.\n\nSelama masa pemblokiran, akun ini mungkin tidak dapat melakukan sebagian atau seluruh tindakan yang biasanya memerlukan hak penyuntingan. Pemblokiran ini tidak berakhir secara otomatis dan akan tetap berlaku kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : `== Pemberitahuan pemblokiran akun ==\nHalo ${targetVal},\n\nAkun "${targetVal}" telah diblokir selama ${translateDurationId(config.blockDur)} dengan alasan berikut: ${config.blockReason}.\n\nSelama masa pemblokiran, akun ini mungkin tidak dapat melakukan sebagian atau seluruh tindakan yang biasanya memerlukan hak penyuntingan. Pemblokiran dijadwalkan berakhir pada waktunya, kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                  : isBlockIndef
                    ? `== Account block notice ==\nDear ${targetVal},\n\nThe account "${targetVal}" has been blocked indefinitely due to the following reason: ${config.blockReason}.\n\nDuring the block period, the account may be unable to perform some or all actions that normally require editing privileges. This block does not expire automatically and will remain in effect unless modified by an administrator.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`
                    : `== Account block notice ==\nDear ${targetVal},\n\nThe account "${targetVal}" has been blocked for ${config.blockDur} due to the following reason: ${config.blockReason}.\n\nDuring the block period, the account may be unable to perform some or all actions that normally require editing privileges. The block is scheduled to remain in effect until it expires, unless modified by an administrator.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;

                // When a permanent block is applied with the clear-before-notify option,
                // replace the talk page with the notice in a single edit rather than
                // clearing and then appending as two separate operations.
                const shouldReplace =
                  config.clearTalkPageBeforeNotify && isBlockIndef;
                try {
                  const editParams = {
                    action: "edit",
                    title: talkTitle,
                    summary: notifySummaryBlock,
                    bot: true,
                  };
                  if (shouldReplace) {
                    editParams.text = notice;
                  } else {
                    const talkExists = await pageExists(talkTitle);
                    editParams.appendtext = (talkExists ? "\n\n" : "") + notice;
                  }
                  await apiPost(editParams);
                  addLog(
                    shouldReplace
                      ? `[Notify] Talk page replaced with notification: ${talkTitle}`
                      : `[Notify] Notification posted to: ${talkTitle}`,
                  );
                } catch (e) {
                  addLog(
                    `[Notify] Failed to post block notification to ${talkTitle}: ${formatApiError(e)}`,
                    "warn",
                  );
                }
              }
            } // end if (proceedWithBlock)
          }

          // --- Unblock ---
          if (config.unblock && config.mode === "user" && !isAborted) {
            try {
              await apiPost({
                action: "unblock",
                user: targetVal,
                reason: config.unblockReason + toolTag,
              });
              addLog(`[Unblock] Successfully unblocked ${targetVal}`);
              stats.unblock++;

              if (config.notifyUnblock) {
                const talkTitle = new mw.Title(targetVal, 3).getPrefixedText();
                const notifySummaryUnblock =
                  (useIndonesian
                    ? "Notifikasi: Pemberitahuan pencabutan pemblokiran"
                    : "Notification: Account unblock notice") + toolTag;
                const notice = useIndonesian
                  ? `== Pemberitahuan pencabutan pemblokiran ==\nHalo ${targetVal},\n\nPemblokiran pada akun "${targetVal}" telah dicabut dengan alasan berikut: ${config.unblockReason}.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                  : `== Account unblock notice ==\nDear ${targetVal},\n\nThe block on the account "${targetVal}" has been lifted due to the following reason: ${config.unblockReason}.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                try {
                  const talkExists = await pageExists(talkTitle);
                  await apiPost({
                    action: "edit",
                    title: talkTitle,
                    appendtext: (talkExists ? "\n\n" : "") + notice,
                    summary: notifySummaryUnblock,
                    bot: true,
                  });
                  addLog(`[Notify] Notification posted to: ${talkTitle}`);
                } catch (e) {
                  addLog(
                    `[Notify] Failed to post unblock notification to ${talkTitle}: ${formatApiError(e)}`,
                    "warn",
                  );
                }
              }
            } catch (e) {
              addLog(
                `[Unblock] Failed to unblock ${targetVal}: ${formatApiError(e)}`,
                true,
              );
            }
          }

          // --- Report to global sysops ---
          // Available in both user mode (reporting an account) and page mode
          // (reporting a page for global sysops' attention).
          if (config.reportGS && !isAborted) {
            try {
              const reportGSSummary =
                (config.mode === "page"
                  ? "Reporting page for global sysops' attention"
                  : "Reporting account for global sysops' attention") + toolTag;
              await submitGlobalSysopsReport(
                config.reportGSLine,
                reportGSSummary,
              );
              addLog(
                `[Report] Submitted report to Global sysops/Requests for ${targetVal}`,
              );
              stats.report++;
              updateStatusDisplay();
            } catch (e) {
              addLog(
                `[Report] Failed to submit report to Global sysops/Requests: ${formatApiError(e)}`,
                true,
              );
            }
          }

          // --- Report to Steward requests/Global ---
          // User mode only. Files a global block request when the target is
          // an IP address, or a global lock request when the target is a
          // registered account, on Meta-Wiki's Steward requests/Global page.
          if (config.reportSRG && !isAborted) {
            try {
              const srgSummary =
                (config.reportSRGKind === "block"
                  ? "Reporting IP for global block"
                  : "Reporting account for global lock") + toolTag;
              await submitSRGReport(
                config.reportSRGKind,
                targetVal,
                config.reportSRGSection,
                srgSummary,
              );
              addLog(
                `[Report] Submitted ${config.reportSRGKind === "block" ? "global block" : "global lock"} report to Steward requests/Global for ${targetVal}`,
              );
              stats.report++;
              updateStatusDisplay();
            } catch (e) {
              addLog(
                `[Report] Failed to submit report to Steward requests/Global: ${formatApiError(e)}`,
                true,
              );
            }
          }

          // --- Page undeletion ---
          if (config.undelete && config.mode === "page" && !isAborted) {
            try {
              await apiPost({
                action: "undelete",
                title: targetVal,
                reason: config.undeleteReason + toolTag,
              });
              addLog(`[Undelete] Successfully restored page: ${targetVal}`);
              stats.undelete++;
              updateStatusDisplay();
            } catch (e) {
              addLog(
                `[Undelete] Failed to restore ${targetVal}: ${formatApiError(e)}`,
                true,
              );
            }
          }

          // --- Move page / Move to user's sandbox ---
          if (config.moveSandbox && config.mode === "page" && !isAborted) {
            if (config.moveSandboxMode === "movepage") {
              // General page move. movetalk and movesubpages are native API
              // parameters so the move, talk page move, and subpage moves are
              // handled by the API in a single call rather than as separate requests.
              const moveParams = {
                action: "move",
                from: targetVal,
                to: config.movePageDest,
                reason: config.movePageReason + toolTag,
              };
              if (config.movePageNoRedirect) moveParams.noredirect = 1;
              if (config.movePageTalk) moveParams.movetalk = 1;
              if (config.movePageSubpages) moveParams.movesubpages = 1;
              try {
                await apiPost(moveParams);
                addLog(
                  `[Move] Moved "${targetVal}" to "${config.movePageDest}"`,
                );
                stats.move++;
                updateStatusDisplay();
              } catch (e) {
                addLog(
                  `[Move] Failed to move "${targetVal}" to "${config.movePageDest}": ${formatApiError(e)}`,
                  true,
                );
              }
            } else {
              const moveParams = {
                action: "move",
                from: targetVal,
                to: config.moveSandboxDest,
                reason: config.moveSandboxReason + toolTag,
              };
              if (config.moveSandboxNoRedirect) moveParams.noredirect = 1;
              try {
                await apiPost(moveParams);
                addLog(
                  `[Move] Moved "${targetVal}" to "${config.moveSandboxDest}"`,
                );
                stats.move++;
                updateStatusDisplay();
              } catch (e) {
                addLog(
                  `[Move] Failed to move "${targetVal}" to "${config.moveSandboxDest}": ${formatApiError(e)}`,
                  true,
                );
              }

              // Move the associated talk page if the option was selected.
              if (config.moveSandboxTalk && !isAborted) {
                try {
                  const sourceTitleObj = new mw.Title(targetVal);
                  if (sourceTitleObj.isTalkPage()) {
                    addLog(
                      "[Move] Skipped talk page move: target is already a talk page",
                      "warn",
                    );
                  } else {
                    const sourceTalkTitle = sourceTitleObj
                      .getTalkPage()
                      .getPrefixedText();
                    const talkExistData = await apiGet({
                      action: "query",
                      titles: sourceTalkTitle,
                      formatversion: 2,
                    });
                    const talkPage =
                      talkExistData.query &&
                      talkExistData.query.pages &&
                      talkExistData.query.pages[0];
                    if (talkPage && !talkPage.missing) {
                      const talkMoveParams = {
                        action: "move",
                        from: sourceTalkTitle,
                        to: config.moveSandboxTalkDest,
                        reason:
                          (useIndonesian
                            ? `Memindahkan halaman pembicaraan karena halaman utama yang terkait telah dipindahkan: ${config.moveSandboxReason}`
                            : `Moving the talk page because its associated main page has been moved: ${config.moveSandboxReason}`) +
                          toolTag,
                      };
                      if (config.moveSandboxNoRedirect)
                        talkMoveParams.noredirect = 1;
                      await apiPost(talkMoveParams);
                      addLog(
                        `[Move] Moved talk page "${sourceTalkTitle}" to "${config.moveSandboxTalkDest}"`,
                      );
                      stats.move++;
                      updateStatusDisplay();
                    } else {
                      addLog(
                        `[Move] Skipped talk page move: "${sourceTalkTitle}" does not exist`,
                        "warn",
                      );
                    }
                  }
                } catch (e) {
                  addLog(
                    `[Move] Failed to move talk page to "${config.moveSandboxTalkDest}": ${formatApiError(e)}`,
                    true,
                  );
                }
              }

              // Move all subpages if the option was selected.
              if (config.moveSandboxSubpages && !isAborted) {
                try {
                  const sourceTitleObj = new mw.Title(targetVal);
                  if (sourceTitleObj.isTalkPage()) {
                    addLog(
                      "[Move] Skipped subpage moves: target is already a talk page",
                      "warn",
                    );
                  } else {
                    const ns = sourceTitleObj.getNamespaceId();
                    const mainText = sourceTitleObj.getMain();
                    const spData = await apiGet({
                      action: "query",
                      list: "allpages",
                      apprefix: mainText + "/",
                      apnamespace: ns,
                      aplimit: "max",
                      formatversion: 2,
                    });
                    const subpages =
                      (spData.query && spData.query.allpages) || [];
                    if (!subpages.length) {
                      addLog(
                        `[Move] No subpages found for: ${targetVal}`,
                        "warn",
                      );
                    }
                    // Normalise the source prefix so that the suffix can be
                    // extracted reliably regardless of how the user typed it.
                    const normalizedSource = sourceTitleObj.getPrefixedText();
                    for (const sp of subpages) {
                      if (isAborted) break;
                      const suffix = sp.title.slice(normalizedSource.length); // e.g. "/Section"
                      const spDest = config.moveSandboxDest + suffix;
                      const spMoveParams = {
                        action: "move",
                        from: sp.title,
                        to: spDest,
                        reason:
                          (useIndonesian
                            ? `Memindahkan subhalaman karena halaman utama yang terkait telah dipindahkan: ${config.moveSandboxReason}`
                            : `Moving subpage because its associated main page has been moved: ${config.moveSandboxReason}`) +
                          toolTag,
                      };
                      if (config.moveSandboxNoRedirect)
                        spMoveParams.noredirect = 1;
                      try {
                        await apiPost(spMoveParams);
                        addLog(
                          `[Move] Moved subpage "${sp.title}" to "${spDest}"`,
                        );
                        stats.move++;
                        updateStatusDisplay();
                      } catch (e) {
                        addLog(
                          `[Move] Failed to move subpage "${sp.title}" to "${spDest}": ${formatApiError(e)}`,
                          true,
                        );
                      }

                      // Move the talk page of this subpage if the option is selected.
                      if (config.moveSandboxTalk && !isAborted) {
                        try {
                          const spTitleObj = new mw.Title(sp.title);
                          const spTalkTitle = spTitleObj
                            .getTalkPage()
                            .getPrefixedText();
                          const spTalkExistData = await apiGet({
                            action: "query",
                            titles: spTalkTitle,
                            formatversion: 2,
                          });
                          const spTalkPage =
                            spTalkExistData.query &&
                            spTalkExistData.query.pages &&
                            spTalkExistData.query.pages[0];
                          if (spTalkPage && !spTalkPage.missing) {
                            const spTalkDest =
                              config.moveSandboxTalkDest + suffix;
                            const spTalkMoveParams = {
                              action: "move",
                              from: spTalkTitle,
                              to: spTalkDest,
                              reason:
                                (useIndonesian
                                  ? `Memindahkan halaman pembicaraan subhalaman karena halaman utama yang terkait telah dipindahkan: ${config.moveSandboxReason}`
                                  : `Moving subpage talk page because its associated main page has been moved: ${config.moveSandboxReason}`) +
                                toolTag,
                            };
                            if (config.moveSandboxNoRedirect)
                              spTalkMoveParams.noredirect = 1;
                            await apiPost(spTalkMoveParams);
                            addLog(
                              `[Move] Moved subpage talk page "${spTalkTitle}" to "${spTalkDest}"`,
                            );
                            stats.move++;
                            updateStatusDisplay();
                          } else {
                            addLog(
                              `[Move] Skipped subpage talk page move: "${spTalkTitle}" does not exist`,
                              "warn",
                            );
                          }
                        } catch (e) {
                          addLog(
                            `[Move] Failed to move talk page for subpage "${sp.title}": ${formatApiError(e)}`,
                            true,
                          );
                        }
                      }

                      await new Promise((resolve) =>
                        setTimeout(resolve, THROTTLE_MS),
                      );
                    }
                  }
                } catch (e) {
                  addLog(
                    `[Move] Failed to fetch subpages for "${targetVal}": ${formatApiError(e)}`,
                    true,
                  );
                }
              }
            } // end else (sandbox mode)
          }

          // --- Fetch user contributions OR prepare target page ---
          const pageEdits = {};
          const creation = [];
          const pagesToProtect = new Set();

          if (config.mode === "user" && config.customSelection) {
            // Custom-selection mode: use the items chosen in the picker rather
            // than fetching contributions from the API.
            for (const [title, info] of Object.entries(
              config.selectedPageEdits,
            )) {
              pageEdits[title] = info;
            }
            for (const t of config.selectedCreations) {
              creation.push(t);
            }
            if (!Object.keys(pageEdits).length && !creation.length) {
              addLog(
                "[Info] Custom selection is active but no items were selected — no edits or pages will be processed.",
                "warn",
              );
            }
            if (config.protect) {
              for (const title of Object.keys(pageEdits)) {
                pagesToProtect.add(title);
              }
              if (!config.massdel) {
                for (const title of creation) {
                  pagesToProtect.add(title);
                }
              }
            }
          }

          if (config.mode === "user" && !config.customSelection) {
            const contribParams = {
              action: "query",
              list: "usercontribs",
              ucuser: targetVal,
              uclimit: "max",
            };
            if (config.betweenMode) {
              // Between-dates mode: ucend is the older (from) boundary;
              // ucstart is the newer (to) boundary. Either may be null if
              // the user left that picker blank, in which case the API
              // returns edits up to or from the filled-in date with no
              // constraint on the other end.
              if (config.betweenFrom) contribParams.ucend = config.betweenFrom;
              if (config.betweenTo) contribParams.ucstart = config.betweenTo;
            } else if (config.endtime !== "inf") {
              const untildate = new Date();
              untildate.setSeconds(
                untildate.getSeconds() - parseInt(config.endtime),
              );
              contribParams.ucend = untildate.toISOString();
            }

            let contribs = [];
            let hasMore = true;
            let continueToken = {};

            while (hasMore && !isAborted) {
              const params = Object.assign({}, contribParams, continueToken);
              try {
                const data = await apiGet(params);
                if (data.query && data.query.usercontribs) {
                  contribs = contribs.concat(data.query.usercontribs);
                }
                if (data.continue) {
                  continueToken = data.continue;
                } else {
                  hasMore = false;
                }
              } catch (e) {
                addLog(
                  `[Error] Failed to fetch contribution history: ${formatApiError(e)}`,
                  true,
                );
                hasMore = false;
              }
            }

            if (!contribs.length && !isAborted) {
              addLog("[Info] No contributions found within this timeframe");
            } else if (!isAborted) {
              for (const edit of contribs) {
                if (edit.new === "") {
                  creation.push(edit.title);
                } else {
                  if (!pageEdits[edit.title]) {
                    pageEdits[edit.title] = {
                      revids: [],
                      latest: edit.revid,
                      oldestParent: edit.parentid,
                    };
                  }
                  pageEdits[edit.title].revids.push(edit.revid);
                  pageEdits[edit.title].oldestParent = edit.parentid;
                }
              }

              // Aggregate pages for mass protection to avoid duplicates and skip deleted records
              if (config.protect) {
                for (const title of Object.keys(pageEdits)) {
                  pagesToProtect.add(title);
                }
                if (!config.massdel) {
                  for (const title of creation) {
                    pagesToProtect.add(title);
                  }
                }
              }
            }
          } else if (config.mode === "page") {
            // Page mode: bypass fetching and apply operations directly to the target page
            if (config.protect) pagesToProtect.add(targetVal);
            if (config.massdel) creation.push(targetVal);
          }

          // Pages scheduled for both deletion and protection must be deleted first,
          // then protected against recreation. Protecting before deletion causes the
          // protection to be lost when the page is removed. Identify the overlap now
          // and defer those pages to a second protect pass that runs after deletion.
          const creationSet = new Set(creation);
          const pagesToProtectAfterDel = new Set(
            [...pagesToProtect].filter(function (t) {
              return creationSet.has(t);
            }),
          );
          for (const t of pagesToProtectAfterDel) {
            pagesToProtect.delete(t);
          }

          // Process rollbacks, undos and revision deletions sequentially with a throttling buffer delay
          for (const [title, info] of Object.entries(pageEdits)) {
            if (isAborted) break;

            const idlist = info.revids;

            if (!config.rollback) {
              // Only revision delete
              if (config.rd) {
                try {
                  await apiPost({
                    action: "revisiondelete",
                    type: "revision",
                    ids: idlist,
                    hide: config.rdHides,
                    reason: config.rdReason + toolTag,
                    suppress: config.os ? "yes" : "nochange",
                  });
                  addLog(
                    `[Revdel] Hiding ${idlist.length} revisions at: ${title}`,
                  );
                  stats.revdel++;
                  updateStatusDisplay();
                } catch (e) {
                  addLog(
                    `[Revdel] Failed at ${title}: ${formatApiError(e)}`,
                    true,
                  );
                }
              }
              await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS)); // Rate limit buffer
              continue;
            }

            // --- MEDIAINFO / STRUCTURED DATA CHECK ---
            // Because structured data edits cannot be undone natively via rollback or normal undo,
            // we independently check if the mediainfo slot was modified in this revision range.
            let mediainfoNeedsRevert = false;
            let goodMediaInfo = null;
            let pageId = null;
            // Content model of the current page's main slot. Set during the
            // revision fetch below; used to detect ZObject pages (Wikifunctions)
            // and choose the appropriate revert method.
            // ZObjects may not be reliably reverted via action=edit undo, since
            // the undo path depends on a wikitext three-way merge that may not
            // work for JSON-structured content.
            let pageContentModel = null;
            // Username of the author of the revision being reverted to (the
            // parent of the target's earliest edit in this batch). Used below
            // to make the undo edit summary clearer about which revision was
            // restored.
            let previousEditorUser = null;

            try {
              const revidsToFetch = info.oldestParent
                ? `${info.latest}|${info.oldestParent}`
                : `${info.latest}`;
              const compData = await apiGet({
                action: "query",
                prop: "revisions",
                revids: revidsToFetch,
                rvprop: "ids|content|user|contentmodel",
                rvslots: "mediainfo",
              });

              const pages = compData.query && compData.query.pages;
              if (pages) {
                pageId = Object.keys(pages)[0];
                const revs = pages[pageId].revisions;
                if (revs && revs.length > 0) {
                  let latestMI = null;
                  let oldestMI = null;
                  for (const r of revs) {
                    if (r.revid === info.oldestParent) {
                      previousEditorUser = r.user || null;
                    }
                    if (r.revid === info.latest) {
                      pageContentModel = r.contentmodel || null;
                    }
                    if (r.slots && r.slots.mediainfo) {
                      if (r.revid === info.latest)
                        latestMI = r.slots.mediainfo["*"];
                      if (r.revid === info.oldestParent)
                        oldestMI = r.slots.mediainfo["*"];
                    }
                  }

                  if (latestMI !== null && latestMI !== oldestMI) {
                    mediainfoNeedsRevert = true;
                    goodMediaInfo = oldestMI
                      ? JSON.parse(oldestMI)
                      : { statements: {} };
                  }
                }
              }
            } catch (e) {
              // Gracefully ignore on wikis without Wikibase/MediaInfo configured,
              // or on pages/namespaces where the mediainfo slot is fundamentally unavailable.
              // This also covers ZObject pages on Wikifunctions, where the mediainfo
              // slot is absent; pageContentModel is set within the same try block and
              // is used separately below to choose the appropriate revert method.
              // previousEditorUser remains null in this case; the undo summary
              // falls back to its previous wording below.
            }

            // ZObjects (Wikifunctions content model "zobject") are stored as JSON
            // and cannot be reliably reverted via action=edit undo, since the undo
            // path performs a wikitext three-way merge. When undo is selected and a
            // ZObject page is detected, Tengu falls back to native rollback, which
            // operates at the database level and is not content-model-specific.
            const isZObject = pageContentModel === "zobject";
            if (isZObject && config.rollbackMethod === "undo") {
              addLog(
                `[Rollback] ZObject content model detected at ${title}: undo is not supported for this content model. Falling back to native rollback.`,
                "warn",
              );
            }

            let standardRevertSuccess = false;
            let standardErr = null;

            // When no custom reason is supplied and the username is shown,
            // name both the reverted user and the author of the revision
            // being restored, where known, so it is clear which revision the
            // page was reverted to. Falls back to the previous wording when
            // the previous editor could not be determined (e.g. the lookup
            // above failed, or there is no parent revision).
            const undoSummaryStr = config.rollbackReason
              ? config.rollbackReason + toolTag
              : config.rollbackShow
                ? (previousEditorUser
                    ? useIndonesian
                      ? `Membatalkan suntingan ${targetVal} ke suntingan sebelumnya oleh ${previousEditorUser}`
                      : `Revert ${targetVal}'s edits to the previous edit by ${previousEditorUser}`
                    : useIndonesian
                      ? "Membatalkan suntingan oleh " + targetVal
                      : "Reverting edits by " + targetVal) + toolTag
                : (useIndonesian ? "Membatalkan suntingan" : "Revert edits") +
                  toolTag;

            const rbSummaryStr = config.rollbackReason
              ? config.rollbackReason + toolTag
              : config.rollbackShow
                ? (previousEditorUser
                    ? useIndonesian
                      ? `Membatalkan suntingan ${targetVal} ke suntingan sebelumnya oleh ${previousEditorUser}`
                      : `Revert ${targetVal}'s edits to the previous edit by ${previousEditorUser}`
                    : useIndonesian
                      ? "Membatalkan suntingan oleh " + targetVal
                      : "Reverting edits by " + targetVal) + toolTag
                : (useIndonesian ? "Membatalkan suntingan" : "Revert edits") +
                  toolTag;

            // Execute standard rollback or undo operation sequentially based on settings
            if (config.rollbackMethod === "undo" && !isZObject) {
              const undoData = {
                action: "edit",
                title: title,
                undo: info.latest,
                summary: undoSummaryStr,
              };
              if (info.oldestParent) undoData.undoafter = info.oldestParent;
              if (config.rollbackBot) undoData.bot = 1;

              try {
                await apiPost(undoData);
                addLog(`[Undo] Successfully reverted edits via undo: ${title}`);
                standardRevertSuccess = true;
                stats.rollback++;
                updateStatusDisplay();
              } catch (e) {
                standardErr = String(e);
                if (
                  standardErr.includes("alreadyreverted") ||
                  standardErr.includes("nothingtorevert")
                ) {
                  if (!mediainfoNeedsRevert) {
                    addLog(
                      `[Undo] Skipped: ${title} — page had already been reverted by another user; undo was not applied by this operation`,
                      "warn",
                    );
                  }
                } else {
                  addLog(
                    `[Undo] Failed at ${title}: ${formatApiError(e)}`,
                    true,
                  );
                }
              }
            } else {
              // Native rollback
              const rbData = config.rollbackBot ? { markbot: 1 } : {};
              rbData.summary = rbSummaryStr;

              try {
                await apiRollback(title, targetVal, rbData);
                addLog(`[Rollback] Successfully reverted: ${title}`);
                standardRevertSuccess = true;
                stats.rollback++;
                updateStatusDisplay();
              } catch (e) {
                standardErr = String(e);
                if (
                  standardErr.includes("alreadyreverted") ||
                  standardErr.includes("onlyauthor")
                ) {
                  if (!mediainfoNeedsRevert) {
                    addLog(
                      `[Rollback] Skipped: ${title} — already reverted or user is the only author`,
                      "warn",
                    );
                  }
                } else {
                  addLog(
                    `[Rollback] Failed at ${title}: ${formatApiError(e)}`,
                    true,
                  );
                }
              }
            }

            // --- MEDIAINFO / STRUCTURED DATA REVERT EXECUTION ---
            if (mediainfoNeedsRevert && pageId) {
              try {
                let restoredData = Object.assign({}, goodMediaInfo);
                if (restoredData.statements) {
                  restoredData.claims = restoredData.statements;
                  delete restoredData.statements;
                } else if (!restoredData.claims) {
                  restoredData.claims = {};
                }

                await apiPost({
                  action: "wbeditentity",
                  id: "M" + pageId,
                  clear: true,
                  data: JSON.stringify(restoredData),
                  summary:
                    config.rollbackMethod === "undo"
                      ? undoSummaryStr
                      : rbSummaryStr || undoSummaryStr,
                  bot: config.rollbackBot ? 1 : 0,
                });
                addLog(
                  `[Undo] Successfully reverted structured data at: ${title}`,
                );
                if (!standardRevertSuccess) {
                  stats.rollback++;
                  updateStatusDisplay();
                }
              } catch (e) {
                addLog(
                  `[Undo] Failed to revert structured data at ${title}: ${formatApiError(e)}`,
                  true,
                );
              }
            }

            // Trigger revision deletion if either standard or mediainfo revert succeeded, or if we need to revdel anyway.
            if (
              config.rd &&
              !isAborted &&
              (standardRevertSuccess || mediainfoNeedsRevert)
            ) {
              try {
                await apiPost({
                  action: "revisiondelete",
                  type: "revision",
                  ids: idlist,
                  hide: config.rdHides,
                  reason: config.rdReason + toolTag,
                  suppress: config.os ? "yes" : "nochange",
                });
                addLog(`[Revdel] Hiding revisions at: ${title}`);
                stats.revdel++;
                updateStatusDisplay();
              } catch (e) {
                addLog(
                  `[Revdel] Failed at ${title}: ${formatApiError(e)}`,
                  true,
                );
              }
            }

            await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS)); // Throttling window
          }

          const notifyQueue = new Map();

          // Builds the protections parameter for a page protection request, adding
          // upload= for File-namespace pages. Assumes upload-level
          // protection is submitted through the same action=protect call as edit/move;
          // this has not been independently confirmed against the MediaWiki API.
          function buildPageProtections(title) {
            let protections = `edit=${config.protectEdit}|move=${config.protectMove}`;
            try {
              if (new mw.Title(title).getNamespaceId() === 6) {
                protections += `|upload=${config.protectUpload}`;
              }
            } catch (e) {
              // Skip if the title cannot be resolved
            }
            return protections;
          }

          // Execute sequential page protections if enabled
          if (config.protect && pagesToProtect.size > 0) {
            for (const title of pagesToProtect) {
              if (isAborted) break;
              try {
                const protectData = {
                  action: "protect",
                  title: title,
                  protections: buildPageProtections(title),
                  expiry: config.protectExpiry,
                  reason: config.protectReason + toolTag,
                  ...(config.protectCascade ? { cascade: "" } : {}),
                };
                await apiPost(protectData);
                addLog(`[Protect] Protected page: ${title}`);
                stats.protect++;
                updateStatusDisplay();
              } catch (e) {
                addLog(
                  `[Protect] Failed to protect ${title}: ${formatApiError(e)}`,
                  true,
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, THROTTLE_MS),
                );
                continue;
              }

              // Also protect the talk page if that option was selected and this
              // page is not itself a talk page (talk pages have no talk page).
              if (config.protectTalk) {
                let talkForProtect = null;
                try {
                  const titleObj = new mw.Title(title);
                  if (!titleObj.isTalkPage()) {
                    talkForProtect = titleObj.getTalkPage().getPrefixedText();
                  }
                } catch (e) {
                  // Skip if the title cannot be resolved to a talk page.
                }
                if (talkForProtect) {
                  try {
                    await apiPost({
                      action: "protect",
                      title: talkForProtect,
                      protections: `edit=${config.protectEdit}|move=${config.protectMove}`,
                      expiry: config.protectExpiry,
                      reason: config.protectReason + toolTag,
                      ...(config.protectCascade ? { cascade: "" } : {}),
                    });
                    addLog(`[Protect] Protected talk page: ${talkForProtect}`);
                    stats.protect++;
                    updateStatusDisplay();
                  } catch (e) {
                    addLog(
                      `[Protect] Failed to protect talk page ${talkForProtect}: ${formatApiError(e)}`,
                      true,
                    );
                  }
                  await new Promise((resolve) =>
                    setTimeout(resolve, THROTTLE_MS),
                  );
                }
              }

              // Queue this page for notification. Dispatched after the protection
              // loop so pages sharing a talk page receive a single combined notice.
              try {
                const talkTitle = new mw.Title(title)
                  .getTalkPage()
                  .getPrefixedText();
                if (!notifyQueue.has(talkTitle)) notifyQueue.set(talkTitle, []);
                notifyQueue.get(talkTitle).push(title);
              } catch (e) {
                // Title has no talk page (e.g. it is itself a talk page); skip.
              }
              await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS));
            }
          }

          // Dispatch protection notifications. If two or more protected pages resolve
          // to the same talk page, a single consolidated notice is posted instead of
          // one per page, whilst still listing every affected page by name.
          if (notifyQueue.size > 0 && config.notifyProtect) {
            const protectExpiryDisplay =
              config.protectExpiry === "never"
                ? "indefinitely"
                : `for ${config.protectExpiry}`;
            const protectExpiryText =
              config.protectExpiry === "never"
                ? "This protection does not expire automatically and will remain in effect unless modified by an administrator."
                : "The protection is scheduled to remain in effect until it expires, unless modified by an administrator.";

            for (const [talkTitle, titles] of notifyQueue) {
              if (isAborted) break;
              try {
                const talkExists = await pageExists(talkTitle);
                let notice;
                const isProtectIndef = config.protectExpiry === "never";
                if (titles.length === 1) {
                  notice = useIndonesian
                    ? isProtectIndef
                      ? `== Pemberitahuan perlindungan halaman ==\nHalaman "${titles[0]}" telah dilindungi secara tidak terbatas dengan alasan berikut: ${config.protectReason}.\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan ini tidak berakhir secara otomatis dan akan tetap berlaku kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                      : `== Pemberitahuan perlindungan halaman ==\nHalaman "${titles[0]}" telah dilindungi selama ${translateDurationId(config.protectExpiry)} dengan alasan berikut: ${config.protectReason}.\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan dijadwalkan berakhir pada waktunya, kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : `== Page protection notice ==\nThe page "${titles[0]}" has been protected ${protectExpiryDisplay} due to the following reason: ${config.protectReason}.\n\nDuring the protection period, some or all editing actions may be restricted depending on the level of protection applied. ${protectExpiryText}\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                } else {
                  const listed = titles.map((t) => `"${t}"`).join(" and ");
                  const listedId = titles.map((t) => `"${t}"`).join(" dan ");
                  notice = useIndonesian
                    ? isProtectIndef
                      ? `== Pemberitahuan perlindungan halaman ==\nHalaman-halaman berikut telah dilindungi secara tidak terbatas dengan alasan berikut: ${config.protectReason}.\n\n${listedId}\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan pada halaman-halaman ini mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan ini tidak berakhir secara otomatis dan akan tetap berlaku kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                      : `== Pemberitahuan perlindungan halaman ==\nHalaman-halaman berikut telah dilindungi selama ${translateDurationId(config.protectExpiry)} dengan alasan berikut: ${config.protectReason}.\n\n${listedId}\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan pada halaman-halaman ini mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan dijadwalkan berakhir pada waktunya, kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : `== Page protection notice ==\nThe following pages have been protected ${protectExpiryDisplay} due to the following reason: ${config.protectReason}.\n\n${listed}\n\nDuring the protection period, some or all editing actions on these pages may be restricted depending on the level of protection applied. ${protectExpiryText}\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                }
                await apiPost({
                  action: "edit",
                  title: talkTitle,
                  appendtext: (talkExists ? "\n\n" : "") + notice,
                  summary: notifySummaryProtect,
                  bot: true,
                });
                addLog(`[Notify] Notification posted to: ${talkTitle}`);
              } catch (e) {
                addLog(
                  `[Notify] Failed to post protection notification to ${talkTitle}: ${formatApiError(e)}`,
                  "warn",
                );
              }
              await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS));
            }
          }

          const deletedTitles = [];
          // Maps creator username → deleted page titles, for page mode notifications.
          // Populated during the deletion loop (after each successful delete) so only
          // confirmed deletions are included. Lookup must occur before deletion because
          // the standard query API cannot return revision data for deleted pages.
          const creatorMap = new Map();

          // Mass-delete pages sequentially
          if (config.massdel) {
            for (const title of creation) {
              if (isAborted) break;

              // In page mode, fetch the page creator before deleting.
              // The result is needed for the post-deletion notification.
              // This must happen before the delete call: once a page is gone the
              // standard query API no longer returns its revision history.
              let pageCreator = null;
              if (config.mode === "page") {
                try {
                  const creatorData = await apiGet({
                    action: "query",
                    prop: "revisions",
                    titles: title,
                    rvdir: "newer",
                    rvlimit: 1,
                    rvprop: "user",
                    formatversion: 2,
                  });
                  const cp =
                    creatorData.query &&
                    creatorData.query.pages &&
                    creatorData.query.pages[0];
                  pageCreator =
                    (cp &&
                      !cp.missing &&
                      cp.revisions &&
                      cp.revisions[0] &&
                      cp.revisions[0].user) ||
                    null;
                } catch (e) {
                  addLog(
                    `[Notify] Could not look up creator for ${title}: ${formatApiError(e)}`,
                    "warn",
                  );
                }
              }

              // Delete the main page (separate try/catch from talk page below,
              // so a talk-page failure does not misreport the main deletion as having failed)
              let mainDeleted = false;
              try {
                await apiPost({
                  action: "delete",
                  title: title,
                  reason: config.massdelReason + toolTag,
                });
                addLog(`[Delete] Deleted page: ${title}`);
                stats.delete++;
                updateStatusDisplay();
                mainDeleted = true;
                deletedTitles.push(title);
                // Record the creator mapping now that deletion is confirmed.
                if (config.mode === "page" && pageCreator) {
                  const currentUser = mw.config.get("wgUserName") || "";
                  if (pageCreator.toLowerCase() !== currentUser.toLowerCase()) {
                    if (!creatorMap.has(pageCreator))
                      creatorMap.set(pageCreator, []);
                    creatorMap.get(pageCreator).push(title);
                  } else {
                    addLog(
                      `[Notify] Skipped deletion notification for ${title}: page was created and deleted by the same user`,
                      "warn",
                    );
                  }
                }

                // Protect the deleted page against recreation if that option was selected.
                // Must run here, after deletion, because MediaWiki only accepts create-level
                // protection for non-existent titles.
                if (config.massdelProtectRecreation) {
                  try {
                    await apiPost({
                      action: "protect",
                      title: title,
                      protections:
                        "create=" + config.massdelProtectRecreationLevel,
                      expiry: config.massdelProtectRecreationExpiry,
                      reason: config.massdelProtectRecreationReason + toolTag,
                    });
                    addLog(
                      `[Protect] Protected deleted page against recreation: ${title}`,
                    );
                    stats.protect++;
                    updateStatusDisplay();
                  } catch (e) {
                    addLog(
                      `[Protect] Failed to protect ${title} against recreation: ${formatApiError(e)}`,
                      true,
                    );
                  }
                  await new Promise((resolve) =>
                    setTimeout(resolve, THROTTLE_MS),
                  );
                }
              } catch (e) {
                addLog(
                  `[Delete] Failed to delete ${title}: ${formatApiError(e)}`,
                  true,
                );
              }

              // Delete the associated talk page if the main page was deleted
              // and the user opted into it via the checkbox
              if (mainDeleted && config.massdelTalk) {
                try {
                  const talkTitle = new mw.Title(title)
                    .getTalkPage()
                    .getPrefixedText();
                  // Check if talk page exists before attempting deletion
                  const pageInfo = await apiGet({
                    action: "query",
                    titles: talkTitle,
                    formatversion: 2,
                  });

                  if (
                    pageInfo.query &&
                    pageInfo.query.pages[0] &&
                    !pageInfo.query.pages[0].missing
                  ) {
                    await apiPost({
                      action: "delete",
                      title: talkTitle,
                      reason:
                        (useIndonesian
                          ? "Halaman pembicaraan dari halaman yang dihapus: "
                          : "Associated talk page of deleted page: ") +
                        config.massdelReason +
                        toolTag,
                    });
                    addLog(
                      `[Delete] Deleted associated talk page: ${talkTitle}`,
                    );
                    stats.delete++;
                    updateStatusDisplay();
                  }
                } catch (e) {
                  addLog(
                    `[Delete] Failed to delete talk page for ${title}: ${formatApiError(e)}`,
                    true,
                  );
                }
              }

              // Delete redirects to the deleted page if the option was selected.
              // Uses list=backlinks with blfilterredir=redirects to find only redirects.
              if (mainDeleted && config.massdelRedirects) {
                try {
                  const rdData = await apiGet({
                    action: "query",
                    list: "backlinks",
                    bltitle: title,
                    blfilterredir: "redirects",
                    bllimit: "max",
                    formatversion: 2,
                  });
                  const redirectPages =
                    (rdData.query && rdData.query.backlinks) || [];
                  for (const rdPage of redirectPages) {
                    try {
                      await apiPost({
                        action: "delete",
                        title: rdPage.title,
                        reason:
                          (useIndonesian
                            ? "Pengalihan ke halaman yang dihapus: "
                            : "Redirect to deleted page: ") +
                          config.massdelReason +
                          toolTag,
                      });
                      addLog(
                        `[Delete] Deleted redirect to deleted page: ${rdPage.title}`,
                      );
                      stats.delete++;
                      updateStatusDisplay();
                    } catch (e) {
                      addLog(
                        `[Delete] Failed to delete redirect ${rdPage.title}: ${formatApiError(e)}`,
                        true,
                      );
                    }
                    await new Promise((resolve) =>
                      setTimeout(resolve, THROTTLE_MS),
                    );
                  }
                } catch (e) {
                  addLog(
                    `[Delete] Failed to fetch redirects for ${title}: ${formatApiError(e)}`,
                    true,
                  );
                }
              }

              // Delete subpages of the deleted page if the option was selected.
              // Uses list=allpages with apprefix to find all subpages.
              if (mainDeleted && config.massdelSubpages) {
                try {
                  const titleObj = new mw.Title(title);
                  const ns = titleObj.getNamespaceId();
                  const mainText = titleObj.getMain(); // Title without namespace prefix
                  const spData = await apiGet({
                    action: "query",
                    list: "allpages",
                    apprefix: mainText + "/",
                    apnamespace: ns,
                    aplimit: "max",
                    formatversion: 2,
                  });
                  const subpages =
                    (spData.query && spData.query.allpages) || [];
                  for (const sp of subpages) {
                    let subpageDeleted = false;
                    try {
                      await apiPost({
                        action: "delete",
                        title: sp.title,
                        reason:
                          (useIndonesian
                            ? "Subhalaman dari halaman yang dihapus: "
                            : "Subpage of deleted page: ") +
                          config.massdelReason +
                          toolTag,
                      });
                      addLog(
                        `[Delete] Deleted subpage of deleted page: ${sp.title}`,
                      );
                      stats.delete++;
                      updateStatusDisplay();
                      subpageDeleted = true;
                    } catch (e) {
                      addLog(
                        `[Delete] Failed to delete subpage ${sp.title}: ${formatApiError(e)}`,
                        true,
                      );
                    }

                    // Also delete the subpage's talk page, reusing the
                    // 'Also delete the talk page' option applied to the main page.
                    if (subpageDeleted && config.massdelTalk) {
                      try {
                        const spTitleObj = new mw.Title(sp.title);
                        if (!spTitleObj.isTalkPage()) {
                          const spTalkTitle = spTitleObj
                            .getTalkPage()
                            .getPrefixedText();
                          const spTalkInfo = await apiGet({
                            action: "query",
                            titles: spTalkTitle,
                            formatversion: 2,
                          });
                          if (
                            spTalkInfo.query &&
                            spTalkInfo.query.pages[0] &&
                            !spTalkInfo.query.pages[0].missing
                          ) {
                            await apiPost({
                              action: "delete",
                              title: spTalkTitle,
                              reason:
                                (useIndonesian
                                  ? "Halaman pembicaraan dari subhalaman yang dihapus: "
                                  : "Associated talk page of deleted subpage: ") +
                                config.massdelReason +
                                toolTag,
                            });
                            addLog(
                              `[Delete] Deleted associated talk page of subpage: ${spTalkTitle}`,
                            );
                            stats.delete++;
                            updateStatusDisplay();
                          }
                        }
                      } catch (e) {
                        addLog(
                          `[Delete] Failed to delete talk page for subpage ${sp.title}: ${formatApiError(e)}`,
                          true,
                        );
                      }
                      await new Promise((resolve) =>
                        setTimeout(resolve, THROTTLE_MS),
                      );
                    }

                    // Also delete redirects pointing to the subpage, reusing the
                    // 'Delete redirects to deleted page' option applied to the main page.
                    if (subpageDeleted && config.massdelRedirects) {
                      try {
                        const spRdData = await apiGet({
                          action: "query",
                          list: "backlinks",
                          bltitle: sp.title,
                          blfilterredir: "redirects",
                          bllimit: "max",
                          formatversion: 2,
                        });
                        const spRedirectPages =
                          (spRdData.query && spRdData.query.backlinks) || [];
                        for (const rdPage of spRedirectPages) {
                          try {
                            await apiPost({
                              action: "delete",
                              title: rdPage.title,
                              reason:
                                (useIndonesian
                                  ? "Pengalihan ke subhalaman yang dihapus: "
                                  : "Redirect to deleted subpage: ") +
                                config.massdelReason +
                                toolTag,
                            });
                            addLog(
                              `[Delete] Deleted redirect to deleted subpage: ${rdPage.title}`,
                            );
                            stats.delete++;
                            updateStatusDisplay();
                          } catch (e) {
                            addLog(
                              `[Delete] Failed to delete redirect ${rdPage.title}: ${formatApiError(e)}`,
                              true,
                            );
                          }
                          await new Promise((resolve) =>
                            setTimeout(resolve, THROTTLE_MS),
                          );
                        }
                      } catch (e) {
                        addLog(
                          `[Delete] Failed to fetch redirects for subpage ${sp.title}: ${formatApiError(e)}`,
                          true,
                        );
                      }
                    }

                    await new Promise((resolve) =>
                      setTimeout(resolve, THROTTLE_MS),
                    );
                  }
                } catch (e) {
                  addLog(
                    `[Delete] Failed to fetch subpages for ${title}: ${formatApiError(e)}`,
                    true,
                  );
                }
              }

              await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS)); // Throttling window
            }
          }

          // Post deletion notification to the target user's talk page (user mode).
          // All deleted pages were created by the same user, so a single notice is
          // posted regardless of how many pages were deleted.
          const isSelfDeletion =
            config.mode === "user" &&
            targetVal.toLowerCase() ===
              (mw.config.get("wgUserName") || "").toLowerCase();
          if (
            config.massdel &&
            config.mode === "user" &&
            deletedTitles.length > 0 &&
            config.notifyDelete &&
            !isSelfDeletion
          ) {
            const talkTitle = new mw.Title(targetVal, 3).getPrefixedText();
            try {
              const talkExists = await pageExists(talkTitle);
              let notice;
              if (deletedTitles.length === 1) {
                notice = useIndonesian
                  ? `== Pemberitahuan penghapusan halaman ==\nHalo ${targetVal},\n\nHalaman "${deletedTitles[0]}" yang Anda buat telah dihapus dengan alasan berikut: ${config.massdelReason}.\n\nHalaman yang dihapus tidak lagi dapat diakses secara publik. Jika Anda yakin penghapusan ini keliru, silakan sampaikan di halaman pembicaraan saya atau ikuti prosedur pemulihan halaman wiki ini.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                  : `== Page deletion notice ==\nDear ${targetVal},\n\nThe page "${deletedTitles[0]}" you created has been deleted due to the following reason: ${config.massdelReason}.\n\nDeleted pages are no longer publicly accessible. If you believe this deletion was in error, please raise the matter on my user talk page or follow your wiki's undeletion process.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
              } else {
                const listed = deletedTitles.map((t) => `* "${t}"`).join("\n");
                notice = useIndonesian
                  ? `== Pemberitahuan penghapusan halaman ==\nHalo ${targetVal},\n\nHalaman-halaman berikut yang Anda buat telah dihapus dengan alasan berikut: ${config.massdelReason}.\n\n${listed}\n\nHalaman yang dihapus tidak lagi dapat diakses secara publik. Jika Anda yakin ada penghapusan yang keliru, silakan sampaikan di halaman pembicaraan saya atau ikuti prosedur pemulihan halaman wiki ini.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                  : `== Page deletion notice ==\nDear ${targetVal},\n\nThe following pages you created have been deleted due to the following reason: ${config.massdelReason}.\n\n${listed}\n\nDeleted pages are no longer publicly accessible. If you believe any of these deletions were in error, please raise the matter on my user talk page or follow your wiki's undeletion process.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
              }
              await apiPost({
                action: "edit",
                title: talkTitle,
                appendtext: (talkExists ? "\n\n" : "") + notice,
                summary: notifySummaryDelete,
                bot: true,
              });
              addLog(`[Notify] Deletion notification posted to: ${talkTitle}`);
            } catch (e) {
              addLog(
                `[Notify] Failed to post deletion notification to ${talkTitle}: ${formatApiError(e)}`,
                "warn",
              );
            }
          }

          // Post deletion notifications in page mode, grouped by creator.
          // Each unique creator receives one consolidated notice listing all pages
          // deleted during this session that they created. The creatorMap was populated
          // during the deletion loop; entries are only present for confirmed deletions.
          if (
            config.massdel &&
            config.mode === "page" &&
            creatorMap.size > 0 &&
            config.notifyDelete
          ) {
            for (const [creator, titles] of creatorMap) {
              if (isAborted) break;
              const talkTitle = new mw.Title(creator, 3).getPrefixedText();
              try {
                const talkExists = await pageExists(talkTitle);
                let notice;
                if (titles.length === 1) {
                  notice = useIndonesian
                    ? `== Pemberitahuan penghapusan halaman ==\nHalo ${creator},\n\nHalaman "${titles[0]}" yang Anda buat telah dihapus dengan alasan berikut: ${config.massdelReason}.\n\nHalaman yang dihapus tidak lagi dapat diakses secara publik. Jika Anda yakin penghapusan ini keliru, silakan sampaikan di halaman pembicaraan saya atau ikuti prosedur pemulihan halaman wiki ini.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : `== Page deletion notice ==\nDear ${creator},\n\nThe page "${titles[0]}" you created has been deleted due to the following reason: ${config.massdelReason}.\n\nDeleted pages are no longer publicly accessible. If you believe this deletion was in error, please raise the matter on my user talk page or follow your wiki's undeletion process.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                } else {
                  const listed = titles.map((t) => `* "${t}"`).join("\n");
                  notice = useIndonesian
                    ? `== Pemberitahuan penghapusan halaman ==\nHalo ${creator},\n\nHalaman-halaman berikut yang Anda buat telah dihapus dengan alasan berikut: ${config.massdelReason}.\n\n${listed}\n\nHalaman yang dihapus tidak lagi dapat diakses secara publik. Jika Anda yakin ada penghapusan yang keliru, silakan sampaikan di halaman pembicaraan saya atau ikuti prosedur pemulihan halaman wiki ini.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : `== Page deletion notice ==\nDear ${creator},\n\nThe following pages you created have been deleted due to the following reason: ${config.massdelReason}.\n\n${listed}\n\nDeleted pages are no longer publicly accessible. If you believe any of these deletions were in error, please raise the matter on my user talk page or follow your wiki's undeletion process.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                }
                await apiPost({
                  action: "edit",
                  title: talkTitle,
                  appendtext: (talkExists ? "\n\n" : "") + notice,
                  summary: notifySummaryDelete,
                  bot: true,
                });
                addLog(
                  `[Notify] Deletion notification posted to: ${talkTitle}`,
                );
              } catch (e) {
                addLog(
                  `[Notify] Failed to post deletion notification to ${talkTitle}: ${formatApiError(e)}`,
                  "warn",
                );
              }
              await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS));
            }
          }

          // --- Recreation protection (page mode, non-existent page) ---
          // Uses create= protection, which is the correct API parameter for
          // preventing a deleted or never-created page from being recreated.
          // Unlike edit=/move= protection, this only applies to missing pages.
          if (
            config.protectRecreation &&
            config.mode === "page" &&
            !isAborted
          ) {
            try {
              await apiPost({
                action: "protect",
                title: targetVal,
                protections: "create=" + config.protectRecreationLevel,
                expiry: config.protectRecreationExpiry,
                reason: config.protectRecreationReason + toolTag,
              });
              addLog(
                "[Protect] Protected page against recreation: " + targetVal,
              );
              stats.protect++;
              updateStatusDisplay();
            } catch (e) {
              addLog(
                "[Protect] Failed to protect " +
                  targetVal +
                  " against recreation: " +
                  formatApiError(e),
                true,
              );
            }
          }

          // Second protect pass: protect pages that were deferred until after deletion.
          // Only pages that were actually deleted are protected here.
          if (config.protect && pagesToProtectAfterDel.size > 0) {
            const notifyQueueDeferred = new Map();
            for (const title of pagesToProtectAfterDel) {
              if (isAborted) break;
              if (!deletedTitles.includes(title)) {
                addLog(
                  `[Protect] Skipped deferred protection for ${title}: page was not deleted`,
                  "warn",
                );
                continue;
              }
              try {
                // Deleted pages only accept create-level protection.
                // The edit-restriction level is reused as the create-protection level.
                // Cascade is not applicable for create-only protection and is omitted.
                await apiPost({
                  action: "protect",
                  title: title,
                  protections: `create=${config.protectEdit}`,
                  expiry: config.protectExpiry,
                  reason: config.protectReason + toolTag,
                });
                addLog(
                  `[Protect] Protected deleted page against recreation: ${title}`,
                );
                stats.protect++;
                updateStatusDisplay();
              } catch (e) {
                addLog(
                  `[Protect] Failed to protect ${title}: ${formatApiError(e)}`,
                  true,
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, THROTTLE_MS),
                );
                continue;
              }

              // Also protect the talk page if that option was selected
              if (config.protectTalk) {
                let talkForProtect = null;
                try {
                  const titleObj = new mw.Title(title);
                  if (!titleObj.isTalkPage()) {
                    talkForProtect = titleObj.getTalkPage().getPrefixedText();
                  }
                } catch (e) {
                  // Skip if the title cannot be resolved to a talk page.
                }
                if (talkForProtect) {
                  try {
                    // The talk page may have been deleted if 'Also delete the talk page'
                    // was selected. Check existence first and use the appropriate
                    // protection type: create= for a deleted page, edit=|move= for an
                    // existing one.
                    const talkExistCheck = await apiGet({
                      action: "query",
                      titles: talkForProtect,
                      formatversion: 2,
                    });
                    const talkExists =
                      talkExistCheck.query &&
                      talkExistCheck.query.pages &&
                      !talkExistCheck.query.pages[0].missing;
                    const talkProtections = talkExists
                      ? `edit=${config.protectEdit}|move=${config.protectMove}`
                      : `create=${config.protectEdit}`;
                    const talkProtectParams = {
                      action: "protect",
                      title: talkForProtect,
                      protections: talkProtections,
                      reason: config.protectReason + toolTag,
                    };
                    // Expiry and cascade only apply when the page exists.
                    if (talkExists) {
                      talkProtectParams.expiry = config.protectExpiry;
                      if (config.protectCascade) talkProtectParams.cascade = "";
                    }
                    await apiPost(talkProtectParams);
                    addLog(`[Protect] Protected talk page: ${talkForProtect}`);
                    stats.protect++;
                    updateStatusDisplay();
                  } catch (e) {
                    addLog(
                      `[Protect] Failed to protect talk page ${talkForProtect}: ${formatApiError(e)}`,
                      true,
                    );
                  }
                  await new Promise((resolve) =>
                    setTimeout(resolve, THROTTLE_MS),
                  );
                }
              }

              // Queue for notification
              try {
                const talkTitle = new mw.Title(title)
                  .getTalkPage()
                  .getPrefixedText();
                if (!notifyQueueDeferred.has(talkTitle))
                  notifyQueueDeferred.set(talkTitle, []);
                notifyQueueDeferred.get(talkTitle).push(title);
              } catch (e) {
                // Title has no talk page; skip.
              }
              await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS));
            }

            // Dispatch notifications for the deferred protect pass
            if (notifyQueueDeferred.size > 0 && config.notifyProtect) {
              const protectExpiryDisplay =
                config.protectExpiry === "never"
                  ? "indefinitely"
                  : `for ${config.protectExpiry}`;
              const protectExpiryText =
                config.protectExpiry === "never"
                  ? "This protection does not expire automatically and will remain in effect unless modified by an administrator."
                  : "The protection is scheduled to remain in effect until it expires, unless modified by an administrator.";
              for (const [talkTitle, titles] of notifyQueueDeferred) {
                if (isAborted) break;

                // Skip notification if the talk page no longer exists.
                // This can happen when 'Also delete the talk page' was selected,
                // in which case posting would recreate a deleted page.
                try {
                  const talkExistCheck = await apiGet({
                    action: "query",
                    titles: talkTitle,
                    formatversion: 2,
                  });
                  const talkExists =
                    talkExistCheck.query &&
                    talkExistCheck.query.pages &&
                    !talkExistCheck.query.pages[0].missing;
                  if (!talkExists) {
                    addLog(
                      `[Notify] Skipped protection notification for ${talkTitle}: talk page no longer exists`,
                      "warn",
                    );
                    await new Promise((resolve) =>
                      setTimeout(resolve, THROTTLE_MS),
                    );
                    continue;
                  }
                } catch (e) {
                  addLog(
                    `[Notify] Could not check talk page existence for ${talkTitle}: ${formatApiError(e)}`,
                    "warn",
                  );
                  await new Promise((resolve) =>
                    setTimeout(resolve, THROTTLE_MS),
                  );
                  continue;
                }

                try {
                  let notice;
                  const isProtectIndefDeferred =
                    config.protectExpiry === "never";
                  if (titles.length === 1) {
                    notice = useIndonesian
                      ? isProtectIndefDeferred
                        ? `== Pemberitahuan perlindungan halaman ==\nHalaman "${titles[0]}" telah dilindungi secara tidak terbatas dengan alasan berikut: ${config.protectReason}.\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan ini tidak berakhir secara otomatis dan akan tetap berlaku kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                        : `== Pemberitahuan perlindungan halaman ==\nHalaman "${titles[0]}" telah dilindungi selama ${translateDurationId(config.protectExpiry)} dengan alasan berikut: ${config.protectReason}.\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan dijadwalkan berakhir pada waktunya, kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                      : `== Page protection notice ==\nThe page "${titles[0]}" has been protected ${protectExpiryDisplay} due to the following reason: ${config.protectReason}.\n\nDuring the protection period, some or all editing actions may be restricted depending on the level of protection applied. ${protectExpiryText}\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                  } else {
                    const listed = titles.map((t) => `"${t}"`).join(" and ");
                    const listedId = titles.map((t) => `"${t}"`).join(" dan ");
                    notice = useIndonesian
                      ? isProtectIndefDeferred
                        ? `== Pemberitahuan perlindungan halaman ==\nHalaman-halaman berikut telah dilindungi secara tidak terbatas dengan alasan berikut: ${config.protectReason}.\n\n${listedId}\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan pada halaman-halaman ini mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan ini tidak berakhir secara otomatis dan akan tetap berlaku kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                        : `== Pemberitahuan perlindungan halaman ==\nHalaman-halaman berikut telah dilindungi selama ${translateDurationId(config.protectExpiry)} dengan alasan berikut: ${config.protectReason}.\n\n${listedId}\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan pada halaman-halaman ini mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan dijadwalkan berakhir pada waktunya, kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                      : `== Page protection notice ==\nThe following pages have been protected ${protectExpiryDisplay} due to the following reason: ${config.protectReason}.\n\n${listed}\n\nDuring the protection period, some or all editing actions on these pages may be restricted depending on the level of protection applied. ${protectExpiryText}\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                  }
                  await apiPost({
                    action: "edit",
                    title: talkTitle,
                    appendtext: "\n\n" + notice,
                    summary: notifySummaryProtect,
                    bot: true,
                  });
                  addLog(`[Notify] Notification posted to: ${talkTitle}`);
                } catch (e) {
                  addLog(
                    `[Notify] Failed to post protection notification to ${talkTitle}: ${formatApiError(e)}`,
                    "warn",
                  );
                }
                await new Promise((resolve) =>
                  setTimeout(resolve, THROTTLE_MS),
                );
              }
            }
          }

          // Remove wikilinks to deleted pages from articles in the main namespace.
          // Skips all namespaces other than NS0. Runs for each successfully deleted
          // page. Each matching article is fetched, its wikilinks replaced with
          // plain text, and saved with a labelled edit summary.
          if (config.massdelUnlink && deletedTitles.length > 0) {
            for (const delTitle of deletedTitles) {
              if (isAborted) break;
              addLog(`[Unlink] Searching for links to: ${delTitle}...`);

              // Escape the title for use in a regular expression.
              // Spaces and underscores are treated as equivalent in wikilinks.
              const escapedTitle = delTitle
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                .replace(/[ _]/g, "[ _]");

              // Match [[Title]], [[Title|text]], [[Title#section]], [[Title#section|text]].
              // Capture group 1: display text after | (undefined if absent).
              // When no display text is present, the replacement is the base page title.
              const linkRe = new RegExp(
                "\\[\\[" +
                  escapedTitle +
                  "(?:#[^|\\]]*)?(?:\\|([^\\]]*?))?\\]\\]",
                "g",
              );

              let blcontinue;
              do {
                if (isAborted) break;
                try {
                  const blParams = {
                    action: "query",
                    list: "backlinks",
                    bltitle: delTitle,
                    blnamespace: 0, // Main namespace only
                    bllimit: 50,
                  };
                  if (blcontinue) blParams.blcontinue = blcontinue;
                  const blData = await apiGet(blParams);
                  blcontinue = blData.continue && blData.continue.blcontinue;
                  const links = (blData.query && blData.query.backlinks) || [];

                  for (const link of links) {
                    if (isAborted) break;
                    const linkTitle = link.title;
                    try {
                      // Fetch the current wikitext of the linking article.
                      const revData = await apiGet({
                        action: "query",
                        prop: "revisions",
                        titles: linkTitle,
                        rvprop: "content",
                        rvslots: "main",
                        formatversion: 2,
                      });
                      const page =
                        revData.query &&
                        revData.query.pages &&
                        revData.query.pages[0];
                      if (!page || page.missing) continue;
                      const slot =
                        page.revisions &&
                        page.revisions[0] &&
                        page.revisions[0].slots &&
                        page.revisions[0].slots.main;
                      if (!slot) continue;
                      const wikitext = slot.content;

                      // Replace each matching wikilink with its display text,
                      // or with the base page title if no display text is present.
                      const newWikitext = wikitext.replace(
                        linkRe,
                        function (match, displayText) {
                          return displayText !== undefined
                            ? displayText
                            : delTitle;
                        },
                      );

                      if (newWikitext === wikitext) continue; // No matching links found in content

                      await apiPost({
                        action: "edit",
                        title: linkTitle,
                        text: newWikitext,
                        summary:
                          (useIndonesian
                            ? "Menghapus pranala ke halaman yang sudah dihapus: "
                            : "Removing links to deleted page: ") +
                          delTitle +
                          toolTag,
                        bot: true,
                      });
                      addLog(
                        `[Unlink] Removed links to "${delTitle}" in: ${linkTitle}`,
                      );
                      stats.unlink++;
                      updateStatusDisplay();
                    } catch (e) {
                      addLog(
                        `[Unlink] Failed to edit ${linkTitle}: ${formatApiError(e)}`,
                        true,
                      );
                    }
                    await new Promise((resolve) =>
                      setTimeout(resolve, THROTTLE_MS),
                    );
                  }
                } catch (e) {
                  addLog(
                    `[Unlink] Failed to fetch backlinks for "${delTitle}": ${formatApiError(e)}`,
                    true,
                  );
                  break;
                }
              } while (blcontinue && !isAborted);
            }
          }

          // Termination and interface cleanup operations
          btnAbort.style.display = "none";

          const methodTxt =
            config.rollbackMethod === "undo" ? "undone" : "reverted";
          const statusWord = isAborted ? "Aborted." : "Completed.";
          const statusPrefix = `<b>Status: ${statusWord}</b><br/>`;
          const finalStatus = `${statusPrefix}Summary: <b>${stats.rollback}</b> ${methodTxt} | <b>${stats.delete}</b> deleted | <b>${stats.undelete}</b> undeleted | <b>${stats.move}</b> moved | <b>${stats.unlink}</b> unlinked | <b>${stats.protect}</b> protected | <b>${stats.revdel}</b> hidden | <b>${stats.report}</b> reported | <b>${stats.error}</b> errors.`;
          statusLbl.innerHTML = finalStatus;
          isAborted = false;

          if (isAborted) {
            addLog("⏹️ Operations aborted by user");
          } else {
            addLog("✅ All operations have been completed successfully");
          }
          btnClose.disabled = false;

          // Insert "Copy this log" button once all operations are complete
          const btnCopyLog = makeBtn("Copy this log", "quiet");
          btnCopyLog.addEventListener("click", function () {
            const lines = Array.from(logBox.children)
              .map(function (el) {
                return el.textContent;
              })
              .join("\n");
            navigator.clipboard
              .writeText(lines)
              .then(function () {
                const orig = btnCopyLog.textContent;
                btnCopyLog.textContent = "✔ Copied!";
                setTimeout(function () {
                  btnCopyLog.textContent = orig;
                }, 2000);
              })
              .catch(function () {
                // Fallback for environments where navigator.clipboard is unavailable
                const ta = document.createElement("textarea");
                ta.value = lines;
                document.body.appendChild(ta);
                ta.select();
                try {
                  document.execCommand("copy");
                } catch (e) {
                  /* ignore */
                }
                document.body.removeChild(ta);
                const orig = btnCopyLog.textContent;
                btnCopyLog.textContent = "✔ Copied!";
                setTimeout(function () {
                  btnCopyLog.textContent = orig;
                }, 2000);
              });
          });
          footer.insertBefore(btnCopyLog, btnClose);
        };

        // ============================================================================
        // [Section 08] Get user info (user mode)
        // Fetches and displays block log entries, access rights changes, and abuse
        // filter log entries for a target user in a read-only dialogue panel.
        // Three collapsible sections are rendered in parallel; each fires its own
        // API request independently so a failure in one does not block the others.
        // See Section 08b (getPageInfo) for the equivalent panel in page mode.
        // ============================================================================
        const getUserInfo = async function (username) {
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

          // Build a bordered entry card with labelled rows.
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
            el.textContent = "️️⚠️️ " + msg;
            container.appendChild(el);
          }

          // Build the three display-only collapsible sections
          const {
            section: secBlockLog,
            sectionBody: bodyBlockLog,
            arrow: arrowBlockLog,
          } = makeDisplaySection("Block log", "⛔️");
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
          setLoading(bodyRights, "Loading rights changes...");
          setLoading(bodyAbuseLog, "Loading abuse filter log...");

          // --- Access rights card ---
          // Displayed before log sections. Shows the target user's groups and rights
          // on the local wiki and globally (CentralAuth). Two parallel API requests
          // are fired; each populates its own section independently.
          const isTargetIP = mw.util.isIPAddress(username);
          const localWikiId =
            mw.config.get("wgDBname") ||
            mw.config.get("wgSiteName") ||
            "this wiki";

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

          // Divider between local and global rows
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
          // IP addresses do not have CentralAuth accounts
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

          // Divider and global lock / block status row
          const globalLockHr = document.createElement("hr");
          globalLockHr.className = "tng-user-rights-divider";
          rightsCardBody.appendChild(globalLockHr);

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

          body.appendChild(rightsCard);

          // Helper: populates a badges container and a rights text block.
          // groups  — array of group names to render as badges.
          // rights  — array of individual right strings to render as a text list.
          // scopeLabel — short word used in the "no groups" fallback badge (e.g. "local").
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

          // Local rights request
          (async function () {
            try {
              const data = await apiGet({
                action: "query",
                list: "users",
                ususers: username,
                usprop: "groups|rights",
              });
              const userEntry =
                data.query && data.query.users && data.query.users[0];
              if (!userEntry || userEntry.missing !== undefined) {
                localBadgesEl.innerHTML = "";
                const msg = document.createElement("span");
                msg.className = "tng-info-empty";
                msg.textContent = "Account not found on this wiki.";
                localBadgesEl.appendChild(msg);
              } else {
                // Filter out implicit groups every account belongs to (*) and (user)
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
              }
            } catch (err) {
              setError(
                localBadgesEl,
                "Failed to load local rights: " + formatApiError(err),
              );
            }
          })();

          // Global rights request (skipped for IP addresses)
          if (!isTargetIP) {
            (async function () {
              try {
                const data = await apiGet({
                  action: "query",
                  meta: "globaluserinfo",
                  guiuser: username,
                  guiprop: "groups|rights",
                });
                const gui = data.query && data.query.globaluserinfo;
                if (!gui || gui.missing !== undefined) {
                  globalBadgesEl.innerHTML = "";
                  const msg = document.createElement("span");
                  msg.className = "tng-info-empty";
                  msg.textContent = "No global account found.";
                  globalBadgesEl.appendChild(msg);
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
                }
              } catch (err) {
                setError(
                  globalBadgesEl,
                  "Failed to load global rights: " + formatApiError(err),
                );
              }
            })();
          }

          // --- Global lock / block status ---
          (async function () {
            // Shared expiry formatter for both IP and registered account paths
            const fmtExpiry = function (ts) {
              if (!ts || ts === "infinity") return "indefinite";
              const d = new Date(ts);
              return isNaN(d.getTime())
                ? "indefinite"
                : d.toUTCString().replace("GMT", "UTC");
            };
            try {
              if (isTargetIP) {
                // IP addresses — global block check only (bgip also catches active range blocks)
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
                } else {
                  const badge = document.createElement("span");
                  badge.className = "tng-rights-badge tng-rights-have";
                  badge.textContent = "Not globally blocked";
                  globalLockBadgesEl.appendChild(badge);
                }
              } else {
                // Registered accounts — check global lock and global block in parallel
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
          body.appendChild(secRights);
          body.appendChild(secAbuseLog);

          const btnClose = makeBtn("Close", "quiet");
          btnClose.addEventListener("click", () => overlay.closeHandler());
          footer.appendChild(btnClose);

          // --- Block log ---
          (async function () {
            try {
              const data = await apiGet({
                action: "query",
                list: "logevents",
                letype: "block",
                letitle: "User:" + username,
                lelimit: 50,
                leprop: "user|timestamp|comment|details",
              });
              const entries = (data.query && data.query.logevents) || [];
              if (!entries.length) {
                setEmpty(bodyBlockLog, "No block log entries found.");
                return;
              }
              // Auto-expand: entries found warrant attention
              bodyBlockLog.classList.remove("tng-hidden");
              arrowBlockLog.classList.add("tng-arrow-up");
              bodyBlockLog.innerHTML = "";
              for (const e of entries) {
                const duration = (e.params && e.params.duration) || "—";
                const expiry =
                  e.params && e.params.expiry
                    ? e.params.expiry === "infinity"
                      ? "Indefinite"
                      : fmtTimestamp(e.params.expiry)
                    : "—";
                bodyBlockLog.appendChild(
                  makeEntry([
                    ["Time", fmtTimestamp(e.timestamp)],
                    ["Action", e.action || "block"],
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

          // --- Rights changes ---
          (async function () {
            try {
              const data = await apiGet({
                action: "query",
                list: "logevents",
                letype: "rights",
                letitle: "User:" + username,
                lelimit: 50,
                leprop: "user|timestamp|comment|details",
              });
              const entries = (data.query && data.query.logevents) || [];
              if (!entries.length) {
                setEmpty(bodyRights, "No rights change entries found.");
                return;
              }
              // Auto-expand: entries found warrant attention
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
                bodyRights.appendChild(
                  makeEntry([
                    ["Time", fmtTimestamp(e.timestamp)],
                    ["Changed by", e.user || "—"],
                    ["Previous groups", oldGroups],
                    ["New groups", newGroups],
                    ["Reason", e.comment || "(no reason given)"],
                  ]),
                );
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
                afllimit: 50,
                aflprop: "ids|user|title|action|result|timestamp|filter",
              });
              const entries = (data.query && data.query.abuselog) || [];
              if (!entries.length) {
                setEmpty(bodyAbuseLog, "No abuse filter log entries found.");
                return;
              }
              // Auto-expand: entries found warrant attention
              bodyAbuseLog.classList.remove("tng-hidden");
              arrowAbuseLog.classList.add("tng-arrow-up");
              bodyAbuseLog.innerHTML = "";
              for (const e of entries) {
                const filterLabel = e.filter_id
                  ? "#" + e.filter_id + (e.filter ? " (" + e.filter + ")" : "")
                  : "—";
                bodyAbuseLog.appendChild(
                  makeEntry([
                    ["Time", fmtTimestamp(e.timestamp)],
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

        // ============================================================================
        // [Section 08b] Get page info (page mode)
        // Fetches and displays abuse filter, protection, deletion, and move log
        // entries for a target page in a read-only dialogue panel. Four collapsible
        // sections are rendered in parallel; a failure in one does not block the others.
        // ============================================================================
        const getPageInfo = async function (pageName) {
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
            el.textContent = "️️⚠️️ " + msg;
            container.appendChild(el);
          }

          // Build the four display-only collapsible sections
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

          setLoading(bodyAbuseLog, "Loading abuse filter log...");
          setLoading(bodyProtectLog, "Loading protection log...");
          setLoading(bodyDeleteLog, "Loading deletion log...");
          setLoading(bodyMoveLog, "Loading move log...");

          body.appendChild(secAbuseLog);
          body.appendChild(secProtectLog);
          body.appendChild(secDeleteLog);
          body.appendChild(secMoveLog);

          const btnClose = makeBtn("Close", "quiet");
          btnClose.addEventListener("click", () => overlay.closeHandler());
          footer.appendChild(btnClose);

          // --- Abuse filter log ---
          (async function () {
            try {
              const data = await apiGet({
                action: "query",
                list: "abuselog",
                afltitle: pageName,
                afllimit: 50,
                aflprop: "ids|user|title|action|result|timestamp|filter",
              });
              const entries = (data.query && data.query.abuselog) || [];
              if (!entries.length) {
                setEmpty(bodyAbuseLog, "No abuse filter log entries found.");
                return;
              }
              // Auto-expand: entries found warrant attention
              bodyAbuseLog.classList.remove("tng-hidden");
              arrowAbuseLog.classList.add("tng-arrow-up");
              bodyAbuseLog.innerHTML = "";
              for (const e of entries) {
                const filterLabel = e.filter_id
                  ? "#" + e.filter_id + (e.filter ? " (" + e.filter + ")" : "")
                  : "—";
                bodyAbuseLog.appendChild(
                  makeEntry([
                    ["Time", fmtTimestamp(e.timestamp)],
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

          // --- Protection log ---
          (async function () {
            try {
              const data = await apiGet({
                action: "query",
                list: "logevents",
                letype: "protect",
                letitle: pageName,
                lelimit: 50,
                leprop: "user|timestamp|comment|details",
              });
              const entries = (data.query && data.query.logevents) || [];
              if (!entries.length) {
                setEmpty(bodyProtectLog, "No protection log entries found.");
                return;
              }
              // Auto-expand: entries found warrant attention
              bodyProtectLog.classList.remove("tng-hidden");
              arrowProtectLog.classList.add("tng-arrow-up");
              bodyProtectLog.innerHTML = "";
              for (const e of entries) {
                // Flatten protection levels and expiries from e.params.details
                const levels =
                  e.params && e.params.details && e.params.details.length
                    ? e.params.details
                        .map(function (d) {
                          const expiry =
                            d.expiry === "infinity"
                              ? "indefinite"
                              : d.expiry
                                ? fmtTimestamp(d.expiry)
                                : "—";
                          return (
                            d.type +
                            ": " +
                            (d.level || "all") +
                            " (expires " +
                            expiry +
                            ")"
                          );
                        })
                        .join("; ")
                    : "—";
                const cascade = e.params && e.params.cascade ? "Yes" : "No";
                bodyProtectLog.appendChild(
                  makeEntry([
                    ["Time", fmtTimestamp(e.timestamp)],
                    ["Action", e.action || "protect"],
                    ["Performed by", e.user || "—"],
                    ["Levels", levels],
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

          // --- Deletion log ---
          (async function () {
            try {
              const data = await apiGet({
                action: "query",
                list: "logevents",
                letype: "delete",
                letitle: pageName,
                lelimit: 50,
                leprop: "user|timestamp|comment|details",
              });
              const entries = (data.query && data.query.logevents) || [];
              if (!entries.length) {
                setEmpty(bodyDeleteLog, "No deletion log entries found.");
                return;
              }
              // Auto-expand: entries found warrant attention
              bodyDeleteLog.classList.remove("tng-hidden");
              arrowDeleteLog.classList.add("tng-arrow-up");
              bodyDeleteLog.innerHTML = "";
              for (const e of entries) {
                const revCount =
                  e.params && e.params.count !== undefined
                    ? String(e.params.count)
                    : null;
                const rows = [
                  ["Time", fmtTimestamp(e.timestamp)],
                  ["Action", e.action || "delete"],
                  ["Performed by", e.user || "—"],
                ];
                if (revCount !== null)
                  rows.push(["Revisions affected", revCount]);
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
              const data = await apiGet({
                action: "query",
                list: "logevents",
                letype: "move",
                letitle: pageName,
                lelimit: 50,
                leprop: "user|timestamp|comment|details",
              });
              const entries = (data.query && data.query.logevents) || [];
              if (!entries.length) {
                setEmpty(bodyMoveLog, "No move log entries found.");
                return;
              }
              // Auto-expand: entries found warrant attention
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
                    ["Time", fmtTimestamp(e.timestamp)],
                    ["Performed by", e.user || "—"],
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
        };

        // ============================================================================
        // [Section 08c] Export edits (user mode)
        // Fetches all unique pages edited by a target user (paginating through the
        // full contribution history) and displays them as a filterable, sortable list
        // with a copy-to-clipboard option in wikitext numbered-list format.
        // ============================================================================
        const openExportEditsDialog = async function (username) {
          const {
            overlay: exportOverlay,
            body: exportBody,
            footer: exportFooter,
          } = createDialog({
            title: "Export edits — " + username,
            icon: "📋",
            child: true,
          });

          const loadingEl = document.createElement("div");
          loadingEl.className = "tng-info-loading";
          loadingEl.textContent = "Fetching contributions...";
          exportBody.appendChild(loadingEl);

          // titleNsMap stores title → namespace ID for every unique page edited.
          // allTitles preserves insertion order before sorting is applied; Set
          // deduplication removes repeated page titles.
          const allTitles = new Set();
          const titleNsMap = new Map();
          let continueToken = {};
          let fetching = true;

          try {
            while (fetching) {
              const params = Object.assign(
                {
                  action: "query",
                  list: "usercontribs",
                  ucuser: username,
                  ucprop: "title",
                  uclimit: "max",
                },
                continueToken,
              );
              const data = await apiGet(params);
              if (data.query && data.query.usercontribs) {
                for (const edit of data.query.usercontribs) {
                  if (!allTitles.has(edit.title)) {
                    allTitles.add(edit.title);
                    let nsId = 0;
                    try {
                      nsId = new mw.Title(edit.title).getNamespaceId();
                    } catch (e) {}
                    titleNsMap.set(edit.title, nsId);
                  }
                }
                loadingEl.textContent =
                  "Fetching contributions... (" +
                  allTitles.size +
                  " unique page" +
                  (allTitles.size !== 1 ? "s" : "") +
                  " found so far)";
              }
              if (data.continue) {
                continueToken = data.continue;
              } else {
                fetching = false;
              }
            }
          } catch (e) {
            exportBody.removeChild(loadingEl);
            const errEl = document.createElement("div");
            errEl.className = "tng-log-err";
            errEl.style.padding = "6px 0";
            errEl.textContent =
              "️️️⚠️️️ Failed to fetch contributions: " + formatApiError(e);
            exportBody.appendChild(errEl);
            const btnClose = makeBtn("✕ Close", "quiet");
            btnClose.addEventListener("click", function () {
              exportOverlay.closeHandler();
            });
            exportFooter.appendChild(btnClose);
            return;
          }

          exportBody.removeChild(loadingEl);

          if (!allTitles.size) {
            const emptyEl = document.createElement("div");
            emptyEl.className = "tng-info-empty";
            emptyEl.textContent = "No contributions found for this user.";
            exportBody.appendChild(emptyEl);
            const btnClose = makeBtn("✕ Close", "quiet");
            btnClose.addEventListener("click", function () {
              exportOverlay.closeHandler();
            });
            exportFooter.appendChild(btnClose);
            return;
          }

          // Namespace filter row — only rendered when results span more than one namespace.
          const formattedNamespaces =
            mw.config.get("wgFormattedNamespaces") || {};
          const presentNsIds = new Set(titleNsMap.values());
          const sortedNsIds = [...presentNsIds].sort(function (a, b) {
            return a - b;
          });
          const nsFilterChecks = [];

          if (sortedNsIds.length > 1) {
            const nsFilterEl = document.createElement("div");
            nsFilterEl.style.cssText =
              "display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 6px 0 4px;";
            const nsFilterLbl = document.createElement("span");
            nsFilterLbl.className = "tng-rights-subtitle";
            nsFilterLbl.style.marginRight = "2px";
            nsFilterLbl.textContent = "Filter by namespace:";
            nsFilterEl.appendChild(nsFilterLbl);
            for (const nsId of sortedNsIds) {
              const nsName = formattedNamespaces[nsId] || "Main";
              const { wrap: wNs, chk: cNs } = makeCheckbox(nsName, true);
              wNs.style.marginBottom = "0";
              cNs.dataset.nsId = String(nsId);
              nsFilterEl.appendChild(wNs);
              nsFilterChecks.push(cNs);
            }
            exportBody.appendChild(nsFilterEl);
          }

          // Sort controls.
          const sortRow = document.createElement("div");
          sortRow.style.cssText =
            "display: flex; gap: 6px; align-items: center; padding: 6px 0;";
          const sortLbl = document.createElement("span");
          sortLbl.className = "tng-rights-subtitle";
          sortLbl.textContent = "Sort by:";
          sortRow.appendChild(sortLbl);

          const btnSortAZ = makeBtn("A–Z", "primary");
          btnSortAZ.className += " tng-btn-sm";
          btnSortAZ.title = "Sort alphabetically, A to Z";
          const btnSortZA = makeBtn("Z–A", "quiet");
          btnSortZA.className += " tng-btn-sm";
          btnSortZA.title = "Sort alphabetically, Z to A";
          sortRow.appendChild(btnSortAZ);
          sortRow.appendChild(btnSortZA);
          exportBody.appendChild(sortRow);

          // Summary line — updated whenever the filter or sort changes.
          const summaryEl = document.createElement("div");
          summaryEl.className = "tng-help";
          exportBody.appendChild(summaryEl);

          // Scrollable wikitext preview box.
          const listBox = document.createElement("div");
          listBox.className = "tng-log-box";
          listBox.style.height = "320px";
          exportBody.appendChild(listBox);

          // Namespaces that require a colon prefix in wikilinks to render as a
          // hyperlink rather than an embedded file or a category membership tag.
          const colonPrefixNs = new Set([6, 14]); // File, Category

          function toWikiLink(title) {
            const nsId = titleNsMap.get(title) || 0;
            const prefix = colonPrefixNs.has(nsId) ? ":" : "";
            return "[[" + prefix + title + "]]";
          }

          // Returns the set of active namespace ID strings from the filter checkboxes,
          // or null when no filter row was rendered (single-namespace result).
          function getActiveNsIds() {
            if (!nsFilterChecks.length) return null;
            return new Set(
              nsFilterChecks
                .filter(function (c) {
                  return c.checked;
                })
                .map(function (c) {
                  return c.dataset.nsId;
                }),
            );
          }

          let currentSort = "az";

          function getFilteredSortedTitles() {
            const activeNs = getActiveNsIds();
            let titles = [...allTitles];
            if (activeNs) {
              titles = titles.filter(function (t) {
                return activeNs.has(String(titleNsMap.get(t) || 0));
              });
            }
            if (currentSort === "az") {
              titles.sort(function (a, b) {
                return a.localeCompare(b, undefined, { sensitivity: "base" });
              });
            } else {
              titles.sort(function (a, b) {
                return b.localeCompare(a, undefined, { sensitivity: "base" });
              });
            }
            return titles;
          }

          function setSortActive(activeBtn) {
            [btnSortAZ, btnSortZA].forEach(function (b) {
              b.classList.remove("tng-btn-primary");
              b.classList.add("tng-btn-quiet");
            });
            activeBtn.classList.remove("tng-btn-quiet");
            activeBtn.classList.add("tng-btn-primary");
          }

          function renderExportList() {
            listBox.innerHTML = "";
            const titles = getFilteredSortedTitles();
            const total = allTitles.size;
            summaryEl.textContent =
              titles.length +
              " of " +
              total +
              " unique page" +
              (total !== 1 ? "s" : "") +
              " shown.";
            if (!titles.length) {
              const emptyLine = document.createElement("div");
              emptyLine.className = "tng-info-empty";
              emptyLine.textContent = "No pages match the current filter.";
              listBox.appendChild(emptyLine);
              return;
            }
            for (let i = 0; i < titles.length; i++) {
              const line = document.createElement("div");
              line.textContent = "# " + toWikiLink(titles[i]);
              listBox.appendChild(line);
            }
          }

          nsFilterChecks.forEach(function (cNs) {
            cNs.addEventListener("change", renderExportList);
          });

          btnSortAZ.addEventListener("click", function () {
            currentSort = "az";
            setSortActive(btnSortAZ);
            renderExportList();
          });

          btnSortZA.addEventListener("click", function () {
            currentSort = "za";
            setSortActive(btnSortZA);
            renderExportList();
          });

          renderExportList();

          // Footer buttons.
          const btnCopy = makeBtn("Copy as wiki links", "primary");
          btnCopy.addEventListener("click", function () {
            const titles = getFilteredSortedTitles();
            const text = titles
              .map(function (t) {
                return "# " + toWikiLink(t);
              })
              .join("\n");
            navigator.clipboard
              .writeText(text)
              .then(function () {
                const orig = btnCopy.textContent;
                btnCopy.textContent = "✔ Copied!";
                setTimeout(function () {
                  btnCopy.textContent = orig;
                }, 2000);
              })
              .catch(function () {
                const ta = document.createElement("textarea");
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                try {
                  document.execCommand("copy");
                } catch (err) {}
                document.body.removeChild(ta);
                const orig = btnCopy.textContent;
                btnCopy.textContent = "✔ Copied!";
                setTimeout(function () {
                  btnCopy.textContent = orig;
                }, 2000);
              });
          });

          const btnClose = makeBtn("Close", "quiet");
          btnClose.addEventListener("click", function () {
            exportOverlay.closeHandler();
          });

          exportFooter.appendChild(btnCopy);
          exportFooter.appendChild(btnClose);
        };

        // ============================================================================
        // [Section 09] Dialogue builder (input config)
        // Generates configuration layout panel structures, parses package parameters,
        // and configures field states. Also fetches the current user's rights to
        // populate the footer rights panel and lock sections the user lacks access to.
        // ============================================================================
        const init = function () {
          if (inited) return;
          inited = true;

          // Inject the stylesheet once on first dialogue open; defers CSSOM mutation
          // from script load time so pages that never open Tengu pay no style cost.
          if (!cssInited) {
            cssInited = true;
          }

          // Determine operating context mode: User mode or page mode
          const isUserMode = !!mw.config.get("wgRelevantUserName");
          const currentNamespace = mw.config.get("wgNamespaceNumber");
          const isContributionsPage =
            mw.config.get("wgCanonicalSpecialPageName") === "Contributions" ||
            mw.config.get("wgCanonicalSpecialPageName") === "IPContributions";
          // Check if page execution is explicitly targeting the user/user talk namespace (NS2/NS3) or the contributions page
          const isUserNamespace =
            currentNamespace === 2 ||
            currentNamespace === 3 ||
            isContributionsPage;

          // Detect IP ranges (CIDR notation) in the relevant username.
          // mw.util.isIPAddress(str, true) accepts both single IPs and CIDR ranges;
          // mw.util.isIPAddress(str) without the flag accepts single IPs only.
          // A value that passes the former but not the latter is a range.
          const relevantUserName = mw.config.get("wgRelevantUserName") || "";
          const isIPRange =
            !!relevantUserName &&
            mw.util.isIPAddress(relevantUserName, true) &&
            !mw.util.isIPAddress(relevantUserName);

          // Special pages (NS -1) cannot be deleted or protected; used to gate those sections in page mode
          const isSpecialPage = currentNamespace === -1;

          // Default to page mode when the target is an IP range; user mode is not
          // applicable as ranges are not addressable as individual user targets.
          let tenguMode = isUserMode && !isIPRange ? "user" : "page";
          // Set when the rights Promise settles; used by applyModeRestrictions() to
          // re-apply rights-based locks when switching from page mode back to user mode.
          let resolvedRights = null;
          // Maps page title → { revids, latest, oldestParent } for items chosen via
          // the custom-selection picker. Populated when the user confirms the picker.
          let customSelectedPageEdits = {};
          // Array of page titles the user created, chosen via the custom-selection picker.
          let customSelectedCreations = [];
          // Set to true once the rights check confirms the user lacks the undelete
          // right; guards the dynamic per-target enable/disable logic in
          // updateSectionStatus() so a permanent rights lock is never undone.
          let undeleteRightsLocked = false;
          // Set when globalSysopsScopePromise settles; read by updateSectionStatus()
          // to decide whether the Report to global sysops section is available.
          let gsScopeInfo = null;

          // Fetch the current user's rights and groups immediately so the result is
          // ready (or very close to ready) by the time the dialogue finishes building.
          const rightsApi = new mw.Api();
          const rightsPromise = new Promise(function (resolve) {
            rightsApi
              .get({
                action: "query",
                meta: "userinfo",
                uiprop: "rights|groups",
              })
              .done(function (data) {
                const ui = data && data.query && data.query.userinfo;
                resolve({
                  rights: (ui && ui.rights) || [],
                  groups: (ui && ui.groups) || [],
                });
              })
              .fail(function () {
                resolve({ rights: [], groups: [] });
              });
          });

          // Fetch global user info (CentralAuth groups) in parallel.
          // Used to populate the global-rights row in the footer panel.
          const globalRightsPromise = new Promise(function (resolve) {
            rightsApi
              .get({
                action: "query",
                meta: "globaluserinfo",
                guiprop: "groups|rights",
              })
              .done(function (data) {
                const gui = data && data.query && data.query.globaluserinfo;
                resolve({
                  groups: (gui && gui.groups) || [],
                });
              })
              .fail(function () {
                resolve({ groups: [] });
              });
          });

          // Checks whether this wiki has the 'extendedconfirmed' protection level
          // configured, via siprop=restrictions. This level does not exist on all
          // wikis, so the corresponding option is only added to the Edit and Move
          // restriction drop-downs once this has been confirmed.
          const restrictionLevelsPromise = new Promise(function (resolve) {
            rightsApi
              .get({
                action: "query",
                meta: "siteinfo",
                siprop: "restrictions",
              })
              .done(function (data) {
                const levels =
                  (data &&
                    data.query &&
                    data.query.restrictions &&
                    data.query.restrictions.levels) ||
                  [];
                resolve({
                  hasExtendedConfirmed:
                    levels.indexOf("extendedconfirmed") !== -1,
                });
              })
              .fail(function () {
                resolve({ hasExtendedConfirmed: false });
              });
          });

          // Determines whether this wiki falls within the scope of the global
          // sysops service. Resolved entirely from GS_INELIGIBLE_HOSTS: any
          // host on that list is out of scope, every other host is treated as
          // in scope. A prior version fell back to a CentralAuth
          // list=wikisets lookup for hosts not on the list, but that request
          // returns the full wikisincluded array for every wikiset, which is
          // slow  — and ran on every wiki not listed in GS_INELIGIBLE_HOSTS, i.e.
          // on most eligible wikis, on every dialogue open.
          // Removing the API call means this resolves immediately, but eligibility
          // now depends entirely on GS_INELIGIBLE_HOSTS being accurate;
          // there is no longer a fallback check.
          const globalSysopsScopePromise = new Promise(function (resolve) {
            const currentHost = (mw.config.get("wgServer") || "").replace(
              /^(?:https?:)?\/\//,
              "",
            );
            resolve({
              inScope: !GS_INELIGIBLE_HOSTS.has(currentHost),
              resolved: true,
            });
          });

          if (typeof p4js_all_in_one === "undefined")
            window.p4js_all_in_one = {};
          const aioConf = window.p4js_all_in_one;
          const suffixes = aioConf.suffixes || [
            "",
            " (global sysops action)",
            " (stewards action)",
            " (global rollbackers action)",
          ];

          // Default package and native presets are now sourced from
          // Tengu-packages.js (see window.TenguPackages.get() above).
          const defaultPackage = DEFAULT_PACKAGE;

          let packages = aioConf.packages || {};
          // Names of any custom packages supplied via aioConf.packages,
          // captured before the native presets are merged in below. Since
          // Tengu cannot know whether a custom package is meant for user
          // mode, page mode, or both, custom packages are shown in the
          // Package dropdown regardless of mode.
          const customPackageNames = Object.keys(packages);
          if (!packages.Default) packages.Default = defaultPackage;

          for (const presetName of Object.keys(NATIVE_PRESETS)) {
            if (!packages[presetName]) {
              packages[presetName] = NATIVE_PRESETS[presetName];
            }
          }
          for (const presetName of Object.keys(PAGE_NATIVE_PRESETS)) {
            if (!packages[presetName]) {
              packages[presetName] = PAGE_NATIVE_PRESETS[presetName];
            }
          }

          const { overlay, dialog, body, footer } = createDialog({
            title: "Tengu — your all-in-one moderation tools",
            icon: "⛩️",
          });

          // Mode badge — shown in the dialogue header rather than the
          // scrollable body, so the active mode stays visible at all times,
          // even after the user has scrolled past the mode toggle or mode
          // notice further down the dialogue.
          const modeBadge = document.createElement("span");
          function updateModeBadge(isUserModeNow) {
            modeBadge.className =
              "tng-mode-badge " +
              (isUserModeNow ? "tng-mode-badge-user" : "tng-mode-badge-page");
            modeBadge.textContent = isUserModeNow
              ? "👤 User mode"
              : "📄 Page mode";
          }
          updateModeBadge(tenguMode === "user");
          dialog
            .querySelector(".tng-dialog-header-left")
            .appendChild(modeBadge);

          const topSection = document.createElement("div");
          topSection.style.cssText =
            "display:flex;flex-direction:column;gap:10px;";

          // Mode toggle row — Rendered globally across all namespace layers
          const { row: rowMode, field: fieldMode } = makeRow("Mode");
          const modeToggle = document.createElement("div");
          modeToggle.className = "tng-mode-toggle";

          const btnModeUser = document.createElement("button");
          btnModeUser.className = "tng-mode-btn";
          btnModeUser.textContent = "👤 User mode";

          const btnModePage = document.createElement("button");
          btnModePage.className = "tng-mode-btn";
          btnModePage.textContent = "📄 Page mode";

          // Dynamically map default execution target indicators on activation context
          if (tenguMode === "user") {
            btnModeUser.classList.add(
              "tng-mode-btn-active",
              "tng-mode-btn-active-user",
            );
          } else {
            btnModePage.classList.add(
              "tng-mode-btn-active",
              "tng-mode-btn-active-page",
            );
          }

          // Restrict user mode selection if current workspace context sits outside standard user profile areas
          if (!isUserNamespace) {
            btnModeUser.disabled = true;
            btnModeUser.style.opacity = "0.4";
            btnModeUser.style.cursor = "not-allowed";
            btnModeUser.title =
              "User mode is only available when Tengu is launched from a user profile or contribution space";
          } else if (isIPRange) {
            // IP ranges (e.g. 192.168.0.0/16 or 2001:db8::/32) cannot be used as
            // individual user targets. User mode is disabled for range pages.
            btnModeUser.disabled = true;
            btnModeUser.style.opacity = "0.4";
            btnModeUser.style.cursor = "not-allowed";
            btnModeUser.title =
              "User mode is not available for IP ranges. IP ranges cannot be targeted as individual users. Use the block section in page mode, or navigate to a single IP address instead.";
          } else {
            btnModeUser.addEventListener("click", function () {
              if (tenguMode === "user") return;
              btnModeUser.classList.add(
                "tng-mode-btn-active",
                "tng-mode-btn-active-user",
              );
              btnModePage.classList.remove(
                "tng-mode-btn-active",
                "tng-mode-btn-active-page",
              );
              applyModeRestrictions(true);
            });
          }

          btnModePage.addEventListener("click", function () {
            if (tenguMode === "page") return;
            btnModePage.classList.add(
              "tng-mode-btn-active",
              "tng-mode-btn-active-page",
            );
            btnModeUser.classList.remove(
              "tng-mode-btn-active",
              "tng-mode-btn-active-user",
            );
            applyModeRestrictions(false);
          });

          modeToggle.appendChild(btnModeUser);
          modeToggle.appendChild(btnModePage);
          fieldMode.appendChild(modeToggle);

          // Manual light/dark mode toggle — same row as the mode toggle
          // buttons. Shows the icon for the mode a click will switch *to*
          // (crescent moon in light mode, sun in dark mode).
          const btnThemeToggle = makeBtn("🌙", "quiet");
          btnThemeToggle.className += " tng-btn-sm tng-theme-toggle-btn";
          function updateThemeToggleBtn() {
            if (theme === "dark") {
              btnThemeToggle.textContent = "☀️";
              btnThemeToggle.title = "Switch to light mode";
            } else {
              btnThemeToggle.textContent = "🌙";
              btnThemeToggle.title = "Switch to dark mode";
            }
          }
          updateThemeToggleBtn();
          btnThemeToggle.addEventListener("click", function () {
            setTheme(theme === "dark" ? "light" : "dark");
            updateThemeToggleBtn();
          });
          btnThemeToggle.style.marginLeft = "auto";
          fieldMode.appendChild(btnThemeToggle);

          topSection.appendChild(rowMode);

          // Mode notice — Informs users how deletion and protection behave in the current mode
          const divModeNotice = document.createElement("div");
          divModeNotice.className = "tng-mode-notice";
          // isSpecialTarget: true when in page mode and the target resolves to a special page
          function updateModeNotice(isUser, isSpecialTarget) {
            divModeNotice.className =
              "tng-mode-notice " +
              (isUser ? "tng-mode-notice-user" : "tng-mode-notice-page");
            if (isUser) {
              divModeNotice.innerHTML =
                "<b>User mode</b> — deletion and protection apply to all pages recently edited by the target user, not a single page. To target one specific page instead, switch to page mode.";
            } else if (isSpecialTarget) {
              divModeNotice.innerHTML =
                "<b>Page mode</b> — the target is a special page. Page deletion and protection are not available for special pages.";
            } else {
              divModeNotice.innerHTML =
                "<b>Page mode</b> — deletion and protection apply only to the target page entered below. Rollback, block, and revision deletion are not available in this mode.";
            }
          }
          updateModeNotice(tenguMode === "user");
          topSection.appendChild(divModeNotice);

          const { row: rowTarget, field: fieldTarget } = makeRow(
            tenguMode === "user" ? "Target user" : "Target page",
          );
          const inputTarget = makeInput(
            tenguMode === "user"
              ? "Username or IP (not a range)"
              : "Page title",
          );
          fieldTarget.appendChild(inputTarget);

          const btnGetInfo = makeBtn("🔦 Get info", "quiet");
          btnGetInfo.className += " tng-btn-sm";
          btnGetInfo.title =
            tenguMode === "user"
              ? "View access rights, block log, rights changes, and abuse filter log for this user"
              : "View abuse filter, protection, deletion, and move logs for this page";
          btnGetInfo.disabled = true;

          inputTarget.addEventListener("input", function () {
            clearInputError(inputTarget);
            btnGetInfo.disabled = !inputTarget.value.trim();
          });

          btnGetInfo.addEventListener("click", function () {
            const target = inputTarget.value.trim();
            if (!target) return;
            if (tenguMode === "user") {
              getUserInfo(target);
            } else {
              getPageInfo(target);
            }
          });
          fieldTarget.appendChild(btnGetInfo);

          const btnExportEdits = makeBtn("📥 Export edits", "quiet");
          btnExportEdits.className += " tng-btn-sm";
          btnExportEdits.title =
            "Export a list of all pages edited by this user as wiki links";
          btnExportEdits.disabled = true;
          if (tenguMode !== "user") btnExportEdits.style.display = "none";
          btnExportEdits.addEventListener("click", function () {
            const target = inputTarget.value.trim();
            if (!target) return;
            openExportEditsDialog(target);
          });
          fieldTarget.appendChild(btnExportEdits);

          // Keep the export button's disabled state in sync with the target field.
          inputTarget.addEventListener("input", function () {
            btnExportEdits.disabled = !inputTarget.value.trim();
          });

          topSection.appendChild(rowTarget);
          const { row: rowEdits, field: fieldEdits } = makeRow("Edits");

          const selEndtime = makeSelect([
            { value: "3600", label: "In the last 1 hour" },
            { value: "7200", label: "In the last 2 hours" },
            { value: "10800", label: "In the last 3 hours" },
            { value: "21600", label: "In the last 6 hours" },
            { value: "32400", label: "In the last 9 hours" },
            { value: "43200", label: "In the last 12 hours" },
            { value: "86400", label: "In the last 1 day" },
            { value: "172800", label: "In the last 2 days" },
            { value: "259200", label: "In the last 3 days" },
            { value: "604800", label: "In the last 1 week" },
            { value: "1209600", label: "In the last 2 weeks" },
            { value: "2592000", label: "In the last 1 month" },
            { value: "inf", label: "All edits" },
            { value: "other", label: "Custom date and time:" },
            { value: "other-between", label: "Between two dates:" },
            { value: "custom", label: "Select specific edits/pages:" },
          ]);
          const inputEndtime = document.createElement("input");
          inputEndtime.type = "datetime-local";
          inputEndtime.className = "tng-input tng-hidden";
          // Set max to the current local time so only past datetimes are selectable.
          // Refreshed here at dialogue-open time; not updated dynamically while open,
          // but acceptable for a moderation tool where sessions are short.
          inputEndtime.max = new Date(
            Date.now() - new Date().getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16);

          const inputBetweenFrom = document.createElement("input");
          inputBetweenFrom.type = "datetime-local";
          inputBetweenFrom.className = "tng-input";
          inputBetweenFrom.max = inputEndtime.max;
          inputBetweenFrom.style.flex = "1";

          const inputBetweenTo = document.createElement("input");
          inputBetweenTo.type = "datetime-local";
          inputBetweenTo.className = "tng-input";
          inputBetweenTo.max = inputEndtime.max;
          inputBetweenTo.style.flex = "1";

          selEndtime.addEventListener("change", function () {
            inputEndtime.classList.toggle(
              "tng-hidden",
              selEndtime.value !== "other",
            );
            editGroupBetween.classList.toggle(
              "tng-hidden",
              selEndtime.value !== "other-between",
            );
            pickEditsBtnRow.classList.toggle(
              "tng-hidden",
              selEndtime.value !== "custom",
            );
            if (selEndtime.value !== "custom") {
              customSelectedPageEdits = {};
              customSelectedCreations = [];
            }
          });

          const editGroup = document.createElement("div");
          editGroup.style.cssText =
            "display: flex; flex-direction: column; gap: 6px; width: 100%;";

          const editGroupTop = document.createElement("div");
          editGroupTop.style.cssText = "display: flex; gap: 6px; width: 100%;";
          inputEndtime.style.flex = "1";
          editGroupTop.appendChild(wrapSelect(selEndtime, "1"));
          editGroupTop.appendChild(inputEndtime);

          const editGroupBetween = document.createElement("div");
          editGroupBetween.className = "tng-hidden";
          editGroupBetween.style.cssText =
            "display: flex; gap: 6px; align-items: center; width: 100%;";

          const lblBetweenFrom = document.createElement("span");
          lblBetweenFrom.className = "tng-inline-label";
          lblBetweenFrom.textContent = "From:";

          const lblBetweenTo = document.createElement("span");
          lblBetweenTo.className = "tng-inline-label";
          lblBetweenTo.textContent = "To:";

          editGroupBetween.appendChild(lblBetweenFrom);
          editGroupBetween.appendChild(inputBetweenFrom);
          editGroupBetween.appendChild(lblBetweenTo);
          editGroupBetween.appendChild(inputBetweenTo);

          editGroup.appendChild(editGroupTop);
          editGroup.appendChild(editGroupBetween);
          fieldEdits.appendChild(editGroup);
          topSection.appendChild(rowEdits);

          // Picker button row — only visible when "Select specific edits/pages" is active.
          const pickEditsBtnRow = document.createElement("div");
          pickEditsBtnRow.className = "tng-hidden";
          pickEditsBtnRow.style.cssText =
            "display: flex; flex-direction: column; gap: 4px; padding-left: 190px;";

          const btnPickEdits = makeBtn("🔎 Select edits/pages", "quiet");
          btnPickEdits.className += " tng-btn-sm";
          btnPickEdits.style.alignSelf = "flex-start";
          btnPickEdits.title =
            "Open a dialogue to choose which of the target user's edits and created pages to include.";

          const lblPickerSummary = document.createElement("div");
          lblPickerSummary.className = "tng-help";
          lblPickerSummary.textContent = "No items selected.";

          function updatePickerSelectionSummary() {
            const editCount = Object.keys(customSelectedPageEdits).length;
            const createCount = customSelectedCreations.length;
            if (editCount === 0 && createCount === 0) {
              lblPickerSummary.textContent = "No items selected.";
            } else {
              const parts = [];
              if (editCount) {
                parts.push(
                  editCount + " edited page" + (editCount !== 1 ? "s" : ""),
                );
              }
              if (createCount) {
                parts.push(
                  createCount +
                    " created page" +
                    (createCount !== 1 ? "s" : ""),
                );
              }
              lblPickerSummary.textContent = parts.join(", ") + " selected.";
            }
          }

          pickEditsBtnRow.appendChild(btnPickEdits);
          pickEditsBtnRow.appendChild(lblPickerSummary);
          topSection.appendChild(pickEditsBtnRow);

          btnPickEdits.addEventListener("click", async function () {
            const pickerTarget = inputTarget.value.trim();
            if (!pickerTarget) {
              showNotification(
                fieldTarget,
                "Please enter a target username first.",
              );
              inputTarget.focus();
              return;
            }

            const {
              overlay: pickerOverlay,
              body: pickerBody,
              footer: pickerFooter,
            } = createDialog({
              title: "Select edits/pages — " + pickerTarget,
              icon: "🔎",
              child: true,
            });

            const loadingEl = document.createElement("div");
            loadingEl.className = "tng-info-loading";
            loadingEl.textContent = "Fetching contributions...";
            pickerBody.appendChild(loadingEl);

            let pickerContribs = [];

            try {
              let continueToken = {};
              let fetching = true;
              while (fetching) {
                const params = Object.assign(
                  {
                    action: "query",
                    list: "usercontribs",
                    ucuser: pickerTarget,
                    ucprop: "ids|title|timestamp|flags",
                    uclimit: "max",
                  },
                  continueToken,
                );
                const data = await apiGet(params);
                if (data.query && data.query.usercontribs) {
                  pickerContribs = pickerContribs.concat(
                    data.query.usercontribs,
                  );
                  loadingEl.textContent =
                    "Fetching contributions... (" +
                    pickerContribs.length +
                    " so far)";
                }
                if (data.continue) {
                  continueToken = data.continue;
                } else {
                  fetching = false;
                }
              }
            } catch (e) {
              loadingEl.className = "tng-log-err";
              loadingEl.style.padding = "6px 0";
              loadingEl.textContent =
                "Failed to fetch contributions: " + formatApiError(e);
              const btnClose = makeBtn("Close", "quiet");
              btnClose.addEventListener("click", function () {
                pickerOverlay.closeHandler();
              });
              pickerFooter.appendChild(btnClose);
              return;
            }

            pickerBody.removeChild(loadingEl);

            // Group contributions into edited pages and created pages,
            // using the same split as work().
            const pickerEditedPages = {};
            const pickerCreatedPages = {};

            for (const edit of pickerContribs) {
              if (edit.new === "") {
                if (!pickerCreatedPages[edit.title]) {
                  pickerCreatedPages[edit.title] = {
                    timestamp: edit.timestamp,
                  };
                }
              } else {
                if (!pickerEditedPages[edit.title]) {
                  pickerEditedPages[edit.title] = {
                    revids: [],
                    latest: edit.revid,
                    oldestParent: edit.parentid,
                    timestamp: edit.timestamp,
                  };
                }
                pickerEditedPages[edit.title].revids.push(edit.revid);
                pickerEditedPages[edit.title].oldestParent = edit.parentid;
              }
            }

            const pickerEditedTitles = Object.keys(pickerEditedPages).sort();
            const pickerCreatedTitles = Object.keys(pickerCreatedPages).sort();

            if (!pickerEditedTitles.length && !pickerCreatedTitles.length) {
              const emptyEl = document.createElement("div");
              emptyEl.className = "tng-info-empty";
              emptyEl.textContent = "No contributions found for this user.";
              pickerBody.appendChild(emptyEl);
              const btnClose = makeBtn("Close", "quiet");
              btnClose.addEventListener("click", function () {
                pickerOverlay.closeHandler();
              });
              pickerFooter.appendChild(btnClose);
              return;
            }

            // Collect the namespaces present across all fetched titles so the
            // filter row only shows namespaces that are actually in the results.
            const formattedNamespaces =
              mw.config.get("wgFormattedNamespaces") || {};
            const presentNsIds = new Set();
            for (const title of [
              ...pickerEditedTitles,
              ...pickerCreatedTitles,
            ]) {
              let nsId = 0;
              try {
                nsId = new mw.Title(title).getNamespaceId();
              } catch (e) {}
              presentNsIds.add(nsId);
            }
            const sortedNsIds = [...presentNsIds].sort(function (a, b) {
              return a - b;
            });

            // Build the namespace filter row. Only rendered when the results
            // span more than one namespace; a single-namespace result needs no
            // filter.
            const nsFilterChecks = [];
            if (sortedNsIds.length > 1) {
              const nsFilterEl = document.createElement("div");
              nsFilterEl.style.cssText =
                "display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 6px 0 4px;";
              const nsFilterLbl = document.createElement("span");
              nsFilterLbl.className = "tng-rights-subtitle";
              nsFilterLbl.style.marginRight = "2px";
              nsFilterLbl.textContent = "Filter by namespace:";
              nsFilterEl.appendChild(nsFilterLbl);
              for (const nsId of sortedNsIds) {
                // wgFormattedNamespaces returns an empty string for the main
                // namespace (ID 0); fall back to "Main" in that case.
                const nsName = formattedNamespaces[nsId] || "Main";
                const { wrap: wNs, chk: cNs } = makeCheckbox(nsName, true);
                wNs.style.marginBottom = "0";
                cNs.dataset.nsId = String(nsId);
                nsFilterEl.appendChild(wNs);
                nsFilterChecks.push(cNs);
              }
              pickerBody.appendChild(nsFilterEl);
            }

            function fmtPickerDate(ts) {
              if (!ts) return "";
              const d = new Date(ts);
              return isNaN(d.getTime())
                ? ""
                : d.toUTCString().replace("GMT", "UTC");
            }

            // Builds a collapsible section with select-all / deselect-all
            // controls and one checkbox per item.
            function makePickerSection(sectionTitle, items, labelFn, tsFn) {
              const sec = document.createElement("div");
              sec.className = "tng-section";

              const hdr = document.createElement("div");
              hdr.className = "tng-section-header";
              const titleSpan = document.createElement("span");
              titleSpan.textContent = sectionTitle + " (" + items.length + ")";
              hdr.appendChild(titleSpan);
              const arrow = document.createElement("span");
              arrow.className = "tng-section-arrow tng-arrow-up";
              hdr.appendChild(arrow);

              const secBody = document.createElement("div");
              secBody.className = "tng-section-body";
              secBody.style.maxHeight = "280px";

              hdr.addEventListener("click", function () {
                const hidden = secBody.classList.toggle("tng-hidden");
                arrow.classList.toggle("tng-arrow-up", !hidden);
              });

              const ctrlRow = document.createElement("div");
              ctrlRow.style.cssText =
                "display: flex; gap: 6px; margin-bottom: 6px;";
              const btnAll = makeBtn("Select all", "quiet");
              btnAll.className += " tng-btn-sm";
              const btnNone = makeBtn("Deselect all", "quiet");
              btnNone.className += " tng-btn-sm";
              const btnInvert = makeBtn("Invert selection", "quiet");
              btnInvert.className += " tng-btn-sm";

              const checkboxes = [];
              const listEl = document.createElement("div");
              listEl.style.cssText =
                "display: flex; flex-direction: column; gap: 4px;";

              for (const item of items) {
                const { wrap, chk } = makeCheckbox(labelFn(item), false);
                chk.dataset.pickerKey = item;
                // Store the title and timestamp on the wrapper for sorting.
                wrap.dataset.pickerKey = item;
                if (tsFn) wrap.dataset.pickerTimestamp = tsFn(item) || "";
                // Store the namespace ID on the wrapper so the namespace
                // filter can show/hide rows without re-parsing titles.
                let itemNsId = 0;
                try {
                  itemNsId = new mw.Title(item).getNamespaceId();
                } catch (e) {}
                wrap.dataset.pickerNsId = String(itemNsId);
                checkboxes.push(chk);
                listEl.appendChild(wrap);
              }

              // All three bulk-action buttons operate only on currently visible
              // items so that namespace filtering does not silently affect hidden
              // selections.
              btnAll.addEventListener("click", function () {
                checkboxes.forEach(function (c) {
                  if (!c.parentElement.classList.contains("tng-hidden")) {
                    c.checked = true;
                  }
                });
              });
              btnNone.addEventListener("click", function () {
                checkboxes.forEach(function (c) {
                  if (!c.parentElement.classList.contains("tng-hidden")) {
                    c.checked = false;
                  }
                });
              });
              btnInvert.addEventListener("click", function () {
                checkboxes.forEach(function (c) {
                  if (!c.parentElement.classList.contains("tng-hidden")) {
                    c.checked = !c.checked;
                  }
                });
              });

              ctrlRow.appendChild(btnAll);
              ctrlRow.appendChild(btnNone);
              ctrlRow.appendChild(btnInvert);
              secBody.appendChild(ctrlRow);
              secBody.appendChild(listEl);
              sec.appendChild(hdr);
              sec.appendChild(secBody);

              return { sec, checkboxes, listEl };
            }

            // Sort controls — shown above the picker sections so they are immediately visible.
            // Built here before the sections so the row is appended in the correct position.
            const sortRow = document.createElement("div");
            sortRow.style.cssText =
              "display: flex; gap: 6px; align-items: center; padding: 6px 0;";
            const sortLbl = document.createElement("span");
            sortLbl.className = "tng-rights-subtitle";
            sortLbl.textContent = "Sort by:";
            sortRow.appendChild(sortLbl);

            const btnSortAlpha = makeBtn("A–Z", "quiet");
            btnSortAlpha.className += " tng-btn-sm";
            btnSortAlpha.title = "Sort alphabetically by page title (A to Z)";
            const btnSortZA = makeBtn("Z–A", "quiet");
            btnSortZA.className += " tng-btn-sm";
            btnSortZA.title = "Sort alphabetically by page title (Z to A)";
            const btnSortOldest = makeBtn("Oldest first", "quiet");
            btnSortOldest.className += " tng-btn-sm";
            btnSortOldest.title =
              "Sort by date/time, oldest edits or creations first";
            const btnSortNewest = makeBtn("Newest first", "quiet");
            btnSortNewest.className += " tng-btn-sm";
            btnSortNewest.title =
              "Sort by date/time, newest edits or creations first";
            sortRow.appendChild(btnSortAlpha);
            sortRow.appendChild(btnSortZA);
            sortRow.appendChild(btnSortOldest);
            sortRow.appendChild(btnSortNewest);
            pickerBody.appendChild(sortRow);

            function setSortActive(activeBtn) {
              [btnSortAlpha, btnSortZA, btnSortOldest, btnSortNewest].forEach(
                function (b) {
                  b.classList.remove("tng-btn-primary");
                  b.classList.add("tng-btn-quiet");
                },
              );
              activeBtn.classList.remove("tng-btn-quiet");
              activeBtn.classList.add("tng-btn-primary");
            }

            // Reorders all children of a list element using the given comparator.
            // ISO 8601 timestamps compare correctly as strings, so lexicographic
            // comparison is sufficient for date sorting.
            function sortPickerListEl(listEl, compareFn) {
              if (!listEl) return;
              const items = Array.from(listEl.children);
              items.sort(compareFn);
              items.forEach(function (item) {
                listEl.appendChild(item);
              });
            }

            btnSortAlpha.addEventListener("click", function () {
              setSortActive(btnSortAlpha);
              const cmp = function (a, b) {
                return (a.dataset.pickerKey || "").localeCompare(
                  b.dataset.pickerKey || "",
                  undefined,
                  { sensitivity: "base" },
                );
              };
              sortPickerListEl(listElEdited, cmp);
              sortPickerListEl(listElCreated, cmp);
            });

            btnSortZA.addEventListener("click", function () {
              setSortActive(btnSortZA);
              const cmp = function (a, b) {
                return (b.dataset.pickerKey || "").localeCompare(
                  a.dataset.pickerKey || "",
                  undefined,
                  { sensitivity: "base" },
                );
              };
              sortPickerListEl(listElEdited, cmp);
              sortPickerListEl(listElCreated, cmp);
            });

            btnSortOldest.addEventListener("click", function () {
              setSortActive(btnSortOldest);
              const cmp = function (a, b) {
                const ta = a.dataset.pickerTimestamp || "";
                const tb = b.dataset.pickerTimestamp || "";
                if (!ta && !tb) return 0;
                if (!ta) return 1;
                if (!tb) return -1;
                return ta < tb ? -1 : ta > tb ? 1 : 0;
              };
              sortPickerListEl(listElEdited, cmp);
              sortPickerListEl(listElCreated, cmp);
            });

            btnSortNewest.addEventListener("click", function () {
              setSortActive(btnSortNewest);
              const cmp = function (a, b) {
                const ta = a.dataset.pickerTimestamp || "";
                const tb = b.dataset.pickerTimestamp || "";
                if (!ta && !tb) return 0;
                if (!ta) return 1;
                if (!tb) return -1;
                return ta > tb ? -1 : ta < tb ? 1 : 0;
              };
              sortPickerListEl(listElEdited, cmp);
              sortPickerListEl(listElCreated, cmp);
            });

            const allEditedCheckboxes = [];
            const allCreatedCheckboxes = [];
            let listElEdited = null;
            let listElCreated = null;

            if (pickerEditedTitles.length) {
              const {
                sec,
                checkboxes,
                listEl: _leEdited,
              } = makePickerSection(
                "Edited pages",
                pickerEditedTitles,
                function (t) {
                  const ts = pickerEditedPages[t].timestamp;
                  return t + (ts ? " — " + fmtPickerDate(ts) : "");
                },
                function (t) {
                  return pickerEditedPages[t].timestamp || "";
                },
              );
              listElEdited = _leEdited;
              // Pre-tick items from a previous confirmed selection.
              checkboxes.forEach(function (c) {
                if (customSelectedPageEdits[c.dataset.pickerKey]) {
                  c.checked = true;
                }
              });
              allEditedCheckboxes.push(...checkboxes);
              pickerBody.appendChild(sec);
            }

            if (pickerCreatedTitles.length) {
              const {
                sec,
                checkboxes,
                listEl: _leCreated,
              } = makePickerSection(
                "Created pages",
                pickerCreatedTitles,
                function (t) {
                  const ts = pickerCreatedPages[t].timestamp;
                  return t + (ts ? " — " + fmtPickerDate(ts) : "");
                },
                function (t) {
                  return pickerCreatedPages[t].timestamp || "";
                },
              );
              listElCreated = _leCreated;
              // Pre-tick items from a previous confirmed selection.
              checkboxes.forEach(function (c) {
                if (customSelectedCreations.includes(c.dataset.pickerKey)) {
                  c.checked = true;
                }
              });
              allCreatedCheckboxes.push(...checkboxes);
              pickerBody.appendChild(sec);
            }

            // Wire namespace filter change listeners now that listElEdited and
            // listElCreated are both defined. Must run after the picker sections
            // are built so the filter function can reference the correct list
            // elements. These listeners were dropped during the sort-controls
            // refactor in v2.72.0/v2.74.0.
            if (nsFilterChecks.length) {
              function applyPickerNamespaceFilter() {
                const activeNsIds = new Set(
                  nsFilterChecks
                    .filter(function (c) {
                      return c.checked;
                    })
                    .map(function (c) {
                      return c.dataset.nsId;
                    }),
                );
                [listElEdited, listElCreated].forEach(function (listEl) {
                  if (!listEl) return;
                  Array.from(listEl.children).forEach(function (wrap) {
                    wrap.classList.toggle(
                      "tng-hidden",
                      !activeNsIds.has(wrap.dataset.pickerNsId),
                    );
                  });
                });
              }
              nsFilterChecks.forEach(function (cNs) {
                cNs.addEventListener("change", applyPickerNamespaceFilter);
              });
            }

            const btnCancelPicker = makeBtn("Cancel", "quiet");
            btnCancelPicker.addEventListener("click", function () {
              pickerOverlay.closeHandler();
            });

            const btnConfirmPicker = makeBtn("Confirm selection", "primary");
            btnConfirmPicker.addEventListener("click", function () {
              customSelectedPageEdits = {};
              customSelectedCreations = [];
              allEditedCheckboxes.forEach(function (c) {
                if (c.checked) {
                  customSelectedPageEdits[c.dataset.pickerKey] =
                    pickerEditedPages[c.dataset.pickerKey];
                }
              });
              allCreatedCheckboxes.forEach(function (c) {
                if (c.checked) {
                  customSelectedCreations.push(c.dataset.pickerKey);
                }
              });
              updatePickerSelectionSummary();
              pickerOverlay.closeHandler();
            });

            pickerFooter.appendChild(btnCancelPicker);
            pickerFooter.appendChild(btnConfirmPicker);
          });

          const { row: rowPkg, field: fieldPkg } = makeRow("Package");
          // Options are populated by rebuildPackageOptions() below rather
          // than fixed at construction time, since the set of relevant
          // presets differs between user mode and page mode.
          const selPackage = makeSelect([]);
          fieldPkg.appendChild(wrapSelect(selPackage));
          topSection.appendChild(rowPkg);

          // Rebuilds the Package dropdown's option list for the given mode.
          // "Default" and any custom packages supplied via aioConf.packages
          // are always shown; the native preset names shown depend on
          // whether Tengu is currently in user mode or page mode, since most
          // presets only make sense for one or the other.
          function rebuildPackageOptions(isUserModeNow) {
            const modeNames = isUserModeNow
              ? Object.keys(NATIVE_PRESETS)
              : Object.keys(PAGE_NATIVE_PRESETS);
            const names = ["Default"].concat(customPackageNames, modeNames);
            const seen = new Set();
            selPackage.innerHTML = "";
            for (const name of names) {
              if (seen.has(name)) continue;
              seen.add(name);
              const opt = document.createElement("option");
              opt.value = name;
              opt.textContent = name;
              selPackage.appendChild(opt);
            }
          }
          rebuildPackageOptions(tenguMode === "user");
          const { row: rowSuffix, field: fieldSuffix } = makeRow("Suffix");
          const selSuffix = makeSelect(
            suffixes.map(function (s) {
              return { value: s, label: s || "— (no suffix)" };
            }),
          );
          fieldSuffix.appendChild(wrapSelect(selSuffix));
          topSection.appendChild(rowSuffix);

          if (tenguMode === "page") {
            // Show the edits row but disable its controls — not applicable
            // in page mode. Unlike edits, the Package row remains usable in
            // page mode: rebuildPackageOptions() above already populated it
            // with the page-mode preset list.
            selEndtime.disabled = true;
            inputEndtime.disabled = true;
            inputBetweenFrom.disabled = true;
            inputBetweenTo.disabled = true;
            rowEdits.style.opacity = "0.5";
            rowEdits.title = "Not applicable in page mode";
          }
          body.appendChild(topSection);

          const {
            section: secRollback,
            sectionBody: bodyRollback,
            enableChk: chkRollback,
          } = makeSection("Rollback", "🔙", false);
          const { wrap: wrapBot, chk: chkBot } = makeCheckbox(
            "Mark as bot edits",
            true,
          );
          const { wrap: wrapShow, chk: chkShow } = makeCheckbox(
            "Show username in summary",
            true,
          );
          const { wrap: wrapUndo, chk: chkUndo } = makeCheckbox(
            "Use undo instead of rollback",
            false,
          );
          const checksRollback = document.createElement("div");
          checksRollback.className = "tng-checks";
          checksRollback.style.paddingLeft = "0";
          checksRollback.appendChild(wrapBot);
          checksRollback.appendChild(wrapShow);
          checksRollback.appendChild(wrapUndo);
          bodyRollback.appendChild(checksRollback);

          // "Mark as bot edits" only applies to native rollback; disable it when undo is selected.
          function updateBotAvailability() {
            const isUndo = chkUndo.checked;
            chkBot.disabled = isUndo;
            wrapBot.style.opacity = isUndo ? "0.5" : "";
            wrapBot.style.cursor = isUndo ? "not-allowed" : "";
            if (isUndo) chkBot.checked = false;
          }
          chkUndo.addEventListener("change", updateBotAvailability);

          const { row: rowRbReason, field: fieldRbReason } = makeRow("Reason");
          const selRbReason = makeSelect(ROLLBACK_REASONS);
          const inputRbReason = makeInput(
            "Additional details / customised reason",
          );
          const { wrap: filteredWrapRbReason } =
            makeFilteredSelect(selRbReason);

          const reasonWrapRollback = document.createElement("div");
          reasonWrapRollback.className = "tng-reason-wrap";
          reasonWrapRollback.appendChild(filteredWrapRbReason);
          reasonWrapRollback.appendChild(inputRbReason);

          fieldRbReason.appendChild(reasonWrapRollback);
          bodyRollback.appendChild(rowRbReason);
          body.appendChild(secRollback);

          const {
            section: secBlock,
            sectionBody: bodyBlock,
            enableChk: chkBlock,
          } = makeSection("Block", "⛔️", false);

          // Block status note — populated by updateSectionStatus() when the target changes
          const divBlockStatus = document.createElement("div");
          divBlockStatus.className = "tng-status-note tng-status-note-loading";
          divBlockStatus.textContent = "Enter a target to see block status.";
          bodyBlock.appendChild(divBlockStatus);

          // Global lock / block status note — populated by updateSectionStatus() when the target changes
          const divGlobalStatus = document.createElement("div");
          divGlobalStatus.className = "tng-status-note tng-status-note-loading";
          divGlobalStatus.textContent = "Enter a target to see global status.";
          bodyBlock.appendChild(divGlobalStatus);

          const { row: rowBlockDur, field: fieldBlockDur } = makeRow("Expiry");
          const selBlockDur = makeSelect([
            { value: "1 day", label: "1 day" },
            { value: "31 hours", label: "31 hours" },
            { value: "3 days", label: "3 days" },
            { value: "5 days", label: "5 days" },
            { value: "1 week", label: "1 week" },
            { value: "2 weeks", label: "2 weeks" },
            { value: "1 month", label: "1 month" },
            { value: "3 months", label: "3 months" },
            { value: "6 months", label: "6 months" },
            { value: "1 year", label: "1 year" },
            { value: "2 years", label: "2 years" },
            { value: "never", label: "Indefinite" },
            { value: "other", label: "Other:" },
          ]);
          const inputBlockDur = makeInput("e.g. 6 months, 2099-01-01");
          inputBlockDur.classList.add("tng-hidden");
          selBlockDur.addEventListener("change", function () {
            inputBlockDur.classList.toggle(
              "tng-hidden",
              selBlockDur.value !== "other",
            );
          });
          const durGroup = document.createElement("div");
          durGroup.style.cssText = "display: flex; gap: 6px; width: 100%;";
          inputBlockDur.style.flex = "1";
          durGroup.appendChild(wrapSelect(selBlockDur, "1"));
          durGroup.appendChild(inputBlockDur);
          fieldBlockDur.appendChild(durGroup);
          bodyBlock.appendChild(rowBlockDur);
          const { row: rowBlockReason, field: fieldBlockReason } =
            makeRow("Reason");
          const selBlockReason = makeSelect(BLOCK_REASONS);
          const inputBlockReason = makeInput("Additional reason");
          const { wrap: filteredWrapBlockReason } =
            makeFilteredSelect(selBlockReason);
          const reasonWrapBlock = document.createElement("div");
          reasonWrapBlock.className = "tng-reason-wrap";
          reasonWrapBlock.appendChild(filteredWrapBlockReason);
          reasonWrapBlock.appendChild(inputBlockReason);
          fieldBlockReason.appendChild(reasonWrapBlock);
          bodyBlock.appendChild(rowBlockReason);
          const { wrap: wrapHardblock, chk: chkHardblock } = makeCheckbox(
            "Apply block to logged-in users from this IP address",
            false,
          );
          const { wrap: wrapAutoblock, chk: chkAutoblock } = makeCheckbox(
            "Auto block",
            true,
          );
          const { wrap: wrapCreate, chk: chkCreate } = makeCheckbox(
            "Block account creation",
            true,
          );
          const { wrap: wrapTalk, chk: chkTalk } = makeCheckbox(
            "Block own talk page",
            true,
          );
          const { wrap: wrapMail, chk: chkMail } = makeCheckbox(
            "Block email",
            true,
          );
          const { wrap: wrapHidename, chk: chkHidename } = makeCheckbox(
            "Hide username from logs",
            false,
          );
          const { wrap: wrapAbuseFilter, chk: chkAbuseFilter } = makeCheckbox(
            'Append "See also the abuse filter log" to the edit summary',
            false,
          );
          const { wrap: wrapDeletedContribs, chk: chkDeletedContribs } =
            makeCheckbox(
              'Append "See also deleted contributions" to the edit summary',
              false,
            );
          wrapHardblock.title =
            "Apply block to logged-in users from this IP address";
          wrapAutoblock.title =
            "Auto-block the IP address used by this account for 24 hours";
          wrapHidename.title = 'Requires "hideuser" right';
          const checksBlock = document.createElement("div");
          checksBlock.className = "tng-checks";
          checksBlock.style.paddingLeft = "0";
          checksBlock.appendChild(wrapHardblock);
          checksBlock.appendChild(wrapAutoblock);
          checksBlock.appendChild(wrapCreate);
          checksBlock.appendChild(wrapTalk);
          checksBlock.appendChild(wrapMail);
          checksBlock.appendChild(wrapHidename);
          checksBlock.appendChild(wrapAbuseFilter);
          checksBlock.appendChild(wrapDeletedContribs);
          const { wrap: wrapNotifyBlock, chk: chkNotifyBlock } = makeCheckbox(
            "Send block notification to user talk page",
            true,
          );
          wrapNotifyBlock.title =
            "When ticked, a notification will be posted to the target user's talk page after a successful block.";
          checksBlock.appendChild(wrapNotifyBlock);
          const {
            wrap: wrapClearTalkPageBeforeNotify,
            chk: chkClearTalkPageBeforeNotify,
          } = makeCheckbox(
            "Clear user talk page before sending notification (indefinite blocks only)",
            false,
          );
          wrapClearTalkPageBeforeNotify.title =
            "When ticked and the block is indefinite, the user's talk page will be emptied before the block notification is posted. The notification will replace any previous discussion.";
          checksBlock.appendChild(wrapClearTalkPageBeforeNotify);

          // Disable the clear-talk-page option unless the block expiry is indefinite.
          function updateClearTalkState() {
            const isIndef = selBlockDur.value === "never";
            chkClearTalkPageBeforeNotify.disabled = !isIndef;
            wrapClearTalkPageBeforeNotify.style.opacity = isIndef ? "" : "0.5";
            wrapClearTalkPageBeforeNotify.style.cursor = isIndef
              ? ""
              : "not-allowed";
            if (!isIndef) chkClearTalkPageBeforeNotify.checked = false;
          }
          selBlockDur.addEventListener("change", updateClearTalkState);
          bodyBlock.appendChild(checksBlock);
          body.appendChild(secBlock);

          // ============================================================================
          // Unblock section — user mode only
          // Lifts an active block on the target. Queued for execution via the Start
          // button alongside the other action sections, rather than acting
          // immediately. Locked whenever the target has no active local block;
          // updateSectionStatus() drives the lock/unlock as the target changes or
          // the block is lifted.
          // ============================================================================
          const {
            section: secUnblock,
            sectionBody: bodyUnblock,
            enableChk: chkUnblock,
          } = makeSection("Unblock", "🔓", false);

          const { row: rowUnblockReason, field: fieldUnblockReason } =
            makeRow("Reason");
          const selUnblockReason = makeSelect(UNBLOCK_REASONS);
          const {
            wrap: filteredWrapUnblockReason,
            filter: filterUnblockReason,
          } = makeFilteredSelect(selUnblockReason);
          const inputUnblockReason = makeInput("Full reason to submit");
          const btnUnblockAppend = makeBtn("Append", "quiet");
          btnUnblockAppend.className += " tng-btn-sm";
          btnUnblockAppend.addEventListener("click", function () {
            const cur = inputUnblockReason.value;
            const add = selUnblockReason.value;
            if (!add) return;
            inputUnblockReason.value = cur ? cur + "; " + add : add;
            selUnblockReason.selectedIndex = 0;
            filterUnblockReason.value = "";
            filterUnblockReason.dispatchEvent(new Event("input"));
          });
          const reasonWrapUnblock = document.createElement("div");
          reasonWrapUnblock.className = "tng-reason-wrap";
          const reasonTopUnblock = document.createElement("div");
          reasonTopUnblock.className = "tng-reason-top";
          reasonTopUnblock.appendChild(filteredWrapUnblockReason);
          reasonTopUnblock.appendChild(btnUnblockAppend);
          reasonWrapUnblock.appendChild(reasonTopUnblock);
          reasonWrapUnblock.appendChild(inputUnblockReason);
          fieldUnblockReason.appendChild(reasonWrapUnblock);
          bodyUnblock.appendChild(rowUnblockReason);

          const { wrap: wrapNotifyUnblock, chk: chkNotifyUnblock } =
            makeCheckbox("Send unblock notification to user talk page", true);
          wrapNotifyUnblock.title =
            "When ticked, a notification will be posted to the target user's talk page after the block is lifted.";
          const checksUnblock = document.createElement("div");
          checksUnblock.className = "tng-checks";
          checksUnblock.style.paddingLeft = "0";
          checksUnblock.appendChild(wrapNotifyUnblock);
          bodyUnblock.appendChild(checksUnblock);

          body.appendChild(secUnblock);

          // Reversible lock for this section, driven solely by the target's live
          // block status. Tracked separately from the mode lock (applyModeLock)
          // and the permanent rights lock (lockSection) via its own set.
          const unblockStatusLocked = new Set();

          function applyUnblockStatusLock(locked, reason) {
            const arrow = secUnblock.querySelector(".tng-section-arrow");
            const hdr = secUnblock.querySelector(".tng-section-header");

            if (locked) {
              // If the section is already status-locked, only refresh the
              // displayed reason. Returning early without updating left the
              // tooltip stuck on whichever reason was passed in first (usually
              // "block status is still loading"), even after the real reason
              // had been resolved.
              if (unblockStatusLocked.has(chkUnblock)) {
                hdr.title = "Unavailable: " + reason;
                const existingBadge = hdr.querySelector(
                  ".tng-unblock-lock-badge",
                );
                if (existingBadge)
                  existingBadge.title = "Unavailable: " + reason;
                return;
              }

              unblockStatusLocked.add(chkUnblock);
              chkUnblock.checked = false;
              chkUnblock.disabled = true;
              secUnblock.classList.add("tng-disabled");
              bodyUnblock.classList.add("tng-hidden");

              if (arrow) arrow.classList.add("tng-hidden");

              hdr.title = "Unavailable: " + reason;
              const badge = document.createElement("span");
              badge.className = "tng-rights-lock tng-unblock-lock-badge";
              badge.textContent = "🔒";
              badge.title = "Unavailable: " + reason;
              hdr.appendChild(badge);
            } else {
              if (!unblockStatusLocked.has(chkUnblock)) return; // Not status-locked
              unblockStatusLocked.delete(chkUnblock);
              chkUnblock.disabled = false;
              secUnblock.classList.toggle("tng-disabled", !chkUnblock.checked);

              if (arrow) {
                arrow.classList.remove("tng-hidden");
                arrow.classList.toggle(
                  "tng-arrow-up",
                  !bodyUnblock.classList.contains("tng-hidden"),
                );
              }
              hdr.title = "";
              const badge = hdr.querySelector(".tng-unblock-lock-badge");
              if (badge) badge.remove();
            }
          }

          // ============================================================================
          // Warn section — user mode only
          // Sends a templated warning message to the target user's talk page.
          // ============================================================================
          const {
            section: secWarn,
            sectionBody: bodyWarn,
            enableChk: chkWarn,
          } = makeSection("User warning", "🔔", false);

          const { row: rowWarnMsg, field: fieldWarnMsg } = makeRow("Message");
          // Flatten the grouped WARN_MESSAGES structure into a single <select>
          // that uses <optgroup> labels for each group.
          const selWarnMsg = makeSelect(
            [{ value: "", label: "(Select a message)" }].concat(WARN_MESSAGES),
          );
          const { wrap: filteredWrapWarnMsg } = makeFilteredSelect(selWarnMsg);

          // Optional additional information text box
          const inputWarnExtra = makeInput("Additional information (optional)");

          const helpWarnExtra = document.createElement("div");
          helpWarnExtra.className = "tng-help";
          helpWarnExtra.textContent =
            "If filled in, this text will be appended to the warning message. Leave blank if not needed.";

          const reasonWrapWarn = document.createElement("div");
          reasonWrapWarn.className = "tng-reason-wrap";
          reasonWrapWarn.appendChild(filteredWrapWarnMsg);
          reasonWrapWarn.appendChild(inputWarnExtra);
          reasonWrapWarn.appendChild(helpWarnExtra);
          fieldWarnMsg.appendChild(reasonWrapWarn);
          bodyWarn.appendChild(rowWarnMsg);

          const { wrap: wrapWarnFinal, chk: chkWarnFinal } = makeCheckbox(
            "This is a final warning",
            false,
          );
          wrapWarnFinal.title =
            "When ticked, the message heading and body are adjusted to indicate that this is a final warning, and the recipient is notified that their account may be restricted from editing if the behaviour continues.";
          const checksWarn = document.createElement("div");
          checksWarn.className = "tng-checks";
          checksWarn.style.paddingLeft = "0";
          checksWarn.appendChild(wrapWarnFinal);
          bodyWarn.appendChild(checksWarn);

          body.appendChild(secWarn);

          // ============================================================================
          // Report to global sysops section — available in both user and page mode.
          // In user mode, lets a Tengu user without local admin rights file an
          // urgent cross-wiki report against an account on Meta-Wiki's Global
          // sysops/Requests page. In page mode, files an equivalent report
          // requesting urgent deletion of, or attention to, the target page.
          // Locked when the current wiki appears to be outside the scope of the
          // global sysops service, or when the page-mode target is a special
          // page; see applyGSStatusLock(), applySpecialPageLocks(), and
          // globalSysopsScopePromise above.
          // ============================================================================
          const {
            section: secGS,
            sectionBody: bodyGS,
            enableChk: chkGS,
          } = makeSection("Report to Global sysops/Requests", "🚩", false);

          const divGSStatus = document.createElement("div");
          divGSStatus.className = "tng-status-note tng-status-note-loading";
          divGSStatus.textContent =
            "Checking global sysops eligibility for this wiki...";
          bodyGS.appendChild(divGSStatus);

          // Account-report reasons (user mode) and page-report reasons (page
          // mode) are rendered into separate containers so the two reason
          // sets are never shown — or submitted — together. Only the
          // container matching the current mode is visible; applyModeRestrictions()
          // toggles visibility and clears both sets whenever the mode changes.
          const checksGSReasonsAccount = document.createElement("div");
          checksGSReasonsAccount.className =
            "tng-checks" + (tenguMode === "page" ? " tng-hidden" : "");
          checksGSReasonsAccount.style.paddingLeft = "0";
          const gsReasonChecksAccount = [];
          for (const r of GLOBAL_SYSOPS_REPORT_REASONS.ACCOUNT) {
            const { wrap: wrapGSReason, chk: chkGSReason } = makeCheckbox(
              r.label,
              false,
            );
            checksGSReasonsAccount.appendChild(wrapGSReason);
            gsReasonChecksAccount.push({ chk: chkGSReason, label: r.label });
          }
          bodyGS.appendChild(checksGSReasonsAccount);

          // Request type selector — page mode only; hidden in user mode.
          const { row: rowGSPageRequestType, field: fieldGSPageRequestType } =
            makeRow("Request type");
          rowGSPageRequestType.className =
            "tng-row" + (tenguMode === "page" ? "" : " tng-hidden");
          const selGSPageRequestType = makeSelect([
            { value: "delete", label: "Page deletion" },
            { value: "protect", label: "Page protection" },
            { value: "revdel", label: "Revision deletion" },
          ]);
          fieldGSPageRequestType.appendChild(wrapSelect(selGSPageRequestType));
          bodyGS.appendChild(rowGSPageRequestType);

          // Page deletion reasons
          const checksGSReasonsPageDelete = document.createElement("div");
          checksGSReasonsPageDelete.className =
            "tng-checks" + (tenguMode === "page" ? "" : " tng-hidden");
          checksGSReasonsPageDelete.style.paddingLeft = "0";
          const gsReasonChecksPageDelete = [];
          for (const r of GLOBAL_SYSOPS_REPORT_REASONS.PAGE_DELETE) {
            const { wrap: wrapGSReason, chk: chkGSReason } = makeCheckbox(
              r.label,
              false,
            );
            checksGSReasonsPageDelete.appendChild(wrapGSReason);
            gsReasonChecksPageDelete.push({ chk: chkGSReason, label: r.label });
          }
          bodyGS.appendChild(checksGSReasonsPageDelete);

          // Page protection reasons (hidden until the user selects "protect")
          const checksGSReasonsPageProtect = document.createElement("div");
          checksGSReasonsPageProtect.className = "tng-checks tng-hidden";
          checksGSReasonsPageProtect.style.paddingLeft = "0";
          const gsReasonChecksPageProtect = [];
          for (const r of GLOBAL_SYSOPS_REPORT_REASONS.PAGE_PROTECT) {
            const { wrap: wrapGSReason, chk: chkGSReason } = makeCheckbox(
              r.label,
              false,
            );
            checksGSReasonsPageProtect.appendChild(wrapGSReason);
            gsReasonChecksPageProtect.push({
              chk: chkGSReason,
              label: r.label,
            });
          }
          bodyGS.appendChild(checksGSReasonsPageProtect);

          // Revision deletion reasons (hidden until the user selects "revdel")
          const checksGSReasonsPageRevdel = document.createElement("div");
          checksGSReasonsPageRevdel.className = "tng-checks tng-hidden";
          checksGSReasonsPageRevdel.style.paddingLeft = "0";
          const gsReasonChecksPageRevdel = [];
          for (const r of GLOBAL_SYSOPS_REPORT_REASONS.PAGE_REVDEL) {
            const { wrap: wrapGSReason, chk: chkGSReason } = makeCheckbox(
              r.label,
              false,
            );
            checksGSReasonsPageRevdel.appendChild(wrapGSReason);
            gsReasonChecksPageRevdel.push({ chk: chkGSReason, label: r.label });
          }
          bodyGS.appendChild(checksGSReasonsPageRevdel);

          // Shows only the reason container matching the selected request type.
          function updateGSPageReasonSet() {
            const type = selGSPageRequestType.value;
            checksGSReasonsPageDelete.classList.toggle(
              "tng-hidden",
              type !== "delete",
            );
            checksGSReasonsPageProtect.classList.toggle(
              "tng-hidden",
              type !== "protect",
            );
            checksGSReasonsPageRevdel.classList.toggle(
              "tng-hidden",
              type !== "revdel",
            );
          }
          selGSPageRequestType.addEventListener("change", function () {
            // Clear all page reason checkboxes when the type changes.
            [
              ...gsReasonChecksPageDelete,
              ...gsReasonChecksPageProtect,
              ...gsReasonChecksPageRevdel,
            ].forEach(function (c) {
              c.chk.checked = false;
            });
            updateGSPageReasonSet();
          });

          // Returns the reason-checkbox set matching the current mode and,
          // in page mode, the selected request type. Used by validation and
          // report-building logic so neither needs to repeat the mode/type
          // check inline.
          function activeGSReasonChecks() {
            if (tenguMode !== "page") return gsReasonChecksAccount;
            const type = selGSPageRequestType.value;
            if (type === "protect") return gsReasonChecksPageProtect;
            if (type === "revdel") return gsReasonChecksPageRevdel;
            return gsReasonChecksPageDelete;
          }

          const { row: rowGSDetails, field: fieldGSDetails } =
            makeRow("Additional details");
          const inputGSDetails = makeInput("Diffs or further context");
          fieldGSDetails.appendChild(inputGSDetails);
          bodyGS.appendChild(rowGSDetails);

          const helpGSDetails = document.createElement("div");
          helpGSDetails.className = "tng-help";
          helpGSDetails.textContent =
            "Submitted directly to Meta-Wiki's Global sysops/Requests page. Select at least one reason above, or add details here.";
          bodyGS.appendChild(helpGSDetails);

          body.appendChild(secGS);

          // Reversible lock for this section, driven by whether the current wiki
          // appears to be within the scope of the global sysops service. Tracked
          // separately from the mode lock (applyModeLock) via its own set,
          // mirroring the pattern used by applyUnblockStatusLock().
          const gsStatusLocked = new Set();
          function applyGSStatusLock(locked, reason) {
            const arrow = secGS.querySelector(".tng-section-arrow");
            const hdr = secGS.querySelector(".tng-section-header");

            if (locked) {
              if (gsStatusLocked.has(chkGS)) {
                hdr.title = "Unavailable: " + reason;
                const existingBadge = hdr.querySelector(".tng-gs-lock-badge");
                if (existingBadge)
                  existingBadge.title = "Unavailable: " + reason;
                return;
              }
              gsStatusLocked.add(chkGS);
              chkGS.checked = false;
              chkGS.disabled = true;
              secGS.classList.add("tng-disabled");
              bodyGS.classList.add("tng-hidden");
              if (arrow) arrow.classList.add("tng-hidden");
              hdr.title = "Unavailable: " + reason;
              const badge = document.createElement("span");
              badge.className = "tng-rights-lock tng-gs-lock-badge";
              badge.textContent = "🔒";
              badge.title = "Unavailable: " + reason;
              hdr.appendChild(badge);
            } else {
              if (!gsStatusLocked.has(chkGS)) return;
              gsStatusLocked.delete(chkGS);
              chkGS.disabled = false;
              secGS.classList.toggle("tng-disabled", !chkGS.checked);
              if (arrow) {
                arrow.classList.remove("tng-hidden");
                arrow.classList.toggle(
                  "tng-arrow-up",
                  !bodyGS.classList.contains("tng-hidden"),
                );
              }
              hdr.title = "";
              const badge = hdr.querySelector(".tng-gs-lock-badge");
              if (badge) badge.remove();
            }
          }
          applyGSStatusLock(
            true,
            "checking global sysops eligibility for this wiki",
          );

          // Re-evaluates the section's lock state once eligibility is known.
          globalSysopsScopePromise.then(function (info) {
            gsScopeInfo = info;
            updateSectionStatus();
          });

          // ============================================================================
          // Report to Steward requests/Global section — user mode only.
          // Files a report on Meta-Wiki's Steward requests/Global (SRG) page:
          // a global block request when the target is an IP address, or a
          // global lock request when the target is a registered account.
          // Locked in page mode via applyModeLock(), since both report types
          // require a user or IP target rather than a page.
          // ============================================================================
          const {
            section: secSRG,
            sectionBody: bodySRG,
            enableChk: chkSRG,
          } = makeSection("Report to Steward requests/Global", "📌", false);

          const divSRGStatus = document.createElement("div");
          divSRGStatus.className = "tng-status-note tng-status-note-inactive";
          divSRGStatus.textContent =
            "Enter a target to see whether this will file as a global block or a global lock request.";
          bodySRG.appendChild(divSRGStatus);

          // Block-report reasons (IP targets) and lock-report reasons
          // (registered account targets) are rendered into separate
          // containers, mirroring the account/page split used by the Report
          // to global sysops section. Only the container matching the
          // current target type is shown; updateSRGFormForTarget() toggles
          // visibility whenever the target changes.
          const checksSRGReasonsBlock = document.createElement("div");
          checksSRGReasonsBlock.className = "tng-checks";
          checksSRGReasonsBlock.style.paddingLeft = "0";
          const srgReasonChecksBlock = [];
          for (const r of SRG_REPORT_REASONS.BLOCK) {
            const { wrap: wrapSRGReason, chk: chkSRGReason } = makeCheckbox(
              r.label,
              false,
            );
            checksSRGReasonsBlock.appendChild(wrapSRGReason);
            srgReasonChecksBlock.push({ chk: chkSRGReason, label: r.label });
          }
          bodySRG.appendChild(checksSRGReasonsBlock);

          const checksSRGReasonsLock = document.createElement("div");
          checksSRGReasonsLock.className = "tng-checks tng-hidden";
          checksSRGReasonsLock.style.paddingLeft = "0";
          const srgReasonChecksLock = [];
          for (const r of SRG_REPORT_REASONS.LOCK) {
            const { wrap: wrapSRGReason, chk: chkSRGReason } = makeCheckbox(
              r.label,
              false,
            );
            checksSRGReasonsLock.appendChild(wrapSRGReason);
            srgReasonChecksLock.push({ chk: chkSRGReason, label: r.label });
          }
          bodySRG.appendChild(checksSRGReasonsLock);

          // "Also request the username be hidden" — lock requests only.
          // Corresponds to a combined "lock and hide" steward action,
          // typically used for policy-violating or offensive usernames.
          const { wrap: wrapSRGHideUsername, chk: chkSRGHideUsername } =
            makeCheckbox(
              "Also request the username be hidden (lock and hide)",
              false,
            );
          wrapSRGHideUsername.title =
            "Only applicable to global lock requests for registered accounts.";
          const checksSRGOptions = document.createElement("div");
          checksSRGOptions.className = "tng-checks tng-hidden";
          checksSRGOptions.style.paddingLeft = "0";
          checksSRGOptions.appendChild(wrapSRGHideUsername);
          bodySRG.appendChild(checksSRGOptions);

          // Returns true when the current target is an IP address or a
          // temporary account — i.e. when this section will file a global
          // block request rather than a global lock request.
          // Temporary accounts (pattern ~YYYY-...) cannot be globally locked
          // and must be reported as global block requests instead.
          function isSRGBlockTarget() {
            const target = inputTarget.value.trim();
            return (
              mw.util.isIPAddress(target) || /^~\d{4}-\d+-\d+$/.test(target)
            );
          }

          // Returns the reason-checkbox set matching the current target
          // type, so validation and report-building logic do not need to
          // repeat the IP check inline.
          function activeSRGReasonChecks() {
            return isSRGBlockTarget()
              ? srgReasonChecksBlock
              : srgReasonChecksLock;
          }

          // Switches the visible reason set, the "Hide username" option,
          // and the status note whenever the target changes between an IP
          // address and a registered account.
          function updateSRGFormForTarget() {
            const isBlock = isSRGBlockTarget();
            checksSRGReasonsBlock.classList.toggle("tng-hidden", !isBlock);
            checksSRGReasonsLock.classList.toggle("tng-hidden", isBlock);
            checksSRGOptions.classList.toggle("tng-hidden", isBlock);
            if (isBlock) chkSRGHideUsername.checked = false;
            divSRGStatus.textContent = isBlock
              ? "This will be filed as a global block request, since the target is an IP address or temporary account."
              : "This will be filed as a global lock request, since the target is a registered account.";
          }

          const { row: rowSRGDetails, field: fieldSRGDetails } =
            makeRow("Additional details");
          const inputSRGDetails = makeInput("Diffs or further context");
          fieldSRGDetails.appendChild(inputSRGDetails);
          bodySRG.appendChild(rowSRGDetails);

          const helpSRGDetails = document.createElement("div");
          helpSRGDetails.className = "tng-help";
          helpSRGDetails.textContent =
            "Submitted directly to Meta-Wiki's Steward requests/Global page. Select at least one reason above, or add details here.";
          bodySRG.appendChild(helpSRGDetails);

          body.appendChild(secSRG);

          const {
            section: secPagedel,
            sectionBody: bodyPagedel,
            enableChk: chkPagedel,
          } = makeSection("Page deletion", "🗑️", false);

          // Page deletion status note — populated by updateSectionStatus() when the target changes
          const divPagedelStatus = document.createElement("div");
          divPagedelStatus.className =
            "tng-status-note tng-status-note-loading";
          divPagedelStatus.textContent =
            "Enter a target to see deletion history.";
          bodyPagedel.appendChild(divPagedelStatus);

          const { row: rowPagedelReason, field: fieldPagedelReason } =
            makeRow("Reason");
          const selPagedelReason = makeSelect(PAGE_DELETE_REASONS);
          const {
            wrap: filteredWrapPagedelReason,
            filter: filterPagedelReason,
          } = makeFilteredSelect(selPagedelReason);
          const inputPagedelReason = makeInput("Full reason to submit");
          const btnPagedelAppend = makeBtn("Append", "quiet");
          btnPagedelAppend.className += " tng-btn-sm";
          btnPagedelAppend.addEventListener("click", function () {
            const cur = inputPagedelReason.value;
            const add = selPagedelReason.value;
            if (!add) return;
            inputPagedelReason.value = cur ? cur + "; " + add : add;
            selPagedelReason.selectedIndex = 0;
            filterPagedelReason.value = "";
            filterPagedelReason.dispatchEvent(new Event("input"));
          });
          const reasonWrapPagedel = document.createElement("div");
          reasonWrapPagedel.className = "tng-reason-wrap";
          const reasonTopPagedel = document.createElement("div");
          reasonTopPagedel.className = "tng-reason-top";
          reasonTopPagedel.appendChild(filteredWrapPagedelReason);
          reasonTopPagedel.appendChild(btnPagedelAppend);
          reasonWrapPagedel.appendChild(reasonTopPagedel);
          reasonWrapPagedel.appendChild(inputPagedelReason);
          fieldPagedelReason.appendChild(reasonWrapPagedel);
          bodyPagedel.appendChild(rowPagedelReason);

          // 'Also delete the talk page' option
          const { wrap: wrapPagedelTalk, chk: chkPagedelTalk } = makeCheckbox(
            "Also delete the talk page",
            false,
          );
          wrapPagedelTalk.title =
            "When ticked, the talk page of each deleted page will also be deleted if it exists, including subpages when 'Delete subpages of deleted page' is enabled. Pages that are already talk pages are skipped.";
          const checksPagedel = document.createElement("div");
          checksPagedel.className = "tng-checks";
          checksPagedel.style.paddingLeft = "0";
          checksPagedel.appendChild(wrapPagedelTalk);
          // 'Delete redirects to deleted page' option
          const { wrap: wrapPagedelRedirects, chk: chkPagedelRedirects } =
            makeCheckbox("Delete redirects to deleted page", true);
          wrapPagedelRedirects.title =
            "When ticked, all redirects pointing to each deleted page are also deleted, including subpages when 'Delete subpages of deleted page' is enabled. Redirects to a non-existent target serve no purpose and are removed automatically.";
          checksPagedel.appendChild(wrapPagedelRedirects);

          // 'Delete subpages of deleted page' option
          const { wrap: wrapPagedelSubpages, chk: chkPagedelSubpages } =
            makeCheckbox("Delete subpages of deleted page", true);
          wrapPagedelSubpages.title =
            "When ticked, all subpages of each deleted page are also deleted. Only applies to namespaces that support subpages.";
          checksPagedel.appendChild(wrapPagedelSubpages);
          const { wrap: wrapPagedelUnlink, chk: chkPagedelUnlink } =
            makeCheckbox(
              "Remove links to deleted page (article namespace only)",
              false,
            );
          wrapPagedelUnlink.title =
            "When ticked, wikilinks pointing to each deleted page are removed from articles in the main namespace. Talk pages, user pages, and other namespaces are not modified.";
          checksPagedel.appendChild(wrapPagedelUnlink);
          const { wrap: wrapNotifyDelete, chk: chkNotifyDelete } = makeCheckbox(
            "Send deletion notification to page creator's talk page",
            true,
          );
          wrapNotifyDelete.title =
            "When ticked, a notification will be posted to the talk page of the page creator after a successful deletion. Not sent when the page creator and the deleting user are the same person.";
          checksPagedel.appendChild(wrapNotifyDelete);

          // 'Protect from recreation after deletion' — inline row; dropdowns are
          // always visible but disabled until the checkbox is ticked.
          const {
            wrap: wrapPagedelProtectRecreation,
            chk: chkPagedelProtectRecreation,
          } = makeCheckbox("Protect from recreation after deletion", false);
          wrapPagedelProtectRecreation.title =
            "When ticked, each successfully deleted page will be protected against recreation using create-level protection. Only applies to non-existent pages.";

          const selPagedelProtectRecreationLevel = makeSelect([
            { value: "autoconfirmed", label: "Autoconfirmed users" },
            { value: "sysop", label: "Administrators only" },
          ]);
          selPagedelProtectRecreationLevel.value = "sysop";
          selPagedelProtectRecreationLevel.disabled = true;

          const selPagedelProtectRecreationExpiry = makeSelect([
            { value: "1 day", label: "1 day" },
            { value: "3 days", label: "3 days" },
            { value: "1 week", label: "1 week" },
            { value: "2 weeks", label: "2 weeks" },
            { value: "1 month", label: "1 month" },
            { value: "3 months", label: "3 months" },
            { value: "6 months", label: "6 months" },
            { value: "1 year", label: "1 year" },
            { value: "never", label: "Indefinite" },
            { value: "other", label: "Other:" },
          ]);
          selPagedelProtectRecreationExpiry.disabled = true;
          const inputPagedelProtectRecreationExpiry = makeInput(
            "e.g. 6 months, 2099-01-01",
          );
          inputPagedelProtectRecreationExpiry.classList.add("tng-hidden");
          inputPagedelProtectRecreationExpiry.disabled = true;
          selPagedelProtectRecreationExpiry.addEventListener(
            "change",
            function () {
              inputPagedelProtectRecreationExpiry.classList.toggle(
                "tng-hidden",
                selPagedelProtectRecreationExpiry.value !== "other",
              );
            },
          );

          // Expiry group: dropdown + optional custom input, side by side.
          const recreationExpiryGroup = document.createElement("div");
          recreationExpiryGroup.style.cssText =
            "display: flex; gap: 6px; flex: 1; min-width: 0;";
          inputPagedelProtectRecreationExpiry.style.flex = "1";
          recreationExpiryGroup.appendChild(
            wrapSelect(selPagedelProtectRecreationExpiry, "1"),
          );
          recreationExpiryGroup.appendChild(
            inputPagedelProtectRecreationExpiry,
          );

          // Recreation protection group: checkbox + level and expiry rows,
          // enclosed in a single border to signal they form one set.
          const wrapRecreationGroup = document.createElement("div");
          wrapRecreationGroup.className = "tng-recreation-group";
          wrapRecreationGroup.appendChild(wrapPagedelProtectRecreation);

          const { row: rowRecreationLevel, field: fieldRecreationLevel } =
            makeRow("Protection level");
          fieldRecreationLevel.appendChild(
            wrapSelect(selPagedelProtectRecreationLevel, "1"),
          );
          rowRecreationLevel.style.opacity = "0.5";
          wrapRecreationGroup.appendChild(rowRecreationLevel);

          const { row: rowRecreationExpiry, field: fieldRecreationExpiry } =
            makeRow("Expiry");
          fieldRecreationExpiry.appendChild(recreationExpiryGroup);
          rowRecreationExpiry.style.opacity = "0.5";
          wrapRecreationGroup.appendChild(rowRecreationExpiry);

          // Reason for protecting the deleted page against recreation
          const { row: rowRecreationReason, field: fieldRecreationReason } =
            makeRow("Reason");
          const selPagedelProtectRecreationReason = makeSelect(
            PROTECT_RECREATION_REASONS,
          );
          selPagedelProtectRecreationReason.disabled = true;
          const {
            wrap: filteredWrapPagedelProtectRecreationReason,
            filter: filterPagedelProtectRecreationReason,
          } = makeFilteredSelect(selPagedelProtectRecreationReason);
          const inputPagedelProtectRecreationReason = makeInput(
            "Full reason to submit",
          );
          inputPagedelProtectRecreationReason.disabled = true;
          const btnPagedelProtectRecreationReasonAppend = makeBtn(
            "Append",
            "quiet",
          );
          btnPagedelProtectRecreationReasonAppend.className += " tng-btn-sm";
          btnPagedelProtectRecreationReasonAppend.addEventListener(
            "click",
            function () {
              const cur = inputPagedelProtectRecreationReason.value;
              const add = selPagedelProtectRecreationReason.value;
              if (!add) return;
              inputPagedelProtectRecreationReason.value = cur
                ? cur + "; " + add
                : add;
              selPagedelProtectRecreationReason.selectedIndex = 0;
              filterPagedelProtectRecreationReason.value = "";
              filterPagedelProtectRecreationReason.dispatchEvent(
                new Event("input"),
              );
            },
          );
          const reasonWrapPagedelProtectRecreation =
            document.createElement("div");
          reasonWrapPagedelProtectRecreation.className = "tng-reason-wrap";
          const reasonTopPagedelProtectRecreation =
            document.createElement("div");
          reasonTopPagedelProtectRecreation.className = "tng-reason-top";
          reasonTopPagedelProtectRecreation.appendChild(
            filteredWrapPagedelProtectRecreationReason,
          );
          reasonTopPagedelProtectRecreation.appendChild(
            btnPagedelProtectRecreationReasonAppend,
          );
          reasonWrapPagedelProtectRecreation.appendChild(
            reasonTopPagedelProtectRecreation,
          );
          reasonWrapPagedelProtectRecreation.appendChild(
            inputPagedelProtectRecreationReason,
          );
          fieldRecreationReason.appendChild(reasonWrapPagedelProtectRecreation);
          rowRecreationReason.style.opacity = "0.5";
          wrapRecreationGroup.appendChild(rowRecreationReason);

          chkPagedelProtectRecreation.addEventListener("change", function () {
            const enabled = chkPagedelProtectRecreation.checked;
            selPagedelProtectRecreationLevel.disabled = !enabled;
            selPagedelProtectRecreationExpiry.disabled = !enabled;
            inputPagedelProtectRecreationExpiry.disabled = !enabled;
            selPagedelProtectRecreationReason.disabled = !enabled;
            inputPagedelProtectRecreationReason.disabled = !enabled;
            rowRecreationLevel.style.opacity = enabled ? "" : "0.5";
            rowRecreationExpiry.style.opacity = enabled ? "" : "0.5";
            rowRecreationReason.style.opacity = enabled ? "" : "0.5";
          });

          checksPagedel.appendChild(wrapRecreationGroup);
          bodyPagedel.appendChild(checksPagedel);
          body.appendChild(secPagedel);

          // Page undeletion module — restores a previously deleted page.
          // Page mode only. Disabled at construction time; only enabled once
          // updateSectionStatus() confirms the target page has previous
          // deletion log entries and the user holds the undelete right.
          const {
            section: secUndelete,
            sectionBody: bodyUndelete,
            enableChk: chkUndelete,
          } = makeSection("Page undeletion", "📤", false);

          const hdrUndelete = secUndelete.querySelector(".tng-section-header");

          // Page undeletion status note — populated by updateSectionStatus() when the target changes
          const divUndeleteStatus = document.createElement("div");
          divUndeleteStatus.className =
            "tng-status-note tng-status-note-loading";
          divUndeleteStatus.textContent =
            "Enter a target to see deletion history.";
          bodyUndelete.appendChild(divUndeleteStatus);

          const { row: rowUndeleteReason, field: fieldUndeleteReason } =
            makeRow("Reason");
          const selUndeleteReason = makeSelect(UNDELETE_REASONS);
          const {
            wrap: filteredWrapUndeleteReason,
            filter: filterUndeleteReason,
          } = makeFilteredSelect(selUndeleteReason);
          const inputUndeleteReason = makeInput("Full reason to submit");
          const btnUndeleteAppend = makeBtn("Append", "quiet");
          btnUndeleteAppend.className += " tng-btn-sm";
          btnUndeleteAppend.addEventListener("click", function () {
            const cur = inputUndeleteReason.value;
            const add = selUndeleteReason.value;
            if (!add) return;
            inputUndeleteReason.value = cur ? cur + "; " + add : add;
            selUndeleteReason.selectedIndex = 0;
            filterUndeleteReason.value = "";
            filterUndeleteReason.dispatchEvent(new Event("input"));
          });
          const reasonWrapUndelete = document.createElement("div");
          reasonWrapUndelete.className = "tng-reason-wrap";
          const reasonTopUndelete = document.createElement("div");
          reasonTopUndelete.className = "tng-reason-top";
          reasonTopUndelete.appendChild(filteredWrapUndeleteReason);
          reasonTopUndelete.appendChild(btnUndeleteAppend);
          reasonWrapUndelete.appendChild(reasonTopUndelete);
          reasonWrapUndelete.appendChild(inputUndeleteReason);
          fieldUndeleteReason.appendChild(reasonWrapUndelete);
          bodyUndelete.appendChild(rowUndeleteReason);

          // Reversible lock for this section, driven by the target's deletion
          // history and the current mode. Tracked separately from the
          // permanent rights lock (lockSection) via its own set, mirroring
          // the pattern used by applyUnblockStatusLock().
          const undeleteStatusLocked = new Set();
          function applyUndeleteStatusLock(locked, reason) {
            const arrow = secUndelete.querySelector(".tng-section-arrow");

            if (locked) {
              if (undeleteStatusLocked.has(chkUndelete)) {
                hdrUndelete.title = "Unavailable: " + reason;
                const existingBadge = hdrUndelete.querySelector(
                  ".tng-undelete-lock-badge",
                );
                if (existingBadge)
                  existingBadge.title = "Unavailable: " + reason;
                return;
              }
              undeleteStatusLocked.add(chkUndelete);
              chkUndelete.checked = false;
              chkUndelete.disabled = true;
              secUndelete.classList.add("tng-disabled");
              bodyUndelete.classList.add("tng-hidden");
              if (arrow) arrow.classList.add("tng-hidden");
              hdrUndelete.title = "Unavailable: " + reason;
              const badge = document.createElement("span");
              badge.className = "tng-rights-lock tng-undelete-lock-badge";
              badge.textContent = "🔒";
              badge.title = "Unavailable: " + reason;
              hdrUndelete.appendChild(badge);
            } else {
              if (!undeleteStatusLocked.has(chkUndelete)) return;
              undeleteStatusLocked.delete(chkUndelete);
              chkUndelete.disabled = false;
              secUndelete.classList.toggle(
                "tng-disabled",
                !chkUndelete.checked,
              );
              if (arrow) {
                arrow.classList.remove("tng-hidden");
                arrow.classList.toggle(
                  "tng-arrow-up",
                  !bodyUndelete.classList.contains("tng-hidden"),
                );
              }
              hdrUndelete.title = "";
              const badge = hdrUndelete.querySelector(
                ".tng-undelete-lock-badge",
              );
              if (badge) badge.remove();
            }
          }
          applyUndeleteStatusLock(true, "no target has been specified.");

          body.appendChild(secUndelete);

          // ============================================================================
          // Move page section — page mode only.
          // Supports two sub-modes:
          //   • Move page — moves the target to an arbitrary destination title,
          //     using action=move with native movetalk/movesubpages flags.
          //   • Move to user's sandbox — moves the target into a specified user's
          //     subpage (e.g. User:[username]/[subpage]).
          // Suppressing the redirect in either mode requires the suppressredirect right.
          // ============================================================================
          const {
            section: secMoveSandbox,
            sectionBody: bodyMoveSandbox,
            enableChk: chkMoveSandbox,
          } = makeSection("Move page", "✂️", false);

          // --- Move mode selector ---
          const { row: rowMoveMode, field: fieldMoveMode } =
            makeRow("Move mode");
          const selMoveMode = makeSelect([
            { value: "sandbox", label: "Move to user's sandbox" },
            { value: "movepage", label: "Move page" },
          ]);
          fieldMoveMode.appendChild(wrapSelect(selMoveMode));
          bodyMoveSandbox.appendChild(rowMoveMode);

          // --- Move page panel ---
          const divMovePagePanel = document.createElement("div");
          divMovePagePanel.className = "tng-hidden";
          divMovePagePanel.style.cssText =
            "display:flex;flex-direction:column;gap:10px;";

          const { row: rowMovePageDest, field: fieldMovePageDest } =
            makeRow("Destination title");
          const inputMovePageDest = makeInput(
            "New page title (including namespace prefix if needed)",
          );
          fieldMovePageDest.appendChild(inputMovePageDest);
          divMovePagePanel.appendChild(rowMovePageDest);

          const { row: rowMovePageReason, field: fieldMovePageReason } =
            makeRow("Reason");
          const selMovePageReason = makeSelect(MOVE_REASONS);
          const {
            wrap: filteredWrapMovePageReason,
            filter: filterMovePageReason,
          } = makeFilteredSelect(selMovePageReason);
          const inputMovePageReason = makeInput("Full reason to submit");
          const btnMovePageAppend = makeBtn("Append", "quiet");
          btnMovePageAppend.className += " tng-btn-sm";
          btnMovePageAppend.addEventListener("click", function () {
            const cur = inputMovePageReason.value;
            const add = selMovePageReason.value;
            if (!add) return;
            inputMovePageReason.value = cur ? cur + "; " + add : add;
            selMovePageReason.selectedIndex = 0;
            filterMovePageReason.value = "";
            filterMovePageReason.dispatchEvent(new Event("input"));
          });
          const reasonWrapMovePage = document.createElement("div");
          reasonWrapMovePage.className = "tng-reason-wrap";
          const reasonTopMovePage = document.createElement("div");
          reasonTopMovePage.className = "tng-reason-top";
          reasonTopMovePage.appendChild(filteredWrapMovePageReason);
          reasonTopMovePage.appendChild(btnMovePageAppend);
          reasonWrapMovePage.appendChild(reasonTopMovePage);
          reasonWrapMovePage.appendChild(inputMovePageReason);
          fieldMovePageReason.appendChild(reasonWrapMovePage);
          divMovePagePanel.appendChild(rowMovePageReason);

          const { wrap: wrapMovePageNoRedirect, chk: chkMovePageNoRedirect } =
            makeCheckbox(
              "Suppress redirect (requires the suppressredirect right)",
              false,
            );
          wrapMovePageNoRedirect.title =
            "When ticked, no redirect is left at the original title after the move. Only available to sysops, who hold the suppressredirect right. Non-sysop users cannot use this option.";
          chkMovePageNoRedirect.disabled = true;
          wrapMovePageNoRedirect.style.opacity = "0.5";
          wrapMovePageNoRedirect.style.cursor = "not-allowed";

          const { wrap: wrapMovePageTalk, chk: chkMovePageTalk } = makeCheckbox(
            "Also move the associated talk page",
            true,
          );
          wrapMovePageTalk.title =
            "When ticked, the associated talk page is also moved to the equivalent title under the destination namespace.";

          const { wrap: wrapMovePageSubpages, chk: chkMovePageSubpages } =
            makeCheckbox("Also move all subpages", false);
          wrapMovePageSubpages.title =
            "When ticked, all subpages of the source page are also moved to the corresponding subpages of the destination title. Only applies to namespaces that support subpages.";

          const checksMovePagePanel = document.createElement("div");
          checksMovePagePanel.className = "tng-checks";
          checksMovePagePanel.style.paddingLeft = "0";
          checksMovePagePanel.appendChild(wrapMovePageNoRedirect);
          checksMovePagePanel.appendChild(wrapMovePageTalk);
          checksMovePagePanel.appendChild(wrapMovePageSubpages);
          divMovePagePanel.appendChild(checksMovePagePanel);

          bodyMoveSandbox.appendChild(divMovePagePanel);

          // --- Move to user's sandbox panel ---
          const divMoveSandboxPanel = document.createElement("div");
          divMoveSandboxPanel.style.cssText =
            "display:flex;flex-direction:column;gap:10px;";

          const { row: rowMoveSandboxUser, field: fieldMoveSandboxUser } =
            makeRow("Move to user");

          // Stack the username input and the same-as-creator option vertically.
          const moveSandboxUserGroup = document.createElement("div");
          moveSandboxUserGroup.style.cssText =
            "display:flex;flex-direction:column;gap:4px;width:100%;";
          const inputMoveSandboxUser = makeInput("Username");
          moveSandboxUserGroup.appendChild(inputMoveSandboxUser);

          const {
            wrap: wrapMoveSandboxSameAsCreator,
            chk: chkMoveSandboxSameAsCreator,
          } = makeCheckbox("Same as page creator", false);
          wrapMoveSandboxSameAsCreator.title =
            "When ticked, the username field is automatically populated with the page creator's username. The target page must be set before ticking this option.";
          moveSandboxUserGroup.appendChild(wrapMoveSandboxSameAsCreator);

          fieldMoveSandboxUser.appendChild(moveSandboxUserGroup);
          divMoveSandboxPanel.appendChild(rowMoveSandboxUser);

          // Fetches the first revision's author for the current target page and
          // populates the username field. Only applies the result when the checkbox
          // is still ticked at the time the API response arrives, so a fast
          // user interaction (tick → untick before the response returns) does not
          // overwrite a manually entered username.
          async function fetchAndApplyPageCreator() {
            const target = inputTarget.value.trim();
            if (!target) {
              chkMoveSandboxSameAsCreator.checked = false;
              inputMoveSandboxUser.disabled = false;
              return;
            }
            try {
              const data = await apiGet({
                action: "query",
                prop: "revisions",
                titles: target,
                rvdir: "newer",
                rvlimit: 1,
                rvprop: "user",
                formatversion: 2,
              });
              if (!chkMoveSandboxSameAsCreator.checked) return;
              const page =
                data.query && data.query.pages && data.query.pages[0];
              const creator =
                (page &&
                  !page.missing &&
                  page.revisions &&
                  page.revisions[0] &&
                  page.revisions[0].user) ||
                null;
              if (creator) {
                inputMoveSandboxUser.value = creator;
              } else {
                chkMoveSandboxSameAsCreator.checked = false;
                inputMoveSandboxUser.disabled = false;
              }
            } catch (e) {
              chkMoveSandboxSameAsCreator.checked = false;
              inputMoveSandboxUser.disabled = false;
            }
          }

          chkMoveSandboxSameAsCreator.addEventListener("change", function () {
            if (chkMoveSandboxSameAsCreator.checked) {
              inputMoveSandboxUser.disabled = true;
              fetchAndApplyPageCreator();
            } else {
              inputMoveSandboxUser.disabled = false;
              inputMoveSandboxUser.value = "";
            }
          });

          const { row: rowMoveSandboxSubpage, field: fieldMoveSandboxSubpage } =
            makeRow("Subpage name");
          const inputMoveSandboxSubpage = makeInput(
            "Subpage (e.g. Draft article)",
          );
          fieldMoveSandboxSubpage.appendChild(inputMoveSandboxSubpage);
          divMoveSandboxPanel.appendChild(rowMoveSandboxSubpage);

          const helpMoveSandbox = document.createElement("div");
          helpMoveSandbox.className = "tng-help";
          helpMoveSandbox.textContent =
            'The page will be moved to "User:[username]/[subpage name]". When "Also move the talk page" is ticked, the talk page is moved to "User talk:[username]/[subpage name]", and the talk page of each subpage is moved if "Also move all subpages" is also ticked. Suppressing the redirect requires the suppressredirect right (sysops only).';
          divMoveSandboxPanel.appendChild(helpMoveSandbox);

          const { row: rowMoveSandboxReason, field: fieldMoveSandboxReason } =
            makeRow("Reason");
          const selMoveSandboxReason = makeSelect(MOVE_TO_SANDBOX_REASONS);
          const {
            wrap: filteredWrapMoveSandboxReason,
            filter: filterMoveSandboxReason,
          } = makeFilteredSelect(selMoveSandboxReason);
          const inputMoveSandboxReason = makeInput("Full reason to submit");
          const btnMoveSandboxAppend = makeBtn("Append", "quiet");
          btnMoveSandboxAppend.className += " tng-btn-sm";
          btnMoveSandboxAppend.addEventListener("click", function () {
            const cur = inputMoveSandboxReason.value;
            const add = selMoveSandboxReason.value;
            if (!add) return;
            inputMoveSandboxReason.value = cur ? cur + "; " + add : add;
            selMoveSandboxReason.selectedIndex = 0;
            filterMoveSandboxReason.value = "";
            filterMoveSandboxReason.dispatchEvent(new Event("input"));
          });
          const reasonWrapMoveSandbox = document.createElement("div");
          reasonWrapMoveSandbox.className = "tng-reason-wrap";
          const reasonTopMoveSandbox = document.createElement("div");
          reasonTopMoveSandbox.className = "tng-reason-top";
          reasonTopMoveSandbox.appendChild(filteredWrapMoveSandboxReason);
          reasonTopMoveSandbox.appendChild(btnMoveSandboxAppend);
          reasonWrapMoveSandbox.appendChild(reasonTopMoveSandbox);
          reasonWrapMoveSandbox.appendChild(inputMoveSandboxReason);
          fieldMoveSandboxReason.appendChild(reasonWrapMoveSandbox);
          divMoveSandboxPanel.appendChild(rowMoveSandboxReason);

          const {
            wrap: wrapMoveSandboxNoRedirect,
            chk: chkMoveSandboxNoRedirect,
          } = makeCheckbox(
            "Suppress redirect (requires the suppressredirect right)",
            false,
          );
          wrapMoveSandboxNoRedirect.title =
            "When ticked, no redirect is left at the original title after the move. Only available to sysops, who hold the suppressredirect right. Non-sysop users cannot use this option.";
          // Disabled by default; enabled by rightsPromise when the suppressredirect right is confirmed.
          chkMoveSandboxNoRedirect.disabled = true;
          wrapMoveSandboxNoRedirect.style.opacity = "0.5";
          wrapMoveSandboxNoRedirect.style.cursor = "not-allowed";

          const { wrap: wrapMoveSandboxTalk, chk: chkMoveSandboxTalk } =
            makeCheckbox("Also move the talk page", false);
          wrapMoveSandboxTalk.title =
            "When ticked, the talk page associated with the target page will also be moved to the corresponding talk page of the destination (e.g. User talk:[username]/[subpage name]). Automatically disabled when the target is itself a talk page or has no associated talk page.";

          const { wrap: wrapMoveSandboxSubpages, chk: chkMoveSandboxSubpages } =
            makeCheckbox("Also move all subpages", false);
          wrapMoveSandboxSubpages.title =
            "When ticked, all subpages of the target page are also moved to the corresponding subpages of the destination. If 'Also move the talk page' is ticked, the talk page of each subpage is moved as well. Only applies to namespaces that support subpages.";

          const checksMoveSandbox = document.createElement("div");
          checksMoveSandbox.className = "tng-checks";
          checksMoveSandbox.style.paddingLeft = "0";
          checksMoveSandbox.appendChild(wrapMoveSandboxNoRedirect);
          checksMoveSandbox.appendChild(wrapMoveSandboxTalk);
          checksMoveSandbox.appendChild(wrapMoveSandboxSubpages);
          divMoveSandboxPanel.appendChild(checksMoveSandbox);

          bodyMoveSandbox.appendChild(divMoveSandboxPanel);

          selMoveMode.addEventListener("change", function () {
            const isSandbox = selMoveMode.value === "sandbox";
            divMoveSandboxPanel.classList.toggle("tng-hidden", !isSandbox);
            divMovePagePanel.classList.toggle("tng-hidden", isSandbox);
          });

          body.appendChild(secMoveSandbox);

          // Evaluates whether the "Also move the talk page" checkbox should
          // be available for the current target. Disables it synchronously
          // when the target is itself a talk page, and via an API call when
          // no associated talk page exists. Re-enables it when conditions
          // are met. Only runs in page mode.
          async function updateMoveSandboxTalkAvailability() {
            const target = inputTarget.value.trim();
            if (!target || tenguMode !== "page") return;

            // Synchronous check: target is itself a talk page.
            let isTalkPage = false;
            try {
              isTalkPage = new mw.Title(target).isTalkPage();
            } catch (e) {
              // Cannot parse title; assume not a talk page.
            }

            if (isTalkPage) {
              chkMoveSandboxTalk.checked = false;
              chkMoveSandboxTalk.disabled = true;
              wrapMoveSandboxTalk.style.opacity = "0.5";
              wrapMoveSandboxTalk.style.cursor = "not-allowed";
              wrapMoveSandboxTalk.title =
                "Not available: the target page is itself a talk page.";
              return;
            }

            // Async check: does an associated talk page exist?
            let talkTitle = null;
            try {
              talkTitle = new mw.Title(target).getTalkPage().getPrefixedText();
            } catch (e) {
              // Cannot resolve a talk page for this title.
            }

            if (!talkTitle) {
              chkMoveSandboxTalk.checked = false;
              chkMoveSandboxTalk.disabled = true;
              wrapMoveSandboxTalk.style.opacity = "0.5";
              wrapMoveSandboxTalk.style.cursor = "not-allowed";
              wrapMoveSandboxTalk.title =
                "Not available: this page has no associated talk page.";
              return;
            }

            try {
              const data = await apiGet({
                action: "query",
                titles: talkTitle,
                formatversion: 2,
              });
              const page =
                data.query && data.query.pages && data.query.pages[0];
              const talkExists = !!(page && !page.missing);

              if (talkExists) {
                chkMoveSandboxTalk.disabled = false;
                wrapMoveSandboxTalk.style.opacity = "";
                wrapMoveSandboxTalk.style.cursor = "";
                wrapMoveSandboxTalk.title =
                  "When ticked, the talk page associated with the target page will also be moved to the corresponding talk page of the destination (e.g. User talk:[username]/[subpage name]). Automatically disabled when the target is itself a talk page or has no associated talk page.";
              } else {
                chkMoveSandboxTalk.checked = false;
                chkMoveSandboxTalk.disabled = true;
                wrapMoveSandboxTalk.style.opacity = "0.5";
                wrapMoveSandboxTalk.style.cursor = "not-allowed";
                wrapMoveSandboxTalk.title =
                  "Not available: no talk page exists for this page.";
              }
            } catch (e) {
              // API call failed; leave the checkbox enabled so the user can still try.
              chkMoveSandboxTalk.disabled = false;
              wrapMoveSandboxTalk.style.opacity = "";
              wrapMoveSandboxTalk.style.cursor = "";
            }
          }

          // Page protection module injection setup
          const {
            section: secProtect,
            sectionBody: bodyProtect,
            enableChk: chkProtect,
          } = makeSection("Page protection", "🛡️", false);

          // Page protection status note — populated by updateSectionStatus() when the target changes
          const divProtectStatus = document.createElement("div");
          divProtectStatus.className =
            "tng-status-note tng-status-note-loading";
          divProtectStatus.textContent =
            "Enter a target to see protection status.";
          bodyProtect.appendChild(divProtectStatus);

          const { row: rowProtectEdit, field: fieldProtectEdit } =
            makeRow("Edit restriction");
          const selProtectEdit = makeSelect([
            { value: "all", label: "All users (unrestricted)" },
            { value: "autoconfirmed", label: "Autoconfirmed users" },
            { value: "sysop", label: "Administrators only" },
          ]);
          fieldProtectEdit.appendChild(wrapSelect(selProtectEdit));
          bodyProtect.appendChild(rowProtectEdit);

          const { row: rowProtectMove, field: fieldProtectMove } =
            makeRow("Move restriction");
          const selProtectMove = makeSelect([
            { value: "all", label: "All users (unrestricted)" },
            { value: "autoconfirmed", label: "Autoconfirmed users" },
            { value: "sysop", label: "Administrators only" },
          ]);
          fieldProtectMove.appendChild(wrapSelect(selProtectMove));
          bodyProtect.appendChild(rowProtectMove);

          // Adds 'Extended confirmed users' between autoconfirmed and sysop on
          // wikis where this protection level is configured. The group does not
          // exist on all wikis, so the option is omitted entirely rather than
          // shown disabled when unavailable. Applies only to Edit and Move
          // restriction; Upload restriction and recreation-protection levels are
          // unaffected.
          restrictionLevelsPromise.then(function (info) {
            if (!info.hasExtendedConfirmed) return;
            [
              selProtectEdit,
              selProtectMove,
              selPagedelProtectRecreationLevel,
              selProtectRecreationLevel,
            ].forEach(function (sel) {
              const opt = document.createElement("option");
              opt.value = "extendedconfirmed";
              opt.textContent = "Extended confirmed users";
              const sysopOpt = Array.from(sel.options).find(function (o) {
                return o.value === "sysop";
              });
              sel.insertBefore(opt, sysopOpt);
            });
          });

          // Upload restriction — only applicable to file pages (File namespace).
          // The control stays visible but disabled outside that namespace; see
          // isTargetFilePage() / updateUploadAvailability() below.
          const { row: rowProtectUpload, field: fieldProtectUpload } =
            makeRow("Upload restriction");
          const selProtectUpload = makeSelect([
            { value: "all", label: "All users (unrestricted)" },
            { value: "autoconfirmed", label: "Autoconfirmed users" },
            { value: "sysop", label: "Administrators only" },
          ]);
          selProtectUpload.disabled = true;
          fieldProtectUpload.appendChild(wrapSelect(selProtectUpload));
          rowProtectUpload.style.opacity = "0.5";
          rowProtectUpload.title =
            "Only available when the target is a file page.";
          bodyProtect.appendChild(rowProtectUpload);

          const { row: rowProtectExpiry, field: fieldProtectExpiry } =
            makeRow("Expiry");
          const selProtectExpiry = makeSelect([
            { value: "1 day", label: "1 day" },
            { value: "3 days", label: "3 days" },
            { value: "1 week", label: "1 week" },
            { value: "2 weeks", label: "2 weeks" },
            { value: "1 month", label: "1 month" },
            { value: "3 months", label: "3 months" },
            { value: "6 months", label: "6 months" },
            { value: "1 year", label: "1 year" },
            { value: "never", label: "Indefinite" },
            { value: "other", label: "Other:" },
          ]);
          const inputProtectExpiry = makeInput("e.g. 6 months, 2099-01-01");
          inputProtectExpiry.classList.add("tng-hidden");
          selProtectExpiry.addEventListener("change", function () {
            inputProtectExpiry.classList.toggle(
              "tng-hidden",
              selProtectExpiry.value !== "other",
            );
          });
          const protectExpiryGroup = document.createElement("div");
          protectExpiryGroup.style.cssText =
            "display: flex; gap: 6px; width: 100%;";
          inputProtectExpiry.style.flex = "1";
          protectExpiryGroup.appendChild(wrapSelect(selProtectExpiry, "1"));
          protectExpiryGroup.appendChild(inputProtectExpiry);
          fieldProtectExpiry.appendChild(protectExpiryGroup);
          bodyProtect.appendChild(rowProtectExpiry);

          const { row: rowProtectReason, field: fieldProtectReason } =
            makeRow("Reason");
          const selProtectReason = makeSelect(PROTECTION_REASONS);
          const {
            wrap: filteredWrapProtectReason,
            filter: filterProtectReason,
          } = makeFilteredSelect(selProtectReason);
          const inputProtectReason = makeInput("Full reason to submit");
          const btnProtectAppend = makeBtn("Append", "quiet");
          btnProtectAppend.className += " tng-btn-sm";
          btnProtectAppend.addEventListener("click", function () {
            const cur = inputProtectReason.value;
            const add = selProtectReason.value;
            if (!add) return;
            inputProtectReason.value = cur ? cur + "; " + add : add;
            selProtectReason.selectedIndex = 0;
            filterProtectReason.value = "";
            filterProtectReason.dispatchEvent(new Event("input"));
          });
          const reasonWrapProtect = document.createElement("div");
          reasonWrapProtect.className = "tng-reason-wrap";
          const reasonTopProtect = document.createElement("div");
          reasonTopProtect.className = "tng-reason-top";
          reasonTopProtect.appendChild(filteredWrapProtectReason);
          reasonTopProtect.appendChild(btnProtectAppend);
          reasonWrapProtect.appendChild(reasonTopProtect);
          reasonWrapProtect.appendChild(inputProtectReason);
          fieldProtectReason.appendChild(reasonWrapProtect);
          bodyProtect.appendChild(rowProtectReason);

          // 'Also protect the talk page' option
          const { wrap: wrapProtectTalk, chk: chkProtectTalk } = makeCheckbox(
            "Also protect the talk page",
            false,
          );
          wrapProtectTalk.title =
            "When ticked, each protected page's talk page will also be protected at the same level and expiry. Pages that are already talk pages are skipped.";
          const checksProtect = document.createElement("div");
          checksProtect.className = "tng-checks";
          checksProtect.style.paddingLeft = "0";
          checksProtect.appendChild(wrapProtectTalk);
          const { wrap: wrapProtectCascade, chk: chkProtectCascade } =
            makeCheckbox(
              "Protect pages included in this page (cascading protection)",
              false,
            );
          wrapProtectCascade.title =
            "Only available when edit restriction is set to administrators only.";
          checksProtect.appendChild(wrapProtectCascade);
          const { wrap: wrapNotifyProtect, chk: chkNotifyProtect } =
            makeCheckbox("Send protection notification to talk page", true);
          wrapNotifyProtect.title =
            "When ticked, a notification will be posted to the relevant talk page after a successful protection.";
          checksProtect.appendChild(wrapNotifyProtect);
          bodyProtect.appendChild(checksProtect);

          // Cascade protection requires sysop-level edit restriction.
          // Disable and uncheck the cascade checkbox whenever the edit level drops below sysop.
          function updateCascadeAvailability() {
            const isSysop = selProtectEdit.value === "sysop";
            chkProtectCascade.disabled = !isSysop;
            wrapProtectCascade.title = isSysop
              ? "When ticked, pages transcluded into this page are also protected at the same level."
              : "Only available when edit restriction is set to administrators only.";
            if (!isSysop) chkProtectCascade.checked = false;
          }
          selProtectEdit.addEventListener("change", updateCascadeAvailability);
          updateCascadeAvailability();

          body.appendChild(secProtect);

          // Page recreation-protection module — kept as its own section, separate
          // from page protection above, so the two protection types are not
          // presented together in one section. Uses create= protection, which is
          // the correct API parameter for preventing a deleted or never-created
          // page from being recreated. Only active on non-existent pages.
          const {
            section: secProtectRecreation,
            sectionBody: bodyProtectRecreation,
            enableChk: chkProtectRecreation,
          } = makeSection("Protect against recreation", "🔏", false);

          const hdrProtectRecreation = secProtectRecreation.querySelector(
            ".tng-section-header",
          );

          const selProtectRecreationLevel = makeSelect([
            { value: "autoconfirmed", label: "Autoconfirmed users" },
            { value: "sysop", label: "Administrators only" },
          ]);
          selProtectRecreationLevel.value = "sysop";
          selProtectRecreationLevel.disabled = true;

          const selProtectRecreationExpiry = makeSelect([
            { value: "1 day", label: "1 day" },
            { value: "3 days", label: "3 days" },
            { value: "1 week", label: "1 week" },
            { value: "2 weeks", label: "2 weeks" },
            { value: "1 month", label: "1 month" },
            { value: "3 months", label: "3 months" },
            { value: "6 months", label: "6 months" },
            { value: "1 year", label: "1 year" },
            { value: "never", label: "Indefinite" },
            { value: "other", label: "Other:" },
          ]);
          selProtectRecreationExpiry.disabled = true;

          const inputProtectRecreationExpiry = makeInput(
            "e.g. 6 months, 2099-01-01",
          );
          inputProtectRecreationExpiry.classList.add("tng-hidden");
          inputProtectRecreationExpiry.disabled = true;
          selProtectRecreationExpiry.addEventListener("change", function () {
            inputProtectRecreationExpiry.classList.toggle(
              "tng-hidden",
              selProtectRecreationExpiry.value !== "other",
            );
          });

          // Expiry group: dropdown + optional custom input, side by side.
          const recreationProtectExpiryGroup = document.createElement("div");
          recreationProtectExpiryGroup.style.cssText =
            "display: flex; gap: 6px; flex: 1; min-width: 0;";
          inputProtectRecreationExpiry.style.flex = "1";
          recreationProtectExpiryGroup.appendChild(
            wrapSelect(selProtectRecreationExpiry, "1"),
          );
          recreationProtectExpiryGroup.appendChild(
            inputProtectRecreationExpiry,
          );

          const {
            row: rowProtectRecreationLevel,
            field: fieldProtectRecreationLevel,
          } = makeRow("Protection level");
          fieldProtectRecreationLevel.appendChild(
            wrapSelect(selProtectRecreationLevel, "1"),
          );
          rowProtectRecreationLevel.style.opacity = "0.5";
          bodyProtectRecreation.appendChild(rowProtectRecreationLevel);

          const {
            row: rowProtectRecreationExpiry,
            field: fieldProtectRecreationExpiry,
          } = makeRow("Expiry");
          fieldProtectRecreationExpiry.appendChild(
            recreationProtectExpiryGroup,
          );
          rowProtectRecreationExpiry.style.opacity = "0.5";
          bodyProtectRecreation.appendChild(rowProtectRecreationExpiry);

          // Reason for protecting the page against recreation
          const {
            row: rowProtectRecreationReason,
            field: fieldProtectRecreationReason,
          } = makeRow("Reason");
          const selProtectRecreationReason = makeSelect(
            PROTECT_RECREATION_REASONS,
          );
          selProtectRecreationReason.disabled = true;
          const {
            wrap: filteredWrapProtectRecreationReason,
            filter: filterProtectRecreationReason,
          } = makeFilteredSelect(selProtectRecreationReason);
          const inputProtectRecreationReason = makeInput(
            "Full reason to submit",
          );
          inputProtectRecreationReason.disabled = true;
          const btnProtectRecreationReasonAppend = makeBtn("Append", "quiet");
          btnProtectRecreationReasonAppend.className += " tng-btn-sm";
          btnProtectRecreationReasonAppend.addEventListener(
            "click",
            function () {
              const cur = inputProtectRecreationReason.value;
              const add = selProtectRecreationReason.value;
              if (!add) return;
              inputProtectRecreationReason.value = cur ? cur + "; " + add : add;
              selProtectRecreationReason.selectedIndex = 0;
              filterProtectRecreationReason.value = "";
              filterProtectRecreationReason.dispatchEvent(new Event("input"));
            },
          );
          const reasonWrapProtectRecreation = document.createElement("div");
          reasonWrapProtectRecreation.className = "tng-reason-wrap";
          const reasonTopProtectRecreation = document.createElement("div");
          reasonTopProtectRecreation.className = "tng-reason-top";
          reasonTopProtectRecreation.appendChild(
            filteredWrapProtectRecreationReason,
          );
          reasonTopProtectRecreation.appendChild(
            btnProtectRecreationReasonAppend,
          );
          reasonWrapProtectRecreation.appendChild(reasonTopProtectRecreation);
          reasonWrapProtectRecreation.appendChild(inputProtectRecreationReason);
          fieldProtectRecreationReason.appendChild(reasonWrapProtectRecreation);
          rowProtectRecreationReason.style.opacity = "0.5";
          bodyProtectRecreation.appendChild(rowProtectRecreationReason);

          // Enable/disable the sub-controls when the checkbox is toggled.
          chkProtectRecreation.addEventListener("change", function () {
            const enabled = chkProtectRecreation.checked;
            selProtectRecreationLevel.disabled = !enabled;
            selProtectRecreationExpiry.disabled = !enabled;
            inputProtectRecreationExpiry.disabled = !enabled;
            selProtectRecreationReason.disabled = !enabled;
            inputProtectRecreationReason.disabled = !enabled;
            rowProtectRecreationLevel.style.opacity = enabled ? "" : "0.5";
            rowProtectRecreationExpiry.style.opacity = enabled ? "" : "0.5";
            rowProtectRecreationReason.style.opacity = enabled ? "" : "0.5";
          });

          // Reversible lock for this section, driven by whether the target
          // page exists. Tracked separately from the mode lock
          // (applyModeLock) via its own set, mirroring the pattern used by
          // applyUnblockStatusLock().
          const protectRecreationStatusLocked = new Set();
          function applyProtectRecreationStatusLock(locked, reason) {
            const arrow =
              secProtectRecreation.querySelector(".tng-section-arrow");

            if (locked) {
              if (protectRecreationStatusLocked.has(chkProtectRecreation)) {
                hdrProtectRecreation.title = "Unavailable: " + reason;
                const existingBadge = hdrProtectRecreation.querySelector(
                  ".tng-protectrecreation-lock-badge",
                );
                if (existingBadge)
                  existingBadge.title = "Unavailable: " + reason;
                return;
              }
              protectRecreationStatusLocked.add(chkProtectRecreation);
              chkProtectRecreation.checked = false;
              chkProtectRecreation.disabled = true;
              secProtectRecreation.classList.add("tng-disabled");
              bodyProtectRecreation.classList.add("tng-hidden");
              if (arrow) arrow.classList.add("tng-hidden");
              hdrProtectRecreation.title = "Unavailable: " + reason;
              const badge = document.createElement("span");
              badge.className =
                "tng-rights-lock tng-protectrecreation-lock-badge";
              badge.textContent = "🔒";
              badge.title = "Unavailable: " + reason;
              hdrProtectRecreation.appendChild(badge);
            } else {
              if (!protectRecreationStatusLocked.has(chkProtectRecreation))
                return;
              protectRecreationStatusLocked.delete(chkProtectRecreation);
              chkProtectRecreation.disabled = false;
              secProtectRecreation.classList.toggle(
                "tng-disabled",
                !chkProtectRecreation.checked,
              );
              if (arrow) {
                arrow.classList.remove("tng-hidden");
                arrow.classList.toggle(
                  "tng-arrow-up",
                  !bodyProtectRecreation.classList.contains("tng-hidden"),
                );
              }
              hdrProtectRecreation.title = "";
              const badge = hdrProtectRecreation.querySelector(
                ".tng-protectrecreation-lock-badge",
              );
              if (badge) badge.remove();
            }
          }
          applyProtectRecreationStatusLock(
            true,
            "no target has been specified.",
          );

          body.appendChild(secProtectRecreation);

          const {
            section: secRevdel,
            sectionBody: bodyRevdel,
            enableChk: chkRevdel,
          } = makeSection("Revision deletion", "👁️", false);
          const { wrap: wrapRdContent, chk: chkRdContent } = makeCheckbox(
            "Hide revision content",
            true,
          );
          const { wrap: wrapRdSummary, chk: chkRdSummary } = makeCheckbox(
            "Hide edit summary",
            true,
          );
          const { wrap: wrapRdUsername, chk: chkRdUsername } = makeCheckbox(
            "Hide username",
            false,
          );
          const { wrap: wrapOversight, chk: chkOversight } = makeCheckbox(
            "Oversight (suppress)",
            false,
          );
          wrapOversight.title = 'Requires "suppressrevision" right';
          const checksRevdel = document.createElement("div");
          checksRevdel.className = "tng-checks";
          checksRevdel.style.paddingLeft = "0";
          checksRevdel.appendChild(wrapRdContent);
          checksRevdel.appendChild(wrapRdSummary);
          checksRevdel.appendChild(wrapRdUsername);
          checksRevdel.appendChild(wrapOversight);
          bodyRevdel.appendChild(checksRevdel);
          const { row: rowRevdelReason, field: fieldRevdelReason } =
            makeRow("Reason");
          const selRevdelReason = makeSelect(
            [{ value: "", label: "Other:" }].concat(REVDEL_REASONS),
          );
          const { wrap: filteredWrapRevdelReason, filter: filterRevdelReason } =
            makeFilteredSelect(selRevdelReason);
          const inputRevdelReason = makeInput("Full reason to submit");
          const btnRevdelAppend = makeBtn("Append", "quiet");
          btnRevdelAppend.className += " tng-btn-sm";
          btnRevdelAppend.addEventListener("click", function () {
            const cur = inputRevdelReason.value;
            const add = selRevdelReason.value;
            if (!add) return;
            inputRevdelReason.value = cur ? cur + "; " + add : add;
            selRevdelReason.selectedIndex = 0;
            filterRevdelReason.value = "";
            filterRevdelReason.dispatchEvent(new Event("input"));
          });
          const reasonWrapRevdel = document.createElement("div");
          reasonWrapRevdel.className = "tng-reason-wrap";
          const reasonTopRevdel = document.createElement("div");
          reasonTopRevdel.className = "tng-reason-top";
          reasonTopRevdel.appendChild(filteredWrapRevdelReason);
          reasonTopRevdel.appendChild(btnRevdelAppend);
          reasonWrapRevdel.appendChild(reasonTopRevdel);
          reasonWrapRevdel.appendChild(inputRevdelReason);
          fieldRevdelReason.appendChild(reasonWrapRevdel);
          bodyRevdel.appendChild(rowRevdelReason);
          body.appendChild(secRevdel);

          // Lock a section: uncheck and disable its toggle, collapse its body,
          // remove the chevron (section cannot be opened), and append a lock
          // indicator to the header so the restriction is visible.
          function lockSection(sec, secBody, chk, reason) {
            if (chk.disabled) return; // Prevent duplicating the lock icon
            chk.checked = false;
            chk.disabled = true;
            sec.classList.add("tng-disabled");
            secBody.classList.add("tng-hidden");
            const arrow = sec.querySelector(".tng-section-arrow");
            if (arrow) arrow.remove();
            const hdr = sec.querySelector(".tng-section-header");
            hdr.title = "Unavailable: " + reason;
            const lockBadge = document.createElement("span");
            lockBadge.className = "tng-rights-lock";
            lockBadge.textContent = "🔒";
            lockBadge.title = "Unavailable: " + reason;
            hdr.appendChild(lockBadge);
          }

          // Reversible section lock for the mode toggle. Unlike lockSection(), which is
          // permanent (used for rights), this can be undone when switching back to user mode.
          // Skips any section already rights-locked (chk.disabled set by lockSection()).
          const modeLocked = new Set();
          function applyModeLock(sec, secBody, chk, lock, reason) {
            if (lock) {
              if (chk.disabled) return; // Already rights-locked; leave it alone
              modeLocked.add(chk);
              chk.checked = false;
              chk.disabled = true;
              sec.classList.add("tng-disabled");
              secBody.classList.add("tng-hidden");
              const arrow = sec.querySelector(".tng-section-arrow");
              if (arrow) arrow.classList.add("tng-hidden");
              const hdr = sec.querySelector(".tng-section-header");
              hdr.title = "Unavailable: " + reason;
              const badge = document.createElement("span");
              badge.className = "tng-rights-lock tng-mode-lock-badge";
              badge.textContent = "🔒";
              badge.title = "Unavailable: " + reason;
              hdr.appendChild(badge);
            } else {
              if (!modeLocked.has(chk)) return; // Not mode-locked; leave it alone
              modeLocked.delete(chk);
              chk.disabled = false;
              sec.classList.toggle("tng-disabled", !chk.checked);
              const arrow = sec.querySelector(".tng-section-arrow");
              if (arrow) {
                arrow.classList.remove("tng-hidden");
                arrow.classList.toggle(
                  "tng-arrow-up",
                  !secBody.classList.contains("tng-hidden"),
                );
              }
              const hdr = sec.querySelector(".tng-section-header");
              hdr.title = "";
              const badge = hdr.querySelector(".tng-mode-lock-badge");
              if (badge) badge.remove();
              updateStartBtn();
            }
          }

          // Returns true when in page mode and the current target input resolves to a special page (NS -1).
          function isTargetSpecialPage() {
            if (tenguMode !== "page") return false;
            const title = inputTarget.value.trim();
            if (!title) return false;
            try {
              return new mw.Title(title).getNamespaceId() === -1;
            } catch (e) {
              return /^special:/i.test(title);
            }
          }

          // Returns true when in page mode and the current target input resolves to a
          // file page (NS 6). Upload restriction only applies within the File namespace.
          function isTargetFilePage() {
            if (tenguMode !== "page") return false;
            const title = inputTarget.value.trim();
            if (!title) return false;
            try {
              return new mw.Title(title).getNamespaceId() === 6;
            } catch (e) {
              return /^(file|image):/i.test(title);
            }
          }

          // Enables the upload restriction control only when the target resolves to a
          // file page; disables it (without hiding it) otherwise.
          function updateUploadAvailability() {
            const isFilePage = isTargetFilePage();
            selProtectUpload.disabled = !isFilePage;
            rowProtectUpload.style.opacity = isFilePage ? "" : "0.5";
            rowProtectUpload.title = isFilePage
              ? ""
              : "Only available when the target is a file page.";
            if (!isFilePage) selProtectUpload.value = "all";
          }

          // Applies or removes reversible mode locks on page deletion, protection,
          // and page moves when the target is a special page. Delegates to
          // applyModeLock() so locks are cleared automatically when the target
          // changes or mode is switched.
          function applySpecialPageLocks(lock) {
            if (lock) {
              applyModeLock(
                secPagedel,
                bodyPagedel,
                chkPagedel,
                true,
                "special pages cannot be deleted.",
              );
              applyModeLock(
                secProtect,
                bodyProtect,
                chkProtect,
                true,
                "special pages cannot be protected.",
              );
              applyModeLock(
                secProtectRecreation,
                bodyProtectRecreation,
                chkProtectRecreation,
                true,
                "special pages cannot be protected.",
              );
              applyModeLock(
                secUndelete,
                bodyUndelete,
                chkUndelete,
                true,
                "special pages cannot be undeleted.",
              );
              applyModeLock(
                secGS,
                bodyGS,
                chkGS,
                true,
                "special pages cannot be reported.",
              );
              applyModeLock(
                secMoveSandbox,
                bodyMoveSandbox,
                chkMoveSandbox,
                true,
                "special pages cannot be moved.",
              );
            } else {
              applyModeLock(secPagedel, bodyPagedel, chkPagedel, false);
              applyModeLock(secProtect, bodyProtect, chkProtect, false);
              applyModeLock(
                secProtectRecreation,
                bodyProtectRecreation,
                chkProtectRecreation,
                false,
              );
              applyModeLock(secUndelete, bodyUndelete, chkUndelete, false);
              applyModeLock(secGS, bodyGS, chkGS, false);
              applyModeLock(
                secMoveSandbox,
                bodyMoveSandbox,
                chkMoveSandbox,
                false,
              );
            }
          }

          // Updates all mode-sensitive UI when the user switches modes via the toggle.
          function applyModeRestrictions(isUserModeNow) {
            tenguMode = isUserModeNow ? "user" : "page";
            let targetIsSpecial = !isUserModeNow && isTargetSpecialPage();
            updateModeNotice(isUserModeNow, targetIsSpecial);
            updateModeBadge(isUserModeNow);

            // Show only the reason checkboxes matching the new mode, and
            // clear all groups so a reason picked under the previous mode
            // is never carried over into a report submitted under the new one.
            checksGSReasonsAccount.classList.toggle(
              "tng-hidden",
              !isUserModeNow,
            );
            rowGSPageRequestType.classList.toggle("tng-hidden", isUserModeNow);
            // Reset the request type to page deletion and update the visible
            // reason container whenever the mode changes.
            selGSPageRequestType.value = "delete";
            updateGSPageReasonSet();
            if (isUserModeNow) {
              checksGSReasonsPageDelete.classList.add("tng-hidden");
            }
            gsReasonChecksAccount.forEach(function (c) {
              c.chk.checked = false;
            });
            [
              ...gsReasonChecksPageDelete,
              ...gsReasonChecksPageProtect,
              ...gsReasonChecksPageRevdel,
            ].forEach(function (c) {
              c.chk.checked = false;
            });

            // Update target row label, placeholder, and get info tooltip
            rowTarget.querySelector(".tng-label").textContent = isUserModeNow
              ? "Target user"
              : "Target page";
            inputTarget.placeholder = isUserModeNow
              ? "Username or IP (not a range)"
              : "Page title";
            btnGetInfo.title = isUserModeNow
              ? "View access rights, block log, rights changes, and abuse filter log for this user"
              : "View abuse filter, protection, deletion, and move logs for this page";
            btnExportEdits.style.display = isUserModeNow ? "" : "none";
            btnExportEdits.disabled =
              !inputTarget.value.trim() || !isUserModeNow;

            // Pre-fill target with the appropriate default for the selected mode
            inputTarget.value = isUserModeNow
              ? mw.config.get("wgRelevantUserName") || ""
              : mw.config.get("wgPageName").replace(/_/g, " ");
            clearInputError(inputTarget);
            btnGetInfo.disabled = !inputTarget.value.trim();
            // Re-evaluate after the input has been updated to the mode's default
            // target. The value computed above may be stale when switching from
            // user mode (where the input holds a username) to page mode on a
            // special page, causing applySpecialPageLocks() to receive an
            // incorrect false and leave the Move page section unlocked.
            targetIsSpecial = !isUserModeNow && isTargetSpecialPage();
            if (!isUserModeNow) updateModeNotice(false, targetIsSpecial);

            // Edits row: only applicable in user mode
            selEndtime.disabled = !isUserModeNow;
            inputEndtime.disabled = !isUserModeNow;
            inputBetweenFrom.disabled = !isUserModeNow;
            inputBetweenTo.disabled = !isUserModeNow;
            rowEdits.style.opacity = isUserModeNow ? "" : "0.5";
            rowEdits.title = isUserModeNow ? "" : "Not applicable in page mode";
            // Reset custom-selection state when switching to page mode, since
            // the picker is only available in user mode.
            if (!isUserModeNow && selEndtime.value === "custom") {
              selEndtime.value = "3600";
              inputEndtime.classList.add("tng-hidden");
              pickEditsBtnRow.classList.add("tng-hidden");
              customSelectedPageEdits = {};
              customSelectedCreations = [];
              updatePickerSelectionSummary();
            }

            // Package row: available in both modes. The preset list is
            // mode-specific, so rebuild it and reset to Default whenever the
            // mode changes — a package chosen under the previous mode may
            // not exist under the new one.
            rebuildPackageOptions(isUserModeNow);
            selPackage.value = "Default";
            applyPackage("Default");

            // Lock or unlock user-mode-only sections
            if (!isUserModeNow) {
              applyModeLock(
                secRollback,
                bodyRollback,
                chkRollback,
                true,
                "Tengu is targeting a page, not a user.",
              );
              applyModeLock(
                secBlock,
                bodyBlock,
                chkBlock,
                true,
                "Tengu is targeting a page, not a user.",
              );
              applyModeLock(
                secUnblock,
                bodyUnblock,
                chkUnblock,
                true,
                "Tengu is targeting a page, not a user.",
              );
              applyModeLock(
                secWarn,
                bodyWarn,
                chkWarn,
                true,
                "Tengu is targeting a page, not a user.",
              );
              applyModeLock(
                secRevdel,
                bodyRevdel,
                chkRevdel,
                true,
                "Tengu is targeting a page, not a user.",
              );
              applyModeLock(
                secSRG,
                bodySRG,
                chkSRG,
                true,
                "Tengu is targeting a page, not a user.",
              );
              // Move to sandbox is available in page mode; unlock it
              applyModeLock(
                secMoveSandbox,
                bodyMoveSandbox,
                chkMoveSandbox,
                false,
              );
              // Reset the same-as-creator option when entering page mode so a
              // stale username from a previous session is not silently reused.
              chkMoveSandboxSameAsCreator.checked = false;
              inputMoveSandboxUser.disabled = false;
              // Auto-fill subpage name with the page title (without namespace)
              const _pageTargetForMove = inputTarget.value.trim();
              if (_pageTargetForMove) {
                try {
                  inputMoveSandboxSubpage.value = new mw.Title(
                    _pageTargetForMove,
                  )
                    .getMain()
                    .replace(/_/g, " ");
                } catch (e) {
                  // Title could not be parsed; leave the subpage field as-is
                }
              }
              // Re-evaluate talk page availability for the new target.
              updateMoveSandboxTalkAvailability();
            } else {
              // Remove mode locks first to enable features
              applyModeLock(secRollback, bodyRollback, chkRollback, false);
              applyModeLock(secBlock, bodyBlock, chkBlock, false);
              applyModeLock(secUnblock, bodyUnblock, chkUnblock, false);
              applyModeLock(secWarn, bodyWarn, chkWarn, false);
              applyModeLock(secRevdel, bodyRevdel, chkRevdel, false);
              applyModeLock(secSRG, bodySRG, chkSRG, false);
              // Move to sandbox is page-mode only; lock it when switching to user mode
              applyModeLock(
                secMoveSandbox,
                bodyMoveSandbox,
                chkMoveSandbox,
                true,
                "Move page is only available in page mode.",
              );
              // Remove any special page locks that were active while in page mode
              applySpecialPageLocks(false);

              // Re-evaluate and apply strict rights-based permanent locks if permissions are missing
              if (resolvedRights) {
                if (!resolvedRights.hasBlock) {
                  lockSection(
                    secBlock,
                    bodyBlock,
                    chkBlock,
                    "you do not have the block right on this wiki.",
                  );
                }
                if (!resolvedRights.hasRevdel) {
                  lockSection(
                    secRevdel,
                    bodyRevdel,
                    chkRevdel,
                    "you do not have the deleterevision right on this wiki.",
                  );
                }
              }
            }

            // Apply or remove special page locks when switching to page mode
            if (!isUserModeNow) applySpecialPageLocks(targetIsSpecial);

            updateUploadAvailability();
            updateStartBtn();
            updateSectionStatus();
          }

          // Lock the move-to-sandbox section when starting in user mode
          // (it is only applicable in page mode)
          if (tenguMode === "user") {
            applyModeLock(
              secMoveSandbox,
              bodyMoveSandbox,
              chkMoveSandbox,
              true,
              "Move page is only available in page mode.",
            );
          }

          // Automatically lock user mode features if executed in page mode due to page namespace context
          if (tenguMode === "page") {
            applyModeLock(
              secRollback,
              bodyRollback,
              chkRollback,
              true,
              "Tengu is targeting a page, not a user.",
            );
            applyModeLock(
              secBlock,
              bodyBlock,
              chkBlock,
              true,
              "Tengu is targeting a page, not a user.",
            );
            applyModeLock(
              secUnblock,
              bodyUnblock,
              chkUnblock,
              true,
              "Tengu is targeting a page, not a user.",
            );
            applyModeLock(
              secWarn,
              bodyWarn,
              chkWarn,
              true,
              "Tengu is targeting a page, not a user.",
            );
            applyModeLock(
              secRevdel,
              bodyRevdel,
              chkRevdel,
              true,
              "Tengu is targeting a page, not a user.",
            );
            applyModeLock(
              secSRG,
              bodySRG,
              chkSRG,
              true,
              "Tengu is targeting a page, not a user.",
            );
            // Lock deletion and protection on initial load when the current page is a special page
            if (isSpecialPage) {
              applySpecialPageLocks(true);
              updateModeNotice(false, true);
            }
          }

          const btnCancel = makeBtn("Cancel", "quiet");
          btnCancel.addEventListener("click", function () {
            overlay.closeHandler();
          });

          const btnStart = makeBtn("Start", "destructive");

          // Evaluation routine to dynamically handle the start button state
          function updateStartBtn() {
            btnStart.disabled = !(
              chkRollback.checked ||
              chkBlock.checked ||
              chkUnblock.checked ||
              chkPagedel.checked ||
              chkUndelete.checked ||
              chkMoveSandbox.checked ||
              chkProtect.checked ||
              chkProtectRecreation.checked ||
              chkRevdel.checked ||
              chkWarn.checked ||
              chkGS.checked ||
              chkSRG.checked
            );
          }

          // Bind monitoring handlers to state changes of operational modules
          chkRollback.addEventListener("change", updateStartBtn);
          chkBlock.addEventListener("change", updateStartBtn);
          chkUnblock.addEventListener("change", updateStartBtn);
          chkPagedel.addEventListener("change", updateStartBtn);
          chkUndelete.addEventListener("change", updateStartBtn);
          chkProtect.addEventListener("change", updateStartBtn);
          chkProtectRecreation.addEventListener("change", updateStartBtn);
          chkRevdel.addEventListener("change", updateStartBtn);
          chkWarn.addEventListener("change", updateStartBtn);
          chkGS.addEventListener("change", updateStartBtn);
          chkSRG.addEventListener("change", updateStartBtn);
          chkMoveSandbox.addEventListener("change", updateStartBtn);

          btnStart.addEventListener("click", function () {
            const targetVal = inputTarget.value.trim();

            clearInputError(inputTarget);

            if (!targetVal) {
              showNotification(
                fieldTarget,
                tenguMode === "user"
                  ? "Please enter a target username."
                  : "Please enter a target page title.",
              );
              inputTarget.focus();
              return;
            }

            if (chkGS.checked && !chkGS.disabled) {
              const hasGSReason = activeGSReasonChecks().some(function (c) {
                return c.chk.checked;
              });
              if (!hasGSReason && !inputGSDetails.value.trim()) {
                showNotification(
                  fieldGSDetails,
                  "Select at least one reason, or add details below.",
                );
                inputGSDetails.focus();
                return;
              }
            }

            if (chkSRG.checked && !chkSRG.disabled) {
              const hasSRGReason = activeSRGReasonChecks().some(function (c) {
                return c.chk.checked;
              });
              if (!hasSRGReason && !inputSRGDetails.value.trim()) {
                showNotification(
                  fieldSRGDetails,
                  "Select at least one reason, or add details below.",
                );
                inputSRGDetails.focus();
                return;
              }
            }

            if (chkMoveSandbox.checked && !chkMoveSandbox.disabled) {
              if (selMoveMode.value === "movepage") {
                if (!inputMovePageDest.value.trim()) {
                  showNotification(
                    fieldMovePageDest,
                    "Please enter a destination title.",
                  );
                  inputMovePageDest.focus();
                  return;
                }
              } else {
                if (!inputMoveSandboxUser.value.trim()) {
                  showNotification(
                    fieldMoveSandboxUser,
                    "Please enter a username.",
                  );
                  inputMoveSandboxUser.focus();
                  return;
                }
                if (!inputMoveSandboxSubpage.value.trim()) {
                  showNotification(
                    fieldMoveSandboxSubpage,
                    "Please enter a subpage name.",
                  );
                  inputMoveSandboxSubpage.focus();
                  return;
                }
              } // end else (sandbox mode)
            }

            const suffix = selSuffix.value;
            const isIP = mw.util.isIPAddress(targetVal);
            let endtime = selEndtime.value;
            let betweenMode = false;
            let betweenFrom = null;
            let betweenTo = null;
            if (endtime === "other") {
              const _dtVal = inputEndtime.value.trim();
              if (_dtVal) {
                const _dtSecs = Math.floor(
                  (Date.now() - new Date(_dtVal).getTime()) / 1000,
                );
                endtime = _dtSecs > 0 ? String(_dtSecs) : "3600";
              } else {
                endtime = "3600";
              }
            } else if (endtime === "other-between") {
              betweenMode = true;
              const _fromVal = inputBetweenFrom.value.trim();
              const _toVal = inputBetweenTo.value.trim();
              betweenFrom = _fromVal ? new Date(_fromVal).toISOString() : null;
              betweenTo = _toVal ? new Date(_toVal).toISOString() : null;
              // endtime is not used when betweenMode is active
              endtime = "inf";
            } else if (endtime === "custom") {
              // Time filtering is not used in custom-selection mode;
              // work() reads config.selectedPageEdits and config.selectedCreations instead.
              endtime = "inf";
            }

            function buildRollbackReason() {
              const sel = selRbReason.value;
              const inp = inputRbReason.value.trim();
              if (sel && inp) return sel + ": " + inp;
              return sel || inp;
            }
            function buildBlockReason() {
              const sel = selBlockReason.value;
              const inp = inputBlockReason.value.trim();
              let reason = "";

              if (sel && inp) {
                reason = sel + ": " + inp;
              } else {
                reason = sel || inp;
              }

              // Build "see also" suffix from selected append-to-summary options
              const seeAlsoParts = [];
              if (chkAbuseFilter.checked)
                seeAlsoParts.push(
                  useIndonesian
                    ? "log penyaring penyalahgunaan untuk pengguna ini"
                    : "the abuse filter log for this user",
                );
              if (chkDeletedContribs.checked)
                seeAlsoParts.push(
                  useIndonesian
                    ? "kontribusi yang dihapus"
                    : "deleted contributions",
                );
              if (seeAlsoParts.length) {
                const seeAlso =
                  (useIndonesian ? "lihat juga " : "see also ") +
                  seeAlsoParts.join(useIndonesian ? " dan " : " and ");
                if (reason) {
                  reason += " (" + seeAlso + ")";
                } else {
                  reason = seeAlso.charAt(0).toUpperCase() + seeAlso.slice(1);
                }
              }

              return reason;
            }
            function buildUnblockReason() {
              return inputUnblockReason.value.trim() || selUnblockReason.value;
            }
            function buildPagedelReason() {
              return inputPagedelReason.value.trim() || selPagedelReason.value;
            }
            function buildProtectReason() {
              return inputProtectReason.value.trim() || selProtectReason.value;
            }
            function buildRevdelReason() {
              return inputRevdelReason.value.trim() || selRevdelReason.value;
            }
            function buildUndeleteReason() {
              return (
                inputUndeleteReason.value.trim() || selUndeleteReason.value
              );
            }
            function buildPagedelProtectRecreationReason() {
              const sel = selPagedelProtectRecreationReason.value;
              const inp = inputPagedelProtectRecreationReason.value.trim();
              if (sel && inp) return sel + ": " + inp;
              return sel || inp;
            }
            function buildProtectRecreationReason() {
              const sel = selProtectRecreationReason.value;
              const inp = inputProtectRecreationReason.value.trim();
              if (sel && inp) return sel + ": " + inp;
              return sel || inp;
            }
            function buildMovePageReason() {
              return (
                inputMovePageReason.value.trim() || selMovePageReason.value
              );
            }
            function buildMoveSandboxReason() {
              return (
                inputMoveSandboxReason.value.trim() ||
                selMoveSandboxReason.value
              );
            }
            // Assembles the wikitext line submitted to Meta-Wiki's Global
            // sysops/Requests page. User mode uses {{LockHide|1=Username}} for
            // registered accounts (per existing usage on Meta steward-request
            // pages — exact parameter syntax not independently confirmed) and a
            // direct contributions URL for IPs, since IPs cannot be locked.
            // Page mode links directly to the target page instead, and opens
            // with "Please delete" rather than "Please block" — exact wikitext
            // conventions for page-deletion requests on this page have not been
            // independently confirmed.
            function buildGSReportLine() {
              const dbname = mw.config.get("wgDBname") || "";
              const siteName = mw.config.get("wgSiteName") || dbname;
              const server = mw.config.get("wgServer") || "";
              const pickedReasons = activeGSReasonChecks()
                .filter(function (c) {
                  return c.chk.checked;
                })
                .map(function (c) {
                  return c.label;
                });
              const details = inputGSDetails.value.trim();
              const pickedReasonsText = pickedReasons.length
                ? pickedReasons.join(". ")
                : "";
              let reasonText = "";
              if (pickedReasonsText && details) {
                reasonText =
                  pickedReasonsText + ". Additional details: " + details;
              } else if (pickedReasonsText) {
                reasonText = pickedReasonsText;
              } else if (details) {
                reasonText = "Additional details: " + details;
              }
              if (reasonText && !/[.!?]$/.test(reasonText)) {
                reasonText += ".";
              }

              if (tenguMode === "page") {
                const pageUrl = server + mw.util.getUrl(targetVal);
                const gsPageType = selGSPageRequestType.value;
                const requestVerb =
                  gsPageType === "protect"
                    ? "Please protect"
                    : gsPageType === "revdel"
                      ? "Please delete revisions from"
                      : "Please delete";
                return (
                  "* " +
                  requestVerb +
                  " [" +
                  pageUrl +
                  " " +
                  targetVal +
                  "] on " +
                  siteName +
                  " (" +
                  dbname +
                  "): " +
                  reasonText +
                  " ~~~~"
                );
              }

              const contribsUrl =
                server + mw.util.getUrl("Special:Contributions/" + targetVal);
              const userLink = isIP
                ? "[" + contribsUrl + " " + targetVal + "]"
                : "{{LockHide|1=" +
                  targetVal +
                  "}} ([" +
                  contribsUrl +
                  " contributions])";
              return (
                "* Please block " +
                userLink +
                " on " +
                siteName +
                " (" +
                dbname +
                "): " +
                reasonText +
                " ~~~~"
              );
            }
            // Assembles the wikitext section submitted to Meta-Wiki's
            // Steward requests/Global page. IP targets are filed as global
            // block requests using {{Luxotool}}; registered accounts are
            // filed as global lock requests using {{LockHide}}, optionally
            // combined with a username-hide request.
            function buildSRGReportLine() {
              const isBlock = isSRGBlockTarget();
              const pickedReasons = activeSRGReasonChecks()
                .filter(function (c) {
                  return c.chk.checked;
                })
                .map(function (c) {
                  return c.label;
                });
              const details = inputSRGDetails.value.trim();
              const pickedReasonsText = pickedReasons.length
                ? pickedReasons.join(". ")
                : "";
              let reasonText = "";
              if (pickedReasonsText && details) {
                reasonText =
                  pickedReasonsText + ". Additional details: " + details;
              } else if (pickedReasonsText) {
                reasonText = pickedReasonsText;
              } else if (details) {
                reasonText = "Additional details: " + details;
              }
              if (reasonText && !/[.!?]$/.test(reasonText)) {
                reasonText += ".";
              }

              if (isBlock) {
                const contribsUrl =
                  (mw.config.get("wgServer") || "") +
                  mw.util.getUrl("Special:Contributions/" + targetVal);
                return (
                  "=== Global block for [" +
                  contribsUrl +
                  " " +
                  targetVal +
                  "] ===\n" +
                  "{{Status}}\n" +
                  "{{Luxotool|1=" +
                  targetVal +
                  "}}\n" +
                  reasonText +
                  " ~~~~"
                );
              }

              const lockTemplate = chkSRGHideUsername.checked
                ? "{{LockHide|1=" + targetVal + "|hide=1}}"
                : "{{LockHide|1=" + targetVal + "}}";
              return (
                "=== Global lock for " +
                targetVal +
                " ===\n" +
                "{{Status}}\n" +
                "* " +
                lockTemplate +
                "\n" +
                reasonText +
                " ~~~~"
              );
            }
            let rdHides = "";
            if (chkRdContent.checked) rdHides += "content|";
            if (chkRdSummary.checked) rdHides += "comment|";
            if (chkRdUsername.checked) rdHides += "user|";

            // Resolve the selected warn template into wikitext before
            // freezing the config object. buildWarnNotice() returns an
            // empty string when no template is selected.
            function buildWarnNotice() {
              if (!chkWarn.checked) return "";
              const sel = selWarnMsg.value;
              if (!sel) return "";
              const extra = inputWarnExtra.value.trim();
              const isFinal = chkWarnFinal.checked;
              // Walk the grouped structure to find the matching entry.
              for (const group of WARN_MESSAGES) {
                if (group.items) {
                  for (const item of group.items) {
                    if (item.value === sel) {
                      return item.buildNotice(targetVal, extra, isFinal);
                    }
                  }
                }
              }
              return "";
            }

            config = {
              mode: tenguMode,
              target: targetVal,
              suffix: suffix,
              isIP: isIP,
              endtime: endtime,
              betweenMode: betweenMode,
              betweenFrom: betweenFrom,
              betweenTo: betweenTo,
              customSelection: selEndtime.value === "custom",
              selectedPageEdits:
                selEndtime.value === "custom" ? customSelectedPageEdits : {},
              selectedCreations:
                selEndtime.value === "custom" ? customSelectedCreations : [],
              rollback: chkRollback.checked,
              rollbackMethod: chkUndo.checked ? "undo" : "rollback",
              rollbackBot: chkBot.checked,
              rollbackShow: chkShow.checked,
              rollbackReason: buildRollbackReason(),
              block: chkBlock.checked,
              blockDur:
                selBlockDur.value === "other"
                  ? inputBlockDur.value.trim()
                  : selBlockDur.value,
              blockReason: buildBlockReason() + suffix,
              blockAnon: chkHardblock.checked,
              blockAuto: !isIP && chkAutoblock.checked,
              blockCreate: chkCreate.checked,
              blockTalk: chkTalk.checked,
              blockMail: chkMail.checked,
              blockHide: chkHidename.checked,
              unblock: chkUnblock.checked && !chkUnblock.disabled,
              unblockReason: buildUnblockReason() + suffix,
              notifyUnblock: chkNotifyUnblock.checked,
              reportGS: chkGS.checked && !chkGS.disabled,
              reportGSLine: buildGSReportLine(),
              reportSRG: chkSRG.checked && !chkSRG.disabled,
              reportSRGKind: isSRGBlockTarget() ? "block" : "lock",
              reportSRGSection: buildSRGReportLine(),
              massdel: chkPagedel.checked,
              massdelTalk: chkPagedelTalk.checked,
              massdelRedirects: chkPagedelRedirects.checked,
              massdelSubpages: chkPagedelSubpages.checked,
              massdelUnlink: chkPagedelUnlink.checked,
              massdelProtectRecreation: chkPagedelProtectRecreation.checked,
              massdelProtectRecreationLevel:
                selPagedelProtectRecreationLevel.value,
              massdelProtectRecreationExpiry:
                selPagedelProtectRecreationExpiry.value === "other"
                  ? inputPagedelProtectRecreationExpiry.value.trim() || "never"
                  : selPagedelProtectRecreationExpiry.value,
              massdelProtectRecreationReason:
                buildPagedelProtectRecreationReason() + suffix,
              massdelReason: buildPagedelReason() + suffix,
              undelete: chkUndelete.checked && !chkUndelete.disabled,
              undeleteReason: buildUndeleteReason() + suffix,
              moveSandbox: chkMoveSandbox.checked && !chkMoveSandbox.disabled,
              moveSandboxMode: selMoveMode.value,
              movePageDest: inputMovePageDest.value.trim(),
              movePageReason: buildMovePageReason() + suffix,
              movePageNoRedirect: chkMovePageNoRedirect.checked,
              movePageTalk: chkMovePageTalk.checked,
              movePageSubpages: chkMovePageSubpages.checked,
              moveSandboxUser: inputMoveSandboxUser.value.trim(),
              moveSandboxSubpage: inputMoveSandboxSubpage.value.trim(),
              moveSandboxDest:
                "User:" +
                inputMoveSandboxUser.value.trim() +
                "/" +
                inputMoveSandboxSubpage.value.trim(),
              moveSandboxTalkDest:
                "User talk:" +
                inputMoveSandboxUser.value.trim() +
                "/" +
                inputMoveSandboxSubpage.value.trim(),
              moveSandboxReason: buildMoveSandboxReason() + suffix,
              moveSandboxNoRedirect: chkMoveSandboxNoRedirect.checked,
              moveSandboxTalk:
                chkMoveSandboxTalk.checked && !chkMoveSandboxTalk.disabled,
              moveSandboxSubpages: chkMoveSandboxSubpages.checked,
              protect: chkProtect.checked,
              protectEdit: selProtectEdit.value,
              protectMove: selProtectMove.value,
              protectUpload: selProtectUpload.value,
              protectExpiry:
                selProtectExpiry.value === "other"
                  ? inputProtectExpiry.value.trim() || "never"
                  : selProtectExpiry.value,
              protectReason: buildProtectReason() + suffix,
              protectTalk: chkProtectTalk.checked,
              protectCascade: chkProtectCascade.checked,
              protectRecreation:
                chkProtectRecreation.checked && !chkProtectRecreation.disabled,
              protectRecreationLevel: selProtectRecreationLevel.value,
              protectRecreationExpiry:
                selProtectRecreationExpiry.value === "other"
                  ? inputProtectRecreationExpiry.value.trim() || "never"
                  : selProtectRecreationExpiry.value,
              protectRecreationReason: buildProtectRecreationReason() + suffix,
              notifyBlock: chkNotifyBlock.checked,
              clearTalkPageBeforeNotify: chkClearTalkPageBeforeNotify.checked,
              notifyDelete: chkNotifyDelete.checked,
              notifyProtect: chkNotifyProtect.checked,
              warn: chkWarn.checked && !!selWarnMsg.value,
              warnNotice: buildWarnNotice(),
              rd: chkRevdel.checked,
              rdHides: rdHides,
              rdReason: buildRevdelReason() + suffix,
              os: chkOversight.checked,
            };

            // Builds a list of every action that will run, based on the
            // frozen config object. Used by the confirmation dialogue so
            // the user can verify their selections before any action runs.
            function buildEnabledFeaturesList() {
              const features = [];
              if (config.rollback) features.push("🔙 Rollback");
              if (config.block) features.push("⛔️ Block");
              if (config.unblock) features.push("🔓 Unblock");
              if (config.warn) features.push("🔔 User warning");
              if (config.reportGS)
                features.push("🚩 Report to Global sysops/Requests");
              if (config.reportSRG)
                features.push("📌 Report to Steward requests/Global");
              if (config.massdel) features.push("🗑️ Page deletion");
              if (config.undelete) features.push("📤 Page undeletion");
              if (config.moveSandbox)
                features.push(
                  config.moveSandboxMode === "movepage"
                    ? "✂️ Move page"
                    : "✂️ Move to user's sandbox",
                );
              if (config.protect) features.push("🛡️ Page protection");
              if (config.protectRecreation)
                features.push("🔏 Protect against recreation");
              if (config.rd) features.push("👁️ Revision deletion");
              return features;
            }

            // Confirmation is now required before every execution, not only
            // for deletion and protection, listing each enabled feature so
            // the user can see exactly what Tengu is about to do.
            const enabledFeatures = buildEnabledFeaturesList();

            // Holds the keydown handler bound below, so the onClose callback
            // can remove it regardless of which path closed the dialogue
            // (Cancel, Confirm and execute, the close button, clicking
            // outside the dialogue, or Escape).
            let handleConfirmKeydown;
            const confirmDlg = createDialog({
              title: "Confirm selected operations",
              icon: "️️⚠️️️",
              child: true,
              onClose: function () {
                document.removeEventListener(
                  "keydown",
                  handleConfirmKeydown,
                  true,
                );
              },
            });

            const warningMsg = document.createElement("p");
            warningMsg.style.margin = "0 0 8px 0";
            warningMsg.innerHTML =
              "Tengu will execute the following operation" +
              (enabledFeatures.length === 1 ? "" : "s") +
              " on <b>" +
              mw.html.escape(config.target) +
              "</b>. Please confirm before proceeding.";
            confirmDlg.body.appendChild(warningMsg);

            const featureList = document.createElement("ul");
            featureList.style.margin = "0 0 4px 0";
            featureList.style.paddingLeft = "20px";
            for (const feature of enabledFeatures) {
              const li = document.createElement("li");
              li.textContent = feature;
              featureList.appendChild(li);
            }
            confirmDlg.body.appendChild(featureList);

            const btnCancelConfirm = makeBtn("Cancel", "quiet");
            btnCancelConfirm.addEventListener("click", function () {
              confirmDlg.overlay.closeHandler();
            });

            const btnProceedConfirm = makeBtn(
              "Confirm and execute",
              "destructive",
            );
            btnProceedConfirm.addEventListener("click", function () {
              confirmDlg.overlay.closeHandler();
              overlay.closeHandler();
              work();
            });

            confirmDlg.footer.appendChild(btnCancelConfirm);
            confirmDlg.footer.appendChild(btnProceedConfirm);

            // Enter confirms, Escape cancels, while this dialogue is open.
            // Registered on document in the capture phase, ahead of
            // whichever element still has focus underneath (e.g. the Start
            // button). Calling preventDefault() here stops that element's
            // default Enter-to-click behaviour, which is what previously
            // caused a second, overlapping confirmation dialogue to appear
            // when a user pressed Enter at this stage.
            handleConfirmKeydown = function (e) {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                btnProceedConfirm.click();
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                confirmDlg.overlay.closeHandler();
              }
            };
            document.addEventListener("keydown", handleConfirmKeydown, true);
          });

          footer.appendChild(btnCancel);
          footer.appendChild(btnStart);

          // --- User rights panel (bottom-left of dialogue footer) ---
          // Build the panel with loading placeholders first; the promise below
          // fills in real values and locks sections the user lacks rights for.
          const rightsPanel = document.createElement("div");
          rightsPanel.className = "tng-rights-panel";

          const rightsTitle = document.createElement("span");
          rightsTitle.className = "tng-rights-title";
          rightsTitle.textContent = "Your rights:";
          rightsPanel.appendChild(rightsTitle);

          function makeRightsBadge(text, state) {
            const b = document.createElement("span");
            b.className = "tng-rights-badge tng-rights-" + state;
            b.textContent = text;
            return b;
          }

          // Local rights (this wiki)
          const localLabel = document.createElement("span");
          localLabel.className = "tng-rights-subtitle";
          localLabel.textContent = "This wiki:";
          rightsPanel.appendChild(localLabel);
          const badgeRollback = makeRightsBadge("Rollback", "loading");
          const badgeSysop = makeRightsBadge("Sysop", "loading");
          rightsPanel.appendChild(badgeRollback);
          rightsPanel.appendChild(badgeSysop);

          // Separator between local and global groups
          const rightsSep = document.createElement("span");
          rightsSep.className = "tng-rights-sep";
          rightsPanel.appendChild(rightsSep);

          // Global rights
          const globalLabel = document.createElement("span");
          globalLabel.className = "tng-rights-subtitle";
          globalLabel.textContent = "Global:";
          rightsPanel.appendChild(globalLabel);
          const badgeGlobalRollback = makeRightsBadge("Rollback", "loading");
          const badgeGlobalSysop = makeRightsBadge("Sysop", "loading");
          const badgeSteward = makeRightsBadge("Steward", "loading");
          rightsPanel.appendChild(badgeGlobalRollback);
          rightsPanel.appendChild(badgeGlobalSysop);
          rightsPanel.appendChild(badgeSteward);

          // Insert before the Cancel button so it sits on the left
          footer.insertBefore(rightsPanel, btnCancel);

          // Resolve both local and global rights, update all badges, and lock
          // any sections the user cannot use based on their local effective rights.
          // (Global rights from CentralAuth are already reflected in userinfo rights,
          // so locking is driven by local rights only.)
          Promise.all([rightsPromise, globalRightsPromise]).then(
            function (results) {
              const info = results[0];
              const globalInfo = results[1];

              const hasRollback = info.rights.indexOf("rollback") !== -1;
              const inSysopGroup = info.groups.indexOf("sysop") !== -1;
              const hasBlock = info.rights.indexOf("block") !== -1;
              const hasDelete = info.rights.indexOf("delete") !== -1;
              const hasProtect = info.rights.indexOf("protect") !== -1;
              const hasRevdel = info.rights.indexOf("deleterevision") !== -1;
              const hasUndelete = info.rights.indexOf("undelete") !== -1;
              // Treat the user as sysop/admin if they are in the sysop group or hold
              // at least the three core admin rights (block, delete, protect).
              const hasSysop =
                inSysopGroup || (hasBlock && hasDelete && hasProtect);

              // Global group membership
              const globalGroups = globalInfo.groups;
              const hasGlobalRollback =
                globalGroups.indexOf("global-rollbacker") !== -1;
              const hasGlobalSysop =
                globalGroups.indexOf("global-sysop") !== -1;
              const isSteward = globalGroups.indexOf("steward") !== -1;

              // Update local badges
              badgeRollback.className =
                "tng-rights-badge tng-rights-" +
                (hasRollback ? "have" : "lack");
              badgeRollback.textContent =
                (hasRollback ? "✔️  " : "❌  ") + "Rollback";

              badgeSysop.className =
                "tng-rights-badge tng-rights-" + (hasSysop ? "have" : "lack");
              badgeSysop.textContent = (hasSysop ? "✔️  " : "❌  ") + "Sysop";

              // Update global badges
              badgeGlobalRollback.className =
                "tng-rights-badge tng-rights-" +
                (hasGlobalRollback ? "have" : "lack");
              badgeGlobalRollback.textContent =
                (hasGlobalRollback ? "✔️  " : "❌  ") + "Rollback";

              badgeGlobalSysop.className =
                "tng-rights-badge tng-rights-" +
                (hasGlobalSysop ? "have" : "lack");
              badgeGlobalSysop.textContent =
                (hasGlobalSysop ? "✔️  " : "❌  ") + "Sysop";

              badgeSteward.className =
                "tng-rights-badge tng-rights-" + (isSteward ? "have" : "lack");
              badgeSteward.textContent =
                (isSteward ? "✔️  " : "❌  ") + "Steward";

              // Store resolved rights so applyModeRestrictions() can re-apply
              // rights-based locks if they fired while page mode was active.
              resolvedRights = {
                hasRollback,
                hasBlock,
                hasDelete,
                hasProtect,
                hasRevdel,
                hasUndelete,
              };

              // If the user lacks the rollback right, automatically switch to undo.
              // The checkbox remains available so users with rollback can still opt in manually.
              if (!hasRollback) {
                chkUndo.checked = true;
              }
              updateBotAvailability();

              if (!hasBlock && tenguMode === "user") {
                lockSection(
                  secBlock,
                  bodyBlock,
                  chkBlock,
                  "you do not have the block right on this wiki.",
                );
                lockSection(
                  secUnblock,
                  bodyUnblock,
                  chkUnblock,
                  "you do not have the block right on this wiki.",
                );
              }

              if (!hasDelete)
                lockSection(
                  secPagedel,
                  bodyPagedel,
                  chkPagedel,
                  "you do not have the delete right on this wiki.",
                );

              if (!hasProtect)
                lockSection(
                  secProtect,
                  bodyProtect,
                  chkProtect,
                  "you do not have the protect right on this wiki.",
                );

              if (!hasRevdel && tenguMode === "user")
                lockSection(
                  secRevdel,
                  bodyRevdel,
                  chkRevdel,
                  "you do not have the deleterevision right on this wiki.",
                );

              if (!hasUndelete) {
                undeleteRightsLocked = true;
                lockSection(
                  secUndelete,
                  bodyUndelete,
                  chkUndelete,
                  "you do not have the undelete right on this wiki.",
                );
              }

              // Enable suppress redirect only when the user holds the suppressredirect right
              // (typically sysops). The checkbox is disabled at construction time and
              // unlocked here once rights are confirmed.
              const hasSuppressRedirect =
                info.rights.indexOf("suppressredirect") !== -1;
              if (hasSuppressRedirect) {
                chkMoveSandboxNoRedirect.checked = true;
                chkMoveSandboxNoRedirect.disabled = false;
                wrapMoveSandboxNoRedirect.style.opacity = "";
                wrapMoveSandboxNoRedirect.style.cursor = "";
                // Also enable the Move page suppress-redirect checkbox.
                chkMovePageNoRedirect.disabled = false;
                wrapMovePageNoRedirect.style.opacity = "";
                wrapMovePageNoRedirect.style.cursor = "";
              }

              // Re-evaluate the start button in case locks changed the checked state
              updateStartBtn();
            },
          );

          function applyPackage(pkgName) {
            const pkg = packages[pkgName] || defaultPackage;
            const isIP = mw.util.isIPAddress(inputTarget.value.trim());

            const trac = pkg.tracingedits || {};
            if (trac.indefregistered && !isIP) {
              selEndtime.value = "inf";
              inputEndtime.classList.add("tng-hidden");
              editGroupBetween.classList.add("tng-hidden");
            } else {
              const dur = String(trac.duration || 3600);
              if (
                [...selEndtime.options].find(function (o) {
                  return o.value === dur;
                })
              ) {
                selEndtime.value = dur;
                inputEndtime.classList.add("tng-hidden");
                editGroupBetween.classList.add("tng-hidden");
              } else {
                selEndtime.value = "other";
                const _pkgDate = new Date(
                  Date.now() - parseInt(dur, 10) * 1000,
                );
                inputEndtime.value = new Date(
                  _pkgDate.getTime() - _pkgDate.getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16);
                inputEndtime.classList.remove("tng-hidden");
                editGroupBetween.classList.add("tng-hidden");
              }
            }

            const rb = pkg.rollback || {};
            if (!chkRollback.disabled) {
              chkRollback.checked = rb.enabled !== false;
              secRollback.classList.toggle(
                "tng-disabled",
                !chkRollback.checked,
              );
              bodyRollback.classList.toggle("tng-hidden", !chkRollback.checked);
              secRollback
                .querySelector(".tng-section-arrow")
                .classList.toggle("tng-arrow-up", chkRollback.checked);
            }
            chkBot.checked = !!rb.bot;
            chkShow.checked = rb.showname !== false;
            // Reset to the appropriate default: undo if the user lacks rollback rights, rollback otherwise.
            chkUndo.checked = !!(resolvedRights && !resolvedRights.hasRollback);
            updateBotAvailability();

            const rbr = rb.reason || "";
            let foundRbr = false;
            for (const opt of selRbReason.options) {
              if (opt.value === rbr) {
                foundRbr = true;
                break;
              }
            }
            if (foundRbr) {
              selRbReason.value = rbr;
              inputRbReason.value = "";
            } else {
              selRbReason.value = "";
              inputRbReason.value = rbr;
            }

            const bl = pkg.block || {};
            if (!chkBlock.disabled) {
              chkBlock.checked = !!bl.enabled;
              secBlock.classList.toggle("tng-disabled", !chkBlock.checked);
              bodyBlock.classList.toggle("tng-hidden", !chkBlock.checked);
              secBlock
                .querySelector(".tng-section-arrow")
                .classList.toggle("tng-arrow-up", chkBlock.checked);
            }
            if (trac.indefregistered && !isIP) {
              selBlockDur.value = "never";
              inputBlockDur.classList.add("tng-hidden");
            } else {
              const bdur = bl.duration || "1 day";
              if (
                [...selBlockDur.options].find(function (o) {
                  return o.value === bdur;
                })
              ) {
                selBlockDur.value = bdur;
                inputBlockDur.classList.add("tng-hidden");
              } else {
                selBlockDur.value = "other";
                inputBlockDur.value = bdur;
                inputBlockDur.classList.remove("tng-hidden");
              }
            }
            updateClearTalkState();

            const br = bl.reason || "";
            let foundBr = false;
            for (const opt of selBlockReason.options) {
              if (opt.value === br) {
                foundBr = true;
                break;
              }
            }
            if (foundBr) {
              selBlockReason.value = br;
              inputBlockReason.value = "";
            } else {
              selBlockReason.value = "";
              inputBlockReason.value = br;
            }

            chkAutoblock.checked = bl.autoblock !== false;
            chkHardblock.checked = !!bl.hardblock;
            chkCreate.checked = bl.create !== false;
            chkTalk.checked = bl.talk !== false;
            chkMail.checked = bl.mail !== false;
            chkHidename.checked = !!bl.hidename;

            const pd = pkg.pagedelete || {};
            if (!chkPagedel.disabled) {
              chkPagedel.checked = !!pd.enabled;
              secPagedel.classList.toggle("tng-disabled", !chkPagedel.checked);
              bodyPagedel.classList.toggle("tng-hidden", !chkPagedel.checked);
              secPagedel
                .querySelector(".tng-section-arrow")
                .classList.toggle("tng-arrow-up", chkPagedel.checked);
            }
            const pdr = pd.reason || "";
            if (
              [...selPagedelReason.options].find(function (o) {
                return o.value === pdr;
              })
            ) {
              selPagedelReason.value = pdr;
              inputPagedelReason.value = "";
            } else {
              inputPagedelReason.value = pdr;
            }
            chkPagedelUnlink.checked = !!pd.unlink;

            // Apply fallback resets to page protection state variables
            const pt = pkg.pageprotection || {};
            if (!chkProtect.disabled) {
              chkProtect.checked = !!pt.enabled;
              secProtect.classList.toggle("tng-disabled", !chkProtect.checked);
              bodyProtect.classList.toggle("tng-hidden", !chkProtect.checked);
              secProtect
                .querySelector(".tng-section-arrow")
                .classList.toggle("tng-arrow-up", chkProtect.checked);
            }
            selProtectEdit.value = pt.edit || "all";
            updateCascadeAvailability();
            selProtectMove.value = pt.move || "all";
            selProtectUpload.value = pt.upload || "all";
            updateUploadAvailability();
            selProtectExpiry.value = pt.expiry || "1 day";
            inputProtectExpiry.value = "";
            inputProtectExpiry.classList.add("tng-hidden");
            // Match the package reason against the reason dropdown's option
            // values, mirroring the pattern already used for rollback,
            // block, page deletion, and revision deletion reasons, rather
            // than always falling back to free text.
            const ptr = pt.reason || "";
            let foundPtr = false;
            for (const opt of selProtectReason.options) {
              if (opt.value === ptr) {
                foundPtr = true;
                break;
              }
            }
            if (foundPtr) {
              selProtectReason.value = ptr;
              inputProtectReason.value = "";
            } else {
              selProtectReason.selectedIndex = 0;
              inputProtectReason.value = ptr;
            }
            chkProtectTalk.checked = !!pt.protectTalk;

            const rd = pkg.revisiondelete || {};
            if (!chkRevdel.disabled) {
              chkRevdel.checked = !!rd.enabled;
              secRevdel.classList.toggle("tng-disabled", !chkRevdel.checked);
              bodyRevdel.classList.toggle("tng-hidden", !chkRevdel.checked);
              secRevdel
                .querySelector(".tng-section-arrow")
                .classList.toggle("tng-arrow-up", chkRevdel.checked);
            }
            chkRdContent.checked = rd.content !== false;
            chkRdSummary.checked = rd.summary !== false;
            chkRdUsername.checked = !!rd.username;
            chkOversight.checked = !!rd.oversight;
            const rdr = rd.reason || "";
            if (
              [...selRevdelReason.options].find(function (o) {
                return o.value === rdr;
              })
            ) {
              selRevdelReason.value = rdr;
              inputRevdelReason.value = "";
            } else {
              inputRevdelReason.value = rdr;
            }

            // Trigger dynamic enforcement check when preset package changes checkboxes
            updateStartBtn();
          }

          // Pre-fills the block section controls from an active block's settings.
          // Called by updateSectionStatus() when the block-info API returns an
          // active block for the current target, so users can modify rather than
          // reconfigure from zero.
          //
          // Relies on MediaWiki's blockinfo usprop returning blockexpiry,
          // blockreason, and blockflags as a pipe-separated flag string
          // (e.g. "nocreate|noemail|nousertalk|autoblock").
          function applyActiveBlockSettings(user) {
            const expiry = user.blockexpiry || "";
            const reason = user.blockreason || "";
            const flags = (user.blockflags || "").split("|");
            const targetIsIP = mw.util.isIPAddress(inputTarget.value.trim());

            // Expiry — map "infinity" to the indefinite option; anything else
            // uses the free-text input so the raw timestamp is shown.
            if (
              expiry === "infinity" ||
              expiry === "infinite" ||
              expiry === "never"
            ) {
              selBlockDur.value = "never";
              inputBlockDur.classList.add("tng-hidden");
            } else if (expiry) {
              selBlockDur.value = "other";
              inputBlockDur.value = expiry;
              inputBlockDur.classList.remove("tng-hidden");
            }
            updateClearTalkState();

            // Reason — match against the dropdown list; fall back to free-text.
            let foundReason = false;
            for (const opt of selBlockReason.options) {
              if (opt.value === reason) {
                foundReason = true;
                break;
              }
            }
            if (foundReason) {
              selBlockReason.value = reason;
              inputBlockReason.value = "";
            } else {
              selBlockReason.value = "";
              inputBlockReason.value = reason;
            }

            // Flags — map each blockflags token to its corresponding checkbox.
            if (targetIsIP) {
              // Absence of "anononly" means the block affects logged-in users too (hardblock).
              chkHardblock.checked = !flags.includes("anononly");
            } else {
              chkAutoblock.checked = flags.includes("autoblock");
            }
            chkCreate.checked = flags.includes("nocreate");
            chkTalk.checked = flags.includes("nousertalk");
            chkMail.checked = flags.includes("noemail");
            chkHidename.checked = flags.includes("hiddenname");
          }

          // Pre-fills the page protection controls from currently active protection.
          // Called by updateSectionStatus() in page mode when the info API returns
          // active protections for the current target, so users can modify rather
          // than reconfigure from zero.
          //
          // `active` is the filtered protection array from prop=info&inprop=protection
          // (entries with level !== "all"). Each entry has type, level, expiry, and
          // optionally a cascade flag.
          function applyActiveProtectionSettings(active) {
            const editEntry = active.find(function (p) {
              return p.type === "edit";
            });
            const moveEntry = active.find(function (p) {
              return p.type === "move";
            });
            const uploadEntry = active.find(function (p) {
              return p.type === "upload";
            });

            // Edit and move restriction levels.
            if (editEntry) selProtectEdit.value = editEntry.level || "all";
            if (moveEntry) selProtectMove.value = moveEntry.level || "all";
            // Upload restriction level. Only meaningful for file pages; the control's
            // enabled state is governed separately by updateUploadAvailability().
            if (uploadEntry)
              selProtectUpload.value = uploadEntry.level || "all";

            // Re-evaluate cascade availability after updating the edit level.
            updateCascadeAvailability();

            // Cascade — only applicable when edit restriction is sysop-level.
            const hasCascade = active.some(function (p) {
              return !!p.cascade;
            });
            if (selProtectEdit.value === "sysop") {
              chkProtectCascade.checked = hasCascade;
            }

            // Expiry — use the edit entry first, fall back to move entry.
            // "infinity" maps to the indefinite option; anything else uses the
            // free-text input so the raw timestamp is shown for reference.
            const expiryEntry = editEntry || moveEntry;
            if (expiryEntry) {
              const expiry = expiryEntry.expiry || "";
              if (!expiry || expiry === "infinity" || expiry === "infinite") {
                selProtectExpiry.value = "never";
                inputProtectExpiry.classList.add("tng-hidden");
              } else {
                selProtectExpiry.value = "other";
                inputProtectExpiry.value = expiry;
                inputProtectExpiry.classList.remove("tng-hidden");
              }
            }
          }

          // Fetches and renders a brief status note for the block, page deletion,
          // and page protection sections based on the current target and mode.
          // Called on target change and when mode is toggled.
          function updateSectionStatus() {
            const target = inputTarget.value.trim();

            function fmtStatusDate(ts) {
              if (!ts) return "unknown";
              if (ts === "infinity" || ts === "infinite" || ts === "never")
                return "Indefinite";
              const d = new Date(ts);
              if (isNaN(d.getTime())) return "Indefinite";
              return d.toUTCString().replace("GMT", "UTC");
            }

            function setNote(el, cls, text) {
              el.className = "tng-status-note tng-status-note-" + cls;
              el.textContent = text;
            }

            if (!target) {
              setNote(
                divBlockStatus,
                "loading",
                "Enter a target to see block status.",
              );
              setNote(
                divGlobalStatus,
                "loading",
                "Enter a target to see global status.",
              );
              setNote(
                divPagedelStatus,
                "loading",
                "Enter a target to see deletion history.",
              );
              setNote(
                divProtectStatus,
                "loading",
                "Enter a target to see protection status.",
              );
              setNote(
                divUndeleteStatus,
                "loading",
                "Enter a target to see deletion history.",
              );
              if (!undeleteRightsLocked) {
                applyUndeleteStatusLock(true, "no target has been specified.");
              }
              applyUnblockStatusLock(true, "no target has been specified.");
              setNote(
                divGSStatus,
                "loading",
                "Enter a target to see global sysops eligibility.",
              );
              applyGSStatusLock(true, "no target has been specified.");
              return;
            }

            // --- Global sysops report eligibility (available in both user and page mode) ---
            if (isTargetSpecialPage()) {
              setNote(
                divGSStatus,
                "loading",
                "Not applicable — special pages cannot be reported.",
              );
              // Already padlock-locked via applySpecialPageLocks()/applyModeLock(),
              // called before updateSectionStatus() on every target change.
            } else if (!gsScopeInfo) {
              setNote(
                divGSStatus,
                "loading",
                "Checking global sysops eligibility for this wiki...",
              );
              applyGSStatusLock(
                true,
                "checking global sysops eligibility for this wiki.",
              );
            } else if (gsScopeInfo.inScope) {
              setNote(
                divGSStatus,
                gsScopeInfo.resolved ? "inactive" : "loading",
                gsScopeInfo.resolved
                  ? "This wiki appears to be within the scope of the global sysops service."
                  : "Could not confirm global sysops eligibility for this wiki; reporting remains available.",
              );
              applyGSStatusLock(false);
            } else {
              setNote(
                divGSStatus,
                "active",
                "This wiki appears to be outside the scope of the global sysops service.",
              );
              applyGSStatusLock(
                true,
                "this wiki is outside the scope of the global sysops service.",
              );
            }

            if (tenguMode === "user") {
              const isTargetIP = mw.util.isIPAddress(target);
              setNote(
                divPagedelStatus,
                "loading",
                "Deletion history is only available in page mode.",
              );
              setNote(
                divProtectStatus,
                "loading",
                "Protection status is only available in page mode.",
              );
              setNote(
                divUndeleteStatus,
                "loading",
                "Deletion history is only available in page mode.",
              );
              if (!undeleteRightsLocked) {
                applyUndeleteStatusLock(true, "not applicable in user mode.");
              }

              // --- Block status ---
              setNote(divBlockStatus, "loading", "Loading block status...");
              // Keep this as "loading" so admins don't see a flashing permission error
              applyUnblockStatusLock(true, "block status is still loading");

              (async function () {
                try {
                  const [data, myInfo] = await Promise.all([
                    apiGet({
                      action: "query",
                      list: "users",
                      usprop: "blockinfo",
                      ususers: target,
                    }),
                    rightsPromise,
                  ]);

                  const user =
                    data.query && data.query.users && data.query.users[0];
                  const hasBlockRights = myInfo.rights.includes("block");

                  if (user && user.blockedby) {
                    const expiry =
                      user.blockexpiry === "infinity"
                        ? "indefinite"
                        : fmtStatusDate(user.blockexpiry);
                    const blockType =
                      user.blockpartial !== undefined ? "partial" : "full";

                    setNote(
                      divBlockStatus,
                      "active",
                      "Currently blocked (" +
                        blockType +
                        ") · Blocked by: " +
                        user.blockedby +
                        " · Expires: " +
                        expiry +
                        " · Reason: " +
                        (user.blockreason || "(no reason given)"),
                    );

                    // Pre-fill block controls with the active block's settings.
                    applyActiveBlockSettings(user);

                    if (hasBlockRights) {
                      applyUnblockStatusLock(false);
                    } else {
                      // Lock explicitly for lack of rights (Unblock scenario)
                      applyUnblockStatusLock(
                        true,
                        "you do not have the block right on this wiki.",
                      );
                    }
                  } else {
                    // Not currently blocked
                    if (!hasBlockRights) {
                      // Lock explicitly for lack of rights (Block scenario)
                      applyUnblockStatusLock(
                        true,
                        "you do not have the block right on this wiki.",
                      );
                    } else {
                      applyUnblockStatusLock(
                        true,
                        "this account is not currently blocked.",
                      );
                    }

                    try {
                      const logData = await apiGet({
                        action: "query",
                        list: "logevents",
                        letype: "block",
                        letitle: "User:" + target,
                        lelimit: 1,
                        leprop: "user|timestamp|comment",
                      });
                      const entries =
                        (logData.query && logData.query.logevents) || [];
                      if (entries.length) {
                        const e = entries[0];
                        setNote(
                          divBlockStatus,
                          "inactive",
                          "Not currently blocked. Last block action: " +
                            fmtStatusDate(e.timestamp) +
                            " by " +
                            (e.user || "—") +
                            " · Reason: " +
                            (e.comment || "(no reason given)"),
                        );
                      } else {
                        setNote(
                          divBlockStatus,
                          "inactive",
                          "Not currently blocked. No block history found.",
                        );
                      }
                    } catch (e2) {
                      setNote(
                        divBlockStatus,
                        "inactive",
                        "Not currently blocked. (Block history unavailable.)",
                      );
                    }
                  }
                } catch (e) {
                  setNote(
                    divBlockStatus,
                    "error",
                    "Could not load block status.",
                  );
                  applyUnblockStatusLock(true, "could not fetch block status");
                }
              })();

              // --- Global lock / block status ---
              setNote(
                divGlobalStatus,
                "loading",
                isTargetIP
                  ? "Loading global block status..."
                  : "Loading global lock / block status...",
              );
              (async function () {
                try {
                  if (isTargetIP) {
                    // IP addresses — global block check only (bgip also catches active range blocks)
                    const data = await apiGet({
                      action: "query",
                      list: "globalblocks",
                      bgip: target,
                      bglimit: 1,
                      bgprop: "address|by|expiry|reason",
                    });
                    const blocks =
                      (data.query && data.query.globalblocks) || [];
                    if (blocks.length) {
                      const b = blocks[0];
                      const expiry =
                        !b.expiry || b.expiry === "infinity"
                          ? "indefinite"
                          : fmtStatusDate(b.expiry);
                      setNote(
                        divGlobalStatus,
                        "active",
                        "Globally blocked · Blocked by: " +
                          (b.by || "—") +
                          " · Expires: " +
                          expiry +
                          " · Reason: " +
                          (b.reason || "(no reason given)"),
                      );
                    } else {
                      setNote(
                        divGlobalStatus,
                        "inactive",
                        "No active global block.",
                      );
                    }
                  } else {
                    // Registered accounts — check global lock and global block in parallel
                    const [lockData, blockData] = await Promise.all([
                      apiGet({
                        action: "query",
                        meta: "globaluserinfo",
                        guiuser: target,
                      }),
                      apiGet({
                        action: "query",
                        list: "globalblocks",
                        bgtargets: target,
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
                    if (!gui || gui.missing !== undefined) {
                      setNote(
                        divGlobalStatus,
                        "loading",
                        "No global account found.",
                      );
                    } else if (isLocked && isGlobalBlocked) {
                      const b = blocks[0];
                      const expiry =
                        !b.expiry || b.expiry === "infinity"
                          ? "indefinite"
                          : fmtStatusDate(b.expiry);
                      setNote(
                        divGlobalStatus,
                        "active",
                        "Globally locked and globally blocked · Blocked by: " +
                          (b.by || "—") +
                          " · Expires: " +
                          expiry +
                          " · Reason: " +
                          (b.reason || "(no reason given)"),
                      );
                    } else if (isLocked) {
                      setNote(
                        divGlobalStatus,
                        "active",
                        "Account is globally locked.",
                      );
                    } else if (isGlobalBlocked) {
                      const b = blocks[0];
                      const expiry =
                        !b.expiry || b.expiry === "infinity"
                          ? "indefinite"
                          : fmtStatusDate(b.expiry);
                      setNote(
                        divGlobalStatus,
                        "active",
                        "Globally blocked · Blocked by: " +
                          (b.by || "—") +
                          " · Expires: " +
                          expiry +
                          " · Reason: " +
                          (b.reason || "(no reason given)"),
                      );
                    } else {
                      setNote(
                        divGlobalStatus,
                        "inactive",
                        "No global lock or global block.",
                      );
                    }
                  }
                } catch (e) {
                  setNote(
                    divGlobalStatus,
                    "loading",
                    isTargetIP
                      ? "Could not load global block status."
                      : "Could not load global lock / block status.",
                  );
                }
              })();
            } else {
              // Page mode
              setNote(
                divBlockStatus,
                "loading",
                "Not applicable in page mode.",
              );
              setNote(
                divGlobalStatus,
                "loading",
                "Not applicable in page mode.",
              );

              // Special pages have no deletion or protection history worth querying
              if (isTargetSpecialPage()) {
                setNote(
                  divPagedelStatus,
                  "loading",
                  "Not applicable — special pages cannot be deleted.",
                );
                setNote(
                  divProtectStatus,
                  "loading",
                  "Not applicable — special pages cannot be protected.",
                );
                setNote(
                  divUndeleteStatus,
                  "loading",
                  "Not applicable — special pages cannot be undeleted.",
                );
                // Already padlock-locked via applySpecialPageLocks()/applyModeLock(),
                // called before updateSectionStatus() on every target change; no
                // further action needed here besides the status notes above.
                return;
              }

              // --- Deletion history (also drives page undeletion availability) ---
              setNote(
                divPagedelStatus,
                "loading",
                "Loading deletion history...",
              );
              if (!undeleteRightsLocked) {
                setNote(
                  divUndeleteStatus,
                  "loading",
                  "Loading deletion history...",
                );
                applyUndeleteStatusLock(
                  true,
                  "deletion history is still loading",
                );
              }
              (async function () {
                try {
                  const logData = await apiGet({
                    action: "query",
                    list: "logevents",
                    letype: "delete",
                    letitle: target,
                    lelimit: 1,
                    leprop: "user|timestamp|comment",
                  });
                  const entries =
                    (logData.query && logData.query.logevents) || [];
                  if (entries.length) {
                    const e = entries[0];
                    setNote(
                      divPagedelStatus,
                      "active",
                      "Previously deleted. Most recent action: " +
                        (e.action || "delete") +
                        " on " +
                        fmtStatusDate(e.timestamp) +
                        " by " +
                        (e.user || "—") +
                        " · Reason: " +
                        (e.comment || "(no reason given)"),
                    );
                    if (!undeleteRightsLocked) {
                      applyUndeleteStatusLock(false);
                      setNote(
                        divUndeleteStatus,
                        "active",
                        "This page has previous deletion log entries and can be restored.",
                      );
                    }
                  } else {
                    setNote(
                      divPagedelStatus,
                      "inactive",
                      "No prior deletion history found.",
                    );
                    if (!undeleteRightsLocked) {
                      applyUndeleteStatusLock(
                        true,
                        "this page has no deletion log entries.",
                      );
                      setNote(
                        divUndeleteStatus,
                        "inactive",
                        "This page has no deletion log entries and cannot be restored.",
                      );
                    }
                  }
                } catch (e) {
                  setNote(
                    divPagedelStatus,
                    "loading",
                    "Could not load deletion history.",
                  );
                  if (!undeleteRightsLocked) {
                    setNote(
                      divUndeleteStatus,
                      "loading",
                      "Could not load deletion history.",
                    );
                  }
                }
              })();

              // Reset recreation-protection controls synchronously on every target change.
              // The async call below re-enables them only if the page is confirmed to be missing.
              applyProtectRecreationStatusLock(
                true,
                "page existence has not yet been confirmed",
              );
              selProtectRecreationLevel.disabled = true;
              selProtectRecreationExpiry.disabled = true;
              inputProtectRecreationExpiry.disabled = true;
              rowProtectRecreationLevel.style.opacity = "0.5";
              rowProtectRecreationExpiry.style.opacity = "0.5";

              // Upload restriction availability can be determined from the title
              // alone, so re-evaluate synchronously rather than waiting on the API.
              updateUploadAvailability();

              // --- Protection status ---
              setNote(
                divProtectStatus,
                "loading",
                "Loading protection status...",
              );
              (async function () {
                try {
                  const data = await apiGet({
                    action: "query",
                    prop: "info",
                    inprop: "protection",
                    titles: target,
                    formatversion: 2,
                  });
                  const pages = data.query && data.query.pages;
                  const page = pages && pages[0];
                  const pageIsMissing = !!(page && page.missing);
                  const protection = (page && page.protection) || [];
                  // Entries with level "all" indicate an explicitly unprotected type; exclude them.
                  const active = protection.filter(function (p) {
                    return p.level && p.level !== "all";
                  });

                  // Enable recreation-protection controls only when the page is confirmed missing.
                  // The synchronous reset above this IIFE already locks them for the existing-page
                  // case, but an explicit else branch is kept here to handle any out-of-order resolution.
                  if (pageIsMissing) {
                    applyProtectRecreationStatusLock(false);
                    hdrProtectRecreation.title =
                      "When ticked, the page will be protected against recreation using create-level protection.";
                  } else {
                    applyProtectRecreationStatusLock(
                      true,
                      "the target page exists.",
                    );
                    selProtectRecreationLevel.disabled = true;
                    selProtectRecreationExpiry.disabled = true;
                    inputProtectRecreationExpiry.disabled = true;
                    rowProtectRecreationLevel.style.opacity = "0.5";
                    rowProtectRecreationExpiry.style.opacity = "0.5";
                  }

                  if (active.length) {
                    const parts = active.map(function (p) {
                      const expiry =
                        !p.expiry || p.expiry === "infinity"
                          ? "indefinite"
                          : fmtStatusDate(p.expiry);
                      return (
                        p.type + ": " + p.level + " (expires " + expiry + ")"
                      );
                    });
                    setNote(
                      divProtectStatus,
                      "active",
                      "Currently protected · " + parts.join(" · "),
                    );
                    // Pre-fill protection controls with the active protection settings.
                    applyActiveProtectionSettings(active);
                  } else {
                    // Not currently protected — check most recent protection log entry
                    try {
                      const logData = await apiGet({
                        action: "query",
                        list: "logevents",
                        letype: "protect",
                        letitle: target,
                        lelimit: 1,
                        leprop: "user|timestamp|comment",
                      });
                      const entries =
                        (logData.query && logData.query.logevents) || [];
                      if (entries.length) {
                        const e = entries[0];
                        setNote(
                          divProtectStatus,
                          "inactive",
                          "Not currently protected. Last protection action: " +
                            fmtStatusDate(e.timestamp) +
                            " by " +
                            (e.user || "—") +
                            ".",
                        );
                      } else {
                        setNote(
                          divProtectStatus,
                          "inactive",
                          "Not currently protected. No prior protection history found.",
                        );
                      }
                    } catch (e2) {
                      setNote(
                        divProtectStatus,
                        "inactive",
                        "Not currently protected. (Protection history unavailable.)",
                      );
                    }
                  }
                } catch (e) {
                  setNote(
                    divProtectStatus,
                    "loading",
                    "Could not load protection status.",
                  );
                }
              })();
            }
          }

          inputTarget.addEventListener("change", function () {
            applyPackage(selPackage.value);
            const targetVal = inputTarget.value.trim();
            const isIP = mw.util.isIPAddress(targetVal);
            const isTempAccount = /^~\d{4}-\d+-\d+$/.test(targetVal);
            wrapHardblock.style.display = isIP ? "" : "none";
            wrapAutoblock.style.display = isIP ? "none" : "";
            updateSRGFormForTarget();
            if (isTempAccount) {
              selBlockDur.value = "3 months";
              inputBlockDur.classList.add("tng-hidden");
            }
            // Re-evaluate special page restriction when the target changes in page mode
            if (tenguMode === "page") {
              const targetIsSpecial = isTargetSpecialPage();
              applySpecialPageLocks(targetIsSpecial);
              updateModeNotice(false, targetIsSpecial);
            }
            // Auto-fill subpage name with the page title (without namespace)
            if (tenguMode === "page" && targetVal) {
              try {
                inputMoveSandboxSubpage.value = new mw.Title(targetVal)
                  .getMain()
                  .replace(/_/g, " ");
              } catch (e) {
                // Title could not be parsed; leave the subpage field as-is
              }
            }
            // Re-fetch the page creator when the target changes and the
            // same-as-creator option is active.
            if (tenguMode === "page" && chkMoveSandboxSameAsCreator.checked) {
              fetchAndApplyPageCreator();
            }
            // Re-evaluate talk page availability for the move sandbox section.
            if (tenguMode === "page") {
              updateMoveSandboxTalkAvailability();
            }
            updateUploadAvailability();
            updateSectionStatus();
          });

          selPackage.addEventListener("change", function () {
            applyPackage(selPackage.value);
          });
          const defaultPkgName =
            aioConf.default_package && packages[aioConf.default_package]
              ? aioConf.default_package
              : "Default";
          selPackage.value = defaultPkgName;
          applyPackage(defaultPkgName);
          inputTarget.value =
            tenguMode === "user"
              ? mw.config.get("wgRelevantUserName") || ""
              : mw.config.get("wgPageName").replace(/_/g, " ");
          btnGetInfo.disabled = !inputTarget.value.trim();
          btnExportEdits.disabled =
            !inputTarget.value.trim() || tenguMode !== "user";
          inputTarget.dispatchEvent(new Event("change"));

          // Perform initial check on modal framework launch
          updateStartBtn();
          inputTarget.focus();
        };

        // ============================================================================
        // [Section 10] Portlet link
        // Registers the execution menu item anchor inside the site actions portal drop list.
        // ============================================================================
        $(
          mw.util.addPortletLink(
            "p-cactions",
            "#",
            "⛩️ Tengu",
            "ca-tengu",
            "Open Tengu, your all-in-one moderation tools",
          ),
        ).on("click", function (e) {
          e.preventDefault();
          inited = false;
          init();
        });
      });
  });
});
// </nowiki>
