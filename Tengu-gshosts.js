/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Global sysops host list
 * ============================================================================
 * PURPOSE:
 * Provides the list of wikis known to fall outside the scope of the global
 * sysops service. Tengu.js uses it to decide whether the "Report to Global
 * sysops/Requests" section is available on the current wiki. This list is the
 * only source of global sysops eligibility, so it must be kept accurate and up
 * to date; there is no API-based fallback.
 * Consumed by Tengu.js; exposes window.TenguGSHosts.get().
 *
 * The module has no dependencies. get() returns a new Set of hostnames, so a
 * caller cannot change the list used by another caller.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
(function () {
  "use strict";

  window.TenguGSHosts = {
    /**
     * Returns the hostnames of wikis outside the scope of the global sysops
     * service.
     *
     * @returns {Set<string>}  Set of hostnames, for example "en.wikipedia.org".
     */
    get: function () {
      return new Set([
        "an.wikipedia.org",
        "ar.wikipedia.org",
        "bg.wikipedia.org",
        "bn.wikipedia.org",
        "ca.wikipedia.org",
        "cs.wikipedia.org",
        "cy.wikipedia.org",
        "da.wikipedia.org",
        "de.wikipedia.org",
        "el.wikipedia.org",
        "en.wikipedia.org",
        "eo.wikipedia.org",
        "es.wikipedia.org",
        "et.wikipedia.org",
        "eu.wikipedia.org",
        "fa.wikipedia.org",
        "fi.wikipedia.org",
        "fr.wikipedia.org",
        "he.wikipedia.org",
        "hr.wikipedia.org",
        "hu.wikipedia.org",
        "id.wikipedia.org",
        "is.wikipedia.org",
        "it.wikipedia.org",
        "ja.wikipedia.org",
        "ka.wikipedia.org",
        "ko.wikipedia.org",
        "lv.wikipedia.org",
        "mk.wikipedia.org",
        "ml.wikipedia.org",
        "mr.wikipedia.org",
        "nl.wikipedia.org",
        "nn.wikipedia.org",
        "no.wikipedia.org",
        "pl.wikipedia.org",
        "pt.wikipedia.org",
        "ro.wikipedia.org",
        "ru.wikipedia.org",
        "simple.wikipedia.org",
        "sk.wikipedia.org",
        "sl.wikipedia.org",
        "sv.wikipedia.org",
        "ta.wikipedia.org",
        "te.wikipedia.org",
        "th.wikipedia.org",
        "tr.wikipedia.org",
        "ur.wikipedia.org",
        "zh.wikipedia.org",
        "zh-yue.wikipedia.org",
        "cs.wiktionary.org",
        "de.wiktionary.org",
        "en.wiktionary.org",
        "fr.wiktionary.org",
        "nl.wiktionary.org",
        "pl.wiktionary.org",
        "de.wikisource.org",
        "en.wikisource.org",
        "fr.wikisource.org",
        "he.wikisource.org",
        "pl.wikisource.org",
        "wikisource.org",
        "de.wikivoyage.org",
        "commons.wikimedia.org",
        "www.wikidata.org",
        "meta.wikimedia.org",
        "login.wikimedia.org",
        "pl.wikimedia.org",
        "se.wikimedia.org",
        "test.wikipedia.org",
      ]);
    },
  };
})();
// </nowiki>
