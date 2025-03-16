const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const route = express.Router()
const multer = require('multer');
const path=require("path")  
require('dotenv').config();
const users = require("../schemas/userSignUpSchema");
const users_post_details=require("../schemas/userPhotos");
const verifyjwtToken = require("./verifyJwtToken");
const { resourceLimits } = require("worker_threads");


const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, child,  getDownloadURL } = require('firebase/storage');


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCerm-t_sgKFX8uSThZmI9UAuz10KfmLn4",
    authDomain: "home-c1794.firebaseapp.com",
    projectId: "home-c1794",
    storageBucket: "home-c1794.appspot.com",
    messagingSenderId: "1083730926989",
    appId: "1:1083730926989:web:3d5c2d17f9efd192cdf1c4",
    measurementId: "G-78530Z4539"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const storage = getStorage();

const upload = multer({ storage: multer.memoryStorage() });

module.exports = route
const secret = process.env.secret

// const upload = multer({ dest: 'uploads/' })
route.post("/send_images",async(req,res,next)=>{
 return res.send("kjsdhfk")
})

const userShouldBeinMainTable = async (req, res, next) => {
    try {
        const check = await users.findOne({ email: req.check.email })
      //  console.log("checking email")
        if (!check) {
            return res.status(400).json({
                message: "User Doesn't have an account please signup.",
                status: "E"
            })
        } else {
           // console.log(check)
                
         
            next()
        }
    } catch (e) {
        return res.status(400).json({
            message: e.message,
            status: "E"
        })
    }
}

