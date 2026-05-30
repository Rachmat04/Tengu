/**
 * ============================================================================
 * TENGU — 天狗
 * Version 1.5.3
 * All-in-one wiki moderation tool
 * ============================================================================
 * PURPOSE:
 * An all-in-one moderation script for MediaWiki that streamlines user blocking,
 * rollbacks, page deletions, page protections, and revision deletions from a single interface.
 *
 * KEY FEATURES:
 * - Rollback: Reverts all recent edits by a target user (or via undo fallback).
 * - Block: Blocks a user or IP with configurable options and automatic expiration.
 * - Page deletion: Mass-deletes pages created by a target user.
 * - Page protection: Mass-protects pages edited or created by a target user.
 * - Revision deletion: Hides revision content, summaries, or usernames.
 *
 * CHANGELOG v1.5.3:
 * - Added: In-house notification style for form validation errors.
 * - Changed: Replaced standard browser alerts with integrated dialog notifications.
 *
 * CHANGELOG v1.5.2:
 * - Added: Automated talk page notification upon account block.
 *
 * CHANGELOG v1.5.1:
 * - Added: Automated talk page notification upon page protection.
 *
 * CHANGELOG v1.5.0:
 * - Added: Abort button during task execution to allow cancelling ongoing operations.
 *
 * CHANGELOG v1.4.1:
 * - Fixed: UI bug where the page protection preset reasons dropdown was incorrectly appended to the revision deletion module.
 *
 * CHANGELOG v1.4.0:
 * - Added: Page protection feature with comprehensive preset reasons.
 * - Added: Warning confirmation dialogue modal before executing deletion or protection tasks.
 *
 * CHANGELOG v1.3.0:
 * - Added: Preset reasons configuration array for page protection feature.
 *
 * CHANGELOG v1.2.0:
 * - Fixed: API request throttling by shifting to sequential execution using native ES6 promises.
 * - Fixed: Pagination bottlenecks by explicitly handling the query continue token.
 * - Changed: Standardised all interface elements, logs, labels, and comments to sentence case and en-GB spelling.
 *
 * CHANGELOG v1.1.0:
 * - Added: Optional undo fallback method for users without native rollback rights.
 * - Changed: Reduced the vertical height of the progress log for better screen real-estate utilisation.
 *
 * ORIGINAL SCRIPT:
 * - Based on User:WhitePhosphorus/all-in-one
 * - See: https://meta.wikimedia.org/wiki/User:WhitePhosphorus/all-in-one
 * ============================================================================
 */
