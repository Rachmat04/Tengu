/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Title case conversion module
 * ============================================================================
 * PURPOSE:
 * Provides the case-conversion buttons ("Sentence case", "lower case",
 * "UPPER CASE", "Title Case") shown below the destination title field in the
 * Move pages section. A button rewrites only the title portion of the field,
 * leaving any namespace prefix as typed, and does not submit or execute the
 * move.
 * Consumed by Tengu.js; exposes window.TenguCase.create(deps).
 *
 * The module depends only on the MediaWiki globals (mw) and the makeBtn
 * helper passed in by Tengu.js: makeBtn(label, variant). create(deps) returns
 * an object containing makeCaseButtonsRow(inputEl). The .tng-case-btn-group
 * style stays in Tengu.css.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguCase = {
    create: function (deps) {
      const makeBtn = deps.makeBtn;

      // Applies a case transform to only the title portion of a page-title
      // input field, leaving any namespace prefix (as typed) unchanged.
      // The namespace is detected via mw.Title, which parses the prefix
      // against this wiki's own configured namespace names and aliases,
      // rather than assuming an English namespace name such as "Category:".
      function applyCaseToTitleField(inputEl, transformFn) {
        const val = inputEl.value.trim();
        if (!val) return;
        let nsPrefix = "";
        let mainText = val;
        try {
          const titleObj = new mw.Title(val);
          if (titleObj.getNamespaceId() !== 0) {
            nsPrefix = titleObj.getNamespacePrefix();
            mainText = titleObj.getMainText();
          }
        } catch (e) {
          // Could not be parsed as a title; treat the whole value as the title.
        }
        inputEl.value = nsPrefix + transformFn(mainText);
        inputEl.dispatchEvent(new Event("input"));
      }

      function toSentenceCase(s) {
        if (!s) return s;
        const lower = s.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }

      function toTitleCase(s) {
        if (!s) return s;
        return s.toLowerCase().replace(/(^|\s)\S/g, function (c) {
          return c.toUpperCase();
        });
      }

      // Builds a row of case-conversion buttons ("Sentence case", "lower
      // case", "UPPER CASE", "Title Case") that modify inputEl's value
      // directly when clicked, without submitting or executing the move.
      function makeCaseButtonsRow(inputEl) {
        const wrap = document.createElement("div");
        wrap.className = "tng-case-btn-group";
        const buttons = [
          { label: "Sentence case", fn: toSentenceCase },
          { label: "lower case", fn: (s) => s.toLowerCase() },
          { label: "UPPER CASE", fn: (s) => s.toUpperCase() },
          { label: "Title Case", fn: toTitleCase },
        ];
        buttons.forEach(function (b) {
          const btn = makeBtn(b.label, "quiet");
          btn.type = "button";
          btn.className += " tng-btn-sm";
          btn.title =
            "Convert only the page title (not the namespace) to " +
            b.label.toLowerCase() +
            ".";
          btn.addEventListener("click", function () {
            applyCaseToTitleField(inputEl, b.fn);
          });
          wrap.appendChild(btn);
        });
        return wrap;
      }

      return { makeCaseButtonsRow: makeCaseButtonsRow };
    },
  };
})();
// </nowiki>
