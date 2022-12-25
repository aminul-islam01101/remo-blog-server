/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
/* eslint-disable no-empty */
import colors from 'colors';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';

// port and env
dotenv.config();
const app = express();
const port = process.env.PORT;
// middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});


// Set up default mongoose connection
const mongoDB = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dtbllhc.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// JWT middleware
// function verifyJWT(req, res, next) {
//     const authHeader = req.headers.authorization;
//     console.log(authHeader.error);

//     if (!authHeader) {
//         return res.status(401).send('unauthorized access');
//     }

//     const token = authHeader.split(' ')[1];
//     console.log(token.warn);

//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//         if (err) {
//             return res.status(403).send({ message: 'forbidden access' });
//         }
//         req.decoded = decoded;
//         console.log(req.decoded);
//         next();
//     });
// }

const run = async () => {
    try {
        const usersCollection = client.db('remoStart').collection('users');

        const blogsCollection = client.db('remoStart').collection('blogs');
        const categoryCollection = client.db('remoStart').collection('blogCategory');
        // verify admin middleware
        // const verifyAdmin = async (req, res, next) => {
        //     const decodedEmail = req.decoded.email;
        //     console.log(decodedEmail.error);

        //     const query = { email: decodedEmail };
        //     const user = await usersCollection.findOne(query);

        //     if (user?.role !== 'admin') {
        //         return res.status(403).send({ message: 'forbidden access' });
        //     }
        //     next();
        // };
        console.log('collectionH ',categoryCollection);
        

        // GET BLOGS
        app.get('/blogs', async (req, res) => {
            console.log('hello');
            
            const filter = {};
            const result = await blogsCollection.find(filter).toArray();
            console.log(result);
            
            res.send(result);
        });


    } finally {
    }
};
run().catch((err) => console.log(err));

colors.setTheme({
    info: 'green',
    help: 'cyan',
    warn: 'yellow',
    error: 'red',
});

app.get('/', (_req, res) => {
    res.send('First test server ');
});
// Error middleware
// 404 handlers

app.use((req, res) => {
    res.status(404).send('404 error! url does not exist');
});

app.use((err, req, res, next) => {
    if (res.headerSent) {
        return next(err);
    }

    return res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log('Server running on ports'.warn.italic, port);
});
