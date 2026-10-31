const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_secret_key);
const { getCollections, ObjectId } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// Create Campaign
router.post('/donation-campaigns', verifyToken, async (req, res) => {
    try {
        const { campaignCollection } = getCollections();
        const newCampaign = req.body;
        const result = await campaignCollection.insertOne(newCampaign);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Paginated donations
router.get('/donations', async (req, res) => {
    try {
        const { campaignCollection } = getCollections();
        const { page = 1, limit = 6, search } = req.query;
        const query = search ? { petName: { $regex: search, $options: 'i' } } : {};
        const donations = await campaignCollection
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .toArray();
        const totalCount = await campaignCollection.countDocuments(query);
        res.send({
            donations,
            hasMore: (page * limit) < totalCount
        });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// All campaigns
router.get('/donation-campaigns', async (req, res) => {
    try {
        const { campaignCollection } = getCollections();
        const result = await campaignCollection.find().sort({ createdAt: -1 }).toArray();
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// User campaigns by email
router.get('/donation-campaigns/:email', verifyToken, async (req, res) => {
    try {
        const email = req.params.email;
        if (email !== req.user.email) {
            return res.status(403).send({ message: 'Unauthorized access' });
        }
        const { campaignCollection } = getCollections();
        const query = { createdBy: email };
        const result = await campaignCollection.find(query).toArray();
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Single campaign by ID
router.get('/donation/:id', async (req, res) => {
    try {
        const { campaignCollection } = getCollections();
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await campaignCollection.findOne(query);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Update campaign
router.put('/donation-campaigns/:id', verifyToken, async (req, res) => {
    try {
        const { campaignCollection } = getCollections();
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const donationData = req.body;
        const options = { upsert: true };
        const updatedData = {
            $set: {
                petImage: donationData.petImage,
                maxDonationAmount: donationData.maxDonationAmount,
                lastDate: donationData.lastDate,
                shortDescription: donationData.shortDescription,
                longDescription: donationData.longDescription,
                createdBy: donationData.createdBy,
                createdAt: donationData.createdAt,
                petName: donationData.petName
            }
        };
        const result = await campaignCollection.updateOne(query, updatedData, options);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Pause / Resume campaign
router.patch('/donations/:id', async (req, res) => {
    try {
        const { campaignCollection } = getCollections();
        const id = req.params.id;
        const { paused } = req.body;
        const query = { _id: new ObjectId(id) };
        const updatedData = {
            $set: {
                paused: paused
            }
        };
        const result = await campaignCollection.updateOne(query, updatedData);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Recommended campaigns
router.get('/donations/recommended', async (req, res) => {
    try {
        const { campaignCollection } = getCollections();
        const { exclude } = req.query;
        const query = exclude && ObjectId.isValid(exclude) ? { _id: { $ne: new ObjectId(exclude) } } : {};
        const recommendedDonations = await campaignCollection.find(query).limit(3).toArray();
        res.send(recommendedDonations);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Delete campaign
router.delete('/donations/:id', verifyToken, async (req, res) => {
    try {
        const { campaignCollection } = getCollections();
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await campaignCollection.deleteOne(query);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Stripe Payment Intent
router.post('/create-payment-intent', verifyToken, async (req, res) => {
    try {
        const { donation } = req.body;
        const amount = parseInt(donation * 100);
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            payment_method_types: ['card'],
        });
        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Record Payment
router.post('/payment', verifyToken, async (req, res) => {
    try {
        const { paymentCollection, campaignCollection } = getCollections();
        const paymentData = req.body;
        const result = await paymentCollection.insertOne(paymentData);
        await campaignCollection.updateOne(
            { _id: new ObjectId(paymentData.donationId) },
            { $inc: { donatedAmount: parseFloat(paymentData.amount) } }
        );
        res.send({ paymentResult: result });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Donators for a campaign
router.get('/donators/:id', verifyToken, async (req, res) => {
    try {
        const { paymentCollection } = getCollections();
        const id = req.params.id;
        const query = { donationId: id };
        const result = await paymentCollection.find(query).toArray();
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// User donations
router.get('/my-donations/:email', verifyToken, async (req, res) => {
    try {
        const email = req.params.email;
        if (email !== req.user.email) {
            return res.status(403).send({ message: 'Unauthorized access' });
        }

        const { paymentCollection } = getCollections();
        const donations = await paymentCollection.aggregate([
            { $match: { email: email } },
            { $addFields: { donationIdObj: { $toObjectId: "$donationId" } } },
            {
                $lookup: {
                    from: 'campaigns',
                    localField: 'donationIdObj',
                    foreignField: '_id',
                    as: 'campaignDetails'
                }
            },
            { $unwind: '$campaignDetails' },
            {
                $project: {
                    _id: 1,
                    petName: '$campaignDetails.petName',
                    petImage: '$campaignDetails.petImage',
                    amount: 1,
                    transactionId: 1,
                    date: 1
                }
            }
        ]).toArray();

        res.send(donations);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Refund donation
router.delete('/refund-donation/:id', verifyToken, async (req, res) => {
    try {
        const { paymentCollection, campaignCollection } = getCollections();
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const donation = await paymentCollection.findOne(filter);

        if (donation) {
            await paymentCollection.deleteOne(filter);
            await campaignCollection.updateOne(
                { _id: new ObjectId(donation.donationId) },
                { $inc: { donatedAmount: -parseFloat(donation.amount) } }
            );
            res.send({ success: true });
        } else {
            res.status(404).send({ error: 'Donation not found' });
        }
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;
