import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "hi" | "mr" | "gu" | "ta" | "bn" | "kn" | "te" | "ml" | "pa";

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം" },
  { code: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ" },
];

export interface TranslationDictionary {
  // Brand & Shell
  brandTagline: string;
  all: string;
  build: string;
  renovate: string;
  fix: string;
  search: string;
  pricing: string;
  proDashboard: string;
  becomeAPro: string;
  myProjects: string;
  shortlist: string;
  account: string;
  logout: string;
  loginOrSignup: string;
  helpCentre: string;
  switchLanguage: string;

  // Search Bar
  whatService: string;
  selectService: string;
  when: string;
  anytime: string;
  where: string;
  anywhere: string;
  useCurrentLocation: string;
  popularAreas: string;

  // Hero & AI
  heroTitle: string;
  heroSubtitle: string;
  aiPromptPlaceholder: string;
  analyse: string;
  notSureTitle: string;
  notSureDesc: string;

  // Before & After
  beforeAfterTitle: string;
  beforeAfterSubtitle: string;
  before: string;
  after: string;

  // Trust & Proof
  trustMetricsTitle: string;
  verifiedProsCount: string;
  homesServiced: string;
  avgRating: string;
  escrowGuaranteed: string;

  // Trades
  carpentry: string;
  plumbing: string;
  electrical: string;
  painting: string;
  masonry: string;
  appliances: string;
  waterproofing: string;
  flooring: string;
  falseCeiling: string;
  smartHome: string;
  pestControl: string;
  labour: string;

  // Common CTAs
  requestQuote: string;
  viewProfile: string;
  startingPrice: string;
  shareWhatsApp: string;
}

const enTranslations: TranslationDictionary = {
  brandTagline: "Home projects, made clear",
  all: "All",
  build: "Build",
  renovate: "Renovate",
  fix: "Fix",
  search: "Search",
  pricing: "Pricing",
  proDashboard: "Pro dashboard",
  becomeAPro: "Become a pro",
  myProjects: "My projects",
  shortlist: "Shortlist",
  account: "Account",
  logout: "Log out",
  loginOrSignup: "Log in or sign up",
  helpCentre: "Help Centre",
  switchLanguage: "हिन्दी",

  whatService: "Service",
  selectService: "Select a service",
  when: "When",
  anytime: "Any time",
  where: "Where",
  anywhere: "Anywhere in Mumbai",
  useCurrentLocation: "Use current location",
  popularAreas: "Popular neighbourhoods",

  heroTitle: "Tell us what your home needs",
  heroSubtitle: "Turn any home idea or repair into a clear brief and meet trusted professionals near you.",
  aiPromptPlaceholder: "e.g. My bathroom tap is leaking and water pressure is low…",
  analyse: "Analyse",
  notSureTitle: "Not sure what you need?",
  notSureDesc: "Describe your issue in your own words, and AI will prepare a complete project brief.",

  beforeAfterTitle: "Crafted transformations",
  beforeAfterSubtitle: "Real home renovations executed by verified Karighars in Mumbai.",
  before: "Before",
  after: "After",

  trustMetricsTitle: "Trusted across Mumbai",
  verifiedProsCount: "1,200+ Verified Karighars",
  homesServiced: "18,000+ Homes Completed",
  avgRating: "4.9★ Average Rating",
  escrowGuaranteed: "100% SafePay Escrow",

  carpentry: "Carpentry & custom furniture",
  plumbing: "Plumbing repair & installation",
  electrical: "Electrical repair & installation",
  painting: "Painting & wall finishing",
  masonry: "Masonry & plastering",
  appliances: "AC & appliance repair",
  waterproofing: "Waterproofing",
  flooring: "Tiling & flooring",
  falseCeiling: "False ceiling & POP work",
  smartHome: "Home automation & smart locks",
  pestControl: "Pest control",
  labour: "General labour / helper",

  requestQuote: "Request a Quote",
  viewProfile: "View profile",
  startingPrice: "starting",
  shareWhatsApp: "Chat on WhatsApp",
};

