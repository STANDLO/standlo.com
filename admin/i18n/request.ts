import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
    // Provide a basic config for the Admin Studio
    return {
        locale: 'en',
        messages: (await import('../../messages/en.json')).default
    };
});
