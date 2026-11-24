/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — DOM and formatting helpers module
 * ============================================================================
 * PURPOSE:
 * Provides standardised DOM element builders (form rows, inputs, selects,
 * filterable selects, multi-select checkbox comboboxes, checkboxes, buttons,
 * collapsible sections), inline field validation helpers, and text/error
 * formatting utilities for Tengu.js.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]] and exposed as
 * window.TenguDOM.create(), returning:
 *   - makeRow(labelText)
 *   - makeSelect(items, cls)
 *   - wrapSelect(sel, flex)
 *   - makeFilteredSelect(sel)
 *   - makeCheckboxCombobox(items, placeholderText)
 *   - makeInput(placeholder, cls)
 *   - makeCheckbox(labelText, checked)
 *   - makeBtn(label, variant)
 *   - makeSection(title, icon, enabledByDefault)
 *   - showNotification(parent, message)
 *   - clearInputError(inp)
 *   - formatApiError(rawError)
 *   - withToolTag(text, tag)
 *   - translateDurationId(duration)
 *   - makeDisplaySection(title, icon)
 *
 * DEPENDENCIES:
 * Browser DOM APIs and styles defined in [[Pengguna:Rachmat04/Tengu.css]].
 * No dependencies on Tengu.js internals.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  window.TenguDOM = {
    create: function () {
      function makeRow(labelText) {
        const row = document.createElement("div");
        row.className = "tng-row";
        const lbl = document.createElement("label");
        lbl.className = "tng-label";
        lbl.textContent = labelText;
        const field = document.createElement("div");
        field.className = "tng-field";
        row.appendChild(lbl);
        row.appendChild(field);
        return { row, field };
      }

      function makeSelect(items, cls) {
        const sel = document.createElement("select");
        sel.className = "tng-select" + (cls ? " " + cls : "");
        for (const item of items) {
          if (item.group) {
            const og = document.createElement("optgroup");
            og.label = item.group;
            for (const sub of item.items) {
              const opt = document.createElement("option");
              opt.value = sub.value;
              opt.textContent = sub.label;
              og.appendChild(opt);
            }
            sel.appendChild(og);
          } else {
            const opt = document.createElement("option");
            opt.value = item.value !== undefined ? item.value : item.label;
            opt.textContent = item.label;
            sel.appendChild(opt);
          }
        }
        return sel;
      }

      // Wraps a <select> in a .tng-select-wrap container that provides the custom
      // chevron arrow via ::after. Pass a CSS flex value to apply it to the wrapper
      // when the wrapper itself is a flex item (e.g. in a flex row alongside an input).
      function wrapSelect(sel, flex) {
        const wrap = document.createElement("div");
        wrap.className = "tng-select-wrap";
        if (flex) wrap.style.flex = flex;
        wrap.appendChild(sel);
        return wrap;
      }

      // Wraps a <select> in a container with a filter text box above it.
      // Typing in the box hides non-matching options in real time; clearing it
      // restores all options. Works with both flat lists and <optgroup> elements.
      // Returns { wrap, filter } — wrap replaces the bare <select> in the DOM,
      // filter is the <input> element (exposed so callers can clear it if needed).
      function makeFilteredSelect(sel) {
        const wrap = document.createElement("div");
        wrap.className = "tng-filtered-select";

        // Filter input sits on its own row, above the select. The clear
        // control is rendered as a ✕ inside the input itself (right-aligned),
        // rather than as a separate button, so it only appears once there is
        // text to clear and does not add a second control alongside the field.
        const filterRow = document.createElement("div");
        filterRow.className = "tng-filtered-select-row";

        const filterInputWrap = document.createElement("div");
        filterInputWrap.className = "tng-filtered-select-input-wrap";

        const filter = document.createElement("input");
        filter.type = "text";
        filter.className = "tng-input tng-filtered-select-input";
        filter.placeholder = "Filter options...";
        filter.setAttribute("aria-label", "Filter options");

        // In-field clear icon — hidden until the filter has text.
        const btnClearFilter = document.createElement("button");
        btnClearFilter.type = "button";
        btnClearFilter.className = "tng-filtered-select-clear tng-hidden";
        btnClearFilter.textContent = "✕";
        btnClearFilter.title = "Clear filter";
        btnClearFilter.setAttribute("aria-label", "Clear filter");
        btnClearFilter.addEventListener("click", function () {
          filter.value = "";
          filter.dispatchEvent(new Event("input"));
          filter.focus();
        });

        filterInputWrap.appendChild(filter);
        filterInputWrap.appendChild(btnClearFilter);
        filterRow.appendChild(filterInputWrap);

        wrap.appendChild(filterRow);
        wrap.appendChild(wrapSelect(sel));

        // Collect all <option> elements once, preserving their original parent
        // (<select> or <optgroup>) so they can be moved in and out cleanly.
        const allOptions = Array.from(sel.querySelectorAll("option"));

        filter.addEventListener("input", function () {
          const query = filter.value.toLowerCase().trim();
          btnClearFilter.classList.toggle("tng-hidden", !query);

          if (!query) {
            // Restore everything in original order
            allOptions.forEach(function (opt) {
              opt.hidden = false;
            });
            // Re-show all optgroups
            Array.from(sel.querySelectorAll("optgroup")).forEach(function (og) {
              og.hidden = false;
            });
            return;
          }

          // Hide non-matching options; show matching ones
          allOptions.forEach(function (opt) {
            opt.hidden = !opt.textContent.toLowerCase().includes(query);
          });

          // Hide any optgroup whose every child option is now hidden
          Array.from(sel.querySelectorAll("optgroup")).forEach(function (og) {
            const visible = Array.from(og.querySelectorAll("option")).some(
              function (o) {
                return !o.hidden;
              },
            );
            og.hidden = !visible;
          });

          // If the currently selected option has become hidden, move focus to
          // the first visible option so the <select> value stays meaningful.
          const selectedOpt = sel.options[sel.selectedIndex];
          if (selectedOpt && selectedOpt.hidden) {
            const firstVisible = allOptions.find(function (o) {
              return !o.hidden;
            });
            if (firstVisible) sel.value = firstVisible.value;
          }
        });

        return { wrap, filter };
      }

      // Multi-select checkbox combobox: a text field that opens a dropdown
      // of checkboxes on click, letting the user select multiple options
      // at once. Used for filters (not settings/actions), where a
      // <select multiple> would require ctrl/cmd-click and hides the
      // current selection. The dropdown stays open across multiple
      // checkbox clicks and only closes when the user clicks outside it.
      // items: array of { value, label, selected }.
      // Returns { wrap, getSelectedValues(), onChange(cb) }.
      function makeCheckboxCombobox(items, placeholderText) {
        const wrap = document.createElement("div");
        wrap.className = "tng-combobox";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "tng-input tng-combobox-input";
        input.readOnly = true;
        input.placeholder = placeholderText || "Select...";

        const dropdown = document.createElement("div");
        dropdown.className = "tng-combobox-dropdown tng-hidden";

        const checkboxes = [];
        items.forEach(function (item) {
          const { wrap: rowWrap, chk } = makeCheckbox(
            item.label,
            !!item.selected,
          );
          rowWrap.className = "tng-checkrow tng-combobox-option";
          chk.dataset.comboValue = item.value;
          dropdown.appendChild(rowWrap);
          checkboxes.push({ chk, label: item.label });
        });

        function updateInputText() {
          const selectedLabels = checkboxes
            .filter(function (c) {
              return c.chk.checked;
            })
            .map(function (c) {
              return c.label;
            });
          input.value = selectedLabels.length ? selectedLabels.join(", ") : "";
        }
        updateInputText();

        let changeCallback = null;
        checkboxes.forEach(function (c) {
          c.chk.addEventListener("change", function () {
            updateInputText();
            if (changeCallback) changeCallback();
          });
        });

        function toggleDropdown(open) {
          dropdown.classList.toggle("tng-hidden", !open);
          wrap.classList.toggle("tng-combobox-open", open);
        }

        input.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleDropdown(dropdown.classList.contains("tng-hidden"));
        });

        // Clicking anywhere outside the control closes the dropdown;
        // clicks on a checkbox or its label keep it open. The listener
        // removes itself once the combobox is no longer in the document,
        // so it does not accumulate across dialogue openings.
        const onDocumentClick = function (e) {
          if (!document.body.contains(wrap)) {
            document.removeEventListener("click", onDocumentClick);
            return;
          }
          if (!wrap.contains(e.target)) toggleDropdown(false);
        };
        document.addEventListener("click", onDocumentClick);

        wrap.appendChild(input);
        wrap.appendChild(dropdown);

        return {
          wrap: wrap,
          getSelectedValues: function () {
            return checkboxes
              .filter(function (c) {
                return c.chk.checked;
              })
              .map(function (c) {
                return c.chk.dataset.comboValue;
              });
          },
          onChange: function (cb) {
            changeCallback = cb;
          },
        };
      }

      function makeInput(placeholder, cls) {
        const inp = document.createElement("input");
        inp.type = "text";
        inp.className = "tng-input" + (cls ? " " + cls : "");
        if (placeholder) inp.placeholder = placeholder;
        return inp;
      }

      function makeCheckbox(labelText, checked) {
        const wrap = document.createElement("label");
        wrap.className = "tng-checkrow";
        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.checked = !!checked;
        wrap.appendChild(chk);
        wrap.appendChild(document.createTextNode(" " + labelText));
        return { wrap, chk };
      }

      function makeBtn(label, variant) {
        const btn = document.createElement("button");
        btn.className = "tng-btn tng-btn-" + (variant || "quiet");
        btn.textContent = label;
        return btn;
      }

      function makeSection(title, icon, enabledByDefault) {
        const section = document.createElement("div");
        section.className =
          "tng-section" + (enabledByDefault ? "" : " tng-disabled");
        const hdr = document.createElement("div");
        hdr.className = "tng-section-header";
        const { wrap: chkWrap, chk: enableChk } = makeCheckbox(
          icon + " " + title,
          enabledByDefault,
        );
        enableChk.style.marginRight = "4px";
        hdr.appendChild(chkWrap);
        const arrow = document.createElement("span");
        arrow.className =
          "tng-section-arrow" + (enabledByDefault ? " tng-arrow-up" : "");
        hdr.appendChild(arrow);
        const sectionBody = document.createElement("div");
        sectionBody.className =
          "tng-section-body" + (enabledByDefault ? "" : " tng-hidden");
        section.appendChild(hdr);
        section.appendChild(sectionBody);
        // Checkbox controls enabled/disabled state only.
        // Enabling also opens the section body if it was collapsed.
        enableChk.addEventListener("change", function () {
          section.classList.toggle("tng-disabled", !enableChk.checked);
          if (enableChk.checked) {
            sectionBody.classList.remove("tng-hidden");
            arrow.classList.add("tng-arrow-up");
          }
        });
        // Header click (outside the checkbox label) toggles section open/closed.
        // Locked sections can still be expanded to view their disabled controls;
        // only the enable checkbox itself is non-interactive when locked.
        hdr.addEventListener("click", function (e) {
          if (chkWrap.contains(e.target)) return;
          const isHidden = sectionBody.classList.toggle("tng-hidden");
          arrow.classList.toggle("tng-arrow-up", !isHidden);
        });
        return { section, sectionBody, enableChk };
      }

      // Displays a validation error directly within the target input field.
      // Applies an error border and sets the placeholder to the message text,
      // then reverts automatically after 5 seconds or when the user types.
      function showNotification(parent, message) {
        const inp = parent.querySelector(".tng-input") || parent;
        if (!inp.classList.contains("tng-input-error")) {
          inp.dataset.tngOrigPlaceholder = inp.placeholder;
        }
        if (inp._tngErrTimeout) clearTimeout(inp._tngErrTimeout);
        inp.classList.add("tng-input-error");
        inp.placeholder = "⚠ " + message;
        inp._tngErrTimeout = setTimeout(function () {
          inp.classList.remove("tng-input-error");
          inp.placeholder = inp.dataset.tngOrigPlaceholder || "";
          delete inp.dataset.tngOrigPlaceholder;
        }, 5000);
      }

      // Clears an active inline field error, restoring the original placeholder.
      function clearInputError(inp) {
        if (inp._tngErrTimeout) clearTimeout(inp._tngErrTimeout);
        inp.classList.remove("tng-input-error");
        inp.placeholder = inp.dataset.tngOrigPlaceholder || "";
        delete inp.dataset.tngOrigPlaceholder;
      }

      // Formats a raw API error string with a plain-language hint when the error
      // indicates a permission problem. Helps users understand why an action failed —
      // particularly when they lack the rights required for block, protect, delete,
      // revdel, or oversight operations.
      function formatApiError(rawError) {
        const e = String(rawError);
        const permissionCodes = [
          "permissiondenied",
          "noedit",
          "notallowed",
          "blocked",
          "autoblocked",
          "protectedpage",
          "cascadeprotected",
          "nosuppress",
          "badaccess-groups",
        ];
        for (const code of permissionCodes) {
          if (e === code || e.startsWith(code + ":")) {
            return (
              e +
              " — you may not have the necessary permissions to perform this action."
            );
          }
        }
        return e;
      }

      // Joins a reason/summary string with the tool attribution tag, but only
      // inserts the " · " separator when there is actual reason text. Without
      // this, an empty reason produced a summary reading " · ⛩️" — a visible
      // separator with nothing in front of it.
      function withToolTag(text, tag) {
        return text && text.trim() ? text + tag : tag.replace(/^\s*·\s*/, "");
      }

      // Translates a MediaWiki duration string into Indonesian for use in
      // Indonesian-language notifications. Returns the original string unchanged
      // if no mapping is found.
      function translateDurationId(duration) {
        if (!duration) return duration;
        const units = {
          second: "detik",
          seconds: "detik",
          minute: "menit",
          minutes: "menit",
          hour: "jam",
          hours: "jam",
          day: "hari",
          days: "hari",
          week: "minggu",
          weeks: "minggu",
          month: "bulan",
          months: "bulan",
          year: "tahun",
          years: "tahun",
        };
        return duration.replace(
          /(\d+)\s*(seconds|second|minutes|minute|hours|hour|days|day|weeks|week|months|month|years|year)/gi,
          function (_, n, unit) {
            return n + " " + (units[unit.toLowerCase()] || unit);
          },
        );
      }

      // Creates a read-only collapsible section without an enable/disable checkbox.
      // Used by the user and page info panels to display log entries in an expandable container.
      function makeDisplaySection(title, icon) {
        const section = document.createElement("div");
        section.className = "tng-section";
        const hdr = document.createElement("div");
        hdr.className = "tng-section-header";
        const titleSpan = document.createElement("span");
        titleSpan.textContent = icon + " " + title;
        hdr.appendChild(titleSpan);
        const arrow = document.createElement("span");
        arrow.className = "tng-section-arrow";
        hdr.appendChild(arrow);
        const sectionBody = document.createElement("div");
        sectionBody.className = "tng-section-body tng-hidden";
        sectionBody.style.maxHeight = "360px";
        hdr.addEventListener("click", function () {
          const isHidden = sectionBody.classList.toggle("tng-hidden");
          arrow.classList.toggle("tng-arrow-up", !isHidden);
        });
        section.appendChild(hdr);
        section.appendChild(sectionBody);
        return { section, sectionBody, arrow };
      }

      return {
        makeRow: makeRow,
        makeSelect: makeSelect,
        wrapSelect: wrapSelect,
        makeFilteredSelect: makeFilteredSelect,
        makeCheckboxCombobox: makeCheckboxCombobox,
        makeInput: makeInput,
        makeCheckbox: makeCheckbox,
        makeBtn: makeBtn,
        makeSection: makeSection,
        showNotification: showNotification,
        clearInputError: clearInputError,
        formatApiError: formatApiError,
        withToolTag: withToolTag,
        translateDurationId: translateDurationId,
        makeDisplaySection: makeDisplaySection,
      };
    },
  };
})();
// </nowiki>