const translations: Record<Language, TranslationDictionary> = {
  en: enTranslations,
  hi: {
    brandTagline: "घर का काम, भरोसे के साथ",
    all: "सभी",
    build: "नया बनाएं",
    renovate: "नवीनीकरण",
    fix: "मरम्मत",
    search: "खोजें",
    pricing: "प्लान्स",
    proDashboard: "कारीगर डैशबोर्ड",
    becomeAPro: "कारीगर बनें",
    myProjects: "मेरे प्रोजेक्ट",
    shortlist: "पसंदीदा",
    account: "खाता",
    logout: "लॉग आउट",
    loginOrSignup: "लॉग इन / साइन अप",
    helpCentre: "सहायता केंद्र",
    switchLanguage: "English",

    whatService: "सेवा चुनें",
    selectService: "सेवा का चयन करें",
    when: "कब चाहिए",
    anytime: "किसी भी दिन",
    where: "कहाँ",
    anywhere: "मुंबई में कहीं भी",
    useCurrentLocation: "मेरी वर्तमान लोकेशन",
    popularAreas: "प्रमुख इलाके",

    heroTitle: "बताएं आपके घर को क्या चाहिए",
    heroSubtitle: "अपने घर की मरम्मत या प्रोजेक्ट को आसान बनाएं — अपने पास के भरोसेमंद कारीगरों से जुड़ें।",
    aiPromptPlaceholder: "उदा. बाथरूम का नल टपक रहा है और पानी का प्रेशर कम है…",
    analyse: "जांचें",
    notSureTitle: "समझ नहीं आ रहा क्या चाहिए?",
    notSureDesc: "अपनी भाषा में समस्या लिखें, हमारा AI आपके लिए पूरा प्रोजेक्ट ब्रीफ तैयार कर देगा।",

    beforeAfterTitle: "शानदार बदलाव",
    beforeAfterSubtitle: "मुंबई में सत्यापित कारीगरों द्वारा किए गए वास्तविक प्रोजेक्ट्स।",
    before: "पहले",
    after: "बाद में",

    trustMetricsTitle: "मुंबई भर में भरोसेमंद",
    verifiedProsCount: "1,200+ सत्यापित कारीगर",
    homesServiced: "18,000+ घर संवारे गए",
    avgRating: "4.9★ औसत रेटिंग",
    escrowGuaranteed: "100% सेफपे गारंटी",

    carpentry: "बढ़ई और फर्नीचर कार्य",
    plumbing: "प्लंबिंग मरम्मत और फिटिंग",
    electrical: "इलेक्ट्रिकल मरम्मत और वायरिंग",
    painting: "पेंटिंग और वॉल फिनिशिंग",
    masonry: "राजमिस्त्री और प्लास्टर",
    appliances: "एसी और उपकरण मरम्मत",
    waterproofing: "वाटरप्रूफिंग",
    flooring: "टाइलिंग और फ्लोरिंग",
    falseCeiling: "फॉल्स सीलिंग और पीओपी",
    smartHome: "स्मार्ट होम और ताले",
    pestControl: "पेस्ट कंट्रोल",
    labour: "जनरल लेबर / हेल्पर",

    requestQuote: "कोटेशन मांगें",
    viewProfile: "प्रोफ़ाइल देखें",
    startingPrice: "शुरुआती दर",
    shareWhatsApp: "व्हाट्सएप पर बात करें",
  },
  mr: {
    
    brandTagline: "घराचे काम, सोपे आणि विश्वासू",
    all: "सर्व",
    build: "बांधकाम",
    renovate: "नूतनीकरण",
    fix: "दुरुस्ती",
    search: "शोधा",
    pricing: "दर",
    proDashboard: "कारागीर डॅशबोर्ड",
    becomeAPro: "कारागीर बना",
    myProjects: "माझे प्रकल्प",
    shortlist: "जतन केलेले",
    account: "खाते",
    logout: "बाहेर पडा",
    loginOrSignup: "साइन इन / नोंदणी",
    helpCentre: "मदत केंद्र",
    switchLanguage: "भाषा बदला",
    whatService: "कोणती सेवा हवी?",
    selectService: "सेवा निवडा",
    when: "कधी",
    anytime: "कधीही",
    where: "कुठे",
    anywhere: "मुंबईत कुठेही",
    useCurrentLocation: "वर्तमान ठिकाण वापरा",
    popularAreas: "लोकप्रिय भाग",
    heroTitle: "तुमच्या घरासाठी विश्वासू कारागीर",
    heroSubtitle: "प्लंबिंग, सुतारकाम, इलेक्ट्रिकल आणि रंगकाम — प्रमाणित तज्ज्ञ तुमच्या दारात.",
    aiPromptPlaceholder: "उदा. किचनचा नळ गळतोय किंवा वॉर्डरोब बनवायचा आहे…",
    analyse: "तपासा",
    notSureTitle: "काय हवे ते नीट माहित नाही?",
    notSureDesc: "तुमची समस्या थोडक्यात सांगा, आमचे AI कामाचा अंदाज व कारागीर शोधून देईल.",
    beforeAfterTitle: "प्रत्यक्ष कामाचे परिणाम",
    beforeAfterSubtitle: "आमच्या कारागिरांनी घरांचे केलेले सुंदर रूपांतर पाहा.",
    before: "आधी",
    after: "नंतर",
    trustMetricsTitle: "आमची हमी",
    verifiedProsCount: "१,२००+ प्रमाणित कारागीर",
    homesServiced: "१८,०००+ पूर्ण झालेली घरे",
    avgRating: "४.९★ सरासरी रेटिंग",
    escrowGuaranteed: "१००% सेफपे एस्क्रो सुरक्षित",
    carpentry: "सुतारकाम आणि फर्निचर",
    plumbing: "प्लंबिंग दुरुस्ती",
    electrical: "इलेक्ट्रिकल दुरुस्ती",
    painting: "रंगकाम",
    masonry: "गवंडी काम",
    appliances: "उपकरण दुरुस्ती",
    waterproofing: "वॉटरप्रूफिंग",
    flooring: "टायलिंग आणि फ्लोअरिंग",
    falseCeiling: "फॉल्स सीलिंग",
    smartHome: "स्मार्ट होम आणि लॉक",
    pestControl: "कीटक नियंत्रण",
    labour: "मजूर / मदतनीस",
    requestQuote: "दरपत्रक मागा",
    viewProfile: "प्रोफाइल पाहा",
    startingPrice: "किमान दर",
    shareWhatsApp: "व्हॉट्सॲपवर संपर्क करा",
  },
  gu: {
    
    brandTagline: "ઘરનું કામ, સરળ અને વિશ્વસનીય",
    all: "બધું",
    build: "બાંધકામ",
    renovate: "નવીનીકરણ",
    fix: "સમારકામ",
    search: "શોધો",
    pricing: "કિંમતો",
    proDashboard: "કારીગર ડેશબોર્ડ",
    becomeAPro: "કારીગર બનો",
    myProjects: "મારા પ્રોજેક્ટ્સ",
    shortlist: "સાચવેલ",
    account: "ખાતું",
    logout: "લૉગ આઉટ",
    loginOrSignup: "સાઇન ઇન / નોંધણી",
    helpCentre: "મદદ કેન્દ્ર",
    switchLanguage: "ભાષા બદલો",
    whatService: "કઈ સેવા જોઈએ છે?",
    selectService: "સેવા પસંદ કરો",
    when: "ક્યારે",
    anytime: "ગમે ત્યારે",
    where: "ક્યાં",
    anywhere: "મુંબઈમાં ગમે ત્યાં",
    useCurrentLocation: "હાલનું સ્થાન વાપરો",
    popularAreas: "લોકપ્રિય વિસ્તારો",
    heroTitle: "તમારા ઘર માટે શ્રેષ્ઠ કારીગર",
    heroSubtitle: "પ્લમ્બિંગ, સુથારીકામ, ઇલેક્ટ્રિકલ અને કલરકામ — ચકાસાયેલ નિષ્ણાતો.",
    aiPromptPlaceholder: "દા.ત. રસોડાનો નળ લીક થાય છે અથવા કબાટ બનાવવો છે…",
    analyse: "વિશ્લેષણ",
    notSureTitle: "ખાતરી નથી કે શું જોઈએ છે?",
    notSureDesc: "તમારી સમસ્યા જણાવો, AI કામ અને કારીગર સૂચવશે.",
    beforeAfterTitle: "વાસ્તવિક પરિવર્તન",
    beforeAfterSubtitle: "કારીગરો દ્વારા કરેલા કામનું પરિણામ જુઓ.",
    before: "પહેલાં",
    after: "પછી",
    trustMetricsTitle: "અમારો વિશ્વાસ",
    verifiedProsCount: "૧,૨૦૦+ પ્રમાણિત કારીગરો",
    homesServiced: "૧૮,૦૦૦+ સંતોષકારક ઘરો",
    avgRating: "૪.૯★ સરેરાશ રેટિંગ",
    escrowGuaranteed: "૧૦૦% સેફપે સુરક્ષા",
    carpentry: "સુથારીકામ",
    plumbing: "પ્લમ્બિંગ કામ",
    electrical: "ઇલેક્ટ્રિકલ કામ",
    painting: "કલરકામ",
    masonry: "કડિયાકામ",
    appliances: "ઉપકરણ સમારકામ",
    waterproofing: "વોટરપ્રૂફિંગ",
    flooring: "ટાઇલિંગ",
    falseCeiling: "ફોલ્સ સીલિંગ",
    smartHome: "સ્માર્ટ લોક્સ",
    pestControl: "પેસ્ટ કંટ્રોલ",
    labour: "મજૂર / હેલ્પર",
    requestQuote: "ભાવપત્રક મેળવો",
    viewProfile: "પ્રોફાઇલ જુઓ",
    startingPrice: "પ્રારંભિક કિંમત",
    shareWhatsApp: "વ્હોટ્સએપ પર વાત કરો",
  },
  ta: {
    ...enTranslations,
    brandTagline: "வீட்டு வேலைகள், எளிமையாகவும் நம்பிக்கையுடனும்",
    all: "அனைத்தும்",
    build: "கட்டுமானம்",
    renovate: "புதுப்பித்தல்",
    fix: "பழுதுபார்த்தல்",
    search: "தேடுங்கள்",
    pricing: "கட்டணங்கள்",
    proDashboard: "தொழில்முறை பலகை",
    becomeAPro: "தொழில்முறை நிபுணராகுங்கள்",
    myProjects: "என் திட்டங்கள்",
    shortlist: "சேமிக்கப்பட்டவை",
    account: "கணக்கு",
    logout: "வெளியேறு",
    loginOrSignup: "உள்நுழைக / பதிவுசெய்க",
    helpCentre: "உதவி மையம்",
    switchLanguage: "மொழி மாற்றம்",
    whatService: "என்ன சேவை தேவை?",
    selectService: "சேவையைத் தேர்ந்தெடுக்கவும்",
    when: "எப்போது",
    anytime: "எப்போது வேண்டுமானாலும்",
    where: "எங்கே",
    anywhere: "மும்பையில் எங்கும்",
    heroTitle: "உங்கள் வீட்டிற்கான நம்பகமான கைவினைஞர்கள்",
    heroSubtitle: "பிளம்பிங், தச்சு வேலை, மின் வேலை மற்றும் பெயிண்டிங்.",
    aiPromptPlaceholder: "எ.கா. குழாய் கசிவு அல்லது அலமாரி அமைத்தல்...",
    analyse: "ஆராய்க",
    notSureTitle: "சரியான சேவை தெரியவில்லையா?",
    notSureDesc: "உங்கள் தேவையை விவரியுங்கள், AI மதிப்பிட்டு உதவும்.",
    beforeAfterTitle: "நேரடி வேலை மாற்றங்கள்",
    beforeAfterSubtitle: "எங்கள் கைவினைஞர்களின் நேரடி வீட்டு மாற்றங்களை பாருங்கள்.",
    before: "முன்பு",
    after: "பின்பு",
    trustMetricsTitle: "நம்பகத்தன்மை",
    verifiedProsCount: "1,200+ சரிபார்க்கப்பட்ட கைவினைஞர்கள்",
    homesServiced: "18,000+ முடிக்கப்பட்ட வீடுகள்",
    avgRating: "4.9★ சராசரி மதிப்பீடு",
    escrowGuaranteed: "100% பாதுகாப்பான SafePay",
    requestQuote: "மதிப்பீடு கோருங்கள்",
    viewProfile: "சுயவிவரம் பார்க்க",
    startingPrice: "தொடக்க விலை",
    shareWhatsApp: "வாட்ஸ்அப் அரட்டை",
  },
  bn: {
    ...enTranslations,
    brandTagline: "ঘরের কাজ, সহজে এবং বিশ্বস্তভাবে",
    all: "সব",
    build: "নির্মাণ",
    renovate: "সংস্কার",
    fix: "মেরামত",
    search: "অনুসন্ধান",
    pricing: "মূল্য তালিকা",
    proDashboard: "কারিগর ড্যাশবোর্ড",
    becomeAPro: "কারিগর হিসেবে যোগ দিন",
    myProjects: "আমার প্রকল্পসমূহ",
    shortlist: "সংরক্ষিত তালিকা",
    account: "অ্যাকাউন্ট",
    logout: "লগআউট",
    loginOrSignup: "সাইন ইন / নিবন্ধন",
    helpCentre: "সাহায্য কেন্দ্র",
    switchLanguage: "ভাষা পরিবর্তন করুন",
    whatService: "কোন পরিষেবা প্রয়োজন?",
    selectService: "পরিষেবা নির্বাচন করুন",
    when: "কখন",
    anytime: "যেকোনো সময়",
    where: "কোথায়",
    anywhere: "মুম্বাইয়ের যেকোনো স্থানে",
    heroTitle: "আপনার ঘরের জন্য বিশ্বস্ত কারিগর",
    heroSubtitle: "প্লাম্বিং, ছুতার কাজ, ইলেকট্রিক্যাল ও পেইন্টিং বিশেষজ্ঞ।",
    aiPromptPlaceholder: "যেমন: বাথরুমের পাইপ লিক বা আলমারি তৈরি…",
    analyse: "বিশ্লেষণ",
    notSureTitle: "কোন কাজ লাগবে নিশ্চিত নন?",
    notSureDesc: "সমস্যাটি লিখুন, আমাদের AI উপযুক্ত কারিগর খুঁজে দেবে।",
    beforeAfterTitle: "কাজের বাস্তব রূপান্তর",
    beforeAfterSubtitle: "কারিগরদের হাতে নতুন রূপ পাওয়া ঘরের ছবি দেখুন।",
    before: "আগে",
    after: "পরে",
    trustMetricsTitle: "বিশ্বস্ততা",
    verifiedProsCount: "১,২০০+ যাচাইকৃত কারিগর",
    homesServiced: "১৮,০০০+ সম্পন্ন কাজ",
    avgRating: "৪.৯★ গড় রেটিং",
    escrowGuaranteed: "১০০% SafePay সুরক্ষিত",
    requestQuote: "কোটেশন চান",
    viewProfile: "প্রোফাইল দেখুন",
    startingPrice: "শুরুর মূল্য",
    shareWhatsApp: "হোয়াটসঅ্যাপে চ্যাট করুন",
  },
  kn: {
    ...enTranslations,
    brandTagline: "ಮನೆ ಕಾಮಗಾರಿಗಳು, ಸರಳ ಹಾಗೂ ಸ್ಪಷ್ಟ",
    switchLanguage: "ಕನ್ನಡ",
  },
  te: {
    ...enTranslations,
    brandTagline: "ఇంటి పనులు, సులభం మరియు నమ్మకం",
    switchLanguage: "తెలుగు",
  },
  ml: {
    ...enTranslations,
    brandTagline: "വീട്ടു ജോലികൾ, സുതാര്യവും വിശ്വസനീയവും",
    switchLanguage: "മലയാളം",
  },
  pa: {
    ...enTranslations,
    brandTagline: "ਘਰ ਦੇ ਕੰਮ, ਸੌਖੇ ਅਤੇ ਭਰੋਸੇਮੰਦ",
    switchLanguage: "ਪੰਜਾਬੀ",
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: TranslationDictionary;
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: translations.en,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("karighar-lang") as Language;
    if (["en", "hi", "mr", "gu", "ta", "bn", "kn", "te", "ml", "pa"].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("karighar-lang", lang);
  };

  const toggleLanguage = () => {
    const next = language === "en" ? "hi" : "en";
    setLanguage(next);
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t: translations[language],
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
