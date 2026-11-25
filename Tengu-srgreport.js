/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Steward requests/Global report module
 * ============================================================================
 * PURPOSE:
 * Executes Steward requests/Global report submissions on Meta-Wiki (both
 * single-target and multi-target global block/lock batches) and writes the
 * corresponding progress log entries for each queued account.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguSRGReport.create(deps), returning { reportTargetsToSRG }.
 *
 * DEPENDENCIES:
 * Passed via deps from Tengu.js:
 * - submitSRGReport (from [[Pengguna:Rachmat04/Tengu-reports.js]])
 * - formatApiError (from [[Pengguna:Rachmat04/Tengu-dom.js]])
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  function create(deps) {
    const submitSRGReport = deps.submitSRGReport;
    const formatApiError = deps.formatApiError;

    // Submits a single combined Steward requests/Global report covering every
    // selected account (via {{MultiLock}} or multiple {{Luxotool}} lines),
    // logging queued, processing, and completed/failed lines per account so
    // the state of every target remains visible in the progress log.
    async function reportTargetsToSRG(targetVal, config, callbacks) {
      const addLog = callbacks.addLog;
      const onReported = callbacks.onReported;
      const toolTag = callbacks.toolTag;

      const allTargets = config.targets || [targetVal];
      const targetCount = allTargets.length;
      const kindLabel =
        config.reportSRGKind === "block" ? "global block" : "global lock";

      if (targetCount > 1) {
        addLog(
          `[Report] Queued ${targetCount} accounts for Steward requests/Global (${kindLabel}): ${allTargets.join(", ")}`,
        );
      }
      for (const srgTarget of allTargets) {
        addLog(
          `[Report] Processing "${srgTarget}" for Steward requests/Global (${kindLabel})...`,
        );
      }

      try {
        const srgSummary =
          targetCount > 1
            ? "Reporting " +
              targetCount +
              " accounts for global " +
              (config.reportSRGKind === "block" ? "block" : "lock") +
              toolTag
            : "Reporting account for global " +
              (config.reportSRGKind === "block" ? "block" : "lock") +
              toolTag;
        await submitSRGReport(
          config.reportSRGKind,
          allTargets,
          config.reportSRGSection,
          srgSummary,
        );
        for (const srgTarget of allTargets) {
          addLog(
            `[Report] Completed: "${srgTarget}" submitted to Steward requests/Global (${kindLabel})`,
          );
        }
        if (typeof onReported === "function") onReported();
      } catch (e) {
        const srgErrText = formatApiError(e);
        for (const srgTarget of allTargets) {
          addLog(
            `[Report] Failed for "${srgTarget}" on Steward requests/Global: ${srgErrText}`,
            true,
          );
        }
      }
    }

    return {
      reportTargetsToSRG: reportTargetsToSRG,
    };
  }

  window.TenguSRGReport = {
    create: create,
  };
})();
// </nowiki>
