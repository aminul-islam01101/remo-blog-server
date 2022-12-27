/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
/* eslint-disable no-empty */
import colors from 'colors';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';

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
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(authHeader.error);

    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];
    console.log(token.warn);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        req.decoded = decoded;
        console.log(req.decoded);
        next();
    });
}

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

        // saving a user in USERS collection

        app.put('/user/:email', async (req, res) => {
            console.log('hello');

            const { email } = req.params;
            const user = req.body;

            const filter = { email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: user,
            };

            const result = await usersCollection.updateOne(filter, updatedDoc, options);

            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '10d',
            });
            res.send({ result, token });
        });

        // admin routes functionality
        // admin id finding
        app.get('/users/admin/:email', async (req, res) => {
            const { email } = req.params;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({
                isAdmin: user?.role === 'admin',
            });
        });

        // seller id finding
        app.get('/users/user/:email', async (req, res) => {
            const { email } = req.params;
            const query = { email };
            console.log(email);
            const user = await usersCollection.findOne(query);
            res.send({ isUser: user?.role !== 'admin' });
        });

        // for dashboard user role
        app.get('/user', async (req, res) => {
            const { email } = req.query;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ message: 'success', user });
        });

        // add product page: POST a book
        app.post('/add-blog', async (req, res) => {
            const { title, authorName } = req.body;
            const query = { title, authorName };
            const alreadyStored = await blogsCollection.findOne(query);
            if (alreadyStored) {
                res.send({ message: 'You Have already posted this blog' });
                return;
            }
            const addBlog = await blogsCollection.insertOne(req.body);

            res.send(addBlog);
        });

        // GET BLOGS
        app.get('/blogs', async (req, res) => {
            const filter = {};
            const result = await blogsCollection.find(filter).toArray();
            console.log(result);

            res.send(result);
        });

        // GET a selcted BLOGS
        app.get('/blogs/:id', async (req, res) => {
            const { id } = req.params;
            const filter = { _id: ObjectId(id) };
            const result = await blogsCollection.findOne(filter);
            console.log(result);

            res.send(result);
        });
        // GET Category
        app.get('/blog-category', async (req, res) => {
            const filter = {};
            const result = await categoryCollection.find(filter).toArray();
            console.log(result);

            res.send(result);
        });

        // Get Categorized Blogs
        app.get('/category-blogs/:id', async (req, res) => {
            console.log('hello');
            const { id } = req.params;

            const filter = { categoryId: id };
            const result = await blogsCollection.find(filter).toArray();
            console.log(result);

            res.send(result);
        });
        // adding like array in collection

        app.post('/like', async (req, res) => {
            const { id, email } = req.query;

           
                const obj = { email, like: true };

                const updatedBlog = await blogsCollection.updateOne(
                    { _id: ObjectId(id) },
                    { $addToSet: { like: obj } }
                );
                res.send(updatedBlog);
          
        });

        // get like status

        app.get('/like/:id', async (req, res) => {
          
            const { id } = req.params;

            const filter = { _id: ObjectId(id) };
            const result = await blogsCollection.findOne(filter);
            console.log(result);

            res.send(result);
        });
        // app.get('/likestatus', async (req, res) => {
          
        //     const { id, email } = req.query;

        //     const filter = { _id: ObjectId(id) };
        //     const result = await blogsCollection.findOne(filter);
        //     console.log(result.like);
        //     console.log(email);
            
            
        //   if (result?.like) {
        //     const status = result?.like.filter((liked) => liked.email===email)
        //    console.log(status);
           
            
        //     if (status) {
        //         res.send(true)
               
        //     }
        //     else {
        //         res.send(false);
        //     }
        //     return
        //   }

        //     res.send(false);
        // });







        //  adding comments array in collection
        app.post('/comment/:id', async (req, res) => {
            const { id } = req.params;
        
            const filter = { _id: ObjectId(id) };
            const result = await blogsCollection.findOne(filter);
        
            const comments = req.body;
        
            const updatedBlog = await blogsCollection.update(
                { _id: ObjectId(id) },
                { $addToSet: { comments} }
            );
            res.send(updatedBlog);
        });
     

        // get comments

        // Get Categorized Blogs
        app.get('/comments/:id', async (req, res) => {
            const { id } = req.params;
            console.log('heell');
            

            const filter = { _id: ObjectId(id) };
            const result = await blogsCollection.findOne(filter);

    

            res.send(result?.comments);
        });

// admin route functionality

app.delete('/blog/:id', async (req, res) => {
    const { id } = req.params;
    const filter = { _id: ObjectId(id) };
    const result = await blogsCollection.deleteOne(filter);
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
