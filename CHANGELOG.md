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
