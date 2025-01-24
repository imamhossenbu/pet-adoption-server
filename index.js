const express = require('express');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cors = require('cors')
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_secret_key)


// middleware 
app.use(cors());
app.use(express.json()); 




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ezhxw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const reviewCollection = client.db('petData').collection('reviews');
        const petCollection = client.db('petData').collection('pets');
        const adoptionCollection = client.db('petData').collection('adoptions');
        const campaignCollection = client.db('petData').collection('campaigns');
        const paymentCollection = client.db('petData').collection('payments');
        const userCollection = client.db('petData').collection('users');




        // jwt token
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token })
        })

        // middleware
        const verifyToken = (req, res, next) => {

            if (!req.headers.authorization) {
                res.status(401).send({ message: 'Token not found' })
                return;
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    res.status(403).send({ message: 'Unauthorized access' })
                    return;
                }
                req.user = decoded;
                next();
            })

        }




        // pets collection
        app.post('/pet',verifyToken, async (req, res) => {
            const petItem = req.body;
            const result = await petCollection.insertOne(petItem);
            res.send(result);
        })



        app.get('/pets', async (req, res) => {
            const { search, category, page = 1, limit = 10 } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const query = {
                adopted: false,
                ...(search && { petName: { $regex: search, $options: 'i' } }),
                ...(category && { petCategory: category }),
            };

            // Fetch pets
            const pets = await petCollection
                .find(query)
                .sort({ dateAdded: -1 }) // Sort by dateAdded (descending)
                .skip(skip)
                .limit(limitNum)
                .toArray();

            // Total count of filtered pets
            const totalPets = await petCollection.countDocuments(query);

            // Determine if there are more pets
            const hasMore = skip + pets.length < totalPets;

            // Respond with data
            res.send({ pets, hasMore });
        })

        app.get('/allPets',verifyToken, async (req, res) => {
            const result = await petCollection.find().toArray();
            res.send(result);
        })


        app.get('/pets/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await petCollection.findOne(query);
            res.send(result);
        })


        app.get('/pet/:email',verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.user.email) {
                return res.status(403).send({ message: 'Unauthorized access' });
            }
            const query = { userEmail: email }
            const result = await petCollection.find(query).toArray()
            res.send(result);
        })

        app.delete('/pet/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await petCollection.deleteOne(query)
            res.send(result)
        })


        app.put('/pet/:id',verifyToken, async (req, res) => {
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
            }
            const result = await petCollection.updateOne(filter, updatedData, option);

            res.send(result);
        })

        app.patch('/pets/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = { _id: new ObjectId(id) };
            const updatedData = {
                $set: {
                    adopted: data.adopted
                }
            }
            const result = await petCollection.updateOne(filter, updatedData)
            res.send(result);
        })



        app.patch('/update-adoption/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const { adopted } = req.body;
            const query = { _id: new ObjectId(id) };
            const updated = {
                $set: {
                    adopted: adopted
                }
            }
            const result = await petCollection.updateOne(query, updated)
            await petCollection.find().toArray();
            res.send(result)
        })

        // adoption collection

        app.post('/adoption', async (req, res) => {
            const adoptionData = req.body;
            const result = await adoptionCollection.insertOne(adoptionData);
            res.send(result);
        })


        app.get('/adoptions/:email',verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.user.email) {
                return res.status(403).send({ message: 'Unauthorized access' });
            }
            const userPets = await petCollection.find({ userEmail: email }).toArray();
            const petIds = userPets.map(pet => pet._id.toString());
            const adoptionRequests = await adoptionCollection.find({ petId: { $in: petIds } }).toArray();
            res.send(adoptionRequests);
        });

        app.patch('/adoptions/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const update = { $set: { status: "accepted" } };
            const result = await adoptionCollection.updateOne(filter, update);
            res.send(result);
        })

        app.delete('/adoptions/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const result = await adoptionCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });




        // campaign collection

        app.post('/donation-campaigns',verifyToken, async (req, res) => {
            const newCampaign = req.body;
            const result = await campaignCollection.insertOne(newCampaign);
            res.send(result);
        });


        app.get('/donation-campaigns/:email',verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.user.email) {
                return res.status(403).send({ message: 'Unauthorized access' });
            }
            const query = { createdBy: email }
            const result = await campaignCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/donations', async (req, res) => {
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
        });


        app.get('/donation-campaigns', async (req, res) => {
            const result = await campaignCollection.find().toArray();
            res.send(result);
        })


        app.get('/donation/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await campaignCollection.findOne(query);
            res.send(result)
        })

        app.put('/donation-campaigns/:id',verifyToken, async (req, res) => {
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
            }
            const result = await campaignCollection.updateOne(query, updatedData, options);
            res.send(result);
        })

        app.patch('/donations/:id', async (req, res) => {
            const id = req.params.id;
            const { paused } = req.body;
            const query = { _id: new ObjectId(id) };
            const updatedData = {
                $set: {
                    paused: paused
                }
            }
            const result = await campaignCollection.updateOne(query, updatedData);
            res.send(result);
        })


        app.get('/donations/recommended', async (req, res) => {
            const { exclude } = req.query;
            const recommendedDonations = await campaignCollection.find({ _id: { $ne: new ObjectId(exclude) } }).limit(3).toArray();
            res.send(recommendedDonations);
        });


        app.delete('/refund-donation/:id',verifyToken, async (req, res) => {
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
            }
        })

        app.delete('/donations/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await campaignCollection.deleteOne(query);
            res.send(result)
        })






        // payment intent

        app.post('/create-payment-intent',verifyToken, async (req, res) => {
            const { donation } = req.body;
            const amount = parseInt(donation * 100);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card'],
            })

            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })


        // payment collection
        app.post('/payment',verifyToken, async (req, res) => {
            const paymentData = req.body;
            console.log(paymentData);
            const result = await paymentCollection.insertOne(paymentData);
            await campaignCollection.updateOne(
                { _id: new ObjectId(paymentData.donationId) },
                { $inc: { donatedAmount: parseFloat(paymentData.amount) } }
            );
            res.send({ paymentResult: result });
        })


        app.get('/donators/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { donationId: id };
            const result = await paymentCollection.find(query).toArray();
            res.send(result);
        })


        app.get('/my-donations/:email',verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.user.email) {
                return res.status(403).send({ message: 'Unauthorized access' });
            }

            const donations = await paymentCollection.aggregate([
                {
                    $match: { email: email }
                },
                {
                    $addFields: {
                        donationIdObj: { $toObjectId: "$donationId" } // Convert donationId to ObjectId
                    }
                },
                {
                    $lookup: {
                        from: 'campaigns',
                        localField: 'donationIdObj',
                        foreignField: '_id',
                        as: 'campaignDetails'
                    }
                },
                {
                    $unwind: '$campaignDetails'
                },
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
        })



        // user collection
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user?.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                res.send({ message: 'User already exists', insertedId: null });
                return;
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        app.get('/users/admin/:email',verifyToken, async (req, res) => {
            const email = req.params.email;

            if (email !== req.user.email) {
                return res.status(403).send({ message: 'Unauthorized access' });
            }

            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;

            if (user) {
                admin = user.role === 'admin';
            }

            res.send({ admin });
        });


        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result)
        })

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const update = {
                $set: {
                    role: 'admin'
                }
            };
            const updatedData = await userCollection.updateOne(query, update);
            res.send(updatedData);
        })


        app.patch('/users/admin/ban/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const { isBanned } = req.body;
            const query = { _id: new ObjectId(id) };
            const updated = {
                $set: {
                    isBanned: isBanned
                }
            }
            const result = await userCollection.updateOne(query, updated);
            res.send(result);
        })


        app.get('/users/email/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await userCollection.findOne(query);
            res.send(result);
        })





        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('hello! From Pet Adoption server');
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})