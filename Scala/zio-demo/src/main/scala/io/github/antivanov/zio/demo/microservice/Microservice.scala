package io.github.antivanov.zio.demo.microservice

import io.github.antivanov.zio.demo.microservice.booking.{Booking, BookingEvent, HotelId, UserId}
import io.github.antivanov.zio.demo.microservice.services.BookingDao.BookingDao
import io.github.antivanov.zio.demo.microservice.services.Events.Events
import io.github.antivanov.zio.demo.microservice.services.PaymentServiceClient.PaymentServiceClient
import services.{BookingDao, Events, PaymentServiceClient}
import zio.{Runtime, TaskLayer, ULayer, ZEnv, ZLayer}

import java.time.OffsetDateTime
import scala.concurrent.ExecutionContext.Implicits.global

object Microservice extends App {
  val runtime: Runtime[ZEnv] = zio.Runtime.default

  val userId = UserId(1)
  val hotelId = HotelId(2)
  val booking = Booking(1, userId, hotelId, BigDecimal(60.0), OffsetDateTime.parse("2007-12-03T10:15:30+01:00"), OffsetDateTime.parse("2007-12-05T10:15:30+01:00"))

  val app = for {
    _ <- BookingDao.upsert(booking)
    _ <- PaymentServiceClient.pay(booking.price, userId, booking.hotelId)
    bookingEvent = BookingEvent(booking)
    _ <- Events.publish(List(bookingEvent))
  } yield ()

  val daoLayer: ULayer[BookingDao] = ZLayer.succeed(new Database()) >>> BookingDao.live
  val appLayer: TaskLayer[BookingDao with Events with PaymentServiceClient] = daoLayer ++ Events.live ++ PaymentServiceClient.live

  val result = runtime.unsafeRun(app.provideLayer(appLayer))
  println(result)
}