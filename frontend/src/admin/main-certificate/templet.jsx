import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './templet.css';
import config from '../../config';

const CertificateTemplate = ({ certificate }) => {
  const [studentDetails, setStudentDetails] = useState({});
  const { student, totalMarks, grade, certificateType, programName, certificateId, issueDate } = certificate;

  useEffect(() => {
    fetchStudentDetails();
  }, []);

  const fetchStudentDetails = async () => {
    try {
      const response = await axios.get(`${config.backendUrl}/api/certificates/student-certificates/${student._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setStudentDetails(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch student details', error);
    }
  };

  // Format date
  const formattedDate = new Date(issueDate).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="certificate-container">
      <div className="certificate">
        <div className="certificate-header">
          {/* <h1 className="certificate-title">Certificate of Achievement</h1> */}
          <h1 className="certificate-title">
            {certificateType === 'completion' ? 'Certificate of Achievement' : 'Certificate of Participation'}
          </h1>

          <h2 className="certificate-subtitle">This certificate is proudly presented to</h2>
        </div>

        <div className="certificate-body">
          <h2 className="student-namess">{student?.name}</h2>
          {/* <p className="certificate-description">
            has successfully completed the dev-orbit program with {grade} Grade and {totalMarks} Marks.
            Roll Number: {student?.rollNo || 'N/A'}, Branch: {student?.branch || 'N/A'}, College: {student?.college || 'N/A'}
          </p> */}
           <p className="certificate-description">
           {certificateType === 'completion' 
              ? `has successfully completed the ${programName} program with ${grade} Grade and ${totalMarks} Marks.`
              : `has participated in the ${programName} program with`}

            Roll Number: {student?.rollNo || 'N/A'}, Branch: {student?.branch || 'N/A'}, College: {student?.college || 'N/A'}
          </p>
        </div>

        <div className="certificate-footer">
          <div className="signature">
            <div className="signature-line"></div>
            <p className="signature-name">Program Director</p>
            <p className="certificate-id" style={{ marginTop: '10px' }}>Certificate ID: {certificateId}</p>
            <p className="certificate-date">Issued on: {formattedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplate;