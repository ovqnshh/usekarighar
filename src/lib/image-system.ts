import bathroomProject from "@/assets/bathroom-project.jpg";
import waterTankProject from "@/assets/water-tank-project.jpg";
import wardrobeProject from "@/assets/wardrobe-project.jpg";
import electricalProject from "@/assets/electrical-project.jpg";
import acServiceImg from "@/assets/ac-service.jpg";
import waterproofingServiceImg from "@/assets/waterproofing-service.jpg";
import paintingServiceImg from "@/assets/painting-service.jpg";
import carpentryServiceImg from "@/assets/carpentry-service.jpg";

export interface ImageScene {
  url: string;
  role: "problem" | "in-progress" | "result" | "tools" | "craftsperson-at-work";
  alt: string;
}

export interface ServiceImageSet {
  serviceId: string;
  name: string;
  hero: string;
  tile: string;
  problemPrompt: string;
  problemTitle: string;
  problemSubtitle: string;
  scenes: ImageScene[];
  beforeAfter: {
    before: string;
    after: string;
    title: string;
    description: string;
  };
}

export const SERVICE_IMAGE_SETS: Record<string, ServiceImageSet> = {
  plumbing: {
    serviceId: "plumbing",
    name: "Plumbing & Water Systems",
    hero: waterTankProject,
    tile: bathroomProject,
    problemTitle: "Leaking Tap or Pipe Under Sink",
    problemSubtitle: "Concealed leakage, valve drips, low water pressure",
    problemPrompt: "I have a leaking pipe and low water pressure in my bathroom that needs inspection.",
    scenes: [
      { url: waterTankProject, role: "problem", alt: "Water tank and plumbing valve inspection" },
      { url: bathroomProject, role: "result", alt: "Completed modern waterproof bathroom plumbing" },
    ],
    beforeAfter: {
      before: waterTankProject,
      after: bathroomProject,
      title: "Bath & Valve Overhaul",
      description: "Full waterproofing, polymer joint sealing & concealed pressure valve",
    },
  },
  electrical: {
    serviceId: "electrical",
    name: "Electrical & DB Wiring",
    hero: electricalProject,
    tile: electricalProject,
    problemTitle: "Tripping MCB or Sparking Switch",
    problemSubtitle: "Short circuits, burnt sockets, heavy appliance load check",
    problemPrompt: "My main switchboard is tripping frequently when the AC turns on.",
    scenes: [
      { url: electricalProject, role: "problem", alt: "Electrician inspecting complex circuit breaker" },
      { url: electricalProject, role: "tools", alt: "Multimeter and insulation testing tools" },
    ],
    beforeAfter: {
      before: electricalProject,
      after: wardrobeProject,
      title: "Concealed Wiring & LED Profile",
      description: "Distribution board balance and hidden ambient LED wiring",
    },
  },
  carpentry: {
    serviceId: "carpentry",
    name: "Carpentry & Custom Woodwork",
    hero: carpentryServiceImg,
    tile: carpentryServiceImg,
    problemTitle: "Wardrobe Door Sticking or Custom Storage",
    problemSubtitle: "Hinges not aligning, moisture swelling, modular shelf additions",
    problemPrompt: "I need custom marine-ply storage shelves built for my bedroom alcove.",
    scenes: [
      { url: carpentryServiceImg, role: "result", alt: "Custom modular wardrobe with precision finish" },
    ],
    beforeAfter: {
      before: wardrobeProject,
      after: carpentryServiceImg,
      title: "Custom Marine-Ply Wardrobe",
      description: "Built-in precision cabinetry with soft-close hardware",
    },
  },
  ac_appliance: {
    serviceId: "ac_appliance",
    name: "AC Deep Clean & Jet Wash",
    hero: acServiceImg,
    tile: acServiceImg,
    problemTitle: "Noisy AC or Foul Air Cooling Drop",
    problemSubtitle: "Choked filter coils, low refrigerant, water dripping indoors",
    problemPrompt: "My split AC is blowing warm air and making a vibrating noise.",
    scenes: [
      { url: acServiceImg, role: "tools", alt: "High pressure jet foam cleaning equipment" },
    ],
    beforeAfter: {
      before: electricalProject,
      after: acServiceImg,
      title: "Deep Jet Wash & Coil Shield",
      description: "Antibacterial foam shield and restored 100% cooling air throw",
    },
  },
  waterproofing: {
    serviceId: "waterproofing",
    name: "Waterproofing & Seepage Barrier",
    hero: waterproofingServiceImg,
    tile: waterproofingServiceImg,
    problemTitle: "Ceiling Seepage & Peeling Wall Dampness",
    problemSubtitle: "Bathroom joint leaks, monsoon wall bubbles, terrace cracks",
    problemPrompt: "There is dampness spreading across my living room wall from the bathroom.",
    scenes: [
      { url: waterproofingServiceImg, role: "problem", alt: "Water seepage on masonry joints" },
      { url: bathroomProject, role: "result", alt: "Finished waterproof tile barrier" },
    ],
    beforeAfter: {
      before: waterTankProject,
      after: waterproofingServiceImg,
      title: "Polymer Joint Seal & Grouting",
      description: "Complete moisture barrier guaranteed against monsoon seepage",
    },
  },
};

export const PROBLEM_TILES = [
  {
    key: "leaking_pipe",
    title: "Leaking Pipe or Tap",
    subtitle: "Dripping tap, sink pipe burst, low water flow",
    prompt: "I have a leaking pipe under my sink that needs urgent repair.",
    image: waterTankProject,
    trade: "Plumbing repair & installation",
    estTime: "45 mins",
  },
  {
    key: "tripping_switch",
    title: "Tripping MCB / Switch",
    subtitle: "Power cuts in one room, sparking plug point",
    prompt: "My room MCB trips every time I switch on heavy appliances.",
    image: electricalProject,
    trade: "Electrical repair & installation",
    estTime: "30 mins",
  },
  {
    key: "noisy_ac",
    title: "Noisy or Warm AC",
    subtitle: "Not cooling, filter choked, ice forming on coil",
    prompt: "My split AC is not cooling properly and needs a deep jet wash.",
    image: acServiceImg,
    trade: "AC & appliance repair/installation",
    estTime: "1 hour",
  },
  {
    key: "wardrobe_hinge",
    title: "Wardrobe Door Sticking",
    subtitle: "Misaligned hinge, drawer off track, new shelves",
    prompt: "My wardrobe sliding door has come off the track and needs realigning.",
    image: carpentryServiceImg,
    trade: "Carpentry & custom furniture",
    estTime: "1-2 hours",
  },
  {
    key: "wall_seepage",
    title: "Wall Dampness & Peeling",
    subtitle: "Moisture bubbles, tile joint leak, terrace damp",
    prompt: "Dampness is spreading along the bathroom wall. Need waterproofing inspection.",
    image: waterproofingServiceImg,
    trade: "Waterproofing",
    estTime: "Half day",
  },
];
