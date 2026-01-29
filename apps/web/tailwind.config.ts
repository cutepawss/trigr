import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    dark: '#474448',
                    DEFAULT: '#474448',
                },
                secondary: {
                    dark: '#2d232e',
                    DEFAULT: '#2d232e',
                },
                neutral: {
                    light: '#e0ddcf',
                    DEFAULT: '#e0ddcf',
                },
                accent: '#534b52',
                'off-white': '#f1f0ea',
                success: {
                    DEFAULT: '#2d5016',
                },
                error: {
                    DEFAULT: '#8b2e2e',
                },
                warning: {
                    DEFAULT: '#8b6914',
                },
                info: {
                    DEFAULT: '#1e3a5f',
                },
            },
            fontFamily: {
                serif: ['Georgia', 'Garamond', 'serif'],
                sans: ['Inter', 'Roboto', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
        },
    },
    plugins: [],
};

export default config;
