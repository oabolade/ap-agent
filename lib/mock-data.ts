// ─── AutoAP — Mock Data Store ─────────────────────────────────────
// Provides in-memory data for development before MongoDB is connected.

import { Invoice, Settings, KPIData, AgentLogEntry, PipelineStep } from './types';

// ─── Demo Invoices ────────────────────────────────────────────────
const now = new Date();
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString();
const future = (days: number) => new Date(now.getTime() + days * 86400000).toISOString();

export const MOCK_INVOICES: Invoice[] = [
    {
        _id: 'inv-001',
        invoice_number: 'INV-2025-001',
        vendor_name: 'Acme Office Supplies',
        vendor_email: 'billing@acmeoffice.com',
        amount: 1240.00,
        currency: 'USD',
        due_date: future(30),
        line_items: [
            { description: 'Standing desks x2', amount: 890.00, qty: 2 },
            { description: 'Monitor arms x4', amount: 350.00, qty: 4 },
        ],
        po_number: 'PO-4521',
        po_amount: 1240.00,
        match_result: 'MATCH',
        match_delta: 0,
        status: 'APPROVED',
        qb_bill_id: 'QB-BILL-001',
        payment_scheduled_date: future(30),
        agent_log: [
            { timestamp: ago(45), action: 'EMAIL_DETECTED', detail: 'Invoice received from billing@acmeoffice.com', level: 'info' },
            { timestamp: ago(44), action: 'PARSE_START', detail: 'Sending to Fireworks.ai for extraction', level: 'info' },
            { timestamp: ago(43), action: 'PARSE_COMPLETE', detail: 'Extracted: Acme Office Supplies | $1,240.00 | PO: PO-4521', level: 'success' },
            { timestamp: ago(42), action: 'TINYFISH_START', detail: 'Navigating QuickBooks login...', level: 'info' },
            { timestamp: ago(41), action: 'TINYFISH_SUCCESS', detail: 'Authenticated successfully', level: 'success' },
            { timestamp: ago(40), action: 'TINYFISH_START', detail: 'Searching PO #4521...', level: 'info' },
            { timestamp: ago(39), action: 'TINYFISH_SUCCESS', detail: 'Match found. Amount: $1,240.00', level: 'success' },
            { timestamp: ago(38), action: 'MATCH_SUCCESS', detail: 'PO match confirmed. Delta: $0.00. Auto-approving.', level: 'success' },
            { timestamp: ago(37), action: 'TINYFISH_START', detail: 'Creating bill in QB...', level: 'info' },
            { timestamp: ago(36), action: 'TINYFISH_SUCCESS', detail: 'Bill created. Payment scheduled Net-30.', level: 'success' },
            { timestamp: ago(35), action: 'PIPELINE_COMPLETE', detail: 'Invoice approved and payment scheduled. ✓', level: 'success' },
        ],
        raw_email: 'Please find attached invoice INV-2025-001 for standing desks and monitor arms.',
        raw_pdf_url: null,
        created_at: ago(45),
        updated_at: ago(35),
    },
    {
        _id: 'inv-002',
        invoice_number: 'INV-CH-8821',
        vendor_name: 'CloudHost Pro',
        vendor_email: 'invoices@cloudhost.pro',
        amount: 890.00,
        currency: 'USD',
        due_date: future(15),
        line_items: [
            { description: 'Cloud hosting — Pro tier (monthly)', amount: 890.00, qty: 1 },
        ],
        po_number: 'PO-4522',
        po_amount: 850.00,
        match_result: 'MISMATCH',
        match_delta: 40.00,
        status: 'EXCEPTION',
        qb_bill_id: null,
        payment_scheduled_date: null,
        agent_log: [
            { timestamp: ago(30), action: 'EMAIL_DETECTED', detail: 'Invoice received from invoices@cloudhost.pro', level: 'info' },
            { timestamp: ago(29), action: 'PARSE_COMPLETE', detail: 'Extracted: CloudHost Pro | $890.00 | PO: PO-4522', level: 'success' },
            { timestamp: ago(28), action: 'TINYFISH_SUCCESS', detail: 'Authenticated to QB', level: 'success' },
            { timestamp: ago(27), action: 'TINYFISH_SUCCESS', detail: 'PO #4522 found. Amount: $850.00', level: 'info' },
            { timestamp: ago(26), action: 'MATCH_FAILED', detail: 'Mismatch detected. Invoice: $890.00, PO: $850.00, Delta: $40.00 (4.7%)', level: 'error' },
        ],
        raw_email: 'Invoice for monthly cloud hosting services — February 2025.',
        raw_pdf_url: null,
        created_at: ago(30),
        updated_at: ago(26),
    },
    {
        _id: 'inv-003',
        invoice_number: 'DS-2025-112',
        vendor_name: 'Design Studio Co',
        vendor_email: 'accounts@designstudio.co',
        amount: 3500.00,
        currency: 'USD',
        due_date: future(45),
        line_items: [
            { description: 'Brand refresh — Phase 1', amount: 2500.00, qty: 1 },
            { description: 'Logo variations pack', amount: 1000.00, qty: 1 },
        ],
        po_number: 'PO-4523',
        po_amount: 3500.00,
        match_result: 'MATCH',
        match_delta: 0,
        status: 'APPROVED',
        qb_bill_id: 'QB-BILL-003',
        payment_scheduled_date: future(30),
        agent_log: [
            { timestamp: ago(120), action: 'EMAIL_DETECTED', detail: 'Invoice received from accounts@designstudio.co', level: 'info' },
            { timestamp: ago(119), action: 'PARSE_COMPLETE', detail: 'Extracted: Design Studio Co | $3,500.00 | PO: PO-4523', level: 'success' },
            { timestamp: ago(118), action: 'MATCH_SUCCESS', detail: 'PO match confirmed. Delta: $0.00.', level: 'success' },
            { timestamp: ago(117), action: 'PIPELINE_COMPLETE', detail: 'Invoice approved and payment scheduled. ✓', level: 'success' },
        ],
        raw_email: 'Invoice for branding work completed in January.',
        raw_pdf_url: null,
        created_at: ago(120),
        updated_at: ago(117),
    },
    {
        _id: 'inv-004',
        invoice_number: 'INV-9901',
        vendor_name: 'FastShip Logistics',
        vendor_email: 'ap@fastship.io',
        amount: 2180.50,
        currency: 'USD',
        due_date: future(20),
        line_items: [
            { description: 'Express freight — 12 pallets', amount: 1800.00, qty: 1 },
            { description: 'Fuel surcharge', amount: 180.50, qty: 1 },
            { description: 'Liftgate service', amount: 200.00, qty: 1 },
        ],
        po_number: 'PO-4525',
        po_amount: 2180.50,
        match_result: 'MATCH',
        match_delta: 0,
        status: 'APPROVED',
        qb_bill_id: 'QB-BILL-004',
        payment_scheduled_date: future(20),
        agent_log: [
            { timestamp: ago(90), action: 'EMAIL_DETECTED', detail: 'Invoice received from ap@fastship.io', level: 'info' },
            { timestamp: ago(89), action: 'PARSE_COMPLETE', detail: 'Extracted: FastShip Logistics | $2,180.50 | PO: PO-4525', level: 'success' },
            { timestamp: ago(88), action: 'MATCH_SUCCESS', detail: 'PO match confirmed. Auto-approving.', level: 'success' },
            { timestamp: ago(87), action: 'PIPELINE_COMPLETE', detail: 'Invoice approved and payment scheduled. ✓', level: 'success' },
        ],
        raw_email: 'Freight invoice for shipment #FS-20250212.',
        raw_pdf_url: null,
        created_at: ago(90),
        updated_at: ago(87),
    },
    {
        _id: 'inv-005',
        invoice_number: 'TEC-44921',
        vendor_name: 'TechParts Direct',
        vendor_email: 'billing@techparts.com',
        amount: 15750.00,
        currency: 'USD',
        due_date: future(30),
        line_items: [
            { description: 'Server rack unit — 42U', amount: 8500.00, qty: 1 },
            { description: 'Cat6A patch cables (box of 50)', amount: 250.00, qty: 2 },
            { description: 'UPS Battery Backup 3000VA', amount: 6750.00, qty: 1 },
        ],
        po_number: 'PO-4526',
        po_amount: 15750.00,
        match_result: 'MATCH',
        match_delta: 0,
        status: 'EXCEPTION',
        qb_bill_id: null,
        payment_scheduled_date: null,
        agent_log: [
            { timestamp: ago(60), action: 'EMAIL_DETECTED', detail: 'Invoice received from billing@techparts.com', level: 'info' },
            { timestamp: ago(59), action: 'PARSE_COMPLETE', detail: 'Extracted: TechParts Direct | $15,750.00 | PO: PO-4526', level: 'success' },
            { timestamp: ago(58), action: 'MATCH_SUCCESS', detail: 'PO match confirmed. Delta: $0.00.', level: 'success' },
            { timestamp: ago(57), action: 'APPROVAL_LIMIT', detail: 'Amount $15,750.00 exceeds auto-approve limit of $10,000. Requires human approval.', level: 'warning' },
        ],
        raw_email: 'Invoice for server infrastructure order.',
        raw_pdf_url: null,
        created_at: ago(60),
        updated_at: ago(57),
    },
    {
        _id: 'inv-006',
        invoice_number: 'INV-7788',
        vendor_name: 'CleanSpace Janitorial',
        vendor_email: 'office@cleanspace.com',
        amount: 425.00,
        currency: 'USD',
        due_date: future(15),
        line_items: [
            { description: 'Monthly cleaning service — February', amount: 425.00, qty: 1 },
        ],
        po_number: null,
        po_amount: null,
        match_result: 'NO_PO',
        match_delta: null,
        status: 'EXCEPTION',
        qb_bill_id: null,
        payment_scheduled_date: null,
        agent_log: [
            { timestamp: ago(20), action: 'EMAIL_DETECTED', detail: 'Invoice received from office@cleanspace.com', level: 'info' },
            { timestamp: ago(19), action: 'PARSE_COMPLETE', detail: 'Extracted: CleanSpace Janitorial | $425.00 | PO: none', level: 'warning' },
            { timestamp: ago(18), action: 'NO_PO_FOUND', detail: 'No PO number on invoice. Cannot run 3-way match. Flagging for review.', level: 'warning' },
        ],
        raw_email: 'February cleaning services invoice.',
        raw_pdf_url: null,
        created_at: ago(20),
        updated_at: ago(18),
    },
    {
        _id: 'inv-007',
        invoice_number: 'SAAS-2025-02',
        vendor_name: 'DataSync SaaS',
        vendor_email: 'billing@datasync.io',
        amount: 299.00,
        currency: 'USD',
        due_date: future(10),
        line_items: [
            { description: 'DataSync Pro — monthly subscription', amount: 299.00, qty: 1 },
        ],
        po_number: 'PO-4530',
        po_amount: 299.00,
        match_result: 'MATCH',
        match_delta: 0,
        status: 'APPROVED',
        qb_bill_id: 'QB-BILL-007',
        payment_scheduled_date: future(10),
        agent_log: [
            { timestamp: ago(10), action: 'EMAIL_DETECTED', detail: 'Invoice received from billing@datasync.io', level: 'info' },
            { timestamp: ago(9), action: 'PARSE_COMPLETE', detail: 'Extracted: DataSync SaaS | $299.00 | PO: PO-4530', level: 'success' },
            { timestamp: ago(8), action: 'MATCH_SUCCESS', detail: 'PO match confirmed. Auto-approving.', level: 'success' },
            { timestamp: ago(7), action: 'PIPELINE_COMPLETE', detail: 'Invoice approved and payment scheduled. ✓', level: 'success' },
        ],
        raw_email: 'Your February subscription invoice.',
        raw_pdf_url: null,
        created_at: ago(10),
        updated_at: ago(7),
    },
    {
        _id: 'inv-008',
        invoice_number: 'LGL-2025-034',
        vendor_name: 'Sterling Legal Group',
        vendor_email: 'accounts@sterlinglegal.com',
        amount: 4800.00,
        currency: 'USD',
        due_date: future(45),
        line_items: [
            { description: 'Contract review — Series A docs', amount: 3200.00, qty: 1 },
            { description: 'IP filing assistance', amount: 1600.00, qty: 1 },
        ],
        po_number: 'PO-4528',
        po_amount: 4200.00,
        match_result: 'MISMATCH',
        match_delta: 600.00,
        status: 'DISPUTED',
        qb_bill_id: null,
        payment_scheduled_date: null,
        agent_log: [
            { timestamp: ago(180), action: 'EMAIL_DETECTED', detail: 'Invoice received from accounts@sterlinglegal.com', level: 'info' },
            { timestamp: ago(179), action: 'PARSE_COMPLETE', detail: 'Extracted: Sterling Legal Group | $4,800.00 | PO: PO-4528', level: 'success' },
            { timestamp: ago(178), action: 'MATCH_FAILED', detail: 'Mismatch. Invoice: $4,800.00, PO: $4,200.00, Delta: $600.00 (14.3%)', level: 'error' },
            { timestamp: ago(100), action: 'MANUAL_ACTION', detail: 'Disputed by user. Note: "IP filing was not in original scope."', level: 'warning' },
        ],
        raw_email: 'Legal services rendered in January 2025.',
        raw_pdf_url: null,
        created_at: ago(180),
        updated_at: ago(100),
    },
    {
        _id: 'inv-009',
        invoice_number: 'MKT-8891',
        vendor_name: 'PixelPush Marketing',
        vendor_email: 'finance@pixelpush.co',
        amount: 6200.00,
        currency: 'USD',
        due_date: future(25),
        line_items: [
            { description: 'PPC campaign management — Feb', amount: 4000.00, qty: 1 },
            { description: 'Social content creation', amount: 2200.00, qty: 1 },
        ],
        po_number: 'PO-4529',
        po_amount: 6200.00,
        match_result: null,
        match_delta: null,
        status: 'MATCHING',
        qb_bill_id: null,
        payment_scheduled_date: null,
        agent_log: [
            { timestamp: ago(3), action: 'EMAIL_DETECTED', detail: 'Invoice received from finance@pixelpush.co', level: 'info' },
            { timestamp: ago(2), action: 'PARSE_COMPLETE', detail: 'Extracted: PixelPush Marketing | $6,200.00 | PO: PO-4529', level: 'success' },
            { timestamp: ago(1), action: 'TINYFISH_START', detail: 'Navigating QuickBooks login...', level: 'info' },
            { timestamp: ago(0.5), action: 'TINYFISH_SUCCESS', detail: 'Authenticated successfully', level: 'success' },
            { timestamp: ago(0.2), action: 'TINYFISH_START', detail: 'Searching PO #4529...', level: 'info' },
        ],
        raw_email: 'February marketing services invoice.',
        raw_pdf_url: null,
        created_at: ago(3),
        updated_at: ago(0.2),
    },
    {
        _id: 'inv-010',
        invoice_number: 'INV-NEW-001',
        vendor_name: 'PrintWorks Co',
        vendor_email: 'billing@printworks.com',
        amount: 780.00,
        currency: 'USD',
        due_date: future(30),
        line_items: [
            { description: 'Business cards (500 ct)', amount: 180.00, qty: 1 },
            { description: 'Marketing brochures (1000 ct)', amount: 600.00, qty: 1 },
        ],
        po_number: 'PO-4531',
        po_amount: null,
        match_result: null,
        match_delta: null,
        status: 'RECEIVED',
        qb_bill_id: null,
        payment_scheduled_date: null,
        agent_log: [
            { timestamp: ago(0.1), action: 'EMAIL_DETECTED', detail: 'Invoice received from billing@printworks.com', level: 'info' },
        ],
        raw_email: 'Attached invoice for print order #PW-20250226.',
        raw_pdf_url: null,
        created_at: ago(0.1),
        updated_at: ago(0.1),
    },
];

