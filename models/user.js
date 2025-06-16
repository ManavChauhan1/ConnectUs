require('dotenv').config();

const mongoose = require("mongoose");

//Connection String
mongoose.connect(process.env.MONGODB_URI)
    .then(res=>{console.log('Database connected')})
    .catch(err=>{console.log('Error connectong to db',err)});

//User Schema
const userModel = mongoose.Schema({
    username : String,
    name : String,
    age : Number,
    email : String,
    password : String,
    profilepic : {
        type: String,
        defaut: "default.png"
    },
    posts : [
        {type : mongoose.Schema.Types.ObjectId, ref : "post"}
    ]
});

//Exporting this model to use in app.js
module.exports = mongoose.model('user', userModel);