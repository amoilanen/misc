package repository

import domain.*
import doobie.*
import doobie.implicits.*
import doobie.postgres.implicits.*
import zio.*
import zio.interop.catz.*
import zio.json.*
import java.time.LocalDateTime

trait InvoiceRepository:
  def saveInvoice(invoice: Invoice): Task[Unit]
  def findById(id: InvoiceId): Task[Option[Invoice]]
  def findByCompanyId(companyId: String, pagination: PaginationParams): Task[PaginatedInvoices]
  def findByDateRange(fromDate: LocalDateTime, toDate: LocalDateTime, pagination: PaginationParams): Task[PaginatedInvoices]
  def updatePdfUrl(id: InvoiceId, pdfUrl: String): Task[Unit]
  def updateStatus(id: InvoiceId, status: InvoiceStatus): Task[Unit]

object InvoiceRepository:
  def saveInvoice(invoice: Invoice): ZIO[InvoiceRepository, Throwable, Unit] =
    ZIO.serviceWithZIO[InvoiceRepository](_.saveInvoice(invoice))

  def findById(id: InvoiceId): ZIO[InvoiceRepository, Throwable, Option[Invoice]] =
    ZIO.serviceWithZIO[InvoiceRepository](_.findById(id))

  def findByCompanyId(companyId: String, pagination: PaginationParams): ZIO[InvoiceRepository, Throwable, PaginatedInvoices] =
    ZIO.serviceWithZIO[InvoiceRepository](_.findByCompanyId(companyId, pagination))

  def findByDateRange(fromDate: LocalDateTime, toDate: LocalDateTime, pagination: PaginationParams): ZIO[InvoiceRepository, Throwable, PaginatedInvoices] =
    ZIO.serviceWithZIO[InvoiceRepository](_.findByDateRange(fromDate, toDate, pagination))

  def updatePdfUrl(id: InvoiceId, pdfUrl: String): ZIO[InvoiceRepository, Throwable, Unit] =
    ZIO.serviceWithZIO[InvoiceRepository](_.updatePdfUrl(id, pdfUrl))

  def updateStatus(id: InvoiceId, status: InvoiceStatus): ZIO[InvoiceRepository, Throwable, Unit] =
    ZIO.serviceWithZIO[InvoiceRepository](_.updateStatus(id, status))

class DoobieInvoiceRepository(xa: Transactor[Task]) extends InvoiceRepository:
  import DoobieInvoiceRepository.given

  def saveInvoice(invoice: Invoice): Task[Unit] =
    DoobieInvoiceRepository.insertInvoice(invoice).run.transact(xa).unit

  def findById(id: InvoiceId): Task[Option[Invoice]] =
    DoobieInvoiceRepository.selectById(id).option.transact(xa)

  def findByCompanyId(companyId: String, pagination: PaginationParams): Task[PaginatedInvoices] =
    for
      invoices <- DoobieInvoiceRepository.selectByCompanyId(companyId, pagination).stream.transact(xa).compile.toList
      totalCount <- DoobieInvoiceRepository.countByCompanyId(companyId).unique.transact(xa)
    yield PaginatedInvoices(
      invoices = invoices,
      totalCount = totalCount,
      page = pagination.page,
      pageSize = pagination.pageSize,
      totalPages = ((totalCount + pagination.pageSize - 1) / pagination.pageSize).toInt
    )

  def findByDateRange(fromDate: LocalDateTime, toDate: LocalDateTime, pagination: PaginationParams): Task[PaginatedInvoices] =
    for
      invoices <- DoobieInvoiceRepository.selectByDateRange(fromDate, toDate, pagination).stream.transact(xa).compile.toList
      totalCount <- DoobieInvoiceRepository.countByDateRange(fromDate, toDate).unique.transact(xa)
    yield PaginatedInvoices(
      invoices = invoices,
      totalCount = totalCount,
      page = pagination.page,
      pageSize = pagination.pageSize,
      totalPages = ((totalCount + pagination.pageSize - 1) / pagination.pageSize).toInt
    )

  def updatePdfUrl(id: InvoiceId, pdfUrl: String): Task[Unit] =
    DoobieInvoiceRepository.updatePdfUrlQuery(id, pdfUrl).run.transact(xa).unit

  def updateStatus(id: InvoiceId, status: InvoiceStatus): Task[Unit] =
    DoobieInvoiceRepository.updateStatusQuery(id, status).run.transact(xa).unit

