const { User } = require("../models/user")
//const jwt = require("jsonwebtoken")
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function currentUser(req, res, next) {
    try {
        const user = await User.findById(req.user._id) //znajdź użytkownika na podstawie _id z req.user
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        req.currentUser = user //ustaw bieżącego użytkownika w req.currentUser
        next()
    } catch (error) {
        res.status(500).send({ message: error.message })
        console.log(error.message)
    }
}

module.exports = currentUser