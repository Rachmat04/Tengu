# Tengu — 天狗

**Type:** All-in-one MediaWiki moderation tool  
**Language:** JavaScript (User script)  
**Current version:** 2.81.0

---

## Overview

**Tengu** (天狗) is an all-in-one moderation script for MediaWiki platforms. It combines multiple administrative actions into a single interface, reducing the need to switch between different pages when performing routine moderation work.

It is intended for experienced users with the appropriate rights on a wiki.

---

## Operating modes

Tengu operates in two modes, switchable via a toggle in the dialogue.

### User mode
Targets a specific user or IP address. Rollback, block, unblock, user warnings, revision deletion, and reports are only available in this mode.

### Page mode
Targets a specific page. Page deletion, page undeletion, page protection, protect against recreation, and page moves are available in this mode. Deletion and protection can also operate on pages created or edited by a target user when Tengu is used in user mode.

Tengu automatically selects the most appropriate mode based on the page you open it from. On user contribution pages it defaults to user mode; elsewhere it defaults to page mode. IP ranges are not supported in user mode.

---

## Features

### Rollback
- Reverts all recent edits by a target user within a selected time window, between two dates, or from a custom selection.
- Uses native rollback by default; falls back to undo when rollback rights are unavailable.
- Optional bot-edit flag, username display in summary, and custom reason.
- Automatically falls back to native rollback for pages using the ZObject content model (Wikifunctions).

### Block
- Blocks users or IP addresses with configurable expiry, reason, and flags (autoblock, account-creation block, talk-page block, email block, hard block, username hiding).
- Pre-fills the block form with settings from any active block on the target.
- Detects temporary accounts and sets a default 3-month expiry automatically.
- Optionally clears the target's talk page before posting a block notification (indefinite blocks only).
- Optionally posts a block notification to the target's talk page.
- Shows current block status (including block scope: full or partial) and global lock/block status in the section header.

### Unblock
- Lifts an active block on a target user.
- Preset and free-text unblock reasons.
- Optionally posts an unblock notification to the target's talk page.
- Only available when the target is currently blocked.

### User warning
- Posts a templated warning or notice to the target user's talk page.
- Warning groups include: common warnings, behaviour in articles, promotions and spam, single notices, behaviour towards other editors, single warnings, removal of deletion tags, and other warnings.
- Supports an optional additional-information field and a final-warning option that adjusts the heading and body accordingly.

### Page deletion
- Deletes pages created by the target user (user mode) or a specific target page (page mode).
- Options:
  - Also delete the associated talk page.
  - Delete redirects pointing to each deleted page.
  - Delete subpages of each deleted page.
  - Remove wikilinks to deleted pages from articles in the main namespace. When the deleted item is a file, also removes file embeds and gallery entries. *(Experimental.)*
  - Protect the deleted page against recreation, with configurable level, expiry, and reason.
  - Send a deletion notification to the page creator's talk page.

### Page undeletion
- Restores a previously deleted page.
- Only available in page mode when the target has deletion log entries and you hold the undelete right.
- Preset and free-text restoration reasons.

### Move page
Two sub-modes, selectable via a dropdown:

- **Move to user's sandbox** — moves the target page into a user's subpage (e.g. `User:[username]/[subpage name]`). Supports a "Same as page creator" option to auto-fill the username, an optional talk-page move, and an optional subpage move.
- **Move page** — moves the target page to an arbitrary destination title. Supports moving the associated talk page and all subpages via native API parameters in a single call, with configurable reason and suppress-redirect option.

Suppressing the redirect requires the `suppressredirect` right (sysops only).

Only available in page mode.

### Page protection
- Protects pages edited or created by the target user (user mode) or a specific target page (page mode).
- Configurable edit restriction, move restriction, and upload restriction (file pages only).
- Configurable expiry and reason.
- Extended confirmed users option, available on wikis where this protection level is configured.
- Cascading protection option (administrators-only edit restriction required).
- Optionally also protects the associated talk page.
- Optionally sends a protection notification to the relevant talk page.
- Pre-fills protection settings from any active protection on the target page.

