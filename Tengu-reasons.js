/**
 * ============================================================================
 * Tengu — 天狗
 * All-in-one wiki moderation tool — Pre-populated reason sets
 * ============================================================================
 * PURPOSE:
 * This file contains pre-populated reason sets for rollbacks, page deletions, page undeletions, block actions, and revision deletions,
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
                "Vandalising content or engaging in other deliberate actions that damage content, disrupt workflows, or undermine the project's normal operation",
                "Melakukan vandalisme atau tindakan sengaja lainnya yang merusak konten, mengganggu proses kerja, atau menghambat jalannya proyek",
              ),
              label: "Vandalising content",
            },
            {
              value: v(
                "Infringing copyright or repeatedly adding material that is not compatible with copyright or licensing requirements",
                "Melanggar hak cipta atau berulang kali menambahkan materi yang tidak sesuai dengan ketentuan hak cipta maupun lisensi",
              ),
              label: "Infringing copyright",
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
                "Violating the biographies of living persons policy through content or conduct that may pose a risk of harm to living individuals",
                "Melanggar kebijakan biografi tokoh yang masih hidup melalui konten atau tindakan yang berpotensi merugikan individu yang masih hidup",
              ),
              label: "Violating the biographies of living persons policy",
            },
            {
              value: v(
                "Repeatedly adding information that cannot be verified, lacks reliable sourcing, or has previously been challenged and removed",
                "Berulang kali menambahkan informasi yang tidak dapat diverifikasi, tidak didukung sumber tepercaya, atau sebelumnya telah dipersoalkan dan dihapus",
              ),
              label: "Repeatedly adding unsourced content",
            },
            {
              value: v(
                "Engaging in edit warring or repeatedly restoring disputed changes instead of seeking consensus through discussion",
                "Melakukan perang suntingan atau berulang kali mengembalikan perubahan yang diperselisihkan alih-alih mencari konsensus melalui diskusi",
              ),
              label: "Engaging in edit warring",
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
              label: "Violating the three-revert rule",
            },
            {
              value: v(
                "Editing in a manner that is disruptive to collaboration, consensus-building, or the overall functioning of the project",
                "Menyunting dengan cara yang mengganggu kolaborasi, pembentukan konsensus, atau keberlangsungan proyek secara keseluruhan",
              ),
              label: "Editing disruptively",
            },
            {
              value: v(
                "Making personal attacks, engaging in harassment or intimidation, or other conduct that undermines a respectful and collaborative environment",
                "Melakukan serangan pribadi, pelecehan, intimidasi, atau perilaku lain yang merusak suasana kolaboratif dan saling menghormati",
              ),
              label: "Making personal attacks or violating harassment policy",
            },
            {
              value: v(
                "Violating a decision, remedy, or restriction established through the arbitration process",
                "Melanggar keputusan, ketentuan, atau pembatasan yang ditetapkan melalui proses arbitrase",
              ),
              label: "Violating an arbitration decision",
            },
            {
              value: v(
                "Editing in a contentious topic area in a manner that violates applicable restrictions or sanctions",
                "Menyunting topik kontroversial dengan cara yang melanggar pembatasan atau sanksi yang berlaku",
              ),
              label: "Violating a contentious topic restriction",
            },
            {
              value: v(
                "Attempting to bypass an active block, ban, sanction, or other community-imposed restriction",
                "Berupaya menghindari blokir, pelarangan, sanksi, atau pembatasan lain yang sedang berlaku",
              ),
              label: "Evading a block",
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
                "Misusing sockpuppet accounts to mislead, influence outcomes, or circumvent community processes",
                "Menyalahgunakan akun boneka untuk menyesatkan, memengaruhi hasil, atau menghindari proses komunitas",
              ),
              label: "Misusing sockpuppet accounts",
            },
            {
              value: v(
                "Misusing user talk page privileges while blocked, resulting in revocation of talk page access",
                "Menyalahgunakan hak penggunaan halaman pembicaraan selama masa pemblokiran, sehingga mengakibatkan pencabutan akses halaman pembicaraan",
              ),
              label: "Misusing talk page access while blocked",
            },
            {
              value: v(
                "Using the account exclusively or primarily for vandalism, disruption, or other non-constructive activities",
                "Menggunakan akun secara eksklusif atau terutama untuk vandalisme, gangguan, atau kegiatan lain yang tidak bersifat membangun",
              ),
              label: "Using the account solely for vandalism",
            },
          ],
        },
        {
          group: "Username policy violations",
          items: [
            {
              value: v(
                "Using a username that does not comply with the username policy and may require a different name to continue participating",
                "Menggunakan nama pengguna yang tidak sesuai dengan kebijakan nama pengguna dan mungkin perlu diganti agar dapat terus berpartisipasi",
              ),
              label: "Using a username that violates policy",
            },
            {
              value: v(
                "Using a username that suggests authorised bot status or automated activity without appropriate approval or designation",
                "Menggunakan nama pengguna yang memberikan kesan sebagai bot resmi atau akun otomatis tanpa persetujuan maupun penandaan yang sesuai",
              ),
              label: "Using a username indicating unauthorised bot status",
            },
            {
              value: v(
                "Using a username that appears to be intended for promotion, advertising, marketing, or public relations purposes rather than collaborative editing",
                "Menggunakan nama pengguna yang tampaknya ditujukan untuk promosi, periklanan, pemasaran, atau hubungan masyarakat, bukan untuk kegiatan penyuntingan kolaboratif",
              ),
              label: "Using a promotional or advertising username",
            },
            {
              value: v(
                "Using a username that is sufficiently similar to another user's name that it may cause confusion about identity or account ownership",
                "Menggunakan nama pengguna yang cukup mirip dengan nama pengguna lain sehingga dapat menimbulkan kebingungan mengenai identitas atau kepemilikan akun",
              ),
              label: "Using a username too similar to another user's",
            },
            {
              value: v(
                "Using a username that may mislead others into believing that the account belongs to, represents, or is operated by another user",
                "Menggunakan nama pengguna yang dapat menyesatkan pengguna lain sehingga mengira akun tersebut dimiliki, mewakili, atau dioperasikan oleh pengguna lain",
              ),
              label: "Using a username that impersonates another user",
            },
            {
              value: v(
                "Using a username that may create the false impression that the account belongs to, represents, or is endorsed by a public figure",
                "Menggunakan nama pengguna yang dapat menimbulkan kesan yang keliru bahwa akun tersebut dimiliki, mewakili, atau didukung oleh seorang tokoh publik",
              ),
              label: "Using a username that impersonates a famous figure",
            },
            {
              value: v(
                "Using a username that may create the false impression that the account is affiliated with, represents, or is authorised by an organisation",
                "Menggunakan nama pengguna yang dapat menimbulkan kesan yang keliru bahwa akun tersebut berafiliasi dengan, mewakili, atau mendapat wewenang dari suatu organisasi",
              ),
              label:
                "Using a username that impersonates a (non-)profit organisation",
            },
          ],
        },
      ],

      UNBLOCK_REASONS: [
        {
          value: "",
          label: "Other:",
        },
        {
          group: "Administrative",
          items: [
            {
              value: v(
                "Lifting the block because it was applied in error, to the wrong account, or due to an administrative or technical error",
                "Pencabutan blokir karena diterapkan secara keliru, pada akun yang salah, atau akibat kesalahan administratif maupun teknis",
              ),
              label: "Block applied in error",
            },
            {
              value: v(
                "Lifting the block because the circumstances or rationale underlying the block are no longer applicable",
                "Pencabutan blokir karena keadaan atau alasan yang mendasari blokir tersebut tidak lagi berlaku",
              ),
              label: "Original reason no longer applies",
            },
          ],
        },
        {
          group: "Appeal accepted",
          items: [
            {
              value: v(
                "Lifting the block following review and acceptance of the user's appeal, explanation, or clarification",
                "Pencabutan blokir setelah peninjauan dan penerimaan terhadap permohonan, penjelasan, atau klarifikasi pengguna",
              ),
              label: "Appeal accepted",
            },
            {
              value: v(
                "Lifting the block after the user demonstrated an understanding of relevant policies and a willingness to comply with them",
                "Pencabutan blokir setelah pengguna menunjukkan pemahaman terhadap kebijakan yang relevan dan kesediaan untuk mematuhinya",
              ),
              label: "Commitment to improved conduct",
            },
          ],
        },
        {
          group: "Block has served its purpose",
          items: [
            {
              value: v(
                "Lifting the block because the preventative purpose of the block has been achieved and the risk of further disruption is considered reduced",
                "Pencabutan blokir karena tujuan pencegahan dari blokir tersebut telah tercapai dan risiko gangguan lebih lanjut dianggap berkurang",
              ),
              label: "Block has served its purpose",
            },
          ],
        },
        {
          group: "Community or administrative review",
          items: [
            {
              value: v(
                "Lifting the block in accordance with the outcome of a review, community discussion, consensus, or approved review request",
                "Pencabutan blokir sesuai dengan hasil peninjauan, diskusi komunitas, konsensus, atau permintaan peninjauan yang telah disetujui",
              ),
              label: "Following review outcome",
            },
            {
              value: v(
                "Lifting the block at the discretion of an administrator based on the circumstances of the case",
                "Pencabutan blokir atas kebijaksanaan pengurus berdasarkan keadaan kasus yang bersangkutan",
              ),
              label: "At administrator discretion",
            },
          ],
        },
        {
          group: "Changed circumstances",
          items: [
            {
              value: v(
                "Lifting the block because relevant circumstances have changed since the block was imposed, including where a dispute has been resolved or an exception has been granted",
                "Pencabutan blokir karena keadaan yang relevan telah berubah sejak blokir diterapkan, termasuk apabila perselisihan telah diselesaikan atau pengecualian telah diberikan",
              ),
              label: "Circumstances have changed",
            },
          ],
        },
        {
          group: "Account security",
          items: [
            {
              value: v(
                "Lifting the block after account ownership or security concerns have been satisfactorily resolved",
                "Pencabutan blokir setelah masalah kepemilikan akun atau keamanan telah diselesaikan secara memuaskan",
              ),
              label: "Account secured",
            },
          ],
        },
        {
          group: "General",
          items: [
            {
              value: v(
                "Lifting the block following approval of a request for unblock",
                "Pencabutan blokir setelah persetujuan permintaan pencabutan blokir",
              ),
              label: "Request granted",
            },
            {
              value: v(
                "Lifting the block because continued enforcement is no longer considered necessary",
                "Pencabutan blokir karena penerapan lebih lanjut tidak lagi dianggap diperlukan",
              ),
              label: "No longer necessary",
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
          group: "Speedy deletion (General)",
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
          group: "Speedy deletion (Articles)",
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
              label: "No indication of significance",
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
          group: "Speedy deletion (Redirects)",
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
          group: "Speedy deletion (Files)",
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
          group: "Speedy deletion (Categories)",
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
          group: "Speedy deletion (Templates)",
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
          group: "Speedy deletion (User pages)",
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

      UNDELETE_REASONS: [
        {
          value: "",
          label: "Other:",
        },
        {
          value: v(
            "Restoring page; previous deletion was made in error",
            "Memulihkan halaman; penghapusan sebelumnya dilakukan secara keliru",
          ),
          label: "Deletion error",
        },
        {
          value: v(
            "Restoring page in accordance with community consensus",
            "Memulihkan halaman sesuai dengan konsensus komunitas",
          ),
          label: "Community discussion outcome",
        },
        {
          value: v(
            "Restoring page following review of the deletion decision",
            "Memulihkan halaman setelah peninjauan terhadap keputusan penghapusan",
          ),
          label: "Review outcome",
        },
        {
          value: v(
            "Restoring page; the issues that led to deletion have been resolved",
            "Memulihkan halaman; masalah yang menyebabkan penghapusan telah diselesaikan",
          ),
          label: "Underlying issues resolved",
        },
        {
          value: v(
            "Restoring page following verification of copyright status or permission",
            "Memulihkan halaman setelah verifikasi status hak cipta atau izin",
          ),
          label: "Copyright clarified",
        },
        {
          value: v(
            "Restoring page for technical or administrative purposes",
            "Memulihkan halaman untuk keperluan teknis atau administratif",
          ),
          label: "Technical reasons",
        },
        {
          value: v(
            "Restoring page; the new version no longer meets the previous deletion criteria",
            "Memulihkan halaman; versi baru tidak lagi memenuhi kriteria penghapusan sebelumnya",
          ),
          label: "Sufficient new content",
        },
        {
          value: v(
            "Restoring page; the original basis for deletion is no longer applicable",
            "Memulihkan halaman; dasar penghapusan awal tidak lagi berlaku",
          ),
          label: "Deletion rationale no longer applies",
        },
        {
          value: v(
            "Restoring page following approval of a restoration request",
            "Memulihkan halaman setelah persetujuan permintaan pemulihan",
          ),
          label: "Restoration request approved",
        },
      ],

      PROTECT_RECREATION_REASONS: [
        {
          value: "",
          label: "Other:",
        },
        {
          value: v(
            "Protected from recreation following repeated recreation of deleted content",
            "Dilindungi dari pembuatan ulang setelah konten yang dihapus berulang kali dibuat ulang",
          ),
          label: "Repeated recreation",
        },
        {
          value: v(
            "Protected from recreation after community consensus determined that the page should remain deleted",
            "Dilindungi dari pembuatan ulang setelah konsensus komunitas menetapkan bahwa halaman tersebut harus tetap dihapus",
          ),
          label: "Recreation contrary to community consensus",
        },
        {
          value: v(
            "Protected from recreation following repeated recreation of promotional, advertising, or spam content",
            "Dilindungi dari pembuatan ulang setelah konten promosi, iklan, atau spam berulang kali dibuat ulang",
          ),
          label: "Recreation of promotional or spam content",
        },
        {
          value: v(
            "Protected from recreation due to repeated attempts to recreate content that is clearly ineligible under project policies",
            "Dilindungi dari pembuatan ulang karena upaya berulang untuk membuat ulang konten yang jelas tidak memenuhi kebijakan proyek",
          ),
          label: "Recreation of policy-ineligible content",
        },
        {
          value: v(
            "Protected from recreation following repeated recreation of hoax, attack, copyright-infringing, or otherwise disruptive content",
            "Dilindungi dari pembuatan ulang setelah konten hoaks, serangan, pelanggaran hak cipta, atau konten disruptif lainnya berulang kali dibuat ulang",
          ),
          label: "Recreation of disruptive content",
        },
      ],

      MOVE_TO_SANDBOX_REASONS: [
        {
          value: "",
          label: "Other:",
        },
        {
          value: v(
            "Article requires significant improvement before it meets inclusion criteria",
            "Artikel membutuhkan perbaikan yang signifikan sebelum memenuhi kriteria kelayakan",
          ),
          label: "Requires significant improvement",
        },
        {
          value: v(
            "Article appears to be an autobiography or content primarily about its creator",
            "Artikel tampaknya merupakan otobiografi atau konten yang terutama tentang pembuatnya",
          ),
          label: "Appears to be an autobiography",
        },
        {
          value: v(
            "Article was created in article space but is not yet ready for inclusion",
            "Artikel dibuat di ruang artikel tetapi belum siap untuk menjadi sebagai artikel yang layak dimasukkan",
          ),
          label: "Not yet ready for article space",
        },
        {
          value: v(
            "Article lacks reliable sources and requires further development",
            "Artikel tidak memiliki sumber tepercaya dan membutuhkan pengembangan lebih lanjut",
          ),
          label: "Lacks reliable sources",
        },
        {
          value: v(
            "Article does not meet notability guidelines and requires improvement before resubmission",
            "Artikel tidak memenuhi panduan kelayakan dan perlu diperbaiki sebelum diajukan kembali",
          ),
          label: "Does not meet notability guidelines",
        },
        {
          value: v(
            "Moving to user space to allow the creator to continue developing the article",
            "Memindahkan ke ruang pengguna agar pembuat dapat melanjutkan pengembangan artikel",
          ),
          label: "Allow creator to continue development",
        },
        {
          value: v(
            "Article created by a new user who may benefit from developing it further in their user space",
            "Artikel dibuat oleh pengguna baru yang dapat memperoleh manfaat dari pengembangan lebih lanjut di ruang penggunanya",
          ),
          label: "New user article requiring development",
        },
      ],

      // Quick-select reasons for the "Report to global sysops" feature.
      // Unlike the reason sets above, these are not run through v() and stay
      // in English regardless of useIndonesian: reports built from this list
      // are submitted to Meta-Wiki's Global sysops/Requests page, where the
      // audience is global and predominantly English-speaking.
      //
      // Split into ACCOUNT and PAGE sets so account-report reasons and
      // page-report reasons are never shown — or submitted — together.
      // Tengu.js shows ACCOUNT in user mode and PAGE in page mode.
      GLOBAL_SYSOPS_REPORT_REASONS: {
        ACCOUNT: [
          { id: "vandalism", label: "Vandalism" },
          { id: "spam", label: "Spam" },
          { id: "lta", label: "Long-term abuse (LTA)" },
          { id: "crosswiki", label: "Cross-wiki vandalism" },
          { id: "pagemove", label: "Page-move vandalism" },
          { id: "username", label: "Inappropriate username" },
          { id: "botaccount", label: "Bot or automated spam account" },
        ],
        PAGE: [
          { id: "pagevandalism", label: "Vandalism" },
          { id: "pagespam", label: "Spam" },
          { id: "attackpage", label: "Attack page" },
          { id: "copyvio", label: "Blatant copyright violation" },
          { id: "crosswikispam", label: "Cross-wiki spam" },
          { id: "hoax", label: "Hoax page" },
        ],
      },

      // Quick-select reasons for the "Report to Steward requests/Global"
      // feature. Like GLOBAL_SYSOPS_REPORT_REASONS above, these are not run
      // through v() and stay in English regardless of useIndonesian: reports
      // built from this list are submitted to Meta-Wiki's Steward
      // requests/Global page, where the audience is global and
      // predominantly English-speaking.
      //
      // Split into BLOCK and LOCK sets, since global blocks apply to IP
      // addresses and global locks apply to registered accounts. Tengu.js
      // shows BLOCK when the target resolves to an IP address and LOCK
      // otherwise.
      SRG_REPORT_REASONS: {
        BLOCK: [
          { id: "openproxy", label: "Open proxy or web host" },
          { id: "crosswikiabuse", label: "Cross-wiki abuse" },
          { id: "spambot", label: "Spambot" },
          { id: "lta", label: "Long-term abuse (LTA)" },
          { id: "compromised", label: "Compromised IP address" },
        ],
        LOCK: [
          { id: "crosswikiabuse", label: "Cross-wiki abuse" },
          { id: "vandalismonly", label: "Vandalism-only account" },
          { id: "spambot", label: "Spambot" },
          { id: "lta", label: "Long-term abuse (LTA)" },
          { id: "compromised", label: "Compromised account" },
          { id: "username", label: "Inappropriate username" },
        ],
      },
    };
  },
};
