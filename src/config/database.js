const mongoose = require("mongoose");
const dotenv = require("dotenv").config()

const connectDB = async () => {
    await mongoose.connect(process.env.DB_URL);
}

 
module.exports = {
    connectDB
}