package com.stockChecker.live_stock_checker.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.stockChecker.live_stock_checker.payload.PortfolioPayload.TransactionResponseDTO;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class PDFServiceImpl implements PDFService {

    // DEFINING THE COLORS
    private static final Color BUY_COLOR = new Color(34, 139, 34);        // green
    private static final Color SELL_COLOR = new Color(228, 52, 79);         // red

    private static final Color TEXT_PRIMARY = new Color(30, 30, 30);        // main text
    private static final Color BORDER_COLOR = new Color(0, 0, 0);           // table borders
    private static final Color BACKGROUND_ALT = new Color(245, 245, 245);   // zebra rows

    private static final Color HEADER_COLOR = new Color(52, 89, 149);       // muted blue

    /*
        The Font constructor in OpenPDF 1.3.43 takes 4 parameters in this exact order:
        Font(int family, float size, int style, Color color)

        family → Font.HELVETICA
        size → a float like 12f
        style → Font.BOLD, Font.NORMAL, Font.ITALIC, Font.BOLDITALIC
        color → your java.awt.Color constant you already defined above
    */

    // DEFINING THE FONTS
    private static final Font HEADER_FONT = new Font(Font.TIMES_ROMAN, 18f, Font.BOLD, HEADER_COLOR);
    private static final Font SUMMARY_CONTENT = new Font(Font.TIMES_ROMAN, 9f, Font.NORMAL, TEXT_PRIMARY);
    private static final Font TABLE_HEADER_TEXT = new Font(Font.TIMES_ROMAN, 10f, Font.NORMAL, Color.WHITE);
    private static final Font TABLE_ROW_DATA = new Font(Font.TIMES_ROMAN, 9f, Font.NORMAL, TEXT_PRIMARY);
    private static final Font BUY_FONT = new Font(Font.TIMES_ROMAN, 9f, Font.NORMAL, BUY_COLOR);
    private static final Font SELL_FONT = new Font(Font.TIMES_ROMAN, 9f, Font.NORMAL, SELL_COLOR);

    // currencyFormatter
    private static final Locale indiaLocale = Locale.of("en", "IN");
    private static final NumberFormat indiaCurrencyFormat;

    static {
        indiaCurrencyFormat = NumberFormat.getNumberInstance(indiaLocale);
        indiaCurrencyFormat.setMinimumFractionDigits(2);
        indiaCurrencyFormat.setMaximumFractionDigits(2);
    }


    @Override
    public byte[] generateTransactionsPDF(List<TransactionResponseDTO> transactionsList) {

        // basically we return pdf as byte[] so that it is used by the browser.
        ByteArrayOutputStream pdfOutputStream = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter writer = PdfWriter.getInstance(document, pdfOutputStream);
        writer.setPageEvent(new PDFFooter());
        document.open();

        // content of the pdf.
        buildHeader(document);
        buildSummary(document, transactionsList);
        buildTable(document, transactionsList);

        document.close();
        return pdfOutputStream.toByteArray();
    }

    // Header Section:
    private void buildHeader(Document document) {
        Paragraph headerParagraph = new Paragraph("Transaction Statement", HEADER_FONT);
        headerParagraph.setSpacingBefore(5f);
        headerParagraph.setSpacingAfter(5f);
        headerParagraph.setAlignment(Element.ALIGN_LEFT);
        document.add(headerParagraph);
    }

    // Summary Section:
    private void buildSummary(Document document, List<TransactionResponseDTO> transactionsList) {
        // Summary Section
        Paragraph totalTransactions = new Paragraph
                ("Total Transactions: " + getNumberOfTransactions(transactionsList), SUMMARY_CONTENT);
        totalTransactions.setAlignment(Element.ALIGN_LEFT);

        Paragraph totalTradedValue = new Paragraph(
                "Total Traded Value: " + "Rs. " + indiaCurrencyFormat.format(getTotalValueTraded(transactionsList)), SUMMARY_CONTENT);
        totalTradedValue.setAlignment(Element.ALIGN_LEFT);

        BigDecimal netPnLValue = getNetPnL(transactionsList);
        boolean pnlIsNegative = netPnLValue.compareTo(BigDecimal.ZERO) < 0;
        Chunk label = new Chunk("Net P&L: ", SUMMARY_CONTENT);
        Chunk value = new Chunk("Rs. " + indiaCurrencyFormat.format(netPnLValue), pnlIsNegative ? SELL_FONT : BUY_FONT);

        Paragraph netPnL = new Paragraph();
        netPnL.add(label);
        netPnL.add(value);
        netPnL.setAlignment(Element.ALIGN_LEFT);

        String[] dates = getTransactionDates(transactionsList);
        Paragraph timePeriod = new Paragraph
                ("Period: " + dates[0] + " to " + dates[1], SUMMARY_CONTENT);
        timePeriod.setAlignment(Element.ALIGN_LEFT);

        document.add(totalTransactions);
        document.add(totalTradedValue);
        document.add(netPnL);
        document.add(timePeriod);
    }

    // Table Section
    private void buildTable(Document document, List<TransactionResponseDTO> transactionsList) {
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100f);
        table.setWidths(new float[]{2f, 3f, 1f, 2f, 2f, 1.5f});

        table.setSpacingBefore(8f);
        table.setSpacingAfter(3f);

        // column 1 : Date
        PdfPCell dateHeaderCell = getHeaderCell("Date", Element.ALIGN_LEFT);
        table.addCell(dateHeaderCell);

        // column 2: stock
        PdfPCell stockCell = getHeaderCell("Stock", Element.ALIGN_LEFT);
        table.addCell(stockCell);

        // column 3: Qty
        PdfPCell qtyCell = getHeaderCell("QTY", Element.ALIGN_RIGHT);
        table.addCell(qtyCell);

        // column 4: Price
        PdfPCell priceCell = getHeaderCell("Price", Element.ALIGN_RIGHT);
        table.addCell(priceCell);

        // column 5: TotalAmountCell
        PdfPCell totalAmountCell = getHeaderCell("Total Amount", Element.ALIGN_RIGHT);
        table.addCell(totalAmountCell);

        // column 6: Type
        PdfPCell transactionTypeCell = getHeaderCell("Type", Element.ALIGN_CENTER);
        table.addCell(transactionTypeCell);

        // this line tell's the openPDF as to treat the first 1 lines as headers and repeat on every page!
        table.setHeaderRows(1);

        // entering the data in the table
        Color alternate = Color.WHITE;
        for (TransactionResponseDTO x : transactionsList) {
            BigDecimal quantity = BigDecimal.valueOf(x.getQuantity());
            BigDecimal total = x.getPrice().multiply(quantity);
            String date = DateTimeFormatter.ofPattern("dd MMM yyyy").format(x.getTransactionAt().toLocalDate());
            table.addCell(getDataCell(date, Element.ALIGN_LEFT, alternate));
            table.addCell(getDataCell(x.getStockSymbol(), Element.ALIGN_LEFT, alternate));
            table.addCell(getDataCell(x.getQuantity().toString(), Element.ALIGN_RIGHT, alternate));
            table.addCell(getDataCell("Rs. " + indiaCurrencyFormat.format(x.getPrice()), Element.ALIGN_RIGHT, alternate));
            table.addCell(getDataCell("Rs. " + indiaCurrencyFormat.format(total), Element.ALIGN_RIGHT, alternate));
            table.addCell(getDataCell(x.getType(), Element.ALIGN_CENTER, alternate));

            alternate = alternate == Color.WHITE ? BACKGROUND_ALT : Color.WHITE;
        }
        document.add(table);
    }

    private PdfPCell getHeaderCell(String headerCellName, int alignCell) {
        PdfPCell headerCell = new PdfPCell(new Phrase(headerCellName, TABLE_HEADER_TEXT));
        headerCell.setBackgroundColor(HEADER_COLOR);
        headerCell.setPadding(6f);
        headerCell.setHorizontalAlignment(alignCell);
        headerCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        headerCell.setBorderColor(BORDER_COLOR);
        headerCell.setBorderWidth(0.5f);
        return headerCell;
    }

    private PdfPCell getDataCell(String text, int alignCell, Color cellColor) {
        Font cellFont = TABLE_ROW_DATA;
        if (text.equals("BUY")) {
            cellFont = BUY_FONT;
        } else if (text.equals("SELL")) {
            cellFont = SELL_FONT;
        }
        PdfPCell dataCell = new PdfPCell(new Phrase(text, cellFont));
        dataCell.setBackgroundColor(cellColor);
        dataCell.setPadding(6f);
        dataCell.setHorizontalAlignment(alignCell);
        dataCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        dataCell.setBorderColor(BORDER_COLOR);
        dataCell.setBorderWidth(0.5f);
        return dataCell;
    }

    // Entire Math Section for the Summary
    private Integer getNumberOfTransactions(List<TransactionResponseDTO> transactionsList) {
        return transactionsList.size();
    }

    private BigDecimal getTotalValueTraded(List<TransactionResponseDTO> transactionsList) {
        BigDecimal totalValue = BigDecimal.ZERO;
        for (TransactionResponseDTO x : transactionsList) {
            BigDecimal quantity = BigDecimal.valueOf(x.getQuantity());
            BigDecimal total = x.getPrice().multiply(quantity);
            totalValue = totalValue.add(total);
        }
        return totalValue;
    }

    private BigDecimal getNetPnL(List<TransactionResponseDTO> transactionsList) {
        BigDecimal totalBuy = BigDecimal.ZERO;
        BigDecimal totalSell = BigDecimal.ZERO;
        for (TransactionResponseDTO x : transactionsList) {
            BigDecimal quantity = BigDecimal.valueOf(x.getQuantity());
            BigDecimal total = x.getPrice().multiply(quantity);
            if (x.getType().equals("BUY")) {
                totalBuy = totalBuy.add(total);
            } else {
                totalSell = totalSell.add(total);
            }
        }
        return totalSell.subtract(totalBuy);
    }

    private String[] getTransactionDates(List<TransactionResponseDTO> transactionsList) {
        // index 0-> starting date
        // index 1-> ending date
        LocalDate startDate = transactionsList.getFirst().getTransactionAt().toLocalDate();
        LocalDate endDate = transactionsList.getFirst().getTransactionAt().toLocalDate();

        for (TransactionResponseDTO x : transactionsList) {
            if (x.getTransactionAt().toLocalDate().isBefore(startDate))
                startDate = x.getTransactionAt().toLocalDate();
            if (x.getTransactionAt().toLocalDate().isAfter(endDate))
                endDate = x.getTransactionAt().toLocalDate();
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
        return new String[]{formatter.format(startDate),
                formatter.format(endDate)};
    }
}


