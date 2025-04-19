import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class', // Utilisation du mode sombre basé sur une classe CSS
    theme: {
        extend: {
            colors: {
                'dark-bg': '#1e1e1e',  // Fond sombre
                'dark-text': '#fbbf24', // Orange doux pour le texte
            },
        },
    },
    plugins: [],
};

export default config;
