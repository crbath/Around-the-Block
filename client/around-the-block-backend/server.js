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
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aroundtheblock';
if (!process.env.MONGO_URI) {
  console.warn('[backend] MONGO_URI not set. Falling back to local MongoDB at', mongoUri);
}

mongoose.connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  birthday: { type: String },
  barAcc: {type: Boolean},
  bar: {type: String},
  profilePicUrl: { type: String, default: "" }
});

//bar schema for inputting wait times
const barSchema = new mongoose.Schema({
  barId: {type: String, required: true, unique:true}, //the bar id is returned with the osm call
  barName: {type:String},
  latitude: Number,
  longitude: Number,
  linked: {type: Boolean, default: false},
  deals: {type:String},
  hours: {type:String},
  timeEntries: [
    {  
      userId: {type: mongoose.Schema.Types.ObjectId, ref:"User", required: true},
      time: Number,
      createdAt: {type: Date, default:Date.now}
    }
  ]
})

const barPostSchema = new mongoose.Schema({
  barId: {type:String, ref:'BarTime', required: true},
  title: {type:String, required: true},
  content: {type: String},
  date: {type:Date, default: Date.now},
})

const BarPost = mongoose.model("BarPost", barPostSchema)

// Post Schema
const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String, default: "" },
  profilePicUrl: { type: String, default: "" },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now }
});

const BarTime = mongoose.model("BarTime", barSchema);
const Post = mongoose.model("Post", postSchema);
const User = mongoose.model("User", userSchema);

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.log("No token provided in request");
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Token verification failed:", err.message);
      return res.status(403).json({ message: "Invalid token" });
    }
    req.userId = decoded.id;
    console.log("Token verified, userId:", req.userId);
    next();
  });
};

app.get("/", (req, res) => {
  res.send("Around the Block backend is running!");
});

app.get("/profile", verifyToken, async (req, res) => {
  const user = await User.findById(req.userId)
  .select("-password")
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

    res.json({ message: "Login successful", token, userId: user._id.toString() });
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
      linked: false,
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
    const bars = await BarTime.aggregate([
      {
        $project: {
          _id: 0,
          id: "$barId",
          name: "$barName",
          latitude: { $toDouble: "$latitude" },
          longitude: { $toDouble: "$longitude" },
          avgTime: {
            $cond: {
              if: { $gt: [{ $size: "$timeEntries" }, 0] },
              then: { $avg: "$timeEntries.time" },
              else: null
            }
          }
        }
      }
    ]);

    res.json(bars);
  } catch (error) {
    console.error("Error fetching bars:", error);
    res.status(500).json({ message: "Error fetching bars" });
  }
});

// ========== POST ROUTES ==========

// Create a new post
app.post("/posts", verifyToken, async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    
    console.log("Create post request body:", req.body);
    console.log("Content:", content, "Type:", typeof content);
    console.log("ImageUrl:", imageUrl);
    
    // Validate content
    if (!content) {
      return res.status(400).json({ message: "Post content is required" });
    }
    
    const contentStr = String(content).trim();
    if (contentStr === "") {
      return res.status(400).json({ message: "Post content cannot be empty" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newPost = new Post({
      userId: req.userId,
      username: user.username,
      content: contentStr,
      imageUrl: imageUrl || "",
      profilePicUrl: user.profilePicUrl || "",
      likes: 0,
      likedBy: []
    });

    await newPost.save();
    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Error creating post" });
  }
});

// Get all posts (for feed)
app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Format posts for frontend
    const formattedPosts = posts.map(post => ({
      id: post._id.toString(),
      userId: post.userId.toString(),
      username: post.username,
      text: post.content,
      image: post.imageUrl || null,
      profilePicUrl: post.profilePicUrl || "",
      time: getTimeAgo(post.createdAt),
      liked: false, // Will be set by frontend based on user
      likeCount: post.likes || 0,
      commentCount: 0 // Can be added later
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
});

// Get posts by a specific user
app.get("/posts/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formattedPosts = posts.map(post => ({
      id: post._id.toString(),
      userId: post.userId.toString(),
      username: post.username,
      text: post.content,
      image: post.imageUrl || null,
      profilePicUrl: post.profilePicUrl || "",
      time: getTimeAgo(post.createdAt),
      liked: false,
      likeCount: post.likes || 0,
      commentCount: 0
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Error fetching user posts" });
  }
});