/*
    Entire Flow:
        How PDF Generation using OpenPDF works in a series of step:

        1. We need to define our outputStream.
            ByteArrayOutputStream is an empty container that will receive PDF bytes as they are generated.

        2. Now, we create a new document using
            import org.openpdf.text.Document;
            Document document = new Document();
                - Document represents the structure of a PDF, not an actual file yet

        3. After the document is defined, we need to define a pipeline which is the
            PDFWriter.instanceOf(source,destination)
            source is a document object and destination is a bytOutputStream object.

            understand this as a pipeline where the pdfWriter gets the instruction to start writing whatever
            everything whatever is being added in the pdf to the output stream.
            So after this the if any paragraph or tables or anything is filled in the Document, then it gets
            written into the outputStream automatically!

            PdfWriter.getInstance(document, out) sets up a bridge so that every time content is added to the document,
            it is immediately converted into PDF format and written into the output stream

        4. Document.open() - enables writing.
            Before this, any attempt to add content will fail or be ignored.

        5. Document.close() - closes the document meaning that any updates or changes are now not allowed,
            and we return the outputStream, which is just a PDF in memory in bytes[];

            document.close() finalizes the PDF structure (very important),
            flushes remaining data into the stream, and ensures the PDF is valid.

        6. outputStream.toByteArray() - this is the actual PDF file to return

    Important Point to understand:
        When document.add() is called, the document immediately passes the content to PdfWriter,
        which converts it into PDF bytes and writes it into the output stream.
*/