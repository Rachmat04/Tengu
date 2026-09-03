## 2.151.0

### Changed

* Expanded file-usage detection in the Page deletion section's "Remove links to deleted page or file" option. Previously, unlinking a deleted file only matched namespace-prefixed forms (`[[File:Example.jpg]]`, `[[Berkas:Example.jpg]]`, bare gallery lines with a prefix). A new bare-filename pattern now also matches the filename alone with no namespace prefix at all (e.g. `Example.jpg` used as an infobox parameter value), so such references are removed as well.

### Notes

* The bare-filename regex is anchored to boundary characters (`=`, `|`, whitespace, start/end of line, `]]`) on both sides of the filename, so a matching substring inside unrelated prose or a longer URL should not be affected, but this has not been tested live.
* Pages to check are still discovered via the existing `list=imageusage` API call; this change only affects how a bare filename occurrence is matched and removed once such a page's wikitext is being processed.
* `removeBalancedFileEmbeds()`, the gallery-line removal, nested-link/template handling, logging, and the deletion workflow itself are unchanged.

## 2.150.0

### Changed

* Updated the destination-page existence checker (Move page section) icon set: ❓ (not yet checked) / ❌ ("Destination page already exists") / ✔️ ("Destination page does not exist"), replacing the previous ❓ / ❎ / ✅ set. Behaviour is unchanged: the result is retained until the destination title changes, at which point the button resets to ❓.
* Widened the **Subpage name** field in the **Move to user's sandbox** sub-mode so the destination-page existence checker button sits flush against it on the same row, matching the layout already used by the **Move page** sub-mode's destination title field.

### Added

* Added a **"Delete destination page if it already exists (destructive)"** option to the **Move to user's sandbox** sub-mode of the Move page section, matching the equivalent option already available in the **Move page** sub-mode. When ticked, if the destination subpage already exists, it is deleted immediately before the move is attempted, using the same reason entered for the move itself.

### Notes

* This is a destructive action: verify the destination username/subpage carefully before enabling this option, since the deleted page is not automatically restored if the subsequent move fails.
* A `delete` operation counter increment is logged for the destination-page deletion, consistent with the equivalent behaviour in the Move page sub-mode.

## 2.149.0

### Added

* Added a destination-page existence checker (❓ / ❎ / ✅) to the **Move page** section, available in both the **Move page** and **Move to user's sandbox** sub-modes. The button sits immediately to the right of the relevant destination field (the destination title field in **Move page**; the subpage name field in **Move to user's sandbox**, checked against the full `User:[username]/[subpage]` title).
* Clicking the button checks whether the current destination title already exists, using the exact title including its namespace. ❎ ("Destination page already exists") signals the page may need to be deleted first; ✅ ("Destination page does not exist") signals the title is available. Both states show an explanatory tooltip on hover.
* The check result is retained until the destination title changes (via the namespace selector, the destination/subpage field, or the "Same as page creator" auto-fill), at which point the button resets to ❓, since the previous result no longer applies.
* Added `.tng-destcheck-btn` and its `.tng-destcheck-exists`/`.tng-destcheck-notexists` state classes to `Tengu.css`, with a smooth colour transition between states and dark-mode variants.

### Notes

* If the existence check itself fails (e.g. a network error), the button resets to ❓ rather than reporting either state, so a failed check is never mistaken for a confirmed result.

## 2.148.1

### Fixed

* Fixed the **Expiry** row in the **Rights changes** section of the **Get info** panel (user mode) always displaying "just now" for future expiry timestamps, instead of a future-relative time such as "in 3 weeks". `fmtRelative()` only ever computed elapsed time from a timestamp to now, so a future timestamp produced a negative difference that fell into the same "less than a minute" branch used for genuinely recent past timestamps.
* `fmtRelative()` now compares the timestamp against the current time in both directions: timestamps in the past continue to read "X ago"; timestamps in the future now read "in X", using the same unit thresholds and pluralisation already in place (minutes, hours, days, weeks, months, years).

### Notes

* This affects the shared `fmtRelative()` helper inside `getUserInfo()`, also used by the **Registration date** and **Block log** rows in the same panel. Those rows are unaffected in practice, since they only ever receive past timestamps, but will now correctly show future-relative wording if ever passed one.
* The absolute expiry timestamp display and the underlying `newmetadata` sourcing (added in v2.148.0) are unchanged.
* `getPageInfo()`'s separate, page-mode `fmtRelative()` is a distinct function and was not modified.

## 2.148.0

### Added

* Added an **Expiry** row to each applicable entry in the **Rights changes** section of the **Get info** panel (user mode), showing per-group expiry for the new group membership set on that log entry. Temporary group membership shows the absolute expiry timestamp with a relative time in parentheses, matching the formatting already used elsewhere in this panel; indefinite group membership is labelled "indefinite".

### Notes

* Sourced directly from the log entry's `newmetadata` (an array of `{ group, expiry }` pairs already returned by the existing `leprop=details` request for `letype=rights` log events); no additional API call was introduced.
* The **Expiry** row is only added when `newmetadata` is present on the entry, so log entries or wikis that do not supply this data show no expiry row rather than a misleading or blank one.
* All other rows (time, changed by, previous groups, new groups, reason) and the panel's existing styling and dark/light mode are unaffected.

## 2.147.3

### Changed

* Updated the CentralAuth log query to use `Special:CentralAuth` for more reliable username lookups.

## 2.147.2

### Changed

