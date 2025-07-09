package repository

import domain.*
import doobie.*
import doobie.implicits.*
import doobie.postgres.implicits.*
import zio.*
import java.time.LocalDateTime
import java.util.UUID

trait InvoiceRepository:
  def saveInvoice(invoice: Invoice): Task[Unit]
  def findById(id: UUID): Task[Option[Invoice]]
  def findByCompanyId(companyId: String, pagination: PaginationParams): Task[PaginatedInvoices]
  def findByDateRange(fromDate: LocalDateTime, toDate: LocalDateTime, pagination: PaginationParams): Task[PaginatedInvoices]
  def updatePdfUrl(id: UUID, pdfUrl: String): Task[Unit]
  def updateStatus(id: UUID, status: InvoiceStatus): Task[Unit]

object InvoiceRepository:
  def saveInvoice(invoice: Invoice): ZIO[InvoiceRepository, Throwable, Unit] =
    ZIO.serviceWithZIO[InvoiceRepository](_.saveInvoice(invoice))
    
  def findById(id: UUID): ZIO[InvoiceRepository, Throwable, Option[Invoice]] =
    ZIO.serviceWithZIO[InvoiceRepository](_.findById(id))
    
  def findByCompanyId(companyId: String, pagination: PaginationParams): ZIO[InvoiceRepository, Throwable, PaginatedInvoices] =
    ZIO.serviceWithZIO[InvoiceRepository](_.findByCompanyId(companyId, pagination))
    
  def findByDateRange(fromDate: LocalDateTime, toDate: LocalDateTime, pagination: PaginationParams): ZIO[InvoiceRepository, Throwable, PaginatedInvoices] =
    ZIO.serviceWithZIO[InvoiceRepository](_.findByDateRange(fromDate, toDate, pagination))
    
  def updatePdfUrl(id: UUID, pdfUrl: String): ZIO[InvoiceRepository, Throwable, Unit] =
    ZIO.serviceWithZIO[InvoiceRepository](_.updatePdfUrl(id, pdfUrl))
    
  def updateStatus(id: UUID, status: InvoiceStatus): ZIO[InvoiceRepository, Throwable, Unit] =
    ZIO.serviceWithZIO[InvoiceRepository](_.updateStatus(id, status))

class DoobieInvoiceRepository(xa: Transactor[Task]) extends InvoiceRepository:
  import DoobieInvoiceRepository.*

  def saveInvoice(invoice: Invoice): Task[Unit] =
    insertInvoice(invoice).run.transact(xa).unit

  def findById(id: UUID): Task[Option[Invoice]] =
    selectById(id).option.transact(xa)

  def findByCompanyId(companyId: String, pagination: PaginationParams): Task[PaginatedInvoices] =
    for
      invoices <- selectByCompanyId(companyId, pagination).stream.transact(xa).compile.toList
      totalCount <- countByCompanyId(companyId).unique.transact(xa)
    yield PaginatedInvoices(
      invoices = invoices,
      totalCount = totalCount,
      page = pagination.page,
      pageSize = pagination.pageSize,
      totalPages = (totalCount + pagination.pageSize - 1) / pagination.pageSize
    )

  def findByDateRange(fromDate: LocalDateTime, toDate: LocalDateTime, pagination: PaginationParams): Task[PaginatedInvoices] =
    for
      invoices <- selectByDateRange(fromDate, toDate, pagination).stream.transact(xa).compile.toList
      totalCount <- countByDateRange(fromDate, toDate).unique.transact(xa)
    yield PaginatedInvoices(
      invoices = invoices,
      totalCount = totalCount,
      page = pagination.page,
      pageSize = pagination.pageSize,
      totalPages = (totalCount + pagination.pageSize - 1) / pagination.pageSize
    )

  def updatePdfUrl(id: UUID, pdfUrl: String): Task[Unit] =
    updatePdfUrlQuery(id, pdfUrl).run.transact(xa).unit

  def updateStatus(id: UUID, status: InvoiceStatus): Task[Unit] =
    updateStatusQuery(id, status).run.transact(xa).unit