// Route to handle file uploads
// Assuming you have a route handler for /homePage/upload
route.post('/upload', verifyjwtToken, upload.array('photos', 12), async (req, res) => {
    try {
        const images = req.files;
        const email = req.body.email;
        const location = req.body.location;
        const category = req.body.category;

        if (!images || images.length === 0) {
            return res.status(400).send('No images were uploaded.');
        }
      
        const uploadedPhotos = [];

        for (const image of images) {
            const imageName = `${email}_${Date.now()}_${image.originalname}`;
            const imageRef = ref(storage, 'images/' + imageName);
            await uploadBytes(imageRef, image.buffer);
            const downloadURL = await getDownloadURL(imageRef);
            uploadedPhotos.push({"path": downloadURL});
        }

        // Now you have an array of download URLs for the uploaded photos
        console.log('Uploaded photos:', uploadedPhotos);

        // Here you can proceed to save other details to your database
        // For demonstration purposes, I'm just logging the details
        console.log('Email:', email);
        console.log('Location:', location);
        console.log('Category:', category);

        await users_post_details.create({...req.body, photos:uploadedPhotos})

        // You can return a response to the client indicating success
        return res.status(200).json({
            status: "S",
            message: "Property details uploaded successfully.",
            uploadedPhotos: uploadedPhotos
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).send('Internal Server Error');
    }
});


route.get('/specificImage/:img',async(req,res)=>{
    //console.log(process.cwd())
    res.sendFile(process.cwd() +`/userImages/${req.params.img}`)
})
route.get('/view_properties/', verifyjwtToken, async (req, res) => {
    //console.log(process.cwd())
    //res.sendFile(process.cwd() + `/userImages/${req.params.img}`)
    const properties = await users_post_details.find({}, { reviews:0 })
    return res.status(200).json({
        status: "S",
        message: "Review updated successfully.'",
        properties
    })
})
route.get('/view_properties/:roomORhouse', verifyjwtToken, async (req, res) => {
    //console.log(process.cwd())
    //res.sendFile(process.cwd() + `/userImages/${req.params.img}`)
    const roomORhouse=req.params.roomORhouse||"house"
    const filters=req.body
    const properties = await users_post_details.find({category:roomORhouse,...filters}, { reviews:0 })
    return res.status(200).json({
        status: "S",
        message: "Review updated successfully.'",
        properties
    })
})
route.get('/view_property/:roomORhouse', verifyjwtToken, async (req, res) => {
    const roomORhouse = req.params.roomORhouse || "house";
    const filters = req.query.selectedTypes; // Extract filters from query parameters

    try {
        const properties = await users_post_details.find({ category: roomORhouse, type: { $in: filters } }, { reviews: 0 });
        return res.status(200).json({
            status: "S",
            message: "Properties fetched successfully.",
            properties
        });
    } catch (error) {
        console.error('Error fetching properties:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

route.get('/view_propertie/:id' , verifyjwtToken ,
 async(req , res)=>{
    const propertydata=await users_post_details.findOne({_id:req.params.id})
    return res.status(200).json({
        status:"S",
        message:" Property fetched sucessfully",
        propertydata
       
    })
})
route.delete('/view_properties/:id', verifyjwtToken, async (req, res) => {

    const data=await users_post_details.deleteOne({_id:req.params.id})
    return res.status(200).json({
        status:"S",
        message:" Property deleted sucessfully",
       
    })
})
route.put('/view_propertie/:id', verifyjwtToken, async (req, res) => {
   
    const data=await users_post_details.updateOne({_id:req.params.id},req.body)
    return res.status(200).json({
        status:"S",
        message:"Property updated sucessfully",
        data
    })
})
route.get('/view_landlords/', verifyjwtToken, async (req, res) => {
    //console.log(process.cwd())
    //res.sendFile(process.cwd() + `/userImages/${req.params.img}`)
    try {
        const usersWithProperties = await users_post_details.aggregate([
            {
                $group: {
                    _id: "$email",
                   
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users_table", // name of the users collection
                    localField: "_id",
                    foreignField: "email", 
                    as: "user"
                }
            },
            {
                $project: {
                    "user.email": 1,
                    "user.name": 1,
                    "user.state": 1,
                    count: 1
                }
            }
        ]);
        return res.status(200).json({
            status: "S",
            message: "Review updated successfully.'",
            usersWithProperties
        })
       
    } catch (err) {
        res.status(500).json({ message: err.message });
    }

})

route.get('/top-commented/', verifyjwtToken, async (req, res) => {
    try {
        const properties = await users_post_details.aggregate([
            // Unwind the reviews array to deconstruct it into separate documents
            { $unwind: "$reviews" },
            // Group by property ID and count the number of reviews for each property
            { $group: { _id: "$_id", property: { $first: "$$ROOT" }, reviewCount: { $sum: 1 } } },
            // Sort the properties based on review count in descending order
            { $sort: { reviewCount: -1 } },
            // Limit the result to the top 6 properties
            { $limit: 3 }
        ]);
        
        // Extract the properties array from the result
        const topProperties = properties.map(({ property }) => property);
        
        return res.status(200).json({
            status: "Success",
            message: "Top commented properties retrieved successfully.",
            properties: topProperties
        });
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: "Failed to retrieve top commented properties.",
            error: error.message
        });
    }
});

route.get('/view_your_property/:email', verifyjwtToken, async (req, res) => {
    //console.log(process.cwd())
    //res.sendFile(process.cwd() + `/userImages/${req.params.img}`)
    try {
        const email=req.params.email
        const properties = await users_post_details.find({email}, { reviews:0 })
        return res.status(200).json({
            status: "S",
            message: "Review updated successfully.'",
            properties
        })

       
    } catch (err) {
        res.status(500).json({ message: err.message });
    }

})

route.get('/view_specific_landlord_properties/:email', verifyjwtToken, async (req, res) => {
    //console.log(process.cwd())
    //res.sendFile(process.cwd() + `/userImages/${req.params.img}`)
    try {
        const email=req.params.email
        const propertiesroom = await users_post_details.find({ email, category: "room" }, { reviews: 0 });
        const propertieshouse = await users_post_details.find({ email, category: "house" }, { reviews: 0 });

        return res.status(200).json({
            status: "S",
            message: "Fetched data successfully.'",
            propertiesroom,
            propertieshouse
        })
       
    } catch (err) {
        res.status(500).json({ message: err.message });
    }

})
route.get('/view_your_property/:email', verifyjwtToken, async (req, res) => {
    //console.log(process.cwd())
    //res.sendFile(process.cwd() + `/userImages/${req.params.img}`)
    try {
        const email=req.params.email
        const properties = await users_post_details.find({ email }, { reviews: 0 });


        return res.status(200).json({
            status: "S",
            message: "Fetched data successfully.'",
            properties
        })
       
    } catch (err) {
        res.status(500).json({ message: err.message });
    }

})

route.get('/top-commented/', verifyjwtToken, async (req, res) => {
    try {
        const properties = await users_post_details.aggregate([
            // Unwind the reviews array to deconstruct it into separate documents
            { $unwind: "$reviews" },
            // Group by property ID and count the number of reviews for each property
            { $group: { _id: "$_id", property: { $first: "$$ROOT" }, reviewCount: { $sum: 1 } } },
            // Sort the properties based on review count in descending order
            { $sort: { reviewCount: -1 } },
            // Limit the result to the top 6 properties
            { $limit: 3 }
        ]);
        
        // Extract the properties array from the result
        const topProperties = properties.map(({ property }) => property);
        
        return res.status(200).json({
            status: "Success",
            message: "Top commented properties retrieved successfully.",
            properties: topProperties
        });
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: "Failed to retrieve top commented properties.",
            error: error.message
        });
    }
});

route.put('/changepassword', verifyjwtToken, userShouldBeinMainTable, async (req, res) => {
    try {
          const newPassword = req.body.password; // Assuming the new password is sent in the request body
        const check = await users.findOne({ email: req.check.email });

        // Check if the user exists
        if (!check) {
            return res.status(400).json({
                message: "User doesn't exist.",
                status: "E"
            });
        }
        bcrypt.hash(newPassword, 10, async function (err, hash) {
            // Store hash in your password DB.
            if (err) {
                return res.status(400).json({
                    message: err,
                    status: "E"
                })
            } else {
                check.password = hash; // Assuming `password` is the field to update
        await check.save();
        return res.status(200).json({
            status: "S",
            message: "Password changed successfully."
        });
            }
        });

        
    } catch (error) {
        return res.status(500).json({
            status: "E",
            message: error.message
        });
    }
});


route.get('/me', verifyjwtToken, userShouldBeinMainTable, async (req, res) => {
    try {
          const newPassword = req.body.password; // Assuming the new password is sent in the request body
        const check = await users.findOne({ email: req.check.email });

        // Check if the user exists
        if (!check) {
            return res.status(400).json({
                message: "User doesn't exist.",
                status: "E"
            });
        }
        else{
            return res.status(200).json({
                message : "user exist.",
                status : "S",
                check
            })
        }

        
    } catch (error) {
        return res.status(500).json({
            status: "E",
            message: error.message
        });
    }
});

route.put('/userprofile', verifyjwtToken, upload.array('photos', 1), userShouldBeinMainTable, async (req, res) => {
    try {
        const images = req.files;
        const uploadedPhotos = [];

        for (const image of images) {
            const imageName = `${Date.now()}_${image.originalname}`;
            const imageRef = ref(storage, 'images/' + imageName);
            await uploadBytes(imageRef, image.buffer);
            const downloadURL = await getDownloadURL(imageRef);
            uploadedPhotos.push({"path": downloadURL});
        }
//const newFiles = images && images.map(image => ({ path: image.filename }));

        const { gender, state, name } = req.body;
        const userEmail = req.check.email; // Assuming 'check' is the correct object containing the email

        // Find the user by email
        const user = await users.findOne({ email: userEmail });

        // If the user is not found, return an error
        if (!user) {
            return res.status(404).json({
                status: "E",
                message: "User not found",
            });
        }

        // Update user profile data
        user.gender = gender;
        user.state = state;
        user.name = name;
        user.photos = uploadedPhotos;

        console.log(uploadedPhotos)

        console.log(user.photos ,"userphotos")

        // Save the updated user data
        await user.save();
        console.log(user)

        return res.status(200).json({
            status: "S",
            message: "User profile updated successfully",
            user
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});
