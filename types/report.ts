import type { ActionPlanItem, BusinessType, RiskLevel } from "./database";

export interface WeeklyReportContent {
  title: string;
  period: string;
  generatedAt: string;
  businessProfile: {
    businessType: BusinessType | null;
    companyName: string | null;
    location: string | null;
    targetMargin: number | null;
    monthlyBudget: number | null;
  };
  executiveSummary: string;
  weeklyRiskLevel: RiskLevel;
  topRiskyCommodities: Array<{
    name: string;
    riskLevel: RiskLevel | null;
    riskScore: number | null;
    momChange: number | null;
    yoyChange: number | null;
    recommendation: string | null;
  }>;
  exchangeRate: {
    pair: string;
    latestRate: number | null;
    latestDate: string | null;
    momChange: number | null;
  };
  latestAiInsight: {
    summary: string | null;
    impactAnalysis: string | null;
    recommendation: string | null;
    actionPlan: ActionPlanItem[];
    riskLevel: RiskLevel | null;
    createdAt: string | null;
  } | null;
  latestSimulation: {
    productName: string | null;
    sellingPrice: number | null;
    currentCost: number | null;
    estimatedNewCost: number | null;
    estimatedNewMargin: number | null;
    recommendedPrice: number | null;
    aiExplanation: string | null;
    createdAt: string | null;
  } | null;
  actionRecommendations: string[];
  disclaimer: string;
}

export interface ReportView {
  id: string;
  title: string | null;
  period: string | null;
  content: WeeklyReportContent | null;
  pdfUrl: string | null;
  createdAt: string;
}
