import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  throw new Error('Oops!')
})
