package org.kafkainaction.chapter1

import org.apache.kafka.clients.consumer.{ConsumerRecords, KafkaConsumer}
import org.apache.kafka.clients.producer.{KafkaProducer, Producer, ProducerRecord}
import org.slf4j.{Logger, LoggerFactory}

import java.time.Duration
import java.util
import java.util.{List, Properties}
import scala.jdk.CollectionConverters.*
import scala.util.Using

object Consumer:
  private val logger = LoggerFactory.getLogger(Consumer.getClass.getCanonicalName)

  private var keepConsuming: Boolean = true

  private val consumerProperties =
    val properties = new Properties
    properties.put("bootstrap.servers", "localhost:9092,localhost:9093,localhost:9094")
    properties.put("group.id", "kinaction_helloconsumer")
    properties.put("enable.auto.commit", "true")
    properties.put("auto.commit.interval.ms", "1000")
    properties.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer")
    properties.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer")
    properties

  def consume: Unit =
    Using(new KafkaConsumer[String, String](consumerProperties)) { consumer =>
      consumer.subscribe(util.List.of("kinaction_helloworld")) //<2>

      while (keepConsuming)
        val records: ConsumerRecords[String, String] = consumer.poll(Duration.ofMillis(250)) //<3>
        records.forEach(record =>
          logger.info("kinaction_info offset = {}, kinaction_value = {}", record.offset, record.value)
        )
    }

  def shutdown: Unit =
    keepConsuming = false

@main def consumerMain: Unit =
  Consumer.consume
  scala.sys.addShutdownHook(Consumer.shutdown)
