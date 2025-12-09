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
  barAcc: { type: Boolean },
  bar: { type: String },
  profilePicUrl: { type: String, default: "" },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  currentCheckIn: { type: mongoose.Schema.Types.ObjectId, ref: "CheckIn", default: null }
});

//bar schema for inputting wait times
const barSchema = new mongoose.Schema({
  barId: { type: String, required: true, unique: true }, //the bar id is returned with the osm call
  barName: { type: String },
  latitude: Number,
  longitude: Number,
  linked: { type: Boolean, default: false },
  deals: { type: String },
  hours: { type: String },
  timeEntries: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      time: Number,
      createdAt: { type: Date, default: Date.now }
    }
  ]
})

const barPostSchema = new mongoose.Schema({
  barId: { type: String, ref: 'BarTime', required: true },
  title: { type: String, required: true },
  content: { type: String },
  date: { type: Date, default: Date.now },
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

// Comment Schema (important: stores comments separately from posts)
const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  profilePicUrl: { type: String, default: "" },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// CheckIn Schema - tracks when users check into locations
const checkInSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  profilePicUrl: { type: String, default: "" },
  barId: { type: String, required: true },
  barName: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  checkedInAt: { type: Date, default: Date.now },
  checkedOutAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true }
});

const BarTime = mongoose.model("BarTime", barSchema);
const Post = mongoose.model("Post", postSchema);
const Comment = mongoose.model("Comment", commentSchema);
const CheckIn = mongoose.model("CheckIn", checkInSchema);
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

// Update profile (including profile picture)
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

// Get user's friends
app.get("/friends", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends', 'username profilePicUrl birthday');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Transform friends data to include id field
    const friends = user.friends.map(friend => ({
      id: friend._id.toString(),
      username: friend.username,
      name: friend.username, // Use username as name if no separate name field
      profilePicUrl: friend.profilePicUrl,
      birthday: friend.birthday
    }));
    res.json(friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ message: "Error fetching friends" });
  }
});

// Get all users (excluding current user and existing friends) - for adding friends
app.get("/users", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all users except current user and existing friends
    // Convert to ObjectIds for proper MongoDB comparison
    const friendIds = (currentUser.friends || []).map(id =>
      typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
    );
    friendIds.push(new mongoose.Types.ObjectId(req.userId));

    console.log("Current userId:", req.userId);
    console.log("Friend IDs to exclude:", friendIds);

    const users = await User.find({
      _id: { $nin: friendIds }
    }).select('username profilePicUrl birthday');

    console.log("Found users:", users.length);

    // Transform users data
    const usersList = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      name: user.username,
      profilePicUrl: user.profilePicUrl || "",
      birthday: user.birthday || ""
    }));

    res.json(usersList);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});

