const express = require('express');
const router = express.Router();
const { getCollections, ObjectId } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// Default initial team members with working portraits
const initialTeamMembers = [
    {
        name: "Mika Doe",
        role: "Adoption Manager",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
        bio: "Dedicated adoption counselor with 7+ years matching rescued pets with their forever families.",
        social: {
            facebook: "https://facebook.com",
            twitter: "https://twitter.com",
            linkedin: "https://linkedin.com",
            instagram: "https://instagram.com"
        },
        createdAt: new Date().toISOString()
    },
    {
        name: "Jillian Smith",
        role: "Vet Assistant",
        image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80",
        bio: "Passionate animal healthcare assistant ensuring every rescued pet receives gentle clinical care.",
        social: {
            facebook: "https://facebook.com",
            twitter: "https://twitter.com",
            linkedin: "https://linkedin.com"
        },
        createdAt: new Date().toISOString()
    },
    {
        name: "Dr. Laura Smith",
        role: "Head Veterinarian",
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80",
        bio: "Board-certified DVM specializing in shelter medicine, triage, and orthopedic pet recovery.",
        social: {
            facebook: "https://facebook.com",
            twitter: "https://twitter.com",
            linkedin: "https://linkedin.com"
        },
        createdAt: new Date().toISOString()
    },
    {
        name: "John Doe",
        role: "Lead Pet Trainer",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
        bio: "Fear-free certified canine behavioral coach helping rescued dogs rehabilitate with confidence.",
        social: {
            facebook: "https://facebook.com",
            twitter: "https://twitter.com",
            linkedin: "https://linkedin.com"
        },
        createdAt: new Date().toISOString()
    },
    {
        name: "Sarah Johnson",
        role: "Animal Care Specialist",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
        bio: "Expert in feline enrichment, neonatal kitten nursery, and special-needs animal dietary care.",
        social: {
            facebook: "https://facebook.com",
            twitter: "https://twitter.com",
            linkedin: "https://linkedin.com"
        },
        createdAt: new Date().toISOString()
    },
    {
        name: "Michael Adams",
        role: "Pet Behaviorist",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80",
        bio: "Specialist in pet socialization, stress-reduction techniques, and family transition guidance.",
        social: {
            facebook: "https://facebook.com",
            twitter: "https://twitter.com",
            linkedin: "https://linkedin.com"
        },
        createdAt: new Date().toISOString()
    }
];

// Get all team members (Public)
router.get('/team', async (req, res) => {
    try {
        const { teamCollection } = getCollections();
        let team = await teamCollection.find().sort({ _id: 1 }).toArray();

        // Auto-seed if empty
        if (team.length === 0) {
            await teamCollection.insertMany(initialTeamMembers);
            team = await teamCollection.find().sort({ _id: 1 }).toArray();
        }

        res.send(team);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Add new team member (Admin)
router.post('/team', verifyToken, async (req, res) => {
    try {
        const { teamCollection } = getCollections();
        const member = {
            ...req.body,
            createdAt: new Date().toISOString()
        };
        const result = await teamCollection.insertOne(member);
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Update team member (Admin)
router.patch('/team/:id', verifyToken, async (req, res) => {
    try {
        const { teamCollection } = getCollections();
        const id = req.params.id;
        const updateData = req.body;
        delete updateData._id;

        const result = await teamCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateData, updatedAt: new Date().toISOString() } }
        );
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Delete team member (Admin)
router.delete('/team/:id', verifyToken, async (req, res) => {
    try {
        const { teamCollection } = getCollections();
        const id = req.params.id;
        const result = await teamCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;
