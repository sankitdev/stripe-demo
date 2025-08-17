import mongoose from "mongoose";
const { Schema } = mongoose;

const planSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    stripe_price_id: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "usd",
    },
    interval: {
      type: String,
      required: true,
    },
    features: [String],
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Plan = mongoose.model("Plan", planSchema);
