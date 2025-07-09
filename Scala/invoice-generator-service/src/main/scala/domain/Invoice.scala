package domain

import java.time.LocalDateTime
import java.util.UUID

case class InvoiceEvent(
  id: UUID,
  companyId: String,
  customerId: String,
  customerName: String,
  customerEmail: String,
  customerAddress: Address,
  invoiceType: InvoiceType,
  items: List[InvoiceItem],
  totalAmount: BigDecimal,
  currency: String,
  issuedAt: LocalDateTime,
  dueDate: LocalDateTime,
  metadata: Map[String, String]
)

case class Invoice(
  id: UUID,
  eventId: UUID,
  companyId: String,
  customerId: String,
  customerName: String,
  customerEmail: String,
  customerAddress: Address,
  invoiceType: InvoiceType,
  items: List[InvoiceItem],
  totalAmount: BigDecimal,
  currency: String,
  issuedAt: LocalDateTime,
  dueDate: LocalDateTime,
  status: InvoiceStatus,
  pdfUrl: Option[String],
  metadata: Map[String, String],
  createdAt: LocalDateTime,
  updatedAt: LocalDateTime
)

case class Address(
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String
)

case class InvoiceItem(
  description: String,
  quantity: Int,
  unitPrice: BigDecimal,
  totalPrice: BigDecimal
)

enum InvoiceType:
  case B2C, B2B

enum InvoiceStatus:
  case Pending, Generated, Failed

case class PaginationParams(
  page: Int = 1,
  pageSize: Int = 20
)

case class InvoiceFilters(
  companyId: Option[String] = None,
  fromDate: Option[LocalDateTime] = None,
  toDate: Option[LocalDateTime] = None,
  status: Option[InvoiceStatus] = None
)

case class PaginatedInvoices(
  invoices: List[Invoice],
  totalCount: Long,
  page: Int,
  pageSize: Int,
  totalPages: Int
) 