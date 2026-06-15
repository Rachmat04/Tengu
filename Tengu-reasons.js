/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Pre-populated reason sets
 * ============================================================================
 * PURPOSE:
 * This file contains pre-populated reason sets for rollbacks, page deletions, block actions, and revision deletions,
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
            "Vandalism or other disruptive changes that reduce the quality, accuracy, or usefulness of the content",
            "Vandalisme atau perubahan mengganggu lainnya yang menurunkan kualitas, keakuratan, atau kegunaan konten",
          ),
          label: "Vandalism",
        },
        {
          value: v(
            "Information that is inaccurate, cannot be verified, or is not supported by reliable sources",
            "Informasi yang tidak akurat, tidak dapat diverifikasi, atau tidak didukung oleh sumber yang tepercaya",
          ),
          label: "Inaccurate or unsourced information",
        },
        {
          value: v(
            "Content that does not comply with the biographies of living persons policy and requires greater care or stronger sourcing",
            "Konten yang tidak sesuai dengan kebijakan biografi tokoh yang masih hidup dan memerlukan kehati-hatian atau sumber yang lebih kuat",
          ),
          label: "Violations of biographies of living persons policy",
        },
        {
          value: v(
            "Material that may violate copyright, licensing requirements, or reuse conditions",
            "Materi yang mungkin melanggar hak cipta, ketentuan lisensi, atau syarat penggunaan ulang",
          ),
          label: "Copyright violations",
        },
        {
          value: v(
            "Promotional content or editing that may be affected by a conflict of interest",
            "Konten promosi atau penyuntingan yang mungkin dipengaruhi oleh konflik kepentingan",
          ),
          label: "Promotional editing or editing with a conflict of interest",
        },
        {
          value: v(
            "Formatting, markup, template, or other technical issues affecting the page's appearance or functionality",
            "Masalah pemformatan, markah wiki, templat, atau masalah teknis lain yang memengaruhi tampilan atau fungsi halaman",
          ),
          label: "Technical disruption or formatting issues",
        },
        {
          value: v(
            "Content that is not relevant to the topic, scope, or purpose of the page",
            "Konten yang tidak relevan dengan topik, ruang lingkup, atau tujuan halaman",
          ),
          label: "Addition of irrelevant content",
        },
        {
          value: v(
            "Changes that conflict with an established community consensus or the outcome of prior discussion",
            "Perubahan yang bertentangan dengan konsensus komunitas yang telah terbentuk atau hasil diskusi sebelumnya",
          ),
          label: "Changes contrary to established consensus",
        },
        {
          value: v(
            "Edit warring prevention; please discuss substantial disagreements before restoring the change",
            "Pencegahan perang suntingan; mohon diskusikan perbedaan pendapat yang mendasar sebelum mengembalikan perubahan ini",
          ),
          label: "Edit warring prevention",
        },
        {
          value: v(
            "Block evasion, sockpuppetry, or other attempts to bypass community restrictions",
            "Penghindaran blokir, penggunaan akun boneka, atau upaya lain untuk menghindari pembatasan komunitas",
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
                "Vandalism or other deliberate actions that damage content, disrupt workflows, or undermine the project's normal operation",
                "Vandalisme atau tindakan sengaja lainnya yang merusak konten, mengganggu proses kerja, atau menghambat jalannya proyek",
              ),
              label: "Vandalism",
            },
            {
              value: v(
                "Copyright infringement or a pattern of adding material that is not compatible with copyright or licensing requirements",
                "Pelanggaran hak cipta atau pola penambahan materi yang tidak sesuai dengan ketentuan hak cipta maupun lisensi",
              ),
              label: "Copyright infringement",
            },
            {
              value: v(
                "Creating attack pages, defamatory content, or other material intended to target, insult, or harm individuals or groups",
                "Membuat halaman serangan, konten yang mencemarkan nama baik, atau materi lain yang ditujukan untuk menyerang, menghina, atau merugikan individu maupun kelompok",
              ),
              label: "Creating attack pages",
            },
            {
              value: v(
                "Content or conduct that does not comply with the biographies of living persons policy and may pose a risk of harm to living individuals",
                "Konten atau tindakan yang tidak sesuai dengan kebijakan biografi tokoh yang masih hidup dan berpotensi merugikan individu yang masih hidup",
              ),
              label: "Violations of the biographies of living persons policy",
            },
            {
              value: v(
                "Repeated addition of information that cannot be verified, lacks reliable sourcing, or has previously been challenged and removed",
                "Penambahan berulang informasi yang tidak dapat diverifikasi, tidak didukung sumber tepercaya, atau sebelumnya telah dipersoalkan dan dihapus",
              ),
              label: "Repeated addition of unsourced content",
            },
            {
              value: v(
                "Creating pages consisting of nonsense, fabricated information, hoaxes, or other content unsuitable for the project",
                "Membuat halaman yang berisi omong kosong, informasi palsu, hoaks, atau konten lain yang tidak sesuai untuk proyek ini",
              ),
              label: "Creating nonsense or other inappropriate pages",
            },
            {
              value: v(
                "Using Wikipedia primarily for promotion, advertising, public relations, advocacy, or other non-encyclopedic purposes",
                "Menggunakan Wikipedia terutama untuk promosi, periklanan, hubungan masyarakat, advokasi, atau tujuan lain yang tidak bersifat ensiklopedis",
              ),
              label: "Using Wikipedia for promotion or advertising purposes",
            },
            {
              value: v(
                "Edit warring or repeatedly restoring disputed changes instead of seeking consensus through discussion",
                "Perang suntingan atau berulang kali mengembalikan perubahan yang diperselisihkan alih-alih mencari konsensus melalui diskusi",
              ),
              label: "Edit warring",
            },
            {
              value: v(
                "Exceeding or otherwise violating the three-revert rule on a page or related set of pages",
                "Melebihi atau melanggar aturan tiga pembatalan pada suatu halaman atau serangkaian halaman yang berkaitan",
              ),
              label: "Violation of the three-revert rule",
            },
            {
              value: v(
                "Editing patterns that are disruptive to collaboration, consensus-building, or the overall functioning of the project",
                "Pola penyuntingan yang mengganggu kolaborasi, pembentukan konsensus, atau keberlangsungan proyek secara keseluruhan",
              ),
              label: "Disruptive editing",
            },
            {
              value: v(
                "Personal attacks, harassment, intimidation, or other conduct that undermines a respectful and collaborative environment",
                "Serangan pribadi, pelecehan, intimidasi, atau perilaku lain yang merusak suasana kolaboratif dan saling menghormati",
              ),
              label: "Personal attacks or harassment policy violations",
            },
            {
              value: v(
                "Action taken to enforce a decision, remedy, or restriction established through the arbitration process",
                "Tindakan yang diambil untuk menegakkan keputusan, ketentuan, atau pembatasan yang ditetapkan melalui proses arbitrase",
              ),
              label: "Arbitration enforcement",
            },
            {
              value: v(
                "Editing in a contentious topic area in a manner that violates applicable restrictions or sanctions",
                "Penyuntingan pada topik kontroversial yang melanggar pembatasan atau sanksi yang berlaku",
              ),
              label: "Contentious topic restriction",
            },
            {
              value: v(
                "Attempting to bypass an active block, ban, sanction, or other community-imposed restriction",
                "Upaya menghindari blokir, pelarangan, sanksi, atau pembatasan lain yang sedang berlaku",
              ),
              label: "Block evasion",
            },
            {
              value: v(
                "Using multiple accounts in a deceptive or disruptive manner, including to influence discussions or evade scrutiny",
                "Menggunakan beberapa akun secara menyesatkan atau mengganggu, termasuk untuk memengaruhi diskusi atau menghindari pengawasan",
              ),
              label: "Abusing multiple accounts",
            },
            {
              value: v(
                "Repeatedly triggering edit filters after warnings or guidance regarding the underlying issue",
                "Berulang kali memicu filter suntingan setelah menerima peringatan atau penjelasan mengenai masalah yang mendasarinya",
              ),
              label: "Repeatedly triggering the edit filter",
            },
            {
              value: v(
                "Improper use of sockpuppet accounts to mislead, influence outcomes, or circumvent community processes",
                "Penggunaan akun boneka secara tidak semestinya untuk menyesatkan, memengaruhi hasil, atau menghindari proses komunitas",
              ),
              label: "Sockpuppetry",
            },
            {
              value: v(
                "Revocation of talk page access due to misuse of user talk page privileges while blocked",
                "Pencabutan akses halaman pembicaraan karena penyalahgunaan hak penggunaan halaman pembicaraan selama masa pemblokiran",
              ),
              label:
                "Revoking talk page access: Inappropriate use of user talk page whilst blocked",
            },
            {
              value: v(
                "Account used exclusively or primarily for vandalism, disruption, or other non-constructive activities",
                "Akun yang digunakan secara eksklusif atau terutama untuk vandalisme, gangguan, atau kegiatan lain yang tidak bersifat membangun",
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
                "Username does not comply with the username policy and may require a different name to continue participating",
                "Nama pengguna tidak sesuai dengan kebijakan nama pengguna dan mungkin perlu diganti agar dapat terus berpartisipasi",
              ),
              label: "Username violates the username policy",
            },
            {
              value: v(
                "Username suggests authorised bot status or automated activity without appropriate approval or designation",
                "Nama pengguna memberikan kesan sebagai bot resmi atau akun otomatis tanpa persetujuan maupun penandaan yang sesuai",
              ),
              label: "Username indicates use of a bot without authorisation",
            },
            {
              value: v(
                "Username appears to be intended for promotion, advertising, marketing, or public relations purposes rather than collaborative editing",
                "Nama pengguna tampaknya ditujukan untuk promosi, periklanan, pemasaran, atau hubungan masyarakat, bukan untuk kegiatan penyuntingan kolaboratif",
              ),
              label: "Username is promotional or advertising in nature",
            },
            {
              value: v(
                "Username is sufficiently similar to another user's name that it may cause confusion about identity or account ownership",
                "Nama pengguna cukup mirip dengan nama pengguna lain sehingga dapat menimbulkan kebingungan mengenai identitas atau kepemilikan akun",
              ),
              label: "Username is too similar to that of another user",
            },
            {
              value: v(
                "Username may mislead others into believing that the account belongs to, represents, or is operated by another user",
                "Nama pengguna dapat menyesatkan pengguna lain sehingga mengira akun tersebut dimiliki, mewakili, atau dioperasikan oleh pengguna lain",
              ),
              label: "Username impersonates another user",
            },
            {
              value: v(
                "Username may create the false impression that the account belongs to, represents, or is endorsed by a public figure",
                "Nama pengguna dapat menimbulkan kesan yang keliru bahwa akun tersebut dimiliki, mewakili, atau didukung oleh seorang tokoh publik",
              ),
              label: "Username impersonates a famous figure",
            },
            {
              value: v(
                "Username may create the false impression that the account is affiliated with, represents, or is authorised by an organisation",
                "Nama pengguna dapat menimbulkan kesan yang keliru bahwa akun tersebut berafiliasi dengan, mewakili, atau mendapat wewenang dari suatu organisasi",
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
                "Content consisting primarily of nonsense, meaningless text, or material that cannot be reasonably understood",
                "Konten yang sebagian besar terdiri atas omong kosong, teks tanpa makna, atau materi yang tidak dapat dipahami secara wajar",
              ),
              label: "Patent nonsense, meaningless, or unintelligible content",
            },
            {
              value: v(
                "Page created solely for testing, experimentation, or learning how editing works",
                "Halaman yang dibuat semata-mata untuk pengujian, percobaan, atau mempelajari cara kerja penyuntingan",
              ),
              label: "Test page",
            },
            {
              value: v(
                "Vandalism or other deliberate actions intended to damage, disrupt, or undermine the project",
                "Vandalisme atau tindakan sengaja lainnya yang bertujuan merusak, mengganggu, atau menghambat proyek",
              ),
              label: "Vandalism",
            },
            {
              value: v(
                "Content that is clearly fabricated, intentionally misleading, or presented as factual without any credible basis",
                "Konten yang jelas dibuat-buat, sengaja menyesatkan, atau disajikan sebagai fakta tanpa dasar yang dapat dipercaya",
              ),
              label: "Obvious hoax",
            },
            {
              value: v(
                "Recreation of content previously deleted following community discussion and consensus",
                "Pembuatan ulang konten yang sebelumnya telah dihapus berdasarkan hasil diskusi dan konsensus komunitas",
              ),
              label:
                "Recreation of a page that was deleted per a deletion discussion",
            },
            {
              value: v(
                "Page created in violation of an active block, ban, or other editing restriction",
                "Halaman yang dibuat dengan melanggar blokir, pelarangan, atau pembatasan penyuntingan yang sedang berlaku",
              ),
              label:
                "Creation by a banned or blocked user in violation of ban or block",
            },
            {
              value: v(
                "Deletion required to enforce an applicable community sanction or restriction",
                "Penghapusan diperlukan untuk menegakkan sanksi atau pembatasan komunitas yang berlaku",
              ),
              label: "Enforcement of general sanctions",
            },
            {
              value: v(
                "Technical deletion performed as part of routine, non-controversial maintenance",
                "Penghapusan teknis yang dilakukan sebagai bagian dari pemeliharaan rutin dan tidak kontroversial",
              ),
              label: "Technical deletion (uncontroversial maintenance)",
            },
            {
              value: v(
                "Deletion required to allow a page move or complete a page move request",
                "Penghapusan diperlukan untuk memungkinkan pemindahan halaman atau menyelesaikan permintaan pemindahan halaman",
              ),
              label: "Deletion to facilitate a page move",
            },
            {
              value: v(
                "Page clearly created by mistake or created in a namespace where it does not belong",
                "Halaman yang jelas dibuat karena kekeliruan atau dibuat di ruang nama yang tidak semestinya",
              ),
              label:
                "Unambiguously created in error or in the incorrect namespace",
            },
            {
              value: v(
                "Deletion requested by the page's sole contributor, with no substantial contributions from others",
                "Penghapusan diminta oleh satu-satunya kontributor halaman dan tidak terdapat kontribusi berarti dari penyunting lain",
              ),
              label:
                "One author who has requested deletion or blanked the page",
            },
            {
              value: v(
                "Page serving no useful purpose without another page that has been deleted or does not exist",
                "Halaman yang tidak memiliki kegunaan tanpa halaman lain yang telah dihapus atau tidak ada",
              ),
              label: "Page dependent on a deleted or nonexistent page",
            },
            {
              value: v(
                "Deletion required pursuant to an action or directive from the Wikimedia Foundation",
                "Penghapusan diperlukan berdasarkan tindakan atau arahan dari Wikimedia Foundation",
              ),
              label: "Office actions",
            },
            {
              value: v(
                "Attack page, defamatory content, or negative unsourced material about a living person",
                "Halaman serangan, konten yang mencemarkan nama baik, atau materi negatif tanpa sumber mengenai seseorang yang masih hidup",
              ),
              label: "Attack page or negative unsourced BLP",
            },
            {
              value: v(
                "Content created primarily for promotion, advertising, marketing, or public relations purposes",
                "Konten yang dibuat terutama untuk tujuan promosi, periklanan, pemasaran, atau hubungan masyarakat",
              ),
              label: "Purely promotional content",
            },
            {
              value: v(
                "Content that clearly infringes copyright and cannot be retained under applicable licensing requirements",
                "Konten yang secara jelas melanggar hak cipta dan tidak dapat dipertahankan sesuai ketentuan lisensi yang berlaku",
              ),
              label: "Clear copyright infringement",
            },
            {
              value: v(
                "Draft or Articles for Creation submission that has remained inactive for an extended period",
                "Draf atau pengajuan Artikel untuk Pembuatan yang tidak lagi aktif dalam jangka waktu yang lama",
              ),
              label: "Abandoned draft or Articles for Creation submission",
            },
            {
              value: v(
                "Disambiguation page that does not meaningfully assist readers in finding the intended topic",
                "Halaman disambiguasi yang tidak membantu pembaca menemukan topik yang dimaksud secara bermakna",
              ),
              label: "Unnecessary disambiguation page",
            },
            {
              value: v(
                "LLM-generated content that has not received sufficient human review to verify its accuracy, sourcing, and suitability",
                "Konten yang dihasilkan model bahasa besar dan belum menerima peninjauan manusia yang memadai untuk memverifikasi keakuratan, sumber, maupun kesesuaiannya",
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
                "Insufficient context to identify the subject of the article or understand what it is about",
                "Konteks yang tidak memadai untuk mengidentifikasi subjek artikel atau memahami topik yang dibahas",
              ),
              label: "No context",
            },
            {
              value: v(
                "Foreign-language article that can already be found on another Wikimedia project and has not been adapted for local use",
                "Artikel berbahasa asing yang sudah tersedia di proyek Wikimedia lain dan belum disesuaikan untuk penggunaan di proyek ini",
              ),
              label:
                "Foreign-language articles that exist on another Wikimedia project",
            },
            {
              value: v(
                "Little or no meaningful content beyond titles, links, placeholders, or other non-substantive material",
                "Sedikit atau tidak ada konten bermakna selain judul, pranala, teks sementara, atau materi lain yang tidak substantif",
              ),
              label: "No content",
            },
            {
              value: v(
                "No credible indication that the subject meets notability requirements or has significance supported by reliable sources",
                "Tidak ada indikasi yang meyakinkan bahwa subjek memenuhi persyaratan kelayakan atau memiliki signifikansi yang didukung oleh sumber tepercaya",
              ),
              label:
                "No indication of significance (people, animals, organisations, web content, events)",
            },
            {
              value: v(
                "No credible indication that the recording has significance or meets applicable notability requirements",
                "Tidak ada indikasi yang meyakinkan bahwa rekaman tersebut memiliki signifikansi atau memenuhi persyaratan kelayakan yang berlaku",
              ),
              label: "No indication of significance (musical recordings)",
            },
            {
              value: v(
                "Recently created article that duplicates an existing article or covers a subject already described elsewhere",
                "Artikel yang baru dibuat dan menduplikasi artikel yang sudah ada atau membahas subjek yang telah dicakup di tempat lain",
              ),
              label: "Recently created article duplicating an existing subject",
            },
            {
              value: v(
                "Content that is clearly fabricated, invented, or presented as factual without any credible basis",
                "Konten yang jelas dibuat-buat, direka-reka, atau disajikan sebagai fakta tanpa dasar yang dapat dipercaya",
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
                "Redirect crossing namespaces without a clear benefit to readers or a valid editorial purpose",
                "Pengalihan lintas ruang nama yang tidak memberikan manfaat yang jelas bagi pembaca atau tidak memiliki tujuan penyuntingan yang sah",
              ),
              label: "Cross-namespace redirects",
            },
            {
              value: v(
                "Recently created redirect from a highly unlikely misspelling or typographical error that readers are not reasonably expected to use",
                "Pengalihan yang baru dibuat dari ejaan keliru atau kesalahan pengetikan yang sangat tidak mungkin digunakan oleh pembaca saat melakukan pencarian",
              ),
              label: "Recently created implausible typos",
            },
            {
              value: v(
                "File namespace redirect duplicating a file that is already available on Wikimedia Commons and does not require a local redirect",
                "Pengalihan di ruang nama berkas yang menduplikasi berkas yang sudah tersedia di Wikimedia Commons dan tidak memerlukan pengalihan lokal",
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
                "File duplicated by another file that provides the same content and is no longer needed locally",
                "Berkas diduplikasi oleh berkas lain yang menyediakan konten yang sama dan tidak lagi diperlukan secara lokal",
              ),
              label: "Redundant files",
            },
            {
              value: v(
                "File is corrupt, empty, unavailable, or otherwise cannot be accessed or used as intended",
                "Berkas rusak, kosong, tidak tersedia, atau tidak dapat diakses maupun digunakan sebagaimana mestinya",
              ),
              label: "Corrupt, missing, or empty files",
            },
            {
              value: v(
                "File licence is invalid, incompatible with project requirements, or otherwise unacceptable for use",
                "Lisensi berkas tidak sah, tidak sesuai dengan persyaratan proyek, atau tidak dapat diterima untuk digunakan",
              ),
              label: "Improper licence",
            },
            {
              value: v(
                "Required licensing information is missing or insufficient to determine whether the file can be used",
                "Informasi lisensi yang diperlukan tidak tersedia atau tidak cukup untuk menentukan apakah berkas dapat digunakan",
              ),
              label: "Lack of licensing information",
            },
            {
              value: v(
                "Non-free file is no longer used in any article and does not currently satisfy non-free content requirements",
                "Berkas nonbebas tidak lagi digunakan pada artikel mana pun dan saat ini tidak memenuhi persyaratan konten nonbebas",
              ),
              label: "Orphaned non-free use files",
            },
            {
              value: v(
                "Non-free file does not include a valid explanation showing why its use complies with the non-free content policy",
                "Berkas nonbebas tidak menyertakan penjelasan yang sah mengenai alasan penggunaannya sesuai dengan kebijakan konten nonbebas",
              ),
              label: "Missing non-free use rationale",
            },
            {
              value: v(
                "Claimed non-free use is not supported by policy, evidence, or the file's actual use",
                "Klaim penggunaan nonbebas tidak didukung oleh kebijakan, bukti, atau penggunaan berkas yang sebenarnya",
              ),
              label: "Invalid non-free use claim",
            },
            {
              value: v(
                "Identical file is already available on Wikimedia Commons and a local copy is no longer necessary",
                "Berkas yang identik sudah tersedia di Wikimedia Commons sehingga salinan lokal tidak lagi diperlukan",
              ),
              label: "Files available as identical copies on Wikimedia Commons",
            },
            {
              value: v(
                "File clearly infringes copyright and cannot be retained under applicable copyright or licensing requirements",
                "Berkas secara jelas melanggar hak cipta dan tidak dapat dipertahankan sesuai ketentuan hak cipta maupun lisensi yang berlaku",
              ),
              label: "Clear copyright infringement",
            },
            {
              value: v(
                "No evidence has been provided that the copyright holder has authorised the file's use",
                "Tidak ada bukti yang menunjukkan bahwa pemegang hak cipta telah memberikan izin untuk menggunakan berkas tersebut",
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
                "Category containing no pages, files, or subcategories and serving no current navigational or organisational purpose",
                "Kategori yang tidak berisi halaman, berkas, maupun subkategori serta tidak memiliki fungsi navigasi atau pengelompokan yang diperlukan saat ini",
              ),
              label: "Unpopulated categories",
            },
            {
              value: v(
                "Category being renamed or merged to reflect established naming conventions, categorisation practices, or community consensus",
                "Kategori yang diganti nama atau digabungkan untuk menyesuaikan konvensi penamaan, praktik pengategorian, atau konsensus komunitas yang berlaku",
              ),
              label: "Speedy renaming and merging",
            },
            {
              value: v(
                "Maintenance category that is no longer in use, no longer serves its intended purpose, and is unlikely to be needed again",
                "Kategori perawatan yang sudah tidak digunakan, tidak lagi menjalankan fungsi yang dimaksudkan, dan kecil kemungkinan akan diperlukan kembali",
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
                "Template subpage that is not used by any active template workflow and no longer serves a maintenance, documentation, or operational purpose",
                "Subhalaman templat yang tidak digunakan dalam alur kerja templat yang aktif dan tidak lagi memiliki fungsi pemeliharaan, dokumentasi, maupun operasional",
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
                "Deletion requested by the user who created or maintains the page",
                "Penghapusan diminta oleh pengguna yang membuat atau mengelola halaman tersebut",
              ),
              label: "User request",
            },
            {
              value: v(
                "User account does not exist, has not been registered, or cannot be identified",
                "Akun pengguna tidak ada, belum terdaftar, atau tidak dapat diidentifikasi",
              ),
              label: "Non-existent user",
            },
            {
              value: v(
                "User subpage belonging to an account with no meaningful contributions and no indication of ongoing activity",
                "Subhalaman pengguna milik akun yang tidak memiliki kontribusi bermakna dan tidak menunjukkan adanya aktivitas yang berlanjut",
              ),
              label: "Abandoned user subpages of non-contributors",
            },
            {
              value: v(
                "Non-draft user subpage created by a non-contributor that is unrelated to project work or lacks a clear project-related purpose",
                "Subhalaman pengguna nondraf yang dibuat oleh nonkontributor dan tidak berkaitan dengan pekerjaan proyek atau tidak memiliki tujuan yang jelas dengan proyek",
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
                "Redirect from the main namespace to another namespace without a clear navigational benefit or established editorial purpose",
                "Pengalihan dari ruang nama utama ke ruang nama lain tanpa manfaat navigasi yang jelas atau tujuan penyuntingan yang telah diterima",
              ),
              label: "Cross-namespace redirect from mainspace",
            },
            {
              value: v(
                "Recently created redirect from a title that is highly unlikely to be searched for or used by readers",
                "Pengalihan yang baru dibuat dari judul yang sangat kecil kemungkinannya dicari atau digunakan oleh pembaca",
              ),
              label: "Recently created, implausible redirect",
            },
            {
              value: v(
                'Redirect in the "File:" namespace that duplicates an existing file name or an equivalent redirect already provided by Wikimedia Commons',
                'Pengalihan di ruang nama "Berkas:" yang menduplikasi nama berkas yang sudah ada atau pengalihan setara yang telah tersedia di Wikimedia Commons',
              ),
              label:
                'Redirect in the "File:" namespace with the same name as a file or redirect at Wikimedia Commons',
            },
            {
              value: v(
                "Redirect left behind after moving a page from a title that was clearly erroneous, unintended, or unlikely to be useful as a search term",
                "Pengalihan yang tersisa setelah pemindahan halaman dari judul yang jelas keliru, tidak disengaja, atau tidak mungkin berguna sebagai istilah pencarian",
              ),
              label:
                "Redirect created by moving away from a title that was obviously unintended",
            },
            {
              value: v(
                "Redirect pointing to a page that has been deleted, does not exist, or cannot currently serve as a valid destination",
                "Pengalihan yang mengarah ke halaman yang telah dihapus, tidak ada, atau saat ini tidak dapat berfungsi sebagai tujuan yang valid",
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
                "Page has remained listed at Wikipedia:Copyright problems for more than seven days without the copyright concerns being resolved",
                "Halaman tetap terdaftar di Wikipedia:Masalah hak cipta selama lebih dari tujuh hari tanpa penyelesaian terhadap masalah hak cipta yang diidentifikasi",
              ),
              label:
                "Listed at Wikipedia:Copyright problems for over seven days",
            },
            {
              value: v(
                "Page created by a contributor with a documented pattern of copyright violations, raising significant concerns about the originality of the content",
                "Halaman dibuat oleh kontributor yang memiliki pola pelanggaran hak cipta yang terdokumentasi sehingga menimbulkan kekhawatiran serius mengenai keaslian kontennya",
              ),
              label:
                "Page created by contributor with extensive history of copyright violations",
            },
            {
              value: v(
                "Page has been nominated for deletion for at least seven days and no objections or substantive concerns have been raised",
                "Halaman telah dicalonkan untuk penghapusan selama sedikitnya tujuh hari dan tidak ada keberatan maupun tanggapan substantif yang diajukan",
              ),
              label: "Nominated for seven days with no objection",
            },
            {
              value: v(
                "Page has been nominated for deletion for at least seven days and does not contain reliable sources supporting the subject",
                "Halaman telah dicalonkan untuk penghapusan selama sedikitnya tujuh hari dan tidak memuat sumber tepercaya yang mendukung subjeknya",
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
                "Persistent vandalism that continues despite warnings, reverts, or other attempts to address the issue",
                "Vandalisme yang terus berlanjut meskipun telah diberikan peringatan, dilakukan pembatalan, atau diambil tindakan lain untuk mengatasinya",
              ),
              label: "Persistent vandalism",
            },
            {
              value: v(
                "Persistent spam or promotional activity that continues to affect the page despite previous intervention",
                "Spam atau aktivitas promosi yang terus berulang dan tetap memengaruhi halaman meskipun telah dilakukan penanganan sebelumnya",
              ),
              label: "Persistent spamming",
            },
            {
              value: v(
                "Persistent use of sockpuppet accounts to circumvent scrutiny, influence outcomes, or disrupt normal editing",
                "Penggunaan akun boneka yang terus-menerus untuk menghindari pengawasan, memengaruhi hasil, atau mengganggu penyuntingan normal",
              ),
              label: "Persistent sockpuppetry",
            },
            {
              value: v(
                "Persistent disruptive editing that interferes with collaboration, consensus-building, or the stability of the page",
                "Penyuntingan mengganggu yang terus berulang dan menghambat kolaborasi, pembentukan konsensus, atau kestabilan halaman",
              ),
              label: "Persistent disruptive editing",
            },
            {
              value: v(
                "Persistent attempts to evade blocks, bans, or other editing restrictions",
                "Upaya yang terus berulang untuk menghindari blokir, pelarangan, atau pembatasan penyuntingan lainnya",
              ),
              label: "Persistent block evasion",
            },
            {
              value: v(
                "Content disputes involving biographies of living persons that require additional safeguards to ensure policy compliance",
                "Persoalan konten yang berkaitan dengan biografi tokoh yang masih hidup dan memerlukan perlindungan tambahan untuk memastikan kepatuhan terhadap kebijakan",
              ),
              label: "Violations of the biographies of living persons policy",
            },
            {
              value: v(
                "Repeated addition of information that lacks reliable sources or does not meet the project's verification requirements",
                "Penambahan berulang informasi yang tidak didukung sumber tepercaya atau tidak memenuhi persyaratan verifikasi proyek",
              ),
              label: "Addition of unsourced or poorly sourced content",
            },
            {
              value: v(
                "Ongoing edit warring or content disputes that are better resolved through discussion and consensus-building",
                "Perang suntingan atau perselisihan konten yang sedang berlangsung dan lebih baik diselesaikan melalui diskusi serta pembentukan konsensus",
              ),
              label: "Edit warring or content dispute",
            },
            {
              value: v(
                "Protection applied to enforce restrictions, remedies, or decisions established through arbitration",
                "Perlindungan diterapkan untuk menegakkan pembatasan, ketentuan, atau keputusan yang ditetapkan melalui proses arbitrase",
              ),
              label: "Arbitration enforcement",
            },
            {
              value: v(
                "Protection applied under restrictions governing a topic area subject to heightened community oversight",
                "Perlindungan diterapkan berdasarkan pembatasan yang berlaku pada topik yang berada di bawah pengawasan komunitas yang lebih ketat",
              ),
              label: "Contentious topic restriction",
            },
            {
              value: v(
                "Protection applied to enforce sanctions or restrictions adopted through community processes",
                "Perlindungan diterapkan untuk menegakkan sanksi atau pembatasan yang ditetapkan melalui proses komunitas",
              ),
              label: "Community sanctions enforcement",
            },
            {
              value: v(
                "Protection applied at the request of the user for a page within their own user space",
                "Perlindungan diterapkan atas permintaan pengguna untuk halaman yang berada di ruang penggunanya sendiri",
              ),
              label: "User request in their own user space",
            },
            {
              value: v(
                "High-visibility template or module where unintended changes could affect a large number of pages",
                "Templat atau modul dengan penggunaan luas sehingga perubahan yang tidak disengaja dapat memengaruhi banyak halaman",
              ),
              label: "High-risk template or module",
            },
            {
              value: v(
                "User page of a deceased editor, protected to preserve the page and prevent inappropriate changes",
                "Halaman pengguna milik penyunting yang telah meninggal, dilindungi untuk menjaga isi halaman dan mencegah perubahan yang tidak semestinya",
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
                "Repeated or disruptive page moves intended to cause confusion, undermine stability, or interfere with normal page naming",
                "Pemindahan halaman yang berulang atau mengganggu dengan tujuan menimbulkan kebingungan, mengganggu kestabilan, atau menghambat penggunaan judul halaman yang semestinya",
              ),
              label: "Page-move vandalism",
            },
            {
              value: v(
                "Ongoing disputes over page titles involving repeated page moves instead of discussion and consensus-building",
                "Perselisihan yang berkelanjutan mengenai judul halaman yang melibatkan pemindahan berulang alih-alih diselesaikan melalui diskusi dan pembentukan konsensus",
              ),
              label: "Move warring",
            },
            {
              value: v(
                "High-visibility page where page moves may have a significant impact on readers and therefore require additional stability",
                "Halaman dengan tingkat keterlihatan yang tinggi sehingga pemindahan halaman dapat berdampak signifikan bagi pembaca dan memerlukan kestabilan tambahan",
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
                "Image scheduled for prominent display on the Main Page, where additional stability is needed while it is being featured",
                "Gambar yang dijadwalkan untuk ditampilkan secara menonjol di Halaman Utama sehingga memerlukan kestabilan tambahan selama masa penayangannya",
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
                "Reviewing whether an existing long-term protection remains necessary or whether a lower level of protection may be sufficient",
                "Meninjau apakah perlindungan jangka panjang yang ada masih diperlukan atau apakah tingkat perlindungan yang lebih rendah sudah memadai",
              ),
              label: "Testing whether long-term protection is still needed",
            },
            {
              value: v(
                "Protection no longer considered necessary based on current editing activity, page stability, or other relevant circumstances",
                "Perlindungan tidak lagi dianggap diperlukan berdasarkan aktivitas penyuntingan saat ini, kestabilan halaman, atau keadaan lain yang relevan",
              ),
              label: "No longer necessary",
            },
          ],
        },
      ],
      REVDEL_REASONS: [
        {
          value: v(
            "Material that violates copyright requirements and cannot be retained in the page history",
            "Materi yang melanggar ketentuan hak cipta dan tidak dapat dipertahankan dalam riwayat halaman",
          ),
          label: "Violations of copyright policy",
        },
        {
          value: v(
            "Material containing grossly insulting, degrading, abusive, or otherwise seriously offensive content",
            "Materi yang mengandung konten yang sangat menghina, merendahkan, melecehkan, atau sangat menyinggung",
          ),
          label: "Grossly insulting, degrading, or offensive material",
        },
        {
          value: v(
            "Material containing serious violations of the biographies of living persons policy that may cause harm to a living individual",
            "Materi yang mengandung pelanggaran serius terhadap kebijakan biografi tokoh yang masih hidup dan berpotensi merugikan individu yang masih hidup",
          ),
          label: "Serious BLP violations",
        },
        {
          value: v(
            "Material with no constructive purpose and intended primarily to disrupt the project or its contributors",
            "Materi yang tidak memiliki tujuan konstruktif dan terutama ditujukan untuk mengganggu proyek atau para kontributornya",
          ),
          label: "Purely disruptive material",
        },
        {
          value: v(
            "Material removed in accordance with applicable deletion policy or an established community decision",
            "Materi yang dihapus sesuai dengan kebijakan penghapusan yang berlaku atau keputusan komunitas yang telah ditetapkan",
          ),
          label: "Other valid deletion under deletion policy",
        },
        {
          value: v(
            "Routine maintenance, correction of revision deletion actions, administrative notes, or other non-contentious housekeeping tasks",
            "Pemeliharaan rutin, koreksi tindakan penghapusan revisi, catatan administratif, atau tugas pemeliharaan lain yang tidak kontroversial",
          ),
          label:
            "Non-contentious housekeeping, revdel corrections, notes, conversion",
        },
        {
          value: v(
            "Material removed in accordance with a decision, remedy, or directive issued by the Arbitration Committee",
            "Materi yang dihapus sesuai dengan keputusan, ketentuan, atau arahan yang dikeluarkan oleh Komite Arbitrase",
          ),
          label: "Deletion mandated by a decision of the Arbitration Committee",
        },
        {
          value: v(
            "Non-free file no longer used in any page and therefore no longer meeting the requirements for retention",
            "Berkas nonbebas yang tidak lagi digunakan pada halaman mana pun sehingga tidak lagi memenuhi persyaratan untuk dipertahankan",
          ),
          label: "Orphaned non-free file(s) deleted",
        },
      ],
    };
  },
};
