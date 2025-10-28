import { NextResponse } from "next/server";
import Stripe from "stripe";

// ✅ Initialize Stripe (auto uses your account's default API version)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const bodyText = await req.text(); // safer body parsing for edge/runtime
    const body = JSON.parse(bodyText || "{}");

    const email = body?.email?.trim();
    const priceId = body?.priceId?.trim();
    const promoCode = body?.promoCode?.trim();

    if (!email) {
      console.error("❌ Missing email in checkout request");
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    if (!priceId) {
      console.error("❌ Missing priceId in checkout request");
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    console.log("✅ Creating checkout for:", email, "using price:", priceId);
    console.log("Promo code received:", promoCode || "none");

    let discount: string | null = null;

    if (promoCode && promoCode.length > 0) {
      try {
        const promoList = await stripe.promotionCodes.list({
          code: promoCode,
          active: true,
          limit: 1,
        });

        if (promoList.data.length > 0) {
          discount = promoList.data[0].id;
          console.log("✅ Promo code found and active:", promoCode);
        } else {
          console.warn("⚠️ Promo code not found or inactive:", promoCode);
        }
      } catch (promoError: any) {
        console.error("❌ Error looking up promo code:", promoError.message || promoError);
      }
    }

    console.log("🔍 Debug Info:");
    console.log("STRIPE_SECRET_KEY present:", !!process.env.STRIPE_SECRET_KEY);
    console.log("Price ID received:", priceId);
    console.log("Base URL:", process.env.NEXT_PUBLIC_BASE_URL);
    console.log("Promotion code ID applied:", discount || "none");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      discounts: discount ? [{ promotion_code: discount }] : undefined,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/signup?canceled=true`,
    });

    console.log("✅ Checkout session created successfully:", session.url);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("❌ Stripe Checkout error:", error.message || error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}




