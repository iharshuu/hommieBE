const jwt = require("jsonwebtoken")
const users=require("../schemas/userSignUpSchema")
const secret = process.env.secret
const verifyjwtToken=(req,res,next)=>{
    //console.log(req.headers.authorization)
    jwt.verify(req.headers.authorization, secret, async function (err, decoded) {
        if (err) {
            return res.status(400).json({
                status: "E",
                message: err
            })
        } else {
            const check = await users.findOne({ _id: decoded.data })
            if (check) {
                req.check=check
                next()
            } else {
                return res.status(400).json({
                    status: "E",
                    message: "token miss matched"
                })
            }
        }
    })

}
module.exports=verifyjwtToken