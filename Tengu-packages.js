/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Predefined packages
 * ============================================================================
 * PURPOSE:
 * This file contains the default package and the native preset packages
 * (quick-select bundles of rollback/block/deletion/protection/revdel
 * settings) used to populate the Package dropdown.
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
  get: function () {
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
          reason: "Vandalism",
        },
        block: {
          enabled: true,
          duration: "3 days",
          indefregistered: false,
          reason: "Vandalism",
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
          reason: "Vandalism",
        },
        block: {
          enabled: true,
          duration: "never",
          indefregistered: true,
          reason: "Abusing multiple accounts",
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
          reason: "Vandalism",
        },
        block: {
          enabled: true,
          duration: "never",
          indefregistered: true,
          reason: "Personal attacks or harassment policy violations",
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
          reason: "Grossly insulting, degrading, or offensive material",
          oversight: false,
        },
      },

      "Mass page creation or spam": {
        tracingedits: { duration: 604800, indefregistered: false },
        rollback: {
          enabled: true,
          bot: false,
          showname: true,
          reason: "Promotional editing or editing with a conflict of interest",
        },
        block: {
          enabled: true,
          duration: "never",
          indefregistered: true,
          reason: "Using Wikipedia for promotion or advertising purposes",
          autoblock: true,
          hardblock: false,
          create: true,
          talk: false,
          mail: false,
          hidename: false,
        },
        pagedelete: {
          enabled: true,
          reason: "Purely promotional content",
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
          reason: "Edit warring prevention",
        },
        block: {
          enabled: true,
          duration: "31 hours",
          indefregistered: false,
          reason: "Violation of the three-revert rule",
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
          reason: "Copyright violations",
        },
        block: {
          enabled: true,
          duration: "1 week",
          indefregistered: false,
          reason: "Copyright infringement",
          autoblock: true,
          hardblock: false,
          create: true,
          talk: false,
          mail: false,
          hidename: false,
        },
        pagedelete: {
          enabled: true,
          reason: "Clear copyright infringement",
        },
        pageprotection: { enabled: false },
        revisiondelete: {
          enabled: true,
          content: true,
          summary: true,
          username: false,
          reason: "Violations of copyright policy",
          oversight: false,
        },
      },

      "Sockpuppetry or block evasion": {
        tracingedits: { duration: "inf", indefregistered: true },
        rollback: {
          enabled: true,
          bot: false,
          showname: true,
          reason: "Block evasion or use of sockpuppet accounts",
        },
        block: {
          enabled: true,
          duration: "never",
          indefregistered: true,
          reason: "Sockpuppetry",
          autoblock: true,
          hardblock: false,
          create: true,
          talk: true,
          mail: false,
          hidename: false,
        },
        pagedelete: {
          enabled: true,
          reason:
            "Creation by a banned or blocked user in violation of ban or block",
        },
        pageprotection: { enabled: false },
        revisiondelete: { enabled: false },
      },
    };

    return { DEFAULT_PACKAGE, NATIVE_PRESETS };
  },
};
