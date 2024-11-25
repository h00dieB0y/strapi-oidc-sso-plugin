import type { Core } from '@strapi/strapi';
import { v4 } from 'uuid';
import type { Context } from 'koa';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  index(ctx: Context) {
    ctx.body = strapi
      .plugin('oidc-sso')
      .service('service')
      .getWelcomeMessage();
  },

  // Redirect to the OIDC provider for authentication.
  async authenticate(ctx: Context) {
    try {
      const { oidc } = strapi.plugins['oidc-sso'].services;
      const redirectUrl = await oidc.generateAuthorizationUrl(); // Use the service to get the redirect URL
      ctx.redirect(redirectUrl);
    } catch (error) {
      handleError(ctx, error, 'OIDC Authentication failed');
    }
  },

  // Callback URL to exchange the code for the token
  async callback(ctx: Context) {
    try {
      const { oidc, userManagement } = strapi.plugins['oidc-sso'].services;
      const { code } = ctx.query;

      if (!code) {
        ctx.throw(400, 'Missing code parameter');
      }

      const tokens = await oidc.exchangeAuthorizationCodeForToken(code as string);
      const userInfo = await oidc.fetchUserInfo(tokens.access_token);
      const token = await userManagement.processUser(userInfo);

      const nonce = v4();
      const html = await oidc.renderSignInSuccessPage(token, userInfo, nonce);

      ctx.set('Content-Type', 'text/html');
      ctx.set('Content-Security-Policy', `script-src 'nonce-${nonce}'`);
      ctx.body = html;
    } catch (error) {
      handleError(ctx, error, 'OIDC Authentication Callback failed');
    }
  }
});

// Helper function to handle errors
function handleError(ctx: Context, error: any, message: string) {
  console.error(error);
  ctx.throw(400, `${message}: ${error.message}`);
}

export default controller;
