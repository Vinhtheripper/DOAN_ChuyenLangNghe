const express = require('express');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { getCollections } = require('../config/database');
const { requireAuth, requireRoleAction } = require('../middlewares/auth');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { userCollection } = getCollections();
  const { profileName, email, password, gender, birthMonth, birthDay, birthYear, marketing, role = 'user' } = req.body;

  if (!profileName || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  try {
    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await userCollection.insertOne({
      profileName,
      email,
      password: hashedPassword,
      gender,
      birthDate: { month: birthMonth, day: birthDay, year: birthYear },
      marketing: !!marketing,
      role,
      avatar: '',
      memberPoints: 0,
      memberTier: 'Member'
    });

    return res.status(201).json({ message: 'User registered successfully', userId: result.insertedId });
  } catch {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/login', async (req, res) => {
  const { userCollection } = getCollections();
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password.' });
  }

  try {
    const user = await userCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    req.session.userId = user._id;
    req.session.isLoggedIn = true;
    req.session.role = user.role;
    req.session.action = user.action || 'just view';

    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    } else {
      req.session.cookie.expires = false;
    }

    return res.status(200).json({
      userId: user._id.toString(),
      role: user.role,
      action: user.action || 'just view',
      token: user._id.toString(),
      message: 'Login successful'
    });
  } catch {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out. Try again later.' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logout successful' });
  });
});

router.get('/profile', requireAuth, async (req, res) => {
  const { userCollection } = getCollections();
  const user = await userCollection.findOne({ _id: new ObjectId(req.session.userId) });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.status(200).json({
    _id: user._id,
    email: user.email,
    profileName: user.profileName,
    gender: user.gender,
    birthDate: user.birthDate,
    phone: user.phone,
    address: user.address,
    marketing: user.marketing,
    role: user.role,
    action: user.action || 'just view',
    avatar: user.avatar || '',
    memberPoints: user.memberPoints || 0,
    memberTier: user.memberTier || 'Member'
  });
});

router.patch('/update/:userId', requireRoleAction('admin', ['edit all', 'account ctrl']), async (req, res) => {
  const { userCollection } = getCollections();
  const updateData = { ...req.body };

  delete updateData.email;
  delete updateData.password;
  delete updateData._id;

  try {
    const result = await userCollection.updateOne(
      { _id: new ObjectId(req.params.userId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }

    return res.status(200).json({ message: 'User updated successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to update user' });
  }
});

router.patch('/profile', requireAuth, async (req, res) => {
  const { userCollection } = getCollections();

  try {
    const allowed = ['profileName', 'phone', 'address', 'birthDate', 'gender', 'marketing', 'avatar'];
    const updateData = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }

    if (updateData.avatar) {
      if (typeof updateData.avatar !== 'string' || !updateData.avatar.startsWith('data:image/')) {
        return res.status(400).json({ message: 'Invalid avatar format. Must be Base64 data URL.' });
      }
      if (updateData.avatar.length > 2_000_000) {
        return res.status(413).json({ message: 'Avatar image too large.' });
      }
    }

    const result = await userCollection.updateOne(
      { _id: new ObjectId(req.session.userId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }

    const updatedUser = await userCollection.findOne({ _id: new ObjectId(req.session.userId) });
    return res.status(200).json({
      message: 'Profile updated',
      user: {
        _id: updatedUser?._id,
        email: updatedUser?.email,
        profileName: updatedUser?.profileName,
        gender: updatedUser?.gender,
        birthDate: updatedUser?.birthDate,
        phone: updatedUser?.phone,
        address: updatedUser?.address,
        marketing: updatedUser?.marketing,
        role: updatedUser?.role,
        avatar: updatedUser?.avatar || '',
        memberPoints: updatedUser?.memberPoints || 0,
        memberTier: updatedUser?.memberTier || 'Member'
      }
    });
  } catch {
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.delete('/delete/:userId', requireRoleAction('admin', ['edit all', 'account ctrl']), async (req, res) => {
  const { userCollection } = getCollections();

  try {
    const result = await userCollection.deleteOne({ _id: new ObjectId(req.params.userId) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to delete user' });
  }
});

router.get('/user-management', requireRoleAction('admin', ['edit all', 'account ctrl', 'view']), async (req, res) => {
  const { userCollection } = getCollections();
  const { page = 1, limit = 10, search = '' } = req.query;
  const filter = search ? { profileName: { $regex: search, $options: 'i' } } : {};

  try {
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const users = await userCollection.find(filter).skip(skip).limit(parseInt(limit, 10)).toArray();
    const total = await userCollection.countDocuments(filter);

    return res.status(200).json({
      users,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit)
    });
  } catch {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
