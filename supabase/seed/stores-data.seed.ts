export interface HardwareStore {
  id: string;
  name: string;
  category: "all" | "plumbing" | "electrical" | "hardware" | "paint";
  area: string;
  fullAddress: string;
  lat: number;
  lng: number;
  phone: string;
  rating: number;
  reviewsCount: number;
  openTiming: string;
  karigharDiscountPct: number;
  topBrands: string[];
  authorizedDealer: string;
}

export const MUMBAI_HARDWARE_STORES: HardwareStore[] = [
  {
    id: "store-andheri-01",
    name: "Mahalaxmi Sanitary & Hardware Mart",
    category: "plumbing",
    area: "Andheri West",
    fullAddress: "Shop 4, New Link Road, Near DN Nagar Metro, Andheri West, Mumbai 400053",
    lat: 19.1254,
    lng: 72.8312,
    phone: "+91 98201 44521",
    rating: 4.8,
    reviewsCount: 142,
    openTiming: "8:30 AM – 9:00 PM (All 7 Days)",
    karigharDiscountPct: 7,
    topBrands: ["Astral CPVC", "Jaquar", "Supreme", "Hindware"],
    authorizedDealer: "Astral Pipes Authorized Depot",
  },
  {
    id: "store-andheri-02",
    name: "Classic Electricals & Lighting",
    category: "electrical",
    area: "Andheri East",
    fullAddress: "Plot 12, JB Nagar, Chakala, Andheri East, Mumbai 400059",
    lat: 19.1136,
    lng: 72.8697,
    phone: "+91 98192 33110",
    rating: 4.7,
    reviewsCount: 98,
    openTiming: "9:00 AM – 8:30 PM (Mon–Sat)",
    karigharDiscountPct: 5,
    topBrands: ["Finolex", "Schneider Acti9", "Anchor Roma", "Philips LED"],
    authorizedDealer: "Schneider Electric Master Partner",
  },
  {
    id: "store-powai-01",
    name: "Hiranandani Plywood & Modular Hardware",
    category: "hardware",
    area: "Powai",
    fullAddress: "Galleria Mall Outer Wing, Shop 18, Central Ave, Powai, Mumbai 400076",
    lat: 19.1197,
    lng: 72.9051,
    phone: "+91 98670 12899",
    rating: 4.9,
    reviewsCount: 210,
    openTiming: "9:00 AM – 9:30 PM (Daily)",
    karigharDiscountPct: 8,
    topBrands: ["Hettich", "Greenply Marine", "Godrej Locks", "Fevicol"],
    authorizedDealer: "Hettich Experience Partner",
  },
  {
    id: "store-bandra-01",
    name: "Bandra Paint & Waterproofing Depot",
    category: "paint",
    area: "Bandra West",
    fullAddress: "22 Hill Road, Opp. St. Joseph's, Bandra West, Mumbai 400050",
    lat: 19.0544,
    lng: 72.8402,
    phone: "+91 98205 77610",
    rating: 4.85,
    reviewsCount: 175,
    openTiming: "8:00 AM – 8:00 PM (Daily)",
    karigharDiscountPct: 6,
    topBrands: ["Asian Paints Royale", "Dr. Fixit", "Birla White", "Berger"],
    authorizedDealer: "Asian Paints Colour Ideas Store",
  },
  {
    id: "store-thane-01",
    name: "Shree Ganesh Industrial Hardware & Tools",
    category: "hardware",
    area: "Thane West",
    fullAddress: "Shop 3, Ghodbunder Rd, Near Viviana Mall, Thane West, Mumbai 400601",
    lat: 19.2056,
    lng: 72.9712,
    phone: "+91 99300 81223",
    rating: 4.65,
    reviewsCount: 84,
    openTiming: "8:30 AM – 9:00 PM (All Days)",
    karigharDiscountPct: 5,
    topBrands: ["Bosch Tools", "Polycab", "Supreme PVC", "Pidilite"],
    authorizedDealer: "Bosch Power Tools Certified Dealer",
  },
];
