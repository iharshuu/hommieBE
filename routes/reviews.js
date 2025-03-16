const express = require("express")
const route = express.Router()
const users_post_details = require("../schemas/userPhotos");
const verifyjwtToken = require("./verifyJwtToken");
module.exports = route
route.use(verifyjwtToken)
route.post("/add_review", async (req, res) => {
 await users_post_details.updateOne({ _id: req.body.postId }, { $push: { reviews: { review: req.body.review, writtenBy: req.check.name, email: req.check.email, rating:req.body.rating,date:new Date() } } })
 const reviews=await users_post_details.findOne({
    _id:req.body.postId
},{reviews:1})
//console.log(reviews.reviews)
    return res.status(200).json({
        status: "S",
        message: "Review added successfully.'",
       latest:reviews.reviews[reviews.reviews.length-1]
        
        
    })
})
route.delete("/delete_review/:postId/:reviewId", async (req, res) => {
    try{
//console.log(req.body)
     await users_post_details.updateOne(
            { _id: req.params.postId }, // Match the parent document by its _id
            { $pull: { "reviews": { "_id": req.params.reviewId } } } // Pull the element with the given _id from the reviews array
        );
    return res.status(200).json({
        status: "S",
        message: "Review Deleted successfully.'",
        
    })
    } catch (e) {
        return res.status(400).json({
            message: e.message,
            status: "error"
        })
    }
})
route.put("/update_review/:reviewId", async (req, res) => {
    await users_post_details.updateOne({ _id: req.body.postId }, 
        {
            $set: {
                "reviews.$[elem].review": req.body.review,
                "reviews.$[elem].writtenBy": req.check.name,
                "reviews.$[elem].email": req.check.email,
                "reviews.$[elem].rating": req.body.rating
            }
        },
        {
            arrayFilters: [{ "elem._id": req.params.reviewId }] // Filter to identify the specific review by its _id
        }
        )
    return res.status(200).json({
        status: "S",
        message: "Review updated successfully.'",
    })
})
route.get("/view_reviews/:postId", async (req, res) => {
const reviews=await users_post_details.findOne({
    _id:req.params.postId
},{reviews:1})
//console.log(reviews)
    return res.status(200).json({
        status: "S",
        message: "Review updated successfully.'",
        reviews:reviews.reviews.sort((a, b) => new Date(b.date) - new Date(a.date))
    })
})