import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { organizationId, userId, priceId } = await request.json();

    if (!organizationId || !userId) {
      return NextResponse.json(
        { error: "organizationId and userId are required" },
        { status: 400 }
      );
    }

    const stripePriceId = priceId || process.env.STRIPE_PRO_PRICE_ID;
    if (!stripePriceId) {
      return NextResponse.json(
        { error: "Stripe Price ID is not configured" },
        { status: 400 }
      );
    }

    let appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl && process.env.VERCEL_URL) {
      appUrl = `https://${process.env.VERCEL_URL}`;
    }

    if (!appUrl) {
      appUrl = "http://localhost:3000";
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        organizationId,
        userId,
      },
      success_url: `${appUrl}/organizacao/perfil?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/organizacao/perfil?payment=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
