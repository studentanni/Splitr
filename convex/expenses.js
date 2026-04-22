import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Create a new expense
export const createExpense = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    date: v.number(), // timestamp
    paidByUserId: v.id("users"),
    splitType: v.string(), // "equal", "percentage", "exact"
    splits: v.array(
      v.object({
        userId: v.id("users"),
        amount: v.number(),
        paid: v.boolean(),
      })
    ),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    // Use centralized getCurrentUser function
    const user = await ctx.runQuery(internal.users.getCurrentUserInternal);

    // If there's a group, verify the user is a member
    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) {
        throw new Error("Group not found");
      }

      const isMember = group.members.some(
        (member) => member.userId === user._id
      );
      if (!isMember) {
        throw new Error("You are not a member of this group");
      }
    }

    // Verify that splits add up to the total amount (with small tolerance for floating point issues)
    const totalSplitAmount = args.splits.reduce(
      (sum, split) => sum + split.amount,
      0
    );
    const tolerance = 0.01; // Allow for small rounding errors
    if (Math.abs(totalSplitAmount - args.amount) > tolerance) {
      throw new Error("Split amounts must add up to the total expense amount");
    }

    // Create the expense
    // Auto-categorize expense using AI if no category provided
    let finalCategory = args.category;
    if (!finalCategory) {
      try {
        const aiCategory = await ctx.runAction(internal.groqAI.categorizeExpense, {
          description: args.description,
          amount: args.amount,
        });
        finalCategory = aiCategory.category;
      } catch (error) {
        console.error("AI categorization failed:", error);
        finalCategory = "Other";
      }
    }

    const expenseId = await ctx.db.insert("expenses", {
      description: args.description,
      amount: args.amount,
      category: finalCategory,
      date: args.date,
      paidByUserId: args.paidByUserId,
      splitType: args.splitType,
      splits: args.splits,
      groupId: args.groupId,
      createdBy: user._id,
    });

    // Run anomaly detection asynchronously
    await ctx.scheduler.runAfter(0, internal.anomalyDetection.detectAnomalyAndSave, {
      expenseId,
      userId: args.paidByUserId,
      amount: args.amount,
      description: args.description,
      category: args.category,
    });

    return expenseId;
  },
});

// ----------- Expenses Page -----------

// Get expenses between current user and a specific person
export const getExpensesBetweenUsers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await ctx.runQuery(internal.users.getCurrentUserInternal);
    if (me._id === userId) throw new Error("Cannot query yourself");

    /* ───── 1. One-on-one expenses where either user is the payer ───── */
    // Use the compound index (`paidByUserId`,`groupId`) with groupId = undefined
    const myPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", me._id).eq("groupId", undefined)
      )
      .collect();

    const theirPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", userId).eq("groupId", undefined)
      )
      .collect();

    // Merge → candidate set is now just the rows either of us paid for
    const candidateExpenses = [...myPaid, ...theirPaid];

    /* ───── 2. Keep only rows where BOTH are involved (payer or split) ─ */
    const expenses = candidateExpenses.filter((e) => {
      // me is always involved (I’m the payer OR in splits – verified below)
      const meInSplits = e.splits.some((s) => s.userId === me._id);
      const themInSplits = e.splits.some((s) => s.userId === userId);

      const meInvolved = e.paidByUserId === me._id || meInSplits;
      const themInvolved = e.paidByUserId === userId || themInSplits;

      return meInvolved && themInvolved;
    });

    expenses.sort((a, b) => b.date - a.date);

    /* ───── 3. Settlements between the two of us (groupId = undefined) ─ */
    const settlements = await ctx.db
      .query("settlements")
      .filter((q) =>
        q.and(
          q.eq(q.field("groupId"), undefined),
          q.or(
            q.and(
              q.eq(q.field("paidByUserId"), me._id),
              q.eq(q.field("receivedByUserId"), userId)
            ),
            q.and(
              q.eq(q.field("paidByUserId"), userId),
              q.eq(q.field("receivedByUserId"), me._id)
            )
          )
        )
      )
      .collect();

    settlements.sort((a, b) => b.date - a.date);

    /* ───── 4. Compute running balance ──────────────────────────────── */
    let balance = 0;

    for (const e of expenses) {
      if (e.paidByUserId === me._id) {
        const split = e.splits.find((s) => s.userId === userId && !s.paid);
        if (split) balance += split.amount; // they owe me
      } else {
        const split = e.splits.find((s) => s.userId === me._id && !s.paid);
        if (split) balance -= split.amount; // I owe them
      }
    }

    for (const s of settlements) {
      if (s.paidByUserId === me._id)
        balance += s.amount; // I paid them back
      else balance -= s.amount; // they paid me back
    }

    /* ───── 5. Return payload ───────────────────────────────────────── */
    const other = await ctx.db.get(userId);
    if (!other) throw new Error("User not found");

    return {
      expenses,
      settlements,
      otherUser: {
        id: other._id,
        name: other.name,
        email: other.email,
        imageUrl: other.imageUrl,
      },
      balance,
    };
  },
});

