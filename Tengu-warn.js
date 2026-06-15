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

      // --- Single notices ---
      {
        group: "Single notices",
        items: [
          // ------------------------------------------------------------------
          // Mistakes with the Add a Link newcomer task
          // ------------------------------------------------------------------
          {
            value: "addalink",
            label: "Mistakes with the Add a Link newcomer task",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: Add a Link newcomer task =="
                : "== Notice: Add a Link newcomer task ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: tugas pemula Tambah Tautan =="
                : "== Pemberitahuan: tugas pemula Tambah Tautan ==";
              const bodyEn =
                `Thank you for trying out the [[WP:ADD A LINK|Add a Link]] newcomer task. Some of your recent link suggestions do not appear to be a good fit for the target articles: links should connect a term to a relevant, encyclopaedic article that meaningfully aids the reader's understanding. Please review the guidance at [[WP:LINK]] and [[WP:OVERLINK]] before adding further links through this tool.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Terima kasih telah mencoba tugas pemula [[WP:ADD A LINK|Tambahkan Pranala]]. Beberapa saran pranala Anda yang baru-baru ini tampaknya kurang tepat untuk artikel yang dituju. Pranala seharusnya menghubungkan sebuah istilah dengan artikel ensiklopedis yang relevan dan benar-benar membantu pemahaman pembaca. Harap tinjau panduan di [[WP:LINK]] dan [[WP:OVERLINK]] sebelum menambahkan pranala lebih lanjut melalui alat ini.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Use of multiple accounts (assuming good faith)
          // ------------------------------------------------------------------
          {
            value: "multiaccountgf",
            label: "Use of multiple accounts (assuming good faith)",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: use of multiple accounts =="
                : "== Notice: use of multiple accounts ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penggunaan beberapa akun =="
                : "== Pemberitahuan: penggunaan beberapa akun ==";
              const bodyEn =
                `It appears that you may be using more than one account to edit this wiki. While there are some legitimate reasons to maintain a secondary account, doing so is governed by [[WP:SOCK|Wikipedia's policy on alternative accounts]]. If you are operating multiple accounts, please ensure that each account's purpose complies with policy and that you are not using them in a way that could be seen as attempting to gain an unfair advantage in discussions or editing. Please review [[WP:SOCK]] for guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Anda mungkin menggunakan lebih dari satu akun untuk menyunting wiki ini. Meskipun terdapat beberapa alasan yang sah untuk mempertahankan akun kedua, hal tersebut diatur oleh [[WP:SOCK|kebijakan Wikipedia tentang akun alternatif]]. Jika Anda mengelola beberapa akun, pastikan tujuan setiap akun sesuai dengan kebijakan dan Anda tidak menggunakannya dengan cara yang dapat dianggap sebagai upaya memperoleh keuntungan yang tidak adil dalam diskusi atau penyuntingan. Harap tinjau [[WP:SOCK]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Bad AIV report
          // ------------------------------------------------------------------
          {
            value: "badaiv",
            label: "Bad AIV report",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: incorrect AIV report =="
                : "== Notice: incorrect AIV report ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: laporan AIV yang tidak tepat =="
                : "== Pemberitahuan: laporan AIV yang tidak tepat ==";
              const bodyEn =
                `Your recent report at [[WP:AIV|Administrator intervention against vandalism]] (AIV) does not appear to meet the criteria for reporting. AIV is intended for editors who are actively and clearly vandalising the wiki and have already been warned. Reports that relate to good-faith errors, content disputes, or users who have not yet been warned are unlikely to result in a block and may slow administrators' response to genuine vandalism. Please review [[WP:AIV]] before making further reports.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Laporan Anda yang baru-baru ini di [[WP:AIV|Intervensi pengurus terhadap vandalisme]] (AIV)tampaknya tidak memenuhi kriteria pelaporan. AIV ditujukan untuk penyunting yang secara aktif dan jelas melakukan vandalisme dan telah mendapat peringatan sebelumnya. Laporan yang berkaitan dengan kesalahan beritikad baik, perselisihan konten, atau pengguna yang belum mendapat peringatan kemungkinan tidak akan menghasilkan pemblokiran dan dapat memperlambat respons pengurus terhadap vandalisme yang jelas. Harap tinjau [[WP:AIV]] sebelum membuat laporan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Article moved to draftspace
          // ------------------------------------------------------------------
          {
            value: "movedtodraft",
            label: "Article moved to draftspace",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: article moved to draftspace =="
                : "== Notice: article moved to draftspace ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: artikel dipindahkan ke ruang draf =="
                : "== Pemberitahuan: artikel dipindahkan ke ruang draf ==";
              const bodyEn =
                `A page you recently created or worked on has been moved to [[WP:DRAFTSPACE|draftspace]] because it does not yet meet the criteria for inclusion in the main encyclopaedia. This is not a deletion: the article remains accessible and you are welcome to continue developing it. Once it meets [[WP:NCRIT|Wikipedia's notability guidelines]] and [[WP:V|verifiability policy]], it may be submitted for review and moved back to the main namespace. Please review [[WP:YFA]] for guidance on creating new articles.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Sebuah halaman yang baru-baru ini Anda buat atau kerjakan telah dipindahkan ke [[WP:DRAFTSPACE|ruang draf]] karena belum memenuhi kriteria untuk disertakan dalam ruang nama utama. Halaman Anda masih dapat diakses dan Anda dipersilakan untuk terus mengembangkannya. Setelah memenuhi [[WP:NCRIT|panduan kelayakan Wikipedia]] dan [[WP:V|kebijakan verifikasi]], artikel dapat diajukan untuk ditinjau dan dipindahkan kembali ke ruang nama utama. Harap tinjau [[WP:YFA]] untuk panduan membuat artikel baru.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Creating autobiographies
          // ------------------------------------------------------------------
          {
            value: "autobiography",
            label: "Creating autobiographies",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: creating autobiographies =="
                : "== Notice: creating autobiographies ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: membuat otobiografi =="
                : "== Pemberitahuan: membuat otobiografi ==";
              const bodyEn =
                `It appears that you may have created or substantially edited an article about yourself. Wikipedia strongly discourages editors from writing about themselves, as it is very difficult to write about oneself in a neutral and verifiable way, and doing so creates a significant [[WP:COI|conflict of interest]]. Please review [[WP:AUTO]] and [[WP:COI]]. If you meet [[WP:NCRIT|Wikipedia's notability criteria]], you may wish to request that someone else write an article about you instead.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Tampaknya Anda mungkin telah membuat atau menyunting secara substansial sebuah artikel tentang diri Anda sendiri. Wikipedia sangat tidak menganjurkan penyunting menulis tentang diri mereka sendiri, karena sangat sulit untuk menulis tentang diri sendiri secara netral dan dapat diverifikasi, dan hal ini menimbulkan [[WP:COI|konflik kepentingan]] yang signifikan. Harap tinjau [[WP:AUTO]] dan [[WP:COI]]. Jika Anda memenuhi [[WP:NCRIT|kriteria kelayakan Wikipedia]], Anda dapat meminta orang lain untuk menulis artikel tentang Anda.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Adding incorrect categories
          // ------------------------------------------------------------------
          {
            value: "incorrectcat",
            label: "Adding incorrect categories",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: adding incorrect categories =="
                : "== Notice: adding incorrect categories ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penambahan kategori yang salah =="
                : "== Pemberitahuan: penambahan kategori yang salah ==";
              const bodyEn =
                `Your recent edits appear to have added one or more categories to a page that do not accurately describe that page's subject matter. Categories should only be applied where their criteria are clearly met. Please review [[WP:CAT]] and the specific criteria of any category before applying it. Incorrect categorisation can misdirect readers and is usually reverted.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan satu atau lebih kategori ke sebuah halaman yang tidak secara akurat menggambarkan subjek halaman tersebut. Kategori hanya boleh diterapkan apabila kriterianya jelas terpenuhi. Harap tinjau [[WP:CAT]] dan kriteria spesifik dari setiap kategori sebelum menerapkannya. Kategorisasi yang salah dapat menyesatkan pembaca dan biasanya akan dikembalikan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Adding inappropriate entries to lists
          // ------------------------------------------------------------------
          {
            value: "listentries",
            label: "Adding inappropriate entries to lists",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: adding inappropriate entries to lists =="
                : "== Notice: adding inappropriate entries to lists ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penambahan entri yang tidak sesuai ke daftar =="
                : "== Pemberitahuan: penambahan entri yang tidak sesuai ke daftar ==";
              const bodyEn =
                `Your recent edits appear to have added one or more entries to a list that do not meet the inclusion criteria for that list. List articles define their scope in their lead section or guidelines; entries must meet those criteria and must be supported by a reliable source. Please review [[WP:LISTCRITERIA]] and the list's own documentation before adding further entries.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan satu atau lebih entri ke sebuah daftar yang tidak memenuhi kriteria penyertaan daftar tersebut. Artikel daftar mendefinisikan cakupannya di bagian pembuka atau panduannya; entri harus memenuhi kriteria tersebut dan harus didukung oleh sumber tepercaya. Harap tinjau [[WP:LISTCRITERIA]] dan dokumentasi daftar itu sendiri sebelum menambahkan entri lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Adding a bare URL
          // ------------------------------------------------------------------
          {
            value: "bareurl",
            label: "Adding a bare URL",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: adding a bare URL =="
                : "== Notice: adding a bare URL ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penambahan URL mentah =="
                : "== Pemberitahuan: penambahan URL mentah ==";
              const bodyEn =
                `Your recent edits appear to have added one or more bare URLs — that is, raw web addresses without a formatted citation — to an article. Bare URLs are difficult for readers to evaluate and do not display useful bibliographic information. Please format all references using a citation template such as {{|tlx|cite web}} or {{tlx|cite news}}. See [[WP:CITE]] for guidance on citing sources correctly.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan satu atau lebih URL mentah, yaitu alamat web tanpa kutipan yang diformat, ke dalam artikel. URL mentah sulit dievaluasi oleh pembaca dan tidak menampilkan informasi bibliografi yang berguna. Harap format semua referensi menggunakan templat kutipan seperti {{tlx|cite web}} atau {{tlx|cite news}}. Lihat [[WP:CITE]] untuk panduan mengutip sumber dengan benar.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // "Biting" newcomers
          // ------------------------------------------------------------------
          {
            value: "bitingnewcomers",
            label: '"Biting" newcomers',
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: biting newcomers =="
                : "== Notice: biting newcomers ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: bersikap kasar terhadap pengguna baru =="
                : "== Pemberitahuan: bersikap kasar terhadap pengguna baru ==";
              const bodyEn =
                `Your recent comments or actions towards a new editor may have come across as unwelcoming or unnecessarily harsh. Wikipedia encourages all editors to be patient and supportive with newcomers, who may not yet be familiar with our policies and conventions. Please review [[WP:BITE]] and [[WP:CIVIL]], and try to engage with new editors in a constructive and encouraging way.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Komentar atau tindakan Anda yang baru-baru ini terhadap penyunting baru mungkin terkesan tidak ramah atau terlalu keras. Wikipedia mendorong semua penyunting untuk bersabar dan mendukung para pengguna baru, yang mungkin belum familier dengan kebijakan dan pedoman kita. Harap tinjau [[WP:BITE]] dan [[WP:CIVIL]], dan cobalah untuk berinteraksi dengan penyunting baru secara konstruktif dan mendukung.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Article blanked and redirected
          // ------------------------------------------------------------------
          {
            value: "blankredirect",
            label: "Article blanked and redirected",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: article blanked and redirected =="
                : "== Notice: article blanked and redirected ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: artikel dikosongkan dan dialihkan =="
                : "== Pemberitahuan: artikel dikosongkan dan dialihkan ==";
              const bodyEn =
                `Your recent edits appear to have blanked the content of an article and converted it into a redirect. If you believe an article should be merged with or redirected to another, please follow the process described at [[WP:MERGE]] or [[WP:REDIRECT]] and propose the change on the relevant talk page first. Blanking content without discussion is not the correct procedure and is typically reverted.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah mengosongkan konten sebuah artikel dan mengubahnya menjadi pengalihan. Jika Anda berpendapat bahwa sebuah artikel harus digabungkan atau dialihkan ke artikel lain, ikuti proses yang dijelaskan di [[WP:MERGE]] atau [[WP:REDIRECT]] dan usulkan perubahan tersebut di halaman pembicaraan yang relevan terlebih dahulu. Mengosongkan konten tanpa diskusi bukan prosedur yang benar dan biasanya akan dikembalikan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Using circular sources
          // ------------------------------------------------------------------
          {
            value: "circularsources",
            label: "Using circular sources",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: using circular sources =="
                : "== Notice: using circular sources ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penggunaan sumber melingkar =="
                : "== Pemberitahuan: penggunaan sumber melingkar ==";
              const bodyEn =
                `Your recent edits appear to cite sources that ultimately derive their information from Wikipedia itself, or from other sources that repeat claims originally published here. This is known as circular sourcing and does not satisfy [[WP:V|Wikipedia's verifiability policy]], because it does not provide independent verification of the information. Please use primary or reliable secondary sources that are independent of Wikipedia. See [[WP:CIRCULAR]] for guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya mengutip sumber yang pada akhirnya mengambil informasinya dari Wikipedia sendiri, atau dari sumber lain yang mengulang klaim yang awalnya diterbitkan di sini. Hal ini dikenal sebagai sumber melingkar dan tidak memenuhi [[WP:V|kebijakan verifikasi Wikipedia]], karena tidak memberikan verifikasi independen atas informasi tersebut. Harap gunakan sumber primer atau sumber sekunder yang tepercaya dan independen dari Wikipedia. Lihat [[WP:CIRCULAR]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Conflict of interest
          // ------------------------------------------------------------------
          {
            value: "coi",
            label: "Conflict of interest",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: conflict of interest =="
                : "== Notice: conflict of interest ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: konflik kepentingan =="
                : "== Pemberitahuan: konflik kepentingan ==";
              const bodyEn =
                `Your recent edits suggest that you may have a [[WP:COI|conflict of interest]] with respect to the subject of one or more articles you have edited. Editors with a personal, professional, or financial connection to a subject are strongly discouraged from editing related articles directly. If you have relevant information to contribute, please use the talk page to suggest changes and allow independent editors to assess them. Please review [[WP:COI]] and [[WP:PAID]] for further guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini mengindikasikan bahwa Anda mungkin memiliki [[WP:COI|konflik kepentingan]] terhadap subjek satu atau lebih artikel yang Anda sunting. Penyunting yang memiliki hubungan pribadi, profesional, atau finansial dengan suatu subjek sangat tidak dianjurkan untuk menyunting artikel terkait secara langsung. Jika Anda memiliki informasi yang relevan untuk dikontribusikan, gunakan halaman pembicaraan untuk menyarankan perubahan dan biarkan penyunting independen menilainya. Harap tinjau [[WP:COI]] dan [[WP:PAID]] untuk panduan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Copying text to another page
          // ------------------------------------------------------------------
          {
            value: "copyingtext",
            label: "Copying text to another page",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: copying text to another page =="
                : "== Notice: copying text to another page ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: menyalin teks ke halaman lain =="
                : "== Pemberitahuan: menyalin teks ke halaman lain ==";
              const bodyEn =
                `Your recent edits appear to have copied text from one Wikipedia page to another without the required attribution. All Wikipedia content is released under a licence that requires attribution to the original contributors. When copying text between pages, you must acknowledge the source in the edit summary using a note such as "Copied text from [[Article name]]; see that article's history for attribution." Please review [[WP:COPYWITHIN]] for the correct procedure.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyalin teks dari satu halaman Wikipedia ke halaman lain tanpa atribusi yang diperlukan. Semua konten Wikipedia dirilis di bawah lisensi yang mewajibkan atribusi kepada kontributor aslinya. Saat menyalin teks antar halaman, Anda harus mencantumkan sumbernya dalam ringkasan suntingan menggunakan catatan seperti "Teks disalin dari [[Nama artikel]]; lihat riwayat artikel tersebut untuk atribusi." Harap tinjau [[WP:COPYWITHIN]] untuk prosedur yang benar.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Adding speculative or unconfirmed information
          // ------------------------------------------------------------------
          {
            value: "speculative",
            label: "Adding speculative or unconfirmed information",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: adding speculative or unconfirmed information =="
                : "== Notice: adding speculative or unconfirmed information ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penambahan informasi spekulatif atau belum terkonfirmasi =="
                : "== Pemberitahuan: penambahan informasi spekulatif atau belum terkonfirmasi ==";
              const bodyEn =
                `Your recent edits appear to have introduced speculative, rumoured, or otherwise unconfirmed information into one or more articles. Wikipedia's [[WP:V|verifiability policy]] requires that all content be attributable to a reliable, published source. Information that has not yet been confirmed or that represents speculation — even if widely reported — should not be added until it is properly sourced. Please review [[WP:V]] and [[WP:OR]] before making further edits of this kind.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya memasukkan informasi spekulatif, berupa rumor, atau belum terkonfirmasi ke dalam satu atau lebih artikel. [[WP:V|Kebijakan verifikasi Wikipedia]] mewajibkan bahwa semua konten dapat dikaitkan dengan sumber yang tepercaya dan telah diterbitkan. Informasi yang belum terkonfirmasi atau yang merupakan spekulasi, meskipun banyak dilaporkan, tidak boleh ditambahkan sampai bersumber dengan baik. Harap tinjau [[WP:V]] dan [[WP:OR]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Cut and paste moves
          // ------------------------------------------------------------------
          {
            value: "cutpastemove",
            label: "Cut and paste moves",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: cut and paste moves =="
                : "== Notice: cut and paste moves ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: pemindahan dengan potong dan tempel =="
                : "== Pemberitahuan: pemindahan dengan potong dan tempel ==";
              const bodyEn =
                `Your recent edits appear to have moved the content of a page by cutting it from one location and pasting it to another. This method of moving pages should not be used because it breaks the page's edit history, which is required for copyright attribution. To rename or move a page, please use the [[WP:MOVE|"Move" function]]. If you require assistance, you can request a page move at [[WP:RM]]. See [[WP:CPM]] for further explanation.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya memindahkan konten halaman dengan memotongnya dari satu lokasi dan menempelkannya di lokasi lain. Metode pemindahan halaman ini tidak boleh digunakan karena merusak riwayat suntingan halaman, yang diperlukan untuk atribusi hak cipta. Untuk mengganti nama atau memindahkan halaman, gunakan [[WP:MOVE|fitur "Pindahkan"]]. Jika Anda memerlukan bantuan, Anda dapat meminta pemindahan halaman di [[WP:RM]]. Lihat [[WP:CPM]] untuk penjelasan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Incorrect edit to a disambiguation page
          // ------------------------------------------------------------------
          {
            value: "dabpage",
            label: "Incorrect edit to a disambiguation page",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: incorrect edit to a disambiguation page =="
                : "== Notice: incorrect edit to a disambiguation page ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: suntingan yang salah pada halaman disambiguasi =="
                : "== Pemberitahuan: suntingan yang salah pada halaman disambiguasi ==";
              const bodyEn =
                `Your recent edits to a [[WP:DAB|disambiguation page]] do not appear to follow the guidelines for those pages. Disambiguation pages are navigational aids that list articles sharing a similar name; they have specific formatting conventions and should not be used to add definitions, trivia, redlinks to non-notable topics, or content that belongs in an article. Please review [[WP:MOSDAB]] before editing disambiguation pages further.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini pada [[WP:DAB|halaman disambiguasi]] tampaknya tidak mengikuti panduan untuk halaman tersebut. Halaman disambiguasi adalah alat navigasi yang mencantumkan artikel-artikel dengan nama serupa; halaman ini memiliki konvensi pemformatan khusus dan tidak boleh digunakan untuk menambahkan definisi, informasi trivial, pranala merah ke topik yang tidak layak, atau konten yang seharusnya berada dalam sebuah artikel. Harap tinjau [[WP:MOSDAB]] sebelum menyunting halaman disambiguasi lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Unnecessarily changing date formats
          // ------------------------------------------------------------------
          {
            value: "dateformat",
            label: "Unnecessarily changing date formats",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: unnecessarily changing date formats =="
                : "== Notice: unnecessarily changing date formats ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: mengubah format tanggal secara tidak perlu =="
                : "== Pemberitahuan: mengubah format tanggal secara tidak perlu ==";
              const bodyEn =
                `Your recent edits appear to have changed the date format used in one or more articles without a clear editorial reason to do so. Wikipedia's [[MOS:DATEFORMAT|Manual of Style]] advises that the date format already established in an article should generally be retained for consistency. Please avoid making changes to date formats that do not improve the encyclopaedia and review [[MOS:DATEFORMAT]] for guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah mengubah format tanggal yang digunakan dalam satu atau lebih artikel tanpa alasan editorial yang jelas. [[MOS:DATEFORMAT|Panduan gaya Wikipedia]] menyarankan agar format tanggal yang telah ditetapkan dalam sebuah artikel umumnya dipertahankan untuk konsistensi. Harap hindari perubahan format tanggal yang tidak meningkatkan kualitas ensiklopedia dan tinjau [[MOS:DATEFORMAT]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Removing proper sources containing dead links
          // ------------------------------------------------------------------
          {
            value: "deadlinks",
            label: "Removing proper sources containing dead links",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: removing sources containing dead links =="
                : "== Notice: removing sources containing dead links ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: menghapus sumber yang memuat tautan mati =="
                : "== Pemberitahuan: menghapus sumber yang memuat tautan mati ==";
              const bodyEn =
                `Your recent edits appear to have removed one or more references solely because the URL they contain is no longer accessible. A dead link does not invalidate a citation: the underlying source may still exist in print, in archives, or via a web archive service. Rather than removing such references, please consider updating the URL, marking them with {{tlx|dead link}}, or locating an archived version via the [[WP:WAYBACK|Wayback Machine]]. See [[WP:DEADREF]] for guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus satu atau lebih referensi semata-mata karena URL yang dikandungnya tidak lagi dapat diakses. Pranala mati tidak membatalkan sebuah kutipan. Sumber yang mendasarinya mungkin masih ada dalam bentuk cetak, arsip, atau melalui layanan arsip web. Daripada menghapus referensi tersebut, pertimbangkan untuk memperbarui URL, menandainya dengan {{tlx|dead link}}, atau menemukan versi yang diarsipkan melalui [[WP:WAYBACK|Wayback Machine]]. Lihat [[WP:DEADREF]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Incorrect use of DISPLAYTITLE
          // ------------------------------------------------------------------
          {
            value: "displaytitle",
            label: "Incorrect use of DISPLAYTITLE",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: incorrect use of DISPLAYTITLE =="
                : "== Notice: incorrect use of DISPLAYTITLE ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penggunaan DISPLAYTITLE yang salah =="
                : "== Pemberitahuan: penggunaan DISPLAYTITLE yang salah ==";
              const bodyEn =
                `Your recent edits appear to have used the <code>{{DISPLAYTITLE}}</code> magic word in a way that does not comply with its intended purpose. <code>DISPLAYTITLE</code> may only be used to apply italics, change capitalisation, or make other minor adjustments consistent with the [[MOS:TITLE|Manual of Style]] where those changes differ from the page name. It must not be used to substantially alter how the page title appears or to circumvent naming conventions. Please review [[WP:DISPLAYTITLE]] before using this feature again.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menggunakan kata magis <code>{{DISPLAYTITLE}}</code> dengan cara yang tidak sesuai dengan tujuan penggunaannya. <code>DISPLAYTITLE</code> hanya boleh digunakan untuk menerapkan cetak miring, mengubah kapitalisasi, atau melakukan penyesuaian kecil lainnya yang sesuai dengan [[MOS:TITLE|Panduan gaya]] di mana perubahan tersebut berbeda dari nama halaman. Kata ajaib ini tidak boleh digunakan untuk mengubah tampilan judul halaman secara substansial atau untuk menghindari konvensi penamaan. Harap tinjau [[WP:DISPLAYTITLE]] sebelum menggunakan fitur ini lagi.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // User should draft in userspace without the risk of speedy deletion
          // ------------------------------------------------------------------
          {
            value: "draftinuserspace",
            label:
              "User should draft in userspace without the risk of speedy deletion",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: draft in userspace =="
                : "== Notice: draft in userspace ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: buat draf di ruang pengguna =="
                : "== Pemberitahuan: buat draf di ruang pengguna ==";
              const bodyEn =
                `It appears that you are working on a new article that is not yet ready for the main encyclopaedia. To avoid the risk of [[WP:CSD|speedy deletion]], you are welcome to develop it as a draft in your userspace, for example at [[Special:MyPage/Drafts|User:{{subst:REVISIONUSER}}/Drafts]]. Once it is sufficiently developed and meets [[WP:NCRIT|Wikipedia's notability guidelines]], you can submit it for review or move it to the main namespace. See [[WP:YFA]] for guidance on writing new articles.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Tampaknya Anda sedang mengerjakan artikel baru yang belum siap untuk ensiklopedia utama. Untuk menghindari risiko [[WP:CSD|penghapusan cepat]], Anda dipersilakan untuk mengembangkannya sebagai draf di ruang pengguna Anda, misalnya di [[Special:MyPage/Draf|Pengguna:{{subst:REVISIONUSER}}/Draf]]. Setelah cukup berkembang dan memenuhi [[WP:NCRIT|panduan kelayakan Wikipedia]], Anda dapat mengajukannya untuk ditinjau atau memindahkannya ke ruang nama utama. Lihat [[WP:YFA]] untuk panduan menulis artikel baru.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // New user not using edit summary
          // ------------------------------------------------------------------
          {
            value: "newusereditsummary",
            label: "New user not using edit summary",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: please use edit summaries =="
                : "== Notice: please use edit summaries ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: harap gunakan ringkasan suntingan =="
                : "== Pemberitahuan: harap gunakan ringkasan suntingan ==";
              const bodyEn =
                `Welcome to Wikipedia! You may not yet be aware of the importance of edit summaries. When you make an edit, please use the edit summary box to briefly explain what you changed and why. Edit summaries help other editors understand your contributions and make it easier to review changes. Even a short note is helpful. See [[WP:ES]] for more information.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Selamat datang di Wikipedia! Anda mungkin belum mengetahui pentingnya ringkasan suntingan. Saat Anda melakukan suntingan, gunakan kotak ringkasan suntingan untuk menjelaskan secara singkat apa yang Anda ubah dan mengapa. Ringkasan suntingan membantu penyunting lain memahami kontribusi Anda dan memudahkan peninjauan perubahan. Bahkan catatan singkat pun sangat berguna. Lihat [[WP:ES]] untuk informasi lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Experienced user not using edit summary
          // ------------------------------------------------------------------
          {
            value: "expusereditsummary",
            label: "Experienced user not using edit summary",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: please use edit summaries =="
                : "== Notice: please use edit summaries ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: harap gunakan ringkasan suntingan =="
                : "== Pemberitahuan: harap gunakan ringkasan suntingan ==";
              const bodyEn =
                `As an experienced editor, you will be aware of the importance of edit summaries. Your recent edits appear to have been made without one. Please remember to complete the edit summary field whenever you edit a page, even for minor changes. Edit summaries are essential for transparency and help other editors review and understand your contributions. See [[WP:ES]] for a reminder of best practice.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Sebagai penyunting berpengalaman, Anda tentu mengetahui pentingnya ringkasan suntingan. Suntingan Anda yang baru-baru ini tampaknya dilakukan tanpa ringkasan suntingan. Harap ingat untuk mengisi kolom ringkasan suntingan setiap kali Anda menyunting halaman, bahkan untuk perubahan kecil sekalipun. Ringkasan suntingan sangat penting untuk transparansi dan membantu penyunting lain meninjau serta memahami kontribusi Anda. Lihat [[WP:ES]] untuk pengingat praktik terbaik.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Adding external links to the body of an article
          // ------------------------------------------------------------------
          {
            value: "elinarticle",
            label: "Adding external links to the body of an article",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: external links in article body =="
                : "== Notice: external links in article body ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: pranala luar di badan artikel =="
                : "== Pemberitahuan: pranala luar di badan artikel ==";
              const bodyEn =
                `Your recent edits appear to have added external links directly into the body text of one or more articles. In Wikipedia, external links should generally only appear in the "External links" section at the foot of an article, or as part of a formatted inline citation. Bare external links embedded in article prose are not in keeping with our formatting guidelines. Please review [[WP:EL]] and [[WP:ELSTYLE]] for guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan pranala luar langsung ke dalam teks badan satu atau lebih artikel. Di Wikipedia, pranala luar umumnya hanya boleh muncul di bagian "Pranala luar" di bagian bawah artikel, atau sebagai bagian dari kutipan sebaris yang diformat. Pranala luar mentah yang disisipkan dalam prosa artikel tidak sesuai dengan panduan pemformatan kami. Harap tinjau [[WP:EL]] dan [[WP:ELSTYLE]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Hasty addition of speedy deletion tags
          // ------------------------------------------------------------------
          {
            value: "hastycsd",
            label: "Hasty addition of speedy deletion tags",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: hasty addition of speedy deletion tags =="
                : "== Notice: hasty addition of speedy deletion tags ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penambahan tag hapus cepat yang terburu-buru =="
                : "== Pemberitahuan: penambahan tag hapus cepat yang terburu-buru ==";
              const bodyEn =
                `Your recent edits appear to have tagged one or more pages for [[WP:CSD|speedy deletion]] without sufficient cause. Speedy deletion criteria are narrow and specific; pages that do not clearly meet a named criterion should not be tagged for speedy deletion. If you have concerns about a page's suitability, please consider nominating it for [[WP:AFD|articles for deletion]] or raising the issue on the article's talk page instead. Please review [[WP:CSD]] before tagging further pages.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menandai satu atau lebih halaman untuk [[WP:CSD|penghapusan cepat]] tanpa alasan yang memadai. Kriteria penghapusan cepat bersifat sempit dan spesifik. Halaman yang tidak memenuhi kriteria yang disebutkan secara jelas tidak boleh ditandai untuk penghapusan cepat. Jika Anda memiliki kekhawatiran tentang kelayakan sebuah halaman, pertimbangkan untuk menominasikannya untuk [[WP:AFD|artikel yang akan dihapus]] atau sebaliknya angkat masalah tersebut di halaman pembicaraan artikel. Harap tinjau [[WP:CSD]] sebelum menandai halaman lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Use of Islamic honorifics
          // ------------------------------------------------------------------
          {
            value: "islamichon",
            label: "Use of Islamic honorifics",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: use of Islamic honorifics =="
                : "== Notice: use of Islamic honorifics ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penggunaan gelar kehormatan Islam =="
                : "== Pemberitahuan: penggunaan gelar kehormatan Islam ==";
              const bodyEn =
                `Your recent edits appear to have added Islamic honorifics — such as "peace be upon him" (PBUH/SAW) or "may Allah be pleased with him/her" — to one or more articles. Wikipedia's [[MOS:HON|Manual of Style]] advises against the use of honorifics of any religious tradition in encyclopaedic articles, as their inclusion may not reflect the neutral point of view required of all articles. Please review [[MOS:HON]] and [[WP:NPOV]] before making further edits of this kind.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan gelar kehormatan Islam, seperti "shallallahu 'alaihi wasallam" (SAW) atau "radhiyallahu 'anhu/ha", ke satu atau lebih artikel. [[MOS:HON|Panduan gaya Wikipedia]] tidak menganjurkan penggunaan gelar kehormatan dari tradisi keagamaan mana pun dalam artikel ensiklopedis, karena penyertaannya mungkin tidak mencerminkan sudut pandang netral yang diperlukan dari semua artikel. Harap tinjau [[MOS:HON]] dan [[WP:NPOV]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Italicise books, films, albums, magazines, TV series, etc. within articles
          // ------------------------------------------------------------------
          {
            value: "italicstitle",
            label:
              "Italicise books, films, albums, magazines, TV series, etc. within articles",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: italicising titles of works =="
                : "== Notice: italicising titles of works ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penggunaan cetak miring pada judul karya =="
                : "== Pemberitahuan: penggunaan cetak miring pada judul karya ==";
              const bodyEn =
                `Your recent edits appear to have either failed to italicise titles of works or to have italicised titles that should not be styled that way. According to [[MOS:ITAL|Wikipedia's Manual of Style]], the titles of books, films, albums, magazines, newspapers, television series, and other long-form works should be italicised when mentioned within article text. Shorter works such as song titles and individual episodes are placed in quotation marks instead. Please review [[MOS:ITAL]] for guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya tidak menggunakan cetak miring pada judul karya, atau justru menggunakan cetak miring pada judul yang seharusnya tidak diberi gaya seperti itu. Menurut [[MOS:ITAL|Panduan gaya Wikipedia]], judul buku, film, album, majalah, surat kabar, serial televisi, dan karya panjang lainnya harus dicetak miring ketika disebutkan dalam teks artikel. Karya yang lebih pendek seperti judul lagu dan episode individual ditulis dalam tanda kutip. Harap tinjau [[MOS:ITAL]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Unnecessarily changing between British and American English
          // ------------------------------------------------------------------
          {
            value: "engvarchange",
            label:
              "Unnecessarily changing between British and American English",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: unnecessarily changing English variety =="
                : "== Notice: unnecessarily changing English variety ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: mengubah ragam bahasa Inggris secara tidak perlu =="
                : "== Pemberitahuan: mengubah ragam bahasa Inggris secara tidak perlu ==";
              const bodyEn =
                `Your recent edits appear to have changed the variety of English used in one or more articles — for example, converting between British and American spellings — without good reason to do so. Wikipedia's [[MOS:ENGVAR|Manual of Style]] advises that whichever variety of English is established in an article should be maintained consistently, and that editors should not change it without a clear and compelling justification. Please review [[MOS:ENGVAR]] before making further edits of this kind.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya mengubah ragam bahasa Inggris yang digunakan dalam satu atau lebih artikel, misalnya mengubah ejaan Inggris Britania ke Inggris Amerika atau sebaliknya, tanpa alasan yang tepat. [[MOS:ENGVAR|Panduan gaya Wikipedia]] menyarankan agar ragam bahasa Inggris yang telah ditetapkan dalam sebuah artikel dipertahankan secara konsisten, dan para penyunting tidak boleh mengubahnya tanpa pembenaran yang jelas dan kuat. Harap tinjau [[MOS:ENGVAR]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Excessive addition of redlinks or repeated blue links
          // ------------------------------------------------------------------
          {
            value: "overlinking",
            label: "Excessive addition of redlinks or repeated blue links",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: excessive or repeated links =="
                : "== Notice: excessive or repeated links ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: tautan berlebihan atau berulang =="
                : "== Pemberitahuan: tautan berlebihan atau berulang ==";
              const bodyEn =
                `Your recent edits appear to have added an excessive number of wikilinks to one or more articles, including repeated links to the same target or a large number of redlinks to non-notable topics. Wikipedia's [[WP:OVERLINK|overlinking guideline]] advises that terms should generally be linked only once per article, and only when the linked article is likely to help the reader understand the text. Redlinks should only be used for topics that are genuinely likely to warrant their own article. Please review [[WP:OVERLINK]] and [[WP:REDLINK]] for guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan pranala wiki yang berlebihan ke satu atau lebih artikel, termasuk tautan berulang ke target yang sama atau sejumlah besar pranala merah ke topik yang tidak layak. [[WP:OVERLINK|Panduan tautan berlebihan Wikipedia]] menyarankan agar istilah umumnya hanya ditautkan sekali per artikel, dan hanya jika artikel yang ditautkan kemungkinan besar membantu pembaca memahami teks. Pranala merah hanya boleh digunakan untuk topik yang benar-benar kemungkinan layak mendapatkan artikel tersendiri. Harap tinjau [[WP:OVERLINK]] dan [[WP:REDLINK]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Insertion of long short description
          // ------------------------------------------------------------------
          {
            value: "shortdesc",
            label: "Insertion of long short description",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: long short description =="
                : "== Notice: long short description ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: deskripsi singkat yang terlalu panjang =="
                : "== Pemberitahuan: deskripsi singkat yang terlalu panjang ==";
              const bodyEn =
                `Your recent edits appear to have added a short description that is longer than recommended. Short descriptions, added via the {{tlx|Short description}} template, are intended to be a brief disambiguating phrase — typically no more than 40 characters — that helps readers identify the article's subject in search results. They should not be full sentences. Please review [[WP:SDSHORT]] for guidance on writing effective short descriptions.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan deskripsi singkat yang lebih panjang dari yang direkomendasikan. Deskripsi singkat, yang ditambahkan melalui templat {{tlx|Short description}}, dimaksudkan sebagai frasa pembeda yang ringkas, biasanya tidak lebih dari 40 karakter, yang membantu pembaca mengidentifikasi subjek artikel dalam hasil pencarian. Deskripsi ini tidak boleh berupa kalimat lengkap. Harap tinjau [[WP:SDSHORT]] untuk panduan menulis deskripsi singkat yang efektif.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Incorrect use of minor edits check box
          // ------------------------------------------------------------------
          {
            value: "minoredit",
            label: "Incorrect use of minor edits check box",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: incorrect use of the minor edit checkbox =="
                : "== Notice: incorrect use of the minor edit checkbox ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penggunaan kotak centang suntingan kecil yang salah =="
                : "== Pemberitahuan: penggunaan kotak centang suntingan kecil yang salah ==";
              const bodyEn =
                `Your recent edits appear to have been marked as minor when the changes made were not minor in nature. The minor edit checkbox should only be used for genuinely trivial changes, such as fixing spelling or punctuation, that could not be considered controversial. Marking a substantive edit as minor can cause other editors to overlook it during recent changes patrol. Please review [[WP:MINOR]] for guidance on when to use this feature.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah ditandai sebagai suntingan kecil padahal perubahan yang dilakukan tidak bersifat kecil. Kotak centang suntingan kecil hanya boleh digunakan untuk perubahan yang benar-benar sepele, seperti memperbaiki ejaan atau tanda baca, yang tidak dapat dianggap kontroversial. Menandai suntingan substantif sebagai suntingan kecil dapat menyebabkan penyunting lain mengabaikannya saat patroli perubahan terbaru. Harap tinjau [[WP:MINOR]] untuk panduan kapan menggunakan fitur ini.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Formatting of trademarks
          // ------------------------------------------------------------------
          {
            value: "trademarks",
            label: "Formatting of trademarks",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: formatting of trademarks =="
                : "== Notice: formatting of trademarks ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: pemformatan merek dagang =="
                : "== Pemberitahuan: pemformatan merek dagang ==";
              const bodyEn =
                `Your recent edits appear to have formatted one or more trademarks in a way that does not comply with Wikipedia's style guidelines. Wikipedia does not use trademark symbols (™ or ®) in article text, and the capitalisation of trademarked terms should follow standard English rules rather than the stylised capitalisation used in marketing materials — unless the non-standard form is extremely well established. Please review [[MOS:TM]] before making further edits of this kind.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya memformat satu atau lebih merek dagang dengan cara yang tidak sesuai dengan panduan gaya Wikipedia. Wikipedia tidak menggunakan simbol merek dagang (™ atau ®) dalam teks artikel, dan kapitalisasi istilah merek dagang harus mengikuti aturan bahasa Inggris standar daripada kapitalisasi bergaya yang digunakan dalam materi pemasaran, kecuali jika bentuk non-standar tersebut sudah sangat mapan. Harap tinjau [[MOS:TM]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Inappropriate use of alternative accounts
          // ------------------------------------------------------------------
          {
            value: "altaccountmisuse",
            label: "Inappropriate use of alternative accounts",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: inappropriate use of alternative accounts =="
                : "== Notice: inappropriate use of alternative accounts ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penggunaan akun alternatif yang tidak sesuai =="
                : "== Pemberitahuan: penggunaan akun alternatif yang tidak sesuai ==";
              const bodyEn =
                `Your use of an alternative account appears to fall outside the circumstances permitted by [[WP:SOCK|Wikipedia's policy on alternative accounts]]. Alternative accounts must not be used to create the appearance of broader consensus, to circumvent blocks or sanctions, to edit articles where your main account has a declared conflict of interest, or to otherwise gain an advantage that a single account would not have. Please review [[WP:SOCK]] and [[WP:LEGITSOCK]] and ensure that any alternative accounts you operate are used only for permitted purposes.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Penggunaan akun alternatif Anda tampaknya berada di luar keadaan yang diizinkan oleh [[WP:SOCK|kebijakan Wikipedia tentang akun alternatif]]. Akun alternatif tidak boleh digunakan untuk menciptakan kesan konsensus yang lebih luas, untuk menghindari pemblokiran atau sanksi, untuk menyunting artikel saat akun utama Anda memiliki konflik kepentingan yang dideklarasikan, atau untuk memperoleh keuntungan lain yang tidak akan dimiliki oleh satu akun saja. Harap tinjau [[WP:SOCK]] dan [[WP:LEGITSOCK]] dan pastikan akun alternatif yang Anda kelola hanya digunakan untuk tujuan yang diizinkan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // We use consensus, not voting
          // ------------------------------------------------------------------
          {
            value: "consensus",
            label: "We use consensus, not voting",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: consensus, not voting =="
                : "== Notice: consensus, not voting ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: konsensus, bukan pemungutan suara =="
                : "== Pemberitahuan: konsensus, bukan pemungutan suara ==";
              const bodyEn =
                `Your recent comments in one or more discussions suggest a misunderstanding of how Wikipedia reaches decisions. Wikipedia does not operate by majority vote: decisions are made by [[WP:CONSENSUS|consensus]], which means weighing up the arguments and evidence presented, not simply counting the number of editors on each side. Please focus your contributions to discussions on policy-based reasoning rather than on expressing a preference or tallying support. See [[WP:CONSENSUS]] and [[WP:NOTDEMOCRACY]] for further guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Komentar Anda yang baru-baru ini dalam satu atau lebih diskusi menunjukkan kesalahpahaman tentang bagaimana Wikipedia mencapai keputusan. Wikipedia tidak beroperasi melalui pemungutan suara mayoritas: keputusan dibuat melalui [[WP:CONSENSUS|konsensus]], yang berarti mempertimbangkan argumen dan bukti yang dikemukakan, bukan sekadar menghitung jumlah penyunting di setiap sisi. Harap fokuskan kontribusi Anda dalam diskusi pada penalaran berbasis kebijakan daripada mengungkapkan preferensi atau menghitung dukungan. Lihat [[WP:CONSENSUS]] dan [[WP:NOTDEMOCRACY]] untuk panduan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Talk page created with no article
          // ------------------------------------------------------------------
          {
            value: "talknearticle",
            label: "Talk page created with no article",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: talk page created with no article =="
                : "== Notice: talk page created with no article ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: halaman pembicaraan dibuat tanpa artikel =="
                : "== Pemberitahuan: halaman pembicaraan dibuat tanpa artikel ==";
              const bodyEn =
                `You appear to have created a talk page for an article that does not exist. Talk pages exist to support discussion about their corresponding article; they should not be created independently. If you wish to write an article on this topic, please create it in the main namespace or as a draft. The talk page will be created automatically once an article exists. If the article was deleted, please do not recreate its talk page.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Anda tampaknya telah membuat halaman pembicaraan untuk artikel yang tidak ada. Halaman pembicaraan ada untuk mendukung diskusi tentang artikel yang sesuai. Halaman ini tidak boleh dibuat secara mandiri. Jika Anda ingin menulis artikel tentang topik ini, buatlah di ruang nama utama atau sebagai draf. Halaman pembicaraan akan dibuat secara otomatis setelah artikel ada. Jika artikel telah dihapus, jangan buat ulang halaman pembicaraannya.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Copying from public domain sources without attribution
          // ------------------------------------------------------------------
          {
            value: "pdnoattrib",
            label: "Copying from public domain sources without attribution",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: copying from public domain sources without attribution =="
                : "== Notice: copying from public domain sources without attribution ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: menyalin dari sumber domain publik tanpa atribusi =="
                : "== Pemberitahuan: menyalin dari sumber domain publik tanpa atribusi ==";
              const bodyEn =
                `Your recent edits appear to have copied text from a public domain source without providing the required attribution. Even though public domain works may be reproduced freely, Wikipedia's best practice is to acknowledge the source in order to maintain transparency and aid further research. Please note the source of any copied text in your edit summary and, where appropriate, in the article itself. See [[WP:PD]] and [[WP:PDTXT]] for guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyalin teks dari sumber domain publik tanpa memberikan atribusi yang diperlukan. Meskipun karya domain publik dapat direproduksi secara bebas, praktik terbaik Wikipedia adalah mengakui sumbernya untuk menjaga transparansi dan membantu penelitian lebih lanjut. Harap catat sumber teks yang disalin dalam ringkasan suntingan Anda dan, jika sesuai, dalam artikel itu sendiri. Lihat [[WP:PD]] dan [[WP:PDTXT]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Use preview button to avoid mistakes
          // ------------------------------------------------------------------
          {
            value: "preview",
            label: "Use preview button to avoid mistakes",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: use the preview button =="
                : "== Notice: use the preview button ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: gunakan tombol pratinjau =="
                : "== Pemberitahuan: gunakan tombol pratinjau ==";
              const bodyEn =
                `Your recent editing pattern appears to involve a large number of consecutive small edits to the same page. This can clutter the page's revision history and make it harder to review changes. Before saving, please use the "Show preview" button to check your edits for errors and make all necessary corrections in a single save. See [[WP:PREVIEW]] for more information.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Pola penyuntingan Anda yang baru-baru ini tampaknya melibatkan sejumlah besar suntingan kecil berturut-turut pada halaman yang sama. Hal ini dapat membuat riwayat revisi halaman menjadi penuh dan menyulitkan peninjauan perubahan. Sebelum menyimpan, gunakan tombol "Tampilkan pratinjau" untuk memeriksa suntingan Anda dari kesalahan dan melakukan semua koreksi yang diperlukan dalam satu kali penyimpanan. Lihat [[WP:PREVIEW]] untuk informasi lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Indiscriminate removal of redlinks
          // ------------------------------------------------------------------
          {
            value: "remredlinks",
            label: "Indiscriminate removal of redlinks",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: indiscriminate removal of redlinks =="
                : "== Notice: indiscriminate removal of redlinks ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penghapusan tautan merah secara tidak selektif =="
                : "== Pemberitahuan: penghapusan tautan merah secara tidak selektif ==";
              const bodyEn =
                `Your recent edits appear to have removed redlinks from one or more articles without considering whether those links serve a useful purpose. Redlinks are not errors: they indicate that a linked article does not yet exist and can encourage editors to create it. Redlinks to topics that are genuinely likely to be notable enough for their own article should generally be retained. Please review [[WP:REDLINK]] before removing redlinks in future.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus pranala merah dari satu atau lebih artikel tanpa mempertimbangkan apakah tautan tersebut bermanfaat. Pranala merah bukan kesalahan. Ia menunjukkan bahwa artikel yang ditautkan belum ada dan dapat mendorong penyunting untuk membuatnya. Pranala merah ke topik yang benar-benar kemungkinan cukup layak untuk memiliki artikel tersendiri umumnya harus dipertahankan. Harap tinjau [[WP:REDLINK]] sebelum menghapus tautan merah di masa mendatang.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Adding citations to research published by a small group of researchers
          // ------------------------------------------------------------------
          {
            value: "fringe",
            label:
              "Adding citations to research published by a small group of researchers",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: citing fringe or undue research =="
                : "== Notice: citing fringe or undue research ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: pengutipan penelitian pinggiran atau tidak proporsional =="
                : "== Pemberitahuan: pengutipan penelitian pinggiran atau tidak proporsional ==";
              const bodyEn =
                `Your recent edits appear to have added citations to research produced by a very small number of researchers that does not reflect the mainstream scientific or academic view. Wikipedia requires that article content give appropriate weight to the range of perspectives represented in reliable sources, and that minority or fringe views be clearly contextualised as such. Please review [[WP:FRINGE]], [[WP:UNDUE]], and [[WP:MEDRS]] (where applicable) before making further edits of this kind.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan kutipan penelitian yang dihasilkan oleh sejumlah kecil peneliti yang tidak mencerminkan pandangan ilmiah atau akademis arus utama. Wikipedia mensyaratkan konten artikel memberikan bobot yang tepat terhadap berbagai perspektif yang diwakili dalam sumber tepercaya, dan pandangan minoritas atau pinggiran harus dikontekstualisasikan dengan jelas sebagai demikian. Harap tinjau [[WP:FRINGE]], [[WP:UNDUE]], dan [[WP:MEDRS]] (jika berlaku) sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Self-reverted editing tests
          // ------------------------------------------------------------------
          {
            value: "selfrevtest",
            label: "Self-reverted editing tests",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: self-reverted editing tests =="
                : "== Notice: self-reverted editing tests ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: uji coba penyuntingan yang dibatalkan sendiri =="
                : "== Pemberitahuan: uji coba penyuntingan yang dibatalkan sendiri ==";
              const bodyEn =
                `It appears that you may have been testing edits on one or more pages and subsequently reverting them yourself. While self-reverting is appreciated, test edits should be made in the [[WP:SANDBOX|sandbox]] rather than in the main namespace, as every edit — including test edits — leaves an entry in the page's revision history. Please use the sandbox for any future editing experiments.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Tampaknya Anda mungkin sedang menguji suntingan di satu atau lebih halaman dan kemudian membatalkannya sendiri. Meskipun pembatalan mandiri merupakan hal yang diapresiasi, uji coba suntingan sebaiknya dilakukan di [[WP:SANDBOX|bak pasir]] daripada di ruang nama utama, karena setiap suntingan, termasuk uji coba, meninggalkan entri dalam riwayat revisi halaman. Gunakan bak pasir untuk percobaan penyuntingan di masa mendatang.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Wikipedia is not a social network
          // ------------------------------------------------------------------
          {
            value: "notsocial",
            label: "Wikipedia is not a social network",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: Wikipedia is not a social network =="
                : "== Notice: Wikipedia is not a social network ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: Wikipedia bukan jejaring sosial =="
                : "== Pemberitahuan: Wikipedia bukan jejaring sosial ==";
              const bodyEn =
                `Your recent contributions appear to treat Wikipedia as a social networking platform. Wikipedia is an encyclopaedia, and its pages — including user pages and talk pages — should be used primarily to support the goal of building and improving encyclopaedic content. Extensive personal posts, social chatter, or use of your user page as a personal profile are discouraged. Please review [[WP:NOT#SOCIAL]] and [[WP:USERPAGE]] for guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Kontribusi Anda yang baru-baru ini tampaknya memperlakukan Wikipedia sebagai platform jejaring sosial. Wikipedia adalah ensiklopedia, dan halaman-halamannya, termasuk halaman pengguna dan halaman pembicaraan, harus digunakan terutama untuk mendukung tujuan membangun dan meningkatkan konten ensiklopedis. Kiriman pribadi yang berlebihan, obrolan sosial, atau penggunaan halaman pengguna Anda sebagai profil pribadi tidak dianjurkan. Harap tinjau [[WP:NOT#SOCIAL]] dan [[WP:USERPAGE]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Be bold and fix things yourself
          // ------------------------------------------------------------------
          {
            value: "bebold",
            label: "Be bold and fix things yourself",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: be bold =="
                : "== Notice: be bold ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: beranilah =="
                : "== Pemberitahuan: beranilah ==";
              const bodyEn =
                `Your recent talk-page message or edit request suggests that you may be hesitant to make an edit directly. Wikipedia encourages editors to [[WP:BOLD|be bold]] and make improvements themselves rather than asking others to do so on their behalf. If you can see something that needs fixing, feel free to fix it — all edits can be reviewed and undone if necessary. See [[WP:BOLD]] for more information.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Pesan halaman pembicaraan atau permintaan suntingan Anda yang baru-baru ini menunjukkan bahwa Anda mungkin ragu untuk melakukan suntingan secara langsung. Wikipedia mendorong penyunting untuk [[WP:BOLD|berani]] dan melakukan perbaikan sendiri daripada meminta orang lain melakukannya atas nama mereka. Jika Anda melihat sesuatu yang perlu diperbaiki, silakan perbaiki, karena semua suntingan dapat ditinjau dan dibatalkan jika diperlukan. Lihat [[WP:BOLD]] untuk informasi lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Adding spoiler alerts or removing spoilers from appropriate sections
          // ------------------------------------------------------------------
          {
            value: "spoilers",
            label:
              "Adding spoiler alerts or removing spoilers from appropriate sections",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: spoiler alerts and spoiler content =="
                : "== Notice: spoiler alerts and spoiler content ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: peringatan spoiler dan konten spoiler =="
                : "== Pemberitahuan: peringatan spoiler dan konten spoiler ==";
              const bodyEn =
                `Your recent edits appear to have either added "spoiler warning" templates to one or more articles or removed plot details from sections where such information is appropriate. Wikipedia is an encyclopaedia that provides comprehensive information about its subjects, including plot summaries and story details of fictional works. Spoiler warnings are not used on Wikipedia, and plot content that is relevant to the article's subject should not be removed. Please review [[WP:SPOILER]] for further information.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan templat "peringatan beberan" ke satu atau lebih artikel atau menghapus detail plot dari bagian tempat informasi tersebut sesuai. Wikipedia adalah ensiklopedia yang memberikan informasi komprehensif tentang subjeknya, termasuk ringkasan plot dan detail cerita karya fiksi. Peringatan beberan tidak digunakan di Wikipedia, dan konten plot yang relevan dengan subjek artikel tidak boleh dihapus. Harap tinjau [[WP:SPOILER]] untuk informasi lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Talk in article
          // ------------------------------------------------------------------
          {
            value: "talkarticle",
            label: "Talk in article",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: talk in article =="
                : "== Notice: talk in article ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: diskusi dalam artikel =="
                : "== Pemberitahuan: diskusi dalam artikel ==";
              const bodyEn =
                `Your recent edits appear to have added comments, questions, or notes directed at other editors into the text of an article. Article pages are for encyclopaedic content only. If you wish to discuss an article, ask a question about it, or leave a note for other editors, please use the article's [[WP:TALKPAGE|talk page]] instead. See [[WP:TALK]] for guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan komentar, pertanyaan, atau catatan yang ditujukan kepada penyunting lain ke dalam teks artikel. Halaman artikel hanya untuk konten ensiklopedis. Jika Anda ingin mendiskusikan sebuah artikel, mengajukan pertanyaan tentangnya, atau meninggalkan catatan untuk penyunting lain, gunakan [[WP:TALKPAGE|halaman pembicaraan]] artikel tersebut. Lihat [[WP:TALK]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Not signing posts
          // ------------------------------------------------------------------
          {
            value: "nosign",
            label: "Not signing posts",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: please sign your posts =="
                : "== Notice: please sign your posts ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: harap tandatangani kiriman Anda =="
                : "== Pemberitahuan: harap tandatangani kiriman Anda ==";
              const bodyEn =
                `Your recent posts to one or more talk pages appear to have been made without a signature. Please remember to sign all talk page posts by typing four tildes (<code><nowiki>~~~~</nowiki></code>) at the end of your comment, or by clicking the signature button in the editor toolbar. Signing your posts helps other editors identify who said what and when. See [[WP:SIGN]] for more information.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Kiriman Anda yang baru-baru ini di satu atau lebih halaman pembicaraan tampaknya dilakukan tanpa tanda tangan. Harap ingat untuk menandatangani semua kiriman halaman pembicaraan dengan mengetik empat tilde (<code><nowiki>~~~~</nowiki></code>) di akhir komentar Anda, atau dengan mengklik tombol tanda tangan di bilah perkakas editor. Menandatangani kiriman Anda membantu penyunting lain mengidentifikasi siapa yang berkata apa dan kapan. Lihat [[WP:SIGN]] untuk informasi lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Posting at the top of talk pages
          // ------------------------------------------------------------------
          {
            value: "talkpagetop",
            label: "Posting at the top of talk pages",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: posting at the top of talk pages =="
                : "== Notice: posting at the top of talk pages ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: kiriman di bagian atas halaman pembicaraan =="
                : "== Pemberitahuan: kiriman di bagian atas halaman pembicaraan ==";
              const bodyEn =
                `Your recent posts appear to have been added to the top of a talk page rather than at the bottom. On Wikipedia, new talk page topics and responses should be added at the bottom of the page (or at the bottom of the relevant thread), not the top, so that discussions appear in chronological order. Please review [[WP:TALKNEW]] before posting on talk pages again.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Kiriman Anda yang baru-baru ini tampaknya ditambahkan di bagian atas halaman pembicaraan daripada di bagian bawah. Di Wikipedia, topik halaman pembicaraan baru dan tanggapan harus ditambahkan di bagian bawah halaman (atau di bagian bawah utas yang relevan), bukan di bagian atas, sehingga diskusi muncul secara urutan kronologis. Harap tinjau [[WP:TALKNEW]] sebelum kembali memposting di halaman pembicaraan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Adding translations without proper attribution
          // ------------------------------------------------------------------
          {
            value: "transnoattrib",
            label: "Adding translations without proper attribution",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: translations without proper attribution =="
                : "== Notice: translations without proper attribution ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: terjemahan tanpa atribusi yang tepat =="
                : "== Pemberitahuan: terjemahan tanpa atribusi yang tepat ==";
              const bodyEn =
                `Your recent edits appear to have added content translated from another language Wikipedia without providing the attribution required by the source wiki's licence. When importing content from another Wikipedia, you must credit the source article and its contributors, typically by noting this in the edit summary and on the article's talk page. Please review [[WP:TRANSWIKI]] and [[WP:ATTRIB]] for the correct procedure.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan konten yang diterjemahkan dari Wikipedia bahasa lain tanpa memberikan atribusi yang dipersyaratkan oleh lisensi wiki sumber. Saat mengimpor konten dari Wikipedia lain, Anda harus mengakui artikel sumber beserta kontributornya, biasanya dengan mencantumkan hal ini dalam ringkasan suntingan dan di halaman pembicaraan artikel. Harap tinjau [[WP:TRANSWIKI]] dan [[WP:ATTRIB]] untuk prosedur yang benar.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Copying from compatibly-licensed sources without attribution
          // ------------------------------------------------------------------
          {
            value: "ccnoattrib",
            label:
              "Copying from compatibly-licensed sources without attribution",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: copying from compatibly-licensed sources without attribution =="
                : "== Notice: copying from compatibly-licensed sources without attribution ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: menyalin dari sumber berlisensi kompatibel tanpa atribusi =="
                : "== Pemberitahuan: menyalin dari sumber berlisensi kompatibel tanpa atribusi ==";
              const bodyEn =
                `Your recent edits appear to have included text copied from a compatibly-licensed source (such as a Creative Commons-licensed work) without the required attribution. Even when a licence permits reproduction, its terms typically require that the original author and source be credited. Please provide the necessary attribution in your edit summary and, where appropriate, in the article. See [[WP:COPYPASTE]] and [[WP:ATTRIB]] for guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyertakan teks yang disalin dari sumber berlisensi kompatibel (seperti karya berlisensi Creative Commons) tanpa atribusi yang diperlukan. Meskipun lisensi mengizinkan reproduksi, ketentuannya biasanya mensyaratkan agar penulis dan sumber asli dicantumkan. Harap berikan atribusi yang diperlukan dalam ringkasan suntingan Anda dan, jika sesuai, dalam artikel. Lihat [[WP:COPYPASTE]] dan [[WP:ATTRIB]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Stale userspace draft
          // ------------------------------------------------------------------
          {
            value: "staleuserdraft",
            label: "Stale userspace draft",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: stale userspace draft =="
                : "== Notice: stale userspace draft ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: draf ruang pengguna yang kedaluwarsa =="
                : "== Pemberitahuan: draf ruang pengguna yang kedaluwarsa ==";
              const bodyEn =
                `You have one or more userspace drafts that have not been edited for a considerable period of time. Stale drafts that have been inactive for an extended period may be eligible for deletion under [[WP:CSD#U5|CSD U5]]. If you intend to continue working on a draft, please make some progress on it; if you no longer wish to pursue it, you may request its deletion by adding <code>{{tlx|Db-u1}}</code> to the page. See [[WP:STALEDRAFT]] for guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Anda memiliki satu atau lebih draf ruang pengguna yang sudah lama tidak disunting. Draf yang sudah lama tidak aktif mungkin memenuhi syarat untuk dihapus berdasarkan [[WP:CSD#U5|CSD U5]]. Jika Anda bermaksud melanjutkan pengerjaan draf, harap buat beberapa kemajuan. Jika Anda tidak lagi ingin melanjutkannya, Anda dapat meminta penghapusannya dengan menambahkan <code>{{tlx|delete|U1}}</code> ke halaman. Lihat [[WP:STALEDRAFT]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Misuse of user talk page
          // ------------------------------------------------------------------
          {
            value: "talkmisuse",
            label: "Misuse of user talk page",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: misuse of user talk page =="
                : "== Notice: misuse of user talk page ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penyalahgunaan halaman pembicaraan pengguna =="
                : "== Pemberitahuan: penyalahgunaan halaman pembicaraan pengguna ==";
              const bodyEn =
                `Your user talk page appears to have been used in a way that is not consistent with its intended purpose. User talk pages are primarily for receiving messages from other editors and for communication related to editing Wikipedia. They should not be used to publish content that would not be permitted in the main namespace, to host promotional material, or to carry on extended personal conversations unrelated to the project. Please review [[WP:USERPAGE]] and [[WP:TALKPAGE]] for guidance.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Halaman pembicaraan pengguna Anda tampaknya digunakan dengan cara yang tidak sesuai dengan tujuan yang dimaksudkan. Halaman pembicaraan pengguna terutama untuk menerima pesan dari penyunting lain dan untuk komunikasi yang berkaitan dengan penyuntingan Wikipedia. Halaman ini tidak boleh digunakan untuk menerbitkan konten yang tidak diizinkan di ruang nama utama, untuk menampung materi promosi, atau untuk percakapan pribadi yang panjang yang tidak berkaitan dengan proyek. Harap tinjau [[WP:USERPAGE]] dan [[WP:TALKPAGE]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Adding video game walkthroughs, cheats or instructions
          // ------------------------------------------------------------------
          {
            value: "gameguide",
            label: "Adding video game walkthroughs, cheats or instructions",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: adding game guides or walkthroughs =="
                : "== Notice: adding game guides or walkthroughs ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: penambahan panduan atau panduan permainan =="
                : "== Pemberitahuan: penambahan panduan atau panduan permainan ==";
              const bodyEn =
                `Your recent edits appear to have added walkthrough instructions, cheat codes, tips, or other gameplay guidance to one or more articles. Wikipedia is an encyclopaedia, not a game guide; articles about video games should provide encyclopaedic information about the game rather than instructions on how to play it. Please review [[WP:NOT#GUIDE]] and consider contributing gameplay guides to a dedicated resource such as [[WP:WIKIA|a fan wiki]] instead.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan panduan cara bermain, kode curang, kiat, atau panduan bermain lainnya ke satu atau lebih artikel. Wikipedia adalah ensiklopedia, bukan panduan permainan. Artikel tentang permainan video harus memberikan informasi ensiklopedis tentang permainan tersebut daripada instruksi cara memainkannya. Harap tinjau [[WP:NOT#GUIDE]] dan pertimbangkan untuk menyumbangkan panduan bermain ke situs web khusus, seperti [[WP:WIKIA|wiki penggemar]].` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Place user warning templates when reverting vandalism
          // ------------------------------------------------------------------
          {
            value: "warnwhilerev",
            label: "Place user warning templates when reverting vandalism",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: warn users when reverting vandalism =="
                : "== Notice: warn users when reverting vandalism ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: beri peringatan pengguna saat membalik vandalisme =="
                : "== Pemberitahuan: beri peringatan pengguna saat membalik vandalisme ==";
              const bodyEn =
                `When reverting apparent vandalism, please remember to leave an appropriate warning on the responsible editor's talk page. Warning editors about problematic behaviour is an important step in the anti-vandalism process and helps users understand what they have done wrong before more serious action is considered. A range of warning templates is available via [[WP:WARN]]. Please make a habit of posting a warning after each revert of vandalism.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Saat membalik vandalisme yang jelas, harap ingat untuk meninggalkan peringatan yang sesuai di halaman pembicaraan penyunting yang bertanggung jawab. Memperingatkan penyunting tentang perilaku bermasalah adalah langkah penting dalam proses antivandalisme dan membantu pengguna memahami apa yang mereka lakukan salah sebelum tindakan yang lebih serius dipertimbangkan. Berbagai templat peringatan tersedia melalui [[WP:WARN]]. Harap biasakan untuk memposting peringatan setelah setiap pembalikan vandalisme.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Using inaccurate or inappropriate edit summaries
          // ------------------------------------------------------------------
          {
            value: "badsummary",
            label: "Using inaccurate or inappropriate edit summaries",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: inaccurate or inappropriate edit summaries =="
                : "== Notice: inaccurate or inappropriate edit summaries ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: ringkasan suntingan yang tidak akurat atau tidak sesuai =="
                : "== Pemberitahuan: ringkasan suntingan yang tidak akurat atau tidak sesuai ==";
              const bodyEn =
                `Your recent edits appear to have been accompanied by edit summaries that are inaccurate, misleading, or otherwise inappropriate. Edit summaries should accurately and concisely describe the change made. Using a misleading summary — for example, describing a significant edit as a minor correction, or using an edit summary to make personal remarks — is contrary to the spirit of transparent and collaborative editing. Please review [[WP:ES]] and ensure that your edit summaries accurately reflect your changes.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ~~~~`;
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya disertai ringkasan suntingan yang tidak akurat, menyesatkan, atau tidak sesuai. Ringkasan suntingan harus menggambarkan perubahan yang dilakukan secara akurat dan ringkas. Menggunakan ringkasan yang menyesatkan, misalnya menggambarkan suntingan yang signifikan sebagai koreksi kecil, atau menggunakan ringkasan suntingan untuk membuat komentar pribadi, bertentangan dengan semangat penyuntingan yang transparan dan kolaboratif. Harap tinjau [[WP:ES]] dan pastikan ringkasan suntingan Anda mencerminkan perubahan Anda secara akurat.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ~~~~`;
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
