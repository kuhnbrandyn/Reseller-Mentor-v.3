import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);


const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ✅ Supabase service role client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get("stripe-signature");

  if (!sig || !endpointSecret) {
    console.error("❌ Missing Stripe signature or webhook secret");
    return NextResponse.json(
      { error: "Missing Stripe signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error("❌ Stripe signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook signature error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const email =
        session.customer_email ||
        session.customer_details?.email;


      if (!email) {
        console.error("❌ No email found on checkout session");
        return NextResponse.json(
          { error: "Missing customer email" },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("profiles")                       // ✅ correct table
        .update({
          payment_status: "paid",              // ✅ correct column
        })
        .eq("email", email.toLowerCase());

      if (error) {
        console.error("❌ Supabase update failed:", error);
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        );
      }

      console.log("✅ User marked paid:", email, data);
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      console.warn("⚠️ Payment failed:", invoice.customer_email);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler crashed:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
