/**
 * ============================================================================
 * Tengu — 天狗
 * Version 2.11.0
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
        { value: "", label: "Other:" },
        {
          value: v("Vandalism", "Vandalisme"),
          label: "Vandalism",
        },
        {
          value: v(
            "Inaccurate or unsourced information",
            "Informasi tidak akurat atau tidak didukung sumber",
          ),
          label: "Inaccurate or unsourced information",
        },
        {
          value: v(
            "Violations of biographies of living persons policy",
            "Pelanggaran kebijakan biografi tokoh yang masih hidup",
          ),
          label: "Violations of biographies of living persons policy",
        },
        {
          value: v("Copyright violations", "Pelanggaran hak cipta"),
          label: "Copyright violations",
        },
        {
          value: v(
            "Promotional editing or editing with a conflict of interest",
            "Penyuntingan promosi atau yang mengandung konflik kepentingan",
          ),
          label: "Promotional editing or editing with a conflict of interest",
        },
        {
          value: v(
            "Technical disruption or formatting issues",
            "Gangguan teknis atau masalah pemformatan",
          ),
          label: "Technical disruption or formatting issues",
        },
        {
          value: v(
            "Addition of irrelevant content",
            "Penambahan konten yang tidak relevan",
          ),
          label: "Addition of irrelevant content",
        },
        {
          value: v(
            "Changes contrary to established consensus",
            "Perubahan yang bertentangan dengan konsensus yang telah disepakati",
          ),
          label: "Changes contrary to established consensus",
        },
        {
          value: v("Edit warring prevention", "Pencegahan perang suntingan"),
          label: "Edit warring prevention",
        },
        {
          value: v(
            "Block evasion or use of sockpuppet accounts",
            "Penghindaran blokir atau penggunaan akun boneka",
          ),
          label: "Block evasion or use of sockpuppet accounts",
        },
      ],

      BLOCK_REASONS: [
        { value: "", label: "Other:" },
        {
          group: "Common block reasons",
          items: [
            {
              value: v("Vandalism", "Vandalisme"),
              label: "Vandalism",
            },
            {
              value: v("Copyright infringement", "Pelanggaran hak cipta"),
              label: "Copyright infringement",
            },
            {
              value: v("Creating attack pages", "Membuat halaman serangan"),
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
                "Repeated addition of unsourced content",
                "Penambahan konten tanpa sumber secara berulang",
              ),
              label: "Repeated addition of unsourced content",
            },
            {
              value: v(
                "Creating nonsense or other inappropriate pages",
                "Membuat halaman omong kosong atau halaman lain yang tidak pantas",
              ),
              label: "Creating nonsense or other inappropriate pages",
            },
            {
              value: v(
                "Using Wikipedia for promotion or advertising purposes",
                "Menggunakan Wikipedia untuk tujuan promosi atau iklan",
              ),
              label: "Using Wikipedia for promotion or advertising purposes",
            },
            {
              value: v("Edit warring", "Perang suntingan"),
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
              value: v("Disruptive editing", "Penyuntingan yang mengganggu"),
              label: "Disruptive editing",
            },
            {
              value: v(
                "Personal attacks or harassment policy violations",
                "Serangan pribadi atau pelanggaran kebijakan antipelecehan",
              ),
              label: "Personal attacks or harassment policy violations",
            },
            {
              value: v("Arbitration enforcement", "Penegakan arbitrase"),
              label: "Arbitration enforcement",
            },
            {
              value: v(
                "Contentious topic restriction",
                "Pembatasan topik kontroversial",
              ),
              label: "Contentious topic restriction",
            },
            {
              value: v("Block evasion", "Penghindaran blokir"),
              label: "Block evasion",
            },
            {
              value: v(
                "Abusing multiple accounts",
                "Penyalahgunaan akun ganda",
              ),
              label: "Abusing multiple accounts",
            },
            {
              value: v(
                "Repeatedly triggering the edit filter",
                "Berulang kali memicu filter suntingan",
              ),
              label: "Repeatedly triggering the edit filter",
            },
            {
              value: v("Sockpuppetry", "Penggunaan akun boneka"),
              label: "Sockpuppetry",
            },
            {
              value: v(
                "Revoking talk page access: Inappropriate use of user talk page whilst blocked",
                "Mencabut akses halaman pembicaraan: Penggunaan halaman pembicaraan pengguna yang tidak semestinya saat diblokir",
              ),
              label:
                "Revoking talk page access: Inappropriate use of user talk page whilst blocked",
            },
            {
              value: v(
                "Account used solely for vandalism",
                "Akun semata-mata digunakan untuk vandalisme",
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
                "Username indicates use of a bot without authorisation",
                "Nama pengguna mengindikasikan penggunaan bot tanpa otorisasi",
              ),
              label: "Username indicates use of a bot without authorisation",
            },
            {
              value: v(
                "Username is promotional or advertising in nature",
                "Nama pengguna bersifat promosi atau iklan",
              ),
              label: "Username is promotional or advertising in nature",
            },
            {
              value: v(
                "Username is too similar to that of another user",
                "Nama pengguna terlalu mirip dengan milik pengguna lain",
              ),
              label: "Username is too similar to that of another user",
            },
            {
              value: v(
                "Username impersonates another user",
                "Nama pengguna meniru pengguna lain",
              ),
              label: "Username impersonates another user",
            },
            {
              value: v(
                "Username impersonates a famous figure",
                "Nama pengguna meniru tokoh terkenal",
              ),
              label: "Username impersonates a famous figure",
            },
            {
              value: v(
                "Username impersonates a (non-)profit organisation",
                "Nama pengguna meniru organisasi (non)profit",
              ),
              label: "Username impersonates a (non-)profit organisation",
            },
          ],
        },
      ],

      PAGE_DELETE_REASONS: [
        { value: "", label: "Other:" },
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
              value: v("Test page", "Halaman uji coba"),
              label: "Test page",
            },
            {
              value: v("Vandalism", "Vandalisme"),
              label: "Vandalism",
            },
            {
              value: v("Obvious hoax", "Informasi hoaks yang jelas"),
              label: "Obvious hoax",
            },
            {
              value: v(
                "Recreation of a page that was deleted per a deletion discussion",
                "Pembuatan ulang halaman yang dihapus berdasarkan diskusi penghapusan",
              ),
              label:
                "Recreation of a page that was deleted per a deletion discussion",
            },
            {
              value: v(
                "Creation by a banned or blocked user in violation of ban or block",
                "Dibuat oleh pengguna yang dilarang atau diblokir sebagai pelanggaran larangan atau blokir",
              ),
              label:
                "Creation by a banned or blocked user in violation of ban or block",
            },
            {
              value: v(
                "Enforcement of general sanctions",
                "Penegakan sanksi umum",
              ),
              label: "Enforcement of general sanctions",
            },
            {
              value: v(
                "Technical deletion (uncontroversial maintenance)",
                "Penghapusan teknis (perawatan yang tidak kontroversial)",
              ),
              label: "Technical deletion (uncontroversial maintenance)",
            },
            {
              value: v(
                "Deletion to facilitate a page move",
                "Penghapusan untuk memudahkan pemindahan halaman",
              ),
              label: "Deletion to facilitate a page move",
            },
            {
              value: v(
                "Unambiguously created in error or in the incorrect namespace",
                "Jelas dibuat secara keliru atau di ruang nama yang salah",
              ),
              label:
                "Unambiguously created in error or in the incorrect namespace",
            },
            {
              value: v(
                "One author who has requested deletion or blanked the page",
                "Pengguna yang telah meminta penghapusan atau mengosongkan halaman",
              ),
              label:
                "One author who has requested deletion or blanked the page",
            },
            {
              value: v(
                "Page dependent on a deleted or nonexistent page",
                "Halaman yang bergantung pada halaman yang dihapus atau tidak ada",
              ),
              label: "Page dependent on a deleted or nonexistent page",
            },
            {
              value: v("Office actions", "Tindakan kantor (resmi)"),
              label: "Office actions",
            },
            {
              value: v(
                "Attack page or negative unsourced BLP",
                "Halaman serangan atau biografi tokoh masih hidup yang bernada negatif atau tanpa sumber",
              ),
              label: "Attack page or negative unsourced BLP",
            },
            {
              value: v(
                "Purely promotional content",
                "Konten yang jelas bersifat promosi",
              ),
              label: "Purely promotional content",
            },
            {
              value: v(
                "Clear copyright infringement",
                "Pelanggaran hak cipta yang nyata",
              ),
              label: "Clear copyright infringement",
            },
            {
              value: v(
                "Abandoned draft or Articles for Creation submission",
                "Draf terbengkalai atau pengajuan Artikel untuk Pembuatan",
              ),
              label: "Abandoned draft or Articles for Creation submission",
            },
            {
              value: v(
                "Unnecessary disambiguation page",
                "Halaman disambiguasi yang tidak diperlukan",
              ),
              label: "Unnecessary disambiguation page",
            },
            {
              value: v(
                "LLM-generated content that has not been adequately reviewed",
                "Konten yang dihasilkan oleh model bahasa besar dan belum ditinjau secara memadai",
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
              value: v("No context", "Tanpa konteks"),
              label: "No context",
            },
            {
              value: v(
                "Foreign-language articles that exist on another Wikimedia project",
                "Artikel berbahasa asing yang ada di proyek Wikimedia lain",
              ),
              label:
                "Foreign-language articles that exist on another Wikimedia project",
            },
            {
              value: v("No content", "Tanpa konten"),
              label: "No content",
            },
            {
              value: v(
                "No indication of significance (people, animals, organisations, web content, events)",
                "Tidak ada indikasi kelayakan (orang, hewan, organisasi, konten web, acara)",
              ),
              label:
                "No indication of significance (people, animals, organisations, web content, events)",
            },
            {
              value: v(
                "No indication of significance (musical recordings)",
                "Tidak ada indikasi kelayakan (rekaman musik)",
              ),
              label: "No indication of significance (musical recordings)",
            },
            {
              value: v(
                "Recently created article duplicating an existing subject",
                "Artikel yang baru dibuat dan menduplikasi subjek yang sudah ada",
              ),
              label: "Recently created article duplicating an existing subject",
            },
            {
              value: v("Clearly fabricated", "Jelas merupakan karangan"),
              label: "Clearly fabricated",
            },
          ],
        },
        {
          group: "Speedy deletion – Redirects",
          items: [
            {
              value: v(
                "Cross-namespace redirects",
                "Pengalihan lintas ruang nama",
              ),
              label: "Cross-namespace redirects",
            },
            {
              value: v(
                "Recently created implausible typos",
                "Kesalahan ketik tidak masuk akal yang baru dibuat",
              ),
              label: "Recently created implausible typos",
            },
            {
              value: v(
                "File namespace redirects matching Wikimedia Commons files",
                "Pengalihan ruang nama berkas yang cocok dengan berkas Wikimedia Commons",
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
              value: v("Redundant files", "Berkas yang redundan"),
              label: "Redundant files",
            },
            {
              value: v(
                "Corrupt, missing, or empty files",
                "Berkas yang rusak, hilang, atau kosong",
              ),
              label: "Corrupt, missing, or empty files",
            },
            {
              value: v("Improper licence", "Lisensi yang tidak tepat"),
              label: "Improper licence",
            },
            {
              value: v(
                "Lack of licensing information",
                "Kurangnya informasi lisensi",
              ),
              label: "Lack of licensing information",
            },
            {
              value: v(
                "Orphaned non-free use files",
                "Berkas penggunaan nonbebas yang tidak tertaut",
              ),
              label: "Orphaned non-free use files",
            },
            {
              value: v(
                "Missing non-free use rationale",
                "Rasional penggunaan nonbebas yang hilang",
              ),
              label: "Missing non-free use rationale",
            },
            {
              value: v(
                "Invalid non-free use claim",
                "Klaim penggunaan nonbebas yang tidak valid",
              ),
              label: "Invalid non-free use claim",
            },
            {
              value: v(
                "Files available as identical copies on Wikimedia Commons",
                "Berkas tersedia sebagai salinan identik di Wikimedia Commons",
              ),
              label: "Files available as identical copies on Wikimedia Commons",
            },
            {
              value: v(
                "Clear copyright infringement",
                "Pelanggaran hak cipta yang nyata",
              ),
              label: "Clear copyright infringement",
            },
            {
              value: v("No evidence of permission", "Tidak ada bukti izin"),
              label: "No evidence of permission",
            },
          ],
        },
        {
          group: "Speedy deletion – Categories",
          items: [
            {
              value: v("Unpopulated categories", "Kategori kosong"),
              label: "Unpopulated categories",
            },
            {
              value: v(
                "Speedy renaming and merging",
                "Penggantian nama dan penggabungan cepat",
              ),
              label: "Speedy renaming and merging",
            },
            {
              value: v(
                "Unused maintenance categories",
                "Kategori perawatan yang tidak digunakan",
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
                "Unused template subpages",
                "Subhalaman templat yang tidak digunakan",
              ),
              label: "Unused template subpages",
            },
          ],
        },
        {
          group: "Speedy deletion – User pages",
          items: [
            {
              value: v("User request", "Permintaan pengguna"),
              label: "User request",
            },
            {
              value: v("Non-existent user", "Pengguna yang tidak ada"),
              label: "Non-existent user",
            },
            {
              value: v(
                "Abandoned user subpages of non-contributors",
                "Subhalaman pengguna yang terbengkalai dari nonkontributor",
              ),
              label: "Abandoned user subpages of non-contributors",
            },
            {
              value: v(
                "Excessively unrelated non-draft subpages by non-contributors",
                "Subhalaman nondraf yang tidak berkaitan dibuat oleh nonkontributor",
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
                "Cross-namespace redirect from mainspace",
                "Pengalihan lintas ruang nama dari ruang nama utama",
              ),
              label: "Cross-namespace redirect from mainspace",
            },
            {
              value: v(
                "Recently created, implausible redirect",
                "Pengalihan tidak masuk akal yang baru dibuat",
              ),
              label: "Recently created, implausible redirect",
            },
            {
              value: v(
                'Redirect in the "File:" namespace with the same name as a file or redirect at Wikimedia Commons',
                'Pengalihan di ruang nama "Berkas:" dengan nama yang sama dengan berkas atau pengalihan di Wikimedia Commons',
              ),
              label:
                'Redirect in the "File:" namespace with the same name as a file or redirect at Wikimedia Commons',
            },
            {
              value: v(
                "Redirect created by moving away from a title that was obviously unintended",
                "Pengalihan yang dibuat dengan memindahkan dari judul yang jelas tidak dimaksudkan",
              ),
              label:
                "Redirect created by moving away from a title that was obviously unintended",
            },
            {
              value: v(
                "Redirect to a deleted or nonexistent page",
                "Pengalihan ke halaman yang dihapus atau tidak ada",
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
                "Listed at Wikipedia:Copyright problems for over seven days",
                "Terdaftar di Wikipedia:Masalah hak cipta selama lebih dari tujuh hari",
              ),
              label:
                "Listed at Wikipedia:Copyright problems for over seven days",
            },
            {
              value: v(
                "Page created by contributor with extensive history of copyright violations",
                "Halaman dibuat oleh kontributor dengan riwayat pelanggaran hak cipta yang ekstensif",
              ),
              label:
                "Page created by contributor with extensive history of copyright violations",
            },
            {
              value: v(
                "Nominated for seven days with no objection",
                "Dicalonkan selama tujuh hari tanpa keberatan",
              ),
              label: "Nominated for seven days with no objection",
            },
            {
              value: v(
                "Nominated for seven days with no reliable sources present in the article",
                "Dicalonkan selama tujuh hari tanpa sumber tepercaya dalam artikel",
              ),
              label:
                "Nominated for seven days with no reliable sources present in the article",
            },
          ],
        },
      ],

      PROTECTION_REASONS: [
        { value: "", label: "Other:" },
        {
          group: "Edit protection",
          items: [
            {
              value: v("Persistent vandalism", "Vandalisme yang terus-menerus"),
              label: "Persistent vandalism",
            },
            {
              value: v("Persistent spamming", "Spam yang terus-menerus"),
              label: "Persistent spamming",
            },
            {
              value: v(
                "Persistent sockpuppetry",
                "Penggunaan akun boneka yang terus-menerus",
              ),
              label: "Persistent sockpuppetry",
            },
            {
              value: v(
                "Persistent disruptive editing",
                "Pengeditan mengganggu yang terus-menerus",
              ),
              label: "Persistent disruptive editing",
            },
            {
              value: v(
                "Persistent block evasion",
                "Penghindaran blokir yang terus-menerus",
              ),
              label: "Persistent block evasion",
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
                "Addition of unsourced or poorly sourced content",
                "Penambahan konten tanpa sumber atau dengan sumber yang buruk",
              ),
              label: "Addition of unsourced or poorly sourced content",
            },
            {
              value: v(
                "Edit warring / content dispute",
                "Perang suntingan / perselisihan konten",
              ),
              label: "Edit warring / content dispute",
            },
            {
              value: v("Arbitration enforcement", "Penegakan arbitrase"),
              label: "Arbitration enforcement",
            },
            {
              value: v(
                "Contentious topic restriction",
                "Pembatasan topik kontroversial",
              ),
              label: "Contentious topic restriction",
            },
            {
              value: v(
                "Community sanctions enforcement",
                "Penegakan sanksi komunitas",
              ),
              label: "Community sanctions enforcement",
            },
            {
              value: v(
                "User request in their own user space",
                "Permintaan pengguna di ruang penggunanya sendiri",
              ),
              label: "User request in their own user space",
            },
            {
              value: v(
                "High-risk template or module",
                "Templat atau modul berisiko tinggi",
              ),
              label: "High-risk template or module",
            },
            {
              value: v(
                "User page of deceased editor",
                "Halaman pengguna penyunting yang telah meninggal",
              ),
              label: "User page of deceased editor",
            },
          ],
        },
        {
          group: "Move protection",
          items: [
            {
              value: v("Page-move vandalism", "Vandalisme pemindahan halaman"),
              label: "Page-move vandalism",
            },
            {
              value: v("Move warring", "Perang pemindahan"),
              label: "Move warring",
            },
            {
              value: v(
                "High-visibility page",
                "Halaman dengan tingkat keterlihatan tinggi",
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
                "Image about to be featured on the Main Page",
                "Gambar yang akan ditampilkan di Halaman Utama",
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
                "Testing whether long-term protection is still needed",
                "Menguji apakah perlindungan jangka panjang masih diperlukan",
              ),
              label: "Testing whether long-term protection is still needed",
            },
            {
              value: v("No longer necessary", "Tidak lagi diperlukan"),
              label: "No longer necessary",
            },
          ],
        },
      ],
    };
  },
};
