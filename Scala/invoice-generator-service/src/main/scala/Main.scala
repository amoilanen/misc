import api.*
import config.*
import db.*
import repository.*
import service.*
import zio.*
import zio.http.*
import zio.logging.*
import zio.logging.slf4j.Slf4jLogger

object Main extends ZIOAppDefault:
  
  def run: ZIO[Any, Throwable, Unit] =
    val app = for
      _ <- ZIO.logInfo("Starting Invoice Generator Service")
      
      // Load configuration
      config <- ZIO.config(AppConfig.load)
      
      // Run database migrations
      _ <- DatabaseLayer.migrate
      
      // Start HTTP server
      server <- startHttpServer(config.server)
      
      // Start Kafka consumer
      consumer <- startKafkaConsumer(config.kafka)
      
      _ <- ZIO.logInfo("Invoice Generator Service started successfully")
      
      // Keep the application running
      _ <- server.merge(consumer)
    yield ()
    
    app.provide(
      // Configuration layer
      ZLayer(AppConfig.load),
      
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
      },
      
      // Logging layer
      Slf4jLogger.make((context, message) => message)
    )

  private def startHttpServer(config: ServerConfig): ZIO[Any, Throwable, Unit] =
    for
      api <- ZIO.service[InvoiceApi]
      routes <- InvoiceApi.routes
      server = Server.serve(routes)
      _ <- ZIO.logInfo(s"Starting HTTP server on ${config.host}:${config.port}")
      _ <- server.provide(Server.defaultWithPort(config.port))
    yield ()

  private def startKafkaConsumer(config: KafkaConfig): ZIO[Any, Throwable, Unit] =
    for
      consumer <- ZIO.service[InvoiceEventConsumer]
      _ <- ZIO.logInfo(s"Starting Kafka consumer for topic: ${config.topic}")
      _ <- InvoiceEventConsumer.startConsuming
    yield ()