// ─── Mock Settings ────────────────────────────────────────────────
export const MOCK_SETTINGS: Settings = {
    _id: 'global',
    agentmail_inbox: 'ap@autoap.dev',
    qb_access_token: '',
    qb_refresh_token: '',
    qb_company_id: '',
    qb_token_expires_at: null,
    match_tolerance_percent: 2,
    auto_approve_max: 10000,
    slack_webhook_url: 'https://hooks.slack.com/services/T00/B00/xxxx',
    alert_email: 'founder@autoap.dev',
};

// ─── Mock KPI ─────────────────────────────────────────────────────
export function getMockKPIs(invoices: Invoice[]): KPIData {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const invoicesToday = invoices.filter(inv => inv.created_at >= todayStr).length;
    const totalProcessedMonth = invoices
        .filter(inv => inv.status === 'APPROVED')
        .reduce((sum, inv) => sum + inv.amount, 0);
    const pendingApprovals = invoices.filter(inv =>
        inv.status === 'MATCHING' || inv.status === 'RECEIVED' || inv.status === 'PARSING'
    ).length;
    const exceptionsFlagged = invoices.filter(inv => inv.status === 'EXCEPTION').length;

    return {
        invoicesToday: invoicesToday || 7,
        invoicesTodayDelta: 3,
        totalProcessedMonth: totalProcessedMonth || 29445.50,
        pendingApprovals: pendingApprovals || 2,
        exceptionsFlagged: exceptionsFlagged || 3,
        pendingReviews: 1,
        timeSavedMinutes: 125,
        averageConfidence: 94,
    };
}

