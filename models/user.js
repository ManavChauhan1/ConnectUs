const mongoose = require("mongoose");

//Connection String
mongoose.connect('mongodb://localhost:27017/miniproject');

//User Schema
const userModel = mongoose.Schema({
    username : String,
    name : String,
    age : Number,
    email : String,
    password : String,
    posts : [
        {type : mongoose.Schema.Types.ObjectId, ref : "post"}
    ]
});

//Exporting this model to use in app.js
module.exports = mongoose.model('user', userModel);