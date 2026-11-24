/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Link-fix module
 * ============================================================================
 * PURPOSE:
 * Provides the ✨ "Fix links in reason" button shown beside reason fields. It
 * rewrites recognised wiki URLs and diff URLs inside a reason string into
 * wikilinks, and optionally adds an interwiki prefix for text that is
 * submitted to Meta-Wiki.
 * The .tng-linkfix-row, .tng-linkfix-btn and tng-linkfix-pulse styles stay in
 * Tengu.css.
 *
 * CONSUMER AND EXPOSED INTERFACE:
 * Loaded by [[Pengguna:Rachmat04/Tengu.js]]. Exposes
 * window.TenguLinkFix.create(), which returns an object containing
 * deriveInterwikiPrefix(server), correctReasonLinks(text, forMeta),
 * makeLinkFixButton(inputEl, forMeta) and
 * wrapReasonInputWithLinkFix(inputEl, forMeta).
 *
 * DEPENDENCIES:
 * Browser DOM APIs. No dependencies on Tengu.js internals.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguLinkFix = {
    create: function () {
      // Derives an interwiki prefix (project + language, e.g. "w:id:" or
      // "s:en:") from an arbitrary wiki server hostname. Returns an empty
      // string if no mapping is found. The mapping covers common Wikimedia
      // project subdomain patterns and a few language-independent sister
      // projects, but has not been independently confirmed against every
      // Wikimedia project's interwiki table.
      function deriveInterwikiPrefix(server) {
        server = (server || "").replace(/^(?:https?:)?\/\//, "");
        const SISTER_PROJECT_PREFIXES = {
          wikipedia: "w",
          wiktionary: "wikt",
          wikibooks: "b",
          wikinews: "n",
          wikiquote: "q",
          wikisource: "s",
          wikiversity: "v",
          wikivoyage: "voy",
        };
        const NO_LANG_HOSTS = {
          "commons.wikimedia.org": "c:",
          "www.wikidata.org": "d:",
          "meta.wikimedia.org": "m:",
          "species.wikimedia.org": "species:",
          "incubator.wikimedia.org": "incubator:",
          "www.wikifunctions.org": "f:",
          "www.mediawiki.org": "mw:",
          "foundation.wikimedia.org": "foundation:",
          "outreach.wikimedia.org": "outreach:",
          "wikimania.wikimedia.org": "wikimania:",
          "wikitech.wikimedia.org": "wikitech:",
        };
        if (NO_LANG_HOSTS[server]) return NO_LANG_HOSTS[server];

        const hostParts = server.split(".");
        if (hostParts.length >= 3 && SISTER_PROJECT_PREFIXES[hostParts[1]]) {
          return (
            SISTER_PROJECT_PREFIXES[hostParts[1]] + ":" + hostParts[0] + ":"
          );
        }
        return "";
      }

      // Rewrites recognised wiki-links and diff URLs within a reason
      // string. Only the recognised link patterns are touched; everything
      // else in the string is left exactly as entered.
      //
      // Patterns handled:
      //   1. Diff URLs (index.php?...diff=X&oldid=Y, any parameter order,
      //      numeric IDs or "cur"/"prev") -> [[Special:Diff/oldid/diff]]
      //   2. [[https://<wiki>/wiki/Title#Fragment]] -> [[Title#Fragment]]
      //   3. [[Title#A_B_C]] (already bracketed, no URL) -> [[Title#A B C]]
      //
      // forMeta: when true, recognised links are prefixed with the source
      // wiki's interwiki project/language (e.g. "w:id:"), derived from the
      // hostname in the original URL, and an explicit pipe label is added.
      function correctReasonLinks(text, forMeta) {
        if (!text) return text;
        let result = text;

        function safeDecode(s) {
          try {
            return decodeURIComponent(s);
          } catch (e) {
            return s;
          }
        }

        // label is the original custom link label, if the source link had
        // one. When present, it is kept as the displayed text and the
        // target is not repeated as a second label.
        function wrapLink(target, host, label) {
          const hasLabel = label !== undefined && label !== "";
          if (!forMeta) {
            return hasLabel
              ? "[[" + target + "|" + label + "]]"
              : "[[" + target + "]]";
          }
          const prefix = deriveInterwikiPrefix(host);
          if (!prefix) {
            return hasLabel
              ? "[[" + target + "|" + label + "]]"
              : "[[" + target + "]]";
          }
          return (
            "[[" + prefix + target + "|" + (hasLabel ? label : target) + "]]"
          );
        }

        // 1. Diff URLs: .../w/index.php?...diff=X...oldid=Y... (any order)
        result = result.replace(
          /https?:\/\/([^/\s\]]+)\/w\/index\.php\?[^\s\]]*/gi,
          function (match, host) {
            const qIndex = match.indexOf("?");
            if (qIndex === -1) return match;
            const params = {};
            match
              .slice(qIndex + 1)
              .split("&")
              .forEach(function (pair) {
                const eq = pair.indexOf("=");
                if (eq === -1) return;
                params[pair.slice(0, eq)] = pair.slice(eq + 1);
              });
            if (
              !Object.prototype.hasOwnProperty.call(params, "diff") ||
              !Object.prototype.hasOwnProperty.call(params, "oldid")
            ) {
              return match;
            }
            const target = "Special:Diff/" + params.oldid + "/" + params.diff;
            return wrapLink(target, host);
          },
        );

        // 2. [[https://<wiki>/wiki/Title#Fragment]] -> [[Title#Fragment]]
        //    [[https://<wiki>/wiki/Title#Fragment|label]] -> [[Title#Fragment|label]]
        // The pipe is excluded from the host, title and fragment, and the
        // optional label is captured separately, so the label is not read
        // as part of the fragment.
        result = result.replace(
          /\[\[https?:\/\/([^/\]|]+)\/wiki\/([^\]#|]+)(?:#([^\]|]+))?(?:\|([^\]]*))?\]\]/gi,
          function (match, host, title, fragment, label) {
            // Underscores in the article title are converted to spaces,
            // consistent with the fragment handling below.
            const decodedTitle = safeDecode(title).replace(/_/g, " ");
            let target = decodedTitle;
            if (fragment) {
              const decodedFragment = safeDecode(fragment).replace(/_/g, " ");
              target = decodedTitle + "#" + decodedFragment;
            }
            return wrapLink(target, host, label);
          },
        );

        // 3. [[Title#A_B_C]] (already bracketed, no URL) -> [[Title#A B C]]
        // No hostname is present in this pattern, so no project/language
        // prefix can be derived; it stays a plain local link even when
        // forMeta is set.
        result = result.replace(
          /\[\[([^\]|#]+)#([^\]|]+)\]\]/g,
          function (match, title, fragment) {
            if (/^https?:\/\//i.test(title)) return match; // Already handled above
            return "[[" + title + "#" + fragment.replace(/_/g, " ") + "]]";
          },
        );

        return result;
      }

      // Creates the ✨ "Fix links in reason" button for a given reason
      // input. Clicking it rewrites only recognised links within the
      // input's current value via correctReasonLinks(); a short scale
      // animation gives visual feedback.
      function makeLinkFixButton(inputEl, forMeta) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tng-btn tng-btn-quiet tng-btn-sm tng-linkfix-btn";
        btn.textContent = "✨";
        btn.title = "Fix links in reason";
        btn.addEventListener("click", function () {
          inputEl.value = correctReasonLinks(inputEl.value, forMeta);
          btn.classList.remove("tng-linkfix-pulse");
          void btn.offsetWidth; // Force reflow so repeated clicks re-trigger the animation
          btn.classList.add("tng-linkfix-pulse");
        });
        btn.addEventListener("animationend", function () {
          btn.classList.remove("tng-linkfix-pulse");
        });
        return btn;
      }

      // Wraps a reason input and its link-fix button on a single row,
      // placed immediately to the right of the field. Pass forMeta = true
      // for fields whose text is submitted to Meta-Wiki (GS/SRG reports and
      // permission requests).
      function wrapReasonInputWithLinkFix(inputEl, forMeta) {
        const row = document.createElement("div");
        row.className = "tng-linkfix-row";
        inputEl.style.flex = "1";
        row.appendChild(inputEl);
        row.appendChild(makeLinkFixButton(inputEl, forMeta));
        return row;
      }

      return {
        deriveInterwikiPrefix: deriveInterwikiPrefix,
        correctReasonLinks: correctReasonLinks,
        makeLinkFixButton: makeLinkFixButton,
        wrapReasonInputWithLinkFix: wrapReasonInputWithLinkFix,
      };
    },
  };
})();
// </nowiki>
