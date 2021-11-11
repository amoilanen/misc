package io.github.antivanov.zio.demo.microservice.services

import io.github.antivanov.zio.demo.microservice.booking.{HotelId, UserId}
import zio.{Has, Task, ULayer, ZIO, ZLayer}

object PaymentServiceClient {

  type PaymentServiceClient = Has[PaymentServiceClient.Service]

  trait Service {
    def pay(amount: BigDecimal, userId: UserId, hotelId: HotelId): Task[Unit]
  }

  val live: ULayer[PaymentServiceClient] = ZLayer.succeed(new Service {
    def pay(amount: BigDecimal, userId: UserId, hotelId: HotelId): Task[Unit] =
      ZIO.succeed({
        println(s"performed payment of $amount from user $userId to hotel $hotelId")
        ()
      })
  })

  def pay(amount: BigDecimal, userId: UserId, hotelId: HotelId): ZIO[PaymentServiceClient, Throwable, Unit] =
    ZIO.accessZIO(_.get.pay(amount, userId, hotelId))
}
