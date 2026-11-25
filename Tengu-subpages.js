/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Subpage move verification module
 * ============================================================================
 * PURPOSE:
 * Logs per-subpage results returned by action=move when movesubpages is used
 * and verifies that redirects exist at the old subpage titles when redirect
 * suppression is not active.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguSubpages.create(deps), returning { logMoveSubpageResults }.
 *
 * DEPENDENCIES:
 * Shared helpers injected via deps: apiGet and formatApiError.
 * No direct dependencies on Tengu.js globals or DOM elements.
 *
 * ATTRIBUTION:
 * Based on User:WhitePhosphorus/all-in-one
 * (https://meta.wikimedia.org/wiki/User:WhitePhosphorus/all-in-one).
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  function create(deps) {
    const apiGet = deps.apiGet;
    const formatApiError = deps.formatApiError;

    // Logs the per-subpage results returned by action=move when
    // movesubpages is used. The API returns move.subpages (and
    // move["subpages-talk"] when talk pages are moved) as entries of
    // { from, to } on success or { from, error } on failure. Only
    // entries without an error are counted as moved. When redirects
    // are not suppressed, the old titles of moved subpages are then
    // checked, and a warning is logged for any title that has no
    // redirect. Never throws, so a logging problem cannot make a
    // successful move look failed.
    async function logMoveSubpageResults(moveResult, noRedirect, callbacks) {
      const addLog = callbacks.addLog;
      const onSubpageMoved = callbacks.onSubpageMoved;

      try {
        const mv = moveResult && moveResult.move;
        if (!mv) return;
        const groups = [
          { list: mv.subpages, label: "subpage" },
          { list: mv["subpages-talk"], label: "subpage talk page" },
        ];
        const movedFrom = [];
        for (const g of groups) {
          if (!Array.isArray(g.list)) continue;
          for (const sp of g.list) {
            if (sp && sp.error) {
              const info = sp.error.info || sp.error.code || String(sp.error);
              addLog(
                `[Move] Failed to move ${g.label} "${sp.from || "?"}": ${info}`,
                true,
              );
            } else if (sp && sp.from && sp.to) {
              addLog(`[Move] Moved ${g.label} "${sp.from}" to "${sp.to}"`);
              if (onSubpageMoved) onSubpageMoved();
              movedFrom.push(sp.from);
            }
          }
        }
        if (noRedirect || !movedFrom.length) return;

        // Check that a redirect now exists at each old title.
        for (let i = 0; i < movedFrom.length; i += 50) {
          const chunk = movedFrom.slice(i, i + 50);
          const data = await apiGet({
            action: "query",
            titles: chunk.join("|"),
            prop: "info",
            formatversion: 2,
          });
          const pages = (data.query && data.query.pages) || [];
          for (const p of pages) {
            if (p.missing) {
              addLog(
                `[Move] No redirect was left at "${p.title}" although redirect suppression was not selected`,
                "warn",
              );
            } else if (!p.redirect) {
              addLog(
                `[Move] "${p.title}" exists but is not a redirect`,
                "warn",
              );
            }
          }
        }
      } catch (e) {
        addLog(
          `[Move] Could not verify subpage moves: ${formatApiError(e)}`,
          "warn",
        );
      }
    }

    return {
      logMoveSubpageResults: logMoveSubpageResults,
    };
  }

  window.TenguSubpages = {
    create: create,
  };
})();
// </nowiki>
