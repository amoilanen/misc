package api

import domain.*
import sttp.model.{Header, MediaType}
import sttp.tapir.{Codec, CodecFormat, Schema}
import sttp.tapir.generic.auto.*
import sttp.tapir.json.zio.*
import sttp.tapir.ztapir.*
import zio.json.*
import java.time.LocalDateTime

case class ApiError(message: String, code: String)
object ApiError:
  def NotFound(message: String): ApiError = ApiError(message, "NOT_FOUND")
  def InternalServerError(message: String): ApiError = ApiError(message, "INTERNAL_SERVER_ERROR")
  def BadRequest(message: String): ApiError = ApiError(message, "BAD_REQUEST")
  given JsonCodec[ApiError] = DeriveJsonCodec.gen[ApiError]

case class HealthStatus(status: String, message: String)
object HealthStatus:
  given JsonCodec[HealthStatus] = DeriveJsonCodec.gen[HealthStatus]

object InvoiceEndpoints:

  // Tapir codecs and schemas for domain types
  given Codec[String, InvoiceId, CodecFormat.TextPlain] =
    Codec.string.map(InvoiceId.apply)(_.value)

  given Schema[InvoiceId] = Schema.string[InvoiceId]
  given Schema[EventId] = Schema.string[EventId]

  private val baseEndpoint = endpoint.in("api" / "v1" / "invoices")

  val getInvoice = baseEndpoint
    .get
    .in(path[InvoiceId]("id"))
    .out(jsonBody[Invoice])
    .errorOut(jsonBody[ApiError])
    .description("Get invoice by ID")
    .tag("Invoices")

  val listByCompany = baseEndpoint
    .get
    .in("company" / path[String]("companyId"))
    .in(query[Option[Int]]("page").default(Some(1)))
    .in(query[Option[Int]]("pageSize").default(Some(20)))
    .out(jsonBody[PaginatedInvoices])
    .errorOut(jsonBody[ApiError])
    .description("List invoices by company ID with pagination")
    .tag("Invoices")

  val listByDateRange = baseEndpoint
    .get
    .in("date-range")
    .in(query[LocalDateTime]("fromDate"))
    .in(query[LocalDateTime]("toDate"))
    .in(query[Option[Int]]("page").default(Some(1)))
    .in(query[Option[Int]]("pageSize").default(Some(20)))
    .out(jsonBody[PaginatedInvoices])
    .errorOut(jsonBody[ApiError])
    .description("List invoices by date range with pagination")
    .tag("Invoices")

  val getInvoicePdf = baseEndpoint
    .get
    .in(path[InvoiceId]("id") / "pdf")
    .out(rawBinaryBody(sttp.tapir.RawBodyType.ByteArrayBody))
    .out(header(Header.contentType(MediaType.ApplicationPdf)))
    .out(header[String]("Content-Disposition"))
    .errorOut(jsonBody[ApiError])
    .description("Download invoice PDF")
    .tag("Invoices")

  val health = endpoint
    .get
    .in("api" / "v1" / "health")
    .out(jsonBody[HealthStatus])
    .description("Health check endpoint")
    .tag("Health")

  val all = List(getInvoice, listByCompany, listByDateRange, getInvoicePdf, health)
