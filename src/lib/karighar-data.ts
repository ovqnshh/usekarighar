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

export const professionals: any[] = [];

export type Professional = any;

export function getProfessional(id: string) {
  return professionals.find((professional) => professional.id === id) ?? null;
}
