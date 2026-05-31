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

## Changelogs

[View changelogs](./CHANGELOG.md)

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
