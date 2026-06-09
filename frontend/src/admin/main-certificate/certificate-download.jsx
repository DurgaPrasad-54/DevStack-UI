import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './certificate-download.css'
import config from '../../config';


const CertificateDownload = () => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available programs on component mount
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${config.backendUrl}/api/certificates/generated-programs`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          setPrograms(response.data.data);
          // Set default selected as string "programName|currentYear"
          if (response.data.data.length > 0) {
            const first = response.data.data[0];
            setSelectedProgram(`${first.programName}|${first.currentYear}`);
          }
        }
        setLoading(false);
      } catch (err) {
        setError('Error fetching programs: ' + err.message);
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  // Handle program selection
  const handleProgramChange = (e) => {
    setSelectedProgram(e.target.value);
  };

  // Generate combined PDF with summary and all certificates using the custom template
  const generateCombinedPDF = (certificates) => {
    try {
      // Create a new jsPDF instance
      const doc = new jsPDF();
      
      let currentPage = 1;
      let totalPages = certificates.length + 1; // Summary page + 1 page per certificate
      
      // Add summary page
      doc.setFontSize(18);
      doc.setTextColor(26, 82, 118); // Dark blue color (#1a5276)
      doc.text(`Certificates - ${selectedProgram}`, 14, 22);
      
      // Add page number
      doc.setFontSize(10);
      doc.text(`Page ${currentPage} of ${totalPages}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, {
        align: 'right'
      });
      
      const tableColumn = ["Name", "Roll No", "Grade", "Certificate Type", "Issue Date", "Certificate ID"];
      const tableRows = [];

      certificates.forEach(cert => {
        const student = cert.student;
        const formattedDate = new Date(cert.issueDate).toLocaleDateString();
        const certData = [
          student.name,
          student.rollNo || 'N/A',
          cert.grade,
          cert.certificateType,
          formattedDate,
          cert.certificateId
        ];
        tableRows.push(certData);
      });

      // Add summary table
      try {
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 30,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [26, 82, 118] }, // Dark blue header (#1a5276)
          columnStyles: { 0: { cellWidth: 30 } }
        });
      } catch (e) {
        console.error("AutoTable error:", e);
        // Fallback to manual table if autoTable fails
        doc.setFontSize(12);
        doc.text("Summary table could not be generated. See individual certificates.", 20, 40);
      }
      
      // Add individual certificates (one per page) using the custom template
      certificates.forEach((certificate, index) => {
        // Add a new page
        doc.addPage();
        currentPage++;
        
        const student = certificate.student;
        const formattedDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
        
        // Page dimensions for reference
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 15;
        
        // Add thick border (15px in CSS ~ 5mm in PDF)
        const borderThickness = 5;
        let borderColor = certificate.certificateType === 'completion' ? [26, 82, 118] : [40, 116, 166]; // #1a5276 or #2874a6
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(borderThickness);
        doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
        
        // Add inner border (5px in CSS ~ 2mm in PDF)
        doc.setDrawColor(240, 240, 240); // #f0f0f0
        doc.setLineWidth(2);
        doc.rect(margin + borderThickness, margin + borderThickness, 
                pageWidth - 2 * (margin + borderThickness), 
                pageHeight - 2 * (margin + borderThickness));
        
        // Certificate Header
        const headerY = margin + borderThickness + 20;
        
        // Logo placeholder
        doc.setFillColor(240, 240, 240); // #f0f0f0
        doc.roundedRect(pageWidth / 2 - 40, headerY, 80, 15, 3, 3, 'F');
        doc.setTextColor(85, 85, 85); // #555
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("ORGANIZATION LOGO", pageWidth / 2, headerY + 10, { align: "center" });
        
        // Certificate title
        doc.setTextColor(...borderColor);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text(
          certificate.certificateType === 'completion' ? 'CERTIFICATE OF ACHIEVEMENT' : 'CERTIFICATE OF PARTICIPATION',
          pageWidth / 2, headerY + 35, { align: "center" }
        );
        
        // Add header separator line
        doc.setDrawColor(240, 240, 240); // #f0f0f0
        doc.setLineWidth(1);
        doc.line(margin + 20, headerY + 45, pageWidth - margin - 20, headerY + 45);
        
        // Certificate Body
        const bodyY = headerY + 60;
        
        // Certificate text
        doc.setTextColor(51, 51, 51); // #333
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.text("This is to certify that", pageWidth / 2, bodyY, { align: "center" });
        
        // Student name
        doc.setTextColor(...borderColor);
        doc.setFontSize(28);
        // Try to simulate a cursive font (not actually possible in basic jsPDF)
        doc.setFont(undefined, 'italic');
        doc.text(student.name, pageWidth / 2, bodyY + 20, { align: "center" });
        
        // Description text
        doc.setTextColor(51, 51, 51); // #333
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        const descriptionText = certificate.certificateType === 'completion'
          ? `has successfully completed the ${certificate.programName} program with`
          : `has participated in the ${certificate.programName} program with`;
        doc.text(descriptionText, pageWidth / 2, bodyY + 40, { align: "center" });
        
        // Grade and Marks for completion certificates
        if (certificate.certificateType === 'completion') {
          const gradeY = bodyY + 60;
          
          // Grade box
          doc.setDrawColor(...borderColor);
          doc.setLineWidth(1);
          doc.roundedRect(pageWidth / 2 - 60, gradeY, 40, 35, 5, 5, 'S');
          doc.setFontSize(22);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(...borderColor);
          doc.text(certificate.grade, pageWidth / 2 - 40, gradeY + 20, { align: "center" });
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(85, 85, 85); // #555
          doc.text("Grade", pageWidth / 2 - 40, gradeY + 30, { align: "center" });
          
          // Marks box
          doc.roundedRect(pageWidth / 2 + 20, gradeY, 40, 35, 5, 5, 'S');
          doc.setFontSize(22);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(...borderColor);
          doc.text(certificate.totalMarks.toString(), pageWidth / 2 + 40, gradeY + 20, { align: "center" });
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(85, 85, 85); // #555
          doc.text("Marks", pageWidth / 2 + 40, gradeY + 30, { align: "center" });
        }
        
        // Student details
        const detailsY = certificate.certificateType === 'completion' ? bodyY + 110 : bodyY + 60;
        doc.setFontSize(12);
        doc.setTextColor(51, 51, 51); // #333
        doc.text(`Roll Number: ${student.rollNo || 'N/A'}`, pageWidth / 2, detailsY, { align: "center" });
        doc.text(`Branch: ${student.branch || 'N/A'}`, pageWidth / 2, detailsY + 10, { align: "center" });
        doc.text(`College: ${student.college || 'N/A'}`, pageWidth / 2, detailsY + 20, { align: "center" });
        
        // Certificate Footer
        const footerY = pageHeight - margin - borderThickness - 40;
        
        // Signature line
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.line(pageWidth / 2 - 40, footerY, pageWidth / 2 + 40, footerY);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text("Program Director", pageWidth / 2, footerY + 10, { align: "center" });
        
        // Certificate details
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(85, 85, 85); // #555
        doc.text(`Certificate ID: ${certificate.certificateId}`, pageWidth - margin - 10, footerY, { align: "right" });
        doc.text(`Issued on: ${formattedDate}`, pageWidth - margin - 10, footerY + 10, { align: "right" });
        
        // Add page number
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text(`Page ${currentPage} of ${totalPages}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, {
          align: 'right'
        });
      });
      
      return doc;
    } catch (error) {
      console.error("Error generating combined PDF:", error);
      throw error;
    }
  };

  // Handle download button click
  const handleDownload = async () => {
    if (!selectedProgram) {
      setError('Please select a program');
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // Split the selected value to get programName and currentYear
      const [programName, currentYear] = selectedProgram.split('|');

      const response = await axios.get(
        `${config.backendUrl}/api/certificates/download-certificates/${encodeURIComponent(programName)}/${encodeURIComponent(currentYear)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success && response.data.data.length > 0) {
        const certificates = response.data.data;
        
        try {
          // Generate a single combined PDF with all certificates
          const combinedPdf = generateCombinedPDF(certificates);
          
          // Save the combined PDF
          combinedPdf.save(`${selectedProgram}-certificates.pdf`);
          
          setLoading(false);
        } catch (pdfError) {
          console.error("PDF generation error:", pdfError);
          setError(`Error generating PDF: ${pdfError.message}`);
          setLoading(false);
        }
      } else {
        setError('No certificates found for this program');
        setLoading(false);
      }
    } catch (err) {
      console.error("Download error:", err);
      setError('Error downloading certificates: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="downcertif-container">
      <h2 className="downcertif-heading">Download Program Certificates</h2>
      
      {loading && <div className="downcertif-loading">Loading...</div>}
      
      {error && <div className="downcertif-error">{error}</div>}
      
      <div className="downcertif-form-group">
        <label className="downcertif-label" htmlFor="program-select">Select Program:</label>
        <select 
          id="program-select"
          className="downcertif-select"
          value={selectedProgram}
          onChange={handleProgramChange}
          disabled={loading || programs.length === 0}
        >
          {programs.length === 0 && <option value="">No programs available</option>}
          {programs.map((program, index) => (
            <option 
              key={index} 
              value={`${program.programName}|${program.currentYear}`}
            >
              {program.programName} ({program.currentYear})
            </option>
          ))}
        </select>
      </div>
      
      <button 
        className="downcertif-btn"
        onClick={handleDownload}
        disabled={loading || !selectedProgram}
      >
        {loading ? 'Processing...' : 'Download Certificates'}
      </button>
      
      <div className="downcertif-info-box">
        <h3 className="downcertif-info-heading">Download Information</h3>
        <p>This will generate a single PDF document containing:</p>
        <ul className="downcertif-info-list">
          <li>A summary table with all certificates' information</li>
          <li>Individual certificate pages for each student</li>
        </ul>
        <p>For large programs, this may take a few moments to process.</p>
      </div>
    </div>
  );
};

export default CertificateDownload;
