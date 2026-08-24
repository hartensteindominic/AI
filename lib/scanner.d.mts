export type ScanOpportunity = {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  payout: number;
  hours: number;
  probability: number;
  competition: 'Low visible' | 'Medium' | 'High';
  protection: string;
  protectionVerified: boolean;
  updatedAt: string;
  ageDays: number;
  automationScore: number;
  assigneeCount: number;
  comments: number;
  riskFlags: string[];
  moneyScore: number;
  recommendation: 'VERIFY FIRST' | 'REVIEW';
};

export type ScanResult = {
  opportunities: ScanOpportunity[];
  scannedAt: string;
  scanned: number;
  qualified: number;
  authenticated: boolean;
  methodology: string;
};

export function scanOpportunities(options?: {
  token?: string;
  perPage?: number;
  maxResults?: number;
}): Promise<ScanResult>;
