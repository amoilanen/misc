val scala3Version = "3.1.3"

lazy val root = project
  .in(file("."))
  .settings(
    name := "kafka-in-action-source-code-ported",
    version := "0.1.0-SNAPSHOT",

    scalaVersion := scala3Version,

    libraryDependencies += "org.scalameta" %% "munit" % "0.7.29" % Test
  )
libraryDependencies += "org.apache.kafka" % "kafka-clients" % "3.2.1"

libraryDependencies += "ch.qos.logback" % "logback-classic" % "1.2.10"