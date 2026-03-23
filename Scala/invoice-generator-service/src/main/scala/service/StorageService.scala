package service

import config.GcpConfig
import zio.*
import com.google.cloud.storage.*
import com.google.cloud.storage.BlobInfo

trait StorageService:
  def uploadPdf(pdfBytes: Array[Byte], fileName: String): Task[String]
  def getPdfUrl(fileName: String): Task[String]
  def downloadPdf(fileName: String): Task[Array[Byte]]
  def deletePdf(fileName: String): Task[Unit]

object StorageService:
  def uploadPdf(pdfBytes: Array[Byte], fileName: String): ZIO[StorageService, Throwable, String] =
    ZIO.serviceWithZIO[StorageService](_.uploadPdf(pdfBytes, fileName))

  def getPdfUrl(fileName: String): ZIO[StorageService, Throwable, String] =
    ZIO.serviceWithZIO[StorageService](_.getPdfUrl(fileName))

  def downloadPdf(fileName: String): ZIO[StorageService, Throwable, Array[Byte]] =
    ZIO.serviceWithZIO[StorageService](_.downloadPdf(fileName))

  def deletePdf(fileName: String): ZIO[StorageService, Throwable, Unit] =
    ZIO.serviceWithZIO[StorageService](_.deletePdf(fileName))

class GcpStorageService(config: GcpConfig) extends StorageService:
  private val storage =
    val builder = StorageOptions.newBuilder()
      .setProjectId(config.projectId)

    // Configure endpoint for fake-gcs-server if specified
    config.endpoint.foreach { endpoint =>
      builder.setHost(endpoint)
    }

    // Configure credentials if specified
    config.credentialsPath.foreach { credentialsPath =>
      builder.setCredentials(
        com.google.auth.oauth2.GoogleCredentials.fromStream(
          new java.io.FileInputStream(credentialsPath)
        )
      )
    }

    builder.build().getService

  def uploadPdf(pdfBytes: Array[Byte], fileName: String): Task[String] =
    ZIO.attemptBlocking:
      val blobId = BlobId.of(config.bucketName, fileName)
      val blobInfo = BlobInfo.newBuilder(blobId)
        .setContentType("application/pdf")
        .build()

      storage.create(blobInfo, pdfBytes)
      s"gs://${config.bucketName}/$fileName"

  def getPdfUrl(fileName: String): Task[String] =
    ZIO.attemptBlocking:
      val blobId = BlobId.of(config.bucketName, fileName)
      val blob = storage.get(blobId)
      if blob != null then
        blob.signUrl(1, java.util.concurrent.TimeUnit.HOURS).toString
      else
        throw new RuntimeException(s"File $fileName not found")

  def downloadPdf(fileName: String): Task[Array[Byte]] =
    ZIO.attemptBlocking:
      val blobId = BlobId.of(config.bucketName, fileName)
      val blob = storage.get(blobId)
      if blob != null then
        blob.getContent()
      else
        throw new RuntimeException(s"File $fileName not found")

  def deletePdf(fileName: String): Task[Unit] =
    ZIO.attemptBlocking:
      val blobId = BlobId.of(config.bucketName, fileName)
      storage.delete(blobId)
