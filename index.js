const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 8000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k0fejmd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

let client;

async function connectToMongoDB() {
  try {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();

    console.log("Connected to MongoDB Atlas");
    return client;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

async function closeMongoDBConnection() {
  try {
    if (client && client.isConnected()) {
      await client.close();

      console.log("Disconnected from MongoDB Atlas");
    }
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
    throw error;
  }
}

connectToMongoDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on ${port} port`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  });

process.on("SIGINT", async () => {
  try {
    await closeMongoDBConnection();
    process.exit(0);
  } catch (error) {
    console.error("Error handling SIGINT:", error);
    process.exit(1);
  }
});

const productCollection = client.db("FreeSin").collection("productCollection");
const blogsCollection = client.db("FreeSin").collection("blogsCollection");
const cartsCollection = client.db("FreeSin").collection("cartsCollection");
const userCollection = client.db("FreeSin").collection("userCollection");

// JWT Route
app.post("/jwt", (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.Access_Token, {
    expiresIn: "1h",
  });
  res.send({ token });
});

// Product Route

app.get("/pagination", async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 6;
  const skip = page * limit;
  const result = await productCollection
    .find()
    .skip(skip)
    .limit(limit)
    .toArray();
  res.send(result);
});

app.get("/product", async (req, res) => {
  const result = await productCollection.find().toArray();
  res.send(result);
});

app.get("/product/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const result = await productCollection.findOne(filter);
  res.send(result);
});

// Blogs Route

app.get("/blogsPagination", async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 1;
  const skip = page * limit;
  const result = await blogsCollection.find().skip(skip).limit(limit).toArray();
  res.send(result);
});

app.get("/blogs", async (req, res) => {
  const result = await blogsCollection.find().toArray();
  res.send(result);
});

app.get("/blogs/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const result = await blogsCollection.findOne(filter);
  res.send(result);
});

// Cart Route

app.get("/carts", async (req, res) => {
  const email = req.query.email;
  if (!email) {
    res.send([]);
  }
  const filter = { email: email };
  const result = await cartsCollection.find(filter).toArray();
  res.send(result);
});

app.post("/carts", async (req, res) => {
  const cart = req.body;
  const result = await cartsCollection.insertOne(cart);
  res.send(result);
});

app.delete("/carts/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const result = await cartsCollection.deleteOne(filter);
  res.send(result);
});

// User Route

app.get("/user", async (req, res) => {
  const result = await userCollection.find().toArray();
  res.send(result);
});

app.post("/user", async (req, res) => {
  const user = req.body;
  const existingUser = await userCollection.findOne({ email: user.email });
  if (existingUser) {
    return existingUser;
  }
  const result = await userCollection.insertOne(user);
  res.send(result);
});