/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Meta-Wiki permission request module
 * ============================================================================
 * PURPOSE:
 * Executes the Request permissions on Meta-Wiki workflow in work(),
 * submitting the configured request to Steward requests/Permissions and
 * logging progress.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguPermRequest.create(deps), returning { submitConfiguredPermRequest }.
 *
 * DEPENDENCIES:
 * Helpers passed in by Tengu.js: submitPermissionRequest, withToolTag, and
 * formatApiError.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  function create(deps) {
    const submitPermissionRequest = deps.submitPermissionRequest;
    const withToolTag = deps.withToolTag;
    const formatApiError = deps.formatApiError;

    // Runs the single-shot Request permissions on Meta-Wiki operation
    // configured in config and logs the result.
    async function submitConfiguredPermRequest(config, callbacks) {
      const addLog = callbacks.addLog;
      const onReported = callbacks.onReported;
      const toolTag = callbacks.toolTag;

      addLog(
        `[Permissions] Submitting request for "${config.permUsername}" (${config.permTypeLabel}) to Steward requests/Permissions...`,
      );
      try {
        await submitPermissionRequest(
          config.permType,
          config.permUsername,
          config.permText,
          withToolTag(config.permSummary, toolTag),
          config.permDomain,
        );
        addLog(
          `[Permissions] Request for "${config.permUsername}" submitted to Steward requests/Permissions`,
        );
        onReported();
      } catch (e) {
        addLog(
          `[Permissions] Failed to submit request for "${config.permUsername}": ${formatApiError(e)}`,
          true,
        );
      }
    }

    return {
      submitConfiguredPermRequest: submitConfiguredPermRequest,
    };
  }

  window.TenguPermRequest = {
    create: create,
  };
})();
// </nowiki>