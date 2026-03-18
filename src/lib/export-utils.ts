import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

/**
 * Enterprise-grade PDF Export with QuoteXStudio Branding
 */
export const exportToPDF = (
  title: string,
  headers: string[],
  data: any[][],
  filename: string = "report.pdf"
) => {
  const doc = new jsPDF();

  // QuoteXStudio Branding Header
  doc.setFillColor(5, 11, 24); // #050B18
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("QuoteXStudio", 15, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Enterprise Intelligence Matrix", 15, 32);

  // Report Info
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(14);
  doc.text(title, 15, 55);
  
  doc.setFontSize(8);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 62);

  // Table Generation
  autoTable(doc, {
    startY: 70,
    head: [headers],
    body: data,
    theme: "striped",
    headStyles: { 
      fillColor: [59, 130, 246], // #3b82f6
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
      halign: "center"
    },
    bodyStyles: { 
      fontSize: 8,
      halign: "center"
    },
    alternateRowStyles: {
      fillColor: [245, 247, 251]
    },
    margin: { top: 70 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Confidential - Page ${i} of ${pageCount}`,
      105,
      285,
      { align: "center" }
    );
  }

  doc.save(filename);
};

/**
 * Standardized CSV/Excel Export
 */
export const exportToCSV = (data: any[], filename: string = "export.csv") => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
