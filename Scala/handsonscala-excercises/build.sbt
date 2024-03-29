import Dependencies._

ThisBuild / scalaVersion     := "2.13.1"
ThisBuild / version          := "0.1.0-SNAPSHOT"
ThisBuild / organization     := "com.example"
ThisBuild / organizationName := "example"

val lihaoyiLibraries = List(
  ("os-lib", "0.7.8"),
  ("upickle", "1.4.0"),
  ("ujson", "1.4.0"),
  ("scalatags", "0.9.1"),
  ("requests", "0.6.5")
).map({ case (artifact, version) =>
  "com.lihaoyi" %% artifact % version
})

lazy val root = (project in file("."))
  .settings(
    name := "handsonscala-excercises",
    libraryDependencies ++= Seq(
      "org.scalamock" %% "scalamock" % "5.1.0" % Test,
      "org.scalatest" %% "scalatest" % "3.1.0" % Test,
      "com.atlassian.commonmark" % "commonmark" % "0.13.1",
      "org.jsoup" % "jsoup" % "1.14.2"
    ) ++ lihaoyiLibraries
)

val circeVersion = "0.12.3"

libraryDependencies ++= Seq(
  "io.circe" %% "circe-core",
  "io.circe" %% "circe-generic",
  "io.circe" %% "circe-parser"
).map(_ % circeVersion)

// Uncomment the following for publishing to Sonatype.
// See https://www.scala-sbt.org/1.x/docs/Using-Sonatype.html for more detail.

// ThisBuild / description := "Some descripiton about your project."
// ThisBuild / licenses    := List("Apache 2" -> new URL("http://www.apache.org/licenses/LICENSE-2.0.txt"))
// ThisBuild / homepage    := Some(url("https://github.com/example/project"))
// ThisBuild / scmInfo := Some(
//   ScmInfo(
//     url("https://github.com/your-account/your-project"),
//     "scm:git@github.com:your-account/your-project.git"
//   )
// )
// ThisBuild / developers := List(
//   Developer(
//     id    = "Your identifier",
//     name  = "Your Name",
//     email = "your@email",
//     url   = url("http://your.url")
//   )
// )
// ThisBuild / pomIncludeRepository := { _ => false }
// ThisBuild / publishTo := {
//   val nexus = "https://oss.sonatype.org/"
//   if (isSnapshot.value) Some("snapshots" at nexus + "content/repositories/snapshots")
//   else Some("releases" at nexus + "service/local/staging/deploy/maven2")
// }
// ThisBuild / publishMavenStyle := true
