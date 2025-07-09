package db

import config.DatabaseConfig
import doobie.*
import doobie.hikari.*
import doobie.util.transactor.Transactor
import org.flywaydb.core.Flyway
import zio.*
import zio.interop.catz.*

trait DatabaseLayer:
  def transactor: Transactor[Task]
  def migrate: Task[Unit]

object DatabaseLayer:
  def transactor: ZIO[DatabaseLayer, Nothing, Transactor[Task]] =
    ZIO.serviceWith[DatabaseLayer](_.transactor)
  
  def migrate: ZIO[DatabaseLayer, Throwable, Unit] =
    ZIO.serviceWithZIO[DatabaseLayer](_.migrate)

class DatabaseLayerImpl(config: DatabaseConfig) extends DatabaseLayer:
  
  private val hikariConfig = HikariConfig()
  hikariConfig.setJdbcUrl(config.url)
  hikariConfig.setUsername(config.username)
  hikariConfig.setPassword(config.password)
  hikariConfig.setDriverClassName(config.driver)
  hikariConfig.setMaximumPoolSize(config.maxConnections)
  hikariConfig.setMinimumIdle(2)
  hikariConfig.setConnectionTimeout(30000)
  hikariConfig.setIdleTimeout(600000)
  hikariConfig.setMaxLifetime(1800000)
  
  private val hikariDataSource = HikariDataSource(hikariConfig)
  
  val transactor: Transactor[Task] = HikariTransactor[Task](
    hikariDataSource,
    ExecutionContexts.synchronous
  )
  
  def migrate: Task[Unit] =
    ZIO.attempt:
      val flyway = Flyway.configure()
        .dataSource(hikariDataSource)
        .locations("classpath:db/migration")
        .load()
      flyway.migrate() 