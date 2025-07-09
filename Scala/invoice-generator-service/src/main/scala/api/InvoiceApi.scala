package api

import domain.*
import repository.*
import sttp.tapir.*
import sttp.tapir.generic.auto.*
import sttp.tapir.json.circe.*
import sttp.tapir.server.ziohttp.*
import sttp.tapir.swagger.bundle.SwaggerInterpreter
import zio.*
import zio.http.*
import io.circe.{JsonCodec, DeriveJsonCodec}
import java.time.LocalDateTime

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
  
  private val swaggerEndpoints = SwaggerInterpreter()
    .fromEndpoints[Task](
      List(getInvoiceEndpoint, listInvoicesByCompanyEndpoint, listInvoicesByDateRangeEndpoint, healthEndpoint),
      "Invoice Generator Service API",
      "1.0.0"
    )
  
  private val getInvoiceServerEndpoint = getInvoiceEndpoint.serverLogic: id =>
    InvoiceRepository.findById(id)
      .map(_.toRight(ApiError.NotFound(s"Invoice with id $id not found")))
      .catchAll(error => ZIO.succeed(Left(ApiError.InternalServerError(error.getMessage))))
  
  private val listInvoicesByCompanyServerEndpoint = listInvoicesByCompanyEndpoint.serverLogic: 
    case (companyId, page, pageSize) =>
      val pagination = PaginationParams(page.getOrElse(1), pageSize.getOrElse(20))
      InvoiceRepository.findByCompanyId(companyId, pagination)
        .map(Right(_))
        .catchAll(error => ZIO.succeed(Left(ApiError.InternalServerError(error.getMessage))))
  
  private val listInvoicesByDateRangeServerEndpoint = listInvoicesByDateRangeEndpoint.serverLogic:
    case (fromDate, toDate, page, pageSize) =>
      val pagination = PaginationParams(page.getOrElse(1), pageSize.getOrElse(20))
      InvoiceRepository.findByDateRange(fromDate, toDate, pagination)
        .map(Right(_))
        .catchAll(error => ZIO.succeed(Left(ApiError.InternalServerError(error.getMessage))))
  
  private val healthServerEndpoint = healthEndpoint.serverLogic: _ =>
    ZIO.succeed(Right(HealthStatus("UP", "Invoice Generator Service is running")))
  
  private val swaggerServerEndpoints = swaggerEndpoints.map(_.serverLogic[Task](_ => ZIO.unit))
  
  def routes: HttpApp[Any] =
    ZioHttpInterpreter()
      .toHttp(
        List(
          getInvoiceServerEndpoint,
          listInvoicesByCompanyServerEndpoint,
          listInvoicesByDateRangeServerEndpoint,
          healthServerEndpoint
        ) ++ swaggerServerEndpoints
      )

case class ApiError(message: String, code: String)

object ApiError:
  def NotFound(message: String): ApiError = ApiError(message, "NOT_FOUND")
  def InternalServerError(message: String): ApiError = ApiError(message, "INTERNAL_SERVER_ERROR")
  def BadRequest(message: String): ApiError = ApiError(message, "BAD_REQUEST")

case class HealthStatus(status: String, message: String)

// JSON codecs for API responses
given JsonCodec[ApiError] = DeriveJsonCodec.gen[ApiError]
given JsonCodec[HealthStatus] = DeriveJsonCodec.gen[HealthStatus]
given JsonCodec[Invoice] = DeriveJsonCodec.gen[Invoice]
given JsonCodec[PaginatedInvoices] = DeriveJsonCodec.gen[PaginatedInvoices]
given JsonCodec[InvoiceStatus] = DeriveJsonCodec.gen[InvoiceStatus]
given JsonCodec[InvoiceType] = DeriveJsonCodec.gen[InvoiceType]
given JsonCodec[Address] = DeriveJsonCodec.gen[Address]
given JsonCodec[InvoiceItem] = DeriveJsonCodec.gen[InvoiceItem]
given JsonCodec[PaginationParams] = DeriveJsonCodec.gen[PaginationParams]
given JsonCodec[InvoiceId] = DeriveJsonCodec.gen[InvoiceId]
given JsonCodec[EventId] = DeriveJsonCodec.gen[EventId] 