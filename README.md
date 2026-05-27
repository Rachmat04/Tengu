# Tengu — 天狗

**All-in-One Wiki Moderation Tool**

**Tengu** is a JavaScript moderation utility for MediaWiki-based projects. It combines several common administrator and anti-vandalism tasks into a single tool to help moderators respond more efficiently to disruptive edits and spam activity.

---

## Features

### Rollback

Reverts all recent edits made by a target user.

### Block

Blocks a registered user or IP address with configurable block options.

### Page Deletion

Mass-deletes pages created by a target user.

### Revision Deletion

Hides revision content, edit summaries, or usernames from public view.

---

## Purpose

TENGU is designed for:

* Anti-vandalism work
* Spam cleanup
* Rapid moderation actions
* Administrative maintenance tasks

The tool aims to reduce repetitive manual actions by combining multiple moderation utilities into one interface.

---

## Requirements

* MediaWiki-based wiki
* Appropriate administrator or moderator rights
* JavaScript enabled
* Access to the relevant MediaWiki API permissions

---

## Installation

Add the script to your personal JavaScript page or gadget configuration.

Example:

```javascript
mw.loader.load('PATH_TO_SCRIPT');
```

Replace `PATH_TO_SCRIPT` with the location of the script on your wiki.

---

## Usage

After installation, TENGU adds moderation utilities accessible through the wiki interface.

Typical workflow:

1. Open the tool interface
2. Enter the target username or IP
3. Select the desired moderation action
4. Configure options if needed
5. Execute the action

Always review actions carefully before execution.

---

## Original Script

Based on:

* WhitePhosphorus — “all-in-one”

Original source:

* [Meta-Wiki: User:WhitePhosphorus/all-in-one](https://meta.wikimedia.org/wiki/User:WhitePhosphorus/all-in-one?utm_source=chatgpt.com)

## Disclaimer

This tool performs administrative actions that may affect users, revisions, and pages permanently. Use responsibly and ensure actions comply with local wiki policies and community guidelines.
