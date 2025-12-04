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
  birthday: { type: String },
  barAcc: {type: Boolean},
  bar: {type: String},
  profilePicUrl: { type: String, default: "" },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
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

// Comment Schema
const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  profilePicUrl: { type: String, default: "" },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const BarTime = mongoose.model("BarTime", barSchema);
const Post = mongoose.model("Post", postSchema);
const Comment = mongoose.model("Comment", commentSchema);
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
  const user = await User.findById(req.userId)
  .select("-password")
  res.json(user);
});

// Update user profile (including profile picture)
app.put("/profile", verifyToken, async (req, res) => {
  try {
    const { profilePicUrl } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (profilePicUrl !== undefined) {
      user.profilePicUrl = profilePicUrl;
    }

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// ========== FRIENDS ROUTES ==========

// get all users (important: used for finding friends, excludes passwords)
app.get("/users", verifyToken, async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password") // don't send passwords to frontend
      .lean();

    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      profilePicUrl: user.profilePicUrl || "",
      birthday: user.birthday || ""
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// get current user's friends (important: populates friend data from user collection)
app.get("/friends", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'username profilePicUrl birthday')
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const formattedFriends = (user.friends || []).map(friend => ({
      id: friend._id.toString(),
      username: friend.username,
      profilePicUrl: friend.profilePicUrl || "",
      birthday: friend.birthday || ""
    }));

    res.json(formattedFriends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ message: "Error fetching friends" });
  }
});

// add a friend (important: validates user exists, prevents self-add, prevents duplicates)
app.post("/friends/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    // can't add yourself
    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot add yourself as a friend" });
    }

    // validate objectid format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // check if user exists
    const friendToAdd = await User.findById(userId);
    if (!friendToAdd) {
      return res.status(404).json({ message: "User not found" });
    }

    // get current user
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    // check if already friends (important: prevents duplicates)
    if (currentUser.friends.includes(new mongoose.Types.ObjectId(userId))) {
      return res.status(400).json({ message: "User is already your friend" });
    }

    // add friend to friends array
    currentUser.friends.push(new mongoose.Types.ObjectId(userId));
    await currentUser.save();

    res.json({ message: "Friend added successfully" });
  } catch (error) {
    console.error("Error adding friend:", error);
    res.status(500).json({ message: "Error adding friend" });
  }
});

// remove a friend (important: filters friend from array)
app.delete("/friends/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    // validate objectid format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // get current user
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    // remove friend from array
    currentUser.friends = currentUser.friends.filter(
      friendId => friendId.toString() !== userId
    );
    await currentUser.save();

    res.json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({ message: "Error removing friend" });
  }
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

