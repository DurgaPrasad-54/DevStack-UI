import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f8fafc'
    }}>
      <h1 style={{
        fontSize: '120px',
        fontWeight: 'bold',
        color: '#3b82f6',
        margin: '0',
        lineHeight: '1'
      }}>
        404
      </h1>
      <h2 style={{
        fontSize: '28px',
        fontWeight: '600',
        color: '#1e293b',
        margin: '16px 0 8px 0'
      }}>
        Page Not Found
      </h2>
      <p style={{
        fontSize: '16px',
        color: '#64748b',
        maxWidth: '400px',
        marginBottom: '24px'
      }}>
        Sorry, the page you are looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '500',
          color: 'white',
          backgroundColor: '#3b82f6',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
      >
        Go Back
      </button>
    </div>
  );
};

export default NotFound;
