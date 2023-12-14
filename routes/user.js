const router = require("express").Router()
const currentUser = require('../middleware/currentUser');
const { User, validate } = require("../models/user")
const bcrypt = require("bcrypt"); //biblioteka, która zapewnia haszowanie
//const mongoose = require('mongoose');
//const { ObjectId } = mongoose.Types;

router.get("/", currentUser, async (req, res) => {
    try {
        res.status(200).send({ data: req.currentUser, message: "User details" }); //użycie req.currentUser aby uzyskać dostęp do zalogowanego użytkownika
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

router.put("/", currentUser, async (req, res) => {
    try {
        const newData = req.body; //pobranie danych z żądania do edycji
        const { error } = validate(newData); //walidacja
        if (error) {
            return res.status(400).send({ message: error.details[0].message }) //jeśli błąd - zwraca jaki błąd
        }
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser && existingUser._id.toString() !== req.currentUser._id.toString()) {
            return res.status(400).send({ message: "Email already exists in the database" }) //jeśli istnieje użytkownik o tym samym emailu (nie ten sam co aktualnie zalogowany), zwróć błąd
        }
        let updatedData = { ...req.body };
        if (!req.body.password) {
            delete updatedData.password; // Jeśli nie przekazano nowego hasła, usuń pole "password" z obiektu do aktualizacji
        } else {
            const salt = await bcrypt.genSalt(Number(process.env.SALT)) //generuje salt używany do haszowania hasła
            const hashPassword = await bcrypt.hash(req.body.password, salt) //haszowanie za pomocą salt i bcrypt
            updatedData.password = hashPassword; // Zaktualizuj hasło w danych do aktualizacji
        }
        const updatedUser = await User.findByIdAndUpdate(req.currentUser._id, updatedData, { new: true }) //użycie req.currentUser i aktualizacja danych
        if (!updatedUser) {
            return res.status(404).send({ message: "User not found" })
        }
        res.status(200).send({ data: updatedUser, message: "User updated successfully" }) //status ok - update danych
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

router.delete("/", currentUser, async (req, res) => {
    try {
        // Usunięcie aktualnie zalogowanego użytkownika
        const deletedUser = await User.findByIdAndDelete(req.currentUser._id); //usunięcie użytkownika za pomocą req.currentUser._id
        if (!deletedUser) {
            return res.status(404).send({ message: "User not found" }) //sprawdza czy user został usunięty
        }
        res.status(200).send({ data: deletedUser, message: "User deleted successfully" }) //jeśli usunięty - zwraca sukces
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = router