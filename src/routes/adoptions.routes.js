const express = require('express');
const router = express.Router();
const { getCollections, ObjectId } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// Submit Adoption Request (supports both /adoptions and /adoption)
router.post(['/adoptions', '/adoption'], verifyToken, async (req, res) => {
    try {
        const { adoptionCollection } = getCollections();
        const adoptionData = req.body;
        const payload = {
            ...adoptionData,
            status: adoptionData.status || 'pending',
            createdAt: adoptionData.createdAt || new Date().toISOString()
        };
        const result = await adoptionCollection.insertOne(payload);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Get adoption requests for pet owner's pets
router.get('/adoptions/:email', verifyToken, async (req, res) => {
    try {
        const email = req.params.email;
        if (email !== req.user.email) {
            return res.status(403).send({ message: 'Unauthorized access' });
        }
        const { petCollection, adoptionCollection } = getCollections();
        const userPets = await petCollection.find({ userEmail: email }).toArray();
        const petIds = userPets.map(pet => pet._id.toString());
        const adoptionRequests = await adoptionCollection.find({ petId: { $in: petIds } }).toArray();
        res.send(adoptionRequests);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Get all adoption requests (Admin)
router.get('/all-adoptions', verifyToken, async (req, res) => {
    try {
        const { adoptionCollection } = getCollections();
        const result = await adoptionCollection.find().sort({ _id: -1 }).toArray();
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Accept adoption request (Legacy)
router.patch('/adoptions/:id', verifyToken, async (req, res) => {
    try {
        const { adoptionCollection } = getCollections();
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const update = { $set: { status: "accepted" } };
        const result = await adoptionCollection.updateOne(filter, update);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Update adoption status (accepted / rejected) + sync pet adopted status
router.patch('/adoptions/status/:id', verifyToken, async (req, res) => {
    try {
        const { adoptionCollection, petCollection } = getCollections();
        const id = req.params.id;
        const { status, petId } = req.body;
        const filter = { _id: new ObjectId(id) };
        const update = { $set: { status: status } };
        const result = await adoptionCollection.updateOne(filter, update);

        if (status === 'accepted' && petId && ObjectId.isValid(petId)) {
            await petCollection.updateOne(
                { _id: new ObjectId(petId) },
                { $set: { adopted: true } }
            );
        }
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Delete adoption request
router.delete('/adoptions/:id', verifyToken, async (req, res) => {
    try {
        const { adoptionCollection } = getCollections();
        const id = req.params.id;
        const result = await adoptionCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;
