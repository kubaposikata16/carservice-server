const { User } = require("../models/user");

async function currentUser(req, res, next) {
    try {
        const user = await User.findById(req.user._id)
        if (!user) {
            return res.status(404).send({ message: "Nie znaleziono użytkownika" })
        }
        req.currentUser = user //ustaw bieżącego użytkownika w req.currentUser
        next()
    } catch (error) {
        res.status(500).send({ message: error.message })
        console.log(error.message)
    }
};

module.exports = currentUser;