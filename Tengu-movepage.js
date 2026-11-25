/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Move page execution module
 * ============================================================================
 * PURPOSE:
 * Executes the Move page sub-mode workflow in Tengu.js, including optional
 * pre-deletion of an existing destination page, moving the target page,
 * verifying redirect creation, delegating talk-page and subpage follow-ups,
 * fixing double redirects, moving category members, and posting a move notice.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes window.TenguMovePage.create(deps),
 * returning { movePageTarget }.
 *
 * DEPENDENCIES:
 * MediaWiki title utility (window.mw.Title) and the apiGet, apiPost,
 * pageExists, withToolTag, formatApiError, and useIndonesian helpers passed in
 * via deps.
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
    const useIndonesian = !!deps.useIndonesian;

    // Executes the Move page sub-mode for targetVal.
    async function movePageTarget(targetVal, config, callbacks) {
      const addLog = callbacks.addLog;
      const onMoved = callbacks.onMoved;
      const onDeleted = callbacks.onDeleted;
      const logMoveSubpageResults = callbacks.logMoveSubpageResults;
      const moveAssociatedTalkPage = callbacks.moveAssociatedTalkPage;
      const fixDoubleRedirectsForMove = callbacks.fixDoubleRedirectsForMove;
      const moveCategoryMembers = callbacks.moveCategoryMembers;
      const isAborted = callbacks.isAborted;
      const toolTag = callbacks.toolTag || "";
      const notifySummaryMovePage = callbacks.notifySummaryMovePage;

      // General page move. movesubpages is a native API parameter so the move
      // and subpage moves are handled by the API in a single call rather than
      // as separate requests.
      const moveParams = {
        action: "move",
        from: targetVal,
        to: config.movePageDest,
        reason: withToolTag(config.movePageReason, toolTag),
      };
      if (config.movePageNoRedirect) moveParams.noredirect = 1;
      if (config.movePageSubpages) moveParams.movesubpages = 1;
      // The talk page move is no longer requested via the native movetalk
      // parameter. It is instead performed as its own apiPost() call below
      // (after the main move succeeds), so its success or failure can be
      // logged independently rather than being folded silently into the main
      // move's result.

      // Delete the destination page first, if requested and it exists. A move
      // fails outright if the destination title is already occupied by an
      // existing page, so this must run before the move attempt below.
      if (config.movePageDeleteDest && !isAborted()) {
        try {
          const destExistData = await apiGet({
            action: "query",
            titles: config.movePageDest,
            formatversion: 2,
          });
          const destPage =
            destExistData.query &&
            destExistData.query.pages &&
            destExistData.query.pages[0];
          if (destPage && !destPage.missing) {
            await apiPost({
              action: "delete",
              title: config.movePageDest,
              reason:
                (useIndonesian
                  ? "Menghapus halaman tujuan untuk memungkinkan pemindahan halaman: "
                  : "Deleting destination page to allow page move: ") +
                config.movePageReason +
                toolTag,
            });
            addLog(
              `[Move] Deleted existing destination page: "${config.movePageDest}"`,
            );
            if (onDeleted) onDeleted();
          }
        } catch (e) {
          addLog(
            `[Move] Failed to delete destination page "${config.movePageDest}": ${formatApiError(e)}`,
            true,
          );
        }
      }

      let movePageMoveSucceeded = false;
      try {
        const movePageMoveResult = await apiPost(moveParams);
        addLog(`[Move] Moved "${targetVal}" to "${config.movePageDest}"`);
        if (onMoved) onMoved();
        movePageMoveSucceeded = true;

        // redirectcreated is expected in the response when a redirect was left
        // at the old title.
        const mpMove = movePageMoveResult && movePageMoveResult.move;
        if (
          mpMove &&
          !config.movePageNoRedirect &&
          (mpMove.redirectcreated === undefined ||
            mpMove.redirectcreated === false)
        ) {
          addLog(
            `[Move] No redirect was reported as created at "${targetVal}" although redirect suppression was not selected`,
            "warn",
          );
        }
        if (config.movePageSubpages) {
          await logMoveSubpageResults(
            movePageMoveResult,
            config.movePageNoRedirect,
          );
        }
      } catch (e) {
        addLog(
          `[Move] Failed to move "${targetVal}" to "${config.movePageDest}": ${formatApiError(e)}`,
          true,
        );
      }

      // Move the associated talk page, if requested, once the main move has
      // actually succeeded.
      if (movePageMoveSucceeded && config.movePageTalk && !isAborted()) {
        await moveAssociatedTalkPage(targetVal);
      }

      // Fix double redirects. A double redirect occurs when a page redirects
      // to targetVal, which — following this move — is itself now a redirect
      // to config.movePageDest, instead of the pre-existing redirect being
      // updated to point directly to the final destination. Only relevant when
      // a redirect was left behind at the old title (i.e. 'Suppress redirect'
      // was not used), since otherwise there is no intermediate redirect for
      // other pages to chain through.
      if (
        movePageMoveSucceeded &&
        config.movePageFixDoubleRedirects &&
        !config.movePageNoRedirect &&
        !isAborted()
      ) {
        await fixDoubleRedirectsForMove(targetVal, config.movePageDest, "");
      }

      // Move the members of the category to the new category, once the
      // category itself has been moved.
      if (
        movePageMoveSucceeded &&
        config.movePageCategoryMembers &&
        !isAborted()
      ) {
        await moveCategoryMembers(targetVal, config.movePageDest);
      }

      // Post a move notification to the moved page's own talk page, naming the
      // source and destination titles. Only sent once the main move has
      // actually succeeded.
      if (movePageMoveSucceeded && config.notifyMovePage && !isAborted()) {
        try {
          const movePageTalkTitle = new mw.Title(config.movePageDest)
            .getTalkPage()
            .getPrefixedText();
          const talkExists = await pageExists(movePageTalkTitle);
          const movePageReasonNotice =
            config.movePageReason && config.movePageReason.trim()
              ? config.movePageReason
              : useIndonesian
                ? "(tidak ada alasan diberikan)"
                : "(no reason given)";
          const notice = useIndonesian
            ? `== Pemberitahuan pemindahan halaman ==\nHalaman "${targetVal}" telah dipindahkan ke "${config.movePageDest}" dengan alasan berikut: ${movePageReasonNotice}.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
            : `== Page move notice ==\nThe page "${targetVal}" has been moved to "${config.movePageDest}" due to the following reason: ${movePageReasonNotice}.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
          await apiPost({
            action: "edit",
            title: movePageTalkTitle,
            appendtext: (talkExists ? "\n\n" : "") + notice,
            summary: notifySummaryMovePage,
            bot: true,
          });
          addLog(
            `[Notify] Move notification posted to: "${movePageTalkTitle}"`,
          );
        } catch (e) {
          addLog(
            `[Notify] Failed to post move notification: ${formatApiError(e)}`,
            "warn",
          );
        }
      }
    }

    return {
      movePageTarget: movePageTarget,
    };
  }

  window.TenguMovePage = {
    create: create,
  };
})();
// </nowiki>
