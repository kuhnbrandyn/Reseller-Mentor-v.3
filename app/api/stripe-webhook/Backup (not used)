import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

// ✅ Initialize Stripe with your secret key (no .clover!)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover", // 👈 keep this or remove if you prefer
});

// ✅ Webhook secret from your environment
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get("stripe-signature");

  if (!sig || !endpointSecret) {
    return NextResponse.json(
      { error: "Missing Stripe signature or endpoint secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error("⚠️ Webhook signature error:", err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const { data, error } = await supabase
          .from("users")
          .update({ subscription_status: "active" })
          .eq("email", session.customer_email);

        if (error) {
          console.error("Error updating Supabase user:", error);
        } else {
          console.log("✅ User subscription updated:", data);
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn("❌ Payment failed for:", invoice.customer_email);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
