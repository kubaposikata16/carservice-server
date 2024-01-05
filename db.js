const mongoose = require("mongoose");

module.exports = () => {
    try {
        mongoose.connect(process.env.DB)
        .then(() => {
            console.log("Connected to database successfully!")
        })
        .catch((error) => {
            console.error("Error connecting to database:", error);
        })
    } catch (error) {
        console.error("Could not connect to database:", error);
    }
}