// <nowiki>
$(function () {
  mw.loader.using(["mediawiki.util", "mediawiki.api"], function () {
    // ============================================================================
    // [Section 00] State
    // Stores runtime configurations and dialogue initialisation flags.
    // ============================================================================
    let config = {};
    let inited = false;

    // ============================================================================
    // [Section 01] Stylesheet
    // Appends customised CSS configurations for layout rendering and dark mode support.
    // ============================================================================
    mw.util.addCSS(`
        /* --- Overlay --- */
        .tng-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,.52); z-index: 100000;
            display: flex; align-items: center; justify-content: center; padding: 12px;
            animation: tng-fadein .15s ease-out;
        }

        /* --- Dialogue container --- */
        .tng-dialog {
            background: #fff; color: #202122;
            border: 1px solid #a2a9b1; border-radius: 8px;
            width: min(850px, 96%); max-height: 90vh;
            display: flex; flex-direction: column;
            box-shadow: 0 8px 28px rgba(0,0,0,.32);
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 0.94em; overflow: hidden;
            animation: tng-slidein .15s ease-out;
        }

        /* Container must be relative to position the bubble inside */
        .tng-input-container { position: relative; }
        
        /* The notification bubble styling */
        .tng-notification {
            position: absolute;
            top: 100%;
            left: 0;
            background: #fff0f0;
            border: 1px solid #d33;
            color: #b32424;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            margin-top: 4px;
            z-index: 100;
            display: none;
        }

        /* --- Dialogue header --- */
        .tng-dialog-header {
            padding: 11px 16px;
            background: #f8f9fa; border-bottom: 1px solid #eaecf0;
            font-weight: 700; font-size: 1.05em;
            display: flex; align-items: center; justify-content: space-between;
            flex-shrink: 0;
        }
        .tng-dialog-header-left {
            display: flex; align-items: center; gap: 7px;
        }
        .tng-dialog-close {
            background: none; border: none; font-size: 1.2em;
            cursor: pointer; color: #54595d; padding: 0 2px; line-height: 1;
        }
        .tng-dialog-close:hover { color: #000; }

        /* --- Dialogue body --- */
        .tng-dialog-body {
            padding: 16px; overflow-y: auto; flex: 1;
            display: flex; flex-direction: column; gap: 12px;
        }

        /* --- Dialogue footer --- */
        .tng-dialog-footer {
            padding: 10px 14px;
            background: #f8f9fa; border-top: 1px solid #eaecf0;
            display: flex; justify-content: flex-end; align-items: center; gap: 8px;
            flex-shrink: 0;
        }

        /* --- Section blocks (rollback, block, etc.) --- */
        .tng-section {
            border: 1px solid #a2a9b1; border-radius: 6px;
            overflow: hidden; transition: opacity .25s;
            flex-shrink: 0;
        }
        .tng-section.tng-disabled { opacity: .45; }

        .tng-section-header {
            padding: 8px 12px;
            background: #f0f2f5; border-bottom: 1px solid #eaecf0;
            display: flex; align-items: center; gap: 8px;
            font-weight: 700; cursor: pointer; user-select: none;
        }
        .tng-section-header:hover { background: #e6e8eb; }

        .tng-section-body {
            padding: 12px; display: flex; flex-direction: column; gap: 10px;
            max-height: 250px; overflow-y: auto;
        }

        /* --- Form rows --- */
        .tng-row {
            display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap;
            width: 100%;
        }
        .tng-row label.tng-label {
            width: 180px; flex-shrink: 0;
            font-size: 0.88em; color: #54595d;
            padding-top: 4px;
        }
        .tng-row .tng-field {
            flex: 1; min-width: 0;
            display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
        }

        /* --- Checkbox rows --- */
        .tng-checkrow {
            display: inline-flex; align-items: center; gap: 5px;
            font-size: 0.88em; margin-right: 12px; margin-bottom: 4px;
            cursor: pointer;
        }
        .tng-checkrow input[type=checkbox] { cursor: pointer; }

        .tng-checks {
            display: flex; flex-wrap: wrap; padding-left: 190px;
        }

        /* --- Inputs and selects --- */
        .tng-input, .tng-select {
            width: 100%; box-sizing: border-box;
            padding: 4px 8px; border: 1px solid #a2a9b1; border-radius: 4px;
            font-size: 0.9em; background: #fff; color: #202122;
            font-family: inherit;
        }
        .tng-input:focus, .tng-select:focus {
            outline: none; border-color: #3366cc;
            box-shadow: 0 0 0 2px rgba(51,102,204,.18);
        }
        .tng-select { cursor: pointer; }

        /* --- Grouped select + input --- */
        .tng-reason-wrap {
            display: flex; gap: 6px; flex-direction: column; flex: 1; min-width: 0; width: 100%;
        }
        .tng-reason-top {
            display: flex; gap: 6px; align-items: center; width: 100%;
        }
        .tng-reason-top .tng-select {
            flex: 1; min-width: 0;
        }
        .tng-dual {
            display: flex; gap: 6px; align-items: center; flex-wrap: wrap;
        }

        /* --- Buttons --- */
        .tng-btn {
            display: inline-flex; align-items: center; justify-content: center;
            padding: 5px 14px; border-radius: 4px; font-size: 0.9em;
            font-weight: 600;
            cursor: pointer; border: 1px solid transparent;
            font-family: inherit; transition: background .12s, border-color .12s;
            white-space: nowrap;
        }
        .tng-btn-primary { background: #3366cc; color: #fff; border-color: #3366cc; }
        .tng-btn-primary:hover { background: #2a4b9e; border-color: #2a4b9e; }
        .tng-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
        .tng-btn-quiet { background: none; color: #202122; border-color: #a2a9b1; }
        .tng-btn-quiet:hover { background: #f0f2f5; }
        .tng-btn-destructive { background: #b00020; color: #fff; border-color: #b00020; }
        .tng-btn-destructive:hover { background: #8a0018; border-color: #8a0018; }
        .tng-btn-destructive:disabled { opacity: .5; cursor: not-allowed; }
        .tng-btn-sm { padding: 3px 9px; font-size: 0.84em; }

        /* --- Top info block --- */
        .tng-top-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        }
        @media (max-width: 480px) {
            .tng-top-grid { grid-template-columns: 1fr; }
            .tng-checks { padding-left: 0; }
            .tng-row label.tng-label { width: 100%; padding-top: 0; }
        }

        .tng-help { font-size: 0.82em; color: #72777d; margin-top: 2px; }
        .tng-hidden { display: none !important; }
        .tng-optgroup-label {
            font-weight: 700; color: #54595d; font-size: 0.85em;
            padding: 4px 0 2px; pointer-events: none;
        }

        /* --- Progress log (optimised height) --- */
        .tng-log-box {
            height: 160px; overflow-y: auto; font-family: monospace;
            font-size: 0.85em; padding: 10px; border: 1px solid #a2a9b1;
            border-radius: 4px; background: #f8f9fa; color: #202122;
        }
        .tng-log-err { color: #b00020; font-weight: bold; }
        .tng-log-succ { color: #14866d; }

        /* --- Animations --- */
        @media (prefers-reduced-motion: no-preference) {
            @keyframes tng-fadein  { from { opacity: 0 } to { opacity: 1 } }
            @keyframes tng-slidein { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
        }

        /* --- Dark mode --- */
        @media (prefers-color-scheme: dark) {
            .tng-dialog { background: #1e1e1e; color: #eaecf0; border-color: #54595d; }
            .tng-dialog-header, .tng-dialog-footer { background: #2a2a2a; border-color: #3a3a3a; }
            .tng-dialog-close { color: #a2a9b1; }
            .tng-dialog-close:hover { color: #eaecf0; }
            .tng-section { border-color: #3a3a3a; }
            .tng-section-header { background: #252525; border-color: #3a3a3a; }
            .tng-section-header:hover { background: #2e2e2e; }
            .tng-row label.tng-label, .tng-help, .tng-optgroup-label { color: #a2a9b1; }
            .tng-input, .tng-select { background: #2a2a2a; color: #eaecf0; border-color: #54595d; }
            .tng-input:focus, .tng-select:focus { border-color: #6699ff; }
            .tng-btn-quiet { color: #eaecf0; border-color: #54595d; }
            .tng-btn-quiet:hover { background: #2a2a35; }

            /* Dark mode for progress log */
            .tng-log-box { background: #2a2a2a; border-color: #54595d; color: #eaecf0; }
            .tng-log-err { color: #ff6b6b; }
            .tng-log-succ { color: #00af89; }
        }
    `);

    // ============================================================================
    // [Section 02] Overlay stack
    // Tracks active overlays and binds global Escape key event listeners to dismiss dialogues.
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
      return overlay;
    }

    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key === "Escape" || e.keyCode === 27) {
          const top = overlayStack[overlayStack.length - 1];
          if (top) {
            e.preventDefault();
            e.stopPropagation();
            top.closeHandler();
          }
        }
      },
      true,
    );

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
      const sectionBody = document.createElement("div");
      sectionBody.className =
        "tng-section-body" + (enabledByDefault ? "" : " tng-hidden");
      section.appendChild(hdr);
      section.appendChild(sectionBody);
      enableChk.addEventListener("change", function () {
        section.classList.toggle("tng-disabled", !enableChk.checked);
        sectionBody.classList.toggle("tng-hidden", !enableChk.checked);
      });
      return { section, sectionBody, enableChk };
    }
    function showNotification(parent, message) {
      parent.classList.add("tng-input-container");

      let note = parent.querySelector(".tng-notification");
      if (!note) {
        note = document.createElement("div");
        note.className = "tng-notification";
        parent.appendChild(note);
      }
      note.innerHTML = "⚠️ " + message;
      note.style.display = "block";
      return note;
    }

    // ============================================================================
    // [Section 05] Dropdown list reasons
    // Houses pre-populated reason sets for rollbacks, page deletions, and block actions.
    // ============================================================================
    const ROLLBACK_REASONS = [
      { value: "", label: "Other:" },
      { value: "Vandalism", label: "Vandalism" },
      {
        value: "Incorrect or unsourced information",
        label: "Incorrect or unsourced information",
      },
      {
        value: "Violations of biographies of living persons policy",
        label: "Violations of biographies of living persons policy",
      },
      { value: "Copyright violations", label: "Copyright violations" },
      {
        value: "Promotional editing or conflict of interest",
        label: "Promotional editing or conflict of interest",
      },
      {
        value: "Technical disruption or formatting damage",
        label: "Technical disruption or formatting damage",
      },
      {
        value: "Addition of irrelevant content",
        label: "Addition of irrelevant content",
      },
      {
        value: "Changes against established consensus",
        label: "Changes against established consensus",
      },
      { value: "Edit warring prevention", label: "Edit warring prevention" },
      {
        value: "Block evasion or sockpuppetry",
        label: "Block evasion or sockpuppetry",
      },
    ];

    const BLOCK_REASONS = [
      { value: "", label: "Other:" },
      {
        group: "Common block reasons",
        items: [
          { value: "Vandalism", label: "Vandalism" },
          { value: "Copyright infringement", label: "Copyright infringement" },
          { value: "Creating attack pages", label: "Creating attack pages" },
          {
            value: "Violations of the biographies of living persons policy",
            label: "Violations of the biographies of living persons policy",
          },
          {
            value: "Persistent addition of unsourced content",
            label: "Persistent addition of unsourced content",
          },
          {
            value: "Creating patent nonsense or other inappropriate pages",
            label: "Creating patent nonsense or other inappropriate pages",
          },
          {
            value: "Using Wikipedia for promotion or advertising purposes",
            label: "Using Wikipedia for promotion or advertising purposes",
          },
          { value: "Edit warring", label: "Edit warring" },
          {
            value: "Violation of the three-revert rule",
            label: "Violation of the three-revert rule",
          },
          { value: "Disruptive editing", label: "Disruptive editing" },
          {
            value: "Personal attacks or violations of the harassment policy",
            label: "Personal attacks or violations of the harassment policy",
          },
          {
            value: "Arbitration enforcement",
            label: "Arbitration enforcement",
          },
          {
            value: "Contentious topic restriction",
            label: "Contentious topic restriction",
          },
          { value: "Block evasion", label: "Block evasion" },
          {
            value: "Abusing multiple accounts",
            label: "Abusing multiple accounts",
          },
          {
            value: "Repeatedly triggering the edit filter",
            label: "Repeatedly triggering the edit filter",
          },
          { value: "Sockpuppetry", label: "Sockpuppetry" },
          {
            value:
              "Revoking talk page access: Inappropriate use of user talk page whilst blocked",
            label:
              "Revoking talk page access: Inappropriate use of user talk page whilst blocked",
          },
        ],
      },
    ];
    const PAGE_DELETE_REASONS = [
      {
        group: "General",
        items: [
          {
            value: "Patent nonsense, meaningless, or incomprehensible",
            label: "Patent nonsense, meaningless, or incomprehensible",
          },
          { value: "Test page", label: "Test page" },
          { value: "Vandalism", label: "Vandalism" },
          { value: "Blatant hoax", label: "Blatant hoax" },
          {
            value: "Recreation of a page deleted per a deletion discussion",
            label: "Recreation of a page deleted per a deletion discussion",
          },
          {
            value:
              "Creation by a banned or blocked user in violation of ban or block",
            label:
              "Creation by a banned or blocked user in violation of ban or block",
          },
          {
            value: "Enforcement of general sanctions",
            label: "Enforcement of general sanctions",
          },
          {
            value: "Technical deletion (uncontroversial maintenance)",
            label: "Technical deletion (uncontroversial maintenance)",
          },
          {
            value: "Deletion to make way for a page move",
            label: "Deletion to make way for a page move",
          },
          {
            value:
              "Unambiguously created in error or in the incorrect namespace",
            label:
              "Unambiguously created in error or in the incorrect namespace",
          },
          {
            value: "One author who has requested deletion or blanked the page",
            label: "One author who has requested deletion or blanked the page",
          },
          {
            value: "Page dependent on a deleted or nonexistent page",
            label: "Page dependent on a deleted or nonexistent page",
          },
          {
            value: "Attack page or negative unsourced BLP",
            label: "Attack page or negative unsourced BLP",
          },
          {
            value: "Unambiguous advertising or promotion",
            label: "Unambiguous advertising or promotion",
          },
          {
            value: "Unambiguous copyright infringement",
            label: "Unambiguous copyright infringement",
          },
          {
            value: "Abandoned draft or Articles for creation submission",
            label: "Abandoned draft or Articles for creation submission",
          },
          {
            value: "Unnecessary disambiguation page",
            label: "Unnecessary disambiguation page",
          },
          {
            value:
              "LLM-generated content that has not been adequately reviewed",
            label:
              "LLM-generated content that has not been adequately reviewed",
          },
        ],
      },
      {
        group: "Redirect pages",
        items: [
          {
            value: "Cross-namespace redirect from mainspace",
            label: "Cross-namespace redirect from mainspace",
          },
          {
            value: "Recently created, implausible redirect",
            label: "Recently created, implausible redirect",
          },
          {
            value:
              "Redirect in the File namespace with the same name as a file or redirect at Wikimedia Commons",
            label:
              "Redirect in the File namespace with the same name as a file or redirect at Wikimedia Commons",
          },
          {
            value:
              "Redirect created by moving away from a title that was obviously unintended",
            label:
              "Redirect created by moving away from a title that was obviously unintended",
          },
          {
            value: "Redirect to a deleted or nonexistent page",
            label: "Redirect to a deleted or nonexistent page",
          },
        ],
      },
      {
        group: "Other criteria",
        items: [
          {
            value: "Listed at copyright problems for over seven days",
            label: "Listed at copyright problems for over seven days",
          },
          {
            value:
              "Page created by contributor with extensive history of copyright violations",
            label:
              "Page created by contributor with extensive history of copyright violations",
          },
          {
            value: "Nominated for seven days with no objection (PROD)",
            label: "Nominated for seven days with no objection (PROD)",
          },
          {
            value:
              "Nominated for seven days with no reliable sources present in the article (BLPPROD)",
            label:
              "Nominated for seven days with no reliable sources present in the article (BLPPROD)",
          },
        ],
      },
    ];

    const PROTECTION_REASONS = [
      { value: "", label: "Other:" },
      {
        group: "Edit protection",
        items: [
          { value: "Persistent vandalism", label: "Persistent vandalism" },
          { value: "Persistent spamming", label: "Persistent spamming" },
          {
            value: "Persistent sockpuppetry",
            label: "Persistent sockpuppetry",
          },
          {
            value: "Persistent disruptive editing",
            label: "Persistent disruptive editing",
          },
          {
            value: "Persistent block evasion",
            label: "Persistent block evasion",
          },
          {
            value: "Violations of the biographies of living persons policy",
            label: "Violations of the biographies of living persons policy",
          },
          {
            value: "Addition of unsourced or poorly sourced content",
            label: "Addition of unsourced or poorly sourced content",
          },
          {
            value: "Edit warring / content dispute",
            label: "Edit warring / content dispute",
          },
          {
            value: "Arbitration enforcement",
            label: "Arbitration enforcement",
          },
          {
            value: "Contentious topic restriction",
            label: "Contentious topic restriction",
          },
          {
            value: "Community sanctions enforcement",
            label: "Community sanctions enforcement",
          },
          {
            value: "User request within own user space",
            label: "User request within own user space",
          },
          {
            value: "High-risk template or module",
            label: "High-risk template or module",
          },
          {
            value: "User page of deceased editor",
            label: "User page of deceased editor",
          },
        ],
      },
      {
        group: "Move protection",
        items: [
          { value: "Page-move vandalism", label: "Page-move vandalism" },
          { value: "Move warring", label: "Move warring" },
          { value: "Highly visible page", label: "Highly visible page" },
        ],
      },
      {
        group: "Images",
        items: [
          {
            value: "Image about to be featured on the Main Page",
            label: "Image about to be featured on the Main Page",
          },
        ],
      },
      {
        group: "Unprotection",
        items: [
          {
            value: "Testing whether long-term protection is still needed",
            label: "Testing whether long-term protection is still needed",
          },
          { value: "No longer necessary", label: "No longer necessary" },
        ],
      },
    ];

    // ============================================================================
    // [Section 06] Main work function
    // Executes API orchestration loops for user blocks, rollbacks, and deletions whilst piping execution log messages.
    // ============================================================================
    const work = async function () {
      let isAborted = false;
      const api = new mw.Api();
      const stats = {
        block: 0,
        rollback: 0,
        revdel: 0,
        delete: 0,
        protect: 0,
        error: 0,
      };
      const toolTag = " (via ⚙️ [[w:id:Pengguna:Rachmat04/Tengu.js|Tengu]])";

      // Promisified API wrappers converting jQuery promises into standard ES6 promises
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

      // Build Progress UI
      const { overlay, body, footer } = createDialog({
        title: "Processing Tengu tasks",
        icon: "⚙️",
        onClose: () => {
          window.location.reload();
        },
      });

      const statusLbl = document.createElement("div");
      statusLbl.innerHTML = "<b>Status:</b> Starting actions...";
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

      // Helper function to append log entries
      const addLog = (msg, isErr) => {
        const d = document.createElement("div");
        d.textContent = msg;
        if (isErr) {
          d.className = "tng-log-err";
          stats.error++;
        } else {
          d.className = "tng-log-succ";
        }
        logBox.appendChild(d);
        logBox.scrollTop = logBox.scrollHeight;
      };

      // Add clear visibility notice that the automated process is currently ongoing
      addLog("⏳ Processing operations... please wait.");

      // --- Block ---
      if (config.block && !isAborted) {
        const data = {
          action: "block",
          user: config.username,
          expiry: config.blockDur,
          reason: config.blockReason + toolTag,
        };
        if (config.blockAnon) data.anononly = 1;
        if (config.blockAuto) data.autoblock = 1;
        if (config.blockCreate) data.nocreate = 1;
        if (!config.blockTalk) data.allowusertalk = 1;
        if (config.blockMail) data.noemail = 1;
        if (config.blockHide) data.hidename = 1;

        try {
          await apiPost(data);
          addLog(`[Block] Successfully blocked user ${config.username}.`);
          stats.block++;

          // Post notification to user talk page
          const talkTitle = new mw.Title(config.username, 3).getPrefixedText();
          const notice = `== Account block notice ==\nThe account "${config.username}" has been blocked for ${config.blockDur} due to the following reason: ${config.blockReason}.\n\nDuring the block period, the account may be unable to perform some or all actions that normally require editing privileges. The restrictions are scheduled to remain in effect until the block expires, unless the block settings are modified by an administrator.\n\nThis is an automated notification generated by an automated tool. Please write your message directly to my user talk page should you have any questions or concerns. ~~~~`;

          await apiPost({
            action: "edit",
            title: talkTitle,
            appendtext: "\n\n" + notice,
            summary: "Automated notification: Account block notice" + toolTag,
            bot: true,
          });
          addLog(`[Notify] Notification posted to: ${talkTitle}`);
        } catch (e) {
          addLog(`[Block] Failed to block: ${e}`, true);
        }
      }

      // --- Fetch user contributions with recursive pagination framework ---
      let untildate = new Date();
      if (config.endtime === "inf") {
        untildate = null;
      } else {
        untildate.setSeconds(untildate.getSeconds() - parseInt(config.endtime));
      }

      const contribParams = {
        action: "query",
        list: "usercontribs",
        ucuser: config.username,
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
          addLog(`[Error] Failed to fetch contribution history: ${e}`, true);
          hasMore = false;
        }
      }

      if (!contribs.length && !isAborted) {
        addLog("[Info] No contributions found within this timeframe.");
      } else if (!isAborted) {
        const pageEdits = {};
        const creation = [];
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
        const pagesToProtect = new Set();
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
              } catch (e) {
                addLog(`[Revdel] Failed at ${title}: ${e}`, true);
              }
            }
            await new Promise((resolve) => setTimeout(resolve, 100)); // Rate limit buffer
            continue;
          }

          // Execute rollback or undo operation sequentially based on settings
          if (config.rollbackMethod === "undo") {
            const undoData = {
              action: "edit",
              title: title,
              undo: info.latest,
              summary: config.rollbackReason
                ? config.rollbackReason + toolTag
                : "Reverting mass edits by " +
                  (config.rollbackShow
                    ? config.username
                    : "<username hidden>") +
                  toolTag,
            };
            if (info.oldestParent) undoData.undoafter = info.oldestParent;
            if (config.rollbackBot) undoData.bot = 1;

            try {
              await apiPost(undoData);
              addLog(`[Undo] Successfully reverted edits via undo: ${title}`);
              stats.rollback++;

              if (config.rd && !isAborted) {
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
                } catch (e) {
                  addLog(`[Revdel] Failed at ${title}: ${e}`, true);
                }
              }
            } catch (e) {
              addLog(`[Undo] Failed at ${title}: ${e}`, true);
            }
          } else {
            // Native rollback
            const rbData = config.rollbackBot ? { markbot: 1 } : {};
            rbData.summary = config.rollbackReason
              ? config.rollbackReason + toolTag
              : config.rollbackShow
                ? ""
                : "Revert edits by <username hidden>" + toolTag;

            try {
              await apiRollback(title, config.username, rbData);
              addLog(`[Rollback] Successfully reverted: ${title}`);
              stats.rollback++;

              if (config.rd && !isAborted) {
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
                } catch (e) {
                  addLog(`[Revdel] Failed at ${title}: ${e}`, true);
                }
              }
            } catch (e) {
              addLog(`[Rollback] Failed at ${title}: ${e}`, true);
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 100)); // Throttling window
        }

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
              };
              await apiPost(protectData);
              addLog(`[Protect] Protected page: ${title}`);
              stats.protect++;

              // Post notification to talk page
              const talkTitle = new mw.Title(title)
                .getTalkPage()
                .getPrefixedText();
              const notice = `== Page protection notice ==\nThe page "${title}" has been protected for ${config.protectExpiry} days due to the following reason: ${config.protectReason}.\n\nDuring the protection period, some or all editing actions may be restricted depending on the level of protection applied. The restrictions are scheduled to remain in effect until the protection period expires, unless the protection settings are modified by an administrator.\n\nThis is an automated notification generated by an automated tool. Please write your message directly to my user talk page should you have any questions or concerns. ~~~~`;

              await apiPost({
                action: "edit",
                title: talkTitle,
                appendtext: "\n\n" + notice,
                summary:
                  "Automated notification: Page protection notice" + toolTag,
                bot: true,
              });
              addLog(`[Notify] Notification posted to: ${talkTitle}`);
            } catch (e) {
              addLog(`[Protect] Failed to protect ${title}: ${e}`, true);
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        // Mass-delete pages sequentially
        if (config.massdel) {
          for (const title of creation) {
            if (isAborted) break;
            try {
              await apiPost({
                action: "delete",
                title: title,
                reason: config.massdelReason + toolTag,
              });
              addLog(`[Delete] Deleted page: ${title}`);
              stats.delete++;
            } catch (e) {
              addLog(`[Delete] Failed to delete ${title}: ${e}`, true);
            }
            await new Promise((resolve) => setTimeout(resolve, 100)); // Throttling window
          }
        }
      }

      // Termination and interface cleanup operations
      btnAbort.style.display = "none";
      const methodTxt =
        config.rollbackMethod === "undo" ? "undone" : "reverted";
      const statusPrefix = isAborted
        ? "<b>Status: Aborted!</b><br/>"
        : "<b>Status: Completed!</b><br/>";
      const finalStatus = `${statusPrefix}Summary: <b>${stats.rollback}</b> ${methodTxt} | <b>${stats.delete}</b> deleted | <b>${stats.protect}</b> protected | <b>${stats.revdel}</b> hidden | <b>${stats.error}</b> errors.`;
      statusLbl.innerHTML = finalStatus;

      if (isAborted) {
        addLog("⛔ Operations aborted by user.");
      } else {
        addLog("✅ All operations have been completed successfully.");
      }
      btnClose.disabled = false;
    };

    // ============================================================================
    // [Section 07] Dialogue builder (input config)
    // Generates configuration layout panel structures, parses package parameters, and configures field states.
    // ============================================================================
    const init = function () {
      if (inited) return;
      inited = true;

      const defaultPackage = {
        tracingedits: { duration: 3600, indefregistered: true },
        rollback: { enabled: false, bot: false, showname: true, reason: "" },
        block: {
          enabled: false,
          duration: "1 day",
          indefregistered: true,
          reason: "Vandalism",
          autoblock: true,
          hardblock: false,
          create: true,
          talk: false,
          mail: false,
          hidename: false,
        },
        pagedelete: { enabled: false, reason: "Vandalism" },
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
          reason: "Grossly insulting, degrading, or offensive material",
          oversight: false,
        },
      };

      if (typeof p4js_all_in_one === "undefined") window.p4js_all_in_one = {};
      const aioConf = window.p4js_all_in_one;
      const suffixes = aioConf.suffixes || [
        "",
        " (global sysops action)",
        " (stewards action)",
      ];
      const reasons = aioConf.reasons || {
        revisiondelete: [
          "Criteria for redaction",
          "Violations of copyright policy",
          "Grossly insulting, degrading, or offensive material",
          "Serious BLP violations",
          "Purely disruptive material",
          "Other valid deletion under deletion policy",
          "Non-contentious housekeeping, revdel corrections, notes, conversion",
          "Deletion mandated by a decision of the Arbitration Committee",
          "Orphaned non-free file(s) deleted",
        ],
      };

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
            reason: "Repeated vandalism",
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
            reason: "Reverting mass bot attack or automated spam",
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
            reason: "Privacy violation or personal information",
          },
          block: {
            enabled: true,
            duration: "never",
            indefregistered: true,
            reason: "Personal attacks or violations of the harassment policy",
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
            reason: "Cleaning up promotional spam",
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
            reason: "Unambiguous advertising or promotion",
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
            reason: "Reverting edit warring or content consensus violation",
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
            reason: "Removing text matching copyrighted sources",
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
            reason: "Unambiguous copyright infringement",
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
            reason: "Reverting edits by a blocked or banned user",
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
        title: "Tengu",
        icon: "⛩️",
      });

      const topSection = document.createElement("div");
      topSection.style.cssText = "display:flex;flex-direction:column;gap:10px;";
      const { row: rowTarget, field: fieldTarget } = makeRow("Target");
      const inputUsername = makeInput("Username or IP (not a range)");
      fieldTarget.appendChild(inputUsername);

      inputUsername.addEventListener("input", function () {
        const existingNote = fieldTarget.querySelector(".tng-notification");
        if (existingNote) {
          existingNote.style.display = "none";
        }
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
      selEndtime.style.flex = "1";
      inputEndtime.style.flex = "1";
      editGroup.appendChild(selEndtime);
      editGroup.appendChild(inputEndtime);
      fieldEdits.appendChild(editGroup);
      topSection.appendChild(rowEdits);
      const { row: rowPkg, field: fieldPkg } = makeRow("Package");
      const selPackage = makeSelect(
        Object.keys(packages).map(function (k) {
          return { value: k, label: k };
        }),
      );
      fieldPkg.appendChild(selPackage);
      topSection.appendChild(rowPkg);
      const { row: rowSuffix, field: fieldSuffix } = makeRow("Suffix");
      const selSuffix = makeSelect(
        suffixes.map(function (s) {
          return { value: s, label: s || "<No suffix>" };
        }),
      );
      fieldSuffix.appendChild(selSuffix);
      topSection.appendChild(rowSuffix);
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
        "Use undo feature (alternative without rollback rights)",
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
      const inputRbReason = makeInput("Additional details / customised reason");

      const reasonWrapRollback = document.createElement("div");
      reasonWrapRollback.className = "tng-reason-wrap";
      reasonWrapRollback.appendChild(selRbReason);
      reasonWrapRollback.appendChild(inputRbReason);

      const helpRbReason = document.createElement("div");
      helpRbReason.className = "tng-help";
      helpRbReason.textContent =
        'If set, this overrides the default rollback summary. Uncheck "Show username" to hide the username regardless.';
      reasonWrapRollback.appendChild(helpRbReason);

      fieldRbReason.appendChild(reasonWrapRollback);
      bodyRollback.appendChild(rowRbReason);
      body.appendChild(secRollback);

      const {
        section: secBlock,
        sectionBody: bodyBlock,
        enableChk: chkBlock,
      } = makeSection("Block", "🚫", false);

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
      selBlockDur.style.flex = "1";
      inputBlockDur.style.flex = "1";
      durGroup.appendChild(selBlockDur);
      durGroup.appendChild(inputBlockDur);
      fieldBlockDur.appendChild(durGroup);
      bodyBlock.appendChild(rowBlockDur);
      const { row: rowBlockReason, field: fieldBlockReason } =
        makeRow("Reason");
      const selBlockReason = makeSelect(BLOCK_REASONS);
      const inputBlockReason = makeInput("Additional reason");
      const reasonWrapBlock = document.createElement("div");
      reasonWrapBlock.className = "tng-reason-wrap";
      reasonWrapBlock.appendChild(selBlockReason);
      reasonWrapBlock.appendChild(inputBlockReason);
      fieldBlockReason.appendChild(reasonWrapBlock);
      bodyBlock.appendChild(rowBlockReason);
      const { wrap: wrapHardblock, chk: chkHardblock } = makeCheckbox(
        "Hard block (IP only)",
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
      wrapHardblock.title = "Apply block to logged-in users from this IP";
      wrapAutoblock.title =
        "Auto-block the IP used by this account for 24 hours";
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
      bodyBlock.appendChild(checksBlock);
      body.appendChild(secBlock);

      const {
        section: secPagedel,
        sectionBody: bodyPagedel,
        enableChk: chkPagedel,
      } = makeSection("Page deletion", "🗑️", false);
      const { row: rowPagedelReason, field: fieldPagedelReason } =
        makeRow("Reason");
      const selPagedelReason = makeSelect(PAGE_DELETE_REASONS);
      const inputPagedelReason = makeInput("Full reason to submit");
      const btnPagedelAppend = makeBtn("Append", "quiet");
      btnPagedelAppend.className += " tng-btn-sm";
      btnPagedelAppend.addEventListener("click", function () {
        const cur = inputPagedelReason.value;
        const add = selPagedelReason.value;
        if (!add) return;
        inputPagedelReason.value = cur ? cur + "; " + add : add;
        selPagedelReason.selectedIndex = 0;
      });
      const reasonWrapPagedel = document.createElement("div");
      reasonWrapPagedel.className = "tng-reason-wrap";
      const reasonTopPagedel = document.createElement("div");
      reasonTopPagedel.className = "tng-reason-top";
      reasonTopPagedel.appendChild(selPagedelReason);
      reasonTopPagedel.appendChild(btnPagedelAppend);
      reasonWrapPagedel.appendChild(reasonTopPagedel);
      reasonWrapPagedel.appendChild(inputPagedelReason);
      fieldPagedelReason.appendChild(reasonWrapPagedel);
      bodyPagedel.appendChild(rowPagedelReason);
      body.appendChild(secPagedel);

      // Page protection module injection setup
      const {
        section: secProtect,
        sectionBody: bodyProtect,
        enableChk: chkProtect,
      } = makeSection("Page protection", "🛡️", false);

      const { row: rowProtectEdit, field: fieldProtectEdit } =
        makeRow("Edit restriction");
      const selProtectEdit = makeSelect([
        { value: "all", label: "All users (unrestricted)" },
        { value: "autoconfirmed", label: "Autoconfirmed users" },
        { value: "sysop", label: "Administrators only" },
      ]);
      fieldProtectEdit.appendChild(selProtectEdit);
      bodyProtect.appendChild(rowProtectEdit);

      const { row: rowProtectMove, field: fieldProtectMove } =
        makeRow("Move restriction");
      const selProtectMove = makeSelect([
        { value: "all", label: "All users (unrestricted)" },
        { value: "autoconfirmed", label: "Autoconfirmed users" },
        { value: "sysop", label: "Administrators only" },
      ]);
      fieldProtectMove.appendChild(selProtectMove);
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
      selProtectExpiry.style.flex = "1";
      inputProtectExpiry.style.flex = "1";
      protectExpiryGroup.appendChild(selProtectExpiry);
      protectExpiryGroup.appendChild(inputProtectExpiry);
      fieldProtectExpiry.appendChild(protectExpiryGroup);
      bodyProtect.appendChild(rowProtectExpiry);

      const { row: rowProtectReason, field: fieldProtectReason } =
        makeRow("Reason");
      const selProtectReason = makeSelect(PROTECTION_REASONS);
      const inputProtectReason = makeInput("Full reason to submit");
      const btnProtectAppend = makeBtn("Append", "quiet");
      btnProtectAppend.className += " tng-btn-sm";
      btnProtectAppend.addEventListener("click", function () {
        const cur = inputProtectReason.value;
        const add = selProtectReason.value;
        if (!add) return;
        inputProtectReason.value = cur ? cur + "; " + add : add;
        selProtectReason.selectedIndex = 0;
      });
      const reasonWrapProtect = document.createElement("div");
      reasonWrapProtect.className = "tng-reason-wrap";
      const reasonTopProtect = document.createElement("div");
      reasonTopProtect.className = "tng-reason-top";
      reasonTopProtect.appendChild(selProtectReason);
      reasonTopProtect.appendChild(btnProtectAppend);
      reasonWrapProtect.appendChild(reasonTopProtect);
      reasonWrapProtect.appendChild(inputProtectReason);
      fieldProtectReason.appendChild(reasonWrapProtect);
      bodyProtect.appendChild(rowProtectReason);
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
        [{ value: "", label: "Other:" }].concat(
          (reasons.revisiondelete || []).map(function (r) {
            return { value: r, label: r };
          }),
        ),
      );
      const inputRevdelReason = makeInput("Full reason to submit");
      const btnRevdelAppend = makeBtn("Append", "quiet");
      btnRevdelAppend.className += " tng-btn-sm";
      btnRevdelAppend.addEventListener("click", function () {
        const cur = inputRevdelReason.value;
        const add = selRevdelReason.value;
        if (!add) return;
        inputRevdelReason.value = cur ? cur + "; " + add : add;
        selRevdelReason.selectedIndex = 0;
      });
      const reasonWrapRevdel = document.createElement("div");
      reasonWrapRevdel.className = "tng-reason-wrap";
      const reasonTopRevdel = document.createElement("div");
      reasonTopRevdel.className = "tng-reason-top";
      reasonTopRevdel.appendChild(selRevdelReason);
      reasonTopRevdel.appendChild(btnRevdelAppend);
      reasonWrapRevdel.appendChild(reasonTopRevdel);
      reasonWrapRevdel.appendChild(inputRevdelReason);
      fieldRevdelReason.appendChild(reasonWrapRevdel);
      bodyRevdel.appendChild(rowRevdelReason);
      body.appendChild(secRevdel);

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
          chkRevdel.checked
        );
      }

      // Bind monitoring handlers to state changes of operational modules
      chkRollback.addEventListener("change", updateStartBtn);
      chkBlock.addEventListener("change", updateStartBtn);
      chkPagedel.addEventListener("change", updateStartBtn);
      chkProtect.addEventListener("change", updateStartBtn);
      chkRevdel.addEventListener("change", updateStartBtn);

      // Inside the btnStart event listener
      btnStart.addEventListener("click", function () {
        const username = inputUsername.value.trim();
        const existing = fieldTarget.querySelector(".tng-notification");
        if (existing) existing.style.display = "none";

        if (!username) {
          showNotification(fieldTarget, "Please enter a target username.");
          inputUsername.focus();
          return;
        }
        const suffix = selSuffix.value;
        const isIP = mw.util.isIPAddress(username);
        let endtime = selEndtime.value;
        if (endtime === "other") endtime = inputEndtime.value.trim() || "3600";

        function buildRollbackReason() {
          const sel = selRbReason.value;
          const inp = inputRbReason.value.trim();
          if (sel && inp) return sel + ": " + inp;
          return sel || inp;
        }
        function buildBlockReason() {
          const sel = selBlockReason.value;
          const inp = inputBlockReason.value.trim();
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
        let rdHides = "";
        if (chkRdContent.checked) rdHides += "content|";
        if (chkRdSummary.checked) rdHides += "comment|";
        if (chkRdUsername.checked) rdHides += "user|";

        config = {
          username: username,
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
          blockAnon: isIP && !chkHardblock.checked,
          blockAuto: !isIP && chkAutoblock.checked,
          blockCreate: chkCreate.checked,
          blockTalk: chkTalk.checked,
          blockMail: chkMail.checked,
          blockHide: chkHidename.checked,
          massdel: chkPagedel.checked,
          massdelReason: buildPagedelReason() + suffix,
          protect: chkProtect.checked,
          protectEdit: selProtectEdit.value,
          protectMove: selProtectMove.value,
          protectExpiry:
            selProtectExpiry.value === "other"
              ? inputProtectExpiry.value.trim()
              : selProtectExpiry.value,
          protectReason: buildProtectReason() + suffix,
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

      function applyPackage(pkgName) {
        const pkg = packages[pkgName] || defaultPackage;
        const isIP = mw.util.isIPAddress(inputUsername.value.trim());

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
        chkRollback.checked = rb.enabled !== false;
        secRollback.classList.toggle("tng-disabled", !chkRollback.checked);
        bodyRollback.classList.toggle("tng-hidden", !chkRollback.checked);
        chkBot.checked = !!rb.bot;
        chkShow.checked = rb.showname !== false;
        chkUndo.checked = false; // Reset to default rollback method when switching packages

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
        chkBlock.checked = !!bl.enabled;
        secBlock.classList.toggle("tng-disabled", !chkBlock.checked);
        bodyBlock.classList.toggle("tng-hidden", !chkBlock.checked);
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
        chkPagedel.checked = !!pd.enabled;
        secPagedel.classList.toggle("tng-disabled", !chkPagedel.checked);
        bodyPagedel.classList.toggle("tng-hidden", !chkPagedel.checked);
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

        // Apply fallback resets to page protection state variables
        const pt = pkg.pageprotection || {};
        chkProtect.checked = !!pt.enabled;
        secProtect.classList.toggle("tng-disabled", !chkProtect.checked);
        bodyProtect.classList.toggle("tng-hidden", !chkProtect.checked);
        selProtectEdit.value = pt.edit || "all";
        selProtectMove.value = pt.move || "all";
        selProtectExpiry.value = pt.expiry || "1 day";
        inputProtectExpiry.value = "";
        inputProtectExpiry.classList.add("tng-hidden");
        inputProtectReason.value = pt.reason || "";
        selProtectReason.selectedIndex = 0;

        const rd = pkg.revisiondelete || {};
        chkRevdel.checked = !!rd.enabled;
        secRevdel.classList.toggle("tng-disabled", !chkRevdel.checked);
        bodyRevdel.classList.toggle("tng-hidden", !chkRevdel.checked);
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

      inputUsername.addEventListener("change", function () {
        applyPackage(selPackage.value);
        const isIP = mw.util.isIPAddress(inputUsername.value.trim());
        wrapHardblock.style.display = isIP ? "" : "none";
        wrapAutoblock.style.display = isIP ? "none" : "";
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
      inputUsername.value = mw.config.get("wgRelevantUserName") || "";
      inputUsername.dispatchEvent(new Event("change"));

      // Perform initial check on modal framework launch
      updateStartBtn();
      inputUsername.focus();
    };

    // ============================================================================
    // [Section 08] Portlet link
    // Registers the execution menu item anchor inside the site actions portal drop list.
    // ============================================================================
    $(mw.util.addPortletLink("p-cactions", "#", "⛩️ Tengu", "ca-tengu")).on(
      "click",
      function (e) {
        e.preventDefault();
        inited = false;
        init();
      },
    );
  });
});
// </nowiki>
