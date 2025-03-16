const mongoose = require("mongoose")
const schema = mongoose.Schema
const Blogpost = new schema({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String },
    gender : {type :String },
    state : {type :String },
    photos:[{path:{type:String}}]
   
})

const users_post_details = mongoose.model("users_table", Blogpost)
module.exports = users_post_details