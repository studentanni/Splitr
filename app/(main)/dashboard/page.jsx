"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQuery, useConvexAction, useConvexActionTrigger, useConvexMutation } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ExpenseSummary } from "./components/expense-summary";
import { BalanceSummary } from "./components/balance-summary";
import { GroupList } from "./components/group-list";
import { AnomalySummary, AnomalyAlert } from "@/components/anomaly-alert";
import { SpendingInsights } from "@/components/spending-insights";
import { ExpenseList } from "@/components/expense-list";

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useConvexQuery(api.users.getCurrentUser);

  const { data: balances, isLoading: balancesLoading } = useConvexQuery(
    api.dashboard.getUserBalances
  );

  const { data: groups, isLoading: groupsLoading } = useConvexQuery(
    api.dashboard.getUserGroups
  );

  const { data: totalSpent, isLoading: totalSpentLoading } = useConvexQuery(
    api.dashboard.getTotalSpent
  );

  const { data: monthlySpending, isLoading: monthlySpendingLoading } =
    useConvexQuery(api.dashboard.getMonthlySpending);

  const { data: anomalyStatus, isLoading: anomalyLoading } = useConvexQuery(
    api.dashboard.getAnomalyStatus
  );

  const { trigger: scanAnomalies, isLoading: scanning } = useConvexActionTrigger(
    api.anomalyDetection.analyzeRecentExpenses
  );

  const createTestAnomaly = useConvexMutation(api.debug.createTestAnomalousExpense);

  const handleCreateTestAnomaly = async () => {
    if (!user?._id) return;
    try {
      const result = await createTestAnomaly.mutate({ userId: user._id });
      toast.success(result.message);
    } catch (err) {
      toast.error("Failed to create test expense");
    }
  };

  const handleScan = async () => {
    if (!user?._id) return;
    try {
      const result = await scanAnomalies({ userId: user._id, daysBack: 30 });
      toast.success(`Scan complete! Found ${result.anomaliesFound} anomalies.`);
    } catch (err) {
      // toast already shown by trigger
    }
  };

  const { data: recentExpenses, isLoading: recentExpensesLoading } = useConvexQuery(
    api.dashboard.getRecentDashboardExpenses
  );

  const { data: aiInsights, isLoading: insightsLoading } = useConvexAction(
    api.anomalyDetection.getSpendingInsights,
    user?._id ? { userId: user._id } : "skip"
  );

  const isLoading =
    userLoading ||
    balancesLoading ||
    groupsLoading ||
    totalSpentLoading ||
    monthlySpendingLoading ||
    anomalyLoading ||
    recentExpensesLoading ||
    (user?._id && insightsLoading);

  return (
    <div className="container mx-auto py-10 space-y-8">
      {isLoading ? (
        <div className="w-full py-20 flex justify-center">
          <BarLoader width={"100%"} color="#36d7b7" />
        </div>
      ) : (
        <>
          <div className="flex  justify-between flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-5xl gradient-title">Dashboard</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCreateTestAnomaly}
                disabled={createTestAnomaly.isLoading}
              >
                {createTestAnomaly.isLoading ? "Creating..." : "Create Test Anomaly"}
              </Button>
              <Button asChild>
                <Link href="/expenses/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add expense
                </Link>
              </Button>
            </div>
          </div>

          {/* Balance overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {balances?.totalBalance > 0 ? (
                    <span className="text-green-600">
                      +₹{balances?.totalBalance.toFixed(2)}
                    </span>
                  ) : balances?.totalBalance < 0 ? (
                    <span className="text-red-600">
                      -₹{Math.abs(balances?.totalBalance).toFixed(2)}
                    </span>
                  ) : (
                    <span>₹0.00</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {balances?.totalBalance > 0
                    ? "You are owed money"
                    : balances?.totalBalance < 0
                      ? "You owe money"
                      : "All settled up!"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  You are owed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{balances?.youAreOwed.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total from all contacts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  You owe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ₹{balances?.youOwe.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total to all contacts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Anomaly Alerts */}
          {anomalyStatus?.anomalousCount > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Spending Alerts
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {anomalyStatus.anomalousExpenses.map((expense) => (
                  <AnomalyAlert key={expense._id} expense={expense} />
                ))}
              </div>
            </div>
          )}

          {/* AI Spending Insights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                AI Financial Insights
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleScan}
                disabled={scanning}
              >
                {scanning ? "Scanning..." : "Re-scan Anomalies"}
              </Button>
            </div>
            <SpendingInsights 
              insights={anomalyStatus} 
              aiInsights={aiInsights}
            />
          </div>

          {/* Main dashboard content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Expenses */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Recent Expenses
                  </h2>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/expenses">View all</Link>
                  </Button>
                </div>
                <ExpenseList 
                  expenses={recentExpenses} 
                  showOtherPerson={true}
                />
              </div>

              {/* Expense summary */}
              <ExpenseSummary
                monthlySpending={monthlySpending}
                totalSpent={totalSpent}
              />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Balance details */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Balance Details</CardTitle>
                    <Button variant="link" asChild className="p-0">
                      <Link href="/contacts">
                        View all
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <BalanceSummary balances={balances} />
                </CardContent>
              </Card>

              {/* Groups */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Your Groups</CardTitle>
                    <Button variant="link" asChild className="p-0">
                      <Link href="/contacts">
                        View all
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <GroupList groups={groups} />
                </CardContent>
                <CardFooter>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/contacts?createGroup=true">
                      <Users className="mr-2 h-4 w-4" />
                      Create new group
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
