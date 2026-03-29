package com.stockChecker.live_stock_checker.service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;

import java.awt.*;

class PDFFooter extends PdfPageEventHelper {

    private static final Font FOOTER_WEBSITE_NAME = new com.lowagie.text.Font(Font.TIMES_ROMAN, 12f, Font.NORMAL, new Color(52, 89, 149));
    private static final Font PAGE_NUMBER = new Font(Font.TIMES_ROMAN, 8f, Font.NORMAL, new Color(30, 30, 30));

    @Override
    public void onEndPage(PdfWriter writer, Document document) {

        // PdfContentByte is the direct drawing canvas for the page
        // unlike document.add(), this lets you place things at exact coordinates
        PdfContentByte cb = writer.getDirectContent();

        // --- SEPARATOR LINE ---
        cb.setLineWidth(0.5f);                          // line thickness
        cb.setColorStroke(Color.BLACK);                 // Black color for the line
        cb.moveTo(36, 50);                            // start point — left margin, 50 points from bottom
        cb.lineTo(559, 50);                           // end point — right margin, same height
        cb.stroke();                                  // actually draws the line — without this nothing appears

        // --- WEBSITE NAME (left side) ---
        ColumnText.showTextAligned(
                cb,                                       // the canvas to draw on
                Element.ALIGN_LEFT,                       // text alignment
                new Phrase("stoxyfinance.com", FOOTER_WEBSITE_NAME), // content + font
                36,                                       // X position — left margin
                35,                                       // Y position — just below the line
                0                                         // rotation — 0 = normal horizontal text
        );

        // --- PAGE NUMBER (right side) ---
        ColumnText.showTextAligned(
                cb,
                Element.ALIGN_RIGHT,
                new Phrase("Page " + writer.getPageNumber(), PAGE_NUMBER), // writer.getPageNumber() gives current page
                559,                                      // X position — right margin
                35,                                       // Y position — same as website name
                0
        );
    }
}