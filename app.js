const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const path = require('path');
const cookieParser = require('cookie-parser');
// const { log } = require('console');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

//Home Page
app.get("/", (req, res) => {
    res.render("index");
})

//Login Page for User
app.get("/login", (req, res) => {
    res.render("login");
})

//Protected Profile Route
app.get("/profile", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email});
    await user.populate("posts");
    console.log(user.posts);
    
    res.render("profile", {user});
})

//For Liking a post
app.get("/like/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id : req.params.id}).populate("user");

    //Liking or Unliking the Post
    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }

    await post.save();
    res.redirect("/profile");
})

//For Editing a post
app.get("/edit/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id : req.params.id}).populate("user");
    res.render("edit", {post});
    
    // res.redirect("/profile");
})

//Route for Updating the Post
app.post("/update/:id", isLoggedIn, async (req,res) => {
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content});
    res.redirect("/profile");
})

//Create Post for only logged in customer
app.post("/post", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email});
    let {content} = req.body;
    let post = await postModel.create({
        user: user._id,
        content
    })

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
})

//Authentication
app.post("/login", async (req, res) => {
    let {email, password} = req.body;

    let user = await userModel.findOne({email});

    if(!user) return res.status(500).send("Something Went Wrong");

    bcrypt.compare(password, user.password, (err, result) => {
        if(result) {
            let token = jwt.sign({email:email, userid: user._id}, "secret");
            res.cookie("token", token);
            res.status(200).redirect("/profile");
        }
        else res.redirect("/login");
    })
})

//To register User
app.post("/register", async (req, res) => {
    let {name, email, username, age, password} = req.body;

    let user = await userModel.findOne({email});

    if(user) return res.status(500).send("User already registered");

    bcrypt.genSalt(10, function(err, salt){
        bcrypt.hash(password, salt, async function(err, hash){
            let user = await userModel.create({
                username,
                name,
                email,
                age,
                password : hash
            });

            let token = jwt.sign({email:email, userid: user._id}, "secret");
            res.cookie("token", token);
            res.send("Registered");
        })
    })
})

//Logout User : i.e. Removing the Cookie
app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
})

//Login Middleware : For protected routes
function isLoggedIn(req, res, next){
    if(req.cookies.token === "") res.redirect("/login");
    else{
        let data = jwt.verify(req.cookies.token, "secret");
        req.user = data;
        next();
    }
}

app.listen(3000);