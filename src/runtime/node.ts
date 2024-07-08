import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { NodeSDK } from '@opentelemetry/sdk-node'

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'

// In this file we initialize the Node OpenTelemetry SDK and the OTLP Exporter
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
})

sdk.start()
