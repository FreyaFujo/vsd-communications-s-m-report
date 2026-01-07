

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  groundingMetadata?: any;
}

export interface ProductAsset {
  id: string;
  name: string;
  type: 'datasheet' | 'presentation' | 'costing' | 'photo' | 'video';
  url: string;
  size: number;
  mimeType: string;
}

export interface UserProfile {
  name: string;
  role: string;
  companyName: string;
  targetRevenue: string;
  product: string;
  plan: string;
  experience: string;
  industries: string;
  salesStyle: string;
  goals: string;
  productAssets?: ProductAsset[]; 
  idealClientProfile?: string;
}

export interface MarketingTask {
  id: string;
  type: 'LinkedIn' | 'Blog' | 'Newsletter' | 'WhatsApp';
  title: string;
  topic?: string;
  content: string;
  fullDraft?: string;
  date: string;
  status: 'Draft' | 'Scheduled' | 'Published';
  priority: 'High' | 'Medium' | 'Low';
}

export interface Lead {
  id: string;
  name: string;
  companyName: string;
  address?: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
  jobDescription: string;
  industry: string;
  source: string; 
  projectBrief?: string;
  userNotes?: string; 
}

export interface ActivityLogEntry {
  id: string;
  date: string; // The date the activity happened
  type: 'Phone' | 'WhatsApp' | 'Email' | 'Online Meeting' | 'Physical Meeting' | 'Other';
  notes: string;
  createdAt: string; // Timestamp of record creation
}

export interface StageHistoryEntry {
  stage: string;
  date: string;
}

export interface Deal {
  id: string;
  quotationNo?: string; 
  description: string; 
  contactPersonId: string; 
  contactPersonName: string;
  companyName: string;
  decisionMaker: string;
  value: number;
  activity: string; // Keeps latest activity summary for backward compatibility
  date: string; // Keeps latest activity date for backward compatibility
  pipelineStatus: 'Prospecting' | 'Potential' | 'Solutioning' | 'Negotiation' | 'Closed' | 'Won';
  notes?: string; 
  linkedCompetitorId?: string; 
  costingFile?: {
    name: string;
    url: string;
    type: string;
  };
  
  // Forecasting Fields
  forecastedPoPercentage?: number; // 0, 25, 50, 75, 100
  forecastedPoMonth?: string;
  forecastedInvoicePercentage?: number; // 50, 100
  estimatedInvoiceMonth?: string;

  // History Tracking
  activityHistory?: ActivityLogEntry[];
  stageHistory?: StageHistoryEntry[];
}

export interface Competitor {
  id: string;
  name: string;
  swotAnalysis: string;
  recentNews: string;
  notes: string;
}

export type ViewState = 'dashboard' | 'prospecting' | 'research' | 'local' | 'coaching' | 'database' | 'funnel' | 'tracker' | 'competitive_strategy' | 'marketing_planner' | 'settings';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}
