import express from "express";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const router = express.Router();
console.log(process.env.STRIPE_SECRET_KEY!);

// Add this to your webhook router for testing
router.get("/webhook",  (req, res) => {
  res.json({ message: "Webhook endpoint is reachable" });
});

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("🔥 Webhook endpoint hit!");
    console.log("Headers:", req.headers);
    // console.log("Body length:", req.body?.length);
    console.log("Signature:", req.headers["stripe-signature"]);
    console.log("Endpoint Secret exists:", !!process.env.STRIPE_WEBHOOK_SECRET);
    console.log(
      "Secret value:",
      process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + "..."
    );

    let event = req.body;
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    try {
      if (!sig || !endpointSecret) {
        console.log("⚠️ Missing signature or endpoint secret");
        return res.sendStatus(400);
      }
      // Use the async one check whether stripe requires sync or async method here
      event = await stripe.webhooks.constructEventAsync(req.body, sig, endpointSecret);

      console.log("✅ Webhook verified! Event type:", event.type);
      console.log("Event Data:", JSON.stringify(event.data, null, 2));
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
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log(
          `PaymentIntent for ${paymentIntent.amount} was successful!`
        );
        // Then define and call a method to handle the successful payment intent.
        // handlePaymentIntentSucceeded(paymentIntent);
        break;
      case "payment_method.attached":
        const paymentMethod = event.data.object;
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
  }
);

export default router;
