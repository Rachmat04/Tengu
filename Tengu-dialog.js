/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Dialogue module
 * ============================================================================
 * PURPOSE:
 * Provides the modal overlay stack, light/dark theme management, keyboard
 * close/fail-safe listeners, and dialogue frame builder used across Tengu.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]] before initialisation. Exposes
 * window.TenguDialog.create(), returning { getTheme, setTheme,
 * createOverlay, createDialog }.
 *
 * DEPENDENCIES:
 * MediaWiki core (mw.html.escape) and browser DOM / Web Storage APIs.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguDialog = {
    create: function () {
      let escListenerBound = false;
      const overlayStack = [];

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

      function getTheme() {
        return theme;
      }

      function createOverlay() {
        const overlay = document.createElement("div");
        overlay.className =
          "tng-overlay" + (theme === "dark" ? " tng-theme-dark" : "");
        document.body.appendChild(overlay);

        // Detaches the overlay from the DOM and removes it from the active
        // stack without triggering any dialogue onClose callback.
        overlay.detach = function () {
          overlay.remove();
          const idx = overlayStack.indexOf(overlay);
          if (idx > -1) overlayStack.splice(idx, 1);
        };

        overlay.closeHandler = overlay.detach;

        overlayStack.push(overlay);

        // Register the Escape key listener once, the first time an overlay is created.
        // Escape closes only the topmost overlay/dialogue, same as before.
        //
        // A separate fail-safe shortcut, Ctrl+Alt+Shift+Backspace, is also
        // registered here. Unlike Escape, it force-closes every open Tengu
        // overlay in one step, regardless of which dialogue (if any) is
        // currently focused, and does not rely on any section-specific
        // handler being responsive. This is intended only as an emergency
        // exit if Tengu becomes unresponsive; it is not part of normal
        // operation. The key combination was chosen because it is unlikely
        // to collide with MediaWiki or browser shortcuts.
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
                return;
              }
              // Fail-safe force-close: Ctrl+Alt+Shift+Backspace.
              if (
                e.ctrlKey &&
                e.altKey &&
                e.shiftKey &&
                (e.key === "Backspace" || e.keyCode === 8)
              ) {
                e.preventDefault();
                e.stopPropagation();
                // Force-close every open overlay, topmost first, without
                // relying on each overlay's own closeHandler chain being
                // in a working state — remove directly from the DOM and
                // clear the stack.
                while (overlayStack.length) {
                  const ov = overlayStack.pop();
                  try {
                    if (ov.closeHandler) ov.closeHandler();
                    else ov.remove();
                  } catch (err) {
                    // If closeHandler itself is broken, fall back to a
                    // direct DOM removal so the fail-safe still works.
                    ov.remove();
                  }
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
        // Intentionally no click-outside-to-close handler: clicking
        // anywhere outside the dialogue must not close or terminate
        // Tengu, so in-progress configuration or a running task is never
        // lost to an accidental outside click. Close via the ✕ button,
        // Escape, or (if unresponsive) the Ctrl+Alt+Shift+Backspace
        // fail-safe registered in createOverlay().
        return { overlay, dialog, body, footer };
      }

      return {
        getTheme: getTheme,
        setTheme: setTheme,
        createOverlay: createOverlay,
        createDialog: createDialog,
      };
    },
  };
})();
// </nowiki>
