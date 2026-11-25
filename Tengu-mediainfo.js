/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — MediaInfo and revision metadata module
 * ============================================================================
 * PURPOSE:
 * Inspects the latest and parent revisions of an edited page to resolve the
 * previous editor's username, the main slot's content model (for ZObject
 * detection), and any structured-data (mediainfo slot) changes requiring
 * restoration during rollback/undo in Tengu.js.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguMediaInfo.create(deps), returning { inspectRevisionMetadata }.
 *
 * DEPENDENCIES:
 * Helpers passed in by Tengu.js: apiGet.
 * No direct dependencies on Tengu.js internals or DOM elements.
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

    const inspectRevisionMetadata = async function (info) {
      let mediainfoNeedsRevert = false;
      let goodMediaInfo = null;
      let pageId = null;
      // Content model of the current page's main slot. Set during the
      // revision fetch below; used to detect ZObject pages (Wikifunctions)
      // and choose the appropriate revert method.
      // ZObjects may not be reliably reverted via action=edit undo, since
      // the undo path depends on a wikitext three-way merge that may not
      // work for JSON-structured content.
      let pageContentModel = null;
      // Username of the author of the revision being reverted to (the
      // parent of the target's earliest edit in this batch). Used below
      // to make the undo edit summary clearer about which revision was
      // restored.
      let previousEditorUser = null;

      try {
        const revidsToFetch = info.oldestParent
          ? `${info.latest}|${info.oldestParent}`
          : `${info.latest}`;
        const compData = await apiGet({
          action: "query",
          prop: "revisions",
          revids: revidsToFetch,
          rvprop: "ids|content|user|contentmodel",
          rvslots: "mediainfo",
        });

        const pages = compData.query && compData.query.pages;
        if (pages) {
          pageId = Object.keys(pages)[0];
          const revs = pages[pageId].revisions;
          if (revs && revs.length > 0) {
            let latestMI = null;
            let oldestMI = null;
            for (const r of revs) {
              if (r.revid === info.oldestParent) {
                previousEditorUser = r.user || null;
              }
              if (r.revid === info.latest) {
                pageContentModel = r.contentmodel || null;
              }
              if (r.slots && r.slots.mediainfo) {
                if (r.revid === info.latest) latestMI = r.slots.mediainfo["*"];
                if (r.revid === info.oldestParent)
                  oldestMI = r.slots.mediainfo["*"];
              }
            }

            if (latestMI !== null && latestMI !== oldestMI) {
              mediainfoNeedsRevert = true;
              goodMediaInfo = oldestMI
                ? JSON.parse(oldestMI)
                : { statements: {} };
            }
          }
        }
      } catch (e) {
        // Gracefully ignore on wikis without Wikibase/MediaInfo configured,
        // or on pages/namespaces where the mediainfo slot is fundamentally unavailable.
        // This also covers ZObject pages on Wikifunctions, where the mediainfo
        // slot is absent; pageContentModel is set within the same try block and
        // is used separately below to choose the appropriate revert method.
        // previousEditorUser remains null in this case; the undo summary
        // falls back to its previous wording below.
      }

      return {
        mediainfoNeedsRevert: mediainfoNeedsRevert,
        goodMediaInfo: goodMediaInfo,
        pageId: pageId,
        pageContentModel: pageContentModel,
        previousEditorUser: previousEditorUser,
      };
    };

    return {
      inspectRevisionMetadata: inspectRevisionMetadata,
    };
  }

  window.TenguMediaInfo = {
    create: create,
  };
})();
// </nowiki>
