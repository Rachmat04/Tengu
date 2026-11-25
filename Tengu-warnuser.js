/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — User warning module
 * ============================================================================
 * PURPOSE:
 * Posts templated user warnings and notices to a target user's talk page,
 * personalising the message per recipient in multi-target runs and appending
 * with blank-line separation only when the talk page already exists.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguWarnUser.create(deps), returning { warnTarget }.
 *
 * DEPENDENCIES:
 * MediaWiki Title utility (window.mw.Title), plus apiPost, pageExists,
 * formatApiError, useIndonesian, and warnMessages passed in via deps.
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
    const warnMessages = deps.warnMessages;

    async function warnTarget(targetVal, config, isMultiTarget, callbacks) {
      const addLog = callbacks.addLog;
      const toolTag = callbacks.toolTag;

      const notifySummaryWarn =
        (useIndonesian
          ? "Notifikasi: Peringatan pengguna"
          : "Notification: User warning") + toolTag;

      const talkTitle = new mw.Title(targetVal, 3).getPrefixedText();
      // In multi-target runs, rebuild the notice with the current
      // target's name so each recipient is addressed correctly,
      // rather than reusing the pre-built text that contains the
      // primary target's name.
      let notice = config.warnNotice;
      if (isMultiTarget && config.warnTemplateValue) {
        for (const group of warnMessages) {
          if (!group.items) continue;
          const found = group.items.find(function (item) {
            return item.value === config.warnTemplateValue;
          });
          if (found) {
            notice = found.buildNotice(
              targetVal,
              config.warnExtra,
              config.warnFinal,
            );
            break;
          }
        }
      }

      try {
        const talkExists = await pageExists(talkTitle);
        await apiPost({
          action: "edit",
          title: talkTitle,
          appendtext: (talkExists ? "\n\n" : "") + notice,
          summary: notifySummaryWarn,
          bot: true,
        });
        addLog(`[Warn] Warning posted to: "${talkTitle}"`);
      } catch (e) {
        addLog(
          `[Warn] Failed to post warning to "${talkTitle}": ${formatApiError(e)}`,
          "warn",
        );
      }
    }

    return {
      warnTarget: warnTarget,
    };
  }

  window.TenguWarnUser = {
    create: create,
  };
})();
// </nowiki>
