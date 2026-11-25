/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Contribution fetching and target preparation module
 * ============================================================================
 * PURPOSE:
 * Fetches user contribution histories (or loads custom selections / page-mode
 * targets), separates pages scheduled for both deletion and protection, and
 * caches the resolved target sets in resumeState for work() in Tengu.js.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguContribs.create(deps), returning { prepareTargetItems }.
 *
 * DEPENDENCIES:
 * Helpers passed in by Tengu.js: apiGet, formatApiError.
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
    const formatApiError = deps.formatApiError;

    const prepareTargetItems = async function (
      targetVal,
      targetIsRange,
      config,
      rs,
      hooks,
    ) {
      const addLog = hooks.addLog;
      const isAborted = hooks.isAborted;

      // On a resume run, contribution data is loaded from the cache stored in rs,
      // avoiding a repeat API call. On a fresh run data is fetched normally then cached.
      let pageEdits = {};
      let creation = [];
      let pagesToProtect = new Set();
      let pagesToProtectAfterDel;
      const skipContribFetch = rs.pageEditsCache !== null;

      if (skipContribFetch) {
        pageEdits = rs.pageEditsCache;
        creation = rs.creationCache;
        pagesToProtect = rs.pagesToProtectCache;
        pagesToProtectAfterDel = rs.pagesToProtectAfterDelCache;
        addLog("▶️ Contribution data reloaded from the previous run.");
      }

      if (
        !skipContribFetch &&
        config.mode === "user" &&
        config.customSelection
      ) {
        // Custom-selection mode: use the items chosen in the picker rather
        // than fetching contributions from the API.
        for (const [title, info] of Object.entries(config.selectedPageEdits)) {
          pageEdits[title] = info;
        }
        for (const t of config.selectedCreations) {
          creation.push(t);
        }
        // Delete pages must also process pages selected under
        // "Edited pages". Previously only "Created pages" reached the
        // deletion loop, so selecting edited pages deleted nothing.
        if (config.massdel) {
          const creationSeen = new Set(creation);
          for (const t of Object.keys(pageEdits)) {
            if (!creationSeen.has(t)) {
              creation.push(t);
              creationSeen.add(t);
            }
          }
        }
        if (!Object.keys(pageEdits).length && !creation.length) {
          addLog(
            "[Info] Custom selection is active but no items were selected — no edits or pages will be processed.",
            "warn",
          );
        }
        if (config.protect) {
          for (const title of Object.keys(pageEdits)) {
            pagesToProtect.add(title);
          }
          if (!config.massdel) {
            for (const title of creation) {
              pagesToProtect.add(title);
            }
          }
        }
      }

      if (
        !skipContribFetch &&
        config.mode === "user" &&
        !config.customSelection &&
        !targetIsRange
      ) {
        const contribParams = {
          action: "query",
          list: "usercontribs",
          ucuser: targetVal,
          uclimit: "max",
        };
        if (config.betweenMode) {
          // Between-dates mode: ucend is the older (from) boundary;
          // ucstart is the newer (to) boundary. Either may be null if
          // the user left that picker blank, in which case the API
          // returns edits up to or from the filled-in date with no
          // constraint on the other end.
          if (config.betweenFrom) contribParams.ucend = config.betweenFrom;
          if (config.betweenTo) contribParams.ucstart = config.betweenTo;
        } else if (config.endtime !== "inf") {
          const untildate = new Date();
          untildate.setSeconds(
            untildate.getSeconds() - parseInt(config.endtime),
          );
          contribParams.ucend = untildate.toISOString();
        }

        let contribs = [];
        let hasMore = true;
        let continueToken = {};

        while (hasMore && !isAborted()) {
          const params = Object.assign({}, contribParams, continueToken);
          try {
            const data = await apiGet(params);
            if (data.query && data.query.usercontribs) {
              contribs = contribs.concat(data.query.usercontribs);
            }
            if (data.continue) {
              continueToken = data.continue;
            } else {
              hasMore = false;
            }
          } catch (e) {
            addLog(
              `[Error] Failed to fetch contribution history: ${formatApiError(e)}`,
              true,
            );
            hasMore = false;
          }
        }

        if (!contribs.length && !isAborted()) {
          addLog("[Info] No contributions found within this timeframe");
        } else if (!isAborted()) {
          for (const edit of contribs) {
            if (edit.new === "") {
              creation.push(edit.title);
            } else {
              if (!pageEdits[edit.title]) {
                pageEdits[edit.title] = {
                  revids: [],
                  latest: edit.revid,
                  oldestParent: edit.parentid,
                };
              }
              pageEdits[edit.title].revids.push(edit.revid);
              pageEdits[edit.title].oldestParent = edit.parentid;
            }
          }

          // Aggregate pages for mass protection to avoid duplicates and skip deleted records
          if (config.protect) {
            for (const title of Object.keys(pageEdits)) {
              pagesToProtect.add(title);
            }
            if (!config.massdel) {
              for (const title of creation) {
                pagesToProtect.add(title);
              }
            }
          }
        }
      } else if (!skipContribFetch && config.mode === "page") {
        // Page mode: bypass fetching and apply operations directly to the target page
        if (config.protect) pagesToProtect.add(targetVal);
        if (config.massdel) creation.push(targetVal);
      }

      // Pages scheduled for both deletion and protection must be deleted first,
      // then protected against recreation. Protecting before deletion causes the
      // protection to be lost when the page is removed. Identify the overlap now
      // and defer those pages to a second protect pass that runs after deletion.
      if (!skipContribFetch) {
        const creationSet = new Set(creation);
        pagesToProtectAfterDel = new Set(
          [...pagesToProtect].filter(function (t) {
            return creationSet.has(t);
          }),
        );
        for (const t of pagesToProtectAfterDel) {
          pagesToProtect.delete(t);
        }
        // Cache contribution data and computed page sets for a potential resume run.
        rs.pageEditsCache = pageEdits;
        rs.creationCache = creation;
        rs.pagesToProtectCache = pagesToProtect;
        rs.pagesToProtectAfterDelCache = pagesToProtectAfterDel;
      }

      return {
        pageEdits: pageEdits,
        creation: creation,
        pagesToProtect: pagesToProtect,
        pagesToProtectAfterDel: pagesToProtectAfterDel,
      };
    };

    return {
      prepareTargetItems: prepareTargetItems,
    };
  }

  window.TenguContribs = {
    create: create,
  };
})();
// </nowiki>
