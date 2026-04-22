import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Manually trigger anomaly detection for an existing expense.
 * Useful for testing or re-analyzing expenses.
 */
export const testAnomalyDetection = action({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    // 1. Fetch the expense details
    const expense = await ctx.runQuery(internal.expenses.getExpenseForML, {
      expenseId: args.expenseId,
    });

    if (!expense) {
      throw new Error("Expense not found");
    }

    console.log(`Testing anomaly detection for: ${expense.description} - ₹${expense.amount}`);

    // 2. Trigger detection
    const result = await ctx.runAction(internal.anomalyDetection.detectAnomalyAndSave, {
      expenseId: expense._id,
      userId: expense.paidByUserId,
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
    });

    console.log("Analysis Result:", result);
    return result;
  },
});

/**
 * Create a dummy anomalous expense to see if the model detects it.
 * This will trigger the real ML logic.
 * Default is a ₹99,999 "Coffee" which is a clear anomaly.
 */
export const createTestAnomalousExpense = mutation({
  args: {
    userId: v.id("users"),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const desc = args.description || "Test Anomalous Coffee";
    const amt = args.amount || 99999;
    const cat = args.category || "Food & Drink";

    const expenseId = await ctx.db.insert("expenses", {
      description: desc,
      amount: amt,
      category: cat,
      date: Date.now(),
      paidByUserId: args.userId,
      splitType: "equal",
      splits: [
        {
          userId: args.userId,
          amount: amt,
          paid: true,
        },
      ],
      createdBy: args.userId,
    });

    // Trigger the ML detection immediately
    await ctx.scheduler.runAfter(0, internal.anomalyDetection.detectAnomalyAndSave, {
      expenseId,
      userId: args.userId,
      amount: amt,
      description: desc,
      category: cat,
    });

    return {
      message: `Test expense created: ${desc} for ₹${amt}. Check Dashboard in 5 seconds.`,
      expenseId,
    };
  },
});
