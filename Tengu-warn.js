/**
 * ============================================================================
 * Tengu — 天狗
 * Version 2.26.4
 * User warning message definitions for the Tengu moderation tool
 * ============================================================================
 * PURPOSE:
 * Provides warning message templates posted to a user's talk page.
 * Consumed by Tengu.js; exposes window.TenguWarn.get(useIndonesian).
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
// <nowiki>
window.TenguWarn = {
  /**
   * Returns the warning message catalogue for the given language.
   *
   * @param {boolean} useIndonesian  True when the wiki is in an Indonesian-language subdomain.
   * @returns {Object}               Object containing WARN_MESSAGES array.
   */
  get: function (useIndonesian) {
    // -------------------------------------------------------------------------
    // Warning message definitions
    //
    // Each entry must have:
    //   value   {string}   Unique key — also used as the <select> option value.
    //   label   {string}   Human-readable label shown in the drop-down.
    //   en      {Function} Returns the English wikitext notice. Receives (target, extra).
    //   id      {Function} Returns the Indonesian wikitext notice. Receives (target, extra).
    //
    // `extra` is the optional additional-information string typed by the user.
    // When present it is appended after the main message body.
    // -------------------------------------------------------------------------

    // Helper: appends the optional extra line to a notice body.
    // Inserts the optional extra text immediately before the closing signature
    // (~~~~) so it appears as part of the notice body rather than after it.
    function withExtra(body, extra, useId) {
      if (!extra) return body;
      const prefix = useId
        ? "\n\nInformasi tambahan: "
        : "\n\nAdditional information: ";
      const sig = " ~~~~";
      if (body.endsWith(sig)) {
        return body.slice(0, -sig.length) + prefix + extra + sig;
      }
      return body + prefix + extra;
    }

    // Returns the restriction sentence appended before the closing appeal
    // when a notice is marked as a final warning.
    function finalSentence(useId) {
      return useId
        ? " Jika perilaku ini berlanjut, akun Anda mungkin dibatasi dari penyuntingan."
        : " If this behaviour continues, your account may be restricted from editing.";
    }

    const WARN_MESSAGES = [
      // --- Common warnings ---
      {
        group: "Common warnings",
        items: [
          // ------------------------------------------------------------------
          // Vandalism
          // ------------------------------------------------------------------
          {
            value: "vandalism",
            label: "Vandalism",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: vandalism =="
                : "== Warning: vandalism ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: vandalisme =="
                : "== Peringatan: vandalisme ==";
              const bodyEn =
                `Your recent edits to one or more pages appear to constitute [[WP:VAND|vandalism]]. Vandalism is not permitted on this wiki. Please stop making edits that damage or degrade the encyclopaedia.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda pada satu atau lebih halaman terindikasi sebagai [[WP:VAND|vandalisme]]. Vandalisme tidak diperkenankan di wiki ini. Harap hentikan suntingan yang merusak atau menurunkan kualitas ensiklopedia.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Disruptive editing
          // ------------------------------------------------------------------
          {
            value: "disruptive",
            label: "Disruptive editing",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: disruptive editing =="
                : "== Warning: disruptive editing ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penyuntingan disruptif =="
                : "== Peringatan: penyuntingan disruptif ==";
              const bodyEn =
                `Your recent edits appear to be [[WP:DE|disruptive]]. Disruptive editing interferes with the normal operation and improvement of the wiki, regardless of intent. Please review the relevant guidelines and ensure that your contributions are constructive.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini terindikasi sebagai [[WP:DE|disruptif]]. Penyuntingan disruptif mengganggu operasional dan pengembangan wiki secara normal, terlepas dari niat pelakunya. Harap tinjau panduan yang relevan dan pastikan kontribusi Anda bersifat konstruktif.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Editing tests
          // ------------------------------------------------------------------
          {
            value: "testediting",
            label: "Editing tests",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: editing tests =="
                : "== Notice: editing tests ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: uji coba penyuntingan =="
                : "== Pemberitahuan: uji coba penyuntingan ==";
              const bodyEn =
                `It appears that you may have been testing edits on one or more pages. If you would like to experiment, please use the [[WP:SANDBOX|sandbox]] instead, where test edits are welcome. Edits to live articles and other pages that do not improve their content are reverted.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Anda mungkin sedang melakukan uji coba penyuntingan pada satu atau lebih halaman. Jika ingin bereksperimen, gunakan [[WP:SANDBOX|bak pasir]] sebagai gantinya, tempat uji coba khusus. Suntingan pada halaman artikel dan halaman lain yang tidak meningkatkan kualitas konten akan dikembalikan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Removal of content / blanking
          // ------------------------------------------------------------------
          {
            value: "blanking",
            label: "Removal of content, blanking",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: removal of content =="
                : "== Warning: removal of content ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penghapusan konten =="
                : "== Peringatan: penghapusan konten ==";
              const bodyEn =
                `Your recent edits appear to have removed substantial content from one or more pages without an appropriate explanation. If the removal was intentional and you believe there is a valid reason, please provide a clear edit summary or discuss the change on the relevant talk page. Unexplained removal of content may be treated as vandalism.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menghapus konten yang substansial dari satu atau lebih halaman tanpa penjelasan yang memadai. Jika penghapusan tersebut disengaja dan Anda merasa ada alasan yang sah, harap berikan ringkasan suntingan yang jelas atau diskusikan perubahan tersebut di halaman pembicaraan yang relevan. Penghapusan konten tanpa penjelasan dapat dianggap sebagai vandalisme.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },
        ],
      },

      // --- Behaviour in articles ---
      {
        group: "Behaviour in articles",
        items: [
          // ------------------------------------------------------------------
          // Using a large language model
          // ------------------------------------------------------------------
          {
            value: "llm",
            label: "Using a large language model",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: using a large language model =="
                : "== Warning: using a large language model ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penggunaan model bahasa besar =="
                : "== Peringatan: penggunaan model bahasa besar ==";
              const bodyEn =
                `Your recent edits appear to include content generated by a [[WP:LLM|large language model]] (such as ChatGPT or a similar tool) without adequate verification or referencing. AI-generated text may contain factual errors, unsourced claims, or plagiarised material. All content added to this wiki must be verifiable and properly cited. Please review [[WP:LLM]] and [[WP:V]] before making further edits of this kind.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyertakan konten yang dihasilkan oleh [[WP:LLM|model bahasa besar]] (seperti ChatGPT atau alat serupa) tanpa verifikasi atau referensi yang memadai. Teks yang dihasilkan kecerdasan buatan dapat mengandung kesalahan faktual, klaim tanpa sumber, atau materi yang merupakan plagiarisme. Semua konten yang ditambahkan ke wiki ini harus dapat diverifikasi dan dikutip dengan benar. Harap tinjau [[WP:LLM]] dan [[WP:V]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Adding unreferenced controversial information about living persons
          // ------------------------------------------------------------------
          {
            value: "blpunref",
            label:
              "Adding unreferenced controversial information about living persons",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: unreferenced content about living persons =="
                : "== Warning: unreferenced content about living persons ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: konten tentang tokoh yang masih hidup tanpa referensi =="
                : "== Peringatan: konten tentang tokoh yang masih hidup tanpa referensi ==";
              const bodyEn =
                `Your recent edits appear to have added controversial or negative information about a living person without citing a reliable source. This is not permitted under [[WP:BLP|Wikipedia's biographies of living persons policy]]. Unsourced or poorly sourced content about living people can cause real harm and must be removed promptly. Please ensure that any such content is supported by a citation to a reliable, published source.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan informasi kontroversial atau negatif tentang orang yang masih hidup tanpa menyertakan sumber tepercaya. Hal ini tidak diperkenankan berdasarkan [[WP:BLP|kebijakan biografi tokoh yang masih hidup]]. Konten tanpa sumber atau dengan sumber yang tidak memadai tentang tokoh yang masih hidup dapat menimbulkan dampak yang jelas dan harus segera dihapus. Pastikan setiap konten semacam itu didukung oleh kutipan dari sumber tepercaya yang telah diterbitkan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Addition of defamatory content
          // ------------------------------------------------------------------
          {
            value: "defamatory",
            label: "Addition of defamatory content",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: defamatory content =="
                : "== Warning: defamatory content ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: konten yang mencemarkan nama baik =="
                : "== Peringatan: konten yang mencemarkan nama baik ==";
              const bodyEn =
                `Your recent edits appear to have added content that is defamatory or that makes unsubstantiated harmful claims about a person or organisation. This is a serious violation of [[WP:BLP|Wikipedia's biographies of living persons policy]] and may also carry legal implications. Please review [[WP:BLP]] and [[WP:DEFAMATION]] before making further edits.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan konten yang mencemarkan nama baik atau membuat klaim berbahaya yang tidak berdasar tentang seseorang atau suatu organisasi. Hal ini merupakan pelanggaran serius terhadap [[WP:BLP|kebijakan biografi tokoh yang masih hidup]] dan dapat pula berimplikasi hukum. Harap tinjau [[WP:BLP]] dan [[WP:DEFAMATION]] sebelum melakukan suntingan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Introducing deliberate factual errors
          // ------------------------------------------------------------------
          {
            value: "factualerrors",
            label: "Introducing deliberate factual errors",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: introducing deliberate factual errors =="
                : "== Warning: introducing deliberate factual errors ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penyisipan kesalahan faktual yang disengaja =="
                : "== Peringatan: penyisipan kesalahan faktual yang disengaja ==";
              const bodyEn =
                `Your recent edits appear to have introduced deliberate factual errors into one or more articles. Intentionally adding false or misleading information is a form of [[WP:VAND|vandalism]] and is not permitted on this wiki. All content must be accurate and verifiable per [[WP:V|Wikipedia's verifiability policy]]. Please review [[WP:V]] before making further edits.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyisipkan kesalahan faktual yang disengaja ke dalam satu atau lebih artikel. Menambahkan informasi yang salah atau menyesatkan secara sengaja merupakan bentuk [[WP:VAND|vandalisme]] dan tidak diperkenankan di wiki ini. Semua konten harus akurat dan dapat diverifikasi sesuai [[WP:V|kebijakan verifikasi Wikipedia]]. Harap tinjau [[WP:V]] sebelum melakukan suntingan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Introducing fringe theories
          // ------------------------------------------------------------------
          {
            value: "fringe",
            label: "Introducing fringe theories",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: introducing fringe theories =="
                : "== Warning: introducing fringe theories ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penyisipan teori pinggiran =="
                : "== Peringatan: penyisipan teori pinggiran ==";
              const bodyEn =
                `Your recent edits appear to have added content promoting a [[WP:FRINGE|fringe theory]] — a view not supported by mainstream scholarship or reliable sources. This wiki requires that article content reflect the [[WP:NPOV|neutral point of view]] and give appropriate weight to the scientific or academic consensus. Fringe views may only be included when covered proportionally by reliable, independent sources. Please review [[WP:FRINGE]] before making further edits of this kind.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan konten yang mempromosikan [[WP:FRINGE|teori pinggiran]], yaitu pandangan yang tidak didukung oleh ilmu pengetahuan arus utama atau sumber tepercaya. Wiki ini mengharuskan konten artikel mencerminkan [[WP:NPOV|sudut pandang netral]] dan memberikan bobot yang sesuai terhadap konsensus ilmiah atau akademis. Pandangan pinggiran hanya dapat disertakan apabila dicakup secara proporsional oleh sumber tepercaya dan independen. Harap tinjau [[WP:FRINGE]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Frequent or mass changes to genres without consensus or references
          // ------------------------------------------------------------------
          {
            value: "genrechanges",
            label:
              "Frequent or mass changes to genres without consensus or references",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: genre changes without consensus =="
                : "== Warning: genre changes without consensus ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: perubahan genre tanpa konsensus =="
                : "== Peringatan: perubahan genre tanpa konsensus ==";
              const bodyEn =
                `Your recent edits appear to have made frequent or large-scale changes to genre classifications in one or more articles without citing reliable sources or seeking consensus on the relevant talk page. Genre information must be supported by reliable sources, and significant changes should be discussed before being applied. Please review [[WP:BRD]] and [[WP:CONSENSUS]] before continuing.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya melakukan perubahan besar-besaran atau berulang pada klasifikasi genre di satu atau lebih artikel tanpa menyertakan sumber tepercaya atau mencari konsensus di halaman pembicaraan yang relevan. Informasi genre harus didukung oleh sumber tepercaya, dan perubahan signifikan sebaiknya didiskusikan terlebih dahulu sebelum diterapkan. Harap tinjau [[WP:BRD]] dan [[WP:CONSENSUS]] sebelum melanjutkan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Inappropriate images in articles
          // ------------------------------------------------------------------
          {
            value: "inappropriateimages",
            label: "Inappropriate images in articles",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: inappropriate images =="
                : "== Warning: inappropriate images ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: gambar yang tidak pantas dalam artikel =="
                : "== Peringatan: gambar yang tidak pantas dalam artikel ==";
              const bodyEn =
                `Your recent edits appear to have added images to one or more articles that are inappropriate, irrelevant, or do not comply with this wiki's [[WP:IUP|image use policy]]. Images must be relevant to the article content, properly licensed, and suitable for an encyclopaedia. Please review [[WP:IUP]] and [[WP:IMAGES]] before adding further images.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan gambar pada satu atau lebih artikel yang tidak pantas, tidak relevan, atau tidak mematuhi [[WP:IUP|kebijakan penggunaan gambar]] wiki ini. Gambar harus relevan dengan konten artikel, dilisensikan dengan benar, dan sesuai untuk sebuah ensiklopedia. Harap tinjau [[WP:IUP]] dan [[WP:IMAGES]] sebelum menambahkan gambar lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Using improper humour in articles
          // ------------------------------------------------------------------
          {
            value: "improperhumour",
            label: "Using improper humour in articles",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: using improper humour in articles =="
                : "== Warning: using improper humour in articles ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penggunaan humor yang tidak pantas dalam artikel =="
                : "== Peringatan: penggunaan humor yang tidak pantas dalam artikel ==";
              const bodyEn =
                `Your recent edits appear to have introduced jokes, sarcasm, or other forms of inappropriate humour into one or more articles. This wiki maintains an encyclopaedic tone throughout its content. Per [[WP:NOT|what Wikipedia is not]], it is not a place for humour, satire, or joke content. Please write in a neutral, factual, and encyclopaedic manner.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyisipkan lelucon, sarkasme, atau bentuk humor yang tidak pantas lainnya ke dalam satu atau lebih artikel. Wiki ini mempertahankan nada ensiklopedis di seluruh kontennya. Berdasarkan [[WP:NOT|apa yang bukan Wikipedia]], wiki ini bukan tempat untuk humor, satire, atau konten lelucon. Harap tulis dengan cara yang netral, faktual, dan ensiklopedis.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Adding original research
          // ------------------------------------------------------------------
          {
            value: "originalresearch",
            label: "Adding original research",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: adding original research =="
                : "== Warning: adding original research ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penambahan riset asli =="
                : "== Peringatan: penambahan riset asli ==";
              const bodyEn =
                `Your recent edits appear to have added [[WP:OR|original research]] to one or more articles. This wiki does not publish original research, personal analysis, or conclusions not supported by cited, reliable sources. All content must be verifiable and attributable to a published source per [[WP:V|Wikipedia's verifiability policy]]. Please review [[WP:OR]] and [[WP:V]] before making further edits of this kind.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan [[WP:OR|riset asli]] ke dalam satu atau lebih artikel. Wiki ini tidak menerbitkan riset asli, analisis pribadi, atau kesimpulan yang tidak didukung oleh sumber tepercaya yang dikutip. Semua konten harus dapat diverifikasi dan dikaitkan dengan sumber yang telah diterbitkan sesuai [[WP:V|kebijakan verifikasi Wikipedia]]. Harap tinjau [[WP:OR]] dan [[WP:V]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Censorship of material
          // ------------------------------------------------------------------
          {
            value: "censorship",
            label: "Censorship of material",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: censorship of material =="
                : "== Warning: censorship of material ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penyensoran materi =="
                : "== Peringatan: penyensoran materi ==";
              const bodyEn =
                `Your recent edits appear to have removed or suppressed content from one or more articles for reasons that do not align with this wiki's editorial policies. Per [[WP:CENSOR|Wikipedia is not censored]], content is not removed solely because it may be considered offensive, sensitive, or uncomfortable, provided it meets the standards of a neutral encyclopaedia. If you have concerns about specific content, please raise them on the relevant talk page rather than removing the content unilaterally.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menghapus atau menekan konten dari satu atau lebih artikel dengan alasan yang tidak sesuai dengan kebijakan editorial wiki ini. Berdasarkan [[WP:CENSOR|Wikipedia tidak disensor]], konten tidak dihapus semata-mata karena dianggap menyinggung, sensitif, atau tidak nyaman, selama memenuhi standar ensiklopedia yang netral. Jika Anda memiliki keberatan terhadap konten tertentu, harap sampaikan di halaman pembicaraan yang relevan, bukan menghapus konten tersebut secara sepihak.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Ownership of articles
          // ------------------------------------------------------------------
          {
            value: "ownership",
            label: "Ownership of articles",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: ownership of articles =="
                : "== Warning: ownership of articles ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: kepemilikan artikel =="
                : "== Peringatan: kepemilikan artikel ==";
              const bodyEn =
                `Your recent editing behaviour suggests an attitude of [[WP:OWN|ownership]] towards one or more articles. No editor owns an article on this wiki; all content is open to improvement by any editor in good standing. Repeatedly reverting the edits of other users, or treating an article as a personal space, is not consistent with collaborative editing. Please review [[WP:OWN]] and discuss any disagreements on the relevant talk page.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Perilaku penyuntingan Anda yang baru-baru ini menunjukkan sikap [[WP:OWN|kepemilikan]] terhadap satu atau lebih artikel. Tidak ada penyunting yang memiliki artikel di wiki ini. Semua konten terbuka untuk disempurnakan oleh penyunting mana pun yang beriktikad baik. Mengembalikan suntingan pengguna lain secara berulang, atau memperlakukan artikel sebagai ruang pribadi, tidak sesuai dengan semangat penyuntingan kolaboratif. Harap tinjau [[WP:OWN]] dan diskusikan ketidaksepakatan apa pun di halaman pembicaraan yang relevan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Introducing incorrect pronouns
          // ------------------------------------------------------------------
          {
            value: "incorrectpronouns",
            label: "Introducing incorrect pronouns",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: introducing incorrect pronouns =="
                : "== Warning: introducing incorrect pronouns ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penggunaan kata ganti yang tidak tepat =="
                : "== Peringatan: penggunaan kata ganti yang tidak tepat ==";
              const bodyEn =
                `Your recent edits appear to have introduced pronouns for a person that do not match those recognised under this wiki's [[WP:IDENTITY|identity policy]]. Wikipedia follows the pronouns used by reliable sources when referring to individuals, particularly for living people. Changing a subject's pronouns without sourcing is not permitted. Please review [[WP:IDENTITY]] before making further edits of this kind.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyisipkan kata ganti untuk seseorang yang tidak sesuai dengan [[WP:IDENTITY|kebijakan identitas]] wiki ini. Wikipedia mengikuti kata ganti yang digunakan oleh sumber tepercaya ketika merujuk pada individu, khususnya orang yang masih hidup. Mengubah kata ganti subjek tanpa disertai sumber tidak diperkenankan. Harap tinjau [[WP:IDENTITY]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Subtle vandalism
          // ------------------------------------------------------------------
          {
            value: "subtlevandalism",
            label: "Subtle vandalism",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: subtle vandalism =="
                : "== Warning: subtle vandalism ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: vandalisme halus =="
                : "== Peringatan: vandalisme halus ==";
              const bodyEn =
                `Your recent edits appear to constitute subtle [[WP:VAND|vandalism]] — small or difficult-to-detect changes that introduce misinformation, alter facts, or otherwise damage article quality. This type of editing is particularly harmful because it may go unnoticed for an extended period. Please stop making edits that are intended to mislead readers.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya merupakan [[WP:VAND|vandalisme halus]] — perubahan kecil atau sulit terdeteksi yang menyisipkan informasi yang salah, mengubah fakta, atau merusak kualitas artikel. Jenis penyuntingan ini sangat berbahaya karena dapat luput dari perhatian dalam waktu yang lama. Harap hentikan suntingan yang bertujuan menyesatkan pembaca.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Adding commentary to an article
          // ------------------------------------------------------------------
          {
            value: "commentary",
            label: "Adding commentary to an article",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: adding commentary to an article =="
                : "== Warning: adding commentary to an article ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penambahan komentar dalam artikel =="
                : "== Peringatan: penambahan komentar dalam artikel ==";
              const bodyEn =
                `Your recent edits appear to have added personal commentary, opinion, or editorial remarks to one or more articles. Article pages are not the appropriate place for personal views or analysis. If you wish to discuss article content, please use the article's talk page. Please review [[WP:NPOV|Wikipedia's neutral point of view policy]] and [[WP:NOT]] before making further edits of this kind.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan komentar pribadi, opini, atau catatan editorial ke dalam satu atau lebih artikel. Halaman artikel bukan tempat yang tepat untuk pandangan atau analisis pribadi. Jika Anda ingin mendiskusikan konten artikel, gunakan halaman pembicaraan artikel tersebut. Harap tinjau [[WP:NPOV|kebijakan sudut pandang netral Wikipedia]] dan [[WP:NOT]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Removal of maintenance templates
          // ------------------------------------------------------------------
          {
            value: "mainttemplates",
            label: "Removal of maintenance templates",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: removal of maintenance templates =="
                : "== Warning: removal of maintenance templates ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penghapusan templat pemeliharaan =="
                : "== Peringatan: penghapusan templat pemeliharaan ==";
              const bodyEn =
                `Your recent edits appear to have removed one or more maintenance templates from an article without resolving the underlying issue that the template was flagging. Maintenance templates serve an important function in identifying articles that require attention. Please do not remove them unless the issue they describe has been fully addressed. If you believe a template was applied incorrectly, please raise this on the relevant talk page.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menghapus satu atau lebih templat pemeliharaan dari sebuah artikel tanpa menyelesaikan masalah mendasar yang ditandai oleh templat tersebut. Templat pemeliharaan memiliki fungsi penting dalam mengidentifikasi artikel yang memerlukan perhatian. Harap tidak menghapus templat tersebut kecuali masalah yang dijelaskannya telah sepenuhnya diatasi. Jika Anda merasa sebuah templat diterapkan secara keliru, sampaikan hal ini di halaman pembicaraan yang relevan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Addition of unsourced or improperly cited material
          // ------------------------------------------------------------------
          {
            value: "unsourced",
            label: "Addition of unsourced or improperly cited material",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: unsourced or improperly cited material =="
                : "== Warning: unsourced or improperly cited material ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: materi tanpa sumber atau dengan kutipan yang tidak tepat =="
                : "== Peringatan: materi tanpa sumber atau dengan kutipan yang tidak tepat ==";
              const bodyEn =
                `Your recent edits appear to have added content to one or more articles without citing a reliable source, or with citations that do not support the claims being made. All content added to this wiki must be verifiable and attributed to a reliable, published source per [[WP:V|Wikipedia's verifiability policy]]. Please review [[WP:V]] and [[WP:CITE]] before making further edits of this kind.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan konten ke dalam satu atau lebih artikel tanpa menyertakan sumber tepercaya, atau dengan kutipan yang tidak mendukung klaim yang dibuat. Semua konten yang ditambahkan ke wiki ini harus dapat diverifikasi dan dikaitkan dengan sumber tepercaya yang telah diterbitkan sesuai [[WP:V|kebijakan verifikasi Wikipedia]]. Harap tinjau [[WP:V]] dan [[WP:CITE]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },
        ],
      },

      // --- Promotions and spam ---
      {
        group: "Promotions and spam",
        items: [
          // ------------------------------------------------------------------
          // Using Wikipedia for advertising or promotion
          // ------------------------------------------------------------------
          {
            value: "promotion",
            label: "Using Wikipedia for advertising or promotion",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: using Wikipedia for advertising or promotion =="
                : "== Warning: using Wikipedia for advertising or promotion ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penggunaan Wikipedia untuk iklan atau promosi =="
                : "== Peringatan: penggunaan Wikipedia untuk iklan atau promosi ==";
              const bodyEn =
                `Your recent edits appear to have used one or more Wikipedia pages for advertising, promotion, or other purposes that are not consistent with this wiki's mission. Wikipedia is an encyclopaedia, not a platform for marketing, self-promotion, or advocacy. Please review [[WP:NOTADVERT]] and [[WP:COI]] before making further edits of this kind.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menggunakan satu atau lebih halaman Wikipedia untuk keperluan iklan, promosi, atau tujuan lain yang tidak sesuai dengan misi wiki ini. Wikipedia adalah sebuah ensiklopedia, bukan platform untuk pemasaran, promosi diri, atau advokasi. Harap tinjau [[WP:NOTADVERT]] dan [[WP:COI]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Not adhering to neutral point of view
          // ------------------------------------------------------------------
          {
            value: "npov",
            label: "Not adhering to neutral point of view",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: not adhering to neutral point of view =="
                : "== Warning: not adhering to neutral point of view ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: tidak mematuhi sudut pandang netral =="
                : "== Peringatan: tidak mematuhi sudut pandang netral ==";
              const bodyEn =
                `Your recent edits appear to have introduced content that does not comply with [[WP:NPOV|Wikipedia's neutral point of view policy]]. All articles must represent significant viewpoints fairly and without bias, and must not promote any particular perspective. Please review [[WP:NPOV]] before making further edits of this kind.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyisipkan konten yang tidak sesuai dengan [[WP:NPOV|kebijakan sudut pandang netral Wikipedia]]. Semua artikel harus memaparkan sudut pandang yang signifikan secara adil dan tanpa bias, serta tidak boleh mendukung pandangan tertentu. Harap tinjau [[WP:NPOV]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Paid editing without disclosure under the Wikimedia Terms of Use
          // ------------------------------------------------------------------
          {
            value: "paidediting",
            label:
              "Paid editing without disclosure under the Wikimedia Terms of Use",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: paid editing without disclosure =="
                : "== Warning: paid editing without disclosure ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penyuntingan berbayar tanpa pengungkapan =="
                : "== Peringatan: penyuntingan berbayar tanpa pengungkapan ==";
              const bodyEn =
                `Your editing activity suggests that you may be engaged in [[WP:PAID|paid editing]] without having made the disclosure required under the [[wmf:Terms of Use|Wikimedia Terms of Use]]. Editors who receive payment or other compensation for their contributions are required to disclose this on their user page, on the relevant talk pages, or in their edit summaries. Please review [[WP:PAID]] and make the necessary disclosures before continuing to edit in this capacity.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Aktivitas penyuntingan Anda mengindikasikan bahwa Anda mungkin terlibat dalam [[WP:PAID|penyuntingan berbayar]] tanpa melakukan pengungkapan yang diwajibkan berdasarkan [[wmf:Terms of Use|Ketentuan Penggunaan Wikimedia]]. Penyunting yang menerima pembayaran atau kompensasi lainnya atas kontribusi mereka wajib mengungkapkan hal ini di halaman pengguna mereka, di halaman pembicaraan yang relevan, atau dalam ringkasan suntingan. Harap tinjau [[WP:PAID]] dan lakukan pengungkapan yang diperlukan sebelum melanjutkan penyuntingan dalam kapasitas ini.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Adding inappropriate external links
          // ------------------------------------------------------------------
          {
            value: "externallinks",
            label: "Adding inappropriate external links",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: adding inappropriate external links =="
                : "== Warning: adding inappropriate external links ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penambahan tautan eksternal yang tidak sesuai =="
                : "== Peringatan: penambahan tautan eksternal yang tidak sesuai ==";
              const bodyEn =
                `Your recent edits appear to have added external links that do not comply with [[WP:EL|Wikipedia's external links guideline]]. External links should only be included where they provide significant additional value beyond the article's content; they must not be used for promotion, advertising, or to direct readers to sites of dubious reliability. Please review [[WP:EL]] and [[WP:SPAM]] before making further edits of this kind.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan pranala luar yang tidak sesuai dengan [[WP:EL|panduan pranala luar Wikipedia]]. Pranala luar hanya boleh disertakan jika memberikan nilai tambah yang signifikan di luar konten artikel. Pranala tersebut tidak boleh digunakan untuk promosi, periklanan, atau mengarahkan pembaca ke situs yang keandalannya diragukan. Harap tinjau [[WP:EL]] dan [[WP:SPAM]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },
        ],
      },

      // --- Removal of deletion tags ---
      {
        group: "Removal of deletion tags",
        items: [
          // ------------------------------------------------------------------
          // Removing {{afd}} templates
          // ------------------------------------------------------------------
          {
            value: "remafd",
            label: "Removing {{afd}} templates",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: removing AfD templates =="
                : "== Warning: removing AfD templates ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: menghapus templat AfD =="
                : "== Peringatan: menghapus templat AfD ==";
              const bodyEn =
                `Your recent edits appear to have removed one or more [[WP:AFD|articles for deletion]] (AfD) nomination templates from a page. These templates must not be removed while a deletion discussion is in progress, as doing so disrupts the deletion process and hides ongoing discussions from other editors. Please restore any removed templates and review [[WP:AFD]] for guidance on how the process works.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus satu atau lebih templat nominasi [[WP:AFD|artikel untuk dihapus]] (AfD) dari sebuah halaman. Templat ini tidak boleh dihapus selama diskusi penghapusan masih berlangsung, karena hal tersebut mengganggu proses penghapusan dan menyembunyikan diskusi yang sedang berjalan dari penyunting lain. Harap pulihkan templat yang telah dihapus dan tinjau [[WP:AFD]] untuk panduan mengenai cara kerja proses ini.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Removing {{blp prod}} templates
          // ------------------------------------------------------------------
          {
            value: "remblpprod",
            label: "Removing {{blp prod}} templates",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: removing BLP PROD templates =="
                : "== Warning: removing BLP PROD templates ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: menghapus templat BLP PROD =="
                : "== Peringatan: menghapus templat BLP PROD ==";
              const bodyEn =
                `Your recent edits appear to have removed one or more [[WP:BLPPROD|biographies of living persons proposed for deletion]] (BLP PROD) templates from a page. These templates may only be removed by the article's creator or by an editor who can demonstrate that the article contains at least one reliable source. If neither condition applies, please restore the template and review [[WP:BLPPROD]] for the correct procedure.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus satu atau lebih templat [[WP:BLPPROD|biografi tokoh hidup yang diusulkan untuk dihapus]] (BLP PROD) dari sebuah halaman. Templat ini hanya dapat dihapus oleh pembuat artikel atau oleh penyunting yang dapat menunjukkan bahwa artikel tersebut memuat setidaknya satu sumber tepercaya. Jika tidak ada kondisi yang terpenuhi, harap pulihkan templat tersebut dan tinjau [[WP:BLPPROD]] untuk prosedur yang benar.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Removing file deletion tags
          // ------------------------------------------------------------------
          {
            value: "remfiledel",
            label: "Removing file deletion tags",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: removing file deletion tags =="
                : "== Warning: removing file deletion tags ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: menghapus tag penghapusan berkas =="
                : "== Peringatan: menghapus tag penghapusan berkas ==";
              const bodyEn =
                `Your recent edits appear to have removed a deletion tag from one or more file pages. File deletion tags are placed by editors or administrators to flag files with potential licensing, sourcing, or policy issues, and must not be removed unless the underlying concern has been properly addressed. Please restore any removed tags and discuss any objections on the file's talk page or with the tagging editor.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus tag penghapusan dari satu atau lebih halaman berkas. Tag penghapusan berkas dipasang oleh penyunting atau pengurus untuk menandai berkas yang berpotensi memiliki masalah lisensi, sumber, atau kebijakan, dan tidak boleh dihapus kecuali permasalahan yang mendasarinya telah ditangani dengan benar. Harap pulihkan tag yang telah dihapus dan diskusikan keberatan apa pun di halaman pembicaraan berkas atau dengan penyunting yang memasang tag tersebut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Removing redirects for discussion tags
          // ------------------------------------------------------------------
          {
            value: "remrfd",
            label: "Removing redirects for discussion tags",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: removing RfD tags =="
                : "== Warning: removing RfD tags ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: menghapus tag RfD =="
                : "== Peringatan: menghapus tag RfD ==";
              const bodyEn =
                `Your recent edits appear to have removed one or more [[WP:RFD|redirects for discussion]] (RfD) tags from a page. These tags must not be removed while a discussion is open, as doing so hides the nomination from participating editors and disrupts the review process. Please restore any removed tags and, if you wish to contest the nomination, participate in the discussion at [[WP:RFD]] instead.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus satu atau lebih tag [[WP:RFD|pengalihan untuk didiskusikan]] (RfD) dari sebuah halaman. Tag ini tidak boleh dihapus selama diskusi masih terbuka, karena hal tersebut menyembunyikan nominasi dari penyunting yang berpartisipasi dan mengganggu proses peninjauan. Harap pulihkan tag yang telah dihapus dan, jika Anda ingin menentang nominasi tersebut, ikut serta dalam diskusi di [[WP:RFD]].` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Removing speedy deletion tags
          // ------------------------------------------------------------------
          {
            value: "remcsd",
            label: "Removing speedy deletion tags",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: removing speedy deletion tags =="
                : "== Warning: removing speedy deletion tags ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: menghapus tag penghapusan cepat =="
                : "== Peringatan: menghapus tag penghapusan cepat ==";
              const bodyEn =
                `Your recent edits appear to have removed one or more [[WP:CSD|speedy deletion]] tags from a page. Speedy deletion tags may only be removed by the page's creator (in limited circumstances) or by an administrator. If you believe a tag has been applied incorrectly, please contest it through the proper process rather than simply removing it. Please review [[WP:CSD]] and [[WP:CSDDISPUTE]] for guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus satu atau lebih tag [[WP:CSD|penghapusan cepat]] dari sebuah halaman. Tag penghapusan cepat hanya dapat dihapus oleh pembuat halaman (dalam keadaan terbatas) atau oleh pengurus. Jika Anda merasa suatu tag telah dipasang secara tidak tepat, harap ajukan keberatan melalui proses yang benar alih-alih sekadar menghapusnya. Harap tinjau [[WP:CSD]] dan [[WP:CSDDISPUTE]] untuk panduan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Removing {{tfd}} templates
          // ------------------------------------------------------------------
          {
            value: "remtfd",
            label: "Removing {{tfd}} templates",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: removing TfD templates =="
                : "== Warning: removing TfD templates ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: menghapus templat TfD =="
                : "== Peringatan: menghapus templat TfD ==";
              const bodyEn =
                `Your recent edits appear to have removed one or more [[WP:TFD|templates for discussion]] (TfD) tags from a template or page where they had been placed. These tags must remain in place while the deletion discussion is ongoing. Removing them disrupts the process and makes it harder for other editors to participate. If you object to the nomination, please contribute to the discussion at [[WP:TFD]] rather than removing the tag.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus satu atau lebih tag [[WP:TFD|templat untuk didiskusikan]] (TfD) dari sebuah templat atau halaman tempat tag tersebut dipasang. Tag ini harus tetap berada di tempatnya selama diskusi penghapusan masih berlangsung. Menghapusnya mengganggu proses dan menyulitkan penyunting lain untuk berpartisipasi. Jika Anda keberatan dengan nominasi tersebut, ikut serta dalam diskusi di [[WP:TFD]] daripada menghapus tag tersebut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },
        ],
      },

      // --- Other warnings ---
      {
        group: "Other warnings",
        items: [
          // ------------------------------------------------------------------
          // Triggering the edit filter
          // ------------------------------------------------------------------
          {
            value: "editfilter",
            label: "Triggering the edit filter",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: triggering the edit filter =="
                : "== Warning: triggering the edit filter ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: memicu filter suntingan =="
                : "== Peringatan: memicu filter suntingan ==";
              const bodyEn =
                `Your recent editing activity has triggered the [[WP:EF|edit filter]], which is designed to detect and prevent potentially harmful or disruptive edits. If your edit was made in good faith, please review the [[WP:EF|edit filter]] documentation and ensure that your future contributions comply with wiki policies. Repeated triggering of the edit filter, particularly where the edits are harmful, may result in your account being restricted.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Aktivitas penyuntingan Anda yang baru-baru ini telah memicu [[WP:EF|filter suntingan]], yang dirancang untuk mendeteksi dan mencegah suntingan yang berpotensi merugikan atau bersifat disruptif. Jika suntingan Anda dilakukan dengan iktikad baik, harap tinjau dokumentasi [[WP:EF|filter suntingan]] dan pastikan kontribusi Anda ke depannya mematuhi kebijakan wiki. Pemicuan filter suntingan secara berulang, khususnya jika suntingan tersebut bersifat merugikan, dapat mengakibatkan akun Anda dibatasi.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Using talk page as forum
          // ------------------------------------------------------------------
          {
            value: "talkforum",
            label: "Using talk page as forum",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: using talk page as a forum =="
                : "== Warning: using talk page as a forum ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: menggunakan halaman pembicaraan sebagai forum =="
                : "== Peringatan: menggunakan halaman pembicaraan sebagai forum ==";
              const bodyEn =
                `Your recent posts to one or more talk pages appear to use them as a general discussion forum rather than for their intended purpose of co-ordinating improvements to the associated page. Talk pages exist to discuss changes to article content, not to host general conversation, debate, or commentary on the subject. Please review [[WP:NOTFORUM]] and ensure that your future talk page contributions are focused on improving the relevant page.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini di satu atau lebih halaman pembicaraan tampaknya menggunakannya sebagai forum diskusi umum, bukan untuk tujuan yang seharusnya, yaitu mengoordinasikan perbaikan pada halaman terkait. Halaman pembicaraan ada untuk membahas perubahan pada konten artikel, bukan untuk menampung percakapan umum, debat, atau komentar mengenai subjek tersebut. Harap tinjau [[WP:NOTFORUM]] dan pastikan kontribusi Anda di halaman pembicaraan ke depannya berfokus pada peningkatan halaman yang relevan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Creating inappropriate pages
          // ------------------------------------------------------------------
          {
            value: "inappropriatepage",
            label: "Creating inappropriate pages",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: creating inappropriate pages =="
                : "== Warning: creating inappropriate pages ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: membuat halaman yang tidak sesuai =="
                : "== Peringatan: membuat halaman yang tidak sesuai ==";
              const bodyEn =
                `Your recent activity appears to have involved the creation of one or more pages that are not appropriate for this wiki. This may include pages that are promotional in nature, attack pages, joke pages, or content that does not meet the requirements for inclusion. Please review [[WP:NOT]], [[WP:N]], and [[WP:CSD]] before creating new pages, and consider using [[WP:AFC|Articles for Creation]] if you are unsure whether a topic is suitable.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Aktivitas Anda yang baru-baru ini tampaknya melibatkan pembuatan satu atau lebih halaman yang tidak sesuai untuk wiki ini. Hal ini dapat mencakup halaman yang bersifat promosi, halaman serangan, halaman lelucon, atau konten yang tidak memenuhi persyaratan untuk dimasukkan. Harap tinjau [[WP:NOT]], [[WP:N]], dan [[WP:CSD]] sebelum membuat halaman baru, dan pertimbangkan untuk menggunakan [[WP:AFC|Artikel untuk Dibuat]] jika Anda tidak yakin apakah suatu topik layak untuk dimuat.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Added statement had source, but it did not verify content
          // ------------------------------------------------------------------
          {
            value: "misledref",
            label: "Added statement had source, but it did not verify content",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: cited source does not verify added content =="
                : "== Warning: cited source does not verify added content ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: sumber yang dikutip tidak memverifikasi konten yang ditambahkan =="
                : "== Peringatan: sumber yang dikutip tidak memverifikasi konten yang ditambahkan ==";
              const bodyEn =
                `Your recent edits appear to have added content supported by a citation that does not, upon inspection, actually verify the statement made. Sources must directly support the text they are cited for; they must not be misrepresented, taken out of context, or used to imply conclusions they do not state. Please review [[WP:V]] and [[WP:INTEGRITY]], and ensure that all sources you add are accurately summarised and genuinely support the claims they are attached to.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menambahkan konten yang didukung oleh kutipan yang, setelah diperiksa, sebenarnya tidak memverifikasi pernyataan yang dibuat. Sumber harus secara langsung mendukung teks yang dikutip. Sumber tidak boleh disajikan secara keliru, diambil di luar konteks, atau digunakan untuk menyiratkan kesimpulan yang tidak dinyatakannya. Harap tinjau [[WP:V]] dan [[WP:INTEGRITY]], dan pastikan semua sumber yang Anda tambahkan dirangkum secara akurat dan benar-benar mendukung klaim yang dilampirkan padanya.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Using misleading edit summaries
          // ------------------------------------------------------------------
          {
            value: "misleadingsum",
            label: "Using misleading edit summaries",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: using misleading edit summaries =="
                : "== Warning: using misleading edit summaries ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penggunaan ringkasan suntingan yang menyesatkan =="
                : "== Peringatan: penggunaan ringkasan suntingan yang menyesatkan ==";
              const bodyEn =
                `Your recent edits appear to have used edit summaries that do not accurately describe the changes made. Edit summaries should clearly and honestly reflect what an edit does, and must not be used to disguise the nature of a change or to mislead other editors who review the edit history. Please review [[WP:ES]] and ensure that your future edit summaries are accurate and transparent.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menggunakan ringkasan suntingan yang tidak secara akurat menggambarkan perubahan yang dilakukan. Ringkasan suntingan harus dengan jelas dan jujur mencerminkan apa yang dilakukan oleh suatu suntingan, dan tidak boleh digunakan untuk menyamarkan sifat suatu perubahan atau menyesatkan penyunting lain yang meninjau riwayat suntingan. Harap tinjau [[WP:ES]] dan pastikan ringkasan suntingan Anda ke depannya akurat dan transparan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Manual of style
          // ------------------------------------------------------------------
          {
            value: "mos",
            label: "Manual of style",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: manual of style =="
                : "== Warning: manual of style ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: panduan gaya penulisan =="
                : "== Peringatan: panduan gaya penulisan ==";
              const bodyEn =
                `Your recent edits appear to have introduced content or formatting that does not conform to the [[WP:MOS|Wikipedia Manual of Style]]. The Manual of Style provides guidance on consistent and accessible presentation across the encyclopaedia. Please review the relevant sections of [[WP:MOS]] before making further edits of this kind, and ensure that your contributions are consistent with the established style conventions.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menyisipkan konten atau pemformatan yang tidak sesuai dengan [[WP:MOS|Panduan Gaya Penulisan Wikipedia]]. Panduan Gaya Penulisan memberikan arahan tentang penyajian yang konsisten dan mudah dipahami di seluruh ensiklopedia. Harap tinjau bagian yang relevan dari [[WP:MOS]] sebelum melakukan suntingan serupa, dan pastikan kontribusi Anda sesuai dengan konvensi gaya yang berlaku.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Page moves against naming conventions or consensus
          // ------------------------------------------------------------------
          {
            value: "badpagemove",
            label: "Page moves against naming conventions or consensus",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: page move against naming conventions or consensus =="
                : "== Warning: page move against naming conventions or consensus ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: pemindahan halaman yang bertentangan dengan konvensi penamaan atau konsensus =="
                : "== Peringatan: pemindahan halaman yang bertentangan dengan konvensi penamaan atau konsensus ==";
              const bodyEn =
                `Your recent edits appear to have involved moving one or more pages to a title that does not comply with [[WP:NC|Wikipedia's naming conventions]] or that contradicts an existing editorial consensus. Page moves should follow the established naming guidelines and, where a title is disputed or has previously been discussed, must not be made unilaterally. Please review [[WP:NC]] and [[WP:RM]], and use the [[WP:RM|requested moves]] process if you wish to propose a rename.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya melibatkan pemindahan satu atau lebih halaman ke judul yang tidak sesuai dengan [[WP:NC|konvensi penamaan Wikipedia]] atau yang bertentangan dengan konsensus editorial yang ada. Pemindahan halaman harus mengikuti panduan penamaan yang berlaku dan, apabila suatu judul diperdebatkan atau pernah didiskusikan sebelumnya, tidak boleh dilakukan secara sepihak. Harap tinjau [[WP:NC]] dan [[WP:RM]], dan gunakan proses [[WP:RM|permintaan pemindahan]] jika Anda ingin mengusulkan pergantian nama.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Creating inappropriate redirects
          // ------------------------------------------------------------------
          {
            value: "inappropriateredirect",
            label: "Creating inappropriate redirects",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: creating inappropriate redirects =="
                : "== Warning: creating inappropriate redirects ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: membuat pengalihan yang tidak sesuai =="
                : "== Peringatan: membuat pengalihan yang tidak sesuai ==";
              const bodyEn =
                `Your recent edits appear to have created one or more redirects that are not appropriate for this wiki. Redirects should only be created where they serve a plausible navigational purpose and point to a relevant target. Redirects that are offensive, nonsensical, promotional, or unlikely to be searched for in good faith are not permitted. Please review [[WP:R]] and [[WP:CSD#R]] before creating further redirects.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah membuat satu atau lebih pengalihan yang tidak sesuai untuk wiki ini. Pengalihan hanya boleh dibuat jika memiliki tujuan navigasi yang masuk akal dan mengarah ke target yang relevan. Pengalihan yang bersifat menyinggung, tidak masuk akal, promosi, atau kecil kemungkinannya dicari dengan iktikad baik tidak diperkenankan. Harap tinjau [[WP:R]] dan [[WP:CSD#R]] sebelum membuat pengalihan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Refactoring others' talk page comments
          // ------------------------------------------------------------------
          {
            value: "refactoring",
            label: "Refactoring others' talk page comments",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: refactoring others' talk page comments =="
                : "== Warning: refactoring others' talk page comments ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: mengubah komentar halaman pembicaraan milik pengguna lain =="
                : "== Peringatan: mengubah komentar halaman pembicaraan milik pengguna lain ==";
              const bodyEn =
                `Your recent edits appear to have altered, removed, or restructured comments made by other editors on one or more talk pages. Editors' signed comments must not be modified by others, as this can misrepresent their views and undermine trust in the discussion record. Please review [[WP:TDEL]] and [[WP:TALKNEW]], and ensure that you do not alter other editors' contributions to talk pages.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah mengubah, menghapus, atau merestrukturisasi komentar yang dibuat oleh penyunting lain di satu atau lebih halaman pembicaraan. Komentar bertanda tangan milik penyunting tidak boleh dimodifikasi oleh orang lain, karena hal ini dapat menyalahartikan pandangan mereka dan merusak kepercayaan terhadap catatan diskusi. Harap tinjau [[WP:TDEL]] dan [[WP:TALKNEW]], dan pastikan Anda tidak mengubah kontribusi penyunting lain di halaman pembicaraan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Uploading unencyclopaedic images
          // ------------------------------------------------------------------
          {
            value: "unencycimage",
            label: "Uploading unencyclopedic images",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: uploading unencyclopedic images =="
                : "== Warning: uploading unencyclopedic images ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: mengunggah gambar yang tidak ensiklopedis =="
                : "== Peringatan: mengunggah gambar yang tidak ensiklopedis ==";
              const bodyEn =
                `Your recent uploads appear to include one or more images that are not appropriate for an encyclopaedia. Images uploaded to this wiki must serve a clear encyclopaedic purpose and comply with all relevant content and licensing policies. Images that are purely decorative, offensive, self-promotional, or otherwise unsuitable will be deleted. Please review [[WP:IUP]] and [[WP:NFC]] before uploading further images.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Unggahan Anda yang baru-baru ini tampaknya menyertakan satu atau lebih gambar yang tidak sesuai untuk sebuah ensiklopedia. Gambar yang diunggah ke wiki ini harus memiliki tujuan ensiklopedis yang jelas dan mematuhi semua kebijakan konten dan lisensi yang berlaku. Gambar yang bersifat sekadar dekoratif, menyinggung, bersifat promosi diri, atau tidak sesuai dengan alasan lain akan dihapus. Harap tinjau [[WP:IUP]] dan [[WP:NFC]] sebelum mengunggah gambar lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },
        ],
      },

      // --- Behaviour towards other editors ---
      {
        group: "Behaviour towards other editors",
        items: [
          // ------------------------------------------------------------------
          // Not assuming good faith
          // ------------------------------------------------------------------
          {
            value: "goodfaith",
            label: "Not assuming good faith",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: not assuming good faith =="
                : "== Warning: not assuming good faith ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: tidak berasumsi iktikad baik =="
                : "== Peringatan: tidak berasumsi iktikad baik ==";
              const bodyEn =
                `Your recent comments or actions suggest that you may not be [[WP:AGF|assuming good faith]] on the part of other editors. Wikipedia's collaborative environment depends on editors treating one another charitably and assuming that contributions are made in good faith unless there is clear evidence to the contrary. Please review [[WP:AGF]] before continuing to engage with other editors in this manner.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Komentar atau tindakan Anda yang baru-baru ini mengindikasikan bahwa Anda mungkin tidak [[WP:AGF|berasumsi berniat baik]] dari pihak penyunting lain. Lingkungan kolaboratif Wikipedia bergantung pada para penyunting yang saling memperlakukan satu sama lain dengan sikap yang bijak dan mengasumsikan bahwa kontribusi dibuat dengan iktikad baik kecuali ada bukti yang jelas sebaliknya. Harap tinjau [[WP:AGF]] sebelum melanjutkan interaksi dengan penyunting lain dengan cara seperti ini.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Posting LLM-generated comments
          // ------------------------------------------------------------------
          {
            value: "llmcomments",
            label: "Posting LLM-generated comments",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: posting LLM-generated comments =="
                : "== Warning: posting LLM-generated comments ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: memposting komentar yang dihasilkan LLM =="
                : "== Peringatan: memposting komentar yang dihasilkan LLM ==";
              const bodyEn =
                `Your recent posts to one or more talk pages or discussion spaces appear to include comments generated by a large language model (such as ChatGPT or a similar tool) rather than written in your own words. Posting AI-generated text in editor discussions can impede genuine dialogue and may be considered disruptive. Please ensure that your contributions to discussions reflect your own views and are written by you directly.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Kiriman Anda yang baru-baru ini di satu atau lebih halaman pembicaraan atau ruang diskusi tampaknya menyertakan komentar yang dihasilkan oleh model bahasa besar (seperti ChatGPT atau alat serupa) dan bukan ditulis dengan kata-kata Anda sendiri. Mengirim teks yang dihasilkan oleh kecerdasan buatan dalam diskusi antarpenyunting dapat menghambat dialog yang tulus dan dapat dianggap sebagai tindakan disruptif. Harap pastikan kontribusi Anda dalam diskusi mencerminkan pandangan Anda sendiri dan ditulis langsung oleh Anda.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Harassment of other users
          // ------------------------------------------------------------------
          {
            value: "harassment",
            label: "Harassment of other users",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: harassment of other users =="
                : "== Warning: harassment of other users ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: pelecehan terhadap pengguna lain =="
                : "== Peringatan: pelecehan terhadap pengguna lain ==";
              const bodyEn =
                `Your recent behaviour appears to constitute [[WP:HARASS|harassment]] of one or more other users. Harassment is not tolerated on this wiki. All editors are entitled to contribute in an environment free from intimidation, threats, or sustained negative targeting. Please review [[WP:HARASS]] and [[WP:CIVIL]] immediately and cease this behaviour.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Perilaku Anda yang baru-baru ini tampaknya merupakan [[WP:HARASS|pelecehan]] terhadap satu atau lebih pengguna lain. Pelecehan tidak ditoleransi di wiki ini. Semua penyunting berhak untuk berkontribusi dalam lingkungan yang bebas dari intimidasi, ancaman, atau penargetan negatif yang terus-menerus. Harap segera tinjau [[WP:HARASS]] dan [[WP:CIVIL]] dan hentikan perilaku ini.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Personal attack directed at a specific editor
          // ------------------------------------------------------------------
          {
            value: "personalattack",
            label: "Personal attack directed at a specific editor",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: personal attack =="
                : "== Warning: personal attack ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: serangan pribadi =="
                : "== Peringatan: serangan pribadi ==";
              const bodyEn =
                `Your recent comments appear to include a [[WP:NPA|personal attack]] directed at another editor. Attacking other contributors — including through insults, name-calling, or denigration of their character — is not permitted on this wiki. Please review [[WP:NPA]] and [[WP:CIVIL]], and ensure that your future comments address the content of edits rather than the editors who make them.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Komentar Anda yang baru-baru ini tampaknya mengandung [[WP:NPA|serangan pribadi]] yang ditujukan kepada penyunting lain. Menyerang kontributor lain, termasuk melalui hinaan, sebutan yang merendahkan, atau pencemaran karakter mereka, tidak diperkenankan di wiki ini. Harap tinjau [[WP:NPA]] dan [[WP:CIVIL]], dan pastikan komentar Anda ke depannya membahas isi suntingan, bukan penyunting yang membuatnya.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Improper use of warning or blocking template
          // ------------------------------------------------------------------
          {
            value: "improperwarning",
            label: "Improper use of warning or blocking template",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: improper use of warning or blocking template =="
                : "== Warning: improper use of warning or blocking template ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penggunaan templat peringatan atau pemblokiran yang tidak tepat =="
                : "== Peringatan: penggunaan templat peringatan atau pemblokiran yang tidak tepat ==";
              const bodyEn =
                `Your recent edits appear to have involved the improper use of a warning or blocking template. Warning and blocking templates are administrative tools that must only be used in appropriate circumstances and by editors acting in good faith in accordance with established policy. Using them to intimidate, threaten, or retaliate against other editors is not permitted. Please review the relevant guidelines before using these templates again.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya melibatkan penggunaan templat peringatan atau pemblokiran yang tidak tepat. Templat peringatan dan pemblokiran adalah alat administratif yang hanya boleh digunakan dalam keadaan yang sesuai dan oleh penyunting yang beriktikad baik sesuai dengan kebijakan yang berlaku. Menggunakannya untuk mengintimidasi, mengancam, atau membalas dendam terhadap penyunting lain tidak diperkenankan. Harap tinjau panduan yang relevan sebelum menggunakan templat ini kembali.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },
        ],
      },
    ];

    return { WARN_MESSAGES };
  },
};
// </nowiki>
