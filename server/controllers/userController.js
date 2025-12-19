import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signUp = async (req, res) => {
    try {
        const { fullName, email, password, bio } = req.body;

        if (!fullName || !email || !password || !bio) {
            return res.status(400).json({ success: false, message: "Missing Deatils" })
        }
        const user = await User.findOne({ email });

        if (user) {
            return res.status(409).json({ success: false, message: "User already exists" })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            fullName, email, password: hashedPassword, bio
        });

        const token = generateToken(newUser._id);

        res.json({ success: true, userData: newUser, token, message: "Account created successfully" })

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message })
    }
}




export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Missing Deatils" })
        }

        const userData = await User.findOne({ email });

        const isPassworCorrect = await bcrypt.compare(password, userData.password);

        if (!isPassworCorrect) {
            return res.status(400).json({ success: false, message: "Invalid credential" })
        }

        const token = generateToken(userData._id);

        res.json({ success: true, userData, token, message: "Login Successfully" })


    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message })
    }
}


// check if user is authenticated

export const checkAuth = (req, res) => {
    res.json({ success: true, user: req.user });
}



// update user profile detail


export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;

        const userId = req.user._id;

        let updateUser;

        if (!profilePic) {
            updateUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true });
        } else {
            const upload = await cloudinary.uploader.upload(profilePic);
            updateUser = await User.findByIdAndUpdate(userId, { bio, fullName, profilePic: upload.secure_url }, { new: true });
        }

        res.json({ success: true, user: updateUser })

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ success: false, message: error.message })

    }
}

