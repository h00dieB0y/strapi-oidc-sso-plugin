import type { Core } from '@strapi/strapi';


const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  index(ctx) {
    ctx.body = strapi
      .plugin('oidc-sso')
      // the name of the service file & the method.
      .service('service')
      .getWelcomeMessage();
  },

  // Redirect to the OIDC provider for authentication.
  async authenticate(ctx) {
    try {
      const { oidc } = strapi.plugins['oidc-sso'].services;

      const redirectUrl = await oidc.getRedirectUrl(); // Use the service to get the redirect URL
      ctx.redirect(redirectUrl);
    }
    catch (error) {
      console.log(error);
      ctx.throw(400, 'OIDC Authentication failed: ' + error.message);
    }
  },

  // Callback URL to exchange the code for the token
  async callback(ctx) {
    try {
      const { oidc } = strapi.plugins['oidc-sso'].services;
      const { code } = ctx.query

      if (!code) {
        ctx.throw(400, 'Missing code parameter');
      }

      const tokens = await oidc.exchangeCodeForToken(code);

      const userInfo = await oidc.getUserInfo(tokens.access_token);

      ctx.body = userInfo;
    } catch (error) {
      console.log(error);
      ctx.throw(400, 'OIDC Authentication Callback failed: ' + error.message);
    }
  }
});

export default controller;
