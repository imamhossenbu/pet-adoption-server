const express = require('express');
const router = express.Router();
const { getCollections, ObjectId } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// Add a Pet
router.post('/pet', verifyToken, async (req, res) => {
    try {
        const { petCollection } = getCollections();
        const petItem = req.body;
        const result = await petCollection.insertOne(petItem);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Get Pets (public, search & category filtered, paginated)
router.get('/pets', async (req, res) => {
    try {
        const { petCollection } = getCollections();
        const { search, category, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const query = {
            adopted: false,
            ...(search && { petName: { $regex: search, $options: 'i' } }),
            ...(category && { petCategory: { $regex: new RegExp(`^${category}$`, 'i') } }),
        };

        const pets = await petCollection
            .find(query)
            .sort({ dateAdded: -1 })
            .skip(skip)
            .limit(limitNum)
            .toArray();

        const totalPets = await petCollection.countDocuments(query);
        const hasMore = skip + pets.length < totalPets;

        res.send({ pets, hasMore });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Get all pets (admin / management)
router.get('/allPets', verifyToken, async (req, res) => {
    try {
        const { petCollection } = getCollections();
        const result = await petCollection.find().sort({ _id: -1 }).toArray();
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Single pet by ID
router.get('/pets/:id', async (req, res) => {
    try {
        const { petCollection } = getCollections();
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await petCollection.findOne(query);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Pets by user email
router.get('/pet/:email', verifyToken, async (req, res) => {
    try {
        const email = req.params.email;
        if (email !== req.user.email) {
            return res.status(403).send({ message: 'Unauthorized access' });
        }
        const { petCollection } = getCollections();
        const query = { userEmail: email };
        const result = await petCollection.find(query).toArray();
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Delete pet
router.delete('/pet/:id', verifyToken, async (req, res) => {
    try {
        const { petCollection } = getCollections();
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await petCollection.deleteOne(query);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Update full pet info
router.put('/pet/:id', verifyToken, async (req, res) => {
    try {
        const { petCollection } = getCollections();
        const id = req.params.id;
        const updatedPetData = req.body;
        const filter = { _id: new ObjectId(id) };
        const option = { upsert: true };
        const updatedData = {
            $set: {
                petName: updatedPetData.petName,
                petAge: updatedPetData.petAge,
                petCategory: updatedPetData.petCategory,
                petLocation: updatedPetData.petLocation,
                shortDescription: updatedPetData.shortDescription,
                longDescription: updatedPetData.longDescription,
                petImage: updatedPetData.petImage,
                dateAdded: updatedPetData.dateAdded,
                userEmail: updatedPetData.userEmail,
                adopted: updatedPetData.adopted
            }
        };
        const result = await petCollection.updateOne(filter, updatedData, option);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Toggle pet adopted status
router.patch('/pets/:id', verifyToken, async (req, res) => {
    try {
        const { petCollection } = getCollections();
        const id = req.params.id;
        const data = req.body;
        const filter = { _id: new ObjectId(id) };
        const updatedData = {
            $set: {
                adopted: data.adopted
            }
        };
        const result = await petCollection.updateOne(filter, updatedData);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Legacy update-adoption route
router.patch('/update-adoption/:id', verifyToken, async (req, res) => {
    try {
        const { petCollection } = getCollections();
        const id = req.params.id;
        const { adopted } = req.body;
        const result = await petCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { adopted: adopted } }
        );
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;
