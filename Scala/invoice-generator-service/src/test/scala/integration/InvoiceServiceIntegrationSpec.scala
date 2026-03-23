package integration

import config.*
import db.*
import domain.*
import repository.*
import service.*
import zio.*
import zio.test.*
import zio.test.Assertion.*
import com.dimafeng.testcontainers.PostgreSQLContainer
import org.testcontainers.utility.DockerImageName
import java.time.LocalDateTime
import java.util.concurrent.ConcurrentHashMap
import zio.telemetry.opentelemetry.tracing.Tracing
import io.opentelemetry.api.OpenTelemetry as OtelApi
import zio.telemetry.opentelemetry.OpenTelemetry

object InvoiceServiceIntegrationSpec extends ZIOSpecDefault:

  private val sampleEvent = InvoiceEvent(
    id = EventId("evt-integration-001"),
    companyId = "company-integration",
    customerId = "customer-001",
    customerName = "Integration Test Customer",
    customerEmail = "integration@test.com",
    customerAddress = Address(
      street = "456 Test Ave",
      city = "Testville",
      state = "CA",
      zipCode = "90210",
      country = "US"
    ),
    invoiceType = InvoiceType.B2B,
    items = List(
      InvoiceItem("Service A", 1, BigDecimal(100.00), BigDecimal(100.00)),
      InvoiceItem("Service B", 2, BigDecimal(50.00), BigDecimal(100.00))
    ),
    totalAmount = BigDecimal(200.00),
    currency = "USD",
    issuedAt = LocalDateTime.of(2024, 6, 1, 10, 0),
    dueDate = LocalDateTime.of(2024, 7, 1, 10, 0),
    metadata = Map("env" -> "integration-test")
  )

  /** In-memory storage service for testing without GCS dependency. */
  private class InMemoryStorageService extends StorageService:
    private val store = ConcurrentHashMap[String, Array[Byte]]()

    def uploadPdf(pdfBytes: Array[Byte], fileName: String): Task[String] =
      ZIO.attempt:
        store.put(fileName, pdfBytes)
        s"gs://test-bucket/$fileName"

    def getPdfUrl(fileName: String): Task[String] =
      ZIO.attempt:
        if store.containsKey(fileName) then s"gs://test-bucket/$fileName"
        else throw new RuntimeException(s"File $fileName not found")

    def downloadPdf(fileName: String): Task[Array[Byte]] =
      ZIO.attempt:
        val bytes = store.get(fileName)
        if bytes != null then bytes
        else throw new RuntimeException(s"File $fileName not found")

    def deletePdf(fileName: String): Task[Unit] =
      ZIO.attempt:
        store.remove(fileName)
        ()

  private val instrumentationScopeName = "test"

  private val noopTracingLayer: TaskLayer[Tracing] =
    ZLayer.succeed(OtelApi.noop()) >+>
      OpenTelemetry.contextZIO >+>
      OpenTelemetry.tracing(instrumentationScopeName)

  private val testLayer: ZLayer[Any, Throwable, InvoiceService & StorageService] =
    ZLayer.scoped {
      for
        container <- ZIO.acquireRelease(
          ZIO.attempt {
            val c = PostgreSQLContainer(dockerImageNameOverride = DockerImageName.parse("postgres:15"))
            c.start()
            c
          }
        )(c => ZIO.attempt(c.stop()).orDie)
        dbLayer = DatabaseLayerImpl(DatabaseConfig(
          url = container.jdbcUrl,
          username = container.username,
          password = container.password
        ))
        _ <- dbLayer.migrate
        repo = DoobieInvoiceRepository(dbLayer.transactor)
        pdfGen = ITextPdfGenerator()
        storage = InMemoryStorageService()
        tracing <- ZIO.service[Tracing].provide(noopTracingLayer)
        service = InvoiceServiceLive(repo, pdfGen, storage, tracing)
      yield (service, storage)
    }.flatMap { env =>
      val (service, storage) = env.get[(InvoiceService, StorageService)]
      ZLayer.succeed(service) ++ ZLayer.succeed(storage)
    }

  def spec = suite("InvoiceServiceIntegrationSpec")(
    test("should process an invoice event end-to-end") {
      for
        service <- ZIO.service[InvoiceService]
        invoice <- service.processInvoiceEvent(sampleEvent)
      yield assertTrue(
        invoice.companyId == "company-integration",
        invoice.items.size == 2,
        invoice.status == InvoiceStatus.Generated,
        invoice.pdfUrl.isDefined
      )
    },
    test("should retrieve a processed invoice by ID") {
      for
        service <- ZIO.service[InvoiceService]
        invoice <- service.processInvoiceEvent(
          sampleEvent.copy(id = EventId("evt-integration-retrieve"))
        )
        found <- service.findById(invoice.id)
      yield assertTrue(
        found.isDefined,
        found.get.companyId == "company-integration",
        found.get.items.size == 2
      )
    },
    test("should paginate invoices by company") {
      for
        service <- ZIO.service[InvoiceService]
        _ <- ZIO.foreach(1 to 5) { i =>
          val event = sampleEvent.copy(
            id = EventId(s"evt-pagination-$i"),
            companyId = "company-pagination"
          )
          service.processInvoiceEvent(event)
        }
        page1 <- service.findByCompanyId("company-pagination", PaginationParams(page = 1, pageSize = 2))
        page2 <- service.findByCompanyId("company-pagination", PaginationParams(page = 2, pageSize = 2))
      yield assertTrue(
        page1.invoices.size == 2,
        page1.totalCount == 5L,
        page1.totalPages == 3,
        page2.invoices.size == 2
      )
    },
    test("should filter invoices by date range") {
      for
        service <- ZIO.service[InvoiceService]
        _ <- service.processInvoiceEvent(
          sampleEvent.copy(
            id = EventId("evt-date-early"),
            companyId = "company-date-range",
            issuedAt = LocalDateTime.of(2024, 1, 1, 10, 0)
          )
        )
        _ <- service.processInvoiceEvent(
          sampleEvent.copy(
            id = EventId("evt-date-late"),
            companyId = "company-date-range",
            issuedAt = LocalDateTime.of(2024, 12, 1, 10, 0)
          )
        )
        result <- service.findByDateRange(
          LocalDateTime.of(2024, 1, 1, 0, 0),
          LocalDateTime.of(2024, 6, 30, 23, 59),
          PaginationParams()
        )
      yield assertTrue(
        result.invoices.size == 1,
        result.totalCount == 1L
      )
    },
    test("should download a PDF for a processed invoice") {
      for
        service <- ZIO.service[InvoiceService]
        storage <- ZIO.service[StorageService]
        invoice <- service.processInvoiceEvent(
          sampleEvent.copy(id = EventId("evt-pdf-download"))
        )
        pdfUrl <- service.getInvoicePdfUrl(invoice.id)
        pdfBytes <- storage.downloadPdf(pdfUrl)
        header = String(pdfBytes.take(5), "UTF-8")
      yield assertTrue(
        pdfBytes.nonEmpty,
        // PDF files start with %PDF magic bytes
        pdfBytes.length > 4,
        header.startsWith("%PDF")
      )
    },
    test("should return error when downloading PDF for non-existent invoice") {
      for
        service <- ZIO.service[InvoiceService]
        result <- service.getInvoicePdfUrl(InvoiceId("non-existent")).either
      yield assertTrue(
        result.isLeft,
        result.left.toOption.get.getMessage.contains("not found")
      )
    }
  ).provideLayerShared(testLayer) @@ TestAspect.sequential