// Delete an expense
export const deleteExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    // Get the current user
    const user = await ctx.runQuery(internal.users.getCurrentUserInternal);

    // Get the expense
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new Error("Expense not found");
    }

    // Check if user is authorized to delete this expense
    // Only the creator of the expense or the payer can delete it
    if (expense.createdBy !== user._id && expense.paidByUserId !== user._id) {
      throw new Error("You don't have permission to delete this expense");
    }

    // Delete any settlements that specifically reference this expense
    // Since we can't use array.includes directly in the filter, we'll
    // fetch all settlements and then filter in memory
    const allSettlements = await ctx.db.query("settlements").collect();

    const relatedSettlements = allSettlements.filter(
      (settlement) =>
        settlement.relatedExpenseIds !== undefined &&
        settlement.relatedExpenseIds.includes(args.expenseId)
    );

    for (const settlement of relatedSettlements) {
      // Remove this expense ID from the relatedExpenseIds array
      const updatedRelatedExpenseIds = settlement.relatedExpenseIds.filter(
        (id) => id !== args.expenseId
      );

      if (updatedRelatedExpenseIds.length === 0) {
        // If this was the only related expense, delete the settlement
        await ctx.db.delete(settlement._id);
      } else {
        // Otherwise update the settlement to remove this expense ID
        await ctx.db.patch(settlement._id, {
          relatedExpenseIds: updatedRelatedExpenseIds,
        });
      }
    }

    // Delete the expense
    await ctx.db.delete(args.expenseId);

    return { success: true };
  },
});

// ----------- ML Functions for Anomaly Detection -----------

// Get user expenses for ML analysis
export const getUserExpensesForML = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) => 
        q.eq("paidByUserId", args.userId)
      )
      .collect();

    return expenses
      .filter(expense => expense.date < Date.now()) // Only past expenses
      .sort((a, b) => b.date - a.date)
      .slice(0, 50);
  },
});

// Get a single expense for ML analysis
export const getExpenseForML = query({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.expenseId);
  },
});

// Get recent expenses for batch analysis
export const getRecentExpenses = query({
  args: {
    userId: v.id("users"),
    cutoffDate: v.number(),
  },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) => 
        q.eq("paidByUserId", args.userId)
      )
      .collect();

    return expenses
      .filter(expense => 
        expense.date >= args.cutoffDate && 
        expense.date < Date.now()
      )
      .sort((a, b) => b.date - a.date);
  },
});

// Update expense with anomaly analysis results
export const updateExpenseAnomaly = mutation({
  args: {
    expenseId: v.id("expenses"),
    isAnomalous: v.boolean(),
    anomalyScore: v.number(),
    anomalyReason: v.string(),
    predictedAmount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.expenseId, {
      isAnomalous: args.isAnomalous,
      anomalyScore: args.anomalyScore,
      anomalyReason: args.anomalyReason,
      predictedAmount: args.predictedAmount,
    });
  },
});

// Get anomalous expenses for user
export const getAnomalousExpenses = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) => 
        q.eq("paidByUserId", args.userId)
      )
      .collect();

    return expenses
      .filter(expense => expense.isAnomalous === true)
      .sort((a, b) => (b.anomalyScore || 0) - (a.anomalyScore || 0))
      .slice(0, limit);
  },
});

// Get expenses by category for analysis
export const getExpensesByCategory = query({
  args: {
    userId: v.id("users"),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) => 
        q.eq("paidByUserId", args.userId)
      )
      .collect();

    return expenses
      .filter(expense => expense.category === args.category)
      .sort((a, b) => b.date - a.date);
  },
});

// Get monthly spending trend
export const getMonthlySpending = query({
  args: {
    userId: v.id("users"),
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const months = args.months || 6;
    const cutoffDate = Date.now() - (months * 30 * 24 * 60 * 60 * 1000);
    
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) => 
        q.eq("paidByUserId", args.userId)
      )
      .collect();

    const monthlyData = {};
    
    expenses
      .filter(expense => expense.date >= cutoffDate)
      .forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            total: 0,
            count: 0,
            expenses: []
          };
        }
        
        monthlyData[monthKey].total += expense.amount;
        monthlyData[monthKey].count += 1;
        monthlyData[monthKey].expenses.push(expense);
      });

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month));
  },
});
