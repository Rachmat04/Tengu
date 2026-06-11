/**
 * ============================================================================
 * Tengu — 天狗
 * Version 2.19.0
 * All-in-one wiki moderation tool — Pre-populated reason sets
 * ============================================================================
 * PURPOSE:
 * This file contains pre-populated reason sets for rollbacks, page deletions, and block actions,
 * which are used to provide convenient dropdown options for moderators when performing these actions.
 *
 * The reason values are localised: Indonesian is used on wikis whose content language
 * is listed in INDONESIAN_LANGS (as determined by Tengu.js), and English otherwise.
 * Labels (dropdown display text) are always in English, consistent with the rest of the UI.
 *
 * REPOSITORY:
 * https://github.com/Rachmat04/Tengu
 * ============================================================================
 */
window.TenguReasons = {
  /**
   * Returns localised reason sets.
   * @param {boolean} useIndonesian - True if the wiki uses Indonesian or a regional language of Indonesia.
   */
  get: function (useIndonesian) {
    const v = function (en, id) {
      return useIndonesian ? id : en;
    };

    return {
      ROLLBACK_REASONS: [
        {
          value: "",
          label: "Other:",
        },
        {
          value: v(
            "Vandalism or deliberate damage to content",
            "Vandalisme atau perusakan konten secara sengaja",
          ),
          label: "Vandalism",
        },
        {
          value: v(
            "Inaccurate, unsourced, or poorly sourced information",
            "Informasi yang tidak akurat, tanpa sumber, atau didukung sumber yang tidak memadai",
          ),
          label: "Inaccurate or unsourced information",
        },
        {
          value: v(
            "Content violating the biographies of living persons policy",
            "Konten yang melanggar kebijakan biografi tokoh yang masih hidup",
          ),
          label: "Violations of biographies of living persons policy",
        },
        {
          value: v(
            "Copyright infringement or other copyright violations",
            "Pelanggaran hak cipta atau ketentuan lisensi",
          ),
          label: "Copyright violations",
        },
        {
          value: v(
            "Promotional editing or editing affected by a conflict of interest",
            "Penyuntingan promosi atau penyuntingan yang dipengaruhi konflik kepentingan",
          ),
          label: "Promotional editing or editing with a conflict of interest",
        },
        {
          value: v(
            "Technical disruption, formatting problems, or markup errors",
            "Gangguan teknis, masalah pemformatan, atau kesalahan markah wiki",
          ),
          label: "Technical disruption or formatting issues",
        },
        {
          value: v(
            "Addition of irrelevant, inappropriate, or unrelated content",
            "Penambahan konten yang tidak relevan, tidak sesuai, atau tidak berkaitan",
          ),
          label: "Addition of irrelevant content",
        },
        {
          value: v(
            "Changes made contrary to established consensus",
            "Perubahan yang bertentangan dengan konsensus yang telah terbentuk",
          ),
          label: "Changes contrary to established consensus",
        },
        {
          value: v(
            "Reverted to prevent or reduce edit warring",
            "Dibatalkan untuk mencegah atau mengurangi perang suntingan",
          ),
          label: "Edit warring prevention",
        },
        {
          value: v(
            "Block evasion or misuse of sockpuppet accounts",
            "Penghindaran blokir atau penyalahgunaan akun boneka",
          ),
          label: "Block evasion or use of sockpuppet accounts",
        },
      ],

      BLOCK_REASONS: [
        {
          value: "",
          label: "Other:",
        },
        {
          group: "Common block reasons",
          items: [
            {
              value: v(
                "Vandalism or deliberate disruption of the project",
                "Vandalisme atau gangguan yang disengaja terhadap proyek",
              ),
              label: "Vandalism",
            },
            {
              value: v(
                "Copyright infringement or repeated copyright violations",
                "Pelanggaran hak cipta atau pelanggaran hak cipta yang berulang",
              ),
              label: "Copyright infringement",
            },
            {
              value: v(
                "Creating attack pages or other abusive content",
                "Membuat halaman serangan atau konten yang bersifat menyerang",
              ),
              label: "Creating attack pages",
            },
            {
              value: v(
                "Violations of the biographies of living persons policy",
                "Pelanggaran kebijakan biografi tokoh yang masih hidup",
              ),
              label: "Violations of the biographies of living persons policy",
            },
            {
              value: v(
                "Repeated addition of unsourced or poorly sourced content",
                "Penambahan konten tanpa sumber atau dengan sumber yang tidak memadai secara berulang",
              ),
              label: "Repeated addition of unsourced content",
            },
            {
              value: v(
                "Creating nonsense, hoax, or otherwise inappropriate pages",
                "Membuat halaman omong kosong, hoaks, atau halaman lain yang tidak pantas",
              ),
              label: "Creating nonsense or other inappropriate pages",
            },
            {
              value: v(
                "Using Wikipedia for promotion, advertising, or advocacy",
                "Menggunakan Wikipedia untuk promosi, periklanan, atau kampanye kepentingan tertentu",
              ),
              label: "Using Wikipedia for promotion or advertising purposes",
            },
            {
              value: v(
                "Edit warring or repeatedly overriding the contributions of others",
                "Perang suntingan atau berulang kali menimpa kontribusi penyunting lain",
              ),
              label: "Edit warring",
            },
            {
              value: v(
                "Violation of the three-revert rule",
                "Pelanggaran aturan tiga pembatalan",
              ),
              label: "Violation of the three-revert rule",
            },
            {
              value: v(
                "Disruptive editing that negatively affects the project",
                "Penyuntingan yang mengganggu dan berdampak negatif terhadap proyek",
              ),
              label: "Disruptive editing",
            },
            {
              value: v(
                "Personal attacks, harassment, or other uncivil conduct",
                "Serangan pribadi, pelecehan, atau perilaku tidak sopan lainnya",
              ),
              label: "Personal attacks or harassment policy violations",
            },
            {
              value: v(
                "Arbitration enforcement action",
                "Tindakan penegakan keputusan arbitrase",
              ),
              label: "Arbitration enforcement",
            },
            {
              value: v(
                "Violation of a contentious topic restriction",
                "Pelanggaran pembatasan pada topik kontroversial",
              ),
              label: "Contentious topic restriction",
            },
            {
              value: v(
                "Attempting to evade an existing block or restriction",
                "Mencoba menghindari blokir atau pembatasan yang sedang berlaku",
              ),
              label: "Block evasion",
            },
            {
              value: v(
                "Misuse of multiple accounts to deceive or disrupt",
                "Penyalahgunaan akun ganda untuk menipu atau mengganggu proses penyuntingan",
              ),
              label: "Abusing multiple accounts",
            },
            {
              value: v(
                "Repeatedly triggering edit filters despite warnings",
                "Berulang kali memicu filter suntingan meskipun telah diperingatkan",
              ),
              label: "Repeatedly triggering the edit filter",
            },
            {
              value: v(
                "Improper use of sockpuppet accounts",
                "Penggunaan akun boneka secara tidak semestinya",
              ),
              label: "Sockpuppetry",
            },
            {
              value: v(
                "Revoking talk page access due to inappropriate use whilst blocked",
                "Pencabutan akses halaman pembicaraan karena penyalahgunaan saat sedang diblokir",
              ),
              label:
                "Revoking talk page access: Inappropriate use of user talk page whilst blocked",
            },
            {
              value: v(
                "Account used solely for vandalism or disruption",
                "Akun yang hanya digunakan untuk vandalisme atau gangguan",
              ),
              label: "Account used solely for vandalism",
            },
          ],
        },
        {
          group: "Username policy violations",
          items: [
            {
              value: v(
                "Username violates the username policy",
                "Nama pengguna melanggar kebijakan nama pengguna",
              ),
              label: "Username violates the username policy",
            },
            {
              value: v(
                "Username suggests unauthorised or misleading bot use",
                "Nama pengguna menunjukkan penggunaan bot tanpa izin atau menyesatkan",
              ),
              label: "Username indicates use of a bot without authorisation",
            },
            {
              value: v(
                "Username is promotional, advertising, or intended for publicity",
                "Nama pengguna bersifat promosi, periklanan, atau bertujuan untuk publikasi",
              ),
              label: "Username is promotional or advertising in nature",
            },
            {
              value: v(
                "Username is confusingly similar to that of another user",
                "Nama pengguna sangat mirip dengan milik pengguna lain sehingga dapat menimbulkan kebingungan",
              ),
              label: "Username is too similar to that of another user",
            },
            {
              value: v(
                "Username impersonates or misrepresents another user",
                "Nama pengguna meniru atau mengatasnamakan pengguna lain",
              ),
              label: "Username impersonates another user",
            },
            {
              value: v(
                "Username impersonates or falsely suggests association with a public figure",
                "Nama pengguna meniru atau memberikan kesan hubungan yang tidak benar dengan tokoh publik",
              ),
              label: "Username impersonates a famous figure",
            },
            {
              value: v(
                "Username impersonates or falsely suggests association with a (non-)profit organisation",
                "Nama pengguna meniru atau memberikan kesan hubungan yang tidak benar dengan organisasi (non)profit",
              ),
              label: "Username impersonates a (non-)profit organisation",
            },
          ],
        },
      ],

      PAGE_DELETE_REASONS: [
        {
          value: "",
          label: "Other:",
        },
        {
          group: "Speedy deletion – General",
          items: [
            {
              value: v(
                "Patent nonsense, meaningless, or unintelligible content",
                "Konten omong kosong, tidak bermakna, atau tidak dapat dipahami",
              ),
              label: "Patent nonsense, meaningless, or unintelligible content",
            },
            {
              value: v(
                "Page created solely for testing or experimentation",
                "Halaman yang dibuat semata-mata untuk uji coba atau percobaan",
              ),
              label: "Test page",
            },
            {
              value: v(
                "Vandalism or deliberate disruption",
                "Vandalisme atau gangguan yang disengaja",
              ),
              label: "Vandalism",
            },
            {
              value: v(
                "Obvious hoax or fabricated content",
                "Hoaks yang jelas atau konten yang dibuat-buat",
              ),
              label: "Obvious hoax",
            },
            {
              value: v(
                "Recreation of a page previously deleted following a deletion discussion",
                "Pembuatan ulang halaman yang sebelumnya dihapus berdasarkan hasil diskusi penghapusan",
              ),
              label:
                "Recreation of a page that was deleted per a deletion discussion",
            },
            {
              value: v(
                "Page created in violation of a ban or block",
                "Halaman dibuat sebagai pelanggaran terhadap larangan atau blokir yang berlaku",
              ),
              label:
                "Creation by a banned or blocked user in violation of ban or block",
            },
            {
              value: v(
                "Deletion required under general sanctions",
                "Penghapusan diperlukan berdasarkan sanksi umum yang berlaku",
              ),
              label: "Enforcement of general sanctions",
            },
            {
              value: v(
                "Technical deletion for routine and uncontroversial maintenance",
                "Penghapusan teknis untuk pemeliharaan rutin yang tidak kontroversial",
              ),
              label: "Technical deletion (uncontroversial maintenance)",
            },
            {
              value: v(
                "Deletion to facilitate a page move",
                "Penghapusan untuk memfasilitasi pemindahan halaman",
              ),
              label: "Deletion to facilitate a page move",
            },
            {
              value: v(
                "Page clearly created in error or in the wrong namespace",
                "Halaman jelas dibuat karena kekeliruan atau di ruang nama yang salah",
              ),
              label:
                "Unambiguously created in error or in the incorrect namespace",
            },
            {
              value: v(
                "Deletion requested by the page's sole contributor",
                "Penghapusan diminta oleh satu-satunya kontributor halaman",
              ),
              label:
                "One author who has requested deletion or blanked the page",
            },
            {
              value: v(
                "Page dependent on a deleted or non-existent page",
                "Halaman bergantung pada halaman yang telah dihapus atau tidak ada",
              ),
              label: "Page dependent on a deleted or nonexistent page",
            },
            {
              value: v(
                "Deletion required under an office action",
                "Penghapusan diperlukan berdasarkan tindakan resmi Wikimedia Foundation",
              ),
              label: "Office actions",
            },
            {
              value: v(
                "Attack page or negative unsourced biography of a living person",
                "Halaman serangan atau biografi tokoh yang masih hidup bernada negatif tanpa sumber",
              ),
              label: "Attack page or negative unsourced BLP",
            },
            {
              value: v(
                "Content created solely for promotional or advertising purposes",
                "Konten yang dibuat semata-mata untuk tujuan promosi atau periklanan",
              ),
              label: "Purely promotional content",
            },
            {
              value: v(
                "Clear and uncontested copyright infringement",
                "Pelanggaran hak cipta yang jelas dan tidak diperselisihkan",
              ),
              label: "Clear copyright infringement",
            },
            {
              value: v(
                "Abandoned draft or abandoned Articles for Creation submission",
                "Draf atau pengajuan Artikel untuk Pembuatan yang telah terbengkalai",
              ),
              label: "Abandoned draft or Articles for Creation submission",
            },
            {
              value: v(
                "Disambiguation page that serves no useful purpose",
                "Halaman disambiguasi yang tidak memiliki kegunaan yang jelas",
              ),
              label: "Unnecessary disambiguation page",
            },
            {
              value: v(
                "LLM-generated content that has not received adequate human review",
                "Konten yang dihasilkan model bahasa besar dan belum menerima peninjauan manusia yang memadai",
              ),
              label:
                "LLM-generated content that has not been adequately reviewed",
            },
          ],
        },
        {
          group: "Speedy deletion – Articles",
          items: [
            {
              value: v(
                "Article lacking sufficient context to identify its subject",
                "Artikel yang tidak memiliki konteks yang cukup untuk mengidentifikasi subjeknya",
              ),
              label: "No context",
            },
            {
              value: v(
                "Foreign-language article already available on another Wikimedia project",
                "Artikel berbahasa asing yang sudah tersedia di proyek Wikimedia lain",
              ),
              label:
                "Foreign-language articles that exist on another Wikimedia project",
            },
            {
              value: v(
                "Article containing little or no meaningful content",
                "Artikel yang hanya berisi sedikit atau tidak memiliki konten yang bermakna",
              ),
              label: "No content",
            },
            {
              value: v(
                "No credible indication of significance (people, animals, organisations, web content, events)",
                "Tidak ada indikasi kelayakan yang meyakinkan (orang, hewan, organisasi, konten web, atau acara)",
              ),
              label:
                "No indication of significance (people, animals, organisations, web content, events)",
            },
            {
              value: v(
                "No credible indication of significance (musical recordings)",
                "Tidak ada indikasi kelayakan yang meyakinkan (rekaman musik)",
              ),
              label: "No indication of significance (musical recordings)",
            },
            {
              value: v(
                "Recently created article duplicating an existing article or subject",
                "Artikel yang baru dibuat dan menduplikasi artikel atau subjek yang sudah ada",
              ),
              label: "Recently created article duplicating an existing subject",
            },
            {
              value: v(
                "Clearly fabricated or invented content",
                "Konten yang jelas dibuat-buat atau direka-reka",
              ),
              label: "Clearly fabricated",
            },
          ],
        },
        {
          group: "Speedy deletion – Redirects",
          items: [
            {
              value: v(
                "Redirect crossing namespaces without a valid purpose",
                "Pengalihan lintas ruang nama tanpa tujuan yang sah",
              ),
              label: "Cross-namespace redirects",
            },
            {
              value: v(
                "Recently created redirect from an implausible or unlikely typographical error",
                "Pengalihan yang baru dibuat dari salah ketik yang tidak masuk akal atau sangat tidak mungkin terjadi",
              ),
              label: "Recently created implausible typos",
            },
            {
              value: v(
                "File namespace redirect duplicating a file available on Wikimedia Commons",
                "Pengalihan di ruang nama berkas yang menduplikasi berkas yang tersedia di Wikimedia Commons",
              ),
              label:
                "File namespace redirects matching Wikimedia Commons files",
            },
          ],
        },
        {
          group: "Speedy deletion – Files",
          items: [
            {
              value: v(
                "File duplicated by another file and no longer needed",
                "Berkas diduplikasi oleh berkas lain dan tidak lagi diperlukan",
              ),
              label: "Redundant files",
            },
            {
              value: v(
                "Corrupt, missing, empty, or otherwise unusable file",
                "Berkas rusak, hilang, kosong, atau tidak dapat digunakan",
              ),
              label: "Corrupt, missing, or empty files",
            },
            {
              value: v(
                "File with an invalid, improper, or unacceptable licence",
                "Berkas dengan lisensi yang tidak sah, tidak sesuai, atau tidak dapat diterima",
              ),
              label: "Improper licence",
            },
            {
              value: v(
                "File missing required licensing information",
                "Berkas tidak memiliki informasi lisensi yang diperlukan",
              ),
              label: "Lack of licensing information",
            },
            {
              value: v(
                "Orphaned non-free file no longer used in any article",
                "Berkas nonbebas yang tidak lagi digunakan pada artikel mana pun",
              ),
              label: "Orphaned non-free use files",
            },
            {
              value: v(
                "Non-free file missing a valid non-free use rationale",
                "Berkas nonbebas tidak memiliki rasional penggunaan nonbebas yang sah",
              ),
              label: "Missing non-free use rationale",
            },
            {
              value: v(
                "Non-free file with an invalid or unsupported use claim",
                "Berkas nonbebas dengan klaim penggunaan yang tidak sah atau tidak didukung",
              ),
              label: "Invalid non-free use claim",
            },
            {
              value: v(
                "File available as an identical copy on Wikimedia Commons",
                "Berkas tersedia sebagai salinan identik di Wikimedia Commons",
              ),
              label: "Files available as identical copies on Wikimedia Commons",
            },
            {
              value: v(
                "Clear and uncontested copyright infringement",
                "Pelanggaran hak cipta yang jelas dan tidak diperselisihkan",
              ),
              label: "Clear copyright infringement",
            },
            {
              value: v(
                "No evidence that permission to use the file has been provided",
                "Tidak ada bukti bahwa izin penggunaan berkas telah diberikan",
              ),
              label: "No evidence of permission",
            },
          ],
        },
        {
          group: "Speedy deletion – Categories",
          items: [
            {
              value: v(
                "Categories with no pages or files inside",
                "Kategori yang tidak memiliki halaman atau berkas di dalamnya",
              ),
              label: "Unpopulated categories",
            },
            {
              value: v(
                "Quick renaming or merging of categories following standard procedures",
                "Penggantian nama atau penggabungan kategori secara cepat sesuai prosedur standar",
              ),
              label: "Speedy renaming and merging",
            },
            {
              value: v(
                "Maintenance categories that are no longer used and have no active purpose",
                "Kategori perawatan yang sudah tidak digunakan dan tidak memiliki fungsi aktif",
              ),
              label: "Unused maintenance categories",
            },
          ],
        },
        {
          group: "Speedy deletion – Templates",
          items: [
            {
              value: v(
                "Template subpages that are not in use and have no active transclusion or purpose",
                "Subhalaman templat yang tidak digunakan dan tidak memiliki transklusi aktif atau tujuan",
              ),
              label: "Unused template subpages",
            },
          ],
        },
        {
          group: "Speedy deletion – User pages",
          items: [
            {
              value: v(
                "Deletion requested by the user",
                "Penghapusan diminta oleh pengguna",
              ),
              label: "User request",
            },
            {
              value: v(
                "User account does not exist or cannot be found",
                "Akun pengguna tidak ada atau tidak dapat ditemukan",
              ),
              label: "Non-existent user",
            },
            {
              value: v(
                "User subpages belonging to accounts with no contributions, and no ongoing activity",
                "Subhalaman pengguna milik akun tanpa kontribusi dan tanpa aktivitas berlanjut",
              ),
              label: "Abandoned user subpages of non-contributors",
            },
            {
              value: v(
                "Non-draft user subpages created by non-contributors that are unrelated or lack a clear purpose",
                "Subhalaman pengguna nondraf yang dibuat oleh nonkontributor, tidak berkaitan atau tidak memiliki tujuan yang jelas",
              ),
              label:
                "Excessively unrelated non-draft subpages by non-contributors",
            },
          ],
        },
        {
          group: "Redirect pages",
          items: [
            {
              value: v(
                "Cross-namespace redirect originating from main namespace, which is generally not intended for article redirects",
                "Pengalihan lintas ruang nama yang berasal dari ruang nama utama, yang umumnya tidak dimaksudkan untuk pengalihan artikel",
              ),
              label: "Cross-namespace redirect from mainspace",
            },
            {
              value: v(
                "Recently created redirect that appears implausible or unlikely to be useful",
                "Pengalihan yang baru dibuat dan tampak tidak masuk akal atau tidak mungkin berguna",
              ),
              label: "Recently created, implausible redirect",
            },
            {
              value: v(
                'Redirect in the "File:" namespace that conflicts with an existing file name or duplicates a Wikimedia Commons redirect',
                'Pengalihan di ruang nama "Berkas:" yang bertabrakan dengan nama berkas yang sudah ada atau menduplikasi pengalihan di Wikimedia Commons',
              ),
              label:
                'Redirect in the "File:" namespace with the same name as a file or redirect at Wikimedia Commons',
            },
            {
              value: v(
                "Redirect created through a page move from a title that was clearly unintended or mistaken",
                "Pengalihan yang dibuat melalui pemindahan halaman dari judul yang jelas tidak disengaja atau keliru",
              ),
              label:
                "Redirect created by moving away from a title that was obviously unintended",
            },
            {
              value: v(
                "Redirect pointing to a page that has been deleted or does not exist",
                "Pengalihan yang mengarah ke halaman yang telah dihapus atau tidak ada",
              ),
              label: "Redirect to a deleted or nonexistent page",
            },
          ],
        },
        {
          group: "Other criteria",
          items: [
            {
              value: v(
                "Page has been listed at Wikipedia:Copyright problems for more than seven days without resolution",
                "Halaman telah terdaftar di Wikipedia:Masalah hak cipta selama lebih dari tujuh hari tanpa penyelesaian",
              ),
              label:
                "Listed at Wikipedia:Copyright problems for over seven days",
            },
            {
              value: v(
                "Page created by a contributor with a documented history of repeated copyright violations",
                "Halaman dibuat oleh kontributor dengan riwayat pelanggaran hak cipta yang terdokumentasi dan berulang",
              ),
              label:
                "Page created by contributor with extensive history of copyright violations",
            },
            {
              value: v(
                "Page has been nominated for deletion for seven days without any objections raised",
                "Halaman telah dicalonkan untuk penghapusan selama tujuh hari tanpa adanya keberatan",
              ),
              label: "Nominated for seven days with no objection",
            },
            {
              value: v(
                "Page has been nominated for deletion for seven days and contains no reliable sources in the article",
                "Halaman telah dicalonkan untuk penghapusan selama tujuh hari dan tidak memiliki sumber tepercaya dalam artikel",
              ),
              label:
                "Nominated for seven days with no reliable sources present in the article",
            },
          ],
        },
      ],

      PROTECTION_REASONS: [
        {
          value: "",
          label: "Other:",
        },
        {
          group: "Edit protection",
          items: [
            {
              value: v(
                "Continuous or repeated vandalism over time despite warnings or interventions",
                "Vandalisme yang terjadi terus-menerus atau berulang meskipun sudah ada peringatan atau tindakan",
              ),
              label: "Persistent vandalism",
            },
            {
              value: v(
                "Continuous or repeated spamming behaviour over time",
                "Perilaku spam yang terus-menerus atau berulang dalam jangka waktu lama",
              ),
              label: "Persistent spamming",
            },
            {
              value: v(
                "Ongoing use of sockpuppet accounts in a repeated or systematic way",
                "Penggunaan akun boneka yang terus-menerus atau dilakukan secara sistematis",
              ),
              label: "Persistent sockpuppetry",
            },
            {
              value: v(
                "Repeated disruptive editing that negatively affects content stability or discussion",
                "Penyuntingan yang terus-menerus mengganggu dan berdampak pada kestabilan konten atau diskusi",
              ),
              label: "Persistent disruptive editing",
            },
            {
              value: v(
                "Repeated attempts to evade blocks or restrictions placed on an account or IP",
                "Upaya berulang untuk menghindari blokir atau pembatasan yang dikenakan pada akun atau IP",
              ),
              label: "Persistent block evasion",
            },
            {
              value: v(
                "Violations of the policy governing biographies of living persons",
                "Pelanggaran terhadap kebijakan biografi tokoh yang masih hidup",
              ),
              label: "Violations of the biographies of living persons policy",
            },
            {
              value: v(
                "Repeated addition of content without reliable sources or with insufficient sourcing",
                "Penambahan berulang konten tanpa sumber tepercaya atau dengan rujukan yang tidak memadai",
              ),
              label: "Addition of unsourced or poorly sourced content",
            },
            {
              value: v(
                "Repeated edit conflicts or disputes over content changes",
                "Konflik penyuntingan berulang atau perselisihan atas perubahan konten",
              ),
              label: "Edit warring or content dispute",
            },
            {
              value: v(
                "Enforcement action under arbitration decisions or remedies",
                "Tindakan penegakan berdasarkan keputusan atau langkah arbitrase",
              ),
              label: "Arbitration enforcement",
            },
            {
              value: v(
                "Restriction applied to a topic that is considered sensitive or contentious",
                "Pembatasan pada topik yang dianggap sensitif atau kontroversial",
              ),
              label: "Contentious topic restriction",
            },
            {
              value: v(
                "Enforcement of sanctions imposed by the community",
                "Penegakan sanksi yang ditetapkan oleh komunitas",
              ),
              label: "Community sanctions enforcement",
            },
            {
              value: v(
                "Request made by the user within their own user space",
                "Permintaan yang dibuat oleh pengguna di ruang pengguna miliknya sendiri",
              ),
              label: "User request in their own user space",
            },
            {
              value: v(
                "High-risk template or module that requires careful handling due to potential impact",
                "Templat atau modul berisiko tinggi yang memerlukan penanganan hati-hati karena dampaknya",
              ),
              label: "High-risk template or module",
            },
            {
              value: v(
                "User page belonging to an editor who is deceased",
                "Halaman pengguna milik penyunting yang telah meninggal",
              ),
              label: "User page of deceased editor",
            },
          ],
        },
        {
          group: "Move protection",
          items: [
            {
              value: v(
                "Vandalism involving repeated or abusive page moves intended to disrupt article titles",
                "Vandalisme yang melibatkan pemindahan halaman berulang atau menyalahgunakan yang bertujuan mengganggu judul artikel",
              ),
              label: "Page-move vandalism",
            },
            {
              value: v(
                "Repeated or ongoing conflicts involving page moves, such as reverting each other's moves",
                "Konflik berulang atau berkelanjutan berkaitan dengan pemindahan halaman, seperti saling membatalkan pemindahan",
              ),
              label: "Move warring",
            },
            {
              value: v(
                "Page that receives high traffic or attention, where changes are more visible and may require caution",
                "Halaman yang menerima lalu lintas atau perhatian tinggi, membuat perubahan lebih terlihat dan perlu kehati-hatian",
              ),
              label: "High-visibility page",
            },
          ],
        },
        {
          group: "Images",
          items: [
            {
              value: v(
                "Image scheduled to appear on the Main Page as a featured image in the near future",
                "Gambar yang dijadwalkan tampil di Halaman Utama sebagai gambar unggulan dalam waktu dekat",
              ),
              label: "Image about to be featured on the Main Page",
            },
          ],
        },
        {
          group: "Unprotection",
          items: [
            {
              value: v(
                "Testing whether existing long-term page protection is still required or can be adjusted",
                "Pengujian apakah perlindungan halaman jangka panjang yang ada masih diperlukan atau dapat disesuaikan",
              ),
              label: "Testing whether long-term protection is still needed",
            },
            {
              value: v(
                "Protection is no longer required based on current conditions or page status",
                "Perlindungan tidak lagi diperlukan berdasarkan kondisi atau status halaman saat ini",
              ),
              label: "No longer necessary",
            },
          ],
        },
      ],
    };
  },
};
