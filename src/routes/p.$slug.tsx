import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck, Star, MapPin, CheckCircle2, Phone,
  Share2, QrCode, ArrowRight, Clock, Wrench,
  Check, Copy, AlertCircle, Printer
} from "lucide-react";
import { PageShell } from "@/components/karighar-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/p/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Verified Artisan Storefront | Karighar` },
      { name: "description", content: "Book verified craftsmanship under transparent price-books and SafePay escrow protection." },
      { property: "og:title", content: `${params.slug} — Karighar Verified Artisan` },
      { property: "og:description", content: "Direct booking, transparent rate-cards & SafePay escrow guarantee." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MicroStorefrontPage,
});

function MicroStorefrontPage() {
  const { slug } = useParams({ from: "/p/$slug" });
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Fetch live artisan by slug strictly from Supabase DB
  const { data: pro, isLoading, isError } = useQuery({
    queryKey: ["micro-storefront", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*, gigs(*), reviews(*)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Feature 5: Record storefront view for attribution tracking
  useEffect(() => {
    if (pro?.id) {
      const channel =
        typeof window !== "undefined" && window.location.search.includes("source=whatsapp")
          ? "whatsapp"
          : typeof window !== "undefined" && window.location.search.includes("source=qr")
          ? "qr"
          : "direct";

      (supabase as any)
        .from("storefront_views")
        .insert({
          pro_id: pro.id,
          source_channel: channel,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        })
        .then(() => {})
        .catch(() => {});
    }
  }, [pro?.id]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://karighar.in/p/${slug}`;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Profile link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello! Check out my official Karighar storefront for transparent home service pricing & SafePay guarantee:\n${shareUrl}?source=whatsapp`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handlePrintCard = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">Loading artisan storefront...</div>
        </div>
      </PageShell>
    );
  }

  // Strict Rule 3: 404 if pro does not exist in the database
  if (!pro || isError) {
    return (
      <PageShell>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="size-16 rounded-3xl bg-surface-subtle border border-border flex items-center justify-center text-muted-foreground">
            <AlertCircle className="size-8 text-muted-foreground/80" />
          </div>
          <div className="space-y-1 max-w-md">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Artisan Profile Not Found
            </h1>
            <p className="text-xs text-muted-foreground">
              The storefront <span className="font-mono text-foreground font-semibold">/p/{slug}</span> does not exist or has not been verified on Karighar yet.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link to="/professionals">Explore Active Specialists</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  // Calculate actual review metrics from live DB rows
  const reviewsList = Array.isArray(pro.reviews) ? pro.reviews : [];
  const reviewsCount = reviewsList.length;
  const ratingAvg =
    reviewsCount > 0
      ? (reviewsList.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0) / reviewsCount).toFixed(1)
      : (pro.rating || 5.0).toString();

  const proData: any = pro;

  // Strict Rule 3: Only show SafePay Verified badge if approved in DB
  const isApproved = proData.verification_status === "APPROVED" || proData.verification_status === "verified";

  return (
    <PageShell>
      <main className="min-h-screen pb-20 space-y-8">
        {/* Profile Banner */}
        <section className="border-b border-border bg-gradient-to-b from-primary/10 via-background to-background pt-8 pb-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-6">
            
            {/* Top Share & Badge Row */}
            <div className="flex items-center justify-between">
              {isApproved ? (
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 py-1">
                  <ShieldCheck className="size-3.5" /> SafePay Verified Artisan
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground py-1">
                  Pending Verification
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleCopyLink} className="text-xs h-8 gap-1">
                  {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy Link"}
                </Button>
                <Button size="sm" onClick={handleShareWhatsApp} className="text-xs h-8 bg-[#25D366] hover:bg-[#20bd5a] text-white gap-1 shadow-warm-xs">
                  <Share2 className="size-3.5" /> Share on WhatsApp
                </Button>
              </div>
            </div>

            {/* Main Artisan Identity Card */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-warm-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              <img
                src={proData.avatar_url || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&auto=format&fit=crop"}
                alt={pro.name}
                className="size-24 sm:size-28 rounded-2xl object-cover border-2 border-primary/20 shrink-0 shadow-warm-xs"
              />

              <div className="space-y-2 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                      {pro.business}
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground">
                      {pro.name} · {pro.trade}
                    </p>
                  </div>
                  {reviewsCount > 0 ? (
                    <div className="flex items-center justify-center sm:justify-end gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                      <Star className="size-4 fill-amber-500 text-amber-500" />
                      <span className="font-bold text-sm text-foreground">{ratingAvg}</span>
                      <span className="text-xs text-muted-foreground">({reviewsCount} reviews)</span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      New Artisan
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary" /> {pro.city || "Mumbai"}
                  </span>
                  {pro.experience && (
                    <>
                      <span>•</span>
                      <span>{pro.experience} Experience</span>
                    </>
                  )}
                </div>

                {pro.bio && (
                  <p className="text-xs text-muted-foreground/90 pt-1 leading-relaxed max-w-xl">
                    {pro.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Digital Visiting Card & Direct Booking CTA with source_pro_id Attribution */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-primary uppercase">Personal Digital Card</span>
                  <p className="font-semibold text-xs text-foreground">karighar.in/p/{slug}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowQRModal(true)} className="text-xs gap-1">
                  <QrCode className="size-3.5" /> View QR Code
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Direct Booking</span>
                  <p className="font-semibold text-xs text-foreground">SafePay Escrow Protected</p>
                </div>
                <Button asChild size="sm" className="text-xs font-semibold shadow-warm-xs">
                  <Link
                    to="/professionals/$id"
                    params={{ id: pro.id }}
                    search={{ source_pro_id: pro.id }}
                  >
                    Book Appointment <ArrowRight className="size-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>

          </div>
        </section>

        {/* Live Published Gigs */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-foreground">
              Services & Standardized Rates
            </h2>
            <p className="text-xs text-muted-foreground">
              Direct live rates managed by this specialist.
            </p>
          </div>

          <div className="grid gap-3.5">
            {pro.gigs && pro.gigs.length > 0 ? (
              pro.gigs.map((g: any) => (
                <div key={g.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-foreground">{g.name}</h4>
                    <p className="text-xs text-muted-foreground">{g.description || "Comprehensive diagnostic inspection and repair."}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-foreground">₹{g.starting_price || g.price || 499}</div>
                    <Button asChild size="sm" className="text-xs h-7 mt-1">
                      <Link
                        to="/professionals/$id"
                        params={{ id: pro.id }}
                        search={{ source_pro_id: pro.id, gig_id: g.id }}
                      >
                        Book
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2 bg-surface-subtle/30">
                <Wrench className="size-6 text-muted-foreground mx-auto" />
                <p className="font-medium text-xs text-foreground">No pre-listed service packages</p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Book a doorstep diagnostic visit to receive an itemized quote.
                </p>
                <Button asChild size="sm" className="text-xs mt-2">
                  <Link
                    to="/professionals/$id"
                    params={{ id: pro.id }}
                    search={{ source_pro_id: pro.id }}
                  >
                    Book Diagnostic Visit
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* QR Code Modal & Printable Visiting Card */}
        {showQRModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="rounded-2xl border border-border bg-card p-6 max-w-sm w-full space-y-4 text-center shadow-warm-lg">
              <h3 className="font-display font-bold text-base text-foreground">
                Digital Visiting Card
              </h3>
              <p className="text-xs text-muted-foreground">
                Scan to open {pro.business}'s verified Karighar storefront directly on mobile.
              </p>
              
              <div className="p-4 bg-white rounded-xl inline-block border border-border shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl + "?source=qr")}`}
                  alt="Storefront QR Code"
                  className="size-44 mx-auto"
                />
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-xs text-foreground">{pro.business}</p>
                <p className="font-mono text-[11px] text-muted-foreground truncate">
                  {shareUrl}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handlePrintCard}>
                  <Printer className="size-3.5" /> Print Card
                </Button>
                <Button size="sm" className="text-xs gap-1 bg-[#25D366] hover:bg-[#20bd5a] text-white" onClick={handleShareWhatsApp}>
                  <Share2 className="size-3.5" /> WhatsApp
                </Button>
              </div>

              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setShowQRModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </main>
    </PageShell>
  );
}

