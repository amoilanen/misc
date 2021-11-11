package io.github.antivanov.zio.demo.microservice.booking

import java.time.OffsetDateTime

case class Booking(id: Int, forUserId: UserId, hotelId: HotelId, price: BigDecimal, checkin: OffsetDateTime, checkout: OffsetDateTime)
