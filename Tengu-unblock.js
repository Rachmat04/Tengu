/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Account unblock module
 * ============================================================================
 * PURPOSE:
 * Executes the MediaWiki account unblock API request and posts the optional
 * bilingual (English or Indonesian) unblock notification to the target user's
 * talk page.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes window.TenguUnblock.create(deps),
 * returning { unblockTarget }.
 *
 * DEPENDENCIES:
 * MediaWiki global mw.Title, and the apiPost, pageExists, withToolTag,
 * formatApiError, and useIndonesian helpers passed in by Tengu.js.
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
    const withToolTag = deps.withToolTag;
    const formatApiError = deps.formatApiError;
    const useIndonesian = deps.useIndonesian;

    async function unblockTarget(targetVal, config, hooks) {
      const addLog = hooks.addLog;
      const onUnblocked = hooks.onUnblocked;
      const toolTag = hooks.toolTag;

      try {
        await apiPost({
          action: "unblock",
          user: targetVal,
          reason: withToolTag(config.unblockReason, toolTag),
        });
        addLog(`[Unblock] Successfully unblocked "${targetVal}"`);
        if (onUnblocked) onUnblocked();

        if (config.notifyUnblock) {
          const talkTitle = new mw.Title(targetVal, 3).getPrefixedText();
          const notifySummaryUnblock =
            (useIndonesian
              ? "Notifikasi: Pemberitahuan pencabutan pemblokiran"
              : "Notification: Account unblock notice") + toolTag;
          const notice = useIndonesian
            ? `== Pemberitahuan pencabutan pemblokiran ==\nHalo ${targetVal},\n\nPemblokiran pada akun "${targetVal}" telah dicabut dengan alasan berikut: ${config.unblockReason}.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
            : `== Account unblock notice ==\nDear ${targetVal},\n\nThe block on the account "${targetVal}" has been lifted due to the following reason: ${config.unblockReason}.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
          try {
            const talkExists = await pageExists(talkTitle);
            await apiPost({
              action: "edit",
              title: talkTitle,
              appendtext: (talkExists ? "\n\n" : "") + notice,
              summary: notifySummaryUnblock,
              bot: true,
            });
            addLog(`[Notify] Notification posted to: "${talkTitle}"`);
          } catch (e) {
            addLog(
              `[Notify] Failed to post unblock notification to "${talkTitle}": ${formatApiError(e)}`,
              "warn",
            );
          }
        }
      } catch (e) {
        addLog(
          `[Unblock] Failed to unblock "${targetVal}": ${formatApiError(e)}`,
          true,
        );
      }
    }

    return {
      unblockTarget: unblockTarget,
    };
  }

  window.TenguUnblock = {
    create: create,
  };
})();
// </nowiki>
