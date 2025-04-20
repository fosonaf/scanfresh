import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'dark-bg': '#1e1e1e',
                'dark-text': '#fbbf24',
            },
        },
    },
    plugins: [],
};

export default config;
