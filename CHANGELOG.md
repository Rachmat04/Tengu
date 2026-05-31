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
