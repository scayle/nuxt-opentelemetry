export default defineNuxtConfig({
  // https://nuxt.com/docs/api/nuxt-config#compatibilitydate
  compatibilityDate: '2024-09-03',

  // https://nuxt.com/docs/api/nuxt-config#devtools
  devtools: { enabled: false },

  // https://nuxt.com/docs/api/nuxt-config#debug
  debug: false,

  // https://nuxt.com/docs/api/nuxt-config#modules-1
  modules: ['../src/module'],

  // OpenTelemetry
  opentelemetry: {
    enabled: true,
  },
})
