/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Export edits module
 * ============================================================================
 * PURPOSE:
 * Provides the "Export edits" dialogue (user mode). It fetches the target
 * user's full contribution history, collects the unique pages they edited,
 * and shows them as a filterable, sortable list that can be copied as a
 * wikitext numbered list.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguExportEdits.create(deps), which returns the async function
 * openExportEditsDialog(username).
 *
 * DEPENDENCIES:
 * MediaWiki globals (mw) and the helpers passed in by Tengu.js:
 * createDialog(opts), makeBtn(label, variant), makeRow(labelText),
 * makeCheckboxCombobox(items, placeholder), showNotification(parent, msg),
 * clearInputError(input), apiGet(params) and formatApiError(err).
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
window.TenguExportEdits = {
  /**
   * Returns the function that opens the dialogue.
   *
   * @param {Object} deps  Helpers supplied by Tengu.js:
   *   createDialog(opts), makeBtn(label, variant), makeRow(labelText),
   *   makeCheckboxCombobox(items, placeholder), showNotification(parent, msg),
   *   clearInputError(input), apiGet(params) and formatApiError(err).
   * @returns {Function}   Async function (username) that builds and shows the dialogue.
   */
  create: function (deps) {
    const createDialog = deps.createDialog;
    const makeBtn = deps.makeBtn;
    const makeRow = deps.makeRow;
    const makeCheckboxCombobox = deps.makeCheckboxCombobox;
    const showNotification = deps.showNotification;
    const clearInputError = deps.clearInputError;
    const apiGet = deps.apiGet;
    const formatApiError = deps.formatApiError;

    return async function openExportEditsDialog(username) {
      const {
        overlay: exportOverlay,
        body: exportBody,
        footer: exportFooter,
      } = createDialog({
        title: "Export edits — " + username,
        icon: "📋",
        child: true,
      });

      const loadingEl = document.createElement("div");
      loadingEl.className = "tng-info-loading";
      loadingEl.textContent = "Fetching contributions...";
      exportBody.appendChild(loadingEl);

      // titleNsMap stores title → namespace ID for every unique page edited.
      // allTitles preserves insertion order before sorting is applied; Set
      // deduplication removes repeated page titles. creationTitles and
      // regularEditTitles are separate Sets tracking, per title, whether
      // the user has at least one creation revision and/or at least one
      // non-creation revision there — a title can belong to both (e.g. a
      // page the user created and later also edited again). "flags" is
      // added to ucprop so each contribution's "new" property is
      // returned, matching how creations are detected elsewhere in
      // Tengu (see work()'s contribution-processing loop).
      const allTitles = new Set();
      const creationTitles = new Set();
      const regularEditTitles = new Set();
      const titleNsMap = new Map();
      // Raw per-edit records (title, ISO 8601 UTC timestamp, whether the
      // edit created the page), kept alongside the deduplicated sets
      // above so the date-range/scope filter applied on "Generate list"
      // can be computed locally without a second API fetch.
      const allContribsData = [];
      let continueToken = {};
      let fetching = true;

      try {
        while (fetching) {
          const params = Object.assign(
            {
              action: "query",
              list: "usercontribs",
              ucuser: username,
              ucprop: "title|flags|timestamp",
              uclimit: "max",
            },
            continueToken,
          );
          const data = await apiGet(params);
          if (data.query && data.query.usercontribs) {
            for (const edit of data.query.usercontribs) {
              if (!allTitles.has(edit.title)) {
                allTitles.add(edit.title);
                let nsId = 0;
                try {
                  nsId = new mw.Title(edit.title).getNamespaceId();
                } catch (e) {
                  /* empty */
                }
                titleNsMap.set(edit.title, nsId);
              }
              const isCreation = edit.new === "";
              if (isCreation) {
                creationTitles.add(edit.title);
              } else {
                regularEditTitles.add(edit.title);
              }
              allContribsData.push({
                title: edit.title,
                timestamp: edit.timestamp || "",
                isNew: isCreation,
              });
            }
            loadingEl.textContent =
              "Fetching contributions... (" +
              allTitles.size +
              " unique page" +
              (allTitles.size !== 1 ? "s" : "") +
              " found so far)";
          }
          if (data.continue) {
            continueToken = data.continue;
          } else {
            fetching = false;
          }
        }
      } catch (e) {
        exportBody.removeChild(loadingEl);
        const errEl = document.createElement("div");
        errEl.className = "tng-log-err";
        errEl.style.padding = "6px 0";
        errEl.textContent =
          "️️️⚠️️️ Failed to fetch contributions: " + formatApiError(e);
        exportBody.appendChild(errEl);
        const btnClose = makeBtn("✕ Close", "quiet");
        btnClose.addEventListener("click", function () {
          exportOverlay.closeHandler();
        });
        exportFooter.appendChild(btnClose);
        return;
      }

      exportBody.removeChild(loadingEl);

      if (!allTitles.size) {
        const emptyEl = document.createElement("div");
        emptyEl.className = "tng-info-empty";
        emptyEl.textContent = "No contributions found for this user.";
        exportBody.appendChild(emptyEl);
        const btnClose = makeBtn("✕ Close", "quiet");
        btnClose.addEventListener("click", function () {
          exportOverlay.closeHandler();
        });
        exportFooter.appendChild(btnClose);
        return;
      }

      // Date range — From/To, both in UTC. Either may be left blank for
      // an open-ended range. Changing these fields does not update the
      // list on its own; the list is only (re)generated when "Generate
      // list" below is pressed.
      const { row: rowExportRange, field: fieldExportRange } =
        makeRow("Date range (UTC)");
      const inputExportFrom = document.createElement("input");
      inputExportFrom.type = "date";
      inputExportFrom.className = "tng-input";
      inputExportFrom.style.flex = "1";
      const todayUtc = new Date().toISOString().slice(0, 10);
      inputExportFrom.max = todayUtc;
      const lblExportRangeTo = document.createElement("span");
      lblExportRangeTo.className = "tng-inline-label";
      lblExportRangeTo.textContent = "to";
      const inputExportTo = document.createElement("input");
      inputExportTo.type = "date";
      inputExportTo.className = "tng-input";
      inputExportTo.style.flex = "1";
      inputExportTo.max = todayUtc;
      const rangeGroup = document.createElement("div");
      rangeGroup.style.cssText =
        "display: flex; gap: 6px; align-items: center; width: 100%;";
      rangeGroup.appendChild(inputExportFrom);
      rangeGroup.appendChild(lblExportRangeTo);
      rangeGroup.appendChild(inputExportTo);
      fieldExportRange.appendChild(rangeGroup);

      // Bordered section holding every filtering control (date range,
      // namespace filter, scope, and sort). Reuses .tng-recreation-group,
      // the border style already used for grouped controls elsewhere in
      // Tengu. The "Generate list" button is deliberately appended to
      // exportBody, outside this group, further below.
      const filterGroup = document.createElement("div");
      filterGroup.className = "tng-recreation-group";
      exportBody.appendChild(filterGroup);
      filterGroup.appendChild(rowExportRange);

      const helpExportRange = document.createElement("div");
      helpExportRange.className = "tng-help";
      helpExportRange.textContent =
        "Leave either field blank for an open-ended range. All dates are interpreted as UTC.";
      filterGroup.appendChild(helpExportRange);

      // Namespace filter row — only rendered when results span more than one namespace.
      const formattedNamespaces = mw.config.get("wgFormattedNamespaces") || {};
      const presentNsIds = new Set(titleNsMap.values());
      const sortedNsIds = [...presentNsIds].sort(function (a, b) {
        return a - b;
      });
      // Uses a checkbox combobox (all namespaces selected by default)
      // rather than a native <select multiple>, since this control only
      // filters the list below, and a text field with a checkbox
      // dropdown shows the current selection without ctrl/cmd-click.
      let nsCombobox = null;

      if (sortedNsIds.length > 1) {
        const { row: rowExportNs, field: fieldExportNs } = makeRow(
          "Filter by namespace",
        );
        const nsItems = sortedNsIds.map(function (nsId) {
          return {
            value: String(nsId),
            label: formattedNamespaces[nsId] || "Main",
            selected: true,
          };
        });
        nsCombobox = makeCheckboxCombobox(nsItems, "Select namespaces...");
        nsCombobox.wrap.style.flex = "1";
        fieldExportNs.appendChild(nsCombobox.wrap);
        filterGroup.appendChild(rowExportNs);
      }

      // Scope filter — narrows the export to page creations, regular
      // (non-creation) edits, or both. "Both types of edits" is the
      // default. Selecting an option only marks it as pending; it takes
      // effect only once "Generate list" below is pressed.
      const { row: scopeRow, field: fieldScope } = makeRow("Show");
      const scopeBtnGroup = document.createElement("div");
      scopeBtnGroup.className = "tng-export-toggle-group";

      const btnScopeAll = makeBtn("Both types of edits", "primary");
      btnScopeAll.className += " tng-export-toggle-btn";
      btnScopeAll.title =
        "Include pages from both page creations and regular edits";
      const btnScopeCreations = makeBtn("New page edits", "quiet");
      btnScopeCreations.className += " tng-export-toggle-btn";
      btnScopeCreations.title = "Include only pages this user created";
      const btnScopeRegular = makeBtn("Regular edits", "quiet");
      btnScopeRegular.className += " tng-export-toggle-btn";
      btnScopeRegular.title =
        "Include only pages this user edited without creating them";
      scopeBtnGroup.appendChild(btnScopeAll);
      scopeBtnGroup.appendChild(btnScopeCreations);
      scopeBtnGroup.appendChild(btnScopeRegular);
      fieldScope.appendChild(scopeBtnGroup);
      filterGroup.appendChild(scopeRow);

      function setScopeActive(activeBtn) {
        [btnScopeAll, btnScopeCreations, btnScopeRegular].forEach(function (b) {
          b.classList.remove("tng-btn-primary");
          b.classList.add("tng-btn-quiet");
        });
        activeBtn.classList.remove("tng-btn-quiet");
        activeBtn.classList.add("tng-btn-primary");
      }

      let pendingScope = "all";
      btnScopeAll.addEventListener("click", function () {
        pendingScope = "all";
        setScopeActive(btnScopeAll);
      });
      btnScopeCreations.addEventListener("click", function () {
        pendingScope = "creation";
        setScopeActive(btnScopeCreations);
      });
      btnScopeRegular.addEventListener("click", function () {
        pendingScope = "regular";
        setScopeActive(btnScopeRegular);
      });

      // Sort controls — reorder whichever list is currently shown.
      // Sorting does not depend on the date range or scope, so it is
      // applied immediately rather than requiring "Generate list".
      const { row: sortRow, field: fieldSort } = makeRow("Sort by");
      const sortBtnGroup = document.createElement("div");
      sortBtnGroup.className = "tng-export-toggle-group";

      const btnSortAZ = makeBtn("A–Z", "primary");
      btnSortAZ.className += " tng-export-toggle-btn";
      btnSortAZ.title = "Sort alphabetically, A to Z";
      const btnSortZA = makeBtn("Z–A", "quiet");
      btnSortZA.className += " tng-export-toggle-btn";
      btnSortZA.title = "Sort alphabetically, Z to A";
      sortBtnGroup.appendChild(btnSortAZ);
      sortBtnGroup.appendChild(btnSortZA);
      fieldSort.appendChild(sortBtnGroup);
      filterGroup.appendChild(sortRow);

      // Generate button — the date range and scope above only take
      // effect once this is pressed, so the list is never regenerated
      // whilst those options are still being adjusted.
      const generateRow = document.createElement("div");
      generateRow.style.cssText = "padding: 4px 0 6px;";
      const btnGenerate = makeBtn("📋 Generate list", "primary");
      generateRow.appendChild(btnGenerate);
      exportBody.appendChild(generateRow);

      // Summary line — updated whenever the list is generated or sorted.
      const summaryEl = document.createElement("div");
      summaryEl.className = "tng-help";
      exportBody.appendChild(summaryEl);

      // Scrollable wikitext preview box.
      const listBox = document.createElement("div");
      listBox.className = "tng-log-box";
      listBox.style.height = "320px";
      exportBody.appendChild(listBox);

      function showPlaceholder() {
        listBox.innerHTML = "";
        summaryEl.textContent = "";
        const el = document.createElement("div");
        el.className = "tng-info-empty";
        el.textContent =
          'Set your date range and options above, then click "Generate list".';
        listBox.appendChild(el);
      }
      showPlaceholder();

      // Namespaces that require a colon prefix in wikilinks to render as a
      // hyperlink rather than an embedded file or a category membership tag.
      const colonPrefixNs = new Set([6, 14]); // File, Category

      function toWikiLink(title) {
        const nsId = titleNsMap.get(title) || 0;
        const prefix = colonPrefixNs.has(nsId) ? ":" : "";
        return "[[" + prefix + title + "]]";
      }

      // Returns the set of active namespace ID strings from the filter combobox,
      // or null when no filter control was rendered (single-namespace result).
      function getActiveNsIds() {
        if (!nsCombobox) return null;
        return new Set(nsCombobox.getSelectedValues());
      }

      // Titles produced by the most recent "Generate list" press.
      // Null until the first successful generation, in which case the
      // list shows the placeholder rather than any page.
      let generatedTitles = null;

      let currentSort = "az";

      function getSortedTitles(titles) {
        const copy = titles.slice();
        if (currentSort === "az") {
          copy.sort(function (a, b) {
            return a.localeCompare(b, undefined, { sensitivity: "base" });
          });
        } else {
          copy.sort(function (a, b) {
            return b.localeCompare(a, undefined, { sensitivity: "base" });
          });
        }
        return copy;
      }

      function getFilteredSortedTitles() {
        if (!generatedTitles) return [];
        const activeNs = getActiveNsIds();
        let titles = generatedTitles;
        if (activeNs) {
          titles = titles.filter(function (t) {
            return activeNs.has(String(titleNsMap.get(t) || 0));
          });
        }
        return getSortedTitles(titles);
      }

      function setSortActive(activeBtn) {
        [btnSortAZ, btnSortZA].forEach(function (b) {
          b.classList.remove("tng-btn-primary");
          b.classList.add("tng-btn-quiet");
        });
        activeBtn.classList.remove("tng-btn-quiet");
        activeBtn.classList.add("tng-btn-primary");
      }

      function renderExportList() {
        if (!generatedTitles) {
          showPlaceholder();
          return;
        }
        listBox.innerHTML = "";
        const titles = getFilteredSortedTitles();
        const total = generatedTitles.length;
        summaryEl.textContent =
          titles.length +
          " of " +
          total +
          " unique page" +
          (total !== 1 ? "s" : "") +
          " shown.";
        if (!titles.length) {
          const emptyLine = document.createElement("div");
          emptyLine.className = "tng-info-empty";
          emptyLine.textContent = "No pages match the current filter.";
          listBox.appendChild(emptyLine);
          return;
        }
        for (let i = 0; i < titles.length; i++) {
          const line = document.createElement("div");
          line.textContent = "# " + toWikiLink(titles[i]);
          listBox.appendChild(line);
        }
      }

      if (nsCombobox) {
        nsCombobox.onChange(renderExportList);
      }

      btnSortAZ.addEventListener("click", function () {
        currentSort = "az";
        setSortActive(btnSortAZ);
        renderExportList();
      });

      btnSortZA.addEventListener("click", function () {
        currentSort = "za";
        setSortActive(btnSortZA);
        renderExportList();
      });

      // Validates the From/To date fields (either may be blank for an
      // open-ended range), then computes the scope- and date-filtered
      // title list from the raw per-edit records collected during the
      // initial fetch. Comparison uses lexicographic ordering of ISO
      // 8601 UTC timestamp strings, which sorts correctly without
      // needing to parse them into Date objects. Building the result as
      // a Set before converting to an array keeps every entry unique
      // even when "Both types of edits" is selected and a page appears
      // in both the creation and regular-edit records.
      btnGenerate.addEventListener("click", function () {
        clearInputError(inputExportFrom);
        clearInputError(inputExportTo);

        const fromVal = inputExportFrom.value;
        const toVal = inputExportTo.value;
        const fromTs = fromVal ? fromVal + "T00:00:00.000Z" : null;
        const toTs = toVal ? toVal + "T23:59:59.999Z" : null;

        if (fromTs && toTs && fromTs > toTs) {
          showNotification(
            fieldExportRange,
            "The 'From' date must not be after the 'To' date.",
          );
          inputExportFrom.focus();
          return;
        }

        const scopedTitles = new Set();
        for (const c of allContribsData) {
          if (fromTs && c.timestamp && c.timestamp < fromTs) continue;
          if (toTs && c.timestamp && c.timestamp > toTs) continue;
          if (pendingScope === "creation" && !c.isNew) continue;
          if (pendingScope === "regular" && c.isNew) continue;
          scopedTitles.add(c.title);
        }
        generatedTitles = Array.from(scopedTitles);
        renderExportList();
      });

      // Footer buttons.
      const btnCopy = makeBtn("Copy as wiki links", "primary");
      btnCopy.addEventListener("click", function () {
        const titles = getFilteredSortedTitles();
        if (!titles.length) return;
        const text = titles
          .map(function (t) {
            return "# " + toWikiLink(t);
          })
          .join("\n");
        navigator.clipboard
          .writeText(text)
          .then(function () {
            const orig = btnCopy.textContent;
            btnCopy.textContent = "✔ Copied!";
            setTimeout(function () {
              btnCopy.textContent = orig;
            }, 2000);
          })
          .catch(function () {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try {
              document.execCommand("copy");
            } catch (err) {
              /* empty */
            }
            document.body.removeChild(ta);
            const orig = btnCopy.textContent;
            btnCopy.textContent = "✔ Copied!";
            setTimeout(function () {
              btnCopy.textContent = orig;
            }, 2000);
          });
      });

      const btnClose = makeBtn("Close", "quiet");
      btnClose.addEventListener("click", function () {
        exportOverlay.closeHandler();
      });

      exportFooter.appendChild(btnCopy);
      exportFooter.appendChild(btnClose);
    };
  },
};
