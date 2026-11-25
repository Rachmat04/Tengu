/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Page protection helpers module
 * ============================================================================
 * PURPOSE:
 * Builds MediaWiki action=protect restriction and expiry parameter strings
 * and formats pending-changes protection status and talk-page notices for
 * Tengu.js.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes window.TenguProtect.create(),
 * returning { buildPageProtections, buildPageProtectionExpiries,
 * isProtectionRemoved, isPendingChangesActive, isPendingChangesOnly,
 * describePendingChanges, buildPendingChangesOnlyNotice,
 * appendPendingChangesNote }.
 *
 * DEPENDENCIES:
 * MediaWiki global mw.Title (window.mw.Title), plus translateDurationId and
 * useIndonesian passed into create(). No other dependencies on Tengu.js
 * internals.
 *
 * ATTRIBUTION:
 * Based on User:WhitePhosphorus/all-in-one (https://meta.wikimedia.org/wiki/User:WhitePhosphorus/all-in-one).
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  function create(deps) {
    const translateDurationId = deps.translateDurationId;
    const useIndonesian = !!deps.useIndonesian;

    // Builds the protections parameter for a page protection request, adding
    // upload= for File-namespace pages. Assumes upload-level
    // protection is submitted through the same action=protect call as edit/move;
    // this has not been independently confirmed against the MediaWiki API.
    function buildPageProtections(title, cfg) {
      let protections = `edit=${cfg.protectEdit}|move=${cfg.protectMove}`;
      try {
        if (new mw.Title(title).getNamespaceId() === 6) {
          protections += `|upload=${cfg.protectUpload}`;
        }
      } catch (e) {
        // Skip if the title cannot be resolved
      }
      return protections;
    }

    // Builds the expiry parameter matching the pipe-separated order of
    // buildPageProtections(): edit expiry, then move expiry, then (for
    // file pages) upload expiry. The MediaWiki protect API accepts a
    // pipe-separated expiry list that is matched positionally against
    // the pipe-separated protections list, so edit and move restrictions
    // can expire independently in a single action=protect call. Upload
    // restriction has no dedicated expiry control and reuses the edit
    // protection expiry.
    function buildPageProtectionExpiries(title, cfg) {
      let expiries = `${cfg.protectExpiry}|${cfg.protectMoveExpiry}`;
      try {
        if (new mw.Title(title).getNamespaceId() === 6) {
          expiries += `|${cfg.protectExpiry}`;
        }
      } catch (e) {
        // Skip if the title cannot be resolved
      }
      return expiries;
    }

    // Returns true when the selected edit and move restriction levels are
    // both "all" (no restriction), meaning the page is not actually
    // protected despite the Page protection section being enabled. Used
    // to adjust notification wording so it doesn't claim the page was
    // "protected" when protection was effectively removed or never
    // applied.
    function isProtectionRemoved(cfg) {
      return cfg.protectEdit === "all" && cfg.protectMove === "all";
    }

    // Returns true when pending changes protection is actually being
    // applied: the option is ticked and its level is not "none".
    function isPendingChangesActive(cfg) {
      return (
        !!cfg.protectPendingChanges && cfg.protectPendingChangesLevel !== "none"
      );
    }

    // Returns true when pending changes is the only protection applied
    // (edit and move restrictions are both unrestricted).
    function isPendingChangesOnly(cfg) {
      return isProtectionRemoved(cfg) && isPendingChangesActive(cfg);
    }

    // Describes the pending changes level and expiry for notices.
    function describePendingChanges(cfg) {
      const level = cfg.protectPendingChangesLevel;
      const indef = cfg.protectPendingChangesExpiry === "never";
      const expiry = cfg.protectPendingChangesExpiry;
      return {
        indef: indef,
        levelEn:
          level === "sysop"
            ? "reviewers/administrators only"
            : "autoconfirmed users",
        levelId:
          level === "sysop"
            ? "hanya peninjau/pengurus"
            : "pengguna terkonfirmasi otomatis",
        expiryEn: indef ? "indefinitely" : "for " + expiry,
        expiryId: indef
          ? "secara tidak terbatas"
          : "selama " + translateDurationId(expiry),
      };
    }

    // Builds a notice for runs where pending changes is the only
    // protection applied, so the page is described as protected with
    // pending changes rather than as no longer protected.
    function buildPendingChangesOnlyNotice(titles, reasonNotice, cfg) {
      const pc = describePendingChanges(cfg);
      const listed = titles.map((t) => `"${t}"`).join(" and ");
      const listedId = titles.map((t) => `"${t}"`).join(" dan ");
      if (useIndonesian) {
        const subject =
          titles.length === 1
            ? `Halaman ${listedId}`
            : `Halaman-halaman berikut: ${listedId}`;
        return `== Pemberitahuan perlindungan halaman ==\n${subject} telah diberi perlindungan perubahan tertunda (tingkat: ${pc.levelId}) ${pc.expiryId} dengan alasan berikut: ${reasonNotice}.\n\nPenyuntingan tetap terbuka bagi semua pengguna, tetapi sebagian suntingan mungkin perlu ditinjau sebelum ditampilkan kepada pembaca secara bawaan. ${pc.indef ? "Perlindungan ini tidak berakhir secara otomatis dan akan tetap berlaku kecuali diubah oleh pengurus." : "Perlindungan dijadwalkan berakhir pada waktunya, kecuali diubah oleh pengurus."}\n\nPemberitahuan ini dikirimkan secara otomatis. Silakan sampaikan pertanyaan atau keberatan ke halaman pembicaraan saya. ~~~~`;
      }
      const subject =
        titles.length === 1
          ? `The page ${listed} has`
          : `The following pages have been given pending changes protection: ${listed}. They have`;
      const subjectFull =
        titles.length === 1
          ? `${subject} been given pending changes protection (level: ${pc.levelEn}) ${pc.expiryEn} due to the following reason: ${reasonNotice}.`
          : `${subject} this protection (level: ${pc.levelEn}) ${pc.expiryEn} due to the following reason: ${reasonNotice}.`;
      return `== Page protection notice ==\n${subjectFull}\n\nEditing remains open to all users, but some edits may need to be reviewed before they are shown to readers by default. ${pc.indef ? "This protection does not expire automatically and will remain in effect unless modified by an administrator." : "The protection is scheduled to remain in effect until it expires, unless modified by an administrator."}\n\nThis notification was posted automatically. Please direct any questions or concerns to my user talk page. ~~~~`;
    }

    // Adds a pending changes sentence to a standard protection notice
    // when pending changes protection is applied alongside edit/move
    // restrictions. The sentence is inserted before the automatic-post
    // line, so the notice keeps its original structure.
    function appendPendingChangesNote(notice, cfg) {
      const pc = describePendingChanges(cfg);
      const marker = useIndonesian
        ? "Pemberitahuan ini dikirimkan secara otomatis."
        : "This notification was posted automatically.";
      const sentence = useIndonesian
        ? `Perlindungan perubahan tertunda (tingkat: ${pc.levelId}) juga diterapkan ${pc.expiryId}.\n\n`
        : `Pending changes protection (level: ${pc.levelEn}) has also been applied ${pc.expiryEn}.\n\n`;
      const idx = notice.indexOf(marker);
      if (idx === -1) return notice;
      return notice.slice(0, idx) + sentence + notice.slice(idx);
    }

    return {
      buildPageProtections: buildPageProtections,
      buildPageProtectionExpiries: buildPageProtectionExpiries,
      isProtectionRemoved: isProtectionRemoved,
      isPendingChangesActive: isPendingChangesActive,
      isPendingChangesOnly: isPendingChangesOnly,
      describePendingChanges: describePendingChanges,
      buildPendingChangesOnlyNotice: buildPendingChangesOnlyNotice,
      appendPendingChangesNote: appendPendingChangesNote,
    };
  }

  window.TenguProtect = {
    create: create,
  };
})();
// </nowiki>
