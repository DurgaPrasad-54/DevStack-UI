import React, { useState, useEffect } from 'react';
import { ExternalLink, Download } from 'lucide-react';
import './studentReport.css';
import config from '../../config';

const StudentReport = ({ studentId }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userid = localStorage.getItem('student');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`${config.backendUrl}/api/submissions/report/${userid}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch report');
        }
        
        const data = await response.json();
        setReport(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [studentId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadReport = () => {
    const csvContent = [
      ['Task Title', 'Description', 'GitHub Link', 'Marks', 'Submission Date', 'Status'],
      ...report.submissions.map(sub => [
        sub.taskTitle,
        sub.taskDescription,
        sub.githubLink,
        sub.marks,
        formatDate(sub.submissionDate),
        sub.submissionStatus
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submission-report-${studentId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div>
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-container">
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container">
      <div className="report-header">
        <div className="report-title">
          <h2>Submission Report</h2>
          <p>Total Submissions: {report.totalSubmissions} | Average Marks: {report.averageMarks.toFixed(2)}</p>
        </div>
        <button onClick={downloadReport} className="export-button">
          <Download size={16} />
          Export CSV
        </button>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Description</th>
              <th>GitHub Link</th>
              <th>Marks</th>
              <th>Submitted On</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {report.submissions.map((submission) => (
              <tr key={submission.submissionId}>
                <td>{submission.taskTitle}</td>
                <td className="description-cell">{submission.taskDescription}</td>
                <td>
                  <a href={submission.githubLink} target="_blank" rel="noopener noreferrer" className="github-link">
                    <ExternalLink size={16} />
                    View Code
                  </a>
                </td>
                <td>{submission.marks || 'Not graded'}</td>
                <td>{formatDate(submission.submissionDate)}</td>
                <td>
                  <span className={`status-badge ${submission.submissionStatus.toLowerCase()}`}>
                    {submission.submissionStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentReport;