import api.*
import config.*
import db.*
import repository.*
import service.*
import zio.*
import zio.http.*
import zio.logging.*
import zio.logging.backend.SLF4J

object Main extends ZIOAppDefault:
  
  def run: ZIO[Any, Throwable, Unit] =
    val app = for
      _ <- ZIO.logInfo("Starting Invoice Generator Service")
      
      // Load configuration
      config <- ZIO.config(AppConfig.load)
      
      // Run database migrations
      _ <- DatabaseLayer.migrate
      
      _ <- ZIO.logInfo("Invoice Generator Service started successfully")
      
      // Start both HTTP server and Kafka consumer concurrently
      _ <- startHttpServer(config.server) <&> startKafkaConsumer(config.kafka)
    yield ()

    val logger = Runtime.removeDefaultLoggers >>> SLF4J.slf4j
    app.provide(
      // Configuration layer
      logger,
      ZLayer.fromZIO(ZIO.config(AppConfig.load)),
      
      // Database layer
      ZLayer {
        for
          config <- ZIO.service[AppConfig]
          dbLayer = DatabaseLayerImpl(config.database)
        yield dbLayer
      },
      
      // Repository layer
      ZLayer {
        for
          dbLayer <- ZIO.service[DatabaseLayer]
          transactor <- DatabaseLayer.transactor
          repo = DoobieInvoiceRepository(transactor)
        yield repo
      },
      
      // Service layers
      ZLayer {
        for
          config <- ZIO.service[AppConfig]
          storageService = GcpStorageService(config.gcp)
        yield storageService
      },
      
      ZLayer.succeed(ITextPdfGenerator()),
      
      ZLayer {
        for
          config <- ZIO.service[AppConfig]
          repo <- ZIO.service[InvoiceRepository]
          pdfGen <- ZIO.service[PdfGenerator]
          storage <- ZIO.service[StorageService]
          consumer = KafkaInvoiceEventConsumer(config.kafka, repo, pdfGen, storage)
        yield consumer
      },
      
      // API layer
      ZLayer {
        for
          repo <- ZIO.service[InvoiceRepository]
          api = InvoiceApiImpl(repo)
        yield api
      }
    )

  private def startHttpServer(config: ServerConfig): ZIO[InvoiceApi, Throwable, Unit] =
    for
      api <- ZIO.service[InvoiceApi]
      routes <- InvoiceApi.routes
      server = Server.serve(routes)
      _ <- ZIO.logInfo(s"Starting HTTP server on ${config.host}:${config.port}")
      _ <- server.provide(Server.defaultWithPort(config.port))
    yield ()

  private def startKafkaConsumer(config: KafkaConfig): ZIO[InvoiceEventConsumer, Throwable, Unit] =
    for
      consumer <- ZIO.service[InvoiceEventConsumer]
      _ <- ZIO.logInfo(s"Starting Kafka consumer for topic: ${config.topic}")
      _ <- InvoiceEventConsumer.startConsuming
    yield ()
