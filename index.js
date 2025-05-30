const express = require("express");
const route = require("./routes/routes");
const mongoose = require("mongoose");
const bodyparser = require("body-parser");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const cors = require("cors");
require("dotenv").config();
const app = express();
const cloudinary = require("cloudinary").v2;
const User = require("./schemas/userSignUpSchema");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// MongoDB connection
mongoose.connect(
  `mongodb+srv://harshalmten:${process.env.mangoPassword}@cluster0.awdcg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
).then(() => console.log('Connected to database!'));

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Success"
  });
});
app.post("/order", async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const options = req.body;
    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).send("Error");
    }

    res.json(order);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});

app.post("/order/validate", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
  //order_id + "|" + razorpay_payment_id
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = sha.digest("hex");
  if (digest !== razorpay_signature) {
    return res.status(400).json({ msg: "Transaction is not legit!" });
  }

  res.json({
    msg: "success",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  });
});
app.use('/' , route)

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// Message Schema
const MessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" }, // Reference to Chat schema
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to User schema (sender)
  text: { type: String },
  mediaUrl: { type: String },
  mediaType: { type: String },
  status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", MessageSchema);


// Chat Schema
// Chat Schema
const ChatSchema = mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Reference to User schema
    latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to User schema
  },
  { timestamps: true }
);
const Chat = mongoose.model("Chat", ChatSchema);


// -------------------------- NEW API ROUTES ------------------------------

// Route to check if a chat room exists for a given email
app.get("/chat-room", async (req, res) => {
  try {
    const { email, otherEmail } = req.query;

    if (!email || !otherEmail) {
      return res.status(400).json({ message: "Email parameters missing" });
    }
    const user = await User.findOne({ email: userEmail });
    const sender = await User.findOne({ email: otherEmail });
    // Find a chat room where the user is involved
    const existingChat = await Chat.findOne({
      users: { $all: [user._id, sender._id] }
    });

    if (existingChat) {
      res.status(200).json({ chatId: existingChat._id,chatName: existingChat.chatName });
    } else {
      res.status(200).json({ message: "No chat room found for this user", chatId: false });
    }
  } catch (error) {
    res.status(200).json({ chatId: false, message: error.message });
  }
});

// Route to get all chat rooms for a user with at least one message
app.get("/user-chat-rooms", async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find all chats where the user is a participant and has at least one message
    const chatRooms = await Chat.aggregate([
      {
        $match: {
          users: user._id,
          latestMessage: { $exists: true } // Only chats with at least one message
        }
      },
      {
        $lookup: {
          from: "messages",
          localField: "latestMessage",
          foreignField: "_id",
          as: "latestMessageDetails"
        }
      },
      { $unwind: "$latestMessageDetails" },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "participants"
        }
      },
      {
        $project: {
          _id: 1,
          chatName: 1,
          isGroupChat: 1,
          latestMessage: {
            text: "$latestMessageDetails.text",
            sender: "$latestMessageDetails.sender",
            timestamp: "$latestMessageDetails.timestamp",
            mediaUrl: "$latestMessageDetails.mediaUrl",
            mediaType: "$latestMessageDetails.mediaType"
          },
          participants: {
            $filter: {
              input: "$participants",
              as: "participant",
              cond: { $ne: ["$$participant._id", user._id] }
            }
          },
          createdAt: 1,
          updatedAt: 1
        }
      },
      {
        $addFields: {
          otherUser: { $arrayElemAt: ["$participants", 0] }
        }
      },
      {
        $sort: { "latestMessage.timestamp": -1 } // 🔥 Sort by most recent message
      }
    ]);

    res.status(200).json({ success: true, chatRooms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to search users by email (excluding current user)
app.get("/search-users", async (req, res) => {
  try {
    const { email, searchQuery } = req.query;
    
    if (!email || !searchQuery) {
      return res.status(400).json({ message: "Email and search query are required" });
    }

    // Find users matching the search query (excluding current user)
    const users = await User.find({
      email: { $regex: searchQuery, $options: 'i' }, // Case-insensitive search
      email: { $ne: email } // Exclude current user
    }).select('name email _id'); // Only return necessary fields

    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/user-chats", async (req, res) => {
  try {
    const { email ,otherEmail} = req.query;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    // const user = await User.findOne({ email: userEmail });
    const sender = await User.findOne({ email: otherEmail });
    const existingChat = await Chat.find({
      users: { $all: [user._id , sender._id] }
    }).populate("latestMessage")
   // .populate("users"); // Populate user details
    // console.log(existingChat , "chats")
    res.status(200).json({ success: true, existingChat });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});



// Route to create a new chat room for a user
// const User = require("./schemas/userSignUpSchema"); // Import User model

app.post("/create-chat", async (req, res) => {
  try {
    const { userEmail, senderid } = req.body;

    // Fetch the users by their email addresses
    const user = await User.findOne({ email: userEmail });
    const sender = await User.findOne({ email: senderid });

    if (!user || !sender) {
      return res.status(400).json({ message: "One or both users not found" });
    }

    // Check if a chat room already exists for the users
    const existingChat = await Chat.findOne({
      users: { $all: [user._id, sender._id] }
    });

    if (existingChat) {
      res.status(200).json({ chatId: existingChat._id , chatName: existingChat.chatName });
    }
    else {
      // Create a new chat room
      const newChat = new Chat({
        users: [user._id, sender._id],
        chatName: `${sender.email}__SEP__${user.email}`,
        isGroupChat: false
      });

      await newChat.save();
      res.status(201).json({ chatId: newChat._id , chatName: newChat.chatName });
    }

    // // Create a new chat room
    // const newChat = new Chat({
    //   users: [user._id, sender._id],
    //   chatName: `Chat with ${userEmail}`,
    //   isGroupChat: false
    // });

    // await newChat.save();
    // res.status(201).json({ chatId: newChat._id });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});



// -------------------------- EXISTING ROUTES ------------------------------

// Handle sending a message
app.post("/send-message", async (req, res) => {
  try {
    const { chatId, sender, text, mediaUrl, mediaType } = req.body;

    // Fetch the sender's user object (from their email or userId)
    const senderUser = await User.findOne({ email: sender });

    if (!senderUser) {
      return res.status(400).json({ message: "Sender not found" });
    }

    const message = new Message({
      chatId,
      sender: senderUser._id, // Use ObjectId reference for sender
      text,
      mediaUrl,
      mediaType,
      status: "sent",
    });

    await message.save();

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    io.to(chatId).emit("new message", message);
    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// Handle fetching messages for a chat room
app.get("/messages/:chatId", async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).sort("timestamp");
    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle updating message status (sent -> delivered -> seen)
app.post("/update-status", async (req, res) => {
  try {
    const { messageId, status } = req.body;
    const updatedMessage = await Message.findByIdAndUpdate(messageId, { status }, { new: true });
    io.to(updatedMessage.chatId).emit("message status", updatedMessage);
    res.status(200).json({ success: true, updatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

// -------------------------- Socket.io Setup ------------------------------

const server = app.listen(process.env.PORT || 8080, () => {
  console.log(`Server running on PORT ${process.env.PORT || 8080}...`);
});

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: ["http://localhost:5173", "https://hommiefe.vercel.app"], // Explicit allowed origins
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ["websocket", "polling"] // Explicitly enable both transports
});

// Socket.io connection
io.on("connection", (socket) => {
  // console.log("New client connected");

  socket.on("join chat", (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on("new message", async (message) => {
    await Message.findByIdAndUpdate(message._id, { status: "delivered" });
    io.to(message.chatId).emit("message received", message);
  });

  socket.on("message seen", async (messageId) => {
    const message = await Message.findByIdAndUpdate(messageId, { status: "seen" }, { new: true });
    io.to(message.chatId).emit("message status", message);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

