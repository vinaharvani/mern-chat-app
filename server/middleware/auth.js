import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided"
            });
        }

        const token = authHeader.split(" ")[1];

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decodedToken.userId).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};
