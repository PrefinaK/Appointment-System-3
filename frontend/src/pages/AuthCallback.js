import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Save token and get user info
      localStorage.setItem('token', token);
      
      authAPI.getCurrentUser()
        .then(response => {
          // Manually set user in context
          const user = response.data.user;
          
          // Redirect based on role
          if (user.role === 'business') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
          
          // Refresh page to update auth context
          window.location.reload();
        })
        .catch(error => {
          console.error('Error fetching user:', error);
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h2>Logging you in...</h2>
      <p>Please wait while we complete your Google login.</p>
    </div>
  );
};

export default AuthCallback;