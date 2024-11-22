import type { Core } from '@strapi/strapi';

export interface UserInformation {
    email: string;
    username: string;
}

const userManagement = ({ strapi }: { strapi: Core.Strapi }) => ({
    async handleUserFlow(user: any) {
        // Find the user by email
        const existingUser = await this.findOrCreateUser(user); 
    },

    async findOrCreateUser(user: any) {
        const userService = strapi.service('admin::user');

        // Find the user by email
        let existingUser = await userService.findOneByEmail(user.email);

        // If user exists, return the user
        if (existingUser) {
            return existingUser;
        }

        // Create a new user
        existingUser = await userService.create({
            email: user.email,
            username: user.username,
            provider: 'oidc-sso',
            confirmed: true,
            blocked: false,
        });



        return existingUser;
    }
});
