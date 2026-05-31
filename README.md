# Tengu — 天狗

**Type:** All-in-one MediaWiki moderation tool  
**Language:** JavaScript (User script)

---

## Overview

**Tengu** (天狗) is an all-in-one moderation script designed for MediaWiki platforms. It brings several common administrative actions into a single interface, helping moderators manage users and pages more efficiently.

It is intended for experienced users with the appropriate rights on a wiki.

---

## Purpose

This tool combines multiple moderation tasks into one workflow:

- User blocking
- Page rollback
- Page deletion
- Page protection
- Revision deletion

The goal is to reduce the need to switch between different interfaces when performing routine moderation work.

---

## Key features

### Rollback
- Reverts all recent edits by a selected user.
- Uses undo fallback when rollback rights are not available.

### Block user / IP
- Blocks users or IP addresses.
- Supports configurable options.
- Includes automatic expiry settings.

### Page deletion
- Mass-deletes pages created by a target user.

### Page protection
- Mass-protects pages created or edited by a target user.
- Includes preset reason options.

### Revision deletion
- Hides revision content, edit summaries, or usernames.

### Task control
- Abort button added in v1.5.0 to cancel running operations.

---

## Installation

This script is designed for MediaWiki user scripts.

1. Copy the script into your wiki user JavaScript page (for example: `User:<username>/common.js`).
2. Save the page.
3. Refresh your browser cache.
4. Open the moderation interface from the configured entry point (depends on implementation in your wiki setup).

---

## Usage

1. Open the Tengu interface.
2. Enter the target username or IP address.
3. Select the moderation action:
   - Rollback
   - Block
   - Delete pages
   - Protect pages
   - Revision deletion
4. Configure options where required.
5. Confirm the action in the warning dialogue.
6. Monitor progress in the log panel.

---

## Changelogs

### v1.5.9
#### Added
- Added `formatApiError()` helper (Section 04) to provide plain-language hints for permission-related API failures when users lack required rights.

#### Changed
- Separated talk-page notification errors from action errors in Block and Protect sections, so a failed notification no longer marks the main action as failed.
- Separated main-page and talk-page deletion errors in the Delete section, so a failed talk-page deletion does not hide a successful main-page deletion.
- Applied `formatApiError()` across all catch blocks, including Revdel, Undo, Rollback, Protect, Block, Delete, and contribution fetch operations.
- Simplified wording in block and protection notifications by removing redundant references to automation.

#### Fixed
- Block notifications now display "blocked indefinitely" instead of "blocked for never".
- Block expiry messages are now shown conditionally and correctly handle indefinite blocks.
- Protection notifications no longer append an incorrect "days" suffix to expiry values.
- Protection notifications now display "protected indefinitely" instead of "protected for never".
- Protection expiry messages are now shown conditionally and correctly handle indefinite protections.

### v1.5.8
#### Fixed
- Undo-skipped log messages now render in amber (warning) instead of green (success), making it clear that no undo action was applied and no page changes were made by the operation.

#### Added
- Added the `tng-log-warn` CSS class for warning log entries, including dark mode support.

#### Improved
- Extended `addLog()` to support a `warn` log type alongside the existing error type.
- Updated undo-skipped messages to explicitly state that the undo was not applied because the page had already been reverted by another user.

### v1.5.7
#### Added
- Improved log messages when an undo operation is skipped because the page has already been reverted.

#### Improved
- Improved consistency in sentence case and en-GB spelling across all interfaces and log messages.

### v1.5.6
#### Added
- Automatic deletion of associated talk pages when deleting a page.

### v1.5.5
#### Added
- Self-block verification step to help prevent accidental self-blocking.

### v1.5.4
#### Added
- Auto-dismissing inline notification bubbles for input validation.

#### Improved
- Validation notifications now automatically hide after five seconds and clear when the user updates the input.

### v1.5.3
#### Added
- Integrated notification style for form validation errors.

#### Changed
- Replaced standard browser alerts with built-in dialog notifications.

### v1.5.2
#### Added
- Automatic user talk page notification when an account is blocked.

### v1.5.1
#### Added
- Automatic talk page notification when a page is protected.

### v1.5.0
#### Added
- Abort button during task execution, allowing ongoing operations to be cancelled.

### v1.4.1
#### Fixed
- Fixed a user interface issue where the page protection preset reasons dropdown was incorrectly attached to the revision deletion module.

### v1.4.0
#### Added
- Page protection feature with a comprehensive set of preset protection reasons.
- Confirmation dialog before executing page deletion or page protection actions.

### v1.3.0
#### Added
- Preset reasons configuration array for the page protection feature.

### v1.2.0
#### Fixed
- Reduced API request throttling by switching to sequential execution using native ES6 promises.
- Fixed pagination bottlenecks by explicitly handling query continuation tokens.

#### Changed
- Standardised interface elements, logs, labels, and comments using sentence case and en-GB spelling.

### v1.1.0
#### Added
- Optional undo fallback method for users without native rollback permissions.

#### Changed
- Reduced the height of the progress log to improve screen space utilisation.

---

## Safety notes

- This tool performs high-impact administrative actions.
- Always verify the target before confirming any operation.
- Some actions may be irreversible (e.g. deletions and revision hiding).
- Use caution when applying mass operations.

---

## Installation

This script can be installed either locally (on a single wiki) or globally (across multiple wikis, if your account supports global scripts).

### Local installation (common.js)

Use this method if you want Tengu on one wiki only.

1. Open your user JavaScript page:
```
User:<username>/common.js
```
2. Add the script code to the page.
- Paste the full Tengu script.
3. Save the page.
4. Clear your browser cache or perform a hard refresh.
5. Reload the wiki page to activate the tool.

### Global installation (global.js)

Use this method if your wiki account supports global scripts (e.g. via Global Preferences or a global.js setup).

1. Open your global JavaScript page:
```
User:<username>/global.js
```
2. Paste the full Tengu script into the file.
3. Save the page.
4. Ensure global scripts are enabled in your preferences (if required by your wiki setup).
5. Refresh all open wiki tabs or restart your browser session.
6. The tool should now load on all supported wikis.

---

### Notes

- Some wikis may disable global scripts for security reasons.
- If it does not appear after installation: check browser console for errors, confirm your user rights allow script execution, and verify the script is not blocked by another gadget or user script.

---

## Credits

- Based on: `User:WhitePhosphorus/all-in-one`
- Original script: https://meta.wikimedia.org/wiki/User:WhitePhosphorus/all-in-one

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

Use of this tool may result in irreversible changes (such as deletions, blocks, or revision suppression). Always verify targets and settings before confirming actions.
