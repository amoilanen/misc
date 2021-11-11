package io.github.antivanov.zio.demo.microservice.booking

import java.util.Currency

case class Payment(userId: UserId, paymentAmount: BigDecimal, paymentCurrency: Currency)
