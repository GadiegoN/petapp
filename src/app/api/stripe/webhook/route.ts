import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature") || "";

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    const adminDb = getAdminDb();
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const organizationId = session.metadata?.organizationId;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        if (organizationId) {
          await adminDb.collection("organizations").doc(organizationId).update({
            plan: "pro",
            stripeSubscriptionId: subscriptionId || null,
            stripeCustomerId: customerId || null,
            updatedAt: FieldValue.serverTimestamp(),
          });
          console.log(`Organization ${organizationId} upgraded to Pro via Stripe checkout.`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const subscriptionId = subscription.id;

        // Query organization with this subscription ID
        const snapshot = await adminDb
          .collection("organizations")
          .where("stripeSubscriptionId", "==", subscriptionId)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const orgDoc = snapshot.docs[0];
          await orgDoc.ref.update({
            plan: "free",
            isPublicPartner: false, // Reset visibility back to default on Free
            stripeSubscriptionId: null,
            updatedAt: FieldValue.serverTimestamp(),
          });
          console.log(`Organization ${orgDoc.id} downgraded to Free due to subscription deletion.`);
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

