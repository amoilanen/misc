package config

import zio.Config
import zio.config.magnolia.*
import zio.config.typesafe.*

case class AppConfig(
  database: DatabaseConfig,
  kafka: KafkaConfig,
  gcp: GcpConfig,
  server: ServerConfig
)

case class DatabaseConfig(
  url: String,
  username: String,
  password: String,
  driver: String = "org.postgresql.Driver",
  maxConnections: Int = 10
)

case class KafkaConfig(
  bootstrapServers: String,
  topic: String,
  groupId: String,
  autoOffsetReset: String = "earliest"
)

case class GcpConfig(
  projectId: String,
  bucketName: String,
  credentialsPath: Option[String] = None
)

case class ServerConfig(
  host: String = "0.0.0.0",
  port: Int = 8080
)

object AppConfig:
  val live: Config[AppConfig] = deriveConfig[AppConfig].nested("app")
  
  def load: Config[AppConfig] = live 