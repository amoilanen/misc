package api

import domain.*
import repository.*
import sttp.tapir.{Codec, CodecFormat, Schema}
import sttp.tapir.generic.auto.*
import sttp.tapir.json.zio.*
import sttp.tapir.server.ServerEndpoint
import sttp.tapir.ztapir.*
import sttp.tapir.server.ziohttp.*
import sttp.tapir.swagger.bundle.SwaggerInterpreter
import zio.*
import zio.http.*
import zio.json.*
import sttp.tapir.server.ziohttp.ZioHttpInterpreter
import sttp.tapir.ztapir.*
import zio.RIO

import java.time.LocalDateTime

given Codec[String, InvoiceId, CodecFormat.TextPlain] = Codec.string.map(InvoiceId.apply)(_.toString)
given Schema[InvoiceId] = Schema.string[InvoiceId]
given Schema[EventId] = Schema.string[EventId]

trait InvoiceApi:
  def routes: HttpApp[Any]

object InvoiceApi:
  def routes: ZIO[InvoiceApi, Nothing, HttpApp[Any]] =
    ZIO.serviceWith[InvoiceApi](_.routes)

class InvoiceApiImpl(invoiceRepository: InvoiceRepository) extends InvoiceApi:
  
  private val baseEndpoint = sttp.tapir.endpoint.in("api" / "v1" / "invoices")
  
  private val getInvoiceEndpoint = baseEndpoint
    .get
    .in(path[InvoiceId]("id"))
    .out(jsonBody[Invoice])
    .errorOut(jsonBody[ApiError])
    .description("Get invoice by ID")
    .tag("Invoices")
  
  private val listInvoicesByCompanyEndpoint = baseEndpoint
    .get
    .in("company" / path[String]("companyId"))
    .in(query[Option[Int]]("page").default(Some(1)))
    .in(query[Option[Int]]("pageSize").default(Some(20)))
    .out(jsonBody[PaginatedInvoices])
    .errorOut(jsonBody[ApiError])
    .description("List invoices by company ID with pagination")
    .tag("Invoices")
  
  private val listInvoicesByDateRangeEndpoint = baseEndpoint
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
  
  private val healthEndpoint = sttp.tapir.endpoint
    .get
    .in("api" / "v1" / "health")
    .out(jsonBody[HealthStatus])
    .description("Health check endpoint")
    .tag("Health")
  
  private def getInvoiceServerEndpoint(repo: InvoiceRepository) = getInvoiceEndpoint.zServerLogic[Any] { id =>
    repo.findById(id)
      .map(_.toRight(ApiError.NotFound(s"Invoice with id $id not found")))
      .catchAll(error => ZIO.succeed(Left(ApiError.InternalServerError(error.getMessage)))).absolve
  }
  
  private def listInvoicesByCompanyServerEndpoint(repo: InvoiceRepository) = listInvoicesByCompanyEndpoint.zServerLogic[Any] {
    case (companyId, page, pageSize) =>
      val pagination = PaginationParams(page.getOrElse(1), pageSize.getOrElse(20))
      repo.findByCompanyId(companyId, pagination)
        .map(Right(_))
        .catchAll(error => ZIO.succeed(Left(ApiError.InternalServerError(error.getMessage)))).absolve
  }
  
  private def listInvoicesByDateRangeServerEndpoint(repo: InvoiceRepository) = listInvoicesByDateRangeEndpoint.zServerLogic[Any] {
    case (fromDate, toDate, page, pageSize) =>
      val pagination = PaginationParams(page.getOrElse(1), pageSize.getOrElse(20))
      repo.findByDateRange(fromDate, toDate, pagination)
        .map(Right(_))
        .catchAll(error => ZIO.succeed(Left(ApiError.InternalServerError(error.getMessage)))).absolve
  }
  
  private val healthServerEndpoint = healthEndpoint.zServerLogic[Any](_ =>
    ZIO.succeed(Right(HealthStatus("UP", "Invoice Generator Service is running"))).absolve
  )

  def routes: HttpApp[Any] = {
    val endpoints = List(
      getInvoiceServerEndpoint(invoiceRepository),
      listInvoicesByCompanyServerEndpoint(invoiceRepository),
      listInvoicesByDateRangeServerEndpoint(invoiceRepository),
      healthServerEndpoint
    )
    val swaggerEndpoints = SwaggerInterpreter()
      .fromServerEndpoints[Task](endpoints, "Invoice Generator Service API", "1.0.0")
    ZioHttpInterpreter().toHttp(endpoints ++ swaggerEndpoints)
  }

case class ApiError(message: String, code: String)
object ApiError:
  def NotFound(message: String): ApiError = ApiError(message, "NOT_FOUND")
  def InternalServerError(message: String): ApiError = ApiError(message, "INTERNAL_SERVER_ERROR")
  def BadRequest(message: String): ApiError = ApiError(message, "BAD_REQUEST")
  given JsonCodec[ApiError] = DeriveJsonCodec.gen[ApiError]

case class HealthStatus(status: String, message: String)
object HealthStatus:
  given JsonCodec[HealthStatus] = DeriveJsonCodec.gen[HealthStatus]