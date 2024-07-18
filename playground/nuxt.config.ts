export default defineNuxtConfig({
  modules: ['../src/module'],
  opentelemetry: {
    enabled: true,
  },
  devtools: { enabled: true },
})
