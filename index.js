const express = require("express")
const route=require("./routes/routes")
const mongoose = require("mongoose")
const bodyparser = require("body-parser")
const cors = require("cors")
require('dotenv').config();
const app = express();

mongoose.connect(`mongodb+srv://harshalmten:${process.env.mangoPassword}@cluster0.awdcg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`).then(() => console.log('Connected to database!'));
app.use(cors())
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: true }));
app.get("/",(req,res)=>{
    res.status(200).json({
        mesage:"sucess"
    })
})
app.use("/", route)

const port = process.env.PORT || 8080
app.listen(port, console.log(`app is listening at ${port}`))