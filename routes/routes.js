const express=require("express")
const route = express.Router()
const autentication=require("../routes/autentication")
const home=require("../routes/homePage")
const review=require("../routes/reviews")
module.exports = route


route.use("/autentication",autentication)
route.use("/homePage", home)
route.use("/reviews",review)

