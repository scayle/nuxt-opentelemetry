import { addRouteMiddleware } from '#app/composables/router'
import { defineNuxtPlugin, useNuxtApp } from '#app'

/**
 * When rendering SSR pages, add the `matchedVueRoute` property to the event context
 */
export default defineNuxtPlugin(() => {
  addRouteMiddleware((to) => {
    const nuxtApp = useNuxtApp()

    if (nuxtApp.ssrContext) {
      const event = nuxtApp.ssrContext.event

      event.context.matchedVueRoute = {
        [event.path]: to.matched[0],
      }
    }
  })
})