### Protect against recreation
- Protects a deleted or non-existent page against recreation using create-level protection.
- Configurable protection level, expiry, and reason.
- Only available in page mode when the target page does not exist.

### Revision deletion
- Hides revision content, edit summaries, or usernames.
- Optional oversight (suppress) flag, requiring the `suppressrevision` right.
- Preset and free-text reasons.
- Only available in user mode.

### Report to Global sysops/Requests
- Files a report on Meta-Wiki's Global sysops/Requests page.
- **User mode** — reports an account, using `{{LockHide}}` with the reporting wiki's interwiki prefix. IP addresses use an interwiki-linked contributions page.
- **Page mode** — reports a page for deletion, protection, or revision deletion, using an interwiki-linked page title.
- Quick-select reason checkboxes with an optional additional-details field.
- Available on wikis within the scope of the global sysops service.

### Report to Steward requests/Global
- Files a report on Meta-Wiki's Steward requests/Global page.
- Files a **global block request** when the target is an IP address or temporary account.
- Files a **global lock request** when the target is a registered account, with an optional "lock and hide" option.
- Inserts the new section above the relevant anchor heading rather than appending at the bottom of the page.
- Checks for an existing open report for the same target before submitting.
- Only available in user mode.

### Export edits
- Fetches the target user's full contribution history and collects all unique pages they have edited.
- Namespace filter, A–Z and Z–A sort, a page count summary, and a scrollable wikitext preview.
- Copy-to-clipboard output in numbered wikitext list format.
- File and Category pages are prefixed with a colon to render as hyperlinks rather than embeds or category tags.
- Only available in user mode.

### Select specific edits/pages
- When "Select specific edits/pages" is chosen in the Edits dropdown, a picker dialogue opens.
- Fetches the target user's full contribution history and groups pages into **Edited pages** and **Created pages**.
- Namespace filter, A–Z / Z–A / oldest-first / newest-first sort controls, per-item checkboxes, and bulk select/deselect/invert controls.
- Previously confirmed selections are pre-ticked when the picker is reopened.
- Only available in user mode.

### Get info
- Opens a read-only information panel for the current target.
- **User mode** — shows the target's block log, rights changes, abuse filter log, local groups and rights, global groups and rights, and global lock/block status.
- **Page mode** — shows the page's abuse filter log, protection log, deletion log, and move log.
- Sections that have entries expand automatically.

### Task control
- An abort button cancels ongoing operations.
- A progress log shows timestamped entries for every action taken, including warnings and errors.
- A "Copy this log" button copies the full log to the clipboard at the end of a run.

---

## Interface features

### Package presets
Ready-made bundles of settings for common moderation scenarios. Selecting a package pre-fills rollback, block, deletion, and protection settings in one step. Presets are mode-aware: user-mode presets cover rollback, block, and revision deletion; page-mode presets cover deletion and protection.

Built-in user-mode presets: Severe vandalism, Bot attack or automated spam, Severe privacy violation or doxxing, Mass page creation or spam, Edit warring or 3RR violation, Mass copyright infringement, Sockpuppetry or block evasion.

Built-in page-mode presets: Delete talk page only, Speedy deletion (vandalism or test page), Promotional or spam page deletion, Protect against persistent vandalism.

Custom packages can be supplied via the `window.p4js_all_in_one.packages` configuration object.

### Rights panel
Displayed in the dialogue footer. Shows your rollback and sysop status on the current wiki, and your global rollback, global sysop, and steward status. Sections you lack the rights to use are locked automatically.

### Dark mode
A manual light/dark mode toggle is available in the dialogue, on the same row as the mode toggle. The selected theme is saved to `localStorage` and reapplied the next time Tengu opens. If no preference has been saved, Tengu falls back to the browser's `prefers-color-scheme` setting.

