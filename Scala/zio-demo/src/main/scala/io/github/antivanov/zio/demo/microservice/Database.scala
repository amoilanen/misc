package io.github.antivanov.zio.demo.microservice

import scala.concurrent.{ExecutionContext, Future}

class Database(implicit ec: ExecutionContext) {

  def upsert[T](entity: T): Future[Unit] = Future {
    println(s"Inserted $entity")
  }
}
