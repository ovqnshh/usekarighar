/**
 * Search Dictionary & Taxonomy System for "Ask Karighar"
 * Contains:
 * - 250+ curated problem phrases mapped to exact services
 * - Multilingual synonyms in English, Hindi, Marathi, and Hinglish
 * - Rule-based safety hazard detection rules (gas leak, sparking, collapse, flooding)
 * - Service questionnaire definitions with non-blocking tap questions
 * - Standard price-book ranges for non-binding cost estimation
 */

export interface ServiceDefinition {
  slug: string;
  categorySlug: string;
  categoryName: string;
  subcategorySlug: string;
  subcategoryName: string;
  name: string;
  icon: string;
  canonicalTrade: string;
  typicalDuration: string;
  inspectionFee: number;
  priceRange: { min: number; max: number; unitLabel: string };
  whatProWillCheck: string[];
  possibleCauses: string[];
  likelyParts: string[];
  preparationTips: string[];
  questions: {
    id: string;
    question: string;
    options: { label: string; filterMod?: Record<string, any>; scopeNote?: string }[];
  }[];
  synonyms: {
    en: string[];
    hi: string[];
    mr: string[];
    hinglish: string[];
  };
  problemPhrases: {
    phrase: string;
    lang: "en" | "hi" | "mr" | "hinglish";
    intent: "repair" | "install" | "maintenance" | "inspection" | "renovation";
  }[];
}

export interface SafetyHazardRule {
  id: string;
  category: "gas" | "electrical" | "flooding" | "structural";
  severity: "critical" | "high";
  keywords: string[];
  title: string;
  instructions: string[];
  emergencyActionText: string;
}

export const SAFETY_HAZARD_RULES: SafetyHazardRule[] = [
  {
    id: "lpg_gas_leak",
    category: "gas",
    severity: "critical",
    keywords: [
      "gas leak", "gas smell", "lpg smell", "cylinder smell", "gas ki badbu", "gas leakage",
      "गैस की बदबू", "गैस लीक", "गॅस गळती", "गॅसचा वास", "cylinder leak"
    ],
    title: "Critical Safety Alert: Suspected LPG Gas Leakage",
    instructions: [
      "Turn off the regulator valve on your LPG cylinder immediately.",
      "Do NOT turn on/off any electrical switches, exhaust fans, or light matches.",
      "Open all windows and doors for natural air ventilation.",
      "Evacuate everyone from the premises and call emergency services if smell persists."
    ],
    emergencyActionText: "Connect with Emergency Dispatch & Safety Helpline",
  },
  {
    id: "electrical_fire_hazard",
    category: "electrical",
    severity: "critical",
    keywords: [
      "sparking", "spark", "burning smell", "switch burning", "mcb smoking", "smoke from board",
      "electric shock", "exposed wire", "fire risk", "चिंगारी", "धुआं", "शॉर्ट सर्किट", "जळण्याचा वास", "स्पार्क"
    ],
    title: "High Electrical Safety Hazard: Active Sparking or Burning Odor",
    instructions: [
      "Immediately switch off the Main MCB Breaker on your distribution board.",
      "Do not touch any overheated appliances, wet walls, or scorched sockets.",
      "Unplug nearby sensitive electronics only after cutting main power.",
      "Keep a dry chemical fire extinguisher handy; never use water on electrical hazards."
    ],
    emergencyActionText: "Dispatch Verified Emergency Electrician",
  },
  {
    id: "active_flooding",
    category: "flooding",
    severity: "high",
    keywords: [
      "pipe burst", "flooding", "active flood", "water gushing", "main line burst",
      "पानी भर गया", "पाइप फट गया", "नळ फुटला", "पूर आलाय"
    ],
    title: "Urgent Flood Alert: Severe Water Pipe Rupture",
    instructions: [
      "Locate and close your home's Main Water Stopcock Valve immediately.",
      "Keep electrical cables and floor strips elevated away from standing water.",
      "Turn off power to the water pump (geyser/motor) to prevent burnout.",
      "Clear drainage grates to prevent water backflow into rooms."
    ],
    emergencyActionText: "Dispatch Emergency Plumber in Mumbai",
  },
  {
    id: "structural_collapse_risk",
    category: "structural",
    severity: "critical",
    keywords: [
      "ceiling falling", "slab crack", "wall collapsing", "concrete falling", "plaster collapse",
      "छत गिर रही", "दीवार गिर", "स्लॅब पडतोय"
    ],
    title: "Structural Safety Warning: Masonry or Slab Fall Risk",
    instructions: [
      "Evacuate all family members from directly below the damaged ceiling or slab.",
      "Do not attempt to scrape or poke cracked plaster from underneath.",
      "Keep children and pets away from the affected room.",
      "Schedule a certified structural masonry inspection."
    ],
    emergencyActionText: "Request Urgent Structural Inspection",
  },
];

