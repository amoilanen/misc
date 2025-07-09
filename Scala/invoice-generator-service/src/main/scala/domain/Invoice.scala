package domain

import java.time.LocalDateTime

// Well-defined types for identifiers using opaque types
opaque type InvoiceId = String

object InvoiceId:
  def apply(value: String): InvoiceId = value
  def generate: InvoiceId = java.util.UUID.randomUUID.toString
  def fromString(value: String): Option[InvoiceId] = 
    try Some(InvoiceId(value)) catch case _: Exception => None
  extension (id: InvoiceId) 
    def value: String = id
    override def toString: String = id
    def isValid: Boolean = id.nonEmpty && id.length > 0

opaque type EventId = String

object EventId:
  def apply(value: String): EventId = value
  def generate: EventId = java.util.UUID.randomUUID.toString
  def fromString(value: String): Option[EventId] = 
    try Some(EventId(value)) catch case _: Exception => None
  extension (id: EventId) 
    def value: String = id
    override def toString: String = id
    def isValid: Boolean = id.nonEmpty && id.length > 0

// Type class instances for better integration
given Ordering[InvoiceId] = Ordering.by((id: InvoiceId) => id.value)
given Ordering[EventId] = Ordering.by((id: EventId) => id.value)

case class InvoiceEvent(
  id: EventId,
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
  id: InvoiceId,
  eventId: EventId,
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