// Like/unlike a post
app.post("/posts/:postId/like", verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userIdStr = req.userId.toString();
    const likedIndex = post.likedBy.findIndex(id => id.toString() === userIdStr);

    if (likedIndex === -1) {
      // User hasn't liked, so like it
      post.likedBy.push(req.userId);
      post.likes += 1;
    } else {
      // User has liked, so unlike it
      post.likedBy.splice(likedIndex, 1);
      post.likes = Math.max(0, post.likes - 1);
    }

    await post.save();
    res.json({ 
      message: "Like updated", 
      likes: post.likes,
      liked: likedIndex === -1
    });
  } catch (error) {
    console.error("Error updating like:", error);
    res.status(500).json({ message: "Error updating like" });
  }
});

// Delete a post (only by the owner)
app.delete("/posts/:postId", verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    await Post.findByIdAndDelete(postId);
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Error deleting post" });
  }
});

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return `${Math.floor(diffInSeconds / 604800)}w`;
}

//TO LINK BAR TO A BAR-ACCOUNT
app.post("/select-bar", verifyToken, async(req, res) => {
      try{
      const {barId} = req.body

      const bar = await BarTime.findOne({barId})
      if(!bar) return res.status(404).json({message:"Bar not found"
      })

      if (bar.linked){
        return res.status(400).json({message:"This bar is already linked to another account."})
      }
      bar.linked = true;
      await bar.save()

      const user = await User.findById(req.userId)
      if (user.barAcc){
        return res.status(400).json({message:"This account is already linked to another bar!"})
 
      }
      user.barAcc = true

      console.log("Assigning bar to user:", bar.barId, typeof bar.barId);

      user.bar = bar.barId

      await user.save()


      res.json({message: "Bar linked", bar: user.bar})

    }catch(err){
      console.error(err)
      res.status(500).json({message: "Error linking account!"})
    }
    })

    app.post("/bar-posts", verifyToken, async(req, res)=>{
      try{
        const {title, content} = req.body

        const user = await User.findById(req.userId)
        if (!user.barAcc || !user.bar){
          return res.status(403).json({message:"You are not the bar account owner"})
        }
        const newPost = new BarPost({
          barId: user.bar,
          title,
          content
        })

        await newPost.save()
        res.status(201).json({message:"Post created", post: newPost})

      }catch(err){
        console.error(err)
        res.status(500).json({message:"Error creating post"})
      }
    })

    app.get("/bar-posts/:barId", async(req,res) =>{
      try{
        const posts = await BarPost.find({barId: req.params.barId})
        res.json(posts)
      }
      catch(err){
        console.error(err)
        res.status.json({message: "Error fetching posts"})
      }
    })

  app.post('/update-bar', verifyToken, async (req, res)=> {
  try{
    const {barId, deals, hours} = req.body
    
    const user = await User.findById(req.userId)
   
    const bar = await BarTime.findOne({barId})
    if(!bar) return res.status(404).json({message:"Bar not found"})

    console.log("THIS INFO HERE:", user.bar, bar.barId)

    //  if (!user.barAcc || user.bar !== bar.barId){
    //       return res.status(403).json({message:"You are not the bar account owner"})
    //  }  
    if (deals !== undefined) bar.deals = deals
    if (hours !== undefined) bar.hours = hours

    await bar.save()
    res.json({message: "Success!"}, barId)
  }catch(err){
    console.error(err)
    res.status(500).json({message:"Error updating information"})
  }

})

app.get('/bar/:barId', async(req, res)=>{
  try{
    console.log(req.params.barId)
    const bar = await BarTime.findOne({barId: req.params.barId})
    if (!bar) return res.status(404).json({message: "Couldn't find bar in db"})
    res.json({
      deals: bar.deals,
      hours: bar.hours,
  })  
  }catch(err){
    res.status(500).json({message: "Error fetching bar"})
  }
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});