/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Fix redirects module
 * ============================================================================
 * PURPOSE:
 * Executes the Fix redirects workflow, locating pages linking to a redirect
 * target via backlinks and rewriting their wikilinks to point directly to the
 * specified destination page while preserving section anchors and display text.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguFixRedirects.create(deps), returning { fixRedirectsTarget }.
 *
 * DEPENDENCIES:
 * The apiGet, apiPost, withToolTag, and formatApiError helpers passed in by
 * Tengu.js.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  function create(deps) {
    const { apiGet, apiPost, withToolTag, formatApiError } = deps;

    async function fixRedirectsTarget(targetVal, config, callbacks) {
      const {
        addLog,
        onRedirectFixed,
        processedTitles,
        isAborted,
        toolTag,
        throttleMs,
      } = callbacks;

      const sourceTitle = targetVal;
      const destTitle = config.fixRedirectsDest;

      if (!destTitle) {
        addLog("[Fix redirects] No destination specified; skipping.", "warn");
        return;
      }

      const escapedSource = sourceTitle
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/[ _]/g, "[ _]");
      // Group 1: section anchor (optional). Group 2: display text (optional).
      const linkRe = new RegExp(
        "\\[\\[\\s*" +
          escapedSource +
          "\\s*(#[^|\\]]*)?(?:\\|([^\\]]*?))?\\]\\]",
        "gi",
      );

      addLog(
        `[Fix redirects] Searching for pages linking to: "${sourceTitle}"...`,
      );

      let blContinue;
      do {
        if (isAborted()) break;
        const blParams = {
          action: "query",
          list: "backlinks",
          bltitle: sourceTitle,
          bllimit: 50,
          formatversion: 2,
        };
        if (blContinue) blParams.blcontinue = blContinue;
        try {
          const blData = await apiGet(blParams);
          blContinue = blData.continue && blData.continue.blcontinue;
          const links = (blData.query && blData.query.backlinks) || [];
          for (const link of links) {
            if (isAborted()) break;
            const linkTitle = link.title;
            if (processedTitles.has(linkTitle)) continue;
            try {
              const revData = await apiGet({
                action: "query",
                prop: "revisions",
                titles: linkTitle,
                rvprop: "content",
                rvslots: "main",
                formatversion: 2,
              });
              const page =
                revData.query && revData.query.pages && revData.query.pages[0];
              if (!page || page.missing) {
                processedTitles.add(linkTitle);
                continue;
              }
              const slot =
                page.revisions &&
                page.revisions[0] &&
                page.revisions[0].slots &&
                page.revisions[0].slots.main;
              if (!slot) {
                processedTitles.add(linkTitle);
                continue;
              }
              const wikitext = slot.content;
              // Replace [[A]], [[A|text]], [[A#section]], [[A#section|text]]
              // with the equivalent link pointing to destTitle.
              const newWikitext = wikitext.replace(
                linkRe,
                function (match, section, displayText) {
                  const sec = section || "";
                  if (displayText !== undefined) {
                    return "[[" + destTitle + sec + "|" + displayText + "]]";
                  }
                  return "[[" + destTitle + sec + "]]";
                },
              );
              if (newWikitext === wikitext) {
                processedTitles.add(linkTitle);
                continue;
              }
              await apiPost({
                action: "edit",
                title: linkTitle,
                text: newWikitext,
                summary: withToolTag(config.fixRedirectsReason, toolTag),
                bot: true,
              });
              addLog(`[Fix redirects] Updated links in: "${linkTitle}"`);
              onRedirectFixed();
            } catch (e) {
              addLog(
                `[Fix redirects] Failed to update "${linkTitle}": ${formatApiError(e)}`,
                true,
              );
            }
            processedTitles.add(linkTitle);
            await new Promise((resolve) => setTimeout(resolve, throttleMs));
          }
        } catch (e) {
          addLog(
            `[Fix redirects] Failed to fetch backlinks for "${sourceTitle}": ${formatApiError(e)}`,
            true,
          );
          break;
        }
      } while (blContinue && !isAborted());
    }

    return {
      fixRedirectsTarget: fixRedirectsTarget,
    };
  }

  window.TenguFixRedirects = {
    create: create,
  };
})();
// </nowiki>
