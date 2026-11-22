/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Select specific edits/pages picker module
 * ============================================================================
 * PURPOSE:
 * Provides the "Select specific edits/pages" picker dialogue (user mode). It
 * fetches the target user's full contribution history, groups it into edited
 * pages and created pages, and lets the user choose items with namespace
 * filtering, sorting, and bulk selection controls.
 * Consumed by Tengu.js; exposes window.TenguPicker.create(deps).
 *
 * The module depends only on the helpers passed in by Tengu.js:
 * createDialog(opts), makeBtn(label, variant), makeRow(labelText),
 * makeCheckbox(labelText, checked), makeCheckboxCombobox(items, placeholder),
 * apiGet(params) and formatApiError(err). create(deps) returns the async
 * function openEditsPicker(pickerTarget, initialSelection, onConfirm).
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguPicker = {
    create: function (deps) {
      const createDialog = deps.createDialog;
      const makeBtn = deps.makeBtn;
      const makeRow = deps.makeRow;
      const makeCheckbox = deps.makeCheckbox;
      const makeCheckboxCombobox = deps.makeCheckboxCombobox;
      const apiGet = deps.apiGet;
      const formatApiError = deps.formatApiError;

      return async function openEditsPicker(
        pickerTarget,
        initialSelection,
        onConfirm,
      ) {
        const prevPageEdits =
          (initialSelection && initialSelection.selectedPageEdits) || {};
        const prevCreations =
          (initialSelection && initialSelection.selectedCreations) || [];

        const {
          overlay: pickerOverlay,
          body: pickerBody,
          footer: pickerFooter,
        } = createDialog({
          title: "Select edits/pages — " + pickerTarget,
          icon: "🔎",
          child: true,
        });

        const loadingEl = document.createElement("div");
        loadingEl.className = "tng-info-loading";
        loadingEl.textContent = "Fetching contributions...";
        pickerBody.appendChild(loadingEl);

        let pickerContribs = [];

        try {
          let continueToken = {};
          let fetching = true;
          while (fetching) {
            const params = Object.assign(
              {
                action: "query",
                list: "usercontribs",
                ucuser: pickerTarget,
                ucprop: "ids|title|timestamp|flags",
                uclimit: "max",
              },
              continueToken,
            );
            const data = await apiGet(params);
            if (data.query && data.query.usercontribs) {
              pickerContribs = pickerContribs.concat(data.query.usercontribs);
              loadingEl.textContent =
                "Fetching contributions... (" +
                pickerContribs.length +
                " so far)";
            }
            if (data.continue) {
              continueToken = data.continue;
            } else {
              fetching = false;
            }
          }
        } catch (e) {
          loadingEl.className = "tng-log-err";
          loadingEl.style.padding = "6px 0";
          loadingEl.textContent =
            "Failed to fetch contributions: " + formatApiError(e);
          const btnClose = makeBtn("Close", "quiet");
          btnClose.addEventListener("click", function () {
            pickerOverlay.closeHandler();
          });
          pickerFooter.appendChild(btnClose);
          return;
        }

        pickerBody.removeChild(loadingEl);

        // Group contributions into edited pages and created pages,
        // using the same split as work().
        const pickerEditedPages = {};
        const pickerCreatedPages = {};

        for (const edit of pickerContribs) {
          if (edit.new === "") {
            if (!pickerCreatedPages[edit.title]) {
              pickerCreatedPages[edit.title] = {
                timestamp: edit.timestamp,
              };
            }
          } else {
            if (!pickerEditedPages[edit.title]) {
              pickerEditedPages[edit.title] = {
                revids: [],
                latest: edit.revid,
                oldestParent: edit.parentid,
                timestamp: edit.timestamp,
              };
            }
            pickerEditedPages[edit.title].revids.push(edit.revid);
            pickerEditedPages[edit.title].oldestParent = edit.parentid;
          }
        }

        const pickerEditedTitles = Object.keys(pickerEditedPages).sort();
        const pickerCreatedTitles = Object.keys(pickerCreatedPages).sort();

        if (!pickerEditedTitles.length && !pickerCreatedTitles.length) {
          const emptyEl = document.createElement("div");
          emptyEl.className = "tng-info-empty";
          emptyEl.textContent = "No contributions found for this user.";
          pickerBody.appendChild(emptyEl);
          const btnClose = makeBtn("Close", "quiet");
          btnClose.addEventListener("click", function () {
            pickerOverlay.closeHandler();
          });
          pickerFooter.appendChild(btnClose);
          return;
        }

        // Collect the namespaces present across all fetched titles so the
        // filter row only shows namespaces that are actually in the results.
        const formattedNamespaces =
          mw.config.get("wgFormattedNamespaces") || {};
        const presentNsIds = new Set();
        for (const title of [...pickerEditedTitles, ...pickerCreatedTitles]) {
          let nsId = 0;
          try {
            nsId = new mw.Title(title).getNamespaceId();
          } catch (e) {
            /* empty */
          }
          presentNsIds.add(nsId);
        }
        const sortedNsIds = [...presentNsIds].sort(function (a, b) {
          return a - b;
        });

        // Bordered section holding the filtering and sorting controls,
        // using the same .tng-recreation-group style and form-row
        // structure as the Export edits dialogue. It is always created,
        // since the sort controls are needed even when the results span
        // a single namespace; only the namespace row is conditional.
        const filterGroupPicker = document.createElement("div");
        filterGroupPicker.className = "tng-recreation-group";
        pickerBody.appendChild(filterGroupPicker);

        let nsComboboxPicker = null;
        if (sortedNsIds.length > 1) {
          const { row: rowPickerNs, field: fieldPickerNs } = makeRow(
            "Filter by namespace",
          );
          // wgFormattedNamespaces returns an empty string for the main
          // namespace (ID 0); fall back to "Main" in that case.
          const nsItemsPicker = sortedNsIds.map(function (nsId) {
            return {
              value: String(nsId),
              label: formattedNamespaces[nsId] || "Main",
              selected: true,
            };
          });
          nsComboboxPicker = makeCheckboxCombobox(
            nsItemsPicker,
            "Select namespaces...",
          );
          nsComboboxPicker.wrap.style.flex = "1";
          fieldPickerNs.appendChild(nsComboboxPicker.wrap);
          filterGroupPicker.appendChild(rowPickerNs);
        }

        function fmtPickerDate(ts) {
          if (!ts) return "";
          const d = new Date(ts);
          return isNaN(d.getTime())
            ? ""
            : d.toUTCString().replace("GMT", "UTC");
        }

        // Builds a collapsible section with select-all / deselect-all
        // controls and one checkbox per item.
        function makePickerSection(sectionTitle, items, labelFn, tsFn) {
          const sec = document.createElement("div");
          sec.className = "tng-section";

          const hdr = document.createElement("div");
          hdr.className = "tng-section-header";
          const titleSpan = document.createElement("span");
          titleSpan.textContent = sectionTitle + " (" + items.length + ")";
          hdr.appendChild(titleSpan);
          const arrow = document.createElement("span");
          arrow.className = "tng-section-arrow tng-arrow-up";
          hdr.appendChild(arrow);

          const secBody = document.createElement("div");
          secBody.className = "tng-section-body";
          secBody.style.maxHeight = "280px";

          hdr.addEventListener("click", function () {
            const hidden = secBody.classList.toggle("tng-hidden");
            arrow.classList.toggle("tng-arrow-up", !hidden);
          });

          const ctrlRow = document.createElement("div");
          ctrlRow.style.cssText =
            "display: flex; gap: 6px; align-items: center; margin-bottom: 6px;";
          const btnAll = makeBtn("Select all", "quiet");
          btnAll.className += " tng-btn-sm";
          const btnNone = makeBtn("Deselect all", "quiet");
          btnNone.className += " tng-btn-sm";
          const btnInvert = makeBtn("Invert selection", "quiet");
          btnInvert.className += " tng-btn-sm";

          // Live count of currently ticked checkboxes in this section,
          // shown separately from the section heading's total-item count.
          const selCountEl = document.createElement("span");
          selCountEl.className = "tng-help";
          selCountEl.style.cssText = "margin: 0 0 0 auto;";
          function updateSelCount() {
            const n = checkboxes.filter(function (c) {
              return c.checked;
            }).length;
            selCountEl.textContent =
              n + " of " + checkboxes.length + " selected";
          }

          const checkboxes = [];
          const listEl = document.createElement("div");
          listEl.style.cssText =
            "display: flex; flex-direction: column; gap: 4px;";

          for (const item of items) {
            const { wrap, chk } = makeCheckbox(labelFn(item), false);
            chk.dataset.pickerKey = item;
            // Store the title and timestamp on the wrapper for sorting.
            wrap.dataset.pickerKey = item;
            if (tsFn) wrap.dataset.pickerTimestamp = tsFn(item) || "";
            // Store the namespace ID on the wrapper so the namespace
            // filter can show/hide rows without re-parsing titles.
            let itemNsId = 0;
            try {
              itemNsId = new mw.Title(item).getNamespaceId();
            } catch (e) {
              /* empty */
            }
            wrap.dataset.pickerNsId = String(itemNsId);
            checkboxes.push(chk);
            listEl.appendChild(wrap);
          }

          // Shift-click range selection resolved from listEl's live DOM order
          // so ranges stay accurate even after sorting or namespace filtering.
          let lastClickedChk = null;
          function visibleBoxesInDomOrder() {
            return Array.from(listEl.children)
              .filter(function (wrap) {
                return !wrap.classList.contains("tng-hidden");
              })
              .map(function (wrap) {
                return wrap.querySelector('input[type="checkbox"]');
              });
          }
          checkboxes.forEach(function (chk) {
            chk.addEventListener("click", function (e) {
              const visibleBoxes = visibleBoxesInDomOrder();
              const currentIndex = visibleBoxes.indexOf(chk);
              const lastIndex = lastClickedChk
                ? visibleBoxes.indexOf(lastClickedChk)
                : -1;
              if (e.shiftKey && lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                const checkedState = chk.checked;
                for (let i = start; i <= end; i++) {
                  visibleBoxes[i].checked = checkedState;
                }
              }
              if (currentIndex !== -1) lastClickedChk = chk;
              updateSelCount();
            });
            // Also covers keyboard-driven toggles (space bar).
            chk.addEventListener("change", updateSelCount);
          });

          // Bulk-action buttons operate only on currently visible items so that
          // namespace filtering does not silently affect hidden selections.
          btnAll.addEventListener("click", function () {
            checkboxes.forEach(function (c) {
              if (!c.parentElement.classList.contains("tng-hidden")) {
                c.checked = true;
              }
            });
            updateSelCount();
          });
          btnNone.addEventListener("click", function () {
            checkboxes.forEach(function (c) {
              if (!c.parentElement.classList.contains("tng-hidden")) {
                c.checked = false;
              }
            });
            updateSelCount();
          });
          btnInvert.addEventListener("click", function () {
            checkboxes.forEach(function (c) {
              if (!c.parentElement.classList.contains("tng-hidden")) {
                c.checked = !c.checked;
              }
            });
            updateSelCount();
          });

          ctrlRow.appendChild(btnAll);
          ctrlRow.appendChild(btnNone);
          ctrlRow.appendChild(btnInvert);
          ctrlRow.appendChild(selCountEl);
          secBody.appendChild(ctrlRow);
          secBody.appendChild(listEl);
          sec.appendChild(hdr);
          sec.appendChild(secBody);

          updateSelCount();

          return { sec, checkboxes, listEl, updateSelCount };
        }

        // Sort controls — placed inside the bordered filter section
        // above the picker sections so they are immediately visible.
        const { row: sortRow, field: fieldPickerSort } = makeRow("Sort by");
        const sortBtnGroup = document.createElement("div");
        sortBtnGroup.className = "tng-export-toggle-group";

        const btnSortAlpha = makeBtn("A–Z", "quiet");
        btnSortAlpha.className += " tng-export-toggle-btn";
        btnSortAlpha.title = "Sort alphabetically by page title (A to Z)";
        const btnSortZA = makeBtn("Z–A", "quiet");
        btnSortZA.className += " tng-export-toggle-btn";
        btnSortZA.title = "Sort alphabetically by page title (Z to A)";
        const btnSortOldest = makeBtn("Oldest first", "quiet");
        btnSortOldest.className += " tng-export-toggle-btn";
        btnSortOldest.title =
          "Sort by date/time, oldest edits or creations first";
        const btnSortNewest = makeBtn("Newest first", "quiet");
        btnSortNewest.className += " tng-export-toggle-btn";
        btnSortNewest.title =
          "Sort by date/time, newest edits or creations first";
        sortBtnGroup.appendChild(btnSortAlpha);
        sortBtnGroup.appendChild(btnSortZA);
        sortBtnGroup.appendChild(btnSortOldest);
        sortBtnGroup.appendChild(btnSortNewest);
        fieldPickerSort.appendChild(sortBtnGroup);
        filterGroupPicker.appendChild(sortRow);

        function setSortActive(activeBtn) {
          [btnSortAlpha, btnSortZA, btnSortOldest, btnSortNewest].forEach(
            function (b) {
              b.classList.remove("tng-btn-primary");
              b.classList.add("tng-btn-quiet");
            },
          );
          activeBtn.classList.remove("tng-btn-quiet");
          activeBtn.classList.add("tng-btn-primary");
        }

        function sortPickerListEl(listEl, compareFn) {
          if (!listEl) return;
          const items = Array.from(listEl.children);
          items.sort(compareFn);
          items.forEach(function (item) {
            listEl.appendChild(item);
          });
        }

        btnSortAlpha.addEventListener("click", function () {
          setSortActive(btnSortAlpha);
          const cmp = function (a, b) {
            return (a.dataset.pickerKey || "").localeCompare(
              b.dataset.pickerKey || "",
              undefined,
              { sensitivity: "base" },
            );
          };
          sortPickerListEl(listElEdited, cmp);
          sortPickerListEl(listElCreated, cmp);
        });

        btnSortZA.addEventListener("click", function () {
          setSortActive(btnSortZA);
          const cmp = function (a, b) {
            return (b.dataset.pickerKey || "").localeCompare(
              a.dataset.pickerKey || "",
              undefined,
              { sensitivity: "base" },
            );
          };
          sortPickerListEl(listElEdited, cmp);
          sortPickerListEl(listElCreated, cmp);
        });

        btnSortOldest.addEventListener("click", function () {
          setSortActive(btnSortOldest);
          const cmp = function (a, b) {
            const ta = a.dataset.pickerTimestamp || "";
            const tb = b.dataset.pickerTimestamp || "";
            if (!ta && !tb) return 0;
            if (!ta) return 1;
            if (!tb) return -1;
            return ta < tb ? -1 : ta > tb ? 1 : 0;
          };
          sortPickerListEl(listElEdited, cmp);
          sortPickerListEl(listElCreated, cmp);
        });

        btnSortNewest.addEventListener("click", function () {
          setSortActive(btnSortNewest);
          const cmp = function (a, b) {
            const ta = a.dataset.pickerTimestamp || "";
            const tb = b.dataset.pickerTimestamp || "";
            if (!ta && !tb) return 0;
            if (!ta) return 1;
            if (!tb) return -1;
            return ta > tb ? -1 : ta < tb ? 1 : 0;
          };
          sortPickerListEl(listElEdited, cmp);
          sortPickerListEl(listElCreated, cmp);
        });

        const allEditedCheckboxes = [];
        const allCreatedCheckboxes = [];
        let listElEdited = null;
        let listElCreated = null;

        if (pickerEditedTitles.length) {
          const {
            sec,
            checkboxes,
            listEl: _leEdited,
            updateSelCount: updateEditedSelCount,
          } = makePickerSection(
            "Edited pages",
            pickerEditedTitles,
            function (t) {
              const ts = pickerEditedPages[t].timestamp;
              return t + (ts ? " — " + fmtPickerDate(ts) : "");
            },
            function (t) {
              return pickerEditedPages[t].timestamp || "";
            },
          );
          listElEdited = _leEdited;
          // Pre-tick items from a previous confirmed selection.
          checkboxes.forEach(function (c) {
            if (prevPageEdits[c.dataset.pickerKey]) {
              c.checked = true;
            }
          });
          updateEditedSelCount();
          allEditedCheckboxes.push(...checkboxes);
          pickerBody.appendChild(sec);
        }

        if (pickerCreatedTitles.length) {
          const {
            sec,
            checkboxes,
            listEl: _leCreated,
            updateSelCount: updateCreatedSelCount,
          } = makePickerSection(
            "Created pages",
            pickerCreatedTitles,
            function (t) {
              const ts = pickerCreatedPages[t].timestamp;
              return t + (ts ? " — " + fmtPickerDate(ts) : "");
            },
            function (t) {
              return pickerCreatedPages[t].timestamp || "";
            },
          );
          listElCreated = _leCreated;
          // Pre-tick items from a previous confirmed selection.
          checkboxes.forEach(function (c) {
            if (prevCreations.includes(c.dataset.pickerKey)) {
              c.checked = true;
            }
          });
          updateCreatedSelCount();
          allCreatedCheckboxes.push(...checkboxes);
          pickerBody.appendChild(sec);
        }

        if (nsComboboxPicker) {
          const applyPickerNamespaceFilter = function () {
            const activeNsIds = new Set(nsComboboxPicker.getSelectedValues());
            [listElEdited, listElCreated].forEach(function (listEl) {
              if (!listEl) return;
              Array.from(listEl.children).forEach(function (wrap) {
                wrap.classList.toggle(
                  "tng-hidden",
                  !activeNsIds.has(wrap.dataset.pickerNsId),
                );
              });
            });
          };
          nsComboboxPicker.onChange(applyPickerNamespaceFilter);
        }

        const btnCancelPicker = makeBtn("Cancel", "quiet");
        btnCancelPicker.addEventListener("click", function () {
          pickerOverlay.closeHandler();
        });

        const btnConfirmPicker = makeBtn("Confirm selection", "primary");
        btnConfirmPicker.addEventListener("click", function () {
          const nextPageEdits = {};
          const nextCreations = [];
          allEditedCheckboxes.forEach(function (c) {
            if (c.checked) {
              nextPageEdits[c.dataset.pickerKey] =
                pickerEditedPages[c.dataset.pickerKey];
            }
          });
          allCreatedCheckboxes.forEach(function (c) {
            if (c.checked) {
              nextCreations.push(c.dataset.pickerKey);
            }
          });
          if (typeof onConfirm === "function") {
            onConfirm({
              selectedPageEdits: nextPageEdits,
              selectedCreations: nextCreations,
            });
          }
          pickerOverlay.closeHandler();
        });

        pickerFooter.appendChild(btnCancelPicker);
        pickerFooter.appendChild(btnConfirmPicker);
      };
    },
  };
})();
// </nowiki>
