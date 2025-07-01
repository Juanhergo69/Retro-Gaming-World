/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    corePlugins: {
        oxide: false
    },
    theme: {
        extend: {
            fontFamily: {
                retro: ['"Press Start 2P"', 'cursive'],
            },
            colors: {
                'retro-dark': '#1a1a2e',
                'retro-purple': '#4a148c',
                'retro-green': '#2ecc71',
                'retro-green-dark': '#27ae60',
                'retro-blue': '#3498db',
                'retro-blue-dark': '#2980b9',
                'retro-pink': '#e91e63',
                'retro-pink-dark': '#c2185b',
                'retro-yellow': '#f1c40f',
                'retro-yellow-dark': '#f39c12',
                'retro-red': '#e74c3c',
            },
            boxShadow: {
                'retro': '4px 4px 0px 0px rgba(0,0,0,0.2)',
                'retro-lg': '6px 6px 0px 0px rgba(0,0,0,0.2)',
                'retro-inset': 'inset 4px 4px 0px 0px rgba(0,0,0,0.2)',
            },
        },
    },
    plugins: [
        import('@tailwindcss/forms')
    ],
}
