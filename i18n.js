// ============================================================
// Nour i18n — English / French / Arabic
// ============================================================

export const translations = {
  en: {
    brand_sub: "live outage map",
    stat_zones_dark: "zones dark",
    stat_active_sos: "active SOS",
    search_placeholder: "Search your neighborhood, town, or street…",

    service_power: "⚡ Power",
    service_water: "💧 Water",
    service_label_power: "power",
    service_label_water: "water",

    fab_out: "⚡ No power here",
    fab_on: "✅ Power's back",
    fab_out_power: "⚡ No power here",
    fab_on_power: "✅ Power's back",
    fab_out_water: "💧 No water here",
    fab_on_water: "✅ Water's back",
    fab_sos: "🆘 Medical SOS",

    panel_title: "Nour dashboard",
    tab_legend: "Legend",
    tab_outages: "Outages",
    tab_sos: "SOS nearby",

    legend_out_confirmed: "Out (confirmed by multiple reports)",
    legend_out_unconfirmed: "Out (unconfirmed, 1 report)",
    legend_on: "Confirmed back on",
    legend_sos: "Active medical SOS nearby",
    legend_showing: "Showing: {service}",

    recent_activity: "Recent activity",
    feed_empty: "No reports yet — be the first tonight.",
    about_title: "About Nour",
    about_text: "Nour is a community-run map for power and water cuts. It is not affiliated with STEG or SONEDE. Reports auto-expire after a few hours so the map always reflects what people are seeing right now. Please only report what you can personally confirm.",

    filter_all: "All",
    filter_out: "Out",
    filter_on: "Back on",
    table_area: "Area",
    table_service: "Service",
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
    sos_urgency_label: "How urgent is it?",
    sos_urgency_urgent: "🔴 Urgent — within the hour",
    sos_urgency_normal: "🟡 Not urgent yet",
    sos_urgent_badge: "URGENT",
    sos_note_label: "Optional note (visible to helpers — address hint helps)",
    sos_note_placeholder: "e.g. 3rd floor, blue door, near the blue mosque",
    sos_cancel: "Cancel",
    sos_send: "Send SOS",

    sos_detail_messages: "Messages",
    sos_detail_no_messages: "No messages yet.",
    sos_detail_mark_safe: "I'm safe now",
    sos_detail_meta: "Reported {time} · {n} people reached out",
    comment_placeholder: "Type a private message…",
    comment_send: "Send",
    comment_delete: "Delete",

    sos_detail_helpers_title: "People reaching out",
    sos_no_helpers_yet: "No one has messaged yet. Helpers who reach out will show up here, each in their own private thread.",
    sos_thread_empty: "No messages yet — say hello and offer to help. Only you and this person can see this thread.",
    sos_thread_back: "Back",
    sos_flag_tooltip: "Report as fake emergency",
    sos_flag_confirm: "Report this as a fake or abusive emergency? After a few reports it gets hidden from the map. Only use this if you believe it isn't real.",

    sos_checkin_prompt: "It's been a couple of hours since this SOS was sent.",
    sos_checkin_yes: "Still need help",

    toast_flag_sent: "Reported as fake. Thanks for helping keep this trustworthy.",
    toast_flag_already: "You've already reported this one.",
    toast_checkin_ack: "Thanks — still marked active.",
    toast_sos_cooldown: "Please wait a couple of minutes before sending another SOS.",

    search_confirm_title_prefix: "Report at this location?",
    search_confirm_sub: "Report the current power status for this area.",
    search_confirm_cancel: "Cancel",
    search_confirm_out: "⚡ No power",
    search_confirm_on: "✅ Power's back",

    toast_report_out: "Marked: no {service} at your location.",
    toast_report_on: "Marked: {service} confirmed back on.",
    toast_location_unavailable: "Location unavailable — tap the map to mark the spot.",
    toast_report_placed: "Report placed. Thanks for helping the map!",
    toast_report_updated: "Thanks — report updated.",
    toast_report_failed: "Couldn't send report — check your connection.",
    toast_sos_sent: "SOS sent. Nearby people can now see you may need help.",
    toast_sos_location_required: "Location is required to send an SOS. Please enable location access.",
    toast_safe_marked: "Marked safe. Your SOS has been cleared.",
    toast_message_sent: "Message sent — the person will see it.",
    toast_message_failed: "Couldn't send message — check your connection.",
    toast_search_out: "Marked: no {service} in {label}.",
    toast_search_on: "Marked: {service} confirmed on in {label}.",

    status_no_power: "No power",
    status_power_on: "Power on",
    status_no_water: "No water",
    status_water_on: "Water on",

    time_just_now: "just now",
    time_m_ago: "{m}m ago",
    time_h_ago: "{h}h ago",

    search_no_matches: "No matches found in Tunisia.",
    search_failed: "Search failed — check your connection.",
    search_searching: "Searching…",

    popup_out_confirmed: "{service} outage (confirmed)",
    popup_out_unconfirmed: "{service} outage (unconfirmed)",
    popup_on: "{service} confirmed on",
    popup_reports: "{out} outage report{outS} · {on} restored report{onS} · updated {time}",
    popup_still_out: "Still out",
    popup_power_back: "It's back",
    popup_remove_mine: "🗑 Remove",
    toast_report_removed: "Your report has been removed from the map.",

    feed_out_reported_power: "⚡ Power out reported",
    feed_on_reported_power: "✅ Power restored reported",
    feed_out_reported_water: "💧 Water cut reported",
    feed_on_reported_water: "✅ Water restored reported"
  },

  fr: {
    brand_sub: "carte des coupures en direct",
    stat_zones_dark: "zones sans courant",
    stat_active_sos: "SOS actifs",
    search_placeholder: "Cherchez votre quartier, ville ou rue…",

    service_power: "⚡ Électricité",
    service_water: "💧 Eau",
    service_label_power: "courant",
    service_label_water: "eau",

    fab_out: "⚡ Pas de courant ici",
    fab_on: "✅ Le courant est revenu",
    fab_out_power: "⚡ Pas de courant ici",
    fab_on_power: "✅ Le courant est revenu",
    fab_out_water: "💧 Pas d'eau ici",
    fab_on_water: "✅ L'eau est revenue",
    fab_sos: "🆘 SOS médical",

    panel_title: "Tableau de bord Nour",
    tab_legend: "Légende",
    tab_outages: "Coupures",
    tab_sos: "SOS à proximité",

    legend_out_confirmed: "Coupure (confirmée par plusieurs signalements)",
    legend_out_unconfirmed: "Coupure (non confirmée, 1 signalement)",
    legend_on: "Retour confirmé",
    legend_sos: "SOS médical actif à proximité",
    legend_showing: "Affichage : {service}",

    recent_activity: "Activité récente",
    feed_empty: "Aucun signalement pour l'instant — soyez le premier ce soir.",
    about_title: "À propos de Nour",
    about_text: "Nour est une carte gérée par la communauté pour les coupures de courant et d'eau. Elle n'est pas affiliée à la STEG ni à la SONEDE. Les signalements expirent automatiquement après quelques heures pour que la carte reflète toujours la situation actuelle. Merci de ne signaler que ce que vous pouvez confirmer personnellement.",

    filter_all: "Tout",
    filter_out: "Coupé",
    filter_on: "Revenu",
    table_area: "Zone",
    table_service: "Service",
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
    sos_urgency_label: "Quel est le niveau d'urgence ?",
    sos_urgency_urgent: "🔴 Urgent — dans l'heure",
    sos_urgency_normal: "🟡 Pas urgent pour l'instant",
    sos_urgent_badge: "URGENT",
    sos_note_label: "Note facultative (visible par les aidants — un repère aide)",
    sos_note_placeholder: "ex. 3ème étage, porte bleue, près de la mosquée bleue",
    sos_cancel: "Annuler",
    sos_send: "Envoyer le SOS",

    sos_detail_messages: "Messages",
    sos_detail_no_messages: "Aucun message pour l'instant.",
    sos_detail_mark_safe: "Je suis en sécurité",
    sos_detail_meta: "Signalé {time} · {n} personnes ont contacté",
    comment_placeholder: "Écrivez un message privé…",
    comment_send: "Envoyer",
    comment_delete: "Supprimer",

    sos_detail_helpers_title: "Personnes qui ont contacté",
    sos_no_helpers_yet: "Personne n'a encore écrit. Les aidants apparaîtront ici, chacun dans son propre fil privé.",
    sos_thread_empty: "Aucun message pour l'instant — dites bonjour et proposez votre aide. Vous seuls voyez ce fil.",
    sos_thread_back: "Retour",
    sos_flag_tooltip: "Signaler comme fausse urgence",
    sos_flag_confirm: "Signaler ceci comme une fausse urgence ou un abus ? Après plusieurs signalements, l'alerte est masquée de la carte. N'utilisez cela que si vous pensez qu'elle n'est pas réelle.",

    sos_checkin_prompt: "Cela fait quelques heures depuis l'envoi de ce SOS.",
    sos_checkin_yes: "Toujours besoin d'aide",

    toast_flag_sent: "Signalé comme faux. Merci de nous aider à garder cette liste fiable.",
    toast_flag_already: "Vous avez déjà signalé cette alerte.",
    toast_checkin_ack: "Merci — toujours marqué actif.",
    toast_sos_cooldown: "Merci d'attendre quelques minutes avant d'envoyer un autre SOS.",

    search_confirm_title_prefix: "Signaler à cet endroit ?",
    search_confirm_sub: "Signalez l'état actuel du courant pour cette zone.",
    search_confirm_cancel: "Annuler",
    search_confirm_out: "⚡ Pas de courant",
    search_confirm_on: "✅ Courant revenu",

    toast_report_out: "Signalé : pas de {service} à votre position.",
    toast_report_on: "Signalé : retour du {service} confirmé.",
    toast_location_unavailable: "Position indisponible — touchez la carte pour marquer l'endroit.",
    toast_report_placed: "Signalement ajouté. Merci d'aider la carte !",
    toast_report_updated: "Merci — signalement mis à jour.",
    toast_report_failed: "Envoi impossible — vérifiez votre connexion.",
    toast_sos_sent: "SOS envoyé. Les personnes à proximité peuvent maintenant voir que vous avez peut-être besoin d'aide.",
    toast_sos_location_required: "La position est nécessaire pour envoyer un SOS. Veuillez activer l'accès à la position.",
    toast_safe_marked: "Marqué comme en sécurité. Votre SOS a été supprimé.",
    toast_message_sent: "Message envoyé — la personne le verra.",
    toast_message_failed: "Envoi impossible — vérifiez votre connexion.",
    toast_search_out: "Signalé : pas de {service} à {label}.",
    toast_search_on: "Signalé : retour du {service} confirmé à {label}.",

    status_no_power: "Pas de courant",
    status_power_on: "Courant revenu",
    status_no_water: "Pas d'eau",
    status_water_on: "Eau revenue",

    time_just_now: "à l'instant",
    time_m_ago: "il y a {m}min",
    time_h_ago: "il y a {h}h",

    search_no_matches: "Aucun résultat trouvé en Tunisie.",
    search_failed: "Recherche impossible — vérifiez votre connexion.",
    search_searching: "Recherche…",

    popup_out_confirmed: "Coupure de {service} (confirmée)",
    popup_out_unconfirmed: "Coupure de {service} (non confirmée)",
    popup_on: "Retour du {service} confirmé",
    popup_reports: "{out} signalement{outS} de coupure · {on} signalement{onS} de retour · mis à jour {time}",
    popup_still_out: "Toujours coupé",
    popup_power_back: "C'est revenu",
    popup_remove_mine: "🗑 Supprimer",
    toast_report_removed: "Votre signalement a été retiré de la carte.",

    feed_out_reported_power: "⚡ Coupure de courant signalée",
    feed_on_reported_power: "✅ Retour du courant signalé",
    feed_out_reported_water: "💧 Coupure d'eau signalée",
    feed_on_reported_water: "✅ Retour de l'eau signalé"
  },

  ar: {
    brand_sub: "خريطة انقطاع الكهرباء المباشرة",
    stat_zones_dark: "مناطق مظلمة",
    stat_active_sos: "نداءات استغاثة نشطة",
    search_placeholder: "ابحث عن حيّك أو مدينتك أو شارعك…",

    service_power: "⚡ الكهرباء",
    service_water: "💧 الماء",
    service_label_power: "الكهرباء",
    service_label_water: "الماء",

    fab_out: "⚡ الكهرباء مقطوعة هنا",
    fab_on: "✅ رجعت الكهرباء",
    fab_out_power: "⚡ الكهرباء مقطوعة هنا",
    fab_on_power: "✅ رجعت الكهرباء",
    fab_out_water: "💧 الماء مقطوع هنا",
    fab_on_water: "✅ رجع الماء",
    fab_sos: "🆘 استغاثة طبية",

    panel_title: "لوحة تحكم نور",
    tab_legend: "الدليل",
    tab_outages: "الانقطاعات",
    tab_sos: "استغاثات قريبة",

    legend_out_confirmed: "انقطاع (مؤكد بعدة بلاغات)",
    legend_out_unconfirmed: "انقطاع (غير مؤكد، بلاغ واحد)",
    legend_on: "تأكيد العودة",
    legend_sos: "استغاثة طبية نشطة قريبة منك",
    legend_showing: "المعروض: {service}",

    recent_activity: "النشاط الأخير",
    feed_empty: "لا توجد بلاغات بعد — كن أول من يبلّغ الليلة.",
    about_title: "عن تطبيق نور",
    about_text: "نور خريطة يديرها المجتمع لانقطاع الكهرباء والماء، وهي غير تابعة لشركة الستاغ أو الصوناد. تنتهي صلاحية البلاغات تلقائيًا بعد بضع ساعات حتى تعكس الخريطة الوضع الحالي دائمًا. الرجاء الإبلاغ فقط عمّا يمكنكم تأكيده شخصيًا.",

    filter_all: "الكل",
    filter_out: "مقطوعة",
    filter_on: "عادت",
    table_area: "المنطقة",
    table_service: "الخدمة",
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
    sos_urgency_label: "ما مدى الإلحاح؟",
    sos_urgency_urgent: "🔴 عاجل — خلال ساعة",
    sos_urgency_normal: "🟡 غير عاجل الآن",
    sos_urgent_badge: "عاجل",
    sos_note_label: "ملاحظة اختيارية (تظهر للمساعدين — علامة مكانية تساعد)",
    sos_note_placeholder: "مثال: الطابق 3، باب أزرق، قرب الجامع الأزرق",
    sos_cancel: "إلغاء",
    sos_send: "إرسال الاستغاثة",

    sos_detail_messages: "الرسائل",
    sos_detail_no_messages: "لا توجد رسائل بعد.",
    sos_detail_mark_safe: "أنا بخير الآن",
    sos_detail_meta: "تم الإبلاغ {time} · {n} أشخاص تواصلوا",
    comment_placeholder: "اكتب رسالة خاصة…",
    comment_send: "إرسال",
    comment_delete: "حذف",

    sos_detail_helpers_title: "أشخاص تواصلوا",
    sos_no_helpers_yet: "لم يتواصل أحد بعد. سيظهر المساعدون هنا، كل واحد في محادثته الخاصة.",
    sos_thread_empty: "لا توجد رسائل بعد — قل مرحبًا واعرض مساعدتك. أنتما فقط من يرى هذه المحادثة.",
    sos_thread_back: "رجوع",
    sos_flag_tooltip: "الإبلاغ عن استغاثة وهمية",
    sos_flag_confirm: "هل تريد الإبلاغ عن هذه الاستغاثة كوهمية أو مسيئة؟ بعد عدة بلاغات يتم إخفاؤها من الخريطة. استخدم هذا فقط إذا كنت تعتقد أنها ليست حقيقية.",

    sos_checkin_prompt: "مرت بضع ساعات منذ إرسال هذه الاستغاثة.",
    sos_checkin_yes: "ما زلت بحاجة للمساعدة",

    toast_flag_sent: "تم الإبلاغ كوهمية. شكرًا لمساعدتنا في الحفاظ على الموثوقية.",
    toast_flag_already: "لقد أبلغت عن هذه الاستغاثة من قبل.",
    toast_checkin_ack: "شكرًا — لا تزال مُعلّمة كنشطة.",
    toast_sos_cooldown: "الرجاء الانتظار بضع دقائق قبل إرسال استغاثة أخرى.",

    search_confirm_title_prefix: "الإبلاغ عن هذا الموقع؟",
    search_confirm_sub: "أبلغ عن حالة الكهرباء الحالية في هذه المنطقة.",
    search_confirm_cancel: "إلغاء",
    search_confirm_out: "⚡ لا كهرباء",
    search_confirm_on: "✅ عادت الكهرباء",

    toast_report_out: "تم التسجيل: لا يوجد {service} في موقعك.",
    toast_report_on: "تم التسجيل: تأكيد عودة {service}.",
    toast_location_unavailable: "الموقع غير متاح — اضغط على الخريطة لتحديد المكان.",
    toast_report_placed: "تم إضافة البلاغ. شكرًا لمساعدتك في تحديث الخريطة!",
    toast_report_updated: "شكرًا — تم تحديث البلاغ.",
    toast_report_failed: "تعذّر إرسال البلاغ — تحقق من اتصالك.",
    toast_sos_sent: "تم إرسال الاستغاثة. يمكن للأشخاص القريبين الآن رؤية أنك قد تحتاج إلى مساعدة.",
    toast_sos_location_required: "الموقع مطلوب لإرسال استغاثة. الرجاء تفعيل الوصول إلى الموقع.",
    toast_safe_marked: "تم التأكيد بأنك بخير. تم إلغاء استغاثتك.",
    toast_message_sent: "تم إرسال الرسالة — سيراها الشخص.",
    toast_message_failed: "تعذّر إرسال الرسالة — تحقق من اتصالك.",
    toast_search_out: "تم التسجيل: لا يوجد {service} في {label}.",
    toast_search_on: "تم التسجيل: تأكيد عودة {service} في {label}.",

    status_no_power: "لا كهرباء",
    status_power_on: "الكهرباء متوفرة",
    status_no_water: "لا ماء",
    status_water_on: "الماء متوفر",

    time_just_now: "الآن",
    time_m_ago: "قبل {m} د",
    time_h_ago: "قبل {h} سا",

    search_no_matches: "لم يتم العثور على نتائج في تونس.",
    search_failed: "تعذّر البحث — تحقق من اتصالك.",
    search_searching: "جارٍ البحث…",

    popup_out_confirmed: "انقطاع {service} (مؤكد)",
    popup_out_unconfirmed: "انقطاع {service} (غير مؤكد)",
    popup_on: "تأكيد عودة {service}",
    popup_reports: "{out} بلاغ انقطاع · {on} بلاغ عودة · آخر تحديث {time}",
    popup_still_out: "لا تزال مقطوعة",
    popup_power_back: "رجعت",
    popup_remove_mine: "🗑 إزالة",
    toast_report_removed: "تم إزالة بلاغك من الخريطة.",

    feed_out_reported_power: "⚡ تم الإبلاغ عن انقطاع الكهرباء",
    feed_on_reported_power: "✅ تم الإبلاغ عن عودة الكهرباء",
    feed_out_reported_water: "💧 تم الإبلاغ عن انقطاع الماء",
    feed_on_reported_water: "✅ تم الإبلاغ عن عودة الماء"
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
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });
}
