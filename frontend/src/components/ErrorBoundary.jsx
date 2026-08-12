import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleBackToLobby = () => {
    window.location.href = '/lobby';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          fontFamily: "'Outfit', 'Inter', sans-serif",
          textAlign: 'center',
          padding: '20px',
          backgroundImage: 'radial-gradient(circle at center, #1c1410 0%, #0a0a0a 100%)',
          selectNone: 'none'
        }}>
          {/* Subtle gold decoration */}
          <div style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 184, 0, 0.05)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          <div style={{
            zIndex: 1,
            backgroundColor: '#16100c',
            border: '1px solid rgba(255, 184, 0, 0.25)',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 25px rgba(255, 184, 0, 0.05)'
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px' }}>⚠️</span>
            <h2 style={{
              color: '#FFB800',
              fontSize: '22px',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '15px',
              fontFamily: "'Outfit', sans-serif"
            }}>
              Something went wrong loading the auction room.
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              lineHeight: '1.6',
              marginBottom: '30px'
            }}>
              {this.state.error?.toString() || 'An unexpected rendering error occurred.'}
            </p>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#C8A060',
                  color: '#0E0A06',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(200, 160, 96, 0.2)',
                  transition: 'transform 0.2s, background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#E5BA73';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#C8A060';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                RELOAD ROOM
              </button>
              <button
                onClick={this.handleBackToLobby}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, border-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                BACK TO LOBBY
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
