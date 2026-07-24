export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface BudgetItem {
  id?: number;
  item_name: string;
  quantity?: number;
  requested_amount: number;
  ai_suggested_amount?: number | null;
  ai_reasoning?: string | null;
}

export interface AIAudit {
  id: number;
  historical_context: string;
  market_research_data: string;
  compliance_report: string;
}

export interface Approval {
  id: number;
  approver_id: number;
  decision: string;
  comments: string;
  created_at: string;
}

export interface Event {
  id: number;
  name: string;
  description: string;
  coordinator_id: number;
  status: string;
  total_requested_budget: number;
  total_ai_suggested_budget: number;
  coordinator_remarks?: string;
  financer_allocated_budget?: number;
  attachment_url?: string;
  budget_items: BudgetItem[];
  ai_audit?: AIAudit | null;
  approvals: Approval[];
}

export interface EventCreate {
  coordinator_id: number;
  name: string;
  description: string;
  items: Omit<BudgetItem, 'id'>[];
}
