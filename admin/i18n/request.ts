import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
    // Provide a basic config for the Admin Studio
    return {
        locale: 'us',
        messages: (await import('../../messages/us.json')).default
    };
});
