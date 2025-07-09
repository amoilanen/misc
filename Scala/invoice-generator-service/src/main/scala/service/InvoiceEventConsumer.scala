package service

import config.KafkaConfig
import domain.*
import repository.*
import zio.*
import zio.kafka.consumer.*
import zio.kafka.serde.*
import zio.json.*
import java.time.LocalDateTime
import java.util.UUID

trait InvoiceEventConsumer:
  def startConsuming: Task[Unit]

object InvoiceEventConsumer:
  def startConsuming: ZIO[InvoiceEventConsumer, Throwable, Unit] =
    ZIO.serviceWithZIO[InvoiceEventConsumer](_.startConsuming)

class KafkaInvoiceEventConsumer(
  config: KafkaConfig,
  invoiceRepository: InvoiceRepository,
  pdfGenerator: PdfGenerator,
  storageService: StorageService
) extends InvoiceEventConsumer:
  
  def startConsuming: Task[Unit] =
    Consumer
      .make(consumerSettings)
      .flatMap: consumer =>
        consumer
          .subscribeAnd(Subscription.topics(config.topic))
          .plainStream(Serde.string, Serde.string)
          .mapZIO: record =>
            processInvoiceEvent(record.value)
              .catchAll: error =>
                ZIO.logError(s"Failed to process invoice event: ${error.getMessage}")
          .runDrain
      .provide(ZLayer.succeed(consumerSettings))

  private def consumerSettings: ConsumerSettings =
    ConsumerSettings(config.bootstrapServers)
      .withGroupId(config.groupId)
      .withAutoOffsetReset(AutoOffsetReset.Earliest)
      .withEnableAutoCommit(true)

  private def processInvoiceEvent(eventJson: String): Task[Unit] =
    for
      event <- ZIO.fromEither(InvoiceEvent.fromJson(eventJson))
      _ <- ZIO.logInfo(s"Processing invoice event: ${event.id}")
      
      // Create invoice record
      invoice = createInvoiceFromEvent(event)
      _ <- InvoiceRepository.saveInvoice(invoice)
      
      // Generate PDF
      pdfBytes <- PdfGenerator.generateInvoicePdf(invoice)
      
      // Upload to GCP
      fileName = s"invoices/${invoice.companyId}/${invoice.id}.pdf"
      _ <- StorageService.uploadPdf(pdfBytes, fileName)
      
      // Update invoice with PDF URL
      _ <- InvoiceRepository.updatePdfUrl(invoice.id, fileName)
      _ <- InvoiceRepository.updateStatus(invoice.id, InvoiceStatus.Generated)
      
      _ <- ZIO.logInfo(s"Successfully processed invoice: ${invoice.id}")
    yield ()

  private def createInvoiceFromEvent(event: InvoiceEvent): Invoice =
    val now = LocalDateTime.now
    Invoice(
      id = UUID.randomUUID,
      eventId = event.id,
      companyId = event.companyId,
      customerId = event.customerId,
      customerName = event.customerName,
      customerEmail = event.customerEmail,
      customerAddress = event.customerAddress,
      invoiceType = event.invoiceType,
      items = event.items,
      totalAmount = event.totalAmount,
      currency = event.currency,
      issuedAt = event.issuedAt,
      dueDate = event.dueDate,
      status = InvoiceStatus.Pending,
      pdfUrl = None,
      metadata = event.metadata,
      createdAt = now,
      updatedAt = now
    )

// JSON codec for InvoiceEvent
given JsonCodec[InvoiceEvent] = DeriveJsonCodec.gen[InvoiceEvent]
given JsonCodec[Address] = DeriveJsonCodec.gen[Address]
given JsonCodec[InvoiceItem] = DeriveJsonCodec.gen[InvoiceItem]
given JsonCodec[InvoiceType] = DeriveJsonCodec.gen[InvoiceType]

extension (event: InvoiceEvent)
  def toJson: String = event.toJson

object InvoiceEvent:
  def fromJson(json: String): Either[String, InvoiceEvent] = json.fromJson[InvoiceEvent] 