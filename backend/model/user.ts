import mongoose from "mongoose";
const { Schema } = mongoose;
const userSchema = new Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true },
    password: String,
    stripe_customer_id: String,
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
