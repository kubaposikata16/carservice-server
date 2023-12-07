const router = require("express").Router()
const currentUser = require('../middleware/currentUser');
const { User } = require("../models/user")
//const mongoose = require('mongoose');
//const { ObjectId } = mongoose.Types;

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }
        res.status(200).send({ data: req.currentUser, message: "Zalogowany użytkownik" })
    } catch (error) {
        res.status(500).send({ message: error.message })
        console.log(error.message)
    }
});

//edycja?

//usuwanie?

module.exports = router