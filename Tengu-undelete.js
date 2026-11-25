/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Page undeletion module
 * ============================================================================
 * PURPOSE:
 * Executes page restoration (action=undelete) and posts an optional
 * restoration notice to the original page creator's talk page.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes window.TenguUndelete.create(deps),
 * returning { undeleteTarget }.
 *
 * DEPENDENCIES:
 * MediaWiki Title utility (window.mw.Title), MediaWiki configuration
 * (window.mw.config), and the apiGet, apiPost, pageExists, withToolTag,
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
    const apiGet = deps.apiGet;
    const apiPost = deps.apiPost;
    const pageExists = deps.pageExists;
    const withToolTag = deps.withToolTag;
    const formatApiError = deps.formatApiError;
    const useIndonesian = deps.useIndonesian;

    // Restores a previously deleted page and, when enabled, notifies the
    // page's original creator on their talk page (unless they are the same
    // user performing the restoration).
    async function undeleteTarget(targetVal, config, ctx) {
      const addLog = ctx.addLog;
      const onUndeleted = ctx.onUndeleted;
      const toolTag = ctx.toolTag;
      const notifySummaryUndelete =
        (useIndonesian
          ? "Notifikasi: Pemberitahuan pemulihan halaman"
          : "Notification: Page restoration notice") + toolTag;

      try {
        await apiPost({
          action: "undelete",
          title: targetVal,
          reason: withToolTag(config.undeleteReason, toolTag),
        });
        addLog(`[Undelete] Successfully restored page: "${targetVal}"`);
        onUndeleted();

        if (config.notifyUndelete) {
          try {
            const creatorData = await apiGet({
              action: "query",
              prop: "revisions",
              titles: targetVal,
              rvdir: "newer",
              rvlimit: 1,
              rvprop: "user",
              formatversion: 2,
            });
            const cp =
              creatorData.query &&
              creatorData.query.pages &&
              creatorData.query.pages[0];
            const pageCreator =
              (cp &&
                !cp.missing &&
                cp.revisions &&
                cp.revisions[0] &&
                cp.revisions[0].user) ||
              null;
            const currentUser = mw.config.get("wgUserName") || "";
            if (
              pageCreator &&
              pageCreator.toLowerCase() !== currentUser.toLowerCase()
            ) {
              const talkTitle = new mw.Title(pageCreator, 3).getPrefixedText();
              const undeleteReasonNotice =
                config.undeleteReason && config.undeleteReason.trim()
                  ? config.undeleteReason
                  : useIndonesian
                    ? "(tidak ada alasan diberikan)"
                    : "(no reason given)";
              const talkExists = await pageExists(talkTitle);
              const notice = useIndonesian
                ? `== Pemberitahuan pemulihan halaman ==\nHalo ${pageCreator},\n\nHalaman "${targetVal}" yang Anda buat telah dipulihkan dengan alasan berikut: ${undeleteReasonNotice}.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
                : `== Page restoration notice ==\nDear ${pageCreator},\n\nThe page "${targetVal}" you created has been restored due to the following reason: ${undeleteReasonNotice}.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
              await apiPost({
                action: "edit",
                title: talkTitle,
                appendtext: (talkExists ? "\n\n" : "") + notice,
                summary: notifySummaryUndelete,
                bot: true,
              });
              addLog(
                `[Notify] Undeletion notification posted to: "${talkTitle}"`,
              );
            } else if (pageCreator) {
              addLog(
                `[Notify] Skipped undeletion notification: page was created and restored by the same user`,
                "warn",
              );
            }
          } catch (e) {
            addLog(
              `[Notify] Failed to post undeletion notification: ${formatApiError(e)}`,
              "warn",
            );
          }
        }
      } catch (e) {
        addLog(
          `[Undelete] Failed to restore "${targetVal}": ${formatApiError(e)}`,
          true,
        );
      }
    }

    return {
      undeleteTarget: undeleteTarget,
    };
  }

  window.TenguUndelete = {
    create: create,
  };
})();
// </nowiki>
