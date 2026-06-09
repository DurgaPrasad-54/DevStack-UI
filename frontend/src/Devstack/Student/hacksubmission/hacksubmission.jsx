import { useState, useEffect } from 'react';
import { Upload, FileText, Github, Link2, Loader2, CheckCircle, AlertCircle, Users, Info, ArrowLeft } from 'lucide-react';
import config from '../../../config';
import './hacksubmission.css';
import { useHackathon } from '../context/HackathonContext';

export default function HackathonSubmissionForm() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [hackathonData, setHackathonData] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [selectedProblemStatement, setSelectedProblemStatement] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);
  
  const [formData, setFormData] = useState({
    memberContributions: {},
    projectDescription: '',
    githubRepo: '',
    liveDemoLink: '',
    documents: []
  });
  const [hasDocuments, setHasDocuments] = useState(false);

  const API_URL = `${config.backendUrl}/hacksubmission`;

  const { currentHackathonId } = useHackathon();
  const studentId = localStorage.getItem("student");
  let myTeamId = localStorage.getItem('myTeamId');

  useEffect(() => {
    fetchTeamAndInitialData();
  }, []);

  const fetchTeamAndInitialData = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!currentHackathonId || !studentId) {
        setError('Missing hackathon or student information. Please go back and select a hackathon or ensure you are registered.');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token') || '';
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (!myTeamId) {
        console.log('🔍 Fetching team ID for student:', studentId);
        const teamLookupRes = await fetch(
          `${API_URL}/student/${studentId}/team?hackathonId=${currentHackathonId}`,
          { headers }
        );
        
        if (!teamLookupRes.ok) {
          throw new Error('Failed to fetch team information');
        }
        
        const teamLookupJson = await teamLookupRes.json();
        
        if (!teamLookupJson.hasTeam) {
          setError('You are not part of any team yet. Please join or create a team first.');
          setLoading(false);
          return;
        }
        
        myTeamId = teamLookupJson.teamId;
        localStorage.setItem('myTeamId', myTeamId);
        console.log('✅ Team ID saved to localStorage:', myTeamId);
      }

      const hackathonRes = await fetch(`${API_URL}/lookup/hackathon/${currentHackathonId}`, { headers });
      if (!hackathonRes.ok) throw new Error('Failed to fetch hackathon details');
      const hackathonJson = await hackathonRes.json();
      setHackathonData(hackathonJson);

      const teamRes = await fetch(`${API_URL}/lookup/team/${myTeamId}`, { headers });
      if (!teamRes.ok) throw new Error('Failed to fetch team details');
      const teamJson = await teamRes.json();
      setTeamData(teamJson);

      const selectedPSRes = await fetch(`${API_URL}/team/${myTeamId}/selected-problem`, { headers });
      if (!selectedPSRes.ok) throw new Error('Failed to fetch selected problem statement');
      const selectedPSJson = await selectedPSRes.json();
      
      if (selectedPSJson.hasSelected) {
        setSelectedProblemStatement(selectedPSJson.problemStatement);
      }

      const statusRes = await fetch(`${API_URL}/team/${myTeamId}/submission-status`, { headers });
      if (!statusRes.ok) throw new Error('Failed to fetch submission status');
      const statusJson = await statusRes.json();
      setSubmissionStatus(statusJson);

      if (statusJson.hasSubmitted) {
        const submissionRes = await fetch(`${API_URL}/team/${myTeamId}/submission`, { headers });
        if (submissionRes.ok) {
          const submissionJson = await submissionRes.json();
          if (submissionJson.hasSubmission) {
            setExistingSubmission(submissionJson.submission);
          }
        }
      }

      const contributions = {};
      (teamJson.students || []).forEach(student => {
        contributions[student.studentId] = '';
      });
      setFormData(prev => ({ ...prev, memberContributions: contributions }));

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMemberContributionChange = (studentId, value) => {
    setFormData(prev => ({
      ...prev,
      memberContributions: {
        ...prev.memberContributions,
        [studentId]: value
      }
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) {
      setFormData(prev => ({ ...prev, documents: [] }));
      return;
    }
    
    if (files.length > 5) {
      setError('Maximum 5 files allowed');
      e.target.value = '';
      return;
    }
    
    const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Some files exceed 10MB limit');
      e.target.value = '';
      return;
    }
    
    setFormData(prev => ({ ...prev, documents: files }));
    setError('');
    console.log('✅ Files uploaded:', files.length, files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!selectedProblemStatement) {
        throw new Error('Please wait for your team lead to select a problem statement before submitting.');
      }

      if (!formData.projectDescription.trim()) {
        throw new Error('Please provide project description');
      }
      if (formData.projectDescription.trim().length < 10) {
        throw new Error('Project description must be at least 10 characters');
      }
      if (!formData.githubRepo.trim()) {
        throw new Error('GitHub repository link is required');
      }

      if (!formData.documents || formData.documents.length === 0) {
        throw new Error('At least one document must be uploaded (PDF, PPT, DOC, or ZIP)');
      }

      const allMembers = teamData.students || [];
      for (const member of allMembers) {
        if (!formData.memberContributions[member.studentId]?.trim()) {
          throw new Error(`Please describe contribution for ${member.name}`);
        }
      }

      const teamLeadId = teamData.teamLead?.studentId;
      const teamLeadContribution = formData.memberContributions[teamLeadId] || '';

      const teamMembers = allMembers
        .filter(member => member.studentId !== teamLeadId)
        .map(member => ({
          student: member.studentId,
          contribution: formData.memberContributions[member.studentId]
        }));

      const submitFormData = new FormData();
      submitFormData.append('hackathon', currentHackathonId);
      submitFormData.append('team', myTeamId);
      submitFormData.append('problemStatement', selectedProblemStatement._id);
      submitFormData.append('teamLead', teamLeadId);
      submitFormData.append('teamLeadContribution', teamLeadContribution);
      submitFormData.append('projectDescription', formData.projectDescription);
      submitFormData.append('githubRepo', formData.githubRepo);
      submitFormData.append('liveDemoLink', formData.liveDemoLink || '');
      submitFormData.append('submittedBy', teamData.teamLead.registrationId);
      submitFormData.append('teamMembers', JSON.stringify(teamMembers));

      formData.documents.forEach(file => {
        submitFormData.append('documents', file);
      });

      const response = await fetch(`${API_URL}/submit`, {
        method: 'POST',
        body: submitFormData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      setSuccess('Project submitted successfully! 🎉');
      
      await fetchTeamAndInitialData();
      
      const resetContributions = {};
      allMembers.forEach(student => {
        resetContributions[student.studentId] = '';
      });
      
      setFormData({
        memberContributions: resetContributions,
        projectDescription: '',
        githubRepo: '',
        liveDemoLink: '',
        documents: []
      });

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="studentsub-loading">
        <div className="studentsub-loading-content">
          <Loader2 className="studentsub-loading-icon" />
          <p className="studentsub-loading-text">Loading submission form...</p>
        </div>
      </div>
    );
  }

  if (submissionStatus?.hasSubmitted && existingSubmission) {
    return (
      <div className="studentsub-container">
        <div className="studentsub-wrapper">
          <div className="studentsub-card">
            <div className="studentsub-header studentsub-header-success">
              <h1 className="studentsub-header-title">
                <CheckCircle className="studentsub-button-icon" />
                Submission Completed
              </h1>
              <p className="studentsub-header-subtitle studentsub-header-subtitle-success">
                Your team has already submitted the project
              </p>
            </div>

            <div className="studentsub-content">
              <div className="studentsub-details-box studentsub-details-box-success">
                <h3 className="studentsub-details-title studentsub-details-title-success">
                  Submission Details
                </h3>
                <div className="studentsub-details-list studentsub-details-list-success">
                  <p><strong>Submitted:</strong> {new Date(existingSubmission.submittedAt).toLocaleString()}</p>
                  <p><strong>Team:</strong> {existingSubmission.team?.name}</p>
                  <p><strong>Hackathon:</strong> {existingSubmission.hackathon?.hackathonname}</p>
                </div>
              </div>

              <div className="studentsub-warning-box">
                <div className="studentsub-warning-content">
                  <AlertCircle className="studentsub-warning-icon" />
                  <div>
                    <p className="studentsub-warning-title">No Multiple Submissions Allowed</p>
                    <p className="studentsub-warning-text">
                      Your team can only submit one project per hackathon. The submission cannot be modified after submission.
                    </p>
                  </div>
                </div>
              </div>

              {existingSubmission.problemSub && (
                <div className="studentsub-details-box studentsub-details-box-info">
                  <h3 className="studentsub-details-title studentsub-details-title-info">
                    Problem Statement
                  </h3>
                  <h4 className="studentsub-problem-title">{existingSubmission.problemSub.title}</h4>
                  <p className="studentsub-problem-desc">{existingSubmission.problemSub.description}</p>
                  {existingSubmission.problemSub.technologies?.length > 0 && (
                    <div className="studentsub-tech-list">
                      {existingSubmission.problemSub.technologies.map((tech, idx) => (
                        <span key={idx} className="studentsub-tech-tag">{tech}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="studentsub-info-box">
                <h3 className="studentsub-info-box-title">Project Description</h3>
                <p className="studentsub-info-text">
                  {existingSubmission.projectDescription}
                </p>
              </div>

              <div className="studentsub-links-grid">
                <div className="studentsub-link-box">
                  <h3>
                    <Github className="studentsub-label-icon" />
                    GitHub Repository
                  </h3>
                  <a 
                    href={existingSubmission.githubRepo} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="studentsub-link"
                  >
                    {existingSubmission.githubRepo}
                  </a>
                </div>
                {existingSubmission.liveDemoLink && (
                  <div className="studentsub-link-box">
                    <h3>
                      <Link2 className="studentsub-label-icon" />
                      Live Demo
                    </h3>
                    <a 
                      href={existingSubmission.liveDemoLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="studentsub-link"
                    >
                      {existingSubmission.liveDemoLink}
                    </a>
                  </div>
                )}
              </div>

              <div className="studentsub-contributions">
                <h3 className="studentsub-section-header">
                  <Users className="studentsub-section-icon" />
                  Team Contributions
                </h3>
                
                {existingSubmission.teamLead && (
                  <div className="studentsub-contribution-display studentsub-contribution-display-lead">
                    <div className="studentsub-contribution-header">
                      <h4 className="studentsub-contribution-name">
                        {existingSubmission.teamLead.student?.name}
                      </h4>
                      <span className="studentsub-contribution-role">Team Lead</span>
                    </div>
                    <p className="studentsub-contribution-roll">{existingSubmission.teamLead.student?.rollNo}</p>
                    <p className="studentsub-contribution-text">{existingSubmission.teamLead.contribution}</p>
                  </div>
                )}

                {existingSubmission.teamMembers?.map((member, idx) => (
                  <div key={idx} className="studentsub-contribution-display studentsub-contribution-display-member">
                    <h4 className="studentsub-contribution-name">{member.student?.name}</h4>
                    <p className="studentsub-contribution-roll">{member.student?.rollNo}</p>
                    <p className="studentsub-contribution-text">{member.contribution}</p>
                  </div>
                ))}
              </div>

              {existingSubmission.documents?.length > 0 && (
                <div className="studentsub-documents">
                  <h3 className="studentsub-section-header">
                    <FileText className="studentsub-section-icon" />
                    Uploaded Documents ({existingSubmission.documents.length})
                  </h3>
                  <div className="studentsub-doc-list">
                    {existingSubmission.documents.map((doc, idx) => (
                      <div key={idx} className="studentsub-doc-item">
                        <FileText className="studentsub-doc-icon" />
                        <span className="studentsub-doc-name">{doc.filename}</span>
                        <span className="studentsub-doc-date">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="studentsub-divider">
                <button
                  onClick={() => window.history.back()}
                  className="studentsub-button studentsub-button-secondary"
                >
                  <ArrowLeft className="studentsub-button-icon" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="studentsub-container">
      <div className="studentsub-wrapper">
        <div className="studentsub-card">
          <div className="studentsub-header">
            <h1 className="studentsub-header-title">Project Submission</h1>
            <p className="studentsub-header-subtitle">Submit your hackathon project</p>
          </div>

          <div className="studentsub-info-section">
            <div className="studentsub-info-grid">
              <div className="studentsub-info-item">
                <h3>Hackathon</h3>
                <p>{hackathonData?.hackathonname || 'N/A'}</p>
              </div>
              <div className="studentsub-info-item">
                <h3>Team</h3>
                <p>{teamData?.name || 'N/A'}</p>
              </div>
            </div>

            {teamData?.teamLead && (
              <div className="studentsub-team-card">
                <h4 className="studentsub-team-header">
                  <Users className="studentsub-label-icon" />
                  Team Lead
                </h4>
                <p className="studentsub-team-lead-name">{teamData.teamLead.name}</p>
                <p className="studentsub-team-lead-email">{teamData.teamLead.email}</p>
                <p className="studentsub-team-lead-info">
                  {teamData.teamLead.rollNo} • {teamData.teamLead.branch}
                </p>
              </div>
            )}

            {teamData?.students && teamData.students.length > 0 && (
              <div className="studentsub-team-card">
                <h4 className="studentsub-team-header">
                  <Users className="studentsub-label-icon" />
                  All Team Members ({teamData.students.length})
                </h4>
                <div className="studentsub-members-list">
                  {teamData.students.map((student) => (
                    <div key={student.studentId} className="studentsub-member-item">
                      <div>
                        <p className="studentsub-member-name">
                          {student.name}
                          {student.studentId === teamData.teamLead?.studentId && (
                            <span className="studentsub-lead-badge">Lead</span>
                          )}
                        </p>
                        <p className="studentsub-member-details">
                          {student.rollNo} • {student.branch}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="studentsub-alert studentsub-alert-error">
              <AlertCircle className="studentsub-alert-icon studentsub-alert-icon-error" />
              <p className="studentsub-alert-text studentsub-alert-text-error">{error}</p>
            </div>
          )}

          {success && (
            <div className="studentsub-alert studentsub-alert-success">
              <CheckCircle className="studentsub-alert-icon studentsub-alert-icon-success" />
              <p className="studentsub-alert-text studentsub-alert-text-success">{success}</p>
            </div>
          )}

          <div className="studentsub-content">
            <div className="studentsub-form-section">
              <div className="studentsub-form-group">
                <label className="studentsub-label">
                  Problem Statement <span className="studentsub-required">*</span>
                </label>

                {!selectedProblemStatement ? (
                  <div className="studentsub-alert studentsub-alert-warning">
                    <AlertCircle className="studentsub-alert-icon studentsub-alert-icon-warning" />
                    <div>
                      <p className="studentsub-alert-text studentsub-alert-text-warning">
                        <strong>No problem statement selected</strong>
                      </p>
                      <p className="studentsub-alert-text studentsub-alert-text-warning">
                        Your team lead needs to select a problem statement before you can submit. Please contact your team lead.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="studentsub-problem-box">
                    <div className="studentsub-problem-header">
                      <div className="studentsub-problem-content">
                        <h4 className="studentsub-problem-title">{selectedProblemStatement.title}</h4>
                        <p className="studentsub-problem-desc">{selectedProblemStatement.description}</p>
                        {selectedProblemStatement.mentor && (
                          <p className="studentsub-problem-mentor">
                            <strong>Mentor:</strong> {selectedProblemStatement.mentor.name} ({selectedProblemStatement.mentor.email})
                          </p>
                        )}
                        {selectedProblemStatement.technologies && selectedProblemStatement.technologies.length > 0 && (
                          <div className="studentsub-tech-list">
                            {selectedProblemStatement.technologies.map((tech, idx) => (
                              <span key={idx} className="studentsub-tech-tag">{tech}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <CheckCircle className="studentsub-problem-check" />
                    </div>
                  </div>
                )}
              </div>

              {submissionStatus && !submissionStatus.canSubmit && !submissionStatus.hasSubmitted && (
                <div className="studentsub-alert studentsub-alert-warning">
                  <Info className="studentsub-alert-icon studentsub-alert-icon-warning" />
                  <p className="studentsub-alert-text studentsub-alert-text-warning">{submissionStatus.message}</p>
                </div>
              )}

              <div className="studentsub-divider">
                <h3 className="studentsub-section-header">
                  <Users className="studentsub-section-icon" />
                  Team Member Contributions
                </h3>
                <p className="studentsub-section-desc">
                  Describe what each team member contributed to the project
                </p>

                <div>
                  {teamData?.students && teamData.students.map((member) => {
                    const isTeamLead = member.studentId === teamData.teamLead?.studentId;
                    return (
                      <div key={member.studentId} className="studentsub-contribution-card">
                        <label className="studentsub-contribution-label">
                          {member.name}'s Contribution
                          {isTeamLead && (
                            <span className="studentsub-lead-badge">Team Lead</span>
                          )}
                          <span className="studentsub-required"> *</span>
                        </label>
                        <p className="studentsub-contribution-member">
                          {member.rollNo} • {member.branch}
                        </p>
                        <textarea
                          value={formData.memberContributions[member.studentId] || ''}
                          onChange={(e) => handleMemberContributionChange(member.studentId, e.target.value)}
                          required
                          rows={3}
                          placeholder={`Describe what ${member.name} contributed to the project...`}
                          className="studentsub-textarea"
                          disabled={!selectedProblemStatement || submissionStatus?.hasSubmitted}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="studentsub-form-group">
                <label className="studentsub-label">
                  Project Description <span className="studentsub-required">*</span>
                </label>
                <textarea
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  placeholder="Provide a detailed description of your project (minimum 10 characters)..."
                  className="studentsub-textarea"
                  disabled={!selectedProblemStatement || submissionStatus?.hasSubmitted}
                />
                <p className="studentsub-char-count">
                  {formData.projectDescription.length} characters
                </p>
              </div>

              <div className="studentsub-form-group">
                <label className="studentsub-label">
                  <Github className="studentsub-label-icon" />
                  GitHub Repository <span className="studentsub-required">*</span>
                </label>
                <input
                  type="url"
                  name="githubRepo"
                  value={formData.githubRepo}
                  onChange={handleInputChange}
                  required
                  placeholder="https://github.com/username/repo"
                  className="studentsub-input"
                  disabled={!selectedProblemStatement || submissionStatus?.hasSubmitted}
                />
              </div>

              <div className="studentsub-form-group">
                <label className="studentsub-label">
                  <Link2 className="studentsub-label-icon" />
                  Live Demo Link (Optional)
                </label>
                <input
                  type="url"
                  name="liveDemoLink"
                  value={formData.liveDemoLink}
                  onChange={handleInputChange}
                  placeholder="https://your-demo-link.com"
                  className="studentsub-input"
                  disabled={!selectedProblemStatement || submissionStatus?.hasSubmitted}
                />
              </div>

              <div className="studentsub-form-group">
                <label className="studentsub-label">
                  <Upload className="studentsub-label-icon" />
                  Upload Documents <span className="studentsub-required">*</span>
                </label>

                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  required
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.zip"
                  className="studentsub-file-input"
                  disabled={!selectedProblemStatement || submissionStatus?.hasSubmitted}
                />
                <p className="studentsub-file-hint">
                  <strong>Required:</strong> At least 1 file must be uploaded. Max 5 files. Allowed: PDF, PPT, DOC, ZIP (max 10MB each)
                </p>

                {formData.documents && formData.documents.length > 0 && (
                  <div className="studentsub-file-preview">
                    <p className="studentsub-file-success">
                      <CheckCircle className="studentsub-label-icon" />
                      {formData.documents.length} file{formData.documents.length > 1 ? 's' : ''} selected
                    </p>
                    {formData.documents.map((file, idx) => (
                      <div key={idx} className="studentsub-file-item">
                        <FileText className="studentsub-file-icon" />
                        <span className="studentsub-file-name">{file.name}</span>
                        <span className="studentsub-file-size">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {(!formData.documents || formData.documents.length === 0) && (
                  <div className="studentsub-alert studentsub-alert-error" style={{ marginTop: '0.75rem' }}>
                    <AlertCircle className="studentsub-alert-icon studentsub-alert-icon-error" />
                    <p className="studentsub-alert-text studentsub-alert-text-error" style={{ fontSize: '0.75rem' }}>
                      No documents uploaded yet. You must upload at least one document to submit your project.
                    </p>
                  </div>
                )}
              </div>

              <div className="studentsub-divider">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    submitting || 
                    !selectedProblemStatement || 
                    submissionStatus?.hasSubmitted || 
                    !formData.documents || 
                    formData.documents.length === 0
                  }
                  className="studentsub-button"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="studentsub-button-icon" style={{ animation: 'spin 1s linear infinite' }} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="studentsub-button-icon" />
                      Submit Project
                    </>
                  )}
                </button>
                
                {!selectedProblemStatement && (
                  <p className="studentsub-button-hint studentsub-button-hint-warning">
                    Button will be enabled once your team selects a problem statement
                  </p>
                )}
                {selectedProblemStatement && (!formData.documents || formData.documents.length === 0) && (
                  <p className="studentsub-button-hint studentsub-button-hint-error">
                    <AlertCircle className="studentsub-label-icon" />
                    Please upload at least one document to enable submission
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}