// create a new post (important: saves profilepicurl from user at time of creation, imageurl comes from firebase)
app.post("/posts", verifyToken, async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    
    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Post content is required" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // create post with user info (important: saves profilepicurl so it persists even if user changes it later)
    const newPost = new Post({
      userId: req.userId,
      username: user.username,
      content: content.trim(),
      imageUrl: imageUrl || "", // firebase url if image was uploaded
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

// get all posts for feed (important: optional auth, checks if user liked each post, gets comment counts, falls back to current profile pics)
app.get("/posts", async (req, res) => {
  try {
    // try to get user id from token (optional - works for logged in and logged out users)
    let currentUserId = null;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.id.toString();
      }
    } catch (err) {
      // no token or invalid token - that's fine, user just isn't logged in
    }

    // get all posts, newest first
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // get comment counts for all posts (important: aggregates from comments collection)
    const postIds = posts.map(p => p._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } }
    ]);
    const commentCountMap = {};
    commentCounts.forEach(item => {
      commentCountMap[item._id.toString()] = item.count;
    });

    // get current profile pics for all users (important: fallback if post doesn't have profilepicurl)
    const userIds = [...new Set(posts.map(p => p.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).select('_id profilePicUrl').lean();
    const userProfilePicMap = {};
    users.forEach(user => {
      userProfilePicMap[user._id.toString()] = user.profilePicUrl || "";
    });

    // format posts for frontend
    const formattedPosts = posts.map(post => {
      // check if current user has liked this post (important: looks in likedBy array)
      const hasLiked = currentUserId && post.likedBy 
        ? post.likedBy.some(id => id.toString() === currentUserId)
        : false;

      // use post's profilepicurl if available, otherwise get current user's profilepicurl (important: fallback for old posts)
      const profilePicUrl = post.profilePicUrl || userProfilePicMap[post.userId.toString()] || "";

      return {
        id: post._id.toString(),
        userId: post.userId.toString(),
        username: post.username,
        text: post.content,
        image: post.imageUrl || null,
        profilePicUrl: profilePicUrl,
        time: getTimeAgo(post.createdAt),
        liked: hasLiked,
        likeCount: post.likes || 0,
        commentCount: commentCountMap[post._id.toString()] || 0
      };
    });

    res.json(formattedPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
});

// get posts by specific user (important: same logic as get all posts but filtered by userid)
app.get("/posts/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // try to get current user id from token (optional)
    let currentUserId = null;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.id.toString();
      }
    } catch (err) {
      // no token or invalid token - that's fine
    }

    // get posts for this user
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // get comment counts
    const postIds = posts.map(p => p._id);
    const commentCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } }
    ]);
    const commentCountMap = {};
    commentCounts.forEach(item => {
      commentCountMap[item._id.toString()] = item.count;
    });

    // get current profile pics (fallback for old posts)
    const userIds = [...new Set(posts.map(p => p.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).select('_id profilePicUrl').lean();
    const userProfilePicMap = {};
    users.forEach(user => {
      userProfilePicMap[user._id.toString()] = user.profilePicUrl || "";
    });

    const formattedPosts = posts.map(post => {
      // check if current user has liked this post
      const hasLiked = currentUserId && post.likedBy 
        ? post.likedBy.some(id => id.toString() === currentUserId)
        : false;

      // Use post's profilePicUrl if available, otherwise get current user's profilePicUrl
      const profilePicUrl = post.profilePicUrl || userProfilePicMap[post.userId.toString()] || "";

      return {
        id: post._id.toString(),
        userId: post.userId.toString(),
        username: post.username,
        text: post.content,
        image: post.imageUrl || null,
        profilePicUrl: profilePicUrl,
        time: getTimeAgo(post.createdAt),
        liked: hasLiked,
        likeCount: post.likes || 0,
        commentCount: commentCountMap[post._id.toString()] || 0
      };
    });

    res.json(formattedPosts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Error fetching user posts" });
  }
});

// like/unlike a post (important: toggles like, adds/removes user from likedBy array, updates count)
app.post("/posts/:postId/like", verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // check if user already liked this post
    const userIdStr = req.userId.toString();
    const likedIndex = post.likedBy.findIndex(id => id.toString() === userIdStr);

    if (likedIndex === -1) {
      // user hasn't liked, so add like
      post.likedBy.push(req.userId);
      post.likes += 1;
    } else {
      // user has liked, so remove like
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

// delete a post (important: only owner can delete)
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

// ========== COMMENT ROUTES ==========

// get comments for a post (important: validates objectid, sorts oldest first)
app.get("/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    
    // validate objectid format
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }
    
    // get comments for this post, oldest first
    const comments = await Comment.find({ postId: new mongoose.Types.ObjectId(postId) })
      .sort({ createdAt: 1 })
      .lean();

    const formattedComments = comments.map(comment => ({
      id: comment._id.toString(),
      userId: comment.userId.toString(),
      username: comment.username,
      profilePicUrl: comment.profilePicUrl || "",
      text: comment.text,
      time: getTimeAgo(comment.createdAt)
    }));

    res.json(formattedComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Error fetching comments" });
  }
});

// create a comment on a post (important: saves profilepicurl from user at time of creation)
app.post("/posts/:postId/comments", verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // validate objectid format
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Get user info
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newComment = new Comment({
      postId: new mongoose.Types.ObjectId(postId),
      userId: new mongoose.Types.ObjectId(req.userId),
      username: user.username,
      profilePicUrl: user.profilePicUrl || "",
      text: text.trim()
    });

    await newComment.save();

    // Format comment for response
    const formattedComment = {
      id: newComment._id.toString(),
      userId: newComment.userId.toString(),
      username: newComment.username,
      profilePicUrl: newComment.profilePicUrl || "",
      text: newComment.text,
      time: getTimeAgo(newComment.createdAt)
    };

    res.status(201).json({ message: "Comment created successfully", comment: formattedComment });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Error creating comment" });
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