import { useState, useEffect } from 'react';
import config from '../../../config';
import './teams.css';

function TeamManagement() {
  const [hackathons, setHackathons] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [originalTeamMembers, setOriginalTeamMembers] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState('');
  const [teams, setTeams] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [originalStudentsData, setOriginalStudentsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [teamSearchText, setTeamSearchText] = useState(''); // New state for team search
  const [teamBranchFilter, setTeamBranchFilter] = useState(''); // NEW: filter teams by branch
  const [teamSizeLimits, setTeamSizeLimits] = useState({ minTeam: 1, maxTeam: 4 });
  const [coordinatorYear] = useState(localStorage.getItem('coordinatoryear') || '');
const [coordinatorCollege] = useState(localStorage.getItem('coordinatordetails') || '');
  console.log(teamSizeLimits);

  useEffect(() => {
    fetchHackathons();
    fetchBranches();
  }, []);

   useEffect(() => {
    if (selectedHackathon) {
      fetchStudents();
      fetchMentors();
      fetchTeams();
      updateTeamSizeLimits();
    } else {
      setStudents([]);
      setMentors([]);
      setTeams([]);
      setTeamSizeLimits({ minTeam: 1, maxTeam: 4 });
    }
  }, [selectedHackathon, selectedBranch, editingTeam]);

  useEffect(() => {
    if (editingTeam && selectedHackathon) {
      fetchStudents();
    }
  }, [editingTeam]);

  useEffect(() => {
    setSearchText('');
  }, [editingTeam, formKey]);
  const updateTeamSizeLimits = async () => {
    try {
      // If no hackathon selected, use defaults
      if (!selectedHackathon) {
        setTeamSizeLimits({ minTeam: 1, maxTeam: 4 });
        return;
      }

      // Prefer authoritative source: fetch hackathon details from backend
      const res = await fetch(`${config.backendUrl}/hackathon/${selectedHackathon}`);
      if (!res.ok) {
        console.warn('Failed to fetch hackathon details, falling back to local list', res.status);
        // fallback to previously-loaded hackathons if available
        const hackathon = hackathons.find(h => (h._id || h.id) === selectedHackathon);
        if (hackathon) {
          setTeamSizeLimits({
            minTeam: hackathon.minteam || hackathon.minTeam || 1,
            maxTeam: hackathon.maxteam || hackathon.maxTeam || 4
          });
        } else {
          setTeamSizeLimits({ minTeam: 1, maxTeam: 4 });
        }
        return;
      }

      const data = await res.json();
      // backend uses minteam/maxteam in Hackathon model
      setTeamSizeLimits({
        minTeam: data.minteam || data.minTeam || 1,
        maxTeam: data.maxteam || data.maxTeam || 4
      });
    } catch (err) {
      console.error('Error updating team size limits:', err);
      // fallback to defaults
      setTeamSizeLimits({ minTeam: 1, maxTeam: 4 });
    }
  };

  // ========== FETCHERS ==========
  // const fetchHackathons = async () => {
  //   try {
  //     const res = await fetch(`${config.backendUrl}/hackteams/hackathons/all`);
  //     const data = await res.json();
  //     setHackathons(data || []);
  //   } catch (err) {
  //     console.error('Error fetching hackathons:', err);
  //     setError('Failed to fetch hackathons');
  //     setHackathons([]);
  //   }
  // };
 const fetchHackathons = async () => {
  try {
    // FIXED: Use 'year' and 'college' as param names to match backend expectations
    const queryParams = new URLSearchParams();
    if (coordinatorYear) queryParams.append('year', coordinatorYear);
    if (coordinatorCollege) queryParams.append('college', coordinatorCollege);
    
    const url = `${config.backendUrl}/hackteams/hackathons?${queryParams.toString()}`;
    console.log('Fetching hackathons:', url);
    console.log('Coordinator details:', { year: coordinatorYear, college: coordinatorCollege });
    
    const res = await fetch(url);
    const data = await res.json();
    
    console.log('Hackathons API response:', data);
    
    // FIXED: Handle the new response structure
    if (data.success && Array.isArray(data.data)) {
      setHackathons(data.data);
      console.log(`Loaded ${data.data.length} hackathons for ${coordinatorCollege} - ${coordinatorYear}`);
    } else {
      setHackathons([]);
      console.warn('No hackathons found or invalid response');
    }
  } catch (err) {
    console.error('Error fetching hackathons:', err);
    setError('Failed to fetch hackathons');
    setHackathons([]);
  }
};

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${config.backendUrl}/hackteams/branches/all`);
      const data = await res.json();
      setBranches(data || []);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  // const fetchStudents = async () => {
  //   try {
  //     const editParam = editingTeam ? `&editingTeamId=${editingTeam._id}` : '';
  //     const url = `${config.backendUrl}/hackteams/students/search?hackathonId=${selectedHackathon}${selectedBranch ? `&branch=${selectedBranch}` : ''}${editParam}`;
  //     const res = await fetch(url);
  //     const data = await res.json();
  //     const studentsArray = Array.isArray(data) ? data : [];
  //     setStudents(studentsArray);
  //     setOriginalStudentsData(studentsArray);
  //   } catch (err) {
  //     console.error('Error fetching students:', err);
  //     setError('Failed to fetch students');
  //   }
  // };
const fetchStudents = async () => {
  try {
    const editParam = editingTeam ? `&editingTeamId=${editingTeam._id}` : '';
    const branchParam = selectedBranch ? `&branch=${selectedBranch}` : '';
    
    // FIXED: Add coordinator year and college params
    const coordinatorParams = new URLSearchParams();
    if (coordinatorYear) coordinatorParams.append('coordinatorYear', coordinatorYear);
    if (coordinatorCollege) coordinatorParams.append('coordinatorCollege', coordinatorCollege);
    
    const url = `${config.backendUrl}/hackteams/students/search?hackathonId=${selectedHackathon}${branchParam}${editParam}&${coordinatorParams.toString()}`;
    console.log('Fetching students:', url);
    
    const res = await fetch(url);
    const data = await res.json();
    const studentsArray = Array.isArray(data) ? data : [];
    
    console.log(`Loaded ${studentsArray.length} students for ${coordinatorCollege} - ${coordinatorYear}`);
    
    setStudents(studentsArray);
    setOriginalStudentsData(studentsArray);
  } catch (err) {
    console.error('Error fetching students:', err);
    setError('Failed to fetch students');
  }
};

// Add a check at the beginning of your component render
if (!coordinatorYear || !coordinatorCollege) {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: '#fef2f2',
        borderRadius: 8,
        border: '1px solid #fecaca'
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>
          Missing Coordinator Information
        </h2>
        <p style={{ color: '#991b1b' }}>
          Please log in again to access team management.
        </p>
      </div>
    </div>
  );
}
  const fetchMentors = async () => {
    try {
      const res = await fetch(`${config.backendUrl}/hackteams/mentors/search?hackathonId=${selectedHackathon}`);
      const data = await res.json();
      setMentors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching mentors:', err);
      setError('Failed to fetch mentors');
    }
  };

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${config.backendUrl}/hackteams/teams?hackathonId=${selectedHackathon}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setTeams(data);
      } else if (data && Array.isArray(data.teams)) {
        setTeams(data.teams);
      } else {
        setTeams([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setTeams([]);
      setLoading(false);
      setError('Failed to fetch teams');
    }
  };

  // ========== VALIDATION HELPERS ==========
  const getStudentId = (student) => {
    if (!student) return null;
    return student.studentId || student.registrationId || student._id || student.id;
  };

  const isTeamNameDuplicate = (name) => {
    if (!name || !name.trim()) return false;
    const normalized = name.trim().toLowerCase();
    return teams.some(t => {
      if (!t || !t.name) return false;
      if (editingTeam && (t._id === editingTeam._id || t.id === editingTeam.id)) return false;
      return (t.name || '').trim().toLowerCase() === normalized;
    });
  };

  const isStudentInCurrentTeam = (studentId) => {
    if (!editingTeam || !studentId) return false;
    const currentTeamStudentIds = (editingTeam.students || []).map(s => 
      typeof s === 'string' ? s : getStudentId(s)
    );
    return currentTeamStudentIds.includes(studentId);
  };

  const isOriginalMember = (studentId) => {
    return originalTeamMembers.includes(studentId);
  };

  const isStudentSelectable = (student) => {
    if (!student) return false;
    const studentId = getStudentId(student);
    
    if (!student.inTeam) return true;
    
    if (editingTeam && isStudentInCurrentTeam(studentId)) return true;
    
    return false;
  };

  const isStudentInAnotherTeam = (student) => {
    if (!student || !student.inTeam) return false;
    
    if (editingTeam) {
      const studentId = getStudentId(student);
      return !isStudentInCurrentTeam(studentId);
    }
    
    return true;
  };

  const toggleStudentSelection = (studentId) => {
    const student = students.find(s => getStudentId(s) === studentId);
    if (!student) return;
    
    const isSelectable = isStudentSelectable(student);
    const isCurrentlySelected = selectedStudents.includes(studentId);
    
    if (isCurrentlySelected) {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
      
      if (editingTeam && !isOriginalMember(studentId)) {
        setStudents(prevStudents => 
          prevStudents.map(s => 
            getStudentId(s) === studentId 
              ? { ...s, inTeam: false }
              : s
          )
        );
      }
      return;
    }
    
    if (selectedStudents.includes(studentId)) {
      alert('This student is already selected for this team.');
      return;
    }
    
    if (!isSelectable) {
      alert('This student is already in another team and cannot be selected.');
      return;
    }
    
    if (selectedStudents.length >= teamSizeLimits.maxTeam) {
      alert(`Team size cannot exceed ${teamSizeLimits.maxTeam} members. Please deselect a student first.`);
      return;
    }
    
    setSelectedStudents(prev => [...prev, studentId]);
    
    if (editingTeam) {
      setStudents(prevStudents => 
        prevStudents.map(s => 
          getStudentId(s) === studentId 
            ? { ...s, inTeam: true }
            : s
        )
      );
    }
  };

  const validateTeamData = () => {
    const errors = [];

    if (!teamName.trim()) {
      errors.push('Team name is required');
    }

    if (isTeamNameDuplicate(teamName)) {
      errors.push('A team with this name already exists for this hackathon');
    }

    if (selectedStudents.length < teamSizeLimits.minTeam) {
      errors.push(`Please select at least ${teamSizeLimits.minTeam} student`);
    }

    if (selectedStudents.length > teamSizeLimits.maxTeam) {
      errors.push(`Team size cannot exceed ${teamSizeLimits.maxTeam} members`);
    }

    const uniqueStudents = new Set(selectedStudents);
    if (uniqueStudents.size !== selectedStudents.length) {
      errors.push('Duplicate students detected. Each student can only be added once to a team');
    }

    if (!selectedMentor) {
      errors.push('Please select a mentor');
    }

    const invalidStudents = selectedStudents
      .map(id => originalStudentsData.find(s => getStudentId(s) === id))
      .filter(s => {
        if (!s || !s.inTeam) return false;
        
        if (editingTeam) {
          const studentId = getStudentId(s);
          const isInCurrentTeam = isStudentInCurrentTeam(studentId);
          return !isInCurrentTeam;
        }
        
        return true;
      });

    if (invalidStudents.length > 0) {
      const invalidNames = invalidStudents.map(s => s.name).join(', ');
      errors.push(`The following student(s) are already in another team: ${invalidNames}`);
    }

    return errors;
  };

  // ========== RESET FORM WITH REFRESH ==========
  const resetForm = () => {
    setTeamName('');
    setSelectedStudents([]);
    setSelectedMentor('');
    setEditingTeam(null);
    setOriginalTeamMembers([]);
    setError('');
    setFormKey(prev => prev + 1);
    setSearchText('');
  };

  // ========== CREATE ==========
  const createTeam = async () => {
    setError('');
    
    const validationErrors = validateTeamData();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      alert(validationErrors.join('\n'));
      return;
    }

    const payload = {
      teamName: teamName.trim(),
      hackathonId: selectedHackathon,
      studentIds: selectedStudents,
      mentorId: selectedMentor || null,
    };

    try {
      setLoading(true);
      const res = await fetch(`${config.backendUrl}/hackteams/teams/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.message || data.error || 'Failed to create team';
        throw new Error(errorMsg);
      }

      alert('Team created successfully!');
      
      resetForm();
      
      await fetchStudents();
      await fetchTeams();
    } catch (err) {
      console.error('Create team error:', err);
      setError(err.message || 'Failed to create team');
      alert(`Error: ${err.message || 'Failed to create team'}`);
    } finally {
      setLoading(false);
    }
  };

  // ========== EDIT ==========
  // const editTeam = async (team) => {
  //   if (!team) return;

  //   setEditingTeam(team);
  //   setTeamName(team.name || '');
  //   setSelectedMentor(team.mentor?._id || team.mentor?.id || '');
  //   setError('');
  //   setFormKey(prev => prev + 1);

  //   try {
  //     setLoading(true);
  //     const editParam = `&editingTeamId=${team._id || team.id}`;
  //     const studentsUrl = `${config.backendUrl}/hackteams/students/search?hackathonId=${selectedHackathon}${
  //       selectedBranch ? `&branch=${selectedBranch}` : ''
  //     }${editParam}`;
  //     const studentsRes = await fetch(studentsUrl);
  //     const studentsData = await studentsRes.json();

  //     const teamStudentIds = (team.students || []).map((s) => getStudentId(s));

  //     setOriginalTeamMembers(teamStudentIds);
  //     setStudents(Array.isArray(studentsData) ? studentsData : []);
  //     setSelectedStudents(teamStudentIds);
  //   } catch (err) {
  //     console.error('Error preparing edit mode:', err);
  //     setError('Failed to load edit data');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const editTeam = async (team) => {
  if (!team) return;

  setEditingTeam(team);
  setTeamName(team.name || '');
  setSelectedMentor(team.mentor?._id || team.mentor?.id || '');
  setError('');
  setFormKey(prev => prev + 1);

  try {
    setLoading(true);
    const editParam = `&editingTeamId=${team._id || team.id}`;
    const branchParam = selectedBranch ? `&branch=${selectedBranch}` : '';
    
    // FIXED: Add coordinator params
    const coordinatorParams = new URLSearchParams();
    if (coordinatorYear) coordinatorParams.append('coordinatorYear', coordinatorYear);
    if (coordinatorCollege) coordinatorParams.append('coordinatorCollege', coordinatorCollege);
    
    const studentsUrl = `${config.backendUrl}/hackteams/students/search?hackathonId=${selectedHackathon}${branchParam}${editParam}&${coordinatorParams.toString()}`;
    const studentsRes = await fetch(studentsUrl);
    const studentsData = await studentsRes.json();

    const teamStudentIds = (team.students || []).map((s) => getStudentId(s));

    setOriginalTeamMembers(teamStudentIds);
    setStudents(Array.isArray(studentsData) ? studentsData : []);
    setSelectedStudents(teamStudentIds);
  } catch (err) {
    console.error('Error preparing edit mode:', err);
    setError('Failed to load edit data');
  } finally {
    setLoading(false);
  }
};

  // ========== UPDATE ==========
  const updateTeam = async () => {
    if (!editingTeam) {
      alert('No team selected for update');
      return;
    }

    setError('');
    
    const validationErrors = validateTeamData();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      alert(validationErrors.join('\n'));
      return;
    }

    const payload = {
      teamName: teamName.trim(),
      hackathonId: selectedHackathon,
      studentIds: selectedStudents,
      mentorId: selectedMentor || null,
    };

    try {
      setLoading(true);
      const res = await fetch(`${config.backendUrl}/hackteams/teams/${editingTeam._id || editingTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || data.message || 'Failed to update team';
        throw new Error(errMsg);
      }

      alert('Team updated successfully!');
      
      resetForm();
      
      await fetchStudents();
      await fetchTeams();
    } catch (err) {
      console.error('Update team error:', err);
      setError(err.message || 'Failed to update team');
      alert(err.message || 'Failed to update team');
    } finally {
      setLoading(false);
    }
  };

  // ========== DELETE ==========
  const deleteTeam = async (teamId) => {
    if (!teamId) return;
    if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) return;

    try {
      setLoading(true);
      const res = await fetch(`${config.backendUrl}/hackteams/teams/${teamId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonId: selectedHackathon }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || data.message || 'Failed to delete team';
        throw new Error(msg);
      }

      alert('Team deleted successfully!');
      
      if (editingTeam && (editingTeam._id === teamId || editingTeam.id === teamId)) {
        resetForm();
      }
      
      await fetchStudents();
      await fetchTeams();
    } catch (err) {
      console.error('Delete team error:', err);
      alert(err.message || 'Failed to delete team');
    } finally {
      setLoading(false);
    }
  };

  // Student search filter
  const filteredStudents = searchText
    ? students.filter(st =>
        (st.name && st.name.toLowerCase().includes(searchText.trim().toLowerCase())) ||
        (st.rollNo && st.rollNo.toLowerCase().includes(searchText.trim().toLowerCase()))
      )
    : students;

  // Team search filter - NEW
  // Apply branch filter first, then optional search
  const filteredTeams = teams
    .filter(team => {
      if (!teamBranchFilter) return true;
      // team.students contains populated student objects (from backend)
      const teamBranches = (team.students || []).map(s => (typeof s === 'string' ? '' : (s.branch || ''))).filter(Boolean);
      return teamBranches.includes(teamBranchFilter);
    })
    .filter(team => {
      if (!teamSearchText || teamSearchText.trim() === '') return true;
      const searchLower = teamSearchText.trim().toLowerCase();

      if (team.name && team.name.toLowerCase().includes(searchLower)) return true;

      if (team.students && Array.isArray(team.students)) {
        return team.students.some(student => {
          if (typeof student === 'string') return false;
          if (student.name && student.name.toLowerCase().includes(searchLower)) return true;
          if (student.rollNo && student.rollNo.toLowerCase().includes(searchLower)) return true;
          if (student.email && student.email.toLowerCase().includes(searchLower)) return true;
          return false;
        });
      }

      return false;
    });

  // ========== RENDER ==========
  return (
    <div className="teams-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ marginBottom: '30px', color: '#1a1a1a' }}>Team Management</h1>

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #fcc',
          fontSize: '14px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Hackathon selector */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>Select Hackathon</h2>
        <select
          onChange={e => {
            setSelectedHackathon(e.target.value);
            setSelectedBranch('');
            resetForm();
          }}
          value={selectedHackathon}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '15px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          <option value="">-- Select Hackathon --</option>
          {hackathons.map(h => (
            <option key={h._id || h.id} value={h._id || h.id}>
              {h.hackathonname || h.name} {h.status ? `(${h.status})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedHackathon && (
        <>
          {/* Branch filter */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#333' }}>Filter by Branch (Optional)</h3>
            <select
              onChange={e => {
                setSelectedBranch(e.target.value);
                resetForm();
              }}
              value={selectedBranch}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '15px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>

          {/* Form card with key for forced refresh */}
          <div 
            key={formKey}
            style={{
              border: '1px solid #e0e0e0',
              padding: '24px',
              borderRadius: '8px',
              marginBottom: '30px',
              backgroundColor: '#fafafa'
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1a1a1a' }}>
              {editingTeam ? 'Edit Team' : 'Create New Team'}
            </h3>

            {editingTeam && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fff3cd',
                color: '#856404',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '14px',
                border: '1px solid #ffeaa7'
              }}>
                <strong>Editing Mode:</strong> Green badges show original team members. Blue badges show currently selected students. Red badges indicate students in other teams.
              </div>
            )}

            {/* Team name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                Team Name <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Enter team name"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
              />
              {teamName && isTeamNameDuplicate(teamName) && (
                <div style={{ color: '#d32f2f', fontSize: '13px', marginTop: '6px' }}>
                   This team name already exists
                </div>
              )}
            </div>

            {/* Students selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#333' }}>
                Select Students <span style={{ color: '#d32f2f' }}>*</span>
                <span style={{ 
                  marginLeft: '10px',
                  fontWeight: 'normal',
                  color: selectedStudents.length > teamSizeLimits.maxTeam ? '#d32f2f' : '#666',
                  fontSize: '14px'
                }}>
                  ({selectedStudents.length}/{teamSizeLimits.maxTeam} selected)
                </span>
              </label>

              {/* Student search bar inside selection container */}
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="Search by name or roll number"
                  style={{
                    padding: '8px',
                    fontSize: '15px',
                    borderRadius: '6px',
                    border: '1px solid #c0c0c0',
                    width: '220px',
                    marginRight: '8px'
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setSearchText('')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#aaa',
                    color: '#fff',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
                <span style={{ marginLeft: 16, color: '#1976d2', fontWeight: 600 }}>
                  Showing {filteredStudents.length} of {students.length} students
                </span>
              </div>

              {selectedStudents.length > teamSizeLimits.maxTeam && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#ffebee',
                  color: '#d32f2f',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '10px',
                  border: '1px solid #ffcdd2'
                }}>
                  ⚠️ Maximum team size is {teamSizeLimits.maxTeam} members. Please deselect {selectedStudents.length - teamSizeLimits.maxTeam} student(s).
                </div>
              )}
              {(() => {
                const uniqueStudents = new Set(selectedStudents);
                const hasDuplicates = uniqueStudents.size !== selectedStudents.length;
                if (hasDuplicates) {
                  return (
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: '#ffebee',
                      color: '#d32f2f',
                      borderRadius: '4px',
                      fontSize: '13px',
                      marginBottom: '10px',
                      border: '1px solid #ffcdd2'
                    }}>
                      ⚠️ Duplicate students detected! Each student can only be added once to a team.
                    </div>
                  );
                }
                return null;
              })()}
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: '6px',
                padding: '12px',
                backgroundColor: 'white'
              }}>
                {students.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                    No students available for this hackathon
                  </p>
                ) : (
                  filteredStudents.map(st => {
                    const studentId = getStudentId(st);
                    const isSelected = selectedStudents.includes(studentId);
                    const isOriginal = isOriginalMember(studentId);
                    const selectable = isStudentSelectable(st);
                    const isInOtherTeam = isStudentInAnotherTeam(st);

                    return (
                      <div
                        className="student-select-card"
                        key={studentId}
                        onClick={() => toggleStudentSelection(studentId)}
                        style={{
                          padding: '16px',
                          marginBottom: '10px',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid #1976d2' : '1px solid #eee',
                          cursor: 'pointer',
                          opacity: isInOtherTeam && !isSelected ? 0.5 : 1,
                          backgroundColor: isSelected ? '#e3f2fd' : 'white',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 2px 8px rgba(25, 118, 210, 0.15)' : 'none',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (selectable || isSelected) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = isSelected ? '0 2px 8px rgba(25, 118, 210, 0.15)' : 'none';
                        }}
                      >
                        <div className="student-card-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', minHeight: '60px' }}>
                          {/* Left side: Student Info */}
                          <div className="student-card-info" style={{ flex: 1, minWidth: 0 }}>
                            <div className="student-name-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <strong className="student-name" style={{ fontSize: '16px', color: '#1a1a1a' }}>{st.name}</strong>
                              {st.rollNo && (
                                <span className="student-details" style={{ 
                                  fontSize: '13px', 
                                  color: '#666',
                                  padding: '3px 10px',
                                  backgroundColor: '#f5f5f5',
                                  borderRadius: '4px'
                                }}>
                                  {st.rollNo} ({st.email})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right side: Badges */}
                          <div className="student-badges-container" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {editingTeam && isOriginal && (
                              <span style={{
                                padding: '6px 14px',
                                backgroundColor: '#4caf50',
                                color: 'white',
                                borderRadius: '16px',
                                fontSize: '12px',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)',
                                whiteSpace: 'nowrap'
                              }}>
                                CURRENT MEMBER
                              </span>
                            )}
                            
                            {isSelected && (
                              <span style={{
                                padding: '8px 18px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                borderRadius: '24px',
                                fontSize: '13px',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 3px 6px rgba(25, 118, 210, 0.4)'
                              }}>
                                SELECTED
                              </span>
                            )}
                            
                            {isInOtherTeam && !isSelected && (
                              <span style={{
                                padding: '8px 14px',
                                display: 'inline-flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#d32f2f',
                                backgroundColor: '#ffebee',
                                fontSize: '13px',
                                fontWeight: '700',
                                borderRadius: '16px',
                                border: '2px solid #ffcdd2',
                                boxShadow: '0 2px 4px rgba(211, 47, 47, 0.2)',
                                whiteSpace: 'nowrap'
                              }}>
                                Already in another team
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Mentor selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                Assign Mentor <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <select
                onChange={e => setSelectedMentor(e.target.value)}
                value={selectedMentor}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  borderRadius: '6px',
                  border: selectedMentor ? '2px solid #4caf50' : '1px solid #ddd',
                  backgroundColor: selectedMentor ? '#e3f2fd' : 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- No Mentor --</option>
                {mentors.map(m => (
                  <option key={m._id || m.id} value={m._id || m.id}>
                    {m.name} {m.email ? `(${m.email})` : ''}
                  </option>
                ))}
              </select>
              {!selectedMentor && (
                <div style={{ color: '#d32f2f', fontSize: '13px', marginTop: '6px' }}>
                  Please select a mentor (required).
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              {editingTeam ? (
                <>
                  <button
                    onClick={updateTeam}
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      fontSize: '15px',
                      backgroundColor: loading ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {loading ? 'Updating...' : 'Update Team'}
                  </button>
                  <button
                    onClick={resetForm}
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      fontSize: '15px',
                      backgroundColor: loading ? '#ccc' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={createTeam}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    fontSize: '15px',
                    backgroundColor: loading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {loading ? 'Creating...' : 'Create Team'}
                </button>
              )}
            </div>
          </div>

          {/* Teams display with search */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              <h3 style={{ margin: 0, color: '#1a1a1a' }}>
                All Teams ({filteredTeams.length}{teamSearchText ? ` of ${teams.length}` : ''})
              </h3>
              
              {/* Team search bar */}
              <div className="teams-filter-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={teamSearchText}
                  onChange={e => setTeamSearchText(e.target.value)}
                  placeholder="Search teams (name, roll no, email)"
                  style={{
                    padding: '10px 15px',
                    fontSize: '15px',
                    borderRadius: '6px',
                    border: '1px solid #c0c0c0',
                    width: '300px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1976d2'}
                  onBlur={(e) => e.target.style.borderColor = '#c0c0c0'}
                />

                <select
                  value={teamBranchFilter}
                  onChange={e => setTeamBranchFilter(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    fontSize: '15px',
                    borderRadius: '6px',
                    border: '1px solid #c0c0c0',
                    background: teamBranchFilter ? '#e8f0fe' : 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>

                {(teamSearchText || teamBranchFilter) && (
                  <button 
                    type="button" 
                    onClick={() => { setTeamSearchText(''); setTeamBranchFilter(''); }}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#6c757d',
                      color: '#fff',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {loading && <p style={{ textAlign: 'center', color: '#666' }}>Loading teams...</p>}
            
            {filteredTeams.length === 0 && !loading ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                color: '#999'
              }}>
                <p style={{ fontSize: '16px', margin: 0 }}>
                  {teamSearchText 
                    ? `No teams found matching "${teamSearchText}"`
                    : 'No teams created yet for this hackathon'
                  }
                </p>
              </div>
            ) : (
              <div className="teams-list-wrapper">
              <div className="teams-grid" style={{ display: 'grid', gap: '20px' }}>
                {filteredTeams.map(team => (
                  <div
                    className="team-card"
                    key={team._id || team.id}
                    style={{
                      border: '1px solid #e0e0e0',
                      padding: '20px',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div className="team-card-header" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: '2px solid #f0f0f0'
                    }}>
                      <h4 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a' }}>
                        {team.name}
                      </h4>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => editTeam(team)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#ffc107',
                            color: '#000',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTeam(team._id || team.id)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {team.mentor && (
                      <div className="team-info-section" style={{
                        marginBottom: '16px',
                        padding: '12px',
                        backgroundColor: '#e7f3ff',
                        borderRadius: '6px',
                        borderLeft: '4px solid #0056b3'
                      }}>
                        <strong className="team-info-label" style={{ color: '#0056b3', fontSize: '14px' }}>Mentor:</strong>
                        <div className="team-info-content" style={{ marginTop: '6px' }}>
                          <div className="team-info-name" style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a', wordBreak: 'break-word' }}>
                            {team.mentor.name}
                          </div>
                          <div className="team-info-details" style={{ fontSize: '13px', color: '#666', marginTop: '4px', wordBreak: 'break-all' }}>
                            {team.mentor.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    )}

                    {team.teamLead && (
                      <div className="team-info-section" style={{
                        marginBottom: '16px',
                        padding: '12px',
                        backgroundColor: '#fff3cd',
                        borderRadius: '6px',
                        borderLeft: '4px solid #856404'
                      }}>
                        <strong className="team-info-label" style={{ color: '#856404', fontSize: '14px' }}>Team Lead:</strong>
                        <div className="team-info-content" style={{ marginTop: '6px' }}>
                          <div className="team-info-name" style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a', wordBreak: 'break-word' }}>
                            {team.teamLead.name}
                          </div>
                          <div className="team-info-details" style={{ fontSize: '13px', color: '#666', marginTop: '4px', wordBreak: 'break-all' }}>
                            {team.teamLead.rollNo && `${team.teamLead.rollNo} • `}
                            {team.teamLead.email}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <strong style={{ fontSize: '15px', color: '#1a1a1a' }}>
                        Team Members ({(team.students || []).length}/{teamSizeLimits.maxTeam}):
                      </strong>
                      <div style={{ marginTop: '12px' }}>
                        {(team.students || []).length === 0 ? (
                          <p style={{ color: '#999', fontStyle: 'italic' }}>No members yet</p>
                        ) : (
                          (team.students || []).map((student, index) => {
                            const sid = typeof student === 'string' ? student : getStudentId(student);
                            const name = typeof student === 'string' ? sid : student.name;
                            const isLead = team.teamLead && (
                              getStudentId(student) === getStudentId(team.teamLead)
                            );

                            return (
                              <div
                                className="team-member-item"
                                key={sid}
                                style={{
                                  padding: '12px',
                                  marginBottom: '10px',
                                  backgroundColor: '#f8f9fa',
                                  borderRadius: '6px',
                                  borderLeft: '3px solid #007bff'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                  <strong className="member-name" style={{ fontSize: '15px', color: '#1a1a1a', wordBreak: 'break-word' }}>
                                    {index + 1}. {name}
                                  </strong>
                                  {isLead && (
                                    <span style={{
                                      padding: '3px 10px',
                                      backgroundColor: '#ffc107',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: '700',
                                      color: '#000',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      LEAD
                                    </span>
                                  )}
                                </div>
                                {typeof student !== 'string' && (
                                  <div className="member-info" style={{ fontSize: '13px', color: '#666', marginTop: '4px', wordBreak: 'break-all' }}>
                                    {student.rollNo && `${student.rollNo}`} ({student.email || 'N/A'})
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default TeamManagement;