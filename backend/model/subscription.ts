import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    //stripe fields
    stripe_subscription_id: String,
    stripe_price_id: String,

    //Status tracking
    status: {
      type: String,
      enum: [
        "incomplete",
        "incomplete_expired",
        "active",
        "canceled",
        "past_due",
        "unpaid",
        "trialing",
      ],
      required: true,
    },

    //Billing periods
    current_period_start: Date,
    current_period_end: Date,
    cancel_at_period_end: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
