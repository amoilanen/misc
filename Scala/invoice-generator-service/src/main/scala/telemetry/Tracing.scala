package telemetry

import config.TelemetryConfig
import io.opentelemetry.api.OpenTelemetry as OtelApi
import io.opentelemetry.api.common.Attributes
import io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporter
import io.opentelemetry.sdk.OpenTelemetrySdk
import io.opentelemetry.sdk.resources.Resource
import io.opentelemetry.sdk.trace.SdkTracerProvider
import io.opentelemetry.sdk.trace.`export`.BatchSpanProcessor
import io.opentelemetry.semconv.ServiceAttributes
import zio.*
import zio.telemetry.opentelemetry.OpenTelemetry
import zio.telemetry.opentelemetry.context.ContextStorage
import zio.telemetry.opentelemetry.tracing.Tracing

object TracingSetup:

  private val instrumentationScopeName = "invoice-generator-service"

  private def otlpTracerProvider(config: TelemetryConfig): RIO[Scope, SdkTracerProvider] =
    for
      spanExporter <- ZIO.fromAutoCloseable(
        ZIO.succeed(
          OtlpGrpcSpanExporter.builder()
            .setEndpoint(config.endpoint)
            .build()
        )
      )
      spanProcessor <- ZIO.fromAutoCloseable(
        ZIO.succeed(BatchSpanProcessor.builder(spanExporter).build())
      )
      tracerProvider <- ZIO.fromAutoCloseable(
        ZIO.succeed(
          SdkTracerProvider.builder()
            .setResource(
              Resource.create(
                Attributes.of(ServiceAttributes.SERVICE_NAME, config.serviceName)
              )
            )
            .addSpanProcessor(spanProcessor)
            .build()
        )
      )
    yield tracerProvider

  private def noopOpenTelemetry: TaskLayer[OtelApi] =
    ZLayer.succeed(OtelApi.noop())

  private def otlpOpenTelemetry(config: TelemetryConfig): TaskLayer[OtelApi] =
    OpenTelemetry.custom(
      for
        tracerProvider <- otlpTracerProvider(config)
        sdk <- ZIO.fromAutoCloseable(
          ZIO.succeed(
            OpenTelemetrySdk.builder()
              .setTracerProvider(tracerProvider)
              .build()
          )
        )
      yield sdk
    )

  def live(config: TelemetryConfig): TaskLayer[Tracing & ContextStorage] =
    val otelLayer =
      if config.enabled then otlpOpenTelemetry(config)
      else noopOpenTelemetry

    otelLayer >+> OpenTelemetry.contextZIO >+> OpenTelemetry.tracing(instrumentationScopeName)
