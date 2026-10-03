import { createFileRoute, Link } from "@tanstack/react-router";
import { User, Shield, Eye, Wrench, Menu, Briefcase, Bell } from "lucide-react";
import { useAuth } from "@/lib/karighar-api";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error && error.code !== "PGRST116") throw error; // PGRST116 is not found
      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!user?.id) throw new Error("Not logged in");
      
      // If profile doesn't exist, we might need to upsert, but we'll try update first.
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...updates })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile updated successfully");
      setEditingField(null);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  useEffect(() => {
    if (profile) {
      setEditValues({
        full_name: profile.full_name || user?.user_metadata?.full_name || "",
        phone: profile.phone || "",
        city: profile.city || "",
        is_professional: profile.is_professional || false,
        notifications_enabled: profile.notifications_enabled ?? true,
      });
    } else if (user) {
      setEditValues({
        full_name: user.user_metadata?.full_name || "",
      });
    }
  }, [profile, user, editingField === null]);

  const handleSave = (field: string) => {
    updateProfileMutation.mutate({
      [field]: editValues[field],
    });
  };

  const handleCancel = () => {
    setEditingField(null);
    if (profile) {
      setEditValues({
        ...editValues,
        full_name: profile.full_name || user?.user_metadata?.full_name || "",
        phone: profile.phone || "",
        city: profile.city || "",
      });
    }
  };

  const renderField = (id: string, label: string, description: string, placeholder: string = "") => {
    const isEditing = editingField === id;
    const value = editValues[id];
    const displayValue = profile?.[id] || (id === 'full_name' ? user?.user_metadata?.full_name : "") || "Not provided";

    return (
      <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-border/50 group gap-4">
        <div className="flex-1 w-full">
          <h3 className="font-semibold text-foreground">{label}</h3>
          
          {isEditing ? (
            <div className="mt-3 space-y-3 max-w-sm">
              <Input 
                value={value || ""}
                onChange={(e) => setEditValues({ ...editValues, [id]: e.target.value })}
                placeholder={placeholder}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleSave(id)} 
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mt-1">{displayValue}</p>
              {description && <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">{description}</p>}
            </>
          )}
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => setEditingField(id)}
            className="font-semibold underline text-foreground text-sm px-2 py-1 rounded hover:bg-muted shrink-0"
          >
            {profile?.[id] ? "Edit" : "Add"}
          </button>
        )}
      </div>
    );
  };

  const toggleBoolean = (field: string) => {
    const newValue = !editValues[field];
    setEditValues({ ...editValues, [field]: newValue });
    updateProfileMutation.mutate({ [field]: newValue });
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-50 flex h-20 items-center justify-between px-6 lg:px-10 border-b border-border bg-background">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#E51D53] text-white">
            <Wrench className="size-5" />
          </div>
        </Link>
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/dashboard" className="text-sm font-semibold hover:bg-muted px-4 py-2 rounded-full transition-colors hidden sm:block">Back to Dashboard</Link>
          <div className="flex items-center gap-2 border border-border rounded-full p-1 pl-3 pr-1 bg-background">
            <Menu className="size-4 text-muted-foreground" />
            <div className="flex size-8 items-center justify-center rounded-full bg-foreground text-background font-bold text-xs uppercase">
              {user?.email?.charAt(0) || "P"}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 lg:px-10 py-12 flex flex-col md:flex-row gap-12 lg:gap-24">
        {/* Left Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <h1 className="text-3xl font-bold mb-8">Account settings</h1>
          
          <nav className="space-y-1">
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl font-medium text-foreground cursor-pointer">
              <User className="size-5 text-muted-foreground" strokeWidth={1.5} />
              Personal information
            </div>
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 rounded-xl text-muted-foreground cursor-pointer transition-colors">
              <Shield className="size-5" strokeWidth={1.5} />
              Login & security
            </div>
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 rounded-xl text-muted-foreground cursor-pointer transition-colors">
              <Eye className="size-5" strokeWidth={1.5} />
              Privacy
            </div>
            
            <div className="mt-8 mb-4 relative z-10 bg-background border border-border rounded-2xl p-4 shadow-lg mx-2 text-center">
              <div className="text-3xl mb-2">🚀</div>
              <h4 className="font-semibold text-sm mb-1">Become a Professional</h4>
              <p className="text-xs text-muted-foreground mb-3">Join our network of trusted service providers.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => toggleBoolean('is_professional')}
                disabled={updateProfileMutation.isPending || isLoading}
              >
                {editValues.is_professional ? "Switch to Customer" : "Become a Pro"}
              </Button>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 rounded-xl text-muted-foreground cursor-pointer transition-colors">
              <Wrench className="size-5" strokeWidth={1.5} />
              Pro Resources
            </div>
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 rounded-xl text-muted-foreground cursor-pointer transition-colors">
              <Briefcase className="size-5" strokeWidth={1.5} />
              My Projects
            </div>
            <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 rounded-xl text-muted-foreground cursor-pointer transition-colors" onClick={() => toggleBoolean('notifications_enabled')}>
              <div className="flex items-center gap-3">
                <Bell className="size-5" strokeWidth={1.5} />
                Notifications
              </div>
              <div className={`w-8 h-4 rounded-full flex items-center transition-colors px-0.5 ${editValues.notifications_enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                <div className={`w-3 h-3 rounded-full bg-background shadow-sm transition-transform ${editValues.notifications_enabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-2xl">
          <h2 className="text-2xl font-bold mb-8">Personal information</h2>
          
          <div className="space-y-6">
            {renderField("full_name", "Legal name", "This is the name on your travel document, which could be a license or a passport.", "e.g. John Doe")}
            
            <div className="flex justify-between items-start pb-6 border-b border-border/50 group">
              <div>
                <h3 className="font-semibold text-foreground">Email address</h3>
                <p className="text-sm text-muted-foreground mt-1">{user?.email || "Not provided"}</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">Use an address you'll always have access to.</p>
              </div>
              {/* Can't directly edit email via profiles easily without auth API */}
            </div>
            
            {renderField("phone", "Phone numbers", "Add a number so confirmed professionals and Karighar can get in touch.", "e.g. +91 9876543210")}
            {renderField("city", "City", "Your primary city of residence for local services.", "e.g. Mumbai")}
            
            <div className="flex justify-between items-start pb-6 border-b border-border/50 group">
              <div>
                <h3 className="font-semibold text-foreground">Identity verification</h3>
                <p className="text-sm text-muted-foreground mt-1">Not started</p>
              </div>
              <button className="font-semibold underline text-foreground text-sm px-2 py-1 rounded hover:bg-muted">Start</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
