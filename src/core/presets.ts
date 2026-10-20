import type { EventType, UiLang } from "./types";

/** Functions (sub-events) suggested for each event type. People can rename, add or remove them. */
export const PRESETS: Record<EventType, string[]> = {
  wedding: ["Haldi", "Mehendi", "Sangeet", "Wedding Ceremony", "Reception"],
  birthday: ["Birthday Party"],
  community: ["Setup & Decor", "Puja / Ceremony", "Community Meal", "Cultural Programme"],
  festival: ["Puja", "Celebration"],
};

/** Optional functions people often add, offered as one-tap chips in the wizard. */
export const EXTRA_FUNCTIONS: Record<EventType, string[]> = {
  wedding: ["Engagement", "Nalangu", "Pellikuthuru", "Baraat", "Cocktail Night"],
  birthday: ["Cake Cutting", "Puja", "Kids' Games"],
  community: ["Sports Day", "Blood Donation Camp", "Prize Distribution"],
  festival: ["Rangoli Contest", "Bhajan Sandhya", "Fireworks"],
};

export interface FunctionDefaults {
  /** Days relative to the main date. */
  dayOffset: number;
  start: string;
  /** Relative share of the function budget. */
  weight: number;
}

const KNOWN: Record<string, FunctionDefaults> = {
  engagement: { dayOffset: -30, start: "18:00", weight: 10 },
  haldi: { dayOffset: -2, start: "09:00", weight: 8 },
  nalangu: { dayOffset: -1, start: "10:00", weight: 6 },
  pellikuthuru: { dayOffset: -2, start: "09:00", weight: 6 },
  mehendi: { dayOffset: -2, start: "16:00", weight: 10 },
  sangeet: { dayOffset: -1, start: "19:00", weight: 16 },
  "cocktail night": { dayOffset: -1, start: "20:00", weight: 12 },
  baraat: { dayOffset: 0, start: "17:00", weight: 8 },
  "wedding ceremony": { dayOffset: 0, start: "07:00", weight: 40 },
  reception: { dayOffset: 0, start: "19:00", weight: 26 },
  "birthday party": { dayOffset: 0, start: "17:00", weight: 80 },
  "cake cutting": { dayOffset: 0, start: "19:00", weight: 10 },
  puja: { dayOffset: 0, start: "08:00", weight: 25 },
  "kids' games": { dayOffset: 0, start: "16:00", weight: 10 },
  "setup & decor": { dayOffset: -1, start: "10:00", weight: 25 },
  "puja / ceremony": { dayOffset: 0, start: "08:00", weight: 20 },
  "community meal": { dayOffset: 0, start: "12:30", weight: 35 },
  "cultural programme": { dayOffset: 0, start: "18:00", weight: 20 },
  celebration: { dayOffset: 0, start: "18:00", weight: 60 },
};

export const normaliseName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

type Translations = Record<Exclude<UiLang, "en">, string>;

/** Function names in the translated interface languages, keyed by the English name. */
const NAMES: Record<string, Translations> = {
  Haldi: { hi: "हल्दी", ta: "மஞ்சள் நீராட்டு", te: "పసుపు వేడుక" },
  Mehendi: { hi: "मेहंदी", ta: "மெஹந்தி", te: "మెహందీ" },
  Sangeet: { hi: "संगीत", ta: "சங்கீத்", te: "సంగీత్" },
  "Wedding Ceremony": { hi: "विवाह संस्कार", ta: "திருமணச் சடங்கு", te: "పెళ్లి వేడుక" },
  Reception: { hi: "रिसेप्शन", ta: "வரவேற்பு", te: "రిసెప్షన్" },
  "Birthday Party": { hi: "जन्मदिन पार्टी", ta: "பிறந்தநாள் விழா", te: "పుట్టినరోజు వేడుక" },
  "Setup & Decor": { hi: "सजावट व तैयारी", ta: "அமைப்பு & அலங்காரம்", te: "ఏర్పాట్లు & అలంకరణ" },
  "Puja / Ceremony": { hi: "पूजा / अनुष्ठान", ta: "பூஜை / விழா", te: "పూజ / వేడుక" },
  "Community Meal": { hi: "सामूहिक भोज", ta: "சமூக விருந்து", te: "సామూహిక భోజనం" },
  "Cultural Programme": {
    hi: "सांस्कृतिक कार्यक्रम",
    ta: "கலை நிகழ்ச்சி",
    te: "సాంస్కృతిక కార్యక్రమం",
  },
  Puja: { hi: "पूजा", ta: "பூஜை", te: "పూజ" },
  Celebration: { hi: "उत्सव", ta: "கொண்டாட்டம்", te: "సంబరం" },
  Engagement: { hi: "सगाई", ta: "நிச்சயதார்த்தம்", te: "నిశ్చితార్థం" },
  Nalangu: { hi: "नलंगु", ta: "நலங்கு", te: "నలుగు" },
  Pellikuthuru: { hi: "पेल्लीकूतुरु", ta: "பெள்ளிக்கூத்துரு", te: "పెళ్లికూతురు" },
  Baraat: { hi: "बारात", ta: "பாராத்", te: "బారాత్" },
  "Cocktail Night": { hi: "कॉकटेल नाइट", ta: "காக்டெய்ல் இரவு", te: "కాక్‌టెయిల్ నైట్" },
  "Cake Cutting": { hi: "केक कटिंग", ta: "கேக் வெட்டுதல்", te: "కేక్ కటింగ్" },
  "Kids' Games": { hi: "बच्चों के खेल", ta: "குழந்தைகள் விளையாட்டு", te: "పిల్లల ఆటలు" },
  "Sports Day": { hi: "खेल दिवस", ta: "விளையாட்டு நாள்", te: "క్రీడా దినోత్సవం" },
  "Blood Donation Camp": { hi: "रक्तदान शिविर", ta: "இரத்த தான முகாம்", te: "రక్తదాన శిబిరం" },
  "Prize Distribution": { hi: "पुरस्कार वितरण", ta: "பரிசளிப்பு", te: "బహుమతి ప్రదానం" },
  "Rangoli Contest": { hi: "रंगोली प्रतियोगिता", ta: "கோலப் போட்டி", te: "ముగ్గుల పోటీ" },
  "Bhajan Sandhya": { hi: "भजन संध्या", ta: "பஜனை", te: "భజన సంధ్య" },
  Fireworks: { hi: "आतिशबाज़ी", ta: "பட்டாசு", te: "బాణసంచా" },
};

const ALIASES = new Map<string, string>(
  Object.entries(NAMES).flatMap(([english, t]) => [
    [normaliseName(english), english],
    ...Object.values(t).map((name) => [normaliseName(name), english] as [string, string]),
  ]),
);

/** The English name of a known function, whichever language it was written in. */
export function canonicalFunction(name: string): string | undefined {
  return ALIASES.get(normaliseName(name));
}

export function localiseFunction(english: string, lang: UiLang): string {
  return lang === "en" ? english : (NAMES[english]?.[lang] ?? english);
}

export function presetFunctions(type: EventType, lang: UiLang): string[] {
  return PRESETS[type].map((name) => localiseFunction(name, lang));
}

export function extraFunctions(type: EventType, lang: UiLang): string[] {
  return EXTRA_FUNCTIONS[type].map((name) => localiseFunction(name, lang));
}

export function functionDefaults(name: string): FunctionDefaults {
  const english = canonicalFunction(name) ?? name;
  return KNOWN[normaliseName(english)] ?? { dayOffset: 0, start: "18:00", weight: 15 };
}
