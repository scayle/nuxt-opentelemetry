import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(() => {
  throw createError({
    status: 503,
  })
})
