import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import { createContext } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUser, setOnlineUser] = useState([]);
    const [socket, setSocket] = useState(null);

    const checkAuth = async () => {
        try {
            const { data } = await axios.get(`/api/auth/check`);
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    //  Login function to handle user authentication and socket connection

   const login = async (state, credentials) => {
    try {
        const { data } = await axios.post(`/api/auth/${state}`, credentials);
        if (data.success) {
            setAuthUser(data.userData);
            connectSocket(data.userData);

            axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
            setToken(data.token);
            localStorage.setItem("token", data.token);

            toast.success(data.message);
        } else {
            toast.error(data.message);
        }
    } catch (error) {
        toast.error(error.response?.data?.message || error.message);
    }
};



    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUser([]);

        delete axios.defaults.headers.common["Authorization"];
    


        if (socket) {
            socket.disconnect();
            setSocket(null);
        }

        toast.success("Logged out successfully");
    };


    // update profile function

    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
            }
        } catch (error) {
            toast.error(error.message);
        }
    }


    // socket function for handle the socket connection and online user updates

    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;
        const newSocket = io(backendUrl, {
            query: {
                userId: userData._id,
            }
        });
        newSocket.connect();
        setSocket(newSocket);
        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUser(userIds);
        })
    }



    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            checkAuth();
        }
    }, [token]);



    const value = {
        axios,
        authUser,
        onlineUser,
        socket,
        login,
        logout,
        updateProfile
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
