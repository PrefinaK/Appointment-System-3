const express = require('express');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendAppointmentConfirmation } = require('../utils/emailService');

const router = express.Router();

// Get all businesses (for customer to choose)
router.get('/businesses', auth, async (req, res) => {
  try {
    const businesses = await User.find({ role: 'business' })
      .select('name businessName email');
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create appointment
router.post('/', auth, async (req, res) => {
  try {
    const { businessId, service, date, startTime, endTime, notes } = req.body;

    // Check if business exists
    const business = await User.findById(businessId);
    if (!business || business.role !== 'business') {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check for conflicting appointments
    const conflictingAppt = await Appointment.findOne({
      business: businessId,
      date: new Date(date),
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ],
      status: { $nin: ['cancelled'] }
    });

    if (conflictingAppt) {
      return res.status(400).json({ message: 'Time slot not available' });
    }

    // Create appointment
    const appointment = new Appointment({
      customer: req.user._id,
      business: businessId,
      service,
      date: new Date(date),
      startTime,
      endTime,
      notes: notes || ''
    });

    await appointment.save();

    // Populate and return
    await appointment.populate([
      { path: 'customer', select: 'name email phone' },
      { path: 'business', select: 'name businessName email' }
    ]);

    // Send confirmation email
    await sendAppointmentConfirmation(
      req.user.email,
      req.user.name,
      { service, date, startTime }
    );

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's appointments
router.get('/my-appointments', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else {
      query.business = req.user._id;
    }

    const appointments = await Appointment.find(query)
      .populate('customer', 'name email phone')
      .populate('business', 'name businessName email')
      .sort({ date: 1, startTime: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update appointment
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions
    const isCustomer = appointment.customer.toString() === req.user._id.toString();
    const isBusiness = appointment.business.toString() === req.user._id.toString();

    if (!isCustomer && !isBusiness) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update appointment
    Object.assign(appointment, updates);
    await appointment.save();

    await appointment.populate([
      { path: 'customer', select: 'name email phone' },
      { path: 'business', select: 'name businessName email' }
    ]);

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel appointment
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions
    const isCustomer = appointment.customer.toString() === req.user._id.toString();
    const isBusiness = appointment.business.toString() === req.user._id.toString();

    if (!isCustomer && !isBusiness) {
      return res.status(403).json({ message: 'Access denied' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;