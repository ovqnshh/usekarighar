import arjunPortrait from "@/assets/arjun-portrait.jpg";
import meeraPortrait from "@/assets/meera-portrait.jpg";
import rohanPortrait from "@/assets/rohan-portrait.jpg";
import bathroomProject from "@/assets/bathroom-project.jpg";
import waterTankProject from "@/assets/water-tank-project.jpg";
import wardrobeProject from "@/assets/wardrobe-project.jpg";
import electricalProject from "@/assets/electrical-project.jpg";

export const projectImages = {
  bathroom: bathroomProject,
  waterTank: waterTankProject,
  wardrobe: wardrobeProject,
  electrical: electricalProject,
};

export const professionals = [
  {
    id: "arjun-nair",
    name: "Arjun Nair",
    business: "Nair Plumbing Works",
    trade: "Plumbing & water systems",
    city: "Andheri West, Mumbai",
    rating: 4.92,
    reviews: 128,
    projects: 214,
    price: 899,
    availability: "Available tomorrow",
    experience: "12 years",
    image: arjunPortrait,
    portfolio: [waterTankProject, bathroomProject, electricalProject],
    badges: ["Identity verified", "Skills verified", "Background checked"],
  },
  {
    id: "meera-shah",
    name: "Meera Shah",
    business: "Studio Mitti",
    trade: "Renovation & interiors",
    city: "Bandra, Mumbai",
    rating: 4.88,
    reviews: 94,
    projects: 76,
    price: 1499,
    availability: "Available this week",
    experience: "10 years",
    image: meeraPortrait,
    portfolio: [bathroomProject, wardrobeProject, waterTankProject],
    badges: ["Identity verified", "Portfolio verified", "Business verified"],
  },
  {
    id: "rohan-patil",
    name: "Rohan Patil",
    business: "Circuit House Electricals",
    trade: "Electrical & lighting",
    city: "Powai, Mumbai",
    rating: 4.81,
    reviews: 67,
    projects: 143,
    price: 699,
    availability: "Available today",
    experience: "8 years",
    image: rohanPortrait,
    portfolio: [electricalProject, wardrobeProject, bathroomProject],
    badges: ["Identity verified", "Skills verified", "Safety trained"],
  },
] as const;

export type Professional = (typeof professionals)[number];

export function getProfessional(id: string) {
  return professionals.find((professional) => professional.id === id) ?? professionals[0];
}