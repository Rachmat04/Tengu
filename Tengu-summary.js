/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Completion summary module
 * ============================================================================
 * PURPOSE:
 * Builds the short, natural-language summary shown at the end of a run, for
 * example "Completed: 3 pages deleted and 1 account blocked." Only actions
 * with a count above zero are listed.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguSummary.create(), which returns an object containing
 * buildCompletionSummary(statsObj, aborted, revertMethodTxt).
 *
 * DEPENDENCIES:
 * None.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguSummary = {
    create: function () {
      // Builds a concise, natural-language summary of completed actions,
      // including only the operations that actually occurred (non-zero
      // counts). Used once at the end of a run.
      //
      // statsObj is the per-run counter object kept by work(). aborted is
      // true when the run was stopped early. revertMethodTxt is "undone" or
      // "reverted", depending on the rollback method used.
      function buildCompletionSummary(statsObj, aborted, revertMethodTxt) {
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
        add(statsObj.recat, "page recategorised", "pages recategorised");
        add(statsObj.uncategorize, "page uncategorised", "pages uncategorised");
        add(statsObj.protect, "page protected", "pages protected");
        add(statsObj.revdel, "revision hidden", "revisions hidden");
        add(statsObj.report, "report filed", "reports filed");
        add(statsObj.merge, "item merged", "items merged");
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
      }

      return { buildCompletionSummary: buildCompletionSummary };
    },
  };
})();
// </nowiki>
