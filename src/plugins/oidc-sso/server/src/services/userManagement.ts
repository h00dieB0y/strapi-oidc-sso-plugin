import type { Core } from '@strapi/strapi';

export interface UserInformation {
    email: string;
    username: string;
}

const userManagement = ({ strapi }: { strapi: Core.Strapi }) => ({
    async processUser(user: UserInformation) {
        // Find or create the user
        const existingUser = await this.findOrCreateUser(user);

        const tokenService = strapi.service('admin::token');

        // Generate a new token for the user
        const token = await tokenService.createJwtToken(existingUser);

        return token;
    },

    async findOrCreateUser(user: UserInformation) {
        const userService = strapi.service('admin::user');

        // Find the user by email
        let dbUser = await userService.findOneByEmail(user.email);

        // If user exists, return the user
        if (dbUser) {
            return dbUser;
        }

        // Create a new user
        dbUser = await userService.create({
            email: user.email,
            username: user.username,
            provider: 'oidc-sso',
            confirmed: true,
            blocked: false,
        });

        // TODO: Trigger post registration webhook

        return dbUser;
    },
});

export default userManagement;
