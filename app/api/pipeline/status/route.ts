// ─── AutoAP — Pipeline Status API (Live) ──────────────────────────
// Returns the pipeline status for the most recently active invoice.

import { NextResponse } from 'next/server';
import { getInvoices } from '@/lib/mongodb';
import { PipelineStep, Invoice } from '@/lib/types';

// Map agent_log actions → pipeline step IDs
const STEP_MAP: { actions: string[]; id: string; label: string }[] = [
    { actions: ['EMAIL_DETECTED'], id: 'receive', label: 'Invoice Received' },
    { actions: ['PARSE_START', 'PARSE_COMPLETE'], id: 'parse', label: 'AI Parsing' },
    { actions: ['VENDOR_PORTAL_START', 'TINYFISH_PORTAL', 'TINYFISH_PORTAL_VERIFIED', 'VENDOR_PORTAL_DONE'], id: 'portal', label: 'Vendor Portal Verify' },
    { actions: ['QB_SEARCH', 'PO_MATCH_RESULT'], id: 'match', label: 'PO Match' },
    { actions: ['AUTO_APPROVE', 'BILL_CREATED', 'TINYFISH_BILL_CREATE'], id: 'approve', label: 'Bill Creation' },
    { actions: ['PIPELINE_COMPLETE'], id: 'complete', label: 'Complete' },
];

function buildSteps(invoice: Invoice | null): PipelineStep[] {
    if (!invoice) {
        // No invoices — show all steps as pending  
        return STEP_MAP.map(s => ({
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

    // Find first incomplete step
    let activeFound = false;

    return STEP_MAP.map(step => {
        // Skip portal step if no portal data in log
        if (step.id === 'portal' && !logActions.has('VENDOR_PORTAL_START') && !logActions.has('TINYFISH_PORTAL')) {
            // Only show portal step if it was attempted
            if (!completedSteps.has('portal')) {
                return null; // Skip entirely
            }
        }

        const isCompleted = completedSteps.has(step.id);

        if (isCompleted) {
            // Find the latest timestamp for this step
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

        if (!activeFound) {
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
        // Get the most recent invoice that is actively processing, or the last completed one
        const invoices = await getInvoices({ limit: 5 });

        // Prefer an actively processing invoice
        const active = invoices.find(inv =>
            ['RECEIVED', 'PARSING', 'MATCHING'].includes(inv.status)
        );

        // Otherwise use the most recent one
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
