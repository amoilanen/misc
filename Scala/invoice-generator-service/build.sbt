val scala3Version = "3.7.1"
val zioVersion = "2.1.3"
val zioHttpVersion = "3.0.0-RC5"
val tapirVersion = "1.10.0"
val doobieVersion = "1.0.0-RC5"
val flywayVersion = "10.8.1"
val testcontainersVersion = "0.43.0"
val zioTestVersion = "2.1.3"

// Assembly plugin for creating fat JAR
assembly / assemblyMergeStrategy := {
  case PathList("META-INF", xs @ _*) => MergeStrategy.discard
  case x => MergeStrategy.first
}

lazy val root = project
  .in(file("."))
  .settings(
    name := "invoice-generator-service",
    version := "0.1.0-SNAPSHOT",
    scalaVersion := scala3Version,

    libraryDependencies ++= Seq(
      // ZIO
      "dev.zio" %% "zio" % zioVersion,
      "dev.zio" %% "zio-streams" % zioVersion,
      "dev.zio" %% "zio-kafka" % "2.7.0",
      "dev.zio" %% "zio-logging" % "2.1.12",
      "dev.zio" %% "zio-logging-slf4j" % "2.5.0",
      "dev.zio" %% "zio-config" % "4.0.0",
      "dev.zio" %% "zio-config-magnolia" % "4.0.0",
      "dev.zio" %% "zio-config-typesafe" % "4.0.0",
      "dev.zio" %% "zio-interop-cats" % "23.1.0.5",
      
      // HTTP
      "dev.zio" %% "zio-http" % zioHttpVersion,
      "com.softwaremill.sttp.tapir" %% "tapir-zio-http-server" % tapirVersion,
      "com.softwaremill.sttp.tapir" %% "tapir-zio" % tapirVersion,
      "com.softwaremill.sttp.tapir" %% "tapir-json-zio" % tapirVersion,
      "com.softwaremill.sttp.tapir" %% "tapir-swagger-ui-bundle" % tapirVersion,
      
      // Database
      "org.tpolecat" %% "doobie-core" % doobieVersion,
      "org.tpolecat" %% "doobie-postgres" % doobieVersion,
      "org.tpolecat" %% "doobie-hikari" % doobieVersion,
      "org.flywaydb" % "flyway-core" % flywayVersion,
      
      // JSON
      "dev.zio" %% "zio-json" % "0.6.2",
      
      // PDF Generation
      "com.itextpdf" % "itext7-core" % "8.0.4",
      
      // GCP Storage
      "com.google.cloud" % "google-cloud-storage" % "2.38.0",
      
      // Logging
      "ch.qos.logback" % "logback-classic" % "1.5.3",
      
      // Testing
      "dev.zio" %% "zio-test" % zioTestVersion % Test,
      "dev.zio" %% "zio-test-sbt" % zioTestVersion % Test,
      "dev.zio" %% "zio-test-magnolia" % zioTestVersion % Test,
      "com.dimafeng" %% "testcontainers-scala-scalatest" % testcontainersVersion % Test,
      "com.dimafeng" %% "testcontainers-scala-postgresql" % testcontainersVersion % Test,
      "com.dimafeng" %% "testcontainers-scala-kafka" % testcontainersVersion % Test,
      "org.scalameta" %% "munit" % "1.0.0" % Test
    ),

    testFrameworks += new TestFramework("zio.test.sbt.ZTestFramework"),
    
    // Assembly settings
    assembly / mainClass := Some("Main"),
    assembly / assemblyJarName := s"${name.value}-assembly-${version.value}.jar"
)

// Force stable zio-schema versions to avoid SNAPSHOT dependency issues
dependencyOverrides ++= Seq(
  "dev.zio" %% "zio-schema" % "0.4.17",
  "dev.zio" %% "zio-schema-json" % "0.4.17",
  "dev.zio" %% "zio-schema-protobuf" % "0.4.17"
)
