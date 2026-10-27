import {
  validateReferralContact,
  generateReferralCode,
  buildShareLinks,
  getReferralStats,
  ArtisanReferral,
} from "./referral.functions";

async function runTests() {
  console.log("--- Running Karighar Artisan Referral Unit Tests ---");

  // 1. Contact validation
  const validEmail = validateReferralContact("ramesh.carpenter@gmail.com");
  if (!validEmail || validEmail.type !== "EMAIL" || validEmail.cleanContact !== "ramesh.carpenter@gmail.com") {
    throw new Error("Failed email validation");
  }

  const validPhone1 = validateReferralContact("9820199999");
  if (!validPhone1 || validPhone1.type !== "PHONE" || validPhone1.cleanContact !== "9820199999") {
    throw new Error("Failed 10-digit phone validation");
  }

  const validPhone2 = validateReferralContact("+91 98201 99999");
  if (!validPhone2 || validPhone2.type !== "PHONE" || validPhone2.cleanContact !== "9820199999") {
    throw new Error("Failed +91 phone validation");
  }

  const invalidContact = validateReferralContact("12345");
  if (invalidContact !== null) {
    throw new Error("Invalid contact should return null");
  }

  console.log("✓ Contact validation passed");

  // 2. Referral code generation
  const code = generateReferralCode("Ramesh Sharma");
  if (!code.startsWith("KG-RAME-") || code.length !== 12) {
    throw new Error(`Referral code generation unexpected: ${code}`);
  }
  console.log("✓ Referral code generation passed:", code);

  // 3. Share links
  const links = buildShareLinks({
    referral_code: "KG-RAME-5521",
    referred_name: "Ramesh Sharma",
    referrer_name: "Vansh",
    trade: "Carpentry",
    referred_contact: "9820199999",
    contact_type: "PHONE",
  });

  if (!links.joinUrl.includes("KG-RAME-5521")) {
    throw new Error("Share link missing referral code");
  }
  if (!links.whatsappUrl.includes("wa.me/919820199999")) {
    throw new Error("WhatsApp URL incorrect");
  }
  console.log("✓ Share links generation passed");

  // 4. Referral stats
  const sampleReferrals: ArtisanReferral[] = [
    {
      id: "ref-1",
      referrer_name: "Vansh",
      referrer_contact: "9820000000",
      referred_name: "Ramesh",
      referred_contact: "9820199999",
      contact_type: "PHONE",
      trade: "Carpentry",
      city: "Mumbai",
      referral_code: "KG-RAME-1",
      status: "INVITED",
      reward_paise: 50000,
      pro_bonus_paise: 25000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "ref-2",
      referrer_name: "Vansh",
      referrer_contact: "9820000000",
      referred_name: "Sunil",
      referred_contact: "sunil.electric@gmail.com",
      contact_type: "EMAIL",
      trade: "Electrical",
      city: "Mumbai",
      referral_code: "KG-SUNI-2",
      status: "KYC_VERIFIED",
      reward_paise: 50000,
      pro_bonus_paise: 25000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "ref-3",
      referrer_name: "Vansh",
      referrer_contact: "9820000000",
      referred_name: "Abdul",
      referred_contact: "9820333333",
      contact_type: "PHONE",
      trade: "Plumbing",
      city: "Mumbai",
      referral_code: "KG-ABDU-3",
      status: "REWARD_DISBURSED",
      reward_paise: 50000,
      pro_bonus_paise: 25000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const stats = getReferralStats(sampleReferrals);
  if (stats.totalInvited !== 3) throw new Error("Total invited mismatch");
  if (stats.kycVerified !== 2) throw new Error("KYC verified mismatch");
  if (stats.jobsCompleted !== 1) throw new Error("Jobs completed mismatch");
  if (stats.rewardsEarnedPaise !== 50000) throw new Error("Rewards earned mismatch");
  if (stats.pendingRewardsPaise !== 100000) throw new Error("Pending rewards mismatch");

  console.log("✓ Referral stats computation passed:", stats);
  console.log("ALL TESTS PASSED! 🎉");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
