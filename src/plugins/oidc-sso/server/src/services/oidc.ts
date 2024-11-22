import type { Core } from '@strapi/strapi';


export interface OidcConfig {
    clientId: string;
    clientSecret: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    redirectUri: string;
}


const oidcService = ({ strapi }: { strapi: Core.Strapi }) => ({

    getConfig(): OidcConfig {
        // Get config from configuration file of strapi
        const config = strapi.config.get('plugin::oidc-sso');

        if (!config) {
            throw new Error('OIDC SSO plugin is not configured');
        }

        if (!config['CLIENT_ID'] || !config['CLIENT_SECRET'] || !config['AUTHORIZATION_ENDPOINT'] || !config['TOKEN_ENDPOINT']) {
            throw new Error('Missing required configuration. Please provide clientId, clientSecret, authorizationEndpoint, and tokenEndpoint.');
        }

        return {
            clientId: config['CLIENT_ID'],
            clientSecret: config['CLIENT_SECRET'],
            authorizationEndpoint: config['AUTHORIZATION_ENDPOINT'],
            tokenEndpoint: config['TOKEN_ENDPOINT'],
            redirectUri: 'http://localhost:1337/api/oidc-sso/callback',
        };
    },

    getRedirectUrl(): string {
        const config = this.getConfig();

        const { clientId, authorizationEndpoint, redirectUri } = config;

        const scope = 'openid profile email';

        const redirectUrl = new URL(`${authorizationEndpoint}`);
        redirectUrl.searchParams.append('client_id', clientId);
        redirectUrl.searchParams.append('redirect_uri', redirectUri);
        redirectUrl.searchParams.append('response_type', 'code');
        redirectUrl.searchParams.append('scope', scope);

        return redirectUrl.toString();
    },

    async exchangeCodeForToken(code: string): Promise<any> {
        const config = this.getConfig();
        const { clientId, clientSecret, tokenEndpoint, redirectUri } = config;

        const tokenUrl = new URL(`${tokenEndpoint}`);

        const response = await fetch(tokenUrl.toString(), {
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
            throw new Error('Failed to exchange code for token: ' + response.statusText);
        }

        return response.json();
    },

    async getUserInfo(accessToken: string): Promise<any> {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user info: ' + response.statusText);
        }

        return response.json();
    }

});


export default oidcService;