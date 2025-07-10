package domain

import java.time.LocalDateTime
import zio.json.*

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
given Ordering[InvoiceId] = Ordering.by((id: InvoiceId) => id.toString)
given Ordering[EventId] = Ordering.by((id: EventId) => id.toString)

// JSON codecs for opaque types
given JsonCodec[InvoiceId] = JsonCodec.string.transform(InvoiceId.apply, _.toString)
given JsonCodec[EventId] = JsonCodec.string.transform(EventId.apply, _.toString)

// Remove all @json annotations from case classes and enums
// Add companion objects with given JsonCodec for each type

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
object InvoiceEvent {
  given JsonCodec[InvoiceEvent] = DeriveJsonCodec.gen[InvoiceEvent]
}

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
object Invoice {
  given JsonCodec[Invoice] = DeriveJsonCodec.gen[Invoice]
}

case class Address(
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String
)
object Address {
  given JsonCodec[Address] = DeriveJsonCodec.gen[Address]
}

case class InvoiceItem(
  description: String,
  quantity: Int,
  unitPrice: BigDecimal,
  totalPrice: BigDecimal
)
object InvoiceItem {
  given JsonCodec[InvoiceItem] = DeriveJsonCodec.gen[InvoiceItem]
}

enum InvoiceType:
  case B2C, B2B
object InvoiceType {
  given JsonCodec[InvoiceType] = DeriveJsonCodec.gen[InvoiceType]
}

enum InvoiceStatus:
  case Pending, Generated, Failed
object InvoiceStatus {
  given JsonCodec[InvoiceStatus] = DeriveJsonCodec.gen[InvoiceStatus]
}

case class PaginationParams(
  page: Int = 1,
  pageSize: Int = 20
)
object PaginationParams {
  given JsonCodec[PaginationParams] = DeriveJsonCodec.gen[PaginationParams]
}

case class InvoiceFilters(
  companyId: Option[String] = None,
  fromDate: Option[LocalDateTime] = None,
  toDate: Option[LocalDateTime] = None,
  status: Option[InvoiceStatus] = None
)
object InvoiceFilters {
  given JsonCodec[InvoiceFilters] = DeriveJsonCodec.gen[InvoiceFilters]
}

case class PaginatedInvoices(
  invoices: List[Invoice],
  totalCount: Long,
  page: Int,
  pageSize: Int,
  totalPages: Int
)
object PaginatedInvoices {
  given JsonCodec[PaginatedInvoices] = DeriveJsonCodec.gen[PaginatedInvoices]
} 