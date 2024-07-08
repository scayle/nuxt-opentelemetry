import { addRouteMiddleware } from '#app/composables/router'
import { defineNuxtPlugin, useNuxtApp } from '#app'

/**
 * When rendering SSR pages, add the `matchedVueRoute` property to the event context
 */
export default defineNuxtPlugin(() => {
  addRouteMiddleware((to) => {
    const nuxtApp = useNuxtApp()

    if (nuxtApp.ssrContext) {
      nuxtApp.ssrContext.event.context.matchedVueRoute = to.matched[0]
    }
  })
})
