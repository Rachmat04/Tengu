/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Predefined packages
 * ============================================================================
 * PURPOSE:
 * This file contains the default package, the native preset packages used
 * in user mode, and a set of page-mode-only preset packages (quick-select
 * bundles of rollback/block/deletion/protection/revdel settings) used to
 * populate the Package dropdown.
 *
 * Package reason values must match the option values defined in
 * Tengu-reasons.js exactly, since they are matched against that list when a
 * package is applied (see v2.9.0 in CHANGELOG.md).
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
window.TenguPackages = {
  /**
   * Returns the default package and the set of native preset packages.
   */
  get: function (useIndonesian) {
    const v = function (en, id) {
      return useIndonesian ? id : en;
    };

    const DEFAULT_PACKAGE = {
      tracingedits: { duration: 3600, indefregistered: true },
      rollback: {
        enabled: false,
        bot: false,
        showname: true,
        reason: "",
      },
      block: {
        enabled: false,
        duration: "1 day",
        indefregistered: true,
        reason: "",
        autoblock: true,
        hardblock: false,
        create: true,
        talk: false,
        mail: false,
        hidename: false,
      },
      pagedelete: { enabled: false, reason: "" },
      pageprotection: {
        enabled: false,
        edit: "all",
        move: "all",
        expiry: "1 day",
        reason: "",
      },
      revisiondelete: {
        enabled: false,
        content: true,
        summary: true,
        username: false,
        reason: "",
        oversight: false,
      },
    };

    const NATIVE_PRESETS = {
      "Severe vandalism": {
        tracingedits: { duration: 86400, indefregistered: false },
        rollback: {
          enabled: true,
          bot: false,
          showname: true,
          reason: v(
            "Vandalism or other disruptive changes that reduce the quality, accuracy, or usefulness of the content",
            "Vandalisme atau perubahan mengganggu lainnya yang menurunkan kualitas, keakuratan, atau kegunaan konten",
          ),
        },
        block: {
          enabled: true,
          duration: "3 days",
          indefregistered: false,
          reason: v(
            "Vandalising content or engaging in other deliberate actions that damage content, disrupt workflows, or undermine the project's normal operation",
            "Melakukan vandalisme atau tindakan sengaja lainnya yang merusak konten, mengganggu proses kerja, atau menghambat jalannya proyek",
          ),
          autoblock: true,
          hardblock: true,
          create: true,
          talk: true,
          mail: false,
          hidename: false,
        },
        pagedelete: { enabled: false, reason: "" },
        pageprotection: { enabled: false },
        revisiondelete: { enabled: false },
      },

      "Bot attack or automated spam": {
        tracingedits: { duration: "inf", indefregistered: true },
        rollback: {
          enabled: true,
          bot: true,
          showname: true,
          reason: v(
            "Vandalism or other disruptive changes that reduce the quality, accuracy, or usefulness of the content",
            "Vandalisme atau perubahan mengganggu lainnya yang menurunkan kualitas, keakuratan, atau kegunaan konten",
          ),
        },
        block: {
          enabled: true,
          duration: "never",
          indefregistered: true,
          reason: v(
            "Using multiple accounts in a deceptive or disruptive manner, including to influence discussions or evade scrutiny",
            "Menggunakan beberapa akun secara menyesatkan atau mengganggu, termasuk untuk memengaruhi diskusi atau menghindari pengawasan",
          ),
          autoblock: true,
          hardblock: false,
          create: true,
          talk: true,
          mail: true,
          hidename: false,
        },
        pagedelete: { enabled: false, reason: "" },
        pageprotection: { enabled: false },
        revisiondelete: { enabled: false },
      },

      "Severe privacy violation or doxxing": {
        tracingedits: { duration: "inf", indefregistered: true },
        rollback: {
          enabled: true,
          bot: false,
          showname: false,
          reason: v(
            "Vandalism or other disruptive changes that reduce the quality, accuracy, or usefulness of the content",
            "Vandalisme atau perubahan mengganggu lainnya yang menurunkan kualitas, keakuratan, atau kegunaan konten",
          ),
        },
        block: {
          enabled: true,
          duration: "never",
          indefregistered: true,
          reason: v(
            "Making personal attacks, engaging in harassment or intimidation, or other conduct that undermines a respectful and collaborative environment",
            "Melakukan serangan pribadi, pelecehan, intimidasi, atau perilaku lain yang merusak suasana kolaboratif dan saling menghormati",
          ),
          autoblock: true,
          hardblock: false,
          create: true,
          talk: true,
          mail: true,
          hidename: true,
        },
        pagedelete: { enabled: false, reason: "" },
        pageprotection: { enabled: false },
        revisiondelete: {
          enabled: true,
          content: true,
          summary: true,
          username: true,
          reason: v(
            "Material containing grossly insulting, degrading, abusive, or otherwise seriously offensive content",
            "Materi yang mengandung konten yang sangat menghina, merendahkan, melecehkan, atau sangat menyinggung",
          ),
          oversight: false,
        },
      },

      "Mass page creation or spam": {
        tracingedits: { duration: 604800, indefregistered: false },
        rollback: {
          enabled: true,
          bot: false,
          showname: true,
          reason: v(
            "Promotional content or editing that may be affected by a conflict of interest",
            "Konten promosi atau penyuntingan yang mungkin dipengaruhi oleh konflik kepentingan",
          ),
        },
        block: {
          enabled: true,
          duration: "never",
          indefregistered: true,
          reason: v(
            "Using Wikipedia primarily for promotion, advertising, public relations, advocacy, or other non-encyclopedic purposes",
            "Menggunakan Wikipedia terutama untuk promosi, periklanan, hubungan masyarakat, advokasi, atau tujuan lain yang tidak bersifat ensiklopedis",
          ),
          autoblock: true,
          hardblock: false,
          create: true,
          talk: false,
          mail: false,
          hidename: false,
        },
        pagedelete: {
          enabled: true,
          reason: v(
            "Content created primarily for promotion, advertising, marketing, or public relations purposes",
            "Konten yang dibuat terutama untuk tujuan promosi, periklanan, pemasaran, atau hubungan masyarakat",
          ),
        },
        pageprotection: { enabled: false },
        revisiondelete: { enabled: false },
      },

      "Edit warring or 3RR violation": {
        tracingedits: { duration: 259200, indefregistered: false },
        rollback: {
          enabled: true,
          bot: false,
          showname: true,
          reason: v(
            "Edit warring prevention; please discuss substantial disagreements before restoring the change",
            "Pencegahan perang suntingan; mohon diskusikan perbedaan pendapat yang mendasar sebelum mengembalikan perubahan ini",
          ),
        },
        block: {
          enabled: true,
          duration: "31 hours",
          indefregistered: false,
          reason: v(
            "Exceeding or otherwise violating the three-revert rule on a page or related set of pages",
            "Melebihi atau melanggar aturan tiga pembatalan pada suatu halaman atau serangkaian halaman yang berkaitan",
          ),
          autoblock: true,
          hardblock: false,
          create: false,
          talk: false,
          mail: false,
          hidename: false,
        },
        pagedelete: { enabled: false, reason: "" },
        pageprotection: { enabled: false },
        revisiondelete: { enabled: false },
      },

      "Mass copyright infringement": {
        tracingedits: { duration: 2592000, indefregistered: false },
        rollback: {
          enabled: true,
          bot: false,
          showname: true,
          reason: v(
            "Material that may violate copyright, licensing requirements, or reuse conditions",
            "Materi yang mungkin melanggar hak cipta, ketentuan lisensi, atau syarat penggunaan ulang",
          ),
        },
        block: {
          enabled: true,
          duration: "1 week",
          indefregistered: false,
          reason: v(
            "Infringing copyright or repeatedly adding material that is not compatible with copyright or licensing requirements",
            "Melanggar hak cipta atau berulang kali menambahkan materi yang tidak sesuai dengan ketentuan hak cipta maupun lisensi",
          ),
          autoblock: true,
          hardblock: false,
          create: true,
          talk: false,
          mail: false,
          hidename: false,
        },
        pagedelete: {
          enabled: true,
          reason: v(
            "Content that clearly infringes copyright and cannot be retained under applicable licensing requirements",
            "Konten yang secara jelas melanggar hak cipta dan tidak dapat dipertahankan sesuai ketentuan lisensi yang berlaku",
          ),
        },
        pageprotection: { enabled: false },
        revisiondelete: {
          enabled: true,
          content: true,
          summary: true,
          username: false,
          reason: v(
            "Material that violates copyright requirements and cannot be retained in the page history",
            "Materi yang melanggar ketentuan hak cipta dan tidak dapat dipertahankan dalam riwayat halaman",
          ),
          oversight: false,
        },
      },

      "Sockpuppetry or block evasion": {
        tracingedits: { duration: "inf", indefregistered: true },
        rollback: {
          enabled: true,
          bot: false,
          showname: true,
          reason: v(
            "Block evasion, sockpuppetry, or other attempts to bypass community restrictions",
            "Penghindaran blokir, penggunaan akun boneka, atau upaya lain untuk menghindari pembatasan komunitas",
          ),
        },
        block: {
          enabled: true,
          duration: "never",
          indefregistered: true,
          reason: v(
            "Misusing sockpuppet accounts to mislead, influence outcomes, or circumvent community processes",
            "Menyalahgunakan akun boneka untuk menyesatkan, memengaruhi hasil, atau menghindari proses komunitas",
          ),
          autoblock: true,
          hardblock: false,
          create: true,
          talk: true,
          mail: false,
          hidename: false,
        },
        pagedelete: {
          enabled: true,
          reason: v(
            "Page created in violation of an active block, ban, or other editing restriction",
            "Halaman yang dibuat dengan melanggar blokir, pelarangan, atau pembatasan penyuntingan yang sedang berlaku",
          ),
        },
        pageprotection: { enabled: false },
        revisiondelete: { enabled: false },
      },
    };

    // ------------------------------------------------------------------------
    // Page-mode native presets
    // ------------------------------------------------------------------------
    // Unlike NATIVE_PRESETS above, these presets are only shown in the
    // Package dropdown when Tengu is operating in page mode. Only the
    // pagedelete and pageprotection sections are meaningful in page mode,
    // since rollback, block, and revision deletion require a user target.
    // As with NATIVE_PRESETS, every reason value below must match an option
    // value defined in Tengu-reasons.js exactly.
    const PAGE_NATIVE_PRESETS = {
      "Delete talk page only": {
        tracingedits: { duration: 3600, indefregistered: false },
        rollback: { enabled: false, bot: false, showname: true, reason: "" },
        block: {
          enabled: false,
          duration: "1 day",
          indefregistered: false,
          reason: "",
          autoblock: true,
          hardblock: false,
          create: true,
          talk: false,
          mail: false,
          hidename: false,
        },
        pagedelete: {
          enabled: true,
          reason: v(
            "Technical deletion performed as part of routine, non-controversial maintenance",
            "Penghapusan teknis yang dilakukan sebagai bagian dari pemeliharaan rutin dan tidak kontroversial",
          ),
        },
        pageprotection: { enabled: false },
        revisiondelete: { enabled: false },
      },

      "Speedy deletion — vandalism or test page": {
        tracingedits: { duration: 3600, indefregistered: false },
        rollback: { enabled: false, bot: false, showname: true, reason: "" },
        block: {
          enabled: false,
          duration: "1 day",
          indefregistered: false,
          reason: "",
          autoblock: true,
          hardblock: false,
          create: true,
          talk: false,
          mail: false,
          hidename: false,
        },
        pagedelete: {
          enabled: true,
          reason: v(
            "Vandalism or other deliberate actions intended to damage, disrupt, or undermine the project",
            "Vandalisme atau tindakan sengaja lainnya yang bertujuan merusak, mengganggu, atau menghambat proyek",
          ),
        },
        pageprotection: { enabled: false },
        revisiondelete: { enabled: false },
      },

      "Promotional or spam page deletion": {
        tracingedits: { duration: 3600, indefregistered: false },
        rollback: { enabled: false, bot: false, showname: true, reason: "" },
        block: {
          enabled: false,
          duration: "1 day",
          indefregistered: false,
          reason: "",
          autoblock: true,
          hardblock: false,
          create: true,
          talk: false,
          mail: false,
          hidename: false,
        },
        pagedelete: {
          enabled: true,
          reason: v(
            "Content created primarily for promotion, advertising, marketing, or public relations purposes",
            "Konten yang dibuat terutama untuk tujuan promosi, periklanan, pemasaran, atau hubungan masyarakat",
          ),
        },
        pageprotection: { enabled: false },
        revisiondelete: { enabled: false },
      },

      "Protect against persistent vandalism": {
        tracingedits: { duration: 3600, indefregistered: false },
        rollback: { enabled: false, bot: false, showname: true, reason: "" },
        block: {
          enabled: false,
          duration: "1 day",
          indefregistered: false,
          reason: "",
          autoblock: true,
          hardblock: false,
          create: true,
          talk: false,
          mail: false,
          hidename: false,
        },
        pagedelete: { enabled: false, reason: "" },
        pageprotection: {
          enabled: true,
          edit: "sysop",
          move: "sysop",
          expiry: "1 month",
          reason: v(
            "Persistent vandalism that continues despite warnings, reverts, or other attempts to address the issue",
            "Vandalisme yang terus berlanjut meskipun telah diberikan peringatan, dilakukan pembatalan, atau diambil tindakan lain untuk mengatasinya",
          ),
        },
        revisiondelete: { enabled: false },
      },
    };

    return { DEFAULT_PACKAGE, NATIVE_PRESETS, PAGE_NATIVE_PRESETS };
  },
};