* Reworked the **Previous usernames** row in the **Get info** panel (user mode) to recursively walk the CentralAuth global rename chain, instead of a single combined query against the local and global rename logs. Starting from the current username, Tengu now looks up each discovered previous username in turn — mirroring the rename history shown on `Special:CentralAuth/<username>` — until no earlier rename is found, and displays the full chain in chronological order (e.g. `OldestName → MiddleName → CurrentName`'s predecessor).
* The local `renameuser` log is no longer queried for this row; only Meta-Wiki's `gblrename` log is used, via a recursive series of `action=query&list=logevents&letype=gblrename` requests.

### Fixed

* A failure while looking up the current username now shows "Could not load previous usernames." and leaves the rest of the **Get info** panel unaffected. A failure partway through an otherwise-successful chain now retains and displays the usernames already discovered, rather than discarding them.

### Notes

* This assumes `gblrename` log entries record `olduser`/`newuser` parameters and are searchable by the renamed-to username via `letitle`, consistent with the assumption already relied on for this row; this has not been independently confirmed against a live wiki.
* A seen-usernames guard prevents infinite loops or duplicate entries if the API returns malformed or cyclical rename data.
* Unchanged: this row is still skipped entirely for temporary accounts and IP addresses, and the rest of the **Get info** panel's sections, styling, and dark/light mode are unaffected.

## 2.147.1

### Fixed

* Fixed the **Previous usernames** row in the **Get info** panel (user mode) not detecting renames for accounts renamed via CentralAuth's global rename (Special:GlobalRenameUser). The row previously queried only the local wiki's `renameuser` log, but most Wikimedia accounts are renamed globally, which is recorded on Meta-Wiki's `gblrename` log rather than in the local log — so a globally renamed account showed no previous usernames at all.
* Previous usernames are now collected from both the local `renameuser` log and Meta-Wiki's `gblrename` log, merged and deduplicated. A failure in one source no longer blanks the row; only a failure in both sources shows "Could not load previous usernames."

### Notes

* The `gblrename` log is assumed to record `olduser`/`newuser` parameters and to be searchable by the account's current username via `letitle`, following the same convention as the local `renameuser` log.
* This affects only the **Previous usernames** row. Temporary accounts and IP addresses continue to skip this row entirely, unchanged.

## 2.147.0

### Changed

* Standardised the edit summaries used by rollback, undo, and restore-this-revision across every entry point (the main window's batch Rollback section, `[⛩️ rollback]`, `[⛩️ undo]`, and `[⛩️ restore this revision]`), so each action type now consistently uses its own verb:
  * Rollback: "Reverted [[Special:Diff/X|edit]] by [user]" (Indonesian: "Membalikkan").
  * Undo: "Undid [[Special:Diff/X|edit]] by [user]" (Indonesian: "Membatalkan").
  * Restore this revision: "Restored to the [[Special:Diff/X|revision]] by [user]" (Indonesian: "Dikembalikan ke revisi oleh [user]").
* Previously, rollback and undo shared identical wording ("Reverted..." / "Membalikkan...") regardless of which method was actually used, giving no indication in the edit summary of which action had been performed.
* User-supplied reasons and the "to the previous revision by [user]" clause continue to be appended exactly as before; only the leading verb changed.

### Notes

* `buildQuickRevertSummaryText()`'s `isRestore` boolean parameter has been replaced with a `variant` string ("rollback", "undo", or "restore"), used at all four call sites (`work()`'s batch Rollback section, and the three inline quick-action call sites in `runQuickRevert()`).

## 2.146.2

### Removed

* Removed the unused `buildQuickActionSummaryText()` function from Section 05. It became dead code in v2.133.0, when `runQuickRevert()` switched to the shared `buildQuickRevertSummaryText()`; its removal was already flagged as pending in that version's changelog.

### Fixed

* Simplified the rollback/undo loop in `work()` to call `buildRevertSummaryText()` once per revert instead of twice. `undoSummaryStr` and `rbSummaryStr` were separately assigned from identical calls to the same function, and the mediainfo revert step then chose between them with a ternary that could never actually differ. Both are replaced by a single `revertSummaryStr` constant, with no change in behaviour.

## 2.146.1

### Fixed

* Fixed Shift+click range selection in the **Select specific edits/pages** picker selecting the wrong entries when the list was sorted by "Oldest first" or "Newest first". Range selection previously used the checkboxes' original A–Z build order to determine which items fell "between" the two shift-clicked rows, which no longer matched the list's displayed order once a non-alphabetical sort was applied via `sortPickerListEl()`. The range is now resolved from the list's live DOM order each time a checkbox is clicked, so it always matches what is currently on screen, including after the sort order is changed between the two ends of a shift-click range.

## 2.146.0

### Added

* Added a new preset reason to `ROLLBACK_REASONS`: "Removing content without providing a reason", for use when a rollback/undo reverts a content removal that had no edit summary or other explanation.

## 2.145.2

### Fixed

* Fixed the page deletion and revision deletion reason dropdowns not resetting to "Other:" in `applyPackage()` when a package's reason value had no matching dropdown option. The free-text reason was correctly placed in the adjacent input field, but the dropdown kept showing whichever preset had been selected previously, so the two controls no longer agreed on the reason that would actually be submitted. The rollback, block, and page protection reason blocks already reset their dropdowns in this case; the page deletion and revision deletion blocks now do the same.

## 2.145.1

### Fixed

* Fixed the pending changes level and expiry controls (Page protection section) remaining enabled after a package switch unchecked "Also enable pending changes protection". `applyPackage()` already reset the expiry dropdown's value but not its `disabled` state, so the dropdown stayed interactive even though the checkbox controlling it was now unticked.

### Notes

* This is a follow-up to the v2.145.0 fix, correcting an oversight in that same change rather than introducing new reset behaviour.

## 2.145.0

### Fixed

* Fixed "Protect from recreation after deletion" (Page deletion section) and "Also enable pending changes protection" (Page protection section), along with their level/expiry/reason sub-controls, not being reset when the Package dropdown was changed. Neither option is currently configurable via packages, but both previously retained whatever state was left over from a prior manual configuration instead of resetting to their construction defaults, unlike every other package-driven control in these two sections.

### Notes

* Pending changes availability (whether the checkbox itself can be ticked at all) continues to be governed solely by `flaggedRevsPromise`/`chkProtectPC.disabled` and is unaffected by this fix.

## 2.144.0

### Fixed

* Fixed "Also delete the talk page", "Delete redirects to deleted page", and "Delete subpages of deleted page" in the Page deletion section not being reset when the Package dropdown was changed. Every other package-driven page-deletion option (reason, unlink) was already reset on switch; these three checkboxes previously kept whatever state was left over from a prior package selection or manual toggle. They now reset to their original defaults (talk-page deletion off; redirect and subpage deletion on) on every package switch, since no package currently configures them.

## 2.143.0

### Changed

* The "Status:" line and the completed-task summary line now share a single line in both Tengu log windows (the main progress dialogue in `work()` and the inline quick-action dialogue used by `[⛩️ undo]`, `[⛩️ rollback]`, and `[⛩️ restore this revision]`) — for example, "Status: Completed: 1 edit undone." instead of "Status: Completed." followed by a separate "Completed: 1 edit undone." line below it. The same applies to the aborted-run wording (e.g. "Status: Aborted: 2 pages deleted."). The separate summary line element has been removed; existing summary wording and logic (`buildCompletionSummary()` and the inline dialogue's own summary text) are unchanged.

### Notes

* This affects both the main progress dialogue and the inline quick-action dialogue equally. Logging behaviour is unchanged.

## 2.142.0

### Removed

* Removed the CSS-based progress loader from every Tengu log window (the main progress dialogue in `work()` and the inline quick-action dialogue used by `[⛩️ undo]`, `[⛩️ rollback]`, and `[⛩️ restore this revision]`), along with its associated CSS (`.tng-progress-loader`, its keyframe animations, and its dark-mode override) and the JavaScript that toggled it.

### Changed

* The "Status:" line now shows the task status ("Processing...", "Aborted.", or "Completed.") directly after "Status:", rather than relying on the now-removed loader to convey run state. The summary line below it is unchanged.

### Notes

* This affects both the main progress dialogue and the inline quick-action dialogue equally. Logging behaviour and the completion summary text are unchanged.

## 2.141.0

### Changed

* Replaced the segmented radial-mask progress loader in every Tengu log window (the main progress dialogue in `work()`, and the inline quick-action dialogue used by `[⛩️ undo]`, `[⛩️ rollback]`, and `[⛩️ restore this revision]`) with a three-dot bounce loader. The loader no longer represents a fill amount; it simply animates while operations are being processed and stops once a run completes, is aborted, or (in the main window) a résumé point is reached.
* The "Status:" line now shows only the label and the loader; the "Aborted." text previously appended to it has been removed. Abort status is still conveyed by the loader stopping and by the summary line below.
* The loader now uses `currentColor` for its dots, with a light-mode value of `#3366cc` and a dark-mode override of `#6699ff`, so it adapts to the active theme.

### Removed

* Removed `completedOps`, `enabledOpsPerTarget`, `estimatedTotalOps`, and `updateProgressLoader()` from `work()`, since the loader no longer tracks or displays task progress.

### Notes

* This affects both the main progress dialogue and the inline quick-action dialogue equally.

## 2.140.0

### Added

* Added a standalone **Account info** section (🛂) to the user info dialogue, shown above the **Access rights** card. Displays:
  * **Local edits** — the account's edit count on the current wiki.
  * **Global edits** — the account's total edit count across all Wikimedia wikis, sourced from `meta=globaluserinfo`.
  * **Registration date** — unchanged from the previous behaviour, showing the absolute UTC timestamp and a relative time in parentheses.
  * **Previous usernames** — any prior usernames found in the local rename log, shown only for registered accounts (not IP addresses or temporary accounts).

### Changed

* Moved edit count and registration date out of the **Access rights** card's "Account info" row (removed) and into the new dedicated **Account info** section.

### Notes

* Previous usernames are derived from the local `renameuser` log, assuming the log entry's target title is the new username and that `olduser`/`newuser` parameters are present.
* Global edit count is read from the existing `meta=globaluserinfo` request already used for global rights, with `editcount` added to `guiprop`; no additional API call was introduced for that value.

## 2.139.0

### Changed

* Reduced the vertical spacing between the "Status:" line and the summary line in both Tengu log windows (the main progress dialogue in `work()` and the inline quick-action dialogue used by `[⛩️ undo]`, `[⛩️ rollback]`, and `[⛩️ restore this revision]`), so the two lines sit closer together while the larger gap above the log box is unchanged.

## 2.138.0

### Changed

* The progress loader's empty segments are now white (`#fff`) and its filled segments use `#3366cc`, in both light and dark mode, so progress is clearly visible against either theme.
* The "Status:" line no longer shows "Processing..." or "Completed." text; the progress loader itself now conveys whether a run is in progress or has finished. "Aborted." is still shown when a run is stopped early, since the loader alone does not distinguish an aborted run from a completed one.
* The summary line below the status/loader row now uses the same font size as the "Status:" line, instead of the smaller default help-text size.

### Notes

* This affects both the main progress dialogue (`work()`) and the inline quick-action dialogue used by `[⛩️ undo]`, `[⛩️ rollback]`, and `[⛩️ restore this revision]`.

## 2.137.0

### Added

* Added a CSS-based progress loader to every Tengu log window (the main progress dialogue in `work()`, and the inline quick-action dialogue used by `[⛩️ undo]`, `[⛩️ rollback]`, and `[⛩️ restore this revision]`). The loader sits immediately after "Status:" and fills as operations complete, using a new `.tng-progress-loader` CSS class with a dark-mode variant.
* In the main progress dialogue, the loader's fill is driven by `completedOps` against an `estimatedTotalOps` approximation (the number of enabled action types multiplied by the number of targets), incremented once per successfully logged operation. In the single-operation quick-action dialogue, the loader simply fills fully once the operation finishes, whether it succeeded or failed.
* The completed-task summary line (e.g. "Completed: 3 pages deleted...") and other summary information now render on their own line below the status/loader row, instead of sharing the status line.

### Notes

* `estimatedTotalOps` is an approximation only: the exact number of underlying API steps (e.g. how many contributions will need reverting) is not known until the run is under way, so the loader's fill rate is not exact — it fills fully on genuine completion regardless. This has not been independently verified against a live wiki for visual smoothness across a wide range of run sizes.
* An aborted run keeps the loader at whatever partial progress was actually reached, rather than forcing it to a full fill, since the run did not complete.

## 2.136.0

### Added

* Added a `[⛩️ undo]` inline action, complementing the existing `[⛩️ rollback]` and `[⛩️ restore this revision]` actions. Unlike rollback, undo uses `action=edit` rather than `action=rollback`, so it does not require the rollback right — only the edit right is needed.
  * **Page history** — shown on every revision row, alongside whichever of rollback/restore already appears there.
  * **User contributions pages** — not shown, matching the existing restriction that neither action type is added there beyond the existing rollback link.
  * **Diff pages** — shown only on the right-hand (current-revision) side, on the same line as rollback or restore.
* `[⛩️ undo]` opens the same reason-selection confirmation dialogue as `[⛩️ rollback]` and `[⛩️ restore this revision]` (preset dropdown, filter box, custom-reason field), and shares the same edit summary wording (`buildQuickRevertSummaryText()`), logging, status display, and error handling as the other two inline actions.
* Added a new `.tng-inline-action-undo` CSS class (purple, with a dark-mode variant) so `[⛩️ undo]` is visually distinct from the existing red (`rollback`) and blue (`restore`) inline actions.

### Notes

* `[⛩️ undo]` calls `action=edit&undo=<revid>` (no `undoafter`), undoing only that specific revision — distinct from `[⛩️ restore this revision]`, which undoes every edit after the given revision via `undo=<latest>&undoafter=<revid>`.
* A `nochange` API result (the edit had already been undone by someone else) is logged as a failure, matching the no-op detection already used for the main window's batch Undo section.

## 2.135.0

### Changed

* The "Report to Global sysops/Requests" and "Report to Steward requests/Global" sections no longer prepend "Additional details:" to the text entered in the Additional details field when submitting a report. The entered text is now submitted directly, joined to any selected preset reasons with the existing ". " separator. Reports built solely from preset reason checkboxes, with no additional details entered, are unaffected.

### Notes

* This affects only the wording of `buildGSReasonText()` and `buildSRGReportLine()` in `Tengu.js`. No changes were made to reason-checkbox selection, report submission logic, or duplicate-report detection.

## 2.134.0

### Fixed

* Fixed the edit summary produced by the "[⛩️ restore this revision]" inline action reading "Reverted edit by [user]", which incorrectly implied that [user]'s edit was the one being undone. In fact, the page is being restored *to* the revision created by [user]. The summary now reads "Restored to revision by [user]" (English) or "Dikembalikan ke revisi oleh [user]" (Indonesian), with an optional ": reason" suffix when a reason is selected. The diff link and dynamic username are unchanged.

### Notes

* This change is scoped to `buildQuickRevertSummaryText()`'s new `isRestore` parameter, set only at the "restore this revision" call site in `runQuickRevert()` (Section 09b). The "[⛩️ rollback]" inline action and the main batch Rollback/Undo sections in `work()` continue to use the existing wording unchanged.

## 2.133.0

### Changed

* The "[⛩️ rollback]" and "[⛩️ restore this revision]" inline actions (`runQuickRevert()`, Section 09b) now build their edit summary with `buildQuickRevertSummaryText()` — the same helper used by the main window's batch Rollback section — instead of the inline-only `buildQuickActionSummaryText()`. The edit summary produced by these links is now identical in wording to the summary produced when the same rollback or undo is run from the main Tengu window.
* The confirmation dialogue and reason-selection row for these inline actions are unchanged.

### Added

* Added a status label ("Status: Processing..." / "Status: Completed: ...") and timestamped, numbered log entries to the inline rollback/restore progress dialogue, matching the status display and logging style already used in the main window's progress dialogue.

### Notes

* `buildQuickActionSummaryText()` is no longer called by `runQuickRevert()` but has not been removed, since it is still referenced in earlier changelog entries; it can be removed in a future lint pass if confirmed unused elsewhere.

## 2.132.0

### Changed

* The "[⛩️ rollback]" and "[⛩️ restore this revision]" inline actions on diff pages (`insertDiffRevisionActions()`, Section 09b) are now placed on their own line at the top of the relevant revision title box, instead of being appended inline after the existing text (username, edit summary, etc.) in that box. A new `.tng-inline-actions-diffline` block-level CSS class replaces the inline `.tng-inline-actions` class for this placement. Both actions are affected consistently; their functionality, wording, and styling are otherwise unchanged.

### Notes

* This change applies only to diff pages. The equivalent links on page history and user contributions pages continue to render inline at the end of each revision row, unaffected.

## 2.131.0

### Added

* Added a reason row to the confirmation dialogue shown by the inline "[⛩️ rollback]" and "[⛩️ restore this revision]" actions (`runQuickRevert()`, Section 09b). The row reuses the same preset dropdown (`ROLLBACK_REASONS`), filter box, and custom-reason text field already used by the main batch Rollback section's reason row, and joins a selected preset with custom text as "preset: custom" when both are given (`buildQuickRevertReason()`, mirroring `buildRollbackReason()`).
* `buildQuickActionSummaryText()` (Section 09b) now accepts an optional `reason` parameter, appended to the generated summary as a ": reason" suffix. When no reason is selected or entered, the summary is unchanged from its previous wording.

## 2.130.4

### Fixed

* Fixed the contributions-fetch and block-notification steps in the main work loop using `config.isRange` — a flag computed once from only the primary target — for every target in a multi-target run. When a multi-target list mixed IP ranges with accounts or single IPs, this could skip the contributions fetch incorrectly, cause a `list=usercontribs` call with an invalid range parameter, skip a block notification that should have been sent, or attempt to build a talk page title from a CIDR range (producing an incorrect title, as already noted in a nearby comment). A per-target `targetIsRange` value is now derived from the per-target `isTargetIP` check already used for block parameter selection, and used at both call sites instead of the static `config.isRange`.

## 2.130.3

### Fixed

* Fixed the duplicate-report safeguard in `submitSRGReport()` only checking the primary target when submitting a multi-target Steward requests/Global report. A single multi-target submission covers every selected account (via `{{MultiLock}}` or multiple `{{Luxotool}}` lines), but the existing-report check only tested the primary target's name against the page content, so an already-open report for a secondary target was not detected and a duplicate could still be filed for it. `submitSRGReport()` now accepts the full target list and checks each one; its one call site (the "Report to Steward requests/Global" step in the main work loop) now passes `config.targets` instead of only the primary target.

## 2.130.2

### Fixed

* Fixed additional targets in multi-target mode not being deduplicated against each other. The target-list builder (Section 09, Start button config assembly) only excluded entries matching the primary target, despite its comment stating duplicates were removed; a target repeated within the textarea was processed once per repetition (e.g. duplicate rollback/block/warn attempts on the same account or page). It now tracks a case-insensitive set of targets already seen, deduplicating against both the primary target and prior entries in the textarea, while preserving order.

## 2.130.1

### Fixed

* Fixed the padlock tooltip on a mode-locked section (Rollback, Warn, Revdel, Lock account, GS, SRG) showing a stale reason after the lock cause changed — for example, locking for "not available for IP range targets" in user mode, then switching to page mode, which should show "Tengu is targeting a page, not a user." instead. `applyModeLock()` (Section covering mode-lock helpers) returned early whenever the checkbox was already disabled, without distinguishing an existing mode-lock (reason should refresh) from a permanent rights-lock (must not be touched). It now refreshes the tooltip text when the checkbox is already mode-locked, and continues to leave rights-locked checkboxes alone.

## 2.130.0

### Changed

* The inline "[⛩️ rollback]" and "[⛩️ restore this revision]" actions (Section 09b, `runQuickRevert()`) now navigate to the page's own current URL on close, via `mw.util.getUrl(pageTitle)`, instead of reloading whatever page the action was triggered from. Previously, `window.location.reload()` reloaded the diff, history, or contributions page in place, which could leave the user looking at a now-stale diff/history view of the revision just rolled back or restored.
* Edit summaries produced by these two inline actions now describe each action accurately instead of sharing generic "reverted an edit" wording with the main batch Rollback section. A new `buildQuickActionSummaryText()` (Section 09b) is used in place of `buildQuickRevertSummaryText()` for these two call sites only; `buildQuickRevertSummaryText()` itself is unchanged and continues to be used by the main batch Rollback section.
  * Rollback: `Rolled back edit by [user] (see [[Special:Diff/X]])` / Indonesian: `Membatalkan suntingan oleh [user] (lihat [[Special:Diff/X]])`.
  * Restore this revision: `Restored revision by [user] (see [[Special:Diff/X]]), undoing subsequent edits` / Indonesian: `Memulihkan revisi oleh [user] (lihat [[Special:Diff/X]]), membatalkan suntingan setelahnya`.
  * If the revision's author cannot be determined (e.g. a hidden/revision-deleted username), the "by [user]" clause is omitted from both languages.

## 2.129.0

### Changed

* Diff pages now show "[⛩️ rollback]" as well as "[⛩️ restore this revision]", replacing the previous behaviour where only the older ("from") revision could ever get a link. `insertDiffRestoreLink()` (Section 09b) is replaced by `insertDiffRevisionActions()`, which checks both compared revisions (`wgDiffOldId` and `wgDiffNewId`) against the page's actual current revision instead of only ever considering the older side. Whichever side holds the current revision gets "rollback"; the other side gets "restore this revision". When neither compared revision is current (a diff between two older revisions), both sides now get "restore this revision" and neither gets "rollback".
* Which revision is "current" is now resolved via a new `fetchCurrentRevisionId()` helper, a live `action=query&prop=revisions&rvlimit=1` API call, rather than trusting `wgCurRevisionId` alone or the left/right position of the two revisions being compared. `wgCurRevisionId` is kept only as a fallback if the API call fails.

## 2.128.0

### Added

* Added a "[⛩️ restore this revision]" inline action to diff pages (`insertDiffRestoreLink()`, Section 09b), shown for the older revision being compared, so it can be restored without opening the page history and locating the matching row. The link is withheld when that revision is already the page's current revision. It reuses the existing `runQuickRevert()`/`buildInlineRevisionLink()` undo mechanism, confirmation dialogue, logging, edit summary, and error handling already used on history and contributions pages, so behaviour is identical to the existing "[⛩️ restore this revision]" links there. `wgDiffOldId` is used to identify the older revision and the link is placed inside `#mw-diff-otitle1`, an approach adapted from Twinkle's `twinklefluff.js` (`addLinks.diff()`), not copied directly.

### Notes

* The username shown in the confirmation dialogue/edit summary is read from `#mw-diff-otitle2 .mw-userlink`; if the revision's author is hidden (revision-deleted), this selector will not match and the link falls back to a null username, which `runQuickRevert()`/`buildQuickRevertSummaryText()` already handle.
* Only tested against the standard MediaWiki diff table structure (`#mw-diff-otitle1`/`#mw-diff-otitle2`).

## 2.127.0

### Fixed

* Fixed "[⛩️ rollback]" still not appearing on user contribution pages after the v2.126.0 title-normalisation fix. `insertInlineRevisionActions()` previously read a page title out of the DOM link for each contribution row and re-queried that title separately to check whether it was still current — an approach still prone to mismatches. It now resolves the target's currently-top revisions once up front via a single `list=usercontribs` API call with `ucshow=top`, and matches each row's revision ID directly against that result. A row gets "[⛩️ rollback]" only when its revision ID appears in that top-revisions map; "[⛩️ restore this revision]" continues to never appear on contribution pages. This applies equally to registered accounts, temporary accounts, and IP addresses, since all are addressed via `wgRelevantUserName`.

### Notes

* The `list=usercontribs` request uses `uclimit=max` and follows the API's continue token for up to 20 requests. In the unlikely case a target has more currently-top contributions than this covers, rows for the uncovered pages simply show no rollback link, rather than risking an incorrect one.

## 2.126.0

### Fixed

* Fixed "[⛩️ rollback]" and "[⛩️ restore this revision]" no longer appearing on user contribution pages. The candidate page title recovered from the DOM (via `href`) was compared directly against the API's `query.pages[].title`, which is already in MediaWiki's canonical form; case and underscore/space differences between the two meant the match in `insertInlineRevisionActions()` almost always failed, so the link was silently withheld for nearly every candidate — the "fails closed" behaviour noted in v2.124.1. Both the candidate title and the API's returned title are now passed through `mw.Title.newFromText(...).getPrefixedText()` before comparison.
* Added detection of no-op rollbacks/undos: `runQuickRevert()` now compares the revision being rolled back (rollback) or the current revision (undo) against the revision being restored to, before/alongside the API call. If they already have identical content — meaning the operation could not have produced any real change — the log now reports the operation as failed instead of successful, using the existing failure/error styling.

### Changed

* Every line in the inline rollback/undo progress log (Section 09b, `runQuickRevert()`) is now sequentially numbered.
* The log now opens with "⏳ Processing operations... please wait..." and, if no failure was logged, closes with "✅ All operations have been completed successfully". If any operation failed, the existing failure/error log line is shown instead of the completion line.

### Notes

* The root cause of the missing contribution-page links is inferred from the code and the existing v2.124.1 changelog note describing the fail-closed matching behaviour; this has not been independently confirmed on a live wiki.
* Treating identical current/target revision content as a hard "failed" outcome assumes the person always wants to be told when a rollback/undo made no real change, rather than treating a no-op as a (trivial) success. Worth confirming this matches actual usage before relying on it in automated/batch runs.

## 2.125.0

### Added

* Inline "⛩️ rollback" / "⛩️ restore this revision" quick actions (`runQuickRevert()`, Section 09b) now log the source and target revision IDs for each operation: the revision being rolled back/undone, and the revision the page is reverted to.
* After a rollback or undo, Tengu compares the resulting revision's content against the target revision's content (via SHA-1) and, if they match, adds an explicit confirmation line to the log, e.g. `Rollback completed: revision 123456 was rolled back to revision 123450. The resulting page content is identical to revision 123450.` The same applies to undo, with `Undo completed: ...`.

### Notes

* The `action=rollback` response field names used to obtain the rolled-back and target revision IDs (`old_revid`, `last_revid`, `revid`) follow documented MediaWiki API behaviour but have not been independently confirmed on a live wiki.
* SHA-1 hash equality is used as a proxy for identical page content. This is not verified against every content model (e.g. structured data), and the identical-content line is only shown when both hashes could be retrieved — if they can't (e.g. revision-deleted content), no claim is made either way.

## 2.124.1

### Fixed

* Fixed "[⛩️ rollback]" and "[⛩️ restore this revision]" performing no action when Confirm was clicked. The confirmation dialogue's Cancel and Confirm buttons both closed the dialogue via `overlay.closeHandler()`, which always triggers `onClose()` too (see `createDialog()`); `onClose()` called `resolve(false)`. Because `closeHandler()` ran before the Confirm button's own `resolve(true)`, the promise always settled to `false` first — a promise only settles once — so `runQuickRevert()` always exited at `if (!confirmed) return;` before calling `apiRollback()`/`apiPost()`, regardless of which button was pressed. Confirm and Cancel now call `resolve()` before `overlay.closeHandler()`.
* Strengthened current-revision detection on user contribution pages. "[⛩️ rollback]" previously appeared on a user's most recent listed contribution to a page based only on its position in the contributions list, not on whether it was still that page's actual latest revision. If a different user had since edited the page, the link still appeared. `insertInlineRevisionActions()` now batch-queries each candidate page's current top revision before attaching the link, and only attaches it where the listed revision still matches.

### Changed

* The inline rollback/restore confirmation dialogue now supports Enter to confirm and Escape to cancel, matching the keyboard behaviour of the main "Confirm selected operations" dialogue (Section 09).
* Inline action click handlers now call `stopPropagation()` in addition to `preventDefault()`. `runQuickRevert()` failures occurring outside its own try/catch (e.g. while building the confirmation dialogue) are now caught and surfaced via `console.error` and an alert, instead of failing silently as an unhandled promise rejection.
* Extracted link creation and click-handling into a shared `buildInlineRevisionLink()` helper, used by both the history-page and contributions-page paths.

### Notes

* Matching a candidate's page title against the API's normalised title assumes both are in the same normalised form. If they differ, the candidate is left without a rollback link rather than risking one being shown incorrectly — this fails closed.
* The same `closeHandler()`-before-`resolve()` ordering issue also exists in the self-block confirmation dialogue (around line 1477), using the identical pattern. Not changed here since it wasn't reported and is a separate code path — worth checking next.

## 2.124.0

### Fixed

* Fixed the "[⛩️ rollback]" and "[⛩️ restore this revision]" inline links (added in v2.123.0) not performing any action when clicked. On contribution pages, the revision ID needed to build the request was not being resolved and the click handler had nothing valid to act on. The revision ID is now recovered from the corresponding "hist" or "diff" link's `oldid`/`diff` parameter when the row itself carries no revision data.

### Changed

* On user contribution pages, "[⛩️ restore this revision]" is no longer shown at all; only "[⛩️ rollback]" appears, and only once per page — on that page's most recent contribution, even if the same user edited it multiple times further down the list.
* On page history (`action=history`), "[⛩️ rollback]" is now shown only on the top row (the current revision); every other row shows "[⛩️ restore this revision]" instead, never both.
* Increased `.tng-inline-action` font size from `0.85em` to `1em`, matching the surrounding text.
* Split the shared blue link colour into `.tng-inline-action-rollback` (red, matching the existing destructive-action palette) and `.tng-inline-action-restore` (blue), with matching dark-mode variants.

### Notes

* The DOM selectors used to recover revision IDs and page titles on contribution pages follow standard MediaWiki core markup but have not been independently confirmed against a live wiki, every skin, or every MediaWiki version.

## 2.123.0

### Added

* Added inline "[⛩️ rollback]" and "[⛩️ restore this revision]" links to the end of each revision row on page history (`action=history`) and user contributions pages (`Special:Contributions` / `Special:IPContributions`, including IP addresses and temporary accounts). "⛩️ restore this revision" is omitted on the newest row, since it is already current.
* Added `runQuickRevert()` and `insertInlineRevisionActions()` (new Section 09b), and `buildQuickRevertSummaryText()`, a shared top-level summary builder used by both these new inline actions and the existing Rollback section in `work()`, so edit summaries are identical between the two entry points.
* Added `.tng-inline-actions` / `.tng-inline-action` styles to `Tengu.css`.

### Changed

* `work()`'s internal `buildRevertSummaryText()` now delegates to the new shared `buildQuickRevertSummaryText()` instead of duplicating the summary logic inline. No wording change.

### Notes

* The DOM selectors used to locate revision rows, revision IDs, page titles, and usernames on history and contributions pages (`data-mw-revid`, `.mw-userlink`, `.mw-contributions-title`, etc.) follow standard MediaWiki core markup but have not been independently confirmed against a live wiki, every skin, or every MediaWiki version.
* The inline actions use a lightweight confirmation dialogue and progress panel (built with the existing `createDialog()`/`makeBtn()` helpers) rather than the full Tengu configuration dialogue, but call the same `apiRollback()`/`apiPost()` functions used by the main Rollback section.
* "Restore this revision" undoes all edits between the selected revision and the page's current latest revision in a single `action=edit&undo=&undoafter=` call, restoring the page to that revision's state.

## 2.122.0

### Added

* Expanded the **Recently active administrators** feature (👮) to also include users with other advanced rights: bureaucrats, CheckUsers, and interface administrators (local groups), plus global sysops and stewards (fetched from Meta-Wiki). The dialogue is now titled "Recently active admins & rights holders".
* Each listed user now shows a coloured badge for every applicable right next to their username (e.g. a user who is both a sysop and a CheckUser shows both badges), using new `.tng-userright-*` CSS classes with a distinct colour per right, following the same sizing and styling conventions as the existing `[EXPERIMENTAL]` badge.

### Changed

* Local rights groups (sysop, bureaucrat, checkuser, interface-admin) are fetched via `list=allusers`; global groups (global-sysop, steward) are fetched via `list=globalallusers` against Meta-Wiki using the existing `foreignApiGet()` helper.
* `considerActivity()` now checks membership against the combined set of local and global rights holders (`userRightsMap`) instead of sysops only.

### Notes

* `list=globalallusers` with the `agugroup` parameter has not been independently confirmed against a live wiki.
* A failed group-membership fetch for any single group is treated as an empty list rather than aborting the whole feature, so partial results are still shown if one group query fails.

## 2.121.4

### Fixed

* Moved `buildGSLineForTarget()` from inside the `for...of` targets loop body to the root of `work()`, resolving a `no-inner-declarations` ESLint warning. Function declarations in block statements such as `for` loops are flagged by this rule. The function's behaviour is unchanged; it continues to be called per-target inside the loop with `targetVal` as its argument. The wording of the associated comment was updated from "inside the loop below" to "inside the targets loop" to reflect its new position.

## 2.121.3

### Fixed

* Fixed the **Unblock** section not being re-locked for users without the block right when switching from page mode back to user mode, in cases where the user rights promise resolved while Tengu was operating in page mode. The Unblock section is now locked alongside the Block section in the `applyModeRestrictions()` rights re-evaluation block, matching the pattern already used by the `rightsPromise.then()` callback.

### Notes

* Any actual unblock API call would still fail server-side for users without the block right regardless of UI state. The scenario requires that the rights promise resolves while Tengu is in page mode and the user subsequently switches to user mode — unlikely in practice on a fast connection, but possible.

## 2.121.2

### Fixed

* Fixed `config.blockAuto` being pre-filtered by the primary target's IP status (`!isIP && chkAutoblock.checked`) at the time the Start button is pressed, instead of relying solely on the existing per-target `isTargetIP` check already performed inside `work()`. In a multi-target run mixing an IP address with one or more registered accounts, if the primary target happened to be an IP, this incorrectly suppressed autoblock for every account target in the batch, even with "Auto block" ticked.

### Notes

* `work()` already branches correctly on each individual target's own IP status before applying `autoblock`, so this fix simply removes the redundant (and incorrect) primary-target-only pre-filter from the config object. Single-target runs where the target is an account are unaffected, since `isTargetIP` for that target was already `false` in both the old and new logic.

## 2.121.1

### Fixed

* Fixed the unlink loop's file-embed removal (Page deletion section, "Remove links to deleted page or file") incorrectly truncating `[[File:...]]`/`[[Image:...]]` embeds at the first `]]` found inside the caption, rather than the `]]` that actually closes the embed. This left the remainder of the caption behind as stray wikitext whenever the caption itself contained nested wikilinks or templates — for example `[[File:Example.png|thumb|[[Some link|Some link]] and more text.]]` previously removed only up to `[[Some link|Some link]]`, leaving `and more text.]]` behind.
* File-embed removal now tracks bracket depth (via a new `removeBalancedFileEmbeds()` helper) instead of relying on a regular expression, so nested wikilinks, piped links, and templates within the caption no longer confuse the match.
* Any whitespace immediately before or after a removed file embed is now trimmed, so the edit does not leave behind stray spaces where the embed used to be.

### Notes

* This affects only the file-delinking branch of the existing "Remove links to deleted page or file" option in the Page deletion section, which remains an experimental feature. Ordinary page-link removal (non-file deletions) and the gallery-line removal pattern are unchanged.
* [Unverified] The fix has been reviewed but not independently confirmed against a live wiki edit.

## 2.121.0

### Changed

* Clarified that IP range support (Block and Unblock sections) covers both IPv4 and IPv6 CIDR ranges, since range detection relies on `mw.util.isIPAddress(target, true)`, which recognises both forms natively. No functional change to detection or block logic was required.
* Updated the skipped-notification warning message to explicitly mention "(IPv4 or IPv6)" for clarity.

### Notes

* IPv6 CIDR range handling has not been independently tested against a live wiki. The existing range-target locks (Rollback, User warning, Revision deletion, Lock account, Report to Global sysops/Requests, Report to Steward requests/Global) and the block/unblock execution path already applied uniformly to any range target, IPv4 or IPv6, since none of that logic branches on address family.
* The talk-page notification skip for range targets (added in v2.119.0 for the IPv4 CIDR slash issue) also protects against IPv6 addresses' colons being misread by `mw.Title` as a namespace prefix, though this has not been confirmed against a live wiki either.

## 2.120.0

### Changed

* The end-of-run status line in the progress dialogue now shows the completion summary on the same line as "Status:" instead of on a separate line below it (e.g. "Status: Completed: 3 pages deleted, 2 pages protected, and 1 account blocked.").
* The completion summary now includes blocked and unblocked account counts, which were previously omitted. As with all other counters, an action is only listed when its count is greater than zero.

### Notes

* This is a display-only change to `buildCompletionSummary()` and the final status line in `work()`; no changes were made to blocking, unblocking, or any other operational logic.

## 2.119.0

### Added

* Added support for IP range (CIDR) targets in user mode. Previously, entering an IP range disabled user mode entirely with no way to block it — the old tooltip even suggested using the block section in page mode, but Block is always locked in page mode, so ranges could not be blocked at all. Ranges can now be entered directly as the target and user mode enabled for them.
* Added `isTargetIPRange()` and `applyRangeTargetLocks()`, which lock the Rollback, User warning, Revision deletion, Lock account, Report to Global sysops/Requests, and Report to Steward requests/Global sections whenever the user-mode target is an IP range, since these features require a specific account or single IP rather than a range. Only Block and Unblock remain available for range targets.
* The hardblock/autoblock display logic in the Block section now correctly treats IP ranges the same as single IP addresses.

### Changed

* The target field placeholder in user mode now reads "Username, IP, or IP range" instead of "Username or IP (not a range)".

### Fixed

* Fixed the contribution-history fetch in `work()` running (and failing) for IP range targets in user mode, even though only Block and Unblock apply to ranges. The fetch is now skipped entirely when the target is a range.
* Fixed block notifications being posted to a malformed talk page title for IP range targets. `mw.Title` treats the slash in CIDR notation (e.g. "1.2.3.0/24") as a subpage separator, which would have produced an incorrect title; block notifications are now skipped for range targets, with a warning logged instead.

### Notes

* Range support is limited to Block and Unblock because MediaWiki's contribution, warning, and report-related APIs used by the other sections have not been confirmed to accept CIDR ranges.
* Rangeblocks do not support the `autoblock` parameter. The block execution logic already omits `autoblock` for any target where `mw.util.isIPAddress(target, true)` is true (now covering both single IPs and ranges), so no separate handling was needed beyond widening this check throughout the target-detection code.
* No changes were made to page mode; IP ranges can still be reached via page mode as before, though page mode has no block feature of its own.

## 2.118.0

### Changed

* The progress dialogue no longer shows a running, real-time summary line (e.g. "0 reverted | 0 deleted | ...") while a run is in progress. The status line now shows only the current state ("Processing..." / "Aborted.") during execution.
* A concise, natural-language summary is now shown once the run finishes, listing only the actions that were actually performed — for example, "Completed: 3 pages deleted, 2 pages protected, and 1 report filed." Actions with a zero count are omitted entirely.

### Notes

* This is a display-only change. The underlying `stats` counters and their use elsewhere (e.g. multi-target per-target logging) are unaffected.
* When no operations were performed, the summary reads "Completed: no operations performed." (or "Aborted: no operations completed." if the run was aborted before anything succeeded).

## 2.117.11

### Fixed

* Fixed `btnExportEdits.disabled` in `applyModeRestrictions()` being evaluated against the target field's stale, previous-mode value instead of the newly pre-filled target. `btnGetInfo.disabled` was already correctly evaluated after the pre-fill; the Export edits button's disabled state now follows the same order so it reflects the target actually being switched to.

### Notes

* This affects only the Export edits button's enabled/disabled state immediately after a mode switch. In the common case (switching to page mode, or switching to user mode with a non-empty username) the stale value happened to produce the same result, so the bug was not readily visible.

## 2.117.10

### Fixed

* Removed the `tng-mode-switch-label-user` and `tng-mode-switch-label-page` classes applied to the mode-switch labels in `init()`. Neither class has a corresponding rule in `Tengu.css` — only `.tng-mode-switch-label-active-user` and `.tng-mode-switch-label-active-page` are defined and applied via `setModeSwitchActive()` — so both were inert on every dialogue open.

### Notes

* No visual or behavioural change: the active-state classes that actually drive the mode-switch label colouring were unaffected.

## 2.117.9

### Fixed

* Fixed `updatePagedelTalkAvailability()` being called twice when switching to page mode via the mode toggle — once inside the page-mode branch of `applyModeRestrictions()`, and again in the unconditional call added at the end of that function in v2.117.8. The redundant inner call triggered an unnecessary extra API request on every switch to page mode. The unconditional call at the end already covers both mode directions, so the inner call has been removed.

### Notes

* No behavioural change: the checkbox's enabled/disabled state is still correctly re-evaluated in both directions, exactly as it was immediately after v2.117.8.

## 2.117.8

### Fixed

* Fixed the **Also delete the talk page** checkbox in the Page deletion section remaining disabled when switching from page mode back to user mode. If the page mode target had no associated talk page, the checkbox was correctly disabled in page mode, but was never re-enabled on mode switch because `applyModeRestrictions()` sets `inputTarget.value` directly without dispatching a `change` event. `updatePagedelTalkAvailability()` is now called alongside `updateUploadAvailability()` at the end of `applyModeRestrictions()`, so the checkbox state is always evaluated after a mode switch.

### Notes

* In user mode, `updatePagedelTalkAvailability()` returns immediately after restoring the enabled state (no API call), so calling it without `await` is safe.
* The equivalent functions for the Move page and Move to user's sandbox talk page options (`updateMovePageTalkAvailability`, `updateMoveSandboxTalkAvailability`) are unaffected: both return early when `tenguMode !== "page"` without modifying any state, and the controls they govern are inaccessible in user mode because their parent section is mode-locked.

## 2.117.7

### Fixed

* Fixed `fmtRelative()` in `getActiveAdmins` returning `"NaN hours ago"` when passed an invalid timestamp. The function now creates a `Date` object first and guards against invalid values via `isNaN(d.getTime())`, consistent with the equivalent function in `getUserInfo` and `getPageInfo`.

## 2.117.6

### Changed

* The **Confirm selected operations** dialogue now states the active mode (**user mode** or **page mode**) inline in the summary sentence, so it is visible before confirming any action.
* Added a scope clarification note to the confirmation dialogue when operating in user mode and rollback, page deletion, or page protection is selected. The note explicitly states that these operations apply across the target user's full contribution history — not to a single page — which makes it easier to catch accidental mass actions caused by being in the wrong mode. The note uses the existing amber status style to stand out visually.

## 2.117.5

### Fixed

* Corrected a misleading comment in `makeSection` that stated "Locked sections (checkbox disabled) cannot be expanded." This has been incorrect since v2.104.0, which made locked sections expandable by clicking the header so users can view disabled controls. The comment now accurately reflects the current behaviour.

## 2.117.4

### Fixed

* Fixed the **User warning** section addressing all targets by the primary target's name in multi-target runs. `config.warnNotice` was built once from the primary target's name and reused unchanged for every subsequent target, so secondary targets received notices beginning "Hello PrimaryUser," instead of their own name. The notice is now rebuilt per-target inside the execution loop using the stored template value, additional-information text, and final-warning flag, matching the per-target personalisation already applied by block, unblock, and rollback notifications.

### Notes

* Three new config keys (`warnTemplateValue`, `warnExtra`, `warnFinal`) carry the raw inputs needed to rebuild the notice. `WARN_MESSAGES` is in scope for `work()` (both are defined in the same `.then()` callback), so no additional module loading is required.
* Single-target runs are unaffected: `config.warnNotice` is still built and used as the default; the rebuild path is only entered when `isMultiTarget` is true and a template has been selected.

## 2.117.3

### Fixed

* Fixed the **Start** button validation for the **User warning** section not moving focus to the message dropdown when no template is selected. The message dropdown now receives focus after the validation notice is shown, matching the behaviour of all other **Start**-button field validations.

## 2.117.2

### Fixed

* Removed the dead `cssInited` variable and its associated initialisation block from `init()`. The variable was originally used to defer CSS injection until the dialogue first opened, but CSS has been loaded at script load time via `mw.loader.load()` since v2.0.0. The variable and its block were not removed during the v2.87.0 lint cleanup.

### Notes

* No user-facing behaviour has changed.

## 2.117.1

### Fixed

* Fixed the **Start** button allowing execution when the **User warning** section is enabled but no message template has been selected in the dropdown. A validation notice is now shown on the message field instead, matching the existing validation pattern used by the GS/SRG report, Fix redirects, and Move page sections.

## 2.117.0

### Changed

* The **Confirm selected operations** dialogue now uses a single-line summary instead of a bulleted list. The message reads "Tengu will execute [operations] on [target]. Please confirm before proceeding." Operations are joined naturally — "A", "A and B", or "A, B, and C" — using an Oxford comma for three or more. For multi-target runs, the target count is shown inline and the scrollable target list remains visible below the summary.

## 2.116.2

### Fixed

* Fixed the edit summary used when submitting a multi-target report to Steward requests/Global always reading "Reporting account for global lock/block" regardless of how many accounts were included. The summary now reads "Reporting N accounts for global lock/block" when more than one target is selected, and retains the existing single-account wording otherwise.

### Notes

* This affects only the edit summary text submitted to Meta-Wiki. The report wikitext itself ({{MultiLock}}, multiple {{Luxotool}} lines, etc.) is unchanged.

## 2.116.1

### Fixed

* Moved `buildPageProtections()` and `buildPageProtectionExpiries()` to the root of `work()` to resolve `no-inner-declarations` ESLint warnings. Both functions were previously declared inside the per-target `for` loop body.
* Removed the unused `buildGSReportLine()` function from the `btnStart` click handler. The function became dead code in v2.112.0 when per-target GS report lines were moved to `buildGSLineForTarget()` in `work()`; its removal was already noted in that version's changelog.

### Notes

* No user-facing behaviour has changed.

## 2.116.0

### Changed

* Increased the font size of the additional-targets list in the **Confirm selected operations** dialogue from `0.85em` to `1em`, matching the font size used in the progress log.
* Increased the font size of the additional-targets textarea from `0.88em` to `1em`, consistent with the above.
* Removed the visual separator elements between target entries in the multi-target progress log. Each log entry now includes the current target name as a prefix — for example, `[ExampleUser] [Block] Successfully blocked user ExampleUser` — so per-target actions remain identifiable without a separate separator row.

### Notes

* `currentTargetLabel` is set to the current target at the start of each loop iteration and reset to `""` after the loop completes. The prefix does not appear in single-target runs, in the initial log entries before the loop (such as "Processing..." and resume notices), or in the post-loop consolidated page-mode deletion notification.
* The `.tng-log-sep` CSS class and its dark-mode variant have been removed, as they are no longer referenced anywhere in the codebase.

## 2.115.0

### Fixed

* Fixed page-mode deletion notifications being sent once per deleted page per creator when **Process multiple targets** is active. Creators who had multiple target pages deleted now receive a single consolidated notification listing all affected pages, matching the existing single-target behaviour.

### Notes

* A `multiTargetCreatorMap` accumulator (declared outside the targets loop) collects confirmed deletions across all target iterations. Notifications are dispatched once after the loop completes rather than per target.
* Only page-mode multi-target runs are affected. Single-target runs and user-mode runs are unchanged.
* The existing self-deletion guard (skipping notifications when the page creator and the deleting user are the same account) applies to the accumulated map in the same way it does in single-target runs.

## 2.114.0

### Added

* Added a **Fix redirects** (🔀) section (page mode only). With the target page set to a redirect or any source page A, Tengu fetches all pages linking to A via `list=backlinks`, then replaces those links with links pointing to a user-specified destination page B. Section anchors (`[[A#section]]`) and display text (`[[A|text]]`) are preserved. Backlink results are paginated; the phase supports resume.
* Added `FIXREDIRECTS_REASONS` to `Tengu-reasons.js`, providing five preset edit reasons in English and Indonesian: redirect target changed, bypassing unnecessary redirect, redirect being deleted, incorrect redirect, and pointing directly to target.
* Added `fixRedirectsDone` and `processedFixRedirectsTitles` to the resume state (`rs`), making the fix-redirects phase resumable in the same way as the existing rollback, deletion, and unlink loop phases.

### Notes

* The section is locked in user mode, when the target is a special page, and when the target page does not exist — consistent with the locking behaviour already applied to Page deletion, Move page, and Page protection.
* Links are matched case-insensitively; spaces and underscores are treated as equivalent in the source title. The replacement uses the destination title exactly as entered.
* `stats.redirfix` (the "redirects fixed" counter already used by the Move page double-redirect feature) is reused for this section; both operations contribute to the same summary counter.
* Multi-target runs reset `fixRedirectsDone` and `processedFixRedirectsTitles` between targets, consistent with all other loop-based phases.

## 2.113.0

### Changed

* The **Report to Steward requests/Global** section now includes all selected targets when **Process multiple targets** is active in user mode. Previously, only the primary target was included in the report.
* For global lock requests with multiple targets, the report now uses `{{MultiLock|1=…|2=…|…}}` (one numbered parameter per account) rather than `{{LockHide}}`. `{{MultiLock}}` does not require a leading bullet (`*`), matching the template's expected format on Meta-Wiki.
* For global block requests with multiple targets, the report now lists a separate `* {{Luxotool|1=…}}` line for each target.
* The section heading now reflects the number of accounts being reported when more than one target is selected — for example, "Global lock for ExampleUser and 3 other accounts" or "Global block for 1.2.3.4 and 1 other account".

### Notes

* The report is still submitted as a single edit on the primary target's loop iteration, since all account names are embedded directly in the `{{MultiLock}}` or multi-`{{Luxotool}}` wikitext block.
* Duplicate-report detection in `submitSRGReport()` already matched `{{MultiLock}}` alongside `{{LockHide}}` and `{{Luxotool}}`; no change was needed there.
* The "Also request the username be hidden (lock and hide)" option applies to the entire `{{MultiLock}}` template when ticked, as the template accepts a `hide=1` parameter.
* When the target list is a mixture of IP addresses and registered accounts, the report type (block vs lock) is determined by the primary target only, matching the existing behaviour of the SRG form.

## 2.112.0

### Changed

* The **Report to Global sysops/Requests** section now submits a separate report entry for each target when **Process multiple targets** is active. Previously, only the primary target was reported in a multi-target run. Each account (in user mode) or page (in page mode) now receives its own individual entry on the report page, following the existing report format.

### Notes

* Steward requests/Global report submissions still apply to the primary target only, since that section reads the live page and checks for duplicates before submitting; per-target SRG reports are not yet supported.
* The reason text, additional details, and page request type (page mode) are captured from the UI at the time the **Start** button is pressed and applied identically to all targets in the run.
* The previous `reportGSLine` config key has been replaced by `reportGSReasonText` and `reportGSPageType`; the old `buildGSReportLine()` function inside the `btnStart` handler is now dead code and can be removed in a future lint pass.

## 2.111.1

### Fixed

* Fixed the target list in the **Confirm selected operations** dialogue not adapting to the active dark/light theme. The element previously used hardcoded inline styles; it now uses a `.tng-confirm-target-list` CSS class with an explicit dark-mode override under `.tng-theme-dark`.

### Changed

* The additional-targets textarea and help text in **Process multiple targets** now animate smoothly when the checkbox is ticked or unticked, using a `max-height` + `opacity` transition consistent with the existing section expand/collapse animation. Both elements are wrapped in a `.tng-multitarget-panel` container; visibility is controlled by toggling the `.tng-multitarget-panel--open` modifier class rather than `tng-hidden`.

## 2.111.0

### Added

* Added **multi-target mode**, allowing a single task run to process multiple accounts or pages in sequence. A new "Process multiple targets" checkbox on the target row reveals a textarea where additional targets can be pasted one per line — account names without the `User:` prefix in user mode; full page titles including the namespace prefix in page mode. All enabled sections apply to each target in turn, and statistics accumulate across the entire batch.
* When multiple targets are active, the progress log displays a numbered separator line before each target so the output remains easy to follow across a large batch run.

### Notes

* Status checks (block status, protection status, etc.) and section status notes reflect the primary target only; they are not re-evaluated per-target during execution.
* Global sysops/Requests report submissions apply to the primary target only in this version. Steward requests/Global report submissions also apply to the primary target only. See v2.112.0 for the GS change.
* Resume is not available for multi-target runs. If a multi-target run is aborted, restart the run from the beginning.
* Switching between user mode and page mode clears the additional-targets textarea, since target formats differ between the two modes.

## 2.110.0

### Added

* Added a **Resume operations** button to the progress dialogue when a run is aborted part-way through. Clicking it continues the task from where it stopped, skipping phases that already completed and resuming loops at the next unprocessed item, without reloading the page or prompting a new confirmation dialogue.
* Added per-run resume state tracking (`rs`) inside `work()`, covering:
  * Phase-completion flags for all single-shot operations (block, unblock, user warning, lock account, report to Global sysops/Requests, report to Steward requests/Global, page undeletion, move page).
  * Phase-completion flags for all loop phases and their associated notification dispatches (rollback loop, main protection loop, deletion loop, recreation protection, second protect pass, unlink loop, and each corresponding notification dispatch).
  * Per-title `Set` objects tracking which pages have already been processed in the rollback, deletion, and unlink loops, so loops resume at the next unprocessed item rather than repeating work.
  * A contribution-data cache (`pageEditsCache`, `creationCache`, `pagesToProtectCache`, `pagesToProtectAfterDelCache`) populated after the first fetch, reused on resume so the MediaWiki contribution API is not queried again.
  * Shared references to accumulated collections (`deletedTitles`, `rollbackNotifiedTitles`, `creatorMap`, `notifyQueue`) so results from the aborted run are carried into the resumed run for correct notifications and deferred protection.
  
## 2.109.0

### Changed

* Extended `fmtRelative()` in the **Get info** panel (page mode) to express differences beyond days. Relative timestamps now resolve to weeks (up to 3 weeks), months (up to 11 months), and years, rather than always falling back to a raw day count.
* Applied the same extended relative-time logic to the **Registration date** row in the **Account info** section of the **Get info** panel (user mode). The absolute UTC timestamp is now followed by a relative time in parentheses — for example, "Mon, 10 Aug 2020 10:30:00 UTC (6 years ago)".

### Added

* Added `fmtRelative()` to `getUserInfo()`, using the same thresholds as the version in `getPageInfo()`.

## 2.108.2

### Changed

* Reduced the vertical padding on each entry row in the **What links here** section of the **Get info** panel (page mode) from 3 px to 1 px, making the list more compact while retaining sufficient spacing for readability.

## 2.108.1

### Changed

* The **Account info** row in the **Get info** panel (user mode) now renders its content inside a bordered container, matching the visual style and font size of the Rights list directly above it.
* The **Current revision** section in the **Get info** panel (page mode) now appends a relative time in parentheses after the absolute UTC timestamp for the **Last edited** and **Creation date** rows (for example, "Mon, 10 Aug 2026 10:30:00 UTC (2 hours ago)").

## 2.108.0

### Added

* Added an **Account info** row (edit count, registration date) to the **Access rights** card in the **Get info** panel (user mode). Sourced from the existing local rights request via the `editcount` and `registration` `usprop` values, so no additional API call was required.
* Added a **Current revision** section (📊) to the **Get info** panel in page mode, shown above **What links here**. Displays page size, last editor, last edited timestamp, revision count, creator, and creation date.

### Notes

* Registration date falls back to "Unknown (may predate registration logging)" when the API does not return a value, since some older accounts predate registration logging on a given wiki.
* Revision count is capped at 500 per request to avoid an expensive full-history fetch on pages with a long edit history; if more revisions exist, the count is shown as "500+" rather than an exact figure.

## 2.107.1

### Changed

* The **What links here** section in the **Get info** panel (page mode) now numbers each result row.
* The `Special:WhatLinksHere/[page title]` link in the "more results" note is now a clickable link that opens in a new browser tab, rather than plain text.

## 2.107.0

### Added

* Added a **What links here** section (⛓️) to the **Get info** panel in page mode. It appears at the top of the panel and lists pages that link to the current target page, fetched via `list=backlinks`. Each result is a clickable link that opens in a new browser tab. Up to 100 results are shown; a note is displayed if more exist, with a link to `Special:WhatLinksHere/[page title]` for the full list.
* Sections with results auto-expand, matching the behaviour of the other Get info sections.

## 2.106.9

### Fixed

* Fixed the **Select specific edits/pages** picker summary label (`lblPickerSummary`) retaining stale selection text after switching away from custom mode via the Edits dropdown. The handler cleared `customSelectedPageEdits` and `customSelectedCreations` but did not call `updatePickerSelectionSummary()`, so the label continued to display the previous count (e.g. "3 edited pages selected.") when the user switched back to custom mode, even though no items were actually selected. The fix brings this in line with `applyPackage()`, which already calls `updatePickerSelectionSummary()` after the same state reset.

## 2.106.8

### Fixed

* Fixed the **Select specific edits/pages** picker button row remaining visible, and its selection summary and data persisting, after a package was applied while that edits mode was active. Applying a package now always clears the picker state, since no package sets the edits dropdown to "Select specific edits/pages". The execution result in `work()` was already correct (it re-reads `selEndtime.value` at Start time), but the UI was misleading.

## 2.106.7

### Fixed

* Fixed `applyPackage()` setting the block expiry to indefinite ("never") for registered account targets whenever `tracingedits.indefregistered` was `true`, regardless of the package's `block.duration` value. The `tracingedits.indefregistered` flag governs only the edits time-range selector; block expiry is now always read from `block.duration` instead. This affected the Default package in particular, which has `tracingedits.indefregistered: true` but `block.duration: "1 day"` — applying it with a registered user target incorrectly pre-filled the block expiry as indefinite.

## 2.106.6

### Fixed

* Fixed the **Move page** section remaining incorrectly accessible in user mode after switching from page mode. `applySpecialPageLocks(false)` was called after `applyModeLock(secMoveSandbox, …, true, …)`, so in the common case the lock was registered and then immediately removed by the special-page-unlock call. When a special-page lock was already active, `applyModeLock` returned early (since `chkMoveSandbox.disabled` was already true), the user-mode lock was never registered, and `applySpecialPageLocks(false)` cleared the special-page lock with nothing replacing it. Both paths left the section accessible in user mode. The order has been corrected so special-page locks are always cleared before the user-mode lock on `secMoveSandbox` is applied.

## 2.106.5

### Fixed

* Fixed the **Protect against recreation** section remaining unlocked when switching from page mode back to user mode after the section had been unlocked in page mode (i.e. the target page was confirmed as non-existent). `updateSectionStatus()` now re-applies the status lock in user mode, matching the existing pattern already used for the Page undeletion section.

## 2.106.4

### Fixed

* Fixed six `no-descending-specificity` CSS lint warnings in `Tengu.css` by reordering rule declarations so lower-specificity selectors precede higher-specificity ones targeting the same elements. No visual or behavioural changes.

## 2.106.3

### Changed

* Standardised the border radius of the mode badge (User mode / Page mode) from `10px` to `3px`, matching the border radius already used on rights badges in the footer panel and the `[EXPERIMENTAL]` badge.

## 2.106.2

### Fixed

* Fixed an ESLint `no-inner-declarations` warning on the `considerActivity` function declaration inside the `getActiveAdmins` function body. The declaration was nested inside a `try` block rather than at the root of its enclosing function body. Converted to a `const` function expression, matching the pattern already used for `applyPickerNamespaceFilter` (v2.87.0).

## 2.106.1

### Changed

* The **Recently active administrators** dialogue now shows a relative time (e.g. "10 minutes ago") in parentheses after each administrator's absolute UTC timestamp, so the elapsed time since their last activity is visible at a glance without manual calculation.

## 2.106.0

### Added

* Added a new **Recently active administrators** feature, accessed via a new 👮 button placed immediately to the left of the dark/light mode toggle. Clicking it opens a dialogue listing administrators active within the last 24 hours, sorted by most recent activity first.
* An administrator is considered active based on the more recent of: their latest edit, or their latest administrative log action (block, protection, deletion, or any other logged action).
* Each entry shows the administrator's username (linked to their user page), the timestamp of their most recent activity, and two action buttons: 💬 (opens the administrator's user talk page in a new tab) and 📧 (opens `Special:EmailUser/<username>` in a new tab).

### Notes

* Sysops are identified via `list=allusers&augroup=sysop`. Activity is determined from a single bulk `list=recentchanges` query (edits) and a single bulk `list=logevents` query (log actions), each capped at 500 entries and limited to the last 24 hours, rather than one query per administrator. On a very active wiki, an administrator's most recent action could theoretically fall outside these 500 entries and be missed.

## 2.105.0

### Added

* Added a **"Delete destination page if it already exists (destructive)"** option to the **Move page** sub-mode of the Move page section. When ticked, if the destination title already has an existing page, that page is deleted immediately before the move is attempted, allowing the move to proceed without a manual pre-deletion step.

### Notes

* This option is only available in the **Move page** sub-mode; it does not apply to **Move to user's sandbox**, since sandbox destinations are not expected to already exist.
* The destination page is deleted using the same reason entered for the move itself. This is a destructive action: verify the destination title carefully before enabling this option, since the deleted page is not automatically restored if the subsequent move fails.
* A `delete` operation counter increment is logged for the destination-page deletion, consistent with other deletion actions in the progress dialogue.

## 2.104.7

### Fixed

* Fixed the hardblock/autoblock visibility and the Report to Steward requests/Global reason container (block vs lock) not updating when returning to user mode after visiting page mode. `applyModeRestrictions()` resets `inputTarget.value` directly without dispatching a change event, so the change listener's target-specific logic — which sets `wrapHardblock`/`wrapAutoblock` display and calls `updateSRGFormForTarget()` — was skipped on mode return. Both are now re-evaluated immediately after the target is reset.

## 2.104.6

### Fixed

* Fixed block notifications being immediately removed when Block and Page deletion are used together with "Also delete the talk page" enabled. When a block notification has been successfully posted to the target user's talk page, that talk page is now skipped during the talk page deletion pass and a warning is logged, so the notification remains visible after the operation completes.

## 2.104.5

### Fixed

* Fixed the "Not communicating in the wiki language" and "Creating articles not in the wiki language" warning templates producing malformed `{{#language:}}` calls. `Intl.DisplayNames` was being used to convert the wiki's language code into a display name (e.g. `id` → `"Indonesia"`), which was then passed to `{{#language:...}}`. The parser function expects a BCP 47 language code, not a name, so the output rendered incorrectly. The `wikiLangEn` and `wikiLangId` intermediate variables have been removed; `wikiLangCode` is now passed directly to the template.

## 2.104.4

### Fixed

* Fixed padlock icons in locked section headers appearing near the checkbox label instead of immediately to the left of the chevron. `.tng-rights-lock` had no left margin, so the chevron's `margin-left: auto` absorbed all free space to its own left, leaving the padlock stranded at the start of the header. The padlock now receives `margin-left: auto` when inside a section header, and the adjacent chevron's auto margin is cancelled, keeping both icons flush at the right edge.

## 2.104.3

### Changed

* The **Lock account** section now appears locked immediately when the dialogue opens, without an intermediate "checking steward status" tooltip. The padlock now reads "steward rights are required to use this feature." from the start; the rights check then either removes the lock (steward confirmed) or updates the reason to "you do not have steward rights on this wiki."
* Reduced the `[EXPERIMENTAL]` badge font size from `1em` to `0.9em`.

## 2.104.2

### Changed

* The padlock's `margin-left` is now removed.

## 2.104.1

### Fixed

* Fixed padlock icons being positioned inconsistently across locked feature sections. Both `.tng-rights-lock` and `.tng-section-arrow` previously declared `margin-left: auto`; in a flex container, two auto left margins share the available free space equally, placing the padlock near the centre of the header rather than adjacent to the chevron. The padlock's `margin-left` is now a fixed `4px`, so the chevron's `margin-left: auto` absorbs all remaining free space and keeps both icons flush together at the right edge.

### Changed

* Increased the `[EXPERIMENTAL]` badge font size from `0.72em` to `1em` (relative to its parent `.tng-checkrow` context), so the badge text matches the surrounding section title text.
* Reduced the `[EXPERIMENTAL]` badge border radius from `8px` to `3px`.
* Reduced the rights badge border radius in the footer panel from `10px` to `3px`, matching the updated badge style.

## 2.104.0

### Changed

* Locked sections (padlocked due to insufficient rights, an unsupported mode, or an unmet status condition, e.g. Block, Page deletion, Page protection, Unblock, Lock account, Report to Global sysops/Requests, Page undeletion, Protect against recreation) can now always be expanded and collapsed by clicking the section header, regardless of lock state.
* Added a chevron next to the padlock icon on locked sections, so the section can be opened to view its (disabled) controls without needing to satisfy the mode or rights requirement first.
* The feature itself remains unavailable while locked: the enable checkbox stays disabled and unchecked, and the section body stays visually dimmed and non-interactive. Only the ability to expand/collapse the section header is now unconditional.

### Notes

* This affects `lockSection()` (permanent rights-based locks), `applyModeLock()` (reversible mode locks), and all reversible status-lock helpers (`applyUnblockStatusLock()`, `applyLockAccountStatusLock()`, `applyGSStatusLock()`, `applyUndeleteStatusLock()`, `applyProtectRecreationStatusLock()`).
* No CSS changes were required: the padlock badge and the chevron both already use `margin-left: auto`, so inserting the padlock immediately before the chevron in the DOM keeps them adjacent at the right edge of the section header.

## 2.103.2

### Fixed 

* Fixed the **Lock account** section's steward-status lock (added in v2.103.0) being evaluated regardless of mode, instead of only in user mode. Because the mode lock is also applied to this section in page mode, opening Tengu directly in page mode as a non-steward could append two separate 🔒 badges to the section header. More significantly, switching from page mode back to user mode reset the checkbox to enabled regardless of steward status, since `applyModeLock()`'s unlock path unconditionally clears `disabled`, bypassing the steward-only restriction until the page was reopened.
* The steward-status lock is now only applied or removed while in user mode. `applyModeRestrictions()` re-evaluates it when switching back to user mode, using a newly stored `isSteward` value on `resolvedRights`, matching the existing pattern already used there for the `hasBlock`/`hasRevdel` rights re-checks. 

### Notes 

* This affects only the Lock account section's lock/badge state when switching between user mode and page mode. The underlying steward-rights check itself (`meta=globaluserinfo`) is unchanged.

## 2.103.1

### Fixed

* Fixed the **"Edit warring (softer wording for newcomers)"** warning template (Single warning group) calling `finalSentence(false)` (English wording) instead of `finalSentence(true)` in its Indonesian notice body. A final warning issued via this template on an Indonesian-language wiki incorrectly inserted an English sentence into an otherwise Indonesian-language notice.

### Notes

* This affects only the Indonesian-language output of the `ew-newcomer` warning template when "This is a final warning" is ticked. The English output, and all other warning templates, were unaffected.

## 2.103.0

### Added

* Added a new **Lock account** section (user mode only), marked with an `[EXPERIMENTAL]` badge in the section header. Globally locks the target account via CentralAuth, preventing it from logging in to any Wikimedia wiki.
* This action is restricted to stewards. Non-stewards see the section (so its existence is discoverable) but its controls are disabled with an explanatory padlock tooltip.
* Added `LOCK_ACCOUNT_REASONS` to `Tengu-reasons.js`, a set of preset lock reasons in English only, since global locks are a steward-only, cross-wiki action.
* Added an "Also request the username be hidden (lock and hide)" option and an optional lock notification to the target's talk page.
* Added a `lock` counter to the progress dialogue's operation statistics.

### Notes

* [EXPERIMENTAL] The API call used to perform the lock (`action=setglobalaccountstatus` via `mw.ForeignApi` against Meta-Wiki) has not been independently confirmed against a live wiki. Testing this feature requires steward rights, which were not available at the time of writing. Please verify carefully before relying on it.
* Global locks only apply to registered accounts; the Start button validation blocks execution if the target is an IP address.
* This feature is not included in any package preset.

## 2.102.3

### Fixed

* Fixed the **"Adding citations to research published by a small group of researchers"** warning template (Single notices group) sharing the same `value` ("fringe") as the unrelated **"Introducing fringe theories"** template (Behaviour in articles group). Because `buildWarnNotice()` matches templates by value and searches groups in order, selecting the citations template always posted the fringe-theories notice instead.

### Notes

* This affected only the User warning section's template resolution. The citations template's dropdown label was always correct; only the posted notice content was wrong.

## 2.102.2

### Fixed

* Fixed the selected Suffix (e.g. " (global sysops action)", " (stewards action)", " (global rollbackers action)") not being appended to the Rollback section's reason. Every other reason field (block, unblock, page deletion, undeletion, move, protection, recreation protection, revision deletion) already appended the suffix; `rollbackReason` was the sole exception, so rollback/undo edit summaries silently omitted it even when explicitly selected.

### Notes

* This affects only the reason text used in rollback/undo edit summaries. No other behaviour changed.

## 2.102.1

### Fixed

* Fixed temporary accounts (matching the `~YYYY-…` pattern) being reported via `{{LockHide|1=Username}}` in the Report to Global sysops/Requests section, the same as registered accounts. Temporary accounts cannot be locked, so this report line now uses an interwiki-linked contributions page instead, matching the fix already applied to the Report to Steward requests/Global section in v2.68.0.

### Notes

* This affects only the wikitext report line built by `buildGSReportLine()` in user mode. Page-mode reports and the Steward requests/Global section were unaffected, as the latter already handled temporary accounts correctly.

## 2.102.0

### Added

* Added separate expiry drop-downs for edit protection, move protection, and pending changes protection in the Page protection section, replacing the single shared expiry control. Each has its own preset options and custom-expiry input, so different protection types can now expire independently.

### Fixed

* Fixed pending changes protection failing with `stabilize_expiry_invalid` when the expiry was set to "Indefinite". The `action=stabilize` request now sends `infinite` for indefinite expiry instead of `never`.

### Notes

* The `stabilize_expiry_invalid` error may appear to have been caused by `action=stabilize` not accepting the `never` alias that `action=protect` recognises for indefinite expiry.
* Edit and move protection expiries are now submitted as a pipe-separated `expiry` parameter alongside the pipe-separated `protections` parameter in a single `action=protect` call, matching the positional expiry-list format documented for that API module.
* Upload restriction has no dedicated expiry control and continues to share the edit protection expiry, since it was not part of this request.
* Talk page protection (both the primary pass and the deferred post-deletion pass) now submits edit and move expiries separately using the same pipe-separated format.
* Package presets without explicit `moveExpiry` or `pendingChangesExpiry` values fall back to the existing `expiry` value, so current entries in `Tengu-packages.js` continue to work unchanged.

## 2.101.0

### Added

* Added an **"All users"** option to the **Pending changes level** drop-down in the Page protection section, alongside the existing Autoconfirmed users and Reviewers/administrators only options. Selecting this now allows pending changes protection to be reduced or removed entirely, rather than only ever being increased.

### Notes

* Submitting this option passes `protectlevel: "none"` to the `action=stabilize` API call.
* No changes were made to the standard edit/move/upload protection controls; this affects only the pending changes group.

## 2.100.2

### Fixed

* Fixed the **Suppress redirect** checkbox in the **Move page** sub-mode of the Move page section not being ticked automatically for sysops, unlike the equivalent checkbox in the **Move to user's sandbox** sub-mode. Once the `suppressredirect` right was confirmed, the checkbox was correctly enabled but left unchecked, so sysops had to tick it manually every time despite holding the right.

### Notes

* This affects only the Move page sub-mode's default state. The Move to user's sandbox sub-mode's suppress-redirect checkbox was already being ticked correctly and is unaffected.

## 2.100.1

### Fixed

* Fixed the progress dialogue always logging "✅ All operations have been completed successfully" at the end of a run, even when the user had aborted the operation. `isAborted` was being reset to `false` immediately before the check that selects between the "aborted" and "completed" log messages, making the aborted-run message unreachable.

### Notes

* This is a logging-only fix. Abort handling itself (stopping further actions, disabling the abort button, etc.) was already working correctly; only the final summary log line was affected.

## 2.100.0

### Changed

* Changed the edit summary used when a talk page is moved as part of the **Move to user's sandbox** sub-mode of the Move page section, from "Moving the talk page because its associated main page has been moved: [reason]" to "Talk page of moved page: [reason]", matching the wording pattern already used by the Page deletion section for its own associated talk-page action.
* Applied the same change to the corresponding subpage talk-page move summary, which now reads "Talk page of moved subpage: [reason]".
* Added the equivalent Indonesian-language wording for both cases: "Halaman pembicaraan dari halaman yang dipindahkan: [reason]" and "Halaman pembicaraan dari subhalaman yang dipindahkan: [reason]".

### Notes

* This affects only the edit summary text used for the separately-triggered talk-page and subpage-talk-page moves in the Move to user's sandbox sub-mode. It has no effect on the Move page sub-mode, which relies on the native `movetalk` API parameter and reuses the main move's reason directly.

## 2.99.0

### Fixed

* Fixed the rollback/undo edit summary diff link (added in v2.97.0) pointing to a single revision (`Special:Diff/<revid>`) instead of the full diff of the reverted change. When rollback reverts several consecutive edits in one action, the single-ID form only showed the last of those edits against its immediate parent, not the cumulative change being reverted.
* The link now uses the two-ID form `Special:Diff/<previous revision ID>/<reverted revision ID>` (e.g. `Special:Diff/1000/1005`), showing the full diff between the revision before the reverted edits and the latest reverted revision.

### Notes

* Falls back to the single-ID form when no parent revision is known (`info.oldestParent` is unset), matching previous behaviour in that edge case.
* This affects the native rollback summary, the undo summary, and the mediainfo/structured-data revert summary, all of which draw from the same shared `buildRevertSummaryText()` call.

## 2.98.0

### Added

* Added shift-click range selection to the **Select specific edits/pages** picker. Ticking a checkbox, then holding Shift and ticking another checkbox further down the same section, now selects (or deselects) every item in between, matching standard range-selection behaviour in desktop and web interfaces.

### Notes

* Range selection operates only on currently visible items — rows hidden by the namespace filter are skipped and not included in the range.

## 2.97.1

### Fixed

* Fixed a `SyntaxError: Identifier 'rbSummaryStr' has already been declared` parsing error that broke the entire script. A leftover pre-v2.97.0 assignment to `rbSummaryStr` (the old rollback summary logic, without the diff link) was never removed when that version introduced `buildRevertSummaryText()`, leaving two `const rbSummaryStr` declarations in the same scope.

### Notes

* This is a syntax-only fix. `rbSummaryStr` and `undoSummaryStr` now both come from the single `buildRevertSummaryText()` call added in v2.97.0; no summary wording has changed as a result of this fix.

## 2.97.0

### Changed

* Rollback and undo edit summaries now include a link to the reverted revision's diff, using `[[Special:Diff/<revision ID>|edit]]` (or `suntingan` on Indonesian-language wikis).
* When no rollback/undo reason is supplied, the summary now reads "Reverted [[Special:Diff/X|edit]] by [reverted user] to the previous revision by [previous user]" (falling back to omitting the "to the previous revision by..." clause if the previous editor could not be determined).
* When a rollback/undo reason is supplied, the summary now reads "Reverted [[Special:Diff/X|edit]] by [reverted user]: [reason]".
* Added the equivalent Indonesian-language wording for both cases.

### Notes

* This affects the native rollback summary, the undo summary, and the mediainfo/structured-data revert summary, all of which draw from the same shared summary text.
* The "Show username in summary" checkbox continues to be respected: when unticked, the summary omits the username, reading "Reverted [[Special:Diff/X|edit]]" (optionally followed by ": [reason]").

## 2.96.0

### Fixed

* Fixed the Move log in the Get info panel (page mode) failing to show move history when opened on the destination title of a previous move. Move log entries are recorded under the page's title at the time of the move (the source title), so querying only the current title missed entries whenever the current title was the result of an earlier move.
* The Move log now also checks the move history of any redirects currently pointing to the target page, since a redirect left behind by a move holds exactly the previous title the page held. Entries found this way are labelled with a "Previous title" row so it is clear which title the move log entry was recorded against.

### Notes

* Entries from the current title and any checked redirects are merged, deduplicated by log ID, and sorted newest first before display.
* If the redirect lookup itself fails, the section falls back to checking only the current title's own move log, matching the previous behaviour.

## 2.95.0

### Fixed

* Fixed the global block report format submitted to Steward requests/Global for IP addresses and temporary accounts. The heading link now uses a standard wikilink (`[[Special:Contributions/Target|Target]]`) instead of a bracketed external URL, and the `{{Luxotool}}` line is now preceded by a bullet (`*`), matching the formatting already used by global lock requests.

### Changed

* Standardised the edit summary used when submitting to Steward requests/Global. Both global block and global lock requests now read "Reporting account for global block" or "Reporting account for global lock" as appropriate, replacing the previous account-type-specific wording ("Reporting IP for global block" / "Reporting account for global lock").

## 2.94.0

### Fixed

* Fixed a horizontal scrollbar appearing in the Page protection section. `.tng-recreation-group` did not use `box-sizing: border-box`, so its padding and border were added on top of its 100%-width sizing rather than being contained within it, making the container wider than its parent. This became visible once the pending changes controls were grouped into their own `.tng-recreation-group` container in v2.92.0/v2.93.0.

### Notes

* This is a CSS-only fix. It also applies to the other two containers that share `.tng-recreation-group` (the Page deletion section's recreation-protection controls and the standalone Protect against recreation section), though neither had been reported as visibly overflowing.

## 2.93.0

### Changed

* The pending changes (FlaggedRevs) controls in the Page protection section are no longer hidden on wikis without the FlaggedRevs extension. The "Also enable pending changes protection" checkbox and "Pending changes level" dropdown now stay visible at all times and are disabled, with an explanatory tooltip, when the current wiki does not have FlaggedRevs installed.
* Grouped the pending changes checkbox and level dropdown inside a bordered `.tng-recreation-group` container (the same style already used by the recreation-protection controls), separating them visually from the standard edit/move/upload restriction settings above.

### Notes

* This is a visual and discoverability change only; pending changes protection continues to be submitted via `action=stabilize` exactly as before, and remains unavailable to select until `flaggedRevsPromise` confirms the extension is present.

## 2.92.0

### Added

* Added pending changes (FlaggedRevs) protection support to the Page protection section. A new "Also enable pending changes protection" checkbox and a "Pending changes level" dropdown (Autoconfirmed users / Reviewers/administrators only) appear only on wikis where the FlaggedRevs extension is detected via `siprop=extensions`.
* When enabled, an `action=stabilize` request is submitted alongside the standard `action=protect` request, using the same expiry and reason as the main protection action.

### Notes

* Pending changes protection is requested as a separate API call from the standard edit/move (and, where applicable, upload) protection; a failure in one does not prevent the other from being attempted.

## 2.91.0

### Added

* Added a namespace drop-down to the **Move page** sub-mode of the **Move page** section, positioned to the left of the **Destination title** field. The list of namespaces is fetched automatically from the current wiki via `siprop=namespaces` and cached for the session.
* The drop-down occupies 35% of the row's width, with the destination page title field taking the remaining 65%.

### Changed

* The **Destination title** field now holds only the page title (without a namespace prefix); the namespace is selected separately via the new drop-down. Both are pre-filled from the current target's namespace and title when the dialogue opens or the target changes, matching previous behaviour.
* Added `updateMovePageDestFromTarget()` and `buildMovePageDestTitle()`, replacing duplicated inline pre-fill logic previously present in `applyModeRestrictions()` and the target-change handler.

### Notes

* Typing a fully prefixed title into the destination field while the namespace drop-down is left on "(Main)" continues to work, since the two values are only combined if a non-main namespace is selected.

## 2.90.0

### Changed

* Redesigned the User mode / Page mode toggle as a compact on/off switch, replacing the previous side-by-side button pair. The "User mode" and "Page mode" labels are now shown outside the switch, on either side of it, with the active mode's label highlighted in its mode colour (lavender for user mode, sage green for page mode).

### Notes

* This is a visual change only; mode-switching behaviour, mode locking, and target pre-filling are unchanged.
* The switch is now disabled as a whole (rather than only the "User mode" side) when user mode is unavailable — outside the user/user talk namespace, on out-of-scope contribution-style pages, or when the target is an IP range — since page mode is the only option in those cases.

## 2.89.0

### Added

* Tengu now checks whether the target page currently exists (in page mode) before allowing Page deletion, Move page, or Page protection to be enabled. These features act on an existing page, so they are now locked with an explanatory padlock tooltip when the target does not exist.

### Notes

* This mirrors the gating already applied in the opposite direction to Protect against recreation, which is only available when the target page does not exist.
* Page undeletion was unaffected by this issue, since it already checked the target's deletion log before allowing it to run.
* The existence check reuses the `prop=info` request already made for the Page protection status note, so no additional API call was introduced.

## 2.88.0

### Fixed

* Fixed block, page deletion, and page protection talk-page notifications leaving the reason blank when no reason was entered or selected. These notifications now fall back to "(no reason given)" on English-language wikis, or "(tidak ada alasan diberikan)" on wikis listed in `INDONESIAN_LANGS`, matching the fallback already used by the rollback/undo notification since v2.85.0.

### Notes

* This affects only the notification text posted to the relevant talk page. Edit summaries and log entries elsewhere are unaffected.

## 2.87.0

### Fixed

* Fixed several ESLint warnings with no functional impact:
  * Removed the unused `TNG_CSS` constant (superseded by the external `Tengu.css` stylesheet since v2.0.0).
  * Removed an unused `dialog` binding from the self-block confirmation dialogue's destructuring assignment.
  * Added explanatory comments to previously empty `catch` blocks used for best-effort namespace-ID resolution in the Export edits and Select edits/pages picker features.
  * Converted the `applyPickerNamespaceFilter` function declaration (nested inside an `if` block) to a function expression, resolving a `no-inner-declarations` warning.

### Notes

* This is a lint-cleanup release; no user-facing behaviour has changed.

## 2.86.0

### Added

* Added five interwiki prefixes to `NO_LANG_HOSTS` in `getInterwikiPrefix()`: `www.mediawiki.org` → `mw:`, `foundation.wikimedia.org` → `foundation:`, `outreach.wikimedia.org` → `outreach:`, `wikimania.wikimedia.org` → `wikimania:`, `wikitech.wikimedia.org` → `wikitech:`.

### Notes

* These hosts do not use language-specific subdomains, so they belong in `NO_LANG_HOSTS` rather than the language-pattern branch.
* Primarily relevant to the Report to Global sysops/Requests feature, which uses `getInterwikiPrefix()` to build report links.

## 2.85.0

### Added

* Added a **"Notify target user of reverted edits"** checkbox to the Rollback section, disabled by default. When ticked, a single notification is posted to the target user's talk page after Start is pressed, listing every page successfully reverted via rollback or undo in that run, along with the reason given.
* If more than one page was reverted, all affected pages are listed in one consolidated notification rather than one notification per page, matching the pattern already used for mass deletion and mass protection notices.
* Added an Indonesian-language variant of the notice, shown on wikis whose content language is listed in `INDONESIAN_LANGS`.

### Notes

* The notification is only sent in user mode, since rollback/undo is not available in page mode.
* If no custom rollback/undo reason was supplied, the notice falls back to "(no reason given)" / "(tidak ada alasan diberikan)".

## 2.84.0

### Fixed

* Fixed the Undo feature logging a successful revert even when no edit was actually made. `action=edit&undo=` can return a successful API response with a `nochange` result and no `newrevid` when the target revision has already been undone by another user, which was previously treated as a successful revert since no error was thrown.
* Tengu now inspects the edit API response for a `nochange` result and logs "the edit appears to have already been undone; no changes were made" instead of a success message when this occurs.

### Notes

* This is separate from the existing `alreadyreverted`/`nothingtorevert` handling, which only catches cases where the API call throws an error. The `nochange` case resolves successfully but performs no edit, so it required its own check.

## 2.83.0

### Changed

* The **fix double redirects** feature (Move page section) now detects the local wiki's redirect magic word(s) instead of assuming the English `#REDIRECT`. The set of valid aliases (e.g. `#REDIRECT`, `#ALIH`) is fetched once per session via `siprop=magicwords` and reused for every double-redirect fix performed afterwards.

### Notes

* Falls back to `#REDIRECT` alone if the magic word lookup fails or the wiki returns no aliases for `redirect`, so the feature continues to work even when this cannot be determined.
* The matched alias is preserved as-is when rewriting the redirect target, since it is captured and reused rather than replaced.

## 2.82.0

### Added

* Added a **"Fix double redirects"** checkbox (enabled by default) to the **Move page** sub-mode of the Move page section. After a successful move, Tengu searches for existing redirects pointing to the old title and updates each one to point directly to the new destination, rather than leaving them chained through the redirect created at the old title.
* Added a `redirfix` counter to the progress dialogue's operation statistics, shown alongside the other counters as "redirects fixed".

### Notes

* Only applies when a redirect is left at the source title (i.e. when **"Suppress redirect"** is not used), since a double redirect can only arise when an intermediate redirect exists.
* The rewrite only replaces the title inside the `#REDIRECT [[...]]` markup, preserving any section anchor or piped display text that follows it.
* This feature is not available in the **Move to user's sandbox** sub-mode, since sandbox moves are not expected to have existing redirects pointing at the source title in the same way as general page moves.

## 2.81.0

### Changed

* Standardised the wikitext format used when submitting reports to Meta-Wiki's Global sysops/Requests page.
* Blocking requests now read `* Please block {{LockHide|1=Username|2=Prefix}}: [reason]` for registered and temporary accounts, or an interwiki-linked contributions page for IP addresses, instead of the previous full-URL link followed by "on [site name] ([dbname])".
* Page deletion, page protection, and revision deletion requests now read `* Please delete [[:Prefix:Page title|Page title]]: [reason]` (or "Please protect" / "Please delete revisions from"), instead of a bracketed full-URL link.
* `Prefix` is the reporting wiki's interwiki project and language prefix (e.g. `w:id:`, `wikt:ja:`), generated automatically from the current wiki's hostname via the new `getInterwikiPrefix()` helper.

### Added

* Added `getInterwikiPrefix()`, covering Wikipedia, Wiktionary, Wikibooks, Wikinews, Wikiquote, Wikisource, Wikiversity, Wikivoyage, and a handful of language-independent sister projects (Commons, Wikidata, Meta, Wikispecies, Incubator, Wikifunctions).

## 2.80.0

### Added

* Added file delinking to the **Remove links to deleted page or file (article namespace only)** option (renamed from "Remove links to deleted page") in the **Page deletion** section. When a deleted item is a file, Tengu now also removes references to it from articles in the main namespace, covering `[[File:Example.jpg]]`, `[[File:Example.jpg|thumb|caption]]`, the `Image:` alias, and bare `<gallery>` entries such as `File:Example.jpg|caption`.
* File references are located via `list=imageusage` rather than `list=backlinks`, since MediaWiki tracks file embeds separately from ordinary page links.

### Changed

* The checkbox tooltip now explains the file-delinking behaviour and notes that it is an experimental feature, so results should be checked carefully before relying on it.
* Edit summaries for file-reference removals now read "Removing references to deleted file: " (or the Indonesian equivalent) instead of the page-link wording.

### Notes

* File delinking is new and experimental. The regular expressions used to match file embeds and gallery entries cover common forms but have not been exhaustively tested against every valid wikitext variant, including localised `File:`/`Image:` namespace aliases on non-English wikis.
* Unlike the existing page-link removal, a matched file reference is deleted outright rather than replaced with display text, since bare file embeds have no equivalent plain-text fallback.

## 2.79.0

### Changed

* The **Also move the associated talk page** option in the **Move page** sub-mode of the Move page section is now disabled when no associated talk page exists for the current target, or when the target is itself a talk page. This matches the behaviour already applied to the Move to user's sandbox sub-mode. The option starts unchecked and disabled until the check resolves.
* The **Also delete the talk page** option in the **Page deletion** section is now disabled in page mode when no associated talk page exists for the current target, or when the target is itself a talk page. In user mode the option remains always enabled, since the pages to delete are determined dynamically from the target user's contributions.

## 2.78.0

### Changed

* The **Destination title** field in the **Move page** sub-mode of the Move page section is now pre-filled with the current page's full title (including the namespace prefix where applicable) when the dialogue opens or the target changes. This avoids retyping the existing title when only a minor adjustment is needed.

## 2.77.2

### Fixed

* Fixed the Move page section remaining unlocked when switching from user mode to page mode on a Special-namespace page. `targetIsSpecial` in `applyModeRestrictions()` was computed before `inputTarget.value` was updated to the page's default target, so `applySpecialPageLocks()` received an incorrect `false` and left the section available. The check is now re-evaluated after the input update, and the mode notice is refreshed accordingly.

## 2.77.1

### Changed

* Switching between light and dark mode now animates smoothly. Background, text, and border colours on the dialogue and its main child elements cross-fade over 0.25 s. The transition is scoped to a short-lived `.tng-theme-transitioning` class added during the switch, so hover effects, section expand/collapse animations, and other existing transitions are not affected.

## 2.77.0

### Changed

* The **Select edits/pages** picker now fetches the target user's complete contribution history by paginating through all available API results, matching the behaviour of the **Export edits** feature. The previous cap of 500 contributions and the accompanying truncation notice have been removed. A running count is displayed in the loading message while fetching is in progress.

## 2.76.0

### Added

* Added an **Export edits** button in user mode, placed next to the **Get info** button. Clicking it opens a dialogue that paginates through the target user's full contribution history and collects all unique pages they have edited.
* The dialogue includes a namespace filter (shown when results span more than one namespace), **A–Z** and **Z–A** sort buttons, a summary line showing how many pages are visible, and a scrollable preview of the output in wikitext numbered-list format (for example, `# [[Example title]]`, `# [[:File:Example file]]`, `# [[:Category:Example category]]`).
* A **Copy as wiki links** button copies the currently visible, sorted list to the clipboard. File and Category pages are prefixed with a colon so they render as hyperlinks rather than file embeds or category tags. All other namespaces use standard wikilink syntax without a colon prefix.
* The button is hidden in page mode, where there is no user target to query.

## 2.75.0

### Changed

* Reduced the inter-request throttle delay in `work()` from 100 ms to 50 ms. A new `THROTTLE_MS` constant centralises the value so it can be adjusted in a single place if needed. The lower delay halves the artificial wait time during large batch operations — for example, processing 100 pages — while remaining within typical sysop rate limits on Wikimedia wikis.

## 2.74.1

### Fixed

* Fixed the namespace filter in the **Select edits/pages** picker having no effect after the sort controls were moved to the top of the picker body in v2.72.0 and v2.74.0. The `change` event listeners for the namespace filter checkboxes were dropped during that refactor. The listeners are now re-attached after the picker sections are built, so ticking or unticking a namespace correctly shows or hides the relevant items again.

## 2.74.0

### Added

* Added a **Z–A** sort button to the **Select edits/pages** picker dialogue, providing reverse-alphabetical ordering as a complement to the existing A–Z button.

### Changed

* Moved the sort controls (**A–Z**, **Z–A**, **Oldest first**, **Newest first**) to the top of the picker dialogue body, immediately below the namespace filter row (or below any truncation notice when contributions fall within a single namespace). They were previously positioned below the picker sections, where they were easy to overlook.

## 2.73.0

### Added

* Expanded the **Move page** section (formerly "Move to user's sandbox") to support two sub-modes, selectable via a **Move mode** dropdown at the top of the section:
  * **Move to user's sandbox** — existing behaviour; moves the target page into a user's subpage (e.g. `User:[username]/[subpage name]`).
  * **Move page** — moves the target page to an arbitrary destination title, with native support for moving the associated talk page (`movetalk`) and all subpages (`movesubpages`) via API parameters in a single call.
* Added a **Destination title** field and a **Reason** dropdown to the Move page sub-mode.
* Added preset move reasons (`MOVE_REASONS`) to `Tengu-reasons.js`, grouped under Common move reasons, Talk pages, Templates, and Files.
* The **Suppress redirect**, **Also move the associated talk page**, and **Also move all subpages** options are all available in the Move page sub-mode. Suppress redirect remains gated on the `suppressredirect` right.

### Changed

* The section label in the UI has changed from "Move to user's sandbox" to "Move page" to reflect the expanded scope. Internal variable names (`secMoveSandbox`, `chkMoveSandbox`, etc.) are unchanged.
* Mode lock tooltip messages updated to read "Move page is only available in page mode."
* The confirmation dialogue now shows "✂️ Move page" or "✂️ Move to user's sandbox" depending on the active sub-mode.

## 2.72.0

### Added

* Added **sort controls** to the **Select edits/pages** picker dialogue. Three buttons — **A–Z**, **Oldest first**, and **Newest first** — appear below the namespace filter (or below any truncation notice when all contributions are in a single namespace). Clicking a button reorders items in both the **Edited pages** and **Created pages** sections simultaneously. The active sort button is highlighted. Sorting operates on the full item list independently of the namespace filter; items hidden by the filter retain their position but remain hidden.
* Each picker item wrapper now stores the page title as `data-picker-key` and the contribution timestamp as `data-picker-timestamp`, used by the sort comparators. The timestamp comparators use lexicographic string ordering, which is correct for ISO 8601 timestamps.
* `makePickerSection()` now accepts an optional fourth parameter `tsFn`, a function that returns a timestamp string for a given item. It also returns `listEl` alongside `sec` and `checkboxes`, so callers can reference the DOM list for later reordering.

## 2.71.1

### Fixed

* Fixed the namespace filter in the **Select edits/pages** picker having no effect. The filter checkboxes were built correctly but no `change` listener was ever attached, so ticking or unticking a namespace had no visible result. Each picker item wrapper now stores the page's resolved namespace ID as a `data-picker-ns-id` attribute at build time. A new `applyPickerNamespaceFilter()` function, wired to every namespace checkbox's `change` event, uses those attributes to show or hide rows immediately when the selection changes.

## 2.71.0

### Added

* Added a **namespace filter** to the **Select edits/pages** picker. When fetched contributions span more than one namespace, a row of namespace checkboxes (for example, Main, User, Template) appears above the section lists. Unticking a namespace hides all items from that namespace across both the **Edited pages** and **Created pages** sections. The filter row is not shown when all contributions are in the same namespace.
* Added an **Invert selection** button alongside **Select all** and **Deselect all** in each picker section. Clicking it reverses the checked state of every currently visible item in that section.

### Changed

* **Select all** and **Deselect all** in the picker now act only on items that are currently visible (i.e. not hidden by the namespace filter). Items hidden by the filter retain their current checked state.

## 2.70.0

### Added

* Added a **"Select specific edits/pages"** option to the Edits dropdown (user mode only). When selected, a **"Select edits/pages"** button appears below the dropdown. Clicking it opens a picker dialogue that fetches up to 500 of the target user's most recent contributions and groups them into two collapsible sections: **Edited pages** and **Created pages**. Each section has **Select all** and **Deselect all** controls and a checkbox per page, showing the page title and the timestamp of the most recent edit or creation.
* A summary line below the button shows how many pages are currently selected (for example, "3 edited pages, 1 created page selected."). Previously confirmed selections are pre-ticked when the picker is reopened.
* If the fetch returns more than 500 contributions, a notice is shown in the picker dialogue advising that only the most recent 500 are listed.
* When the custom-selection mode is active and the Start button is pressed, `work()` uses the confirmed selection directly rather than fetching contributions from the API. If no items have been selected, a warning is logged and no edits or pages are processed.

### Changed

* Switching to page mode whilst the Edits dropdown is set to "Select specific edits/pages" now resets the dropdown to "In the last 1 hour" and clears any pending selection.

## 2.69.0

### Added

* Added **Page protection** and **Revision deletion** as request types in the Report to Global sysops/Requests section when Tengu is in page mode. The section previously only supported page deletion requests. A new "Request type" dropdown (visible in page mode only) lets users choose the appropriate action before selecting reasons.
* Added preset reason checkboxes for each page-mode request type:
  * **Page deletion** — vandalism, spam, attack page, blatant copyright violation, cross-wiki spam, hoax page (unchanged from the previous single set)
  * **Page protection** — cross-wiki vandalism, spam, long-term abuse (LTA), persistent disruption, repeated copyright violations
  * **Revision deletion** — privacy violation or personal information, copyright violation, attack or defamatory content, grossly offensive content, spam or promotional content
* The report line submitted to Global sysops/Requests now opens with "Please protect" or "Please delete revisions from" for the corresponding request types, replacing the fixed "Please delete" wording that previously applied to all page-mode reports.

### Changed

* Renamed the `PAGE` key in `GLOBAL_SYSOPS_REPORT_REASONS` (`Tengu-reasons.js`) to `PAGE_DELETE`, and updated all references in `Tengu.js`. This is an internal rename with no user-visible effect.
* Switching the request type clears all reason checkboxes for the previously selected type so no stale selections carry over.
* Switching between user mode and page mode resets the request type selector to "Page deletion" and clears all reason checkboxes across all three page-mode sets.

## 2.68.1

### Fixed

* Fixed the Start button remaining disabled when only the Protect against recreation section was enabled. The section's enable checkbox was missing from both the `updateStartBtn()` condition and its set of `change` event listeners, so ticking it had no effect on button state.

## 2.68.0

### Fixed

* Fixed temporary accounts being routed to the global lock path in the Report to Steward requests/Global section. Temporary accounts (matching the `~YYYY-…` pattern) cannot be globally locked and are now treated as global block targets, consistent with IP addresses. The block-reason checkboxes and global block report template are shown when the target is a temporary account.

## 2.67.0

### Changed

* The "Mark as bot edits" checkbox in the Rollback section is now automatically disabled when "Use undo instead of rollback" is selected, since marking edits as bot edits applies only to native rollback. The checkbox is re-enabled when undo is deselected, and any ticked value is cleared while undo is active. The state is also re-evaluated when a package is applied and when the rights check resolves.
* Removed the help text below the Rollback reason field. The note previously stated that leaving the reason field empty with "Show username in summary" unticked would produce a "Revert edits" summary; this wording no longer accurately reflects rollback and undo summary behaviour following changes in earlier versions.
* The status notes shown in the Page deletion, Page protection, and Page undeletion sections when Tengu is in user mode now read "Deletion history is only available in page mode." and "Protection status is only available in page mode." respectively, replacing the previous "Not applicable in user mode." wording, which gave no indication of where the information is available.

## 2.66.0

### Added

* Added an **"Also move all subpages"** checkbox to the Move to user's sandbox section. When ticked, all subpages of the target page are moved to the corresponding subpages of the destination (e.g. `User:[username]/[subpage name]/SubpageName`). If "Also move the talk page" is also ticked, the talk page of each subpage is moved to the corresponding talk subpage of the destination as well. Subpages are moved with the same reason, redirect-suppression setting, and throttle delay as the main page.

### Changed

* The "Suppress redirect" checkbox tooltip now states that the option is only available to sysops and that non-sysop users cannot use it, making the restriction clearer without requiring the user to attempt the move first.
* The "Also move the talk page" checkbox is now automatically disabled when the target page is itself a talk page (which has no associated talk page) or when no talk page exists for the target. The checkbox is re-evaluated each time the target field changes. The tooltip is updated to reflect the reason when disabled.
* The `moveSandboxTalk` config key is now gated on the checkbox's disabled state as well as its checked state, matching the pattern used by other reversibly lockable features.

## 2.65.0

### Fixed

* Fixed section-body expand and collapse animations not running when a section's enable checkbox is unchecked. The `.tng-section.tng-disabled .tng-section-body` CSS rule previously declared only `transition: opacity 0.25s`, which overrode the `max-height` and padding transitions defined on `.tng-section-body`. All four animated properties are now listed in both transition declarations so the animation runs regardless of whether the section is enabled or disabled.

### Changed

* Increased `.tng-section-body` `max-height` from 460 px to 560 px to reduce the frequency of internal scrollbars in feature sections
* Progress, confirmation, user-info, page-info, and self-block-confirmation dialogues now use a new `.tng-dialog-child` CSS class (`width: min(720px, 88%)`) to distinguish them visually from the main Tengu window, which retains its original `width: min(850px, 96%)`

## 2.64.0

### Changed

* The toolTag separator has been changed from an en dash to a middle dot (·), making the attribution line visually consistent with the dot-separated notice lines used elsewhere in Tengu's output
* The "Protect from recreation after deletion" protection level dropdown in the Page deletion section now includes the "Extended confirmed users" option on wikis where that protection level is configured, matching the protection level options already available in the Protect against recreation section and the main Page protection section
* Section bodies now animate smoothly when expanding and collapsing, using a `max-height` and `padding` transition, rather than appearing and disappearing instantly

## 2.63.0

### Removed

* Removed the "Also block related temporary accounts (via shared IP)" checkbox and its associated pre-execution lookup panel from the block section. The feature relied on `action=checkuser` (`cutype=userips` / `cutype=ipusers`), which requires the `checkuser` right.

## 2.62.0

### Changed

* The "Also block related temporary accounts (via shared IP) (BETA feature)" checkbox in the Block section is now presented inside a separate bordered sub-section, visually distinct from the other block options
* When the checkbox is ticked, Tengu queries the CheckUser API immediately and lists all related temporary accounts found — each displayed as a clickable link that opens the account's contributions page in a new tab, so accounts can be reviewed before the Start button is pressed
* The list is cleared and the checkbox is reset whenever the target field changes, preventing stale results from a previous target being carried over
* Removed the inline help note "CheckUser data may include temporary accounts unrelated to the target. Verify all results carefully before enabling this option." from the block section body; the checkbox tooltip now describes the lookup and review behaviour instead

## 2.61.0

### Added

* [BETA feature] Added an **"Also block related temporary accounts (via shared IP)"** checkbox to the Block section. The checkbox is visible only when the target matches the temporary account name pattern (`~YYYY-…`). When ticked, Tengu queries the CheckUser API to find temporary accounts that shared an IP address with the target, then blocks each of them using the same expiry, reason, and block flags. A notice is shown in the interface and a warning is logged in the progress dialogue reminding users to verify the results carefully, since IP addresses are frequently shared by unrelated users. Requires the `checkuser` right. Autoblock and hardblock are not applied to related account blocks.

### Changed

* The native rollback edit summary now uses the same explicit summary logic as undo when no custom reason is provided: when "Show username in summary" is ticked, the summary reads "Revert [username]'s edits to the previous edit by [previous editor]" (or "Reverting edits by [username]" when the previous editor is not known). Previously, rollback passed an empty summary string, which caused MediaWiki to generate its own default summary rather than a Tengu-controlled one
* The talk page move edit summary in the Move to user's sandbox section now reads "Moving the talk page because its associated main page has been moved: [move reason]" in English and "Memindahkan halaman pembicaraan karena halaman utama yang terkait telah dipindahkan: [move reason]" in Indonesian, rather than reusing the same reason string as the main page move

## 2.60.0

### Changed

* All entries in `MOVE_TO_SANDBOX_REASONS` (`Tengu-reasons.js`) now use content-neutral language: "article" replaced with "page", "article space" with "main namespace", and "notability guidelines" with "inclusion guidelines". The Move to user's sandbox feature is available across Wikimedia projects where the content being moved is not necessarily an article, and the previous wording was needlessly Wikipedia-specific
* Updated the label for the corresponding reason from "Not yet ready for article space" to "Not yet ready for the main namespace", and "New user article requiring development" to "New user page requiring development", to match
* Notifications posted to user talk pages (block, unblock, and page deletion) now begin with "Dear [username]," in English and "Halo [username]," in Indonesian, to give them a more courteous and personal tone
* Warning messages posted via the User warning section now begin with "Hello [username]," in English and "Halo [username]," in Indonesian, consistent with the same principle applied to formal notifications above

## 2.59.0

### Added

* Added a **"Same as page creator"** checkbox to the "Move to user" field in the Move to user's sandbox section. When ticked, the username field is automatically populated by fetching the first revision's author for the target page, saving the need to type it manually. The field is disabled while the checkbox is active; unticking it clears and re-enables the field. If the target changes while the checkbox is ticked, the creator is re-fetched automatically
* Added an **"Also move the talk page"** checkbox. When ticked, the talk page associated with the target page is moved to `User talk:[username]/[subpage name]` using the same reason and suppress-redirect settings as the main move. The move is skipped if the target is already a talk page or if no talk page exists, with a warning logged in either case
* Added `moveSandboxTalk` and `moveSandboxTalkDest` to the config object

### Changed

* The **"Suppress redirect"** checkbox is now disabled at construction time and enabled only when the rights check confirms the current user holds the `suppressredirect` right (typically sysops). Users without this right can no longer inadvertently tick the option and cause the move to fail
* Updated the Move to user's sandbox help text to describe the talk page move destination and the suppressredirect requirement
* When switching to page mode via the mode toggle, the same-as-creator checkbox is reset to unticked and the username field is re-enabled, so a stale username from a previous session is not silently carried over

## 2.58.0

### Added

* Added a new **Move to user's sandbox** section (page mode only), allowing an administrator to move the target page directly into a user's subpage (e.g. `User:[username]/[subpage]`) without leaving the Tengu interface
* The section provides a "Move to user" field for the destination username, a "Subpage name" field pre-filled with the target page's title (without namespace prefix), a filterable reason dropdown, and a "Suppress redirect" checkbox (ticked by default; requires the `suppressredirect` right)
* Added `MOVE_TO_SANDBOX_REASONS` to `Tengu-reasons.js`, providing eight preset move reasons in English and Indonesian: requires significant improvement, appears to be an autobiography, not yet ready for article space, lacks reliable sources, does not meet notability guidelines, allow creator to continue development, new user article requiring development, and other
* Added a `move` counter to the progress dialogue's operation statistics

### Changed

* The subpage name field is automatically populated with the target page's title (without namespace prefix) whenever the target changes in page mode, or when switching to page mode via the mode toggle
* The "Move to user's sandbox" section is locked in user mode (since there is no page target to move), and locked when the page-mode target resolves to a special page (since special pages cannot be moved)

## 2.57.0

### Added

* Added detection of the `zobject` content model used by Wikifunctions pages; when the undo method is selected and the page uses this content model, Tengu now automatically falls back to native rollback and logs a warning, since the undo path relies on a wikitext three-way merge that may not work for JSON-structured ZObject content

### Changed

* Added `contentmodel` to the `rvprop` parameter of the existing revision fetch in the rollback loop, so the page's content model is retrieved alongside revision metadata in the same API call rather than a separate request

## 2.56.0

### Changed

* Moved the light/dark mode toggle button to the far right of the mode row by applying `margin-left: auto`, separating it visually from the user/page mode toggle
* Added descriptive emojis to all action buttons throughout the interface

### Fixed

* Fixed checkboxes not reflecting the active theme. Added `accent-color` to `.tng-checkrow input[type="checkbox"]` so ticked checkboxes render in the interface blue (`#3366cc` in light mode, `#6699ff` in dark mode) rather than the browser default, which was visually inconsistent with the rest of the themed interface

## 2.55.2

### Fixed

* Fixed multiple selected reasons in the Report to global sysops section being joined with commas, which left subsequent reasons with their original capitalisation in an awkward mid-sentence position. Reasons are now separated by full stops, making each one a discrete sentence
* Fixed the additional details field in both sections being joined to the selected reasons with an en dash. The field is now introduced with "Additional details:" and separated from the preceding reasons by a full stop

## 2.55.1

### Fixed

* Fixed multiple selected reasons in the Report to Steward requests/Global section being joined with commas, which left subsequent reasons with their original capitalisation in an awkward mid-sentence position. Reasons are now separated by full stops, making each one a discrete sentence
* Fixed the additional details field in the same section being joined to the selected reasons with an en dash. The field is now introduced with "Additional details:" and separated from the preceding reasons by a full stop

## 2.55.0

### Added

* Added a "Between two dates:" option to the Edits dropdown, showing two `datetime-local` pickers labelled "From:" and "To:" when selected. This allows contributions to be filtered within a specific time window rather than only from a fixed point back to now
* When only one picker is filled in, the constraint still applies to that boundary alone: "From:" without "To:" fetches all edits since that date; "To:" without "From:" fetches all edits up to that date
* The between pickers are hidden and disabled in page mode, matching the existing behaviour of the rest of the Edits row

### Changed

* Refactored the contrib-params block in `work()` to build `ucstart`/`ucend` from the resolved config rather than computing `untildate` inline, which removes a variable that is now only needed in one branch

## 2.54.0

### Changed

* Replaced the free-text seconds input shown when "Custom date and time:" is selected in the Edits dropdown with a `datetime-local` date and time picker. The selected datetime is converted to a seconds-ago value at the point the Start button is pressed
* Renamed the "Other (seconds):" option label to "Custom date and time:" to match the new control
* Updated `applyPackage()` to convert a package's numeric duration to a local datetime string when falling back to the custom option, so the picker shows the correct date rather than a raw number

## 2.53.0

### Changed

* `TenguPackages.get()` now accepts a `useIndonesian` boolean parameter, following the same pattern as `TenguReasons.get()` and `TenguWarn.get()`
* Added a `v(en, id)` helper inside `TenguPackages.get()` to select the correct language variant for each reason value
* All reason values in `NATIVE_PRESETS` and `PAGE_NATIVE_PRESETS` are now wrapped in `v()` calls, so Indonesian-language wikis receive Indonesian reason strings that match the option values defined in `Tengu-reasons.js`
* Updated the `window.TenguPackages.get()` call in `Tengu.js` to pass `useIndonesian`

### Fixed

* Fixed package reasons not matching the reason dropdown option values on Indonesian-language wikis. Because `Tengu-packages.js` previously used hardcoded English strings while `Tengu-reasons.js` returns Indonesian values on those wikis, `applyPackage()` could not find a matching option and fell back to free text for every preset reason. Package reasons now resolve to the same language as the dropdown, so the correct option is selected

## 2.52.0

### Added

* Added package support to page mode. The Package dropdown was previously disabled outside user mode; it is now available whenever Tengu is open, showing a mode-appropriate set of presets
* Added `PAGE_NATIVE_PRESETS` to `Tengu-packages.js`, four page-mode-only presets:
  * **Delete talk page only** — enables page deletion with a routine-maintenance reason, for use when the target itself is a talk page and the associated article should not be touched
  * **Speedy deletion — vandalism or test page**
  * **Promotional or spam page deletion**
  * **Protect against persistent vandalism** — enables page protection at administrators-only, 1 month
* Added `rebuildPackageOptions()` in `Tengu.js`, which repopulates the Package dropdown with the correct preset list whenever the mode toggle is used, resetting the selection to Default

### Fixed

* Fixed every reason value in the seven existing `NATIVE_PRESETS` packages (`Tengu-packages.js`) referencing dropdown *label* text (e.g. `"Vandalism"`, `"Sockpuppetry"`) instead of the corresponding option *value* text defined in `Tengu-reasons.js`. Since package application matches reasons by value, most preset reasons were previously applied as free text via the "Other:" option instead of selecting the matching dropdown entry
* Fixed `applyPackage()`'s page protection reason handling always inserting the package reason as free text and resetting the reason dropdown to "Other:", instead of matching it against the dropdown's option values first, matching the pattern already used for rollback, block, page deletion, and revision deletion reasons

## 2.51.0

### Changed

* Reworded all 26 entries in `BLOCK_REASONS` (`Tengu-reasons.js`) — both the "Common block reasons" and "Username policy violations" groups, in English and Indonesian — so each reason and its dropdown label begins with a verb describing the action taken by the account (e.g. "Vandalism" → "Vandalising content"; "Username violates the username policy" → "Using a username that violates policy"), rather than a noun phrase
* Entries that already began with a verb ("Creating attack pages", "Creating nonsense or other inappropriate pages", "Using Wikipedia for promotion or advertising purposes", "Abusing multiple accounts", "Repeatedly triggering the edit filter") were left unchanged

## 2.50.0

### Changed

* Moved the default package and the seven native preset packages (previously defined inline in `init()`) out of `Tengu.js` and into a new `Tengu-packages.js` module, following the same pattern already used for `Tengu-reasons.js` and `Tengu-warn.js`
* `Tengu-packages.js` exposes `window.TenguPackages.get()`, returning `{ DEFAULT_PACKAGE, NATIVE_PRESETS }`
* `init()` now merges `NATIVE_PRESETS` into the `packages` object via a loop instead of seven separate inline `if (!packages[...])` blocks

## 2.49.0

### Changed

* Improved the default Undo edit summary — used when "Use undo instead of rollback" is selected, no custom reason is supplied, and "Show username in summary" is ticked — to also name the author of the revision being restored, e.g. "Revert ExampleUser's edits to the previous edit by PreviousUser", making it clearer which revision the page was reverted to
* Added the equivalent Indonesian-language wording for the same case

## 2.48.0

### Added

* Added a manual light/dark mode toggle button, placed on the same row as the User mode / Page mode toggle. Shows a crescent moon icon in light mode (selecting it switches to dark mode) and a sun icon in dark mode (selecting it switches to light mode)
* The selected theme is saved via `localStorage` and reapplied the next time Tengu is opened. If no saved preference exists yet, Tengu falls back to the browser's `prefers-color-scheme` setting, matching the previous automatic-only behaviour

### Changed

* Softened the light-mode dialogue background from pure white (`#fff`) to a less glaring off-white (`#faf9f6`)
* Replaced the dialogue's `@media (prefers-color-scheme: dark)` CSS block with an equivalent `.tng-theme-dark` class-based block, since dark mode is now driven by the `theme` state in `Tengu.js` rather than read directly from the media query at render time

## 2.47.0

### Added

* Added a mode badge ("👤 User mode" / "📄 Page mode") to the dialogue header, so the active mode stays visible at all times, including after scrolling past the mode toggle or mode notice further down the dialogue
* Added soft, low-contrast colours for each mode — lavender for user mode, sage green for page mode — applied consistently across the new header badge, the existing mode notice, and the active state of the mode toggle buttons

### Changed

* `updateModeNotice()` now also sets a mode-specific colour class (`tng-mode-notice-user` or `tng-mode-notice-page`) on the mode notice element, replacing the single shared blue colour used previously
* The active mode toggle button (`tng-mode-btn-active`) now also receives a mode-specific colour class (`tng-mode-btn-active-user` or `tng-mode-btn-active-page`) instead of a single shared blue background

## 2.46.1

### Fixed

* Fixed the dialogue's close behaviour (close button, clicking outside, Escape, and "Close and reload") reloading the literal current URL after operations completed. If that URL included `diff=`, `oldid=`, or `curid=` parameters referencing a revision or page that no longer existed after the operation (for example, a deleted diff), the reload showed the wiki's "this revision has been deleted" error instead of the page itself
* The dialogue's `onClose` handler now navigates to `mw.util.getUrl(mw.config.get("wgPageName"))` instead of calling `window.location.reload()`. This applies to every feature, not only page deletion, and in both user mode and page mode, since `wgPageName` reflects the actual page being viewed independently of Tengu's mode toggle

## 2.46.0

### Added

* Added `pageExists()`, a shared helper that checks whether a page currently exists, used before posting talk-page notifications

### Changed

* Notifications posted via `appendtext` (user warning, block, unblock, page protection, and page deletion notices) no longer prepend two blank lines when the target talk page does not yet exist. The two-line separator is now only added when the talk page already has content, so a freshly created talk page no longer starts with leading blank lines

## 2.45.2

### Fixed

* Fixed the global lock request line built by `buildSRGReportLine()` (Report to Steward requests/Global) missing a leading bullet (`*`) before `{{LockHide}}`, which was inconsistent with the bulleted format used by other report lines on that page

## 2.45.1

### Fixed

* Fixed pressing Enter at the "Confirm selected operations" stage re-triggering the Start button instead of confirming, which opened a second, overlapping confirmation dialogue
* Added explicit Enter (confirm) and Escape (cancel) key handling scoped to the confirmation dialogue, registered while it is open and removed once it closes

## 2.45.0

### Added

* Added a new **Report to Steward requests/Global** section (user mode only), letting a Tengu user file a global block request (IP targets) or a global lock request (registered account targets) directly on Meta-Wiki's Steward requests/Global page
* Added `SRG_REPORT_REASONS` to `Tengu-reasons.js`, split into `BLOCK` and `LOCK` quick-select reason sets, following the same English-only convention as `GLOBAL_SYSOPS_REPORT_REASONS` since Steward requests/Global is a global English venue
* Added an "Also request the username be hidden (lock and hide)" option, shown only for global lock requests
* Added `submitSRGReport()` and `foreignApiGet()` in `Tengu.js`, which fetch the current Steward requests/Global wikitext, check for an existing report referencing the same target, and insert the new report section above the relevant anchor heading rather than appending to the bottom of the page
* The section automatically switches between the global block reason set and the global lock reason set as the target field is edited, based on whether the target resolves to an IP address

### Notes

* Reporting multiple accounts in a single request (via `{{MultiLock}}` and the `{{Collapse top}}`/`{{Collapse bottom}}` wrapping used on the live page) is not implemented, since Tengu currently operates on one target at a time
* The `report` operation counter in the progress dialogue is shared between this feature and the existing Report to global sysops feature
* The section reuses the existing single target field rather than adding separate IP/username inputs, consistent with how the rest of Tengu handles targets

## 2.44.0

### Changed

* The edit summary used when submitting a report to Global sysops/Requests no longer reads "Reporting account for urgent attention" regardless of mode. It now reads "Reporting account for global sysops' attention" in user mode and "Reporting page for global sysops' attention" in page mode, since a page report is not necessarily urgent

### Added

* Split `GLOBAL_SYSOPS_REPORT_REASONS` in `Tengu-reasons.js` into separate `ACCOUNT` and `PAGE` reason sets, so account-report reasons and page-report reasons are never shown — or submitted — together
* Added "Bot or automated spam account" to the account-report reason set
* Added "Attack page", "Blatant copyright violation", "Cross-wiki spam", and "Hoax page" to the new page-report reason set
* Added `activeGSReasonChecks()`, returning the reason-checkbox set matching the current mode, used by both Start button validation and `buildGSReportLine()`

### Fixed

* Removed a duplicate definition of `submitGlobalSysopsReport()`. The second definition silently overrode the first at runtime, so this had no effect on behaviour, but left two identical copies of the function in the script

## 2.43.0

### Added

* Extended the **Report to global sysops** section to page mode, letting a Tengu user file an urgent cross-wiki report requesting deletion of, or attention to, a specific page rather than an account, on Meta-Wiki's Global sysops/Requests page
* Added a page-mode report line, opening with "Please delete" followed by a link to the target page, the wiki's site name and database name, and the selected reason

### Changed

* `applySpecialPageLocks()` now also locks the Report to global sysops section when the page-mode target is a special page, since special pages cannot be reported for deletion
* The Report to global sysops section is no longer locked by the user/page mode toggle; availability is now governed solely by wiki eligibility (`globalSysopsScopePromise`) and, in page mode, by whether the target is a special page

### Fixed

* Fixed the global sysops report line missing a full stop before the closing signature (`~~~~`) when the reason was built solely from the preset reason checkboxes with no free-text additional details

## 2.42.2

### Changed

* `globalSysopsScopePromise` now determines global sysops eligibility solely from `GS_INELIGIBLE_HOSTS`, resolving immediately instead of falling back to a CentralAuth `list=wikisets` lookup for wikis not on that list

### Removed

* Removed the `list=wikisets` API call previously used as a fallback eligibility check for wikis not listed in `GS_INELIGIBLE_HOSTS`

## 2.42.1

### Changed

* Added `GS_INELIGIBLE_HOSTS`, a static list of wikis known to fall outside the scope of the global sysops service, checked in `globalSysopsScopePromise` ahead of the CentralAuth `list=wikisets` lookup
* The Report to global sysops section is now locked immediately, without an API round trip, whenever the current wiki's hostname appears on this list

## 2.42.0

### Added

* Added a new **Report to global sysops** section (user mode only), letting a Tengu user without local admin rights file an urgent cross-wiki report on Meta-Wiki's Global sysops/Requests page
* Added `GLOBAL_SYSOPS_REPORT_REASONS` to `Tengu-reasons.js`: quick-select reasons (Vandalism, Spam, Long-term abuse (LTA), Cross-wiki vandalism, Page-move vandalism, Inappropriate username) plus a free-text additional-details field, with validation requiring at least one of the two
* Added an eligibility check using the CentralAuth `list=wikisets` API to determine whether the current wiki falls within the scope of the global sysops service, driving a new `applyGSStatusLock()`
* Added cross-wiki submission via `mw.ForeignApi`, authenticated through the user's existing SUL session, using `action=edit` with `appendtext` against `meta.wikimedia.org`
* Added a `report` counter to the progress dialogue's operation statistics

## 2.41.0

### Added

* Added an "Extended confirmed users" option to the Edit restriction and Move restriction drop-downs in the Page protection section
* Added a check via `siprop=restrictions` to determine whether the current wiki has the `extendedconfirmed` protection level configured

### Notes

* Extended confirmed is not configured on all wikis, so the option is omitted from the drop-downs entirely (rather than shown disabled) on wikis where it is unavailable
* Upload restriction and the recreation-protection level drop-downs are unaffected; this change applies only to Edit restriction and Move restriction

## 2.40.0

### Changed

* The "Also delete the talk page" and "Delete redirects to deleted page" options in the page deletion section now also apply to each subpage when "Delete subpages of deleted page" is enabled
* Updated both checkboxes' tooltips to describe the expanded scope

### Fixed

* Subpages removed via "Delete subpages of deleted page" previously left their talk pages and any redirects pointing to them untouched, even when the talk-page and redirect deletion options were enabled

### Notes

* No new checkboxes were added; the existing talk-page and redirect-deletion options now apply consistently to every page removed in the operation, including subpages
* This brings actual behaviour in line with the existing tooltip wording, which already described the options as applying to "each deleted page"

## 2.39.1

### Fixed

* Fixed the Revision deletion section remaining clickable in page mode when Tengu was opened directly on a page (outside the user or user talk namespace), instead of being locked as it is when switching modes via the toggle after the dialogue has already opened
* Added the missing `applyModeLock()` call for the Revision deletion section to the initial mode-lock block in `init()`, matching the lock already applied by `applyModeRestrictions()`

### Notes

* Revision deletion remains available only in user mode, consistent with Rollback, Block, Unblock, and User warning

## 2.39.0

### Added

* Added an **Upload restriction** drop-down to the Page protection section, positioned beneath **Move restriction**
* Added `isTargetFilePage()` and `updateUploadAvailability()`, which disable (without hiding) the new control whenever the target does not resolve to the File namespace
* Added submission of upload-level protection (`upload=`) alongside edit and move restrictions for page protection requests where the target is a file page

### Notes

* Upload restriction only applies to pages in the File namespace; outside it, the control is disabled but remains visible, consistent with how other namespace-specific controls are handled elsewhere in Tengu

## 2.38.0

### Fixed

* Fixed the rollback and undo fallback edit summaries always being generated in English regardless of wiki language. Indonesian-language wikis now receive "Mengembalikan suntingan" and "Mengembalikan suntingan oleh [username]" instead of "Revert edits" and "Reverting edits by [username]"

### Notes

* This only affects the fallback summary used when no custom rollback/undo reason is supplied. A user-supplied reason is unaffected, as it already passes through unchanged

## 2.37.0

### Changed

* Confirmation before execution now applies to every feature, not only page deletion and page protection. Pressing the Start button always opens a confirmation dialogue
* The confirmation dialogue now lists each enabled feature by name, so the user can verify their selections before any action runs
* Increased `.tng-section-body` max-height from 400px to 460px, and the user/page info display-section max-height from 320px to 360px, to reduce the number of sections that show an internal scrollbar

### Notes

* The confirmation dialogue title was changed from "Confirm dangerous operations" to "Confirm selected operations" to reflect its expanded scope

## 2.36.0

### Added

* Added `PROTECT_RECREATION_REASONS` to `Tengu-reasons.js`, providing five preset reasons for recreation-protection actions: repeated recreation, recreation contrary to community consensus, recreation of promotional or spam content, recreation of policy-ineligible content, and recreation of disruptive content
* Added a **Reason** field to the standalone **Protect against recreation** section
* Added a **Reason** field to the **Protect from recreation after deletion** option in the **Page deletion** section

### Changed

* The standalone recreation-protection action now submits the selected reason instead of a fixed English/Indonesian string
* The post-deletion recreation-protection action now submits its own reason instead of reusing the page deletion reason

### Notes

* Both new reason fields use the same filterable-select-plus-append pattern as the other reason fields in Tengu
* Packages do not currently set either new reason field; this matches the existing behaviour for the recreation-protection checkbox, level, and expiry controls

## 2.35.0

### Changed

* Merged the standalone account unblock action into the main Start button workflow, alongside Rollback, Block, Page deletion, Page undeletion, Page protection, and Revision deletion
* Replaced the free-text-only unblock reason field with a dropdown of preset unblock reasons (with support for a custom reason), matching the reason-selection pattern used elsewhere in the interface

### Added

* Added `UNBLOCK_REASONS` to `Tengu-reasons.js`, providing a set of preset unblock reasons grouped under Administrative, Appeal accepted, Block has served its purpose, Community or administrative review, Changed circumstances, Account security, and General
* Added an `unblock` counter to the progress dialogue's operation statistics

### Removed

* Removed the standalone "Unblock account" button and its dedicated progress dialogue
* Removed the now-unused `.tng-unblock-row` and `.tng-unblock-controls` styles from `Tengu.css`

### Fixed

* Fixed the Unblock section not being locked to user mode when Tengu was opened directly in page mode (it was previously only mode-locked when switching modes after the dialogue had already opened)

### Notes

* Unblock remains available only in user mode, and only when the target account has an active block, consistent with previous behaviour

## 2.34.1

### Fixed

* Fixed the chevron on the **Page undeletion** and **Protect against recreation** sections remaining visible and clickable when those features were unavailable, instead of being replaced by a padlock icon as with other locked sections
* Added `applyUndeleteStatusLock()` and `applyProtectRecreationStatusLock()`, mirroring the existing `applyUnblockStatusLock()` pattern, so both sections now collapse, hide their chevron, and display a padlock with an explanatory tooltip whenever they are locked due to target status (no target specified, user mode, deletion history still loading, no deletion history found, or the target page existing)

### Improved

* Improved consistency of section-lock indicators across the interface

## 2.34.0

### Added

* Added a new **Page undeletion** section, positioned immediately after **Page deletion**
* Added a deletion-log check that determines whether the target page has been previously deleted, driving the section's availability
* Added a dedicated status note explaining why page undeletion is unavailable for the current target (no deletion history, missing rights, or special page)
* Added `UNDELETE_REASONS` to `Tengu-reasons.js`, providing a set of restoration reasons (deletion error, community discussion outcome, review outcome, underlying issues resolved, copyright clarified, technical reasons, sufficient new content, deletion rationale no longer applies, restoration request approved)
* Added an `undelete` right check, locking the section for users without the right on this wiki

### Changed

* Extended the progress dialogue's summary line and final status to include an undeleted-page counter

### Notes

* Page undeletion is available only in page mode, since the action restores a single specific page
* The deletion-log check and the page undeletion availability check share a single API request

## 2.33.5

### Added

* Added a progress dialogue for the unblock action, displaying a timestamped log of each step in the unblock workflow, including notification delivery when applicable

### Changed

* Replaced the inline error notification previously shown when an unblock failed with a dedicated log entry in the progress dialogue

### Improved

* Improved transparency of the unblock process by surfacing individual workflow steps in real time rather than running them silently in the background

## 2.33.4

### Fixed

* Fixed the "Unblock account" button having no click handler, meaning it performed no action when clicked
* Added the missing `action=unblock` API call, wired to the existing reason field and "Send unblock notification to user talk page" checkbox

### Added

* Added an account unblock notification, posted to the target's talk page when the notify checkbox is ticked, mirroring the wording style used for block, deletion, and protection notices

## 2.33.3

### Fixed

* Fixed the Unblock section becoming permanently stuck on "Unavailable: block status is still loading" after the block status had already been resolved
* Fixed `applyUnblockStatusLock()` returning early without updating the displayed lock reason whenever the section was already status-locked, which prevented the tooltip from refreshing to reflect the account's actual block status or the user's actual permissions

### Improved

* Improved accuracy of the Unblock section's lock message so it always reflects the most recently resolved reason (no target specified, no block right, account not blocked, or block status confirmed)

## 2.33.2

### Added

* Added a `hasBlockRights` permission check to determine whether the current user possesses the `block` right
* Added a dedicated lock message for users without block permissions:
  * `you do not have the block right on this wiki`

### Changed

* Updated Unblock section initialisation to fetch:
  * Target block information (`apiGet`)
  * Current user permissions (`rightsPromise`)
  concurrently using `Promise.all()`.
* Updated lock-state handling to display permission-specific messages when access is restricted due to missing rights
* Refined the lock evaluation sequence so permission checks are incorporated into the Unblock section's availability logic

### Fixed

* Fixed unnecessary delays caused by sequential retrieval of block status and user rights
* Fixed generic lock behaviour that did not clearly distinguish permission-related restrictions from other lock conditions
* Fixed transient UI states that could briefly display incorrect lock messages before permission checks completed

### Improved

* Improved interface responsiveness by resolving block-status and rights information simultaneously
* Improved user feedback through more specific lock explanations
* Improved consistency between permission evaluation and section availability
* Reduced UI flicker by preserving the loading state until all required data has been resolved

## 2.33.1

### Added

* Added an explicit `applyUnblockStatusLock(false)` call when an active block is detected, allowing the Unblock section to unlock correctly
* Added a Flexbox layout container for the unblock controls

### Changed

* Updated the Unblock section layout so the **Unblock reason** field and **Unblock account** button appear on a single horizontal row
* Applied an 80/20 layout ratio using Flexbox (`flex: 8` / `flex: 2`) to improve spacing and alignment

### Fixed

* Fixed an initialisation race condition caused by a hardcoded `applyUnblockStatusLock(true)` call that could override actual block-status information during startup
* Fixed an issue where the Unblock section remained locked even when the target user was actively blocked
* Fixed a permissions-related bug caused by missing curly braces around the `hasBlock` conditional
* Fixed unintended unconditional locking of the Unblock section for users regardless of their actual permissions
* Fixed inconsistent synchronisation between live block status and section lock state

### Removed

* Removed the unconditional startup call to `applyUnblockStatusLock(true)` that forced the section into a locked state

### Improved

* Improved reliability of Unblock section state management
* Improved consistency between permission checks, block detection, and UI locking behaviour
* Improved responsiveness of the interface when switching between blocked and unblocked targets
* Improved usability through a cleaner and more compact unblock-control layout

## 2.33.0

### Added

* Added a standalone **Unblock** section positioned immediately after the **Block** section
* Added padlock-based section locking for the Unblock workflow, matching the behaviour used elsewhere in the interface

### Changed

* Moved the unblock workflow out of the Block section into its own dedicated section
* Updated visibility and availability handling so the entire Unblock section is locked and collapsed when unavailable, rather than displaying disabled controls
* Applied the same section-level locking model used by Block and Revision deletion
* Extended lock management to evaluate:
  * User rights
  * Current interface mode
  * Live block status of the target user

### Fixed

* Removed the previous behaviour where unblock controls remained visible but greyed out when the target was not blocked
* Improved consistency between the Unblock workflow and other lockable administrative sections

### Removed

* Unblock controls embedded within the Block section
* The permanently visible disabled unblock row used when no active block was present

### Improved

* Improved interface organisation by separating blocking and unblocking into distinct workflows
* Reduced visual clutter when unblocking is unavailable
* Improved consistency of lock indicators and section behaviour across administrative tools
* Made availability rules easier to understand through the use of section-level locking and padlock indicators

## 2.32.0

### Added

* Added a new standalone **Protect against recreation** section
* Positioned the new section immediately after **Page protection**

### Changed

* Moved recreation-protection functionality out of the Page protection section
* Updated the target-change workflow to manage the standalone recreation-protection section through `secProtectRecreation` and `hdrProtectRecreation`
* Updated `applySpecialPageLocks()` to lock and unlock the new section alongside Page protection when special pages are targeted

### Fixed

* Reduced ambiguity between standard page protection and recreation protection workflows
* Improved control handling by removing dependencies on the former `wrapProtectRecreation` container

### Removed

* Removed the **Protect against recreation** checkbox from the Page protection section's `checksProtect` group
* Removed the associated recreation-protection level and expiry controls from the Page protection section

### Improved

* Improved interface organisation by separating two distinct protection actions into dedicated sections
* Reduced user confusion when selecting protection options
* Made recreation protection more visible and easier to understand as an independent administrative action
* Improved maintainability by isolating recreation-protection controls from standard page-protection controls

## 2.31.2

### Added

* Added an **Unblock account** button to the existing Block section
* Added an optional unblock reason field
* Added a **Send unblock notification to user talk page** checkbox, enabled by default
* Added support for posting unblock notifications to the user's talk page after a successful unblock
* Added bilingual unblock notification messages with:
  * Indonesian (`id`)
  * English (`en-GB`)

### Changed

* Extended the Block section to support both blocking and unblocking workflows
* The unblock interface is now displayed only when an active block is detected for the target account
* After a successful unblock, the interface automatically re-checks the user's current block status and updates the available controls

### Improved

* Improved administrator workflow by allowing unblocks to be performed directly from the Block section
* Reduced the need to switch between separate administrative interfaces for blocking and unblocking actions
* Improved user feedback by automatically hiding unblock controls once a block has been confirmed as lifted
* Improved interface responsiveness through live block-status verification

## 2.30.1

### Added

* Expanded the existing criterion to explicitly cover musical recordings in addition to general subjects

### Changed

* Merged separate references to "subject" and "recording" into the unified wording "subject or recording"
* Updated the criterion label to include musical recordings within the existing category
* Replaced two related criteria with a single consolidated entry

### Fixed

* Removed overlap between criteria that addressed substantially similar cases
* Reduced ambiguity by defining a single criterion that applies consistently across both contexts

### Removed

* A separate criterion that previously applied only to musical recordings
* Duplicate wording and categorisation covering similar eligibility conditions

### Improved

* Simplified criterion selection and maintenance
* Reduced duplication within the criteria list
* Improved consistency by applying the same standard to both general subjects and musical recordings

## 2.30.0

### Added

* Added a new **Delete redirects to deleted page** option, enabled by default
  * Deletes redirects pointing to each page selected for deletion
  * Processes redirects individually after the main page deletion workflow
* Added a new **Delete subpages of deleted page** option, enabled by default
  * Deletes subpages associated with each deleted page
  * Processes subpages individually after the main page deletion workflow
* Added two new configuration keys:
  * `massdelRedirects`
  * `massdelSubpages`

### Changed

* Updated the dialog header title from its previous wording to:
  * `Tengu — your all-in-one moderation tools`
* Extended the deletion workflow to support optional deletion of related redirects and subpages
* Integrated the new options into the deletion interface immediately after the **Also delete the talk page** setting

### Improved

* Improved deletion workflow efficiency by allowing related pages to be removed as part of a single operation
* Reduced manual cleanup work following page deletions
* Improved handling of page hierarchies and redirect networks associated with deleted content
* Expanded administrative automation while preserving individual deletion actions for each affected page

## 2.29.3

### Added

* Added a new `buildNoticeWithTemplates()` helper function for safely inserting wiki template syntax into generated notice text
* Added placeholder replacement support for dynamically generated language templates

### Changed

* Replaced direct template syntax usage with placeholder tokens and post-processing replacement
* Updated language-related notices to generate `{{#language:...}}` templates only in the final output string
* Replaced placeholder markers
* Updated the following notice templates

### Fixed

* Fixed an issue where `{{#language:...}}` syntax embedded directly in JavaScript strings was not being parsed as intended
* Fixed incorrect output where language names could appear as literal template text instead of rendered language names
* Fixed problems caused by wrapping language parser functions in `<nowiki>`, which prevented template evaluation

### Removed

* Direct use of `<nowiki>{{#language:...}}</nowiki>` in generated notice content
* Hardcoded parser-function syntax embedded directly within affected notice strings

### Improved

* Improved reliability of language-name rendering across language-related notices
* Improved readability of notice source code through the use of descriptive placeholders
* Improved maintainability by centralising template substitution logic in a reusable helper function
* Reduced the likelihood of future parser-function escaping and formatting issues

## 2.29.2

### Changed

* Updated `makeFilteredSelect()` to wrap its `<select>` element using `wrapSelect()` before appending it to the filtered-select container
* Restored the standard select-wrapper structure used throughout the interface

### Fixed

* Fixed missing dropdown chevrons in filterable select controls
* Fixed an issue where `makeFilteredSelect()` bypassed `wrapSelect()` and appended the `<select>` element directly to the wrapper container
* Restored compatibility with existing CSS that renders the chevron through the `.tng-select-wrap::after` pseudo-element

### Improved

* Improved visual consistency between filterable selects and standard select controls
* Restored expected dropdown appearance without altering filtering behaviour
* Preserved all existing filter functionality while correcting the UI structure

## 2.29.1

### Added

* Added the `notcommunicatingwikilang` notice template
* Added the `notcommunicatingenglish` notice template
* Added the `notcommunicatingindonesian` notice template
* Added the `articlenotwikilang` notice template

### Changed

* Revised the structure of language-related notices to use a two-paragraph format
* Notices now separate:
  * The explanation of the issue and its consequences
  * The recommended next steps for the contributor

### Improved

* Improved guidance for contributors who accidentally post messages or create content in the wrong language
* Improved clarity by separating problem descriptions from recommended actions
* Reduced ambiguity around expected communication languages on multilingual Wikimedia projects
* Improved localisation flexibility through runtime language detection where appropriate

## 2.29.0

### Added

* Added a new `makeFilteredSelect()` helper for creating filterable select controls
* Added filtering support to the selectors
* Added new `.tng-filtered-select` CSS styles in `Tengu.css`

### Changed

* Existing reason and message dropdowns are now wrapped with the new filterable-select component
* Large administrative reason lists can now be searched and narrowed directly within the interface

### Improved

* Improved usability when working with extensive reason and warning libraries
* Reduced scrolling and manual searching through long dropdown menus
* Improved discoverability of warning templates and administrative reasons
* Provided a more consistent selection experience across administrative workflows

## 2.28.0

### Added

* Added automatic fallback to **Undo** when user rights are resolved and the user does not possess the `rollback` permission
* Added rights-aware handling during package application to preserve the appropriate rollback/undo state

### Changed

* `applyPackage()` no longer unconditionally resets `chkUndo` to `false`
* Package application now checks `resolvedRights` before determining the state of the Undo option
* Updated the checkbox label:
  * From: `Use undo feature (alternative without rollback rights)`
  * To: `Use undo instead of rollback`

### Fixed

* Fixed an issue where applying a package could override the correct Undo state for users without rollback rights
* Fixed inconsistent behaviour between rights resolution and package selection workflows

### Removed

* Removed unconditional resetting of the Undo checkbox during package application

### Improved

* Improved usability for users without rollback rights by automatically selecting the appropriate action
* Improved consistency between interface state and available user permissions
* Reduced manual configuration steps when performing rollback-related actions
* Simplified the Undo option label for greater clarity

## 2.27.0

### Added

* Added an explicit `pageIsMissing` handling branch to re-enable recreation-protection controls when the target page does not exist
* Added immediate UI state updates based on page existence before asynchronous page checks complete

### Changed

* The recreation-protection checkbox is now disabled from the moment the dialogue opens when the target page exists
* Changing the target to an existing page now disables the recreation-protection option immediately, rather than waiting for asynchronous API responses
* Recreation-protection controls are now enabled and disabled together as a coordinated group based on page existence status

### Fixed

* Fixed a race condition where the recreation-protection checkbox could remain temporarily enabled while page existence checks were still in progress
* Fixed inconsistent control states when switching between existing and non-existent pages
* Fixed a UI timing issue that allowed recreation-protection controls to appear available before page status had been confirmed

### Improved

* Improved interface responsiveness by updating control availability on the first render
* Improved consistency between displayed controls and actual page state
* Reduced the possibility of user confusion caused by temporary asynchronous state mismatches
* Further reinforced existing safeguards that prevent recreation protection from being applied to existing pages

## 2.26.6

### Added

* Added the following warning templates to the **Single warn** group

### Changed

* Expanded the scope of the **Single warn** category to cover a broader range of behavioural, editorial, and policy-enforcement scenarios
* Added specialised warning variants for situations requiring different levels of severity or audience-appropriate wording, including newcomer-focused and stronger enforcement variants

### Improved

* Improved coverage of common administrator and patroller workflows
* Reduced the need for manually written warnings in specialised policy areas
* Improved consistency of user messaging across copyright, conduct, username, and account-related issues
* Expanded support for educational warnings that explain policies while remaining action-oriented

## 2.26.5

### Added

* Added a new **Single notices** group to `Tengu-warn.js`
* Added **54 notice templates** covering informational and one-time communication scenarios
* Added support for a softer **Notice** / **Pemberitahuan** heading convention for these templates
* Added notice variants for situations

### Changed

* Introduced a distinction between escalating warnings and non-escalating notices within the warning library
* Single-notice templates now use **Notice** / **Pemberitahuan** headings rather than **Warning** / **Peringatan** headings
* Appeal text in notice templates now refers to the possibility that a **notice** was issued in error, rather than a **warning**

### Improved

* Expanded the range of communication tools available to administrators and patrollers
* Improved flexibility by providing templates for situations that do not warrant formal warnings
* Encouraged a more proportionate and constructive approach to user communication
* Reduced the need to adapt warning templates for routine informational messages
* Improved consistency with the existing `testediting` notice style

## 2.26.4

### Added

* Added the **Promotions and spam** warning group with notices
* Added the **Behaviour towards other editors** warning group with notices
* Added the **Removal of deletion tags** warning group with notices
* Added the **Other warnings** group with notices

### Changed

* Extended `WARN_MESSAGES` with four additional warning categories
* Reordered warning groups to incorporate the new categories while preserving the existing grouped structure

### Improved

* Expanded coverage of common moderation and maintenance scenarios
* Improved guidance for deletion-related disputes by directing users to the appropriate discussion processes instead of simply discouraging tag removal
* Improved support for editor-conduct issues and community interaction policies
* Improved consistency across all warning templates through shared formatting and localisation behaviour
* Reduced the need for manual warning drafting in less common administrative situations

## 2.26.3

### Added

* Added a `finalSentence()` helper to generate a language-appropriate editing-restriction notice
* Added support for final warning notices across all warning templates
* Added a "This is a final warning" checkbox to the User warning section
* Added a descriptive tooltip explaining the purpose of the final warning option
* Added "Final" wording to warning section headings when a warning is marked as final (for example, `== Final warning: vandalism ==`)

### Changed

* All four `buildNotice()` functions now accept a third `isFinal` parameter
* `buildWarnNotice()` now reads the state of `chkWarnFinal` and passes it to the selected warning template
* Final warnings include an additional editing-restriction sentence within the notice body
* The additional final warning text is inserted before the appeal section and signature

### Improved

* Improved escalation workflows by allowing administrators and patrollers to distinguish final warnings from standard warnings
* Improved warning clarity by explicitly informing recipients that further disruptive behaviour may result in editing restrictions
* Improved consistency across warning templates by implementing final warning support through a shared mechanism
* Maintained localisation support for both English and Indonesian warning notices

## 2.26.2

### Added

* Added `chkWarn` to the Start button eligibility checks within `updateStartBtn()`
* Added a `change` event listener for `chkWarn`, matching the behaviour of other action section checkboxes

### Changed

* The Start button now recognises the User warning section as a valid standalone action
* Button state updates immediately when the User warning section is enabled or disabled

### Fixed

* Fixed an issue where selecting only the User warning section did not enable the Start button
* Fixed delayed Start button updates when toggling the User warning checkbox

### Improved

* Improved consistency between the User warning section and other action modules
* Improved responsiveness of the interface by updating the Start button state immediately after warning section changes
* Reduced confusion when performing warning-only workflows

## 2.26.1

### Changed

* Warning interface labels are now consistently displayed in en-GB regardless of wiki language
* The "Select a message" placeholder in the warning template selector is now hard-coded to en-GB
* Indonesian localisation is now applied only to the warning notice content posted to user talk pages, not to interface controls
* The `withExtra()` helper now inserts optional additional-information text immediately before the closing signature

### Fixed

* Fixed incorrect localisation of warning interface elements, including warning group names and warning type labels
* Fixed placement of additional-information text that previously appeared after the user's signature
* Ensured that posted warning notices always end with the signature (`~~~~`) as intended

### Removed

* Unnecessary `useIndonesian` conditional logic from warning interface labels
* Localisation handling for warning UI elements that should remain language-neutral

### Improved

* Improved consistency between Tengu's interface language and content localisation strategy
* Improved readability and formatting of warning notices containing supplementary information
* Ensured signatures remain the final element of every warning message

### Notes

* Interface-facing labels in the warning module now remain in en-GB across all wikis
* Localisation continues to apply to the warning notice wikitext itself, allowing messages to be posted in Indonesian where appropriate
* The additional-information field is now inserted before the signature to preserve standard talk-page message formatting

## 2.26.0

### Added

* Added a new `Tengu-warn.js` module providing a dedicated warning-message library
* Added the `window.TenguWarn.get(useIndonesian)` interface, following the same pattern as `Tengu-reasons.js`
* Added a new **User warning** (⚠️) section to the Tengu dialogue in user mode
* Added a grouped warning-template selector containing a **Common warnings** category with:
  * Vandalism
  * Disruptive editing
  * Editing tests
  * Removal of content / blanking
* Added support for English and Indonesian variants of all warning templates
* Added an optional free-text field for supplementary information within warning messages
* Added automated posting of selected warning notices to user talk pages

### Changed

* Integrated `Tengu-warn.js` into the script loading sequence
* Extended reason and message initialisation to unpack `WARN_MESSAGES` alongside existing reason sets
* Updated the execution workflow to support warning delivery through the main `work()` process

### Improved

* Improved moderator workflow by providing ready-to-use warning templates directly within Tengu
* Improved localisation support by centralising warning messages in a dedicated module
* Improved consistency with existing notification workflows used for block and protection notices
* Reduced the need for manual warning composition when responding to common editing issues

### Notes

* The **User warning** section is available only in user mode
* The section is automatically disabled whenever page mode is active, alongside Block, Rollback, and Revision deletion controls
* Warning notices are posted using the same `appendtext` and `apiPost` workflow already used by block and protection notifications
* The warning library is self-contained and can be expanded with additional warning groups and templates in future releases

## 2.25.0

### Added

* Added `relevantUserName` and `isIPRange` variables to support IP range detection.
* Added a dedicated IP range handling branch that:
  * Disables the user mode button when the target is an IP range.
  * Displays a tooltip explaining why the option is unavailable.

### Changed

* Updated the default `tenguMode` selection logic to exclude IP ranges from user mode
* IP ranges are now treated separately from standard user accounts and individual IP addresses when determining available workflows

### Fixed

* Prevented user mode from being selected for IP ranges, where the workflow is not supported
* Eliminated cases where unsupported actions could be presented for IP range targets

### Improved

* Improved interface behaviour when viewing contributions or logs associated with IP ranges
* Provided clearer feedback by disabling unavailable options instead of allowing invalid selections
* Reduced user confusion through contextual tooltip messaging

### Notes

* User mode remains available for registered accounts and individual IP addresses where supported
* IP ranges are now detected explicitly and handled through dedicated interface logic

## 2.24.0

### Added

* Added an Indonesian-language edit summary for automated edits that remove links to deleted pages:
  * `Menghapus pranala ke halaman yang sudah dihapus: `

### Changed

* The edit summary used when removing links to deleted pages now respects the `useIndonesian` setting
* Indonesian-language wikis receive a localised edit summary, while other wikis continue to use the existing English version:
  * `Removing links to deleted page: `

### Fixed

* Resolved an inconsistency where this maintenance edit summary was always displayed in English, regardless of the selected interface language

### Improved

* Improved localisation consistency across automated editing workflows
* Provided a more natural experience for Indonesian-speaking administrators and patrollers
* Aligned link-cleanup edit summaries with other recently localised administrative actions

## 2.23.0

### Added

* Added the `updateClearTalkState` function to manage the state of the "Clear user talk page before sending notification" option
* Automatic state updates when:
  * The block expiry dropdown is changed
  * A block package is applied via `applyPackage`
  * Existing block settings are loaded via `applyActiveBlockSettings`

### Changed

* The "Clear user talk page before sending notification" checkbox is now only available for indefinite blocks
* When the selected block expiry is not indefinite, the checkbox is automatically:
  * Disabled
  * Unchecked
  * Displayed in a greyed-out state

### Fixed

* Prevented the talk page clearing option from remaining available when a finite block duration is selected

### Improved

* Improved consistency between block duration settings and notification options
* Reduced the likelihood of unintentionally clearing a user's talk page for temporary blocks
* Ensured the interface updates correctly when expiry values are changed manually, through packages, or through active block pre-filling

## 2.22.0

### Added

* Localised talk page deletion edit summaries based on the `useIndonesian` setting
* Indonesian-language wikis now use the edit summary

### Changed

* The talk page deletion workflow now generates edit summaries in the user's configured interface language where applicable

### Fixed

* Resolved an inconsistency where the talk page deletion edit summary was always displayed in English, even on Indonesian-language wikis
* Improved localisation consistency within deletion-related workflows
* Provided a more native experience for Indonesian-speaking administrators

## 2.21.0

### Added

* Converted all eight RevisionDelete reasons to structured `{value, label}` objects in `Tengu-reasons.js`
* Added localisation support for RevisionDelete reason values through the `v()` helper, allowing Indonesian-language wikis to display translated reason values
* Expanded administrative reason descriptions to provide clearer explanations of why an action is being taken

### Changed

* RevisionDelete reasons now follow the same structure as all other reason sets used by Tengu
* Administrative reason wording throughout the interface has been revised from short labels to concise explanatory descriptions
* Reason text now focuses on the condition of the page, file, revision, or conduct requiring administrative action, rather than on individuals
* Terminology has been aligned with established Wikimedia conventions and translation practices
* Indonesian translations have been rewritten to read more naturally and consistently

### Fixed

* Resolved inconsistency between RevisionDelete reasons and other administrative reason sets
* Removed duplicated maintenance of RevisionDelete reason definitions across multiple files
* Improved clarity of administrative action reasons, particularly for newer contributors

### Removed

* Legacy `revisiondelete` fallback definitions from `Tengu.js`
* The reasons fallback object, whose only remaining content was the RevisionDelete reason set
* Inline `.map()` transformation logic previously used when building the RevisionDelete reason selector

### Improved

* Simplified reason management by centralising RevisionDelete definitions in a single source
* Simplified the `makeSelect` implementation, as `REVDEL_REASONS` is already provided in `{value, label}` format
* Reduced wording that could appear accusatory or judgemental
* Added contextual information where administrative processes benefit from additional explanation
* Improved consistency across deletion, protection, blocking, redirect, and RevisionDelete workflows
* Made administrative reasons easier to understand while remaining formal and specific enough for administrative use

### Notes

* RevisionDelete reasons are now sourced exclusively from `REVDEL_REASONS`
* The `v()` helper provides localised values while maintaining a consistent structure across all reason sets
* Administrative reasons now generally favour explanatory descriptions over brief issue labels, making them more accessible to newer contributors

## 2.20.2

### Changed

* Block type detection now checks the `blockpartial` property returned by the API instead of inspecting `blockflags`
* Simplified the block type derivation logic into a single direct check

### Fixed

* Fixed incorrect detection of partial blocks
* Fixed an issue where block scope could be misidentified because `blockflags` does not contain partial block information

### Removed

* Previous logic that searched for a `"partial"` token within `blockflags`
* Redundant `blockFlags`/`blockType` derivation steps

### Improved

* Improved accuracy of block status reporting
* Aligned block type detection with the MediaWiki API's actual data model
* Reduced complexity in the block scope detection code

### Notes

* `blockflags` only contains block effect flags such as `nocreate` and `noemail`
* Partial blocks are indicated by the `blockpartial` property on the user object returned by the API

## 2.20.1

### Added

* Block status notices now display the scope of the active block:
  * `Currently blocked (full)`
  * `Currently blocked (partial)`

### Changed

* The blocking section now includes block type information alongside existing block details such as administrator, expiry, and reason
* Block scope is determined from the `blockflags` field returned by the existing `blockinfo` query

### Fixed

* Resolved the lack of visibility into whether an active block was full or partial without checking the block log

### Improved

* Improved situational awareness when reviewing active blocks
* Reduced the need to inspect block logs to determine block scope
* Reused existing API response data without introducing additional API requests

## 2.20.0

### Added

* Edit summary wording now reflects whether notification text was replaced or appended

### Changed

* Consolidated notification workflow into a single edit operation
* Replaced separate `clear` and `notify` edits with a unified `notify` action that either replaces or appends content
* Replaced the use of two distinct edit summaries with a single `notifySummaryBlock` summary
* Notification text now follows a consistent behavior:
  * Uses `appendtext` when appending content
  * Uses `text` when replacing existing content

### Fixed

* Removed duplicate edit summary generation for notification actions
* Eliminated redundant log entries created during notification processing

### Removed

* Secondary notification edit summary
* Duplicate notification log entry

### Improved

* Reduced the number of edits required for notification actions from two to one
* Simplified logging output while preserving action context
* Improved maintainability of notification-related code paths

## v2.19.0

### Added
- Added a new block-section checkbox: **"Clear user talk page before sending notification (indefinite blocks only)"**
- Added the `clearTalkPageBeforeNotify` configuration property to track the state of the new option.
- Added support for automatically clearing a user's talk page before posting a block notification when the relevant conditions are met

### Changed
- Updated the block notification workflow to optionally clear the target user's talk page before posting a notification
- Updated notification handling so talk-page clearing occurs only when:
  - The block is indefinite or permanent,
  - Block notifications are enabled, and
  - The new talk-page clearing option is enabled
- Updated block notification processing to post the notification to the newly cleared talk page when the feature is active
- Increased the `.tng-log-box` font size from **0.9em** to **1em**

### Fixed
- Improved handling of indefinitely blocked users by preventing new block notices from being appended to pages containing outdated discussions and notices

### Improved
- Improved readability of indefinitely blocked users' talk pages by providing a clean destination for new block notifications
- Improved moderator workflow by automating talk-page cleanup before posting permanent block notices
- Improved consistency of long-term block notices by ensuring they appear prominently on the user's talk page
- Improved interface consistency by using en-GB sentence case for all new labels and messages
- Improved readability of log output within the progress dialogue
- Improved accessibility by displaying log entries at the standard interface font size
- Improved visibility of operation results, warnings, and errors during long-running actions

### Notes
- The feature applies only to indefinite or permanent blocks
- No talk-page clearing occurs for finite-duration blocks
- If block notifications are disabled, the talk-page clearing feature is not triggered
- When enabled, the user's talk page is cleared before the block notification is posted
- Existing block logic, notification formatting, and localisation behaviour remain unchanged
- The log font-size change affects only the appearance of the log panel and does not alter logging behaviour, message content, or processing logic

## v2.18.1

### Changed

* Increased the `.tng-section-body` `max-height` value from **250px** to **450px**

### Fixed

* Reduced unnecessary scrolling within individual feature sections by allowing more content to remain visible before overflow handling is required

### Improved

* Improved usability by displaying more content within each section before a scrollbar appears
* Improved visibility of controls and options in larger sections such as blocking, rollback, deletion, and protection
* Improved workflow efficiency by reducing the need to scroll within section containers
* Improved use of available vertical space within the dialogue

## v2.18.0

### Added

* Added a **"Send notification"** checkbox to the block section, enabled by default
* Added a **"Send notification"** checkbox to the page deletion section, enabled by default
* Added a **"Send notification"** checkbox to the page protection section, enabled by default
* Added `notifyBlock`, `notifyDelete`, and `notifyProtect` configuration fields to store notification preferences for each action type
* Added notification gating logic for block, deletion, and protection workflows based on the corresponding configuration flags
* Added self-notification suppression for deletion notifications when the page creator and page deleter are the same user

### Changed

* Updated block notification dispatch to run only when:
  * At least one block action succeeded, and
  * `config.notifyBlock` is enabled.
* Updated user-mode deletion notifications to run only when:
  * Mass deletion is enabled,
  * User mode is active,
  * At least one page was successfully deleted, and
  * `config.notifyDelete` is enabled.
* Updated page-mode deletion notifications to run only when:
  * Mass deletion is enabled,
  * Page mode is active,
  * At least one creator entry exists in `creatorMap`, and
  * `config.notifyDelete` is enabled
* Updated protection notification dispatch for both immediate and deferred protection workflows to respect `config.notifyProtect`
* Updated deletion notification handling to avoid sending notifications when the creator and deleter are the same user

### Fixed

* Fixed insufficient spacing above recreation protection controls caused by `.tng-recreation-group` being a child of `.tng-checks` rather than `.tng-section-body`
* Fixed the recreation protection layout by adding `margin-top: 6px` to `.tng-recreation-group`
* Fixed unnecessary deletion notifications in self-created/self-deleted scenarios

### Improved

* Improved user control over notification delivery by allowing notifications to be enabled or disabled independently for block, deletion, and protection actions
* Improved workflow flexibility for moderators who do not wish to leave automated notices
* Improved interface spacing and visual separation around recreation protection controls
* Improved notification relevance by suppressing notifications that would otherwise be sent to the same user responsible for creating and deleting the page
* Improved consistency by applying notification controls across all major action workflows

### Notes

* All notification checkboxes are enabled by default to preserve existing behaviour for most users
* Disabling a notification checkbox prevents only the associated notification from being posted; the underlying block, deletion, or protection action is unaffected
* Protection notification gating applies to both immediate and deferred notification queues
* Self-notification suppression applies only when the page creator and page deleter are the same account
* The recreation protection spacing adjustment affects presentation only and does not alter protection behaviour

## v2.17.4

### Added

* Added `recreationDropdownRow`, a dedicated container for recreation protection configuration controls
* Added inline labels for recreation protection settings:
  * **"Protection level:"** before the protection level selector
  * **"Expiry:"** before the expiry selector and custom expiry controls
* Added `.tng-inline-label` styling to provide consistent label appearance alongside existing form controls
* Added dark mode support for `.tng-inline-label`

### Changed

* Updated `wrapRecreationRow` from a horizontal layout to a column-based container
* Updated the recreation protection layout so the checkbox occupies its own row above the configuration controls
* Updated the recreation protection controls to appear directly beneath the checkbox in a dedicated row
* Updated the recreation protection controls layout to use labelled fields instead of unlabeled dropdowns
* Updated the recreation protection controls row to support wrapping on narrow viewports
* Updated width handling so the recreation protection group occupies the full available width within the deletion section
* Updated field sizing behaviour so selectors expand to fill available horizontal space
* Updated custom expiry layout so the expiry selector and custom input share the available width when **"Other"** is selected

### Fixed

* Fixed layout issues where recreation protection dropdowns could appear on the same line as the checkbox on narrow viewports
* Fixed alignment consistency between recreation protection controls and the rest of the deletion interface
* Fixed responsive behaviour so recreation protection controls wrap in a predictable and readable manner on smaller screens

### Removed

* Removed `flex-wrap: wrap` behaviour from the outer recreation protection container
* Removed the possibility of recreation protection dropdowns flowing onto the checkbox row

### Improved

* Improved form clarity by adding explicit labels to recreation protection settings
* Improved visual consistency with existing `.tng-row` form layouts
* Improved responsiveness by allowing the dropdown row to wrap independently when space is limited
* Improved space utilisation by allowing controls to expand to the available width
* Improved readability and discoverability of recreation protection options

### Notes

* The custom expiry input introduced previously remains unchanged
* When **"Other"** is selected, the expiry selector and custom expiry input continue to share the available horizontal space evenly
* This release affects only the layout, styling, and presentation of recreation protection controls; no changes were made to protection logic, expiry handling, or API behaviour

## v2.17.1

### Changed

* Updated the recreation protection controls layout from a hidden vertical container to a single inline row
* Replaced `wrapRecreationControls` with `wrapRecreationRow`, which contains:
  * The recreation protection checkbox
  * The protection level selector
  * The protection expiry selector
* Updated control visibility behaviour to use input enable/disable states rather than showing and hiding an entire container
* Updated the recreation protection change listener to toggle the `disabled` state of the associated controls instead of modifying layout visibility
* Updated the deletion section assembly to append a single combined recreation protection row

### Fixed

* Improved initial control state by ensuring:
  * `selPagedelProtectRecreationLevel`
  * `selPagedelProtectRecreationExpiry`
  * `inputPagedelProtectRecreationExpiry`
  are disabled when the dialogue is first opened
* Fixed recreation protection controls so they remain visible and discoverable even when the feature is not enabled

### Removed

* Removed the hidden indented `wrapRecreationControls` container previously used to show and hide recreation protection options
* Removed display-based toggling logic for recreation protection controls

### Improved

* Improved usability by keeping recreation protection options visible at all times
* Improved discoverability by presenting all recreation protection settings alongside the enabling checkbox
* Improved interface consistency through a compact single-row layout
* Improved accessibility by using disabled controls to indicate availability instead of hiding configuration options
* Improved maintainability by simplifying the recreation protection UI structure and event handling logic

### Notes

* Recreation protection controls are now always visible but remain disabled until the recreation protection checkbox is enabled
* No functional changes were made to recreation protection behaviour, expiry handling, API requests, or configuration processing
* This release focuses exclusively on user interface layout and control-state management

## v2.17.0

### Added

* Added a recreation protection expiry selector to the deletion section
* Added support for custom recreation protection expiries through an **"Other"** option and accompanying text input
* Added `massdelProtectRecreationExpiry` configuration support for recreation protection actions
* Added a dedicated recreation protection controls container (`wrapRecreationControls`) that groups all recreation protection settings in a single interface block

### Changed

* Replaced the standalone recreation protection level wrapper with a unified controls container containing:
  * Protection level selection
  * Protection expiry selection
  * Custom expiry input (when applicable)
* Updated the recreation protection interface to use a vertical flex layout consistent with the main protection section
* Updated recreation protection configuration handling to pass an expiry value to the `action=protect` API request
* Updated custom expiry handling so the text input is shown only when **"Other"** is selected
* Updated recreation protection workflows to support finite expiry periods in addition to indefinite protection

### Fixed

* Fixed recreation protection expiry handling by supplying an explicit expiry value to the MediaWiki protection API when required
* Fixed custom expiry handling so a blank **"Other"** value falls back to **"never"** instead of producing an invalid expiry

### Removed

* Removed the dedicated wrapper previously used solely for the recreation protection level selector

### Improved

* Improved usability by allowing recreation protection duration to be configured directly from the deletion interface
* Improved interface consistency by matching the layout and behaviour of the main protection controls
* Improved flexibility by supporting both predefined and custom recreation protection durations
* Improved safety by requiring users to make an explicit expiry selection rather than defaulting to indefinite protection
* Improved API compatibility by ensuring recreation protection requests include the expiry information required for non-permanent protections

### Notes

* Recreation protection controls are displayed only when recreation protection is enabled
* The expiry selector initially uses its first available duration option and does not default to indefinite protection
* Custom expiry values use the same behaviour and validation pattern as the main protection expiry field
* If a custom expiry is selected but no value is entered, the protection falls back to **"never"**
* Recreation protection expiry values are passed directly to the `action=protect` API call

## v2.16.0

### Added

* Added a new deletion-section option to automatically protect deleted pages against recreation
* Added a configurable protection level selector for recreation protection, with **administrator-only** protection selected by default
* Added `massdelProtectRecreation` and `massdelProtectRecreationLevel` to the configuration object
* Added automatic recreation protection immediately after successful page deletions when the new option is enabled
* Added existence checks for talk pages during deferred protection processing
* Added existence checks before posting deferred protection notifications to talk pages

### Changed

* Updated the deletion workflow to optionally apply creation protection immediately after a successful deletion
* Updated deferred recreation protection for deleted pages to use `create=` protection instead of `edit=` and `move=` restrictions
* Updated deferred protection handling to preserve the configured protection expiry when applying recreation protection
* Updated talk-page protection logic to select the appropriate protection type based on page existence:
  * `create=` for non-existent talk pages
  * `edit=` and `move=` for existing talk pages
* Updated deferred notification handling to skip notification delivery when the target talk page no longer exists

### Fixed

* Fixed deferred recreation protection incorrectly using `edit=` and `move=` restrictions for deleted pages instead of `create=` protection
* Fixed a regression where protection expiry could be omitted during deferred recreation protection processing
* Fixed talk-page protection handling by distinguishing between existing and non-existent talk pages
* Fixed deferred notification posting attempts to non-existent talk pages
* Fixed cascade protection not being applied to talk pages during the primary protection pass
* Fixed a blank custom expiry value being passed to the API when **"Other"** was selected but no expiry value was entered. The expiry now falls back to **"never"**

### Removed

* Removed the use of `edit=` and `move=` protection restrictions when protecting deleted pages against recreation

### Improved

* Improved deletion workflows by allowing recreation protection to be applied immediately after deletion
* Improved reliability of deferred protection processing through page-existence validation
* Improved consistency between immediate and deferred recreation protection behaviour
* Improved notification handling by avoiding unnecessary edits to pages that no longer exist
* Improved flexibility by allowing administrators to select the recreation protection level directly from the deletion interface
* Improved protection consistency by ensuring cascade settings are applied uniformly to associated talk pages
* Improved expiry validation by providing a safe fallback when a custom expiry field is left blank

### Notes

* Recreation protection is optional and must be enabled through the new deletion-section checkbox
* The default recreation protection level is administrator-only protection
* Deferred recreation protection now correctly applies creation protection while retaining the configured expiry period
* Talk pages are evaluated individually to determine whether creation protection or edit/move protection is appropriate

## v2.15.0

### Added

* Added `notifySummaryBlock`, a localised notification summary constant for block notifications
* Added `notifySummaryDelete`, a localised notification summary constant for deletion notifications
* Added `notifySummaryProtect`, a localised notification summary constant for protection notifications
* Added centralised language-aware notification summary generation based on the active wiki language

### Changed

* Updated block notification posts to use `notifySummaryBlock` instead of deriving the edit summary from `config.blockReason`
* Updated deletion notification posts in both user mode and page mode to use `notifySummaryDelete`
* Updated protection notification posts in both the primary and deferred protection workflows to use `notifySummaryProtect`
* Replaced notification-specific `summary: config.*Reason + toolTag` assignments with predefined localised notification summary constants

### Fixed

* Improved consistency of notification edit summaries across block, deletion, and protection workflows
* Fixed notification summary generation so notification edits use dedicated notification summaries rather than action reasons

### Removed

* Removed the direct dependency on:
  * `config.blockReason`
  * `config.massdelReason`
  * `config.protectReason`
  for notification edit summary generation.

### Improved

* Improved localisation consistency by centralising notification summary wording in a single set of language-aware constants
* Improved maintainability by eliminating duplicated notification summary logic across multiple notification workflows
* Improved separation between action reasons and notification summaries, allowing each to serve its intended purpose independently
* Improved consistency between user mode and page mode notification behaviour

## v2.14.0

### Changed

* Updated `buildBlockReason()` to localise automatically generated **"see also"** references based on the value of `useIndonesian`
* Updated the abuse filter reference text

### Fixed

* Fixed mixed-language block reasons on Indonesian-language wikis where automatically generated **"see also"** references remained in English
* Fixed localisation consistency for abuse filter and deleted contributions references appended to block reasons

### Improved

* Improved localisation support for automatically generated block reason suffixes
* Improved consistency between user-supplied Indonesian block reasons and generated helper text
* Improved readability of block summaries on Indonesian-language wikis by ensuring all generated components use the same language

## v2.13.0

### Changed

* Updated Undo edit summary generation when username display is disabled
* Updated Rollback edit summary generation when username display is disabled

### Fixed

* Fixed Undo summaries so they no longer include a username placeholder when username display is disabled. The summary now uses **"Revert edits"**
* Fixed Rollback summaries so they no longer generate **"Revert edits by <username hidden>"** when username display is disabled. The summary now uses **"Revert edits"**
* Preserved existing Rollback behaviour when username display is enabled and no reason is provided, allowing MediaWiki to generate its default summary

### Removed

* Removed the `<username hidden>` placeholder from Undo summaries
* Removed the `<username hidden>` placeholder from Rollback summaries

### Improved

* Improved edit summary clarity by avoiding unnecessary placeholder text
* Improved consistency between Undo and Rollback summary generation when username display is disabled
* Improved integration with MediaWiki's native rollback summary behaviour

## v2.12.0

### Added

* Added `creatorMap`, a `Map<creatorUsername, string[]>` used to track deleted pages by their original creator during page mode operations
* Added creator lookups prior to page deletion using the MediaWiki API (`prop=revisions`, `rvdir=newer`, `rvlimit=1`, `rvprop=user`)
* Added page mode deletion notifications for page creators
* Added support for grouping multiple deleted pages into a single notification per creator

### Changed

* Updated the page deletion workflow to retrieve creator information before attempting deletion
* Updated notification handling so page mode can notify creators of deleted pages after all deletion operations have completed
* Updated page mode deletion reporting to aggregate deleted pages by creator rather than sending individual notifications per page

### Fixed

* Improved notification accuracy by ensuring only successfully deleted pages are included in creator notifications
* Improved resilience by allowing deletion operations to continue even if creator lookup requests fail

### Improved

* Improved efficiency by sending a single notification to each affected creator, even when multiple pages created by that user are deleted
* Improved user communication by providing page creators with deletion notifications in page mode, matching existing notification behaviour elsewhere in the workflow
* Improved localisation consistency by supporting both Indonesian and English notification messages
* Improved error handling by treating creator lookup failures as warnings rather than blocking deletion actions

### Notes

* Creator information is retrieved before the deletion request is submitted
* Pages are added to `creatorMap` only after a successful deletion
* Pages that fail to delete are not included in creator notifications
* Notification formatting matches the existing user mode deletion notification format, including language selection and single-page versus multi-page variants
* Creator notifications are generated after all deletion operations have finished

## v2.11.0

### Changed

* Updated notification edit summaries to use the user-supplied reason from the active configuration instead of predefined localised summary text
* Updated block notification summaries to use `config.blockReason`
* Updated deletion notification summaries to use `config.massdelReason`
* Updated protection notification summaries in both the primary and deferred protection workflows to use `config.protectReason`

### Fixed

* Improved consistency between the action reason selected by the user and the edit summary used when posting notifications
* Fixed notification workflows that previously ignored the configured reason and always used hardcoded summary text

### Removed

* Removed hardcoded localised edit summary strings from:
  * Block notifications
  * Deletion notifications
  * Primary protection notifications
  * Deferred protection notifications

### Improved

* Improved flexibility by allowing notification edit summaries to reflect the exact reason provided by the user
* Improved consistency across notification workflows by using the same configured reason values already used elsewhere in the action process
* Improved customisation for administrators who use project-specific or situational reasons

## v2.10.2

### Added

* Added an `updateStatusDisplay()` helper function to centralise status and summary updates within the progress dialogue
* Added a live summary display that appears immediately when processing begins
* Added real-time counter updates for completed operations as actions are processed

### Changed

* Updated the initial status label from **"Status: Starting actions..."** to **"Status: Processing..."**
* Updated the completion status label from **"Status: Completed!"** to **"Status: Completed."**
* Updated the abort status label from **"Status: Aborted!"** to **"Status: Aborted."**
* Updated summary handling so the summary line is displayed from the start of the operation rather than only at completion
* Updated operation handlers to refresh the status display immediately after each statistics counter is incremented

### Fixed

* Improved progress visibility by ensuring operation counts are reflected in the dialogue as actions complete
* Improved consistency between displayed progress information and the underlying operation statistics

### Improved

* Improved user feedback through real-time progress reporting
* Improved visibility of long-running operations by continuously updating action counters
* Improved readability through clearer status wording and consistent sentence-case formatting
* Improved language consistency by standardising status messages using en-GB punctuation and style conventions
* Improved maintainability by consolidating status updates into a dedicated helper function

### Notes

* The summary line now appears with zero values when processing begins and updates dynamically throughout execution
* Summary values are refreshed after each completed operation, including reversions, deletions, unlinking actions, protections, suppressions, and errors
* This release focuses on user interface feedback and progress reporting; no operational workflows or API behaviour were changed

## v2.9.0

### Changed

* Updated package reason mappings to use reason values that exactly match the options available in `Tengu-reasons.js`
* Updated the **Severe vandalism** package
* Updated the **Bot attack or automated spam** package
* Updated the **Severe privacy violation or doxxing** package
* Updated the **Mass page creation or spam** package
* Updated the **Edit warring or 3RR violation** package
* Updated the **Mass copyright infringement** package
* Updated the **Sockpuppetry or block evasion** package

### Fixed

* Fixed package-to-reason mappings that referenced values not present in the current `Tengu-reasons.js` configuration
* Fixed package selections so predefined actions consistently map to valid reason list entries

### Improved

* Improved compatibility between package presets and the centralised reason management system
* Improved reliability of automatic reason selection when applying predefined packages
* Improved maintainability by ensuring package definitions use canonical reason values from `Tengu-reasons.js`
* Improved consistency across rollback, block, and page deletion workflows

### Notes

* This release updates only package reason mappings
* No user interface, workflow, API, or behavioural changes were introduced
* All changes are intended to keep package presets aligned with the current reason definitions provided by `Tengu-reasons.js`

## v2.8.0

### Added

* Added a dynamic `get(useIndonesian)` interface to `Tengu-reasons.js`
* Added localisation-aware reason loading, allowing reason lists to be generated according to the active language context
* Added support for returning all reason collections through a single structured object containing rollback, block, deletion, and protection reasons

### Changed

* Refactored `Tengu-reasons.js` from a static property-based structure to a dynamic getter-based architecture
* Updated reason retrieval in `Tengu.js` to use the new `get()` interface instead of direct property access
* Moved `INDONESIAN_LANGS` and `useIndonesian` initialisation into the `.then()` loading block
* Updated reason initialisation flow to retrieve language-specific reason data after configuration loading
* Reorganised localisation-related code to improve variable scope and dependency handling

### Fixed

* Removed duplicate localisation variable declarations previously present in the `work()` function
* Improved consistency of localisation state usage throughout the reason-loading workflow

### Removed

* Removed direct access to static reason properties from `Tengu-reasons.js`
* Removed redundant localisation definitions from the main execution path

### Improved

* Improved localisation support by allowing reason data to be generated dynamically based on the active language
* Improved maintainability through a cleaner separation between configuration data and application logic
* Improved code organisation by consolidating language detection and reason initialisation into a single loading workflow
* Improved extensibility for future language-specific reason sets and configuration options

### Notes

* The new `get(useIndonesian)` method returns an object containing all reason collections required by Tengu
* Existing functionality remains unchanged from a user perspective
* This release focuses on internal architecture and localisation infrastructure rather than new user-facing features

## v2.7.2

### Changed

* Updated the duration-matching regular expression used by `translateDurationId()` to prioritise plural units before singular units

### Fixed

* Fixed an issue where plural MediaWiki duration strings could be matched incorrectly due to regex alternation order
* Fixed incorrect Indonesian translations such as:
  * `1 months` → `1 bulans` (incorrect)
  * `3 weeks` → `3 minggus` (incorrect)
* Fixed partial matches where singular units (`month`, `week`, `day`, etc.) were matched before their plural equivalents, leaving the trailing `s` outside the captured unit

### Improved

* Improved reliability of Indonesian duration translations for plural MediaWiki expiry strings
* Improved regex accuracy by ensuring the most specific unit forms are matched first
* Improved localisation consistency across block and protection notifications that display finite durations

### Notes

* The issue was caused by alternation order within a case-insensitive regular expression
* Plural forms (`months`, `weeks`, `days`, etc.) are now evaluated before singular forms (`month`, `week`, `day`, etc.)
* This release affects only Indonesian duration translation behaviour and does not change notification logic or wording outside the translated duration values

## v2.7.1

### Added

* Added `translateDurationId()` in **Section 04** to convert MediaWiki duration strings into Indonesian equivalents
* Added Indonesian translations for common duration expressions used in notification messages, such as:
  * `1 month` → `1 bulan`
  * `3 weeks` → `3 minggu`

### Changed

* Updated Indonesian-language block notifications to use translated duration strings when displaying finite block durations
* Updated Indonesian-language page protection notifications to use translated duration strings when displaying finite protection durations
* Updated both immediate and deferred protection notification workflows to use translated duration strings
* Updated both single-page and multi-page protection notification variants to use translated duration strings

### Fixed

* Fixed an issue where Indonesian-language notifications could display English duration strings generated by MediaWiki
* Fixed language inconsistency within Indonesian notifications containing finite expiry periods

### Improved

* Improved localisation quality by presenting duration values in Indonesian within Indonesian-language notifications
* Improved readability of block and protection notices for Indonesian-speaking users
* Improved consistency between translated notification text and embedded duration information

### Notes

* This change affects only Indonesian-language notification text
* English-language notifications remain unchanged
* Indefinite expiry paths are unaffected and continue to use their existing wording
* The translation helper is used in five notification-generation locations: one block notification path and four protection notification paths

## v2.7.0

### Changed

* Updated the deferred protection notification workflow to use the same `useIndonesian` localisation logic as the other notification paths
* Updated deferred protection notices to generate Indonesian text on supported Indonesian-language wikis
* Updated deferred protection edit summaries to match the language of the generated notice

### Fixed

* Fixed an issue where deferred protection notifications were always generated in English, regardless of the target wiki language
* Fixed an issue where deferred protection edit summaries remained in English on Indonesian-language wikis
* Fixed localisation inconsistency between the deferred protection workflow and the other notification workflows

### Improved

* Improved localisation consistency across all notification paths
* Improved user-facing messaging by ensuring recreation-protection notices use the appropriate language automatically
* Improved maintainability by bringing the deferred protection workflow into alignment with the existing localisation pattern used elsewhere in the script

### Notes

* This change affects only the deferred protection pass used to protect deleted pages against recreation
* The Indonesian wording now matches the wording already used by the primary protection notification workflow
* No changes were made to protection logic, API requests, or protection behaviour

## v2.6.0

### Added

* Added automatic language detection based on `wgContentLanguage`
* Added a predefined set of Indonesian-region language codes used to determine whether Indonesian or English notice text should be generated
* Added language-aware edit summary generation for block, protection, and deletion notices

### Changed

* Updated block notice generation to select notice text dynamically based on the target wiki language and block duration
* Updated protection notice generation in both immediate and deferred workflows to select notice text dynamically based on the target wiki language and protection expiry
* Updated deletion notice generation to display either Indonesian or English text depending on the target wiki language
* Updated multi-page protection notices to use Indonesian **"dan"** instead of English **"and"** when Indonesian notice text is selected
* Updated edit summaries for block, protection, and deletion notices so they match the language of the generated notice

### Fixed

* Removed redundant block notice helper variables (`blockDurDisplay` and `blockExpiryText`) by incorporating the expiry logic directly into notice generation
* Improved consistency between notice content and associated edit summaries across supported languages

### Removed

* Removed the standalone `blockDurDisplay` and `blockExpiryText` helper variables

### Improved

* Improved localisation support by automatically generating notices in Indonesian on supported Wikimedia projects
* Improved consistency by applying the same language-selection logic across block, protection, and deletion notices
* Improved maintainability by centralising language selection through a single `useIndonesian` flag

### Notes

* English notice text remains unchanged and is used whenever the wiki content language is not included in the Indonesian language set
* Both immediate and deferred protection notice workflows now use identical localisation logic
* No functional changes were made to blocking, protection, deletion, or notification workflows beyond notice and edit summary localisation

## v2.5.1

### Added

* Added dedicated speedy deletion sub-groups within `PAGE_DELETE_REASONS`:
  * General
  * Articles
  * Redirects
  * Files
  * Categories
  * Templates
  * User pages
* Added article-specific speedy deletion criteria covering the A-series criteria
* Added redirect-specific speedy deletion criteria
* Added file-specific speedy deletion criteria, including en-GB licence terminology
* Added category-, template-, and user-page-specific speedy deletion criteria
* Added **"Office actions"** to the General speedy deletion group

### Changed

* Reorganised the speedy deletion reason list into structured criterion-based groups
* Updated speedy deletion wording to align with the current G-, A-, F-, and related CSD criteria descriptions while omitting criterion prefixes
* Updated redirect deletion reason wording to match the reorganised criterion structure
* Standardised references to the `"File:"` namespace with consistent quotation formatting
* Updated the copyright deletion reason to use the full page name: **"Wikipedia:Copyright problems"**
* Removed `(PROD)` and `(BLPPROD)` suffixes from the corresponding deletion reasons

### Fixed

* Improved consistency between deletion reasons and the underlying speedy deletion criteria they represent
* Corrected terminology and formatting inconsistencies within the deletion reason lists

### Removed

* Removed the following legacy speedy deletion entries:
  * Deletion to make way for an Articles for Creation move
  * Deletion to rectify a copy-and-paste page move
  * Subpages with no parent page
  * Housekeeping and non-controversial cleanup
  * Wholly negative, unsourced biography of a living person
* Merged the former **"Wholly negative, unsourced biography of a living person"** entry into **"Attack page or negative unsourced BLP"**

### Improved

* Improved organisation and discoverability of deletion reasons by grouping them according to criterion type
* Improved maintainability of the deletion reason configuration through a clearer structure
* Improved alignment with Wikipedia speedy deletion terminology and workflows
* Improved consistency across namespace-specific deletion criteria

### Notes

* This release affects only the `PAGE_DELETE_REASONS` configuration data
* No changes were made to deletion workflows, API interactions, or user interface behaviour
* The restructuring is intended to make deletion reasons easier to locate and maintain while more closely reflecting the underlying speedy deletion criteria

## v2.5.0

### Added

* Added a new `Tengu-reasons.js` configuration file containing all predefined reason lists used by Tengu
* Added a global `window.TenguReasons` object to store rollback, block, deletion, and protection reasons
* Added asynchronous loading of reason configuration data using `mw.loader.getScript()`

### Changed

* Refactored reason-list management by moving all reason definitions out of `Tengu.js` and into a dedicated configuration file
* Updated Tengu initialisation to load reason data from the external configuration source
* Simplified the main script structure by separating configuration data from application logic

### Removed

* Removed the large embedded reason arrays from **Section 06** of `Tengu.js`

### Improved

* Improved maintainability by isolating editable reason lists from the core script logic
* Improved code organisation through a clearer separation of configuration and functionality
* Improved performance perception by loading reason data asynchronously, allowing the portlet to appear immediately without waiting for configuration data to be parsed
* Improved safety of future updates, as reason-list changes can now be made independently of the main application logic

### Notes

* All rollback, block, deletion, and protection reasons are now maintained in `Tengu-reasons.js`
* Future modifications to predefined reason lists should be made in `Tengu-reasons.js` rather than `Tengu.js`
* This release continues the modularisation effort introduced in previous versions by further separating configuration data from core functionality

## v2.4.0

### Added

* Added `applyActiveBlockSettings()` to automatically apply settings based on an existing active block
* Added `applyActiveProtectionSettings()` to automatically apply settings based on an existing active page protection
* Added automatic invocation of both functions during status updates when relevant active restrictions are detected

### Changed

* Updated log entry formatting to include numbering alongside timestamps, improving log readability and traceability
* Updated status-handling workflows so active block and protection information can influence the corresponding dialogue settings automatically

### Improved

* Improved workflow efficiency by pre-populating block settings from existing active blocks
* Improved workflow efficiency by pre-populating protection settings from existing active protections
* Improved consistency between detected restriction status and the values presented in the interface
* Improved auditability through numbered log entries

### Notes

* `applyActiveBlockSettings()` is triggered when an active block is detected in user mode
* `applyActiveProtectionSettings()` is triggered when an active protection is detected in page mode
* Log entries now include a sequential counter before the message text

## v2.3.0

### Added

* Added an `isSpecialPage` context flag to identify Special pages in page mode
* Added an `isSpecialTarget` parameter to `updateModeNotice()` for Special page-specific notices
* Added an `isTargetSpecialPage()` helper function to detect Special page targets
* Added `applySpecialPageLocks()` to enforce restrictions when targeting a Special page
* Added dedicated notices for Special page targets where page-based actions or checks are not applicable

### Changed

* Updated `applyModeRestrictions()` to incorporate Special page detection and restriction handling
* Updated mode notices to reflect when the selected target is a Special page
* Updated target-change handling so Special page restrictions are re-evaluated whenever the page target changes
* Updated page mode logic to distinguish between regular pages and Special pages when determining available actions

### Fixed

* Fixed restriction handling for Special page targets by ensuring locks are applied consistently during both initialisation and subsequent target changes
* Fixed page-mode status handling to avoid unnecessary processing when targeting a Special page

### Improved

* Improved consistency by applying Special page restrictions immediately when the dialogue opens in page mode
* Improved responsiveness by re-evaluating Special page restrictions whenever the target field changes
* Improved user feedback by displaying explanatory notices instead of attempting unsupported checks on Special pages
* Improved efficiency by skipping unnecessary API requests when the selected target is a Special page

### Notes

* Special page restrictions are evaluated both during initial page-mode setup and whenever the target page changes.
* The block section now displays an appropriate notice instead of performing status lookups when page mode is targeting a Special page.
* No changes were made to user mode behaviour.

## v2.2.0

### Added

* Added a new **"Protect pages included in this page (cascading protection)"** checkbox to the protection section
* Added dynamic cascade protection availability handling through `updateCascadeAvailability()`
* Added contextual tooltip messaging that reflects whether cascading protection is currently available

### Changed

* Protection packages now automatically update cascade protection availability after applying preset edit restriction levels
* The protection configuration object now includes a `protectCascade` property derived from the cascade protection checkbox state
* Tooltip text now changes dynamically based on the selected edit protection level

### Fixed

* Fixed package application behavior so protection presets that set a non-administrator edit restriction immediately disable cascading protection
* Fixed consistency between manual protection settings and package-applied settings by using the same cascade availability logic

### Improved

* Improved usability by preventing cascade protection from being selected when the edit restriction level does not support it
* Improved guidance through context-sensitive tooltips explaining why the option is unavailable
* Improved API integration by conditionally adding the MediaWiki `cascade` flag only when cascading protection is enabled and valid
* Improved consistency across both immediate and deferred protection workflows by supporting cascading protection in both API execution paths

### Notes

* Cascading protection is only available when edit protection is set to administrators only
* The `cascade` parameter is conditionally added to protection API requests using MediaWiki's standard boolean flag pattern (`cascade: ""`)
* Both the primary protection pass and deferred protection pass support cascading protection when enabled

## v2.1.2

### Added

* Added a new block-section checkbox: **"Append 'See also deleted contributions' to the edit summary"**
* Added support for including a deleted contributions reference in automatically generated block summaries

### Changed

* Updated `buildBlockReason()` to use a unified `seeAlsoParts` array when constructing edit summary suffixes
* Edit summary generation now combines references from multiple optional checkboxes into a single adaptive **"See also ..."** suffix when applicable

### Improved

* Improved edit summary formatting by consolidating multiple optional references into a single, grammatically consistent suffix
* Improved extensibility of block summary generation, making it easier to add future "See also" references

## v2.1.1

### Changed

* Updated contributions page detection so `Special:IPContributions` is treated the same as other contributions pages when determining mode availability

### Fixed

* Fixed an issue where user mode could be unavailable on `Special:IPContributions`
* Fixed mode toggle behavior by ensuring contributions pages associated with IP addresses are recognized as valid user-context pages
* Restored correct user mode activation and target pre-fill behavior on `Special:IPContributions`

### Improved

* Improved consistency between `Special:Contributions` and `Special:IPContributions`
* Improved mode selection logic by correctly deriving `isUserNamespace` from the updated contributions page detection
* Improved usability by allowing the user mode button to function normally instead of being disabled in IP contributions contexts

### Notes

* This change relies on existing mode-handling logic and does not introduce any new user mode behavior
* Once `Special:IPContributions` is recognized as a contributions page, `isUserNamespace` is derived automatically and the existing user mode workflow operates as intended
* `wgRelevantUserName` was already available on `Special:IPContributions`, so no additional target population changes were required

## v2.1.0

### Added

* Added global block checks for registered accounts alongside existing global lock checks
* Added support for displaying separate global lock and global block badges in the **Access rights** card when both states are present
* Added expanded status reporting in the block section to distinguish between:
  * Globally locked and blocked
  * Globally locked only
  * Globally blocked only
  * Neither locked nor blocked

### Changed

* Renamed the **Access rights** row label from **"Global lock"** to **"Global lock / block"**
* Updated registered account status checks to query both `meta=globaluserinfo` and `list=globalblocks` (`bgtargets`) in parallel using `Promise.all`
* Updated loading messages to refer to both global locks and global blocks
* Updated fallback error messages to refer to both global locks and global blocks
* Hoisted `fmtExpiry` so it can be shared by both registered account and IP status handlers

### Fixed

* Fixed registered account status reporting to detect global blocks in addition to global locks
* Removed a redundant no-op ternary expression associated with the loading element class

### Improved

* Improved accuracy of global account status reporting by covering both lock and block mechanisms
* Improved performance by executing global lock and global block API requests concurrently
* Improved consistency between the **Access rights** card and the block section status note by using the same lock/block evaluation logic
* Improved status visibility by rendering separate badges for each applicable enforcement state

### Notes

* Registered account status checks now combine results from `meta=globaluserinfo` and `list=globalblocks`
* When neither a global lock nor a global block exists, Tengu displays a single **"Not globally locked or blocked"** indicator

## v2.0.0

### Added

* Added a standalone `Tengu.css` stylesheet containing all Tengu interface styling, layout rules, animations, and dark mode compatibility
* Added structured documentation headers to `Tengu.css`, aligned with the metadata and repository information used in `Tengu.js`
* Added asynchronous stylesheet loading through `mw.loader.load()`

### Changed

* Refactored Tengu into a modular architecture by separating presentation and application logic
* Moved all CSS definitions from `Tengu.js` into the new `Tengu.css` file
* Updated the initialization workflow so styles are loaded externally before the application interface is rendered
* Reduced the scope of `Tengu.js` to MediaWiki interaction logic, UI construction, API operations, token management, and event handling

### Removed

* Removed the embedded `TNG_CSS` stylesheet constant from `Tengu.js`
* Removed the legacy `mw.util.addCSS(TNG_CSS)` injection method from `init()`

### Improved

* Improved maintainability by separating styling and application logic into dedicated files
* Improved readability and long-term development by reducing the size and complexity of `Tengu.js`
* Improved stylesheet organization through dedicated documentation and sectioned structure
* Improved flexibility for future UI updates without requiring changes to the core script logic

### Notes

* This release introduces a structural change and may require deployment updates
* The URL used by `mw.loader.load()` must be updated to point to the wiki page containing `Tengu.css`
* Failure to update the stylesheet URL may result in Tengu loading without its intended interface styling

## v1.22.0

### Added

* Added a new global status notice (`divGlobalStatus`) below the existing local block status notice in the main dialog
* Added global lock status detection for registered accounts
* Added global block status detection for IP addresses, including blocker, expiry, and reason details
* Added global lock/block indicators to the **Access rights** section of the **Get info** dialog in user mode
* Added tooltips for globally blocked IPs to display block details

### Changed

* Global status information is now refreshed automatically whenever the target changes
* The **Access rights** card now displays global account status information beneath the CentralAuth global rights row, separated by a divider

### Improved

* Improved visibility of cross-wiki enforcement actions by exposing global lock and global block status directly within Tengu
* Improved user information reporting by consolidating CentralAuth rights and global account status in the same section
* Improved page mode feedback by displaying **"Not applicable in page mode."** when global account checks cannot be performed

### Notes

* Registered account status is retrieved using the `meta=globaluserinfo` API, where the `locked` property indicates whether the account is globally locked
* IP global block information is retrieved using the `list=globalblocks` API, which returns active global blocks affecting the target IP address
* If no CentralAuth account exists for a registered username, the **Get info** dialog displays **"No global account found"**

## v1.21.0

### Added

* Added a **"Copy this log"** button to the log dialog footer
* The button copies the complete log output to the clipboard for auditing and record-keeping purposes
* Implemented clipboard support using `navigator.clipboard` with an `execCommand` fallback for broader compatibility
* Added tooltip to the portlet link: `Open Tengu, all-in-one moderation tool`

### Changed

* User mode is now automatically enabled when Tengu is opened from a user's contributions page, as the page context always refers to a specific user
* Delete and protect operations are now executed in a safer order when both actions target the same page

### Fixed

* Fixed an issue where page protection could be lost when a page was scheduled for both deletion and protection. Protection is now applied after deletion instead of before it.
* Fixed operation ordering in both page mode and applicable user mode edge cases where the same page could appear in both deletion and protection workflows

### Improved

* Improved workflow consistency on contribution pages by selecting the most relevant mode automatically
* Improved reliability of combined deletion and protection actions
* Improved post-operation auditing by allowing logs to be copied directly from the dialog

### Notes

* Pages that are only protected and not deleted are unaffected by the delete–protect operation ordering change
* The protection-order fix applies to page mode and to user mode scenarios where the same page is both created and edited by the targeted user

## v1.20.2

### Added

* Added cross-wiki compatibility by using `wgCanonicalSpecialPageName` for context detection instead of localised special page titles
* Added native support for operation on `Special:Contributions`, allowing the interface to initialise both User mode and Page mode components when launched from contribution pages
* Added automatic Page mode defaulting on contribution pages to streamline page-based administrative workflows

### Changed

* Audited and updated interface comments and notice properties to use consistent British English spelling
* Improved mode-switching behaviour by replacing permanent rights-based UI locks with reversible state-based visibility handling

### Fixed

* Fixed a mode-switching issue that could leave User mode functionality unavailable after changing modes
* Fixed restoration of User mode controls, ensuring block, rollback, and revision deletion actions become fully available again when switching back from Page mode
* Fixed layout handling on contribution pages to ensure both operational modes can coexist without breaking interface state

## v1.20.0

### Added

* Added namespace detection using `mw.config.get("wgNamespaceNumber")` to determine whether user-mode functionality is available
* Added handling to automatically fall back to Page mode when the gadget is loaded outside the user and user talk namespaces

### Changed

* Updated the page mode notice text, replacing "entered above" with "entered below"
* Initialised the User mode and Page mode toggle buttons globally so they remain visible regardless of the namespace where the gadget is loaded

### Fixed

* Disabled the User mode button when the gadget is loaded outside Namespace 2 (User) and Namespace 3 (User talk)
* Added visual feedback for the disabled User mode button using reduced opacity and a `not-allowed` cursor, preventing unavailable functionality from appearing active

## 1.19.4

### Fixed

* Fixed the `mw.util.addPortletLink()` call by replacing the object literal with the previous positional parameter form: `"#"`, `"⛩️ Tengu"`, `"ca-tengu"`

## 1.19.3

### Added

* Added `wrapSelect()` helper to wrap select elements with a custom container
* Added `.tng-select-wrap` styling and custom chevron indicator via the `::after` pseudo-element
* Added dark-mode support for `.tng-select-wrap::after`

### Changed

* Extended `.tng-select` styling to remove the native dropdown arrow and improve text handling with right-side padding and ellipsis
* Retargeted `.tng-reason-top .tng-select` styles to `.tng-reason-top .tng-select-wrap`
* Updated the "Get info" button label to "ℹ️ Get info"
* Wrapped all select elements using `wrapSelect()` instead of appending them directly
* Removed redundant `.style.flex = "1"` assignments from select elements, as flex behavior is now handled by the wrapper

## 1.19.2

### Changed

* Updated the `mw.util.addPortletLink()` call from positional parameters to the config object syntax.

## 1.19.1

### Changed

* Updated the Abuse Filter checkbox label from **"See also the abuse filter log for this user"** to **`Append "See also the abuse filter log" to the edit summary`**
* Increased `.tng-log-box` font size from `0.85em` to `0.9em` for improved readability

### Added

* Added sequential numbering to log entries
* Added a `logCount` counter to track and prefix log messages

### Improved

* Log output is easier to follow during long-running operations thanks to numbered entries
* Increased log text size improves readability without altering layout or functionality
* The Abuse Filter checkbox label now more clearly describes its actual behaviour by explaining that it appends text to the edit summary

## 1.19.0

### Changed

* Added `unlink` tracking to the operation statistics object
* Updated the final operation summary to include the number of successful unlink actions
* Updated page deletion package handling to restore the unlink option from package configuration data
* Removed the User Mode restriction on `deletedTitles` collection so deleted pages are tracked consistently across modes

### Added

* Added an **"Also unlink backlinks"** checkbox to the Page Deletion section
* Added `massdelUnlink` to the configuration object
* Added package support for page deletion unlink preferences via `pagedelete.unlink`
* Added unlink counts to the end-of-run statistics summary

### Improved

* Page deletion configuration options now support backlink-unlinking preferences alongside talk-page deletion preferences
* Deletion tracking is now collected consistently regardless of operating mode
* Final status reporting provides better visibility into deletion-related maintenance actions

## 1.18.11

### Changed

* Updated block interface to include a new Abuse Filter log option within the Block section
* Integrated the new checkbox into existing block option layout using the standard checkbox helper for consistent styling

### Added

* Added `chkAbuseFilter` checkbox labelled **"See also the abuse filter log for this user"**
* Added support for including abuse filter log awareness in block reason construction
* Added conditional formatting logic in `buildBlockReason()` for abuse filter log references

### Improved

* Improved block reason generation to dynamically include abuse filter log context when selected
* Improved sentence case handling so appended notices adapt to context:
  * Appended in lowercase parenthetical form when a primary reason exists
  * Used as a standalone capitalised sentence when no primary reason is provided
* Improved consistency of block-related UI elements by reusing existing checkbox styling system
* Improved integration of abuse filter awareness into existing moderation workflow without affecting other block logic

## 1.18.10

### Added

* Added `deletedTitles` collection tracking for successfully deleted pages in User Mode
* Added post-processing deletion notifications for mass-deletion operations in User Mode
* Added single-page and multi-page deletion notification variants
* Added automatic notification delivery to `User talk:<targetVal>` after successful mass-deletion operations

### Fixed

* Fixed missing notifications for page deletions performed in User Mode

### Improved

* Users now receive a single consolidated notification covering all successfully deleted pages
* Notification delivery occurs after deletion processing completes, avoiding fragmented messages
* Deletion notifications reuse the known target user from the contribution query, eliminating the need for additional creator lookups

## 1.18.9

### Changed

* Refactored protection notifications to separate notification collection from notification dispatch

### Added

* Added `notifyQueue` (`Map`) to collect protection notification targets during processing
* Added a dedicated notification dispatch phase after the protection loop completes
* Added support for consolidated protection notifications when multiple protected pages resolve to the same talk page
* Added single-page and multi-page notification variants for protection notices

### Fixed

* Fixed duplicate protection notifications being posted when both a page and its talk page were protected in the same operation
* Fixed cases where multiple protected pages could generate multiple notices on a single talk page

### Improved

* Protection notifications are now grouped by destination talk page
* Affected pages are combined into a single notice when appropriate, reducing notification clutter
* Notification delivery is now handled independently from protection processing

## 1.18.8

### Changed

* Reused the existing blue notice palette already used by `.tng-rights-badge-group`, avoiding the introduction of new colour tokens
* Hoisted `updateModeNotice()` as a named function declaration so it can be called from `applyModeRestrictions()` regardless of source order

### Added

* Added a mode-status notice to provide contextual feedback about the current operating mode

### Improved

* The mode-status notice updates automatically when switching between User Mode and Page Mode
* In page-only mode, where no mode toggle is available, the notice is rendered once and remains static as intended
* Improved visibility of the current operating context without introducing additional interaction or workflow changes
* Maintained visual consistency by reusing existing interface colours and styling patterns

### Notes

* This release introduces a UI-only enhancement and does not modify operational logic or processing behaviour.

## 1.18.7

### Fixed

* Fixed indefinite expiry values displaying as **"Invalid Date"** in status displays and information panels
* Added internal guards in all date-formatting helpers to handle MediaWiki's indefinite expiry values (`infinity` and `infinite`) before attempting date parsing
* Added fallback handling for unparseable date values to prevent invalid timestamps from being rendered
* Fixed section chevrons occasionally displaying an upward-pointing state after a mode lock was removed
* Fixed arrow-state synchronisation when unlocking sections after switching between Page Mode and User Mode

### Improved

* Date formatting is now resilient regardless of whether expiry values are validated at the call site
* Chevron direction now consistently reflects the actual expanded or collapsed state of the section body
* Improved consistency between visual section state and internal mode-lock behaviour

## 1.18.6

### Added

* Added `.tng-status-note` styling and corresponding dark-mode variants
* Added status note placeholders to the:
  * Block section
  * Page deletion section
  * Page protection section
* Added `updateSectionStatus()` to manage contextual section status messaging

### Fixed

* Removed early-exit guard at the start of the `mw.loader.using` callback to detect Special pages (`wgNamespaceNumber === -1`)

### Improved

* Section status messages now update automatically when the target input changes
* Section status messages now refresh when mode restrictions are applied or removed
* Provides clearer feedback about section availability and applicability based on the current target and mode
* Improves visibility of contextual state without requiring users to inspect disabled controls or tooltips

## 1.18.5

### Added

* Added an early-exit guard at the start of the `mw.loader.using` callback to detect Special pages (`wgNamespaceNumber === -1`)

### Fixed

* Prevented Tengu from initialising on Special pages
* Prevented portlet link registration on Special pages
* Prevented CSS injection on Special pages
* Prevented dialogue construction on Special pages
* Prevented feature execution on Special pages

### Improved

* Reduced unnecessary processing on pages where the gadget is not intended to operate
* Uses `wgNamespaceNumber === -1`, a stable MediaWiki namespace identifier for Special pages

## 1.18.4

### Changed

* Updated page deletion reason handling to fully support the **Other:** option as a first-class preset value
* Updated package application behaviour so a preset with `reason: ""` correctly selects **Other:** rather than falling back to the custom-reason field

### Fixed

* Fixed package restoration for custom page deletion reasons represented by an empty-string preset value
* Ensured the **Other:** deletion reason option is correctly restored when applying saved package configurations

### Improved

* Confirmed that custom page deletion reasons continue to resolve correctly through `buildPagedelReason()`
* Improved consistency between package configuration values and page deletion reason selection behaviour

## 1.18.3

### Changed

* Updated mode-lock handling to track mode-managed locks separately from permission-based locks
* Updated mode toggle behaviour to populate the target field with the appropriate default value for the selected mode

### Added

* Added `modeLocked` (`Set`) to track sections locked specifically by mode restrictions
* Added safeguards preventing mode-based locking from modifying sections already locked by user-rights restrictions
* Added redundant-click guards to the mode toggle buttons

### Fixed

* Fixed interaction conflicts between mode-based locks and rights-based locks
* Fixed an edge case where rights restrictions could be skipped if the rights promise resolved while a section was temporarily disabled by mode restrictions
* Fixed restoration of rights-based restrictions when returning from Page Mode after rights data had already been resolved
* Fixed target field synchronisation when switching between User Mode and Page Mode

### Improved

* User Mode automatically restores the target field to `wgRelevantUserName`
* Page Mode automatically restores the target field to `wgPageName`
* Mode switching is more predictable and avoids unnecessary processing when the selected mode is already active
* Rights-based and mode-based locking mechanisms now operate independently without overriding each other

## 1.18.2

### Changed

* Updated the hard-block checkbox label to use clearer, more specific wording

### Added

* Added automatic temporary-account detection using the pattern `^~\d{4}-\d+-\d+$`
* Added automatic block-expiry selection for detected temporary accounts
* Added logic to automatically set the block duration to **3 months** when a matching temporary account is entered

### Fixed

* Fixed block parameter handling when the hard-block option is enabled
* Updated block request generation so blocks are not restricted to anonymous users when the hard-block option is selected

### Improved

* Improved handling of temporary account targets by automatically applying an appropriate default block duration
* Improved consistency between the hard-block UI option and the block parameters sent to the MediaWiki API
* Ensured the hard-block option applies to logged-in accounts within the affected address range, not only anonymous users

## 1.18.1

### Fixed

* Fixed the **Get info** button not appearing in the dialogue by appending `btnGetInfo` to `fieldTarget` after its event listeners were initialised

## 1.18.0

### Changed

* Updated information button behaviour to support both User Mode and Page Mode
* Revised Page Mode handling for the **Edits** and **Package** controls
* Replaced Page Mode hiding of unsupported controls with a disabled-state presentation

### Added

* Added `getPageInfo()`, mirroring the existing user information workflow for page targets
* Added page information retrieval for:
  * Abuse filter log (`afltitle`)
  * Protection log
  * Deletion log
  * Move log
* Added independent asynchronous loading for each page log source
* Added disabled-state tooltips for controls unavailable in Page Mode

### Fixed

* Fixed a UI contradiction where the information button remained labelled **"Get information on this user"** while simultaneously indicating it was unavailable in Page Mode
* Fixed the information button being unnecessarily disabled when targeting a page
* Fixed Page Mode preventing access to contextual information about the current page

### Improved

* Information retrieval now adapts to the current target type, supporting both users and pages
* Failures in one page-log request no longer affect the loading of other page-log sections
* The **Edits** and **Package** rows remain visible in Page Mode, improving interface consistency and discoverability
* Disabled controls are visually dimmed and accompanied by explanatory tooltips rather than being removed entirely
* Improved transparency by showing unavailable options instead of hiding them from the interface

## 1.17.2

### Changed

* Remove entries in the `General` group under `PAGE_DELETE_REASONS` as they are similar to the ones under `Speedy deletion` group

## 1.17.1

### Changed

* Updated multiple entries in `PAGE_DELETE_REASONS` to use clearer and more descriptive wording
* Expanded several deletion reasons by spelling out abbreviations and adding contextual explanations

### Improved

* Improved readability and understanding of page deletion reason presets
* Reduced reliance on project-specific acronyms and shorthand
* Made deletion reasons more accessible to users who may be unfamiliar with internal terminology
* Increased consistency and clarity across the page deletion reason list while preserving existing functionality

## 1.17.0

### Changed

* Added target-context detection based on `wgRelevantUserName`
* Updated the primary input field to dynamically display either **Target user** or **Target page**
* Updated input placeholders to match the detected target type
* Replaced the previous **General** page deletion reasons group with a new **Speedy deletion** group
* Removed criterion prefixes (e.g. G1, G2, G3) from deletion reason labels and values
* Updated deletion reason wording to use sentence case and en-GB spelling conventions

### Added

* Added `tenguMode` to distinguish between user-centric and page-centric workflows
* Added automatic Page Mode support for page protection and page deletion operations
* Added explanatory tooltips for features unavailable in Page Mode
* Added a comprehensive set of speedy deletion reasons

### Improved

* Tengu now adapts its interface automatically based on the current page context
* Page Mode bypasses user-contribution lookups and feeds the target page directly into existing protection and deletion workflows
* Reused existing protection and deletion processing logic without requiring separate execution paths
* Simplified deletion reason selection by presenting clean, descriptive labels without criterion codes
* Improved consistency and readability of page deletion options
* Better aligned deletion reasons with common speedy deletion workflows
* Standardised newly added interface text using sentence case and en-GB spelling conventions

### Fixed

* Locked the Rollback, Block, and Revision deletion sections when operating in Page Mode
* Added visual lock indicators and disabled unavailable user-based actions in Page Mode
* Prevented execution of user-centric workflows when the target is a page rather than a user
* Hid the **Edits** selector when operating in Page Mode
* Hid the **Package** preset selector when operating in Page Mode
* Prevented user-specific controls from being displayed when the target context is a page
* Improved contextual relevance of the interface by only displaying controls applicable to the current mode

### Notes

* In Page Mode, page protection and page deletion continue to use the existing processing loops and configuration options.
* The **Edits** and **Package** controls remain available in User Mode and are only hidden when Tengu is operating on a page target.

## 1.15.0

### Changed

* Moved the talk-page protection help text from an inline help element to the checkbox tooltip
* Updated the talk-page protection tooltip text to describe the actual protection behaviour and skip conditions

### Added

* Added an **"Also delete the talk page"** option to the page deletion section
* Added a tooltip explaining how optional talk-page deletion works
* Added `massdelTalk` support to the deletion workflow configuration
* Added package support for talk-page deletion through `pagedelete.talkdelete`

### Improved

* Talk-page deletion is now optional and controlled by a dedicated checkbox
* Talk pages are skipped automatically when the target page is already a talk page
* Package switching correctly resets the talk-page deletion option to its configured state
* Reduced UI clutter by moving explanatory protection text into a tooltip
* Improved consistency between page protection and page deletion options for handling associated talk pages

### Notes

* Existing deletion behaviour remains unchanged when the talk-page deletion option is left unticked.

## 1.14.0

### Changed

* Added `protectTalk` to the protection configuration object
* Updated package application logic to reset and restore the talk-page protection option when switching packages

### Added

* Added an **"Also protect the talk page"** option to the page protection section
* Added contextual help text explaining how talk-page protection is applied
* Added a tooltip describing the behaviour and limitations of the option
* Added automatic protection of associated talk pages when the option is enabled

### Improved

* Talk-page protections inherit the same protection level, expiry, and reason as the main page
* Talk pages are skipped automatically when the protected page is already a talk page
* Talk-page protection failures are logged without interrupting the main processing loop
* Added success and error logging for talk-page protection actions
* Applied a consistent throttle delay after talk-page protection requests

### Notes

* Existing talk-page notification behaviour is unchanged and continues to operate independently of the new protection option.

## 1.13.0

### Changed

* Updated MediaInfo revert payload construction to use `claims` instead of `statements`
* Revised MediaInfo restoration logic to preserve the complete entity structure when preparing revert data

### Fixed

* Fixed MediaInfo revert requests using an API field that was not recognised by `wbeditentity`
* Fixed an issue where structured data could be cleared without correctly restoring the previous statements during a revert
* Fixed an issue where captions and other entity data could be lost during MediaInfo restoration

### Improved

* MediaInfo reverts now restore the previous entity state using a full entity copy before applying changes
* Improved reliability of structured data reverts while keeping MediaInfo-specific logic isolated from standard page undo and rollback workflows

## 1.12.1

### Changed

* Updated MediaInfo revert payload to use `statements` instead of `claims` when submitting data through `wbeditentity`

### Fixed

* Fixed structured data revert submissions by using the expected `statements` field in the entity payload
* Restored error reporting for failed undo operations when MediaInfo revert handling is involved
* Restored error reporting for failed rollback operations when MediaInfo revert handling is involved
* Removed conditions that could suppress API error messages during MediaInfo-related revert failures

### Improved

* Improved visibility of revert failures by ensuring undo and rollback errors are always logged
* Simplified error-handling logic in both undo and rollback workflows

## 1.12.0

### Changed

* Refactored the main revert workflow to support conditional handling based on revision content models

### Added

* Added content model detection before processing revert actions
* Added support for reverting edits to the `mediainfo` slot
* Added a dedicated revert path using the `wbeditentity` API for structured data revisions
* Added retrieval of the parent entity state when reverting `mediainfo` changes

### Improved

* Automatically routes revert operations to the appropriate API endpoint based on revision type
* Preserves compatibility with standard page revision reverts while extending support to structured data edits
* Enables restoration of previous structured data statements by overwriting the modified entity with its parent state

### Fixed

* Fixed the inability to properly revert structured data (`mediainfo`) edits through the standard revert workflow

## 1.11.0

### Added

* Added **"Account is used solely for vandalism"** to the **Common block reasons** list
* Added a new **Username policy violations** optgroup to block reasons
* Added seven username-policy-related block reasons under the new optgroup

### Improved

* Expanded and better organised the available block reason presets
* Improved discoverability of username-related enforcement options by grouping them separately

## 1.10.2

### Added

* Added an additional suffix: "global rollbackers action"

## 1.10.1

### Fixed

* Removed "Criteria for redaction" from the `revisiondelete` array to align available options with intended configuration

## 1.10.0

### Changed

* Renamed the user information button from "Get info" to "Get information on this user"
* Updated the button tooltip to describe the expanded information available

### Added

* Added an **Access rights** card to the user information dialog
* Added local rights and global rights sections within the access rights card
* Added badges displaying user group memberships for both local and global scopes
* Added expandable rights lists showing individual permissions for each scope
* Added dedicated styling for:
  * User rights cards
  * Rights scope labels
  * Rights badge containers
  * Group badges
  * Empty-state badges
  * Rights dividers
  * Rights lists
* Added dark mode support for all user rights card components
* Added a collapsible chevron to the Access rights card header, matching the appearance and behaviour of other collapsible sections

### Improved

* Displayed local wiki groups and rights separately from global Wikimedia/CentralAuth groups and rights
* Filtered implicit local groups (`*` and `user`) so only meaningful group memberships are shown
* Added clear fallback states for users with no local or global groups
* Added dedicated handling for accounts that do not exist
* Added dedicated handling for users without a global account
* Displayed a "Not applicable for IP addresses" message for global rights on IP users
* Loaded local and global rights independently so failures in one source do not affect the other
* Integrated access rights information directly into the user information workflow alongside existing logs

## 1.9.0

### Changed

* Moved shared API helpers and a shared `mw.Api` instance into a dedicated module-level section
* Renumbered internal sections to accommodate the new shared API section

### Improved

* Deferred CSS injection until the Tengu dialogue is first opened, avoiding unnecessary CSSOM modifications on pages where the tool is never used
* Added one-time CSS initialisation guarding to prevent repeated stylesheet injection
* Reused a single shared `mw.Api` instance across all operations, reducing redundant object creation and improving token cache reuse
* Centralised `apiGet`, `apiPost`, and `apiRollback` helper functions to eliminate duplicate wrapper definitions
* Deferred Escape-key listener registration until the first overlay is created, removing global keydown overhead on pages where no dialogue is opened
* Reduced script size by normalising line endings from CRLF to LF

### Notes

* No functional or user-facing behaviour changes were introduced
* Optimisations are internal and fully backward compatible

## 1.8.2

### Changed

* Renamed global rights badges:

  * "Global rollback" → "Rollback"
  * "Global sysop" → "Sysop"

### Improved

* Reduced redundant wording in the global rights panel
* Relied on the existing "Global:" scope label to provide context for global rights badges
* Improved readability and visual consistency between local and global rights displays

## 1.8.1

### Changed

* Reverted the rights panel layout from a two-row structure to a single flex row
* Updated rights panel rendering to display local and global rights in a single flow with automatic wrapping on narrow viewports

### Added

* Added `.tng-rights-sep`, a vertical separator between local and global rights groups
* Added dark mode styling for the rights panel separator

### Removed

* Removed `.tng-rights-row` and its associated row-based layout structure
* Removed local and global row wrapper elements from the rights panel DOM

### Improved

* Simplified rights panel markup and layout
* Improved space efficiency by displaying all rights information within a single flex container
* Added a clearer visual distinction between local and global rights through a dedicated separator
* Preserved responsive behaviour by allowing rights badges to wrap naturally on smaller screens

## 1.8.0

### Changed

* Updated header documentation to describe both local and global rights in the user rights panel
* Redesigned the rights panel layout from a single-row display to a two-row structure for local and global permissions
* Updated the rights panel heading from "Your rights:" to "Your rights"

### Added

* Added global rights detection using `action=query&meta=globaluserinfo&guiprop=groups|rights`
* Added a dedicated **Global** rights row in the rights panel
* Added badges for:
  * Global rollback
  * Global sysop
  * Steward
* Added `.tng-rights-row` for grouped rights displays
* Added `.tng-rights-subtitle` for local/global scope labels
* Added dark mode styling for rights panel subtitles

### Improved

* Rights information is now presented separately for local and global permissions
* Combined local and global rights loading through `Promise.all()` for coordinated badge updates
* Global rights lookup fails gracefully and does not affect the rest of the interface if unavailable
* Preserved existing permission-locking behaviour, which continues to rely on effective rights provided by MediaWiki

### Notes

* Permission-locking logic is unchanged and remains based on effective user rights on the current wiki.

## 1.7.6

### Changed

* Updated `makeDisplaySection()` to return the section arrow alongside the section and section body

### Added

* Added programmatic access to display-section chevrons for external state management

### Improved

* User information sections now automatically expand when relevant data is found
* Block log sections automatically open when one or more block log entries are returned
* Rights changes sections automatically open when one or more rights log entries are returned
* Abuse filter log sections automatically open when one or more abuse log entries are returned
* Chevron state is automatically synchronised when sections are opened programmatically
* Sections with no results remain collapsed to reduce visual clutter

### Notes

* Error handling behaviour is unchanged; sections that encounter errors remain collapsed while continuing to display the existing error message content

## 1.7.5

### Changed

* Updated `lockSection()` to remove the section chevron entirely when a section is permission-locked

### Fixed

* Fixed header alignment in locked sections by removing the unused chevron element instead of leaving it in the DOM
* Prevented the lock badge from being offset by a redundant chevron that could no longer be interacted with

### Improved

* Simplified the locked-section UI by displaying only the lock indicator for sections that cannot be expanded
* Improved visual consistency for permission-restricted sections

## 1.7.4

### Changed

* Refactored section behaviour so enablement and expansion are controlled independently
* Updated disabled-state styling to apply only to section bodies rather than entire sections

### Fixed

* Fixed chevron state synchronisation when switching between packages
* Fixed inconsistencies where section bodies could be shown or hidden while the chevron displayed the wrong state
* Ensured locked sections always start collapsed with the chevron in the correct position

### Improved

* Ticking a feature checkbox automatically expands the section if it is currently collapsed
* Unticking a feature no longer collapses the section; the contents remain visible but non-interactive
* Section headers remain fully visible and interactive regardless of feature enablement state
* Disabled section bodies now use reduced opacity and block pointer interaction while preserving header functionality
* Header clicks control expansion independently of feature enablement
* Permission-locked sections prevent header-based expansion while maintaining consistent visual behaviour
* Improved consistency between section state, chevron state, and package loading behaviour

## 1.7.3

### Added

* Added a CSS-based chevron indicator for collapsible sections using a border-drawn design
* Added dark mode styling for chevron indicators

### Changed

* Updated `.tng-arrow-up` rotation to `225deg` for a cleaner upward chevron appearance
* Adjusted vertical positioning between expanded and collapsed states to keep the chevron visually centred

### Improved

* Improved visual consistency of expand/collapse indicators across all section types
* Corrected dark mode styling to use `border-color` instead of `color`
* Kept chevron state synchronised with section visibility in both editable and read-only sections
* User information sections remain collapsed by default and provide clearer visual feedback when expanded

## 1.7.2

### Fixed

* Fixed a workflow interruption when cancelling a self-block confirmation
* Replaced the early `return` in the self-block cancellation path with a control flag so execution continues to the finalisation stage
* Ensured dialog cleanup logic always runs, including restoring button states after a self-block cancellation
* Prevented the block API request from being sent when a self-block is cancelled while preserving normal dialog completion behaviour

## 1.7.1

### Fixed

* Fixed the self-block confirmation dialogue appearing for all block actions
* Added a case-insensitive self-block check so the confirmation dialogue is only shown when blocking the currently logged-in account
* Corrected the self-block cancellation log message from "Operation cancelled: Cannot block self." to "Self-block cancelled."

### Improved

* Added a dedicated **Cancel** button to the self-block confirmation dialogue
* Updated self-block confirmation wording from "attempting to block" to "about to block" for clearer, more consistent language

## 1.7.0

### Changed

* Updated header documentation to include the new feature and en-GB/sentence case style conventions
* Renumbered internal sections to accommodate the new user information feature

### Added

* Added a **Get info** button beside the username field
* Added a user information dialog with independently loading sections for:
  * Block log
  * Rights changes
  * Abuse filter log
* Added `makeDisplaySection()` helper for read-only collapsible sections
* Added `getUserInfo()` helper for retrieving and displaying user activity data

### Improved

* Enabled parallel loading of user information sources for faster retrieval
* Improved error handling so failures in one information source do not affect the others
* Added dedicated loading, empty-state, and error messages for each information section
* Integrated the new information dialog with the existing modal stack and Escape-key handling

## v1.6.1
### Changed

* Replaced floating validation notification bubbles with inline input error states displayed directly within the affected field.
* Updated `showNotification()` to apply temporary error styling and display validation messages through the input placeholder instead of creating separate notification elements.
* Simplified validation handling in username input and Start button checks by using the new `clearInputError()` helper.
* Updated section comments and documentation to reflect the revised validation system.

### Added

* Added the `clearInputError()` helper to immediately restore inputs to their normal state and cancel pending validation reset timers.
* Added `.tng-input-error` styling for validation errors, including red borders and placeholder text.
* Added dark mode support for inline validation error states.

### Removed

* Removed the `.tng-input-container` wrapper previously used to position validation notifications.
* Removed the `.tng-notification` bubble system and its associated styling.

## v1.6.0
### Added
- Added a rights panel to the dialog footer displaying the user's available permissions.
- Added automatic user rights detection using the MediaWiki API (`userinfo` rights and groups).
- Added visual status badges for Rollback and Sysop/Admin permissions.
- Added automatic section locking for actions that require unavailable rights, including Block, Delete, Protect, and Revision Deletion.
- Added lock indicators and tooltips to restricted sections.
- Added graceful fallback behaviour when user rights cannot be retrieved.

### Changed
- Updated header comments and section documentation to reflect the new rights management functionality.
- Updated the Start button state after rights checks are completed, ensuring locked sections are excluded from execution.
- Package presets can no longer re-enable sections that have been disabled due to insufficient permissions.

### Improved
- Added dedicated styling for the rights panel, including badges, loading states, lock indicators, and dark mode support.
- Improved the dialog footer layout by displaying permission information alongside action controls.
- Expanded administrator detection to support both local administrators and users with equivalent rights through global or custom permission groups.

## v1.5.9
### Added
- Added `formatApiError()` helper (Section 04) to provide plain-language hints for permission-related API failures when users lack required rights.

### Changed
- Separated talk-page notification errors from action errors in Block and Protect sections, so a failed notification no longer marks the main action as failed.
- Separated main-page and talk-page deletion errors in the Delete section, so a failed talk-page deletion does not hide a successful main-page deletion.
- Applied `formatApiError()` across all catch blocks, including Revdel, Undo, Rollback, Protect, Block, Delete, and contribution fetch operations.
- Simplified wording in block and protection notifications by removing redundant references to automation.

### Fixed
- Block notifications now display "blocked indefinitely" instead of "blocked for never".
- Block expiry messages are now shown conditionally and correctly handle indefinite blocks.
- Protection notifications no longer append an incorrect "days" suffix to expiry values.
- Protection notifications now display "protected indefinitely" instead of "protected for never".
- Protection expiry messages are now shown conditionally and correctly handle indefinite protections.

## v1.5.8
### Fixed
- Undo-skipped log messages now render in amber (warning) instead of green (success), making it clear that no undo action was applied and no page changes were made by the operation.

### Added
- Added the `tng-log-warn` CSS class for warning log entries, including dark mode support.

### Improved
- Extended `addLog()` to support a `warn` log type alongside the existing error type.
- Updated undo-skipped messages to explicitly state that the undo was not applied because the page had already been reverted by another user.

## v1.5.7
### Added
- Improved log messages when an undo operation is skipped because the page has already been reverted.

### Improved
- Improved consistency in sentence case and en-GB spelling across all interfaces and log messages.

## v1.5.6
### Added
- Automatic deletion of associated talk pages when deleting a page.

## v1.5.5
### Added
- Self-block verification step to help prevent accidental self-blocking.

## v1.5.4
### Added
- Auto-dismissing inline notification bubbles for input validation.

### Improved
- Validation notifications now automatically hide after five seconds and clear when the user updates the input.

## v1.5.3
### Added
- Integrated notification style for form validation errors.

### Changed
- Replaced standard browser alerts with built-in dialog notifications.

## v1.5.2
### Added
- Automatic user talk page notification when an account is blocked.

## v1.5.1
### Added
- Automatic talk page notification when a page is protected.

## v1.5.0
### Added
- Abort button during task execution, allowing ongoing operations to be cancelled.

## v1.4.1
### Fixed
- Fixed a user interface issue where the page protection preset reasons dropdown was incorrectly attached to the revision deletion module.

## v1.4.0
### Added
- Page protection feature with a comprehensive set of preset protection reasons.
- Confirmation dialog before executing page deletion or page protection actions.

## v1.3.0
### Added
- Preset reasons configuration array for the page protection feature.

## v1.2.0
### Fixed
- Reduced API request throttling by switching to sequential execution using native ES6 promises.
- Fixed pagination bottlenecks by explicitly handling query continuation tokens.

### Changed
- Standardised interface elements, logs, labels, and comments using sentence case and en-GB spelling.

## v1.1.0
### Added
- Optional undo fallback method for users without native rollback permissions.

### Changed
- Reduced the height of the progress log to improve screen space utilisation.
