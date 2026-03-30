// ─── AutoAP — QuickBooks OAuth + API ──────────────────────────────
// Uses intuit-oauth for the OAuth 2.0 flow. Tokens are stored in MongoDB settings.

import OAuthClient from 'intuit-oauth';
import { getSettings, updateSettings } from './mongodb';

// ─── OAuth Client Singleton ───────────────────────────────────────

let _oauthClient: OAuthClient | null = null;

function getOAuthClient(): OAuthClient {
    if (!_oauthClient) {
        const clientId = process.env.QUICKBOOKS_CLIENT_ID;
        const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
        const redirectUri =
            process.env.QUICKBOOKS_REDIRECT_URI ||
            'http://localhost:3000/api/auth/quickbooks/callback';

        if (!clientId || !clientSecret) {
            throw new Error(
                'QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET must be set in .env'
            );
        }

        _oauthClient = new OAuthClient({
            clientId,
            clientSecret,
            environment: 'sandbox', // Change to 'production' when ready
            redirectUri,
        });
    }

    return _oauthClient;
}

// ─── OAuth Flow ───────────────────────────────────────────────────

export function getAuthorizationUrl(): string {
    const client = getOAuthClient();
    return client.authorizeUri({
        scope: [OAuthClient.scopes.Accounting],
        state: 'autoap-qb-connect',
    });
}

export async function handleOAuthCallback(
    url: string
): Promise<{ accessToken: string; refreshToken: string; realmId: string }> {
    const client = getOAuthClient();
    const authResponse = await client.createToken(url);
    const token = authResponse.getJson();

    const accessToken = token.access_token;
    const refreshToken = token.refresh_token;

    // The realmId (company ID) comes from the callback URL query params
    const urlObj = new URL(url, 'http://localhost');
    const realmId = urlObj.searchParams.get('realmId') || '';

    // Calculate token expiry (access tokens last ~1 hour)
    const expiresIn = token.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Persist tokens to MongoDB settings
    await updateSettings({
        qb_access_token: accessToken,
        qb_refresh_token: refreshToken,
        qb_company_id: realmId,
        qb_token_expires_at: expiresAt,
    });

    console.log(`[QuickBooks] OAuth complete. Realm: ${realmId}, expires: ${expiresAt}`);

    return { accessToken, refreshToken, realmId };
}

// ─── Token Management ─────────────────────────────────────────────

async function refreshAccessToken(): Promise<string> {
    const settings = await getSettings();
    if (!settings.qb_refresh_token) {
        throw new Error('No QB refresh token. Please re-connect QuickBooks.');
    }

    const client = getOAuthClient();
    const authResponse = await client.refreshUsingToken(settings.qb_refresh_token);
    const token = authResponse.getJson();

    const expiresIn = token.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    await updateSettings({
        qb_access_token: token.access_token,
        qb_refresh_token: token.refresh_token, // QB may rotate the refresh token
        qb_token_expires_at: expiresAt,
    });

    console.log(`[QuickBooks] Token refreshed. Expires: ${expiresAt}`);
    return token.access_token;
}

export async function getQBToken(): Promise<string> {
    const settings = await getSettings();

    if (!settings.qb_access_token) {
        throw new Error('QuickBooks not connected. Please connect via Settings.');
    }

    // Check if token is expired or will expire in the next 5 minutes
    if (settings.qb_token_expires_at) {
        const expiresAt = new Date(settings.qb_token_expires_at).getTime();
        const bufferMs = 5 * 60 * 1000; // 5 minutes
        if (Date.now() > expiresAt - bufferMs) {
            console.log('[QuickBooks] Token expired or expiring soon, refreshing...');
            return refreshAccessToken();
        }
    }

    return settings.qb_access_token;
}

export async function getQBCompanyId(): Promise<string> {
    const settings = await getSettings();
    const companyId = settings.qb_company_id || process.env.QB_COMPANY_ID;
    if (!companyId) {
        throw new Error('QuickBooks company ID not configured.');
    }
    return companyId;
}

