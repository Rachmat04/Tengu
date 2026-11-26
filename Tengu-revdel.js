/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Revision deletion module
 * ============================================================================
 * PURPOSE:
 * Executes revision deletion (action=revisiondelete) for a target page and
 * logs the count of hidden revisions as well as any per-revision API
 * rejections.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguRevdel.create(deps), returning { hideRevisions }.
 *
 * DEPENDENCIES:
 * Helpers passed in by Tengu.js: apiPost, withToolTag, and formatApiError.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  function create(deps) {
    const apiPost = deps.apiPost;
    const withToolTag = deps.withToolTag;
    const formatApiError = deps.formatApiError;

    // Hides the given revisions on one page and logs the real result.
    // Returns true when at least one revision was hidden. Per-item
    // results are read from revisiondelete.items[].status; the "error"
    // status value is [Unverified] against a live wiki.
    async function hideRevisions(title, idlist, config, callbacks) {
      const addLog = callbacks.addLog;
      const onRevdel = callbacks.onRevdel;
      const toolTag = callbacks.toolTag;

      if (!idlist || !idlist.length) {
        addLog(
          `[Revdel] Skipped "${title}": no revision IDs were recorded for this page`,
          "warn",
        );
        return false;
      }
      try {
        const result = await apiPost({
          action: "revisiondelete",
          type: "revision",
          ids: idlist.join("|"),
          hide: config.rdHides,
          reason: withToolTag(config.rdReason, toolTag),
          suppress: config.os ? "yes" : "nochange",
        });
        const rdResult = result && result.revisiondelete;
        const items = (rdResult && rdResult.items) || [];
        const failed = items.filter(function (i) {
          return i.status === "error";
        });
        failed.forEach(function (i) {
          const reasons = (i.errors || [])
            .map(function (er) {
              return er.code || er.message || String(er);
            })
            .join(", ");
          addLog(
            `[Revdel] Revision ${i.id} at "${title}" was rejected${reasons ? ": " + reasons : ""}`,
            true,
          );
        });
        if (items.length && failed.length === items.length) return false;
        const hiddenCount = items.length
          ? items.length - failed.length
          : idlist.length;
        addLog(
          `[Revdel] Hid ${hiddenCount} of ${idlist.length} revision(s) at: "${title}" (revision IDs: ${idlist.join(", ")}; hidden: ${String(config.rdHides).replace(/\|$/, "").replace(/\|/g, ", ")}${config.os ? "; suppressed" : ""})`,
        );
        onRevdel();
        return true;
      } catch (e) {
        addLog(`[Revdel] Failed at "${title}": ${formatApiError(e)}`, true);
        return false;
      }
    }

    return {
      hideRevisions: hideRevisions,
    };
  }

  window.TenguRevdel = {
    create: create,
  };
})();
// </nowiki>
