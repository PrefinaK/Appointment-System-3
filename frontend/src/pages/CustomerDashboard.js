import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import BookingForm from '../components/BookingForm';
import { appointmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Auto-refresh appointments every 30 seconds
  useEffect(() => {
    fetchAppointments();
    
    const interval = setInterval(() => {
      fetchAppointments();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentsAPI.getMyAppointments();
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleDateSelect = (dateInfo) => {
    setSelectedDate(dateInfo);
    setShowBookingForm(true);
    setSelectedAppointment(null);
  };

  const handleEventClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowBookingForm(false);
  };

  const handleBookingComplete = () => {
    fetchAppointments();
    setShowBookingForm(false);
    setSelectedDate(null);
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentsAPI.cancelAppointment(appointmentId);
        alert('Appointment cancelled successfully');
        fetchAppointments();
        setSelectedAppointment(null);
      } catch (error) {
        alert('Error cancelling appointment: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Navigate to Admin Panel (Developer Mode)
  const goToAdminPanel = () => {
    navigate('/admin');
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Welcome, {user.name}!</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowBookingForm(!showBookingForm)}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showBookingForm ? 'View Calendar' : 'Book Appointment'}
          </button>
          
          {/* DEVELOPER MODE: Quick access to Admin Panel */}
          <button
            onClick={goToAdminPanel}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#17a2b8', 
              color: 'white', 
              border: '2px dashed #0c7c8f',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            title="Developer Mode: View Business Admin Panel"
          >
            🔧 Business Admin
          </button>

          <button
            onClick={logout}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 2 }}>
          {!showBookingForm ? (
            <Calendar
              onDateSelect={handleDateSelect}
              onEventClick={handleEventClick}
            />
          ) : (
            <BookingForm
              selectedDate={selectedDate}
              onBookingComplete={handleBookingComplete}
            />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h3>Your Appointments</h3>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {appointments.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                No appointments yet. Click "Book Appointment" to get started!
              </p>
            ) : (
              appointments.map(appointment => (
                <div
                  key={appointment._id}
                  style={{
                    padding: '15px',
                    margin: '10px 0',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: selectedAppointment?._id === appointment._id ? '#f0f8ff' : 'white',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  <h4>{appointment.service}</h4>
                  <p><strong>Business:</strong> {appointment.business.businessName || appointment.business.name}</p>
                  <p><strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {appointment.startTime} - {appointment.endTime}</p>
                  <p><strong>Status:</strong> <span style={{ 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    backgroundColor: appointment.status === 'confirmed' ? '#d4edda' : 
                                    appointment.status === 'pending' ? '#fff3cd' : 
                                    appointment.status === 'cancelled' ? '#f8d7da' : '#e2e3e5',
                    color: appointment.status === 'confirmed' ? '#155724' : 
                           appointment.status === 'pending' ? '#856404' : 
                           appointment.status === 'cancelled' ? '#721c24' : '#383d41'
                  }}>{appointment.status}</span></p>
                  {appointment.notes && <p><strong>Notes:</strong> {appointment.notes}</p>}
                  
                  {appointment.status !== 'cancelled' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelAppointment(appointment._id);
                      }}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginTop: '10px'
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;