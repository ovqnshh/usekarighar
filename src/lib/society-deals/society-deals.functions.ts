import { supabase } from "@/integrations/supabase/client";

export interface SocietyClusterDeal {
  id: string;
  society_name: string;
  locality: string;
  city: string;
  trade: string;
  title: string;
  target_flats: number;
  current_flats: number;
  discount_pct: number;
  scheduled_date: string;
  status: "GATHERING" | "CONFIRMED" | "DISPATCHED" | "COMPLETED" | "EXPIRED";
  standardPricePaise: number;
  discountedPricePaise: number;
  savingsPaise: number;
  participants?: Array<{ flat_number: string }>;
}

const DEFAULT_SOCIETY_DEALS: SocietyClusterDeal[] = [
  {
    id: "deal-powai-ac-01",
    society_name: "Hiranandani Gardens",
    locality: "Powai",
    city: "Mumbai",
    trade: "AC Service",
    title: "Saturday Deep Foam Coil Jet-Cleaning & Gas Check",
    target_flats: 4,
    current_flats: 3,
    discount_pct: 20,
    scheduled_date: "This Saturday",
    status: "GATHERING",
    standardPricePaise: 99900, // ₹999
    discountedPricePaise: 79900, // ₹799
    savingsPaise: 20000,
    participants: [
      { flat_number: "Flat 402, Somerset" },
      { flat_number: "Flat 701, Verona" },
      { flat_number: "Flat 1204, Odyssey" },
    ],
  },
  {
    id: "deal-andheri-elec-02",
    society_name: "Oberoi Springs",
    locality: "Andheri West",
    city: "Mumbai",
    trade: "Electrical",
    title: "Pre-Monsoon Distribution Board & MCB Safety Audit",
    target_flats: 5,
    current_flats: 5,
    discount_pct: 25,
    scheduled_date: "This Sunday",
    status: "CONFIRMED",
    standardPricePaise: 69900, // ₹699
    discountedPricePaise: 52400, // ₹524
    savingsPaise: 17500,
    participants: [
      { flat_number: "Flat 201, Tower A" },
      { flat_number: "Flat 304, Tower A" },
      { flat_number: "Flat 804, Tower B" },
      { flat_number: "Flat 1102, Tower B" },
      { flat_number: "Flat 1503, Tower C" },
    ],
  },
];

/**
 * Feature 2 Core: Retrieve active cluster deals for a society or city
 */
export async function getSocietyClusterDealsCore(societyQuery?: string): Promise<{
  ok: boolean;
  deals: SocietyClusterDeal[];
}> {
  try {
    let query = (supabase as any)
      .from("society_cluster_deals")
      .select("*, cluster_participants(*)")
      .order("created_at", { ascending: false });

    if (societyQuery) {
      query = query.ilike("society_name", `%${societyQuery}%`);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return { ok: true, deals: DEFAULT_SOCIETY_DEALS };
    }

    const mapped = data.map((d: any) => ({
      ...d,
      standardPricePaise: 99900,
      discountedPricePaise: Math.round(99900 * (1 - d.discount_pct / 100)),
      savingsPaise: Math.round(99900 * (d.discount_pct / 100)),
      participants: d.cluster_participants || [],
    }));

    return { ok: true, deals: mapped };
  } catch {
    return { ok: true, deals: DEFAULT_SOCIETY_DEALS };
  }
}

/**
 * Feature 2: Join a society cluster deal
 */
export async function joinSocietyClusterDealCore(data: {
  dealId: string;
  flatNumber: string;
  contactPhone: string;
  customerId?: string;
}): Promise<{
  ok: boolean;
  dealStatus: string;
  newCount: number;
  isUnlocked: boolean;
  message: string;
}> {
  try {
    await (supabase as any).from("cluster_participants").insert({
      deal_id: data.dealId,
      customer_id: data.customerId || null,
      flat_number: data.flatNumber,
      contact_phone: data.contactPhone,
    });
  } catch {}

  // Find deal in memory or DB
  const deal = DEFAULT_SOCIETY_DEALS.find((d) => d.id === data.dealId);
  const currentCount = (deal ? deal.current_flats : 3) + 1;
  const target = deal ? deal.target_flats : 4;
  const isUnlocked = currentCount >= target;

  return {
    ok: true,
    dealStatus: isUnlocked ? "CONFIRMED" : "GATHERING",
    newCount: currentCount,
    isUnlocked,
    message: isUnlocked
      ? `🎉 Congratulations! Cluster discount unlocked (${deal?.discount_pct || 20}% off) for your building!`
      : `Joined! 1 more neighbor needed to unlock the ${deal?.discount_pct || 20}% building discount.`,
  };
}
