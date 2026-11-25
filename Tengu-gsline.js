/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Global sysops report line builder module
 * ============================================================================
 * PURPOSE:
 * Builds the wikitext bullet entry submitted to Meta-Wiki's
 * Global sysops/Requests page for a target user, IP address, temporary
 * account, or page.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguGSLine.create(deps), returning { buildGSLineForTarget }.
 *
 * DEPENDENCIES:
 * MediaWiki ResourceLoader module "mediawiki.util" (mw.util.isIPAddress) and
 * the getInterwikiPrefix helper passed in by Tengu.js.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  function create(deps) {
    const getInterwikiPrefix = deps.getInterwikiPrefix;

    // Builds the wikitext line for a Global sysops/Requests report for
    // a specific target. Called per-target inside the targets loop so
    // every account or page in a multi-target run receives its own
    // individual entry on the report page.
    function buildGSLineForTarget(target, config) {
      const prefix = getInterwikiPrefix();
      const _isTargetIP = mw.util.isIPAddress(target);
      const _isTempAccount = /^~\d{4}-\d+-\d+$/.test(target);
      const reasonText = config.reportGSReasonText;
      if (config.mode === "page") {
        const requestVerb =
          config.reportGSPageType === "protect"
            ? "Please protect"
            : config.reportGSPageType === "revdel"
              ? "Please delete revisions from"
              : "Please delete";
        const pageLink = prefix
          ? "[[:" + prefix + target + "|" + target + "]]"
          : "[[:" + target + "]]";
        return (
          "* " + requestVerb + " " + pageLink + ": " + reasonText + " ~~~~"
        );
      }
      let userLink;
      if (_isTargetIP || _isTempAccount) {
        userLink = prefix
          ? "[[:" +
            prefix +
            "Special:Contributions/" +
            target +
            "|" +
            target +
            "]]"
          : "[[Special:Contributions/" + target + "|" + target + "]]";
      } else {
        userLink = prefix
          ? "{{LockHide|1=" + target + "|2=" + prefix + "}}"
          : "{{LockHide|1=" + target + "}}";
      }
      return "* Please block " + userLink + ": " + reasonText + " ~~~~";
    }

    return {
      buildGSLineForTarget: buildGSLineForTarget,
    };
  }

  window.TenguGSLine = {
    create: create,
  };
})();
// </nowiki>
