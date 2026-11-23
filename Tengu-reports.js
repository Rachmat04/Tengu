/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Meta-Wiki reports module
 * ============================================================================
 * PURPOSE:
 * Provides the helpers that submit reports and requests to Meta-Wiki:
 * Global sysops/Requests, Steward requests/Global, and Steward
 * requests/Permissions. Also provides foreignApiGet(), a GET wrapper for the
 * Meta-Wiki API that is shared with other modules through Tengu.js.
 * Consumed by Tengu.js; exposes window.TenguReports.create().
 *
 * The module has no dependencies on Tengu.js internals. It only uses the
 * MediaWiki globals (mw.loader, mw.ForeignApi).
 *
 * The report sections themselves (their interface, validation and call sites
 * in work()) stay in Tengu.js.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguReports = {
    /**
     * Returns the Meta-Wiki report helpers.
     *
     * @returns {Object}  Object containing PERM_REQUEST_TYPES,
     *   foreignApiGet, submitGlobalSysopsReport, submitSRGReport and
     *   submitPermissionRequest.
     */
    create: function () {
      // Loads mw.ForeignApi and returns an instance pointed at Meta-Wiki.
      function getMetaForeignApi() {
        return new Promise((resolve, reject) => {
          mw.loader.using(
            "mediawiki.ForeignApi",
            function () {
              try {
                resolve(
                  new mw.ForeignApi("https://meta.wikimedia.org/w/api.php"),
                );
              } catch (e) {
                reject(e);
              }
            },
            reject,
          );
        });
      }

      // Fetches a promisified GET response from Meta-Wiki via
      // mw.ForeignApi. Used to read page content for duplicate-report
      // checks before submitting to a cross-wiki venue.
      async function foreignApiGet(params) {
        const foreignApi = await getMetaForeignApi();
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

      // Appends a pre-built report line to the bottom of Meta-Wiki's
      // Global sysops/Requests page via action=edit + appendtext, avoiding
      // a separate fetch-then-save round trip. Not marked as a bot edit, so
      // the report stays visible in normal recent-changes views.
      // summaryText is built by the caller so it can reflect whether an
      // account or a page is being reported.
      // Checks whether a report referencing the given target already
      // appears to be open on Global sysops/Requests before submitting,
      // mirroring the equivalent safeguard used by submitSRGReport() for
      // Steward requests/Global. Unlike SRG, Global sysops/Requests reports
      // have no {{Status}} template to anchor against, so the check instead
      // looks for the target as a whole word within an existing report
      // bullet line ("* Please ..."). This heuristic may miss a duplicate if
      // the target is phrased differently in an older entry (e.g. a
      // different interwiki prefix), or very rarely flag a false positive if
      // the target string appears inside an unrelated bullet line.
      async function submitGlobalSysopsReport(reportLine, summaryText, target) {
        const data = await foreignApiGet({
          action: "query",
          prop: "revisions",
          titles: "Global sysops/Requests",
          rvslots: "main",
          rvprop: "content",
          formatversion: 2,
        });
        const page = data.query && data.query.pages && data.query.pages[0];
        const content =
          (page &&
            page.revisions &&
            page.revisions[0] &&
            page.revisions[0].slots &&
            page.revisions[0].slots.main &&
            page.revisions[0].slots.main.content) ||
          "";

        const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const dupRe = new RegExp("^\\*.*\\b" + escapedTarget + "\\b", "im");
        if (dupRe.test(content)) {
          throw new Error(
            "a report for " +
              target +
              " already appears to be open on Global sysops/Requests",
          );
        }

        const foreignApi = await getMetaForeignApi();
        await new Promise((resolve, reject) => {
          foreignApi
            .postWithEditToken({
              action: "edit",
              title: "Global sysops/Requests",
              appendtext: "\n" + reportLine,
              summary: summaryText,
            })
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

      // Title of the Steward requests/Global (SRG) page on Meta-Wiki.
      const SRG_PAGE_TITLE = "Steward requests/Global";

      // Section headings used as insertion anchors on the SRG page. A new
      // global block request is inserted immediately above the heading
      // that starts the lock section (i.e. at the end of the block
      // section); a new global lock request is inserted immediately above
      // the "See also" heading near the foot of the page (i.e. at the end
      // of the lock section).
      const SRG_INSERT_BEFORE = {
        block: "== Requests for global (un)lock and (un)hiding ==",
        lock: "== See also ==",
      };

      // Submits a report to Steward requests/Global, inserting the new
      // section immediately above the relevant anchor heading rather than
      // appending to the bottom of the page (cf. submitGlobalSysopsReport()
      // above, which appends to the very end of Global sysops/Requests).
      // Throws, without submitting, if a report referencing the same
      // target already appears to be open, to reduce the chance of
      // duplicate filings.
      async function submitSRGReport(
        kind,
        targets,
        sectionWikitext,
        summaryText,
      ) {
        const data = await foreignApiGet({
          action: "query",
          prop: "revisions",
          titles: SRG_PAGE_TITLE,
          rvslots: "main",
          rvprop: "content",
          formatversion: 2,
        });
        const page = data.query && data.query.pages && data.query.pages[0];
        const content =
          (page &&
            page.revisions &&
            page.revisions[0] &&
            page.revisions[0].slots &&
            page.revisions[0].slots.main &&
            page.revisions[0].slots.main.content) ||
          "";

        // Check every target in a multi-target report, not just the
        // primary one, so a secondary target with an already-open report
        // is also caught rather than being silently re-filed.
        const targetList = Array.isArray(targets) ? targets : [targets];
        for (const target of targetList) {
          const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const dupRe = new RegExp(
            "\\{\\{(?:Status|LockHide|MultiLock|Luxotool)[^}]*\\b" +
              escapedTarget +
              "\\b",
            "i",
          );
          if (dupRe.test(content)) {
            throw new Error(
              "a report for " +
                target +
                " already appears to be open on Steward requests/Global",
            );
          }
        }

        const anchor = SRG_INSERT_BEFORE[kind];
        const anchorIndex = content.indexOf(anchor);
        let newContent;
        if (anchorIndex === -1) {
          // Anchor heading not found; fall back to appending at the end
          // rather than failing outright.
          newContent =
            content.replace(/\s*$/, "") + "\n\n" + sectionWikitext + "\n";
        } else {
          newContent =
            content.slice(0, anchorIndex) +
            sectionWikitext +
            "\n\n" +
            content.slice(anchorIndex);
        }

        const foreignApi = await getMetaForeignApi();
        await new Promise((resolve, reject) => {
          foreignApi
            .postWithEditToken({
              action: "edit",
              title: SRG_PAGE_TITLE,
              text: newContent,
              summary: summaryText,
            })
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

      // Permission types supported by the "Request permissions" feature,
      // mapped to the subsection heading used on Meta-Wiki's Steward
      // requests/Permissions page.
      const PERM_REQUEST_TYPES = {
        administrator: {
          label: "Administrator",
          heading: "Administrator access",
        },
        interfaceadmin: {
          label: "Interface administrator",
          heading: "Interface administrator access",
        },
        bureaucrat: {
          label: "Bureaucrat",
          heading: "Bureaucrat access",
        },
        checkuser: {
          label: "CheckUser",
          heading: "CheckUser access",
        },
        oversight: {
          label: "Oversight",
          heading: "Oversight access",
        },
      };
      const PERM_PAGE_TITLE = "Steward requests/Permissions";

      // Inserts a permission request at the end of the matching subsection
      // (inside "== Requests ==") of Meta-Wiki's Steward requests/Permissions
      // page, rather than appending it to the end of the page. The page is
      // read first and the edit is sent with the revision timestamp as
      // basetimestamp, so MediaWiki reports an edit conflict if the page
      // changed in between. Throws on any failure, including an
      // unsuccessful edit result, so a failure is never reported as success.
      async function submitPermissionRequest(
        typeKey,
        username,
        requestText,
        summaryText,
        domain,
      ) {
        const info = PERM_REQUEST_TYPES[typeKey];
        if (!info) throw new Error("unknown permission type");

        const data = await foreignApiGet({
          action: "query",
          prop: "revisions",
          titles: PERM_PAGE_TITLE,
          rvslots: "main",
          rvprop: "content|timestamp",
          formatversion: 2,
        });
        const page = data.query && data.query.pages && data.query.pages[0];
        const rev = page && page.revisions && page.revisions[0];
        const content =
          rev && rev.slots && rev.slots.main && rev.slots.main.content;
        if (typeof content !== "string" || !rev.timestamp) {
          throw new Error("could not read " + PERM_PAGE_TITLE);
        }

        const reqMatch = /^==[ \t]*Requests[ \t]*==[ \t]*$/m.exec(content);
        if (!reqMatch) {
          throw new Error('the "Requests" section was not found');
        }
        const afterReq = reqMatch.index + reqMatch[0].length;
        const escHeading = info.heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const subRe = new RegExp(
          "^===[ \\t]*" + escHeading + "[ \\t]*===[ \\t]*$",
          "m",
        );
        const subMatch = subRe.exec(content.slice(afterReq));
        if (!subMatch) {
          throw new Error(
            'the "' + info.heading + '" subsection was not found',
          );
        }
        const subStart = afterReq + subMatch.index + subMatch[0].length;
        // The subsection ends at the next level 2 or level 3 heading.
        // Level 4 headings are individual requests and stay inside it.
        const nextHeading = /^={2,3}[^=\n][^\n]*$/m.exec(
          content.slice(subStart),
        );
        const subEnd = nextHeading
          ? subStart + nextHeading.index
          : content.length;

        // Duplicate check. The subsection already matches the requested
        // permission type, so only requests under the same heading are
        // compared. Within it, each existing {{sr-request}} is parsed and
        // flagged only when its username and domain both match. The same
        // username may have separate requests for other domains.
        const subText = content.slice(subStart, subEnd);
        const normUser = function (s) {
          return String(s || "")
            .replace(/_/g, " ")
            .trim()
            .toLowerCase();
        };
        const normDomain = function (s) {
          return String(s || "")
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/\.org$/, "");
        };
        const readParam = function (block, name) {
          const m = new RegExp("\\|\\s*" + name + "\\s*=([^\\n|]*)", "i").exec(
            block.replace(/<!--[\s\S]*?-->/g, ""),
          );
          return m ? m[1].trim() : "";
        };
        const wantUser = normUser(username);
        const wantDomain = normDomain(domain);
        const explainRule =
          " Tengu only flags a request when the username, the domain, and the permission type all match; requests for a different domain or permission type are allowed.";

        const blockRe = /\{\{\s*sr-request\b([\s\S]*?)\}\}/gi;
        let blockMatch;
        while ((blockMatch = blockRe.exec(subText)) !== null) {
          const block = blockMatch[1];
          if (normUser(readParam(block, "user name")) !== wantUser) continue;
          const existingDomain = normDomain(readParam(block, "domain"));
          // Different domain: a distinct request, so it is allowed.
          if (existingDomain && wantDomain && existingDomain !== wantDomain) {
            continue;
          }
          const existingStatus = readParam(block, "status");
          const existingDiscussion = readParam(block, "discussion");
          const details = [];
          if (existingStatus) details.push("status: " + existingStatus);
          if (existingDiscussion)
            details.push("discussion: " + existingDiscussion);
          throw new Error(
            'possible duplicate: a request for "' +
              username +
              '" ' +
              (existingDomain
                ? 'for the domain "' + existingDomain + '"'
                : "(the domain is not stated in the existing request)") +
              ' already appears under "' +
              info.heading +
              '" on ' +
              PERM_PAGE_TITLE +
              (details.length ? " (" + details.join("; ") + ")" : "") +
              "." +
              explainRule,
          );
        }

        // Existing behaviour, kept for entries that are not {{sr-request}}
        // blocks: match on the username alone, since no domain can be read.
        const escUser = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const legacyDupRe = new RegExp(
          "\\|\\s*user name\\s*=\\s*" + escUser + "\\s*(?:\\n|\\|)",
          "i",
        );
        if (legacyDupRe.test(subText.replace(blockRe, ""))) {
          throw new Error(
            'possible duplicate: a request for "' +
              username +
              '" already appears under "' +
              info.heading +
              '" on ' +
              PERM_PAGE_TITLE +
              ", but its domain could not be read, so it could not be compared with this request.",
          );
        }

        const before = content.slice(0, subEnd).replace(/\s+$/, "");
        const after = content.slice(subEnd).replace(/^\s+/, "");
        const newContent =
          before + "\n\n" + requestText + (after ? "\n\n" + after : "\n");

        const foreignApi = await getMetaForeignApi();
        const result = await new Promise((resolve, reject) => {
          foreignApi
            .postWithEditToken({
              action: "edit",
              title: PERM_PAGE_TITLE,
              text: newContent,
              summary: summaryText,
              basetimestamp: rev.timestamp,
              nocreate: 1,
            })
            .done(resolve)
            .fail((code, err) => {
              if (code === "editconflict") {
                reject(
                  "edit conflict: the page was changed by someone else while submitting. Please try again",
                );
                return;
              }
              reject(
                code +
                  (err && err.error && err.error.info
                    ? ": " + err.error.info
                    : ""),
              );
            });
        });
        if (!result || !result.edit || result.edit.result !== "Success") {
          throw new Error("the edit was not confirmed as successful");
        }
      }

      return {
        PERM_REQUEST_TYPES: PERM_REQUEST_TYPES,
        foreignApiGet: foreignApiGet,
        submitGlobalSysopsReport: submitGlobalSysopsReport,
        submitSRGReport: submitSRGReport,
        submitPermissionRequest: submitPermissionRequest,
      };
    },
  };
})();
// </nowiki>
