import { defineConfig } from 'wxt';

export default defineConfig({
    runner: {
        disabled: true,
    },
    modules: ['@wxt-dev/module-react'],
    manifest: {
        name: 'AMZBoosted',
        description: 'Advanced Amazon seller tools suite',
        version: '1.1.0',
        key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtCSz/irgP3dzATE8kSCzfxWnoi0pdWPBRcrHjpdN1JU5ODTAfPi6Xx5tAduChwV3jkpdlG/lGc1qu/8xYD8lHRxI+WKC6dL7uloHMnqUPyAQFStseRmQuyxel/LOA71O22IRF1FtnKtPFp6IvoRHLvvoNy0eI7tMSuLEHwMqw1ebhyhq5gJ2k18m/O3rAc/ewmiCN247uLqO88VXuPXXF47gSs6eGO6g0TTGkdE1j1kNV7/AE7NGiznUUquliuvRPQMvHpO2JLRrmhXA19HLjtCnHXkSOzVqEMf2bqKxp1kzePEI6parnv5WSf+RofCxrnQNpc3oT0hbO4va6KtbCwIDAQAB",
        permissions: [
            'storage',
            'unlimitedStorage', // For IndexedDB - store large datasets locally
            'sidePanel',
            'scripting',
            'tabs',
            'activeTab',
            'contextMenus',
            'notifications',
            'downloads',
            'cookies',
            'alarms',
            'identity'
        ],
        oauth2: {
            client_id: "90287994304-pef62j403shh090iukh03pd94j9etqsr.apps.googleusercontent.com",
            scopes: ["https://www.googleapis.com/auth/drive.file"]
        },
        host_permissions: [
            'https://*.amazon.com/*',
            'https://*.amazon.co.uk/*',
            'https://*.amazon.ca/*',
            'https://*.amazon.de/*',
            'https://*.amazon.fr/*',
            'https://*.amazon.it/*',
            'https://*.amazon.es/*',
            'https://*.amazon.in/*',
            'http://localhost:8090/*',
            'https://*.amzboosted.com/*',
        ],
        side_panel: {
            default_path: 'sidepanel.html',
        },
        action: {
            default_title: 'AMZBoosted',
        },
    },
});
