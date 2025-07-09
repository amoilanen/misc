package service

import domain.*
import zio.*
import zio.test.*
import zio.test.Assertion.*
import java.time.LocalDateTime
import java.util.UUID

object PdfGeneratorSpec extends ZIOSpecDefault:
  
  def spec = suite("PdfGeneratorSpec")(
    test("should generate PDF for valid invoice") {
      for
        pdfGenerator <- ZIO.service[PdfGenerator]
        invoice = createTestInvoice()
        pdfBytes <- PdfGenerator.generateInvoicePdf(invoice)
      yield assertTrue(pdfBytes.length > 0)
    },
    
    test("should generate PDF with correct content structure") {
      for
        pdfGenerator <- ZIO.service[PdfGenerator]
        invoice = createTestInvoice()
        pdfBytes <- PdfGenerator.generateInvoicePdf(invoice)
        pdfContent = new String(pdfBytes)
      yield assertTrue(
        pdfBytes.length > 0,
        pdfContent.contains("INVOICE"),
        pdfContent.contains(invoice.customerName),
        pdfContent.contains(invoice.id.toString)
      )
    },
    
    test("should handle B2B invoice type") {
      for
        pdfGenerator <- ZIO.service[PdfGenerator]
        invoice = createTestInvoice().copy(invoiceType = InvoiceType.B2B)
        pdfBytes <- PdfGenerator.generateInvoicePdf(invoice)
      yield assertTrue(pdfBytes.length > 0)
    },
    
    test("should handle B2C invoice type") {
      for
        pdfGenerator <- ZIO.service[PdfGenerator]
        invoice = createTestInvoice().copy(invoiceType = InvoiceType.B2C)
        pdfBytes <- PdfGenerator.generateInvoicePdf(invoice)
      yield assertTrue(pdfBytes.length > 0)
    }
  ).provide(
    ZLayer.succeed(ITextPdfGenerator())
  )
  
  private def createTestInvoice(): Invoice =
    Invoice(
      id = UUID.randomUUID,
      eventId = UUID.randomUUID,
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
          description = "Test Item 1",
          quantity = 2,
          unitPrice = BigDecimal("10.50"),
          totalPrice = BigDecimal("21.00")
        ),
        InvoiceItem(
          description = "Test Item 2",
          quantity = 1,
          unitPrice = BigDecimal("15.00"),
          totalPrice = BigDecimal("15.00")
        )
      ),
      totalAmount = BigDecimal("36.00"),
      currency = "USD",
      issuedAt = LocalDateTime.now,
      dueDate = LocalDateTime.now.plusDays(30),
      status = InvoiceStatus.Pending,
      pdfUrl = None,
      metadata = Map("test" -> "value"),
      createdAt = LocalDateTime.now,
      updatedAt = LocalDateTime.now
    ) 