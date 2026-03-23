package service

import domain.*
import zio.*
import zio.test.*
import zio.test.Assertion.*
import java.time.LocalDateTime

object PdfGeneratorSpec extends ZIOSpecDefault:

  private val sampleInvoice = Invoice(
    id = InvoiceId("test-invoice-001"),
    eventId = EventId("test-event-001"),
    companyId = "company-001",
    customerId = "customer-001",
    customerName = "John Doe",
    customerEmail = "john@example.com",
    customerAddress = Address(
      street = "123 Main St",
      city = "Springfield",
      state = "IL",
      zipCode = "62701",
      country = "US"
    ),
    invoiceType = InvoiceType.B2C,
    items = List(
      InvoiceItem("Widget A", 2, BigDecimal(10.00), BigDecimal(20.00)),
      InvoiceItem("Widget B", 1, BigDecimal(15.00), BigDecimal(15.00))
    ),
    totalAmount = BigDecimal(35.00),
    currency = "USD",
    issuedAt = LocalDateTime.of(2024, 1, 15, 10, 0),
    dueDate = LocalDateTime.of(2024, 2, 15, 10, 0),
    status = InvoiceStatus.Pending,
    pdfUrl = None,
    metadata = Map("source" -> "test"),
    createdAt = LocalDateTime.of(2024, 1, 15, 10, 0),
    updatedAt = LocalDateTime.of(2024, 1, 15, 10, 0)
  )

  private val pdfGenerator = ITextPdfGenerator()

  def spec = suite("PdfGeneratorSpec")(
    test("should generate non-empty PDF bytes") {
      for
        pdfBytes <- pdfGenerator.generateInvoicePdf(sampleInvoice)
      yield assertTrue(pdfBytes.nonEmpty)
    },
    test("should generate valid PDF starting with PDF header") {
      for
        pdfBytes <- pdfGenerator.generateInvoicePdf(sampleInvoice)
        header = new String(pdfBytes.take(5))
      yield assertTrue(header == "%PDF-")
    },
    test("should handle B2B invoice type") {
      val b2bInvoice = sampleInvoice.copy(invoiceType = InvoiceType.B2B)
      for
        pdfBytes <- pdfGenerator.generateInvoicePdf(b2bInvoice)
      yield assertTrue(pdfBytes.nonEmpty)
    }
  )