object DoobieInvoiceRepository:

  // Meta instances for opaque types and enums
  given Meta[InvoiceId] = Meta[String].imap(InvoiceId.apply)(_.value)
  given Meta[EventId] = Meta[String].imap(EventId.apply)(_.value)
  given Meta[InvoiceType] = Meta[String].imap(InvoiceType.valueOf)(_.toString)
  given Meta[InvoiceStatus] = Meta[String].imap(InvoiceStatus.valueOf)(_.toString)

  // Meta instances for JSON-serialized types using ZIO JSON codecs
  given Meta[Address] = Meta[String].imap(json =>
    json.fromJson[Address].fold(
      error => throw new RuntimeException(s"Failed to decode Address from JSON: $error"),
      identity
    )
  )(addr => addr.toJson)

  given Meta[List[InvoiceItem]] = Meta[String].imap(json =>
    json.fromJson[List[InvoiceItem]].fold(
      error => throw new RuntimeException(s"Failed to decode List[InvoiceItem] from JSON: $error"),
      identity
    )
  )(items => items.toJson)

  given Meta[Map[String, String]] = Meta[String].imap(json =>
    json.fromJson[Map[String, String]].fold(
      error => throw new RuntimeException(s"Failed to decode Map[String, String] from JSON: $error"),
      identity
    )
  )(metadata => metadata.toJson)

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

  def selectById(id: InvoiceId): Query0[Invoice] =
    sql"SELECT id, event_id, company_id, customer_id, customer_name, customer_email, customer_address, invoice_type, items, total_amount, currency, issued_at, due_date, status, pdf_url, metadata, created_at, updated_at FROM invoices WHERE id = $id".query[Invoice]

  def selectByCompanyId(companyId: String, pagination: PaginationParams): Query0[Invoice] =
    sql"""
      SELECT id, event_id, company_id, customer_id, customer_name, customer_email, customer_address, invoice_type, items, total_amount, currency, issued_at, due_date, status, pdf_url, metadata, created_at, updated_at
      FROM invoices
      WHERE company_id = $companyId
      ORDER BY created_at DESC
      LIMIT ${pagination.pageSize} OFFSET ${(pagination.page - 1) * pagination.pageSize}
    """.query[Invoice]

  def countByCompanyId(companyId: String): Query0[Long] =
    sql"SELECT COUNT(*) FROM invoices WHERE company_id = $companyId".query[Long]

  def selectByDateRange(fromDate: LocalDateTime, toDate: LocalDateTime, pagination: PaginationParams): Query0[Invoice] =
    sql"""
      SELECT id, event_id, company_id, customer_id, customer_name, customer_email, customer_address, invoice_type, items, total_amount, currency, issued_at, due_date, status, pdf_url, metadata, created_at, updated_at
      FROM invoices
      WHERE issued_at BETWEEN $fromDate AND $toDate
      ORDER BY created_at DESC
      LIMIT ${pagination.pageSize} OFFSET ${(pagination.page - 1) * pagination.pageSize}
    """.query[Invoice]

  def countByDateRange(fromDate: LocalDateTime, toDate: LocalDateTime): Query0[Long] =
    sql"SELECT COUNT(*) FROM invoices WHERE issued_at BETWEEN $fromDate AND $toDate".query[Long]

  def updatePdfUrlQuery(id: InvoiceId, pdfUrl: String): Update0 =
    sql"UPDATE invoices SET pdf_url = $pdfUrl, updated_at = ${LocalDateTime.now} WHERE id = $id".update

  def updateStatusQuery(id: InvoiceId, status: InvoiceStatus): Update0 =
    sql"UPDATE invoices SET status = $status, updated_at = ${LocalDateTime.now} WHERE id = $id".update
