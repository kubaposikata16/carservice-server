const router = require("express").Router();
const currentUser = require('../middleware/currentUser');
const { User, validateEditUser } = require("../models/user");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { userDataChanged, userAccountDeleted, dataChanged, accountDeleted, sendResetEmail } = require("../emailNotifications");

router.get("/", currentUser, async (req, res) => {
    try {
        res.status(200).send({ data: req.currentUser, message: "Dane użytkownika" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).send({ message: "Nie znaleziono użytkownika" })
        }
        const userData = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber
        }
        res.status(200).send({ data: userData, message: "Dane użytkownika" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

router.put("/", currentUser, async (req, res) => {
    try {
        const newData = req.body
        const { error } = validateEditUser(newData)
        if (error) {
            return res.status(400).send({ message: error.details[0].message })
        }
        const existingUser = await User.findOne({ email: req.body.email })
        if (existingUser && existingUser._id.toString() !== req.currentUser._id.toString()) {
            return res.status(400).send({ message: "Podany e-mail jest zajęty" })
        }
        let updatedData = { ...req.body }
        if (!req.body.password) {
            delete updatedData.password
        } else {
            const salt = await bcrypt.genSalt(Number(process.env.SALT))
            const hashPassword = await bcrypt.hash(req.body.password, salt)
            updatedData.password = hashPassword
        }
        const updatedUser = await User.findByIdAndUpdate(req.currentUser._id, updatedData, { new: true }) 
        if (!updatedUser) {
            return res.status(404).send({ message: "Nie znaleziono użytkownika" })
        }
        await userDataChanged(req.currentUser.email)
        res.status(200).send({ data: updatedUser, message: "Dane użytkownika zaktualizowane pomyślnie" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

router.put("/:userId", async (req, res) => {
    try {
        const userIdToUpdate = req.params.userId
        const newData = req.body
        const { error } = validateEditUser(newData)
        if (error) {
            return res.status(400).send({ message: error.details[0].message })
        }
        const existingUser = await User.findOne({ email: req.body.email })
        if (existingUser && existingUser._id.toString() !== userIdToUpdate) {
            return res.status(400).send({ message: "Podany e-mail jest zajęty" })
        }
        let updatedData = { ...req.body }
        if (!req.body.password) {
            delete updatedData.password
        } else {
            const salt = await bcrypt.genSalt(Number(process.env.SALT))
            const hashPassword = await bcrypt.hash(req.body.password, salt)
            updatedData.password = hashPassword
        }
        const updatedUser = await User.findByIdAndUpdate(userIdToUpdate, updatedData, { new: true })
        if (!updatedUser) {
            return res.status(404).send({ message: "Nie znaleziono użytkownika" })
        }
        await dataChanged(updatedUser.email)
        res.status(200).send({ data: updatedUser, message: "Dane użytkownika zaktualizowane pomyślnie" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

router.put("/role/:userId", currentUser, async (req, res) => {
    try {
        const userId = req.params.userId
        const role = req.body.role
        if (req.currentUser.role !== 'admin') {
            return res.status(403).send({ message: "Brak dostępu" })
        }
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).send({ message: "Nie znaleziono użytkownika" })
        }
        user.role = role;
        const updatedUser = await user.save()
        res.status(200).send({ data: updatedUser, message: "Rola użytkownika została zmieniona" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

router.delete("/", currentUser, async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.currentUser._id)
        if (!deletedUser) {
            return res.status(404).send({ message: "Nie znaleziono użytkownika" })
        }
        await userAccountDeleted(req.currentUser.email)
        res.status(200).send({ data: deletedUser, message: "Konto zostało usunięte" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

router.delete("/:userId", async (req, res) => {
    try {
        const userIdToDelete = req.params.userId
        const deletedUser = await User.findByIdAndDelete(userIdToDelete)
        if (!deletedUser) {
            return res.status(404).send({ message: "Nie znaleziono użytkownika" })
        }
        await accountDeleted(deletedUser.email)
        res.status(200).send({ data: deletedUser, message: "Konto zostało usunięte" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

router.post("/reset-password", async (req, res) => {
    const { email } = req.body
    try {
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).send({ message: "Podano zły adres e-mail" })
        }
        function generateResetToken() {
            return crypto.randomBytes(20).toString('hex')
        }
        const resetToken = generateResetToken()
        user.resetPasswordToken = resetToken
        user.resetPasswordTokenCreatedAt  = Date.now() + 3600000 
        await user.save()
        const resetLink = `http://localhost:3000/reset-password/${resetToken}`
        await sendResetEmail(email, resetLink)
        return res.status(200).send({ message: "Sprawdź swoją skrzynkę pocztową" })
    } catch (error) {
        return res.status(500).send({ message: error.message })
    }
});

router.put("/reset-password/:token", async (req, res) => {
    const { token } = req.params
    const { newPassword } = req.body
    try {
        const user = await User.findOne({
            resetPasswordToken: token
        })
        if (!user) {
            return res.status(400).send({ message: "Błędny token" })
        }
        if (!newPassword) {
            return res.status(400).send({ message: "Nowe hasło nie może być starym" })
        }
        const tokenCreationTime = new Date(user.resetPasswordTokenCreatedAt).getTime()
        const currentTime = new Date().getTime()
        const tokenExpirationTime = tokenCreationTime + 3600000
        if (currentTime > tokenExpirationTime) {
            return res.status(400).send({ message: "Token wygasł" })
        }
        const salt = await bcrypt.genSalt(Number(process.env.SALT))
        const hashPassword = await bcrypt.hash(newPassword, salt)
        user.password = hashPassword
        user.resetPasswordToken = null
        user.resetPasswordTokenCreatedAt = null
        await user.save();
        return res.status(200).send({ message: "Hasło zostało zmienione" })
    } catch (error) {
        return res.status(500).send({ message: error.message })
    }
});

module.exports = router;