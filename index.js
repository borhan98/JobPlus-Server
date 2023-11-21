const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;


console.log(process.env.DB_USER, process.env.DB_PASS);

/*-----------------------------
         Middleware 
-------------------------------*/
app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://borhanuddindns420:j3Ds2nNCbxqSgznf@cluster0.dumb7x3.mongodb.net/?retryWrites=true&w=majority";

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
        const jobCollection = client.db("JobPlus").collection("jobs");

        app.get("/jobs", async (req, res) => {
            
            let query = {};
            let result = [];
            if (req.query.category) {
                query = { job_category: req.query.category };
                result = await jobCollection.find(query).toArray();
            } else if (req.query.email) {
                query = { author_email: req.query.email};
                result = await jobCollection.find(query).toArray();
            } else {
                result = [];
                result = await jobCollection.find().toArray();
            }
            res.send(result);
        })
        
        app.get("/jobs/:id", async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await jobCollection.findOne(query);
            res.send(result);
        })

        app.post("/jobs", async (req, res) => {
            const newJob = req.body;
            const result = await jobCollection.insertOne(newJob);
            res.send(result);
        })

        app.delete("/jobs/:id", async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await jobCollection.deleteOne(query);
            res.send(result);
        })




        // Send a ping to confirm a successful connection
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get("/", (req, res) => {
    res.send("JobPlus server is running");
})
app.listen(port, () => {
    console.log(`JobPlus server is running on port: ${port}`);
})