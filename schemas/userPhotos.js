const mongoose = require("mongoose")
const schema = mongoose.Schema
const Blogpost = new schema({
    email: { type: String, required: true,},
    location:{type:String},
    category:{type:String,required:true,enum: ['house', 'room']},
    propertyName:{ type: String },
    propertyBuilt: { type: String },
    mobileNumber: { type: String },
    name: { type: String },
   
    type: { type: String },
    nameForOtherType:{type:String},
    // Location
    houseNumber: { type: String },
    locality: { type: String },
    pincode: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    landmark: { type: String },
    distanceFromUniversity: { type: String },
    // Amenities
    basicFacilities: [{type:String}],
    outdoorActivities: [{type:String}],
    commonArea: [{type:String}],
    security: [{type:String}],
    entertainment: [{type:String}],
    bedrooms: { type: String },
    roomSize: { type: String },
    description: { type: String },
    price: { type: String },
    vacanypeople : { type: String },

    
    photos:[{path:{type:String}}],
    reviews:[{review:{type:String},writtenBy:{type:String},email:{type:String},rating:{type:Number},date:{type:String}}]
})

const users_post_details = mongoose.model("users_post_details", Blogpost)
module.exports = users_post_details