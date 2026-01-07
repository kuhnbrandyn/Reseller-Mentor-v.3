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
    switch (event.type) {

      // ✅ Checkout completed (initial subscription creation)
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const email =
          session.customer_email ||
          session.customer_details?.email;

        if (!email) {
          console.error("❌ No email found on checkout session");
          break;
        }

        console.log("✅ Checkout completed for:", email);

        const { data, error } = await supabaseAdmin
          .from("profiles")
          .update({
            payment_status: "paid",
          })
          .eq("email", email.toLowerCase());

        if (error) {
          console.error("❌ Supabase update failed (checkout):", error);
        } else {
          console.log("✅ User marked paid via checkout:", email, data);
        }

        break;
      }

      // ✅ Invoice payment succeeded (recurring + promo flows)
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        const email = invoice.customer_email;

        if (!email) {
          console.warn("⚠️ No customer_email found on invoice");
          break;
        }

        console.log("✅ Invoice payment succeeded for:", email);

        const { data, error } = await supabaseAdmin
          .from("profiles")
          .update({
            payment_status: "paid",
          })
          .eq("email", email.toLowerCase());

        if (error) {
          console.error("❌ Supabase update failed (invoice):", error);
        } else {
          console.log("✅ User marked paid via invoice:", email, data);
        }

        break;
      }

      // ⚠️ Payment failed (optional handling)
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn("⚠️ Payment failed for:", invoice.customer_email);
        break;
      }

      default:
        console.log("ℹ️ Unhandled Stripe event:", event.type);
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
