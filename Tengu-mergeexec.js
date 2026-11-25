/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Wikidata merge execution module
 * ============================================================================
 * PURPOSE:
 * Executes the Merge items workflow in work(), fetching both Wikidata
 * entities, checking for sitelink conflicts, merging the items or lexemes,
 * optionally creating a redirect, and logging progress.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguMergeExec.create(deps), returning { mergeConfiguredEntities }.
 *
 * DEPENDENCIES:
 * Helpers passed in by Tengu.js: fetchWikidataEntities,
 * detectWikidataMergeConflicts, mergeWikidataEntities,
 * createWikidataRedirect, withToolTag, and formatApiError.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  function create(deps) {
    const fetchWikidataEntities = deps.fetchWikidataEntities;
    const detectWikidataMergeConflicts = deps.detectWikidataMergeConflicts;
    const mergeWikidataEntities = deps.mergeWikidataEntities;
    const createWikidataRedirect = deps.createWikidataRedirect;
    const withToolTag = deps.withToolTag;
    const formatApiError = deps.formatApiError;

    // Runs the single-shot Merge items operation configured in config,
    // aborting if sitelink conflicts are detected and optionally creating a
    // redirect from the merged entity afterwards.
    async function mergeConfiguredEntities(config, callbacks) {
      const addLog = callbacks.addLog;
      const onMerged = callbacks.onMerged;
      const toolTag = callbacks.toolTag;

      addLog(
        `[Merge] Processing merge of "${config.mergeFrom}" into "${config.mergeTo}"...`,
      );
      try {
        const entities = await fetchWikidataEntities([
          config.mergeFrom,
          config.mergeTo,
        ]);
        const conflicts = detectWikidataMergeConflicts(entities);
        if (Object.keys(conflicts).length) {
          addLog(
            `[Merge] Aborted: sitelink conflicts detected between "${config.mergeFrom}" and "${config.mergeTo}" on ${Object.keys(conflicts).join(", ")} — resolve them manually before merging.`,
            true,
          );
        } else {
          const mergeSummaryText = withToolTag(config.mergeSummary, toolTag);
          await mergeWikidataEntities(
            config.mergeFrom,
            config.mergeTo,
            mergeSummaryText,
          );
          addLog(
            `[Merge] Successfully merged "${config.mergeFrom}" into "${config.mergeTo}"`,
          );
          onMerged();

          if (config.mergeCreateRedirect) {
            try {
              await createWikidataRedirect(config.mergeFrom, config.mergeTo);
              addLog(
                `[Merge] Created redirect: "${config.mergeFrom}" → "${config.mergeTo}"`,
              );
            } catch (e) {
              addLog(
                `[Merge] Failed to create redirect "${config.mergeFrom}" → "${config.mergeTo}": ${formatApiError(e)}`,
                true,
              );
            }
          }
        }
      } catch (e) {
        addLog(
          `[Merge] Failed to merge "${config.mergeFrom}" into "${config.mergeTo}": ${formatApiError(e)}`,
          true,
        );
      }
    }

    return {
      mergeConfiguredEntities: mergeConfiguredEntities,
    };
  }

  window.TenguMergeExec = {
    create: create,
  };
})();
// </nowiki>