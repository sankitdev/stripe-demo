// Add this temporarily to test your endpoint - you can create a separate script
// seedPlans.ts or add to your existing code

import { Plan } from "./model/plan";

export default async function seedPlans() {
  // Clear existing plans (optional)
  await Plan.deleteMany({});

  // Create test plans with your actual Stripe price IDs
  const monthlyPlan = new Plan({
    name: "Monthly Plan",
    description: "Monthly subscription",
    stripe_price_id: "price_1RwmSP2Sww0pTni1y0oqFbYl",
    price: 9.0,
    currency: "usd",
    interval: "month",
    features: ["Feature 1", "Feature 2"],
    is_active: true,
  });

  const yearlyPlan = new Plan({
    name: "Yearly Plan",
    description: "Yearly subscription (save money!)",
    stripe_price_id: "price_1RwmTM2Sww0pTni1SBXiZnIp", // Replace with your actual price ID
    price: 99.0,
    currency: "usd",
    interval: "year",
    features: ["Feature 1", "Feature 2", "Save 2 months"],
    is_active: true,
  });

  await monthlyPlan.save();
  await yearlyPlan.save();

  console.log("✅ Plans created:");
  console.log("Monthly Plan ID:", monthlyPlan._id);
  console.log("Yearly Plan ID:", yearlyPlan._id);
}
