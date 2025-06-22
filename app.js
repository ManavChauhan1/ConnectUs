const express = require('express');
const cors = require('cors');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();
// const upload = require('./config/multerconfig');
const upload = require('./config/multerconfig');

//Importing module to validate input register data
const { registerSchema } = require("./validators/validateUser");
const { error } = require('console');

//Middlewares
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());


// Enabling CORS
app.use(cors({
  origin: 'http://localhost:4200', // Angular frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
  credentials: true, // Since we are using Cookies
}));

//Feeds
app.get("/feed", isLoggedIn, async(req, res) => {
    let posts = await postModel.find({}).populate("user").sort({createdAt: 1});

    let user = await userModel.findById(req.user.userid);

    res.render("feed", {posts, user});
})

//Profile Pic upload
app.post("/upload", isLoggedIn, upload.single('profilepic'), async (req, res) => {
    try{
        const user = await userModel.findOne({email: req.user.email});
        user.profilepic = req.file.filename;
        await user.save();
        // console.log(req.file);
        
        res.status(200).json({ filename: req.file.filename });
    } catch(error){
        console.error("Upload Error", error);
        res.status(500).json({ message: "Image Upload Failed", error });
    }
})

// For Angular (API call)
app.get("/profile", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate("posts");
  const { password, ...safeUser } = user._doc;
  res.json({ user: safeUser });
});

// Like or Unlike a post
app.patch("/:id/like", isLoggedIn, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id).populate("user");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user.userid;

    const index = post.likes.indexOf(userId);

    if (index === -1) {
      post.likes.push(userId); // Like
    } else {
      post.likes.splice(index, 1); // Unlike
    }

    await post.save();

    res.status(200).json({ 
      message: index === -1 ? "Post liked" : "Post unliked",
      likesCount: post.likes.length 
    });

  } catch (error) {
    console.error('error in like post',error)
    res.status(500).json({ message: "Server error", error });
  }
});


//For Editing a post
app.get("/edit/:id", isLoggedIn, async (req, res) => {
    try{
        let post = await postModel.findOne({_id : req.params.id}).populate("user");

        if(!post){
            return res.status(400).json({ message: "Post not found..." });
        }

        res.json(post);

    } catch(error){
        res.status(500).json({ message: "Server Error", error });
    }
})

//Route for Updating the Post
app.post("/update/:id", isLoggedIn, async (req,res) => {
    try{
        const updatedPost = await postModel.findOneAndUpdate(
            { _id:req.params.id },
            { content: req.body.content },
            { new: true }
        );
        if(!updatedPost){
            return res.status(404).json({error: 'Post Not Found!!'})
        }

        res.json({success: true, post: updatedPost});
    } catch(err){
        console.error('Update Error:', err);
        res.status(500).json({error: 'Something went wrong in updating post'})
    }
})

//Create Post for only logged in customer
app.post("/post", isLoggedIn, async (req, res) => {
    try{
        let user = await userModel.findOne({email: req.user.email});
        let {content} = req.body;
        let post = await postModel.create({
            user: user._id,
            content
        })

        user.posts.push(post._id);
        await user.save();

        res.status(201).json({ message: "Post created successfully..", post });
    } catch(error){
        res.status(500).json({ message: "Error creating Post", error });
    }
    
})

//Authentication
app.post("/login", async (req, res) => {
    const {email, password} = req.body;

    try{
        let user = await userModel.findOne({email});

        if(!user) return res.status(401).json({message: "Password or Email Invalid"});

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
           return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { email: user.email, userid: user._id },
            process.env.SECRET_KEY,
            { expiresIn: "1d" }
        );

         res.status(200).json({
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                email: user.email,
                username: user.username // Include any fields you need
            }
        });
    } catch(error){
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error during login", error: err });
    }
})

//To register User
app.post("/register", async (req, res) => {
    try{
        //Validate request body
        const data = registerSchema.parse(req.body);
        let {name, email, username, age, password} = req.body;

        let existingUser = await userModel.findOne({email});

        if(existingUser) return res.status(400).json({ message: "User already registered."});


        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const user = await userModel.create({
            username,
            name,
            email,
            age,
            password: hash
        })

        const token = jwt.sign(
            { email: user.email, userid: user._id},
            process.env.SECRET_KEY,
            {expiresIn: "1d"}
        )

        res.status(200).json({
            message: "Registration Successful..",
            token,
            user: {
                username: user.username,
                email: user.email,
                _id: user._id
            }
        })
    }
    catch(err){
        console.error("Registration error:", err);
        return res.status(400).json({ error: err.errors || "Invalid data" });
    }
})

//Logout User : i.e. Cookie is handled in local storage by angular
app.get('/logout', (req, res) => {
    res.status(200).json({ message: "Logged out successfully" });
})

//Login Middleware : For protected routes
function isLoggedIn(req, res, next){
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({ message : "No Token Provided"});
    }

    const token = authHeader.split(" ")[1];

    try{
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch(err){
        return res.status(401).json({ message: "Invalid or Expired Token..." });
    }

}

//Listen at Port 3000
app.listen(3000);