import re

with open("src/routes/_authenticated/dashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

imports_to_add = '''
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
'''
if "import { Card" not in content:
    last_import_match = list(re.finditer(r'^import .*?;?$', content, re.MULTILINE))[-1]
    insertion_idx = last_import_match.end()
    content = content[:insertion_idx] + "\n" + imports_to_add.strip() + "\n" + content[insertion_idx:]

new_my_services_tab = '''
function MyServicesTab({ pro }: { pro: ProRow }) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  
  const { data: gigs, isLoading } = useQuery({
    queryKey: ['my-gigs', pro.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('gigs').select('*').eq('professional_id', pro.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const saveGig = async () => {
    if (!formData.name) return toast.error("Name is required");
    if (editingId === 'new') {
      const { error } = await supabase.from('gigs').insert({
        professional_id: pro.id,
        name: formData.name,
        description: formData.description,
        starting_price: formData.starting_price || 0,
        duration: formData.duration || '',
        is_published: formData.is_published ?? true
      });
      if (error) return toast.error("Error creating service");
      toast.success("Service created");
    } else {
      const { error } = await supabase.from('gigs').update({
        name: formData.name,
        description: formData.description,
        starting_price: formData.starting_price || 0,
        duration: formData.duration || '',
        is_published: formData.is_published
      }).eq('id', editingId);
      if (error) return toast.error("Error updating service");
      toast.success("Service updated");
    }
    setEditingId(null);
    qc.invalidateQueries({ queryKey: ['my-gigs', pro.id] });
  };

  const deleteGig = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    const { error } = await supabase.from('gigs').delete().eq('id', id);
    if (error) return toast.error("Cannot delete service. It may have active projects.");
    toast.success("Service deleted");
    qc.invalidateQueries({ queryKey: ['my-gigs', pro.id] });
  };

  const duplicateGig = async (gig: any) => {
    const { id, created_at, ...rest } = gig;
    const { error } = await supabase.from('gigs').insert({ ...rest, name: gig.name + " (Copy)" });
    if (error) return toast.error("Error duplicating");
    toast.success("Service duplicated");
    qc.invalidateQueries({ queryKey: ['my-gigs', pro.id] });
  };
  
  const togglePublish = async (gig: any) => {
    const { error } = await supabase.from('gigs').update({ is_published: !gig.is_published }).eq('id', gig.id);
    if (error) return toast.error("Error updating status");
    toast.success(gig.is_published ? "Service unpublished" : "Service published");
    qc.invalidateQueries({ queryKey: ['my-gigs', pro.id] });
  };

  if (isLoading) return <p className="px-10 py-10 text-muted-foreground">Loading services...</p>;

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Services</h1>
        {!editingId && (
          <Button onClick={() => { setEditingId('new'); setFormData({ is_published: true }); }} className="bg-[#E51D53] hover:bg-[#d4174a] text-white">
            + Add Service
          </Button>
        )}
      </div>
      
      {editingId ? (
        <Card className="mb-8 border-border max-w-3xl">
          <CardHeader>
            <CardTitle>{editingId === 'new' ? 'Create New Service' : 'Edit Service'}</CardTitle>
            <CardDescription>Fill in the details below to define what you offer to customers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Duration</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name</Label>
                  <Input id="name" placeholder="e.g. Basic Plumbing Repair" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe what is included in this service..." rows={4} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </TabsContent>
              
              <TabsContent value="pricing" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price">Starting Price (₹)</Label>
                    <Input id="price" type="number" placeholder="0" value={formData.starting_price || ''} onChange={e => setFormData({...formData, starting_price: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Estimated Duration</Label>
                    <Input id="duration" placeholder="e.g. 2 hours" value={formData.duration || ''} onChange={e => setFormData({...formData, duration: e.target.value})} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Publish Service</Label>
                    <p className="text-sm text-muted-foreground">
                      Make this service visible to customers on your profile.
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_published ?? true}
                    onCheckedChange={(checked) => setFormData({...formData, is_published: checked})}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6">
            <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button onClick={saveGig} className="bg-foreground text-background">
              {editingId === 'new' ? 'Create Service' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gigs?.map((gig: any) => (
            <div key={gig.id} className="border border-border rounded-2xl overflow-hidden bg-background shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{gig.name}</h3>
                  <span className={	ext-[10px] px-2 py-1 rounded-full font-bold uppercase }>
                    {gig.is_published ? 'Active' : 'Draft'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">{gig.description || "No description provided."}</p>
                <div className="flex items-center gap-4 text-sm font-medium">
                  {gig.starting_price > 0 && <span>Starts at {inr(gig.starting_price)}</span>}
                  {gig.duration && <span className="text-muted-foreground">⏱ {gig.duration}</span>}
                </div>
              </div>
              <div className="border-t border-border p-3 bg-muted/10 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-1">
                  <button onClick={() => { setEditingId(gig.id); setFormData(gig); }} className="text-xs font-semibold px-3 py-1.5 hover:bg-muted rounded-md border border-transparent hover:border-border">Edit</button>
                  <button onClick={() => duplicateGig(gig)} className="text-xs font-semibold px-3 py-1.5 hover:bg-muted rounded-md border border-transparent hover:border-border">Duplicate</button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => togglePublish(gig)} className="text-xs font-semibold px-3 py-1.5 hover:bg-muted rounded-md text-muted-foreground border border-transparent hover:border-border">
                    {gig.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => deleteGig(gig.id)} className="text-xs font-semibold px-3 py-1.5 hover:bg-destructive/10 text-destructive rounded-md border border-transparent hover:border-destructive/20">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {gigs?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
              No services added yet. Add a service to show on your profile.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
'''

pattern = re.compile(r"function MyServicesTab\(\{ pro \}: \{ pro: ProRow \}\) \{.*?\n\s*\}\n(?=\n|function|$)", re.DOTALL)
content = pattern.sub(new_my_services_tab.strip() + "\n", content)

with open("src/routes/_authenticated/dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
