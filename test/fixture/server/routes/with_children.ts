import { defineEventHandler } from 'h3'
import { trace, context } from '@opentelemetry/api'

export default defineEventHandler(async () => {
  const tracer = trace.getTracer(
    'inner tracer',
  )
  return tracer.startActiveSpan(
    'with_children',
    {
      attributes: {
        key: 'value',
      },
    },
    context.active(),
    async (span) => {
      span.end()
      return 'hello!'
    },
  )
})
