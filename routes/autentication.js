//in this autentication we will code about sign in and signup routes
const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const route = express.Router()
require('dotenv').config();
const users = require("../schemas/userSignUpSchema")
module.exports = route
const secret = process.env.secret
const sendMail=require("../routes/sendMailToSetPassword")
const checkUserInMainTable=async(req,res,next)=>{
    try{
        const check = await users.findOne({ email: req.body.email })
        console.log("checking email")
        if(check){
            return res.status(400).json({
                message: "UserAlready have an account please login.",
                status: "E"
            }) 
        }else{
            req.reset=false
            next()
        }
    }catch (e) {
            return res.status(400).json({
                message: e.message,
                status: "E"
            })
        }
}
const userShouldBeinMainTable = async (req, res, next) => {
    try {
        const check = await users.findOne({ email: req.body.email })
        console.log("checking email")
        if (!check) {
            return res.status(400).json({
                message: "User Doesn't have an account please signup.",
                status: "E"
            })
        } else {
            console.log(check)
            req.body.name=check.name
            req.reset=true,
            req.check=check
         
            next()
        }
    } catch (e) {
        return res.status(400).json({
            message: e.message,
            status: "E"
        })
    }
}
const Decode=async(req,res,next)=>{
    let base64String = req.params.encodeEmailPlusTime
    const buffer = Buffer.from(base64String, 'base64');

    // Decode the Buffer to a UTF-8 string
    const decodedString = buffer.toString('utf-8');
    const { name, date, email,reset } = JSON.parse(decodedString)

    const startTime = new Date(date);
    const endTime = new Date();

    // Calculate the time difference in milliseconds
    const timeDifferenceMs = endTime - startTime;

    // Convert milliseconds to hours
    const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60);
    if (timeDifferenceHours > 2) {
        return res.status(400).json({
            message: "link is expired ",
            status: "E"
        })
    }else{
        req.obj={name,date,email,reset}
        next()
    }
}
const SelectMiddlewear=async(req,res,next)=>{
    const { name, date, email,reset } = req.obj
    if(reset){
        console.log("reset")
        req.body.email=email
        userShouldBeinMainTable(req, res, next)
        
    }else{
        checkUserInMainTable(req, res, next)
        console.log("not reset")
    }
}

route.post("/signin",userShouldBeinMainTable, async (req, res) => {

    try {
            bcrypt.compare(req.body.password, req.check.password, async function (err, result) {
                // result == true
                if (err) {
                    return res.status(400).json({
                        status: "E",
                        message: err
                    })
                }
                else {
                    if (!result) {
                        return res.status(400).json({
                            status: "E",
                            message: "password and userid not matched"
                        })
                    } else {
                        // creating token
                        const token = jwt.sign({
                            exp: Math.floor(Date.now() / 1000) + (60 * 60),
                            data: req.check._id
                        }, secret);
                        return res.status(200).json({
                            status: "S",
                            message: "user is autenticated",
                            token,
                            user:req.check
                        })
                    }
                }
            });



    } catch (e) {
        return res.status(400).json({
            message: e.message,
            status: "E"
        })
    }
})
route.post("/signup/:encodeEmailPlusTime",Decode,SelectMiddlewear, async (req, res) => {
    
    try {
        // console.log(req.body)
        const { name, date, email,reset } = req.obj
        console.log(name,email,date)


            bcrypt.hash(req.body.password, 10, async function (err, hash) {
                // Store hash in your password DB.
                if (err) {
                    return res.status(400).json({
                        message: err,
                        status: "E"
                    })
                } else {
                    !reset ? await users.create({ name, email, password: hash }) : await users.updateOne({ email }, { name, email, password: hash })
                    return res.status(200).json({
                        message: !reset? "created new account for user":"User password updated",
                        status: "S"
                    })
                }
            });

    } catch (e) {
        return res.status(400).json({
            message: e.message,
            status: "E"
        })
    }
})

route.post("/signup_send_mail",checkUserInMainTable,sendMail,async (req, res) => {
    //console.log("store data")
    console.log(req.body.email)

    try {
        return res.status(200).json({
            message:"Password setting email sent. Please check your inbox.",
            status: "S"
        })

    } catch (e) {
        return res.status(400).json({
            message: e.message,
            status: "E"
        })
    }
})
route.post("/reset_send_mail", userShouldBeinMainTable, sendMail, async (req, res) => {
    //console.log("store data")
    try {
        return res.status(200).json({
            message: "Password setting email sent. Please check your inbox.",
            status: "S"
        })

    } catch (e) {
        return res.status(400).json({
            message: e.message,
            status: "E"
        })
    }
})
