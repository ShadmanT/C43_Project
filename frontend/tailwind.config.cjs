/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: true, // keep preflight on
    margin: true,    // ✅ enable margin utilities like `m-0`
  },
  plugins: [],
};
