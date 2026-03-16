const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/database');
const { requireRoleAction } = require('../middlewares/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const { blogCollection } = getCollections();
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    const filter = { published: true };
    const blogs = await blogCollection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
    const total = await blogCollection.countDocuments(filter);

    return res.status(200).json({
      blogs,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/admin/list', requireRoleAction('admin', ['edit all', 'sales ctrl', 'view']), async (req, res) => {
  const { blogCollection } = getCollections();
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  try {
    const filter = search ? { title: { $regex: search, $options: 'i' } } : {};
    const blogs = await blogCollection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
    const total = await blogCollection.countDocuments(filter);

    return res.status(200).json({
      blogs,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error fetching blogs for admin:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  const { blogCollection } = getCollections();
  try {
    const blog = await blogCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    return res.status(200).json(blog);
  } catch {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/', requireRoleAction('admin', ['edit all', 'sales ctrl']), async (req, res) => {
  const { blogCollection } = getCollections();
  const { title, description, content, image, author, published } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }
  if (image && (typeof image !== 'string' || !image.startsWith('data:image/'))) {
    return res.status(400).json({ message: 'Invalid image format. Must be Base64.' });
  }

  try {
    const result = await blogCollection.insertOne({
      title,
      description: description || '',
      content,
      image: image || '',
      author: author || 'Admin',
      published: published !== undefined ? published : true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(201).json({ message: 'Blog created successfully', blogId: result.insertedId });
  } catch {
    return res.status(500).json({ message: 'Failed to create blog' });
  }
});

router.patch('/:id', requireRoleAction('admin', ['edit all', 'sales ctrl']), async (req, res) => {
  const { blogCollection } = getCollections();
  const { image, ...updateData } = req.body;

  if (image && (typeof image !== 'string' || !image.startsWith('data:image/'))) {
    return res.status(400).json({ message: 'Invalid image format. Must be Base64.' });
  }

  try {
    const result = await blogCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...updateData, ...(image && { image }), updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Blog not found or no changes made' });
    }

    return res.status(200).json({ message: 'Blog updated successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to update blog' });
  }
});

router.delete('/:id', requireRoleAction('admin', ['edit all', 'sales ctrl']), async (req, res) => {
  const { blogCollection } = getCollections();
  try {
    const result = await blogCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    return res.status(200).json({ message: 'Blog deleted successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to delete blog' });
  }
});

module.exports = router;
