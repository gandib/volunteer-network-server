const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;
const app = express();



// middleware
app.use(cors());
app.use(express.json());



function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.up2di1t.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        await client.connect();
        const refugeCollection = client.db('volunteerRefuge').collection('refuge');
        const volunteerCollection = client.db('registerVolunteer').collection
            ('volunteer');
        const eventCollection = client.db('addEvents').collection('event');


        //Auth
        app.post('/login', async (req, res) => {
            const user = req.body;
            console.log(user)
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        });


        app.get('/refuge', async (req, res) => {
            const query = {};
            const cursor = refugeCollection.find(query);
            const refuges = await cursor.toArray();
            res.send(refuges);
        });


        app.get('/refuge/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const refuge = await refugeCollection.findOne(query);
            res.send(refuge);
        });

        app.get('/volunteer', async (req, res) => {
            const query = {};
            const cursor = volunteerCollection.find(query);
            const volunteers = await cursor.toArray();
            res.send(volunteers);
        });

        app.get('/productByNames', async (req, res) => {
            const names = req.body.name;

            const allNames = names.map(name => ObjectId(name));

            const query = { $text: { $search: allNames } };
            const cursor = volunteerCollection.find(query);
            const volunteers = await cursor.toArray();
            res.send(volunteers);
        });



        app.post('/volunteer', async (req, res) => {
            const volunteer = req.body;
            const volunteers = await volunteerCollection.insertOne(volunteer);
            res.send(volunteers);
        });

        app.delete('/volunteer/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await volunteerCollection.deleteOne(query);
            res.send(result);
        });

        app.get('/volunteer/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await volunteerCollection.findOne(query);
            res.send(result);
        });


        app.post('/addevent', async (req, res) => {
            const event = req.body;
            const events = await eventCollection.insertOne(event);
            res.send(events);
        });

        app.get('/addevent', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = eventCollection.find(query);
                const events = await cursor.toArray();
                res.send(events);
            }
            else {
                res.status(403).send({ message: 'forbidden access' });
            }

        });




    }
    finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Running Volunteer Server");
});

app.listen(port, () => {
    console.log('Volunteer is running', port);
});