export default ({env}) => ({
    'oidc-sso': {
        enabled: true,
        config: {
            CLIENT_ID: env('CLIENT_ID'),
            CLIENT_SECRET: env('CLIENT_SECRET'),
            AUTHORIZATION_ENDPOINT: env('AUTHORIZATION_ENDPOINT'),
            TOKEN_ENDPOINT: env('TOKEN_ENDPOINT'),
        }
    }
});
