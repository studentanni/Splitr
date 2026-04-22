import { action } from "./_generated/server";
import { v } from "convex/values";
import Groq from "groq-sdk";

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in Convex environment variables.");
  }
  return new Groq({ apiKey });
};

// AI-powered expense categorization
export const categorizeExpense = action({
  args: {
    description: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      const groq = getGroqClient();
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expense categorization AI. Categorize expenses into one of these categories:
            - Food & Drink
            - Transportation
            - Shopping
            - Entertainment
            - Bills & Utilities
            - Healthcare
            - Education
            - Travel
            - Other
            
            Respond with ONLY the category name, nothing else.`
          },
          {
            role: "user",
            content: `Description: ${args.description}, Amount: ${args.amount}`
          }
        ],
        model: "llama3-8b-8192",
        temperature: 0.1,
        max_tokens: 50,
      });

      const category = chatCompletion.choices[0]?.message?.content?.trim() || "Other";
      
      return {
        category: category,
        confidence: 0.9
      };
    } catch (error) {
      console.error("Groq AI Error:", error);
      return {
        category: "Other",
        confidence: 0.1
      };
    }
  },
});

// AI-powered expense insights
export const getExpenseInsights = action({
  args: {
    expenses: v.array(v.object({
      description: v.string(),
      amount: v.number(),
      category: v.string(),
      date: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    try {
      const totalSpent = args.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const topCategory = args.expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {});

      const insights = {
        totalSpent,
        topSpendingCategory: Object.keys(topCategory).reduce((a, b) => 
          topCategory[a] > topCategory[b] ? a : b
        ),
        averageExpense: totalSpent / args.expenses.length,
        expenseCount: args.expenses.length,
      };

      return insights;
    } catch (error) {
      console.error("Insights Error:", error);
      return null;
    }
  },
});
