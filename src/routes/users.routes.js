const express = require('express');
const router = express.Router();
const { getCollections, ObjectId } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// Create user
router.post('/users', async (req, res) => {
    try {
        const { userCollection } = getCollections();
        const user = req.body;
        const query = { email: user?.email };
        const existingUser = await userCollection.findOne(query);
        if (existingUser) {
            return res.send({ message: 'User already exists', insertedId: null });
        }
        const result = await userCollection.insertOne(user);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Admin status check
router.get('/users/admin/:email', verifyToken, async (req, res) => {
    try {
        const email = req.params.email;
        if (email !== req.user.email) {
            return res.status(403).send({ message: 'Unauthorized access' });
        }

        const { userCollection } = getCollections();
        const query = { email: email };
        const user = await userCollection.findOne(query);
        let admin = false;
        if (user) {
            admin = user.role === 'admin';
        }
        res.send({ admin });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Get all users
router.get('/users', async (req, res) => {
    try {
        const { userCollection } = getCollections();
        const result = await userCollection.find().sort({ _id: -1 }).toArray();
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Make admin (Legacy)
router.patch('/users/admin/:id', async (req, res) => {
    try {
        const { userCollection } = getCollections();
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const update = { $set: { role: 'admin' } };
        const updatedData = await userCollection.updateOne(query, update);
        res.send(updatedData);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Ban / Unban user
router.patch('/users/admin/ban/:id', verifyToken, async (req, res) => {
    try {
        const { userCollection } = getCollections();
        const id = req.params.id;
        const { isBanned } = req.body;
        const query = { _id: new ObjectId(id) };
        const updated = { $set: { isBanned: isBanned } };
        const result = await userCollection.updateOne(query, updated);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Update role (admin / user)
router.patch('/users/role/:id', verifyToken, async (req, res) => {
    try {
        const { userCollection } = getCollections();
        const id = req.params.id;
        const { role } = req.body;
        const query = { _id: new ObjectId(id) };
        const update = { $set: { role: role } };
        const result = await userCollection.updateOne(query, update);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Delete user
router.delete('/users/:id', verifyToken, async (req, res) => {
    try {
        const { userCollection } = getCollections();
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await userCollection.deleteOne(query);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Single user by email
router.get('/users/email/:email', async (req, res) => {
    try {
        const { userCollection } = getCollections();
        const email = req.params.email;
        const query = { email: email };
        const result = await userCollection.findOne(query);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;
