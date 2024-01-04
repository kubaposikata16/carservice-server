const router = require("express").Router()
const currentUser = require('../middleware/currentUser');
const { User, validate, validateEditUser } = require("../models/user")
const bcrypt = require("bcrypt"); //biblioteka, która zapewnia haszowanie
//const mongoose = require('mongoose');
//const { ObjectId } = mongoose.Types;
const crypto = require("crypto");
const { userDataChanged, userAccountDeleted, dataChanged, accountDeleted, sendResetEmail } = require("../emailNotifications")

router.get("/", currentUser, async (req, res) => {
    try {
        res.status(200).send({ data: req.currentUser, message: "User details" }); //użycie req.currentUser aby uzyskać dostęp do zalogowanego użytkownika
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId // Pobranie ID z parametru ścieżki
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).send({ message: "User not found" })
        }
        const userData = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber
        };

        res.status(200).send({ data: userData, message: "User details" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

router.put("/", currentUser, async (req, res) => {
    try {
        const newData = req.body; //pobranie danych z żądania do edycji
        const { error } = validateEditUser(newData); //walidacja
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
        await userDataChanged(req.currentUser.email)
        res.status(200).send({ data: updatedUser, message: "User updated successfully" }) //status ok - update danych
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

router.put("/:userId", async (req, res) => {
    try {
        const userIdToUpdate = req.params.userId; // Pobranie ID użytkownika do aktualizacji
        const newData = req.body; // Pobranie danych z żądania do edycji
        const { error } = validateEditUser(newData); // Walidacja danych
        if (error) {
            return res.status(400).send({ message: error.details[0].message })
        }
        const existingUser = await User.findOne({ email: req.body.email })
        if (existingUser && existingUser._id.toString() !== userIdToUpdate) {
            return res.status(400).send({ message: "Email already exists in the database" })
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
            return res.status(404).send({ message: "User not found" });
        }
        await dataChanged(updatedUser.email)
        res.status(200).send({ data: updatedUser, message: "User updated successfully" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

router.put("/role/:userId", currentUser, async (req, res) => {
    try {
        const userId = req.params.userId
        const role = req.body.role
        //sprawdzenie, czy aktualnie zalogowany użytkownik jest administratorem
        if (req.currentUser.role !== 'admin') {
            return res.status(403).send({ message: "Access forbidden!" })
        }
        // Pobranie użytkownika z bazy danych na podstawie userId
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).send({ message: "User not found" })
        }
        // Aktualizacja roli użytkownika
        user.role = role;
        const updatedUser = await user.save()
        res.status(200).send({ data: updatedUser, message: "User role updated successfully" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

router.delete("/", currentUser, async (req, res) => {
    try {
        // Usunięcie aktualnie zalogowanego użytkownika
        const deletedUser = await User.findByIdAndDelete(req.currentUser._id); //usunięcie użytkownika za pomocą req.currentUser._id
        if (!deletedUser) {
            return res.status(404).send({ message: "User not found" }) //sprawdza czy user został usunięty
        }
        await userAccountDeleted(req.currentUser.email)
        res.status(200).send({ data: deletedUser, message: "User deleted successfully" }) //jeśli usunięty - zwraca sukces
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

router.delete("/:userId", async (req, res) => {
    try {
        const userIdToDelete = req.params.userId; // Pobranie ID użytkownika do usunięcia
        const deletedUser = await User.findByIdAndDelete(userIdToDelete)
        if (!deletedUser) {
            return res.status(404).send({ message: "User not found" })
        }
        await accountDeleted(deletedUser.email)
        res.status(200).send({ data: deletedUser, message: "User deleted successfully" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

router.post("/reset-password", async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send({ message: "User doesn't exist" });
        }

        function generateResetToken() {
            return crypto.randomBytes(20).toString('hex');
        }
        
        // Wygenerowanie unikalnego tokena resetującego hasło
        const resetToken = generateResetToken(); // Funkcja do generowania tokena

        // Ustawienie tokena i czasu jego ważności dla użytkownika w bazie danych
        // Zapisanie wygenerowanego tokenu do bazy danych dla danego użytkownika
        user.resetPasswordToken = resetToken;
        const tokenExpiry = Date.now() + 3600000; // Token ważny przez 1 godzinę

        await user.save();

        // Wysłanie e-maila z linkiem resetującym hasło
        const resetLink = `http://localhost:3000/reset-password/${resetToken}`; // Link do strony resetującej hasło
        await sendResetEmail(email, resetLink); // Wywołanie funkcji wysyłającej e-mail

        return res.status(200).send({ message: "E-mail was sent" });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
});

router.put("/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    try {
        const user = await User.findOne({
            resetPasswordToken: token
        });
        

        if (!user) {
            return res.status(400).json({ message: 'Nieprawidłowy lub wygasły token resetowania hasła.' });
        }

        if (!newPassword) {
            return res.status(400).json({ message: 'Nowe hasło jest wymagane.' });
        }

        // Ustawienie nowego hasła dla użytkownika
        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hashPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashPassword;
        // Zeruj pola związane z resetowaniem hasła
        user.resetPasswordToken = null;
        user.resetTokenExpiry = null;

        await user.save();

        return res.status(200).json({ message: 'Hasło zostało zresetowane pomyślnie.' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router