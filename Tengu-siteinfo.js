/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Site information module
 * ============================================================================
 * PURPOSE:
 * Provides cached lookups of wiki-specific site information that Tengu needs
 * when editing wikitext: the redirect magic word aliases, the File namespace
 * aliases, the Category namespace ID, and the Category namespace aliases.
 * Each value is fetched once per page session and then reused.
 * Consumed by Tengu.js; exposes window.TenguSiteInfo.create(deps).
 *
 * The module depends only on the apiGet helper passed in by Tengu.js:
 * apiGet(params). create(deps) returns getRedirectMagicWords(),
 * getFileNamespaceAliases(), getCategoryNamespaceId() and
 * getCategoryNamespaceAliases().
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguSiteInfo = {
    create: function (deps) {
      const apiGet = deps.apiGet;

      // Cache of localised redirect magic word aliases (e.g. "#REDIRECT",
      // "#ALIH"), fetched once via siprop=magicwords and reused for the
      // rest of the session. Falls back to the English "#REDIRECT" alias
      // alone if the request fails or the wiki's "redirect" magic word
      // entry has no aliases, so double-redirect fixing keeps working even
      // when this cannot be determined.
      let redirectMagicWordsPromise = null;
      function getRedirectMagicWords() {
        if (!redirectMagicWordsPromise) {
          redirectMagicWordsPromise = apiGet({
            action: "query",
            meta: "siteinfo",
            siprop: "magicwords",
            formatversion: 2,
          })
            .then(function (data) {
              const words = (data.query && data.query.magicwords) || [];
              const redirectWord = words.find(function (w) {
                return w.name === "redirect";
              });
              return redirectWord &&
                redirectWord.aliases &&
                redirectWord.aliases.length
                ? redirectWord.aliases
                : ["#REDIRECT"];
            })
            .catch(function () {
              return ["#REDIRECT"];
            });
        }
        return redirectMagicWordsPromise;
      }

      // Cache of this wiki's File namespace aliases (e.g. "File", "Berkas",
      // "Image"), fetched once via siprop=namespaces|namespacealiases and
      // reused for the rest of the session. Used so file references left
      // by a deleted file are recognised regardless of which recognised
      // namespace prefix was used to link them — the localised prefix
      // (e.g. "Berkas:" on Indonesian-language wikis), any other
      // registered alias, and "File:" as an English fallback, since some
      // pages on non-English wikis still use the English prefix. Adapted
      // from the namespace-alias handling used by Twinkle
      // (twinkleunlink.js), which relies on registered namespace data
      // rather than a hardcoded prefix list.
      // Falls back to ["File", "Image"] if the request fails, so
      // file-reference detection keeps working (in its English-only form)
      // even when this cannot be determined.
      let fileNamespaceAliasesPromise = null;
      function getFileNamespaceAliases() {
        if (!fileNamespaceAliasesPromise) {
          fileNamespaceAliasesPromise = apiGet({
            action: "query",
            meta: "siteinfo",
            siprop: "namespaces|namespacealiases",
            formatversion: 2,
          })
            .then(function (data) {
              const aliases = new Set(["File", "Image"]);
              const namespaces = (data.query && data.query.namespaces) || {};
              const nsInfo = namespaces["6"];
              if (nsInfo) {
                if (nsInfo.name) aliases.add(nsInfo.name);
                if (nsInfo.canonical) aliases.add(nsInfo.canonical);
              }
              const nsAliases =
                (data.query && data.query.namespacealiases) || [];
              nsAliases.forEach(function (a) {
                if (a.id === 6 && a.alias) aliases.add(a.alias);
              });
              return Array.from(aliases).filter(Boolean);
            })
            .catch(function () {
              return ["File", "Image"];
            });
        }
        return fileNamespaceAliasesPromise;
      }

      // Cache of this wiki's actual Category namespace ID, resolved from
      // live siteinfo data rather than assumed to be the conventional 14,
      // so category detection is driven by the current wiki's own
      // MediaWiki namespace configuration. Falls back to 14 (the
      // MediaWiki-wide default) if this cannot be determined.
      let categoryNamespaceIdPromise = null;
      function getCategoryNamespaceId() {
        if (!categoryNamespaceIdPromise) {
          categoryNamespaceIdPromise = apiGet({
            action: "query",
            meta: "siteinfo",
            siprop: "namespaces",
            formatversion: 2,
          })
            .then(function (data) {
              const namespaces = (data.query && data.query.namespaces) || {};
              const match = Object.keys(namespaces).find(function (key) {
                return namespaces[key].canonical === "Category";
              });
              return match ? namespaces[match].id : 14;
            })
            .catch(function () {
              return 14;
            });
        }
        return categoryNamespaceIdPromise;
      }

      // Cache of this wiki's Category namespace aliases (e.g. "Category",
      // "Kategori"), fetched once via siprop=namespaces|namespacealiases and
      // reused for the rest of the session. Used to match category tags in
      // wikitext when moving the pages of a category or removing a deleted
      // category from its members. Follows the same pattern as
      // getFileNamespaceAliases(). Falls back to ["Category"] if the
      // request fails.
      let categoryNamespaceAliasesPromise = null;
      function getCategoryNamespaceAliases() {
        if (!categoryNamespaceAliasesPromise) {
          categoryNamespaceAliasesPromise = apiGet({
            action: "query",
            meta: "siteinfo",
            siprop: "namespaces|namespacealiases",
            formatversion: 2,
          })
            .then(function (data) {
              const aliases = new Set(["Category"]);
              const namespaces = (data.query && data.query.namespaces) || {};
              const nsInfo = namespaces["14"];
              if (nsInfo) {
                if (nsInfo.name) aliases.add(nsInfo.name);
                if (nsInfo.canonical) aliases.add(nsInfo.canonical);
              }
              const nsAliases =
                (data.query && data.query.namespacealiases) || [];
              nsAliases.forEach(function (a) {
                if (a.id === 14 && a.alias) aliases.add(a.alias);
              });
              return Array.from(aliases).filter(Boolean);
            })
            .catch(function () {
              return ["Category"];
            });
        }
        return categoryNamespaceAliasesPromise;
      }

      return {
        getRedirectMagicWords: getRedirectMagicWords,
        getFileNamespaceAliases: getFileNamespaceAliases,
        getCategoryNamespaceId: getCategoryNamespaceId,
        getCategoryNamespaceAliases: getCategoryNamespaceAliases,
      };
    },
  };
})();
// </nowiki>