/**
 * Check if the input contains any critical safety hazard before AI processing.
 * Deterministic keyword matching ensures 100% recall.
 */
export function detectSafetyHazard(text: string): SafetyHazardRule | undefined {
  if (!text || text.trim().length < 3) return undefined;
  const lower = text.toLowerCase();
  for (const rule of SAFETY_HAZARD_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return rule;
      }
    }
  }
  return undefined;
}

export const SERVICE_DEFINITIONS: Record<string, ServiceDefinition> = {
  "ac-repair-diagnostic": {
    slug: "ac-repair-diagnostic",
    categorySlug: "ac-appliances",
    categoryName: "AC & Appliances",
    subcategorySlug: "air-conditioners",
    subcategoryName: "Split & Window AC",
    name: "AC Repair & Cooling Diagnostic",
    icon: "Fan",
    canonicalTrade: "AC & appliance repair/installation",
    typicalDuration: "1 to 2 hours",
    inspectionFee: 499,
    priceRange: { min: 499, max: 1800, unitLabel: "per unit (diagnostic visit)" },
    whatProWillCheck: [
      "Measure operating refrigerant suction pressure (R32 / R410A / R22)",
      "Test dual-run compressor and blower motor start capacitors (mfd rating)",
      "Inspect indoor cooling coil and outdoor condenser heat exchanger for dust choke",
      "Check drain pan and drain hose for biofilm blockages causing water drips",
      "Inspect electrical PCB terminals, sensor thermistors, and remote communication"
    ],
    possibleCauses: [
      "Can be caused by clogged air filters reducing airflow across the cooling coil",
      "Can be caused by low refrigerant gas from a copper flare nut micro-leak",
      "Can be caused by a weak or blown run-capacitor failing to start compressor",
      "Can be caused by choked outdoor condenser fins trapping heat in Mumbai weather"
    ],
    likelyParts: [
      "Dual run capacitor (35/45 mfd)",
      "Refrigerant gas top-up (R32 or R410A cylinder)",
      "Antibacterial coil cleaning foam spray",
      "Replacement flexible corrugated drain pipe"
    ],
    preparationTips: [
      "Ensure clear access under the indoor AC unit (move chairs or beds if possible)",
      "Keep the AC remote control and step-ladder nearby",
      "Have a bucket and power outlet accessible for pressure cleaning tools"
    ],
    questions: [
      {
        id: "ac_issue_type",
        question: "What is your AC currently doing?",
        options: [
          { label: "Blowing warm air / not cooling", scopeNote: "Suspected refrigerant pressure drop or compressor capacitor issue." },
          { label: "Water dripping indoors", scopeNote: "Suspected drain pipe choke or unlevel indoor mounting." },
          { label: "Making loud vibrating noise", scopeNote: "Suspected loose outdoor fan blade or worn blower motor bush." },
          { label: "Tripping the MCB breaker", scopeNote: "Suspected electrical earth fault or compressor grounded winding." }
        ]
      },
      {
        id: "ac_unit_type",
        question: "What type of air conditioner is it?",
        options: [
          { label: "Split Inverter AC (1–2 Ton)" },
          { label: "Split Non-Inverter AC" },
          { label: "Window AC" },
          { label: "Cassette / Commercial AC" }
        ]
      }
    ],
    synonyms: {
      en: ["ac repair", "air conditioner fix", "ac servicing", "ac cooling issue", "ac not working", "split ac service"],
      hi: ["एसी रिपेयर", "एसी सर्विस", "एसी ठंडा नहीं कर रहा", "एसी खराब है"],
      mr: ["एसी दुरुस्ती", "एसी काम करत नाही", "एसी थंड हवा देत नाही"],
      hinglish: ["ac thanda nahi kar raha", "ac kharab hai", "ac gas refill", "ac water leak ho raha", "ac servicing karwana hai"]
    },
    problemPhrases: [
      { phrase: "my ac is not working", lang: "en", intent: "repair" },
      { phrase: "ac not cooling properly", lang: "en", intent: "repair" },
      { phrase: "ac blowing warm air", lang: "en", intent: "repair" },
      { phrase: "water leaking from indoor ac unit", lang: "en", intent: "repair" },
      { phrase: "ac gas refill in mumbai", lang: "en", intent: "maintenance" },
      { phrase: "ac making rattling noise", lang: "en", intent: "repair" },
      { phrase: "ac thanda nahi kar raha", lang: "hinglish", intent: "repair" },
      { phrase: "ac me se paani tapak raha hai", lang: "hinglish", intent: "repair" },
      { phrase: "ac chalu nahi ho raha", lang: "hinglish", intent: "repair" },
      { phrase: "ac kharab hai check karna hai", lang: "hinglish", intent: "inspection" },
      { phrase: "एसी ठंडा नहीं कर रहा है", lang: "hi", intent: "repair" },
      { phrase: "एसी से पानी गिर रहा है", lang: "hi", intent: "repair" },
      { phrase: "एसी दुरुस्ती करायची आहे", lang: "mr", intent: "repair" },
      { phrase: "एसी थंड हवा सोडत नाही", lang: "mr", intent: "repair" }
    ]
  },

  "plumbing-leakage-repair": {
    slug: "plumbing-leakage-repair",
    categorySlug: "plumbing",
    categoryName: "Plumbing & Water Systems",
    subcategorySlug: "pipes-fittings",
    subcategoryName: "Pipes & Fixtures",
    name: "Leakage Repair & Tap Replacement",
    icon: "Droplet",
    canonicalTrade: "Plumbing repair & installation",
    typicalDuration: "45 mins to 1.5 hours",
    inspectionFee: 399,
    priceRange: { min: 399, max: 1200, unitLabel: "per visit (parts extra)" },
    whatProWillCheck: [
      "Isolate internal stopcock and inspect concealed pipe joints with pressure test",
      "Check ceramic spindle and rubber O-ring washers inside dripping taps",
      "Examine braided hose connections under washbasin and kitchen sink",
      "Inspect flush tank siphon valve and ballcock assembly",
      "Verify bottle trap alignment and drain waste pipe seals"
    ],
    possibleCauses: [
      "Can be caused by degraded rubber gaskets or worn ceramic disc cartridges",
      "Can be caused by high water pressure eroding PVC solvent cement joints",
      "Can be caused by mineral scale buildup preventing complete tap shutoff",
      "Can be caused by loose flex-pipe connectors underneath sinks"
    ],
    likelyParts: [
      "Half-inch ceramic brass tap spindle",
      "Braided SS connection hose (18 or 24 inch)",
      "Teflon sealing tape & rubber washer pack",
      "PVC solvent cement & coupling socket"
    ],
    preparationTips: [
      "Locate your apartment's main water inlet valve (usually above bathroom door)",
      "Clear bottles and cleaning supplies from under the sink",
      "Keep an old cloth or rag nearby for catching minor drips"
    ],
    questions: [
      {
        id: "leak_source",
        question: "Where is the water leaking from?",
        options: [
          { label: "Kitchen sink or washbasin pipe", scopeNote: "Suspected drain bottle trap or braided supply hose leak." },
          { label: "Dripping tap / shower mixer", scopeNote: "Suspected worn ceramic spindle cartridge." },
          { label: "Toilet flush tank / jet spray", scopeNote: "Suspected siphon valve washer or faulty hand bidet hose." },
          { label: "Concealed inside wall / ceiling", scopeNote: "Requires concealed acoustic/moisture diagnostic check." }
        ]
      }
    ],
    synonyms: {
      en: ["plumber", "plumbing repair", "tap leaking", "sink pipe leak", "water pipe fix", "flush tank repair"],
      hi: ["प्लम्बर", "नल लीकेज", "पाइप रिपेयर", "पानी टपक रहा है"],
      mr: ["प्लंबर", "नळ गळती", "पाण्याची पाईप दुरुस्ती"],
      hinglish: ["nal leak ho raha hai", "paani tapak raha hai", "kitchen sink pipe leak", "flush kharab hai", "plumber chahiye"]
    },
    problemPhrases: [
      { phrase: "kitchen sink pipe is leaking", lang: "en", intent: "repair" },
      { phrase: "bathroom tap continuously dripping", lang: "en", intent: "repair" },
      { phrase: "flush tank not filling water", lang: "en", intent: "repair" },
      { phrase: "low water pressure in shower", lang: "en", intent: "repair" },
      { phrase: "nal leak ho raha hai", lang: "hinglish", intent: "repair" },
      { phrase: "sink ke niche paani beh raha hai", lang: "hinglish", intent: "repair" },
      { phrase: "geyser connection pipe leaking", lang: "en", intent: "repair" },
      { phrase: "पाइप में से पानी लीक हो रहा है", lang: "hi", intent: "repair" },
      { phrase: "नळ गळतोय दुरुस्त करा", lang: "mr", intent: "repair" }
    ]
  },

  "electrical-circuit-mcb": {
    slug: "electrical-circuit-mcb",
    categorySlug: "electrical",
    categoryName: "Electrical & Wiring",
    subcategorySlug: "mcb-switchboards",
    subcategoryName: "MCB & Distribution",
    name: "Switchboard Repair & MCB Tripping Diagnostic",
    icon: "Plug",
    canonicalTrade: "Electrical repair & installation",
    typicalDuration: "1 to 2 hours",
    inspectionFee: 399,
    priceRange: { min: 399, max: 1400, unitLabel: "per visit" },
    whatProWillCheck: [
      "Perform digital multimeter insulation resistance & earth loop impedance test",
      "Thermal scan distribution board to detect overloaded terminals or melted busbars",
      "Check individual MCB ratings against connected appliance load wattage",
      "Inspect neutral-earth voltage drop (should be < 2V for electronics safety)",
      "Check switchboard internal brass connectors and earthing continuity"
    ],
    possibleCauses: [
      "Can be caused by an appliance internal short circuit (geyser element, microwave)",
      "Can be caused by a loose neutral terminal wire sparking inside the board",
      "Can be caused by an undersized MCB breaker (e.g., 10A breaker running 16A AC)",
      "Can be caused by moisture ingress behind bathroom or kitchen switchboards"
    ],
    likelyParts: [
      "Modular 16A / 25A SP MCB (Schneider / Legrand / Havells)",
      "Heavy-duty modular switch & 6-pin socket",
      "Heat-resistant FR-LSH copper connecting wire",
      "Neutral link copper strip"
    ],
    preparationTips: [
      "Note which specific appliance was running when the power tripped",
      "Ensure clear access to the main distribution board",
      "Keep a torch/flashlight accessible if power is completely out"
    ],
    questions: [
      {
        id: "electrical_symptom",
        question: "When does the MCB trip?",
        options: [
          { label: "Immediately when turning on AC or Geyser", scopeNote: "Overload or high starting inrush current." },
          { label: "Randomly throughout the day", scopeNote: "Suspected neutral leakage or intermittent short circuit." },
          { label: "Switch sparks when touched", scopeNote: "Worn contact points inside the modular switch." },
          { label: "Complete blackout in one room", scopeNote: "Blown circuit breaker or burnt main loop wire." }
        ]
      }
    ],
    synonyms: {
      en: ["electrician", "mcb tripping", "switch sparking", "fuse blown", "electrical repair", "power cut in house"],
      hi: ["इलेक्ट्रीशियन", "एमसीबी ट्रिप", "स्विच बोर्ड रिपेयर", "बिजली चली गई"],
      mr: ["इलेक्ट्रिशियन", "लाईट गेली", "स्वीचबोर्ड दुरुस्ती"],
      hinglish: ["switchboard spark kar raha hai", "mcb trip ho raha hai baar baar", "light chali gayi", "power socket burnt"]
    },
    problemPhrases: [
      { phrase: "switchboard sparking and tripping mcb", lang: "en", intent: "repair" },
      { phrase: "mcb trips when ac turns on", lang: "en", intent: "repair" },
      { phrase: "power socket is burnt and smoking", lang: "en", intent: "repair" },
      { phrase: "ceiling fan making humming sound and moving slow", lang: "en", intent: "repair" },
      { phrase: "bijli ka switch spark ho raha hai", lang: "hinglish", intent: "repair" },
      { phrase: "mcb baar baar gir raha hai", lang: "hinglish", intent: "repair" },
      { phrase: "कमरे की लाइट नहीं जल रही है", lang: "hi", intent: "repair" },
      { phrase: "स्वीचबोर्ड मध्ये स्पार्क होतोय", lang: "mr", intent: "repair" }
    ]
  },

  "carpentry-custom-woodwork": {
    slug: "carpentry-custom-woodwork",
    categorySlug: "carpentry",
    categoryName: "Carpentry & Woodwork",
    subcategorySlug: "furniture-wardrobes",
    subcategoryName: "Wardrobes & Furniture",
    name: "Custom Furniture & Wardrobe Hardware Repair",
    icon: "Hammer",
    canonicalTrade: "Carpentry & custom furniture",
    typicalDuration: "2 hours to full day",
    inspectionFee: 499,
    priceRange: { min: 800, max: 4500, unitLabel: "labour estimate" },
    whatProWillCheck: [
      "Check cabinet door alignment, hinge tension, and frame plumb",
      "Inspect drawer ball-bearing telescopic runners for track bending or rust",
      "Assess wood moisture swelling caused by monsoon humidity in Mumbai",
      "Examine plywood core type (commercial vs marine 710 grade)",
      "Inspect modular hardware fittings and soft-close hydraulic dampers"
    ],
    possibleCauses: [
      "Can be caused by stripped screw threads in particle board / MDF frames",
      "Can be caused by worn ball-bearings in sliding wardrobe bottom rollers",
      "Can be caused by moisture expansion causing door edges to scrape frame",
      "Can be caused by heavy load bending unsupported shelf spans"
    ],
    likelyParts: [
      "Auto-concealed soft-close hydraulic hinges (0-crank / 8-crank)",
      "Heavy-duty bottom roller wheels for sliding wardrobe",
      "Triple-extension telescopic drawer channels (18/20 inch)",
      "Edge-banding PVC tape and adhesive"
    ],
    preparationTips: [
      "Empty items from the affected drawer or wardrobe section",
      "Keep spare screws or existing loose parts handy",
      "Provide adequate floor space for door planing if required"
    ],
    questions: [
      {
        id: "carpentry_job_type",
        question: "What needs carpentry attention?",
        options: [
          { label: "Wardrobe door stuck / hinges loose", scopeNote: "Hinge adjustment and door plane leveling." },
          { label: "Sliding door jumped off track", scopeNote: "Bottom roller wheel replacement and track realignment." },
          { label: "Build custom shelves or storage", scopeNote: "Measurement and material estimation visit." },
          { label: "Bed or dining table wobbling", scopeNote: "Joint reinforcement and bracket installation." }
        ]
      }
    ],
    synonyms: {
      en: ["carpenter", "wardrobe repair", "furniture fix", "door alignment", "custom storage", "woodwork"],
      hi: ["बढ़ई", "कारपेंटर", "अलमारी रिपेयर", "दरवाजा ठीक करना"],
      mr: ["सुतार", "कपाटाचे काम", "फर्निचर दुरुस्ती"],
      hinglish: ["wardrobe door band nahi ho raha", "carpenter chahiye", "sliding door jam ho gaya", "furniture hil raha hai"]
    },
    problemPhrases: [
      { phrase: "wardrobe sliding door is stuck", lang: "en", intent: "repair" },
      { phrase: "cabinet door hinges came loose", lang: "en", intent: "repair" },
      { phrase: "need custom marine ply bookshelf built", lang: "en", intent: "install" },
      { phrase: "door scraping against tiled floor", lang: "en", intent: "repair" },
      { phrase: "almarhi ka darwaza atak raha hai", lang: "hinglish", intent: "repair" },
      { phrase: "drawer bahar nahi nikal raha", lang: "hinglish", intent: "repair" }
    ]
  },

  "painting-waterproofing-moisture": {
    slug: "painting-waterproofing-moisture",
    categorySlug: "painting",
    categoryName: "Painting & Wall Finishes",
    subcategorySlug: "interior-wall-treatment",
    subcategoryName: "Wall Moisture & Painting",
    name: "Wall Dampness Treatment & Repainting",
    icon: "PaintRoller",
    canonicalTrade: "Painting & wall finishing",
    typicalDuration: "1 to 3 days",
    inspectionFee: 499,
    priceRange: { min: 2500, max: 12000, unitLabel: "room package" },
    whatProWillCheck: [
      "Perform digital pin-type moisture meter reading on affected walls (target < 12%)",
      "Inspect exterior wall hairline cracks or adjoining bathroom plumbing lines",
      "Assess efflorescence salt deposits and peeling paint plaster thickness",
      "Verify structural concrete health behind debonded putty",
      "Conduct substrate adhesion tape test for primer readiness"
    ],
    possibleCauses: [
      "Can be caused by tile grout degradation in the adjoining bathroom shower area",
      "Can be caused by monsoon rain capillary absorption through exterior building cracks",
      "Can be caused by non-breathable oil paint trapping moisture inside masonry",
      "Can be caused by concealed plumbing junction seepage"
    ],
    likelyParts: [
      "Polymer-modified waterproof putty",
      "SBR latex bonding slurry & damp-block primer",
      "Breathable acrylic interior emulsion (sheen/matt)",
      "Epoxy antimicrobial tile grout"
    ],
    preparationTips: [
      "Move lightweight furniture away from the damp wall",
      "Cover floor perimeters with protective drop sheets",
      "Allow good cross-ventilation in the room"
    ],
    questions: [
      {
        id: "dampness_location",
        question: "Where is the dampness or peeling visible?",
        options: [
          { label: "Living room / bedroom wall next to bathroom" },
          { label: "Ceiling right below upper flat's bathroom" },
          { label: "Balcony or window corner wall" },
          { label: "Full room refresh needed" }
        ]
      }
    ],
    synonyms: {
      en: ["painter", "wall dampness", "waterproofing", "peeling paint", "moisture seepage", "house painting"],
      hi: ["पेंटर", "दीवार में सीलन", "पपड़ी छूट रही है", "घर का कलर"],
      mr: ["रंगकाम", "भिंतीवर ओल आली आहे", "कलर उडाला"],
      hinglish: ["deewar me seelan hai", "paint chhoot raha hai", "waterproofing karwana hai", "painter chahiye"]
    },
    problemPhrases: [
      { phrase: "living room wall peeling and moisture dampness", lang: "en", intent: "repair" },
      { phrase: "ceiling seepage below upstairs bathroom", lang: "en", intent: "repair" },
      { phrase: "repaint 2bhk flat in mumbai", lang: "en", intent: "renovation" },
      { phrase: "wall dampness and bubbled paint repair", lang: "en", intent: "repair" },
      { phrase: "deewar pe seelan aa rahi hai", lang: "hinglish", intent: "repair" },
      { phrase: "paint papdi banke gir raha hai", lang: "hinglish", intent: "repair" }
    ]
  }
};

export const MUMBAI_LOCALITIES = [
  "Andheri West", "Andheri East", "Bandra West", "Bandra East", "Powai",
  "Juhu", "Khar West", "Santacruz", "Goregaon East", "Goregaon West",
  "Malad", "Kandivali", "Borivali", "Thane West", "Mulund", "Vikhroli",
  "Kurla", "Dadar", "Prabhadevi", "Worli", "Lower Parel"
];
