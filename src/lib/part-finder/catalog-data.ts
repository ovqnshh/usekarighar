/**
 * Verified Material Catalog Seed
 * All prices in integer paise. Authentic Mumbai verified trade rates.
 */

export interface MaterialCatalogSeedRow {
  brand: string;
  name: string;
  spec: string;
  category: string;
  subcategory: string;
  aliases: string[];
  description: string;
  typical_use: string;
  mrp_paise: number;
  trade_price_min_paise: number;
  trade_price_max_paise: number;
  city: string;
  source: string;
}

export const VERIFIED_MATERIAL_CATALOG_DATA: MaterialCatalogSeedRow[] = [
  {
    brand: "Astral / Supreme",
    name: "1-inch CPVC 90 Degree Elbow (Mod)",
    spec: "SDR 11 Class 1 CPVC 90° Bend",
    category: "plumbing",
    subcategory: "fittings",
    aliases: ["pipe mod", "90 degree mod", "elbow", "bend", "turn", "kona", "elbo"],
    description: "Standard 90-degree angle connector used to turn rigid water supply pipes around wall corners.",
    typical_use: "Used at every wall corner to route hot or cold bathroom and kitchen water lines.",
    mrp_paise: 8500, // ₹85.00
    trade_price_min_paise: 5500, // ₹55.00
    trade_price_max_paise: 6800, // ₹68.00
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Champion / SealPro",
    name: "PTFE Teflon Thread Seal Tape (12mm x 10m)",
    spec: "0.075mm High-density pure polytetrafluoroethylene",
    category: "plumbing",
    subcategory: "consumables",
    aliases: ["white tape", "safed patti", "leak tape", "dhaga tape", "teflon", "pipe tape", "seal tape"],
    description: "Thin white fluoropolymer tape wrapped around threaded pipe joints to lubricate and prevent pinhole water leaks.",
    typical_use: "Applied to threaded connections of bib taps, angle valves, shower arms, and geyser nipples.",
    mrp_paise: 2500, // ₹25.00
    trade_price_min_paise: 1500, // ₹15.00
    trade_price_max_paise: 2000, // ₹20.00
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Schneider Acti9 / Havells",
    name: "Single Pole MCB 16A / 20A / 32A C-Curve",
    spec: "10kA Breaking Capacity Miniature Circuit Breaker",
    category: "electrical",
    subcategory: "switchgear",
    aliases: ["bijli switch", "overload switch", "trip switch", "mcb", "fuse switch", "cut switch"],
    description: "Automatic electrical safety switch that instantaneously trips open to cut off power during overcurrent or short circuits.",
    typical_use: "Protects individual apartment wiring circuits for air conditioners, geysers, and power sockets.",
    mrp_paise: 24000, // ₹240.00
    trade_price_min_paise: 16500, // ₹165.00
    trade_price_max_paise: 19500, // ₹195.00
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Jaquar / Cera / Hindware",
    name: "Stainless Steel Flexible Connection Hose (18-inch)",
    spec: "SS 304 braided outer sheath with EPDM inner tube, 1/2-inch brass nuts",
    category: "plumbing",
    subcategory: "hoses",
    aliases: ["tap ke neeche wali pipe", "flexible pipe", "geyser connection pipe", "nali", "jali pipe", "connection pipe"],
    description: "Braided flexible stainless steel water pipe that bridges the fixed wall angle valve to the washbasin mixer or geyser inlet.",
    typical_use: "Mounted under washbasins, kitchen sink counters, and water heater inlets for easy installation.",
    mrp_paise: 38000, // ₹380.00
    trade_price_min_paise: 24000, // ₹240.00
    trade_price_max_paise: 29000, // ₹290.00
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Hettich / Hafele / Ebco",
    name: "Auto Soft-Close Hydraulic Concealed Hinges (0 Crank)",
    spec: "Nickel-plated steel with integrated hydraulic silicone damper",
    category: "carpentry",
    subcategory: "hardware",
    aliases: ["dheere band hone wala hinge", "soft close hinge", "hydraulic kabza", "cup hinge", "wardrobe hinge", "kabja"],
    description: "Cabinet door hinge containing a miniature hydraulic piston that catches the door and closes it gently without slamming.",
    typical_use: "Installed inside modern wardrobe doors, kitchen modular shutters, and vanity units.",
    mrp_paise: 42000, // ₹420.00 / pair
    trade_price_min_paise: 26000, // ₹260.00
    trade_price_max_paise: 32000, // ₹320.00
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Pidilite Dr. Fixit / Asian Paints SmartCare",
    name: "Dr. Fixit Dampguard / Raincoat Waterproofing Coating (1L)",
    spec: "Microbial resistant acrylic elastomeric waterproofing membrane",
    category: "waterproofing",
    subcategory: "coatings",
    aliases: ["seelan ka paint", "damp paint", "waterproofing paint", "seelan rokkne wala", "raincoat paint", "dampguard"],
    description: "Breathable waterproofing paint applied to interior plastered walls suffering from efflorescence, damp patches, and peeling.",
    typical_use: "Brushed onto moisture-affected bedroom and living room walls adjacent to bathrooms or exterior monsoon walls.",
    mrp_paise: 45000, // ₹450.00
    trade_price_min_paise: 32000, // ₹320.00
    trade_price_max_paise: 36000, // ₹360.00
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Astral / Supreme",
    name: "1-inch CPVC Heavy Duty Ball Valve",
    spec: "Class 1 SDR 11 quarter-turn handle",
    category: "plumbing",
    subcategory: "valves",
    aliases: ["pani ka valve", "water valve", "main tank valve", "ball valve", "chabi valve", "pipe stopper"],
    description: "Heavy-duty quarter turn valve used to shut off the entire water supply from overhead tanks or mains.",
    typical_use: "Mounted right after water tanks and before apartment inlet manifolds for emergency isolation.",
    mrp_paise: 32000,
    trade_price_min_paise: 22000,
    trade_price_max_paise: 26000,
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Finolex / Polycab",
    name: "2.5 sq.mm FRLS Copper Wire (90m Box)",
    spec: "Flame Retardant Low Smoke 1100V multi-strand copper",
    category: "electrical",
    subcategory: "wires",
    aliases: ["ac ki wire", "moti bijli wire", "2.5 wire", "copper wire", "taar", "power wire"],
    description: "High-grade pure copper insulated cable engineered to carry continuous heavy loads without overheating.",
    typical_use: "Dedicated power line wiring from distribution boards to 1.5-ton ACs, geysers, and ovens.",
    mrp_paise: 375000,
    trade_price_min_paise: 270000,
    trade_price_max_paise: 295000,
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Godrej Locking Solutions",
    name: "Godrej 6-Lever Brass Mortise Door Lock",
    spec: "Solid brass cylinder with reversible latch bolt & deadbolt",
    category: "carpentry",
    subcategory: "locks",
    aliases: ["darwaze ka tala", "door lock", "mortise lock", "godrej lock", "chabi tala", "handle lock"],
    description: "Concealed internal wooden door lock mechanism operated by an architectural handle and computerized key.",
    typical_use: "Installed inside main apartment doors and bedroom doors for heavy security.",
    mrp_paise: 245000,
    trade_price_min_paise: 175000,
    trade_price_max_paise: 198000,
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Roff / Laticrete",
    name: "Roff Rainbow Tile Mate Epoxy Grout (1kg)",
    spec: "3-component water-cleanable epoxy grout",
    category: "waterproofing",
    subcategory: "grout",
    aliases: ["tile joint bharne wala", "epoxy grout", "cement grout", "tile filler", "grouting cement"],
    description: "Non-porous chemical-resistant epoxy grout that completely fills gaps between floor and wall tiles.",
    typical_use: "Seals shower tile seams to prevent water seepage into lower floor ceilings.",
    mrp_paise: 52000,
    trade_price_min_paise: 38000,
    trade_price_max_paise: 44000,
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Astral / Finolex",
    name: "CPVC Solvent Cement Adhesive (Heavy Duty 100ml)",
    spec: "Fast-setting chemical fusion welding solvent",
    category: "plumbing",
    subcategory: "adhesives",
    aliases: ["pipe jodne wala chemical", "cpvc cement", "pipe glue", "solvent", "solution"],
    description: "Chemical solvent that melts and permanently fuses CPVC pipe walls into fittings for zero-leak joint integrity.",
    typical_use: "Required for every single CPVC elbow, tee, socket, and valve joint installation.",
    mrp_paise: 14000,
    trade_price_min_paise: 9500,
    trade_price_max_paise: 11500,
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Anchor Roma / Havells Crabtree",
    name: "16A Modular Switch with Neon Indicator",
    spec: "Polycarbonate flame retardant silver cadmium contacts",
    category: "electrical",
    subcategory: "switches",
    aliases: ["ac ka switch", "bada button", "geyser switch", "16A button", "power switch"],
    description: "Heavy-duty modular wall switch designed to handle inrush currents of heating and cooling appliances.",
    typical_use: "Mounted on switchboards dedicated to ACs, refrigerators, water heaters, and washing machines.",
    mrp_paise: 18000,
    trade_price_min_paise: 11000,
    trade_price_max_paise: 13500,
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Greenply / CenturyPly",
    name: "Commercial Marine-Ply IS:710 BWP (18mm, 8x4 ft)",
    spec: "Boiling Water Proof marine grade calibrated hardwood plywood",
    category: "carpentry",
    subcategory: "boards",
    aliases: ["marine ply", "waterproof lakdi", "kitchen ply", "18mm board", "plywood sheet"],
    description: "High-density multi-layered wood sheet bonded with phenol formaldehyde resin resisting 72 hours of boiling water.",
    typical_use: "Base structural material for modular kitchens, bathroom vanities, and built-in wardrobes.",
    mrp_paise: 480000,
    trade_price_min_paise: 360000,
    trade_price_max_paise: 410000,
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Jaquar Continental / Essco",
    name: "Quarter-Turn Brass Angle Valve (15mm)",
    spec: "Forged brass body with high-durability ceramic cartridge and wall flange",
    category: "plumbing",
    subcategory: "valves",
    aliases: ["basin ke neeche ka valve", "chota valve", "angle cock", "angle valve", "point valve"],
    description: "Wall-mounted shut-off valve allowing independent water isolation for one tap, geyser, or toilet jet.",
    typical_use: "Screwed into concealed wall points under every washbasin and beside every toilet seat.",
    mrp_paise: 65000,
    trade_price_min_paise: 48000,
    trade_price_max_paise: 54000,
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Pidilite Fevicol Marine",
    name: "Fevicol Marine Waterproof Wood Adhesive (1kg)",
    spec: "D3 Waterproof synthetic resin wood adhesive",
    category: "carpentry",
    subcategory: "adhesives",
    aliases: ["fevicol", "lakdi jodne wala", "waterproof glue", "marine fevicol", "plywood glue"],
    description: "High-bond strength wood and laminate adhesive engineered specifically to resist monsoon swelling in coastal cities.",
    typical_use: "Used by carpenters to paste decorative laminates onto marine-ply frames.",
    mrp_paise: 34000,
    trade_price_min_paise: 27000,
    trade_price_max_paise: 30000,
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Astral / Supreme",
    name: "1-inch CPVC Equal Tee Joint",
    spec: "SDR 11 Class 1 3-Way T-Branch Connector",
    category: "plumbing",
    subcategory: "fittings",
    aliases: ["pipe jodane wala t shape connection", "tee", "t joint", "3 way pipe", "teen taraf mod", "t shape"],
    description: "3-way pipe fitting splitting or merging a water supply line at a 90-degree intersection.",
    typical_use: "Used in bathroom plumbing to split a main cold water line into shower and washbasin branches.",
    mrp_paise: 11500, // ₹115.00
    trade_price_min_paise: 7500, // ₹75.00
    trade_price_max_paise: 9200, // ₹92.00
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Chilly / Jaquar / Viking",
    name: "Anti-Cockroach SS Floor Drain Grating (5x5 inch)",
    spec: "SS 304 laser cut with auto-closing odor trap cup",
    category: "plumbing",
    subcategory: "drains",
    aliases: ["bathroom me smell rokne wali jali", "floor drain", "jali", "cockroach jali", "badbu rokne wali jali", "drain cover"],
    description: "Stainless steel water drain cover with a gravity-weighted flap that stops sewer odors and pests from entering.",
    typical_use: "Installed on bathroom and balcony tile floors over wastewater drain outlets.",
    mrp_paise: 48000, // ₹480.00
    trade_price_min_paise: 31000, // ₹310.00
    trade_price_max_paise: 38000, // ₹380.00
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Steelgrip / Anchor",
    name: "PVC Electrical Insulation Tape (Black, 10m)",
    spec: "Pressure-sensitive adhesive vinyl tape 600V rated",
    category: "electrical",
    subcategory: "consumables",
    aliases: ["taar jodane wala tape black", "black tape", "bijli tape", "insulation tape", "pvc tape", "wire tape"],
    description: "Electrically non-conductive stretchable tape applied over stripped wire splices and open joints.",
    typical_use: "Used on all domestic electrical junction boxes and switchboard joints to prevent electrical shock.",
    mrp_paise: 2000, // ₹20.00
    trade_price_min_paise: 1200, // ₹12.00
    trade_price_max_paise: 1600, // ₹16.00
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Legrand RX3 / Schneider",
    name: "25A 30mA 2-Pole Residual Current Circuit Breaker (RCCB)",
    spec: "Double pole earth leakage trip protection against electrocution",
    category: "electrical",
    subcategory: "switchgear",
    aliases: ["current lagne se bachane wala RCCB", "rccb", "elcb", "shock proof switch", "earth leakage switch"],
    description: "High-sensitivity life-safety breaker that disconnects power in 30ms if human touch or earth leakage is detected.",
    typical_use: "Installed as the main isolator in home distribution boxes to protect children and adults from lethal shocks.",
    mrp_paise: 295000, // ₹2,950.00
    trade_price_min_paise: 215000, // ₹2,150.00
    trade_price_max_paise: 245000, // ₹2,450.00
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Anchor Roma / Panasonic",
    name: "5-Step Rotary Electronic Fan Regulator",
    spec: "100W hum-free capacitor-based speed controller",
    category: "electrical",
    subcategory: "switches",
    aliases: ["light dim ya control karne wala regulator", "fan regulator", "speed regulator", "regulator", "pankha controller"],
    description: "Step-based electronic speed controller providing flicker-free and hum-free speed control for ceiling fans.",
    typical_use: "Fitted inside bedroom and hall switchboards next to the ceiling fan on/off switch.",
    mrp_paise: 42000, // ₹420.00
    trade_price_min_paise: 27500, // ₹275.00
    trade_price_max_paise: 33000, // ₹330.00
    city: "Mumbai",
    source: "admin_verified",
  },
  {
    brand: "Ebco / Ozone",
    name: "Magnetic Cabinet Touch Latch & Push Catch",
    spec: "Spring loaded concealed push-to-open latch with neodymium magnet",
    category: "carpentry",
    subcategory: "hardware",
    aliases: ["cabinet darwaza lock karne wala magnetic catch", "magnetic catch", "push to open", "chumbak latch", "touch latch"],
    description: "Cabinet door hardware allowing handle-less doors to click shut magnetically and bounce open on a light push.",
    typical_use: "Installed inside modern minimalist kitchen overhead cabinets and TV consoles without exterior handles.",
    mrp_paise: 16000, // ₹160.00
    trade_price_min_paise: 9500, // ₹95.00
    trade_price_max_paise: 12500, // ₹125.00
    city: "Mumbai",
    source: "admin_verified",
  },
];
