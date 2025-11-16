import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import { adminAPI, appointmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Auto-refresh appointments and stats every 30 seconds
  useEffect(() => {
    fetchAppointments();
    fetchStats();
    
    const interval = setInterval(() => {
      fetchAppointments();
      fetchStats();
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

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleEventClick = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await adminAPI.updateAppointmentStatus(appointmentId, newStatus);
      alert('Appointment status updated successfully');
      fetchAppointments();
      fetchStats();
    } catch (error) {
      alert('Error updating status: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusCounts = () => {
    const counts = {};
    if (stats.statusStats) {
      stats.statusStats.forEach(stat => {
        counts[stat._id] = stat.count;
      });
    }
    return counts;
  };

  // Navigate to Customer Dashboard (Developer Mode)
  const goToCustomerDashboard = () => {
    navigate('/dashboard');
  };

  const statusCounts = getStatusCounts();

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Admin Dashboard - {user.businessName || user.name}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* DEVELOPER MODE: Quick access to Customer Dashboard */}
          <button
            onClick={goToCustomerDashboard}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: '2px dashed #1e7e34',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            title="Developer Mode: View Customer Dashboard"
          >
            👤 Customer View
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

      {/* Statistics */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>Today's Appointments</h3>
          <p style={{ fontSize: '24px', margin: 0, fontWeight: 'bold' }}>{stats.todayAppointments || 0}</p>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Confirmed</h3>
          <p style={{ fontSize: '24px', margin: 0, fontWeight: 'bold' }}>{statusCounts.confirmed || 0}</p>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>Pending</h3>
          <p style={{ fontSize: '24px', margin: 0, fontWeight: 'bold' }}>{statusCounts.pending || 0}</p>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#17a2b8' }}>Paid</h3>
          <p style={{ fontSize: '24px', margin: 0, fontWeight: 'bold' }}>{statusCounts.paid || 0}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 2 }}>
          <h3>Calendar View</h3>
          <Calendar
            onEventClick={handleEventClick}
          />
        </div>

        <div style={{ flex: 1 }}>
          <h3>Appointment Details</h3>
          {selectedAppointment ? (
            <div style={{
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <h4>{selectedAppointment.service}</h4>
              <p><strong>Customer:</strong> {selectedAppointment.customer.name}</p>
              <p><strong>Email:</strong> {selectedAppointment.customer.email}</p>
              <p><strong>Phone:</strong> {selectedAppointment.customer.phone || 'N/A'}</p>
              <p><strong>Date:</strong> {new Date(selectedAppointment.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
              <p><strong>Current Status:</strong> <span style={{ 
                padding: '2px 6px', 
                borderRadius: '4px', 
                backgroundColor: selectedAppointment.status === 'confirmed' ? '#d4edda' : 
                                selectedAppointment.status === 'pending' ? '#fff3cd' : 
                                selectedAppointment.status === 'cancelled' ? '#f8d7da' : 
                                selectedAppointment.status === 'paid' ? '#d1ecf1' : '#e2e3e5'
              }}>{selectedAppointment.status}</span></p>
              {selectedAppointment.notes && <p><strong>Notes:</strong> {selectedAppointment.notes}</p>}
              
              <div style={{ marginTop: '20px' }}>
                <h5>Update Status:</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {['pending', 'confirmed', 'cancelled', 'completed', 'paid'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(selectedAppointment._id, status)}
                      disabled={selectedAppointment.status === status}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: selectedAppointment.status === status ? '#6c757d' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: selectedAppointment.status === status ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p>Click on an appointment in the calendar to see details</p>
          )}
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>All Appointments</h3>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Customer</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Service</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Time</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No appointments yet. Customers will see you once they book!
                  </td>
                </tr>
              ) : (
                appointments.map(appointment => (
                  <tr 
                    key={appointment._id}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedAppointment?._id === appointment._id ? '#f0f8ff' : 'white'
                    }}
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{appointment.customer.name}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{appointment.service}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {new Date(appointment.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {appointment.startTime} - {appointment.endTime}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        backgroundColor: appointment.status === 'confirmed' ? '#d4edda' : 
                                        appointment.status === 'pending' ? '#fff3cd' : 
                                        appointment.status === 'cancelled' ? '#f8d7da' : 
                                        appointment.status === 'paid' ? '#d1ecf1' : '#e2e3e5'
                      }}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;