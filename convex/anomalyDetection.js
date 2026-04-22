import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import Groq from "groq-sdk";

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in Convex environment variables. Please add it in the Convex Dashboard (Settings > Environment Variables).");
  }
  return new Groq({ apiKey });
};

const GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Action that detects anomaly and saves the result to the database.
 * This is designed to be called from a mutation.
 */
export const detectAnomalyAndSave = action({
  args: {
    expenseId: v.id("expenses"),
    userId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const analysis = await ctx.runAction(internal.anomalyDetection.detectAnomaly, {
      userId: args.userId,
      amount: args.amount,
      description: args.description,
      category: args.category,
    });

    await ctx.runMutation(internal.expenses.updateExpenseAnomaly, {
      expenseId: args.expenseId,
      isAnomalous: analysis.isAnomalous,
      anomalyScore: analysis.anomalyScore,
      anomalyReason: analysis.anomalyReason,
      predictedAmount: analysis.predictedAmount,
    });

    return analysis;
  },
});

/**
 * Detects if a new expense is an anomaly based on user's historical data.
 */
export const detectAnomaly = action({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const history = await ctx.runQuery(internal.expenses.getUserExpensesForML, {
      userId: args.userId,
    });

    if (history.length < 1) {
      return {
        isAnomalous: false,
        anomalyScore: 0,
        anomalyReason: "Add your first expense to start AI analysis",
        predictedAmount: args.amount,
      };
    }

    const historicalData = history.slice(0, 20).map((e) => ({
      amount: e.amount,
      description: e.description,
      category: e.category,
      date: new Date(e.date).toLocaleDateString(),
    }));

    const currentExpense = {
      amount: args.amount,
      description: args.description,
      category: args.category || "Other",
      date: new Date().toLocaleDateString(),
    };

    const prompt = `
You are an expert financial anomaly detection system.
Analyze the following new expense against the user's historical spending patterns.

Historical Expenses:
${JSON.stringify(historicalData)}

New Expense:
${JSON.stringify(currentExpense)}

STRICT RULES - Follow these exactly:
1. If new expense amount is >2x the average of ALL historical expenses, mark as ANOMALY.
2. If new expense amount is >5000 AND it's in a "Food & Drink" or "Coffee" category, mark as ANOMALY (unless history shows similar amounts).
3. If this is the first expense in a category and amount >2000, mark as ANOMALY.
4. If expense amount is >50000 in any category, ALWAYS mark as ANOMALY.
5. If expense description contains "test", "dummy", "sample" - mark as NOT anomalous.

Respond ONLY in JSON format:
{"isAnomalous": true/false, "anomalyScore": 0-10, "anomalyReason": "brief reason", "predictedAmount": number}
`;

    try {
      const groq = getGroqClient();
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a financial anomaly detection AI. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: GROQ_MODEL,
        temperature: 0.1,
        max_tokens: 200,
      });

      const text = chatCompletion.choices[0]?.message?.content || "{}";
      const jsonStr = text.replace(/```json|```/g, "").trim();
      const analysis = JSON.parse(jsonStr);

      return {
        isAnomalous: analysis.isAnomalous || false,
        anomalyScore: analysis.anomalyScore || 0,
        anomalyReason: analysis.anomalyReason || "Analysis complete",
        predictedAmount: analysis.predictedAmount || args.amount,
      };
    } catch (error) {
      console.error("Error in anomaly detection:", error);
      return {
        isAnomalous: false,
        anomalyScore: 0,
        anomalyReason: "Analysis failed",
        predictedAmount: args.amount,
      };
    }
  },
});

/**
 * Analyzes recent expenses in batch to find anomalies.
 */
export const analyzeRecentExpenses = action({
  args: {
    userId: v.id("users"),
    daysBack: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - args.daysBack * 24 * 60 * 60 * 1000;
    const recentExpenses = await ctx.runQuery(internal.expenses.getRecentExpenses, {
      userId: args.userId,
      cutoffDate,
    });

    console.log("Analyzing", recentExpenses.length, "expenses for anomalies");

    if (recentExpenses.length === 0) {
      return { anomaliesFound: 0, anomalies: [] };
    }

    const anomalies = [];
    for (const expense of recentExpenses) {
      console.log("Checking expense:", expense.description, "₹" + expense.amount, "isAnomalous:", expense.isAnomalous);

      const analysis = await ctx.runAction(internal.anomalyDetection.detectAnomaly, {
        userId: args.userId,
        amount: expense.amount,
        description: expense.description,
        category: expense.category,
      });

      if (analysis.isAnomalous) {
        await ctx.runMutation(internal.expenses.updateExpenseAnomaly, {
          expenseId: expense._id,
          isAnomalous: analysis.isAnomalous,
          anomalyScore: analysis.anomalyScore,
          anomalyReason: analysis.anomalyReason,
          predictedAmount: analysis.predictedAmount,
        });
        anomalies.push({ id: expense._id, ...analysis });
      } else {
        await ctx.runMutation(internal.expenses.updateExpenseAnomaly, {
          expenseId: expense._id,
          isAnomalous: false,
          anomalyScore: analysis.anomalyScore,
          anomalyReason: analysis.anomalyReason,
          predictedAmount: analysis.predictedAmount,
        });
      }
    }

    return {
      anomaliesFound: anomalies.length,
      anomalies,
    };
  },
});

export const getSpendingInsights = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const expenses = await ctx.runQuery(internal.expenses.getUserExpensesForML, {
      userId: args.userId,
    });

    if (expenses.length === 0) {
      return {
        insights: "Add some expenses to get AI-powered spending insights.",
        totalSpent: 0,
        categoryBreakdown: {},
      };
    }

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryBreakdown = expenses.reduce((acc, e) => {
      const cat = e.category || "Other";
      acc[cat] = (acc[cat] || 0) + e.amount;
      return acc;
    }, {});

    const groq = getGroqClient();
    const expenseData = JSON.stringify({
      expenses: expenses.slice(0, 50),
      totalSpent,
      categories: categoryBreakdown,
    });

    const prompt = `
You are a friendly financial advisor. Analyze this user's spending data and provide actionable insights.

Spending data:
${expenseData}

Provide a brief, encouraging summary of their spending patterns and 2-3 actionable tips for better financial management. Keep it friendly and concise.
`;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful financial advisor.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: GROQ_MODEL,
        temperature: 0.5,
        max_tokens: 300,
      });

      const insights = chatCompletion.choices[0]?.message?.content || "Unable to generate insights at this time.";

      return {
        insights,
        totalSpent,
        categoryBreakdown,
      };
    } catch (error) {
      console.error("Error generating insights:", error);
      return {
        insights: "Unable to generate insights at this time.",
        totalSpent,
        categoryBreakdown,
      };
    }
  },
});