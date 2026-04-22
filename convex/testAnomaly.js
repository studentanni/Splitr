import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Test function to create sample expenses and test anomaly detection
export const testAnomalyDetection = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Create sample expenses for testing
    const sampleExpenses = [
      { description: "Regular Lunch", amount: 150, category: "Food" },
      { description: "Coffee", amount: 80, category: "Food" },
      { description: "Movie Ticket", amount: 200, category: "Entertainment" },
      { description: "Groceries", amount: 500, category: "Food" },
      { description: "Gas", amount: 300, category: "Transport" },
      { description: "Normal Dinner", amount: 180, category: "Food" },
      { description: "Anomaly - Very Expensive Dinner", amount: 2500, category: "Food" }, // This should be anomalous
      { description: "Regular Lunch", amount: 160, category: "Food" },
      { description: "Coffee", amount: 75, category: "Food" },
      { description: "Anomaly - Huge Shopping", amount: 5000, category: "Shopping" }, // This should be highly anomalous
    ];

    const createdExpenses = [];
    
    // Create sample expenses
    for (const expense of sampleExpenses) {
      const expenseId = await ctx.runMutation(internal.expenses.createExpense, {
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Random date within last 30 days
        paidByUserId: args.userId,
        splitType: "equal",
        splits: [
          {
            userId: args.userId,
            amount: expense.amount,
            paid: false,
          },
        ],
      });
      
      createdExpenses.push({ id: expenseId, ...expense });
    }

    // Wait a bit for data to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run anomaly detection on the created expenses
    const analysis = await ctx.runAction(internal.anomalyDetection.analyzeRecentExpenses, {
      userId: args.userId,
      daysBack: 30,
    });

    // Get spending insights
    const insights = await ctx.runAction(internal.anomalyDetection.getSpendingInsights, {
      userId: args.userId,
    });

    return {
      createdExpenses: createdExpenses.length,
      anomaliesFound: analysis.anomaliesFound,
      anomalies: analysis.anomalies,
      insights: insights.insights,
      patterns: insights.patterns,
      recommendations: insights.recommendations,
    };
  },
});

// Quick test for single expense anomaly detection
export const testSingleExpense = action({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runAction(internal.anomalyDetection.detectAnomaly, {
      userId: args.userId,
      amount: args.amount,
      category: args.category,
    });

    return result;
  },
});
