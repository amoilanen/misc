package io.github.antivanov.zio.demo.microservice.services

import io.github.antivanov.zio.demo.microservice.booking.BookingEvent
import zio.{Has, Task, ULayer, ZIO, ZLayer}

object Events {

  type Events = Has[Events.Service]

  trait Service {
    def publish(events: List[BookingEvent]): Task[Unit]
  }

  val live: ULayer[Events] = ZLayer.succeed(new Service {
    override def publish(events: List[BookingEvent]): Task[Unit] =
      ZIO.succeed({
        println(s"published events $events")
        ()
      })
  })

  def publish(events: List[BookingEvent]): ZIO[Events, Throwable, Unit] =
    ZIO.accessZIO(_.get.publish(events: List[BookingEvent]))
}
