const express = require('express');
const router = express.Router();
const { getCollections, ObjectId } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const { categoryCollection } = getCollections();
        let categories = await categoryCollection.find().toArray();
        if (categories.length === 0) {
            const initialCats = [
                {
                    category: "Cat",
                    label: "Cats",
                    icon: "🐈",
                    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
                    description: "Playful & affectionate felines"
                },
                {
                    category: "Dog",
                    label: "Dogs",
                    icon: "🐕",
                    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80",
                    description: "Loyal & energetic companions"
                },
                {
                    category: "Rabbit",
                    label: "Rabbits",
                    icon: "🐇",
                    image: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=600&q=80",
                    description: "Gentle & curious bunnies"
                },
                {
                    category: "Bird",
                    label: "Birds",
                    icon: "🦜",
                    image: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&w=600&q=80",
                    description: "Cheerful & musical feathered friends"
                }
            ];
            await categoryCollection.insertMany(initialCats);
            categories = initialCats;
        }
        res.send(categories);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Add category
router.post('/categories', verifyToken, async (req, res) => {
    try {
        const { categoryCollection } = getCollections();
        const cat = req.body;
        const result = await categoryCollection.insertOne(cat);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Delete category
router.delete('/categories/:id', verifyToken, async (req, res) => {
    try {
        const { categoryCollection } = getCollections();
        const id = req.params.id;
        const result = await categoryCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;
