package repository

import config.*
import db.*
import domain.*
import zio.*
import zio.test.*
import zio.test.Assertion.*
import com.dimafeng.testcontainers.PostgreSQLContainer
import org.testcontainers.utility.DockerImageName
import java.time.LocalDateTime

object InvoiceRepositorySpec extends ZIOSpecDefault:

  private def makeInvoice(
    id: String = InvoiceId.generate.value,
    eventId: String = EventId.generate.value,
    companyId: String = "company-001",
    customerId: String = "customer-001",
    customerName: String = "John Doe",
    customerEmail: String = "john@example.com",
    address: Address = Address("123 Main St", "Springfield", "IL", "62701", "US"),
    invoiceType: InvoiceType = InvoiceType.B2C,
    items: List[InvoiceItem] = List(
      InvoiceItem("Widget A", 2, BigDecimal(10.00), BigDecimal(20.00)),
      InvoiceItem("Widget B", 1, BigDecimal(15.50), BigDecimal(15.50))
    ),
    totalAmount: BigDecimal = BigDecimal(35.50),
    currency: String = "USD",
    issuedAt: LocalDateTime = LocalDateTime.of(2024, 6, 15, 10, 0),
    dueDate: LocalDateTime = LocalDateTime.of(2024, 7, 15, 10, 0),
    status: InvoiceStatus = InvoiceStatus.Pending,
    pdfUrl: Option[String] = None,
    metadata: Map[String, String] = Map("source" -> "test", "env" -> "unit"),
    createdAt: LocalDateTime = LocalDateTime.of(2024, 6, 15, 10, 0),
    updatedAt: LocalDateTime = LocalDateTime.of(2024, 6, 15, 10, 0)
  ): Invoice = Invoice(
    id = InvoiceId(id),
    eventId = EventId(eventId),
    companyId = companyId,
    customerId = customerId,
    customerName = customerName,
    customerEmail = customerEmail,
    customerAddress = address,
    invoiceType = invoiceType,
    items = items,
    totalAmount = totalAmount,
    currency = currency,
    issuedAt = issuedAt,
    dueDate = dueDate,
    status = status,
    pdfUrl = pdfUrl,
    metadata = metadata,
    createdAt = createdAt,
    updatedAt = updatedAt
  )

  private val postgresLayer: ZLayer[Any, Throwable, InvoiceRepository] =
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
      yield DoobieInvoiceRepository(dbLayer.transactor)
    }

  def spec = suite("InvoiceRepositorySpec")(
    suite("saveInvoice and findById")(
      test("should save and retrieve an invoice with all fields preserved") {
        val invoice = makeInvoice()
        for
          repo <- ZIO.service[InvoiceRepository]
          _ <- repo.saveInvoice(invoice)
          found <- repo.findById(invoice.id)
        yield assertTrue(
          found.isDefined,
          found.get.id == invoice.id,
          found.get.eventId == invoice.eventId,
          found.get.companyId == invoice.companyId,
          found.get.customerId == invoice.customerId,
          found.get.customerName == invoice.customerName,
          found.get.customerEmail == invoice.customerEmail,
          found.get.customerAddress == invoice.customerAddress,
          found.get.invoiceType == invoice.invoiceType,
          found.get.items == invoice.items,
          found.get.totalAmount == invoice.totalAmount,
          found.get.currency == invoice.currency,
          found.get.status == invoice.status,
          found.get.pdfUrl == invoice.pdfUrl,
          found.get.metadata == invoice.metadata
        )
      },
      test("should return None for non-existent invoice") {
        for
          repo <- ZIO.service[InvoiceRepository]
          found <- repo.findById(InvoiceId("non-existent-id"))
        yield assertTrue(found.isEmpty)
      },
      test("should preserve Address with special characters") {
        val specialAddress = Address(
          street = """123 O'Brien "Main" St & Co.""",
          city = "San Francisco",
          state = "CA",
          zipCode = "94105",
          country = "US"
        )
        val invoice = makeInvoice(address = specialAddress)
        for
          repo <- ZIO.service[InvoiceRepository]
          _ <- repo.saveInvoice(invoice)
          found <- repo.findById(invoice.id)
        yield assertTrue(
          found.isDefined,
          found.get.customerAddress == specialAddress,
          found.get.customerAddress.street == """123 O'Brien "Main" St & Co."""
        )
      },
      test("should preserve Address with unicode characters") {
        val unicodeAddress = Address(
          street = "Straße der Einheit 42",
          city = "München",
          state = "Bayern",
          zipCode = "80331",
          country = "Deutschland"
        )
        val invoice = makeInvoice(address = unicodeAddress)
        for
          repo <- ZIO.service[InvoiceRepository]
          _ <- repo.saveInvoice(invoice)
          found <- repo.findById(invoice.id)
        yield assertTrue(
          found.isDefined,
          found.get.customerAddress == unicodeAddress
        )
      },
      test("should handle empty items list") {
        val invoice = makeInvoice(
          items = List.empty,
          totalAmount = BigDecimal(0)
        )
        for
          repo <- ZIO.service[InvoiceRepository]
          _ <- repo.saveInvoice(invoice)
          found <- repo.findById(invoice.id)
        yield assertTrue(
          found.isDefined,
          found.get.items.isEmpty
        )
      },
      test("should handle empty metadata map") {
        val invoice = makeInvoice(metadata = Map.empty)
        for
          repo <- ZIO.service[InvoiceRepository]
          _ <- repo.saveInvoice(invoice)
          found <- repo.findById(invoice.id)
        yield assertTrue(
          found.isDefined,
          found.get.metadata.isEmpty
        )
      },
      test("should handle metadata with special characters") {
        val specialMetadata = Map(
          "key with spaces" -> "value with \"quotes\"",
          "backslash\\key" -> "backslash\\value",
          "unicode" -> "日本語テスト"
        )
        val invoice = makeInvoice(metadata = specialMetadata)
        for
          repo <- ZIO.service[InvoiceRepository]
          _ <- repo.saveInvoice(invoice)
          found <- repo.findById(invoice.id)
        yield assertTrue(
          found.isDefined,
          found.get.metadata == specialMetadata
        )
      },
      test("should preserve B2B invoice type") {
        val invoice = makeInvoice(invoiceType = InvoiceType.B2B)
        for
          repo <- ZIO.service[InvoiceRepository]
          _ <- repo.saveInvoice(invoice)
          found <- repo.findById(invoice.id)
        yield assertTrue(
          found.isDefined,
          found.get.invoiceType == InvoiceType.B2B
        )
      }
    ),
    suite("findByCompanyId")(
      test("should return paginated results") {
        for
          repo <- ZIO.service[InvoiceRepository]
          _ <- ZIO.foreach(1 to 5) { i =>
            repo.saveInvoice(makeInvoice(
              companyId = "company-pagination",
              issuedAt = LocalDateTime.of(2024, 6, i, 10, 0),
              createdAt = LocalDateTime.of(2024, 6, i, 10, 0)
            ))
          }
          page1 <- repo.findByCompanyId("company-pagination", PaginationParams(page = 1, pageSize = 2))
          page2 <- repo.findByCompanyId("company-pagination", PaginationParams(page = 2, pageSize = 2))
          page3 <- repo.findByCompanyId("company-pagination", PaginationParams(page = 3, pageSize = 2))
        yield assertTrue(
          page1.invoices.size == 2,
          page1.totalCount == 5L,
          page1.totalPages == 3,
          page1.page == 1,
          page1.pageSize == 2,
          page2.invoices.size == 2,
          page2.totalCount == 5L,
          page3.invoices.size == 1
        )
      },
      test("should return empty result for non-existent company") {
        for
          repo <- ZIO.service[InvoiceRepository]
          result <- repo.findByCompanyId("non-existent-company", PaginationParams())
        yield assertTrue(
          result.invoices.isEmpty,
          result.totalCount == 0L,
          result.totalPages == 0
        )
      }
    ),
    suite("findByDateRange")(
      test("should return invoices within the date range") {
        for
          repo <- ZIO.service[InvoiceRepository]
          _ <- repo.saveInvoice(makeInvoice(
            companyId = "company-date",
            issuedAt = LocalDateTime.of(2024, 3, 1, 10, 0)
          ))
          _ <- repo.saveInvoice(makeInvoice(
            companyId = "company-date",
            issuedAt = LocalDateTime.of(2024, 6, 15, 10, 0)
          ))
          _ <- repo.saveInvoice(makeInvoice(
            companyId = "company-date",
            issuedAt = LocalDateTime.of(2024, 12, 1, 10, 0)
          ))
          result <- repo.findByDateRange(
            LocalDateTime.of(2024, 5, 1, 0, 0),
            LocalDateTime.of(2024, 8, 31, 23, 59),
            PaginationParams()
          )
        yield assertTrue(
          result.invoices.size == 1,
          result.totalCount == 1L
        )
      },
      test("should support pagination for date range queries") {
        for
          repo <- ZIO.service[InvoiceRepository]
          _ <- ZIO.foreach(1 to 4) { i =>
            repo.saveInvoice(makeInvoice(
              companyId = "company-date-page",
              issuedAt = LocalDateTime.of(2025, 1, i, 10, 0),
              createdAt = LocalDateTime.of(2025, 1, i, 10, 0)
            ))
          }
          result <- repo.findByDateRange(
            LocalDateTime.of(2025, 1, 1, 0, 0),
            LocalDateTime.of(2025, 1, 31, 23, 59),
            PaginationParams(page = 1, pageSize = 2)
          )
        yield assertTrue(
          result.invoices.size == 2,
          result.totalCount == 4L,
          result.totalPages == 2
        )
      }
    ),
    suite("updatePdfUrl")(
      test("should update the PDF URL of an invoice") {
        val invoice = makeInvoice()
        for
          repo <- ZIO.service[InvoiceRepository]
          _ <- repo.saveInvoice(invoice)
          _ <- repo.updatePdfUrl(invoice.id, "gs://bucket/invoices/test.pdf")
          found <- repo.findById(invoice.id)
        yield assertTrue(
          found.isDefined,
          found.get.pdfUrl == Some("gs://bucket/invoices/test.pdf")
        )
      }
    ),
    suite("updateStatus")(
      test("should update the status of an invoice to Generated") {
        val invoice = makeInvoice()
        for
          repo <- ZIO.service[InvoiceRepository]
          _ <- repo.saveInvoice(invoice)
          _ <- repo.updateStatus(invoice.id, InvoiceStatus.Generated)
          found <- repo.findById(invoice.id)
        yield assertTrue(
          found.isDefined,
          found.get.status == InvoiceStatus.Generated
        )
      },
      test("should update the status of an invoice to Failed") {
        val invoice = makeInvoice()
        for
          repo <- ZIO.service[InvoiceRepository]
          _ <- repo.saveInvoice(invoice)
          _ <- repo.updateStatus(invoice.id, InvoiceStatus.Failed)
          found <- repo.findById(invoice.id)
        yield assertTrue(
          found.isDefined,
          found.get.status == InvoiceStatus.Failed
        )
      }
    )
  ).provideLayerShared(postgresLayer) @@ TestAspect.sequential