// ─── Mock Pipeline Steps ──────────────────────────────────────────
export function getMockPipelineSteps(): PipelineStep[] {
    return [
        { id: 'email', label: 'Email Detected', status: 'completed', timestamp: ago(2) },
        { id: 'parse', label: 'Invoice Parsed', status: 'completed', timestamp: ago(1) },
        { id: 'match', label: 'PO Match in Progress', status: 'active', timestamp: ago(0.2) },
        { id: 'bill', label: 'Bill Creation', status: 'pending' },
        { id: 'payment', label: 'Payment Scheduled', status: 'pending' },
    ];
}

// ─── Mock Agent Activity Stream ───────────────────────────────────
export function getMockAgentLogs(): AgentLogEntry[] {
    return [
        { timestamp: ago(5), action: 'EMAIL_DETECTED', detail: 'New invoice from finance@pixelpush.co', level: 'info' },
        { timestamp: ago(4), action: 'PARSE_START', detail: 'Sending to Fireworks.ai for extraction', level: 'info' },
        { timestamp: ago(3.5), action: 'PARSE_COMPLETE', detail: 'Extracted: PixelPush Marketing | $6,200.00 | PO: PO-4529', level: 'success' },
        { timestamp: ago(3), action: 'TINYFISH_START', detail: 'Navigating QuickBooks login...', level: 'info' },
        { timestamp: ago(2.5), action: 'TINYFISH_SUCCESS', detail: 'Authenticated successfully', level: 'success' },
        { timestamp: ago(2), action: 'TINYFISH_START', detail: 'Searching PO #4529...', level: 'info' },
        { timestamp: ago(1.5), action: 'TINYFISH_SUCCESS', detail: 'Match found. Amount: $6,200.00', level: 'success' },
        { timestamp: ago(1), action: 'TINYFISH_START', detail: 'Creating bill in QB...', level: 'info' },
        { timestamp: ago(0.5), action: 'TINYFISH_SUCCESS', detail: 'Bill created. Payment scheduled Net-30.', level: 'success' },
        { timestamp: ago(0.2), action: 'PIPELINE_COMPLETE', detail: 'Invoice approved and payment scheduled. ✓', level: 'success' },
    ];
}