### Edits filter
The Edits dropdown controls which contributions are processed in user mode:

- **In the last N hours/days/weeks/months** — fixed time windows back from now.
- **All edits** — no time limit.
- **Custom date and time** — a date/time picker lets you set a specific cutoff.
- **Between two dates** — from/to date pickers for a specific window.
- **Select specific edits/pages** — opens the contribution picker described above.

---

## Localisation

Tengu is bilingual. The interface is always in English. Reason strings, notification text, and edit summaries are in Indonesian on wikis whose content language is one of the Indonesian regional language codes (`id`, `ace`, `ban`, `bjn`, and others). All other wikis receive English.

---

## Installation

This script is designed for MediaWiki user scripts and can be installed locally (single wiki) or globally (all wikis where your account supports global scripts).

### Local installation (common.js)

1. Open your user JavaScript page:
```
   User:<username>/common.js
```
2. Add this line:
```js
   mw.loader.load('//id.wikipedia.org/w/index.php?title=Pengguna:Rachmat04/Tengu.js&action=raw&ctype=text/javascript');
```
3. Save the page.
4. Clear your browser cache or perform a hard refresh.
5. Reload the wiki page to activate the tool.

### Global installation (global.js)

1. Open your global JavaScript page on Meta-Wiki:
```
   User:<username>/global.js
```
2. Add this line:
```js
   mw.loader.load('//id.wikipedia.org/w/index.php?title=Pengguna:Rachmat04/Tengu.js&action=raw&ctype=text/javascript');
```
3. Save the page.
4. Clear your browser cache or perform a hard refresh.
5. Reload the wiki page to activate the tool.

---

## Usage

1. Open any page on a supported wiki. A "⛩️ Tengu" link appears in the page actions area.
2. Click the link to open the Tengu dialogue.
3. Confirm or adjust the target user or page in the target field.
4. Select the operating mode (user mode or page mode) if the default is not correct.
5. Enable one or more action sections using their checkboxes.
6. Configure options and reasons as needed.
7. Click **Start** and confirm the operation in the confirmation dialogue.
8. Monitor progress in the log panel. Click **Copy this log** to copy the log for your records.

---

## Safety notes

- This tool performs high-impact administrative actions.
- Always verify the target before confirming any operation.
- Some actions are irreversible (deletions, revision hiding, page moves without a redirect).
- Use caution when applying mass operations.
- The file delinking feature is experimental. Check results carefully.
- Cross-wiki reports (Global sysops/Requests, Steward requests/Global) are submitted directly to Meta-Wiki using your existing SUL session. Verify the report before confirming.

---

## Notes

- Some wikis may disable global scripts for security reasons.
- If Tengu does not appear after installation: check your browser console for errors, confirm your user rights allow script execution, and verify the script is not blocked by another gadget or user script.
- Extended confirmed protection is only shown on wikis where it is configured.
- The `suppressredirect` option in page moves is only available to users with that right (typically sysops).

---

## Credits

- Based on: `User:WhitePhosphorus/all-in-one`
- Original script: https://meta.wikimedia.org/wiki/User:WhitePhosphorus/all-in-one

---

## Changelogs

[View changelogs](./CHANGELOG.md)

---

## License

This project is licensed under the MIT License.

You are free to use, copy, modify, and distribute this software under the terms of the MIT License, provided that the original copyright notice and permission notice are included in all copies or substantial portions of the software.

---

## Disclaimer

- This tool is provided as-is, without any guarantee of correctness, stability, or suitability for any specific use.
- The developer does not take responsibility for any actions performed using this tool.
- All use of this script is the sole responsibility of the user.
- Users are expected to ensure compliance with their local wiki policies and rules before using any features.

Use of this tool may result in irreversible changes (such as deletions, blocks, page moves, or revision suppression). Always verify targets and settings before confirming actions.