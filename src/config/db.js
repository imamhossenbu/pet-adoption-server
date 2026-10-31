const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ezhxw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db = null;
let collections = {};

async function connectDB() {
    if (db) return collections;
    try {
        // Ping database or acquire db instance
        db = client.db('petData');
        collections = {
            client,
            db,
            ObjectId,
            reviewCollection: db.collection('reviews'),
            petCollection: db.collection('pets'),
            adoptionCollection: db.collection('adoptions'),
            campaignCollection: db.collection('campaigns'),
            paymentCollection: db.collection('payments'),
            userCollection: db.collection('users'),
            faqCollection: db.collection('faqs'),
            categoryCollection: db.collection('categories'),
            otpCollection: db.collection('otps'),
            teamCollection: db.collection('team'),
            newsletterCollection: db.collection('subscribers'),
        };

        // Create index for OTP expiry (expires after 5 minutes)
        try {
            await collections.otpCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 });
        } catch (idxErr) {
            // Index might already exist
        }

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        return collections;
    } catch (err) {
        console.error("MongoDB connection error:", err);
        throw err;
    }
}

module.exports = {
    connectDB,
    getCollections: () => collections,
    ObjectId
};
