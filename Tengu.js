/**
 * ============================================================================
 * Tengu — 天狗
 * Version 2.147.2
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
        const LOCK_ACCOUNT_REASONS = tenguReasonsObj.LOCK_ACCOUNT_REASONS;
        const FIXREDIRECTS_REASONS = tenguReasonsObj.FIXREDIRECTS_REASONS;

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
        let escListenerBound = false; // Escape key listener registered once on first overlay
        // Stores progress state when the user aborts a run so work() can resume
        // from where it stopped without repeating completed steps.
        let resumeState = null;

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
          // Locked sections can still be expanded to view their disabled controls;
          // only the enable checkbox itself is non-interactive when locked.
          hdr.addEventListener("click", function (e) {
            if (chkWrap.contains(e.target)) return;
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

        // Compares two revisions' content via their SHA-1 hashes, used by
        // runQuickRevert() (Section 09b) to confirm whether a rollback/undo
        // actually restored the target revision's exact content. Returns
        // true/false when both hashes are available, or null when this
        // cannot be determined (e.g. revision-deleted content).
        // SHA-1 equality is treated as equivalent to identical
        // page content; this has not been independently verified against a
        // live wiki for every content model.
        async function revisionsContentIdentical(revIdA, revIdB) {
          if (!revIdA || !revIdB) return null;
          if (revIdA === revIdB) return true;
          try {
            const data = await apiGet({
              action: "query",
              prop: "revisions",
              revids: revIdA + "|" + revIdB,
              rvprop: "ids|sha1",
              formatversion: 2,
            });
            const pages = (data.query && data.query.pages) || [];
            const shaById = {};
            pages.forEach(function (p) {
              (p.revisions || []).forEach(function (r) {
                shaById[r.revid] = r.sha1;
              });
            });
            if (!shaById[revIdA] || !shaById[revIdB]) return null;
            return shaById[revIdA] === shaById[revIdB];
          } catch (e) {
            return null;
          }
        }

        // Builds the shared rollback/undo/restore edit summary. Used by the main
        // Rollback section in work() and by the inline "⛩️ rollback", "⛩️ undo",
        // and "⛩️ restore this revision" actions (Section 09b), so all entry points
        // produce identical wording for a given action type.
        //
        // variant distinguishes the three action types, since each uses a
        // different verb:
        //   "rollback" (default) — "Reverted [[Special:Diff/X|edit]] by [user]"
        //   "undo"               — "Undid [[Special:Diff/X|edit]] by [user]"
        //   "restore"            — "Restored to the [[Special:Diff/X|revision]] by [user]"
        function buildQuickRevertSummaryText(
          targetUser,
          diffLinkTarget,
          reason,
          showUsername,
          previousEditorUser,
          variant,
        ) {
          if (variant === "restore") {
            if (reason) {
              return useIndonesian
                ? `Dikembalikan ke [[Special:Diff/${diffLinkTarget}|revisi]] oleh ${targetUser}: ${reason}`
                : `Restored to the [[Special:Diff/${diffLinkTarget}|revision]] by ${targetUser}: ${reason}`;
            }
            if (!showUsername || !targetUser) {
              return useIndonesian
                ? `Dikembalikan ke [[Special:Diff/${diffLinkTarget}|revisi]]`
                : `Restored to the [[Special:Diff/${diffLinkTarget}|revision]]`;
            }
            return useIndonesian
              ? `Dikembalikan ke [[Special:Diff/${diffLinkTarget}|revisi]] oleh ${targetUser}`
              : `Restored to the [[Special:Diff/${diffLinkTarget}|revision]] by ${targetUser}`;
          }

          const isUndo = variant === "undo";
          const verbEn = isUndo ? "Undid" : "Reverted";
          const verbId = isUndo ? "Membatalkan" : "Membalikkan";

          if (reason) {
            return useIndonesian
              ? `${verbId} [[Special:Diff/${diffLinkTarget}|suntingan]] oleh ${targetUser}: ${reason}`
              : `${verbEn} [[Special:Diff/${diffLinkTarget}|edit]] by ${targetUser}: ${reason}`;
          }
          if (!showUsername) {
            return useIndonesian
              ? `${verbId} [[Special:Diff/${diffLinkTarget}|suntingan]]`
              : `${verbEn} [[Special:Diff/${diffLinkTarget}|edit]]`;
          }
          if (previousEditorUser) {
            return useIndonesian
              ? `${verbId} [[Special:Diff/${diffLinkTarget}|suntingan]] oleh ${targetUser} ke revisi sebelumnya oleh ${previousEditorUser}`
              : `${verbEn} [[Special:Diff/${diffLinkTarget}|edit]] by ${targetUser} to the previous revision by ${previousEditorUser}`;
          }
          return useIndonesian
            ? `${verbId} [[Special:Diff/${diffLinkTarget}|suntingan]] oleh ${targetUser}`
            : `${verbEn} [[Special:Diff/${diffLinkTarget}|edit]] by ${targetUser}`;
        }

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

        // Cache of localised redirect magic word aliases (e.g. "#REDIRECT",
        // "#ALIH"), fetched once via siprop=magicwords and reused for the
        // rest of the session. Falls back to the English "#REDIRECT" alias
        // alone if the request fails or the wiki's "redirect" magic word
        // entry has no aliases, so double-redirect fixing keeps working even
        // when this cannot be determined.
        let redirectMagicWordsPromise = null;
        function getRedirectMagicWords() {
          if (!redirectMagicWordsPromise) {
            redirectMagicWordsPromise = apiGet({
              action: "query",
              meta: "siteinfo",
              siprop: "magicwords",
              formatversion: 2,
            })
              .then(function (data) {
                const words = (data.query && data.query.magicwords) || [];
                const redirectWord = words.find(function (w) {
                  return w.name === "redirect";
                });
                return redirectWord &&
                  redirectWord.aliases &&
                  redirectWord.aliases.length
                  ? redirectWord.aliases
                  : ["#REDIRECT"];
              })
              .catch(function () {
                return ["#REDIRECT"];
              });
          }
          return redirectMagicWordsPromise;
        }

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

        // Derives an interwiki prefix (project + language, e.g. "w:id:" or
        // "wikt:ja:") for the current wiki from its hostname, used to build
        // interwiki links and {{LockHide}} project parameters in reports
        // submitted to Meta-Wiki. [Inference] This mapping covers common
        // Wikimedia project subdomain patterns (Wikipedia, Wiktionary,
        // Wikibooks, Wikinews, Wikiquote, Wikisource, Wikiversity, Wikivoyage)
        // and a handful of language-independent sister projects (Commons,
        // Wikidata, Meta, Wikispecies, Incubator), but has not been
        // independently confirmed against every Wikimedia project's actual
        // interwiki table. Returns an empty string if no mapping is found,
        // in which case callers fall back to a plain, non-prefixed link.
        function getInterwikiPrefix() {
          const server = (mw.config.get("wgServer") || "").replace(
            /^(?:https?:)?\/\//,
            "",
          );
          const SISTER_PROJECT_PREFIXES = {
            wikipedia: "w",
            wiktionary: "wikt",
            wikibooks: "b",
            wikinews: "n",
            wikiquote: "q",
            wikisource: "s",
            wikiversity: "v",
            wikivoyage: "voy",
          };
          const NO_LANG_HOSTS = {
            "commons.wikimedia.org": "c:",
            "www.wikidata.org": "d:",
            "meta.wikimedia.org": "m:",
            "species.wikimedia.org": "species:",
            "incubator.wikimedia.org": "incubator:",
            "www.wikifunctions.org": "f:",
            "www.mediawiki.org": "mw:",
            "foundation.wikimedia.org": "foundation:",
            "outreach.wikimedia.org": "outreach:",
            "wikimania.wikimedia.org": "wikimania:",
            "wikitech.wikimedia.org": "wikitech:",
          };
          if (NO_LANG_HOSTS[server]) return NO_LANG_HOSTS[server];

          const hostParts = server.split(".");
          if (hostParts.length >= 3 && SISTER_PROJECT_PREFIXES[hostParts[1]]) {
            return (
              SISTER_PROJECT_PREFIXES[hostParts[1]] + ":" + hostParts[0] + ":"
            );
          }
          return "";
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
          targets,
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

          // Check every target in a multi-target report, not just the
          // primary one, so a secondary target with an already-open report
          // is also caught rather than being silently re-filed.
          const targetList = Array.isArray(targets) ? targets : [targets];
          for (const target of targetList) {
            const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const dupRe = new RegExp(
              "\\{\\{(?:Status|LockHide|MultiLock|Luxotool)[^}]*\\b" +
                escapedTarget +
                "\\b",
              "i",
            );
            if (dupRe.test(content)) {
              throw new Error(
                "a report for " +
                  target +
                  " already appears to be open on Steward requests/Global",
              );
            }
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

          // Resume state — carries phase-completion flags, processed-item sets, and
          // cached contribution data across abort/resume cycles. On a fresh run all
          // flags are false and all collections are empty. On a resume run the values
          // from the aborted run are reused so already-completed work is skipped.
          const isMultiTarget =
            Array.isArray(config.targets) && config.targets.length > 1;
          // Resume is only supported for single-target runs.
          const isResume = !isMultiTarget && !!resumeState;
          // Accumulates creator → deleted page titles across all targets when
          // multi-target page mode is active, so a creator who had multiple
          // target pages deleted receives one consolidated notification instead
          // of one notification per page.
          const multiTargetCreatorMap = new Map();
          const rs = isResume
            ? resumeState
            : {
                // Single-shot phase completion flags
                warnDone: false,
                blockDone: false,
                unblockDone: false,
                lockAccountDone: false,
                reportGSDone: false,
                reportSRGDone: false,
                undeleteDone: false,
                moveSandboxDone: false,
                // Loop and notification-dispatch completion flags
                rollbackLoopDone: false,
                notifyRollbackDone: false,
                mainProtectLoopDone: false,
                notifyProtectDone: false,
                deletionLoopDone: false,
                notifyDeleteUserDone: false,
                notifyDeletePageDone: false,
                protectRecreationDone: false,
                secondProtectDone: false,
                unlinkLoopDone: false,
                fixRedirectsDone: false,
                // Per-title sets for resumable loops
                processedRollbackTitles: new Set(),
                processedDeletionTitles: new Set(),
                processedUnlinkTitles: new Set(),
                processedFixRedirectsTitles: new Set(),
                // Contribution data cached after the first fetch; reused on resume
                pageEditsCache: null,
                creationCache: null,
                pagesToProtectCache: null,
                pagesToProtectAfterDelCache: null,
                // Accumulated results carried across abort/resume cycles
                deletedTitles: [],
                rollbackNotifiedTitles: [],
                creatorMap: new Map(),
                notifyQueue: new Map(),
              };
          // Consume the global resumeState so it is not inadvertently reused.
          // A new value is stored only if this run is aborted part-way through.
          resumeState = null;

          const stats = {
            block: 0,
            unblock: 0,
            lockAccount: 0,
            rollback: 0,
            revdel: 0,
            delete: 0,
            undelete: 0,
            move: 0,
            protect: 0,
            unlink: 0,
            redirfix: 0,
            report: 0,
            error: 0,
          };
          const toolTag = " · [[w:id:Pengguna:Rachmat04/Tengu.js|⛩️]]";
          // Inter-request throttle delay (ms). Applied after each write API call
          // to spread requests out and reduce the risk of hitting the wiki's rate
          // limits during large batch operations. Centralised here so the value
          // can be adjusted in one place.
          const THROTTLE_MS = 50;

          // Builds a concise, natural-language summary of completed actions,
          // including only the operations that actually occurred (non-zero
          // counts). Used once at the end of a run, replacing the previous
          // running summary line shown throughout processing.
          const buildCompletionSummary = function (
            statsObj,
            aborted,
            revertMethodTxt,
          ) {
            const parts = [];
            const add = function (count, singular, plural) {
              if (count > 0)
                parts.push(count + " " + (count === 1 ? singular : plural));
            };
            add(
              statsObj.rollback,
              "edit " + revertMethodTxt,
              "edits " + revertMethodTxt,
            );
            add(statsObj.delete, "page deleted", "pages deleted");
            add(statsObj.undelete, "page undeleted", "pages undeleted");
            add(statsObj.move, "page moved", "pages moved");
            add(statsObj.unlink, "link removed", "links removed");
            add(statsObj.redirfix, "redirect fixed", "redirects fixed");
            add(statsObj.protect, "page protected", "pages protected");
            add(statsObj.revdel, "revision hidden", "revisions hidden");
            add(statsObj.report, "report filed", "reports filed");
            add(statsObj.lockAccount, "account locked", "accounts locked");
            add(statsObj.block, "account blocked", "accounts blocked");
            add(statsObj.unblock, "account unblocked", "accounts unblocked");
            add(statsObj.error, "error", "errors");

            if (!parts.length) {
              return aborted
                ? "Aborted: no operations completed."
                : "Completed: no operations performed.";
            }
            const joined =
              parts.length === 1
                ? parts[0]
                : parts.length === 2
                  ? parts[0] + " and " + parts[1]
                  : parts.slice(0, -1).join(", ") +
                    ", and " +
                    parts[parts.length - 1];
            return (aborted ? "Aborted: " : "Completed: ") + joined + ".";
          };

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

          // The status line shows only the "Status:" label and the dot
          // loader — no accompanying text. The loader's tng-loader-active
          // class (added/removed below) is what communicates whether a run
          // is in progress; a natural-language summary of completed actions
          // is built once at the end of the run (see buildCompletionSummary())
          // and shown on the separate summary line below.
          const updateStatusDisplay = () => {
            statusTextSpan.innerHTML =
              "<b>Status:</b> " + (isAborted ? "Aborted." : "Processing...");
          };

          // The completion summary is appended directly to this line once
          // the run finishes (e.g. "Status: Completed: 3 pages deleted."),
          // rather than rendering on a separate line below it.
          const statusLbl = document.createElement("div");
          statusLbl.style.cssText =
            "margin-bottom:8px;display:flex;align-items:center;gap:8px;";
          const statusTextSpan = document.createElement("span");
          statusTextSpan.innerHTML = "<b>Status:</b> Processing...";
          statusLbl.appendChild(statusTextSpan);

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
              updateStatusDisplay();
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
          // In multi-target runs, holds the current target name so every log
          // entry is prefixed with it, replacing the old separator elements.
          let currentTargetLabel = "";
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
            const _prefix = currentTargetLabel
              ? "[" + currentTargetLabel + "] "
              : "";
            d.textContent = logCount + ". [" + _ts + "] " + _prefix + msg;
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
          if (isResume) {
            addLog(
              "▶️ Resuming operations — skipping already-completed steps...",
            );
          }
          addLog("⏳ Processing operations... please wait...");

          // Notification edit summaries do not vary per target and are
          // declared once, outside the per-target loop below.
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
          const notifySummaryRollback =
            (useIndonesian
              ? "Notifikasi: Pemberitahuan pembatalan suntingan"
              : "Notification: Edit reversion notice") + toolTag;

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

          // Builds the expiry parameter matching the pipe-separated order of
          // buildPageProtections(): edit expiry, then move expiry, then (for
          // file pages) upload expiry. The MediaWiki protect API accepts a
          // pipe-separated expiry list that is matched positionally against
          // the pipe-separated protections list, so edit and move restrictions
          // can expire independently in a single action=protect call. Upload
          // restriction has no dedicated expiry control and reuses the edit
          // protection expiry.
          function buildPageProtectionExpiries(title) {
            let expiries = `${config.protectExpiry}|${config.protectMoveExpiry}`;
            try {
              if (new mw.Title(title).getNamespaceId() === 6) {
                expiries += `|${config.protectExpiry}`;
              }
            } catch (e) {
              // Skip if the title cannot be resolved
            }
            return expiries;
          }

          // Builds the wikitext line for a Global sysops/Requests report for
          // a specific target. Called per-target inside the targets loop so
          // every account or page in a multi-target run receives its own
          // individual entry on the report page.
          function buildGSLineForTarget(target) {
            const prefix = getInterwikiPrefix();
            const _isTargetIP = mw.util.isIPAddress(target);
            const _isTempAccount = /^~\d{4}-\d+-\d+$/.test(target);
            const reasonText = config.reportGSReasonText;
            if (config.mode === "page") {
              const requestVerb =
                config.reportGSPageType === "protect"
                  ? "Please protect"
                  : config.reportGSPageType === "revdel"
                    ? "Please delete revisions from"
                    : "Please delete";
              const pageLink = prefix
                ? "[[:" + prefix + target + "|" + target + "]]"
                : "[[:" + target + "]]";
              return (
                "* " +
                requestVerb +
                " " +
                pageLink +
                ": " +
                reasonText +
                " ~~~~"
              );
            }
            let userLink;
            if (_isTargetIP || _isTempAccount) {
              userLink = prefix
                ? "[[:" +
                  prefix +
                  "Special:Contributions/" +
                  target +
                  "|" +
                  target +
                  "]]"
                : "[[Special:Contributions/" + target + "|" + target + "]]";
            } else {
              userLink = prefix
                ? "{{LockHide|1=" + target + "|2=" + prefix + "}}"
                : "{{LockHide|1=" + target + "}}";
            }
            return "* Please block " + userLink + ": " + reasonText + " ~~~~";
          }

          // Removes an entire [[File:...]] or [[Image:...]] construct for the given
          // file name, including any nested wikilinks or templates within its
          // caption, by tracking bracket depth rather than matching with a regex.
          // A regex such as /\[\[File:Name(?:\|[^\]]*)?\]\]/ stops at the first
          // "]]" it finds, which incorrectly truncates captions that themselves
          // contain wikilinks or templates (e.g. "[[Bart Simpson|Bart]]" or
          // "{{small|(anjing)}}" inside the caption), leaving the remainder of the
          // caption behind as stray wikitext. This function instead walks forward
          // from the opening "[[", counting nested "[[" / "]]" pairs, so it finds
          // the "]]" that actually closes the file embed. Any horizontal
          // whitespace immediately before or after the removed construct is also
          // trimmed, so the removal does not leave behind stray spaces.
          function removeBalancedFileEmbeds(text, fileNameForMatch) {
            const escapedFileName = fileNameForMatch
              .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
              .replace(/[ _]/g, "[ _]");
            const startRe = new RegExp(
              "\\[\\[\\s*(?:[Ff]ile|[Ii]mage)\\s*:\\s*" +
                escapedFileName +
                "\\s*(?:\\||\\]\\])",
            );
            let result = text;
            let searchFrom = 0;
            while (searchFrom < result.length) {
              const remaining = result.slice(searchFrom);
              const m = startRe.exec(remaining);
              if (!m) break;
              const startIdx = searchFrom + m.index;

              // Walk forward from the opening "[[", tracking bracket depth, to
              // find the matching closing "]]" for this specific file embed,
              // rather than the first "]]" encountered.
              let depth = 0;
              let i = startIdx;
              let endIdx = -1;
              while (i < result.length - 1) {
                const two = result.substr(i, 2);
                if (two === "[[") {
                  depth++;
                  i += 2;
                  continue;
                }
                if (two === "]]") {
                  depth--;
                  i += 2;
                  if (depth === 0) {
                    endIdx = i;
                    break;
                  }
                  continue;
                }
                i++;
              }

              if (endIdx === -1) {
                // Unbalanced brackets; stop rather than risk corrupting content.
                break;
              }

              const before = result.slice(0, startIdx).replace(/[ \t]+$/, "");
              const after = result.slice(endIdx).replace(/^[ \t]+/, "");
              result = before + after;
              searchFrom = before.length;
            }
            return result;
          }

          for (const targetVal of config.targets || [config.target]) {
            if (isAborted) break;

            if (isMultiTarget) {
              // Prefix every log entry in this iteration with the target name
              // so per-target actions are identifiable without a separator element.
              currentTargetLabel = targetVal;

              // Reset all per-target phase flags and tracking collections so
              // each target is processed as an independent unit within this run.
              rs.warnDone = false;
              rs.blockDone = false;
              rs.unblockDone = false;
              rs.lockAccountDone = false;
              rs.reportGSDone = false;
              rs.reportSRGDone = false;
              rs.undeleteDone = false;
              rs.moveSandboxDone = false;
              rs.rollbackLoopDone = false;
              rs.notifyRollbackDone = false;
              rs.mainProtectLoopDone = false;
              rs.notifyProtectDone = false;
              rs.deletionLoopDone = false;
              rs.notifyDeleteUserDone = false;
              rs.notifyDeletePageDone = false;
              rs.protectRecreationDone = false;
              rs.secondProtectDone = false;
              rs.unlinkLoopDone = false;
              rs.fixRedirectsDone = false;
              rs.processedRollbackTitles = new Set();
              rs.processedDeletionTitles = new Set();
              rs.processedUnlinkTitles = new Set();
              rs.processedFixRedirectsTitles = new Set();
              rs.pageEditsCache = null;
              rs.creationCache = null;
              rs.pagesToProtectCache = null;
              rs.pagesToProtectAfterDelCache = null;
              rs.rollbackNotifiedTitles = [];
              rs.deletedTitles = [];
              rs.creatorMap = new Map();
              rs.notifyQueue = new Map();
            }

            // Resolve IP status per-target so block parameters (anononly vs
            // autoblock) are correct when the target list mixes IPs, IP
            // ranges, and accounts. isIPAddress(targetVal, true) accepts both
            // single IPs and CIDR ranges; rangeblocks do not support
            // autoblock, so treating ranges the same as plain IPs here
            // correctly skips it.
            const isTargetIP = mw.util.isIPAddress(targetVal, true);
            // Per-target range status. config.isRange only reflects the
            // primary target and is unsafe to reuse here, since a
            // multi-target run can mix accounts, single IPs, and IP ranges.
            const targetIsRange = isTargetIP && !mw.util.isIPAddress(targetVal);

            // --- User warning ---
            // Only runs in user mode; config.warn is only set when the warn
            // section is enabled and a message template has been selected.
            if (
              !rs.warnDone &&
              config.warn &&
              config.mode === "user" &&
              !isAborted
            ) {
              const talkTitle = new mw.Title(targetVal, 3).getPrefixedText();
              // In multi-target runs, rebuild the notice with the current
              // target's name so each recipient is addressed correctly,
              // rather than reusing the pre-built text that contains the
              // primary target's name.
              let notice = config.warnNotice;
              if (isMultiTarget && config.warnTemplateValue) {
                for (const group of WARN_MESSAGES) {
                  if (!group.items) continue;
                  const found = group.items.find(function (item) {
                    return item.value === config.warnTemplateValue;
                  });
                  if (found) {
                    notice = found.buildNotice(
                      targetVal,
                      config.warnExtra,
                      config.warnFinal,
                    );
                    break;
                  }
                }
              }
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
              rs.warnDone = true;
            }

            // --- Block ---
            if (
              !rs.blockDone &&
              config.block &&
              config.mode === "user" &&
              !isAborted
            ) {
              let proceedWithBlock = true;

              // Show a confirmation dialogue only when the target account matches the current user.
              const isSelfBlock =
                targetVal.toLowerCase() ===
                (mw.config.get("wgUserName") || "").toLowerCase();
              if (isSelfBlock) {
                const confirmed = await new Promise((resolve) => {
                  const { overlay, body, footer } = createDialog({
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
                if (isTargetIP) {
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
                // so a notification failure does not misreport the block as having failed).
                // Skipped for IP ranges: mw.Title would treat the slash in CIDR notation
                // (e.g. "1.2.3.0/24") as a subpage separator, producing an incorrect title.
                // Skipped for any range target (IPv4 or IPv6 CIDR): mw.Title
                // would misparse the "/" in the range as a subpage separator,
                // and an IPv6 address's ":" characters risk being misread as
                // a namespace prefix, producing an incorrect title either way.
                if (targetIsRange && config.notifyBlock && stats.block > 0) {
                  addLog(
                    "[Notify] Skipped block notification: talk pages are not applicable to IP range targets (IPv4 or IPv6).",
                    "warn",
                  );
                }
                if (stats.block > 0 && config.notifyBlock && !targetIsRange) {
                  const talkTitle = new mw.Title(
                    targetVal,
                    3,
                  ).getPrefixedText();
                  const isBlockIndef = config.blockDur === "never";
                  const blockReasonNotice =
                    config.blockReason && config.blockReason.trim()
                      ? config.blockReason
                      : useIndonesian
                        ? "(tidak ada alasan diberikan)"
                        : "(no reason given)";

                  const notice = useIndonesian
                    ? isBlockIndef
                      ? `== Pemberitahuan pemblokiran akun ==\nHalo ${targetVal},\n\nAkun "${targetVal}" telah diblokir secara tidak terbatas dengan alasan berikut: ${blockReasonNotice}.\n\nSelama masa pemblokiran, akun ini mungkin tidak dapat melakukan sebagian atau seluruh tindakan yang biasanya memerlukan hak penyuntingan. Pemblokiran ini tidak berakhir secara otomatis dan akan tetap berlaku kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                      : `== Pemberitahuan pemblokiran akun ==\nHalo ${targetVal},\n\nAkun "${targetVal}" telah diblokir selama ${translateDurationId(config.blockDur)} dengan alasan berikut: ${blockReasonNotice}.\n\nSelama masa pemblokiran, akun ini mungkin tidak dapat melakukan sebagian atau seluruh tindakan yang biasanya memerlukan hak penyuntingan. Pemblokiran dijadwalkan berakhir pada waktunya, kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : isBlockIndef
                      ? `== Account block notice ==\nDear ${targetVal},\n\nThe account "${targetVal}" has been blocked indefinitely due to the following reason: ${blockReasonNotice}.\n\nDuring the block period, the account may be unable to perform some or all actions that normally require editing privileges. This block does not expire automatically and will remain in effect unless modified by an administrator.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`
                      : `== Account block notice ==\nDear ${targetVal},\n\nThe account "${targetVal}" has been blocked for ${config.blockDur} due to the following reason: ${blockReasonNotice}.\n\nDuring the block period, the account may be unable to perform some or all actions that normally require editing privileges. The block is scheduled to remain in effect until it expires, unless modified by an administrator.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;

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
                      editParams.appendtext =
                        (talkExists ? "\n\n" : "") + notice;
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
              rs.blockDone = true;
            }

            // --- Unblock ---
            if (
              !rs.unblockDone &&
              config.unblock &&
              config.mode === "user" &&
              !isAborted
            ) {
              try {
                await apiPost({
                  action: "unblock",
                  user: targetVal,
                  reason: config.unblockReason + toolTag,
                });
                addLog(`[Unblock] Successfully unblocked ${targetVal}`);
                stats.unblock++;

                if (config.notifyUnblock) {
                  const talkTitle = new mw.Title(
                    targetVal,
                    3,
                  ).getPrefixedText();
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
              rs.unblockDone = true;
            }

            // --- Lock account [EXPERIMENTAL] ---
            // This calls CentralAuth's global account status API
            // via a foreign API request to Meta-Wiki, following the same
            // pattern already used by the Report to global sysops and Report
            // to Steward requests/Global features above. The module name and
            // parameters (action=setglobalaccountstatus; locked=lock/unlock;
            // hidden=lists/suppressed) have been confirmed against the
            // Extension:CentralAuth/API documentation on mediawiki.org.
            if (
              !rs.lockAccountDone &&
              config.lockAccount &&
              config.mode === "user" &&
              !isAborted
            ) {
              try {
                const foreignApi = await getMetaForeignApi();
                await new Promise((resolve, reject) => {
                  foreignApi
                    .postWithEditToken({
                      action: "setglobalaccountstatus",
                      user: targetVal,
                      locked: "lock",
                      reason: config.lockAccountReason + toolTag,
                      ...(config.lockAccountHideUsername
                        ? { hidden: "lists" }
                        : {}),
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
                addLog(`[Lock] Successfully locked account: ${targetVal}`);
                stats.lockAccount++;
                updateStatusDisplay();

                if (config.notifyLockAccount) {
                  const talkTitle = new mw.Title(
                    targetVal,
                    3,
                  ).getPrefixedText();
                  const notifySummaryLockAccount =
                    "Notification: Account lock notice" + toolTag;
                  const notice = `== Account lock notice ==\nDear ${targetVal},\n\nYour account has been globally locked due to the following reason: ${config.lockAccountReason}.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                  try {
                    const talkExists = await pageExists(talkTitle);
                    await apiPost({
                      action: "edit",
                      title: talkTitle,
                      appendtext: (talkExists ? "\n\n" : "") + notice,
                      summary: notifySummaryLockAccount,
                      bot: true,
                    });
                    addLog(`[Notify] Notification posted to: ${talkTitle}`);
                  } catch (e) {
                    addLog(
                      `[Notify] Failed to post lock notification to ${talkTitle}: ${formatApiError(e)}`,
                      "warn",
                    );
                  }
                }
              } catch (e) {
                addLog(
                  `[Lock] Failed to lock ${targetVal}: ${formatApiError(e)}`,
                  true,
                );
              }
              rs.lockAccountDone = true;
            }

            // --- Report to Global sysops/Requests ---
            // Available in both user mode (reporting an account) and page mode
            // (reporting a page for global sysops' attention).
            // In multi-target mode, a separate entry is appended for each
            // target so every account or page gets its own individual report.
            if (!rs.reportGSDone && config.reportGS && !isAborted) {
              try {
                const _gsLine = buildGSLineForTarget(targetVal);
                const reportGSSummary =
                  (config.mode === "page"
                    ? "Reporting page for global sysops' attention"
                    : "Reporting account for global sysops' attention") +
                  toolTag;
                await submitGlobalSysopsReport(_gsLine, reportGSSummary);
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
              rs.reportGSDone = true;
            }

            // --- Report to Steward requests/Global ---
            // User mode only. Files a global block request when the target is
            // an IP address, or a global lock request when the target is a
            // registered account, on Meta-Wiki's Steward requests/Global page.
            // In multi-target mode the full section is pre-built to include all
            // targets, so only one submission is made (on the primary target's
            // iteration).
            if (
              !rs.reportSRGDone &&
              config.reportSRG &&
              !isAborted &&
              (!isMultiTarget || targetVal === config.target)
            ) {
              try {
                const _srgTargetCount = config.targets
                  ? config.targets.length
                  : 1;
                const srgSummary =
                  _srgTargetCount > 1
                    ? "Reporting " +
                      _srgTargetCount +
                      " accounts for global " +
                      (config.reportSRGKind === "block" ? "block" : "lock") +
                      toolTag
                    : "Reporting account for global " +
                      (config.reportSRGKind === "block" ? "block" : "lock") +
                      toolTag;
                await submitSRGReport(
                  config.reportSRGKind,
                  config.targets || [targetVal],
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
              rs.reportSRGDone = true;
            }

            // --- Page undeletion ---
            if (
              !rs.undeleteDone &&
              config.undelete &&
              config.mode === "page" &&
              !isAborted
            ) {
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
              rs.undeleteDone = true;
            }

            // --- Move page / Move to user's sandbox ---
            if (
              !rs.moveSandboxDone &&
              config.moveSandbox &&
              config.mode === "page" &&
              !isAborted
            ) {
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

                // Delete the destination page first, if requested and it exists.
                // A move fails outright if the destination title is already
                // occupied by an existing page, so this must run before the
                // move attempt below.
                if (config.movePageDeleteDest && !isAborted) {
                  try {
                    const destExistData = await apiGet({
                      action: "query",
                      titles: config.movePageDest,
                      formatversion: 2,
                    });
                    const destPage =
                      destExistData.query &&
                      destExistData.query.pages &&
                      destExistData.query.pages[0];
                    if (destPage && !destPage.missing) {
                      await apiPost({
                        action: "delete",
                        title: config.movePageDest,
                        reason:
                          (useIndonesian
                            ? "Menghapus halaman tujuan untuk memungkinkan pemindahan halaman: "
                            : "Deleting destination page to allow page move: ") +
                          config.movePageReason +
                          toolTag,
                      });
                      addLog(
                        `[Move] Deleted existing destination page: ${config.movePageDest}`,
                      );
                      stats.delete++;
                      updateStatusDisplay();
                    }
                  } catch (e) {
                    addLog(
                      `[Move] Failed to delete destination page "${config.movePageDest}": ${formatApiError(e)}`,
                      true,
                    );
                  }
                }

                let movePageMoveSucceeded = false;
                try {
                  await apiPost(moveParams);
                  addLog(
                    `[Move] Moved "${targetVal}" to "${config.movePageDest}"`,
                  );
                  stats.move++;
                  updateStatusDisplay();
                  movePageMoveSucceeded = true;
                } catch (e) {
                  addLog(
                    `[Move] Failed to move "${targetVal}" to "${config.movePageDest}": ${formatApiError(e)}`,
                    true,
                  );
                }

                // Fix double redirects. A double redirect occurs when a page
                // redirects to targetVal, which — following this move — is
                // itself now a redirect to config.movePageDest, instead of the
                // pre-existing redirect being updated to point directly to the
                // final destination. Only relevant when a redirect was left
                // behind at the old title (i.e. 'Suppress redirect' was not
                // used), since otherwise there is no intermediate redirect for
                // other pages to chain through.
                if (
                  movePageMoveSucceeded &&
                  config.movePageFixDoubleRedirects &&
                  !config.movePageNoRedirect &&
                  !isAborted
                ) {
                  try {
                    const drData = await apiGet({
                      action: "query",
                      list: "backlinks",
                      bltitle: targetVal,
                      blfilterredir: "redirects",
                      bllimit: "max",
                      formatversion: 2,
                    });
                    const redirectPages =
                      (drData.query && drData.query.backlinks) || [];
                    if (!redirectPages.length) {
                      addLog(
                        `[Move] No double redirects found pointing to: ${targetVal}`,
                      );
                    }
                    // Detect the local wiki's redirect magic word(s) (e.g.
                    // "#REDIRECT", "#ALIH") rather than assuming English.
                    const redirectAliases = await getRedirectMagicWords();
                    const redirectAliasPattern = redirectAliases
                      .map(function (a) {
                        return a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                      })
                      .join("|");
                    for (const rdPage of redirectPages) {
                      if (isAborted) break;
                      try {
                        const revData = await apiGet({
                          action: "query",
                          prop: "revisions",
                          titles: rdPage.title,
                          rvprop: "content",
                          rvslots: "main",
                          formatversion: 2,
                        });
                        const page =
                          revData.query &&
                          revData.query.pages &&
                          revData.query.pages[0];
                        const slot =
                          page &&
                          page.revisions &&
                          page.revisions[0] &&
                          page.revisions[0].slots &&
                          page.revisions[0].slots.main;
                        if (!slot) continue;
                        const wikitext = slot.content;

                        // Matches "#REDIRECT [[Old title]]", optionally followed
                        // by a section anchor (#Section) or a piped display text,
                        // and rewrites only the title portion, preserving whatever
                        // follows it.
                        const escapedOld = targetVal
                          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                          .replace(/[ _]/g, "[ _]");
                        const redirRe = new RegExp(
                          "((?:" +
                            redirectAliasPattern +
                            ")\\s*\\[\\[)\\s*" +
                            escapedOld +
                            "\\s*(\\]\\]|\\||#)",
                          "i",
                        );
                        if (!redirRe.test(wikitext)) continue;
                        const newWikitext = wikitext.replace(
                          redirRe,
                          function (match, prefix, tail) {
                            return prefix + config.movePageDest + tail;
                          },
                        );
                        if (newWikitext === wikitext) continue;

                        await apiPost({
                          action: "edit",
                          title: rdPage.title,
                          text: newWikitext,
                          summary:
                            (useIndonesian
                              ? "Memperbaiki pengalihan ganda setelah pemindahan halaman: "
                              : "Fixing double redirect following page move: ") +
                            targetVal +
                            " → " +
                            config.movePageDest +
                            toolTag,
                          bot: true,
                        });
                        addLog(
                          `[Move] Fixed double redirect: ${rdPage.title} now points directly to "${config.movePageDest}"`,
                        );
                        stats.redirfix++;
                        updateStatusDisplay();
                      } catch (e) {
                        addLog(
                          `[Move] Failed to fix double redirect at ${rdPage.title}: ${formatApiError(e)}`,
                          true,
                        );
                      }
                      await new Promise((resolve) =>
                        setTimeout(resolve, THROTTLE_MS),
                      );
                    }
                  } catch (e) {
                    addLog(
                      `[Move] Failed to fetch redirects pointing to "${targetVal}": ${formatApiError(e)}`,
                      true,
                    );
                  }
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
                              ? `Halaman pembicaraan dari halaman yang dipindahkan: ${config.moveSandboxReason}`
                              : `Talk page of moved page: ${config.moveSandboxReason}`) +
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
                                    ? `Halaman pembicaraan dari subhalaman yang dipindahkan: ${config.moveSandboxReason}`
                                    : `Talk page of moved subpage: ${config.moveSandboxReason}`) +
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
              rs.moveSandboxDone = true;
            }

            // --- Fetch user contributions OR prepare target page ---
            // On a resume run, contribution data is loaded from the cache stored in rs,
            // avoiding a repeat API call. On a fresh run data is fetched normally then cached.
            let pageEdits = {};
            let creation = [];
            let pagesToProtect = new Set();
            let pagesToProtectAfterDel;
            const skipContribFetch = rs.pageEditsCache !== null;
            if (skipContribFetch) {
              pageEdits = rs.pageEditsCache;
              creation = rs.creationCache;
              pagesToProtect = rs.pagesToProtectCache;
              pagesToProtectAfterDel = rs.pagesToProtectAfterDelCache;
              addLog("▶️ Contribution data reloaded from the previous run.");
            }

            if (
              !skipContribFetch &&
              config.mode === "user" &&
              config.customSelection
            ) {
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

            if (
              !skipContribFetch &&
              config.mode === "user" &&
              !config.customSelection &&
              !targetIsRange
            ) {
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
                if (config.betweenFrom)
                  contribParams.ucend = config.betweenFrom;
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
            } else if (!skipContribFetch && config.mode === "page") {
              // Page mode: bypass fetching and apply operations directly to the target page
              if (config.protect) pagesToProtect.add(targetVal);
              if (config.massdel) creation.push(targetVal);
            }

            // Pages scheduled for both deletion and protection must be deleted first,
            // then protected against recreation. Protecting before deletion causes the
            // protection to be lost when the page is removed. Identify the overlap now
            // and defer those pages to a second protect pass that runs after deletion.
            if (!skipContribFetch) {
              const creationSet = new Set(creation);
              pagesToProtectAfterDel = new Set(
                [...pagesToProtect].filter(function (t) {
                  return creationSet.has(t);
                }),
              );
              for (const t of pagesToProtectAfterDel) {
                pagesToProtect.delete(t);
              }
              // Cache contribution data and computed page sets for a potential resume run.
              rs.pageEditsCache = pageEdits;
              rs.creationCache = creation;
              rs.pagesToProtectCache = pagesToProtect;
              rs.pagesToProtectAfterDelCache = pagesToProtectAfterDel;
            }

            // Titles successfully reverted via rollback/undo, collected so a single
            // consolidated notification can be sent to the target user's talk page
            // (if enabled), instead of one notification per page. On resume, reuse the
            // array from rs so all reverted titles across runs are included.
            const rollbackNotifiedTitles = rs.rollbackNotifiedTitles;

            // Process rollbacks, undos and revision deletions sequentially with a throttling buffer delay
            for (const [title, info] of Object.entries(pageEdits)) {
              if (isAborted) break;
              if (rs.processedRollbackTitles.has(title)) continue;

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
                await new Promise((resolve) =>
                  setTimeout(resolve, THROTTLE_MS),
                ); // Rate limit buffer
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

              // Builds the shared "Reverted [[Special:Diff/X|edit]] by ..." wording
              // used by both the undo and native rollback summaries below. Always
              // links to the diff of the reverted revision. When a custom reason is
              // supplied, the summary reads "Reverted [[Special:Diff/X|edit]] by
              // [user]: [reason]"; otherwise it names the author of the revision
              // being restored, where known, so it is clear which revision the page
              // was reverted to. Falls back to omitting the "to the previous
              // revision by..." clause when the previous editor could not be
              // determined (e.g. the lookup above failed, or there is no parent
              // revision), and to omitting the username entirely when "Show
              // username in summary" is unticked.
              const revertedRevId = info.latest;
              // Links to the full diff between the revision immediately before the
              // reverted edit(s) and the latest reverted revision, using MediaWiki's
              // two-ID Special:Diff/<oldid>/<diffid> form, rather than the single-ID
              // form (Special:Diff/<diffid>), which only shows that one revision's
              // individual change against its immediate parent. This matters when
              // rollback reverts several consecutive edits at once: the single-ID
              // form would only reflect the last of those edits, not the cumulative
              // change being reverted. Falls back to the single-ID form when no
              // parent revision is known (info.oldestParent is unset).
              const diffLinkTarget = info.oldestParent
                ? `${info.oldestParent}/${revertedRevId}`
                : `${revertedRevId}`;
              const buildRevertSummaryText = function () {
                return buildQuickRevertSummaryText(
                  targetVal,
                  diffLinkTarget,
                  config.rollbackReason,
                  config.rollbackShow,
                  previousEditorUser,
                  config.rollbackMethod === "undo" ? "undo" : "rollback",
                );
              };

              const revertSummaryStr = buildRevertSummaryText() + toolTag;

              // Execute standard rollback or undo operation sequentially based on settings
              if (config.rollbackMethod === "undo" && !isZObject) {
                const undoData = {
                  action: "edit",
                  title: title,
                  undo: info.latest,
                  summary: revertSummaryStr,
                };
                if (info.oldestParent) undoData.undoafter = info.oldestParent;
                if (config.rollbackBot) undoData.bot = 1;

                try {
                  const undoResult = await apiPost(undoData);
                  const editResult = undoResult && undoResult.edit;
                  const noChangeMade = !!(
                    editResult &&
                    Object.prototype.hasOwnProperty.call(editResult, "nochange")
                  );
                  if (noChangeMade) {
                    if (!mediainfoNeedsRevert) {
                      addLog(
                        `[Undo] Skipped: ${title} — the edit appears to have already been undone; no changes were made`,
                        "warn",
                      );
                    }
                  } else {
                    addLog(
                      `[Undo] Successfully reverted edits via undo: ${title}`,
                    );
                    standardRevertSuccess = true;
                    stats.rollback++;
                    rollbackNotifiedTitles.push(title);
                    updateStatusDisplay();
                  }
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
                rbData.summary = revertSummaryStr;

                try {
                  await apiRollback(title, targetVal, rbData);
                  addLog(`[Rollback] Successfully reverted: ${title}`);
                  standardRevertSuccess = true;
                  stats.rollback++;
                  rollbackNotifiedTitles.push(title);
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
                    summary: revertSummaryStr,
                    bot: config.rollbackBot ? 1 : 0,
                  });
                  addLog(
                    `[Undo] Successfully reverted structured data at: ${title}`,
                  );
                  if (!standardRevertSuccess) {
                    stats.rollback++;
                    rollbackNotifiedTitles.push(title);
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

              rs.processedRollbackTitles.add(title);
              await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS)); // Throttling window
            }
            if (!isAborted) rs.rollbackLoopDone = true;

            // --- Rollback/undo notification ---
            // Posted once per run to the target user's talk page, listing every
            // page successfully reverted (rather than one notification per page).
            if (
              !rs.notifyRollbackDone &&
              config.notifyRollback &&
              config.mode === "user" &&
              rollbackNotifiedTitles.length > 0 &&
              !isAborted
            ) {
              const talkTitle = new mw.Title(targetVal, 3).getPrefixedText();
              const reasonText =
                config.rollbackReason ||
                (useIndonesian
                  ? "(tidak ada alasan diberikan)"
                  : "(no reason given)");
              try {
                const talkExists = await pageExists(talkTitle);
                let notice;
                if (rollbackNotifiedTitles.length === 1) {
                  notice = useIndonesian
                    ? `== Pemberitahuan pembatalan suntingan ==\nHalo ${targetVal},\n\nSuntingan Anda pada halaman "${rollbackNotifiedTitles[0]}" telah dibatalkan dengan alasan berikut: ${reasonText}.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : `== Edit reversion notice ==\nDear ${targetVal},\n\nYour edit to the page "${rollbackNotifiedTitles[0]}" has been reverted due to the following reason: ${reasonText}.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                } else {
                  const listed = rollbackNotifiedTitles
                    .map((t) => `* "${t}"`)
                    .join("\n");
                  notice = useIndonesian
                    ? `== Pemberitahuan pembatalan suntingan ==\nHalo ${targetVal},\n\nSuntingan Anda pada halaman-halaman berikut telah dibatalkan dengan alasan berikut: ${reasonText}.\n\n${listed}\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : `== Edit reversion notice ==\nDear ${targetVal},\n\nYour edits to the following pages have been reverted due to the following reason: ${reasonText}.\n\n${listed}\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                }
                await apiPost({
                  action: "edit",
                  title: talkTitle,
                  appendtext: (talkExists ? "\n\n" : "") + notice,
                  summary: notifySummaryRollback,
                  bot: true,
                });
                addLog(
                  `[Notify] Reversion notification posted to: ${talkTitle}`,
                );
              } catch (e) {
                addLog(
                  `[Notify] Failed to post reversion notification to ${talkTitle}: ${formatApiError(e)}`,
                  "warn",
                );
              }
              rs.notifyRollbackDone = true;
            }

            // On resume, reuse the notification queue from the previous run.
            const notifyQueue = rs.notifyQueue;

            // Execute sequential page protections if enabled
            if (
              config.protect &&
              pagesToProtect.size > 0 &&
              !rs.mainProtectLoopDone
            ) {
              for (const title of pagesToProtect) {
                if (isAborted) break;
                try {
                  const protectData = {
                    action: "protect",
                    title: title,
                    protections: buildPageProtections(title),
                    expiry: buildPageProtectionExpiries(title),
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

                // Pending changes (FlaggedRevs) protection. Assumes
                // the stabilize API module accepts protectlevel/expiry/reason
                // parameters analogous to action=protect.
                if (config.protectPendingChanges) {
                  try {
                    await apiPost({
                      action: "stabilize",
                      title: title,
                      protectlevel: config.protectPendingChangesLevel,
                      // action=stabilize may not accept "never" as
                      // an indefinite-expiry alias the way action=protect does;
                      // this appears to be the cause of the previous
                      // stabilize_expiry_invalid error and is translated here.
                      expiry:
                        config.protectPendingChangesExpiry === "never"
                          ? "infinite"
                          : config.protectPendingChangesExpiry,
                      reason: config.protectReason + toolTag,
                    });
                    addLog(
                      `[Protect] Enabled pending changes protection: ${title}`,
                    );
                    stats.protect++;
                    updateStatusDisplay();
                  } catch (e) {
                    addLog(
                      `[Protect] Failed to enable pending changes protection for ${title}: ${formatApiError(e)}`,
                      true,
                    );
                  }
                  await new Promise((resolve) =>
                    setTimeout(resolve, THROTTLE_MS),
                  );
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
                        expiry: `${config.protectExpiry}|${config.protectMoveExpiry}`,
                        reason: config.protectReason + toolTag,
                        ...(config.protectCascade ? { cascade: "" } : {}),
                      });
                      addLog(
                        `[Protect] Protected talk page: ${talkForProtect}`,
                      );
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
                  if (!notifyQueue.has(talkTitle))
                    notifyQueue.set(talkTitle, []);
                  notifyQueue.get(talkTitle).push(title);
                } catch (e) {
                  // Title has no talk page (e.g. it is itself a talk page); skip.
                }
                await new Promise((resolve) =>
                  setTimeout(resolve, THROTTLE_MS),
                );
              }
              if (!isAborted) rs.mainProtectLoopDone = true;
            }

            // Dispatch protection notifications. If two or more protected pages resolve
            // to the same talk page, a single consolidated notice is posted instead of
            // one per page, whilst still listing every affected page by name.
            if (
              !rs.notifyProtectDone &&
              notifyQueue.size > 0 &&
              config.notifyProtect
            ) {
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
                  const protectReasonNotice =
                    config.protectReason && config.protectReason.trim()
                      ? config.protectReason
                      : useIndonesian
                        ? "(tidak ada alasan diberikan)"
                        : "(no reason given)";
                  if (titles.length === 1) {
                    notice = useIndonesian
                      ? isProtectIndef
                        ? `== Pemberitahuan perlindungan halaman ==\nHalaman "${titles[0]}" telah dilindungi secara tidak terbatas dengan alasan berikut: ${protectReasonNotice}.\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan ini tidak berakhir secara otomatis dan akan tetap berlaku kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                        : `== Pemberitahuan perlindungan halaman ==\nHalaman "${titles[0]}" telah dilindungi selama ${translateDurationId(config.protectExpiry)} dengan alasan berikut: ${protectReasonNotice}.\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan dijadwalkan berakhir pada waktunya, kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                      : `== Page protection notice ==\nThe page "${titles[0]}" has been protected ${protectExpiryDisplay} due to the following reason: ${protectReasonNotice}.\n\nDuring the protection period, some or all editing actions may be restricted depending on the level of protection applied. ${protectExpiryText}\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                  } else {
                    const listed = titles.map((t) => `"${t}"`).join(" and ");
                    const listedId = titles.map((t) => `"${t}"`).join(" dan ");
                    notice = useIndonesian
                      ? isProtectIndef
                        ? `== Pemberitahuan perlindungan halaman ==\nHalaman-halaman berikut telah dilindungi secara tidak terbatas dengan alasan berikut: ${protectReasonNotice}.\n\n${listedId}\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan pada halaman-halaman ini mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan ini tidak berakhir secara otomatis dan akan tetap berlaku kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                        : `== Pemberitahuan perlindungan halaman ==\nHalaman-halaman berikut telah dilindungi selama ${translateDurationId(config.protectExpiry)} dengan alasan berikut: ${protectReasonNotice}.\n\n${listedId}\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan pada halaman-halaman ini mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan dijadwalkan berakhir pada waktunya, kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                      : `== Page protection notice ==\nThe following pages have been protected ${protectExpiryDisplay} due to the following reason: ${protectReasonNotice}.\n\n${listed}\n\nDuring the protection period, some or all editing actions on these pages may be restricted depending on the level of protection applied. ${protectExpiryText}\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
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
                await new Promise((resolve) =>
                  setTimeout(resolve, THROTTLE_MS),
                );
              }
              if (!isAborted) rs.notifyProtectDone = true;
            }

            // On resume, reuse accumulated deletion data from the previous run.
            const deletedTitles = rs.deletedTitles;
            // Maps creator username → deleted page titles, for page mode notifications.
            // Populated during the deletion loop (after each successful delete) so only
            // confirmed deletions are included. Lookup must occur before deletion because
            // the standard query API cannot return revision data for deleted pages.
            const creatorMap = rs.creatorMap;

            // Mass-delete pages sequentially
            if (config.massdel && !rs.deletionLoopDone) {
              for (const title of creation) {
                if (isAborted) break;
                if (rs.processedDeletionTitles.has(title)) continue;

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
                    if (
                      pageCreator.toLowerCase() !== currentUser.toLowerCase()
                    ) {
                      if (!creatorMap.has(pageCreator))
                        creatorMap.set(pageCreator, []);
                      creatorMap.get(pageCreator).push(title);
                      // Also accumulate across targets for the consolidated
                      // multi-target notification dispatched after all targets
                      // have been processed.
                      if (isMultiTarget) {
                        if (!multiTargetCreatorMap.has(pageCreator))
                          multiTargetCreatorMap.set(pageCreator, []);
                        multiTargetCreatorMap.get(pageCreator).push(title);
                      }
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
                    // Skip deleting the target user's own talk page when a block
                    // notification was successfully posted there, so the
                    // notification remains visible after the operation completes.
                    const blockNotifyTalkTitle =
                      config.block && config.notifyBlock && stats.block > 0
                        ? new mw.Title(targetVal, 3).getPrefixedText()
                        : null;
                    if (
                      blockNotifyTalkTitle &&
                      talkTitle === blockNotifyTalkTitle
                    ) {
                      addLog(
                        `[Delete] Skipped talk page deletion: ${talkTitle} — block notification is present on this page.`,
                        "warn",
                      );
                    } else {
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

                rs.processedDeletionTitles.add(title);
                await new Promise((resolve) =>
                  setTimeout(resolve, THROTTLE_MS),
                ); // Throttling window
              }
              if (!isAborted) rs.deletionLoopDone = true;
            }

            // Post deletion notification to the target user's talk page (user mode).
            // All deleted pages were created by the same user, so a single notice is
            // posted regardless of how many pages were deleted.
            const isSelfDeletion =
              config.mode === "user" &&
              targetVal.toLowerCase() ===
                (mw.config.get("wgUserName") || "").toLowerCase();
            if (
              !rs.notifyDeleteUserDone &&
              config.massdel &&
              config.mode === "user" &&
              deletedTitles.length > 0 &&
              config.notifyDelete &&
              !isSelfDeletion
            ) {
              const talkTitle = new mw.Title(targetVal, 3).getPrefixedText();
              try {
                const talkExists = await pageExists(talkTitle);
                const massdelReasonNotice =
                  config.massdelReason && config.massdelReason.trim()
                    ? config.massdelReason
                    : useIndonesian
                      ? "(tidak ada alasan diberikan)"
                      : "(no reason given)";
                let notice;
                if (deletedTitles.length === 1) {
                  notice = useIndonesian
                    ? `== Pemberitahuan penghapusan halaman ==\nHalo ${targetVal},\n\nHalaman "${deletedTitles[0]}" yang Anda buat telah dihapus dengan alasan berikut: ${massdelReasonNotice}.\n\nHalaman yang dihapus tidak lagi dapat diakses secara publik. Jika Anda yakin penghapusan ini keliru, silakan sampaikan di halaman pembicaraan saya atau ikuti prosedur pemulihan halaman wiki ini.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : `== Page deletion notice ==\nDear ${targetVal},\n\nThe page "${deletedTitles[0]}" you created has been deleted due to the following reason: ${massdelReasonNotice}.\n\nDeleted pages are no longer publicly accessible. If you believe this deletion was in error, please raise the matter on my user talk page or follow your wiki's undeletion process.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                } else {
                  const listed = deletedTitles
                    .map((t) => `* "${t}"`)
                    .join("\n");
                  notice = useIndonesian
                    ? `== Pemberitahuan penghapusan halaman ==\nHalo ${targetVal},\n\nHalaman-halaman berikut yang Anda buat telah dihapus dengan alasan berikut: ${massdelReasonNotice}.\n\n${listed}\n\nHalaman yang dihapus tidak lagi dapat diakses secara publik. Jika Anda yakin ada penghapusan yang keliru, silakan sampaikan di halaman pembicaraan saya atau ikuti prosedur pemulihan halaman wiki ini.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : `== Page deletion notice ==\nDear ${targetVal},\n\nThe following pages you created have been deleted due to the following reason: ${massdelReasonNotice}.\n\n${listed}\n\nDeleted pages are no longer publicly accessible. If you believe any of these deletions were in error, please raise the matter on my user talk page or follow your wiki's undeletion process.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
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
              rs.notifyDeleteUserDone = true;
            }

            // Post deletion notifications in page mode, grouped by creator.
            // Each unique creator receives one consolidated notice listing all pages
            // deleted during this session that they created. The creatorMap was populated
            // during the deletion loop; entries are only present for confirmed deletions.
            // In multi-target runs, notifications are deferred to the post-loop block
            // below so creators who had multiple target pages deleted receive a single
            // consolidated notice rather than one per page.
            if (
              !rs.notifyDeletePageDone &&
              !isMultiTarget &&
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
                  const massdelReasonNotice =
                    config.massdelReason && config.massdelReason.trim()
                      ? config.massdelReason
                      : useIndonesian
                        ? "(tidak ada alasan diberikan)"
                        : "(no reason given)";
                  let notice;
                  if (titles.length === 1) {
                    notice = useIndonesian
                      ? `== Pemberitahuan penghapusan halaman ==\nHalo ${creator},\n\nHalaman "${titles[0]}" yang Anda buat telah dihapus dengan alasan berikut: ${massdelReasonNotice}.\n\nHalaman yang dihapus tidak lagi dapat diakses secara publik. Jika Anda yakin penghapusan ini keliru, silakan sampaikan di halaman pembicaraan saya atau ikuti prosedur pemulihan halaman wiki ini.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                      : `== Page deletion notice ==\nDear ${creator},\n\nThe page "${titles[0]}" you created has been deleted due to the following reason: ${massdelReasonNotice}.\n\nDeleted pages are no longer publicly accessible. If you believe this deletion was in error, please raise the matter on my user talk page or follow your wiki's undeletion process.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                  } else {
                    const listed = titles.map((t) => `* "${t}"`).join("\n");
                    notice = useIndonesian
                      ? `== Pemberitahuan penghapusan halaman ==\nHalo ${creator},\n\nHalaman-halaman berikut yang Anda buat telah dihapus dengan alasan berikut: ${massdelReasonNotice}.\n\n${listed}\n\nHalaman yang dihapus tidak lagi dapat diakses secara publik. Jika Anda yakin ada penghapusan yang keliru, silakan sampaikan di halaman pembicaraan saya atau ikuti prosedur pemulihan halaman wiki ini.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                      : `== Page deletion notice ==\nDear ${creator},\n\nThe following pages you created have been deleted due to the following reason: ${massdelReasonNotice}.\n\n${listed}\n\nDeleted pages are no longer publicly accessible. If you believe any of these deletions were in error, please raise the matter on my user talk page or follow your wiki's undeletion process.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
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
                await new Promise((resolve) =>
                  setTimeout(resolve, THROTTLE_MS),
                );
              }
              if (!isAborted) rs.notifyDeletePageDone = true;
            }

            // --- Recreation protection (page mode, non-existent page) ---
            // Uses create= protection, which is the correct API parameter for
            // preventing a deleted or never-created page from being recreated.
            // Unlike edit=/move= protection, this only applies to missing pages.
            if (
              !rs.protectRecreationDone &&
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
              rs.protectRecreationDone = true;
            }

            // Second protect pass: protect pages that were deferred until after deletion.
            // Only pages that were actually deleted are protected here.
            if (
              config.protect &&
              pagesToProtectAfterDel.size > 0 &&
              !rs.secondProtectDone
            ) {
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
                        talkProtectParams.expiry = `${config.protectExpiry}|${config.protectMoveExpiry}`;
                        if (config.protectCascade)
                          talkProtectParams.cascade = "";
                      }
                      await apiPost(talkProtectParams);
                      addLog(
                        `[Protect] Protected talk page: ${talkForProtect}`,
                      );
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
                await new Promise((resolve) =>
                  setTimeout(resolve, THROTTLE_MS),
                );
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
                    const protectReasonNotice =
                      config.protectReason && config.protectReason.trim()
                        ? config.protectReason
                        : useIndonesian
                          ? "(tidak ada alasan diberikan)"
                          : "(no reason given)";
                    if (titles.length === 1) {
                      notice = useIndonesian
                        ? isProtectIndefDeferred
                          ? `== Pemberitahuan perlindungan halaman ==\nHalaman "${titles[0]}" telah dilindungi secara tidak terbatas dengan alasan berikut: ${protectReasonNotice}.\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan ini tidak berakhir secara otomatis dan akan tetap berlaku kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                          : `== Pemberitahuan perlindungan halaman ==\nHalaman "${titles[0]}" telah dilindungi selama ${translateDurationId(config.protectExpiry)} dengan alasan berikut: ${protectReasonNotice}.\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan dijadwalkan berakhir pada waktunya, kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                        : `== Page protection notice ==\nThe page "${titles[0]}" has been protected ${protectExpiryDisplay} due to the following reason: ${protectReasonNotice}.\n\nDuring the protection period, some or all editing actions may be restricted depending on the level of protection applied. ${protectExpiryText}\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                    } else {
                      const listed = titles.map((t) => `"${t}"`).join(" and ");
                      const listedId = titles
                        .map((t) => `"${t}"`)
                        .join(" dan ");
                      notice = useIndonesian
                        ? isProtectIndefDeferred
                          ? `== Pemberitahuan perlindungan halaman ==\nHalaman-halaman berikut telah dilindungi secara tidak terbatas dengan alasan berikut: ${protectReasonNotice}.\n\n${listedId}\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan pada halaman-halaman ini mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan ini tidak berakhir secara otomatis dan akan tetap berlaku kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                          : `== Pemberitahuan perlindungan halaman ==\nHalaman-halaman berikut telah dilindungi selama ${translateDurationId(config.protectExpiry)} dengan alasan berikut: ${protectReasonNotice}.\n\n${listedId}\n\nSelama masa perlindungan, sebagian atau seluruh tindakan penyuntingan pada halaman-halaman ini mungkin dibatasi bergantung pada tingkat perlindungan yang diterapkan. Perlindungan dijadwalkan berakhir pada waktunya, kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                        : `== Page protection notice ==\nThe following pages have been protected ${protectExpiryDisplay} due to the following reason: ${protectReasonNotice}.\n\n${listed}\n\nDuring the protection period, some or all editing actions on these pages may be restricted depending on the level of protection applied. ${protectExpiryText}\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
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
              if (!isAborted) rs.secondProtectDone = true;
            }

            // Remove wikilinks to deleted pages from articles in the main namespace.
            // Skips all namespaces other than NS0. Runs for each successfully deleted
            // page. Each matching article is fetched, its wikilinks replaced with
            // plain text, and saved with a labelled edit summary.
            if (
              config.massdelUnlink &&
              deletedTitles.length > 0 &&
              !rs.unlinkLoopDone
            ) {
              for (const delTitle of deletedTitles) {
                if (isAborted) break;
                if (rs.processedUnlinkTitles.has(delTitle)) continue;

                // Detect whether the deleted item is a file. File embeds and
                // gallery entries use different wikitext forms than plain page
                // links, and MediaWiki tracks file usage via imageinfo/imageusage
                // rather than the pagelinks table used by list=backlinks.
                // [NOT CONFIRMED] — this branch has not been independently verified
                // against a live wiki; the file-delinking feature is experimental.
                let isFileDeletion = false;
                let fileMain = null;
                try {
                  const delTitleObj = new mw.Title(delTitle);
                  isFileDeletion = delTitleObj.getNamespaceId() === 6;
                  if (isFileDeletion) fileMain = delTitleObj.getMain();
                } catch (e) {
                  // Leave isFileDeletion false if the title cannot be resolved.
                }

                addLog(
                  `[Unlink] Searching for ${isFileDeletion ? "references to file" : "links to"}: ${delTitle}...`,
                );

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

                // File-specific patterns, built only when the deleted item is a file.
                // The "File"/"Image" namespace aliases and gallery line syntax
                // used below cover the common cases but may not match every valid form
                // (e.g. localised namespace aliases on this wiki).
                let galleryLineRe = null;
                if (isFileDeletion && fileMain) {
                  const escapedFileName = fileMain
                    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                    .replace(/[ _]/g, "[ _]");
                  // Matches a bare gallery entry on its own line, e.g.
                  // "File:Example.jpg|caption", as used inside <gallery> tags.
                  // Whole [[File:...]]/[[Image:...]] embeds are now handled
                  // separately by removeBalancedFileEmbeds(), which correctly
                  // handles nested wikilinks and templates within the caption.
                  galleryLineRe = new RegExp(
                    "^[ \\t]*(?:[Ff]ile|[Ii]mage)\\s*:\\s*" +
                      escapedFileName +
                      "[ \\t]*(?:\\|.*)?$\\n?",
                    "gim",
                  );
                }

                let continueToken;
                do {
                  if (isAborted) break;
                  try {
                    let links;
                    if (isFileDeletion) {
                      // list=imageusage tracks file embeds/transclusions, unlike
                      // list=backlinks which only tracks pagelinks-table wikilinks.
                      const iuParams = {
                        action: "query",
                        list: "imageusage",
                        iutitle: delTitle,
                        iunamespace: 0, // Main namespace only
                        iulimit: 50,
                      };
                      if (continueToken) iuParams.iucontinue = continueToken;
                      const iuData = await apiGet(iuParams);
                      continueToken =
                        iuData.continue && iuData.continue.iucontinue;
                      links = (iuData.query && iuData.query.imageusage) || [];
                    } else {
                      const blParams = {
                        action: "query",
                        list: "backlinks",
                        bltitle: delTitle,
                        blnamespace: 0, // Main namespace only
                        bllimit: 50,
                      };
                      if (continueToken) blParams.blcontinue = continueToken;
                      const blData = await apiGet(blParams);
                      continueToken =
                        blData.continue && blData.continue.blcontinue;
                      links = (blData.query && blData.query.backlinks) || [];
                    }

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

                        let newWikitext;
                        if (isFileDeletion) {
                          // Remove whole file embeds (including any nested
                          // wikilinks or templates within the caption) and gallery
                          // lines referencing the deleted file. Neither form has a
                          // meaningful display-text fallback, so the match is
                          // deleted outright. removeBalancedFileEmbeds() tracks
                          // bracket depth instead of using a regex, since a regex
                          // stops at the first "]]" and would otherwise truncate
                          // the embed at a nested link inside the caption.
                          newWikitext = removeBalancedFileEmbeds(
                            wikitext,
                            fileMain,
                          ).replace(galleryLineRe, "");
                        } else {
                          // Replace each matching wikilink with its display text,
                          // or with the base page title if no display text is present.
                          newWikitext = wikitext.replace(
                            linkRe,
                            function (match, displayText) {
                              return displayText !== undefined
                                ? displayText
                                : delTitle;
                            },
                          );
                        }

                        if (newWikitext === wikitext) continue; // No matching references found in content

                        await apiPost({
                          action: "edit",
                          title: linkTitle,
                          text: newWikitext,
                          summary:
                            (useIndonesian
                              ? isFileDeletion
                                ? "Menghapus referensi ke berkas yang sudah dihapus: "
                                : "Menghapus pranala ke halaman yang sudah dihapus: "
                              : isFileDeletion
                                ? "Removing references to deleted file: "
                                : "Removing links to deleted page: ") +
                            delTitle +
                            toolTag,
                          bot: true,
                        });
                        addLog(
                          `[Unlink] Removed ${isFileDeletion ? "references to file" : "links to"} "${delTitle}" in: ${linkTitle}`,
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
                      `[Unlink] Failed to fetch ${isFileDeletion ? "file usage" : "backlinks"} for "${delTitle}": ${formatApiError(e)}`,
                      true,
                    );
                    break;
                  }
                } while (continueToken && !isAborted);
                rs.processedUnlinkTitles.add(delTitle);
              }
              if (!isAborted) rs.unlinkLoopDone = true;
            }

            // --- Fix redirects ---
            // Fetches all pages that link to the target page (redirect A) via
            // list=backlinks, then replaces those links with links pointing to
            // the user-specified destination page B. Section anchors and display
            // text are preserved in the replacement.
            if (
              config.fixRedirects &&
              config.mode === "page" &&
              !rs.fixRedirectsDone &&
              !isAborted
            ) {
              const sourceTitle = targetVal;
              const destTitle = config.fixRedirectsDest;

              if (!destTitle) {
                addLog(
                  "[Fix redirects] No destination specified; skipping.",
                  "warn",
                );
              } else {
                const escapedSource = sourceTitle
                  .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                  .replace(/[ _]/g, "[ _]");
                // Group 1: section anchor (optional). Group 2: display text (optional).
                const linkRe = new RegExp(
                  "\\[\\[\\s*" +
                    escapedSource +
                    "\\s*(#[^|\\]]*)?(?:\\|([^\\]]*?))?\\]\\]",
                  "gi",
                );

                addLog(
                  `[Fix redirects] Searching for pages linking to: ${sourceTitle}...`,
                );

                let blContinue;
                do {
                  if (isAborted) break;
                  const blParams = {
                    action: "query",
                    list: "backlinks",
                    bltitle: sourceTitle,
                    bllimit: 50,
                    formatversion: 2,
                  };
                  if (blContinue) blParams.blcontinue = blContinue;
                  try {
                    const blData = await apiGet(blParams);
                    blContinue = blData.continue && blData.continue.blcontinue;
                    const links =
                      (blData.query && blData.query.backlinks) || [];
                    for (const link of links) {
                      if (isAborted) break;
                      const linkTitle = link.title;
                      if (rs.processedFixRedirectsTitles.has(linkTitle))
                        continue;
                      try {
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
                        if (!page || page.missing) {
                          rs.processedFixRedirectsTitles.add(linkTitle);
                          continue;
                        }
                        const slot =
                          page.revisions &&
                          page.revisions[0] &&
                          page.revisions[0].slots &&
                          page.revisions[0].slots.main;
                        if (!slot) {
                          rs.processedFixRedirectsTitles.add(linkTitle);
                          continue;
                        }
                        const wikitext = slot.content;
                        // Replace [[A]], [[A|text]], [[A#section]], [[A#section|text]]
                        // with the equivalent link pointing to destTitle.
                        const newWikitext = wikitext.replace(
                          linkRe,
                          function (match, section, displayText) {
                            const sec = section || "";
                            if (displayText !== undefined) {
                              return (
                                "[[" +
                                destTitle +
                                sec +
                                "|" +
                                displayText +
                                "]]"
                              );
                            }
                            return "[[" + destTitle + sec + "]]";
                          },
                        );
                        if (newWikitext === wikitext) {
                          rs.processedFixRedirectsTitles.add(linkTitle);
                          continue;
                        }
                        await apiPost({
                          action: "edit",
                          title: linkTitle,
                          text: newWikitext,
                          summary: config.fixRedirectsReason + toolTag,
                          bot: true,
                        });
                        addLog(
                          `[Fix redirects] Updated links in: ${linkTitle}`,
                        );
                        stats.redirfix++;
                        updateStatusDisplay();
                      } catch (e) {
                        addLog(
                          `[Fix redirects] Failed to update ${linkTitle}: ${formatApiError(e)}`,
                          true,
                        );
                      }
                      rs.processedFixRedirectsTitles.add(linkTitle);
                      await new Promise((resolve) =>
                        setTimeout(resolve, THROTTLE_MS),
                      );
                    }
                  } catch (e) {
                    addLog(
                      `[Fix redirects] Failed to fetch backlinks for "${sourceTitle}": ${formatApiError(e)}`,
                      true,
                    );
                    break;
                  }
                } while (blContinue && !isAborted);
              }
              if (!isAborted) rs.fixRedirectsDone = true;
            }
          }

          // Clear the per-target log prefix now that the target loop has finished.
          if (isMultiTarget) currentTargetLabel = "";

          // Dispatch consolidated page-mode deletion notifications in multi-target runs.
          // Runs once after all targets have been processed so creators who had multiple
          // target pages deleted receive one notification listing all affected pages.
          if (
            isMultiTarget &&
            config.massdel &&
            config.mode === "page" &&
            multiTargetCreatorMap.size > 0 &&
            config.notifyDelete &&
            !isAborted
          ) {
            for (const [creator, titles] of multiTargetCreatorMap) {
              if (isAborted) break;
              const talkTitle = new mw.Title(creator, 3).getPrefixedText();
              try {
                const talkExists = await pageExists(talkTitle);
                const massdelReasonNotice =
                  config.massdelReason && config.massdelReason.trim()
                    ? config.massdelReason
                    : useIndonesian
                      ? "(tidak ada alasan diberikan)"
                      : "(no reason given)";
                let notice;
                if (titles.length === 1) {
                  notice = useIndonesian
                    ? `== Pemberitahuan penghapusan halaman ==\nHalo ${creator},\n\nHalaman "${titles[0]}" yang Anda buat telah dihapus dengan alasan berikut: ${massdelReasonNotice}.\n\nHalaman yang dihapus tidak lagi dapat diakses secara publik. Jika Anda yakin penghapusan ini keliru, silakan sampaikan di halaman pembicaraan saya atau ikuti prosedur pemulihan halaman wiki ini.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : `== Page deletion notice ==\nDear ${creator},\n\nThe page "${titles[0]}" you created has been deleted due to the following reason: ${massdelReasonNotice}.\n\nDeleted pages are no longer publicly accessible. If you believe this deletion was in error, please raise the matter on my user talk page or follow your wiki's undeletion process.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                } else {
                  const listed = titles.map((t) => `* "${t}"`).join("\n");
                  notice = useIndonesian
                    ? `== Pemberitahuan penghapusan halaman ==\nHalo ${creator},\n\nHalaman-halaman berikut yang Anda buat telah dihapus dengan alasan berikut: ${massdelReasonNotice}.\n\n${listed}\n\nHalaman yang dihapus tidak lagi dapat diakses secara publik. Jika Anda yakin ada penghapusan yang keliru, silakan sampaikan di halaman pembicaraan saya atau ikuti prosedur pemulihan halaman wiki ini.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : `== Page deletion notice ==\nDear ${creator},\n\nThe following pages you created have been deleted due to the following reason: ${massdelReasonNotice}.\n\n${listed}\n\nDeleted pages are no longer publicly accessible. If you believe any of these deletions were in error, please raise the matter on my user talk page or follow your wiki's undeletion process.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
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

          // Termination and interface cleanup operations
          btnAbort.style.display = "none";

          const methodTxt =
            config.rollbackMethod === "undo" ? "undone" : "reverted";
          const completionSummary = buildCompletionSummary(
            stats,
            isAborted,
            methodTxt,
          );
          statusTextSpan.innerHTML = "<b>Status:</b> " + completionSummary;

          if (isAborted) {
            addLog("⏹️ Operations aborted by user");
            // Resume is only supported for single-target runs. Multi-target
            // runs would require per-target phase tracking to resume correctly.
            if (!isMultiTarget) {
              resumeState = rs;
            }
          } else {
            addLog("✅ All operations have been completed successfully");
          }
          btnClose.disabled = false;

          // Insert "Resume" button when the run was aborted part-way through.
          // Not offered for multi-target runs.
          if (isAborted && !isMultiTarget) {
            const btnResume = makeBtn("Resume operations", "primary");
            btnResume.title =
              "Continue the task from where it was interrupted, skipping already-completed steps";
            btnResume.addEventListener("click", function () {
              // Remove the progress overlay without triggering the onClose page-reload
              // handler, so the new work() run can open its own fresh overlay.
              overlay.remove();
              const idx = overlayStack.indexOf(overlay);
              if (idx > -1) overlayStack.splice(idx, 1);
              work();
            });
            footer.insertBefore(btnResume, btnClose);
          }

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

          // Return a relative time string (e.g. "3 months ago") for a given ISO timestamp.
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
            if (diffHr < 24)
              return diffHr + " hour" + (diffHr !== 1 ? "s" : "") + " ago";
            const diffDay = Math.floor(diffHr / 24);
            if (diffDay < 7)
              return diffDay + " day" + (diffDay !== 1 ? "s" : "") + " ago";
            if (diffDay < 30) {
              const diffWeek = Math.floor(diffDay / 7);
              return diffWeek + " week" + (diffWeek !== 1 ? "s" : "") + " ago";
            }
            if (diffDay < 365) {
              const diffMonth = Math.max(1, Math.floor(diffDay / 30.4375));
              return (
                diffMonth + " month" + (diffMonth !== 1 ? "s" : "") + " ago"
              );
            }
            const diffYear = Math.max(1, Math.round(diffDay / 365.25));
            return diffYear + " year" + (diffYear !== 1 ? "s" : "") + " ago";
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

          // --- Account info card ---
          // Displayed above the Access rights card. Shows local and global
          // edit counts, registration date, and (for registered accounts
          // only) any previous usernames found in the local rename log.
          const accountInfoCard = document.createElement("div");
          accountInfoCard.className = "tng-user-rights-card";

          const accountInfoCardHdr = document.createElement("div");
          accountInfoCardHdr.className = "tng-user-rights-header";
          const accountInfoCardHdrTitle = document.createElement("span");
          accountInfoCardHdrTitle.textContent = "🛂 Account info";
          accountInfoCardHdr.appendChild(accountInfoCardHdrTitle);
          const accountInfoCardArrow = document.createElement("span");
          accountInfoCardArrow.className = "tng-section-arrow tng-arrow-up";
          accountInfoCardHdr.appendChild(accountInfoCardArrow);
          accountInfoCardHdr.addEventListener("click", function () {
            const isHidden = accountInfoCardBody.classList.toggle("tng-hidden");
            accountInfoCardArrow.classList.toggle("tng-arrow-up", !isHidden);
          });
          accountInfoCard.appendChild(accountInfoCardHdr);

          const accountInfoCardBody = document.createElement("div");
          accountInfoCardBody.className = "tng-user-rights-body";
          accountInfoCard.appendChild(accountInfoCardBody);

          // Local edits row
          const localEditsRow = document.createElement("div");
          localEditsRow.className = "tng-user-rights-row";
          const localEditsScope = document.createElement("div");
          localEditsScope.className = "tng-user-rights-scope";
          localEditsScope.textContent = "Local edits — " + localWikiId;
          localEditsRow.appendChild(localEditsScope);
          const localEditsBody = document.createElement("div");
          localEditsBody.className = "tng-info-loading";
          localEditsBody.textContent = "Loading...";
          localEditsRow.appendChild(localEditsBody);
          accountInfoCardBody.appendChild(localEditsRow);

          // Global edits row (skipped for IP addresses, which have no
          // CentralAuth account)
          const globalEditsRow = document.createElement("div");
          globalEditsRow.className = "tng-user-rights-row";
          const globalEditsScope = document.createElement("div");
          globalEditsScope.className = "tng-user-rights-scope";
          globalEditsScope.textContent = "Global edits";
          globalEditsRow.appendChild(globalEditsScope);
          const globalEditsBody = document.createElement("div");
          globalEditsBody.className = isTargetIP
            ? "tng-info-empty"
            : "tng-info-loading";
          globalEditsBody.textContent = isTargetIP
            ? "Not applicable for IP addresses."
            : "Loading...";
          globalEditsRow.appendChild(globalEditsBody);
          accountInfoCardBody.appendChild(globalEditsRow);

          // Registration date row
          const registrationRow = document.createElement("div");
          registrationRow.className = "tng-user-rights-row";
          const registrationScope = document.createElement("div");
          registrationScope.className = "tng-user-rights-scope";
          registrationScope.textContent = "Registration date";
          registrationRow.appendChild(registrationScope);
          const registrationBody = document.createElement("div");
          registrationBody.className = "tng-info-loading";
          registrationBody.textContent = "Loading...";
          registrationRow.appendChild(registrationBody);
          accountInfoCardBody.appendChild(registrationRow);

          // Previous usernames row — registered accounts only. Not shown
          // for IP addresses or temporary accounts, since neither can hold
          // a rename history.
          const isTargetTempAccount = /^~\d{4}-\d+-\d+$/.test(username);
          let previousNamesBody = null;
          if (!isTargetIP && !isTargetTempAccount) {
            const previousNamesRow = document.createElement("div");
            previousNamesRow.className = "tng-user-rights-row";
            const previousNamesScope = document.createElement("div");
            previousNamesScope.className = "tng-user-rights-scope";
            previousNamesScope.textContent = "Previous usernames";
            previousNamesRow.appendChild(previousNamesScope);
            previousNamesBody = document.createElement("div");
            previousNamesBody.className = "tng-info-loading";
            previousNamesBody.textContent = "Loading...";
            previousNamesRow.appendChild(previousNamesBody);
            accountInfoCardBody.appendChild(previousNamesRow);
          }

          body.appendChild(accountInfoCard);

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

          // Local rights request. Also requests editcount and registration
          // date, which are exposed via the same usprop parameter, so no
          // separate API call is needed for the account info row.
          (async function () {
            try {
              const data = await apiGet({
                action: "query",
                list: "users",
                ususers: username,
                usprop: "groups|rights|editcount|registration",
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
                registrationBody.textContent =
                  "Account not found on this wiki.";
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

                localEditsBody.className = "tng-user-rights-list";
                localEditsBody.textContent =
                  userEntry.editcount !== undefined
                    ? userEntry.editcount.toLocaleString()
                    : "—";

                // Accounts registered before registration logging
                // was introduced on a given wiki may not have this field set.
                registrationBody.className = "tng-user-rights-list";
                registrationBody.textContent = userEntry.registration
                  ? fmtTimestamp(userEntry.registration) +
                    (fmtRelative(userEntry.registration)
                      ? " (" + fmtRelative(userEntry.registration) + ")"
                      : "")
                  : "Unknown (may predate registration logging)";
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
                  globalEditsBody.className = "tng-user-rights-list";
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
          // Queries both the local wiki's renameuser log and Meta-Wiki's
          // global rename log (via CentralAuth), and merges the old
          // username(s) found in either. Most Wikimedia accounts are
          // renamed globally through Special:GlobalRenameUser, which is
          // recorded on Meta-Wiki as a gblrename log entry rather than in
          // the local wiki's renameuser log; querying the local log alone
          // therefore missed previous usernames for globally renamed
          // accounts. Both log types are assumed to record
          // olduser/newuser parameters and to be searchable by the
          // account's current username via letitle, following the same
          // convention as the local renameuser log.
          if (previousNamesBody) {
            (async function () {
              // Recursively walks the CentralAuth global rename chain,
              // starting from the current username, via Meta-Wiki's
              // gblrename log (action=query&list=logevents&letype=gblrename
              // against foreignApiGet()) — the API-based equivalent of the
              // rename history shown on Special:CentralAuth/<username>.
              // This assumes gblrename log entries record
              // olduser/newuser parameters and are searchable by the
              // renamed-to username via letitle; this has not been
              // independently confirmed against a live wiki.
              //
              // Each discovered previous username is looked up in turn
              // (Special:CentralAuth/<previous username>, via the same API
              // call) so the full rename chain is reconstructed, e.g.
              // Rachmat02 → Rachmat01 → Rachmat. A seen-usernames guard
              // prevents infinite loops or duplicate entries if the API
              // returns malformed or cyclical data.
              const chain = []; // Previous usernames, nearest-first
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
                    letitle: "User:" + currentName,
                    lelimit: 50,
                    leprop: "details|timestamp",
                  });
                  const entries =
                    (data && data.query && data.query.logevents) || [];
                  // Prefer the entry that explicitly renamed *to* the
                  // current name in the chain.
                  for (const e of entries) {
                    const params = e.params || {};
                    if (params.newuser === currentName && params.olduser) {
                      oldUser = params.olduser;
                      break;
                    }
                  }
                  // Fall back to the first olduser found, matching the
                  // previous (non-recursive) lookup's behaviour, in case
                  // newuser is not present in the response.
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
                  // A failure on the initial/current username means no
                  // rename history can be shown at all. A failure partway
                  // through the chain stops traversal there but keeps
                  // whatever was already discovered.
                  if (currentName === username) initialLookupFailed = true;
                  break;
                }

                if (oldUser && !seen.has(oldUser)) {
                  chain.push(oldUser);
                  seen.add(oldUser);
                  currentName = oldUser;
                } else {
                  currentName = null; // No earlier rename, or a duplicate/cycle
                }
              }

              if (initialLookupFailed) {
                previousNamesBody.className = "tng-info-empty";
                previousNamesBody.textContent =
                  "Could not load previous usernames.";
              } else if (chain.length) {
                // chain is nearest-previous-first; reverse for chronological
                // (oldest-first) display order.
                previousNamesBody.className = "tng-user-rights-list";
                previousNamesBody.textContent = chain
                  .slice()
                  .reverse()
                  .join(" → ");
              } else {
                previousNamesBody.className = "tng-info-empty";
                previousNamesBody.textContent = "No previous usernames found.";
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
            if (diffHr < 24)
              return diffHr + " hour" + (diffHr !== 1 ? "s" : "") + " ago";
            const diffDay = Math.floor(diffHr / 24);
            if (diffDay < 7)
              return diffDay + " day" + (diffDay !== 1 ? "s" : "") + " ago";
            if (diffDay < 30) {
              const diffWeek = Math.floor(diffDay / 7);
              return diffWeek + " week" + (diffWeek !== 1 ? "s" : "") + " ago";
            }
            if (diffDay < 365) {
              const diffMonth = Math.max(1, Math.floor(diffDay / 30.4375));
              return (
                diffMonth + " month" + (diffMonth !== 1 ? "s" : "") + " ago"
              );
            }
            const diffYear = Math.max(1, Math.round(diffDay / 365.25));
            return diffYear + " year" + (diffYear !== 1 ? "s" : "") + " ago";
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

          // Build the five display-only collapsible sections
          const {
            section: secCurrentRev,
            sectionBody: bodyCurrentRev,
            arrow: arrowCurrentRev,
          } = makeDisplaySection("Current revision", "📊");
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

          setLoading(bodyCurrentRev, "Loading current revision info...");
          setLoading(bodyWhatLinksHere, "Loading pages that link here...");
          setLoading(bodyAbuseLog, "Loading abuse filter log...");
          setLoading(bodyProtectLog, "Loading protection log...");
          setLoading(bodyDeleteLog, "Loading deletion log...");
          setLoading(bodyMoveLog, "Loading move log...");

          body.appendChild(secCurrentRev);
          body.appendChild(secWhatLinksHere);
          body.appendChild(secAbuseLog);
          body.appendChild(secProtectLog);
          body.appendChild(secDeleteLog);
          body.appendChild(secMoveLog);

          const btnClose = makeBtn("Close", "quiet");
          btnClose.addEventListener("click", () => overlay.closeHandler());
          footer.appendChild(btnClose);

          // --- Current revision ---
          // Page size and last editor/timestamp come from a single prop=info +
          // prop=revisions request; creation date from a second revisions
          // request (rvdir=newer, rvlimit=1). Revision count is capped at 500
          // per request to avoid an expensive full-history fetch on pages with
          // a long edit history; if more exist, the count is shown as "500+".
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
                infoData.query &&
                infoData.query.pages &&
                infoData.query.pages[0];
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
                // Leave as "—" if this request fails; the rest of the panel is unaffected.
              }

              bodyCurrentRev.classList.remove("tng-hidden");
              arrowCurrentRev.classList.add("tng-arrow-up");
              bodyCurrentRev.innerHTML = "";
              bodyCurrentRev.appendChild(
                makeEntry([
                  [
                    "Page size",
                    infoPage.length !== undefined
                      ? infoPage.length.toLocaleString() + " bytes"
                      : "—",
                  ],
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
                  ["Revision count", revCountLabel],
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
                ]),
              );
            } catch (err) {
              setError(
                bodyCurrentRev,
                "Failed to load current revision info: " + formatApiError(err),
              );
            }
          })();

          // --- What links here ---
          (async function () {
            try {
              const data = await apiGet({
                action: "query",
                list: "backlinks",
                bltitle: pageName,
                bllimit: 100,
                formatversion: 2,
              });
              const entries = (data.query && data.query.backlinks) || [];
              const hasMore = !!data.continue;
              if (!entries.length) {
                setEmpty(bodyWhatLinksHere, "No pages link to this page.");
                return;
              }
              // Auto-expand: entries found are likely of interest
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
                rowEl.appendChild(numEl);
                rowEl.appendChild(linkEl);
                bodyWhatLinksHere.appendChild(rowEl);
              }
              if (hasMore) {
                const wlhSpecialTitle = "Special:WhatLinksHere/" + pageName;
                const noteEl = document.createElement("div");
                noteEl.className = "tng-help";
                noteEl.style.marginTop = "6px";
                const notePre = document.createTextNode(
                  "Showing the first 100 results. Visit ",
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
          // Move log entries are recorded under the page's title *at the time of
          // the move* (the source title), not the destination title. A page that
          // was moved into its current title therefore has no log_title match
          // against the current title itself — only against whatever title it
          // held before the move. To surface that history, redirects currently
          // pointing to the target (typically left behind by a previous move)
          // are also checked, since their titles are exactly the previous
          // titles this page may have held.
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
                // If the redirect lookup fails, fall back to checking only the
                // current title's own move log.
              }

              let entries = [];
              for (const t of titlesToCheck) {
                try {
                  const data = await apiGet({
                    action: "query",
                    list: "logevents",
                    letype: "move",
                    letitle: t,
                    lelimit: 50,
                    leprop: "user|timestamp|comment|details",
                  });
                  const found = (data.query && data.query.logevents) || [];
                  for (const e of found) {
                    e._tngSourceTitle = t;
                  }
                  entries = entries.concat(found);
                } catch (e) {
                  // Skip this title on failure; other titles are still checked.
                }
              }

              // Deduplicate (a redirect and the main title could theoretically
              // surface the same entry) and sort newest first.
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
                const rows = [
                  ["Time", fmtTimestamp(e.timestamp)],
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
                    } catch (e) {
                      /* empty */
                    }
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
                } catch (err) {
                  /* empty */
                }
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
        // [Section 08d] Active administrators
        // Shows administrators who have been active — via an edit or an
        // administrative log action — within the last 24 hours, sorted by most
        // recent activity first. Recent changes and log events are each fetched in
        // a single bulk query rather than one query per administrator, so an
        // admin's most recent action could be missed if it falls outside the most
        // recent 500 entries returned by either query on a very active wiki.
        // ============================================================================
        const getActiveAdmins = async function () {
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
            const cutoff = new Date(
              Date.now() - 24 * 60 * 60 * 1000,
            ).toISOString();

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

            const rcEntries =
              (rcData.query && rcData.query.recentchanges) || [];
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
              "️️⚠️️️ Failed to load recently active administrators and rights holders: " +
              formatApiError(e);
            body.appendChild(errEl);
          }
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

          // IP ranges are now supported as user-mode targets for the Block and
          // Unblock sections (see applyRangeTargetLocks()), so they no longer
          // force page mode by default.
          let tenguMode = isUserMode ? "user" : "page";
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

          // Checks whether this wiki has the FlaggedRevs (Pending Changes)
          // extension installed, via siprop=extensions. Pending changes
          // protection is only offered in the Page protection section when
          // this resolves true, since most Wikimedia wikis do not run it.
          const flaggedRevsPromise = new Promise(function (resolve) {
            rightsApi
              .get({
                action: "query",
                meta: "siteinfo",
                siprop: "extensions",
                formatversion: 2,
              })
              .done(function (data) {
                const extensions =
                  (data && data.query && data.query.extensions) || [];
                const hasFlaggedRevs = extensions.some(function (ext) {
                  return ext.name === "FlaggedRevs";
                });
                resolve({ hasFlaggedRevs: hasFlaggedRevs });
              })
              .fail(function () {
                resolve({ hasFlaggedRevs: false });
              });
          });

          // Fetches the list of namespaces available on this wiki, used to
          // populate the namespace selector in the Move page sub-mode of the
          // Move page section.
          const namespacesPromise = new Promise(function (resolve) {
            rightsApi
              .get({
                action: "query",
                meta: "siteinfo",
                siprop: "namespaces",
                formatversion: 2,
              })
              .done(function (data) {
                const nsObj =
                  (data && data.query && data.query.namespaces) || {};
                const list = Object.keys(nsObj)
                  .map(function (key) {
                    return nsObj[key];
                  })
                  .filter(function (n) {
                    return n.id >= 0; // Exclude Special (-1) and Media (-2)
                  })
                  .sort(function (a, b) {
                    return a.id - b.id;
                  });
                resolve(list);
              })
              .fail(function () {
                resolve([]);
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
          modeToggle.className = "tng-mode-switch-wrap";

          const btnModeUser = document.createElement("span");
          btnModeUser.className = "tng-mode-switch-label";
          btnModeUser.textContent = "👤 User mode";

          const modeSwitchLabel = document.createElement("label");
          modeSwitchLabel.className = "tng-mode-switch";
          const modeSwitchInput = document.createElement("input");
          modeSwitchInput.type = "checkbox";
          modeSwitchInput.className = "tng-mode-switch-input";
          const modeSwitchSlider = document.createElement("span");
          modeSwitchSlider.className = "tng-mode-switch-slider";
          modeSwitchLabel.appendChild(modeSwitchInput);
          modeSwitchLabel.appendChild(modeSwitchSlider);

          const btnModePage = document.createElement("span");
          btnModePage.className = "tng-mode-switch-label";
          btnModePage.textContent = "📄 Page mode";

          // Syncs the switch position and the active-label highlight with the
          // given mode. Does not itself call applyModeRestrictions(); callers
          // remain responsible for that, matching the previous click-handler pattern.
          function setModeSwitchActive(isUserModeNow) {
            modeSwitchInput.checked = !isUserModeNow;
            btnModeUser.classList.toggle(
              "tng-mode-switch-label-active-user",
              isUserModeNow,
            );
            btnModePage.classList.toggle(
              "tng-mode-switch-label-active-page",
              !isUserModeNow,
            );
          }

          // Dynamically map default execution target indicators on activation context
          setModeSwitchActive(tenguMode === "user");

          // Restrict user mode selection if current workspace context sits outside standard user profile areas
          if (!isUserNamespace) {
            btnModeUser.classList.add("tng-mode-switch-label-disabled");
            modeSwitchInput.disabled = true;
            btnModeUser.title =
              "User mode is only available when Tengu is launched from a user profile or contribution space";
          } else {
            // IP ranges (e.g. 192.168.0.0/16 or 2001:db8::/32) can be
            // targeted in user mode, but only the Block and Unblock sections
            // support range targets — rollback, revision deletion, warnings,
            // and reporting all require a specific account or single IP.
            if (isIPRange) {
              btnModeUser.title =
                "Only the Block and Unblock sections support IP range targets.";
            }
            btnModeUser.addEventListener("click", function () {
              if (tenguMode === "user") return;
              setModeSwitchActive(true);
              applyModeRestrictions(true);
            });
          }

          btnModePage.addEventListener("click", function () {
            if (tenguMode === "page") return;
            setModeSwitchActive(false);
            applyModeRestrictions(false);
          });

          modeSwitchInput.addEventListener("change", function () {
            const wantUser = !modeSwitchInput.checked;
            if (wantUser === (tenguMode === "user")) return;
            setModeSwitchActive(wantUser);
            applyModeRestrictions(wantUser);
          });

          modeToggle.appendChild(btnModeUser);
          modeToggle.appendChild(modeSwitchLabel);
          modeToggle.appendChild(btnModePage);
          fieldMode.appendChild(modeToggle);

          // Manual light/dark mode toggle — same row as the mode toggle
          // buttons. Shows the icon for the mode a click will switch *to*
          // (crescent moon in light mode, sun in dark mode).
          const btnActiveAdmins = makeBtn("👮", "quiet");
          btnActiveAdmins.className += " tng-btn-sm";
          btnActiveAdmins.title =
            "Show administrators and other advanced rights holders active within the last 24 hours";
          btnActiveAdmins.style.marginLeft = "auto";
          btnActiveAdmins.addEventListener("click", function () {
            getActiveAdmins();
          });
          fieldMode.appendChild(btnActiveAdmins);

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
            tenguMode === "user" ? "Username, IP, or IP range" : "Page title",
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

          // Multi-target mode — hidden until the checkbox is ticked.
          const { row: rowMultiTarget, field: fieldMultiTarget } =
            makeRow("Multi-target");

          const { wrap: wrapMultiTarget, chk: chkMultiTarget } = makeCheckbox(
            "Process additional targets",
            false,
          );
          wrapMultiTarget.title =
            "When ticked, a text area appears where additional targets can be" +
            " pasted one per line. The primary target above is always included." +
            " Status checks and section status notes reflect the primary target" +
            " only. GS/SRG report submissions apply to the primary target only." +
            " Resume is not available for multi-target runs.";

          const textareaMultiTarget = document.createElement("textarea");
          textareaMultiTarget.className = "tng-input";
          textareaMultiTarget.rows = 4;
          textareaMultiTarget.placeholder =
            "One target per line.\n" +
            "User mode: account names without the User: prefix.\n" +
            "Page mode: page titles with the namespace prefix where required.";
          textareaMultiTarget.style.cssText =
            "resize:vertical;font-family:monospace;font-size:1em;";

          const helpMultiTarget = document.createElement("div");
          helpMultiTarget.className = "tng-help";
          helpMultiTarget.textContent =
            "The primary target above is always processed first. Status checks," +
            " section status notes, and GS/SRG report submissions reflect the" +
            " primary target only. Resume is not available for multi-target runs.";

          const divMultiTargetPanel = document.createElement("div");
          divMultiTargetPanel.className = "tng-multitarget-panel";
          divMultiTargetPanel.appendChild(textareaMultiTarget);
          divMultiTargetPanel.appendChild(helpMultiTarget);

          chkMultiTarget.addEventListener("change", function () {
            divMultiTargetPanel.classList.toggle(
              "tng-multitarget-panel--open",
              chkMultiTarget.checked,
            );
          });

          fieldMultiTarget.style.flexDirection = "column";
          fieldMultiTarget.style.alignItems = "stretch";
          fieldMultiTarget.appendChild(wrapMultiTarget);
          fieldMultiTarget.appendChild(divMultiTargetPanel);
          topSection.appendChild(rowMultiTarget);

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
              updatePickerSelectionSummary();
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
              } catch (e) {
                /* empty */
              }
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
                } catch (e) {
                  /* empty */
                }
                wrap.dataset.pickerNsId = String(itemNsId);
                checkboxes.push(chk);
                listEl.appendChild(wrap);
              }

              // Shift-click range selection. Clicking a checkbox while holding
              // Shift extends the previous click's state (checked or unchecked)
              // to every visible checkbox between the previous click and this
              // one, matching standard range-selection behaviour found in
              // desktop and web file pickers. Only currently visible items
              // (i.e. not hidden by the namespace filter) are considered, so
              // the range does not silently include hidden rows.
              //
              // The visible range is resolved from listEl's live DOM order
              // rather than the static `checkboxes` array (which always
              // reflects the picker's original A–Z build order). Sorting via
              // the Oldest first / Newest first buttons reorders the DOM
              // (sortPickerListEl()) but never touches `checkboxes`, so a
              // range computed from that array no longer matched what was
              // actually displayed once a non-alphabetical sort was active.
              // The previously-clicked checkbox itself (rather than a cached
              // index) is tracked, so the range is also recomputed correctly
              // if the sort order changes between the two shift-click ends.
              let lastClickedChk = null;
              function visibleBoxesInDomOrder() {
                return Array.from(listEl.children)
                  .filter(function (wrap) {
                    return !wrap.classList.contains("tng-hidden");
                  })
                  .map(function (wrap) {
                    return wrap.querySelector('input[type="checkbox"]');
                  });
              }
              checkboxes.forEach(function (chk) {
                chk.addEventListener("click", function (e) {
                  const visibleBoxes = visibleBoxesInDomOrder();
                  const currentIndex = visibleBoxes.indexOf(chk);
                  const lastIndex = lastClickedChk
                    ? visibleBoxes.indexOf(lastClickedChk)
                    : -1;
                  if (e.shiftKey && lastIndex !== -1 && currentIndex !== -1) {
                    const start = Math.min(lastIndex, currentIndex);
                    const end = Math.max(lastIndex, currentIndex);
                    const checkedState = chk.checked;
                    for (let i = start; i <= end; i++) {
                      visibleBoxes[i].checked = checkedState;
                    }
                  }
                  if (currentIndex !== -1) lastClickedChk = chk;
                });
              });

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
              const applyPickerNamespaceFilter = function () {
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
              };
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
          const { wrap: wrapNotifyRollback, chk: chkNotifyRollback } =
            makeCheckbox("Notify target user of reverted edits", false);
          wrapNotifyRollback.title =
            "When ticked, a single notification listing every page reverted in this run (and the reason given) will be posted to the target user's talk page.";
          const checksRollback = document.createElement("div");
          checksRollback.className = "tng-checks";
          checksRollback.style.paddingLeft = "0";
          checksRollback.appendChild(wrapBot);
          checksRollback.appendChild(wrapShow);
          checksRollback.appendChild(wrapUndo);
          checksRollback.appendChild(wrapNotifyRollback);
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

              if (arrow) arrow.classList.remove("tng-arrow-up");

              hdr.title = "Unavailable: " + reason;
              const badge = document.createElement("span");
              badge.className = "tng-rights-lock tng-unblock-lock-badge";
              badge.textContent = "🔒";
              badge.title = "Unavailable: " + reason;
              if (arrow) hdr.insertBefore(badge, arrow);
              else hdr.appendChild(badge);
            } else {
              if (!unblockStatusLocked.has(chkUnblock)) return; // Not status-locked
              unblockStatusLocked.delete(chkUnblock);
              chkUnblock.disabled = false;
              secUnblock.classList.toggle("tng-disabled", !chkUnblock.checked);

              if (arrow) {
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
          // [EXPERIMENTAL] Lock account section — user mode only.
          // Globally locks a user account via CentralAuth, preventing it from
          // logging in to any Wikimedia wiki. Normally restricted to
          // stewards. The section stays visible to everyone so its existence
          // is discoverable, but its controls are disabled for non-stewards.
          // The API call performed in work() has not been independently confirmed
          // against a live wiki. Please verify carefully before relying on it.
          // ============================================================================
          const {
            section: secLockAccount,
            sectionBody: bodyLockAccount,
            enableChk: chkLockAccount,
          } = makeSection("Lock account", "🔧", false);

          const hdrLockAccount = secLockAccount.querySelector(
            ".tng-section-header",
          );
          const badgeLockAccountExperimental = document.createElement("span");
          badgeLockAccountExperimental.className = "tng-experimental-badge";
          badgeLockAccountExperimental.textContent = "EXPERIMENTAL";
          badgeLockAccountExperimental.title =
            "This feature has not been confirmed to work as expected. Please verify results carefully.";
          hdrLockAccount
            .querySelector(".tng-checkrow")
            .appendChild(badgeLockAccountExperimental);

          const divLockAccountStatus = document.createElement("div");
          divLockAccountStatus.className =
            "tng-status-note tng-status-note-loading";
          divLockAccountStatus.textContent =
            "Steward rights are required to use this feature.";
          bodyLockAccount.appendChild(divLockAccountStatus);

          const { row: rowLockAccountReason, field: fieldLockAccountReason } =
            makeRow("Reason");
          const selLockAccountReason = makeSelect(LOCK_ACCOUNT_REASONS);
          const {
            wrap: filteredWrapLockAccountReason,
            filter: filterLockAccountReason,
          } = makeFilteredSelect(selLockAccountReason);
          const inputLockAccountReason = makeInput("Full reason to submit");
          const btnLockAccountAppend = makeBtn("Append", "quiet");
          btnLockAccountAppend.className += " tng-btn-sm";
          btnLockAccountAppend.addEventListener("click", function () {
            const cur = inputLockAccountReason.value;
            const add = selLockAccountReason.value;
            if (!add) return;
            inputLockAccountReason.value = cur ? cur + "; " + add : add;
            selLockAccountReason.selectedIndex = 0;
            filterLockAccountReason.value = "";
            filterLockAccountReason.dispatchEvent(new Event("input"));
          });
          const reasonWrapLockAccount = document.createElement("div");
          reasonWrapLockAccount.className = "tng-reason-wrap";
          const reasonTopLockAccount = document.createElement("div");
          reasonTopLockAccount.className = "tng-reason-top";
          reasonTopLockAccount.appendChild(filteredWrapLockAccountReason);
          reasonTopLockAccount.appendChild(btnLockAccountAppend);
          reasonWrapLockAccount.appendChild(reasonTopLockAccount);
          reasonWrapLockAccount.appendChild(inputLockAccountReason);
          fieldLockAccountReason.appendChild(reasonWrapLockAccount);
          bodyLockAccount.appendChild(rowLockAccountReason);

          const {
            wrap: wrapLockAccountHideUsername,
            chk: chkLockAccountHideUsername,
          } = makeCheckbox(
            "Also request the username be hidden (lock and hide)",
            false,
          );
          wrapLockAccountHideUsername.title =
            "When ticked, the username will also be hidden from public logs, in addition to being locked.";
          const { wrap: wrapNotifyLockAccount, chk: chkNotifyLockAccount } =
            makeCheckbox("Send lock notification to user talk page", false);
          wrapNotifyLockAccount.title =
            "When ticked, a notification is posted to the target user's talk page after a successful lock. A locked account cannot read this, but it remains visible to other editors.";
          const checksLockAccount = document.createElement("div");
          checksLockAccount.className = "tng-checks";
          checksLockAccount.style.paddingLeft = "0";
          checksLockAccount.appendChild(wrapLockAccountHideUsername);
          checksLockAccount.appendChild(wrapNotifyLockAccount);
          bodyLockAccount.appendChild(checksLockAccount);

          body.appendChild(secLockAccount);

          // Reversible lock for this section, driven by steward status.
          // Tracked separately from the mode lock (applyModeLock) via its
          // own set, mirroring the pattern used by applyUnblockStatusLock().
          const lockAccountStatusLocked = new Set();
          function applyLockAccountStatusLock(locked, reason) {
            const arrow = secLockAccount.querySelector(".tng-section-arrow");

            if (locked) {
              if (lockAccountStatusLocked.has(chkLockAccount)) {
                hdrLockAccount.title = "Unavailable: " + reason;
                const existingBadge = hdrLockAccount.querySelector(
                  ".tng-lockaccount-lock-badge",
                );
                if (existingBadge)
                  existingBadge.title = "Unavailable: " + reason;
                return;
              }
              lockAccountStatusLocked.add(chkLockAccount);
              chkLockAccount.checked = false;
              chkLockAccount.disabled = true;
              secLockAccount.classList.add("tng-disabled");
              bodyLockAccount.classList.add("tng-hidden");
              if (arrow) arrow.classList.remove("tng-arrow-up");
              hdrLockAccount.title = "Unavailable: " + reason;
              const badge = document.createElement("span");
              badge.className = "tng-rights-lock tng-lockaccount-lock-badge";
              badge.textContent = "🔒";
              badge.title = "Unavailable: " + reason;
              if (arrow) hdrLockAccount.insertBefore(badge, arrow);
              else hdrLockAccount.appendChild(badge);
            } else {
              if (!lockAccountStatusLocked.has(chkLockAccount)) return;
              lockAccountStatusLocked.delete(chkLockAccount);
              chkLockAccount.disabled = false;
              secLockAccount.classList.toggle(
                "tng-disabled",
                !chkLockAccount.checked,
              );
              if (arrow) {
                arrow.classList.toggle(
                  "tng-arrow-up",
                  !bodyLockAccount.classList.contains("tng-hidden"),
                );
              }
              hdrLockAccount.title = "";
              const badge = hdrLockAccount.querySelector(
                ".tng-lockaccount-lock-badge",
              );
              if (badge) badge.remove();
            }
          }
          applyLockAccountStatusLock(
            true,
            "steward rights are required to use this feature.",
          );

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
              if (arrow) arrow.classList.remove("tng-arrow-up");
              hdr.title = "Unavailable: " + reason;
              const badge = document.createElement("span");
              badge.className = "tng-rights-lock tng-gs-lock-badge";
              badge.textContent = "🔒";
              badge.title = "Unavailable: " + reason;
              if (arrow) hdr.insertBefore(badge, arrow);
              else hdr.appendChild(badge);
            } else {
              if (!gsStatusLocked.has(chkGS)) return;
              gsStatusLocked.delete(chkGS);
              chkGS.disabled = false;
              secGS.classList.toggle("tng-disabled", !chkGS.checked);
              if (arrow) {
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
              "Remove links to deleted page or file (article namespace only)",
              false,
            );
          wrapPagedelUnlink.title =
            "When ticked, wikilinks pointing to each deleted page are removed from articles in the main namespace. When the deleted item is a file, references to it — including [[File:...]] embeds and <gallery> entries — are also removed. Talk pages, user pages, and other namespaces are not modified. File delinking is an experimental feature; please check the results carefully before relying on it.";
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
              if (arrow) arrow.classList.remove("tng-arrow-up");
              hdrUndelete.title = "Unavailable: " + reason;
              const badge = document.createElement("span");
              badge.className = "tng-rights-lock tng-undelete-lock-badge";
              badge.textContent = "🔒";
              badge.title = "Unavailable: " + reason;
              if (arrow) hdrUndelete.insertBefore(badge, arrow);
              else hdrUndelete.appendChild(badge);
            } else {
              if (!undeleteStatusLocked.has(chkUndelete)) return;
              undeleteStatusLocked.delete(chkUndelete);
              chkUndelete.disabled = false;
              secUndelete.classList.toggle(
                "tng-disabled",
                !chkUndelete.checked,
              );
              if (arrow) {
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
          // Namespace selector — occupies 35% of the row's width, with the
          // page title field taking the remaining 65%. Options are populated
          // once namespacesPromise resolves; a single "(Main)" placeholder
          // is shown until then.
          const selMovePageNs = makeSelect([{ value: "0", label: "(Main)" }]);
          const inputMovePageDest = makeInput("Page title");
          const movePageDestGroup = document.createElement("div");
          movePageDestGroup.style.cssText =
            "display: flex; gap: 6px; width: 100%;";
          const movePageNsWrap = wrapSelect(selMovePageNs);
          movePageNsWrap.style.flex = "0 0 35%";
          inputMovePageDest.style.flex = "1";
          movePageDestGroup.appendChild(movePageNsWrap);
          movePageDestGroup.appendChild(inputMovePageDest);
          fieldMovePageDest.appendChild(movePageDestGroup);
          divMovePagePanel.appendChild(rowMovePageDest);

          namespacesPromise.then(function (list) {
            selMovePageNs.innerHTML = "";
            list.forEach(function (n) {
              const opt = document.createElement("option");
              opt.value = String(n.id);
              opt.textContent =
                n.id === 0 ? "(Main)" : n.name || n.canonical || String(n.id);
              selMovePageNs.appendChild(opt);
            });
            updateMovePageDestFromTarget();
          });

          // Pre-fills the namespace selector and page title field (and the
          // Move-to-sandbox subpage field) from the current target's
          // namespace and page name. Shared by the initial mode setup, the
          // target-change handler, and namespacesPromise above, so the
          // namespace selector stays in sync however the target was set.
          function updateMovePageDestFromTarget() {
            const _pageTargetForMove = inputTarget.value.trim();
            if (!_pageTargetForMove) return;
            try {
              const _moveTargetObj = new mw.Title(_pageTargetForMove);
              selMovePageNs.value = String(_moveTargetObj.getNamespaceId());
              inputMovePageDest.value = _moveTargetObj
                .getMain()
                .replace(/_/g, " ");
              inputMoveSandboxSubpage.value = _moveTargetObj
                .getMain()
                .replace(/_/g, " ");
            } catch (e) {
              // Title could not be parsed; leave the fields as-is
            }
          }

          // Combines the selected namespace with the entered page title into
          // a full destination title. A namespace of "(Main)" is prefixed
          // with nothing, preserving the ability to type a fully prefixed
          // title directly if a user prefers to do so.
          function buildMovePageDestTitle() {
            const nsId = parseInt(selMovePageNs.value, 10) || 0;
            const pageName = inputMovePageDest.value.trim();
            if (!pageName) return "";
            if (nsId === 0) return pageName;
            const selectedOpt =
              selMovePageNs.options[selMovePageNs.selectedIndex];
            const nsName = selectedOpt ? selectedOpt.textContent : "";
            return nsName + ":" + pageName;
          }

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
            false,
          );
          chkMovePageTalk.disabled = true;
          wrapMovePageTalk.style.opacity = "0.5";
          wrapMovePageTalk.style.cursor = "not-allowed";
          wrapMovePageTalk.title =
            "When ticked, the associated talk page is also moved to the equivalent title under the destination namespace.";

          const { wrap: wrapMovePageSubpages, chk: chkMovePageSubpages } =
            makeCheckbox("Also move all subpages", false);
          wrapMovePageSubpages.title =
            "When ticked, all subpages of the source page are also moved to the corresponding subpages of the destination title. Only applies to namespaces that support subpages.";

          const {
            wrap: wrapMovePageFixDoubleRedirects,
            chk: chkMovePageFixDoubleRedirects,
          } = makeCheckbox("Fix double redirects", true);
          wrapMovePageFixDoubleRedirects.title =
            "When ticked, existing redirects that pointed to the source page are updated to point directly to the destination title, avoiding double redirects. Only applies when a redirect is left at the source title (i.e. when 'Suppress redirect' is not used).";

          const { wrap: wrapMovePageDeleteDest, chk: chkMovePageDeleteDest } =
            makeCheckbox(
              "Delete destination page if it already exists (destructive)",
              false,
            );
          wrapMovePageDeleteDest.title =
            "When ticked, if the destination title already has an existing page, that page is deleted immediately before the move is attempted, allowing the move to proceed. This is a destructive, irreversible-by-default action: verify the destination title carefully before enabling this option.";

          const checksMovePagePanel = document.createElement("div");
          checksMovePagePanel.className = "tng-checks";
          checksMovePagePanel.style.paddingLeft = "0";
          checksMovePagePanel.appendChild(wrapMovePageNoRedirect);
          checksMovePagePanel.appendChild(wrapMovePageTalk);
          checksMovePagePanel.appendChild(wrapMovePageSubpages);
          checksMovePagePanel.appendChild(wrapMovePageFixDoubleRedirects);
          checksMovePagePanel.appendChild(wrapMovePageDeleteDest);
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

          // Evaluates whether the "Also move the associated talk page" checkbox in the
          // Move page sub-mode should be available for the current target. Mirrors the
          // logic in updateMoveSandboxTalkAvailability(). Only runs in page mode.
          async function updateMovePageTalkAvailability() {
            const target = inputTarget.value.trim();
            if (!target || tenguMode !== "page") return;

            let isTalkPage = false;
            try {
              isTalkPage = new mw.Title(target).isTalkPage();
            } catch (e) {
              /* empty */
            }

            if (isTalkPage) {
              chkMovePageTalk.checked = false;
              chkMovePageTalk.disabled = true;
              wrapMovePageTalk.style.opacity = "0.5";
              wrapMovePageTalk.style.cursor = "not-allowed";
              wrapMovePageTalk.title =
                "Not available: the target page is itself a talk page.";
              return;
            }

            let talkTitle = null;
            try {
              talkTitle = new mw.Title(target).getTalkPage().getPrefixedText();
            } catch (e) {
              /* empty */
            }

            if (!talkTitle) {
              chkMovePageTalk.checked = false;
              chkMovePageTalk.disabled = true;
              wrapMovePageTalk.style.opacity = "0.5";
              wrapMovePageTalk.style.cursor = "not-allowed";
              wrapMovePageTalk.title =
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
                chkMovePageTalk.disabled = false;
                wrapMovePageTalk.style.opacity = "";
                wrapMovePageTalk.style.cursor = "";
                wrapMovePageTalk.title =
                  "When ticked, the associated talk page is also moved to the equivalent title under the destination namespace.";
              } else {
                chkMovePageTalk.checked = false;
                chkMovePageTalk.disabled = true;
                wrapMovePageTalk.style.opacity = "0.5";
                wrapMovePageTalk.style.cursor = "not-allowed";
                wrapMovePageTalk.title =
                  "Not available: no talk page exists for this page.";
              }
            } catch (e) {
              // API call failed; leave the checkbox enabled so the user can still try.
              chkMovePageTalk.disabled = false;
              wrapMovePageTalk.style.opacity = "";
              wrapMovePageTalk.style.cursor = "";
            }
          }

          // Evaluates whether the "Also delete the talk page" checkbox in the Page
          // deletion section should be available for the current target. In page mode,
          // checks whether an associated talk page exists for the target. In user mode,
          // the pages to delete are determined dynamically from contributions, so the
          // option remains always enabled.
          async function updatePagedelTalkAvailability() {
            const target = inputTarget.value.trim();

            if (tenguMode !== "page") {
              // Restore the enabled state when in user mode.
              chkPagedelTalk.disabled = false;
              wrapPagedelTalk.style.opacity = "";
              wrapPagedelTalk.style.cursor = "";
              wrapPagedelTalk.title =
                "When ticked, the talk page of each deleted page will also be deleted if it exists, including subpages when 'Delete subpages of deleted page' is enabled. Pages that are already talk pages are skipped.";
              return;
            }

            if (!target) return;

            let isTalkPage = false;
            try {
              isTalkPage = new mw.Title(target).isTalkPage();
            } catch (e) {
              /* empty */
            }

            if (isTalkPage) {
              chkPagedelTalk.checked = false;
              chkPagedelTalk.disabled = true;
              wrapPagedelTalk.style.opacity = "0.5";
              wrapPagedelTalk.style.cursor = "not-allowed";
              wrapPagedelTalk.title =
                "Not available: the target page is itself a talk page.";
              return;
            }

            let talkTitle = null;
            try {
              talkTitle = new mw.Title(target).getTalkPage().getPrefixedText();
            } catch (e) {
              /* empty */
            }

            if (!talkTitle) {
              chkPagedelTalk.checked = false;
              chkPagedelTalk.disabled = true;
              wrapPagedelTalk.style.opacity = "0.5";
              wrapPagedelTalk.style.cursor = "not-allowed";
              wrapPagedelTalk.title =
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
                chkPagedelTalk.disabled = false;
                wrapPagedelTalk.style.opacity = "";
                wrapPagedelTalk.style.cursor = "";
                wrapPagedelTalk.title =
                  "When ticked, the talk page of each deleted page will also be deleted if it exists, including subpages when 'Delete subpages of deleted page' is enabled. Pages that are already talk pages are skipped.";
              } else {
                chkPagedelTalk.checked = false;
                chkPagedelTalk.disabled = true;
                wrapPagedelTalk.style.opacity = "0.5";
                wrapPagedelTalk.style.cursor = "not-allowed";
                wrapPagedelTalk.title =
                  "Not available: no talk page exists for this page.";
              }
            } catch (e) {
              // API call failed; leave the checkbox enabled so the user can still try.
              chkPagedelTalk.disabled = false;
              wrapPagedelTalk.style.opacity = "";
              wrapPagedelTalk.style.cursor = "";
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

          // Move protection expiry — independent of edit protection expiry,
          // since the two restrictions may need to expire at different times.
          const { row: rowProtectMoveExpiry, field: fieldProtectMoveExpiry } =
            makeRow("Move protection expiry");
          const selProtectMoveExpiry = makeSelect([
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
          const inputProtectMoveExpiry = makeInput("e.g. 6 months, 2099-01-01");
          inputProtectMoveExpiry.classList.add("tng-hidden");
          selProtectMoveExpiry.addEventListener("change", function () {
            inputProtectMoveExpiry.classList.toggle(
              "tng-hidden",
              selProtectMoveExpiry.value !== "other",
            );
          });
          const protectMoveExpiryGroup = document.createElement("div");
          protectMoveExpiryGroup.style.cssText =
            "display: flex; gap: 6px; width: 100%;";
          inputProtectMoveExpiry.style.flex = "1";
          protectMoveExpiryGroup.appendChild(
            wrapSelect(selProtectMoveExpiry, "1"),
          );
          protectMoveExpiryGroup.appendChild(inputProtectMoveExpiry);
          fieldProtectMoveExpiry.appendChild(protectMoveExpiryGroup);
          bodyProtect.appendChild(rowProtectMoveExpiry);

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

          // Pending changes (FlaggedRevs) protection — only offered on wikis
          // that have the FlaggedRevs extension installed. Hidden until
          // flaggedRevsPromise resolves and confirms availability, since most
          // Wikimedia wikis do not run this extension.
          const { wrap: wrapProtectPC, chk: chkProtectPC } = makeCheckbox(
            "Also enable pending changes protection",
            false,
          );
          chkProtectPC.disabled = true;
          wrapProtectPC.style.opacity = "0.5";
          wrapProtectPC.title =
            "Checking whether this wiki supports pending changes protection...";
          const { row: rowProtectPCLevel, field: fieldProtectPCLevel } =
            makeRow("Pending changes level");
          const selProtectPCLevel = makeSelect([
            {
              value: "none",
              label: "All users (no pending changes protection)",
            },
            { value: "autoconfirmed", label: "Autoconfirmed users" },
            { value: "sysop", label: "Reviewers/administrators only" },
          ]);
          selProtectPCLevel.disabled = true;
          fieldProtectPCLevel.appendChild(wrapSelect(selProtectPCLevel));
          rowProtectPCLevel.style.opacity = "0.5";

          // Pending changes expiry — submitted to action=stabilize separately
          // from the edit/move protection expiry submitted to action=protect.
          const { row: rowProtectPCExpiry, field: fieldProtectPCExpiry } =
            makeRow("Pending changes expiry");
          const selProtectPCExpiry = makeSelect([
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
          selProtectPCExpiry.disabled = true;
          const inputProtectPCExpiry = makeInput("e.g. 6 months, 2099-01-01");
          inputProtectPCExpiry.classList.add("tng-hidden");
          inputProtectPCExpiry.disabled = true;
          selProtectPCExpiry.addEventListener("change", function () {
            inputProtectPCExpiry.classList.toggle(
              "tng-hidden",
              selProtectPCExpiry.value !== "other",
            );
          });
          const protectPCExpiryGroup = document.createElement("div");
          protectPCExpiryGroup.style.cssText =
            "display: flex; gap: 6px; width: 100%;";
          inputProtectPCExpiry.style.flex = "1";
          protectPCExpiryGroup.appendChild(wrapSelect(selProtectPCExpiry, "1"));
          protectPCExpiryGroup.appendChild(inputProtectPCExpiry);
          fieldProtectPCExpiry.appendChild(protectPCExpiryGroup);
          rowProtectPCExpiry.style.opacity = "0.5";

          // Grouped in its own bordered section (reusing the
          // .tng-recreation-group style already used by the recreation
          // protection controls) so it reads as a distinct set of settings
          // from the standard page protection options above. The group
          // stays visible on every wiki, including those without
          // FlaggedRevs; only the checkbox, level dropdown, and expiry
          // controls are disabled when the extension is unavailable, so
          // users can see the feature exists rather than having it
          // disappear entirely.
          const divProtectPCGroup = document.createElement("div");
          divProtectPCGroup.className = "tng-recreation-group";
          divProtectPCGroup.appendChild(wrapProtectPC);
          divProtectPCGroup.appendChild(rowProtectPCLevel);
          divProtectPCGroup.appendChild(rowProtectPCExpiry);
          bodyProtect.appendChild(divProtectPCGroup);

          chkProtectPC.addEventListener("change", function () {
            const enabled = chkProtectPC.checked;
            selProtectPCLevel.disabled = !enabled;
            rowProtectPCLevel.style.opacity = enabled ? "" : "0.5";
            selProtectPCExpiry.disabled = !enabled;
            inputProtectPCExpiry.disabled = !enabled;
            rowProtectPCExpiry.style.opacity = enabled ? "" : "0.5";
          });

          // Enable the pending changes checkbox only once FlaggedRevs
          // availability is confirmed for this wiki. When unavailable, the
          // checkbox is disabled (not hidden) with a tooltip explaining why.
          flaggedRevsPromise.then(function (info) {
            chkProtectPC.disabled = !info.hasFlaggedRevs;
            wrapProtectPC.style.opacity = info.hasFlaggedRevs ? "" : "0.5";
            wrapProtectPC.title = info.hasFlaggedRevs
              ? "Requires all edits by non-autoreviewed users to be reviewed before becoming the page's default (stable) version."
              : "Not available: this wiki does not have the FlaggedRevs (pending changes) extension installed.";
          });

          const { row: rowProtectExpiry, field: fieldProtectExpiry } = makeRow(
            "Edit/upload protection expiry",
          );
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
              if (arrow) arrow.classList.remove("tng-arrow-up");
              hdrProtectRecreation.title = "Unavailable: " + reason;
              const badge = document.createElement("span");
              badge.className =
                "tng-rights-lock tng-protectrecreation-lock-badge";
              badge.textContent = "🔒";
              badge.title = "Unavailable: " + reason;
              if (arrow) hdrProtectRecreation.insertBefore(badge, arrow);
              else hdrProtectRecreation.appendChild(badge);
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

          // ============================================================================
          // Fix redirects section — page mode only.
          // Fetches all pages linking to the target page (redirect A) via
          // list=backlinks, then replaces those links with links pointing to
          // a user-specified destination page B. Section anchors and display
          // text are preserved in the replacement.
          // ============================================================================
          const {
            section: secFixRedirects,
            sectionBody: bodyFixRedirects,
            enableChk: chkFixRedirects,
          } = makeSection("Fix redirects", "🔀", false);

          const divFixRedirectsStatus = document.createElement("div");
          divFixRedirectsStatus.className =
            "tng-status-note tng-status-note-inactive";
          divFixRedirectsStatus.textContent =
            "Updates links on pages pointing to the target page, replacing them with links to the specified destination.";
          bodyFixRedirects.appendChild(divFixRedirectsStatus);

          const { row: rowFixRedirectsDest, field: fieldFixRedirectsDest } =
            makeRow("Redirect to");
          const inputFixRedirectsDest = makeInput("New destination page title");
          fieldFixRedirectsDest.appendChild(inputFixRedirectsDest);
          bodyFixRedirects.appendChild(rowFixRedirectsDest);

          const { row: rowFixRedirectsReason, field: fieldFixRedirectsReason } =
            makeRow("Reason");
          const selFixRedirectsReason = makeSelect(FIXREDIRECTS_REASONS);
          const {
            wrap: filteredWrapFixRedirectsReason,
            filter: filterFixRedirectsReason,
          } = makeFilteredSelect(selFixRedirectsReason);
          const inputFixRedirectsReason = makeInput("Full reason to submit");
          const btnFixRedirectsAppend = makeBtn("Append", "quiet");
          btnFixRedirectsAppend.className += " tng-btn-sm";
          btnFixRedirectsAppend.addEventListener("click", function () {
            const cur = inputFixRedirectsReason.value;
            const add = selFixRedirectsReason.value;
            if (!add) return;
            inputFixRedirectsReason.value = cur ? cur + "; " + add : add;
            selFixRedirectsReason.selectedIndex = 0;
            filterFixRedirectsReason.value = "";
            filterFixRedirectsReason.dispatchEvent(new Event("input"));
          });
          const reasonWrapFixRedirects = document.createElement("div");
          reasonWrapFixRedirects.className = "tng-reason-wrap";
          const reasonTopFixRedirects = document.createElement("div");
          reasonTopFixRedirects.className = "tng-reason-top";
          reasonTopFixRedirects.appendChild(filteredWrapFixRedirectsReason);
          reasonTopFixRedirects.appendChild(btnFixRedirectsAppend);
          reasonWrapFixRedirects.appendChild(reasonTopFixRedirects);
          reasonWrapFixRedirects.appendChild(inputFixRedirectsReason);
          fieldFixRedirectsReason.appendChild(reasonWrapFixRedirects);
          bodyFixRedirects.appendChild(rowFixRedirectsReason);

          body.appendChild(secFixRedirects);

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
            if (arrow) arrow.classList.remove("tng-arrow-up");
            const hdr = sec.querySelector(".tng-section-header");
            hdr.title = "Unavailable: " + reason;
            const lockBadge = document.createElement("span");
            lockBadge.className = "tng-rights-lock";
            lockBadge.textContent = "🔒";
            lockBadge.title = "Unavailable: " + reason;
            // Inserted before the chevron (rather than appended after it) so
            // the section remains expandable/collapsible while locked; only
            // the checkbox itself stays disabled.
            if (arrow) hdr.insertBefore(lockBadge, arrow);
            else hdr.appendChild(lockBadge);
          }

          // Reversible section lock for the mode toggle. Unlike lockSection(), which is
          // permanent (used for rights), this can be undone when switching back to user mode.
          // Skips any section already rights-locked (chk.disabled set by lockSection()).
          const modeLocked = new Set();
          function applyModeLock(sec, secBody, chk, lock, reason) {
            if (lock) {
              if (chk.disabled && !modeLocked.has(chk)) return; // Already rights-locked; leave it alone
              if (modeLocked.has(chk)) {
                // Already mode-locked for a different reason (e.g. range lock
                // followed by a mode switch): refresh the tooltip text only,
                // rather than leaving the previous reason displayed.
                const hdr = sec.querySelector(".tng-section-header");
                hdr.title = "Unavailable: " + reason;
                const badge = hdr.querySelector(".tng-mode-lock-badge");
                if (badge) badge.title = "Unavailable: " + reason;
                return;
              }
              modeLocked.add(chk);
              chk.checked = false;
              chk.disabled = true;
              sec.classList.add("tng-disabled");
              secBody.classList.add("tng-hidden");
              const arrow = sec.querySelector(".tng-section-arrow");
              if (arrow) arrow.classList.remove("tng-arrow-up");
              const hdr = sec.querySelector(".tng-section-header");
              hdr.title = "Unavailable: " + reason;
              const badge = document.createElement("span");
              badge.className = "tng-rights-lock tng-mode-lock-badge";
              badge.textContent = "🔒";
              badge.title = "Unavailable: " + reason;
              if (arrow) hdr.insertBefore(badge, arrow);
              else hdr.appendChild(badge);
            } else {
              if (!modeLocked.has(chk)) return; // Not mode-locked; leave it alone
              modeLocked.delete(chk);
              chk.disabled = false;
              sec.classList.toggle("tng-disabled", !chk.checked);
              const arrow = sec.querySelector(".tng-section-arrow");
              if (arrow) {
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

          // Returns true when the current target resolves to an IP range
          // (CIDR notation, IPv4 or IPv6) rather than a single IP address or
          // account. mw.util.isIPAddress(str, true) natively recognises both
          // IPv4 and IPv6 CIDR ranges. Only the Block and Unblock sections support range targets.
          function isTargetIPRange() {
            const title = inputTarget.value.trim();
            if (!title) return false;
            return (
              mw.util.isIPAddress(title, true) && !mw.util.isIPAddress(title)
            );
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
              applyModeLock(
                secFixRedirects,
                bodyFixRedirects,
                chkFixRedirects,
                true,
                "special pages have no links to fix.",
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
              applyModeLock(
                secFixRedirects,
                bodyFixRedirects,
                chkFixRedirects,
                false,
              );
            }
          }

          // Applies or removes reversible mode locks on sections that require a
          // specific account or single IP rather than an IP range, when the
          // user-mode target is an IP range. [Inference] Range support is
          // limited to Block and Unblock: MediaWiki's contribution, warning,
          // and report-related APIs used by the other sections have not been
          // confirmed to accept CIDR ranges.
          function applyRangeTargetLocks(lock) {
            if (lock) {
              applyModeLock(
                secRollback,
                bodyRollback,
                chkRollback,
                true,
                "rollback is not available for IP range targets.",
              );
              applyModeLock(
                secWarn,
                bodyWarn,
                chkWarn,
                true,
                "user warnings are not available for IP range targets.",
              );
              applyModeLock(
                secRevdel,
                bodyRevdel,
                chkRevdel,
                true,
                "revision deletion is not available for IP range targets.",
              );
              applyModeLock(
                secLockAccount,
                bodyLockAccount,
                chkLockAccount,
                true,
                "global locks do not apply to IP ranges.",
              );
              applyModeLock(
                secGS,
                bodyGS,
                chkGS,
                true,
                "reporting is not available for IP range targets.",
              );
              applyModeLock(
                secSRG,
                bodySRG,
                chkSRG,
                true,
                "reporting is not available for IP range targets.",
              );
            } else {
              applyModeLock(secRollback, bodyRollback, chkRollback, false);
              applyModeLock(secWarn, bodyWarn, chkWarn, false);
              applyModeLock(secRevdel, bodyRevdel, chkRevdel, false);
              applyModeLock(
                secLockAccount,
                bodyLockAccount,
                chkLockAccount,
                false,
              );
              applyModeLock(secGS, bodyGS, chkGS, false);
              applyModeLock(secSRG, bodySRG, chkSRG, false);
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
              ? "Username, IP, or IP range"
              : "Page title";
            btnGetInfo.title = isUserModeNow
              ? "View access rights, block log, rights changes, and abuse filter log for this user"
              : "View abuse filter, protection, deletion, and move logs for this page";
            btnExportEdits.style.display = isUserModeNow ? "" : "none";

            // Pre-fill target with the appropriate default for the selected mode
            inputTarget.value = isUserModeNow
              ? mw.config.get("wgRelevantUserName") || ""
              : mw.config.get("wgPageName").replace(/_/g, " ");
            clearInputError(inputTarget);
            btnGetInfo.disabled = !inputTarget.value.trim();
            btnExportEdits.disabled =
              !inputTarget.value.trim() || !isUserModeNow;
            // When returning to user mode, re-evaluate target-specific UI that
            // the change listener would normally update, but that is not triggered
            // here because applyModeRestrictions() sets inputTarget.value directly
            // without dispatching a change event.
            if (isUserModeNow) {
              const _resetTarget = inputTarget.value.trim();
              const _resetIsIP = mw.util.isIPAddress(_resetTarget, true);
              wrapHardblock.style.display = _resetIsIP ? "" : "none";
              wrapAutoblock.style.display = _resetIsIP ? "none" : "";
              updateSRGFormForTarget();
            }
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

            // Clear additional targets when switching mode — target formats
            // differ between user mode (account names) and page mode (page
            // titles), so carrying targets across a mode switch would likely
            // produce invalid inputs.
            if (chkMultiTarget.checked) {
              chkMultiTarget.checked = false;
              textareaMultiTarget.value = "";
              divMultiTargetPanel.classList.remove(
                "tng-multitarget-panel--open",
              );
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
              applyModeLock(
                secLockAccount,
                bodyLockAccount,
                chkLockAccount,
                true,
                "Tengu is targeting a page, not a user.",
              );
              // Move to sandbox and Fix redirects are available in page mode; unlock them.
              applyModeLock(
                secMoveSandbox,
                bodyMoveSandbox,
                chkMoveSandbox,
                false,
              );
              applyModeLock(
                secFixRedirects,
                bodyFixRedirects,
                chkFixRedirects,
                false,
              );
              // Reset the same-as-creator option when entering page mode so a
              // stale username from a previous session is not silently reused.
              chkMoveSandboxSameAsCreator.checked = false;
              inputMoveSandboxUser.disabled = false;
              // Auto-fill subpage name with the page title (without namespace),
              // and pre-fill the Move page destination with the full prefixed title.
              updateMovePageDestFromTarget();
              // Re-evaluate talk page availability for the new target.
              updateMoveSandboxTalkAvailability();
              updateMovePageTalkAvailability();
            } else {
              // Remove mode locks first to enable features
              applyModeLock(secRollback, bodyRollback, chkRollback, false);
              applyModeLock(secBlock, bodyBlock, chkBlock, false);
              applyModeLock(secUnblock, bodyUnblock, chkUnblock, false);
              applyModeLock(secWarn, bodyWarn, chkWarn, false);
              applyModeLock(secRevdel, bodyRevdel, chkRevdel, false);
              applyModeLock(secSRG, bodySRG, chkSRG, false);
              applyModeLock(
                secLockAccount,
                bodyLockAccount,
                chkLockAccount,
                false,
              );
              // Remove any special page locks that were active while in page mode.
              // This must run before the move-sandbox lock below: if a special-page
              // lock has already set chkMoveSandbox.disabled to true, applyModeLock()
              // returns early and the user-mode lock is never registered. The subsequent
              // applySpecialPageLocks(false) call would then clear the special-page lock
              // with no replacement, leaving the Move page section incorrectly accessible
              // in user mode.
              applySpecialPageLocks(false);
              // Move to sandbox and Fix redirects are page-mode only; lock them when switching to user mode.
              applyModeLock(
                secMoveSandbox,
                bodyMoveSandbox,
                chkMoveSandbox,
                true,
                "Move page is only available in page mode.",
              );
              applyModeLock(
                secFixRedirects,
                bodyFixRedirects,
                chkFixRedirects,
                true,
                "Fix redirects is only available in page mode.",
              );

              // Re-evaluate and apply strict rights-based permanent locks if permissions are missing
              if (resolvedRights) {
                if (!resolvedRights.hasBlock) {
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
                if (!resolvedRights.hasRevdel) {
                  lockSection(
                    secRevdel,
                    bodyRevdel,
                    chkRevdel,
                    "you do not have the deleterevision right on this wiki.",
                  );
                }
                // Re-evaluate the Lock account steward-status lock, since it
                // is only ever applied while in user mode (see the rights
                // resolution callback), and must be reinstated here when
                // switching back from page mode.
                if (resolvedRights.isSteward) {
                  applyLockAccountStatusLock(false);
                } else {
                  applyLockAccountStatusLock(
                    true,
                    "you do not have steward rights on this wiki.",
                  );
                }
              }
            }

            // Apply or remove special page locks when switching to page mode
            if (!isUserModeNow) applySpecialPageLocks(targetIsSpecial);
            // Apply or remove range-target locks (Rollback, Warn, Revdel,
            // Lock account, GS/SRG reporting) when switching to user mode
            if (isUserModeNow) applyRangeTargetLocks(isTargetIPRange());

            updateUploadAvailability();
            updatePagedelTalkAvailability();
            updateStartBtn();
            updateSectionStatus();
          }

          // Lock page-mode-only sections when starting in user mode.
          if (tenguMode === "user") {
            applyModeLock(
              secMoveSandbox,
              bodyMoveSandbox,
              chkMoveSandbox,
              true,
              "Move page is only available in page mode.",
            );
            applyModeLock(
              secFixRedirects,
              bodyFixRedirects,
              chkFixRedirects,
              true,
              "Fix redirects is only available in page mode.",
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
            applyModeLock(
              secLockAccount,
              bodyLockAccount,
              chkLockAccount,
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
              chkSRG.checked ||
              chkLockAccount.checked ||
              chkFixRedirects.checked
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
          chkLockAccount.addEventListener("change", updateStartBtn);
          chkMoveSandbox.addEventListener("change", updateStartBtn);
          chkFixRedirects.addEventListener("change", updateStartBtn);

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

            if (chkWarn.checked && !selWarnMsg.value) {
              showNotification(
                fieldWarnMsg,
                "Please select a warning message.",
              );
              selWarnMsg.focus();
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

            if (chkLockAccount.checked && !chkLockAccount.disabled) {
              if (mw.util.isIPAddress(targetVal)) {
                showNotification(
                  fieldTarget,
                  "Global locks only apply to registered accounts, not IP addresses.",
                );
                inputTarget.focus();
                return;
              }
            }

            if (chkFixRedirects.checked && !chkFixRedirects.disabled) {
              if (!inputFixRedirectsDest.value.trim()) {
                showNotification(
                  fieldFixRedirectsDest,
                  "Please enter a destination page title.",
                );
                inputFixRedirectsDest.focus();
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
            const isIP = mw.util.isIPAddress(targetVal, true);
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
            function buildLockAccountReason() {
              const sel = selLockAccountReason.value;
              const inp = inputLockAccountReason.value.trim();
              if (sel && inp) return sel + ": " + inp;
              return sel || inp;
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

            // Extracts the reason text for a Global sysops/Requests report
            // from the selected reason checkboxes and the additional details
            // field. Stored in config so work() can rebuild the full report
            // line per-target when multi-target mode is active.
            function buildGSReasonText() {
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
                reasonText = pickedReasonsText + ". " + details;
              } else if (pickedReasonsText) {
                reasonText = pickedReasonsText;
              } else if (details) {
                reasonText = details;
              }
              if (reasonText && !/[.!?]$/.test(reasonText)) {
                reasonText += ".";
              }
              return reasonText;
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
                reasonText = pickedReasonsText + ". " + details;
              } else if (pickedReasonsText) {
                reasonText = pickedReasonsText;
              } else if (details) {
                reasonText = details;
              }
              if (reasonText && !/[.!?]$/.test(reasonText)) {
                reasonText += ".";
              }

              // When "Process multiple targets" is active, include every
              // selected account in a single section: {{MultiLock}} for
              // registered accounts, or one {{Luxotool}} line per target
              // for IP/temporary account block requests.
              // allTargets is defined in the enclosing btnStart handler
              // before this function is called.
              const isMultiSRG = allTargets.length > 1;

              if (isBlock) {
                if (isMultiSRG) {
                  const extraCount = allTargets.length - 1;
                  const headerLabel =
                    targetVal +
                    " and " +
                    extraCount +
                    " other account" +
                    (extraCount !== 1 ? "s" : "");
                  const luxoLines = allTargets
                    .map(function (t) {
                      return "* {{Luxotool|1=" + t + "}}";
                    })
                    .join("\n");
                  return (
                    "=== Global block for " +
                    headerLabel +
                    " ===\n" +
                    "{{Status}}\n" +
                    luxoLines +
                    "\n" +
                    reasonText +
                    " ~~~~"
                  );
                }
                return (
                  "=== Global block for [[Special:Contributions/" +
                  targetVal +
                  "|" +
                  targetVal +
                  "]] ===\n" +
                  "{{Status}}\n" +
                  "* {{Luxotool|1=" +
                  targetVal +
                  "}}\n" +
                  reasonText +
                  " ~~~~"
                );
              }

              if (isMultiSRG) {
                const extraCount = allTargets.length - 1;
                const headerLabel =
                  targetVal +
                  " and " +
                  extraCount +
                  " other account" +
                  (extraCount !== 1 ? "s" : "");
                // {{MultiLock}} takes one numbered parameter per account and
                // does not require a leading bullet, unlike {{LockHide}}.
                const multiLockParams = allTargets
                  .map(function (t, i) {
                    return i + 1 + "=" + t;
                  })
                  .join("|");
                const multiLockTemplate = chkSRGHideUsername.checked
                  ? "{{MultiLock|" + multiLockParams + "|hide=1}}"
                  : "{{MultiLock|" + multiLockParams + "}}";
                return (
                  "=== Global lock for " +
                  headerLabel +
                  " ===\n" +
                  "{{Status}}\n" +
                  multiLockTemplate +
                  "\n" +
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

            // Build the ordered target list. Additional targets from the
            // textarea are appended after the primary target; duplicates
            // (case-insensitive, both against the primary target and against
            // each other) are removed while preserving order.
            const additionalTargets = chkMultiTarget.checked
              ? (function () {
                  const seen = new Set([targetVal.toLowerCase()]);
                  return textareaMultiTarget.value
                    .split("\n")
                    .map(function (s) {
                      return s.trim();
                    })
                    .filter(Boolean)
                    .filter(function (t) {
                      const key = t.toLowerCase();
                      if (seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    });
                })()
              : [];
            const allTargets = [targetVal].concat(additionalTargets);

            config = {
              mode: tenguMode,
              target: targetVal,
              targets: allTargets,
              suffix: suffix,
              isIP: isIP,
              isRange: isIP && !mw.util.isIPAddress(targetVal),
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
              rollbackReason: buildRollbackReason() + suffix,
              notifyRollback: chkNotifyRollback.checked,
              block: chkBlock.checked,
              blockDur:
                selBlockDur.value === "other"
                  ? inputBlockDur.value.trim()
                  : selBlockDur.value,
              blockReason: buildBlockReason() + suffix,
              blockAnon: chkHardblock.checked,
              blockAuto: chkAutoblock.checked,
              blockCreate: chkCreate.checked,
              blockTalk: chkTalk.checked,
              blockMail: chkMail.checked,
              blockHide: chkHidename.checked,
              unblock: chkUnblock.checked && !chkUnblock.disabled,
              unblockReason: buildUnblockReason() + suffix,
              notifyUnblock: chkNotifyUnblock.checked,
              reportGS: chkGS.checked && !chkGS.disabled,
              reportGSReasonText: buildGSReasonText(),
              reportGSPageType: selGSPageRequestType.value,
              reportSRG: chkSRG.checked && !chkSRG.disabled,
              reportSRGKind: isSRGBlockTarget() ? "block" : "lock",
              reportSRGSection: buildSRGReportLine(),
              lockAccount: chkLockAccount.checked && !chkLockAccount.disabled,
              lockAccountReason: buildLockAccountReason() + suffix,
              lockAccountHideUsername: chkLockAccountHideUsername.checked,
              notifyLockAccount: chkNotifyLockAccount.checked,
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
              fixRedirects:
                chkFixRedirects.checked && !chkFixRedirects.disabled,
              fixRedirectsDest: inputFixRedirectsDest.value.trim(),
              fixRedirectsReason:
                (inputFixRedirectsReason.value.trim() ||
                  selFixRedirectsReason.value) + suffix,
              moveSandbox: chkMoveSandbox.checked && !chkMoveSandbox.disabled,
              moveSandboxMode: selMoveMode.value,
              movePageDest: buildMovePageDestTitle(),
              movePageReason: buildMovePageReason() + suffix,
              movePageNoRedirect: chkMovePageNoRedirect.checked,
              movePageTalk: chkMovePageTalk.checked,
              movePageSubpages: chkMovePageSubpages.checked,
              movePageFixDoubleRedirects: chkMovePageFixDoubleRedirects.checked,
              movePageDeleteDest: chkMovePageDeleteDest.checked,
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
              protectMoveExpiry:
                selProtectMoveExpiry.value === "other"
                  ? inputProtectMoveExpiry.value.trim() || "never"
                  : selProtectMoveExpiry.value,
              protectReason: buildProtectReason() + suffix,
              protectTalk: chkProtectTalk.checked,
              protectCascade: chkProtectCascade.checked,
              protectPendingChanges: chkProtectPC.checked,
              protectPendingChangesLevel: selProtectPCLevel.value,
              protectPendingChangesExpiry:
                selProtectPCExpiry.value === "other"
                  ? inputProtectPCExpiry.value.trim() || "never"
                  : selProtectPCExpiry.value,
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
              warnTemplateValue: chkWarn.checked ? selWarnMsg.value : "",
              warnExtra: chkWarn.checked ? inputWarnExtra.value.trim() : "",
              warnFinal: chkWarn.checked ? chkWarnFinal.checked : false,
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
              if (config.lockAccount)
                features.push("🔧 Lock account [EXPERIMENTAL]");
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
              if (config.fixRedirects) features.push("🔀 Fix redirects");
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

            // Build a natural-language list of enabled operations,
            // e.g. "A", "A and B", or "A, B, and C".
            const joinFeatures = function (features) {
              if (features.length === 1) return features[0];
              if (features.length === 2)
                return features[0] + " and " + features[1];
              return (
                features.slice(0, -1).join(", ") +
                ", and " +
                features[features.length - 1]
              );
            };

            const isMultiConfirm = config.targets.length > 1;
            const targetLabel = isMultiConfirm
              ? "<b>" + config.targets.length + " targets</b>"
              : "<b>" + mw.html.escape(config.target) + "</b>";

            const modeLabel =
              config.mode === "user" ? "user mode" : "page mode";
            const confirmMsg = document.createElement("p");
            confirmMsg.style.margin = "0 0 8px 0";
            confirmMsg.innerHTML =
              "Tengu will execute " +
              mw.html.escape(joinFeatures(enabledFeatures)) +
              " on " +
              targetLabel +
              " in <b>" +
              modeLabel +
              "</b>. Please confirm before proceeding.";
            confirmDlg.body.appendChild(confirmMsg);

            if (isMultiConfirm) {
              const confirmTargetList = document.createElement("div");
              confirmTargetList.className = "tng-confirm-target-list";
              config.targets.forEach(function (t, i) {
                const line = document.createElement("div");
                line.textContent = i + 1 + ". " + t;
                confirmTargetList.appendChild(line);
              });
              confirmDlg.body.appendChild(confirmTargetList);
            }

            // Scope clarification for mode-sensitive operations.
            // In user mode, rollback, page deletion, and page protection all
            // operate across the target user's full contribution history —
            // not on a single page. This note makes that explicit so users
            // who are in the wrong mode can catch it before confirming.
            if (config.mode === "user") {
              const scopeLines = [];
              if (config.rollback) {
                scopeLines.push(
                  "🔙 <b>Rollback</b> — will revert all edits by this user within the selected time window.",
                );
              }
              if (config.massdel) {
                scopeLines.push(
                  "🗑️ <b>Page deletion</b> — will delete <b>all pages created</b> by this user within the selected time window, not a single page.",
                );
              }
              if (config.protect) {
                scopeLines.push(
                  "🛡️ <b>Page protection</b> — will protect <b>all pages edited or created</b> by this user within the selected time window, not a single page.",
                );
              }
              if (scopeLines.length) {
                const scopeNote = document.createElement("div");
                scopeNote.className = "tng-status-note tng-status-note-active";
                scopeNote.style.margin = "0 0 8px 0";
                const scopeTitle = document.createElement("b");
                scopeTitle.textContent = "Scope in user mode:";
                scopeNote.appendChild(scopeTitle);
                const scopeList = document.createElement("ul");
                scopeList.style.cssText = "margin: 4px 0 0 16px; padding: 0;";
                scopeLines.forEach(function (line) {
                  const li = document.createElement("li");
                  li.style.marginBottom = "2px";
                  li.innerHTML = line;
                  scopeList.appendChild(li);
                });
                scopeNote.appendChild(scopeList);
                confirmDlg.body.appendChild(scopeNote);
              }
            }

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
                isSteward,
              };

              // Lock account requires steward rights and only applies in
              // user mode; applyModeLock() already governs page mode. The
              // status lock is only evaluated here while in user mode so it
              // does not stack with the mode lock applied in page mode.
              // applyModeRestrictions() re-evaluates this same check when
              // switching back to user mode, using the stored isSteward value.
              if (tenguMode === "user") {
                if (isSteward) {
                  applyLockAccountStatusLock(false);
                } else {
                  applyLockAccountStatusLock(
                    true,
                    "you do not have steward rights on this wiki.",
                  );
                }
              }

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
                // Also enable and tick the Move page suppress-redirect checkbox,
                // matching the sandbox checkbox's behaviour above.
                chkMovePageNoRedirect.checked = true;
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

            // No package sets the edits dropdown to "custom", so if the
            // picker was previously active, hide its button row and clear
            // any stale selection state.
            pickEditsBtnRow.classList.add("tng-hidden");
            customSelectedPageEdits = {};
            customSelectedCreations = [];
            updatePickerSelectionSummary();

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
              selPagedelReason.selectedIndex = 0;
              inputPagedelReason.value = pdr;
            }
            chkPagedelUnlink.checked = !!pd.unlink;
            // Talk-page deletion, redirect deletion, and subpage deletion are
            // not currently configurable via packages, so reset them to their
            // original construction defaults on every package switch, matching
            // the reset already applied to chkPagedelUnlink above. Previously
            // these three checkboxes retained whatever state was left over
            // from a prior package selection or manual toggle.
            chkPagedelTalk.checked = false;
            chkPagedelRedirects.checked = true;
            chkPagedelSubpages.checked = true;
            // "Protect from recreation after deletion" is not currently
            // configurable via packages either, so reset it and its
            // sub-controls to their construction defaults on every package
            // switch, so a previous manual configuration does not silently
            // carry over.
            chkPagedelProtectRecreation.checked = false;
            selPagedelProtectRecreationLevel.value = "sysop";
            selPagedelProtectRecreationLevel.disabled = true;
            selPagedelProtectRecreationExpiry.value = "1 day";
            selPagedelProtectRecreationExpiry.disabled = true;
            inputPagedelProtectRecreationExpiry.value = "";
            inputPagedelProtectRecreationExpiry.classList.add("tng-hidden");
            inputPagedelProtectRecreationExpiry.disabled = true;
            selPagedelProtectRecreationReason.selectedIndex = 0;
            selPagedelProtectRecreationReason.disabled = true;
            inputPagedelProtectRecreationReason.value = "";
            inputPagedelProtectRecreationReason.disabled = true;
            rowRecreationLevel.style.opacity = "0.5";
            rowRecreationExpiry.style.opacity = "0.5";
            rowRecreationReason.style.opacity = "0.5";

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
            selProtectMoveExpiry.value = pt.moveExpiry || pt.expiry || "1 day";
            inputProtectMoveExpiry.value = "";
            inputProtectMoveExpiry.classList.add("tng-hidden");
            selProtectPCExpiry.value =
              pt.pendingChangesExpiry || pt.expiry || "1 day";
            inputProtectPCExpiry.value = "";
            inputProtectPCExpiry.classList.add("tng-hidden");
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
            // Pending changes protection is not currently configurable via
            // packages, so reset it and its sub-controls to their
            // construction defaults on every package switch, matching the
            // reset now applied to recreation protection above. Availability
            // (chkProtectPC.disabled) remains governed by flaggedRevsPromise
            // and is not touched here.
            chkProtectPC.checked = false;
            selProtectPCLevel.value = "autoconfirmed";
            selProtectPCLevel.disabled = true;
            selProtectPCExpiry.disabled = true;
            inputProtectPCExpiry.disabled = true;
            rowProtectPCLevel.style.opacity = "0.5";
            rowProtectPCExpiry.style.opacity = "0.5";

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
              selRevdelReason.selectedIndex = 0;
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

            // Expiry — set the edit and move expiry controls independently
            // from their respective protection entries. "infinity" maps to
            // the indefinite option; anything else uses the free-text input
            // so the raw timestamp is shown for reference.
            function applyExpiryEntry(entry, sel, input) {
              if (!entry) return;
              const expiry = entry.expiry || "";
              if (!expiry || expiry === "infinity" || expiry === "infinite") {
                sel.value = "never";
                input.classList.add("tng-hidden");
              } else {
                sel.value = "other";
                input.value = expiry;
                input.classList.remove("tng-hidden");
              }
            }
            applyExpiryEntry(editEntry, selProtectExpiry, inputProtectExpiry);
            applyExpiryEntry(
              moveEntry,
              selProtectMoveExpiry,
              inputProtectMoveExpiry,
            );
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
              setNote(
                divLockAccountStatus,
                "loading",
                "Enter a target to see lock account status.",
              );
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

              if (isTargetIP) {
                setNote(
                  divLockAccountStatus,
                  "inactive",
                  "Not applicable — global locks only apply to registered accounts.",
                );
              } else {
                setNote(
                  divLockAccountStatus,
                  "loading",
                  "Global lock availability depends on your steward status.",
                );
              }
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
              applyProtectRecreationStatusLock(
                true,
                "not applicable in user mode.",
              );

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
              setNote(
                divLockAccountStatus,
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

                  // Page deletion, Move page, Page protection, and Fix redirects all
                  // require an existing target page; lock them when the page does not
                  // exist — the inverse of the recreation-protection gating above.
                  if (pageIsMissing) {
                    applyModeLock(
                      secPagedel,
                      bodyPagedel,
                      chkPagedel,
                      true,
                      "the target page does not exist.",
                    );
                    applyModeLock(
                      secMoveSandbox,
                      bodyMoveSandbox,
                      chkMoveSandbox,
                      true,
                      "the target page does not exist.",
                    );
                    applyModeLock(
                      secProtect,
                      bodyProtect,
                      chkProtect,
                      true,
                      "the target page does not exist.",
                    );
                    applyModeLock(
                      secFixRedirects,
                      bodyFixRedirects,
                      chkFixRedirects,
                      true,
                      "the target page does not exist.",
                    );
                  } else {
                    applyModeLock(secPagedel, bodyPagedel, chkPagedel, false);
                    applyModeLock(
                      secMoveSandbox,
                      bodyMoveSandbox,
                      chkMoveSandbox,
                      false,
                    );
                    applyModeLock(secProtect, bodyProtect, chkProtect, false);
                    applyModeLock(
                      secFixRedirects,
                      bodyFixRedirects,
                      chkFixRedirects,
                      false,
                    );
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
            const isIP = mw.util.isIPAddress(targetVal, true);
            const isTempAccount = /^~\d{4}-\d+-\d+$/.test(targetVal);
            wrapHardblock.style.display = isIP ? "" : "none";
            wrapAutoblock.style.display = isIP ? "none" : "";
            updateSRGFormForTarget();
            if (tenguMode === "user") {
              applyRangeTargetLocks(isTargetIPRange());
            }
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
            // Auto-fill subpage name with the page title (without namespace),
            // and pre-fill the Move page destination with the full prefixed title.
            if (tenguMode === "page" && targetVal) {
              updateMovePageDestFromTarget();
            }
            // Re-fetch the page creator when the target changes and the
            // same-as-creator option is active.
            if (tenguMode === "page" && chkMoveSandboxSameAsCreator.checked) {
              fetchAndApplyPageCreator();
            }
            // Re-evaluate talk page availability for the move sandbox and move page sections.
            if (tenguMode === "page") {
              updateMoveSandboxTalkAvailability();
              updateMovePageTalkAvailability();
            }
            // Re-evaluate talk page deletion availability (handles both modes internally).
            updatePagedelTalkAvailability();
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
        // [Section 09b] Inline revision actions (history, contributions &
        // diff pages)
        // Injects "⛩️ rollback" and "⛩️ restore this revision" links at the end
        // of each revision row on page history (action=history) and user
        // contributions (Special:Contributions / Special:IPContributions,
        // including IP and temporary account contribution pages), and a
        // "⛩️ rollback" and/or "⛩️ restore this revision" links on diff
        // pages (comparing two revisions). Reuses the same
        // apiRollback()/apiPost() calls, edit-summary wording
        // (buildQuickRevertSummaryText()), and a confirmation dialogue
        // matching the style already used elsewhere in Tengu (e.g. the
        // self-block confirmation).
        // On contributions pages, "restore this revision" is never shown,
        // and "rollback" is shown only where the row's revision is still
        // its page's current one. Rather than reading the page title out
        // of the DOM and re-querying it separately (the previous approach,
        // which was prone to title-normalisation mismatches — see the
        // v2.126.0 changelog entry), current status is resolved up front
        // via a single list=usercontribs API call with ucshow=top, which
        // returns exactly the contributions that are still each page's
        // top revision. Rows are then matched against that revid -> title
        // map directly, so the page title used to build the link also
        // comes from the API rather than from DOM parsing.
        // On diff pages, both compared revisions (wgDiffOldId and
        // wgDiffNewId) are checked against the page's actual current
        // revision, fetched live via fetchCurrentRevisionId() rather than
        // assumed from left/right position or trusted from a possibly
        // stale wgCurRevisionId. Whichever side (if either) holds the
        // current revision gets "rollback"; the other side gets "restore
        // this revision". When neither side is current — a diff between
        // two older revisions — both sides get "restore this revision"
        // and neither gets "rollback". This mirrors, but is not limited
        // to, how Twinkle's twinklefluff.js module (addLinks.diff())
        // detects and places its own "[restore this revision]" link.
        // ============================================================================
        async function runQuickRevert(pageTitle, targetUser, revId, method) {
          const actionLabel =
            method === "rollback"
              ? "roll back the latest edit(s) to"
              : method === "singleundo"
                ? "undo this edit to"
                : "restore this revision of";
          // Holds the keydown handler bound below, so it can be removed
          // regardless of which path closes the dialogue (Cancel, Confirm,
          // the close button, clicking outside, or Escape) — matching the
          // pattern used by the main "Confirm selected operations" dialogue
          // (Section 09).
          let handleConfirmKeydown;
          // Populated from the reason row below when the user confirms;
          // stays empty if neither a preset reason nor a custom reason was
          // provided, in which case the existing summary wording (Section
          // 09b, buildQuickActionSummaryText()) is used unchanged.
          let selectedReason = "";
          const confirmed = await new Promise(function (resolve) {
            const { overlay, body, footer } = createDialog({
              title:
                "Confirm " +
                (method === "rollback"
                  ? "rollback"
                  : method === "singleundo"
                    ? "undo"
                    : "restore"),
              icon: "⛩️",
              child: true,
              onClose: function () {
                document.removeEventListener(
                  "keydown",
                  handleConfirmKeydown,
                  true,
                );
                resolve(false);
              },
            });
            const p = document.createElement("p");
            p.innerHTML =
              "Tengu will " +
              mw.html.escape(actionLabel) +
              " <b>" +
              mw.html.escape(pageTitle) +
              "</b>" +
              (targetUser ? " (by " + mw.html.escape(targetUser) + ")" : "") +
              ". Please confirm before proceeding.";
            body.appendChild(p);

            // Reason row — same select + filter + custom-input pattern as
            // the main batch Rollback section's reason row (Section 09).
            // Optional: left on "Other:" with no custom text, the existing
            // summary wording is kept as-is (see buildQuickRevertReason()
            // below and its use at the two apiRollback()/apiPost() call
            // sites further down this function).
            const { row: rowQrReason, field: fieldQrReason } =
              makeRow("Reason");
            const selQrReason = makeSelect(ROLLBACK_REASONS);
            const inputQrReason = makeInput(
              "Additional details / customised reason",
            );
            const { wrap: filteredWrapQrReason } =
              makeFilteredSelect(selQrReason);
            const reasonWrapQr = document.createElement("div");
            reasonWrapQr.className = "tng-reason-wrap";
            reasonWrapQr.appendChild(filteredWrapQrReason);
            reasonWrapQr.appendChild(inputQrReason);
            fieldQrReason.appendChild(reasonWrapQr);
            body.appendChild(rowQrReason);

            // Mirrors buildRollbackReason() (Section 09): joins a selected
            // preset with custom text as "preset: custom" when both are
            // given, otherwise uses whichever one was provided.
            function buildQuickRevertReason() {
              const sel = selQrReason.value;
              const inp = inputQrReason.value.trim();
              if (sel && inp) return sel + ": " + inp;
              return sel || inp;
            }

            const btnCancel = makeBtn("Cancel", "quiet");
            btnCancel.addEventListener("click", function () {
              // Resolve before closing. closeHandler() always triggers
              // onClose() too (see createDialog()), which also calls
              // resolve(false) — calling it here first is what makes the
              // deliberate outcome win, since a promise only settles once.
              resolve(false);
              overlay.closeHandler();
            });
            const btnConfirm = makeBtn("Confirm", "destructive");
            btnConfirm.addEventListener("click", function () {
              selectedReason = buildQuickRevertReason();
              resolve(true);
              overlay.closeHandler();
            });
            footer.appendChild(btnCancel);
            footer.appendChild(btnConfirm);

            // Enter confirms, Escape cancels, while this dialogue is open —
            // consistent with the main "Confirm selected operations"
            // dialogue's keyboard behaviour.
            handleConfirmKeydown = function (e) {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                btnConfirm.click();
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                btnCancel.click();
              }
            };
            document.addEventListener("keydown", handleConfirmKeydown, true);
          });
          if (!confirmed) return;

          const { overlay, body, footer } = createDialog({
            title: "Processing Tengu quick action",
            icon: "⛩️",
            child: true,
            onClose: function () {
              // Navigates to the page's own current URL rather than
              // reloading the page the action was triggered from (a
              // diff, history, or contributions page), so the user
              // lands on the up-to-date article rather than a stale
              // diff/history view of the revision that was just
              // rolled back or restored.
              window.location.href = mw.util.getUrl(pageTitle);
            },
          });
          // Status label, progress loader, and timestamped, numbered log
          // entries, matching the main window's progress dialogue (Section 07)
          // so quick actions give the same status feedback as a batch run.
          // The completion summary is appended directly to this line once
          // the action finishes, matching the main progress dialogue.
          const statusLbl = document.createElement("div");
          statusLbl.style.cssText =
            "margin-bottom:8px;display:flex;align-items:center;gap:8px;";
          const statusTextSpan = document.createElement("span");
          statusTextSpan.innerHTML = "<b>Status:</b> Processing...";
          statusLbl.appendChild(statusTextSpan);
          body.appendChild(statusLbl);

          const logBox = document.createElement("div");
          logBox.className = "tng-log-box";
          logBox.style.height = "100px";
          body.appendChild(logBox);
          // Every log entry is sequentially numbered and timestamped, and
          // hadFailure tracks whether the closing status line should report
          // success or defer to whatever failure/error line(s) were already
          // logged — mirroring addLog() in the main window's work() function.
          let logCounter = 0;
          let hadFailure = false;
          function quickLog(msg, isErr) {
            logCounter += 1;
            const d = document.createElement("div");
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
            d.textContent = logCounter + ". [" + _ts + "] " + msg;
            d.className = isErr ? "tng-log-err" : "tng-log-succ";
            logBox.appendChild(d);
            if (isErr) hadFailure = true;
          }
          quickLog("⏳ Processing operations... please wait...");
          const toolTag = " · [[w:id:Pengguna:Rachmat04/Tengu.js|⛩️]]";
          const diffLinkTarget = String(revId);

          try {
            if (method === "singleundo") {
              // Undoes only the given revision itself (mirroring the main
              // window's batch Undo section), as distinct from the
              // "restore this revision" action below, which undoes every
              // edit after the given revision to restore the page to that
              // state. Uses action=edit, so — unlike rollback — this does
              // not require the rollback right; only the edit right is
              // needed.
              const summary =
                buildQuickRevertSummaryText(
                  targetUser || "",
                  diffLinkTarget,
                  selectedReason,
                  true,
                  null,
                  "undo",
                ) + toolTag;
              const undoResult = await apiPost({
                action: "edit",
                title: pageTitle,
                undo: revId,
                summary: summary,
              });
              const editResult = undoResult && undoResult.edit;
              const noChangeMade = !!(
                editResult &&
                Object.prototype.hasOwnProperty.call(editResult, "nochange")
              );
              if (noChangeMade) {
                quickLog(
                  "[Undo] Skipped: " +
                    pageTitle +
                    " — the edit appears to have already been undone; no changes were made",
                  true,
                );
              } else {
                quickLog(
                  "[Undo] Successfully undone edit at: " +
                    pageTitle +
                    " (revision " +
                    revId +
                    ")",
                );
              }
            } else if (method === "rollback") {
              // Uses buildQuickRevertSummaryText() — the same helper, and
              // therefore the same wording, used by the main window's batch
              // Rollback section (see buildRevertSummaryText() in work()) —
              // instead of the inline-only buildQuickActionSummaryText(),
              // so the edit summary is identical between the two entry points.
              const summary =
                buildQuickRevertSummaryText(
                  targetUser || "",
                  diffLinkTarget,
                  selectedReason,
                  true,
                  null,
                  "rollback",
                ) + toolTag;
              const rollbackResult = await apiRollback(pageTitle, targetUser, {
                summary: summary,
              });
              // Field names (old_revid = revision being rolled
              // back, last_revid = revision being restored to, revid = new
              // revision created) follow documented action=rollback
              // response shape.
              const rb = rollbackResult && rollbackResult.rollback;
              const rolledBackRevId = rb && rb.old_revid;
              const targetRevId = rb && rb.last_revid;
              const newRevId = rb && rb.revid;
              // Guards against a no-op rollback: if the revision being
              // rolled back already had the same content as the revision
              // being restored to, the API may still report a "successful"
              // rollback despite nothing actually changing on the page.
              const alreadyIdentical = await revisionsContentIdentical(
                rolledBackRevId,
                targetRevId,
              );
              if (alreadyIdentical === true) {
                quickLog(
                  "[Rollback] Failed: revision " +
                    rolledBackRevId +
                    " already has identical content to revision " +
                    targetRevId +
                    " — no change was made to " +
                    pageTitle +
                    ".",
                  true,
                );
              } else {
                quickLog(
                  "[Rollback] Successfully reverted: " +
                    pageTitle +
                    (rolledBackRevId && targetRevId
                      ? " (revision " +
                        rolledBackRevId +
                        " rolled back to revision " +
                        targetRevId +
                        ")"
                      : ""),
                );
                const sameContent = await revisionsContentIdentical(
                  newRevId,
                  targetRevId,
                );
                if (sameContent === true) {
                  quickLog(
                    "Rollback completed: revision " +
                      rolledBackRevId +
                      " was rolled back to revision " +
                      targetRevId +
                      ". The resulting page content is identical to revision " +
                      targetRevId +
                      ".",
                  );
                }
              }
            } else {
              const latestData = await apiGet({
                action: "query",
                prop: "revisions",
                titles: pageTitle,
                rvlimit: 1,
                rvprop: "ids",
                formatversion: 2,
              });
              const page =
                latestData.query &&
                latestData.query.pages &&
                latestData.query.pages[0];
              const latestRevId =
                page && page.revisions && page.revisions[0]
                  ? page.revisions[0].revid
                  : null;
              if (!latestRevId) {
                throw new Error(
                  "could not determine the page's latest revision",
                );
              }
              // Guards against a no-op undo: if the current revision already
              // has the same content as the revision being restored to,
              // an edit here would either fail as a null edit or, worse,
              // silently succeed while changing nothing.
              const alreadyIdentical = await revisionsContentIdentical(
                latestRevId,
                revId,
              );
              if (alreadyIdentical === true) {
                quickLog(
                  "[Undo] Failed: the current revision " +
                    latestRevId +
                    " already has identical content to revision " +
                    revId +
                    " — no change was made to " +
                    pageTitle +
                    ".",
                  true,
                );
              } else {
                // Uses isRestore wording ("Restored to revision by [user]")
                // rather than the shared rollback/undo wording, since this
                // call site is specifically the "[⛩️ restore this revision]"
                // inline action: targetUser here is the author of the
                // revision being restored *to*, not an edit being reverted.
                const summary =
                  buildQuickRevertSummaryText(
                    targetUser || "",
                    diffLinkTarget,
                    selectedReason,
                    true,
                    null,
                    "restore",
                  ) + toolTag;
                const editResult = await apiPost({
                  action: "edit",
                  title: pageTitle,
                  undo: latestRevId,
                  undoafter: revId,
                  summary: summary,
                });
                const newRevId =
                  editResult && editResult.edit && editResult.edit.newrevid;
                quickLog(
                  "[Undo] Successfully restored revision at: " +
                    pageTitle +
                    " (revision " +
                    latestRevId +
                    " undone to revision " +
                    revId +
                    ")",
                );
                const sameContent = await revisionsContentIdentical(
                  newRevId,
                  revId,
                );
                if (sameContent === true) {
                  quickLog(
                    "Undo completed: revision " +
                      latestRevId +
                      " was undone to revision " +
                      revId +
                      ". The resulting page content is identical to revision " +
                      revId +
                      ".",
                  );
                }
              }
            }
          } catch (e) {
            quickLog(
              (method === "rollback" ? "[Rollback] " : "[Undo] ") +
                "Failed: " +
                formatApiError(e),
              true,
            );
          }

          // Completion summary, matching the wording pattern used by
          // buildCompletionSummary() in the main window's work() function.
          if (!hadFailure) {
            statusTextSpan.innerHTML =
              "<b>Status:</b> Completed: 1 edit " +
              (method === "rollback" ? "reverted" : "undone") +
              ".";
            quickLog("✅ All operations have been completed successfully");
          } else {
            statusTextSpan.innerHTML = "<b>Status:</b> Completed: 1 error.";
          }

          const btnClose = makeBtn("Close and reload", "primary");
          btnClose.addEventListener("click", function () {
            overlay.closeHandler();
          });
          footer.appendChild(btnClose);
        }

        // Builds a single inline "[⛩️ rollback]" / "[⛩️ restore this
        // revision]" link and wires up its click handler. Shared by the
        // history-page and contributions-page branches below so the click
        // handling only has to be written once.
        function buildInlineRevisionLink(kind, pageTitle, targetUser, revId) {
          const isRollback = kind === "rollback";
          const isSingleUndo = kind === "singleundo";
          const link = document.createElement("a");
          link.href = "#";
          link.className =
            "tng-inline-action tng-inline-action-" +
            (isRollback ? "rollback" : isSingleUndo ? "undo" : "restore");
          link.textContent = isRollback
            ? "[⛩️ rollback]"
            : isSingleUndo
              ? "[⛩️ undo]"
              : "[⛩️ restore this revision]";
          link.title = isRollback
            ? "Roll back this edit using Tengu (native rollback)"
            : isSingleUndo
              ? "Undo this edit using Tengu (undo). Does not require rollback rights."
              : "Undo edits after this revision using Tengu (undo)";
          link.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            runQuickRevert(
              pageTitle,
              targetUser,
              revId,
              isRollback ? "rollback" : isSingleUndo ? "singleundo" : "undo",
            ).catch(function (err) {
              // Surfaces any error occurring outside runQuickRevert()'s own
              // try/catch (e.g. while building the confirmation dialogue),
              // instead of it failing silently as an unhandled rejection.
              console.error("[Tengu] Inline revision action failed:", err);
              window.alert(
                "Tengu: the inline action could not be completed. See the browser console for details.",
              );
            });
          });
          return link;
        }

        // Determines the page's actual current revision ID via a live
        // API call, used as the authoritative basis for deciding which
        // side of a diff page gets "rollback" versus "restore this
        // revision" below. A live call is used rather than trusting
        // wgCurRevisionId directly, since that value can be stale on a
        // cached diff page. Falls back to wgCurRevisionId if the API
        // call fails, so a request failure does not suppress the actions
        // entirely. [Inference] wgCurRevisionId may be cached; this has
        // not been independently confirmed on a live wiki.
        async function fetchCurrentRevisionId(pageTitle) {
          try {
            const data = await apiGet({
              action: "query",
              prop: "revisions",
              titles: pageTitle,
              rvlimit: 1,
              rvprop: "ids",
              formatversion: 2,
            });
            const page = data.query && data.query.pages && data.query.pages[0];
            const revId =
              page && page.revisions && page.revisions[0]
                ? page.revisions[0].revid
                : null;
            if (revId) return revId;
          } catch (e) {
            // Falls through to the wgCurRevisionId fallback below.
          }
          const fallback = parseInt(mw.config.get("wgCurRevisionId"), 10);
          return fallback || null;
        }

        // Adds "[⛩️ rollback]" or "[⛩️ restore this revision]" to each
        // side of a diff page. Which link a side gets is decided by
        // comparing that side's revision ID against the page's actual
        // current revision, resolved via fetchCurrentRevisionId() —
        // never assumed from the revision's left/right position in the
        // diff. The side holding the current revision (if either does)
        // gets "rollback"; a side that is not current gets "restore this
        // revision". When neither side is current, both get "restore
        // this revision" and neither gets "rollback".
        async function insertDiffRevisionActions(oldRevIdRaw, newRevIdRaw) {
          const oldRevId = parseInt(oldRevIdRaw, 10);
          const newRevId = parseInt(newRevIdRaw, 10);
          if (!oldRevId && !newRevId) return;

          const pageTitle = mw.config.get("wgPageName").replace(/_/g, " ");
          const currentRevId = await fetchCurrentRevisionId(pageTitle);

          // Best-effort recovery of a side's revision author, purely for
          // the confirmation dialogue/edit summary; a null/hidden
          // username is already handled gracefully by runQuickRevert()
          // and buildQuickRevertSummaryText().
          function addAction(
            revId,
            titleBoxSelector,
            userLinkSelector,
            includeUndo,
          ) {
            if (!revId) return;
            const titleBox = document.querySelector(titleBoxSelector);
            if (!titleBox) return;

            let targetUser = null;
            const userLink = document.querySelector(userLinkSelector);
            if (userLink) targetUser = userLink.textContent.trim();

            const isCurrent = !!currentRevId && revId === currentRevId;
            // Rendered as a separate line at the top of the title box,
            // rather than appended inline to existing diff-page text
            // (username, edit summary, etc.), so the link's position stays
            // consistent and easy to identify across diffs.
            const actionWrap = document.createElement("div");
            actionWrap.className = "tng-inline-actions-diffline";
            actionWrap.appendChild(
              buildInlineRevisionLink(
                isCurrent ? "rollback" : "restore",
                pageTitle,
                targetUser,
                revId,
              ),
            );
            // "[⛩️ undo]" is only offered on the right-hand (current
            // revision) side of the diff, alongside whichever of
            // rollback/restore already appears on that line.
            if (includeUndo) {
              actionWrap.appendChild(document.createTextNode(" "));
              actionWrap.appendChild(
                buildInlineRevisionLink(
                  "singleundo",
                  pageTitle,
                  targetUser,
                  revId,
                ),
              );
            }
            titleBox.insertBefore(actionWrap, titleBox.firstChild);
          }

          addAction(
            oldRevId,
            "#mw-diff-otitle1",
            "#mw-diff-otitle2 .mw-userlink",
            false,
          );
          addAction(
            newRevId,
            "#mw-diff-ntitle1",
            "#mw-diff-ntitle2 .mw-userlink",
            true,
          );
        }

        async function insertInlineRevisionActions() {
          const isHistoryPage = mw.config.get("wgAction") === "history";
          const specialPage = mw.config.get("wgCanonicalSpecialPageName");
          const isContribsPage =
            specialPage === "Contributions" ||
            specialPage === "IPContributions";
          const diffOldRevId = mw.config.get("wgDiffOldId");
          const isDiffPage =
            !isHistoryPage && !isContribsPage && !!diffOldRevId;

          if (isDiffPage) {
            await insertDiffRevisionActions(
              diffOldRevId,
              mw.config.get("wgDiffNewId"),
            );
            return;
          }
          if (!isHistoryPage && !isContribsPage) return;

          // On history pages, list items reliably carry data-mw-revid. On
          // contributions pages this attribute is not present on the <li>
          // itself, so the rows are selected more broadly here and the revision ID is
          // recovered per-row from the "hist"/"diff" link instead.
          const rows = isHistoryPage
            ? document.querySelectorAll("#pagehistory li[data-mw-revid]")
            : document.querySelectorAll(".mw-contributions-list li");
          if (!rows.length) return;

          // On contributions pages, the target's currently-top revisions
          // are resolved once up front via list=usercontribs&ucshow=top,
          // rather than reading a page title out of each row's DOM link
          // and re-querying it separately. This gives an authoritative
          // revid -> title map: a row's revision is still current if, and
          // only if, its revid appears here. Paginated via the API's
          // continue token, capped at 20 requests as a safety limit.
          let topRevisionTitles = null;
          if (isContribsPage) {
            const contribsUser = mw.config.get("wgRelevantUserName") || "";
            topRevisionTitles = {};
            if (contribsUser) {
              try {
                let continueToken = {};
                let fetching = true;
                let iterations = 0;
                while (fetching && iterations < 20) {
                  iterations++;
                  const data = await apiGet(
                    Object.assign(
                      {
                        action: "query",
                        list: "usercontribs",
                        ucuser: contribsUser,
                        ucprop: "ids|title",
                        ucshow: "top",
                        uclimit: "max",
                      },
                      continueToken,
                    ),
                  );
                  if (data.query && data.query.usercontribs) {
                    data.query.usercontribs.forEach(function (c) {
                      topRevisionTitles[c.revid] = c.title;
                    });
                  }
                  if (data.continue) {
                    continueToken = data.continue;
                  } else {
                    fetching = false;
                  }
                }
              } catch (e) {
                // Leaves topRevisionTitles as whatever was collected before
                // the failure; rows whose revision cannot be confirmed
                // simply get no rollback link below, rather than risking
                // one being shown on a revision that may no longer be
                // current.
              }
            }
          }

          rows.forEach(function (li, index) {
            let revId = parseInt(li.dataset.mwRevid, 10);
            let pageTitle;
            let targetUser;

            if (isHistoryPage) {
              if (!revId) return;
              pageTitle = mw.config.get("wgPageName").replace(/_/g, " ");
              targetUser = mw.config.get("wgRelevantUserName") || null;
              const userLink = li.querySelector(
                ".mw-userlink, .history-user a",
              );
              if (userLink) targetUser = userLink.textContent.trim();

              const actionWrap = document.createElement("span");
              actionWrap.className = "tng-inline-actions";
              // Top row is the current revision: only rollback applies
              // there. Every other row gets "restore this revision" only.
              // "[⛩️ undo]" is shown on every row regardless, since it
              // undoes only that specific revision rather than depending
              // on the row's position relative to the current revision.
              const isLatest = index === 0;
              actionWrap.appendChild(
                buildInlineRevisionLink(
                  isLatest ? "rollback" : "restore",
                  pageTitle,
                  targetUser,
                  revId,
                ),
              );
              actionWrap.appendChild(document.createTextNode(" "));
              actionWrap.appendChild(
                buildInlineRevisionLink(
                  "singleundo",
                  pageTitle,
                  targetUser,
                  revId,
                ),
              );
              li.appendChild(document.createTextNode(" "));
              li.appendChild(actionWrap);
              return;
            }

            // Contributions page: recover the revision ID from the row
            // (data-mw-revid when present, otherwise the "hist"/"diff"
            // link's oldid/diff parameter), then look it up directly
            // against the top-revisions map built above. Only a match
            // gets a link, and only "rollback" — "restore this revision"
            // is never shown here.
            if (!revId) {
              const histLink = Array.from(li.querySelectorAll("a")).find(
                function (a) {
                  return (a.textContent || "").trim().toLowerCase() === "hist";
                },
              );
              const diffLink = Array.from(li.querySelectorAll("a")).find(
                function (a) {
                  return (a.textContent || "").trim().toLowerCase() === "diff";
                },
              );
              const revSourceHref =
                (histLink && histLink.getAttribute("href")) ||
                (diffLink && diffLink.getAttribute("href")) ||
                "";
              const oldidVal =
                mw.util.getParamValue("oldid", revSourceHref) ||
                mw.util.getParamValue("diff", revSourceHref);
              revId = parseInt(oldidVal, 10);
            }
            if (!revId || !topRevisionTitles || !(revId in topRevisionTitles))
              return;

            targetUser = mw.config.get("wgRelevantUserName") || "";
            pageTitle = topRevisionTitles[revId];

            const actionWrap = document.createElement("span");
            actionWrap.className = "tng-inline-actions";
            actionWrap.appendChild(
              buildInlineRevisionLink("rollback", pageTitle, targetUser, revId),
            );
            li.appendChild(document.createTextNode(" "));
            li.appendChild(actionWrap);
          });
        }

        insertInlineRevisionActions().catch(function (err) {
          console.error(
            "[Tengu] Failed to initialise inline revision actions:",
            err,
          );
        });

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
