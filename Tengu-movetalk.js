/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Associated talk page move module
 * ============================================================================
 * PURPOSE:
 * Executes the associated talk page move for the Move page sub-mode in
 * Tengu.js, including optional deletion of an existing destination talk page,
 * subpage move result logging, and double-redirect fixing.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes window.TenguMoveTalk.create(deps),
 * returning { moveAssociatedTalkPage }.
 *
 * DEPENDENCIES:
 * MediaWiki title utility (window.mw.Title) and the apiGet, apiPost,
 * formatApiError, and useIndonesian helpers passed in via deps.
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
    const formatApiError = deps.formatApiError;
    const useIndonesian = !!deps.useIndonesian;

    // Moves the associated talk page for targetVal to the talk page of
    // config.movePageDest. Performed as its own apiPost() call (rather than
    // the native movetalk parameter) so its success or failure is logged
    // separately from the main page move.
    async function moveAssociatedTalkPage(targetVal, config, callbacks) {
      const addLog = callbacks.addLog;
      const onMoved = callbacks.onMoved;
      const onDeleted = callbacks.onDeleted;
      const logMoveSubpageResults = callbacks.logMoveSubpageResults;
      const fixDoubleRedirectsForMove = callbacks.fixDoubleRedirectsForMove;
      const isAborted = callbacks.isAborted;
      const toolTag = callbacks.toolTag || "";

      try {
        const sourceTitleObj = new mw.Title(targetVal);
        if (sourceTitleObj.isTalkPage()) {
          addLog(
            "[Move] Skipped talk page move: target is already a talk page",
            "warn",
          );
          return;
        }

        const sourceTalkTitle = sourceTitleObj.getTalkPage().getPrefixedText();
        const destTalkTitle = new mw.Title(config.movePageDest)
          .getTalkPage()
          .getPrefixedText();

        // Delete the destination talk page first, if requested and it exists,
        // mirroring the destination deletion already applied to the main page.
        // Without this, the talk-page move below fails with "articleexists"
        // whenever the destination talk page already exists.
        if (config.movePageDeleteDest && !isAborted()) {
          try {
            const destTalkExistData = await apiGet({
              action: "query",
              titles: destTalkTitle,
              formatversion: 2,
            });
            const destTalkPage =
              destTalkExistData.query &&
              destTalkExistData.query.pages &&
              destTalkExistData.query.pages[0];
            if (destTalkPage && !destTalkPage.missing) {
              await apiPost({
                action: "delete",
                title: destTalkTitle,
                reason:
                  (useIndonesian
                    ? "Menghapus halaman pembicaraan tujuan untuk memungkinkan pemindahan halaman: "
                    : "Deleting destination talk page to allow page move: ") +
                  config.movePageReason +
                  toolTag,
              });
              addLog(
                `[Move] Deleted existing destination talk page: "${destTalkTitle}"`,
              );
              if (onDeleted) onDeleted();
            }
          } catch (e) {
            addLog(
              `[Move] Failed to delete destination talk page "${destTalkTitle}": ${formatApiError(e)}`,
              true,
            );
          }
        }

        const talkExistData = await apiGet({
          action: "query",
          titles: sourceTalkTitle,
          formatversion: 2,
        });
        const talkPage =
          talkExistData.query &&
          talkExistData.query.pages &&
          talkExistData.query.pages[0];
        if (talkPage && !talkPage.missing) {
          const talkMoveParams = {
            action: "move",
            from: sourceTalkTitle,
            to: destTalkTitle,
            reason:
              (useIndonesian
                ? `Halaman pembicaraan dari halaman yang dipindahkan: ${config.movePageReason}`
                : `Talk page of moved page: ${config.movePageReason}`) +
              toolTag,
          };
          if (config.movePageNoRedirect) talkMoveParams.noredirect = 1;
          if (config.movePageSubpages) talkMoveParams.movesubpages = 1;
          const talkMoveResult = await apiPost(talkMoveParams);
          addLog(
            `[Move] Moved talk page "${sourceTalkTitle}" to "${destTalkTitle}"`,
          );
          if (onMoved) onMoved();
          if (config.movePageSubpages) {
            await logMoveSubpageResults(
              talkMoveResult,
              config.movePageNoRedirect,
            );
          }

          // Fix double redirects pointing to the talk page's old title,
          // mirroring the equivalent fix already applied to the main page.
          // Only runs when both "Fix double redirects" and a redirect being
          // left behind (i.e. "Suppress redirect" not used) apply.
          if (
            config.movePageFixDoubleRedirects &&
            !config.movePageNoRedirect &&
            !isAborted()
          ) {
            await fixDoubleRedirectsForMove(
              sourceTalkTitle,
              destTalkTitle,
              " (talk page)",
            );
          }
        } else {
          addLog(
            `[Move] Skipped talk page move: "${sourceTalkTitle}" does not exist`,
            "warn",
          );
        }
      } catch (e) {
        addLog(
          `[Move] Failed to move talk page for "${targetVal}": ${formatApiError(e)}`,
          true,
        );
      }
    }

    return {
      moveAssociatedTalkPage: moveAssociatedTalkPage,
    };
  }

  window.TenguMoveTalk = {
    create: create,
  };
})();
// </nowiki>
