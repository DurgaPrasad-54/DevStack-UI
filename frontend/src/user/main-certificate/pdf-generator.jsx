import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import config from '../../config';

/**
 * Generates a PDF from the certificate HTML and initiates download
 * @param {string} certificateId - The ID of the certificate element in DOM
 * @param {string} fileName - The name of the file to download
 */
const generateCertificatePDF = async (certificateId, fileName = 'certificate.pdf') => {
  try {
    const certificateElement = document.getElementById(certificateId);
    if (!certificateElement) {
      throw new Error('Certificate element not found');
    }

    // Create a canvas from the certificate element
    const canvas = await html2canvas(certificateElement, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Convert to image data
    const imgData = canvas.toDataURL('image/png');
    
    // A4 size in mm: 210×297
    const pdfWidth = 210;
    const pdfHeight = 297;
    
    // Calculate the dimensions to maintain aspect ratio
    const canvasRatio = canvas.height / canvas.width;
    const imgWidth = pdfWidth;
    const imgHeight = pdfWidth * canvasRatio;

    // Create PDF (A4 size)
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // If the image is taller than the page, split it across multiple pages
    if (imgHeight > pdfHeight) {
      let heightLeft = imgHeight;
      let position = 0;
      let page = 0;
      
      // Add image chunks to multiple pages
      while (heightLeft > 0) {
        // Add a new page after the first one
        if (page > 0) {
          pdf.addPage();
        }
        
        // Add image with correct positioning
        pdf.addImage(
          imgData,
          'PNG',
          0,
          position,
          imgWidth,
          imgHeight
        );
        
        heightLeft -= pdfHeight;
        position -= pdfHeight; // Move upward for next page portion
        page++;
      }
    } else {
      // Center the image on the page if it's smaller than the page height
      const yPosition = (pdfHeight - imgHeight) / 2;
      pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);
    }

    // Download the PDF
    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    throw error;
  }
};

/**
 * Validates a certificate with the backend
 * @param {string} certificateId - The unique identifier for the certificate
 * @returns {Promise<Object>} - The certificate data or error
 */
const validateCertificate = async (certificateId) => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${config.backendUrl}`;
    const response = await fetch(`${API_BASE_URL}/api/certificates/certificate/${certificateId}`);

    if (!response.ok) {
      throw new Error('Certificate validation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error validating certificate:', error);
    throw error;
  }
};

/**
 * Helper function to format date for certificate
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string or an error message
 */
const formatCertificateDate = (date) => {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) throw new Error('Invalid date');

    return dateObj.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// Export individual functions
export { generateCertificatePDF, validateCertificate, formatCertificateDate };

// Also provide a default export for backward compatibility
const certificateUtils = {
  generateCertificatePDF,
  validateCertificate,
  formatCertificateDate,
};

export default certificateUtils;