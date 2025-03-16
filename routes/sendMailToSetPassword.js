const express = require("express")
const route = express.Router()
module.exports = route
const nodemailer = require('nodemailer');

const sendMail=(req,res,next) => {
    // Get the current date and time
    let tempObj={
        email:req.body.email,
        name:req.body.name,
        date:new Date(),
        reset: req.reset,
    }
    const dateString =JSON.stringify(tempObj)//req.body.email+" "+new Date()+req.body.name;
    

    // Convert the date to a string
   // const dateString = currentDate.toISOString();

    // Convert the string to a Buffer
    const buffer = Buffer.from(dateString, 'utf-8');

    // Convert the Buffer to a Base64 encoded string
    const base64String = buffer.toString('base64');
    console.log(base64String)
    // next()
    // return
 
    let transporter = nodemailer.createTransport({
        service: "gmail",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.email,
            pass: process.env.emailPassword
        }
    });
    
    let setpasswordHtml = `<div style="font-family: Arial, sans - serif; max - width: 600px; margin: 0 auto; ">
        <h2>Hi ${req.body.name}</h2>
        <h2> Thank You for Signing Up!</h2>
        <p>We're excited to have you on board. To complete your registration,please click the following link within the next 2 hours to set your password:</p>
        <p><a href="${process.env.frontendurl}/setpassword/${base64String}"><button style="background:#2196F3;color:white;border:1px;border-radius:5px;height:20px">Set Password</button></a></p>
        <p>set password with in two hours </p>
        <p>If you didn't sign up for our service, you can safely ignore this email.</p>
        <p>Thank you,<br> Hommie Team</p>
    </div > `
    let reSetpasswordHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Hi ${req.body.name},</h2>
    <h2>Reset Your Password</h2>
    <p>We have received a request to reset your password. Click the button below to set a new password:</p>
    <p><a href="${process.env.frontendurl}/setpassword/${base64String}"><button style="background:#2196F3;color:white;border:1px solid;border-radius:5px;height:40px;width:200px;font-size:16px;">Reset Password</button></a></p>
    <p>Please note that this link will expire in two hours.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>Thank you,<br> Hommie Team</p>
</div>
 `
    // Setup email data with unicode symbols
    let mailOptions = {
        from: '"MYHOMIEE" <Hommie@gmai.com>', 
        to: req.body.email, 
        subject: req.reset?"Reset Password":'Set Password', 
        text: 'Hello world?', 
        html: req.reset ? reSetpasswordHtml :setpasswordHtml // html body
    };

    // Send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("hii")
            res.status(200).json({
                message: "error"
            })
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        next()
    });

}
module.exports=sendMail

// Create a transporter object using the default SMTP transport

