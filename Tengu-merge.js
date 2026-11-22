/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Merge items module
 * ============================================================================
 * PURPOSE:
 * Provides the Wikidata API helpers used by the "Merge items" section:
 * fetching entities, detecting sitelink conflicts, merging items or lexemes,
 * and creating a redirect after an item merge.
 * Consumed by Tengu.js; exposes window.TenguMerge.create().
 *
 * The module has no dependencies on Tengu.js internals. It only uses the
 * MediaWiki globals (mw.loader, mw.ForeignApi).
 *
 * The Merge items section itself (its interface and its call sites in work())
 * stays in Tengu.js.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
window.TenguMerge = {
  /**
   * Returns the merge helper functions.
   *
   * @returns {Object}  Object containing fetchWikidataEntities,
   *   detectWikidataMergeConflicts, mergeWikidataEntities and
   *   createWikidataRedirect.
   */
  create: function () {
    // Loads mw.ForeignApi and returns an instance pointed at Wikidata, so the
    // feature works regardless of which wiki Tengu is open on.
    function getWikidataForeignApi() {
      return new Promise((resolve, reject) => {
        mw.loader.using(
          "mediawiki.ForeignApi",
          function () {
            try {
              resolve(new mw.ForeignApi("https://www.wikidata.org/w/api.php"));
            } catch (e) {
              reject(e);
            }
          },
          reject,
        );
      });
    }

    // Promisified GET/POST wrappers against the Wikidata API.
    // postWithEditToken() handles the Wikibase edit token automatically.
    async function wikidataApiGet(params) {
      const foreignApi = await getWikidataForeignApi();
      return new Promise((resolve, reject) => {
        foreignApi
          .get(params)
          .done(resolve)
          .fail((code, err) =>
            reject(
              code +
                (err && err.error && err.error.info
                  ? ": " + err.error.info
                  : ""),
            ),
          );
      });
    }
    async function wikidataApiPost(params) {
      const foreignApi = await getWikidataForeignApi();
      return new Promise((resolve, reject) => {
        foreignApi
          .postWithEditToken(params)
          .done(resolve)
          .fail((code, err) =>
            reject(
              code +
                (err && err.error && err.error.info
                  ? ": " + err.error.info
                  : ""),
            ),
          );
      });
    }

    // Fetches full entity data for a list of Wikidata entity IDs
    // (items or lexemes). Adapted from getItems() in the standalone
    // Wikidata Merge.js gadget.
    async function fetchWikidataEntities(ids) {
      const data = await wikidataApiGet({
        action: "wbgetentities",
        ids: ids.join("|"),
      });
      return Object.keys(data.entities || {}).map(function (k) {
        return data.entities[k];
      });
    }

    // Detects sitelink conflicts between two Wikidata entities: cases where
    // both entities link to a page on the same wiki with a different title.
    // Adapted from detectConflicts() in the standalone Wikidata Merge.js
    // gadget. Returns a map of dbName -> conflicting entities, empty when
    // there are no conflicts.
    function detectWikidataMergeConflicts(items) {
      const all = {};
      const conflicts = {};
      items.forEach(function (item) {
        if (!item.sitelinks) return;
        Object.keys(item.sitelinks).forEach(function (dbName) {
          if (
            all[dbName] &&
            all[dbName].sitelinks[dbName].title !== item.sitelinks[dbName].title
          ) {
            if (!conflicts[dbName]) conflicts[dbName] = [all[dbName]];
            conflicts[dbName].push(item);
          }
          all[dbName] = item;
        });
      });
      return conflicts;
    }

    // Merges one Wikidata entity into another. Items (Q-prefixed) use
    // wbmergeitems; lexemes (L-prefixed) use wblmergelexemes, which redirects
    // the source lexeme as part of the merge itself, unlike items, which need
    // a separate redirect step. Adapted from mergeApi() in the standalone
    // Wikidata Merge.js gadget.
    async function mergeWikidataEntities(fromId, toId, summaryText) {
      const isLexeme = fromId.charAt(0).toUpperCase() === "L";
      const params = isLexeme
        ? {
            action: "wblmergelexemes",
            source: fromId,
            target: toId,
            tags: "gadget-merge",
          }
        : {
            action: "wbmergeitems",
            fromid: fromId,
            toid: toId,
            ignoreconflicts: "description",
            tags: "gadget-merge",
          };
      params.summary = summaryText;
      return wikidataApiPost(params);
    }

    // Creates a redirect from a (now-emptied) Wikidata item to another.
    // The source item must be cleared first, since wbcreateredirect refuses
    // to redirect an item that still holds data. Not used for lexemes.
    // Adapted from createRedirect() in the standalone Wikidata Merge.js gadget.
    async function createWikidataRedirect(fromId, toId) {
      await wikidataApiPost({
        action: "wbeditentity",
        id: fromId,
        clear: true,
        summary: "Clearing item to prepare for redirect",
        tags: "gadget-merge",
        data: "{}",
      });
      return wikidataApiPost({
        action: "wbcreateredirect",
        from: fromId,
        to: toId,
      });
    }

    return {
      fetchWikidataEntities: fetchWikidataEntities,
      detectWikidataMergeConflicts: detectWikidataMergeConflicts,
      mergeWikidataEntities: mergeWikidataEntities,
      createWikidataRedirect: createWikidataRedirect,
    };
  },
};
