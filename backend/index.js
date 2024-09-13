import 'dotenv/config'; // This line loads the environment variables

import express, { text } from "express";
import ImageKit from "imagekit";
import cors from "cors";
import mongoose from 'mongoose';
import Chat from './models/chat.js';
import UserChats from './models/userChats.js';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';


console.log("MongoDB URI:", process.env.MONGO);
console.log("Client URL:", process.env.CLIENT_URL);


const port = process.env.PORT || 3000;
const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json());

const connect = async()=>{
    try{
        await mongoose.connect(process.env.MONGO); // Connect With the Mongo 
        console.log("Connected to MongoDB");
    }catch(err){
        console.log(err)
    }
}

const imagekit = new ImageKit({
    urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
    publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
    privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
});

app.get("/api/upload", (req, res) => {
    try {
        const result = imagekit.getAuthenticationParameters();
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: "An error occurred while generating authentication parameters." });
    }
});

app.post("/api/chats", ClerkExpressRequireAuth(), async (req, res) =>{
    const userId = req.auth.userId;
    const {text} = req.body;
    
    try{
        //CREATE A NEW CHAT
        const newChat = new Chat({
            userId: userId,
            history: [{role: "user", parts: [{text}]}],
        });
        const savedChat = await newChat.save();

        //CHECH IF THE USERCHATS EXITS
        const userChats = await UserChats.find({userId: userId});

        //IF DOESN'T EXIST CREATE A NEW ONE AND ADD THE CHAT IN THE CHATS ARRAY
        if(!userChats.length){
            const newUserChats = new UserChats({
                userId: userId,
                chats: [
                    {
                        _id: savedChat.id,
                        title: text.substring(0,40),
                    },
                ],
            });
            await newUserChats.save();
        }else{
            //IF EXITS PUSH THE CHATS TO THE EXISTING ARRAY
            await UserChats.updateOne(
                {userId: userId},
                {
                    $push:{
                        chats:{
                            _id: savedChat._id,
                            title: text.substring(0,40),
                        },
                    },
                },
            );
            res.status(201).send(newChat._id);
        }

    }catch(err){
        console.log(err);
    }
});

app.get("/api/userchats", ClerkExpressRequireAuth(), async(req,res)=>{
    
    const userId = req.auth.userId;

    try{
        const userChats = await UserChats.find({userId}); // can write userId: userId but of same name
        
        res.status(200).send(userChats[0].chats);
    }catch(err){
        console.log(err);
        res.status(500).send("Error in fetching userChats!");
    }
});

app.get("/api/chats/:id", ClerkExpressRequireAuth(), async(req,res)=>{
    
    const userId = req.auth.userId;

    try{
        const chat = await Chat.findOne({_id: req.params.id, userId});
        
        res.status(200).send(chat);
    }catch(err){
        console.log(err);
        res.status(500).send("Error in fetching chat!");
    }
});

app.put("/api/chats/:id", ClerkExpressRequireAuth(), async(req,res)=>{
    
    const userId = req.auth.userId;
    const {question,answer,img} = req.body;

    const newItems = [
        ...(question ?[{role: "user", parts: [{text: question}], ...(img && {img})}]: []), {role: "model", parts: [{text: answer}]},
    ];

    try{
        const updateChat = await Chat.updateOne({_id: req.params.id, userId}, {$push: {history: {$each: newItems}}});
        
        res.status(200).send(updateChat);
    }catch(err){
        console.log(err);
        res.status(500).send("Error adding conversation!");
    }
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(401).send('Unauthenticated!');
});

app.listen(port, () => {
    connect();
    console.log(`Server running on port ${port}`);
});
