// ─── AutoAP — Shared TypeScript Types ─────────────────────────────

// ─── Pipeline Status ──────────────────────────────────────────────
export type PipelineStatus =
  | 'RECEIVED'
  | 'EXTRACTING'
  | 'PARSING'
  | 'RECONCILING'
  | 'MATCHING'
  | 'APPROVED'
  | 'PENDING_REVIEW'
  | 'EXCEPTION'
  | 'DISPUTED';

export type MatchResult = 'MATCH' | 'MISMATCH' | 'DISCREPANCY' | 'NO_PO' | null;

// ─── Agent Log Entry ──────────────────────────────────────────────
export interface AgentLogEntry {
  timestamp: Date | string;
  action: string;
  detail: string;
  level?: 'info' | 'success' | 'warning' | 'error';
}

// ─── Line Item ────────────────────────────────────────────────────
export interface LineItem {
  description: string;
  amount: number;
  qty: number;
}

// ─── Invoice ──────────────────────────────────────────────────────
export interface Invoice {
  _id: string;
  invoice_number: string;
  vendor_name: string;
  vendor_email: string;
  amount: number;
  currency: string;
  due_date: string;
  line_items: LineItem[];
  po_number: string | null;
  po_amount: number | null;
  match_result: MatchResult;
  match_delta: number | null;
  status: PipelineStatus;
  qb_bill_id: string | null;
  payment_scheduled_date: string | null;
  agent_log: AgentLogEntry[];
  raw_email: string;
  raw_pdf_url: string | null;
  portal_verified?: boolean;
  portal_invoice_number?: string;
  portal_amount?: number;
  // Phase 2: dual-source reconciliation fields
  fireworks_data?: Record<string, unknown>;
  tinyfish_data?: Record<string, unknown>;
  reconciliation?: Record<string, unknown>;
  vendor_id?: string;
  created_at: string;
  updated_at: string;
}

// ─── Settings ─────────────────────────────────────────────────────
export interface Settings {
  _id: string;
  agentmail_inbox: string;
  qb_access_token: string;
  qb_refresh_token: string;
  qb_company_id: string;
  qb_token_expires_at: string | null;
  match_tolerance_percent: number;
  auto_approve_max: number;
  slack_webhook_url: string | null;
  alert_email: string | null;
}

// ─── API Response ─────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Pipeline Step ────────────────────────────────────────────────
export interface PipelineStep {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending';
  timestamp?: string;
}

// ─── KPI Data ─────────────────────────────────────────────────────
export interface KPIData {
  invoicesToday: number;
  invoicesTodayDelta: number;
  totalProcessedMonth: number;
  pendingApprovals: number;
  pendingReviews: number;
  exceptionsFlagged: number;
  timeSavedMinutes: number;
  averageConfidence: number;
}

// ─── Parsed Invoice (from Fireworks) ──────────────────────────────
export interface ParsedInvoice {
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  currency: string;
  po_number: string | null;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  raw_text: string;
}
