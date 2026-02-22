import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
        locale = routing.defaultLocale;
    }

    const messages = locale === 'it'
        ? (await import('../../messages/it.json')).default
        : locale === 'es'
            ? (await import('../../messages/es.json')).default
            : (await import('../../messages/en.json')).default;

    return {
        locale,
        messages,
        timeZone: 'Europe/Rome'
    };
});
