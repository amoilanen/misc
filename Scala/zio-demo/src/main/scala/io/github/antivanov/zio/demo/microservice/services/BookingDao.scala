package io.github.antivanov.zio.demo.microservice.services

import io.github.antivanov.zio.demo.microservice.Database
import io.github.antivanov.zio.demo.microservice.booking.Booking
import zio.{Has, Task, URIO, URLayer, ZIO, ZLayer}

object BookingDao {

  type BookingDao = Has[BookingDao.Service]

  trait Service {
    def upsert(booking: Booking): Task[Unit]
  }

  val live: URLayer[Database, BookingDao] = ZIO.access[Database](db => new Service {
    override def upsert(booking: Booking): Task[Unit] =
      ZIO.attempt(db.upsert(booking))
  }).toLayer

  def upsert(booking: Booking): ZIO[BookingDao, Throwable, Unit] =
    ZIO.accessZIO(_.get.upsert(booking))
}
