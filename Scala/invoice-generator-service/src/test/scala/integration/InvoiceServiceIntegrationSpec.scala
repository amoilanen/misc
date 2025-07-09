package integration

import api.*
import config.*
import db.*
import domain.*
import repository.*
import service.*
import zio.*
import zio.test.*
import zio.test.Assertion.*
import com.dimafeng.testcontainers.*
import com.dimafeng.testcontainers.scalatest.TestContainerForAll
import org.testcontainers.containers.KafkaContainer
import org.testcontainers.utility.DockerImageName
import java.time.LocalDateTime

object InvoiceServiceIntegrationSpec extends ZIOSpecDefault:
  
  def spec = suite("InvoiceServiceIntegrationSpec")(
    test("should process invoice event end-to-end") {
      for
        // Create test invoice event
        event = createTestInvoiceEvent()
        eventJson = event.toJson
        
        // Save invoice to database
        repo <- ZIO.service[InvoiceRepository]
        invoice = createInvoiceFromEvent(event)
        _ <- InvoiceRepository.saveInvoice(invoice)
        
        // Verify invoice was saved
        savedInvoice <- InvoiceRepository.findById(invoice.id)
        _ <- assertTrue(savedInvoice.isDefined)
        _ <- assertTrue(savedInvoice.get.companyId == event.companyId)
        
        // Generate PDF
        pdfGen <- ZIO.service[PdfGenerator]
        pdfBytes <- PdfGenerator.generateInvoicePdf(invoice)
        _ <- assertTrue(pdfBytes.length > 0)
        
        // Upload to storage (mock)
        storage <- ZIO.service[StorageService]
        fileName = s"invoices/${invoice.companyId}/${invoice.id}.pdf"
        _ <- StorageService.uploadPdf(pdfBytes, fileName)
        
        // Update invoice with PDF URL
        _ <- InvoiceRepository.updatePdfUrl(invoice.id, fileName)
        _ <- InvoiceRepository.updateStatus(invoice.id, InvoiceStatus.Generated)
        
        // Verify final state
        finalInvoice <- InvoiceRepository.findById(invoice.id)
        _ <- assertTrue(finalInvoice.get.status == InvoiceStatus.Generated)
        _ <- assertTrue(finalInvoice.get.pdfUrl.contains(fileName))
        
      yield assertCompletes
    },
    
    test("should list invoices by company with pagination") {
      for
        repo <- ZIO.service[InvoiceRepository]
        companyId = "test-company-1"
        
        // Create multiple invoices
        invoices = (1 to 5).map(i => createTestInvoice(companyId, s"customer-$i")).toList
        _ <- ZIO.foreach(invoices)(InvoiceRepository.saveInvoice)
        
        // Test pagination
        page1 <- InvoiceRepository.findByCompanyId(companyId, PaginationParams(1, 2))
        _ <- assertTrue(page1.invoices.length == 2)
        _ <- assertTrue(page1.totalCount == 5)
        _ <- assertTrue(page1.page == 1)
        _ <- assertTrue(page1.pageSize == 2)
        _ <- assertTrue(page1.totalPages == 3)
        
        page2 <- InvoiceRepository.findByCompanyId(companyId, PaginationParams(2, 2))
        _ <- assertTrue(page2.invoices.length == 2)
        _ <- assertTrue(page2.page == 2)
        
        page3 <- InvoiceRepository.findByCompanyId(companyId, PaginationParams(3, 2))
        _ <- assertTrue(page3.invoices.length == 1)
        _ <- assertTrue(page3.page == 3)
        
      yield assertCompletes
    },
    
    test("should list invoices by date range") {
      for
        repo <- ZIO.service[InvoiceRepository]
        companyId = "test-company-2"
        baseDate = LocalDateTime.now
        
        // Create invoices with different dates
        invoice1 = createTestInvoice(companyId, "customer-1").copy(issuedAt = baseDate.minusDays(1))
        invoice2 = createTestInvoice(companyId, "customer-2").copy(issuedAt = baseDate)
        invoice3 = createTestInvoice(companyId, "customer-3").copy(issuedAt = baseDate.plusDays(1))
        
        _ <- InvoiceRepository.saveInvoice(invoice1)
        _ <- InvoiceRepository.saveInvoice(invoice2)
        _ <- InvoiceRepository.saveInvoice(invoice3)
        
        // Test date range query
        fromDate = baseDate.minusHours(12)
        toDate = baseDate.plusHours(12)
        result <- InvoiceRepository.findByDateRange(fromDate, toDate, PaginationParams(1, 10))
        _ <- assertTrue(result.invoices.length == 1)
        _ <- assertTrue(result.invoices.head.id == invoice2.id)
        
      yield assertCompletes
    }
  ).provide(
    // Test configuration
    ZLayer.succeed(AppConfig(
      database = DatabaseConfig(
        url = "jdbc:postgresql://localhost:5432/test_invoice_generator",
        username = "test",
        password = "test",
        driver = "org.postgresql.Driver",
        maxConnections = 5
      ),
      kafka = KafkaConfig(
        bootstrapServers = "localhost:9092",
        topic = "test-invoice-events",
        groupId = "test-invoice-generator-service"
      ),
      gcp = GcpConfig(
        projectId = "test-project",
        bucketName = "test-invoice-pdfs"
      ),
      server = ServerConfig(host = "localhost", port = 8081)
    )),
    
    // Database layer
    ZLayer {
      for
        config <- ZIO.service[AppConfig]
        dbLayer = DatabaseLayerImpl(config.database)
        _ <- DatabaseLayer.migrate
      yield dbLayer
    },
    
    // Repository layer
    ZLayer {
      for
        dbLayer <- ZIO.service[DatabaseLayer]
        transactor <- DatabaseLayer.transactor
        repo = DoobieInvoiceRepository(transactor)
      yield repo
    },
    
    // Service layers
    ZLayer.succeed(ITextPdfGenerator()),
    ZLayer.succeed(MockStorageService()),
    
    // API layer
    ZLayer {
      for
        repo <- ZIO.service[InvoiceRepository]
        api = InvoiceApiImpl(repo)
      yield api
    }
  )
  
  private def createTestInvoiceEvent(): InvoiceEvent =
    InvoiceEvent(
      id = EventId.generate,
      companyId = "test-company",
      customerId = "test-customer",
      customerName = "John Doe",
      customerEmail = "john@example.com",
      customerAddress = Address(
        street = "123 Main St",
        city = "New York",
        state = "NY",
        zipCode = "10001",
        country = "USA"
      ),
      invoiceType = InvoiceType.B2C,
      items = List(
        InvoiceItem(
          description = "Test Item",
          quantity = 1,
          unitPrice = BigDecimal("10.00"),
          totalPrice = BigDecimal("10.00")
        )
      ),
      totalAmount = BigDecimal("10.00"),
      currency = "USD",
      issuedAt = LocalDateTime.now,
      dueDate = LocalDateTime.now.plusDays(30),
      metadata = Map("test" -> "value")
    )
  
  private def createTestInvoice(companyId: String, customerId: String): Invoice =
    val now = LocalDateTime.now
    Invoice(
      id = InvoiceId.generate,
      eventId = EventId.generate,
      companyId = companyId,
      customerId = customerId,
      customerName = s"Customer $customerId",
      customerEmail = s"$customerId@example.com",
      customerAddress = Address(
        street = "123 Main St",
        city = "New York",
        state = "NY",
        zipCode = "10001",
        country = "USA"
      ),
      invoiceType = InvoiceType.B2C,
      items = List(
        InvoiceItem(
          description = "Test Item",
          quantity = 1,
          unitPrice = BigDecimal("10.00"),
          totalPrice = BigDecimal("10.00")
        )
      ),
      totalAmount = BigDecimal("10.00"),
      currency = "USD",
      issuedAt = now,
      dueDate = now.plusDays(30),
      status = InvoiceStatus.Pending,
      pdfUrl = None,
      metadata = Map("test" -> "value"),
      createdAt = now,
      updatedAt = now
    )
  
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

// Mock storage service for testing
class MockStorageService extends StorageService:
  def uploadPdf(pdfBytes: Array[Byte], fileName: String): Task[String] =
    ZIO.succeed(s"mock://storage/$fileName")
  
  def getPdfUrl(fileName: String): Task[String] =
    ZIO.succeed(s"mock://storage/$fileName")
  
  def deletePdf(fileName: String): Task[Unit] =
    ZIO.unit 