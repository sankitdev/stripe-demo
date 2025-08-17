import express from "express";
import Stripe from "stripe";
import { Subscription } from "../model/subscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("🔥 Webhook endpoint hit!");
    let event = req.body;
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    try {
      if (!sig || !endpointSecret) {
        console.log("⚠️ Missing signature or endpoint secret");
        return res.sendStatus(400);
      }
      // Use the async one check whether stripe requires sync or async method here
      event = await stripe.webhooks.constructEventAsync(
        req.body,
        sig,
        endpointSecret
      );

      console.log("✅ Webhook verified! Event type:", event.type);
    } catch (error) {
      if (error instanceof Error) {
        console.log(
          `⚠️  Webhook signature verification failed.`,
          error.message
        );
      } else {
        console.log(`⚠️  Unknown error during webhook verification`, error);
      }
      return res.sendStatus(400);
    }
    switch (event.type) {
      case "invoice.payment_succeeded":
        const invoice = event.data.object;
        console.log(
          "💰 Payment succeeded for subscription:",
          invoice.subscription
        );

        // Mark subscription as active after successful payment
        if (invoice.subscription) {
          await Subscription.findOneAndUpdate(
            { stripe_subscription_id: invoice.subscription },
            { status: "active" }
          );
        }
        break;

      case "invoice.payment_failed":
        const failedInvoice = event.data.object;
        console.log(
          "💥 Payment failed for subscription:",
          failedInvoice.subscription
        );

        // Mark subscription as past_due after failed payment
        if (failedInvoice.subscription) {
          await Subscription.findOneAndUpdate(
            { stripe_subscription_id: failedInvoice.subscription },
            { status: "past_due" }
          );
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
  }
);

export default router;
