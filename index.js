const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const app = express();
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.t17zvb5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SERCRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "access forbidden" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    const serviceCollection = client
      .db("photographerService")
      .collection("sercvices");
    const reviewsCollection = client
      .db("photographerService")
      .collection("reviews");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "2h",
      });
      console.log(token);
      res.send({ token });
    });
    app.get("/home", async (req, res) => {
      const mySort = { date: -1 };
      const query = {};
      const cursor = await serviceCollection.find(query).sort(mySort);
      const result = await cursor.limit(3).toArray();
      res.send(result);
    });
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = await serviceCollection.find(query);
      const service = await cursor.toArray();
      res.send(service);
    });
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewsCollection.findOne(query);
      res.send(result);
    });
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
    });
    app.put("/reviews/:id", async (req, res) => {
      const updateReview = req.body;
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updateDoc = {
        $set: {
          review: updateReview.review,
        },
      };
      const result = await reviewsCollection.updateOne(
        filter,
        updateDoc,
        option
      );
      res.send(result);
    });
    app.delete("/myReviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });
    app.get("/reviewsByQuery", verifyJWT, async (req, res) => {
      const decoded = req.decoded;

      if (decoded.email !== req.query.email) {
        return res.status(403).send({ message: "unauthorized access" });
      }
      let query = {};

      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }

      const result = await reviewsColection.find(query).toArray();
      res.send(result);
    });
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = await reviewsCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });
  } finally {
  }
}
run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("hhelllo");
});
app.listen(port, () => {
  console.log("server running");
});
