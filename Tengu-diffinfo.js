/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Diff information module
 * ============================================================================
 * PURPOSE:
 * Provides the "more information" line added below each side's title box on
 * diff pages: revision ID, size (with the size change and elapsed time on the
 * newer side), and ORES score where available.
 * Consumed by Tengu.js; exposes window.TenguDiffInfo.create(deps).
 *
 * Adapted from User:BrandonXLF/MoreDiffInfo.js (see README credits). The ORES
 * status icons and the help-page link of the original are not included, and
 * separators use Tengu's middle-dot convention.
 *
 * The module depends only on the MediaWiki globals (mw) and the apiGet helper
 * passed in by Tengu.js. The .tng-diffinfo-line style stays in Tengu.css.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
window.TenguDiffInfo = {
  /**
   * Returns the function that adds the information lines.
   *
   * @param {Object} deps  Helpers supplied by Tengu.js: apiGet(params).
   * @returns {Function}   Async function (oldRevIdRaw, newRevIdRaw).
   */
  create: function (deps) {
    const apiGet = deps.apiGet;

    return async function fetchAndShowDiffInfo(oldRevIdRaw, newRevIdRaw) {
      const oldRevId = parseInt(oldRevIdRaw, 10);
      const newRevId = parseInt(newRevIdRaw, 10);
      if (!oldRevId || !newRevId) return;

      function fmtOresScores(scores) {
        if (!scores) return "No ORES score";
        const parts = [];
        if (scores.damaging) {
          parts.push(Math.round(scores.damaging.true * 100) + "% 🚨");
        }
        if (scores.goodfaith) {
          parts.push(Math.round(scores.goodfaith.true * 100) + "% 👍");
        }
        return parts.length ? parts.join(" · ") : "No ORES score";
      }

      // Plain-language elapsed time between two timestamps, with no
      // dependency on the moment.js library used by the original script.
      function fmtElapsed(fromTs, toTs) {
        const from = new Date(fromTs).getTime();
        const to = new Date(toTs).getTime();
        if (isNaN(from) || isNaN(to)) return "";
        const diffSec = Math.abs(Math.round((to - from) / 1000));
        if (diffSec < 60)
          return diffSec + " second" + (diffSec !== 1 ? "s" : "");
        const diffMin = Math.round(diffSec / 60);
        if (diffMin < 60)
          return diffMin + " minute" + (diffMin !== 1 ? "s" : "");
        const diffHr = Math.round(diffMin / 60);
        if (diffHr < 24) return diffHr + " hour" + (diffHr !== 1 ? "s" : "");
        const diffDay = Math.round(diffHr / 24);
        if (diffDay < 30) return diffDay + " day" + (diffDay !== 1 ? "s" : "");
        const diffMonth = Math.round(diffDay / 30.4375);
        if (diffMonth < 12)
          return diffMonth + " month" + (diffMonth !== 1 ? "s" : "");
        const diffYear = Math.round(diffDay / 365.25);
        return diffYear + " year" + (diffYear !== 1 ? "s" : "");
      }

      function buildInfoLine(revision, previousRevision) {
        const parts = [
          "Revision ID: " + revision.revid,
          revision.size.toLocaleString() + " bytes",
        ];
        if (previousRevision) {
          const sizeDiff = revision.size - previousRevision.size;
          parts[1] +=
            sizeDiff > 0
              ? " (+" + sizeDiff + ")"
              : sizeDiff < 0
                ? " (" + sizeDiff + ")"
                : " (±0)";
        }
        parts.push(fmtOresScores(revision.oresscores));
        if (previousRevision) {
          const elapsed = fmtElapsed(
            previousRevision.timestamp,
            revision.timestamp,
          );
          if (elapsed) parts.push(elapsed + " later");
        }
        return parts.join(" · ");
      }

      try {
        const data = await apiGet({
          action: "query",
          prop: "revisions",
          revids: oldRevId + "|" + newRevId,
          rvprop: "ids|size|oresscores|timestamp",
          formatversion: 2,
        });
        const page = data.query && data.query.pages && data.query.pages[0];
        const revisions = (page && page.revisions) || [];
        let oldRevision = null;
        let newRevision = null;
        revisions.forEach(function (r) {
          if (r.revid === oldRevId) oldRevision = r;
          if (r.revid === newRevId) newRevision = r;
        });
        if (!oldRevision || !newRevision) return;

        const oldTitleBox = document.querySelector("#mw-diff-otitle2");
        const newTitleBox = document.querySelector("#mw-diff-ntitle2");
        if (oldTitleBox) {
          const el = document.createElement("div");
          el.className = "tng-diffinfo-line";
          el.textContent = buildInfoLine(oldRevision);
          oldTitleBox.parentNode.insertBefore(el, oldTitleBox.nextSibling);
        }
        if (newTitleBox) {
          const el = document.createElement("div");
          el.className = "tng-diffinfo-line";
          el.textContent = buildInfoLine(newRevision, oldRevision);
          newTitleBox.parentNode.insertBefore(el, newTitleBox.nextSibling);
        }
      } catch (e) {
        // This is a supplementary display feature; fail silently rather
        // than disrupting the rest of the diff page.
      }
    };
  },
};
