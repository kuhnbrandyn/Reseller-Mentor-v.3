import { NextResponse } from "next/server";
import Stripe from "stripe";

// ✅ Initialize Stripe (auto uses your account's default API version)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, priceId, promoCode } = body; // ✅ added promoCode

    // === Input validation ===
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    console.log("✅ Creating checkout for:", email, "using price:", priceId);
    console.log("Promo code received:", promoCode || "none");

    // === Optional: Look up promotion code ===
    let discount = null;
    if (promoCode) {
      const promo = await stripe.promotionCodes.list({
        code: promoCode.trim(),
        active: true,
      });

      if (promo.data.length > 0) {
        discount = promo.data[0].id;
        console.log("✅ Promo code found:", promoCode);
      } else {
        console.warn("⚠️ Promo code not found or inactive:", promoCode);
      }
    }

    console.log("🔍 Debug Info:");
    console.log("STRIPE_SECRET_KEY present:", !!process.env.STRIPE_SECRET_KEY);
    console.log("Price ID received:", priceId);
    console.log("Base URL:", process.env.NEXT_PUBLIC_BASE_URL);

    // === Create Stripe Checkout Session ===
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],

      // 🆕 NEW LINE: Allow manual promo code entry on the Stripe checkout page
      allow_promotion_codes: true,

      // 🆕 Existing logic still applies an automatic discount if a valid promo was found
      discounts: discount ? [{ promotion_code: discount }] : undefined,

      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/signup?canceled=true`,
    });

    console.log("✅ Checkout session created:", session.url);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("❌ Stripe Checkout error:", error.message || error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}




