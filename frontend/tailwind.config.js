/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                accent: {
                    DEFAULT: '#f97316', // orange-500
                    hover: '#ea580c',   // orange-600
                    light: 'rgba(249, 115, 22, 0.1)',
                },
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            borderRadius: {
                lg: '24px',
                xl: '48px',
            }
        },
    },
    plugins: [],
}
