/**
 * ============================================================================
 * Tengu — 天狗
 * Version 2.26.1
 * User warning message definitions for the Tengu moderation tool
 * ============================================================================
 * PURPOSE:
 * Provides warning message templates posted to a user's talk page.
 * Consumed by Tengu.js; exposes window.TenguWarn.get(useIndonesian).
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
window.TenguWarn = {
  /**
   * Returns the warning message catalogue for the given language.
   *
   * @param {boolean} useIndonesian  True when the wiki is in an Indonesian-language subdomain.
   * @returns {Object}               Object containing WARN_MESSAGES array.
   */
  get: function (useIndonesian) {
    // -------------------------------------------------------------------------
    // Warning message definitions
    //
    // Each entry must have:
    //   value   {string}   Unique key — also used as the <select> option value.
    //   label   {string}   Human-readable label shown in the drop-down.
    //   en      {Function} Returns the English wikitext notice. Receives (target, extra).
    //   id      {Function} Returns the Indonesian wikitext notice. Receives (target, extra).
    //
    // `extra` is the optional additional-information string typed by the user.
    // When present it is appended after the main message body.
    // -------------------------------------------------------------------------

    // Helper: appends the optional extra line to a notice body.
    // Inserts the optional extra text immediately before the closing signature
    // (~~~~) so it appears as part of the notice body rather than after it.
    function withExtra(body, extra, useId) {
      if (!extra) return body;
      const prefix = useId
        ? "\n\nInformasi tambahan: "
        : "\n\nAdditional information: ";
      const sig = " ~~~~";
      if (body.endsWith(sig)) {
        return body.slice(0, -sig.length) + prefix + extra + sig;
      }
      return body + prefix + extra;
    }

    const WARN_MESSAGES = [
      // --- Common warnings ---
      {
        group: "Common warnings",
        items: [
          // ------------------------------------------------------------------
          // Vandalism
          // ------------------------------------------------------------------
          {
            value: "vandalism",
            label: "Vandalism",
            buildNotice: function (target, extra) {
              const en = withExtra(
                `== Warning: vandalism ==\nYour recent edits to one or more pages appear to constitute [[WP:VAND|vandalism]]. Vandalism is not permitted on this wiki. Please stop making edits that damage or degrade the encyclopaedia.\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`,
                extra,
                false,
              );
              const id = withExtra(
                `== Peringatan: vandalisme ==\nSuntingan Anda pada satu atau lebih halaman terindikasi sebagai [[WP:VAND|vandalisme]]. Vandalisme tidak diperkenankan di wiki ini. Harap hentikan suntingan yang merusak atau menurunkan kualitas ensiklopedia.\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`,
                extra,
                true,
              );
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Disruptive editing
          // ------------------------------------------------------------------
          {
            value: "disruptive",
            label: "Disruptive editing",
            buildNotice: function (target, extra) {
              const en = withExtra(
                `== Warning: disruptive editing ==\nYour recent edits appear to be [[WP:DE|disruptive]]. Disruptive editing interferes with the normal operation and improvement of the wiki, regardless of intent. Please review the relevant guidelines and ensure that your contributions are constructive.\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`,
                extra,
                false,
              );
              const id = withExtra(
                `== Peringatan: penyuntingan disruptif ==\nSuntingan Anda yang baru-baru ini terindikasi sebagai [[WP:DE|disruptif]]. Penyuntingan disruptif mengganggu operasional dan pengembangan wiki secara normal, terlepas dari niat pelakunya. Harap tinjau panduan yang relevan dan pastikan kontribusi Anda bersifat konstruktif.\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`,
                extra,
                true,
              );
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Editing tests
          // ------------------------------------------------------------------
          {
            value: "testediting",
            label: "Editing tests",
            buildNotice: function (target, extra) {
              const en = withExtra(
                `== Notice: editing tests ==\nIt appears that you may have been testing edits on one or more pages. If you would like to experiment, please use the [[WP:SANDBOX|sandbox]] instead, where test edits are welcome. Edits to live articles and other pages that do not improve their content are reverted.\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`,
                extra,
                false,
              );
              const id = withExtra(
                `== Pemberitahuan: uji coba penyuntingan ==\nSeperti mungkin Anda sedang melakukan uji coba penyuntingan pada satu atau lebih halaman. Jika ingin bereksperimen, gunakan [[WP:SANDBOX|bak pasir]] sebagai gantinya, di mana uji coba sangat diperkenankan. Suntingan pada halaman artikel dan halaman lain yang tidak meningkatkan kualitas konten akan dikembalikan.\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`,
                extra,
                true,
              );
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Removal of content / blanking
          // ------------------------------------------------------------------
          {
            value: "blanking",
            label: "Removal of content, blanking",
            buildNotice: function (target, extra) {
              const en = withExtra(
                `== Warning: removal of content ==\nYour recent edits appear to have removed substantial content from one or more pages without an appropriate explanation. If the removal was intentional and you believe there is a valid reason, please provide a clear edit summary or discuss the change on the relevant talk page. Unexplained removal of content may be treated as vandalism.\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`,
                extra,
                false,
              );
              const id = withExtra(
                `== Peringatan: penghapusan konten ==\nSuntingan Anda yang baru-baru ini tampaknya menghapus konten yang substansial dari satu atau lebih halaman tanpa penjelasan yang memadai. Jika penghapusan tersebut disengaja dan Anda merasa ada alasan yang sah, harap berikan ringkasan suntingan yang jelas atau diskusikan perubahan tersebut di halaman pembicaraan yang relevan. Penghapusan konten tanpa penjelasan dapat dianggap sebagai vandalisme.\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`,
                extra,
                true,
              );
              return useIndonesian ? id : en;
            },
          },
        ],
      },
    ];

    return { WARN_MESSAGES };
  },
};
// </nowiki>