object DoobieInvoiceRepository:
  import Meta.*

  // Meta instances for custom types
  given Meta[UUID] = Meta[String].imap(UUID.fromString)(_.toString)
  given Meta[InvoiceType] = Meta[String].imap(InvoiceType.valueOf)(_.toString)
  given Meta[InvoiceStatus] = Meta[String].imap(InvoiceStatus.valueOf)(_.toString)
  given Meta[Address] = Meta[String].imap(Address.fromJson)(_.toJson)
  given Meta[List[InvoiceItem]] = Meta[String].imap(InvoiceItem.fromJsonList)(_.toJsonList)
  given Meta[Map[String, String]] = Meta[String].imap(Map.fromJson)(_.toJson)

  def insertInvoice(invoice: Invoice): Update0 =
    sql"""
      INSERT INTO invoices (
        id, event_id, company_id, customer_id, customer_name, customer_email,
        customer_address, invoice_type, items, total_amount, currency,
        issued_at, due_date, status, pdf_url, metadata, created_at, updated_at
      ) VALUES (
        ${invoice.id}, ${invoice.eventId}, ${invoice.companyId}, ${invoice.customerId},
        ${invoice.customerName}, ${invoice.customerEmail}, ${invoice.customerAddress},
        ${invoice.invoiceType}, ${invoice.items}, ${invoice.totalAmount}, ${invoice.currency},
        ${invoice.issuedAt}, ${invoice.dueDate}, ${invoice.status}, ${invoice.pdfUrl},
        ${invoice.metadata}, ${invoice.createdAt}, ${invoice.updatedAt}
      )
    """.update

  def selectById(id: UUID): Query0[Invoice] =
    sql"SELECT * FROM invoices WHERE id = $id".query[Invoice]

  def selectByCompanyId(companyId: String, pagination: PaginationParams): Query0[Invoice] =
    sql"""
      SELECT * FROM invoices 
      WHERE company_id = $companyId 
      ORDER BY created_at DESC 
      LIMIT ${pagination.pageSize} OFFSET ${(pagination.page - 1) * pagination.pageSize}
    """.query[Invoice]

  def countByCompanyId(companyId: String): Query0[Long] =
    sql"SELECT COUNT(*) FROM invoices WHERE company_id = $companyId".query[Long]

  def selectByDateRange(fromDate: LocalDateTime, toDate: LocalDateTime, pagination: PaginationParams): Query0[Invoice] =
    sql"""
      SELECT * FROM invoices 
      WHERE issued_at BETWEEN $fromDate AND $toDate
      ORDER BY created_at DESC 
      LIMIT ${pagination.pageSize} OFFSET ${(pagination.page - 1) * pagination.pageSize}
    """.query[Invoice]

  def countByDateRange(fromDate: LocalDateTime, toDate: LocalDateTime): Query0[Long] =
    sql"SELECT COUNT(*) FROM invoices WHERE issued_at BETWEEN $fromDate AND $toDate".query[Long]

  def updatePdfUrlQuery(id: UUID, pdfUrl: String): Update0 =
    sql"UPDATE invoices SET pdf_url = $pdfUrl, updated_at = ${LocalDateTime.now} WHERE id = $id".update

  def updateStatusQuery(id: UUID, status: InvoiceStatus): Update0 =
    sql"UPDATE invoices SET status = $status, updated_at = ${LocalDateTime.now} WHERE id = $id".update

// Extension methods for JSON serialization (simplified)
extension (address: Address)
  def toJson: String = s"""{"street":"${address.street}","city":"${address.city}","state":"${address.state}","zipCode":"${address.zipCode}","country":"${address.country}"}"""

extension (items: List[InvoiceItem])
  def toJsonList: String = items.map(item => s"""{"description":"${item.description}","quantity":${item.quantity},"unitPrice":${item.unitPrice},"totalPrice":${item.totalPrice}}""").mkString("[", ",", "]")

extension (metadata: Map[String, String])
  def toJson: String = metadata.map { case (k, v) => s""""$k":"$v"""" }.mkString("{", ",", "}")

object Address:
  def fromJson(json: String): Address = Address("", "", "", "", "") // Simplified

object InvoiceItem:
  def fromJsonList(json: String): List[InvoiceItem] = List.empty // Simplified

object Map:
  def fromJson(json: String): Map[String, String] = Map.empty // Simplified 