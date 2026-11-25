/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Account block helper module
 * ============================================================================
 * PURPOSE:
 * Executes account, IP address, and IP range blocks (including self-block
 * confirmation and optional talk-page notifications) for work() in Tengu.js.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes window.TenguBlock.create(deps),
 * returning { blockTarget }.
 *
 * DEPENDENCIES:
 * MediaWiki utilities (window.mw.util, window.mw.config, window.mw.Title) and
 * the createDialog, makeBtn, apiPost, pageExists, withToolTag, formatApiError,
 * translateDurationId, and useIndonesian helpers passed via deps.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  function create(deps) {
    const createDialog = deps.createDialog;
    const makeBtn = deps.makeBtn;
    const apiPost = deps.apiPost;
    const pageExists = deps.pageExists;
    const withToolTag = deps.withToolTag;
    const formatApiError = deps.formatApiError;
    const translateDurationId = deps.translateDurationId;
    const useIndonesian = deps.useIndonesian;

    async function blockTarget(targetVal, config, run) {
      const addLog = run.addLog;
      const onBlocked = run.onBlocked;
      const toolTag = run.toolTag;

      const notifySummaryBlock =
        (useIndonesian
          ? "Notifikasi: Pemberitahuan pemblokiran akun"
          : "Notification: Account block notice") + toolTag;

      // Resolve IP status per-target so block parameters (anononly vs
      // autoblock) are correct when the target list mixes IPs, IP
      // ranges, and accounts. isIPAddress(targetVal, true) accepts both
      // single IPs and CIDR ranges; rangeblocks do not support
      // autoblock, so treating ranges the same as plain IPs here
      // correctly skips it.
      const isTargetIP = mw.util.isIPAddress(targetVal, true);
      const targetIsRange = isTargetIP && !mw.util.isIPAddress(targetVal);

      let proceedWithBlock = true;

      // Show a confirmation dialogue only when the target account matches the current user.
      const isSelfBlock =
        targetVal.toLowerCase() ===
        (mw.config.get("wgUserName") || "").toLowerCase();
      if (isSelfBlock) {
        const confirmed = await new Promise((resolve) => {
          const { overlay, body, footer } = createDialog({
            title: "Self-block confirmation",
            icon: "⚠",
            child: true,
            onClose: () => resolve(false),
          });
          body.innerHTML =
            "<p>You are about to block your own account. Are you certain you wish to proceed?</p>";
          const btnCancel = makeBtn("Cancel", "quiet");
          btnCancel.addEventListener("click", () => {
            resolve(false);
            overlay.closeHandler();
          });
          const btnConfirm = makeBtn("Proceed", "destructive");
          btnConfirm.addEventListener("click", () => {
            resolve(true);
            overlay.closeHandler();
          });
          footer.appendChild(btnCancel);
          footer.appendChild(btnConfirm);
        });
        if (!confirmed) {
          addLog("[Block] Self-block cancelled", "warn");
          proceedWithBlock = false;
        }
      }

      if (!proceedWithBlock) return;

      let blockSucceededThisTarget = false;
      const data = {
        action: "block",
        user: targetVal,
        expiry: config.blockDur,
        reason: withToolTag(config.blockReason, toolTag),
        // Overwrites an existing block on the target. Without this
        // parameter, the API is expected to reject a block on an
        // already-blocked target (alreadyblocked), which would make
        // the pre-filled "modify an active block" flow fail.
        reblock: 1,
      };
      // If hardblock is checked, we do NOT want anononly=1 (registered users should be blocked too)
      if (isTargetIP) {
        if (!config.blockAnon) {
          data.anononly = 1; // Standard anonymous-only block
        }
        // If config.blockAnon is true (meaning chkHardblock was checked), we omit data.anononly or set it to 0
      } else {
        if (config.blockAuto) data.autoblock = 1;
      }
      if (config.blockCreate) data.nocreate = 1;
      if (!config.blockTalk) data.allowusertalk = 1;
      if (config.blockMail) data.noemail = 1;
      if (config.blockHide) data.hidename = 1;
      if (config.blockPartial) {
        data.partial = 1;
        if (config.blockPagerestrictions.length) {
          data.pagerestrictions = config.blockPagerestrictions.join("|");
        }
        if (config.blockNamespacerestrictions.length) {
          data.namespacerestrictions =
            config.blockNamespacerestrictions.join("|");
        }
        if (config.blockActionRestrictions.length) {
          data.actionrestrictions = config.blockActionRestrictions.join("|");
        }
      }

      try {
        await apiPost(data);
        addLog(`[Block] Successfully blocked user "${targetVal}"`);
        onBlocked();
        blockSucceededThisTarget = true;
      } catch (e) {
        addLog(
          `[Block] Failed to block "${targetVal}": ${formatApiError(e)}`,
          true,
        );
      }

      // Post notification to user talk page (separate from block action above,
      // so a notification failure does not misreport the block as having failed).
      // Skipped for any range target (IPv4 or IPv6 CIDR): mw.Title
      // would misparse the "/" in the range as a subpage separator,
      // and an IPv6 address's ":" characters risk being misread as
      // a namespace prefix, producing an incorrect title either way.
      if (targetIsRange && config.notifyBlock && blockSucceededThisTarget) {
        addLog(
          "[Notify] Skipped block notification: talk pages are not applicable to IP range targets (IPv4 or IPv6).",
          "warn",
        );
      }
      if (blockSucceededThisTarget && config.notifyBlock && !targetIsRange) {
        const talkTitle = new mw.Title(targetVal, 3).getPrefixedText();
        const isBlockIndef = config.blockDur === "never";
        const blockReasonNotice =
          config.blockReason && config.blockReason.trim()
            ? config.blockReason
            : useIndonesian
              ? "(tidak ada alasan diberikan)"
              : "(no reason given)";

        const notice = useIndonesian
          ? isBlockIndef
            ? `== Pemberitahuan pemblokiran akun ==\nHalo ${targetVal},\n\nAkun "${targetVal}" telah diblokir secara tidak terbatas dengan alasan berikut: ${blockReasonNotice}.\n\nSelama masa pemblokiran, akun ini mungkin tidak dapat melakukan sebagian atau seluruh tindakan yang biasanya memerlukan hak penyuntingan. Pemblokiran ini tidak berakhir secara otomatis dan akan tetap berlaku kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
            : `== Pemberitahuan pemblokiran akun ==\nHalo ${targetVal},\n\nAkun "${targetVal}" telah diblokir selama ${translateDurationId(config.blockDur)} dengan alasan berikut: ${blockReasonNotice}.\n\nSelama masa pemblokiran, akun ini mungkin tidak dapat melakukan sebagian atau seluruh tindakan yang biasanya memerlukan hak penyuntingan. Pemblokiran dijadwalkan berakhir pada waktunya, kecuali diubah oleh pengurus.\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`
          : isBlockIndef
            ? `== Account block notice ==\nDear ${targetVal},\n\nThe account "${targetVal}" has been blocked indefinitely due to the following reason: ${blockReasonNotice}.\n\nDuring the block period, the account may be unable to perform some or all actions that normally require editing privileges. This block does not expire automatically and will remain in effect unless modified by an administrator.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`
            : `== Account block notice ==\nDear ${targetVal},\n\nThe account "${targetVal}" has been blocked for ${config.blockDur} due to the following reason: ${blockReasonNotice}.\n\nDuring the block period, the account may be unable to perform some or all actions that normally require editing privileges. The block is scheduled to remain in effect until it expires, unless modified by an administrator.\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;

        // When a permanent block is applied with the clear-before-notify option,
        // replace the talk page with the notice in a single edit rather than
        // clearing and then appending as two separate operations.
        const shouldReplace = config.clearTalkPageBeforeNotify && isBlockIndef;
        try {
          const editParams = {
            action: "edit",
            title: talkTitle,
            summary: notifySummaryBlock,
            bot: true,
          };
          if (shouldReplace) {
            editParams.text = notice;
          } else {
            const talkExists = await pageExists(talkTitle);
            editParams.appendtext = (talkExists ? "\n\n" : "") + notice;
          }
          await apiPost(editParams);
          addLog(
            shouldReplace
              ? `[Notify] Talk page replaced with notification: "${talkTitle}"`
              : `[Notify] Notification posted to: "${talkTitle}"`,
          );
        } catch (e) {
          addLog(
            `[Notify] Failed to post block notification to "${talkTitle}": ${formatApiError(e)}`,
            "warn",
          );
        }
      }
    }

    return {
      blockTarget: blockTarget,
    };
  }

  window.TenguBlock = {
    create: create,
  };
})();
// </nowiki>
