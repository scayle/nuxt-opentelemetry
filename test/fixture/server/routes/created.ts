import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  return new Response(null, {
    status: 204,
  })
})
