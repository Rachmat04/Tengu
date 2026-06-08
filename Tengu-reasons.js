/**
 * ============================================================================
 * Tengu — 天狗
 * Version 2.5.0
 * All-in-one wiki moderation tool — Pre-populated reason sets
 * ============================================================================
 * PURPOSE:
 * This file contains pre-populated reason sets for rollbacks, page deletions, and block actions,
 * which are used to provide convenient dropdown options for moderators when performing these actions.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
window.TenguReasons = {
  ROLLBACK_REASONS: [
    { value: "", label: "Other:" },
    { value: "Vandalism", label: "Vandalism" },
    {
      value: "Incorrect or unsourced information",
      label: "Incorrect or unsourced information",
    },
    {
      value: "Violations of biographies of living persons policy",
      label: "Violations of biographies of living persons policy",
    },
    { value: "Copyright violations", label: "Copyright violations" },
    {
      value: "Promotional editing or conflict of interest",
      label: "Promotional editing or conflict of interest",
    },
    {
      value: "Technical disruption or formatting damage",
      label: "Technical disruption or formatting damage",
    },
    {
      value: "Addition of irrelevant content",
      label: "Addition of irrelevant content",
    },
    {
      value: "Changes against established consensus",
      label: "Changes against established consensus",
    },
    { value: "Edit warring prevention", label: "Edit warring prevention" },
    {
      value: "Block evasion or sockpuppetry",
      label: "Block evasion or sockpuppetry",
    },
  ],
  BLOCK_REASONS: [
    { value: "", label: "Other:" },
    {
      group: "Common block reasons",
      items: [
        { value: "Vandalism", label: "Vandalism" },
        { value: "Copyright infringement", label: "Copyright infringement" },
        { value: "Creating attack pages", label: "Creating attack pages" },
        {
          value: "Violations of the biographies of living persons policy",
          label: "Violations of the biographies of living persons policy",
        },
        {
          value: "Persistent addition of unsourced content",
          label: "Persistent addition of unsourced content",
        },
        {
          value: "Creating patent nonsense or other inappropriate pages",
          label: "Creating patent nonsense or other inappropriate pages",
        },
        {
          value: "Using Wikipedia for promotion or advertising purposes",
          label: "Using Wikipedia for promotion or advertising purposes",
        },
        { value: "Edit warring", label: "Edit warring" },
        {
          value: "Violation of the three-revert rule",
          label: "Violation of the three-revert rule",
        },
        { value: "Disruptive editing", label: "Disruptive editing" },
        {
          value: "Personal attacks or violations of the harassment policy",
          label: "Personal attacks or violations of the harassment policy",
        },
        {
          value: "Arbitration enforcement",
          label: "Arbitration enforcement",
        },
        {
          value: "Contentious topic restriction",
          label: "Contentious topic restriction",
        },
        { value: "Block evasion", label: "Block evasion" },
        {
          value: "Abusing multiple accounts",
          label: "Abusing multiple accounts",
        },
        {
          value: "Repeatedly triggering the edit filter",
          label: "Repeatedly triggering the edit filter",
        },
        { value: "Sockpuppetry", label: "Sockpuppetry" },
        {
          value:
            "Revoking talk page access: Inappropriate use of user talk page whilst blocked",
          label:
            "Revoking talk page access: Inappropriate use of user talk page whilst blocked",
        },
        {
          value: "Account is used solely for vandalism",
          label: "Account is used solely for vandalism",
        },
      ],
    },
    {
      group: "Username policy violations",
      items: [
        {
          value: "Username violates the username policy",
          label: "Username violates the username policy",
        },
        {
          value: "Username indicates use of a bot without authorisation",
          label: "Username indicates use of a bot without authorisation",
        },
        {
          value: "Username is promotional or advertising in nature",
          label: "Username is promotional or advertising in nature",
        },
        {
          value: "Username is too similar to another user's",
          label: "Username is too similar to another user's",
        },
        {
          value: "Username impersonates another user",
          label: "Username impersonates another user",
        },
        {
          value: "Username impersonates a famous figure",
          label: "Username impersonates a famous figure",
        },
        {
          value: "Username impersonates a (non-)profit organisation",
          label: "Username impersonates a (non-)profit organisation",
        },
      ],
    },
  ],
  PAGE_DELETE_REASONS: [
    { value: "", label: "Other:" },
    {
      group: "Speedy deletion",
      items: [
        {
          value:
            "Ambiguous text or gibberish lacking meaningful content or context",
          label:
            "Ambiguous text or gibberish lacking meaningful content or context",
        },
        { value: "Test page", label: "Test page" },
        { value: "Pure vandalism", label: "Pure vandalism" },
        { value: "Blatant hoax", label: "Blatant hoax" },
        {
          value: "Recreation of material deleted via a deletion discussion",
          label: "Recreation of material deleted via a deletion discussion",
        },
        {
          value: "Created by a banned or blocked user",
          label: "Created by a banned or blocked user",
        },
        {
          value: "Created in violation of a general sanction",
          label: "Created in violation of a general sanction",
        },
        {
          value: "Unambiguously created in error",
          label: "Unambiguously created in error",
        },
        {
          value: "Deletion to make way for a page move",
          label: "Deletion to make way for a page move",
        },
        {
          value: "Technical deletion resulting from a deletion discussion",
          label: "Technical deletion resulting from a deletion discussion",
        },
        {
          value: "Deletion to make way for an Articles for creation move",
          label: "Deletion to make way for an Articles for creation move",
        },
        {
          value: "Deletion to rectify a copy-and-paste page move",
          label: "Deletion to rectify a copy-and-paste page move",
        },
        {
          value: "Housekeeping and non-controversial cleanup",
          label: "Housekeeping and non-controversial cleanup",
        },
        {
          value: "Author requests deletion, or author blanked",
          label: "Author requests deletion, or author blanked",
        },
        {
          value: "Pages dependent on a non-existent or deleted page",
          label: "Pages dependent on a non-existent or deleted page",
        },
        {
          value: "Subpages with no parent page",
          label: "Subpages with no parent page",
        },
        { value: "Attack page", label: "Attack page" },
        {
          value: "Wholly negative, unsourced biography of a living person",
          label: "Wholly negative, unsourced biography of a living person",
        },
        {
          value: "Unambiguous advertising or promotion",
          label: "Unambiguous advertising or promotion",
        },
        {
          value: "Unambiguous copyright infringement",
          label: "Unambiguous copyright infringement",
        },
        {
          value: "Unnecessary disambiguation page",
          label: "Unnecessary disambiguation page",
        },
        {
          value: "Unreviewed content generated by a large language model",
          label: "Unreviewed content generated by a large language model",
        },
      ],
    },
    {
      group: "Redirect pages",
      items: [
        {
          value: "Cross-namespace redirect from mainspace",
          label: "Cross-namespace redirect from mainspace",
        },
        {
          value: "Recently created, implausible redirect",
          label: "Recently created, implausible redirect",
        },
        {
          value:
            "Redirect in the File namespace with the same name as a file or redirect at Wikimedia Commons",
          label:
            "Redirect in the File namespace with the same name as a file or redirect at Wikimedia Commons",
        },
        {
          value:
            "Redirect created by moving away from a title that was obviously unintended",
          label:
            "Redirect created by moving away from a title that was obviously unintended",
        },
        {
          value: "Redirect to a deleted or nonexistent page",
          label: "Redirect to a deleted or nonexistent page",
        },
      ],
    },
    {
      group: "Other criteria",
      items: [
        {
          value: "Listed at copyright problems for over seven days",
          label: "Listed at copyright problems for over seven days",
        },
        {
          value:
            "Page created by contributor with extensive history of copyright violations",
          label:
            "Page created by contributor with extensive history of copyright violations",
        },
        {
          value: "Nominated for seven days with no objection (PROD)",
          label: "Nominated for seven days with no objection (PROD)",
        },
        {
          value:
            "Nominated for seven days with no reliable sources present in the article (BLPPROD)",
          label:
            "Nominated for seven days with no reliable sources present in the article (BLPPROD)",
        },
      ],
    },
  ],
  PROTECTION_REASONS: [
    { value: "", label: "Other:" },
    {
      group: "Edit protection",
      items: [
        { value: "Persistent vandalism", label: "Persistent vandalism" },
        { value: "Persistent spamming", label: "Persistent spamming" },
        {
          value: "Persistent sockpuppetry",
          label: "Persistent sockpuppetry",
        },
        {
          value: "Persistent disruptive editing",
          label: "Persistent disruptive editing",
        },
        {
          value: "Persistent block evasion",
          label: "Persistent block evasion",
        },
        {
          value: "Violations of the biographies of living persons policy",
          label: "Violations of the biographies of living persons policy",
        },
        {
          value: "Addition of unsourced or poorly sourced content",
          label: "Addition of unsourced or poorly sourced content",
        },
        {
          value: "Edit warring / content dispute",
          label: "Edit warring / content dispute",
        },
        {
          value: "Arbitration enforcement",
          label: "Arbitration enforcement",
        },
        {
          value: "Contentious topic restriction",
          label: "Contentious topic restriction",
        },
        {
          value: "Community sanctions enforcement",
          label: "Community sanctions enforcement",
        },
        {
          value: "User request within own user space",
          label: "User request within own user space",
        },
        {
          value: "High-risk template or module",
          label: "High-risk template or module",
        },
        {
          value: "User page of deceased editor",
          label: "User page of deceased editor",
        },
      ],
    },
    {
      group: "Move protection",
      items: [
        { value: "Page-move vandalism", label: "Page-move vandalism" },
        { value: "Move warring", label: "Move warring" },
        { value: "Highly visible page", label: "Highly visible page" },
      ],
    },
    {
      group: "Images",
      items: [
        {
          value: "Image about to be featured on the Main Page",
          label: "Image about to be featured on the Main Page",
        },
      ],
    },
    {
      group: "Unprotection",
      items: [
        {
          value: "Testing whether long-term protection is still needed",
          label: "Testing whether long-term protection is still needed",
        },
        { value: "No longer necessary", label: "No longer necessary" },
      ],
    },
  ],
};
