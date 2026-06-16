/**
 * ============================================================================
 * Tengu — 天狗
 * Version 2.30.0
 * All-in-one wiki moderation tool
 * ============================================================================
 * PURPOSE:
 * An all-in-one moderation script for MediaWiki that streamlines user blocking,
 * rollbacks, page deletions, page protections, and revision deletions from a single interface.
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

        const tenguWarnObj = window.TenguWarn.get(useIndonesian);
        const WARN_MESSAGES = tenguWarnObj.WARN_MESSAGES;

        // ============================================================================
        // [Section 00] State
        // Stores runtime configurations and dialogue initialisation flags.
        // ============================================================================
        let config = {};
        let inited = false;
        let cssInited = false; // CSS injected once on first dialogue open
        let escListenerBound = false; // Escape key listener registered once on first overlay

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
          overlay.className = "tng-overlay";
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
          dialog.className = "tng-dialog";
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
          filter.placeholder = "Filter options…";
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
          inp.placeholder = "⚠️ " + message;
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
          sectionBody.style.maxHeight = "320px";
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

        // ============================================================================
        // [Section 06] Dropdown list reasons
        // Houses pre-populated reason sets for rollbacks, page deletions, and block actions.
        // MOVED to [[Tengu-reasons.js]]
        // ============================================================================

        // ============================================================================
        // [Section 07] Main work function
        // Executes API orchestration loops for user blocks, rollbacks, and deletions whilst piping execution log messages.
        // ============================================================================
        const work = async function () {
          let isAborted = false;
          const stats = {
            block: 0,
            rollback: 0,
            revdel: 0,
            delete: 0,
            protect: 0,
            unlink: 0,
            error: 0,
          };
          const toolTag = " — [[w:id:Pengguna:Rachmat04/Tengu.js|⛩️]]";

          // Build progress UI
          const { overlay, body, footer } = createDialog({
            title: "Processing Tengu tasks",
            icon: "⛩️",
            onClose: () => {
              window.location.reload();
            },
          });

          // Helper function to update status dynamically
          const updateStatusDisplay = () => {
            const statusText = isAborted ? "Aborted." : "Processing...";
            const summaryLine = `<b>Status:</b> ${statusText}<br/>Summary: <b>${stats.rollback}</b> reverted | <b>${stats.delete}</b> deleted | <b>${stats.unlink}</b> unlinked | <b>${stats.protect}</b> protected | <b>${stats.revdel}</b> hidden | <b>${stats.error}</b> errors.`;
            statusLbl.innerHTML = summaryLine;
          };

          const statusLbl = document.createElement("div");
          statusLbl.innerHTML =
            "<b>Status:</b> Processing...<br/>Summary: <b>0</b> reverted | <b>0</b> deleted | <b>0</b> unlinked | <b>0</b> protected | <b>0</b> hidden | <b>0</b> errors.";
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
              addLog("⚠️ Operations are being aborted...");
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
              await apiPost({
                action: "edit",
                title: talkTitle,
                appendtext: "\n\n" + notice,
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
                  icon: "⚠️",
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
                addLog("[Block] Self-block cancelled.", "warn");
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
                    ? `== Pemberitahuan pemblokiran akun ==\nAkun "${targetVal}" telah diblokir secara tidak terbatas dengan alasan berikut: ${config.blockReason}.\n\nSelama masa pemblokiran, akun ini mungkin tidak dapat melakukan sebagian atau seluruh tindakan yang biasanya memerlukan hak penyuntingan. Pemblokiran ini tidak berakhir secara otomatis dan akan tetap berlaku kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : `== Pemberitahuan pemblokiran akun ==\nAkun "${targetVal}" telah diblokir selama ${translateDurationId(config.blockDur)} dengan alasan berikut: ${config.blockReason}.\n\nSelama masa pemblokiran, akun ini mungkin tidak dapat melakukan sebagian atau seluruh tindakan yang biasanya memerlukan hak penyuntingan. Pemblokiran dijadwalkan berakhir pada waktunya, kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                  : isBlockIndef
                    ? `== Account block notice ==\nThe account "${targetVal}" has been blocked indefinitely due to the following reason: ${config.blockReason}.\n\nDuring the block period, the account may be unable to perform some or all actions that normally require editing privileges. This block does not expire automatically and will remain in effect unless modified by an administrator.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`
                    : `== Account block notice ==\nThe account "${targetVal}" has been blocked for ${config.blockDur} due to the following reason: ${config.blockReason}.\n\nDuring the block period, the account may be unable to perform some or all actions that normally require editing privileges. The block is scheduled to remain in effect until it expires, unless modified by an administrator.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;

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
                    editParams.appendtext = "\n\n" + notice;
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

          // --- Fetch user contributions OR prepare target page ---
          const pageEdits = {};
          const creation = [];
          const pagesToProtect = new Set();

          if (config.mode === "user") {
            let untildate = new Date();
            if (config.endtime === "inf") {
              untildate = null;
            } else {
              untildate.setSeconds(
                untildate.getSeconds() - parseInt(config.endtime),
              );
            }

            const contribParams = {
              action: "query",
              list: "usercontribs",
              ucuser: targetVal,
              uclimit: "max",
            };
            if (untildate) contribParams.ucend = untildate.toISOString();

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
          } else {
            // Page mode: Bypass fetching and apply operations directly to the target page
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
              await new Promise((resolve) => setTimeout(resolve, 100)); // Rate limit buffer
              continue;
            }

            // --- MEDIAINFO / STRUCTURED DATA CHECK ---
            // Because structured data edits cannot be undone natively via rollback or normal undo,
            // we independently check if the mediainfo slot was modified in this revision range.
            let mediainfoNeedsRevert = false;
            let goodMediaInfo = null;
            let pageId = null;

            try {
              const revidsToFetch = info.oldestParent
                ? `${info.latest}|${info.oldestParent}`
                : `${info.latest}`;
              const compData = await apiGet({
                action: "query",
                prop: "revisions",
                revids: revidsToFetch,
                rvprop: "ids|content",
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
            }

            let standardRevertSuccess = false;
            let standardErr = null;

            const undoSummaryStr = config.rollbackReason
              ? config.rollbackReason + toolTag
              : config.rollbackShow
                ? "Reverting edits by " + targetVal + toolTag
                : "Revert edits" + toolTag;

            const rbSummaryStr = config.rollbackReason
              ? config.rollbackReason + toolTag
              : config.rollbackShow
                ? ""
                : "Revert edits" + toolTag;

            // Execute standard rollback or undo operation sequentially based on settings
            if (config.rollbackMethod === "undo") {
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
                      `[Undo] Skipped: ${title} — page had already been reverted by another user; undo was not applied by this operation.`,
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
                      `[Rollback] Skipped: ${title} — already reverted or user is the only author.`,
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

            await new Promise((resolve) => setTimeout(resolve, 100)); // Throttling window
          }

          const notifyQueue = new Map();

          // Execute sequential page protections if enabled
          if (config.protect && pagesToProtect.size > 0) {
            for (const title of pagesToProtect) {
              if (isAborted) break;
              try {
                const protectData = {
                  action: "protect",
                  title: title,
                  protections: `edit=${config.protectEdit}|move=${config.protectMove}`,
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
                await new Promise((resolve) => setTimeout(resolve, 100));
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
                  await new Promise((resolve) => setTimeout(resolve, 100));
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
              await new Promise((resolve) => setTimeout(resolve, 100));
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
              await new Promise((resolve) => setTimeout(resolve, 100));
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
                      `[Notify] Skipped deletion notification for ${title}: page was created and deleted by the same user.`,
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
                      reason: config.massdelReason + toolTag,
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
                  await new Promise((resolve) => setTimeout(resolve, 100));
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
                    await new Promise((resolve) => setTimeout(resolve, 100));
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
                    } catch (e) {
                      addLog(
                        `[Delete] Failed to delete subpage ${sp.title}: ${formatApiError(e)}`,
                        true,
                      );
                    }
                    await new Promise((resolve) => setTimeout(resolve, 100));
                  }
                } catch (e) {
                  addLog(
                    `[Delete] Failed to fetch subpages for ${title}: ${formatApiError(e)}`,
                    true,
                  );
                }
              }

              await new Promise((resolve) => setTimeout(resolve, 100)); // Throttling window
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
              let notice;
              if (deletedTitles.length === 1) {
                notice = useIndonesian
                  ? `== Pemberitahuan penghapusan halaman ==\nHalaman "${deletedTitles[0]}" yang Anda buat telah dihapus dengan alasan berikut: ${config.massdelReason}.\n\nHalaman yang dihapus tidak lagi dapat diakses secara publik. Jika Anda yakin penghapusan ini keliru, silakan sampaikan di halaman pembicaraan saya atau ikuti prosedur pemulihan halaman wiki ini.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                  : `== Page deletion notice ==\nThe page "${deletedTitles[0]}" you created has been deleted due to the following reason: ${config.massdelReason}.\n\nDeleted pages are no longer publicly accessible. If you believe this deletion was in error, please raise the matter on my user talk page or follow your wiki's undeletion process.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
              } else {
                const listed = deletedTitles.map((t) => `* "${t}"`).join("\n");
                notice = useIndonesian
                  ? `== Pemberitahuan penghapusan halaman ==\nHalaman-halaman berikut yang Anda buat telah dihapus dengan alasan berikut: ${config.massdelReason}.\n\n${listed}\n\nHalaman yang dihapus tidak lagi dapat diakses secara publik. Jika Anda yakin ada penghapusan yang keliru, silakan sampaikan di halaman pembicaraan saya atau ikuti prosedur pemulihan halaman wiki ini.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                  : `== Page deletion notice ==\nThe following pages you created have been deleted due to the following reason: ${config.massdelReason}.\n\n${listed}\n\nDeleted pages are no longer publicly accessible. If you believe any of these deletions were in error, please raise the matter on my user talk page or follow your wiki's undeletion process.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
              }
              await apiPost({
                action: "edit",
                title: talkTitle,
                appendtext: "\n\n" + notice,
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
                let notice;
                if (titles.length === 1) {
                  notice = useIndonesian
                    ? `== Pemberitahuan penghapusan halaman ==\nHalaman "${titles[0]}" yang Anda buat telah dihapus dengan alasan berikut: ${config.massdelReason}.\n\nHalaman yang dihapus tidak lagi dapat diakses secara publik. Jika Anda yakin penghapusan ini keliru, silakan sampaikan di halaman pembicaraan saya atau ikuti prosedur pemulihan halaman wiki ini.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : `== Page deletion notice ==\nThe page "${titles[0]}" you created has been deleted due to the following reason: ${config.massdelReason}.\n\nDeleted pages are no longer publicly accessible. If you believe this deletion was in error, please raise the matter on my user talk page or follow your wiki's undeletion process.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                } else {
                  const listed = titles.map((t) => `* "${t}"`).join("\n");
                  notice = useIndonesian
                    ? `== Pemberitahuan penghapusan halaman ==\nHalaman-halaman berikut yang Anda buat telah dihapus dengan alasan berikut: ${config.massdelReason}.\n\n${listed}\n\nHalaman yang dihapus tidak lagi dapat diakses secara publik. Jika Anda yakin ada penghapusan yang keliru, silakan sampaikan di halaman pembicaraan saya atau ikuti prosedur pemulihan halaman wiki ini.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                    : `== Page deletion notice ==\nThe following pages you created have been deleted due to the following reason: ${config.massdelReason}.\n\n${listed}\n\nDeleted pages are no longer publicly accessible. If you believe any of these deletions were in error, please raise the matter on my user talk page or follow your wiki's undeletion process.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
                }
                await apiPost({
                  action: "edit",
                  title: talkTitle,
                  appendtext: "\n\n" + notice,
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
              await new Promise((resolve) => setTimeout(resolve, 100));
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
                reason:
                  (useIndonesian
                    ? "Perlindungan terhadap pembuatan ulang"
                    : "Protection against re-creation") + toolTag,
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
                  `[Protect] Skipped deferred protection for ${title}: page was not deleted.`,
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
                await new Promise((resolve) => setTimeout(resolve, 100));
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
                  await new Promise((resolve) => setTimeout(resolve, 100));
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
              await new Promise((resolve) => setTimeout(resolve, 100));
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
                      `[Notify] Skipped protection notification for ${talkTitle}: talk page no longer exists.`,
                      "warn",
                    );
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    continue;
                  }
                } catch (e) {
                  addLog(
                    `[Notify] Could not check talk page existence for ${talkTitle}: ${formatApiError(e)}`,
                    "warn",
                  );
                  await new Promise((resolve) => setTimeout(resolve, 100));
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
                await new Promise((resolve) => setTimeout(resolve, 100));
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
                    await new Promise((resolve) => setTimeout(resolve, 100));
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
          const finalStatus = `${statusPrefix}Summary: <b>${stats.rollback}</b> ${methodTxt} | <b>${stats.delete}</b> deleted | <b>${stats.unlink}</b> unlinked | <b>${stats.protect}</b> protected | <b>${stats.revdel}</b> hidden | <b>${stats.error}</b> errors.`;
          statusLbl.innerHTML = finalStatus;
          isAborted = false;

          if (isAborted) {
            addLog("⛔ Operations aborted by user");
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
            el.textContent = "⚠ " + msg;
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
            el.textContent = "⚠ " + msg;
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

          const defaultPackage = {
            tracingedits: { duration: 3600, indefregistered: true },
            rollback: {
              enabled: false,
              bot: false,
              showname: true,
              reason: "",
            },
            block: {
              enabled: false,
              duration: "1 day",
              indefregistered: true,
              reason: "",
              autoblock: true,
              hardblock: false,
              create: true,
              talk: false,
              mail: false,
              hidename: false,
            },
            pagedelete: { enabled: false, reason: "" },
            pageprotection: {
              enabled: false,
              edit: "all",
              move: "all",
              expiry: "1 day",
              reason: "",
            },
            revisiondelete: {
              enabled: false,
              content: true,
              summary: true,
              username: false,
              reason: "",
              oversight: false,
            },
          };

          if (typeof p4js_all_in_one === "undefined")
            window.p4js_all_in_one = {};
          const aioConf = window.p4js_all_in_one;
          const suffixes = aioConf.suffixes || [
            "",
            " (global sysops action)",
            " (stewards action)",
            " (global rollbackers action)",
          ];

          let packages = aioConf.packages || {};
          if (!packages.Default) packages.Default = defaultPackage;

          // Native presets
          if (!packages["Severe vandalism"]) {
            packages["Severe vandalism"] = {
              tracingedits: { duration: 86400, indefregistered: false },
              rollback: {
                enabled: true,
                bot: false,
                showname: true,
                reason: "Vandalism",
              },
              block: {
                enabled: true,
                duration: "3 days",
                indefregistered: false,
                reason: "Vandalism",
                autoblock: true,
                hardblock: true,
                create: true,
                talk: true,
                mail: false,
                hidename: false,
              },
              pagedelete: { enabled: false, reason: "" },
              pageprotection: { enabled: false },
              revisiondelete: { enabled: false },
            };
          }

          if (!packages["Bot attack or automated spam"]) {
            packages["Bot attack or automated spam"] = {
              tracingedits: { duration: "inf", indefregistered: true },
              rollback: {
                enabled: true,
                bot: true,
                showname: true,
                reason: "Vandalism",
              },
              block: {
                enabled: true,
                duration: "never",
                indefregistered: true,
                reason: "Abusing multiple accounts",
                autoblock: true,
                hardblock: false,
                create: true,
                talk: true,
                mail: true,
                hidename: false,
              },
              pagedelete: { enabled: false, reason: "" },
              pageprotection: { enabled: false },
              revisiondelete: { enabled: false },
            };
          }

          if (!packages["Severe privacy violation or doxxing"]) {
            packages["Severe privacy violation or doxxing"] = {
              tracingedits: { duration: "inf", indefregistered: true },
              rollback: {
                enabled: true,
                bot: false,
                showname: false,
                reason: "Vandalism",
              },
              block: {
                enabled: true,
                duration: "never",
                indefregistered: true,
                reason: "Personal attacks or harassment policy violations",
                autoblock: true,
                hardblock: false,
                create: true,
                talk: true,
                mail: true,
                hidename: true,
              },
              pagedelete: { enabled: false, reason: "" },
              pageprotection: { enabled: false },
              revisiondelete: {
                enabled: true,
                content: true,
                summary: true,
                username: true,
                reason: "Grossly insulting, degrading, or offensive material",
                oversight: false,
              },
            };
          }

          if (!packages["Mass page creation or spam"]) {
            packages["Mass page creation or spam"] = {
              tracingedits: { duration: 604800, indefregistered: false },
              rollback: {
                enabled: true,
                bot: false,
                showname: true,
                reason:
                  "Promotional editing or editing with a conflict of interest",
              },
              block: {
                enabled: true,
                duration: "never",
                indefregistered: true,
                reason: "Using Wikipedia for promotion or advertising purposes",
                autoblock: true,
                hardblock: false,
                create: true,
                talk: false,
                mail: false,
                hidename: false,
              },
              pagedelete: {
                enabled: true,
                reason: "Purely promotional content",
              },
              pageprotection: { enabled: false },
              revisiondelete: { enabled: false },
            };
          }

          if (!packages["Edit warring or 3RR violation"]) {
            packages["Edit warring or 3RR violation"] = {
              tracingedits: { duration: 259200, indefregistered: false },
              rollback: {
                enabled: true,
                bot: false,
                showname: true,
                reason: "Edit warring prevention",
              },
              block: {
                enabled: true,
                duration: "31 hours",
                indefregistered: false,
                reason: "Violation of the three-revert rule",
                autoblock: true,
                hardblock: false,
                create: false,
                talk: false,
                mail: false,
                hidename: false,
              },
              pagedelete: { enabled: false, reason: "" },
              pageprotection: { enabled: false },
              revisiondelete: { enabled: false },
            };
          }

          if (!packages["Mass copyright infringement"]) {
            packages["Mass copyright infringement"] = {
              tracingedits: { duration: 2592000, indefregistered: false },
              rollback: {
                enabled: true,
                bot: false,
                showname: true,
                reason: "Copyright violations",
              },
              block: {
                enabled: true,
                duration: "1 week",
                indefregistered: false,
                reason: "Copyright infringement",
                autoblock: true,
                hardblock: false,
                create: true,
                talk: false,
                mail: false,
                hidename: false,
              },
              pagedelete: {
                enabled: true,
                reason: "Clear copyright infringement",
              },
              pageprotection: { enabled: false },
              revisiondelete: {
                enabled: true,
                content: true,
                summary: true,
                username: false,
                reason: "Violations of copyright policy",
                oversight: false,
              },
            };
          }

          if (!packages["Sockpuppetry or block evasion"]) {
            packages["Sockpuppetry or block evasion"] = {
              tracingedits: { duration: "inf", indefregistered: true },
              rollback: {
                enabled: true,
                bot: false,
                showname: true,
                reason: "Block evasion or use of sockpuppet accounts",
              },
              block: {
                enabled: true,
                duration: "never",
                indefregistered: true,
                reason: "Sockpuppetry",
                autoblock: true,
                hardblock: false,
                create: true,
                talk: true,
                mail: false,
                hidename: false,
              },
              pagedelete: {
                enabled: true,
                reason:
                  "Creation by a banned or blocked user in violation of ban or block",
              },
              pageprotection: { enabled: false },
              revisiondelete: { enabled: false },
            };
          }

          const { overlay, dialog, body, footer } = createDialog({
            title: "Tengu — your all-in-one moderation tools",
            icon: "⛩️",
          });

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
            btnModeUser.classList.add("tng-mode-btn-active");
          } else {
            btnModePage.classList.add("tng-mode-btn-active");
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
              btnModeUser.classList.add("tng-mode-btn-active");
              btnModePage.classList.remove("tng-mode-btn-active");
              applyModeRestrictions(true);
            });
          }

          btnModePage.addEventListener("click", function () {
            if (tenguMode === "page") return;
            btnModePage.classList.add("tng-mode-btn-active");
            btnModeUser.classList.remove("tng-mode-btn-active");
            applyModeRestrictions(false);
          });

          modeToggle.appendChild(btnModeUser);
          modeToggle.appendChild(btnModePage);
          fieldMode.appendChild(modeToggle);
          topSection.appendChild(rowMode);

          // Mode notice — Informs users how deletion and protection behave in the current mode
          const divModeNotice = document.createElement("div");
          divModeNotice.className = "tng-mode-notice";
          // isSpecialTarget: true when in page mode and the target resolves to a special page
          function updateModeNotice(isUser, isSpecialTarget) {
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

          const btnGetInfo = makeBtn("ℹ️ Get info", "quiet");
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
            { value: "other", label: "Other (seconds):" },
          ]);
          const inputEndtime = makeInput("seconds");
          inputEndtime.classList.add("tng-hidden");
          selEndtime.addEventListener("change", function () {
            inputEndtime.classList.toggle(
              "tng-hidden",
              selEndtime.value !== "other",
            );
          });
          const editGroup = document.createElement("div");
          editGroup.style.cssText = "display: flex; gap: 6px; width: 100%;";
          inputEndtime.style.flex = "1";
          editGroup.appendChild(wrapSelect(selEndtime, "1"));
          editGroup.appendChild(inputEndtime);
          fieldEdits.appendChild(editGroup);
          topSection.appendChild(rowEdits);
          const { row: rowPkg, field: fieldPkg } = makeRow("Package");
          const selPackage = makeSelect(
            Object.keys(packages).map(function (k) {
              return { value: k, label: k };
            }),
          );
          fieldPkg.appendChild(wrapSelect(selPackage));
          topSection.appendChild(rowPkg);
          const { row: rowSuffix, field: fieldSuffix } = makeRow("Suffix");
          const selSuffix = makeSelect(
            suffixes.map(function (s) {
              return { value: s, label: s || "— (no suffix)" };
            }),
          );
          fieldSuffix.appendChild(wrapSelect(selSuffix));
          topSection.appendChild(rowSuffix);

          if (tenguMode === "page") {
            // Show edits and package rows but disable their controls — not applicable in page mode
            selEndtime.disabled = true;
            inputEndtime.disabled = true;
            selPackage.disabled = true;
            rowEdits.style.opacity = "0.5";
            rowEdits.title = "Not applicable in page mode";
            rowPkg.style.opacity = "0.5";
            rowPkg.title = "Not applicable in page mode";
          }
          body.appendChild(topSection);

          const {
            section: secRollback,
            sectionBody: bodyRollback,
            enableChk: chkRollback,
          } = makeSection("Rollback", "↩️", false);
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

          const helpRbReason = document.createElement("div");
          helpRbReason.className = "tng-help";
          helpRbReason.textContent =
            'If set, this overrides the default rollback summary. When "Show username in summary" is unchecked and no reason is given, the summary will read "Revert edits".';
          reasonWrapRollback.appendChild(helpRbReason);

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
          // Warn section — user mode only
          // Sends a templated warning message to the target user's talk page.
          // ============================================================================
          const {
            section: secWarn,
            sectionBody: bodyWarn,
            enableChk: chkWarn,
          } = makeSection("User warning", "⚠️", false);

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
            "When ticked, the talk page of each deleted page will also be deleted if it exists. Pages that are already talk pages are skipped.";
          const checksPagedel = document.createElement("div");
          checksPagedel.className = "tng-checks";
          checksPagedel.style.paddingLeft = "0";
          checksPagedel.appendChild(wrapPagedelTalk);
          // 'Delete redirects to deleted page' option
          const { wrap: wrapPagedelRedirects, chk: chkPagedelRedirects } =
            makeCheckbox("Delete redirects to deleted page", true);
          wrapPagedelRedirects.title =
            "When ticked, all redirects pointing to each deleted page are also deleted. Redirects to a non-existent target serve no purpose and are removed automatically.";
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

          chkPagedelProtectRecreation.addEventListener("change", function () {
            const enabled = chkPagedelProtectRecreation.checked;
            selPagedelProtectRecreationLevel.disabled = !enabled;
            selPagedelProtectRecreationExpiry.disabled = !enabled;
            inputPagedelProtectRecreationExpiry.disabled = !enabled;
            rowRecreationLevel.style.opacity = enabled ? "" : "0.5";
            rowRecreationExpiry.style.opacity = enabled ? "" : "0.5";
          });

          checksPagedel.appendChild(wrapRecreationGroup);
          bodyPagedel.appendChild(checksPagedel);
          body.appendChild(secPagedel);

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
          // "Protect against recreation" — only active on non-existent pages.
          // Uses create= protection, which is the correct API parameter for
          // preventing deleted pages from being recreated.
          const { wrap: wrapProtectRecreation, chk: chkProtectRecreation } =
            makeCheckbox("Protect against recreation", false);
          // Disabled at construction time. Enabled only after the API confirms the page does not exist.
          chkProtectRecreation.disabled = true;
          wrapProtectRecreation.style.opacity = "0.5";
          wrapProtectRecreation.title =
            "Only available when the target page does not exist.";

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

          // Recreation-protection group: checkbox + level and expiry rows,
          // enclosed in a bordered container to signal they form one set.
          const wrapProtectRecreationGroup = document.createElement("div");
          wrapProtectRecreationGroup.className = "tng-recreation-group";
          wrapProtectRecreationGroup.appendChild(wrapProtectRecreation);

          const {
            row: rowProtectRecreationLevel,
            field: fieldProtectRecreationLevel,
          } = makeRow("Protection level");
          fieldProtectRecreationLevel.appendChild(
            wrapSelect(selProtectRecreationLevel, "1"),
          );
          rowProtectRecreationLevel.style.opacity = "0.5";
          wrapProtectRecreationGroup.appendChild(rowProtectRecreationLevel);

          const {
            row: rowProtectRecreationExpiry,
            field: fieldProtectRecreationExpiry,
          } = makeRow("Expiry");
          fieldProtectRecreationExpiry.appendChild(
            recreationProtectExpiryGroup,
          );
          rowProtectRecreationExpiry.style.opacity = "0.5";
          wrapProtectRecreationGroup.appendChild(rowProtectRecreationExpiry);

          // Enable/disable the sub-controls when the checkbox is toggled.
          chkProtectRecreation.addEventListener("change", function () {
            const enabled = chkProtectRecreation.checked;
            selProtectRecreationLevel.disabled = !enabled;
            selProtectRecreationExpiry.disabled = !enabled;
            inputProtectRecreationExpiry.disabled = !enabled;
            rowProtectRecreationLevel.style.opacity = enabled ? "" : "0.5";
            rowProtectRecreationExpiry.style.opacity = enabled ? "" : "0.5";
          });

          checksProtect.appendChild(wrapProtectRecreationGroup);
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

          // Applies or removes reversible mode locks on page deletion and protection
          // when the target is a special page. Delegates to applyModeLock() so locks
          // are cleared automatically when the target changes or mode is switched.
          function applySpecialPageLocks(lock) {
            if (lock) {
              applyModeLock(
                secPagedel,
                bodyPagedel,
                chkPagedel,
                true,
                "special pages cannot be deleted",
              );
              applyModeLock(
                secProtect,
                bodyProtect,
                chkProtect,
                true,
                "special pages cannot be protected",
              );
            } else {
              applyModeLock(secPagedel, bodyPagedel, chkPagedel, false);
              applyModeLock(secProtect, bodyProtect, chkProtect, false);
            }
          }

          // Updates all mode-sensitive UI when the user switches modes via the toggle.
          function applyModeRestrictions(isUserModeNow) {
            tenguMode = isUserModeNow ? "user" : "page";
            const targetIsSpecial = !isUserModeNow && isTargetSpecialPage();
            updateModeNotice(isUserModeNow, targetIsSpecial);

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

            // Pre-fill target with the appropriate default for the selected mode
            inputTarget.value = isUserModeNow
              ? mw.config.get("wgRelevantUserName") || ""
              : mw.config.get("wgPageName").replace(/_/g, " ");
            clearInputError(inputTarget);
            btnGetInfo.disabled = !inputTarget.value.trim();

            // Edits and package rows: only applicable in user mode
            selEndtime.disabled = !isUserModeNow;
            inputEndtime.disabled = !isUserModeNow;
            selPackage.disabled = !isUserModeNow;
            rowEdits.style.opacity = isUserModeNow ? "" : "0.5";
            rowEdits.title = isUserModeNow ? "" : "Not applicable in page mode";
            rowPkg.style.opacity = isUserModeNow ? "" : "0.5";
            rowPkg.title = isUserModeNow ? "" : "Not applicable in page mode";

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
            } else {
              // Remove mode locks first to enable features
              applyModeLock(secRollback, bodyRollback, chkRollback, false);
              applyModeLock(secBlock, bodyBlock, chkBlock, false);
              applyModeLock(secWarn, bodyWarn, chkWarn, false);
              applyModeLock(secRevdel, bodyRevdel, chkRevdel, false);
              // Remove any special page locks that were active while in page mode
              applySpecialPageLocks(false);

              // Re-evaluate and apply strict rights-based permanent locks if permissions are missing
              if (resolvedRights) {
                if (!resolvedRights.hasBlock) {
                  lockSection(
                    secBlock,
                    bodyBlock,
                    chkBlock,
                    "you do not have the block right on this wiki",
                  );
                }
                if (!resolvedRights.hasRevdel) {
                  lockSection(
                    secRevdel,
                    bodyRevdel,
                    chkRevdel,
                    "you do not have the deleterevision right on this wiki",
                  );
                }
              }
            }

            // Apply or remove special page locks when switching to page mode
            if (!isUserModeNow) applySpecialPageLocks(targetIsSpecial);

            updateStartBtn();
            updateSectionStatus();
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
              chkPagedel.checked ||
              chkProtect.checked ||
              chkRevdel.checked ||
              chkWarn.checked
            );
          }

          // Bind monitoring handlers to state changes of operational modules
          chkRollback.addEventListener("change", updateStartBtn);
          chkBlock.addEventListener("change", updateStartBtn);
          chkPagedel.addEventListener("change", updateStartBtn);
          chkProtect.addEventListener("change", updateStartBtn);
          chkRevdel.addEventListener("change", updateStartBtn);
          chkWarn.addEventListener("change", updateStartBtn);

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
            const suffix = selSuffix.value;
            const isIP = mw.util.isIPAddress(targetVal);
            let endtime = selEndtime.value;
            if (endtime === "other")
              endtime = inputEndtime.value.trim() || "3600";

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
            function buildPagedelReason() {
              return inputPagedelReason.value.trim() || selPagedelReason.value;
            }
            function buildProtectReason() {
              return inputProtectReason.value.trim() || selProtectReason.value;
            }
            function buildRevdelReason() {
              return inputRevdelReason.value.trim() || selRevdelReason.value;
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
              massdelReason: buildPagedelReason() + suffix,
              protect: chkProtect.checked,
              protectEdit: selProtectEdit.value,
              protectMove: selProtectMove.value,
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

            // Inject high-impact verification confirmation prompt modal for deletion and protection features
            if (config.massdel || config.protect) {
              const confirmDlg = createDialog({
                title: "Confirm dangerous operations",
                icon: "⚠️",
              });

              const warningMsg = document.createElement("p");
              warningMsg.style.margin = "0 0 12px 0";
              warningMsg.innerHTML =
                "You have enabled <b>page deletion</b> or <b>page protection</b> tasks. These operations can modify multiple pages across the wiki simultaneously. Please confirm that you want to execute these tasks.";
              confirmDlg.body.appendChild(warningMsg);

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
            } else {
              overlay.closeHandler();
              work();
            }
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
              };

              // If the user lacks the rollback right, automatically switch to undo.
              // The checkbox remains available so users with rollback can still opt in manually.
              if (!hasRollback) {
                chkUndo.checked = true;
              }

              if (!hasBlock && tenguMode === "user")
                lockSection(
                  secBlock,
                  bodyBlock,
                  chkBlock,
                  "you do not have the block right on this wiki",
                );
              if (!hasDelete)
                lockSection(
                  secPagedel,
                  bodyPagedel,
                  chkPagedel,
                  "you do not have the delete right on this wiki",
                );
              if (!hasProtect)
                lockSection(
                  secProtect,
                  bodyProtect,
                  chkProtect,
                  "you do not have the protect right on this wiki",
                );
              if (!hasRevdel && tenguMode === "user")
                lockSection(
                  secRevdel,
                  bodyRevdel,
                  chkRevdel,
                  "you do not have the deleterevision right on this wiki",
                );

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
            } else {
              const dur = String(trac.duration || 3600);
              if (
                [...selEndtime.options].find(function (o) {
                  return o.value === dur;
                })
              ) {
                selEndtime.value = dur;
                inputEndtime.classList.add("tng-hidden");
              } else {
                selEndtime.value = "other";
                inputEndtime.value = dur;
                inputEndtime.classList.remove("tng-hidden");
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
            selProtectExpiry.value = pt.expiry || "1 day";
            inputProtectExpiry.value = "";
            inputProtectExpiry.classList.add("tng-hidden");
            inputProtectReason.value = pt.reason || "";
            selProtectReason.selectedIndex = 0;
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

            // Edit and move restriction levels.
            if (editEntry) selProtectEdit.value = editEntry.level || "all";
            if (moveEntry) selProtectMove.value = moveEntry.level || "all";

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
              return;
            }

            if (tenguMode === "user") {
              const isTargetIP = mw.util.isIPAddress(target);
              setNote(
                divPagedelStatus,
                "loading",
                "Not applicable in user mode.",
              );
              setNote(
                divProtectStatus,
                "loading",
                "Not applicable in user mode.",
              );

              // --- Block status ---
              setNote(divBlockStatus, "loading", "Loading block status...");
              (async function () {
                try {
                  const data = await apiGet({
                    action: "query",
                    list: "users",
                    usprop: "blockinfo",
                    ususers: target,
                  });
                  const user =
                    data.query && data.query.users && data.query.users[0];
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
                  } else {
                    // Not currently blocked — check most recent block log entry
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
                    "loading",
                    "Could not load block status.",
                  );
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
                return;
              }

              // --- Deletion history ---
              setNote(
                divPagedelStatus,
                "loading",
                "Loading deletion history...",
              );
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
                  } else {
                    setNote(
                      divPagedelStatus,
                      "inactive",
                      "No prior deletion history found.",
                    );
                  }
                } catch (e) {
                  setNote(
                    divPagedelStatus,
                    "loading",
                    "Could not load deletion history.",
                  );
                }
              })();

              // Reset recreation-protection controls synchronously on every target change.
              // The async call below re-enables them only if the page is confirmed to be missing.
              chkProtectRecreation.disabled = true;
              chkProtectRecreation.checked = false;
              wrapProtectRecreation.style.opacity = "0.5";
              wrapProtectRecreation.title =
                "Only available when the target page does not exist.";
              selProtectRecreationLevel.disabled = true;
              selProtectRecreationExpiry.disabled = true;
              inputProtectRecreationExpiry.disabled = true;
              rowProtectRecreationLevel.style.opacity = "0.5";
              rowProtectRecreationExpiry.style.opacity = "0.5";

              // --- Protection status ---

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
                    chkProtectRecreation.disabled = false;
                    wrapProtectRecreation.style.opacity = "";
                    wrapProtectRecreation.title =
                      "When ticked, the page will be protected against recreation using create-level protection.";
                  } else {
                    chkProtectRecreation.disabled = true;
                    chkProtectRecreation.checked = false;
                    wrapProtectRecreation.style.opacity = "0.5";
                    wrapProtectRecreation.title =
                      "Only available when the target page does not exist.";
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
            "Open Tengu, all-in-one moderation tools",
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
