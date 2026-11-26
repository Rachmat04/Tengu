/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Rollback notification module
 * ============================================================================
 * PURPOSE:
 * Posts a single consolidated edit-reversion notice to the target user's talk
 * page after one or more pages have been rolled back or undone in user mode.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguNotifyRollback.create(deps), returning
 * { notifyRollbackTarget }.
 *
 * DEPENDENCIES:
 * MediaWiki global mw.Title, and the apiPost, pageExists, formatApiError,
 * and useIndonesian helpers passed in by Tengu.js.
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
    const pageExists = deps.pageExists;
    const formatApiError = deps.formatApiError;
    const useIndonesian = deps.useIndonesian;

    // Posts a consolidated reversion notification to the target user's talk
    // page listing every page successfully reverted in the run.
    async function notifyRollbackTarget(
      targetVal,
      revertedTitles,
      config,
      callbacks,
    ) {
      const talkTitle = new mw.Title(targetVal, 3).getPrefixedText();
      const reasonText =
        config.rollbackReason ||
        (useIndonesian ? "(tidak ada alasan diberikan)" : "(no reason given)");
      try {
        const talkExists = await pageExists(talkTitle);
        let notice;
        if (revertedTitles.length === 1) {
          notice = useIndonesian
            ? `== Pemberitahuan pembatalan suntingan ==\nHalo ${targetVal},\n\nSuntingan Anda pada halaman "${revertedTitles[0]}" telah dibatalkan dengan alasan berikut: ${reasonText}.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
            : `== Edit reversion notice ==\nDear ${targetVal},\n\nYour edit to the page "${revertedTitles[0]}" has been reverted due to the following reason: ${reasonText}.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
        } else {
          const listed = revertedTitles.map((t) => `* "${t}"`).join("\n");
          notice = useIndonesian
            ? `== Pemberitahuan pembatalan suntingan ==\nHalo ${targetVal},\n\nSuntingan Anda pada halaman-halaman berikut telah dibatalkan dengan alasan berikut: ${reasonText}.\n\n${listed}\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
            : `== Edit reversion notice ==\nDear ${targetVal},\n\nYour edits to the following pages have been reverted due to the following reason: ${reasonText}.\n\n${listed}\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
        }
        await apiPost({
          action: "edit",
          title: talkTitle,
          appendtext: (talkExists ? "\n\n" : "") + notice,
          summary: callbacks.notifySummaryRollback,
          bot: true,
        });
        callbacks.addLog(
          `[Notify] Reversion notification posted to: "${talkTitle}"`,
        );
      } catch (e) {
        callbacks.addLog(
          `[Notify] Failed to post reversion notification to "${talkTitle}": ${formatApiError(e)}`,
          "warn",
        );
      }
    }

    return {
      notifyRollbackTarget: notifyRollbackTarget,
    };
  }

  window.TenguNotifyRollback = {
    create: create,
  };
})();
// </nowiki>
