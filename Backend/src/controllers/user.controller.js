import User from "../models/user.model.js";
import httpStatus from "http-status";
import bcrypt, {hash} from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

const login = async (req, res) => {
    const {username, password} = req.body;

    if(!username || !password){
        return res.status(httpStatus.BAD_REQUEST).json({message: "Username and password are required"});
    }

    try{
        const user = await User.findOne({username});
        if(!user){
            return res.status(httpStatus.NOT_FOUND).json({message: "User not found"});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if(isPasswordValid){
            const token = crypto.randomBytes(20).toString('hex');
            user.token = token;
            await user.save();
            res.status(httpStatus.OK).json({message: "Login successful", token});
        }else{
            return res.status(httpStatus.UNAUTHORIZED).json({message: "Invalid username or password"});
        }
    }catch (error) {
        console.error("Error logging in user:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: "Internal server error"});
    }
}

const register = async (req, res) => {
    const {name, username, password} = req.body;

    try{
        const existingUser = await User.findOne({username});
        if(existingUser){
            return res.status(httpStatus.FOUND).json({message: "User already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword
        });

        await newUser.save();
        res.status(httpStatus.CREATED).json({message: "User registered successfully"});
    }catch (error) {
        console.error("Error registering user:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: "Internal server error"});
    }
}

const getUserHistory = async (req, res) => {
    const {token} = req.query;

    try{
        const user = await User.findOne({token: token});
        const meetings = await Meeting.find({user_id: user.username});
        res.json(meetings);
    }catch (error) {
        console.error("Error fetching user history:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: "Internal server error"});
    }
}

const addToHistory = async (req, res) => {
    const {token, meetingCode} = req.body;

    try{
        const user = await User.findOne({token: token});
        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meetingCode
        });

        await newMeeting.save();
        res.status(httpStatus.CREATED).json({message: "Meeting added to history"});
    }catch (error) {
        console.error("Error adding to user history:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: "Internal server error"});
    }
}
export {login, register, getUserHistory, addToHistory};