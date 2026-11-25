/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Move to user's sandbox module
 * ============================================================================
 * PURPOSE:
 * Executes the Move to user's sandbox sub-mode workflow (deleting existing
 * destination pages if requested, moving the main page, associated talk page,
 * and subpages, and posting an optional talk-page notification) for Tengu.js.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguMoveSandbox.create(deps), returning { moveToSandboxTarget }.
 *
 * DEPENDENCIES:
 * MediaWiki Title utility (window.mw.Title) and the apiGet, apiPost,
 * pageExists, withToolTag, formatApiError, and useIndonesian helpers passed
 * in by Tengu.js.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  function create(deps) {
    const {
      apiGet,
      apiPost,
      pageExists,
      withToolTag,
      formatApiError,
      useIndonesian,
    } = deps;

    async function moveToSandboxTarget(targetVal, config, callbacks) {
      const {
        addLog,
        onMoved,
        onDeleted,
        isAborted,
        toolTag,
        throttleMs,
        notifySummaryMovePage,
      } = callbacks;

      const moveParams = {
        action: "move",
        from: targetVal,
        to: config.moveSandboxDest,
        reason: withToolTag(config.moveSandboxReason, toolTag),
      };
      if (config.moveSandboxNoRedirect) moveParams.noredirect = 1;

      // Delete the destination page first, if requested and it exists.
      // A move fails outright if the destination title is already
      // occupied by an existing page, so this must run before the
      // move attempt below, matching the equivalent option in the
      // Move page sub-mode.
      if (config.moveSandboxDeleteDest && !isAborted()) {
        try {
          const destExistData = await apiGet({
            action: "query",
            titles: config.moveSandboxDest,
            formatversion: 2,
          });
          const destPage =
            destExistData.query &&
            destExistData.query.pages &&
            destExistData.query.pages[0];
          if (destPage && !destPage.missing) {
            await apiPost({
              action: "delete",
              title: config.moveSandboxDest,
              reason:
                (useIndonesian
                  ? "Menghapus halaman tujuan untuk memungkinkan pemindahan halaman: "
                  : "Deleting destination page to allow page move: ") +
                config.moveSandboxReason +
                toolTag,
            });
            addLog(
              `[Move] Deleted existing destination page: "${config.moveSandboxDest}"`,
            );
            onDeleted();
          }
        } catch (e) {
          addLog(
            `[Move] Failed to delete destination page "${config.moveSandboxDest}": ${formatApiError(e)}`,
            true,
          );
        }
      }

      let sandboxMoveSucceeded = false;
      try {
        await apiPost(moveParams);
        addLog(`[Move] Moved "${targetVal}" to "${config.moveSandboxDest}"`);
        onMoved();
        sandboxMoveSucceeded = true;
      } catch (e) {
        addLog(
          `[Move] Failed to move "${targetVal}" to "${config.moveSandboxDest}": ${formatApiError(e)}`,
          true,
        );
      }

      // Move the associated talk page if the option was selected,
      // and only if the main page move succeeded.
      if (sandboxMoveSucceeded && config.moveSandboxTalk && !isAborted()) {
        try {
          const sourceTitleObj = new mw.Title(targetVal);
          if (sourceTitleObj.isTalkPage()) {
            addLog(
              "[Move] Skipped talk page move: target is already a talk page",
              "warn",
            );
          } else {
            const sourceTalkTitle = sourceTitleObj
              .getTalkPage()
              .getPrefixedText();

            // Delete the destination talk page first, if requested
            // and it exists, mirroring the destination deletion
            // already applied to the main destination above.
            if (config.moveSandboxDeleteDest && !isAborted()) {
              try {
                const destTalkExistData = await apiGet({
                  action: "query",
                  titles: config.moveSandboxTalkDest,
                  formatversion: 2,
                });
                const destTalkPage =
                  destTalkExistData.query &&
                  destTalkExistData.query.pages &&
                  destTalkExistData.query.pages[0];
                if (destTalkPage && !destTalkPage.missing) {
                  await apiPost({
                    action: "delete",
                    title: config.moveSandboxTalkDest,
                    reason:
                      (useIndonesian
                        ? "Menghapus halaman pembicaraan tujuan untuk memungkinkan pemindahan halaman: "
                        : "Deleting destination talk page to allow page move: ") +
                      config.moveSandboxReason +
                      toolTag,
                  });
                  addLog(
                    `[Move] Deleted existing destination talk page: "${config.moveSandboxTalkDest}"`,
                  );
                  onDeleted();
                }
              } catch (e) {
                addLog(
                  `[Move] Failed to delete destination talk page "${config.moveSandboxTalkDest}": ${formatApiError(e)}`,
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
                to: config.moveSandboxTalkDest,
                reason:
                  (useIndonesian
                    ? `Halaman pembicaraan dari halaman yang dipindahkan: ${config.moveSandboxReason}`
                    : `Talk page of moved page: ${config.moveSandboxReason}`) +
                  toolTag,
              };
              if (config.moveSandboxNoRedirect) talkMoveParams.noredirect = 1;
              await apiPost(talkMoveParams);
              addLog(
                `[Move] Moved talk page "${sourceTalkTitle}" to "${config.moveSandboxTalkDest}"`,
              );
              onMoved();
            } else {
              addLog(
                `[Move] Skipped talk page move: "${sourceTalkTitle}" does not exist`,
                "warn",
              );
            }
          }
        } catch (e) {
          addLog(
            `[Move] Failed to move talk page to "${config.moveSandboxTalkDest}": ${formatApiError(e)}`,
            true,
          );
        }
      }

      // Move all subpages if the option was selected, and only if
      // the main page move succeeded.
      if (sandboxMoveSucceeded && config.moveSandboxSubpages && !isAborted()) {
        try {
          const sourceTitleObj = new mw.Title(targetVal);
          if (sourceTitleObj.isTalkPage()) {
            addLog(
              "[Move] Skipped subpage moves: target is already a talk page",
              "warn",
            );
          } else {
            const ns = sourceTitleObj.getNamespaceId();
            const mainText = sourceTitleObj.getMain();
            const spData = await apiGet({
              action: "query",
              list: "allpages",
              apprefix: mainText + "/",
              apnamespace: ns,
              aplimit: "max",
              formatversion: 2,
            });
            const subpages = (spData.query && spData.query.allpages) || [];
            if (!subpages.length) {
              addLog(`[Move] No subpages found for: "${targetVal}"`, "warn");
            }
            // Normalise the source prefix so that the suffix can be
            // extracted reliably regardless of how the user typed it.
            const normalizedSource = sourceTitleObj.getPrefixedText();
            for (const sp of subpages) {
              if (isAborted()) break;
              const suffix = sp.title.slice(normalizedSource.length); // e.g. "/Section"
              const spDest = config.moveSandboxDest + suffix;
              const spMoveParams = {
                action: "move",
                from: sp.title,
                to: spDest,
                reason:
                  (useIndonesian
                    ? `Memindahkan subhalaman karena halaman utama yang terkait telah dipindahkan: ${config.moveSandboxReason}`
                    : `Moving subpage because its associated main page has been moved: ${config.moveSandboxReason}`) +
                  toolTag,
              };
              if (config.moveSandboxNoRedirect) spMoveParams.noredirect = 1;
              try {
                await apiPost(spMoveParams);
                addLog(`[Move] Moved subpage "${sp.title}" to "${spDest}"`);
                onMoved();
              } catch (e) {
                addLog(
                  `[Move] Failed to move subpage "${sp.title}" to "${spDest}": ${formatApiError(e)}`,
                  true,
                );
              }

              // Move the talk page of this subpage if the option is selected.
              if (config.moveSandboxTalk && !isAborted()) {
                try {
                  const spTitleObj = new mw.Title(sp.title);
                  const spTalkTitle = spTitleObj
                    .getTalkPage()
                    .getPrefixedText();
                  const spTalkExistData = await apiGet({
                    action: "query",
                    titles: spTalkTitle,
                    formatversion: 2,
                  });
                  const spTalkPage =
                    spTalkExistData.query &&
                    spTalkExistData.query.pages &&
                    spTalkExistData.query.pages[0];
                  if (spTalkPage && !spTalkPage.missing) {
                    const spTalkDest = config.moveSandboxTalkDest + suffix;
                    const spTalkMoveParams = {
                      action: "move",
                      from: spTalkTitle,
                      to: spTalkDest,
                      reason:
                        (useIndonesian
                          ? `Halaman pembicaraan dari subhalaman yang dipindahkan: ${config.moveSandboxReason}`
                          : `Talk page of moved subpage: ${config.moveSandboxReason}`) +
                        toolTag,
                    };
                    if (config.moveSandboxNoRedirect)
                      spTalkMoveParams.noredirect = 1;
                    await apiPost(spTalkMoveParams);
                    addLog(
                      `[Move] Moved subpage talk page "${spTalkTitle}" to "${spTalkDest}"`,
                    );
                    onMoved();
                  } else {
                    addLog(
                      `[Move] Skipped subpage talk page move: "${spTalkTitle}" does not exist`,
                      "warn",
                    );
                  }
                } catch (e) {
                  addLog(
                    `[Move] Failed to move talk page for subpage "${sp.title}": ${formatApiError(e)}`,
                    true,
                  );
                }
              }

              await new Promise((resolve) => setTimeout(resolve, throttleMs));
            }
          }
        } catch (e) {
          addLog(
            `[Move] Failed to fetch subpages for "${targetVal}": ${formatApiError(e)}`,
            true,
          );
        }
      }

      // Post a move notification to the destination user's talk
      // page, using ns 3 (User talk) so localised namespace names
      // are resolved via mw.Title rather than an assumed English
      // prefix. Only sent once the sandbox move has succeeded.
      if (sandboxMoveSucceeded && config.notifyMovePage && !isAborted()) {
        try {
          const sandboxUserTalkTitle = new mw.Title(
            config.moveSandboxUser,
            3,
          ).getPrefixedText();
          const talkExists = await pageExists(sandboxUserTalkTitle);
          const moveSandboxReasonNotice =
            config.moveSandboxReason && config.moveSandboxReason.trim()
              ? config.moveSandboxReason
              : useIndonesian
                ? "(tidak ada alasan diberikan)"
                : "(no reason given)";
          const notice = useIndonesian
            ? `== Pemberitahuan pemindahan halaman ==\nHalo ${config.moveSandboxUser},\n\nHalaman "${targetVal}" telah dipindahkan ke bak pasir Anda di "${config.moveSandboxDest}" dengan alasan berikut: ${moveSandboxReasonNotice}.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
            : `== Page move notice ==\nDear ${config.moveSandboxUser},\n\nThe page "${targetVal}" has been moved to your sandbox at "${config.moveSandboxDest}" due to the following reason: ${moveSandboxReasonNotice}.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
          await apiPost({
            action: "edit",
            title: sandboxUserTalkTitle,
            appendtext: (talkExists ? "\n\n" : "") + notice,
            summary: notifySummaryMovePage,
            bot: true,
          });
          addLog(
            `[Notify] Move notification posted to: "${sandboxUserTalkTitle}"`,
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
      moveToSandboxTarget: moveToSandboxTarget,
    };
  }

  window.TenguMoveSandbox = {
    create: create,
  };
})();
// </nowiki>
