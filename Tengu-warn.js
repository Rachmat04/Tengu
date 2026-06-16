/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — User warning message definitions
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

    // Helper functions for building notices with variable substitution.
    function buildNoticeWithTemplates(text, variables) {
      let result = text;
      Object.keys(variables).forEach((key) => {
        result = result.replace(new RegExp(`__${key}__`, "g"), variables[key]);
      });
      return result;
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda pada satu atau lebih halaman terindikasi sebagai [[WP:VAND|vandalisme]]. Vandalisme tidak diperkenankan di wiki ini. Harap hentikan suntingan yang merusak atau menurunkan kualitas ensiklopedia.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini terindikasi sebagai [[WP:DE|disruptif]]. Penyuntingan disruptif mengganggu operasional dan pengembangan wiki secara normal, terlepas dari niat pelakunya. Harap tinjau panduan yang relevan dan pastikan kontribusi Anda bersifat konstruktif.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Anda mungkin sedang melakukan uji coba penyuntingan pada satu atau lebih halaman. Jika ingin bereksperimen, gunakan [[WP:SANDBOX|bak pasir]] sebagai gantinya, tempat uji coba khusus. Suntingan pada halaman artikel dan halaman lain yang tidak meningkatkan kualitas konten akan dikembalikan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menghapus konten yang substansial dari satu atau lebih halaman tanpa penjelasan yang memadai. Jika penghapusan tersebut disengaja dan Anda merasa ada alasan yang sah, harap berikan ringkasan suntingan yang jelas atau diskusikan perubahan tersebut di halaman pembicaraan yang relevan. Penghapusan konten tanpa penjelasan dapat dianggap sebagai vandalisme.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyertakan konten yang dihasilkan oleh [[WP:LLM|model bahasa besar]] (seperti ChatGPT atau alat serupa) tanpa verifikasi atau referensi yang memadai. Teks yang dihasilkan kecerdasan buatan dapat mengandung kesalahan faktual, klaim tanpa sumber, atau materi yang merupakan plagiarisme. Semua konten yang ditambahkan ke wiki ini harus dapat diverifikasi dan dikutip dengan benar. Harap tinjau [[WP:LLM]] dan [[WP:V]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan informasi kontroversial atau negatif tentang orang yang masih hidup tanpa menyertakan sumber tepercaya. Hal ini tidak diperkenankan berdasarkan [[WP:BLP|kebijakan biografi tokoh yang masih hidup]]. Konten tanpa sumber atau dengan sumber yang tidak memadai tentang tokoh yang masih hidup dapat menimbulkan dampak yang jelas dan harus segera dihapus. Pastikan setiap konten semacam itu didukung oleh kutipan dari sumber tepercaya yang telah diterbitkan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan konten yang mencemarkan nama baik atau membuat klaim berbahaya yang tidak berdasar tentang seseorang atau suatu organisasi. Hal ini merupakan pelanggaran serius terhadap [[WP:BLP|kebijakan biografi tokoh yang masih hidup]] dan dapat pula berimplikasi hukum. Harap tinjau [[WP:BLP]] dan [[WP:DEFAMATION]] sebelum melakukan suntingan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyisipkan kesalahan faktual yang disengaja ke dalam satu atau lebih artikel. Menambahkan informasi yang salah atau menyesatkan secara sengaja merupakan bentuk [[WP:VAND|vandalisme]] dan tidak diperkenankan di wiki ini. Semua konten harus akurat dan dapat diverifikasi sesuai [[WP:V|kebijakan verifikasi Wikipedia]]. Harap tinjau [[WP:V]] sebelum melakukan suntingan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan konten yang mempromosikan [[WP:FRINGE|teori pinggiran]], yaitu pandangan yang tidak didukung oleh ilmu pengetahuan arus utama atau sumber tepercaya. Wiki ini mengharuskan konten artikel mencerminkan [[WP:NPOV|sudut pandang netral]] dan memberikan bobot yang sesuai terhadap konsensus ilmiah atau akademis. Pandangan pinggiran hanya dapat disertakan apabila dicakup secara proporsional oleh sumber tepercaya dan independen. Harap tinjau [[WP:FRINGE]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya melakukan perubahan besar-besaran atau berulang pada klasifikasi genre di satu atau lebih artikel tanpa menyertakan sumber tepercaya atau mencari konsensus di halaman pembicaraan yang relevan. Informasi genre harus didukung oleh sumber tepercaya, dan perubahan signifikan sebaiknya didiskusikan terlebih dahulu sebelum diterapkan. Harap tinjau [[WP:BRD]] dan [[WP:CONSENSUS]] sebelum melanjutkan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan gambar pada satu atau lebih artikel yang tidak pantas, tidak relevan, atau tidak mematuhi [[WP:IUP|kebijakan penggunaan gambar]] wiki ini. Gambar harus relevan dengan konten artikel, dilisensikan dengan benar, dan sesuai untuk sebuah ensiklopedia. Harap tinjau [[WP:IUP]] dan [[WP:IMAGES]] sebelum menambahkan gambar lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyisipkan lelucon, sarkasme, atau bentuk humor yang tidak pantas lainnya ke dalam satu atau lebih artikel. Wiki ini mempertahankan nada ensiklopedis di seluruh kontennya. Berdasarkan [[WP:NOT|apa yang bukan Wikipedia]], wiki ini bukan tempat untuk humor, satire, atau konten lelucon. Harap tulis dengan cara yang netral, faktual, dan ensiklopedis.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan [[WP:OR|riset asli]] ke dalam satu atau lebih artikel. Wiki ini tidak menerbitkan riset asli, analisis pribadi, atau kesimpulan yang tidak didukung oleh sumber tepercaya yang dikutip. Semua konten harus dapat diverifikasi dan dikaitkan dengan sumber yang telah diterbitkan sesuai [[WP:V|kebijakan verifikasi Wikipedia]]. Harap tinjau [[WP:OR]] dan [[WP:V]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menghapus atau menekan konten dari satu atau lebih artikel dengan alasan yang tidak sesuai dengan kebijakan editorial wiki ini. Berdasarkan [[WP:CENSOR|Wikipedia tidak disensor]], konten tidak dihapus semata-mata karena dianggap menyinggung, sensitif, atau tidak nyaman, selama memenuhi standar ensiklopedia yang netral. Jika Anda memiliki keberatan terhadap konten tertentu, harap sampaikan di halaman pembicaraan yang relevan, bukan menghapus konten tersebut secara sepihak.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Perilaku penyuntingan Anda yang baru-baru ini menunjukkan sikap [[WP:OWN|kepemilikan]] terhadap satu atau lebih artikel. Tidak ada penyunting yang memiliki artikel di wiki ini. Semua konten terbuka untuk disempurnakan oleh penyunting mana pun yang beriktikad baik. Mengembalikan suntingan pengguna lain secara berulang, atau memperlakukan artikel sebagai ruang pribadi, tidak sesuai dengan semangat penyuntingan kolaboratif. Harap tinjau [[WP:OWN]] dan diskusikan ketidaksepakatan apa pun di halaman pembicaraan yang relevan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyisipkan kata ganti untuk seseorang yang tidak sesuai dengan [[WP:IDENTITY|kebijakan identitas]] wiki ini. Wikipedia mengikuti kata ganti yang digunakan oleh sumber tepercaya ketika merujuk pada individu, khususnya orang yang masih hidup. Mengubah kata ganti subjek tanpa disertai sumber tidak diperkenankan. Harap tinjau [[WP:IDENTITY]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya merupakan [[WP:VAND|vandalisme halus]] — perubahan kecil atau sulit terdeteksi yang menyisipkan informasi yang salah, mengubah fakta, atau merusak kualitas artikel. Jenis penyuntingan ini sangat berbahaya karena dapat luput dari perhatian dalam waktu yang lama. Harap hentikan suntingan yang bertujuan menyesatkan pembaca.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan komentar pribadi, opini, atau catatan editorial ke dalam satu atau lebih artikel. Halaman artikel bukan tempat yang tepat untuk pandangan atau analisis pribadi. Jika Anda ingin mendiskusikan konten artikel, gunakan halaman pembicaraan artikel tersebut. Harap tinjau [[WP:NPOV|kebijakan sudut pandang netral Wikipedia]] dan [[WP:NOT]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menghapus satu atau lebih templat pemeliharaan dari sebuah artikel tanpa menyelesaikan masalah mendasar yang ditandai oleh templat tersebut. Templat pemeliharaan memiliki fungsi penting dalam mengidentifikasi artikel yang memerlukan perhatian. Harap tidak menghapus templat tersebut kecuali masalah yang dijelaskannya telah sepenuhnya diatasi. Jika Anda merasa sebuah templat diterapkan secara keliru, sampaikan hal ini di halaman pembicaraan yang relevan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan konten ke dalam satu atau lebih artikel tanpa menyertakan sumber tepercaya, atau dengan kutipan yang tidak mendukung klaim yang dibuat. Semua konten yang ditambahkan ke wiki ini harus dapat diverifikasi dan dikaitkan dengan sumber tepercaya yang telah diterbitkan sesuai [[WP:V|kebijakan verifikasi Wikipedia]]. Harap tinjau [[WP:V]] dan [[WP:CITE]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menggunakan satu atau lebih halaman Wikipedia untuk keperluan iklan, promosi, atau tujuan lain yang tidak sesuai dengan misi wiki ini. Wikipedia adalah sebuah ensiklopedia, bukan platform untuk pemasaran, promosi diri, atau advokasi. Harap tinjau [[WP:NOTADVERT]] dan [[WP:COI]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyisipkan konten yang tidak sesuai dengan [[WP:NPOV|kebijakan sudut pandang netral Wikipedia]]. Semua artikel harus memaparkan sudut pandang yang signifikan secara adil dan tanpa bias, serta tidak boleh mendukung pandangan tertentu. Harap tinjau [[WP:NPOV]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Aktivitas penyuntingan Anda mengindikasikan bahwa Anda mungkin terlibat dalam [[WP:PAID|penyuntingan berbayar]] tanpa melakukan pengungkapan yang diwajibkan berdasarkan [[wmf:Terms of Use|Ketentuan Penggunaan Wikimedia]]. Penyunting yang menerima pembayaran atau kompensasi lainnya atas kontribusi mereka wajib mengungkapkan hal ini di halaman pengguna mereka, di halaman pembicaraan yang relevan, atau dalam ringkasan suntingan. Harap tinjau [[WP:PAID]] dan lakukan pengungkapan yang diperlukan sebelum melanjutkan penyuntingan dalam kapasitas ini.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan pranala luar yang tidak sesuai dengan [[WP:EL|panduan pranala luar Wikipedia]]. Pranala luar hanya boleh disertakan jika memberikan nilai tambah yang signifikan di luar konten artikel. Pranala tersebut tidak boleh digunakan untuk promosi, periklanan, atau mengarahkan pembaca ke situs yang keandalannya diragukan. Harap tinjau [[WP:EL]] dan [[WP:SPAM]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Terima kasih telah mencoba tugas pemula [[WP:ADD A LINK|Tambahkan Pranala]]. Beberapa saran pranala Anda yang baru-baru ini tampaknya kurang tepat untuk artikel yang dituju. Pranala seharusnya menghubungkan sebuah istilah dengan artikel ensiklopedis yang relevan dan benar-benar membantu pemahaman pembaca. Harap tinjau panduan di [[WP:LINK]] dan [[WP:OVERLINK]] sebelum menambahkan pranala lebih lanjut melalui alat ini.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Anda mungkin menggunakan lebih dari satu akun untuk menyunting wiki ini. Meskipun terdapat beberapa alasan yang sah untuk mempertahankan akun kedua, hal tersebut diatur oleh [[WP:SOCK|kebijakan Wikipedia tentang akun alternatif]]. Jika Anda mengelola beberapa akun, pastikan tujuan setiap akun sesuai dengan kebijakan dan Anda tidak menggunakannya dengan cara yang dapat dianggap sebagai upaya memperoleh keuntungan yang tidak adil dalam diskusi atau penyuntingan. Harap tinjau [[WP:SOCK]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Laporan Anda yang baru-baru ini di [[WP:AIV|Intervensi pengurus terhadap vandalisme]] (AIV) tampaknya tidak memenuhi kriteria pelaporan. AIV ditujukan untuk penyunting yang secara aktif dan jelas melakukan vandalisme dan telah mendapat peringatan sebelumnya. Laporan yang berkaitan dengan kesalahan beriktikad baik, perselisihan konten, atau pengguna yang belum mendapat peringatan kemungkinan tidak akan menghasilkan pemblokiran dan dapat memperlambat respons pengurus terhadap vandalisme yang jelas. Harap tinjau [[WP:AIV]] sebelum membuat laporan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Sebuah halaman yang baru-baru ini Anda buat atau kerjakan telah dipindahkan ke [[WP:DRAFTSPACE|ruang draf]] karena belum memenuhi kriteria untuk disertakan dalam ruang nama utama. Halaman Anda masih dapat diakses dan Anda dipersilakan untuk terus mengembangkannya. Setelah memenuhi [[WP:NCRIT|panduan kelayakan Wikipedia]] dan [[WP:V|kebijakan verifikasi]], artikel dapat diajukan untuk ditinjau dan dipindahkan kembali ke ruang nama utama. Harap tinjau [[WP:YFA]] untuk panduan membuat artikel baru.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Tampaknya Anda mungkin telah membuat atau menyunting secara substansial sebuah artikel tentang diri Anda sendiri. Wikipedia sangat tidak menganjurkan penyunting menulis tentang diri mereka sendiri, karena sangat sulit untuk menulis tentang diri sendiri secara netral dan dapat diverifikasi, dan hal ini menimbulkan [[WP:COI|konflik kepentingan]] yang signifikan. Harap tinjau [[WP:AUTO]] dan [[WP:COI]]. Jika Anda memenuhi [[WP:NCRIT|kriteria kelayakan Wikipedia]], Anda dapat meminta orang lain untuk menulis artikel tentang Anda.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan satu atau lebih kategori ke sebuah halaman yang tidak secara akurat menggambarkan subjek halaman tersebut. Kategori hanya boleh diterapkan apabila kriterianya jelas terpenuhi. Harap tinjau [[WP:CAT]] dan kriteria spesifik dari setiap kategori sebelum menerapkannya. Kategorisasi yang salah dapat menyesatkan pembaca dan biasanya akan dikembalikan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan satu atau lebih entri ke sebuah daftar yang tidak memenuhi kriteria penyertaan daftar tersebut. Artikel daftar mendefinisikan cakupannya di bagian pembuka atau panduannya; entri harus memenuhi kriteria tersebut dan harus didukung oleh sumber tepercaya. Harap tinjau [[WP:LISTCRITERIA]] dan dokumentasi daftar itu sendiri sebelum menambahkan entri lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan satu atau lebih URL mentah, yaitu alamat web tanpa kutipan yang diformat, ke dalam artikel. URL mentah sulit dievaluasi oleh pembaca dan tidak menampilkan informasi bibliografi yang berguna. Harap format semua referensi menggunakan templat kutipan seperti {{tlx|cite web}} atau {{tlx|cite news}}. Lihat [[WP:CITE]] untuk panduan mengutip sumber dengan benar.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Komentar atau tindakan Anda yang baru-baru ini terhadap penyunting baru mungkin terkesan tidak ramah atau terlalu keras. Wikipedia mendorong semua penyunting untuk bersabar dan mendukung para pengguna baru, yang mungkin belum familier dengan kebijakan dan pedoman kita. Harap tinjau [[WP:BITE]] dan [[WP:CIVIL]], dan cobalah untuk berinteraksi dengan penyunting baru secara konstruktif dan mendukung.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah mengosongkan konten sebuah artikel dan mengubahnya menjadi pengalihan. Jika Anda berpendapat bahwa sebuah artikel harus digabungkan atau dialihkan ke artikel lain, ikuti proses yang dijelaskan di [[WP:MERGE]] atau [[WP:REDIRECT]] dan usulkan perubahan tersebut di halaman pembicaraan yang relevan terlebih dahulu. Mengosongkan konten tanpa diskusi bukan prosedur yang benar dan biasanya akan dikembalikan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya mengutip sumber yang pada akhirnya mengambil informasinya dari Wikipedia sendiri, atau dari sumber lain yang mengulang klaim yang awalnya diterbitkan di sini. Hal ini dikenal sebagai sumber melingkar dan tidak memenuhi [[WP:V|kebijakan verifikasi Wikipedia]], karena tidak memberikan verifikasi independen atas informasi tersebut. Harap gunakan sumber primer atau sumber sekunder yang tepercaya dan independen dari Wikipedia. Lihat [[WP:CIRCULAR]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini mengindikasikan bahwa Anda mungkin memiliki [[WP:COI|konflik kepentingan]] terhadap subjek satu atau lebih artikel yang Anda sunting. Penyunting yang memiliki hubungan pribadi, profesional, atau finansial dengan suatu subjek sangat tidak dianjurkan untuk menyunting artikel terkait secara langsung. Jika Anda memiliki informasi yang relevan untuk dikontribusikan, gunakan halaman pembicaraan untuk menyarankan perubahan dan biarkan penyunting independen menilainya. Harap tinjau [[WP:COI]] dan [[WP:PAID]] untuk panduan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyalin teks dari satu halaman Wikipedia ke halaman lain tanpa atribusi yang diperlukan. Semua konten Wikipedia dirilis di bawah lisensi yang mewajibkan atribusi kepada kontributor aslinya. Saat menyalin teks antar halaman, Anda harus mencantumkan sumbernya dalam ringkasan suntingan menggunakan catatan seperti "Teks disalin dari [[Nama artikel]]; lihat riwayat artikel tersebut untuk atribusi." Harap tinjau [[WP:COPYWITHIN]] untuk prosedur yang benar.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya memasukkan informasi spekulatif, berupa rumor, atau belum terkonfirmasi ke dalam satu atau lebih artikel. [[WP:V|Kebijakan verifikasi Wikipedia]] mewajibkan bahwa semua konten dapat dikaitkan dengan sumber yang tepercaya dan telah diterbitkan. Informasi yang belum terkonfirmasi atau yang merupakan spekulasi, meskipun banyak dilaporkan, tidak boleh ditambahkan sampai bersumber dengan baik. Harap tinjau [[WP:V]] dan [[WP:OR]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya memindahkan konten halaman dengan memotongnya dari satu lokasi dan menempelkannya di lokasi lain. Metode pemindahan halaman ini tidak boleh digunakan karena merusak riwayat suntingan halaman, yang diperlukan untuk atribusi hak cipta. Untuk mengganti nama atau memindahkan halaman, gunakan [[WP:MOVE|fitur "Pindahkan"]]. Jika Anda memerlukan bantuan, Anda dapat meminta pemindahan halaman di [[WP:RM]]. Lihat [[WP:CPM]] untuk penjelasan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini pada [[WP:DAB|halaman disambiguasi]] tampaknya tidak mengikuti panduan untuk halaman tersebut. Halaman disambiguasi adalah alat navigasi yang mencantumkan artikel-artikel dengan nama serupa; halaman ini memiliki konvensi pemformatan khusus dan tidak boleh digunakan untuk menambahkan definisi, informasi trivial, pranala merah ke topik yang tidak layak, atau konten yang seharusnya berada dalam sebuah artikel. Harap tinjau [[WP:MOSDAB]] sebelum menyunting halaman disambiguasi lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah mengubah format tanggal yang digunakan dalam satu atau lebih artikel tanpa alasan editorial yang jelas. [[MOS:DATEFORMAT|Panduan gaya Wikipedia]] menyarankan agar format tanggal yang telah ditetapkan dalam sebuah artikel umumnya dipertahankan untuk konsistensi. Harap hindari perubahan format tanggal yang tidak meningkatkan kualitas ensiklopedia dan tinjau [[MOS:DATEFORMAT]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus satu atau lebih referensi semata-mata karena URL yang dikandungnya tidak lagi dapat diakses. Pranala mati tidak membatalkan sebuah kutipan. Sumber yang mendasarinya mungkin masih ada dalam bentuk cetak, arsip, atau melalui layanan arsip web. Daripada menghapus referensi tersebut, pertimbangkan untuk memperbarui URL, menandainya dengan {{tlx|dead link}}, atau menemukan versi yang diarsipkan melalui [[WP:WAYBACK|Wayback Machine]]. Lihat [[WP:DEADREF]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menggunakan kata magis <code>{{DISPLAYTITLE}}</code> dengan cara yang tidak sesuai dengan tujuan penggunaannya. <code>DISPLAYTITLE</code> hanya boleh digunakan untuk menerapkan cetak miring, mengubah kapitalisasi, atau melakukan penyesuaian kecil lainnya yang sesuai dengan [[MOS:TITLE|Panduan gaya]] di mana perubahan tersebut berbeda dari nama halaman. Kata ajaib ini tidak boleh digunakan untuk mengubah tampilan judul halaman secara substansial atau untuk menghindari konvensi penamaan. Harap tinjau [[WP:DISPLAYTITLE]] sebelum menggunakan fitur ini lagi.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Tampaknya Anda sedang mengerjakan artikel baru yang belum siap untuk ensiklopedia utama. Untuk menghindari risiko [[WP:CSD|penghapusan cepat]], Anda dipersilakan untuk mengembangkannya sebagai draf di ruang pengguna Anda, misalnya di [[Special:MyPage/Draf|Pengguna:{{subst:REVISIONUSER}}/Draf]]. Setelah cukup berkembang dan memenuhi [[WP:NCRIT|panduan kelayakan Wikipedia]], Anda dapat mengajukannya untuk ditinjau atau memindahkannya ke ruang nama utama. Lihat [[WP:YFA]] untuk panduan menulis artikel baru.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Selamat datang di Wikipedia! Anda mungkin belum mengetahui pentingnya ringkasan suntingan. Saat Anda melakukan suntingan, gunakan kotak ringkasan suntingan untuk menjelaskan secara singkat apa yang Anda ubah dan mengapa. Ringkasan suntingan membantu penyunting lain memahami kontribusi Anda dan memudahkan peninjauan perubahan. Bahkan catatan singkat pun sangat berguna. Lihat [[WP:ES]] untuk informasi lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Sebagai penyunting berpengalaman, Anda tentu mengetahui pentingnya ringkasan suntingan. Suntingan Anda yang baru-baru ini tampaknya dilakukan tanpa ringkasan suntingan. Harap ingat untuk mengisi kolom ringkasan suntingan setiap kali Anda menyunting halaman, bahkan untuk perubahan kecil sekalipun. Ringkasan suntingan sangat penting untuk transparansi dan membantu penyunting lain meninjau serta memahami kontribusi Anda. Lihat [[WP:ES]] untuk pengingat praktik terbaik.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan terbaru tampaknya menambahkan pranala luar secara langsung ke dalam isi satu atau lebih artikel. Di Wikipedia, pranala luar pada umumnya hanya boleh ditempatkan di bagian "Pranala luar" pada akhir artikel atau digunakan sebagai bagian dari sitasi yang diformat dengan benar. Pranala luar mentah (''bare external links'') yang disisipkan langsung ke dalam teks artikel tidak sesuai dengan pedoman pemformatan Wikipedia. ` +
                `\n\nMohon tinjau [[WP:EL]] dan [[WP:ELSTYLE]] untuk memperoleh panduan lebih lanjut mengenai penggunaan dan penempatan pranala luar yang sesuai.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menandai satu atau lebih halaman untuk [[WP:CSD|penghapusan cepat]] tanpa alasan yang memadai. Kriteria penghapusan cepat bersifat sempit dan spesifik. Halaman yang tidak memenuhi kriteria yang disebutkan secara jelas tidak boleh ditandai untuk penghapusan cepat. Jika Anda memiliki kekhawatiran tentang kelayakan sebuah halaman, pertimbangkan untuk menominasikannya untuk [[WP:AFD|artikel yang akan dihapus]] atau sebaliknya angkat masalah tersebut di halaman pembicaraan artikel. Harap tinjau [[WP:CSD]] sebelum menandai halaman lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan gelar kehormatan Islam, seperti "shallallahu 'alaihi wasallam" (SAW) atau "radhiyallahu 'anhu/ha", ke satu atau lebih artikel. [[MOS:HON|Panduan gaya Wikipedia]] tidak menganjurkan penggunaan gelar kehormatan dari tradisi keagamaan mana pun dalam artikel ensiklopedis, karena penyertaannya mungkin tidak mencerminkan sudut pandang netral yang diperlukan dari semua artikel. Harap tinjau [[MOS:HON]] dan [[WP:NPOV]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya tidak menggunakan cetak miring pada judul karya, atau justru menggunakan cetak miring pada judul yang seharusnya tidak diberi gaya seperti itu. Menurut [[MOS:ITAL|Panduan gaya Wikipedia]], judul buku, film, album, majalah, surat kabar, serial televisi, dan karya panjang lainnya harus dicetak miring ketika disebutkan dalam teks artikel. Karya yang lebih pendek seperti judul lagu dan episode individual ditulis dalam tanda kutip. Harap tinjau [[MOS:ITAL]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya mengubah ragam bahasa Inggris yang digunakan dalam satu atau lebih artikel, misalnya mengubah ejaan Inggris Britania ke Inggris Amerika atau sebaliknya, tanpa alasan yang tepat. [[MOS:ENGVAR|Panduan gaya Wikipedia]] menyarankan agar ragam bahasa Inggris yang telah ditetapkan dalam sebuah artikel dipertahankan secara konsisten, dan para penyunting tidak boleh mengubahnya tanpa pembenaran yang jelas dan kuat. Harap tinjau [[MOS:ENGVAR]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan pranala wiki yang berlebihan ke satu atau lebih artikel, termasuk tautan berulang ke target yang sama atau sejumlah besar pranala merah ke topik yang tidak layak. [[WP:OVERLINK|Panduan tautan berlebihan Wikipedia]] menyarankan agar istilah umumnya hanya ditautkan sekali per artikel, dan hanya jika artikel yang ditautkan kemungkinan besar membantu pembaca memahami teks. Pranala merah hanya boleh digunakan untuk topik yang benar-benar kemungkinan layak mendapatkan artikel tersendiri. Harap tinjau [[WP:OVERLINK]] dan [[WP:REDLINK]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan deskripsi singkat yang lebih panjang dari yang direkomendasikan. Deskripsi singkat, yang ditambahkan melalui templat {{tlx|Short description}}, dimaksudkan sebagai frasa pembeda yang ringkas, biasanya tidak lebih dari 40 karakter, yang membantu pembaca mengidentifikasi subjek artikel dalam hasil pencarian. Deskripsi ini tidak boleh berupa kalimat lengkap. Harap tinjau [[WP:SDSHORT]] untuk panduan menulis deskripsi singkat yang efektif.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah ditandai sebagai suntingan kecil padahal perubahan yang dilakukan tidak bersifat kecil. Kotak centang suntingan kecil hanya boleh digunakan untuk perubahan yang benar-benar sepele, seperti memperbaiki ejaan atau tanda baca, yang tidak dapat dianggap kontroversial. Menandai suntingan substantif sebagai suntingan kecil dapat menyebabkan penyunting lain mengabaikannya saat patroli perubahan terbaru. Harap tinjau [[WP:MINOR]] untuk panduan kapan menggunakan fitur ini.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya memformat satu atau lebih merek dagang dengan cara yang tidak sesuai dengan panduan gaya Wikipedia. Wikipedia tidak menggunakan simbol merek dagang (™ atau ®) dalam teks artikel, dan kapitalisasi istilah merek dagang harus mengikuti aturan bahasa Inggris standar daripada kapitalisasi bergaya yang digunakan dalam materi pemasaran, kecuali jika bentuk non-standar tersebut sudah sangat mapan. Harap tinjau [[MOS:TM]] sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Penggunaan akun alternatif Anda tampaknya berada di luar keadaan yang diizinkan oleh [[WP:SOCK|kebijakan Wikipedia tentang akun alternatif]]. Akun alternatif tidak boleh digunakan untuk menciptakan kesan konsensus yang lebih luas, untuk menghindari pemblokiran atau sanksi, untuk menyunting artikel saat akun utama Anda memiliki konflik kepentingan yang dideklarasikan, atau untuk memperoleh keuntungan lain yang tidak akan dimiliki oleh satu akun saja. Harap tinjau [[WP:SOCK]] dan [[WP:LEGITSOCK]] dan pastikan akun alternatif yang Anda kelola hanya digunakan untuk tujuan yang diizinkan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Komentar Anda yang baru-baru ini dalam satu atau lebih diskusi menunjukkan kesalahpahaman tentang bagaimana Wikipedia mencapai keputusan. Wikipedia tidak beroperasi melalui pemungutan suara mayoritas: keputusan dibuat melalui [[WP:CONSENSUS|konsensus]], yang berarti mempertimbangkan argumen dan bukti yang dikemukakan, bukan sekadar menghitung jumlah penyunting di setiap sisi. Harap fokuskan kontribusi Anda dalam diskusi pada penalaran berbasis kebijakan daripada mengungkapkan preferensi atau menghitung dukungan. Lihat [[WP:CONSENSUS]] dan [[WP:NOTDEMOCRACY]] untuk panduan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Not communicating in the wiki language
          // ------------------------------------------------------------------
          {
            value: "notcommunicatingwikilang",
            label: "Not communicating in the wiki language",
            buildNotice: function (target, extra, isFinal) {
              const wikiLangCode = mw.config.get("wgContentLanguage");
              const siteName = mw.config.get("wgSiteName");
              const wikiLangEn =
                new Intl.DisplayNames(["en-GB"], { type: "language" }).of(
                  wikiLangCode,
                ) || wikiLangCode;
              const wikiLangId =
                new Intl.DisplayNames(["id"], { type: "language" }).of(
                  wikiLangCode,
                ) || wikiLangCode;
              const headingEn = isFinal
                ? "== Final notice: not communicating in the wiki language =="
                : "== Notice: not communicating in the wiki language ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: tidak berkomunikasi dalam bahasa wiki =="
                : "== Pemberitahuan: tidak berkomunikasi dalam bahasa wiki ==";

              const bodyEnTemplate =
                `This ${siteName} operates in __LANG_EN__. A recent message you left appears to have been written in a different language. This makes it difficult for other editors and administrators on this wiki to read and respond to your message, and it may be archived without action as a result.\n\nWhen communicating on talk pages, noticeboards, and other discussion areas, please write in __LANG_EN__. If you are not confident in __LANG_EN__, you may use a translation tool to help. For wikis in your own language, please visit the [[Wikipedia:List of Wikipedias|list of Wikipedia language editions]].` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);

              const bodyIdTemplate =
                `${siteName} ini beroperasi dalam __LANG_ID__. Pesan yang baru-baru ini Anda tinggalkan tampaknya ditulis dalam bahasa lain. Hal ini menyulitkan penyunting dan pengurus wiki ini untuk membaca dan menanggapi pesan Anda, sehingga pesan tersebut mungkin akan diarsipkan tanpa tindakan.\n\nSaat berkomunikasi di halaman pembicaraan, papan pengumuman, dan area diskusi lainnya, harap tulis dalam __LANG_ID__. Jika Anda kurang yakin dengan kemampuan __LANG_ID__, Anda dapat menggunakan alat terjemahan untuk membantu. Untuk wiki dalam bahasa Anda sendiri, silakan kunjungi [[w:id:Wikipedia:Daftar Wikipedia|daftar edisi bahasa Wikipedia]].` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);

              const bodyEn = buildNoticeWithTemplates(bodyEnTemplate, {
                LANG_EN: `{{#language:${wikiLangEn}}}`,
              });

              const bodyId = buildNoticeWithTemplates(bodyIdTemplate, {
                LANG_ID: `{{#language:${wikiLangId}}}`,
              });

              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Not communicating in English
          // ------------------------------------------------------------------
          {
            value: "notcommunicatingenglish",
            label: "Not communicating in English",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: not communicating in English =="
                : "== Notice: not communicating in English ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: tidak berkomunikasi dalam bahasa Inggris =="
                : "== Pemberitahuan: tidak berkomunikasi dalam bahasa Inggris ==";
              const bodyEn =
                `This wiki operates in English. A recent message you left appears to have been written in a different language. This makes it difficult for other editors and administrators to read and respond to your message, and it may be archived without action as a result.\n\nWhen communicating on talk pages, noticeboards, and other discussion areas, please write in English. If you are not confident in English, you may use a translation tool to help. For wikis in your own language, please visit the [[Wikipedia:List of Wikipedias|list of Wikipedia language editions]].` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Wiki ini beroperasi dalam bahasa Inggris. Pesan yang baru-baru ini Anda tinggalkan tampaknya ditulis dalam bahasa lain. Hal ini menyulitkan penyunting dan pengurus untuk membaca dan menanggapi pesan Anda, sehingga pesan tersebut mungkin akan diarsipkan tanpa tindakan.\n\nSaat berkomunikasi di halaman pembicaraan, papan pengumuman, dan area diskusi lainnya, harap tulis dalam bahasa Inggris. Jika Anda kurang yakin dengan kemampuan bahasa Inggris Anda, Anda dapat menggunakan alat terjemahan untuk membantu. Untuk wiki dalam bahasa Anda sendiri, silakan kunjungi [[w:id:Wikipedia:Daftar Wikipedia|daftar edisi bahasa Wikipedia]].` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Not communicating in Indonesian
          // ------------------------------------------------------------------
          {
            value: "notcommunicatingindonesian",
            label: "Not communicating in Indonesian",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final notice: not communicating in Indonesian =="
                : "== Notice: not communicating in Indonesian ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: tidak berkomunikasi dalam bahasa Indonesia =="
                : "== Pemberitahuan: tidak berkomunikasi dalam bahasa Indonesia ==";
              const bodyEn =
                `This wiki operates in Indonesian. A recent message you left appears to have been written in a different language. This makes it difficult for other editors and administrators to read and respond to your message, and it may be archived without action as a result.\n\nWhen communicating on talk pages, noticeboards, and other discussion areas, please write in Indonesian. If you are not confident in Indonesian, you may use a translation tool to help. For wikis in your own language, please visit the [[Wikipedia:List of Wikipedias|list of Wikipedia language editions]].` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Wiki ini beroperasi dalam bahasa Indonesia. Pesan yang baru-baru ini Anda tinggalkan tampaknya ditulis dalam bahasa lain. Hal ini menyulitkan penyunting dan pengurus untuk membaca dan menanggapi pesan Anda, sehingga pesan tersebut mungkin akan diarsipkan tanpa tindakan.\n\nSaat berkomunikasi di halaman pembicaraan, papan pengumuman, dan area diskusi lainnya, harap tulis dalam bahasa Indonesia. Jika Anda kurang yakin dengan kemampuan bahasa Indonesia Anda, Anda dapat menggunakan alat terjemahan untuk membantu. Untuk wiki dalam bahasa Anda sendiri, silakan kunjungi [[w:id:Wikipedia:Daftar Wikipedia|daftar edisi bahasa Wikipedia]].` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Creating articles not in the wiki language
          // ------------------------------------------------------------------
          {
            value: "articlenotwikilang",
            label: "Creating articles not in the wiki language",
            buildNotice: function (target, extra, isFinal) {
              const wikiLangCode = mw.config.get("wgContentLanguage");
              const siteName = mw.config.get("wgSiteName");
              const wikiLangEn =
                new Intl.DisplayNames(["en-GB"], { type: "language" }).of(
                  wikiLangCode,
                ) || wikiLangCode;
              const wikiLangId =
                new Intl.DisplayNames(["id"], { type: "language" }).of(
                  wikiLangCode,
                ) || wikiLangCode;
              const headingEn = isFinal
                ? "== Final notice: creating articles not in the wiki language =="
                : "== Notice: creating articles not in the wiki language ==";
              const headingId = isFinal
                ? "== Pemberitahuan terakhir: membuat artikel tidak dalam bahasa wiki =="
                : "== Pemberitahuan: membuat artikel tidak dalam bahasa wiki ==";

              const bodyEnTemplate =
                `This ${siteName} only accepts articles written in __LANG_EN__. An article you recently created or edited appears to have been written in a different language. Articles not written in __LANG_EN__ cannot be properly reviewed, maintained, or categorised by editors on this wiki, and are liable to be nominated for deletion.\n\nBefore creating or editing an article, please make sure it is written in __LANG_EN__. If you would like to contribute in another language, please visit the [[Wikipedia:List of Wikipedias|list of Wikipedia language editions]] to find the appropriate wiki. Translation tools may also help if you wish to adapt existing content into __LANG_EN__.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);

              const bodyIdTemplate =
                `${siteName} ini hanya menerima artikel yang ditulis dalam __LANG_ID__. Artikel yang baru-baru ini Anda buat atau sunting tampaknya ditulis dalam bahasa lain. Artikel yang tidak ditulis dalam __LANG_ID__ tidak dapat ditinjau, dirawat, atau dikategorikan dengan semestinya oleh penyunting wiki ini, dan dapat diajukan untuk penghapusan.\n\nSebelum membuat atau menyunting artikel, pastikan artikel tersebut ditulis dalam __LANG_ID__. Jika Anda ingin berkontribusi dalam bahasa lain, silakan kunjungi [[w:id:Wikipedia:Daftar Wikipedia|daftar edisi bahasa Wikipedia]] untuk menemukan wiki yang sesuai. Alat terjemahan juga dapat membantu jika Anda ingin mengadaptasi konten yang ada ke dalam __LANG_ID__.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);

              const bodyEn = buildNoticeWithTemplates(bodyEnTemplate, {
                LANG_EN: `{{#language:${wikiLangEn}}}`,
              });

              const bodyId = buildNoticeWithTemplates(bodyIdTemplate, {
                LANG_ID: `{{#language:${wikiLangId}}}`,
              });

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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Anda tampaknya telah membuat halaman pembicaraan untuk artikel yang tidak ada. Halaman pembicaraan ada untuk mendukung diskusi tentang artikel yang sesuai. Halaman ini tidak boleh dibuat secara mandiri. Jika Anda ingin menulis artikel tentang topik ini, buatlah di ruang nama utama atau sebagai draf. Halaman pembicaraan akan dibuat secara otomatis setelah artikel ada. Jika artikel telah dihapus, jangan buat ulang halaman pembicaraannya.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyalin teks dari sumber domain publik tanpa memberikan atribusi yang diperlukan. Meskipun karya domain publik dapat direproduksi secara bebas, praktik terbaik Wikipedia adalah mengakui sumbernya untuk menjaga transparansi dan membantu penelitian lebih lanjut. Harap catat sumber teks yang disalin dalam ringkasan suntingan Anda dan, jika sesuai, dalam artikel itu sendiri. Lihat [[WP:PD]] dan [[WP:PDTXT]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Pola penyuntingan Anda yang baru-baru ini tampaknya melibatkan sejumlah besar suntingan kecil berturut-turut pada halaman yang sama. Hal ini dapat membuat riwayat revisi halaman menjadi penuh dan menyulitkan peninjauan perubahan. Sebelum menyimpan, gunakan tombol "Tampilkan pratinjau" untuk memeriksa suntingan Anda dari kesalahan dan melakukan semua koreksi yang diperlukan dalam satu kali penyimpanan. Lihat [[WP:PREVIEW]] untuk informasi lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus pranala merah dari satu atau lebih artikel tanpa mempertimbangkan apakah tautan tersebut bermanfaat. Pranala merah bukan kesalahan. Ia menunjukkan bahwa artikel yang ditautkan belum ada dan dapat mendorong penyunting untuk membuatnya. Pranala merah ke topik yang benar-benar kemungkinan cukup layak untuk memiliki artikel tersendiri umumnya harus dipertahankan. Harap tinjau [[WP:REDLINK]] sebelum menghapus tautan merah di masa mendatang.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan kutipan penelitian yang dihasilkan oleh sejumlah kecil peneliti yang tidak mencerminkan pandangan ilmiah atau akademis arus utama. Wikipedia mensyaratkan konten artikel memberikan bobot yang tepat terhadap berbagai perspektif yang diwakili dalam sumber tepercaya, dan pandangan minoritas atau pinggiran harus dikontekstualisasikan dengan jelas sebagai demikian. Harap tinjau [[WP:FRINGE]], [[WP:UNDUE]], dan [[WP:MEDRS]] (jika berlaku) sebelum melakukan suntingan serupa.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Tampaknya Anda mungkin sedang menguji suntingan di satu atau lebih halaman dan kemudian membatalkannya sendiri. Meskipun pembatalan mandiri merupakan hal yang diapresiasi, uji coba suntingan sebaiknya dilakukan di [[WP:SANDBOX|bak pasir]] daripada di ruang nama utama, karena setiap suntingan, termasuk uji coba, meninggalkan entri dalam riwayat revisi halaman. Gunakan bak pasir untuk percobaan penyuntingan di masa mendatang.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Kontribusi Anda yang baru-baru ini tampaknya memperlakukan Wikipedia sebagai platform jejaring sosial. Wikipedia adalah ensiklopedia, dan halaman-halamannya, termasuk halaman pengguna dan halaman pembicaraan, harus digunakan terutama untuk mendukung tujuan membangun dan meningkatkan konten ensiklopedis. Kiriman pribadi yang berlebihan, obrolan sosial, atau penggunaan halaman pengguna Anda sebagai profil pribadi tidak dianjurkan. Harap tinjau [[WP:NOT#SOCIAL]] dan [[WP:USERPAGE]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Pesan halaman pembicaraan atau permintaan suntingan Anda yang baru-baru ini menunjukkan bahwa Anda mungkin ragu untuk melakukan suntingan secara langsung. Wikipedia mendorong penyunting untuk [[WP:BOLD|berani]] dan melakukan perbaikan sendiri daripada meminta orang lain melakukannya atas nama mereka. Jika Anda melihat sesuatu yang perlu diperbaiki, silakan perbaiki, karena semua suntingan dapat ditinjau dan dibatalkan jika diperlukan. Lihat [[WP:BOLD]] untuk informasi lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan templat "peringatan beberan" ke satu atau lebih artikel atau menghapus detail plot dari bagian tempat informasi tersebut sesuai. Wikipedia adalah ensiklopedia yang memberikan informasi komprehensif tentang subjeknya, termasuk ringkasan plot dan detail cerita karya fiksi. Peringatan beberan tidak digunakan di Wikipedia, dan konten plot yang relevan dengan subjek artikel tidak boleh dihapus. Harap tinjau [[WP:SPOILER]] untuk informasi lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan komentar, pertanyaan, atau catatan yang ditujukan kepada penyunting lain ke dalam teks artikel. Halaman artikel hanya untuk konten ensiklopedis. Jika Anda ingin mendiskusikan sebuah artikel, mengajukan pertanyaan tentangnya, atau meninggalkan catatan untuk penyunting lain, gunakan [[WP:TALKPAGE|halaman pembicaraan]] artikel tersebut. Lihat [[WP:TALK]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Kiriman Anda yang baru-baru ini di satu atau lebih halaman pembicaraan tampaknya dilakukan tanpa tanda tangan. Harap ingat untuk menandatangani semua kiriman halaman pembicaraan dengan mengetik empat tilde (<code><nowiki>~~~~</nowiki></code>) di akhir komentar Anda, atau dengan mengklik tombol tanda tangan di bilah perkakas editor. Menandatangani kiriman Anda membantu penyunting lain mengidentifikasi siapa yang berkata apa dan kapan. Lihat [[WP:SIGN]] untuk informasi lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Kiriman Anda yang baru-baru ini tampaknya ditambahkan di bagian atas halaman pembicaraan daripada di bagian bawah. Di Wikipedia, topik halaman pembicaraan baru dan tanggapan harus ditambahkan di bagian bawah halaman (atau di bagian bawah utas yang relevan), bukan di bagian atas, sehingga diskusi muncul secara urutan kronologis. Harap tinjau [[WP:TALKNEW]] sebelum kembali memposting di halaman pembicaraan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan konten yang diterjemahkan dari Wikipedia bahasa lain tanpa memberikan atribusi yang dipersyaratkan oleh lisensi wiki sumber. Saat mengimpor konten dari Wikipedia lain, Anda harus mengakui artikel sumber beserta kontributornya, biasanya dengan mencantumkan hal ini dalam ringkasan suntingan dan di halaman pembicaraan artikel. Harap tinjau [[WP:TRANSWIKI]] dan [[WP:ATTRIB]] untuk prosedur yang benar.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menyertakan teks yang disalin dari sumber berlisensi kompatibel (seperti karya berlisensi Creative Commons) tanpa atribusi yang diperlukan. Meskipun lisensi mengizinkan reproduksi, ketentuannya biasanya mensyaratkan agar penulis dan sumber asli dicantumkan. Harap berikan atribusi yang diperlukan dalam ringkasan suntingan Anda dan, jika sesuai, dalam artikel. Lihat [[WP:COPYPASTE]] dan [[WP:ATTRIB]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Anda memiliki satu atau lebih draf ruang pengguna yang sudah lama tidak disunting. Draf yang sudah lama tidak aktif mungkin memenuhi syarat untuk dihapus berdasarkan [[WP:CSD#U5|CSD U5]]. Jika Anda bermaksud melanjutkan pengerjaan draf, harap buat beberapa kemajuan. Jika Anda tidak lagi ingin melanjutkannya, Anda dapat meminta penghapusannya dengan menambahkan <code>{{tlx|delete|U1}}</code> ke halaman. Lihat [[WP:STALEDRAFT]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Halaman pembicaraan pengguna Anda tampaknya digunakan dengan cara yang tidak sesuai dengan tujuan yang dimaksudkan. Halaman pembicaraan pengguna terutama untuk menerima pesan dari penyunting lain dan untuk komunikasi yang berkaitan dengan penyuntingan Wikipedia. Halaman ini tidak boleh digunakan untuk menerbitkan konten yang tidak diizinkan di ruang nama utama, untuk menampung materi promosi, atau untuk percakapan pribadi yang panjang yang tidak berkaitan dengan proyek. Harap tinjau [[WP:USERPAGE]] dan [[WP:TALKPAGE]] untuk panduan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menambahkan panduan cara bermain, kode curang, kiat, atau panduan bermain lainnya ke satu atau lebih artikel. Wikipedia adalah ensiklopedia, bukan panduan permainan. Artikel tentang permainan video harus memberikan informasi ensiklopedis tentang permainan tersebut daripada instruksi cara memainkannya. Harap tinjau [[WP:NOT#GUIDE]] dan pertimbangkan untuk menyumbangkan panduan bermain ke situs web khusus, seperti [[WP:WIKIA|wiki penggemar]].` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Saat membalik vandalisme yang jelas, harap ingat untuk meninggalkan peringatan yang sesuai di halaman pembicaraan penyunting yang bertanggung jawab. Memperingatkan penyunting tentang perilaku bermasalah adalah langkah penting dalam proses antivandalisme dan membantu pengguna memahami apa yang mereka lakukan salah sebelum tindakan yang lebih serius dipertimbangkan. Berbagai templat peringatan tersedia melalui [[WP:WARN]]. Harap biasakan untuk memposting peringatan setelah setiap pembalikan vandalisme.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this notice has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya disertai ringkasan suntingan yang tidak akurat, menyesatkan, atau tidak sesuai. Ringkasan suntingan harus menggambarkan perubahan yang dilakukan secara akurat dan ringkas. Menggunakan ringkasan yang menyesatkan, misalnya menggambarkan suntingan yang signifikan sebagai koreksi kecil, atau menggunakan ringkasan suntingan untuk membuat komentar pribadi, bertentangan dengan semangat penyuntingan yang transparan dan kolaboratif. Harap tinjau [[WP:ES]] dan pastikan ringkasan suntingan Anda mencerminkan perubahan Anda secara akurat.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa pemberitahuan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Komentar atau tindakan Anda yang baru-baru ini mengindikasikan bahwa Anda mungkin tidak [[WP:AGF|berasumsi berniat baik]] dari pihak penyunting lain. Lingkungan kolaboratif Wikipedia bergantung pada para penyunting yang saling memperlakukan satu sama lain dengan sikap yang bijak dan mengasumsikan bahwa kontribusi dibuat dengan iktikad baik kecuali ada bukti yang jelas sebaliknya. Harap tinjau [[WP:AGF]] sebelum melanjutkan interaksi dengan penyunting lain dengan cara seperti ini.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Kiriman Anda yang baru-baru ini di satu atau lebih halaman pembicaraan atau ruang diskusi tampaknya menyertakan komentar yang dihasilkan oleh model bahasa besar (seperti ChatGPT atau alat serupa) dan bukan ditulis dengan kata-kata Anda sendiri. Mengirim teks yang dihasilkan oleh kecerdasan buatan dalam diskusi antarpenyunting dapat menghambat dialog yang tulus dan dapat dianggap sebagai tindakan disruptif. Harap pastikan kontribusi Anda dalam diskusi mencerminkan pandangan Anda sendiri dan ditulis langsung oleh Anda.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Perilaku Anda yang baru-baru ini tampaknya merupakan [[WP:HARASS|pelecehan]] terhadap satu atau lebih pengguna lain. Pelecehan tidak ditoleransi di wiki ini. Semua penyunting berhak untuk berkontribusi dalam lingkungan yang bebas dari intimidasi, ancaman, atau penargetan negatif yang terus-menerus. Harap segera tinjau [[WP:HARASS]] dan [[WP:CIVIL]] dan hentikan perilaku ini.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Komentar Anda yang baru-baru ini tampaknya mengandung [[WP:NPA|serangan pribadi]] yang ditujukan kepada penyunting lain. Menyerang kontributor lain, termasuk melalui hinaan, sebutan yang merendahkan, atau pencemaran karakter mereka, tidak diperkenankan di wiki ini. Harap tinjau [[WP:NPA]] dan [[WP:CIVIL]], dan pastikan komentar Anda ke depannya membahas isi suntingan, bukan penyunting yang membuatnya.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya melibatkan penggunaan templat peringatan atau pemblokiran yang tidak tepat. Templat peringatan dan pemblokiran adalah alat administratif yang hanya boleh digunakan dalam keadaan yang sesuai dan oleh penyunting yang beriktikad baik sesuai dengan kebijakan yang berlaku. Menggunakannya untuk mengintimidasi, mengancam, atau membalas dendam terhadap penyunting lain tidak diperkenankan. Harap tinjau panduan yang relevan sebelum menggunakan templat ini kembali.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },
        ],
      },

      // --- Single warning ---
      {
        group: "Single warning",
        items: [
          // ------------------------------------------------------------------
          // Potential three-revert rule violation
          // ------------------------------------------------------------------
          {
            value: "3rr",
            label: "Potential three-revert rule violation",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: potential three-revert rule violation =="
                : "== Warning: potential three-revert rule violation ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: kemungkinan pelanggaran peraturan tiga-revert =="
                : "== Peringatan: kemungkinan pelanggaran peraturan tiga-revert ==";
              const bodyEn =
                `Your recent edits appear to have involved reverting the same article more than three times in a 24-hour period. This violates the three-revert rule, which is designed to prevent edit wars. Instead of continuing to revert, please discuss disputed content on the article's talk page and seek consensus with other editors. If you need additional help resolving disputes, consider using the dispute resolution process.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya melibatkan pengembalian artikel yang sama lebih dari tiga kali dalam periode 24 jam. Ini melanggar peraturan tiga-revert, yang dirancang untuk mencegah perang suntingan. Alih-alih terus mengembalikan, silakan diskusikan konten yang diperdebatkan di halaman pembicaraan artikel dan cari konsensus dengan penyunting lain. Jika Anda memerlukan bantuan tambahan untuk menyelesaikan perselisihan, pertimbangkan untuk menggunakan proses penyelesaian perselisihan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Affiliate marketing
          // ------------------------------------------------------------------
          {
            value: "affiliatemarketing",
            label: "Affiliate marketing",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: affiliate marketing =="
                : "== Warning: affiliate marketing ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: pemasaran afiliasi =="
                : "== Peringatan: pemasaran afiliasi ==";
              const bodyEn =
                `Your recent edits appear to have involved adding affiliate links or promoting products or services in which you have a financial interest. This violates Wikipedia's conflict of interest policy. Affiliate marketing and self-promotion are not permitted on Wikipedia. Please refrain from adding such content and disclose any financial interests you may have in articles you edit.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya melibatkan penambahan pranala afiliasi atau promosi produk atau layanan yang Anda miliki kepentingan finansial. Ini melanggar kebijakan konflik kepentingan Wikipedia. Pemasaran afiliasi dan promosi diri tidak diperkenankan di Wikipedia. Harap hindari menambahkan konten tersebut dan sebutkan setiap kepentingan finansial yang mungkin Anda miliki dalam artikel yang Anda sunting.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Creating attack pages
          // ------------------------------------------------------------------
          {
            value: "attackpage",
            label: "Creating attack pages",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: creating attack pages =="
                : "== Warning: creating attack pages ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: membuat halaman serangan =="
                : "== Peringatan: membuat halaman serangan ==";
              const bodyEn =
                `Your recent edits appear to have involved creating or editing pages designed to attack, insult, or demean other editors or individuals. Attack pages are not permitted on Wikipedia. Wikipedia is an encyclopedia, not a venue for personal disputes or harassment. Please refrain from creating such pages and treat all editors with respect and civility.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya melibatkan pembuatan atau penyuntingan halaman yang dirancang untuk menyerang, menghina, atau merendahkan penyunting atau individu lain. Halaman serangan tidak diperkenankan di Wikipedia. Wikipedia adalah ensiklopedia, bukan tempat untuk perselisihan pribadi atau pelecehan. Harap hindari membuat halaman tersebut dan perlakukan semua penyunting dengan hormat dan kesopanan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Bot username
          // ------------------------------------------------------------------
          {
            value: "botusername",
            label: "Bot username",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: bot username =="
                : "== Warning: bot username ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: nama pengguna bot =="
                : "== Peringatan: nama pengguna bot ==";
              const bodyEn =
                `Your username appears to indicate that you are a bot, but your account does not appear to be approved as a bot account. If you intend to operate as a bot, you must request approval through [[WP:BOTR|the appropriate channels]] and use an account that has been flagged as a bot. If your username merely contains the word "bot" but you are a human editor, please consider renaming your account to avoid confusion.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Nama pengguna Anda tampaknya menunjukkan bahwa Anda adalah bot, tetapi akun Anda tidak tampak disetujui sebagai akun bot. Jika Anda bermaksud mengoperasikannya sebagai bot, Anda harus meminta persetujuan melalui [[WP:BOT|kanal yang sesuai]] dan menggunakan akun yang telah ditandai sebagai bot. Jika nama pengguna Anda hanya berisi kata "bot" tetapi Anda adalah penyunting manusia, silakan pertimbangkan untuk mengganti nama akun Anda untuk menghindari kebingungan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Canvassing
          // ------------------------------------------------------------------
          {
            value: "canvassing",
            label: "Canvassing",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: canvassing =="
                : "== Warning: canvassing ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: canvassing =="
                : "== Peringatan: canvassing ==";
              const bodyEn =
                `Your recent actions appear to have involved canvassing, which is the practice of soliciting opinions or votes from other editors in a manner designed to support a particular position or outcome in a dispute. Canvassing manipulates the consensus-building process and is not permitted on Wikipedia. Please refrain from canvassing and allow discussions to proceed organically with input from genuinely interested editors.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Tindakan terbaru tampaknya melibatkan penganvasan, yaitu praktik meminta pendapat atau dukungan dari penyunting lain dengan cara yang dimaksudkan untuk mendukung suatu posisi atau hasil tertentu dalam sebuah sengketa atau diskusi. Penganvasan dapat memengaruhi proses pembentukan konsensus secara tidak semestinya dan tidak diperbolehkan di Wikipedia. ` +
                `\n\nMohon untuk tidak melakukan penganvasan dan biarkan diskusi berlangsung secara wajar dengan masukan dari para penyunting yang memang memiliki ketertarikan atau keterlibatan terhadap topik yang sedang dibahas. Konsensus Wikipedia harus dibangun melalui diskusi yang terbuka, netral, dan bebas dari upaya untuk mengarahkan hasil melalui perekrutan dukungan yang selektif.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Copyright violation
          // ------------------------------------------------------------------
          {
            value: "copyvio",
            label: "Copyright violation",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: copyright violation =="
                : "== Warning: copyright violation ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: pelanggaran hak cipta =="
                : "== Peringatan: pelanggaran hak cipta ==";
              const bodyEn =
                `Your recent edits appear to have involved adding text that is not compatible with Wikipedia's free content licensing requirements. Wikipedia content must be original or properly licensed under a compatible free license. Adding copyrighted material without permission is not permitted and violates both Wikipedia policy and copyright law. Please ensure all content you add is either original or properly attributed and licensed.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya melibatkan penambahan teks yang tidak kompatibel dengan persyaratan lisensi konten bebas Wikipedia. Konten Wikipedia harus asli atau berlisensi dengan benar di bawah lisensi bebas yang kompatibel. Menambahkan materi berhak cipta tanpa izin tidak diperkenankan dan melanggar kebijakan Wikipedia dan hukum hak cipta. Harap pastikan semua konten yang Anda tambahkan bersifat asli atau dikreditkan dan berlisensi dengan benar.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Linking to copyrighted works violation
          // ------------------------------------------------------------------
          {
            value: "copyrightlinks",
            label: "Linking to copyrighted works violation",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: linking to copyrighted works violation =="
                : "== Warning: linking to copyrighted works violation ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: pelanggaran pranala luar ke karya berhak cipta =="
                : "== Peringatan: pelanggaran pranala luar ke karya berhak cipta ==";
              const bodyEn =
                `Your recent edits appear to have involved adding links to external websites that primarily host copyrighted material in violation of copyright law. Wikipedia's external links policy does not permit linking to sites whose main purpose is to distribute copyrighted content illegally. Please refrain from adding such links and instead use legitimate sources that respect intellectual property rights.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya melibatkan penambahan pranala ke situs web eksternal yang terutama menyimpan materi berhak cipta yang melanggar hukum hak cipta. Kebijakan pranala luar Wikipedia tidak memperbolehkan pranala ke situs yang tujuan utamanya adalah mendistribusikan konten berhak cipta secara ilegal. Harap hindari menambahkan pranala luar tersebut dan gunakan sumber yang sah yang menghormati hak kekayaan intelektual.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Copyright violation (with explanation for new users)
          // ------------------------------------------------------------------
          {
            value: "copyvio-explain",
            label: "Copyright violation (with explanation for new users)",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: copyright violation =="
                : "== Warning: copyright violation ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: pelanggaran hak cipta =="
                : "== Peringatan: pelanggaran hak cipta ==";
              const bodyEn =
                `Your recent edits appear to have involved adding text that is not compatible with Wikipedia's free content licensing requirements. Wikipedia is built on the principle that all content should be freely available for anyone to use, modify, and distribute. This means we cannot accept text copied from copyrighted sources, including published books, academic papers, news articles, and websites, unless they are released under a compatible free license. ` +
                `\n\nWhen you contribute to Wikipedia, any text you add becomes available under the Creative Commons Attribution-ShareAlike License, which requires that others be free to reuse and modify it. If you copy text from a copyrighted source without permission, you are violating both Wikipedia's policy and copyright law. ` +
                `\n\nInstead, please write in your own words to explain concepts from sources you've read. You can cite sources to support your information, but the actual text must be original. If you're new to Wikipedia, please take time to read our guidelines on [[WP:CITING|citing sources and writing original content]].` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan terbaru Anda tampaknya menambahkan teks yang tidak sesuai dengan persyaratan lisensi konten bebas Wikipedia. Wikipedia dibangun berdasarkan prinsip bahwa seluruh kontennya harus tersedia secara bebas untuk digunakan, dimodifikasi, dan disebarluaskan oleh siapa pun. Oleh karena itu, Wikipedia tidak dapat menerima teks yang disalin dari sumber berhak cipta, termasuk buku terbitan, makalah akademik, artikel berita, maupun situs web, kecuali sumber tersebut diterbitkan dengan lisensi bebas yang kompatibel. ` +
                `\n\nKetika Anda berkontribusi ke Wikipedia, setiap teks yang ditambahkan akan tersedia di bawah Lisensi Creative Commons Atribusi-BerbagiSerupa (Creative Commons Attribution-ShareAlike), yang mengharuskan pihak lain dapat menggunakan kembali dan memodifikasinya secara bebas. Jika Anda menyalin teks dari sumber yang dilindungi hak cipta tanpa izin, tindakan tersebut melanggar kebijakan Wikipedia sekaligus hukum hak cipta. ` +
                `\n\nSebagai gantinya, tulislah informasi dengan kata-kata Anda sendiri berdasarkan sumber yang telah dibaca. Anda dapat mencantumkan sumber untuk mendukung informasi yang ditambahkan, tetapi teks yang ditulis harus merupakan hasil penyusunan sendiri. Jika Anda baru mengenal Wikipedia, luangkan waktu untuk mempelajari pedoman mengenai [[WP:KUTIP|pencantuman sumber]] dan penulisan konten asli.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Removing {{copyvio}} template from articles
          // ------------------------------------------------------------------
          {
            value: "removecopyviolate",
            label: "Removing {{copyvio}} template from articles",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: removing {{copyvio}} template from articles =="
                : "== Warning: removing {{copyvio}} template from articles ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: menghapus templat {{copyvio}} dari artikel =="
                : "== Peringatan: menghapus templat {{copyvio}} dari artikel ==";
              const bodyEn =
                `Your recent edits appear to have involved removing the {{tlx|copyvio}} template or copyright violation notices from articles without resolving the underlying copyright issues. The {{tlx|copyvio}} template is placed on articles to alert editors and readers that the article may contain copyrighted material that needs to be addressed. Removing this template without fixing the copyright problem does not resolve the issue and prevents other editors from being aware of the problem. ` +
                `\n\nIf you believe a copyright violation notice was added in error, please discuss it on the article's talk page or contact the editor who added it. If the copyright violation has been resolved by rewriting the problematic sections in original text, then the template may be removed. Simply removing the template without addressing the underlying issue is not permitted.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya melibatkan penghapusan templat {{tlx|copyvio}} atau pemberitahuan pelanggaran hak cipta dari artikel tanpa menyelesaikan masalah hak cipta yang mendasarinya. Templat {{tlx|copyvio}} ditempatkan pada artikel untuk memperingatkan penyunting dan pembaca bahwa artikel mungkin berisi materi berhak cipta yang perlu ditangani. Menghapus templat ini tanpa memperbaiki masalah hak cipta tidak menyelesaikan masalah dan mencegah penyunting lain mengetahui masalahnya. ` +
                `\n\nJika Anda percaya bahwa pemberitahuan pelanggaran hak cipta ditambahkan secara keliru, silakan diskusikan di halaman pembicaraan artikel atau hubungi penyunting yang menambahkannya. Jika pelanggaran hak cipta telah diselesaikan dengan menulis ulang bagian-bagian bermasalah dengan teks asli, maka templat dapat dihapus. Sekadar menghapus templat tanpa mengatasi masalah yang mendasarinya tidak diperkenankan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Addition of derogatory/hateful content
          // ------------------------------------------------------------------
          {
            value: "derogatory",
            label: "Addition of derogatory/hateful content",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: addition of derogatory/hateful content =="
                : "== Warning: addition of derogatory/hateful content ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penambahan konten merendahkan/kebencian =="
                : "== Peringatan: penambahan konten merendahkan/kebencian ==";
              const bodyEn =
                `Your recent edits appear to have involved adding content that is derogatory, hateful, or discriminatory toward individuals or groups based on characteristics such as race, ethnicity, religion, gender, sexual orientation, or disability. Wikipedia has a strict policy against such content. Our encyclopaedia should be written in a neutral, respectful tone and should not promote hatred or discrimination of any kind. ` +
                `\n\nAll editors are expected to treat others with respect and civility. Content that demeans or attacks people based on their identity is not compatible with Wikipedia's values and community standards. Please review Wikipedia's policy on [[WP:CIVIL|civility]] and [[WP:NPOV|neutral point of view]] before making further edits.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya melibatkan penambahan konten yang merendahkan, penuh kebencian, atau diskriminasi terhadap individu atau kelompok berdasarkan karakteristik seperti ras, etnis, agama, jenis kelamin, orientasi seksual, atau disabilitas. Wikipedia memiliki kebijakan ketat terhadap konten semacam itu. Ensiklopedia kita harus ditulis dengan nada yang netral dan menghormati serta tidak boleh mempromosikan kebencian atau diskriminasi dalam bentuk apa pun. ` +
                `\n\nSemua penyunting diharapkan memperlakukan orang lain dengan hormat dan kesopanan. Konten yang merendahkan atau menyerang orang berdasarkan identitas mereka tidak sesuai dengan nilai-nilai dan standar komunitas Wikipedia. Silakan tinjau kebijakan Wikipedia tentang [[WP:CIVIL|kesopanan]] dan [[WP:NPOV|sudut pandang netral]] sebelum melakukan penyuntingan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Edit summary triggering the edit filter
          // ------------------------------------------------------------------
          {
            value: "editsummaryfilter",
            label: "Edit summary triggering the edit filter",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: edit summary triggering the edit filter =="
                : "== Warning: edit summary triggering the edit filter ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: ringkasan suntingan memicu filter penyuntingan =="
                : "== Peringatan: ringkasan suntingan memicu filter penyuntingan ==";
              const bodyEn =
                `Your recent edit was flagged by the abuse filter due to the content of your edit summary. Edit summaries are an important part of Wikipedia's collaborative process, as they help other editors understand the changes being made. However, edit summaries should remain constructive, civil, and relevant to the actual edits being made. ` +
                `\n\nAbusive, hostile, or offensive language in edit summaries—even if the edit itself is constructive—can trigger automated filters designed to prevent disruption. Please ensure that your edit summaries are polite, informative, and free from language that could be considered insulting or provocative. If you have a concern about an edit or editor, address it through appropriate channels such as the talk page, not through hostile edit summaries.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini ditandai oleh penyaring penyalahgunaan karena konten ringkasan suntingan Anda. Ringkasan suntingan adalah bagian penting dari proses kolaboratif Wikipedia, karena membantu penyunting lain memahami perubahan yang dibuat. Namun, ringkasan suntingan harus tetap konstruktif, sopan, dan relevan dengan suntingan aktual yang dilakukan. ` +
                `\n\nBahasa kasar, bermusuhan, atau menyinggung dalam ringkasan suntingan. Bahkan, jika suntingannya sendiri konstruktif, dapat memicu penyaring otomatis yang dirancang untuk mencegah gangguan. Harap pastikan bahwa ringkasan suntingan Anda sopan, informatif, dan bebas dari bahasa yang dapat dianggap menghina atau provokatif. Jika Anda memiliki kekhawatiran tentang suntingan atau penyunting, tangani melalui saluran yang sesuai seperti halaman pembicaraan, bukan melalui ringkasan suntingan yang bermusuhan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Edit warring (stronger wording)
          // ------------------------------------------------------------------
          {
            value: "ew-strong",
            label: "Edit warring (stronger wording)",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: edit warring =="
                : "== Warning: edit warring ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: perang suntingan =="
                : "== Peringatan: perang suntingan ==";
              const bodyEn =
                `Your recent edits constitute edit warring. You have repeatedly reverted, overwritten, or undone the contributions of other editors without seeking consensus or engaging in meaningful discussion. Edit warring is a serious violation of Wikipedia policy and directly undermines the collaborative nature of this project. ` +
                `\n\nWikipedia is built on consensus and constructive dialogue. When you disagree with another editor's contribution, the appropriate response is to discuss the matter on the article's talk page, not to engage in a cycle of reverts. Continuing to revert changes without discussion demonstrates bad faith and is disruptive to the community. ` +
                `\n\nThis behaviour can result in loss of editing privileges. If disputes persist, they will be escalated through formal dispute resolution processes, which may result in blocks or other sanctions. Please immediately cease this edit warring behaviour and use the talk page to discuss any content disagreements with other editors. Consensus must be reached through dialogue, not through repeated reverts.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini merupakan perang suntingan. Anda telah berulang kali mengembalikan, menimpa, atau membatalkan kontribusi penyunting lain tanpa mencari konsensus atau terlibat dalam diskusi bermakna. Perang suntingan adalah pelanggaran serius terhadap kebijakan Wikipedia dan secara langsung merusak sifat kolaboratif proyek ini. ` +
                `\n\nWikipedia dibangun atas dasar konsensus dan dialog konstruktif. Ketika Anda tidak setuju dengan kontribusi penyunting lain, tanggapan yang tepat adalah mendiskusikan masalah di halaman pembicaraan artikel, bukan terlibat dalam siklus pengembalian. Terus mengembalikan perubahan tanpa diskusi menunjukkan iktikad buruk dan mengganggu komunitas. ` +
                `\n\nPerilaku ini dapat mengakibatkan hilangnya hak istimewa penyuntingan. Jika perselisihan terus berlanjut, perselisihan akan ditingkatkan melalui proses penyelesaian perselisihan formal, yang dapat mengakibatkan pemblokiran atau sanksi lainnya. Harap segera hentikan perilaku perang suntingan ini dan gunakan halaman pembicaraan untuk mendiskusikan ketidaksepakatan konten apa pun dengan penyunting lain. Konsensus harus dicapai melalui dialog, bukan melalui pengembalian berulang.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Edit warring (softer wording for newcomers)
          // ------------------------------------------------------------------
          {
            value: "ew-newcomer",
            label: "Edit warring (softer wording for newcomers)",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: edit warring =="
                : "== Warning: edit warring ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: perang suntingan =="
                : "== Peringatan: perang suntingan ==";
              const bodyEn =
                `I noticed that you've been reverting edits made by other editors multiple times on the same article. I understand that you may feel strongly about certain content, but repeatedly undoing other editors' changes without discussion can create tension and conflict in our community. ` +
                `\n\nWikipedia works best when editors collaborate and talk through their disagreements. Instead of reverting changes back and forth, please try using the article's talk page to discuss your concerns with other editors. Explain why you think a change is incorrect, and listen to what others have to say. This helps us reach agreements that everyone can accept. ` +
                `\n\nIf you're new to Wikipedia, you might find it helpful to read about how to resolve disagreements. Most disputes can be worked out through calm, respectful conversation. Thank you for understanding, and please feel free to reach out if you have questions about how to discuss edits with other editors.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Saya perhatikan bahwa Anda telah mengembalikan suntingan yang dibuat oleh penyunting lain berkali-kali pada artikel yang sama. Saya memahami bahwa Anda mungkin merasa kuat tentang konten tertentu, tetapi berulang kali membatalkan perubahan penyunting lain tanpa diskusi dapat menciptakan ketegangan dan konflik di komunitas kita. ` +
                `\n\nWikipedia bekerja paling baik ketika penyunting berkolaborasi dan membicarakan perselisihan mereka. Alih-alih mengembalikan perubahan bolak-balik, silakan coba gunakan halaman pembicaraan artikel untuk mendiskusikan kekhawatiran Anda dengan penyunting lain. Jelaskan mengapa Anda pikir perubahan itu salah, dan dengarkan apa yang dikatakan orang lain. Ini membantu kita mencapai kesepakatan yang dapat diterima semua orang. ` +
                `\n\nJika Anda baru mengenal Wikipedia, Anda mungkin merasa terbantu untuk membaca tentang cara menyelesaikan perselisihan. Sebagian besar perselisihan dapat diselesaikan melalui percakapan yang tenang dan menghormati. Terima kasih telah memahami, dan silakan hubungi jika Anda memiliki pertanyaan tentang cara mendiskusikan suntingan dengan penyunting lain.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Hijacking articles
          // ------------------------------------------------------------------
          {
            value: "hijacking",
            label: "Hijacking articles",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: hijacking articles =="
                : "== Warning: hijacking articles ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: pembajakan artikel =="
                : "== Peringatan: pembajakan artikel ==";
              const bodyEn =
                `Your recent edits appear to have involved hijacking an article by substantially altering its focus, scope, or topic without consensus from other editors. Article hijacking occurs when an editor takes over an article and changes it to serve a different purpose, promote a particular viewpoint, or remove content that other editors have contributed, all without discussion or agreement. ` +
                `\n\nArticles on Wikipedia belong to the community as a whole, not to any individual editor. Major changes to an article's scope, focus, or content should be discussed on the article's talk page to ensure that all editors have an opportunity to participate in decisions about the article's direction. Unilaterally making large-scale changes that fundamentally alter an article without consensus is not permitted. ` +
                `\n\nIf you believe an article needs significant changes, please start a discussion on its talk page, explain your proposed changes, and work toward consensus with other editors. Respect the collaborative nature of Wikipedia and the contributions of other editors.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan terbaru tampaknya melibatkan pengambilalihan artikel (''article hijacking''), yaitu tindakan mengubah fokus, cakupan, atau topik suatu artikel secara substansial tanpa adanya konsensus dari penyunting lain. Pengambilalihan artikel terjadi ketika seorang penyunting mengubah artikel sehingga melayani tujuan yang berbeda, mempromosikan sudut pandang tertentu, atau menghapus kontribusi penyunting lain tanpa diskusi maupun kesepakatan terlebih dahulu. ` +
                `\n\nArtikel di Wikipedia merupakan milik komunitas secara keseluruhan, bukan milik penyunting perorangan. Perubahan besar terhadap cakupan, fokus, atau isi artikel seharusnya didiskusikan terlebih dahulu di halaman pembicaraan artikel agar semua penyunting memiliki kesempatan untuk berpartisipasi dalam menentukan arah pengembangan artikel tersebut. Melakukan perubahan besar secara sepihak yang mengubah karakter atau tujuan dasar sebuah artikel tanpa konsensus tidak diperbolehkan. ` +
                `\n\nJika Anda merasa suatu artikel memerlukan perubahan yang signifikan, silakan memulai diskusi di halaman pembicaraannya, menjelaskan perubahan yang diusulkan, dan berupaya mencapai konsensus bersama penyunting lain. Hormati sifat kolaboratif Wikipedia serta kontribusi yang telah diberikan oleh para penyunting lainnya.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Creating hoaxes
          // ------------------------------------------------------------------
          {
            value: "hoax",
            label: "Creating hoaxes",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: creating hoaxes =="
                : "== Warning: creating hoaxes ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: membuat hoaks =="
                : "== Peringatan: membuat hoaks ==";
              const bodyEn =
                `Your recent edits appear to have involved creating or contributing to hoax articles or hoax content. Hoaxes are deliberately false or misleading articles designed to deceive readers. They undermine Wikipedia's credibility and mission to provide reliable, accurate information. Creating hoaxes is a serious violation of Wikipedia policy and damages the trust that readers place in our encyclopaedia. ` +
                `\n\nWikipedia is an encyclopaedia intended to contain factual, verifiable information. All content must be based on reliable sources, and editors are expected to act in good faith. Deliberately inserting false information, fabricated sources, or misleading content—whether as a prank, experiment, or for any other reason—is not permitted and can result in serious consequences, including permanent bans from editing. ` +
                `\n\nIf you are interested in experimenting with Wikipedia's editing features, please use the [[WP:SANDBOX|sandbox]] or [[WP:TEST|test pages]] provided for that purpose. If you have questions about what constitutes reliable sourcing or how to verify information, please ask for guidance from experienced editors.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan terbaru tampaknya melibatkan pembuatan atau penambahan kontribusi pada artikel tipuan (hoaks) maupun konten tipuan. Artikel hoaks adalah artikel yang sengaja memuat informasi palsu atau menyesatkan dengan tujuan memperdaya pembaca. Tindakan semacam ini merusak kredibilitas Wikipedia dan bertentangan dengan misinya untuk menyediakan informasi yang andal dan akurat. Pembuatan artikel tipuan merupakan pelanggaran serius terhadap kebijakan Wikipedia dan dapat mengurangi kepercayaan pembaca terhadap ensiklopedia ini. ` +
                `\n\nWikipedia adalah ensiklopedia yang bertujuan menyajikan informasi faktual yang dapat diverifikasi. Semua konten harus didasarkan pada sumber tepercaya, dan para penyunting diharapkan bertindak dengan iktikad baik. Menambahkan informasi palsu, sumber yang direkayasa, atau konten yang menyesatkan secara sengaja, baik sebagai lelucon, percobaan, maupun untuk tujuan lainnya, tidak diperbolehkan dan dapat berakibat serius, termasuk pelarangan menyunting tanpa batas waktu. ` +
                `\n\nJika Anda ingin mencoba fitur-fitur penyuntingan Wikipedia, silakan gunakan [[WP:SANDBOX|bak pasir]] atau [[WP:TEST|halaman uji coba]] yang disediakan untuk tujuan tersebut. Jika memiliki pertanyaan mengenai sumber tepercaya atau cara memverifikasi informasi, silakan meminta bimbingan dari penyunting yang lebih berpengalaman.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Making legal threats
          // ------------------------------------------------------------------
          {
            value: "legalthreat",
            label: "Making legal threats",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: making legal threats =="
                : "== Warning: making legal threats ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: membuat ancaman hukum =="
                : "== Peringatan: membuat ancaman hukum ==";
              const bodyEn =
                `Your recent actions appear to have involved making legal threats against Wikipedia, its editors, or the Wikimedia Foundation. Making legal threats—whether explicit or implicit—is a serious violation of Wikipedia policy and is not tolerated under any circumstances. Legal threats are used to intimidate, silence, or coerce others, and they have no place in collaborative editing. ` +
                `\n\nIf you have a legitimate legal concern regarding Wikipedia content or the conduct of other editors, the appropriate course of action is to contact the Wikimedia Foundation's legal department through [mailto:legal@wikimedia.org official channels], not to issue threats on Wikipedia itself. Making threats in edit summaries, talk pages, or elsewhere on the site will not advance your position and will only result in disciplinary action. ` +
                `\n\nWikipedia is built on mutual respect and the assumption of good faith. Threatening legal action is fundamentally incompatible with these principles and demonstrates a failure to engage constructively with the community. Any further legal threats will result in immediate action, including potential permanent removal of your editing privileges.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Tindakan terbaru tampaknya melibatkan ancaman hukum terhadap Wikipedia, para penyuntingnya, atau Wikimedia Foundation. Ancaman hukum, baik secara tersurat maupun tersirat, merupakan pelanggaran serius terhadap kebijakan Wikipedia dan tidak ditoleransi dalam keadaan apa pun. Ancaman hukum dapat digunakan untuk mengintimidasi, membungkam, atau menekan pihak lain, sehingga tidak memiliki tempat dalam lingkungan penyuntingan kolaboratif. ` +
                `\n\nJika Anda memiliki kekhawatiran hukum yang sah mengenai isi Wikipedia atau perilaku penyunting lain, langkah yang tepat adalah menghubungi bagian hukum Wikimedia Foundation melalui saluran resmi, seperti surel ke [mailto:legal@wikimedia.org legal@wikimedia.org], bukan dengan menyampaikan ancaman di Wikipedia. Ancaman yang disampaikan melalui ringkasan suntingan, halaman pembicaraan, atau bagian lain situs tidak akan memperkuat posisi Anda dan hanya akan berujung pada tindakan administratif. ` +
                `\n\nWikipedia dibangun atas dasar saling menghormati dan anggapan iktikad baik. Mengancam akan menempuh tindakan hukum bertentangan dengan prinsip-prinsip tersebut dan menunjukkan ketidakmampuan untuk berinteraksi secara konstruktif dengan komunitas. Setiap ancaman hukum lebih lanjut dapat mengakibatkan tindakan segera, termasuk kemungkinan pencabutan hak penyuntingan secara permanen.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Editing while logged out
          // ------------------------------------------------------------------
          {
            value: "loggedout",
            label: "Editing while logged out",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: editing while logged out =="
                : "== Warning: editing while logged out ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: menyunting saat tidak masuk =="
                : "== Peringatan: menyunting saat tidak masuk ==";
              const bodyEn =
                `Your recent edits appear to have been made while logged out, using only your IP address rather than a registered account. While editing while logged out is not explicitly forbidden, it is strongly discouraged because it creates several problems for the Wikipedia community. ` +
                `\n\nWhen you edit without logging in, your IP address is recorded publicly on Wikipedia, which can reveal your location and make it difficult for other editors to keep track of your contributions. It also prevents you from building a reputation as a reliable editor and makes it harder for administrators to track patterns of behaviour. Additionally, editing while logged out can sometimes result in your IP address being mistaken for other editors' IPs, which can cause confusion. ` +
                `\n\nFor these reasons, we ask that you please log in before making edits. Creating a registered account is quick, free, and provides you with many benefits, including the ability to track your contributions, set preferences, and build trust with the community. If you do not already have an account, please consider creating one. If you have questions about creating or using an account, feel free to ask.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan terbaru tampaknya dilakukan saat Anda tidak masuk log (''log in'') dan hanya menggunakan alamat IP, bukan akun terdaftar. Meskipun menyunting tanpa masuk log tidak secara tegas dilarang, praktik tersebut sangat tidak dianjurkan karena dapat menimbulkan berbagai kendala bagi komunitas Wikipedia. ` +
                `\n\nKetika Anda menyunting tanpa masuk log, alamat IP Anda akan tercatat dan ditampilkan secara publik di Wikipedia. Hal ini dapat mengungkapkan perkiraan lokasi Anda serta menyulitkan penyunting lain untuk menelusuri kontribusi yang telah dibuat. Selain itu, Anda tidak dapat membangun reputasi sebagai penyunting yang tepercaya, dan pengurus akan lebih sulit mengenali pola kontribusi maupun perilaku penyuntingan Anda. Dalam beberapa kasus, penyuntingan menggunakan alamat IP juga dapat menyebabkan alamat tersebut tertukar dengan alamat IP penyunting lain sehingga menimbulkan kebingungan. ` +
                `\n\nOleh karena itu, kami meminta Anda untuk masuk log sebelum melakukan penyuntingan. Membuat akun terdaftar dapat dilakukan dengan cepat dan tanpa biaya, serta memberikan berbagai manfaat, termasuk kemampuan untuk melacak kontribusi, mengatur preferensi, dan membangun kepercayaan di dalam komunitas. Jika Anda belum memiliki akun, pertimbangkan untuk membuatnya. Apabila memiliki pertanyaan mengenai cara membuat atau menggunakan akun, jangan ragu untuk bertanya.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Usage of multiple temporary accounts
          // ------------------------------------------------------------------
          {
            value: "multiaccount",
            label: "Usage of multiple temporary accounts",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: usage of multiple temporary accounts =="
                : "== Warning: usage of multiple temporary accounts ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: penggunaan beberapa akun sementara =="
                : "== Peringatan: penggunaan beberapa akun sementara ==";
              const bodyEn =
                `Your recent edits appear to have involved the use of multiple accounts, which suggests an attempt to circumvent community policies, manipulate discussions, or evade accountability. Creating and using multiple accounts to achieve goals that would be difficult or impossible with a single account is known as sock puppeting and is not permitted on Wikipedia. ` +
                `\n\nMultiple accounts can be used to make it appear that there is broader support for a particular position than actually exists, to evade editing restrictions, to engage in edit warring without detection, or to avoid consequences for rule violations. This type of behaviour undermines the integrity of Wikipedia's collaborative process and violates the trust of the community. ` +
                `\n\nEditors are expected to use a single, identifiable account for all their edits. If you have legitimate reasons for maintaining multiple accounts (for example, separate accounts for different languages or projects), you should disclose this to administrators and request approval. Using multiple accounts without disclosure or authorization is a serious violation and can result in all of your accounts being blocked permanently.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan terbaru tampaknya melibatkan penggunaan beberapa akun, yang mengindikasikan adanya upaya untuk menghindari kebijakan komunitas, memengaruhi jalannya diskusi, atau menghindari pertanggungjawaban. Pembuatan dan penggunaan beberapa akun untuk mencapai tujuan yang sulit atau tidak mungkin dicapai dengan satu akun dikenal sebagai penggunaan akun siluman (''sock puppeting'') dan tidak diperbolehkan di Wikipedia. ` +
                `\n\nBeberapa akun dapat digunakan untuk menciptakan kesan bahwa suatu pendapat memperoleh dukungan yang lebih luas daripada yang sebenarnya, menghindari pembatasan penyuntingan, terlibat dalam perang suntingan tanpa mudah terdeteksi, atau menghindari konsekuensi atas pelanggaran aturan. Perilaku semacam ini merusak integritas proses kolaboratif Wikipedia dan melanggar kepercayaan komunitas. ` +
                `\n\nPenyunting diharapkan menggunakan satu akun yang jelas identitasnya untuk seluruh kegiatan penyuntingan. Jika memiliki alasan yang sah untuk mempertahankan lebih dari satu akun, misalnya akun terpisah untuk bahasa atau proyek yang berbeda, hal tersebut sebaiknya diungkapkan kepada pengurus dan memperoleh persetujuan terlebih dahulu. Penggunaan beberapa akun tanpa pengungkapan atau izin merupakan pelanggaran serius yang dapat mengakibatkan seluruh akun yang terkait diblokir permanen.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Close paraphrasing
          // ------------------------------------------------------------------
          {
            value: "closeParaphrasing",
            label: "Close paraphrasing",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: close paraphrasing =="
                : "== Warning: close paraphrasing ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: parafrase yang mirip =="
                : "== Peringatan: parafrase yang mirip ==";
              const bodyEn =
                `Your recent edits appear to have involved close paraphrasing of copyrighted material. Close paraphrasing occurs when text is reworded from a source material in a way that stays too closely to the original wording, structure, or flow, without sufficiently transforming the content into your own words. This practice violates Wikipedia's copyright policies just as much as direct copying does. ` +
                `\n\nWikipedia requires that all content be original or properly licensed. When you paraphrase from a source, you must substantially rephrase the material, changing not just individual words but also the sentence structure and organisation. Simply rearranging words or replacing a few terms with synonyms is not acceptable paraphrasing. ` +
                `\n\nThe best approach is to read a source material, understand the concepts, and then write about them in your own words without referring back to the original text. Always ensure that your contribution reflects your own understanding and expression of the information. If you need guidance on how to properly paraphrase and attribute information, please consult Wikipedia's guidelines on [[WP:CITING|citing sources]].` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan terbaru tampaknya melibatkan parafrasa yang terlalu dekat (''close paraphrasing'') dengan materi yang dilindungi hak cipta. Parafrasa yang terlalu dekat terjadi ketika teks dari suatu sumber ditulis ulang dengan perubahan yang sangat terbatas sehingga susunan kalimat, struktur, atau alur penyampaiannya masih terlalu mirip dengan teks asli. Praktik ini melanggar kebijakan hak cipta Wikipedia sama halnya dengan penyalinan langsung. ` +
                `\n\nWikipedia mengharuskan seluruh konten yang ditambahkan bersifat asli atau berasal dari materi yang memiliki lisensi yang sesuai. Ketika memparafrasakan suatu sumber, Anda harus menulis ulang materi tersebut secara substansial, tidak hanya mengganti beberapa kata, tetapi juga mengubah struktur kalimat dan cara penyajian informasinya. Sekadar menata ulang kata-kata atau mengganti beberapa istilah dengan sinonim tidak dianggap sebagai parafrasa yang memadai. ` +
                `\n\nPendekatan terbaik adalah membaca sumber, memahami konsep yang disampaikan, lalu menuliskannya kembali dengan kata-kata sendiri tanpa terus merujuk pada teks aslinya. Pastikan setiap kontribusi mencerminkan pemahaman dan penyampaian informasi Anda sendiri. Jika memerlukan panduan mengenai cara memparafrasakan dan mencantumkan sumber dengan benar, silakan merujuk pada pedoman Wikipedia tentang [[WP:CITING|pencantuman sumber]].` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Personal info (outing)
          // ------------------------------------------------------------------
          {
            value: "outing",
            label: "Personal info (outing)",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: personal information disclosure =="
                : "== Warning: personal information disclosure ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: pengungkapan informasi pribadi =="
                : "== Peringatan: pengungkapan informasi pribadi ==";
              const bodyEn =
                `Your recent actions appear to have involved disclosing or attempting to [[WP:DOXXING|disclose personal information]] about another editor or individual without their consent. This practice, known as "outing," is a serious violation of Wikipedia policy and is absolutely not tolerated under any circumstances. ` +
                `\n\nPersonal information includes, but is not limited to, real names, addresses, phone numbers, email addresses, workplace information, photographs, or any other details that could identify or locate an individual in the real world. Disclosing such information—whether to harass, intimidate, retaliate against, or embarrass someone—is a form of harassment and can have serious real-world consequences for the person involved. ` +
                `\n\nWikipedia's privacy policies exist to protect the safety and security of our editors and the people they write about. Violating someone's privacy through outing is harmful to the individual, damaging to the Wikipedia community, and may violate applicable laws. This behaviour will not be tolerated and will result in immediate and severe consequences, including permanent removal of your editing privileges and potential legal action.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Tindakan terbaru tampaknya melibatkan pengungkapan atau upaya mengungkap [[WP:DOXXING|informasi pribadi]] milik penyunting lain atau individu lain tanpa persetujuan mereka. Praktik ini, yang dikenal sebagai ''outing'', merupakan pelanggaran serius terhadap kebijakan Wikipedia dan sama sekali tidak ditoleransi dalam keadaan apa pun. ` +
                `\n\nInformasi pribadi mencakup, tetapi tidak terbatas pada, nama asli, alamat, nomor telepon, alamat surel, informasi tempat kerja, foto, atau rincian lain yang dapat digunakan untuk mengidentifikasi atau menemukan seseorang di dunia nyata. Mengungkap informasi semacam itu, baik untuk melecehkan, mengintimidasi, membalas dendam, maupun mempermalukan seseorang, merupakan bentuk pelecehan yang dapat menimbulkan konsekuensi serius bagi individu yang bersangkutan. ` +
                `\n\nKebijakan privasi Wikipedia dibuat untuk melindungi keselamatan dan keamanan para penyunting serta orang-orang yang menjadi subjek tulisan di Wikipedia. Pelanggaran privasi melalui outing merugikan individu yang menjadi sasaran, merusak komunitas Wikipedia, dan dalam beberapa kasus dapat melanggar hukum yang berlaku. Perilaku semacam ini tidak akan ditoleransi dan dapat mengakibatkan tindakan segera serta tegas, termasuk pencabutan hak penyuntingan secara permanen dan kemungkinan langkah hukum lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Recreating salted articles under a different title
          // ------------------------------------------------------------------
          {
            value: "saltedrecreate",
            label: "Recreating salted articles under a different title",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: recreating salted articles under a different title =="
                : "== Warning: recreating salted articles under a different title ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: membuat ulang artikel di bawah judul yang berbeda =="
                : "== Peringatan: membuat ulang artikel di bawah judul yang berbeda ==";
              const bodyEn =
                `Your recent edits appear to have involved recreating an article that has been salted by administrators under a different title. Salting is an administrative action taken to prevent the recreation of articles that have been deleted due to policy violations, such as articles about non-notable subjects, hoaxes, or articles that repeatedly violated Wikipedia's policies. ` +
                `\n\nWhen an article is salted, it means that administrators have determined that the article should not exist on Wikipedia and have taken steps to prevent its recreation. Attempting to circumvent this restriction by recreating the article under a similar or different title undermines administrative decisions and the deletion process. This behaviour demonstrates bad faith and a disregard for community consensus. ` +
                `\n\nIf you believe an article was unfairly deleted or salted, the appropriate course of action is to request an undeletion review through Wikipedia's dispute resolution process, not to recreate the article yourself. Please respect administrative decisions and work through proper channels if you wish to challenge them.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan terbaru tampaknya berupa pembuatan kembali sebuah artikel yang telah dikenai perlindungan terhadap pembuatan ulang (''salted'') oleh pengurus dengan judul lain. Tindakan ini diterapkan untuk mencegah artikel yang sebelumnya dihapus karena pelanggaran kebijakan dibuat kembali, seperti artikel tentang subjek yang tidak memenuhi kriteria kelayakan, artikel tipuan, atau artikel yang berulang kali melanggar kebijakan Wikipedia. ` +
                `\n\nJika sebuah artikel telah dikenai perlindungan terhadap pembuatan ulang (''salted''), berarti para pengurus telah menetapkan bahwa artikel tersebut tidak layak berada di Wikipedia dan telah menerapkan langkah untuk mencegah pembuatannya kembali. Mencoba mengakali pembatasan tersebut dengan membuat ulang artikel yang sama di bawah judul serupa atau berbeda merupakan tindakan yang bertentangan dengan keputusan administratif dan proses penghapusan yang berlaku. Perilaku ini mencerminkan kurangnya iktikad baik serta ketidakpatuhan terhadap konsensus komunitas. ` +
                `\n\nApabila terdapat keyakinan bahwa suatu artikel telah dihapus atau dikenai perlindungan terhadap pembuatan ulang secara tidak semestinya, tindakan yang tepat adalah meminta peninjauan atas penghapusan tersebut melalui prosedur penyelesaian sengketa yang berlaku di Wikipedia, bukan dengan membuat ulang artikelnya. Harap menghormati keputusan administratif yang telah ditetapkan dan menempuh saluran yang sesuai apabila ingin menantang atau mengajukan keberatan atas keputusan tersebut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Sockpuppetry
          // ------------------------------------------------------------------
          {
            value: "sockpuppetry",
            label: "Sockpuppetry",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: sockpuppetry =="
                : "== Warning: sockpuppetry ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: sockpuppetry =="
                : "== Peringatan: sockpuppetry ==";
              const bodyEn =
                `Your recent actions appear to have involved sockpuppetry, which is the creation and use of multiple accounts to achieve goals that would be difficult or impossible with a single account. Sockpuppetry is a serious violation of Wikipedia policy and is not tolerated under any circumstances. ` +
                `\n\nMultiple accounts can be misused in various ways, including to make it appear that there is broader support for a particular position than actually exists, to evade editing restrictions or blocks, to engage in edit warring without detection, to circumvent community decisions, or to avoid accountability for rule violations. All of these uses undermine the integrity of Wikipedia's collaborative process and violate the trust of the community. ` +
                `\n\nEditors are expected to maintain a single, identifiable account and to use it for all their contributions on Wikipedia. If you have legitimate reasons for maintaining multiple accounts, such as separate accounts for different languages or projects, you must disclose this to administrators and request explicit approval. Using multiple accounts without prior disclosure and authorisation is a serious violation that can result in all of your accounts being permanently blocked and your contributions being reverted.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Tindakan terbaru tampaknya melibatkan penggunaan akun siluman (''sockpuppetry''), yaitu pembuatan dan penggunaan beberapa akun untuk mencapai tujuan yang sulit atau tidak mungkin dicapai dengan satu akun saja. Penggunaan akun siluman merupakan pelanggaran serius terhadap kebijakan Wikipedia dan tidak ditoleransi dalam keadaan apa pun. ` +
                `\n\nBeberapa akun dapat disalahgunakan dalam berbagai cara, termasuk untuk menciptakan kesan seolah-olah terdapat dukungan yang lebih luas terhadap suatu pendapat daripada yang sebenarnya, menghindari pembatasan penyuntingan atau pemblokiran, terlibat dalam perang suntingan tanpa terdeteksi, mengakali keputusan komunitas, atau menghindari pertanggungjawaban atas pelanggaran aturan. Semua bentuk penyalahgunaan tersebut merusak integritas proses kolaboratif Wikipedia dan melanggar kepercayaan komunitas. ` +
                `\n\nPenyunting diharapkan menggunakan satu akun yang jelas identitasnya dan memakainya untuk seluruh kontribusi di Wikipedia. Apabila terdapat alasan yang sah untuk memiliki lebih dari satu akun, misalnya akun terpisah untuk bahasa atau proyek yang berbeda, hal tersebut harus diungkapkan kepada pengurus dan memperoleh persetujuan yang jelas terlebih dahulu. Penggunaan beberapa akun tanpa pengungkapan dan izin sebelumnya merupakan pelanggaran serius yang dapat mengakibatkan seluruh akun diblokir tanpa batas waktu serta kontribusi yang terkait dibatalkan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Userpage vandalism
          // ------------------------------------------------------------------
          {
            value: "userpageVandalism",
            label: "Userpage vandalism",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: userpage vandalism =="
                : "== Warning: userpage vandalism ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: vandalisme halaman pengguna =="
                : "== Peringatan: vandalisme halaman pengguna ==";
              const bodyEn =
                `Your recent edits appear to have involved vandalising the userpage of another editor. While editors generally have significant freedom in how they customise their own userpages, vandalising someone else's userpage is not permitted. A userpage is a personal space for an editor to present information about themselves and their interests, and it should be treated with respect. ` +
                `\n\nVandalising another editor's userpage—whether by adding insults, false information, obscene content, or making unwanted edits—is a form of harassment and disruptive behaviour. It damages community relations and can intimidate other editors. If you have a concern about another editor's userpage content, the appropriate response is to discuss it on their talk page, not to vandalise the page yourself. ` +
                `\n\nPlease refrain from making unauthorised edits to other editors' userpages. Respect the personal spaces of your fellow editors and treat them with the same courtesy you would expect to receive. If you have questions about what is and is not appropriate on a userpage, please ask an administrator.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya melibatkan vandalisme halaman pengguna penyunting lain. Meskipun penyunting secara umum memiliki kebebasan yang signifikan dalam cara mereka menyesuaikan halaman pengguna mereka sendiri, vandalisme halaman pengguna seseorang tidak diperkenankan. Halaman pengguna adalah ruang pribadi bagi penyunting untuk menyajikan informasi tentang diri mereka dan minat mereka, dan harus diperlakukan dengan hormat. ` +
                `\n\nVandalisme terhadap halaman pengguna penyunting lain, baik dengan menambahkan hinaan, informasi palsu, konten yang tidak pantas, maupun melakukan perubahan yang tidak diinginkan, merupakan bentuk pelecehan dan perilaku yang mengganggu. Tindakan tersebut merusak hubungan antaranggota komunitas dan dapat membuat penyunting lain merasa tidak nyaman atau terintimidasi. Jika terdapat keberatan terhadap isi halaman pengguna seseorang, cara yang tepat adalah mendiskusikannya di halaman pembicaraan pengguna tersebut, bukan melakukan vandalisme pada halamannya. ` +
                `\n\nMohon untuk tidak melakukan penyuntingan tanpa izin pada halaman pengguna milik penyunting lain. Hormati ruang pribadi sesama penyunting dan perlakukan mereka dengan kesopanan yang sama seperti yang diharapkan dari orang lain. Jika memiliki pertanyaan mengenai hal-hal yang diperbolehkan atau tidak diperbolehkan di halaman pengguna, silakan menghubungi pengurus.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Username is against policy
          // ------------------------------------------------------------------
          {
            value: "usernamePolicy",
            label: "Username is against policy",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: username is against policy =="
                : "== Warning: username is against policy ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: nama pengguna melanggar kebijakan =="
                : "== Peringatan: nama pengguna melanggar kebijakan ==";
              const bodyEn =
                `Your username does not comply with Wikipedia's [[WP:USERNAME|username policy]]. Usernames on Wikipedia must not be offensive, impersonatory, promotional, or otherwise inappropriate. Your current username appears to violate one or more of these requirements. ` +
                `\n\nExamples of usernames that are against policy include those that: contain hate speech or discriminatory language; impersonate real individuals, administrators, or public figures; advertise products, services, or websites; contain explicit or vulgar language; or are otherwise disruptive or inappropriate. Your username may fall into one of these categories or may otherwise violate the username policy. ` +
                `\n\nYou are required to change your username to one that complies with Wikipedia's policies. To do so, please visit [[Special:GlobalRenameRequest|this page]] to change your username. Choose a new username that is neutral, respectful, and does not violate any of Wikipedia's policies. If you are unsure whether a potential new username is acceptable, you may ask an administrator for guidance. Continuing to use a username that violates policy may result in account restrictions or other disciplinary action.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Nama pengguna Anda tidak sesuai dengan [[WP:NAMA|kebijakan nama pengguna]] Wikipedia. Nama pengguna di Wikipedia tidak boleh bersifat ofensif, meniru identitas pihak lain, digunakan untuk promosi, atau tidak pantas dalam bentuk apa pun. Nama pengguna yang saat ini digunakan tampaknya melanggar satu atau lebih ketentuan tersebut. ` +
                `\n\nContoh nama pengguna yang bertentangan dengan kebijakan antara lain nama yang mengandung ujaran kebencian atau bahasa diskriminatif; meniru identitas individu nyata, pengurus, atau tokoh publik; mempromosikan produk, layanan, atau situs web; mengandung bahasa vulgar atau tidak senonoh; atau bersifat mengganggu maupun tidak pantas. Nama pengguna yang digunakan mungkin termasuk dalam salah satu kategori tersebut atau melanggar kebijakan nama pengguna dengan cara lain. ` +
                `\n\nAnda diwajibkan mengganti nama pengguna menjadi nama yang sesuai dengan kebijakan Wikipedia. Untuk melakukannya, kunjungi [[Special:GlobalRenameRequest|halaman ini]] untuk mengganti nama pengguna. Pilihlah nama pengguna baru yang netral, sopan, dan tidak melanggar kebijakan Wikipedia mana pun. Jika ragu apakah suatu nama pengguna dapat diterima, Anda dapat meminta saran kepada pengurus. Penggunaan nama pengguna yang melanggar kebijakan secara berkelanjutan dapat mengakibatkan pembatasan akun atau tindakan administratif lainnya.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Username is against policy, and conflict of interest
          // ------------------------------------------------------------------
          {
            value: "usernameConflictOfInterest",
            label: "Username is against policy, and conflict of interest",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: username is against policy, and conflict of interest =="
                : "== Warning: username is against policy, and conflict of interest ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: nama pengguna melanggar kebijakan, dan konflik kepentingan =="
                : "== Peringatan: nama pengguna melanggar kebijakan, dan konflik kepentingan ==";
              const bodyEn =
                `Your username does not comply with Wikipedia's [[WP:USERNAME|username policy]] and appears to reflect a conflict of interest. Usernames on Wikipedia must not be promotional, represent a company, organisation, product, or service in which you have a financial interest, or otherwise indicate a potential conflict of interest. ` +
                `\n\nUsernames that advertise a business, brand, or service, or that suggest you are editing on behalf of an organisation with a financial stake in the content, violate Wikipedia's policies on both usernames and conflicts of interest. Wikipedia requires that editors disclose financial interests and avoid editing articles in which they have a direct stake. Using a promotional or business-related username makes such conflicts immediately apparent and is not permitted. ` +
                `\n\nYou are required to change your username to one that is neutral and does not reflect any commercial or financial interest. Additionally, you should disclose any conflict of interest on your userpage and on the talk pages of articles you edit where a conflict may exist. To do so, please visit [[Special:GlobalRenameRequest|this page]] to change your username. Choose a new username that complies with Wikipedia's policies. Continuing to use a non-compliant username may result in account restrictions or other disciplinary action.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Nama pengguna Anda tidak sesuai dengan [[WP:NAMA|kebijakan nama pengguna]] Wikipedia dan tampaknya menunjukkan adanya konflik kepentingan. Nama pengguna di Wikipedia tidak boleh bersifat promosi, mewakili perusahaan, organisasi, produk, atau layanan yang terkait dengan kepentingan finansial Anda, maupun menunjukkan potensi konflik kepentingan lainnya. ` +
                `\n\nNama pengguna yang digunakan untuk mengiklankan suatu bisnis, merek, atau layanan, atau yang mengesankan bahwa Anda menyunting atas nama organisasi yang memiliki kepentingan finansial terhadap isi artikel, melanggar kebijakan Wikipedia mengenai nama pengguna dan konflik kepentingan. Wikipedia mengharuskan penyunting mengungkapkan kepentingan finansial yang dimiliki serta menghindari penyuntingan artikel yang berkaitan langsung dengan kepentingan tersebut. Penggunaan nama pengguna yang bersifat promosi atau terkait bisnis membuat konflik kepentingan semacam itu tampak jelas dan tidak diperbolehkan. ` +
                `\n\nAnda diwajibkan mengganti nama pengguna menjadi nama yang netral dan tidak mencerminkan kepentingan komersial maupun finansial apa pun. Selain itu, Anda sebaiknya mengungkapkan setiap konflik kepentingan di halaman pengguna dan di halaman pembicaraan artikel yang disunting apabila terdapat potensi konflik kepentingan. Untuk mengganti nama pengguna, kunjungi [[Special:GlobalRenameRequest|halaman ini]] untuk mengganti nama pengguna. Pilihlah nama pengguna baru yang sesuai dengan kebijakan Wikipedia. Penggunaan nama pengguna yang tidak sesuai dengan kebijakan secara berkelanjutan dapat mengakibatkan pembatasan akun atau tindakan administratif lainnya.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
              const en = withExtra(headingEn + "\n" + bodyEn, extra, false);
              const id = withExtra(headingId + "\n" + bodyId, extra, true);
              return useIndonesian ? id : en;
            },
          },

          // ------------------------------------------------------------------
          // Userpage or subpage is against policy
          // ------------------------------------------------------------------
          {
            value: "userpagePolicy",
            label: "Userpage or subpage is against policy",
            buildNotice: function (target, extra, isFinal) {
              const headingEn = isFinal
                ? "== Final warning: userpage or subpage is against policy =="
                : "== Warning: userpage or subpage is against policy ==";
              const headingId = isFinal
                ? "== Peringatan terakhir: halaman pengguna atau subhalaman melanggar kebijakan =="
                : "== Peringatan: halaman pengguna atau subhalaman melanggar kebijakan ==";
              const bodyEn =
                `Your userpage or one of your subpages contains content that violates Wikipedia's userpage policy. While editors have considerable freedom in how they use their userpages, certain types of content are not permitted. This includes content that is promotional, offensive, sexually explicit, that violates copyright, that contains original research, or that is otherwise inappropriate for Wikipedia. ` +
                `\n\nUserpages should be used to present information about yourself as an editor, your interests, your contributions to Wikipedia, and your views on various topics. However, they should not be used to promote products or services, to host content unrelated to Wikipedia editing, to publish material that violates copyright, to advertise external websites or businesses, or to post content that would be inappropriate in article space. ` +
                `\n\nYou are required to remove or modify the problematic content on your userpage or subpage to bring it into compliance with [[WP:USERPAGE|Wikipedia's policies]]. Please review Wikipedia's userpage policy to understand what types of content are and are not acceptable. If you are unsure whether specific content violates policy, you may ask an administrator for guidance. Failure to remove policy-violating content may result in the content being removed by administrators or other disciplinary action.` +
                (isFinal ? finalSentence(false) : "") +
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Halaman pengguna Anda atau salah satu subhalamannya berisi konten yang melanggar kebijakan halaman pengguna Wikipedia. Meskipun penyunting memiliki keleluasaan yang cukup besar dalam menggunakan halaman pengguna mereka, jenis konten tertentu tidak diperbolehkan. Ini mencakup konten yang bersifat promosi, menyinggung, eksplisit secara seksual, melanggar hak cipta, mengandung riset asli, atau tidak sesuai dengan tujuan Wikipedia. ` +
                `\n\nHalaman pengguna seharusnya digunakan untuk menyajikan informasi mengenai diri Anda sebagai penyunting, minat, kontribusi di Wikipedia, serta pandangan mengenai berbagai topik. Namun, halaman tersebut tidak boleh digunakan untuk mempromosikan produk atau layanan, menyimpan konten yang tidak berkaitan dengan penyuntingan Wikipedia, menerbitkan materi yang melanggar hak cipta, mengiklankan situs web atau bisnis eksternal, maupun memuat konten yang tidak layak berada di ruang artikel. ` +
                `\n\nAnda diwajibkan menghapus atau mengubah konten yang bermasalah pada halaman pengguna atau subhalaman tersebut agar sesuai dengan kebijakan Wikipedia. Silakan meninjau [[WP:USERPAGE|kebijakan halaman pengguna Wikipedia]] untuk memahami jenis konten yang diperbolehkan dan yang tidak diperbolehkan. Jika ragu apakah suatu konten melanggar kebijakan, Anda dapat meminta petunjuk kepada pengurus. Kegagalan untuk menghapus konten yang melanggar kebijakan dapat mengakibatkan konten tersebut dihapus oleh pengurus atau dikenakannya tindakan administratif lainnya.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus satu atau lebih templat nominasi [[WP:AFD|artikel untuk dihapus]] (AfD) dari sebuah halaman. Templat ini tidak boleh dihapus selama diskusi penghapusan masih berlangsung, karena hal tersebut mengganggu proses penghapusan dan menyembunyikan diskusi yang sedang berjalan dari penyunting lain. Harap pulihkan templat yang telah dihapus dan tinjau [[WP:AFD]] untuk panduan mengenai cara kerja proses ini.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus satu atau lebih templat [[WP:BLPPROD|biografi tokoh hidup yang diusulkan untuk dihapus]] (BLP PROD) dari sebuah halaman. Templat ini hanya dapat dihapus oleh pembuat artikel atau oleh penyunting yang dapat menunjukkan bahwa artikel tersebut memuat setidaknya satu sumber tepercaya. Jika tidak ada kondisi yang terpenuhi, harap pulihkan templat tersebut dan tinjau [[WP:BLPPROD]] untuk prosedur yang benar.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus tag penghapusan dari satu atau lebih halaman berkas. Tag penghapusan berkas dipasang oleh penyunting atau pengurus untuk menandai berkas yang berpotensi memiliki masalah lisensi, sumber, atau kebijakan, dan tidak boleh dihapus kecuali permasalahan yang mendasarinya telah ditangani dengan benar. Harap pulihkan tag yang telah dihapus dan diskusikan keberatan apa pun di halaman pembicaraan berkas atau dengan penyunting yang memasang tag tersebut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus satu atau lebih tag [[WP:RFD|pengalihan untuk didiskusikan]] (RfD) dari sebuah halaman. Tag ini tidak boleh dihapus selama diskusi masih terbuka, karena hal tersebut menyembunyikan nominasi dari penyunting yang berpartisipasi dan mengganggu proses peninjauan. Harap pulihkan tag yang telah dihapus dan, jika Anda ingin menentang nominasi tersebut, ikut serta dalam diskusi di [[WP:RFD]].` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus satu atau lebih tag [[WP:CSD|penghapusan cepat]] dari sebuah halaman. Tag penghapusan cepat hanya dapat dihapus oleh pembuat halaman (dalam keadaan terbatas) atau oleh pengurus. Jika Anda merasa suatu tag telah dipasang secara tidak tepat, harap ajukan keberatan melalui proses yang benar alih-alih sekadar menghapusnya. Harap tinjau [[WP:CSD]] dan [[WP:CSDDISPUTE]] untuk panduan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menghapus satu atau lebih tag [[WP:TFD|templat untuk didiskusikan]] (TfD) dari sebuah templat atau halaman tempat tag tersebut dipasang. Tag ini harus tetap berada di tempatnya selama diskusi penghapusan masih berlangsung. Menghapusnya mengganggu proses dan menyulitkan penyunting lain untuk berpartisipasi. Jika Anda keberatan dengan nominasi tersebut, ikut serta dalam diskusi di [[WP:TFD]] daripada menghapus tag tersebut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Aktivitas penyuntingan Anda yang baru-baru ini telah memicu [[WP:EF|filter suntingan]], yang dirancang untuk mendeteksi dan mencegah suntingan yang berpotensi merugikan atau bersifat disruptif. Jika suntingan Anda dilakukan dengan iktikad baik, harap tinjau dokumentasi [[WP:EF|filter suntingan]] dan pastikan kontribusi Anda ke depannya mematuhi kebijakan wiki. Pemicuan filter suntingan secara berulang, khususnya jika suntingan tersebut bersifat merugikan, dapat mengakibatkan akun Anda dibatasi.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini di satu atau lebih halaman pembicaraan tampaknya menggunakannya sebagai forum diskusi umum, bukan untuk tujuan yang seharusnya, yaitu mengoordinasikan perbaikan pada halaman terkait. Halaman pembicaraan ada untuk membahas perubahan pada konten artikel, bukan untuk menampung percakapan umum, debat, atau komentar mengenai subjek tersebut. Harap tinjau [[WP:NOTFORUM]] dan pastikan kontribusi Anda di halaman pembicaraan ke depannya berfokus pada peningkatan halaman yang relevan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Aktivitas Anda yang baru-baru ini tampaknya melibatkan pembuatan satu atau lebih halaman yang tidak sesuai untuk wiki ini. Hal ini dapat mencakup halaman yang bersifat promosi, halaman serangan, halaman lelucon, atau konten yang tidak memenuhi persyaratan untuk dimasukkan. Harap tinjau [[WP:NOT]], [[WP:N]], dan [[WP:CSD]] sebelum membuat halaman baru, dan pertimbangkan untuk menggunakan [[WP:AFC|Artikel untuk Dibuat]] jika Anda tidak yakin apakah suatu topik layak untuk dimuat.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menambahkan konten yang didukung oleh kutipan yang, setelah diperiksa, sebenarnya tidak memverifikasi pernyataan yang dibuat. Sumber harus secara langsung mendukung teks yang dikutip. Sumber tidak boleh disajikan secara keliru, diambil di luar konteks, atau digunakan untuk menyiratkan kesimpulan yang tidak dinyatakannya. Harap tinjau [[WP:V]] dan [[WP:INTEGRITY]], dan pastikan semua sumber yang Anda tambahkan dirangkum secara akurat dan benar-benar mendukung klaim yang dilampirkan padanya.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya menggunakan ringkasan suntingan yang tidak secara akurat menggambarkan perubahan yang dilakukan. Ringkasan suntingan harus dengan jelas dan jujur mencerminkan apa yang dilakukan oleh suatu suntingan, dan tidak boleh digunakan untuk menyamarkan sifat suatu perubahan atau menyesatkan penyunting lain yang meninjau riwayat suntingan. Harap tinjau [[WP:ES]] dan pastikan ringkasan suntingan Anda ke depannya akurat dan transparan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah menyisipkan konten atau pemformatan yang tidak sesuai dengan [[WP:MOS|Panduan Gaya Penulisan Wikipedia]]. Panduan Gaya Penulisan memberikan arahan tentang penyajian yang konsisten dan mudah dipahami di seluruh ensiklopedia. Harap tinjau bagian yang relevan dari [[WP:MOS]] sebelum melakukan suntingan serupa, dan pastikan kontribusi Anda sesuai dengan konvensi gaya yang berlaku.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya melibatkan pemindahan satu atau lebih halaman ke judul yang tidak sesuai dengan [[WP:NC|konvensi penamaan Wikipedia]] atau yang bertentangan dengan konsensus editorial yang ada. Pemindahan halaman harus mengikuti panduan penamaan yang berlaku dan, apabila suatu judul diperdebatkan atau pernah didiskusikan sebelumnya, tidak boleh dilakukan secara sepihak. Harap tinjau [[WP:NC]] dan [[WP:RM]], dan gunakan proses [[WP:RM|permintaan pemindahan]] jika Anda ingin mengusulkan pergantian nama.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah membuat satu atau lebih pengalihan yang tidak sesuai untuk wiki ini. Pengalihan hanya boleh dibuat jika memiliki tujuan navigasi yang masuk akal dan mengarah ke target yang relevan. Pengalihan yang bersifat menyinggung, tidak masuk akal, promosi, atau kecil kemungkinannya dicari dengan iktikad baik tidak diperkenankan. Harap tinjau [[WP:R]] dan [[WP:CSD#R]] sebelum membuat pengalihan lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Suntingan Anda yang baru-baru ini tampaknya telah mengubah, menghapus, atau merestrukturisasi komentar yang dibuat oleh penyunting lain di satu atau lebih halaman pembicaraan. Komentar bertanda tangan milik penyunting tidak boleh dimodifikasi oleh orang lain, karena hal ini dapat menyalahartikan pandangan mereka dan merusak kepercayaan terhadap catatan diskusi. Harap tinjau [[WP:TDEL]] dan [[WP:TALKNEW]], dan pastikan Anda tidak mengubah kontribusi penyunting lain di halaman pembicaraan.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
                `\n\nIf you believe this warning has been issued in error, please leave a message on my talk page. ` +
                `~`.repeat(4);
              const bodyId =
                `Unggahan Anda yang baru-baru ini tampaknya menyertakan satu atau lebih gambar yang tidak sesuai untuk sebuah ensiklopedia. Gambar yang diunggah ke wiki ini harus memiliki tujuan ensiklopedis yang jelas dan mematuhi semua kebijakan konten dan lisensi yang berlaku. Gambar yang bersifat sekadar dekoratif, menyinggung, bersifat promosi diri, atau tidak sesuai dengan alasan lain akan dihapus. Harap tinjau [[WP:IUP]] dan [[WP:NFC]] sebelum mengunggah gambar lebih lanjut.` +
                (isFinal ? finalSentence(true) : "") +
                `\n\nJika Anda merasa peringatan ini diberikan secara keliru, silakan tinggalkan pesan di halaman pembicaraan saya. ` +
                `~`.repeat(4);
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
