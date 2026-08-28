// ============================================================
// Nour i18n — English / French / Arabic
// ============================================================

export const translations = {
  en: {
    brand_sub: "live outage map",
    stat_zones_dark: "zones dark",
    stat_active_sos: "active SOS",
    search_placeholder: "Search your neighborhood, town, or street…",

    fab_out: "⚡ No power here",
    fab_on: "✅ Power's back",
    fab_sos: "🆘 Medical SOS",

    panel_title: "Nour dashboard",
    tab_legend: "Legend",
    tab_outages: "Outages",
    tab_sos: "SOS nearby",

    legend_out_confirmed: "Power out (confirmed by multiple reports)",
    legend_out_unconfirmed: "Power out (unconfirmed, 1 report)",
    legend_on: "Power confirmed back on",
    legend_sos: "Active medical SOS nearby",

    recent_activity: "Recent activity",
    feed_empty: "No reports yet — be the first tonight.",
    about_title: "About Nour",
    about_text: "Nour is a community-run map. It is not affiliated with STEG. Reports auto-expire after a few hours so the map always reflects what people are seeing right now. Please only report what you can personally confirm.",

    filter_all: "All",
    filter_out: "Out",
    filter_on: "Back on",
    table_area: "Area",
    table_status: "Status",
    table_updated: "Updated",
    table_empty: "No reports yet.",
    table_filtered_empty: "No reports match this filter.",
    table_view: "View",
    locating: "Locating…",

    sos_hint: "Sorted by distance from you when location is available.",
    sos_empty: "No active SOS right now.",
    sos_helpers: "{n} people offered help",

    sos_sheet_title: "Medical SOS",
    sos_sheet_sub: "This alerts people near your approximate area (not your exact address) that someone nearby may need help during the outage.",
    sos_situation_label: "What's the situation?",
    reason_oxygen: "Oxygen concentrator",
    reason_fridge: "Fridge-stored medication",
    reason_medical: "Other medical device",
    reason_other: "Other emergency",
    reason_oxygen_full: "Needs oxygen concentrator power",
    reason_fridge_full: "Fridge-stored medication at risk",
    reason_medical_full: "Depends on another medical device",
    reason_other_full: "Other emergency",
    sos_note_label: "Optional note (visible to helpers)",
    sos_note_placeholder: "e.g. 3rd floor, blue door, ring twice",
    sos_contact_label: "Optional contact info (only shown to people who tap \"I can help\")",
    sos_contact_placeholder: "Phone number or leave blank",
    sos_cancel: "Cancel",
    sos_send: "Send SOS",

    sos_detail_messages: "Messages",
    sos_detail_no_messages: "No messages yet.",
    sos_detail_mark_safe: "I'm safe now",
    sos_detail_meta: "Reported {time} · {n} people offered help{contact}",
    sos_detail_contact_note: " · contact shared with helpers",
    comment_placeholder: "e.g. I can help, call me at 55 123 456",
    comment_send: "Send",

    search_confirm_title_prefix: "Report at this location?",
    search_confirm_sub: "Report the current power status for this area.",
    search_confirm_cancel: "Cancel",
    search_confirm_out: "⚡ No power",
    search_confirm_on: "✅ Power's back",

    toast_report_out: "Marked: no power at your location.",
    toast_report_on: "Marked: power confirmed back on.",
    toast_location_unavailable: "Location unavailable — tap the map to mark the spot.",
    toast_report_placed: "Report placed. Thanks for helping the map!",
    toast_report_updated: "Thanks — report updated.",
    toast_report_failed: "Couldn't send report — check your connection.",
    toast_sos_sent: "SOS sent. Nearby people can now see you may need help.",
    toast_sos_location_required: "Location is required to send an SOS. Please enable location access.",
    toast_safe_marked: "Marked safe. Your SOS has been cleared.",
    toast_message_sent: "Message sent — the person will see it.",
    toast_message_failed: "Couldn't send message — check your connection.",
    toast_search_out: "Marked: no power in {label}.",
    toast_search_on: "Marked: power confirmed on in {label}.",

    status_no_power: "No power",
    status_power_on: "Power on",

    time_just_now: "just now",
    time_m_ago: "{m}m ago",
    time_h_ago: "{h}h ago",

    search_no_matches: "No matches found in Tunisia.",
    search_failed: "Search failed — check your connection.",
    search_searching: "Searching…",

    popup_out_confirmed: "Power outage (confirmed)",
    popup_out_unconfirmed: "Power outage (unconfirmed)",
    popup_on: "Power confirmed on",
    popup_reports: "{out} outage report{outS} · {on} restored report{onS} · updated {time}",
    popup_still_out: "Still out",
    popup_power_back: "Power's back",

    feed_out_reported: "⚡ Power out reported",
    feed_on_reported: "✅ Power restored reported"
  },

  fr: {
    brand_sub: "carte des coupures en direct",
    stat_zones_dark: "zones sans courant",
    stat_active_sos: "SOS actifs",
    search_placeholder: "Cherchez votre quartier, ville ou rue…",

    fab_out: "⚡ Pas de courant ici",
    fab_on: "✅ Le courant est revenu",
    fab_sos: "🆘 SOS médical",

    panel_title: "Tableau de bord Nour",
    tab_legend: "Légende",
    tab_outages: "Coupures",
    tab_sos: "SOS à proximité",

    legend_out_confirmed: "Coupure de courant (confirmée par plusieurs signalements)",
    legend_out_unconfirmed: "Coupure de courant (non confirmée, 1 signalement)",
    legend_on: "Retour du courant confirmé",
    legend_sos: "SOS médical actif à proximité",

    recent_activity: "Activité récente",
    feed_empty: "Aucun signalement pour l'instant — soyez le premier ce soir.",
    about_title: "À propos de Nour",
    about_text: "Nour est une carte gérée par la communauté. Elle n'est pas affiliée à la STEG. Les signalements expirent automatiquement après quelques heures pour que la carte reflète toujours la situation actuelle. Merci de ne signaler que ce que vous pouvez confirmer personnellement.",

    filter_all: "Tout",
    filter_out: "Coupé",
    filter_on: "Revenu",
    table_area: "Zone",
    table_status: "État",
    table_updated: "Mis à jour",
    table_empty: "Aucun signalement pour l'instant.",
    table_filtered_empty: "Aucun signalement ne correspond à ce filtre.",
    table_view: "Voir",
    locating: "Localisation…",

    sos_hint: "Trié par distance depuis votre position, lorsqu'elle est disponible.",
    sos_empty: "Aucun SOS actif pour le moment.",
    sos_helpers: "{n} personnes ont proposé leur aide",

    sos_sheet_title: "SOS médical",
    sos_sheet_sub: "Ceci alerte les personnes proches de votre zone approximative (pas votre adresse exacte) qu'une personne à proximité pourrait avoir besoin d'aide pendant la coupure.",
    sos_situation_label: "Quelle est la situation ?",
    reason_oxygen: "Concentrateur d'oxygène",
    reason_fridge: "Médicaments réfrigérés",
    reason_medical: "Autre appareil médical",
    reason_other: "Autre urgence",
    reason_oxygen_full: "A besoin d'électricité pour un concentrateur d'oxygène",
    reason_fridge_full: "Médicaments réfrigérés en danger",
    reason_medical_full: "Dépend d'un autre appareil médical",
    reason_other_full: "Autre urgence",
    sos_note_label: "Note facultative (visible par les aidants)",
    sos_note_placeholder: "ex. 3ème étage, porte bleue, sonnez deux fois",
    sos_contact_label: "Coordonnées facultatives (affichées seulement aux personnes qui appuient sur « Je peux aider »)",
    sos_contact_placeholder: "Numéro de téléphone ou laissez vide",
    sos_cancel: "Annuler",
    sos_send: "Envoyer le SOS",

    sos_detail_messages: "Messages",
    sos_detail_no_messages: "Aucun message pour l'instant.",
    sos_detail_mark_safe: "Je suis en sécurité",
    sos_detail_meta: "Signalé {time} · {n} personnes ont proposé leur aide{contact}",
    sos_detail_contact_note: " · coordonnées partagées avec les aidants",
    comment_placeholder: "ex. Je peux aider, appelez-moi au 55 123 456",
    comment_send: "Envoyer",

    search_confirm_title_prefix: "Signaler à cet endroit ?",
    search_confirm_sub: "Signalez l'état actuel du courant pour cette zone.",
    search_confirm_cancel: "Annuler",
    search_confirm_out: "⚡ Pas de courant",
    search_confirm_on: "✅ Courant revenu",

    toast_report_out: "Signalé : pas de courant à votre position.",
    toast_report_on: "Signalé : retour du courant confirmé.",
    toast_location_unavailable: "Position indisponible — touchez la carte pour marquer l'endroit.",
    toast_report_placed: "Signalement ajouté. Merci d'aider la carte !",
    toast_report_updated: "Merci — signalement mis à jour.",
    toast_report_failed: "Envoi impossible — vérifiez votre connexion.",
    toast_sos_sent: "SOS envoyé. Les personnes à proximité peuvent maintenant voir que vous avez peut-être besoin d'aide.",
    toast_sos_location_required: "La position est nécessaire pour envoyer un SOS. Veuillez activer l'accès à la position.",
    toast_safe_marked: "Marqué comme en sécurité. Votre SOS a été supprimé.",
    toast_message_sent: "Message envoyé — la personne le verra.",
    toast_message_failed: "Envoi impossible — vérifiez votre connexion.",
    toast_search_out: "Signalé : pas de courant à {label}.",
    toast_search_on: "Signalé : retour du courant confirmé à {label}.",

    status_no_power: "Pas de courant",
    status_power_on: "Courant revenu",

    time_just_now: "à l'instant",
    time_m_ago: "il y a {m}min",
    time_h_ago: "il y a {h}h",

    search_no_matches: "Aucun résultat trouvé en Tunisie.",
    search_failed: "Recherche impossible — vérifiez votre connexion.",
    search_searching: "Recherche…",

    popup_out_confirmed: "Coupure de courant (confirmée)",
    popup_out_unconfirmed: "Coupure de courant (non confirmée)",
    popup_on: "Retour du courant confirmé",
    popup_reports: "{out} signalement{outS} de coupure · {on} signalement{onS} de retour · mis à jour {time}",
    popup_still_out: "Toujours coupé",
    popup_power_back: "Courant revenu",

    feed_out_reported: "⚡ Coupure signalée",
    feed_on_reported: "✅ Retour du courant signalé"
  },

  ar: {
    brand_sub: "خريطة انقطاع الكهرباء المباشرة",
    stat_zones_dark: "مناطق مظلمة",
    stat_active_sos: "نداءات استغاثة نشطة",
    search_placeholder: "ابحث عن حيّك أو مدينتك أو شارعك…",

    fab_out: "⚡ الكهرباء مقطوعة هنا",
    fab_on: "✅ رجعت الكهرباء",
    fab_sos: "🆘 استغاثة طبية",

    panel_title: "لوحة تحكم نور",
    tab_legend: "الدليل",
    tab_outages: "الانقطاعات",
    tab_sos: "استغاثات قريبة",

    legend_out_confirmed: "انقطاع كهرباء (مؤكد بعدة بلاغات)",
    legend_out_unconfirmed: "انقطاع كهرباء (غير مؤكد، بلاغ واحد)",
    legend_on: "تأكيد عودة الكهرباء",
    legend_sos: "استغاثة طبية نشطة قريبة منك",

    recent_activity: "النشاط الأخير",
    feed_empty: "لا توجد بلاغات بعد — كن أول من يبلّغ الليلة.",
    about_title: "عن تطبيق نور",
    about_text: "نور خريطة يديرها المجتمع، وهي غير تابعة لشركة الستاغ. تنتهي صلاحية البلاغات تلقائيًا بعد بضع ساعات حتى تعكس الخريطة الوضع الحالي دائمًا. الرجاء الإبلاغ فقط عمّا يمكنكم تأكيده شخصيًا.",

    filter_all: "الكل",
    filter_out: "مقطوعة",
    filter_on: "عادت",
    table_area: "المنطقة",
    table_status: "الحالة",
    table_updated: "آخر تحديث",
    table_empty: "لا توجد بلاغات بعد.",
    table_filtered_empty: "لا توجد بلاغات تطابق هذا الفلتر.",
    table_view: "عرض",
    locating: "جارٍ تحديد الموقع…",

    sos_hint: "مرتبة حسب المسافة منك عند توفر الموقع.",
    sos_empty: "لا توجد استغاثات نشطة حاليًا.",
    sos_helpers: "{n} أشخاص عرضوا المساعدة",

    sos_sheet_title: "استغاثة طبية",
    sos_sheet_sub: "هذا يُنبّه الأشخاص القريبين من منطقتك التقريبية (وليس عنوانك الدقيق) بأن شخصًا قريبًا قد يحتاج إلى مساعدة أثناء الانقطاع.",
    sos_situation_label: "ما هي الحالة؟",
    reason_oxygen: "جهاز أكسجين",
    reason_fridge: "أدوية محفوظة بالثلاجة",
    reason_medical: "جهاز طبي آخر",
    reason_other: "حالة طارئة أخرى",
    reason_oxygen_full: "بحاجة إلى كهرباء لتشغيل جهاز الأكسجين",
    reason_fridge_full: "أدوية محفوظة بالثلاجة معرّضة للتلف",
    reason_medical_full: "يعتمد على جهاز طبي آخر",
    reason_other_full: "حالة طارئة أخرى",
    sos_note_label: "ملاحظة اختيارية (تظهر للمساعدين)",
    sos_note_placeholder: "مثال: الطابق 3، باب أزرق، اطرق مرتين",
    sos_contact_label: "معلومات تواصل اختيارية (تظهر فقط لمن يضغط على «أستطيع المساعدة»)",
    sos_contact_placeholder: "رقم الهاتف أو اتركه فارغًا",
    sos_cancel: "إلغاء",
    sos_send: "إرسال الاستغاثة",

    sos_detail_messages: "الرسائل",
    sos_detail_no_messages: "لا توجد رسائل بعد.",
    sos_detail_mark_safe: "أنا بخير الآن",
    sos_detail_meta: "تم الإبلاغ {time} · {n} أشخاص عرضوا المساعدة{contact}",
    sos_detail_contact_note: " · تم مشاركة معلومات التواصل مع المساعدين",
    comment_placeholder: "مثال: أستطيع المساعدة، اتصل بي على 55 123 456",
    comment_send: "إرسال",

    search_confirm_title_prefix: "الإبلاغ عن هذا الموقع؟",
    search_confirm_sub: "أبلغ عن حالة الكهرباء الحالية في هذه المنطقة.",
    search_confirm_cancel: "إلغاء",
    search_confirm_out: "⚡ لا كهرباء",
    search_confirm_on: "✅ عادت الكهرباء",

    toast_report_out: "تم التسجيل: لا توجد كهرباء في موقعك.",
    toast_report_on: "تم التسجيل: تأكيد عودة الكهرباء.",
    toast_location_unavailable: "الموقع غير متاح — اضغط على الخريطة لتحديد المكان.",
    toast_report_placed: "تم إضافة البلاغ. شكرًا لمساعدتك في تحديث الخريطة!",
    toast_report_updated: "شكرًا — تم تحديث البلاغ.",
    toast_report_failed: "تعذّر إرسال البلاغ — تحقق من اتصالك.",
    toast_sos_sent: "تم إرسال الاستغاثة. يمكن للأشخاص القريبين الآن رؤية أنك قد تحتاج إلى مساعدة.",
    toast_sos_location_required: "الموقع مطلوب لإرسال استغاثة. الرجاء تفعيل الوصول إلى الموقع.",
    toast_safe_marked: "تم التأكيد بأنك بخير. تم إلغاء استغاثتك.",
    toast_message_sent: "تم إرسال الرسالة — سيراها الشخص.",
    toast_message_failed: "تعذّر إرسال الرسالة — تحقق من اتصالك.",
    toast_search_out: "تم التسجيل: لا توجد كهرباء في {label}.",
    toast_search_on: "تم التسجيل: تأكيد عودة الكهرباء في {label}.",

    status_no_power: "لا كهرباء",
    status_power_on: "الكهرباء متوفرة",

    time_just_now: "الآن",
    time_m_ago: "قبل {m} د",
    time_h_ago: "قبل {h} سا",

    search_no_matches: "لم يتم العثور على نتائج في تونس.",
    search_failed: "تعذّر البحث — تحقق من اتصالك.",
    search_searching: "جارٍ البحث…",

    popup_out_confirmed: "انقطاع كهرباء (مؤكد)",
    popup_out_unconfirmed: "انقطاع كهرباء (غير مؤكد)",
    popup_on: "تأكيد عودة الكهرباء",
    popup_reports: "{out} بلاغ انقطاع · {on} بلاغ عودة · آخر تحديث {time}",
    popup_still_out: "لا تزال مقطوعة",
    popup_power_back: "عادت الكهرباء",

    feed_out_reported: "⚡ تم الإبلاغ عن انقطاع",
    feed_on_reported: "✅ تم الإبلاغ عن عودة الكهرباء"
  }
};

const RTL_LANGS = new Set(["ar"]);

export function detectDefaultLang() {
  const saved = localStorage.getItem("nour_lang");
  if (saved && translations[saved]) return saved;
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("ar")) return "ar";
  if (nav.startsWith("fr")) return "fr";
  return "en";
}

export let currentLang = detectDefaultLang();

export function setLang(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem("nour_lang", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
  document.body.classList.toggle("rtl", RTL_LANGS.has(lang));
}

export function t(key, vars) {
  const dict = translations[currentLang] || translations.en;
  let str = dict[key] !== undefined ? dict[key] : (translations.en[key] || key);
  if (vars) {
    Object.keys(vars).forEach((k) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]);
    });
  }
  return str;
}

// Apply translations to every element carrying a data-i18n / data-i18n-placeholder attribute.
export function applyStaticTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
}
