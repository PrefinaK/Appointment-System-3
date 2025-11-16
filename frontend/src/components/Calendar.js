import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { appointmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Calendar = ({ onDateSelect, onEventClick }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentsAPI.getMyAppointments();
      const events = response.data.map(appointment => ({
        id: appointment._id,
        title: user.role === 'business' 
          ? `${appointment.service} - ${appointment.customer.name}`
          : appointment.service,
        start: `${appointment.date.split('T')[0]}T${appointment.startTime}`,
        end: `${appointment.date.split('T')[0]}T${appointment.endTime}`,
        backgroundColor: getStatusColor(appointment.status),
        borderColor: getStatusColor(appointment.status),
        extendedProps: appointment
      }));
      setAppointments(events);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#fbbf24';
      case 'confirmed': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#6366f1';
      case 'paid': return '#059669';
      default: return '#6b7280';
    }
  };

  const handleDateSelect = (selectInfo) => {
    if (onDateSelect && user.role === 'customer') {
      const startTime = selectInfo.start.toTimeString().slice(0, 5);
      const endTime = selectInfo.end ? selectInfo.end.toTimeString().slice(0, 5) : 
                     String(parseInt(startTime.slice(0, 2)) + 1).padStart(2, '0') + ':00';
      
      onDateSelect({
        date: selectInfo.start,
        startTime,
        endTime
      });
    }
  };

  const handleEventClick = (clickInfo) => {
    if (onEventClick) {
      onEventClick(clickInfo.event.extendedProps);
    }
  };

  if (loading) {
    return <div>Loading calendar...</div>;
  }

  return (
    <div style={{ height: '600px', padding: '20px' }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        selectable={user.role === 'customer'}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={appointments}
        select={handleDateSelect}
        eventClick={handleEventClick}
        height="100%"
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        nowIndicator={true}
        editable={false}
      />
    </div>
  );
};

export default Calendar;