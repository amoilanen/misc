package service

import domain.*
import repository.*
import zio.*
import zio.telemetry.opentelemetry.tracing.Tracing
import io.opentelemetry.api.trace.SpanKind
import java.time.LocalDateTime

trait InvoiceService:
  def processInvoiceEvent(event: InvoiceEvent): Task[Invoice]
  def findById(id: InvoiceId): Task[Option[Invoice]]
  def findByCompanyId(companyId: String, pagination: PaginationParams): Task[PaginatedInvoices]
  def findByDateRange(from: LocalDateTime, to: LocalDateTime, pagination: PaginationParams): Task[PaginatedInvoices]
  def getInvoicePdfUrl(id: InvoiceId): Task[String]

object InvoiceService:
  def processInvoiceEvent(event: InvoiceEvent): ZIO[InvoiceService, Throwable, Invoice] =
    ZIO.serviceWithZIO[InvoiceService](_.processInvoiceEvent(event))

  def findById(id: InvoiceId): ZIO[InvoiceService, Throwable, Option[Invoice]] =
    ZIO.serviceWithZIO[InvoiceService](_.findById(id))

  def findByCompanyId(companyId: String, pagination: PaginationParams): ZIO[InvoiceService, Throwable, PaginatedInvoices] =
    ZIO.serviceWithZIO[InvoiceService](_.findByCompanyId(companyId, pagination))

  def findByDateRange(from: LocalDateTime, to: LocalDateTime, pagination: PaginationParams): ZIO[InvoiceService, Throwable, PaginatedInvoices] =
    ZIO.serviceWithZIO[InvoiceService](_.findByDateRange(from, to, pagination))

  def getInvoicePdfUrl(id: InvoiceId): ZIO[InvoiceService, Throwable, String] =
    ZIO.serviceWithZIO[InvoiceService](_.getInvoicePdfUrl(id))

class InvoiceServiceLive(
  invoiceRepository: InvoiceRepository,
  pdfGenerator: PdfGenerator,
  storageService: StorageService,
  tracing: Tracing
) extends InvoiceService:

  private def span[R, E, A](name: String)(effect: ZIO[R, E, A]): ZIO[R, E, A] =
    effect @@ tracing.aspects.span(name, SpanKind.INTERNAL)

  def processInvoiceEvent(event: InvoiceEvent): Task[Invoice] =
    val invoice = createInvoiceFromEvent(event)
    val workflow = for
      _ <- ZIO.logInfo(s"Processing invoice event: ${event.id}")
      _ <- tracing.setAttribute("invoice.id", invoice.id.value)
      _ <- tracing.setAttribute("invoice.companyId", invoice.companyId)
      _ <- tracing.setAttribute("invoice.eventId", event.id.value)
      _ <- span("InvoiceRepository.saveInvoice")(invoiceRepository.saveInvoice(invoice))
      pdfBytes <- span("PdfGenerator.generateInvoicePdf")(pdfGenerator.generateInvoicePdf(invoice))
      fileName = s"invoices/${invoice.companyId}/${invoice.id}.pdf"
      _ <- span("StorageService.uploadPdf")(storageService.uploadPdf(pdfBytes, fileName))
      _ <- span("InvoiceRepository.updatePdfUrl")(invoiceRepository.updatePdfUrl(invoice.id, fileName))
      _ <- span("InvoiceRepository.updateStatus")(invoiceRepository.updateStatus(invoice.id, InvoiceStatus.Generated))
      _ <- ZIO.logInfo(s"Successfully processed invoice: ${invoice.id}")
    yield invoice.copy(
      pdfUrl = Some(fileName),
      status = InvoiceStatus.Generated
    )

    val traced = workflow @@ tracing.aspects.root("InvoiceService.processInvoiceEvent", SpanKind.INTERNAL)

    traced.catchAll: error =>
      ZIO.logError(s"Failed to process invoice ${invoice.id}: ${error.getMessage}") *>
        invoiceRepository.updateStatus(invoice.id, InvoiceStatus.Failed)
          .catchAll(updateError =>
            ZIO.logError(s"Failed to update status to Failed for invoice ${invoice.id}: ${updateError.getMessage}")
          ) *>
        ZIO.fail(error)

  def findById(id: InvoiceId): Task[Option[Invoice]] =
    span("InvoiceService.findById")(invoiceRepository.findById(id))

  def findByCompanyId(companyId: String, pagination: PaginationParams): Task[PaginatedInvoices] =
    span("InvoiceService.findByCompanyId")(invoiceRepository.findByCompanyId(companyId, pagination))

  def findByDateRange(from: LocalDateTime, to: LocalDateTime, pagination: PaginationParams): Task[PaginatedInvoices] =
    span("InvoiceService.findByDateRange")(invoiceRepository.findByDateRange(from, to, pagination))

  def getInvoicePdfUrl(id: InvoiceId): Task[String] =
    span("InvoiceService.getInvoicePdfUrl"):
      for
        maybeInvoice <- invoiceRepository.findById(id)
        invoice <- ZIO.fromOption(maybeInvoice)
          .mapError(_ => new RuntimeException(s"Invoice with id ${id.value} not found"))
        pdfUrl <- ZIO.fromOption(invoice.pdfUrl)
          .mapError(_ => new RuntimeException(s"Invoice ${id.value} does not have a PDF"))
      yield pdfUrl

  private def createInvoiceFromEvent(event: InvoiceEvent): Invoice =
    val now = LocalDateTime.now
    Invoice(
      id = InvoiceId.generate,
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

object InvoiceServiceLive:
  val layer: ZLayer[InvoiceRepository & PdfGenerator & StorageService & Tracing, Nothing, InvoiceService] =
    ZLayer:
      for
        repo <- ZIO.service[InvoiceRepository]
        pdfGen <- ZIO.service[PdfGenerator]
        storage <- ZIO.service[StorageService]
        tracing <- ZIO.service[Tracing]
      yield InvoiceServiceLive(repo, pdfGen, storage, tracing)
