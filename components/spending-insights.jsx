"use client";

import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Calendar, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";

export function SpendingInsights({ insights, aiInsights, monthlyTrend }) {
  const anomalousCount = insights?.anomalousCount || 0;
  const insightsData = aiInsights?.insights || "";
  const displayPatterns = Array.isArray(aiInsights?.patterns) ? aiInsights.patterns : [];
  const displayRecommendations = Array.isArray(aiInsights?.recommendations) ? aiInsights.recommendations : [];

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Target className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return "text-green-600";
    if (trend < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Expense</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights?.statistics?.averageAmount ? formatAmount(insights.statistics.averageAmount) : '₹0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per expense
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights?.statistics?.totalExpenses || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {anomalousCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Unusual expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
            {monthlyTrend ? getTrendIcon(monthlyTrend.trend) : <Target className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyTrend ? getTrendColor(monthlyTrend.trend) : ''}`}>
              {monthlyTrend ? `${monthlyTrend.trend > 0 ? '+' : ''}${monthlyTrend.trend.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Spending Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!insightsData ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  AI is still analyzing your spending patterns.
                </p>
                <p className="text-xs text-muted-foreground italic">
                  Tip: Add more expenses or click "Re-scan" to refresh insights.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{insightsData}</p>
            )}
          </CardContent>
        </Card>

        {/* Spending Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Spending Patterns</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayPatterns.length > 0 ? (
              <ul className="space-y-2">
                {displayPatterns.map((pattern, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{pattern}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No patterns detected yet. Continue tracking expenses.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {insights?.statistics?.categoryBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(insights.statistics.categoryBreakdown)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6)
                .map(([category, amount]) => {
                  const total = Object.values(insights.statistics.categoryBreakdown).reduce((sum, val) => sum + val, 0);
                  const percentage = (amount / total) * 100;
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{category}</span>
                        <span className="text-sm text-gray-600">
                          {formatAmount(amount)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      {/* <Progress value={percentage} className="h-2" /> */}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {displayRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {displayRecommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
