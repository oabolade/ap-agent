// ─── AutoAP — Pipeline Status API (Phase 2) ──────────────────────
// Returns the pipeline status for the most recently active invoice.

import { NextResponse } from 'next/server';
import { getInvoices } from '@/lib/mongodb';
import { PipelineStep, Invoice } from '@/lib/types';

// Map agent_log actions → pipeline step IDs
// Phase 2: includes both old (Phase 1) and new action names
const STEP_MAP: { actions: string[]; id: string; label: string }[] = [
    { actions: ['EMAIL_DETECTED'], id: 'receive', label: 'Invoice Received' },
    {
        actions: [
            'PARSE_START', 'PARSE_COMPLETE',                     // Phase 1
            'EXTRACTION_START', 'FIREWORKS_START', 'FIREWORKS_COMPLETE', // Phase 2
            'PO_HINT',
        ],
        id: 'extract', label: 'AI Extraction'
    },
    {
        actions: [
            'VENDOR_PORTAL_START', 'VENDOR_PORTAL_DONE',         // Phase 1
            'PORTAL_SCRAPE_START', 'TINYFISH_PORTAL',            // Phase 2
            'TINYFISH_PORTAL_VERIFIED',
        ],
        id: 'portal', label: 'Portal Verification'
    },
    {
        actions: [
            'RECONCILIATION_START', 'RECONCILIATION_COMPLETE',
            'RECONCILIATION_SKIP', 'RECONCILIATION_REJECT',
            'DISCREPANCY_FOUND',
        ],
        id: 'reconcile', label: 'Reconciliation'
    },
    { actions: ['QB_SEARCH', 'PO_MATCH_RESULT'], id: 'match', label: 'PO Match' },
    { actions: ['AUTO_APPROVE', 'BILL_CREATED', 'TINYFISH_BILL_CREATE'], id: 'approve', label: 'Bill Creation' },
    { actions: ['PIPELINE_COMPLETE'], id: 'complete', label: 'Complete' },
];

// Steps that should be hidden if never attempted
const OPTIONAL_STEPS = new Set(['portal', 'reconcile']);

function buildSteps(invoice: Invoice | null): PipelineStep[] {
    if (!invoice) {
        return STEP_MAP
            .filter(s => !OPTIONAL_STEPS.has(s.id))
            .map(s => ({
                id: s.id,
                label: s.label,
                status: 'pending' as const,
            }));
    }

    const logActions = new Set(invoice.agent_log.map(e => e.action));
    const logByAction = new Map(
        invoice.agent_log.map(e => [e.action, e])
    );

    // Determine which steps are completed
    const completedSteps = new Set<string>();
    for (const step of STEP_MAP) {
        if (step.actions.some(a => logActions.has(a))) {
            completedSteps.add(step.id);
        }
    }

    // Terminal states: pipeline has stopped, don't show any step as "active"
    const TERMINAL_STATES = new Set(['APPROVED', 'EXCEPTION', 'DISPUTED', 'PENDING_REVIEW']);
    const isTerminal = TERMINAL_STATES.has(invoice.status);

    // Find first incomplete step
    let activeFound = false;

    return STEP_MAP.map(step => {
        // Hide optional steps if never attempted
        if (OPTIONAL_STEPS.has(step.id) && !completedSteps.has(step.id)) {
            const stepIdx = STEP_MAP.findIndex(s => s.id === step.id);
            const laterCompleted = STEP_MAP.slice(stepIdx + 1).some(s => completedSteps.has(s.id));
            if (laterCompleted || !step.actions.some(a => logActions.has(a))) {
                return null;
            }
        }

        const isCompleted = completedSteps.has(step.id);

        if (isCompleted) {
            const timestamps = step.actions
                .filter(a => logByAction.has(a))
                .map(a => logByAction.get(a)!.timestamp);
            const latest = timestamps.length > 0 ? String(timestamps[timestamps.length - 1]) : undefined;

            return {
                id: step.id,
                label: step.label,
                status: 'completed' as const,
                timestamp: latest,
            };
        }

        // Only show "active" spinner if pipeline is still running
        if (!activeFound && !isTerminal) {
            activeFound = true;
            return {
                id: step.id,
                label: step.label,
                status: 'active' as const,
                timestamp: new Date().toISOString(),
            };
        }

        return {
            id: step.id,
            label: step.label,
            status: 'pending' as const,
        };
    }).filter(Boolean) as PipelineStep[];
}

export async function GET() {
    try {
        const invoices = await getInvoices({ limit: 5 });

        // Prefer an actively processing invoice (Phase 2 statuses included)
        const active = invoices.find(inv =>
            ['RECEIVED', 'PARSING', 'EXTRACTING', 'RECONCILING', 'MATCHING'].includes(inv.status)
        );

        const target = active || invoices[0] || null;

        const steps = buildSteps(target);

        return NextResponse.json({
            success: true,
            data: {
                steps,
                active_invoice: target
                    ? {
                        _id: target._id,
                        vendor_name: target.vendor_name,
                        invoice_number: target.invoice_number,
                        amount: target.amount,
                    }
                    : null,
            },
        });
    } catch (error) {
        console.error('[Pipeline Status API Error]', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}

