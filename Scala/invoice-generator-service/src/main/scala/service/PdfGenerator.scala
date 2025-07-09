package service

import domain.*
import zio.*
import com.itextpdf.kernel.pdf.*
import com.itextpdf.layout.*
import com.itextpdf.layout.element.*
import com.itextpdf.layout.property.*
import com.itextpdf.kernel.colors.ColorConstants
import com.itextpdf.kernel.font.PdfFontFactory
import java.io.ByteArrayOutputStream
import java.time.format.DateTimeFormatter
import java.util.UUID

trait PdfGenerator:
  def generateInvoicePdf(invoice: Invoice): Task[Array[Byte]]

object PdfGenerator:
  def generateInvoicePdf(invoice: Invoice): ZIO[PdfGenerator, Throwable, Array[Byte]] =
    ZIO.serviceWithZIO[PdfGenerator](_.generateInvoicePdf(invoice))

class ITextPdfGenerator extends PdfGenerator:
  def generateInvoicePdf(invoice: Invoice): Task[Array[Byte]] =
    ZIO.attempt:
      val outputStream = ByteArrayOutputStream()
      val writer = PdfWriter(outputStream)
      val pdf = PdfDocument(writer)
      val document = Document(pdf)
      
      try
        addHeader(document, invoice)
        addCustomerInfo(document, invoice)
        addInvoiceDetails(document, invoice)
        addItemsTable(document, invoice)
        addTotal(document, invoice)
        addFooter(document, invoice)
        document.close()
        outputStream.toByteArray
      finally
        document.close()

  private def addHeader(document: Document, invoice: Invoice): Unit =
    val header = Paragraph("INVOICE")
      .setFontSize(24)
      .setBold()
      .setTextAlignment(TextAlignment.CENTER)
      .setMarginBottom(20)
    document.add(header)

  private def addCustomerInfo(document: Document, invoice: Invoice): Unit =
    val customerInfo = Table(2)
      .setWidth(UnitValue.createPercentValue(100))
      .setMarginBottom(20)
    
    customerInfo.addCell(createCell("Bill To:", true))
    customerInfo.addCell(createCell(invoice.customerName, false))
    customerInfo.addCell(createCell("", false))
    customerInfo.addCell(createCell(invoice.customerAddress.street, false))
    customerInfo.addCell(createCell("", false))
    customerInfo.addCell(createCell(s"${invoice.customerAddress.city}, ${invoice.customerAddress.state} ${invoice.customerAddress.zipCode}", false))
    customerInfo.addCell(createCell("", false))
    customerInfo.addCell(createCell(invoice.customerAddress.country, false))
    customerInfo.addCell(createCell("", false))
    customerInfo.addCell(createCell(invoice.customerEmail, false))
    
    document.add(customerInfo)

  private def addInvoiceDetails(document: Document, invoice: Invoice): Unit =
    val details = Table(2)
      .setWidth(UnitValue.createPercentValue(100))
      .setMarginBottom(20)
    
    val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    
    details.addCell(createCell("Invoice Number:", true))
    details.addCell(createCell(invoice.id.toString, false))
    details.addCell(createCell("Company ID:", true))
    details.addCell(createCell(invoice.companyId, false))
    details.addCell(createCell("Invoice Type:", true))
    details.addCell(createCell(invoice.invoiceType.toString, false))
    details.addCell(createCell("Issue Date:", true))
    details.addCell(createCell(invoice.issuedAt.format(formatter), false))
    details.addCell(createCell("Due Date:", true))
    details.addCell(createCell(invoice.dueDate.format(formatter), false))
    
    document.add(details)

  private def addItemsTable(document: Document, invoice: Invoice): Unit =
    val table = Table(4)
      .setWidth(UnitValue.createPercentValue(100))
      .setMarginBottom(20)
    
    // Header
    table.addHeaderCell(createHeaderCell("Description"))
    table.addHeaderCell(createHeaderCell("Quantity"))
    table.addHeaderCell(createHeaderCell("Unit Price"))
    table.addHeaderCell(createHeaderCell("Total"))
    
    // Items
    invoice.items.foreach: item =>
      table.addCell(createCell(item.description, false))
      table.addCell(createCell(item.quantity.toString, false))
      table.addCell(createCell(f"$$${item.unitPrice}%.2f", false))
      table.addCell(createCell(f"$$${item.totalPrice}%.2f", false))
    
    document.add(table)

  private def addTotal(document: Document, invoice: Invoice): Unit =
    val totalTable = Table(2)
      .setWidth(UnitValue.createPercentValue(50))
      .setHorizontalAlignment(HorizontalAlignment.RIGHT)
      .setMarginBottom(20)
    
    totalTable.addCell(createCell("Total Amount:", true))
    totalTable.addCell(createCell(f"$$${invoice.totalAmount}%.2f ${invoice.currency}", false))
    
    document.add(totalTable)

  private def addFooter(document: Document, invoice: Invoice): Unit =
    val footer = Paragraph("Thank you for your business!")
      .setFontSize(12)
      .setTextAlignment(TextAlignment.CENTER)
      .setMarginTop(30)
    document.add(footer)

  private def createCell(text: String, isBold: Boolean): Cell =
    val cell = Cell().add(Paragraph(text))
    if isBold then cell.setBold()
    cell

  private def createHeaderCell(text: String): Cell =
    Cell()
      .add(Paragraph(text))
      .setBold()
      .setBackgroundColor(ColorConstants.LIGHT_GRAY) 