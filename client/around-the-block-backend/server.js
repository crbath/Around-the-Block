import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';  
import jwt from 'jsonwebtoken';

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  birthday: { type: String }
});

//bar schema for inputting wait times
const barSchema = new mongoose.Schema({
  barId: {type: String, required: true, unique:true}, //the bar id is returned with the osm call
  barName: {type:String},
  latitude: Number,
  longitude: Number,
  timeEntries: [
    {  
      userId: {type: mongoose.Schema.Types.ObjectId, ref:"User", required: true},
      time: Number,
      createdAt: {type: Date, default:Date.now}
    }
  ]
})

const Bar = require("./models/Bar");

const BarTime = mongoose.model("BarTime", barSchema)

const User = mongoose.model("User", userSchema);

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.userId = decoded.id;
    next();
  });
};

app.get("/", (req, res) => {
  res.send("Around the Block backend is running!");
});

app.get("/profile", verifyToken, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json(user);
});


// Signup Route
app.post("/signup", async (req, res) => {
  try {
    const { username, password, birthday } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword, birthday });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Create a token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//to enter the wait time to a bar
app.post("/bartime", verifyToken, async (req, res) => {
  console.log("Headers: ", req.headers)
  try{
    const {barId, barName, latitude,longitude,time} = req.body;
  
  if (time === undefined || time === null) {
    return res.status(400).json({message: "Wait time is required"})
  }

  let bar = await BarTime.findOne({barId})

  if (!bar){
    bar = new BarTime({
      barId,
      barName,
      latitude,
      longitude,
      timeEntries: []
    })
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentEntry = bar.timeEntries.find(
    entry => entry.userId.toString() === req.userId.toString() && entry.createdAt > oneHourAgo
  )
  //prevent post spam
  if (recentEntry){
    return res.status(400).json({message: "No spamming wait times!"})
  }

  bar.timeEntries.push({
    userId: req.userId,
    time
  })

  await bar.save()
  res.json({message: "Saved"})
}
catch(err){
  //set error...
  res.status(500).json({message: "Error adding time"})
}
})

//get the bar wait time on select
app.get("/bartime/:barId", async(req, res) => {
  try{
    const bar = await BarTime.findOne({barId: req.params.barId})

    if(!bar || bar.timeEntries.length === 0){
      return res.json({average: null})
    }

    const now = Date.now()
    let weightedSum = 0
    let totalWeight = 0

    const dumpTime = 3 * 60 * 60 * 1000 //three hours for now, we can change this

    //remove older entries: 2 options...
    //option 1, just filter them out at time of
    const entriesInTime = bar.timeEntries.filter(
      timeEntry => now - timeEntry.createdAt.getTime()<=dumpTime
    )
  
    if( entriesInTime.length === 0){
      return res.json({average: null})
    }

    entriesInTime.forEach(entry => {
      const ageMinutes = (now - entry.createdAt.getTime()) /60000
      const weight = 1 / (ageMinutes + 1)

        weightedSum += entry.time * weight
        totalWeight += weight
    })
    const weightedAverage = totalWeight > 0 ? (weightedSum / totalWeight) : null

    res.json({
      average: Number(weightedAverage),
    })

    //option 2, remove entirely from db (Maybe we do it every few weeks and just store trends?)
    /*
     bar.timeEntries = bar.timeEntries.filter(
      entry => now - entry.createdAt.getTime() <= dumpTime
    )

    await bar.save()

    if(!bar || bar.timeEntries.length === 0){
      return res.json({average: null})
    }

    bar.timeEntries.forEach(entry => {
      const ageMinutes = (now - entry.createdAt.getTime()) /60000
      const weight = 1 / (ageMinutes + 1)

        weightedSum += entry.time * weight
        totalWeight += weight
    })
    const weightedAverage = weightedSum / totalWeight

    res.json({
      average: Number(weightedAverage),
    })
    */
  }
  catch(err){
    console.log("Get error")
    //set error message
  }
})

app.get("/bars", async (req, res) => {
  try {
    const bars = await Bar.aggregate([
      {
        $project: {
          _id: 0,
          id: "$barId",
          name: "$barName",
          latitude: { $toDouble: "$latitude" },
          longitude: { $toDouble: "$longitude" },
          avgTime: { $avg: "$timeEntries.time" }
        }
      }
    ]);

    res.json(bars);
  } catch (error) {
    console.error("Error fetching bars:", error);
    res.status(500).json({ message: "Error fetching bars" });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});