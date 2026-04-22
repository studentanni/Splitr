"use client";

import { AlertTriangle, TrendingUp, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function AnomalyAlert({ expense, onDismiss, onAnalyze }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityColor = (score) => {
    if (score >= 7) return "bg-red-100 text-red-800 border-red-200";
    if (score >= 5) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  const getSeverityIcon = (score) => {
    if (score >= 7) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (score >= 5) return <TrendingUp className="h-4 w-4 text-orange-600" />;
    return <Info className="h-4 w-4 text-yellow-600" />;
  };

  const getSeverityText = (score) => {
    if (score >= 7) return "High Anomaly";
    if (score >= 5) return "Medium Anomaly";
    return "Low Anomaly";
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const anomalyScore = expense.anomalyScore || 0;

  return (
    <Card className={`border-l-4 ${getSeverityColor(anomalyScore)} mb-3`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getSeverityIcon(anomalyScore)}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline" className={getSeverityColor(anomalyScore)}>
                  {getSeverityText(anomalyScore)}
                </Badge>
                <span className="text-sm text-gray-500">
                  Score: {anomalyScore.toFixed(1)}
                </span>
              </div>
              
              <h4 className="font-semibold text-gray-900 mb-1">
                {expense.description}
              </h4>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Amount: {formatAmount(expense.amount)}</span>
                {expense.predictedAmount && (
                  <span className="text-gray-500">
                    Expected: {formatAmount(expense.predictedAmount)}
                  </span>
                )}
                {expense.category && (
                  <Badge variant="secondary" className="text-xs">
                    {expense.category}
                  </Badge>
                )}
              </div>

              {expense.anomalyReason && (
                <p className="text-sm text-gray-600 mt-2">
                  {expense.anomalyReason}
                </p>
              )}

              {isExpanded && expense.normalRange && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-600 mb-2">
                    <strong>Normal Range:</strong> {formatAmount(expense.normalRange.min)} - {formatAmount(expense.normalRange.max)}
                  </p>
                  {expense.statistics && (
                    <div className="text-xs text-gray-600">
                      <p><strong>Average:</strong> {formatAmount(expense.statistics.mean)}</p>
                      <p><strong>Sample Size:</strong> {expense.statistics.sampleSize} expenses</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Hide" : "Details"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnomalySummary({ anomalies, onAnalyzeAll }) {
  if (!anomalies || anomalies.length === 0) {
    return null;
  }

  const highAnomalies = anomalies.filter(a => a.anomalyScore >= 7).length;
  const mediumAnomalies = anomalies.filter(a => a.anomalyScore >= 5 && a.anomalyScore < 7).length;
  const lowAnomalies = anomalies.filter(a => a.anomalyScore < 5).length;

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <h3 className="font-semibold text-gray-900">
                Spending Anomalies Detected
              </h3>
              <p className="text-sm text-gray-600">
                {anomalies.length} unusual expense{anomalies.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>High ({highAnomalies})</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Medium ({mediumAnomalies})</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Low ({lowAnomalies})</span>
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onAnalyzeAll}
            >
              Analyze All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
