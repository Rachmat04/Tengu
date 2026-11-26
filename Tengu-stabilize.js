/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Pending changes protection module
 * ============================================================================
 * PURPOSE:
 * Applies FlaggedRevs pending changes protection via action=stabilize during
 * page protection runs and logs the outcome.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguStabilize.create(deps), returning { stabilizePageTarget }.
 *
 * DEPENDENCIES:
 * The apiPost, withToolTag, and formatApiError helpers passed in by
 * Tengu.js.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  function create(deps) {
    const apiPost = deps.apiPost;
    const withToolTag = deps.withToolTag;
    const formatApiError = deps.formatApiError;

    // Applies pending changes (FlaggedRevs) protection to a single page and
    // waits for the configured throttle window afterwards.
    async function stabilizePageTarget(title, config, callbacks) {
      try {
        await apiPost({
          action: "stabilize",
          title: title,
          protectlevel: config.protectPendingChangesLevel,
          // action=stabilize may not accept "never" as an indefinite-expiry
          // alias the way action=protect does; this translates it to
          // "infinite".
          expiry:
            config.protectPendingChangesExpiry === "never"
              ? "infinite"
              : config.protectPendingChangesExpiry,
          reason: withToolTag(config.protectReason, callbacks.toolTag),
        });
        callbacks.addLog(
          `[Protect] Enabled pending changes protection: "${title}"`,
        );
        callbacks.onProtected();
      } catch (e) {
        callbacks.addLog(
          `[Protect] Failed to enable pending changes protection for "${title}": ${formatApiError(e)}`,
          true,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, callbacks.throttleMs));
    }

    return {
      stabilizePageTarget: stabilizePageTarget,
    };
  }

  window.TenguStabilize = {
    create: create,
  };
})();
// </nowiki>
