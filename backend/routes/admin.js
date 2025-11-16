const express = require('express');
const Appointment = require('../models/Appointment');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all appointments (business only)
router.get('/appointments', auth, requireRole(['business']), async (req, res) => {
  try {
    const appointments = await Appointment.find({ business: req.user._id })
      .populate('customer', 'name email phone')
      .sort({ date: 1, startTime: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update appointment status
router.patch('/appointments/:id/status', auth, requireRole(['business']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, business: req.user._id },
      { status },
      { new: true }
    ).populate('customer', 'name email phone');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get appointment statistics
router.get('/stats', auth, requireRole(['business']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Appointment.aggregate([
      { $match: { business: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const todayAppointments = await Appointment.countDocuments({
      business: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    const totalRevenue = await Appointment.countDocuments({
      business: req.user._id,
      status: 'paid'
    });

    res.json({
      statusStats: stats,
      todayAppointments,
      totalPaidAppointments: totalRevenue
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;