// Add a friend by username
app.post("/friends", verifyToken, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the friend by username
    const friend = await User.findOne({ username });
    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if trying to add yourself
    if (friend._id.toString() === req.userId) {
      return res.status(400).json({ message: "Cannot add yourself as a friend" });
    }

    // Check if already friends
    if (currentUser.friends.includes(friend._id)) {
      return res.status(400).json({ message: "Already friends with this user" });
    }

    // Add friend
    currentUser.friends.push(friend._id);
    await currentUser.save();

    res.json({
      message: "Friend added successfully", friend: {
        id: friend._id.toString(),
        username: friend.username,
        name: friend.username,
        profilePicUrl: friend.profilePicUrl,
        birthday: friend.birthday
      }
    });
  } catch (error) {
    console.error("Error adding friend:", error);
    res.status(500).json({ message: "Error adding friend" });
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


app.post("/create-bar-if-needed", async (req, res) => {
  const { barId, barName, latitude, longitude, time } = req.body;
  let bar = await BarTime.findOne({ barId })
  if (!bar) {
    bar = new BarTime({ barId, barName, latitude, longitude })
    await bar.save()
  }
})

//to enter the wait time to a bar
app.post("/bartime", verifyToken, async (req, res) => {
  console.log("Headers: ", req.headers)
  try {
    const { barId, barName, latitude, longitude, time } = req.body;

    if (time === undefined || time === null) {
      return res.status(400).json({ message: "Wait time is required" })
    }

    let bar = await BarTime.findOne({ barId })

    if (!bar) {
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
    if (recentEntry) {
      return res.status(400).json({ message: "No spamming wait times!" })
    }

    bar.timeEntries.push({
      userId: req.userId,
      time
    })

    await bar.save()
    res.json({ message: "Saved" })
  }
  catch (err) {
    //set error...
    res.status(500).json({ message: "Error adding time" })
  }
})

//get the bar wait time on select
app.get("/bartime/:barId", async (req, res) => {
  try {
    const bar = await BarTime.findOne({ barId: req.params.barId })

    if (!bar || bar.timeEntries.length === 0) {
      return res.json({ average: null })
    }

    const now = Date.now()
    let weightedSum = 0
    let totalWeight = 0

    const dumpTime = 3 * 60 * 60 * 1000 //three hours for now, we can change this

    //remove older entries: 2 options...
    //option 1, just filter them out at time of
    const entriesInTime = bar.timeEntries.filter(
      timeEntry => now - timeEntry.createdAt.getTime() <= dumpTime
    )

    if (entriesInTime.length === 0) {
      return res.json({ average: null })
    }

    entriesInTime.forEach(entry => {
      const ageMinutes = (now - entry.createdAt.getTime()) / 60000
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
  catch (err) {
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

    // convert userId to ObjectId (important: ensures proper type for references)
    const userIdObj = new mongoose.Types.ObjectId(req.userId);
    
    const newPost = new Post({
      userId: userIdObj,
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

// Get all posts (for feed) (important: gets comment counts from comments collection)
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

    // Format posts for frontend (important: fetch profilePicUrl from User if post doesn't have it)
    const formattedPosts = await Promise.all(posts.map(async post => {
      // check if current user has liked this post (important: looks in likedBy array)
      // with .lean(), ObjectIds are still ObjectId instances, so we need to convert them
      let hasLiked = false;
      if (currentUserId && post.likedBy && post.likedBy.length > 0) {
        hasLiked = post.likedBy.some(id => {
          // handle both ObjectId and string formats
          const idStr = id.toString ? id.toString() : String(id);
          return idStr === currentUserId;
        });
      }

      // debug: only log posts with likes to reduce noise
      if (post.likes > 0 || (post.likedBy && post.likedBy.length > 0)) {
        console.log(`Post ${post._id.toString()} - likes: ${post.likes}, likedBy length: ${post.likedBy?.length || 0}, hasLiked: ${hasLiked}`);
      }

      // get profilePicUrl from post, or fetch from User if missing
      let displayProfilePicUrl = post.profilePicUrl || "";
      if (!displayProfilePicUrl) {
        try {
          const postUser = await User.findById(post.userId).select('profilePicUrl').lean();
          displayProfilePicUrl = postUser?.profilePicUrl || "";
        } catch (err) {
          console.error("Error fetching user profilePicUrl:", err);
        }
      }

      return {
        id: post._id.toString(),
        userId: post.userId.toString(),
        username: post.username,
        text: post.content,
        image: post.imageUrl || null,
        profilePicUrl: displayProfilePicUrl,
        time: getTimeAgo(post.createdAt),
        liked: hasLiked,
        likeCount: post.likes || 0,
        commentCount: commentCountMap[post._id.toString()] || 0
      };
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
});

// Get posts by a specific user (important: same logic as get all posts but filtered by userid)
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

    // Format posts for frontend (important: fetch profilePicUrl from User if post doesn't have it)
    const formattedPosts = await Promise.all(posts.map(async post => {
      // check if current user has liked this post
      const hasLiked = currentUserId && post.likedBy 
        ? post.likedBy.some(id => id.toString() === currentUserId)
        : false;

      // get profilePicUrl from post, or fetch from User if missing
      let displayProfilePicUrl = post.profilePicUrl || "";
      if (!displayProfilePicUrl) {
        try {
          const postUser = await User.findById(post.userId).select('profilePicUrl').lean();
          displayProfilePicUrl = postUser?.profilePicUrl || "";
        } catch (err) {
          console.error("Error fetching user profilePicUrl:", err);
        }
      }

      return {
        id: post._id.toString(),
        userId: post.userId.toString(),
        username: post.username,
        text: post.content,
        image: post.imageUrl || null,
        profilePicUrl: displayProfilePicUrl,
        time: getTimeAgo(post.createdAt),
        liked: hasLiked,
        likeCount: post.likes || 0,
        commentCount: commentCountMap[post._id.toString()] || 0
      };
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Error fetching user posts" });
  }
});

// Like/unlike a post (important: simple approach like comments - find, modify, save)
app.post("/posts/:postId/like", verifyToken, async (req, res) => {
  console.log("LIKE ROUTE CALLED - postId:", req.params.postId, "userId:", req.userId);
  try {
    const { postId } = req.params;
    
    // validate postId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      console.log("Invalid postId");
      return res.status(400).json({ message: "Invalid post ID" });
    }
    
    // find the post
    const post = await Post.findById(postId);
    if (!post) {
      console.log("Post not found");
      return res.status(404).json({ message: "Post not found" });
    }
    
    console.log("Post found - current likes:", post.likes, "likedBy length:", post.likedBy.length);
    
    // convert userId to ObjectId for comparison
    const userIdObj = new mongoose.Types.ObjectId(req.userId);
    const userIdStr = req.userId.toString();
    
    // check if user already liked this post
    const likedIndex = post.likedBy.findIndex(id => {
      const idStr = id.toString ? id.toString() : String(id);
      return idStr === userIdStr;
    });
    
    console.log("Liked index:", likedIndex);
    
    if (likedIndex === -1) {
      // user hasn't liked, so add like
      post.likedBy.push(userIdObj);
      post.likes += 1;
      console.log("Adding like - new count:", post.likes);
    } else {
      // user has liked, so remove like
      post.likedBy.splice(likedIndex, 1);
      post.likes = Math.max(0, post.likes - 1);
      console.log("Removing like - new count:", post.likes);
    }
    
    // mark array as modified (important: ensures mongoose saves array changes)
    post.markModified('likedBy');
    
    // save the post (same approach as comments)
    await post.save();
    console.log("Post saved - final likes:", post.likes, "final likedBy length:", post.likedBy.length);
    
    // verify it was actually saved by fetching fresh from database
    const verifyPost = await Post.findById(postId).lean();
    console.log("Verification - likes in DB:", verifyPost.likes, "likedBy in DB:", verifyPost.likedBy.length, "likedBy array:", verifyPost.likedBy);
    
    res.json({
      message: "Like updated",
      likes: verifyPost.likes,
      liked: likedIndex === -1
    });
  } catch (error) {
    console.error("Error updating like:", error);
    console.error("Error details:", error.message, error.stack);
    res.status(500).json({ message: "Error updating like", error: error.message });
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

    // verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // get user info
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // create comment with user info (important: saves profilepicurl so it persists even if user changes it later)
    const newComment = new Comment({
      postId: new mongoose.Types.ObjectId(postId),
      userId: new mongoose.Types.ObjectId(req.userId),
      username: user.username,
      profilePicUrl: user.profilePicUrl || "",
      text: text.trim()
    });

    await newComment.save();

    // format comment for response
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
app.post("/select-bar", verifyToken, async (req, res) => {
  try {
    const { barId } = req.body

    const bar = await BarTime.findOne({ barId })
    if (!bar) return res.status(404).json({
      message: "Bar not found"
    })

    if (bar.linked) {
      return res.status(400).json({ message: "This bar is already linked to another account." })
    }
    bar.linked = true;
    await bar.save()

    const user = await User.findById(req.userId)
    if (user.barAcc) {
      return res.status(400).json({ message: "This account is already linked to another bar!" })

    }
    user.barAcc = true

    console.log("Assigning bar to user:", bar.barId, typeof bar.barId);

    user.bar = bar.barId

    await user.save()

    // console.log("Assigning bar to user:", bar.barId, typeof bar.barId);

    // user.bar = bar.barId

    // await user.save()


    // res.json({ message: "Bar linked", bar: user.bar })

    res.json({ message: "Bar linked", bar: user.bar })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Error linking account!" })
  }
})

app.post("/bar-posts", verifyToken, async (req, res) => {
  try {
    const { title, content } = req.body

    const user = await User.findById(req.userId)
    if (!user.barAcc || !user.bar) {
      return res.status(403).json({ message: "You are not the bar account owner" })
    }
    const newPost = new BarPost({
      barId: user.bar,
      title,
      content
    })

    await newPost.save()
    res.status(201).json({ message: "Post created", post: newPost })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Error creating post" })
  }
})

app.get("/bar-posts/:barId", async (req, res) => {
  try {
    const posts = await BarPost.find({ barId: req.params.barId })
    res.json(posts)
  }
  catch (err) {
    console.error(err)
    res.status.json({ message: "Error fetching posts" })
  }
})

app.post('/update-bar', verifyToken, async (req, res) => {
  try {
    const { barId, deals, hours } = req.body

    const user = await User.findById(req.userId)

    const bar = await BarTime.findOne({ barId })
    if (!bar) return res.status(404).json({ message: "Bar not found" })

    console.log("THIS INFO HERE:", user.bar, bar.barId)

    //  if (!user.barAcc || user.bar !== bar.barId){
    //       return res.status(403).json({message:"You are not the bar account owner"})
    //  }  
    if (deals !== undefined) bar.deals = deals
    if (hours !== undefined) bar.hours = hours

    await bar.save()
    res.json({ message: "Success!" }, barId)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Error updating information" })
  }

})

app.get('/bar/:barId', async (req, res) => {
  try {
    console.log(req.params.barId)
    const bar = await BarTime.findOne({ barId: req.params.barId })
    if (!bar) return res.status(404).json({ message: "Couldn't find bar in db" })
    res.json({
      deals: bar.deals,
      hours: bar.hours,
    })
  } catch (err) {
    res.status(500).json({ message: "Error fetching bar" })
  }
})

// ========== CHECK-IN ROUTES ==========

// create a check-in (when user has been at location for 15+ minutes)
app.post("/checkin", verifyToken, async (req, res) => {
  try {
    const { barId, barName, latitude, longitude } = req.body;
    
    if (!barId || !barName || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // check if user already has an active check-in
    if (user.currentCheckIn) {
      const existingCheckIn = await CheckIn.findById(user.currentCheckIn);
      if (existingCheckIn && existingCheckIn.isActive) {
        return res.status(400).json({ message: "User already checked in to a location" });
      }
    }

    // create new check-in
    const checkIn = new CheckIn({
      userId: req.userId,
      username: user.username,
      profilePicUrl: user.profilePicUrl || "",
      barId,
      barName,
      latitude,
      longitude,
      checkedInAt: new Date(),
      isActive: true
    });

    await checkIn.save();

    // update user's current check-in
    user.currentCheckIn = checkIn._id;
    await user.save();

    // create a post automatically
    const postContent = `${user.username} has checked into ${barName}!`;
    const newPost = new Post({
      userId: new mongoose.Types.ObjectId(req.userId),
      username: user.username,
      content: postContent,
      imageUrl: "",
      profilePicUrl: user.profilePicUrl || "",
      likes: 0,
      likedBy: [],
      createdAt: new Date()
    });
    await newPost.save();

    res.json({ 
      message: "Check-in successful", 
      checkIn,
      post: newPost
    });
  } catch (error) {
    console.error("Error creating check-in:", error);
    res.status(500).json({ message: "Error creating check-in", error: error.message });
  }
});

// get all active check-ins for a specific bar
app.get("/checkins/bar/:barId", async (req, res) => {
  try {
    const { barId } = req.params;
    const checkIns = await CheckIn.find({ 
      barId, 
      isActive: true 
    }).populate('userId', 'username profilePicUrl').sort({ checkedInAt: -1 });
    
    res.json(checkIns);
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    res.status(500).json({ message: "Error fetching check-ins" });
  }
});

// get user's current check-in
app.get("/checkins/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user || !user.currentCheckIn) {
      return res.json(null);
    }

    const checkIn = await CheckIn.findById(user.currentCheckIn);
    res.json(checkIn);
  } catch (error) {
    console.error("Error fetching user check-in:", error);
    res.status(500).json({ message: "Error fetching user check-in" });
  }
});

// check out (remove check-in when user leaves location)
app.delete("/checkin/:checkInId", verifyToken, async (req, res) => {
  try {
    const { checkInId } = req.params;
    
    const checkIn = await CheckIn.findById(checkInId);
    if (!checkIn) {
      return res.status(404).json({ message: "Check-in not found" });
    }

    // verify user owns this check-in
    if (checkIn.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // mark as inactive
    checkIn.isActive = false;
    checkIn.checkedOutAt = new Date();
    await checkIn.save();

    // remove from user's current check-in
    const user = await User.findById(req.userId);
    if (user && user.currentCheckIn && user.currentCheckIn.toString() === checkInId) {
      user.currentCheckIn = null;
      await user.save();
    }

    res.json({ message: "Checked out successfully" });
  } catch (error) {
    console.error("Error checking out:", error);
    res.status(500).json({ message: "Error checking out" });
  }
});

// get all active check-ins (for map display)
app.get("/checkins/active", async (req, res) => {
  try {
    const checkIns = await CheckIn.find({ isActive: true })
      .populate('userId', 'username profilePicUrl')
      .sort({ checkedInAt: -1 });
    
    res.json(checkIns);
  } catch (error) {
    console.error("Error fetching active check-ins:", error);
    res.status(500).json({ message: "Error fetching active check-ins" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});