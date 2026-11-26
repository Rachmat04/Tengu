/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Per-page rollback and undo module
 * ============================================================================
 * PURPOSE:
 * Executes per-page rollback, undo, and MediaInfo structured-data revert
 * operations inside work(), including ZObject content-model fallback and
 * progress logging.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguRollback.create(deps), returning { revertPageTarget }.
 *
 * DEPENDENCIES:
 * Helpers passed in by Tengu.js: inspectRevisionMetadata,
 * buildQuickRevertSummaryText, apiPost, apiRollback, withToolTag, and
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
    const inspectRevisionMetadata = deps.inspectRevisionMetadata;
    const buildQuickRevertSummaryText = deps.buildQuickRevertSummaryText;
    const apiPost = deps.apiPost;
    const apiRollback = deps.apiRollback;
    const withToolTag = deps.withToolTag;
    const formatApiError = deps.formatApiError;

    async function revertPageTarget(title, info, targetVal, config, callbacks) {
      const addLog = callbacks.addLog;
      const onReverted = callbacks.onReverted;
      const toolTag = callbacks.toolTag;

      // --- MediaInfo / structured data check ---
      const {
        mediainfoNeedsRevert,
        goodMediaInfo,
        pageId,
        pageContentModel,
        previousEditorUser,
      } = await inspectRevisionMetadata(info);

      // ZObjects (Wikifunctions content model "zobject") are stored as JSON
      // and cannot be reliably reverted via action=edit undo, since the undo
      // path performs a wikitext three-way merge. When undo is selected and a
      // ZObject page is detected, Tengu falls back to native rollback, which
      // operates at the database level and is not content-model-specific.
      const isZObject = pageContentModel === "zobject";
      if (isZObject && config.rollbackMethod === "undo") {
        addLog(
          `[Rollback] ZObject content model detected at "${title}": undo is not supported for this content model. Falling back to native rollback.`,
          "warn",
        );
      }

      let standardRevertSuccess = false;
      let standardErr = null;

      // Links to the full diff between the revision immediately before the
      // reverted edit(s) and the latest reverted revision, using MediaWiki's
      // two-ID Special:Diff/<oldid>/<diffid> form, rather than the single-ID
      // form (Special:Diff/<diffid>), which only shows that one revision's
      // individual change against its immediate parent. Falls back to the
      // single-ID form when no parent revision is known (info.oldestParent is
      // unset).
      const revertedRevId = info.latest;
      const diffLinkTarget = info.oldestParent
        ? `${info.oldestParent}/${revertedRevId}`
        : `${revertedRevId}`;

      const revertSummaryStr = withToolTag(
        buildQuickRevertSummaryText(
          targetVal,
          diffLinkTarget,
          config.rollbackReason,
          config.rollbackShow,
          previousEditorUser,
          config.rollbackMethod === "undo" ? "undo" : "rollback",
        ),
        toolTag,
      );

      // Execute standard rollback or undo operation sequentially based on settings
      if (config.rollbackMethod === "undo" && !isZObject) {
        const undoData = {
          action: "edit",
          title: title,
          undo: info.latest,
          summary: revertSummaryStr,
        };
        if (info.oldestParent) undoData.undoafter = info.oldestParent;
        if (config.rollbackBot) undoData.bot = 1;

        try {
          const undoResult = await apiPost(undoData);
          const editResult = undoResult && undoResult.edit;
          const noChangeMade = !!(
            editResult &&
            Object.prototype.hasOwnProperty.call(editResult, "nochange")
          );
          if (noChangeMade) {
            if (!mediainfoNeedsRevert) {
              addLog(
                `[Undo] Skipped: "${title}" — the edit appears to have already been undone; no changes were made`,
                "warn",
              );
            }
          } else {
            addLog(`[Undo] Successfully reverted edits via undo: "${title}"`);
            standardRevertSuccess = true;
            onReverted();
          }
        } catch (e) {
          standardErr = String(e);
          if (
            standardErr.includes("alreadyreverted") ||
            standardErr.includes("nothingtorevert")
          ) {
            if (!mediainfoNeedsRevert) {
              addLog(
                `[Undo] Skipped: "${title}" — page had already been reverted by another user; undo was not applied by this operation`,
                "warn",
              );
            }
          } else {
            addLog(`[Undo] Failed at "${title}": ${formatApiError(e)}`, true);
          }
        }
      } else {
        // Native rollback
        const rbData = config.rollbackBot ? { markbot: 1 } : {};
        rbData.summary = revertSummaryStr;

        try {
          await apiRollback(title, targetVal, rbData);
          addLog(`[Rollback] Successfully reverted: "${title}"`);
          standardRevertSuccess = true;
          onReverted();
        } catch (e) {
          standardErr = String(e);
          if (
            standardErr.includes("alreadyreverted") ||
            standardErr.includes("onlyauthor")
          ) {
            if (!mediainfoNeedsRevert) {
              addLog(
                `[Rollback] Skipped: "${title}" — already reverted or user is the only author`,
                "warn",
              );
            }
          } else {
            addLog(
              `[Rollback] Failed at "${title}": ${formatApiError(e)}`,
              true,
            );
          }
        }
      }

      // --- MediaInfo / structured data revert execution ---
      if (mediainfoNeedsRevert && pageId) {
        try {
          let restoredData = Object.assign({}, goodMediaInfo);
          if (restoredData.statements) {
            restoredData.claims = restoredData.statements;
            delete restoredData.statements;
          } else if (!restoredData.claims) {
            restoredData.claims = {};
          }

          await apiPost({
            action: "wbeditentity",
            id: "M" + pageId,
            clear: true,
            data: JSON.stringify(restoredData),
            summary: revertSummaryStr,
            bot: config.rollbackBot ? 1 : 0,
          });
          addLog(`[Undo] Successfully reverted structured data at: "${title}"`);
          if (!standardRevertSuccess) {
            onReverted();
          }
        } catch (e) {
          addLog(
            `[Undo] Failed to revert structured data at "${title}": ${formatApiError(e)}`,
            true,
          );
        }
      }

      return {
        standardRevertSuccess: standardRevertSuccess,
        mediainfoNeedsRevert: mediainfoNeedsRevert,
      };
    }

    return {
      revertPageTarget: revertPageTarget,
    };
  }

  window.TenguRollback = {
    create: create,
  };
})();
// </nowiki>
