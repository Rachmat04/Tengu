/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Destination-page checker module
 * ============================================================================
 * PURPOSE:
 * Provides the destination-page existence checker button (❓ / ❌ / ✔️) shown
 * beside the destination title field in the Move pages section. Clicking it
 * checks whether the destination title already exists. The result is kept
 * until the caller calls resetCheck(), which the Move pages section does
 * whenever the destination title changes.
 * The .tng-destcheck-btn, .tng-destcheck-exists and .tng-destcheck-notexists
 * styles stay in Tengu.css.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguDestCheck.create(deps), which returns an object containing
 * makeDestChecker(getDestTitle). The returned button has a resetCheck()
 * method.
 *
 * DEPENDENCIES:
 * Browser DOM APIs and the helpers passed in by Tengu.js: makeBtn(label,
 * variant), apiGet(params) and formatApiError(err).
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguDestCheck = {
    create: function (deps) {
      const makeBtn = deps.makeBtn;
      const apiGet = deps.apiGet;
      const formatApiError = deps.formatApiError;

      // Creates a destination-page existence checker button (❓ / ❌ / ✔️),
      // shared by the Move page and Move to user's sandbox sub-modes.
      // Clicking it checks whether the page returned by getDestTitle()
      // currently exists. The result (❌ exists / ✔️ does not exist) is
      // kept until resetCheck() is called, which returns the button to ❓,
      // since the previous check no longer applies to a different
      // destination title.
      function makeDestChecker(getDestTitle) {
        const btn = makeBtn("❓", "quiet");
        btn.type = "button";
        btn.className += " tng-btn-sm tng-destcheck-btn";
        btn.title = "Check whether the destination page already exists";

        function reset() {
          btn.textContent = "❓";
          btn.classList.remove(
            "tng-destcheck-exists",
            "tng-destcheck-notexists",
          );
          btn.title = "Check whether the destination page already exists";
        }

        btn.addEventListener("click", async function () {
          const title = getDestTitle();
          if (!title) return;
          btn.disabled = true;
          try {
            const data = await apiGet({
              action: "query",
              titles: title,
              formatversion: 2,
            });
            const page = data.query && data.query.pages && data.query.pages[0];
            const exists = !!(page && !page.missing);
            btn.classList.remove(
              "tng-destcheck-exists",
              "tng-destcheck-notexists",
            );
            if (exists) {
              btn.textContent = "❌";
              btn.classList.add("tng-destcheck-exists");
              btn.title = "Destination page already exists";
            } else {
              btn.textContent = "✔️";
              btn.classList.add("tng-destcheck-notexists");
              btn.title = "Destination page does not exist";
            }
          } catch (e) {
            // Do not report existence either way when the check itself failed.
            reset();
            btn.title =
              "Could not check destination page: " + formatApiError(e);
          } finally {
            btn.disabled = false;
          }
        });

        btn.resetCheck = reset;
        return btn;
      }

      return { makeDestChecker: makeDestChecker };
    },
  };
})();
// </nowiki>
