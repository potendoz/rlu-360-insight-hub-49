import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExportProps {
  title?: string;
  targetElementId?: string;
}

export const PDFExport = ({ title = "RLU 360 Report", targetElementId }: PDFExportProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const generatePDF = async () => {
    setIsExporting(true);
    toast.info("Generating PDF report...");

    try {
      let elementToCapture;
      
      if (targetElementId) {
        elementToCapture = document.getElementById(targetElementId);
      } else {
        // Create a comprehensive report container
        elementToCapture = document.querySelector('[data-pdf-content]') || document.body;
      }

      if (!elementToCapture) {
        throw new Error("Content not found for PDF generation");
      }

      // Capture the element as canvas
      const canvas = await html2canvas(elementToCapture, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: elementToCapture.scrollWidth,
        height: elementToCapture.scrollHeight
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add title page
      pdf.setFontSize(24);
      pdf.setTextColor(0, 74, 159); // Primary color
      pdf.text(title, 20, 30);
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
      pdf.text('RLU 360 Transformation Model', 20, 55);
      pdf.text('Rational Laboratory Use Analytics Platform', 20, 65);

      // Add captured content
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit the page
      const imgWidth = pdfWidth - 40; // 20mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Calculate how many pages we need for the content
      const pageContentHeight = pdfHeight - 40; // Available height per page with margins
      const totalPages = Math.ceil(imgHeight / pageContentHeight);
      
      // Add pages and split content accordingly
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        pdf.addPage();
        
        const startY = pageIndex * pageContentHeight;
        const remainingHeight = imgHeight - startY;
        const currentPageHeight = Math.min(pageContentHeight, remainingHeight);
        
        // Create a temporary canvas for this page section
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          tempCanvas.width = canvas.width;
          tempCanvas.height = (currentPageHeight * canvas.width) / imgWidth;
          
          // Draw the section of the original canvas
          tempCtx.drawImage(
            canvas,
            0, (startY * canvas.width) / imgWidth, // Source x, y
            canvas.width, tempCanvas.height, // Source width, height
            0, 0, // Destination x, y
            tempCanvas.width, tempCanvas.height // Destination width, height
          );
          
          const pageImgData = tempCanvas.toDataURL('image/png');
          pdf.addImage(pageImgData, 'PNG', 20, 20, imgWidth, currentPageHeight);
        }
      }

      // Add footer to last page
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `RLU 360 Platform - Page ${i} of ${pageCount}`,
          pdfWidth - 20,
          pdfHeight - 10,
          { align: 'right' }
        );
      }

      // Save the PDF
      const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      toast.success("PDF report generated successfully!");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const printReport = () => {
    const printContent = targetElementId 
      ? document.getElementById(targetElementId)
      : document.querySelector('[data-pdf-content]');
      
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${title}</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  background: white;
                }
                
                .print-header {
                  text-align: center;
                  border-bottom: 3px solid #004A9F;
                  padding: 30px 0;
                  margin-bottom: 30px;
                  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                }
                
                .print-title {
                  font-size: 28px;
                  font-weight: bold;
                  color: #004A9F;
                  margin-bottom: 10px;
                }
                
                .print-subtitle {
                  font-size: 14px;
                  color: #64748b;
                  margin-bottom: 5px;
                }
                
                .print-date {
                  font-size: 12px;
                  color: #94a3b8;
                }
                
                .print-content {
                  padding: 0 40px;
                  max-width: 1200px;
                  margin: 0 auto;
                }
                
                .no-print {
                  display: none !important;
                }
                
                /* Table Styling */
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
                  font-size: 12px;
                }
                
                th, td {
                  border: 1px solid #e2e8f0;
                  padding: 8px 12px;
                  text-align: left;
                }
                
                th {
                  background-color: #f1f5f9;
                  font-weight: 600;
                  color: #334155;
                }
                
                /* Card Styling */
                .card, [class*="card"] {
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  padding: 20px;
                  margin: 15px 0;
                  background: white;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                
                /* Chart containers */
                .recharts-wrapper {
                  background: white;
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  padding: 15px;
                  margin: 15px 0;
                }
                
                /* Headings */
                h1, h2, h3, h4, h5, h6 {
                  color: #1e293b;
                  margin: 20px 0 10px 0;
                  page-break-after: avoid;
                }
                
                h1 { font-size: 24px; }
                h2 { font-size: 20px; }
                h3 { font-size: 18px; }
                h4 { font-size: 16px; }
                
                /* Grid layouts */
                .grid {
                  display: grid;
                  gap: 20px;
                  margin: 20px 0;
                }
                
                .grid-cols-1 { grid-template-columns: 1fr; }
                .grid-cols-2 { grid-template-columns: 1fr 1fr; }
                .grid-cols-3 { grid-template-columns: 1fr 1fr 1fr; }
                .grid-cols-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
                
                /* Flex layouts */
                .flex {
                  display: flex;
                  gap: 15px;
                  margin: 15px 0;
                }
                
                .flex-col {
                  flex-direction: column;
                }
                
                /* Print specific rules */
                @media print {
                  body {
                    margin: 0;
                    padding: 0;
                    background: white !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  
                  .print-content {
                    padding: 0 20px;
                  }
                  
                  .print-header {
                    background: #f8fafc !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  
                  .page-break {
                    page-break-before: always;
                  }
                  
                  .page-break-inside {
                    page-break-inside: avoid;
                  }
                  
                  .no-break {
                    page-break-inside: avoid;
                  }
                  
                  /* Ensure tables don't break awkwardly */
                  table {
                    page-break-inside: auto;
                  }
                  
                  tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                  }
                  
                  /* Keep chart containers together */
                  .recharts-wrapper {
                    page-break-inside: avoid;
                  }
                  
                  /* Card containers */
                  .card, [class*="card"] {
                    page-break-inside: avoid;
                    border: 1px solid #e2e8f0 !important;
                    box-shadow: none !important;
                  }
                  
                  /* Footer on each page */
                  @page {
                    margin: 2cm 1.5cm 2cm 1.5cm;
                    @bottom-right {
                      content: "RLU 360 Platform - Page " counter(page);
                      font-size: 10px;
                      color: #94a3b8;
                    }
                  }
                  
                  /* Avoid orphans and widows */
                  h1, h2, h3, h4, h5, h6 {
                    page-break-after: avoid;
                    orphans: 3;
                    widows: 3;
                  }
                  
                  p {
                    orphans: 3;
                    widows: 3;
                  }
                }
                
                /* Color preservation for charts and important elements */
                .recharts-bar, .recharts-line, .recharts-area {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                
                /* Badge and status styling */
                .badge, [class*="badge"] {
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 11px;
                  font-weight: 500;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              </style>
            </head>
            <body>
              <div class="print-header">
                <div class="print-title">${title}</div>
                <div class="print-subtitle">RLU 360 Transformation Model</div>
                <div class="print-subtitle">Rational Laboratory Use Analytics Platform</div>
                <div class="print-date">Generated on: ${new Date().toLocaleDateString('th-TH', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  timeZone: 'Asia/Bangkok'
                })}</div>
              </div>
              <div class="print-content">
                ${printContent.innerHTML}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } else {
      window.print();
    }
  };

  return (
    <div className="flex space-x-2">
      <Button 
        variant="outline" 
        onClick={generatePDF}
        disabled={isExporting}
        className="flex items-center space-x-2"
      >
        <Download className="w-4 h-4" />
        <span>{isExporting ? 'Generating...' : 'Export PDF'}</span>
      </Button>
      
      <Button 
        variant="outline" 
        onClick={printReport}
        className="flex items-center space-x-2"
      >
        <Printer className="w-4 h-4" />
        <span>Print</span>
      </Button>
    </div>
  );
};