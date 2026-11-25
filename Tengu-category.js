/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Category member operations module
 * ============================================================================
 * PURPOSE:
 * Rewrites or removes explicit category tags in member pages when a category
 * is moved ("Also move the pages in the category") or deleted ("Remove this
 * category from its member pages").
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguCategory.create(deps), returning
 * { moveCategoryMembers, removeDeletedCategoryFromMembers }.
 *
 * DEPENDENCIES:
 * MediaWiki mw.Title and the apiGet, apiPost, getCategoryNamespaceAliases,
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
    const getCategoryNamespaceAliases = deps.getCategoryNamespaceAliases;
    const formatApiError = deps.formatApiError;
    const useIndonesian = deps.useIndonesian;

    // Moves the members of a category to another category by rewriting
    // the explicit category tag in each member's wikitext, so the source
    // category is left empty. Members are collected first and edited
    // afterwards, so the list does not change while it is being read.
    // Members that reach the category through a template have no
    // explicit tag to rewrite; these are logged as warnings and left
    // unchanged.
    async function moveCategoryMembers(sourceTitle, destTitle, opts) {
      const addLog = opts.addLog;
      const onRecategorized = opts.onRecategorized;
      const isAborted = opts.isAborted;
      const toolTag = opts.toolTag;
      const throttleMs = opts.throttleMs;

      let sourceObj;
      let destObj;
      try {
        sourceObj = new mw.Title(sourceTitle);
        destObj = new mw.Title(destTitle);
      } catch (e) {
        addLog(
          `[Move] Skipped moving category members: could not parse "${sourceTitle}" or "${destTitle}"`,
          "warn",
        );
        return;
      }
      if (
        sourceObj.getNamespaceId() !== 14 ||
        destObj.getNamespaceId() !== 14
      ) {
        addLog(
          "[Move] Skipped moving category members: both the source and the destination must be categories",
          "warn",
        );
        return;
      }

      const oldName = sourceObj.getMainText();
      const newName = destObj.getMainText();
      const destPrefixed = destObj.getPrefixedText();
      const categorySummary =
        (useIndonesian
          ? `Memindahkan halaman dari [[:Kategori:${oldName}]] ke [[:Kategori:${newName}]]`
          : `Moving pages from [[:Category:${oldName}]] to [[:Category:${newName}]]`) +
        toolTag;

      // Collect every member (pages, subcategories, and files).
      const memberTitles = [];
      let cmContinue;
      do {
        if (isAborted()) return;
        const params = {
          action: "query",
          list: "categorymembers",
          cmtitle: sourceTitle,
          cmlimit: "max",
          cmprop: "title",
          formatversion: 2,
        };
        if (cmContinue) params.cmcontinue = cmContinue;
        try {
          const data = await apiGet(params);
          cmContinue = data.continue && data.continue.cmcontinue;
          const members = (data.query && data.query.categorymembers) || [];
          members.forEach(function (m) {
            memberTitles.push(m.title);
          });
        } catch (e) {
          addLog(
            `[Move] Failed to list members of "${sourceTitle}": ${formatApiError(e)}`,
            true,
          );
          return;
        }
      } while (cmContinue);

      if (!memberTitles.length) {
        addLog(`[Move] No members found in "${sourceTitle}"`, "warn");
        return;
      }

      const nsAliases = await getCategoryNamespaceAliases();
      const nsPattern = nsAliases
        .map(function (a) {
          return a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("|");
      const escapedOld = oldName
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/[ _]/g, "[ _]");
      // Matches [[Category:Old]] and [[Category:Old|sort key]]. A link
      // such as [[:Category:Old]] is not a membership tag and is not
      // matched. Group 1 keeps the sort key, if any.
      const tagRe = new RegExp(
        "\\[\\[\\s*(?:" +
          nsPattern +
          ")\\s*:\\s*" +
          escapedOld +
          "\\s*(\\|[^\\]]*)?\\]\\]",
        "gi",
      );

      addLog(
        `[Move] Moving ${memberTitles.length} member(s) of "${sourceTitle}" to "${destTitle}"...`,
      );

      for (const memberTitle of memberTitles) {
        if (isAborted()) break;
        try {
          const revData = await apiGet({
            action: "query",
            prop: "revisions",
            titles: memberTitle,
            rvprop: "content",
            rvslots: "main",
            formatversion: 2,
          });
          const page =
            revData.query && revData.query.pages && revData.query.pages[0];
          const slot =
            page &&
            !page.missing &&
            page.revisions &&
            page.revisions[0] &&
            page.revisions[0].slots &&
            page.revisions[0].slots.main;
          if (!slot) continue;
          const wikitext = slot.content;
          const newWikitext = wikitext.replace(
            tagRe,
            function (match, sortKey) {
              return "[[" + destPrefixed + (sortKey || "") + "]]";
            },
          );
          if (newWikitext === wikitext) {
            addLog(
              `[Move] No explicit category tag found in "${memberTitle}"; it may be categorised through a template`,
              "warn",
            );
            continue;
          }
          await apiPost({
            action: "edit",
            title: memberTitle,
            text: newWikitext,
            summary: categorySummary,
            bot: true,
          });
          addLog(`[Move] Moved "${memberTitle}" to "${destTitle}"`);
          onRecategorized();
        } catch (e) {
          addLog(
            `[Move] Failed to update "${memberTitle}": ${formatApiError(e)}`,
            true,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, throttleMs));
      }
    }

    // Removes the category tag for a just-deleted category from each
    // of its current member pages, so they do not retain a link to a
    // category that has just been deleted. Members are collected via
    // list=categorymembers (paginated) before any edits are made, so
    // the list reflects membership at the time of deletion rather than
    // changing mid-run. Only the tag matching the deleted category
    // (including any sort key) is removed from each page; other
    // category links are left untouched. Members categorised through a
    // template have no explicit tag to remove and are logged as
    // warnings, following the same pattern as moveCategoryMembers()
    // above. Only ever called for a single (non-multi-target)
    // Category-namespace deletion target — see
    // updatePagedelUncategorizeAvailability().
    async function removeDeletedCategoryFromMembers(catTitle, opts) {
      const addLog = opts.addLog;
      const onUncategorized = opts.onUncategorized;
      const isAborted = opts.isAborted;
      const toolTag = opts.toolTag;
      const throttleMs = opts.throttleMs;

      let catObj;
      try {
        catObj = new mw.Title(catTitle);
      } catch (e) {
        addLog(
          `[Delete] Skipped removing category from members: could not parse "${catTitle}"`,
          "warn",
        );
        return;
      }
      if (catObj.getNamespaceId() !== 14) return;

      const catName = catObj.getMainText();
      const memberTitles = [];
      let cmContinue;
      do {
        if (isAborted()) return;
        const params = {
          action: "query",
          list: "categorymembers",
          cmtitle: catTitle,
          cmlimit: "max",
          cmprop: "title",
          formatversion: 2,
        };
        if (cmContinue) params.cmcontinue = cmContinue;
        try {
          const data = await apiGet(params);
          cmContinue = data.continue && data.continue.cmcontinue;
          const members = (data.query && data.query.categorymembers) || [];
          members.forEach(function (m) {
            memberTitles.push(m.title);
          });
        } catch (e) {
          addLog(
            `[Delete] Failed to list members of "${catTitle}": ${formatApiError(e)}`,
            true,
          );
          return;
        }
      } while (cmContinue);

      if (!memberTitles.length) {
        addLog(`[Delete] No member pages found in "${catTitle}"`, "warn");
        return;
      }

      const nsAliases = await getCategoryNamespaceAliases();
      const nsPattern = nsAliases
        .map(function (a) {
          return a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("|");
      const escapedName = catName
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/[ _]/g, "[ _]");
      // Matches [[Category:Name]] and [[Category:Name|sort key]],
      // including a trailing newline so removal does not leave a blank
      // line behind. A link such as [[:Category:Name]] is not a
      // membership tag and is not matched.
      const tagRe = new RegExp(
        "[ \\t]*\\[\\[\\s*(?:" +
          nsPattern +
          ")\\s*:\\s*" +
          escapedName +
          "\\s*(?:\\|[^\\]]*)?\\]\\]\\n?",
        "gi",
      );

      const uncatSummary =
        (useIndonesian
          ? "Menghapus kategori yang telah dihapus dari halaman ini: "
          : "Removing deleted category from this page: ") +
        catName +
        toolTag;

      addLog(
        `[Delete] Removing "${catTitle}" from ${memberTitles.length} member page(s)...`,
      );

      for (const memberTitle of memberTitles) {
        if (isAborted()) break;
        try {
          const revData = await apiGet({
            action: "query",
            prop: "revisions",
            titles: memberTitle,
            rvprop: "content",
            rvslots: "main",
            formatversion: 2,
          });
          const page =
            revData.query && revData.query.pages && revData.query.pages[0];
          const slot =
            page &&
            !page.missing &&
            page.revisions &&
            page.revisions[0] &&
            page.revisions[0].slots &&
            page.revisions[0].slots.main;
          if (!slot) continue;
          const wikitext = slot.content;
          const newWikitext = wikitext.replace(tagRe, "");
          if (newWikitext === wikitext) {
            addLog(
              `[Delete] No explicit category tag found in "${memberTitle}"; it may be categorised through a template`,
              "warn",
            );
            continue;
          }
          await apiPost({
            action: "edit",
            title: memberTitle,
            text: newWikitext,
            summary: uncatSummary,
            bot: true,
          });
          addLog(
            `[Delete] Removed category "${catTitle}" from: "${memberTitle}"`,
          );
          onUncategorized();
        } catch (e) {
          addLog(
            `[Delete] Failed to remove category from "${memberTitle}": ${formatApiError(e)}`,
            true,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, throttleMs));
      }
    }

    return {
      moveCategoryMembers: moveCategoryMembers,
      removeDeletedCategoryFromMembers: removeDeletedCategoryFromMembers,
    };
  }

  window.TenguCategory = {
    create: create,
  };
})();
// </nowiki>
