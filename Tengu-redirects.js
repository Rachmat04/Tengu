/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Double-redirect helper module
 * ============================================================================
 * PURPOSE:
 * Fixes double redirects pointing to a moved page or its associated talk
 * page by updating them to point directly to the new destination title.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguRedirects.create(deps), returning
 * { fixDoubleRedirectsForMove }.
 *
 * DEPENDENCIES:
 * Helpers passed from Tengu.js: apiGet, apiPost, getRedirectMagicWords,
 * formatApiError, and the useIndonesian flag.
 *
 * ATTRIBUTION:
 * Based on User:WhitePhosphorus/all-in-one
 * (https://meta.wikimedia.org/wiki/User:WhitePhosphorus/all-in-one).
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
    const getRedirectMagicWords = deps.getRedirectMagicWords;
    const formatApiError = deps.formatApiError;
    const useIndonesian = deps.useIndonesian;

    // Fixes double redirects pointing to oldTitle by updating them to
    // point directly to newTitle. Shared by the main page and its
    // associated talk page in the Move page sub-mode of the Move page
    // section, since a redirect left behind at either title can leave
    // a double redirect. labelSuffix (e.g. " (talk page)") is appended
    // to log messages so it is clear which page a fixed redirect
    // relates to; pass "" for the main page.
    async function fixDoubleRedirectsForMove(
      oldTitle,
      newTitle,
      labelSuffix,
      opts,
    ) {
      const addLog = opts.addLog;
      const onRedirectFixed = opts.onRedirectFixed;
      const isAborted = opts.isAborted;
      const toolTag = opts.toolTag;
      const throttleMs = opts.throttleMs;

      try {
        const drData = await apiGet({
          action: "query",
          list: "backlinks",
          bltitle: oldTitle,
          blfilterredir: "redirects",
          bllimit: "max",
          formatversion: 2,
        });
        const redirectPages = (drData.query && drData.query.backlinks) || [];
        if (!redirectPages.length) {
          addLog(
            `[Move] No double redirects found pointing to${labelSuffix}: "${oldTitle}"`,
          );
          return;
        }
        // Detect the local wiki's redirect magic word(s) (e.g.
        // "#REDIRECT", "#ALIH") rather than assuming English.
        const redirectAliases = await getRedirectMagicWords();
        const redirectAliasPattern = redirectAliases
          .map(function (a) {
            return a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          })
          .join("|");
        for (const rdPage of redirectPages) {
          if (isAborted()) break;
          try {
            const revData = await apiGet({
              action: "query",
              prop: "revisions",
              titles: rdPage.title,
              rvprop: "content",
              rvslots: "main",
              formatversion: 2,
            });
            const page =
              revData.query && revData.query.pages && revData.query.pages[0];
            const slot =
              page &&
              page.revisions &&
              page.revisions[0] &&
              page.revisions[0].slots &&
              page.revisions[0].slots.main;
            if (!slot) continue;
            const wikitext = slot.content;

            // Matches "#REDIRECT [[Old title]]", optionally followed
            // by a section anchor (#Section) or a piped display text,
            // and rewrites only the title portion, preserving whatever
            // follows it.
            const escapedOld = oldTitle
              .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
              .replace(/[ _]/g, "[ _]");
            const redirRe = new RegExp(
              "((?:" +
                redirectAliasPattern +
                ")\\s*\\[\\[)\\s*" +
                escapedOld +
                "\\s*(\\]\\]|\\||#)",
              "i",
            );
            if (!redirRe.test(wikitext)) continue;
            const newWikitext = wikitext.replace(
              redirRe,
              function (match, prefix, tail) {
                return prefix + newTitle + tail;
              },
            );
            if (newWikitext === wikitext) continue;

            await apiPost({
              action: "edit",
              title: rdPage.title,
              text: newWikitext,
              summary:
                (useIndonesian
                  ? "Memperbaiki pengalihan ganda setelah pemindahan halaman: "
                  : "Fixing double redirect following page move: ") +
                oldTitle +
                " → " +
                newTitle +
                toolTag,
              bot: true,
            });
            addLog(
              `[Move] Fixed double redirect${labelSuffix}: "${rdPage.title}" now points directly to "${newTitle}"`,
            );
            onRedirectFixed();
          } catch (e) {
            addLog(
              `[Move] Failed to fix double redirect${labelSuffix} at "${rdPage.title}": ${formatApiError(e)}`,
              true,
            );
          }
          await new Promise((resolve) => setTimeout(resolve, throttleMs));
        }
      } catch (e) {
        addLog(
          `[Move] Failed to fetch redirects pointing to${labelSuffix} "${oldTitle}": ${formatApiError(e)}`,
          true,
        );
      }
    }

    return {
      fixDoubleRedirectsForMove: fixDoubleRedirectsForMove,
    };
  }

  window.TenguRedirects = {
    create: create,
  };
})();
// </nowiki>
