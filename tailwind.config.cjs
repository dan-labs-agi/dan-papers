/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
                sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
            },
            colors: {
                'medium-black': '#242424',
                'medium-gray': '#757575',
                'medium-green': '#1a8917',
                'medium-bg': '#ffffff',
            }
        },
    },
    plugins: [],
}
