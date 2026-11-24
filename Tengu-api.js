/**
 * ============================================================================
 * Tengu — 天狗
 * Shared MediaWiki API wrappers and page-existence helper
 * ============================================================================
 * PURPOSE:
 * Provides a shared mw.Api instance, promisified request wrappers (apiGet,
 * apiPost, apiRollback), and the pageExists() helper used across Tengu.js.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes window.TenguAPI.create(),
 * returning { api, apiGet, apiPost, apiRollback, pageExists }.
 *
 * DEPENDENCIES:
 * MediaWiki ResourceLoader module "mediawiki.api" (window.mw.Api).
 * No dependencies on Tengu.js internals.
 *
 * ATTRIBUTION:
 * Based on User:WhitePhosphorus/all-in-one (https://meta.wikimedia.org/wiki/User:WhitePhosphorus/all-in-one).
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  function create() {
    const api = new mw.Api();

    const apiGet = (params) =>
      new Promise((resolve, reject) => {
        api
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

    const apiPost = (params) =>
      new Promise((resolve, reject) => {
        api
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

    const apiRollback = (title, user, params) =>
      new Promise((resolve, reject) => {
        api
          .rollback(title, user, params)
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

    // Checks whether a page currently exists. Used before posting a
    // notification to a talk page: an existing page may already contain
    // earlier discussion, so two blank lines keep the new notice visually
    // separated from it, but a page that does not exist yet should not
    // start with leading blank lines.
    const pageExists = async (title) => {
      try {
        const data = await apiGet({
          action: "query",
          titles: title,
          formatversion: 2,
        });
        const page = data.query && data.query.pages && data.query.pages[0];
        return !!(page && !page.missing);
      } catch (e) {
        // If the check fails, assume the page exists so the existing
        // separator behaviour is kept rather than risking a malformed post.
        return true;
      }
    };

    return {
      api: api,
      apiGet: apiGet,
      apiPost: apiPost,
      apiRollback: apiRollback,
      pageExists: pageExists,
    };
  }

  window.TenguAPI = {
    create: create,
  };
})();
// </nowiki>
