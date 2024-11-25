import type { Core } from '@strapi/strapi';

export interface OidcConfig {
    clientId: string;
    clientSecret: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    redirectUri: string;
}

const oidcService = ({ strapi }: { strapi: Core.Strapi }) => ({
    getOidcConfig(): OidcConfig {
        const config = strapi.config.get('plugin::oidc-sso');

        if (!config) {
            throw new Error('OIDC SSO plugin is not configured');
        }

        const { CLIENT_ID, CLIENT_SECRET, AUTHORIZATION_ENDPOINT, TOKEN_ENDPOINT } = config as Record<string, string>;

        if (!CLIENT_ID || !CLIENT_SECRET || !AUTHORIZATION_ENDPOINT || !TOKEN_ENDPOINT) {
            throw new Error('Missing required configuration. Please provide clientId, clientSecret, authorizationEndpoint, and tokenEndpoint.');
        }

        return {
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            authorizationEndpoint: AUTHORIZATION_ENDPOINT,
            tokenEndpoint: TOKEN_ENDPOINT,
            redirectUri: 'http://localhost:1337/api/oidc-sso/callback',
        };
    },

    generateAuthorizationUrl(): string {
        const { clientId, authorizationEndpoint, redirectUri } = this.getOidcConfig();
        const scope = 'openid profile email';

        const authorizationUrl = new URL(authorizationEndpoint);
        authorizationUrl.searchParams.append('client_id', clientId);
        authorizationUrl.searchParams.append('redirect_uri', redirectUri);
        authorizationUrl.searchParams.append('response_type', 'code');
        authorizationUrl.searchParams.append('scope', scope);

        return authorizationUrl.toString();
    },

    async exchangeAuthorizationCodeForToken(code: string): Promise<any> {
        const { clientId, clientSecret, tokenEndpoint, redirectUri } = this.getOidcConfig();

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to exchange authorization code for token: ' + response.statusText);
        }

        return response.json();
    },

    async fetchUserInfo(accessToken: string): Promise<any> {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user info: ' + response.statusText);
        }

        return response.json();
    },

    async triggerSignInSuccessEvent(user: any) {
        delete user.password;

        await strapi.eventHub.emit('admin.auth.success', {
            user,
            provider: 'oidc-sso',
        });
    },

    async renderSignInSuccessPage(jwtToken: string, user: any, nonce: string) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sign In Success</title>
            <script nonce="${nonce}">
                localStorage.setItem('jwtToken', '"${jwtToken}"');
                localStorage.setItem('user', '${JSON.stringify(user)}');
                window.location.href = '/admin';
            </script>
        </head>
        <body>
        </body>
        </html>
        `;
    }
});

export default oidcService;
