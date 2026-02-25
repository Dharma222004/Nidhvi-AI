import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Professional Report PDF Download Component
 * ----------------------------------------
 * Features:
 * - Beautiful button UI + animations
 * - Robust PDF generation
 * - Cleaner formatting (headers, spacing, wrapping)
 * - Optional PDF preview (in-page)
 */

function DownloadReport({ reportData, language = "en", fileName = "", showPreview = true }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // ---------------------------
  // Helpers
  // ---------------------------
  const cleanText = (text) => {
    if (!text) return "";
    return String(text)
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\[(\d+)\]/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const safeArray = (val) => (Array.isArray(val) ? val : []);
  const safeString = (val) => (typeof val === "string" ? val : "");

  const meta = useMemo(() => {
    const reportType =
      reportData?.reportType ||
      reportData?.extraction?.reportType ||
      "Medical Report";

    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const pdfFileName = fileName
      ? `${fileName}_Analysis_Report.pdf`
      : `Medical_Report_Analysis_${Date.now()}.pdf`;

    return { reportType, dateStr, pdfFileName };
  }, [reportData, fileName]);

  // ---------------------------
  // PDF Generator
  // ---------------------------
  const generatePDF = async () => {
    setDownloading(true);
    setDownloadSuccess(false);

    try {
      if (!reportData || (!reportData.explanation && !reportData.extraction)) {
        throw new Error("No analysis data available");
      }

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      let yPos = 15;

      // Professional Color Palette
      const colors = {
        primary: [75, 85, 175], // blue
        secondary: [45, 125, 145], // teal
        success: [34, 139, 84], // green
        warning: [180, 120, 40], // amber
        danger: [185, 60, 60], // red
        dark: [35, 45, 55], // deep gray
        text: [55, 65, 75], // gray
        muted: [120, 130, 145], // muted gray
        light: [245, 247, 250], // light gray
        white: [255, 255, 255],
      };

      // ---------------------------
      // Layout Helpers
      // ---------------------------
      const checkPageBreak = (requiredSpace = 10) => {
        if (yPos + requiredSpace > pageHeight - 18) {
          doc.addPage();
          yPos = 20;
          return true;
        }
        return false;
      };

      const addSectionHeader = (title, color = colors.primary) => {
        checkPageBreak(16);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...color);

        doc.text(cleanText(title).toUpperCase(), margin, yPos);

        yPos += 2;
        doc.setDrawColor(...color);
        doc.setLineWidth(0.8);
        doc.line(margin, yPos, margin + 55, yPos);
        yPos += 8;
      };

      const addParagraph = (text, indent = 0) => {
        const cleaned = cleanText(text);
        if (!cleaned) return;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...colors.text);

        const lines = doc.splitTextToSize(cleaned, contentWidth - indent);

        lines.forEach((line) => {
          checkPageBreak(5);
          doc.text(line, margin + indent, yPos);
          yPos += 5;
        });

        yPos += 2;
      };

      const addBulletPoint = (text, bulletColor = colors.success) => {
        const cleaned = cleanText(text);
        if (!cleaned) return;

        checkPageBreak(7);

        // bullet
        doc.setFillColor(...bulletColor);
        doc.circle(margin + 2.5, yPos - 1.2, 1.2, "F");

        // text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...colors.text);

        const lines = doc.splitTextToSize(cleaned, contentWidth - 12);

        lines.forEach((line) => {
          checkPageBreak(5);
          doc.text(line, margin + 8, yPos);
          yPos += 5;
        });

        yPos += 1;
      };

      const addNumberedItem = (num, text) => {
        const cleaned = cleanText(text);
        if (!cleaned) return;

        checkPageBreak(8);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.primary);
        doc.text(`${num}.`, margin, yPos);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.text);

        const lines = doc.splitTextToSize(cleaned, contentWidth - 14);

        lines.forEach((line) => {
          checkPageBreak(5);
          doc.text(line, margin + 10, yPos);
          yPos += 5;
        });

        yPos += 2;
      };

      // ---------------------------
      // HEADER
      // ---------------------------
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 38, "F");

      doc.setFillColor(...colors.secondary);
      doc.rect(0, 35, pageWidth, 3, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...colors.white);
      doc.text("MEDICAL REPORT ANALYSIS", pageWidth / 2, 16, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Powered by Nidhvi AI", pageWidth / 2, 24, { align: "center" });

      doc.setFontSize(9);
      doc.text(`Type: ${meta.reportType}`, margin, 32);
      doc.text(`Generated: ${meta.dateStr}`, pageWidth - margin, 32, { align: "right" });

      yPos = 48;

      // ---------------------------
      // DISCLAIMER
      // ---------------------------
      doc.setFillColor(255, 248, 240);
      doc.setDrawColor(...colors.warning);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, yPos, contentWidth, 16, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...colors.warning);
      doc.text("IMPORTANT DISCLAIMER", margin + 4, yPos + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...colors.text);
      doc.text(
        "This AI-generated analysis is for educational purposes only. NOT a substitute for medical advice.",
        margin + 4,
        yPos + 10
      );
      doc.text(
        "Always consult a qualified healthcare professional for diagnosis and treatment.",
        margin + 4,
        yPos + 14
      );

      yPos += 24;

      // ---------------------------
      // SUMMARY
      // ---------------------------
      const summary =
        reportData?.explanation?.summary ||
        reportData?.explanation?.clinicalSummary ||
        "Medical report analysis completed. Please review the detailed findings below.";

      addSectionHeader("Summary", colors.primary);

      doc.setFillColor(...colors.light);
      const summaryText = cleanText(summary);
      const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 8);
      const summaryHeight = summaryLines.length * 5 + 10;

      doc.roundedRect(margin, yPos - 2, contentWidth, summaryHeight, 2, 2, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...colors.dark);

      summaryLines.forEach((line, idx) => {
        doc.text(line, margin + 4, yPos + 4 + idx * 5);
      });

      yPos += summaryHeight + 8;

      // ---------------------------
      // UNDERSTANDING RESULTS
      // ---------------------------
      const explanationBlock = safeString(reportData?.explanation?.explanation);

      if (explanationBlock) {
        addSectionHeader("Understanding Your Results", colors.secondary);

        const chunks = explanationBlock.split(/\n\n+/);
        chunks.forEach((chunk) => {
          const lines = chunk.split("\n");
          lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            const headerMatch = trimmed.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/);
            if (headerMatch) {
              checkPageBreak(12);

              doc.setFont("helvetica", "bold");
              doc.setFontSize(11);
              doc.setTextColor(...colors.secondary);

              doc.text(cleanText(headerMatch[1]), margin + 2, yPos);
              yPos += 6;

              if (headerMatch[2]) addParagraph(headerMatch[2], 4);
            } else {
              addParagraph(trimmed);
            }
          });
        });

        yPos += 4;
      }

      // ---------------------------
      // NORMAL FINDINGS
      // ---------------------------
      const normalFindings = safeArray(reportData?.explanation?.normalFindings);
      if (normalFindings.length) {
        addSectionHeader("Normal Findings", colors.success);
        normalFindings.forEach((finding) => addBulletPoint(finding, colors.success));
        yPos += 4;
      }

      // ---------------------------
      // POINTS FOR DISCUSSION
      // ---------------------------
      const findingsToDiscuss = safeArray(reportData?.explanation?.findingsToDiscuss);
      if (findingsToDiscuss.length) {
        addSectionHeader("Points for Discussion", colors.warning);

        findingsToDiscuss.forEach((item) => {
          checkPageBreak(18);

          const findingText = typeof item === "string" ? item : item?.finding;

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(...colors.dark);
          doc.text(`> ${cleanText(findingText)}`, margin, yPos);
          yPos += 5;

          if (item?.importance) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            const impColor =
              item.importance === "high"
                ? colors.danger
                : item.importance === "medium"
                  ? colors.warning
                  : colors.success;

            doc.setTextColor(...impColor);
            doc.text(`Priority: ${item.importance.toUpperCase()}`, margin + 4, yPos);
            yPos += 4;
          }

          if (item?.whatItMeans) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...colors.muted);

            const lines = doc.splitTextToSize(cleanText(item.whatItMeans), contentWidth - 8);
            lines.forEach((line) => {
              checkPageBreak(4);
              doc.text(line, margin + 4, yPos);
              yPos += 4;
            });
          }

          yPos += 4;
        });

        yPos += 4;
      }

      // ---------------------------
      // NEXT STEPS
      // ---------------------------
      const nextSteps =
        safeArray(reportData?.explanation?.nextSteps).length
          ? safeArray(reportData?.explanation?.nextSteps)
          : safeArray(reportData?.explanation?.suggestedNextSteps);

      if (nextSteps.length) {
        addSectionHeader("Recommended Next Steps", colors.primary);

        nextSteps.forEach((step, idx) => {
          const stepText =
            typeof step === "string" ? step : step?.action || step?.text;
          addNumberedItem(idx + 1, stepText);
        });

        yPos += 4;
      }

      // ---------------------------
      // WHEN TO CONTACT DOCTOR
      // ---------------------------
      const whenToContact = safeArray(reportData?.explanation?.whenToContactDoctor);
      if (whenToContact.length) {
        addSectionHeader("When to Seek Medical Attention", colors.danger);
        whenToContact.forEach((item) => addBulletPoint(item, colors.danger));
        yPos += 4;
      }

      // ---------------------------
      // QUESTIONS FOR DOCTOR
      // ---------------------------
      const questions = safeArray(reportData?.explanation?.questionsForDoctor);
      if (questions.length) {
        addSectionHeader("Questions for Your Doctor", colors.secondary);
        questions.forEach((q, idx) => addNumberedItem(idx + 1, q));
        yPos += 4;
      }

      // ---------------------------
      // FINDINGS TABLE
      // ---------------------------
      const findings = safeArray(reportData?.extraction?.findings);
      if (findings.length) {
        checkPageBreak(40);
        addSectionHeader("Detailed Findings", colors.primary);

        const tableData = findings.slice(0, 12).map((f) => [
          cleanText(f.finding || f.text || "Finding"),
          cleanText(f.location || "-"),
          cleanText(f.severity || "N/A").toUpperCase(),
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Finding", "Location", "Status"]],
          body: tableData,
          theme: "striped",
          styles: {
            fontSize: 9,
            cellPadding: 3,
            lineColor: [220, 225, 230],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: colors.primary,
            textColor: colors.white,
            fontStyle: "bold",
            halign: "left",
          },
          columnStyles: {
            0: { cellWidth: 95 },
            1: { cellWidth: 40 },
            2: { cellWidth: 30 },
          },
          margin: { left: margin, right: margin },
        });

        yPos = doc.lastAutoTable.finalY + 10;
      }

      // ---------------------------
      // MEASUREMENTS TABLE
      // ---------------------------
      const measurements = safeArray(reportData?.extraction?.measurements);
      if (measurements.length) {
        checkPageBreak(40);
        addSectionHeader("Measurements & Values", colors.secondary);

        const measurementsData = measurements.slice(0, 12).map((m) => [
          cleanText(m.item || m.test || "Test"),
          cleanText(`${m.value || "-"} ${m.unit || ""}`),
          cleanText(m.referenceRange || "-"),
          cleanText(m.status || "N/A").toUpperCase(),
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Test", "Result", "Reference", "Status"]],
          body: measurementsData,
          theme: "striped",
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: {
            fillColor: colors.secondary,
            textColor: colors.white,
            fontStyle: "bold",
            halign: "left",
          },
          margin: { left: margin, right: margin },
        });

        yPos = doc.lastAutoTable.finalY + 10;
      }

      // ---------------------------
      // REASSURANCE BOX
      // ---------------------------
      if (reportData?.explanation?.reassurance) {
        checkPageBreak(24);

        const reassuranceText = cleanText(reportData.explanation.reassurance);
        const lines = doc.splitTextToSize(reassuranceText, contentWidth - 12);
        const boxHeight = lines.length * 4 + 14;

        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(...colors.success);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.success);
        doc.text("Remember:", margin + 4, yPos + 7);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(30, 80, 60);

        lines.forEach((line, idx) => {
          doc.text(line, margin + 4, yPos + 12 + idx * 4);
        });

        yPos += boxHeight + 8;
      }

      // ---------------------------
      // FOOTER (ALL PAGES)
      // ---------------------------
      const totalPages = doc.internal.getNumberOfPages();

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        doc.setDrawColor(200, 205, 210);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...colors.muted);

        doc.text("Nidhvi AI", margin, pageHeight - 7);
        doc.text("For Educational Purposes Only", pageWidth / 2, pageHeight - 7, {
          align: "center",
        });
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, {
          align: "right",
        });
      }

      // ---------------------------
      // SAVE + PREVIEW
      // ---------------------------
      if (showPreview) {
        const blob = doc.output("blob");
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }

      doc.save(meta.pdfFileName);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert(`Failed to generate PDF: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  if (!reportData) return null;

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <div className="download-report-wrapper">
      <motion.button
        className={`download-btn ${downloading ? "downloading" : ""} ${downloadSuccess ? "success" : ""
          }`}
        onClick={generatePDF}
        disabled={downloading}
        whileHover={{ scale: downloading ? 1 : 1.03 }}
        whileTap={{ scale: downloading ? 1 : 0.97 }}
        aria-label="Download Medical Report PDF"
      >
        <span className="btn-icon" aria-hidden="true">
          {downloading ? (
            <svg className="spinner" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                opacity="0.3"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          ) : downloadSuccess ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>

        <span className="btn-text">
          {downloading ? "Generating PDF..." : downloadSuccess ? "Downloaded!" : "Download Report"}
        </span>

        {!downloading && !downloadSuccess && <span className="format-badge">PDF</span>}
      </motion.button>

      {fileName && !downloading && (
        <p className="filename-info">
          Filename: <strong>{meta.pdfFileName}</strong>
        </p>
      )}

      {/* OUTPUT PREVIEW */}
      {showPreview && (
        <AnimatePresence>
          {previewUrl && (
            <motion.div
              className="preview-wrapper"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="preview-header">
                <h3>PDF Preview</h3>
                <button
                  className="close-preview"
                  onClick={() => setPreviewUrl(null)}
                  aria-label="Close preview"
                >
                  ✕
                </button>
              </div>

              <iframe title="PDF Preview" src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="pdf-frame" />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <style jsx>{`
        .download-report-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin: 22px 0;
          width: 100%;
        }

        .download-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #4b55af 0%, #2d7d91 100%);
          color: white;
          border: none;
          border-radius: 14px;
          padding: 14px 28px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 10px 28px rgba(75, 85, 175, 0.28);
          min-width: 230px;
          position: relative;
          outline: none;
        }

        .download-btn:hover:not(:disabled) {
          box-shadow: 0 12px 34px rgba(75, 85, 175, 0.35);
          transform: translateY(-2px);
        }

        .download-btn:disabled {
          opacity: 0.85;
        }

        .download-btn.downloading {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
          cursor: wait;
        }

        .download-btn.success {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        }

        .btn-icon {
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon svg {
          width: 100%;
          height: 100%;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .format-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.4px;
        }

        .filename-info {
          color: #94a3b8;
          font-size: 0.85rem;
          margin: 0;
          text-align: center;
        }

        .filename-info strong {
          color: #e2e8f0;
        }

        /* Preview */
        .preview-wrapper {
          width: min(920px, 96%);
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.25);
        }

        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: rgba(2, 6, 23, 0.55);
          border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        }

        .preview-header h3 {
          margin: 0;
          font-size: 0.95rem;
          color: #e2e8f0;
          font-weight: 700;
        }

        .close-preview {
          background: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 10px;
          padding: 6px 10px;
          cursor: pointer;
          font-size: 0.95rem;
          transition: 0.2s ease;
        }

        .close-preview:hover {
          background: rgba(255, 255, 255, 0.14);
        }

        .pdf-frame {
          width: 100%;
          height: 520px;
          border: none;
          background: white;
        }

        @media (max-width: 640px) {
          .download-btn {
            width: 100%;
            padding: 12px 18px;
          }

          .pdf-frame {
            height: 430px;
          }
        }
      `}</style>
    </div>
  );
}

export default DownloadReport;
