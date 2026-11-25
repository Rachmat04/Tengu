/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Wikitext helpers module
 * ============================================================================
 * PURPOSE:
 * Provides pure wikitext helpers. It currently holds removeBalancedFileEmbeds(),
 * which removes a whole [[File:...]] or [[Image:...]] construct for a given file
 * name, including nested wikilinks and templates in the caption, by tracking
 * bracket depth instead of using a regular expression.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguWikitext.create(), which returns an object containing
 * removeBalancedFileEmbeds(text, fileNameForMatch, fileNsAliasPattern).
 *
 * DEPENDENCIES:
 * None.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguWikitext = {
    create: function () {
      // Removes an entire [[File:...]] or [[Image:...]] construct for the given
      // file name, including any nested wikilinks or templates within its
      // caption, by tracking bracket depth rather than matching with a regex.
      // A regex such as /\[\[File:Name(?:\|[^\]]*)?\]\]/ stops at the first
      // "]]" it finds, which truncates captions that themselves contain
      // wikilinks or templates (for example "[[Bart Simpson|Bart]]" or
      // "{{small|(anjing)}}"), leaving the rest of the caption behind as stray
      // wikitext. This function instead walks forward from the opening "[[",
      // counting nested "[[" / "]]" pairs, so it finds the "]]" that actually
      // closes the file embed. Horizontal whitespace immediately before or
      // after the removed construct is also trimmed, so the removal does not
      // leave stray spaces behind.
      function removeBalancedFileEmbeds(
        text,
        fileNameForMatch,
        fileNsAliasPattern,
      ) {
        const escapedFileName = fileNameForMatch
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/[ _]/g, "[ _]");
        // fileNsAliasPattern is a pre-escaped, pipe-separated alternation of
        // every recognised File-namespace prefix on this wiki (for example
        // "File|Berkas|Image"), so embeds using any of them are matched, not
        // only the English "File"/"Image" forms. Falls back to the English
        // forms if no pattern was supplied.
        const nsPattern = fileNsAliasPattern || "[Ff]ile|[Ii]mage";
        const startRe = new RegExp(
          "\\[\\[\\s*(?:" +
            nsPattern +
            ")\\s*:\\s*" +
            escapedFileName +
            "\\s*(?:\\||\\]\\])",
          "i",
        );
        let result = text;
        let searchFrom = 0;
        while (searchFrom < result.length) {
          const remaining = result.slice(searchFrom);
          const m = startRe.exec(remaining);
          if (!m) break;
          const startIdx = searchFrom + m.index;

          // Walk forward from the opening "[[", tracking bracket depth, to find
          // the matching closing "]]" for this specific file embed, rather
          // than the first "]]" encountered.
          let depth = 0;
          let i = startIdx;
          let endIdx = -1;
          while (i < result.length - 1) {
            const two = result.substr(i, 2);
            if (two === "[[") {
              depth++;
              i += 2;
              continue;
            }
            if (two === "]]") {
              depth--;
              i += 2;
              if (depth === 0) {
                endIdx = i;
                break;
              }
              continue;
            }
            i++;
          }

          if (endIdx === -1) {
            // Unbalanced brackets; stop rather than risk corrupting content.
            break;
          }

          const before = result.slice(0, startIdx).replace(/[ \t]+$/, "");
          const after = result.slice(endIdx).replace(/^[ \t]+/, "");
          result = before + after;
          searchFrom = before.length;
        }
        return result;
      }

      return { removeBalancedFileEmbeds: removeBalancedFileEmbeds };
    },
  };
})();
// </nowiki>
