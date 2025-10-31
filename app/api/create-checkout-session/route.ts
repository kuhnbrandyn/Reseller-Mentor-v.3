import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, priceId, promoCode } = body;

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    console.log("✅ Creating checkout for:", email, "using price:", priceId);
    console.log("Promo code received:", promoCode || "none");

    // === Look up promotion code ===
    let couponId: string | null = null;

    if (promoCode) {
      const promo = await stripe.promotionCodes.list({
        code: promoCode.trim(),
        active: true,
      });

      if (promo.data.length > 0) {
        // 🆕 Use the coupon ID tied to the promo
        couponId = promo.data[0].coupon.id;
        console.log("✅ Promo code found:", promoCode, "Coupon ID:", couponId);
      } else {
        console.warn("⚠️ Promo code not found or inactive:", promoCode);
      }
    }

    // === Create Stripe Checkout Session ===
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],

      // 🆕 Allow user to manually add/change promo
      allow_promotion_codes: true,

      // 🆕 Auto-apply coupon if one was entered and valid
      discounts: couponId ? [{ coupon: couponId }] : undefined,

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

