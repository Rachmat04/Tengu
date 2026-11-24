/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Revert helpers module
 * ============================================================================
 * PURPOSE:
 * Provides the helpers shared by the batch Rollback section and the inline
 * "rollback", "undo" and "restore this revision" actions: the edit summary
 * builder, the SHA-1 content comparison used to detect no-op reverts, the
 * current-revision lookup used on diff pages, and the revision-range lookup
 * used when rollback falls back to undo.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguRevert.create(deps), which returns an object containing
 * buildQuickRevertSummaryText, revisionsContentIdentical,
 * fetchCurrentRevisionId and findRollbackFallbackRevisions.
 *
 * DEPENDENCIES:
 * MediaWiki globals (mw.config) and the helpers passed in by Tengu.js:
 * apiGet(params) and useIndonesian (boolean).
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguRevert = {
    create: function (deps) {
      const apiGet = deps.apiGet;
      const useIndonesian = deps.useIndonesian;

      // Compares two revisions' content via their SHA-1 hashes, used to
      // confirm whether a rollback/undo actually restored the target
      // revision's exact content. Returns true/false when both hashes are
      // available, or null when this cannot be determined (e.g.
      // revision-deleted content). SHA-1 equality is treated as equivalent
      // to identical page content; this has not been independently verified
      // against a live wiki for every content model.
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

      // Builds the shared rollback/undo/restore edit summary. Used by the
      // main Rollback section in work() and by the inline "⛩️ rollback",
      // "⛩️ undo", and "⛩️ restore this revision" actions, so all entry
      // points produce identical wording for a given action type.
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

      // Determines the page's actual current revision ID via a live API
      // call, used as the authoritative basis for deciding which side of a
      // diff page gets "rollback" versus "restore this revision". A live
      // call is used rather than trusting wgCurRevisionId directly, since
      // that value can be stale on a cached diff page. Falls back to
      // wgCurRevisionId if the API call fails, so a request failure does
      // not suppress the actions entirely.
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

      // Locates the revision range needed to replicate native rollback for
      // a user who lacks the rollback right. Mirrors rollback's own
      // behaviour of reverting every consecutive top revision made by the
      // same user, back to the last revision made by someone else, but
      // resolves the range via a plain revision-history query instead of
      // the rollback API. Returns null if the page's current revision is
      // not by targetUser (nothing to roll back) or if no revisions could
      // be fetched.
      // Limited to the 100 most recent revisions; if the same user made
      // more than 100 consecutive edits, oldestParent is not found and the
      // fallback reverts only the latest edit, rather than the full run.
      async function findRollbackFallbackRevisions(pageTitle, targetUser) {
        const data = await apiGet({
          action: "query",
          prop: "revisions",
          titles: pageTitle,
          rvlimit: 100,
          rvprop: "ids|user",
          formatversion: 2,
        });
        const page = data.query && data.query.pages && data.query.pages[0];
        const revs = (page && page.revisions) || [];
        if (!revs.length) return null;
        const latestRevId = revs[0].revid;
        if ((revs[0].user || "") !== targetUser) return null;
        let oldestParent = null;
        for (let i = 1; i < revs.length; i++) {
          if ((revs[i].user || "") !== targetUser) {
            oldestParent = revs[i].revid;
            break;
          }
        }
        return { latestRevId, oldestParent };
      }

      return {
        buildQuickRevertSummaryText: buildQuickRevertSummaryText,
        revisionsContentIdentical: revisionsContentIdentical,
        fetchCurrentRevisionId: fetchCurrentRevisionId,
        findRollbackFallbackRevisions: findRollbackFallbackRevisions,
      };
    },
  };
})();
// </nowiki>
