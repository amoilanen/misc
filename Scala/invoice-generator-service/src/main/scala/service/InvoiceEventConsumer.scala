package service

import config.KafkaConfig
import domain.*
import zio.*
import zio.kafka.consumer.*
import zio.kafka.serde.*
import zio.json.*
import zio.stream.*

trait InvoiceEventConsumer:
  def startConsuming: Task[Unit]
  def startConsumingWithBatching: Task[Unit]

object InvoiceEventConsumer:
  def startConsuming: ZIO[InvoiceEventConsumer, Throwable, Unit] =
    ZIO.serviceWithZIO[InvoiceEventConsumer](_.startConsuming)

class KafkaInvoiceEventConsumer(
  config: KafkaConfig,
  invoiceService: InvoiceService
) extends InvoiceEventConsumer:

  def startConsuming: Task[Unit] =
    Consumer
      .make(consumerSettings)
      .flatMap: consumer =>
        val eventStream = consumer
          .plainStream(Subscription.topics(config.topic), Serde.string, Serde.string)
          .map(_.value)
          .mapZIO(parseEvent)
          .mapZIO(processEventWithRetry)
          .mapZIO(logProcessingResult)
          .mapZIO(handleFailure)

        eventStream.runDrain
      .provide(Scope.default)

  private def consumerSettings: ConsumerSettings =
    ConsumerSettings(List(config.bootstrapServers))
      .withGroupId(config.groupId)

  private def parseEvent(eventJson: String): Task[InvoiceEvent] =
    ZIO.fromEither(eventJson.fromJson[InvoiceEvent])
      .mapError: error =>
        new RuntimeException(s"Failed to parse invoice event: $error")

  private def processEventWithRetry(event: InvoiceEvent): Task[ProcessingResult] =
    invoiceService.processInvoiceEvent(event)
      .retry(Schedule.exponential(1.second) && Schedule.recurs(3))
      .map(invoice => ProcessingResult.Success(event.id.toString))
      .catchAll: error =>
        ZIO.logError(s"Failed to process invoice event ${event.id} after retries: ${error.getMessage}")
          .as(ProcessingResult.Failure(event.id.toString, error.getMessage))

  private def logProcessingResult(result: ProcessingResult): Task[ProcessingResult] =
    result match
      case ProcessingResult.Success(eventId) =>
        ZIO.logInfo(s"Successfully processed invoice event: $eventId")
          .as(result)
      case ProcessingResult.Failure(eventId, error) =>
        ZIO.logError(s"Failed to process invoice event: $eventId - $error")
          .as(result)

  private def handleFailure(result: ProcessingResult): Task[Unit] =
    result match
      case ProcessingResult.Success(_) =>
        ZIO.unit
      case ProcessingResult.Failure(eventId, error) =>
        ZIO.logError(s"Event $eventId permanently failed: $error")
          .unit

  def startConsumingWithBatching: Task[Unit] =
    Consumer
      .make(consumerSettings)
      .flatMap: consumer =>
        val eventStream = consumer
          .plainStream(Subscription.topics(config.topic), Serde.string, Serde.string)
          .map(_.value)
          .mapZIO(parseEvent)
          .groupedWithin(10, 5.seconds)
          .mapZIO(processBatch)
          .mapZIO(logBatchResult)

        eventStream.runDrain
      .provide(Scope.default)

  private def processBatch(events: Chunk[InvoiceEvent]): Task[BatchResult] =
    ZIO.foreachPar(events): event =>
      invoiceService.processInvoiceEvent(event)
        .retry(Schedule.exponential(1.second) && Schedule.recurs(3))
        .map(invoice => ProcessingResult.Success(event.id.toString))
        .catchAll: error =>
          ZIO.logError(s"Failed to process invoice event ${event.id} after retries: ${error.getMessage}")
            .as(ProcessingResult.Failure(event.id.toString, error.getMessage))
    .map(results => BatchResult(results.toList))

  private def logBatchResult(batchResult: BatchResult): Task[Unit] =
    val successCount = batchResult.results.count(_.isInstanceOf[ProcessingResult.Success])
    val failureCount = batchResult.results.count(_.isInstanceOf[ProcessingResult.Failure])

    ZIO.logInfo(s"Batch processed: $successCount successful, $failureCount failed")
      .unit

sealed trait ProcessingResult:
  def eventId: String

object ProcessingResult:
  case class Success(eventId: String) extends ProcessingResult
  case class Failure(eventId: String, error: String) extends ProcessingResult

case class BatchResult(results: List[ProcessingResult])
