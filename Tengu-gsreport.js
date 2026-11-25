/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Global sysops report module
 * ============================================================================
 * PURPOSE:
 * Executes per-target report submissions to Meta-Wiki's Global sysops/Requests
 * page and logs progress, completion, and failure outcomes during a run.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguGSReport.create(deps), returning { reportTargetToGS }.
 *
 * DEPENDENCIES:
 * Passed via deps by Tengu.js: buildGSLineForTarget (from Tengu-gsline.js),
 * submitGlobalSysopsReport (from Tengu-reports.js), and formatApiError (from
 * Tengu-dom.js). No direct dependencies on Tengu.js internals.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  function create(deps) {
    const buildGSLineForTarget = deps.buildGSLineForTarget;
    const submitGlobalSysopsReport = deps.submitGlobalSysopsReport;
    const formatApiError = deps.formatApiError;

    async function reportTargetToGS(targetVal, config, ctx) {
      const addLog = ctx.addLog;
      const onReported = ctx.onReported;
      const toolTag = ctx.toolTag;

      addLog(
        `[Report] Processing "${targetVal}" for Global sysops/Requests...`,
      );
      try {
        const _gsLine = buildGSLineForTarget(targetVal, config);
        const reportGSSummary =
          (config.mode === "page"
            ? "Reporting page for global sysops' attention"
            : "Reporting account for global sysops' attention") + toolTag;
        await submitGlobalSysopsReport(_gsLine, reportGSSummary, targetVal);
        addLog(
          `[Report] Completed: "${targetVal}" submitted to Global sysops/Requests`,
        );
        if (typeof onReported === "function") {
          onReported();
        }
      } catch (e) {
        addLog(
          `[Report] Failed for "${targetVal}" on Global sysops/Requests: ${formatApiError(e)}`,
          true,
        );
      }
    }

    return {
      reportTargetToGS: reportTargetToGS,
    };
  }

  window.TenguGSReport = {
    create: create,
  };
})();
// </nowiki>
