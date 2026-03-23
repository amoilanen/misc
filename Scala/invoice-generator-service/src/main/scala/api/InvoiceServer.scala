package api

import domain.*
import service.{InvoiceService, StorageService}
import sttp.tapir.server.ziohttp.*
import sttp.tapir.swagger.bundle.SwaggerInterpreter
import sttp.tapir.ztapir.*
import zio.*
import zio.http.*

trait InvoiceServer:
  def routes: HttpApp[Any]

object InvoiceServer:
  def routes: ZIO[InvoiceServer, Nothing, HttpApp[Any]] =
    ZIO.serviceWith[InvoiceServer](_.routes)

class InvoiceServerLive(
  invoiceService: InvoiceService,
  storageService: StorageService
) extends InvoiceServer:

  private val getInvoiceServerEndpoint =
    InvoiceEndpoints.getInvoice.zServerLogic[Any] { id =>
      invoiceService.findById(id)
        .map(_.toRight(ApiError.NotFound(s"Invoice with id ${id.value} not found")))
        .catchAll(error => ZIO.succeed(Left(ApiError.InternalServerError(error.getMessage))))
        .absolve
    }

  private val listByCompanyServerEndpoint =
    InvoiceEndpoints.listByCompany.zServerLogic[Any] { case (companyId, page, pageSize) =>
      val pagination = PaginationParams(page.getOrElse(1), pageSize.getOrElse(20))
      invoiceService.findByCompanyId(companyId, pagination)
        .mapBoth(
          error => ApiError.InternalServerError(error.getMessage),
          identity
        )
    }

  private val listByDateRangeServerEndpoint =
    InvoiceEndpoints.listByDateRange.zServerLogic[Any] { case (fromDate, toDate, page, pageSize) =>
      val pagination = PaginationParams(page.getOrElse(1), pageSize.getOrElse(20))
      invoiceService.findByDateRange(fromDate, toDate, pagination)
        .mapBoth(
          error => ApiError.InternalServerError(error.getMessage),
          identity
        )
    }

  private val getInvoicePdfServerEndpoint =
    InvoiceEndpoints.getInvoicePdf.zServerLogic[Any] { id =>
      invoiceService.findById(id)
        .mapError(error => ApiError.InternalServerError(error.getMessage))
        .flatMap {
          case None =>
            ZIO.fail(ApiError.NotFound(s"Invoice with id ${id.value} not found"))
          case Some(invoice) =>
            invoice.pdfUrl match
              case None =>
                ZIO.fail(ApiError.NotFound(s"Invoice ${id.value} does not have a PDF"))
              case Some(pdfUrl) =>
                storageService.downloadPdf(pdfUrl)
                  .mapBoth(
                    error => ApiError.InternalServerError(error.getMessage),
                    bytes => (bytes, s"attachment; filename=\"invoice-${id.value}.pdf\"")
                  )
        }
    }

  private val healthServerEndpoint =
    InvoiceEndpoints.health.zServerLogic[Any] { _ =>
      ZIO.succeed(HealthStatus("UP", "Invoice Generator Service is running"))
    }

  def routes: HttpApp[Any] =
    val serverEndpoints = List(
      getInvoiceServerEndpoint,
      listByCompanyServerEndpoint,
      listByDateRangeServerEndpoint,
      getInvoicePdfServerEndpoint,
      healthServerEndpoint
    )
    val swaggerEndpoints = SwaggerInterpreter()
      .fromServerEndpoints[Task](serverEndpoints, "Invoice Generator Service API", "1.0.0")
    ZioHttpInterpreter().toHttp(serverEndpoints ++ swaggerEndpoints)

object InvoiceServerLive:
  val layer: ZLayer[InvoiceService & StorageService, Nothing, InvoiceServer] =
    ZLayer:
      for
        invoiceService <- ZIO.service[InvoiceService]
        storageService <- ZIO.service[StorageService]
      yield InvoiceServerLive(invoiceService, storageService)
