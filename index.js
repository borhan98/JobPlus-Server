const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser')
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;


/*-----------------------------
         Middleware 
-------------------------------*/
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser())

/*-----------------------------
        Custom Middleware 
-------------------------------*/
const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send({message: "You are not authorized user"})
    }
    jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({message: "Unauthorized access"});
        }
        req.user = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dumb7x3.mongodb.net/?retryWrites=true&w=majority`;

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
        const applicationCollection = client.db("JobPlus").collection("applications");
        const featureJobsCollection = client.db("JobPlus").collection("featureJobs");

        /*------------------------------------------------
                        Jobs related APIs 
        --------------------------------------------------*/
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: "1h"});
            res
            .cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
            })
            .send({success: true});
        })

        /*------------------------------------------------
                        Jobs related APIs 
        --------------------------------------------------*/
        app.get("/jobs", async (req, res) => {
            let query = {};
            let result = [];
            if (req.query.category) {
                query = { job_category: req.query.category };
                result = await jobCollection.find(query).toArray();
            } else if (req.query.email) {
                query = { author_email: req.query.email };
                result = await jobCollection.find(query).toArray();
            } else {
                result = [];
                result = await jobCollection.find().toArray();
            }
            res.send(result);
        })

        app.get("/jobs/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobCollection.findOne(query);
            res.send(result);
        })

        app.post("/jobsByIds", async (req, res) => {
            const ids = req.body;
            const objectIds = ids.map(id => new ObjectId(id));
            const query = { _id: { $in: objectIds } };
            const result = await jobCollection.find(query).toArray();
            res.send(result);
        })

        app.post("/jobs", async (req, res) => {
            const newJob = req.body;
            const result = await jobCollection.insertOne(newJob);
            res.send(result);
        })

        app.put("/jobs/:id", async (req, res) => {
            const id = req.params.id;
            const job = req.body;
            const query = { _id: new ObjectId(id) };
            const options = { upsert: true };
            let result;
            const updatedJob = {
                $set: {
                    job_title: job.job_title,
                    job_description: job.job_description,
                    job_category: job.job_category,
                    salary_range: job.salary_range,
                    posting_date: job.posting_date,
                    company_logo: job.company_logo,
                    location: job.location,
                    deadline: job.deadline,
                    responsibilities: job.responsibilities,
                    image: job.image,
                }
            };

            if (job.increaseApplicant === 1) {
                const updateApplicant = {
                    $inc: { total_applied: job.increaseApplicant }
                }
                result = await jobCollection.updateOne(query, updateApplicant, options);
            } else {
                result = await jobCollection.updateOne(query, updatedJob, options);
            }
            res.send(result)
        })

        app.delete("/jobs/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobCollection.deleteOne(query);
            res.send(result);
        })

        /*------------------------------------------------
                        applications related APIs 
        --------------------------------------------------*/
        app.get("/applications", verifyUser, async (req, res) => {
            const user = req?.user?.email;
            if (req?.user?.email !== req.query.email) {
                return res.status(403).send({message: "Forbidden access"});
            }

            let query = {};
            let result = [];
            if (req.query.email) {
                const options = {
                    projection: { jobId: 1 }
                }
                query = { email: req.query.email }
                result = await applicationCollection.find(query, options).toArray();
            }
            res.send(result);
        })

        app.get("/applications/:jobId", async (req, res) => {
            const jobId = req.params.jobId;
            const query = { jobId };
            const result = await applicationCollection.findOne(query);
            res.send(result)
        })

        app.post("/applications", async (req, res) => {
            const newApplication = req.body;
            const result = await applicationCollection.insertOne(newApplication);
            res.send(result);
        })

        /*------------------------------------------------
                        Feature jobs related APIs 
        --------------------------------------------------*/
        app.get("/featureJobs", async (req, res) => {
            const result = await featureJobsCollection.find().toArray();
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