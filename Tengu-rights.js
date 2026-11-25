/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Current user rights helpers
 * ============================================================================
 * PURPOSE:
 * Provides session-cached lookups for the current user's local rights and
 * groups (getUserRightsInfo) and whether the current user holds the rollback
 * right on this wiki (hasRollbackRight).
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by Tengu.js before initialisation. Exposes window.TenguRights.create(deps),
 * which returns { getUserRightsInfo, hasRollbackRight }.
 *
 * DEPENDENCIES:
 * Expects deps.apiGet (from Tengu-api.js) to be passed into create().
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguRights = {
    create: function (deps) {
      const apiGet = deps.apiGet;

      // Shared, cached fetch of the current user's local rights and groups
      // (action=query&meta=userinfo&uiprop=rights|groups), used by both
      // hasRollbackRight() below and init()'s rightsPromise (Section 09).
      // This cache ensures the request is only ever made once per session
      // regardless of which caller needs it first.
      let userRightsInfoPromise = null;
      function getUserRightsInfo() {
        if (!userRightsInfoPromise) {
          userRightsInfoPromise = apiGet({
            action: "query",
            meta: "userinfo",
            uiprop: "rights|groups",
          })
            .then(function (data) {
              const ui = data && data.query && data.query.userinfo;
              return {
                rights: (ui && ui.rights) || [],
                groups: (ui && ui.groups) || [],
              };
            })
            .catch(function () {
              return { rights: [], groups: [] };
            });
        }
        return userRightsInfoPromise;
      }

      // Cached check for whether the current user holds the rollback right
      // on this wiki, fetched once and reused for the rest of the session.
      // Used by the inline "[⛩️ rollback]" action (Section 09b) to decide
      // ahead of time whether the link will perform native rollback or fall
      // back to an equivalent undo.
      let rollbackRightPromise = null;
      function hasRollbackRight() {
        if (!rollbackRightPromise) {
          rollbackRightPromise = getUserRightsInfo()
            .then(function (info) {
              return info.rights.indexOf("rollback") !== -1;
            })
            .catch(function () {
              // Assume no rollback right if the check fails; the existing
              // permissiondenied fallback inside runQuickRevert() still
              // applies either way.
              return false;
            });
        }
        return rollbackRightPromise;
      }

      return {
        getUserRightsInfo: getUserRightsInfo,
        hasRollbackRight: hasRollbackRight,
      };
    },
  };
})();
// </nowiki>
