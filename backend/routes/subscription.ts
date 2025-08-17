// routes/subscription.ts
import express from "express";
import Stripe from "stripe";
import { User } from "../model/user";
import { Plan } from "../model/plan";
import { Subscription } from "../model/subscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

const router = express.Router();

router.post("/create-subscription", async (req, res) => {
  try {
    const { planId, email } = req.body;

    // validates input
    if (!planId || !email) {
      return res.status(400).json({
        success: false,
        error: "planId & email are required",
      });
    }
    // finds the plan
    const plan = await Plan.findById({
      _id: planId,
    });
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: "Plan not found",
      });
    }
    // creates user if not exists
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
      console.log("✅ Created new user:", email);
    }

    // Create or get Stripe customer
    let stripeCustomer;
    if (user.stripe_customer_id) {
      stripeCustomer = await stripe.customers.retrieve(user.stripe_customer_id);
      console.log("✅ Found existing Stripe customer:", stripeCustomer.id);
    } else {
      // if not create new Stripe Customer
      stripeCustomer = await stripe.customers.create({
        email: email,
        name: user?.name ?? undefined,
        metadata: {
          userId: user._id.toString(),
        },
      });

      // save Stripe customer Id to user
      user.stripe_customer_id = stripeCustomer.id;
      await user.save();
      console.log("✅ Created new Stripe customer:", stripeCustomer.id);
    }

    // check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      userId: user._id,
      status: { $in: ["active", "trialing", "incomplete"] },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        error: "User already has an active subscription",
      });
    }

    // create stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [
        {
          price: plan.stripe_price_id,
        },
      ],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.confirmation_secret"],
    });

    console.log("✅ Created Stripe subscription:", stripeSubscription.id);
    // save subscription to database

    const subscriptionItem = stripeSubscription.items?.data?.[0];
    if (
      !subscriptionItem ||
      !subscriptionItem.current_period_start ||
      !subscriptionItem.current_period_end
    ) {
      throw new Error("Invalid subscription data received from Stripe");
    }
    const subscription = new Subscription({
      userId: user._id,
      planId: plan._id,
      stripe_subscription_id: stripeSubscription.id,
      stripe_price_id: plan.stripe_price_id,
      status: stripeSubscription.status, // will be 'incomplete'
      current_period_start: new Date(
        subscriptionItem.current_period_start * 1000
      ),
      current_period_end: new Date(subscriptionItem.current_period_end * 1000),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
    });

    await subscription.save();
    console.log("✅ Saved subscription to database");

    // 7. Return client secret (official Stripe way)
    const invoice = stripeSubscription.latest_invoice as Stripe.Invoice;

    res.json({
      success: true,
      subscription_id: stripeSubscription.id,
      clientSecret: invoice.confirmation_secret!.client_secret,
      status: stripeSubscription.status,
    });
  } catch (error) {
    console.error("❌ Create subscription error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
