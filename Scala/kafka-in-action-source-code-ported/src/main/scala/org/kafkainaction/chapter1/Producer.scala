package org.kafkainaction.chapter1

import org.apache.kafka.clients.producer.{KafkaProducer, Producer, ProducerRecord}

import java.util.Properties
import scala.util.Using

object Producer:

  private val producerProperties =
    val properties = new Properties
    properties.put("bootstrap.servers", "localhost:9092,localhost:9093,localhost:9094")
    properties.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer")
    properties.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer")
    properties

  def produce: Unit =
    Using(new KafkaProducer[String, String](producerProperties)) { producer =>
      val producerRecord = new ProducerRecord[String, String]("kinaction_helloworld", null, "hello world again!") //<5>
      producer.send(producerRecord)
    }

@main def producerMain: Unit =
  Producer.produce
