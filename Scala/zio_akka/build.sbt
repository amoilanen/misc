import Dependencies._

ThisBuild / scalaVersion     := "2.13.5"
ThisBuild / version          := "0.1.0-SNAPSHOT"
ThisBuild / organization     := "com.example"
ThisBuild / organizationName := "example"

lazy val root = (project in file("."))
  .settings(
    name := "zio_akka",
    libraryDependencies += scalaTest % Test,

    libraryDependencies += "dev.zio" %% "zio" % "1.0.8",
    libraryDependencies += "dev.zio" %% "zio-streams" % "1.0.8",
    libraryDependencies += "com.typesafe.akka" %% "akka-actor" % "2.6.14",
    libraryDependencies += "com.typesafe.akka" %% "akka-testkit" % "2.6.14",
    libraryDependencies += "com.typesafe.akka" %% "akka-stream" % "2.6.14",
    libraryDependencies += "org.typelevel" %% "cats-core" % "2.3.0"
  )

// See https://www.scala-sbt.org/1.x/docs/Using-Sonatype.html for instructions on how to publish to Sonatype.