// ─── QuickBooks API Calls ─────────────────────────────────────────

const QB_SANDBOX_BASE = 'https://sandbox-quickbooks.api.intuit.com/v3/company';

export async function searchPurchaseOrder(
    companyId: string,
    poNumber: string
): Promise<{ po_amount: number; po_id: string } | null> {
    const token = await getQBToken();

    const query = encodeURIComponent(
        `SELECT * FROM PurchaseOrder WHERE DocNumber = '${poNumber}'`
    );
    const response = await fetch(
        `${QB_SANDBOX_BASE}/${companyId}/query?query=${query}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        }
    );

    if (!response.ok) {
        if (response.status === 401) {
            // Try token refresh and retry once
            const newToken = await refreshAccessToken();
            const retryResponse = await fetch(
                `${QB_SANDBOX_BASE}/${companyId}/query?query=${query}`,
                {
                    headers: {
                        Authorization: `Bearer ${newToken}`,
                        Accept: 'application/json',
                    },
                }
            );
            if (!retryResponse.ok) {
                throw new Error(`QB API error after refresh: ${retryResponse.status}`);
            }
            const retryData = await retryResponse.json();
            const retryPO = retryData.QueryResponse?.PurchaseOrder?.[0];
            return retryPO ? { po_amount: retryPO.TotalAmt, po_id: retryPO.Id } : null;
        }
        throw new Error(`QB API error: ${response.status}`);
    }

    const data = await response.json();
    const po = data.QueryResponse?.PurchaseOrder?.[0];
    if (!po) return null;

    return {
        po_amount: po.TotalAmt,
        po_id: po.Id,
    };
}

export async function findOrCreateVendor(
    companyId: string,
    vendorName: string
): Promise<{ value: string; name: string }> {
    const token = await getQBToken();

    // Search for existing vendor
    const query = encodeURIComponent(
        `SELECT * FROM Vendor WHERE DisplayName = '${vendorName}'`
    );
    const searchRes = await fetch(
        `${QB_SANDBOX_BASE}/${companyId}/query?query=${query}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        }
    );

    if (searchRes.ok) {
        const searchData = await searchRes.json();
        const vendor = searchData.QueryResponse?.Vendor?.[0];
        if (vendor) {
            return { value: vendor.Id, name: vendor.DisplayName };
        }
    }

    // Create new vendor if not found
    const createRes = await fetch(`${QB_SANDBOX_BASE}/${companyId}/vendor`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({ DisplayName: vendorName }),
    });

    if (!createRes.ok) {
        throw new Error(
            `QB create vendor error: ${createRes.status} ${await createRes.text()}`
        );
    }

    const created = await createRes.json();
    return { value: created.Vendor.Id, name: created.Vendor.DisplayName };
}

export async function createBill(
    companyId: string,
    params: {
        vendorName: string;
        amount: number;
        dueDate: string;
        lineItems: Array<{ description: string; amount: number }>;
    }
): Promise<string> {
    const token = await getQBToken();

    // Look up or create the vendor to get a valid VendorRef
    const vendorRef = await findOrCreateVendor(companyId, params.vendorName);

    const billData = {
        VendorRef: vendorRef,
        TotalAmt: params.amount,
        DueDate: params.dueDate,
        Line: params.lineItems.map((item, idx) => ({
            Id: String(idx + 1),
            Amount: item.amount,
            DetailType: 'AccountBasedExpenseLineDetail',
            Description: item.description,
            AccountBasedExpenseLineDetail: {
                AccountRef: { value: '7', name: 'Expenses' },
            },
        })),
    };

    const response = await fetch(`${QB_SANDBOX_BASE}/${companyId}/bill`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(billData),
    });

    if (!response.ok) {
        throw new Error(
            `QB create bill error: ${response.status} ${await response.text()}`
        );
    }

    const result = await response.json();
    return result.Bill.Id;
}
