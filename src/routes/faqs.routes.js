const express = require('express');
const router = express.Router();
const { getCollections, ObjectId } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// Get all FAQs
router.get('/faqs', async (req, res) => {
    try {
        const { faqCollection } = getCollections();
        let faqs = await faqCollection.find().toArray();
        if (faqs.length === 0) {
            const initialFaqs = [
                {
                    question: "How does the pet adoption process work at PeddyCare?",
                    answer: "Browse our pet listings, select a pet, review their details, and submit an adoption application. Our team reviews your request within 24-48 hours. Once approved, you can complete the adoption and receive your official certificate.",
                    category: "Adoption",
                    active: true,
                    order: 1
                },
                {
                    question: "Are all pets vaccinated, dewormed, and vet-checked?",
                    answer: "Yes! Every single pet listed on PeddyCare goes through medical screening, up-to-date vaccinations, deworming, and health certification before being cleared for adoption.",
                    category: "Health & Safety",
                    active: true,
                    order: 2
                },
                {
                    question: "Can I donate to multiple emergency medical campaigns?",
                    answer: "Absolutely! You can donate to any active campaign using secure Stripe checkout. 100% of campaign donations go directly toward the pet's urgent medical procedures.",
                    category: "Donations",
                    active: true,
                    order: 3
                },
                {
                    question: "What if the adopted pet doesn't adjust well to my home?",
                    answer: "We offer a 30-day Safe Return Guarantee and free behavioral consultation with our certified trainers to support you and your new pet during the transition.",
                    category: "Support",
                    active: true,
                    order: 4
                }
            ];
            await faqCollection.insertMany(initialFaqs);
            faqs = initialFaqs;
        }
        res.send(faqs);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Create FAQ
router.post('/faqs', verifyToken, async (req, res) => {
    try {
        const { faqCollection } = getCollections();
        const faq = req.body;
        const result = await faqCollection.insertOne(faq);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Update FAQ
router.patch('/faqs/:id', verifyToken, async (req, res) => {
    try {
        const { faqCollection } = getCollections();
        const id = req.params.id;
        const updateData = req.body;
        const result = await faqCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Delete FAQ
router.delete('/faqs/:id', verifyToken, async (req, res) => {
    try {
        const { faqCollection } = getCollections();
        const id = req.params.id;
        const result = await faqCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;
