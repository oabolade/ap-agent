declare module 'intuit-oauth' {
    interface OAuthClientConfig {
        clientId: string;
        clientSecret: string;
        environment: 'sandbox' | 'production';
        redirectUri: string;
    }

    interface AuthorizeUriOptions {
        scope: string[];
        state?: string;
    }

    interface TokenResponse {
        getJson(): {
            access_token: string;
            refresh_token: string;
            expires_in: number;
            token_type: string;
            x_refresh_token_expires_in: number;
        };
    }

    class OAuthClient {
        constructor(config: OAuthClientConfig);
        authorizeUri(options: AuthorizeUriOptions): string;
        createToken(url: string): Promise<TokenResponse>;
        refreshUsingToken(refreshToken: string): Promise<TokenResponse>;

        static scopes: {
            Accounting: string;
            Payment: string;
            Payroll: string;
            TimeTracking: string;
            Benefits: string;
            Profile: string;
            Email: string;
            Phone: string;
            Address: string;
            OpenId: string;
        };
    }

    export default OAuthClient;
}
