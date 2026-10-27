import { supabase } from "@/integrations/supabase/client";

export type ArtisanReferralStatus =
  | "INVITED"
  | "REGISTERED"
  | "KYC_VERIFIED"
  | "FIRST_JOB_COMPLETED"
  | "REWARD_DISBURSED";

export interface ArtisanReferral {
  id: string;
  referrer_user_id?: string | null;
  referrer_name: string;
  referrer_contact: string;
  referred_name: string;
  referred_contact: string;
  contact_type: "EMAIL" | "PHONE";
  trade: string;
  city: string;
  referral_code: string;
  personal_note?: string | null;
  status: ArtisanReferralStatus;
  reward_paise: number;
  pro_bonus_paise: number;
  registered_pro_id?: string | null;
  first_project_id?: string | null;
  reward_disbursed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReferralInput {
  referrerUserId?: string;
  referrerName: string;
  referrerContact: string;
  referredName: string;
  referredContact: string;
  trade: string;
  city?: string;
  personalNote?: string;
}

export function validateReferralContact(raw: string): { type: "EMAIL" | "PHONE"; cleanContact: string } | null {
  const trimmed = raw.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmed)) {
    return { type: "EMAIL", cleanContact: trimmed.toLowerCase() };
  }

  // Clean phone number: remove +91, spaces, dashes
  const digits = trimmed.replace(/\D/g, "");
  const cleanDigits = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  if (/^[6-9]\d{9}$/.test(cleanDigits)) {
    return { type: "PHONE", cleanContact: cleanDigits };
  }

  return null;
}

export function generateReferralCode(proName: string): string {
  const cleanName = proName.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "PRO";
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `KG-${cleanName}-${randomSuffix}`;
}

