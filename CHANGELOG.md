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
