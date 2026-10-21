import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ShieldAlert, Settings2, Trash2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const TRADES = [
  'Electrical repair & installation',
  'Plumbing repair & installation',
  'AC & appliance repair/installation',
  'Carpentry & custom furniture',
  'Painting & wall finishing',
  'Masonry & plastering',
  'Waterproofing',
  'Tiling & flooring'
];

const MOCK_NAMES = ["Rohan", "Amit", "Priya", "Rahul", "Neha", "Vikram", "Sneha", "Karan", "Pooja", "Arjun", "Anjali", "Suresh"];
const MOCK_LAST = ["Patil", "Sharma", "Nair", "Deshmukh", "Singh", "Joshi", "Iyer", "Verma", "Reddy", "Mehta"];
const MOCK_AREAS = ["Andheri", "Bandra", "Juhu", "Powai", "Colaba", "Borivali", "Goregaon", "Malad", "Khar"];

function generateFakeData(categories: string[], countPerCategory: number) {
  const pros = [];
  const gigs = [];

  for (const category of categories) {
    for (let i = 0; i < countPerCategory; i++) {
      const fName = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
      const lName = MOCK_LAST[Math.floor(Math.random() * MOCK_LAST.length)];
      const fullName = `${fName} ${lName}`;
      const slug = `${fName.toLowerCase()}-${lName.toLowerCase()}-${Math.floor(Math.random() * 10000)}`;
      
      const pro = {
        slug,
        name: fullName,
        business: `${fullName} ${category.split(' ')[0]} Services`,
        trade: category,
        city: `${MOCK_AREAS[Math.floor(Math.random() * MOCK_AREAS.length)]}, Mumbai`,
        experience: `${Math.floor(Math.random() * 20) + 1} years`,
        rating: Number((Math.random() * 1.5 + 3.5).toFixed(1)),
        reviews: Math.floor(Math.random() * 300),
        projects_count: Math.floor(Math.random() * 500),
        bio: `Professional ${category.toLowerCase()} expert with years of reliable experience across Mumbai.`
      };
      
      pros.push(pro);

      const numGigs = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numGigs; j++) {
        gigs.push({
          professional_slug: slug, // we will use this in SQL to link them
          name: `Standard ${category.split(' ')[0]} Service`,
          description: `Comprehensive service including inspection and repair.`,
          starting_price: Math.floor(Math.random() * 2000) + 300,
          included: ['Labor', 'Basic tools'],
          not_included: ['Spare parts'],
          duration: `${Math.floor(Math.random() * 4) + 1} hours`,
          materials: Math.random() > 0.5 ? 'customer' : 'professional',
          service_area: 'Mumbai',
          availability: 'Mon-Sat',
          addons: [],
          warranty: '30 days'
        });
      }
    }
  }
  return { pros, gigs };
}

export function AdminPanel() {
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useState('');
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(5);
  const [selectedTrades, setSelectedTrades] = useState<string[]>(TRADES.slice(0, 3));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      setKeys((prev) => {
        const next = prev + e.key.toLowerCase();
        if (next.includes('adminpro')) {
          setOpen(true);
          return '';
        }
        if (next.length > 20) return next.slice(-20);
        return next;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSeed = async () => {
    if (selectedTrades.length === 0) return toast.error('Select at least one category');
    
    setLoading(true);
    const payload = generateFakeData(selectedTrades, count);
    
    // We pass the generated arrays as JSON objects
    const db = supabase as any;
    const { error } = await db.rpc('admin_insert_dynamic_demo', {
      pros_json: payload.pros,
      gigs_json: payload.gigs
    });
    
    setLoading(false);
    
    if (error) {
      toast.error('Insertion Failed', { 
        description: error.message || 'Please check the console for details.'
      });
      console.error("Supabase RPC Error:", error);
    } else {
      toast.success('Data seeded!', { description: `Added ${payload.pros.length} Karighars and ${payload.gigs.length} gigs.` });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete all demo Karighars?')) return;
    
    setLoading(true);
    const db = supabase as any;
    const { error } = await db.rpc('admin_delete_demo_data');
    setLoading(false);
    
    if (error) {
      toast.error('Delete failed', { description: error.message });
    } else {
      toast.success('Demo data wiped out completely.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary text-xl">
            <Settings2 className="size-6" />
            Super Admin Controls
          </DialogTitle>
          <DialogDescription>
            Generate dynamic test data to populate the platform. 
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Karighars per Category: {count}</Label>
              <Slider 
                value={[count]} 
                onValueChange={(v) => setCount(v[0])} 
                min={1} 
                max={20} 
                step={1} 
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">
                Will generate {count * selectedTrades.length} professionals total.
              </p>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Categories</Label>
              <div className="grid grid-cols-1 gap-2 border rounded-xl p-4 bg-muted/30 max-h-60 overflow-y-auto">
                {TRADES.map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={selectedTrades.includes(t)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedTrades(prev => [...prev, t]);
                        else setSelectedTrades(prev => prev.filter(x => x !== t));
                      }}
                    />
                    <span className="text-sm font-medium">{t}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <Button onClick={handleSeed} disabled={loading} className="w-full text-base h-12 shadow-sm rounded-xl">
              {loading && <Loader2 className="mr-2 size-5 animate-spin" />}
              Generate & Inject Data
            </Button>
          </div>
          
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 flex flex-col justify-center items-center text-center space-y-4">
            <div className="size-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <Trash2 className="size-8" />
            </div>
            <div>
              <h4 className="font-semibold text-lg text-red-700">Nuclear Option</h4>
              <p className="text-sm text-red-600/80 mt-1">
                Removes all demo Karighars (where user_id is null). Real signed-up users are preserved.
              </p>
            </div>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="w-full mt-2 h-12 rounded-xl text-base font-semibold shadow-sm hover:bg-red-700">
              {loading ? <Loader2 className="mr-2 size-5 animate-spin" /> : null}
              Wipe All Demo Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
