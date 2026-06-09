/**
 * ============================================================================
 * Tengu — 天狗
 * Version 2.6.0
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
      group: "Speedy deletion – General",
      items: [
        {
          value: "Patent nonsense, meaningless, or incomprehensible",
          label: "Patent nonsense, meaningless, or incomprehensible",
        },
        { value: "Test page", label: "Test page" },
        { value: "Vandalism", label: "Vandalism" },
        { value: "Blatant hoax", label: "Blatant hoax" },
        {
          value:
            "Recreation of a page that was deleted per a deletion discussion",
          label:
            "Recreation of a page that was deleted per a deletion discussion",
        },
        {
          value:
            "Creation by a banned or blocked user in violation of ban or block",
          label:
            "Creation by a banned or blocked user in violation of ban or block",
        },
        {
          value: "Enforcement of general sanctions",
          label: "Enforcement of general sanctions",
        },
        {
          value: "Technical deletion (uncontroversial maintenance)",
          label: "Technical deletion (uncontroversial maintenance)",
        },
        {
          value: "Deletion to make way for a page move",
          label: "Deletion to make way for a page move",
        },
        {
          value: "Unambiguously created in error or in the incorrect namespace",
          label: "Unambiguously created in error or in the incorrect namespace",
        },
        {
          value: "One author who has requested deletion or blanked the page",
          label: "One author who has requested deletion or blanked the page",
        },
        {
          value: "Page dependent on a deleted or nonexistent page",
          label: "Page dependent on a deleted or nonexistent page",
        },
        { value: "Office actions", label: "Office actions" },
        {
          value: "Attack page or negative unsourced BLP",
          label: "Attack page or negative unsourced BLP",
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
          value: "Abandoned draft or Articles for Creation submission",
          label: "Abandoned draft or Articles for Creation submission",
        },
        {
          value: "Unnecessary disambiguation page",
          label: "Unnecessary disambiguation page",
        },
        {
          value: "LLM-generated content that has not been adequately reviewed",
          label: "LLM-generated content that has not been adequately reviewed",
        },
      ],
    },
    {
      group: "Speedy deletion – Articles",
      items: [
        { value: "No context", label: "No context" },
        {
          value:
            "Foreign-language articles that exist on another Wikimedia project",
          label:
            "Foreign-language articles that exist on another Wikimedia project",
        },
        { value: "No content", label: "No content" },
        {
          value:
            "No indication of importance (people, animals, organisations, web content, events)",
          label:
            "No indication of importance (people, animals, organisations, web content, events)",
        },
        {
          value: "No indication of importance (musical recordings)",
          label: "No indication of importance (musical recordings)",
        },
        {
          value: "Recently created article duplicating an existing topic",
          label: "Recently created article duplicating an existing topic",
        },
        { value: "Obviously invented", label: "Obviously invented" },
      ],
    },
    {
      group: "Speedy deletion – Redirects",
      items: [
        {
          value: "Cross-namespace redirects",
          label: "Cross-namespace redirects",
        },
        {
          value: "Recently created implausible typos",
          label: "Recently created implausible typos",
        },
        {
          value: "File namespace redirects matching Wikimedia Commons files",
          label: "File namespace redirects matching Wikimedia Commons files",
        },
      ],
    },
    {
      group: "Speedy deletion – Files",
      items: [
        { value: "Redundant files", label: "Redundant files" },
        {
          value: "Corrupt, missing, or empty files",
          label: "Corrupt, missing, or empty files",
        },
        { value: "Improper licence", label: "Improper licence" },
        {
          value: "Lack of licensing information",
          label: "Lack of licensing information",
        },
        {
          value: "Orphaned non-free use files",
          label: "Orphaned non-free use files",
        },
        {
          value: "Missing non-free use rationale",
          label: "Missing non-free use rationale",
        },
        {
          value: "Invalid non-free use claim",
          label: "Invalid non-free use claim",
        },
        {
          value: "Files available as identical copies on Wikimedia Commons",
          label: "Files available as identical copies on Wikimedia Commons",
        },
        {
          value: "Unambiguous copyright infringement",
          label: "Unambiguous copyright infringement",
        },
        {
          value: "No evidence of permission",
          label: "No evidence of permission",
        },
      ],
    },
    {
      group: "Speedy deletion – Categories",
      items: [
        {
          value: "Unpopulated categories",
          label: "Unpopulated categories",
        },
        {
          value: "Speedy renaming and merging",
          label: "Speedy renaming and merging",
        },
        {
          value: "Unused maintenance categories",
          label: "Unused maintenance categories",
        },
      ],
    },
    {
      group: "Speedy deletion – Templates",
      items: [
        {
          value: "Unused template subpages",
          label: "Unused template subpages",
        },
      ],
    },
    {
      group: "Speedy deletion – User pages",
      items: [
        { value: "User request", label: "User request" },
        { value: "Non-existent user", label: "Non-existent user" },
        {
          value: "Abandoned user subpages of non-contributors",
          label: "Abandoned user subpages of non-contributors",
        },
        {
          value: "Excessively unrelated non-draft subpages by non-contributors",
          label: "Excessively unrelated non-draft subpages by non-contributors",
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
            'Redirect in the "File:" namespace with the same name as a file or redirect at Wikimedia Commons',
          label:
            'Redirect in the "File:" namespace with the same name as a file or redirect at Wikimedia Commons',
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
          value: "Listed at Wikipedia:Copyright problems for over seven days",
          label: "Listed at Wikipedia:Copyright problems for over seven days",
        },
        {
          value:
            "Page created by contributor with extensive history of copyright violations",
          label:
            "Page created by contributor with extensive history of copyright violations",
        },
        {
          value: "Nominated for seven days with no objection",
          label: "Nominated for seven days with no objection",
        },
        {
          value:
            "Nominated for seven days with no reliable sources present in the article",
          label:
            "Nominated for seven days with no reliable sources present in the article",
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