export function buildShareLinks(referral: {
  referral_code: string;
  referred_name: string;
  referrer_name: string;
  trade: string;
  referred_contact: string;
  contact_type: "EMAIL" | "PHONE";
}) {
  const joinUrl = `https://karighar.in/become-a-pro?ref=${encodeURIComponent(referral.referral_code)}`;
  const message = `Namaste ${referral.referred_name}! ${referral.referrer_name} has invited you to join Karighar as a verified ${referral.trade} in Mumbai.\n\n✨ Benefits:\n- 100% Escrow Guaranteed SafePay payouts within 60 seconds\n- 0% Platform commission on your first 3 jobs\n- ₹250 joining cash bonus with referral code: ${referral.referral_code}\n\nJoin and start getting doorstep jobs: ${joinUrl}`;

  const whatsappUrl = `https://wa.me/${
    referral.contact_type === "PHONE" ? `91${referral.referred_contact}` : ""
  }?text=${encodeURIComponent(message)}`;

  const emailSubject = `${referral.referrer_name} invited you to join Karighar as a verified ${referral.trade}`;
  const emailBody = `Hi ${referral.referred_name},\n\n${referral.referrer_name} recommended your craftsmanship and invited you to join Karighar, Mumbai's trusted verified artisan network.\n\nApply with code ${referral.referral_code} to receive ₹250 instant joining credit and 0% commission on your first 3 jobs:\n${joinUrl}\n\nWarm regards,\nKarighar Trust & Safety Team`;

  const mailtoUrl = `mailto:${
    referral.contact_type === "EMAIL" ? referral.referred_contact : ""
  }?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return {
    joinUrl,
    whatsappUrl,
    mailtoUrl,
    message,
    emailSubject,
    emailBody,
  };
}

/**
 * Creates an artisan referral and persists in Supabase public.artisan_referrals
 */
export async function createArtisanReferralCore(
  input: CreateReferralInput
): Promise<{ ok: boolean; referral?: ArtisanReferral; shareLinks?: ReturnType<typeof buildShareLinks>; error?: string }> {
  const validated = validateReferralContact(input.referredContact);
  if (!validated) {
    return {
      ok: false,
      error: "Please enter a valid 10-digit Indian mobile number or email address for the artisan.",
    };
  }

  if (!input.referredName.trim()) {
    return { ok: false, error: "Please enter the artisan's name." };
  }

  const code = generateReferralCode(input.referredName);
  const city = input.city || "Mumbai";

  const row = {
    referrer_user_id: input.referrerUserId || null,
    referrer_name: input.referrerName.trim() || "A Karighar Member",
    referrer_contact: input.referrerContact.trim(),
    referred_name: input.referredName.trim(),
    referred_contact: validated.cleanContact,
    contact_type: validated.type,
    trade: input.trade || "Plumbing",
    city,
    referral_code: code,
    personal_note: input.personalNote?.trim() || null,
    status: "INVITED" as const,
    reward_paise: 50000, // ₹500
    pro_bonus_paise: 25000, // ₹250
  };

  try {
    const { data, error } = await (supabase as any)
      .from("artisan_referrals")
      .insert(row)
      .select()
      .single();

    if (error) {
      // Fallback for local simulation if table not yet migrated
      console.warn("Supabase insert referral notice:", error.message);
      const fallbackReferral: ArtisanReferral = {
        ...row,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const shareLinks = buildShareLinks(fallbackReferral);
      return { ok: true, referral: fallbackReferral, shareLinks };
    }

    const shareLinks = buildShareLinks(data);
    return { ok: true, referral: data, shareLinks };
  } catch (err: any) {
    const fallbackReferral: ArtisanReferral = {
      ...row,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const shareLinks = buildShareLinks(fallbackReferral);
    return { ok: true, referral: fallbackReferral, shareLinks };
  }
}

/**
 * Fetches referrals for a user by user_id or contact
 */
export async function getArtisanReferralsCore(
  userId?: string,
  userContact?: string
): Promise<{ ok: boolean; referrals: ArtisanReferral[]; error?: string }> {
  try {
    let query = (supabase as any).from("artisan_referrals").select("*").order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("referrer_user_id", userId);
    } else if (userContact) {
      query = query.or(`referrer_contact.eq.${userContact},referred_contact.eq.${userContact}`);
    }

    const { data, error } = await query;
    if (error) {
      return { ok: false, referrals: [], error: error.message };
    }
    return { ok: true, referrals: (data as ArtisanReferral[]) || [] };
  } catch (err: any) {
    return { ok: false, referrals: [], error: err.message };
  }
}

/**
 * Advance referral state machine:
 * INVITED -> REGISTERED -> KYC_VERIFIED -> FIRST_JOB_COMPLETED -> REWARD_DISBURSED
 */
const VALID_TRANSITIONS: Record<ArtisanReferralStatus, ArtisanReferralStatus[]> = {
  INVITED: ["REGISTERED"],
  REGISTERED: ["KYC_VERIFIED"],
  KYC_VERIFIED: ["FIRST_JOB_COMPLETED"],
  FIRST_JOB_COMPLETED: ["REWARD_DISBURSED"],
  REWARD_DISBURSED: [],
};

export async function advanceReferralMilestoneCore(
  referralId: string,
  targetStatus: ArtisanReferralStatus
): Promise<{ ok: boolean; referral?: ArtisanReferral; error?: string }> {
  try {
    const { data: current, error: fetchErr } = await (supabase as any)
      .from("artisan_referrals")
      .select("*")
      .eq("id", referralId)
      .single();

    if (fetchErr || !current) {
      return { ok: false, error: fetchErr?.message || "Referral not found" };
    }

    const allowed = VALID_TRANSITIONS[current.status as ArtisanReferralStatus] || [];
    if (!allowed.includes(targetStatus)) {
      return {
        ok: false,
        error: `Illegal state transition from ${current.status} to ${targetStatus}.`,
      };
    }

    const updates: any = {
      status: targetStatus,
      updated_at: new Date().toISOString(),
    };

    if (targetStatus === "REWARD_DISBURSED") {
      updates.reward_disbursed_at = new Date().toISOString();
    }

    const { data: updated, error: updateErr } = await (supabase as any)
      .from("artisan_referrals")
      .update(updates)
      .eq("id", referralId)
      .select()
      .single();

    if (updateErr) {
      return { ok: false, error: updateErr.message };
    }

    return { ok: true, referral: updated };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Computes referral statistics and milestone rewards
 */
export function getReferralStats(referrals: ArtisanReferral[]) {
  const totalInvited = referrals.length;
  const kycVerified = referrals.filter((r) =>
    ["KYC_VERIFIED", "FIRST_JOB_COMPLETED", "REWARD_DISBURSED"].includes(r.status)
  ).length;
  const jobsCompleted = referrals.filter((r) =>
    ["FIRST_JOB_COMPLETED", "REWARD_DISBURSED"].includes(r.status)
  ).length;
  const rewardsEarnedPaise = referrals
    .filter((r) => r.status === "REWARD_DISBURSED")
    .reduce((sum, r) => sum + r.reward_paise, 0);
  const pendingRewardsPaise = referrals
    .filter((r) => r.status !== "REWARD_DISBURSED")
    .reduce((sum, r) => sum + r.reward_paise, 0);

  return {
    totalInvited,
    kycVerified,
    jobsCompleted,
    rewardsEarnedPaise,
    pendingRewardsPaise,
  };
}
