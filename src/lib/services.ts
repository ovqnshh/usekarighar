import { Home, Plug, Droplet, Fan, Hammer, PaintRoller, BrickWall, Umbrella, LayoutGrid, Box, Lock, Bug, Users } from 'lucide-react';
export const services = [
 { id: '', label: 'All services', icon: Home, terms: [] },
 { id: 'electrical', label: 'Electrical', icon: Plug, terms: ['electrical', 'electrician', 'lighting', 'wiring'] },
 { id: 'plumbing', label: 'Plumbing', icon: Droplet, terms: ['plumbing', 'plumber', 'water systems'] },
 { id: 'appliances', label: 'AC & appliances', icon: Fan, terms: ['appliance', 'ac repair', 'air conditioning', 'cooling'] },
 { id: 'carpentry', label: 'Carpentry', icon: Hammer, terms: ['carpentry', 'carpenter', 'furniture', 'wardrobe'] },
 { id: 'painting', label: 'Painting', icon: PaintRoller, terms: ['painting', 'painter', 'wall finishing'] },
 { id: 'renovation', label: 'Renovation', icon: BrickWall, terms: ['renovation', 'interiors', 'masonry', 'plastering'] },
 { id: 'waterproofing', label: 'Waterproofing', icon: Umbrella, terms: ['waterproof', 'damp'] },
 { id: 'flooring', label: 'Flooring', icon: LayoutGrid, terms: ['tiling', 'flooring', 'tiles'] },
 { id: 'ceiling', label: 'Ceilings', icon: Box, terms: ['ceiling', 'pop work'] },
 { id: 'smart-home', label: 'Smart home', icon: Lock, terms: ['automation', 'smart lock'] },
 { id: 'pest', label: 'Pest control', icon: Bug, terms: ['pest', 'termite'] },
 { id: 'general', label: 'Home help', icon: Users, terms: ['labour', 'helper', 'general'] },
];
export function matchesService(trade: string, category: string | undefined) {
 if (!category || category === 'All') return true;
 const t = trade.toLowerCase();
 const groups: Record<string, string[]> = { build: ['carpentry','renovation','ceiling'], renovate: ['renovation','painting','flooring','waterproofing'], fix: ['plumbing','electrical','appliances','general'] };
 const selected = groups[category] ?? [category];
 return selected.some(id => {
 const service = services.find(s => s.id === id || s.label.toLowerCase() === id.toLowerCase() || s.terms.some(term => id.toLowerCase().includes(term)));
 return service ? service.terms.some(term => t.includes(term)) : t.includes(id.toLowerCase());
 });
}
export function briefSummary(brief: Record<string, unknown>) {
 return ['summary','scope','materials','considerations','questions','exclusions'].map(key => {
 const v=brief[key]; return Array.isArray(v) ? `${key.charAt(0).toUpperCase()+key.slice(1)}:\n${v.map(x=>typeof x==='string'?x:Object.values(x as object).join(' — ')).join('\n')}` : typeof v==='string' ? v : '';
 }).filter(Boolean).join('\n\n');
}
