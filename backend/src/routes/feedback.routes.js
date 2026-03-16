const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/database');
const { requireRoleAction } = require('../middlewares/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  const { feedbackCollection } = getCollections();
  const { fullName, email, phone, message } = req.body;
  if (!fullName || !message) {
    return res.status(400).json({ message: 'Full name and message are required.' });
  }

  try {
    const result = await feedbackCollection.insertOne({
      fullName,
      email: email || null,
      phone: phone || null,
      message,
      status: 'new',
      submittedAt: new Date()
    });

    return res.status(201).json({ message: 'Feedback submitted successfully', feedbackId: result.insertedId });
  } catch {
    return res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

router.get('/', requireRoleAction('admin', ['edit all', 'sales ctrl', 'view']), async (req, res) => {
  const { feedbackCollection } = getCollections();
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const status = req.query.status || '';

  try {
    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      filter.status = status;
    }

    const feedback = await feedbackCollection.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(limit).toArray();
    const total = await feedbackCollection.countDocuments(filter);

    return res.status(200).json({
      feedback,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.patch('/:id/status', requireRoleAction('admin', ['edit all', 'sales ctrl']), async (req, res) => {
  const { feedbackCollection } = getCollections();
  const { status } = req.body;

  if (!status || !['new', 'read', 'replied'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const result = await feedbackCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    return res.status(200).json({ message: 'Status updated successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to update status' });
  }
});

router.delete('/:id', requireRoleAction('admin', ['edit all', 'sales ctrl']), async (req, res) => {
  const { feedbackCollection } = getCollections();
  try {
    const result = await feedbackCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    return res.status(200).json({ message: 'Feedback deleted successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to delete feedback' });
  }
});

module.exports = router;
