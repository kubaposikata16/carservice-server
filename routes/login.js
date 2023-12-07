const router = require("express").Router();
const { User, validateLogin } = require("../models/user");
const bcrypt = require("bcrypt");
//const Joi = require("joi");

router.post("/", async (req, res) => {
    try {
        const { error } = validateLogin(req.body) //walidacja
        if (error) {
            return res.status(400).send({ message: error.details[0].message }) //jeśli błąd - zwraca jaki błąd
        }
        const user = await User.findOne({ email: req.body.email }) //sprawdzenie czy istnieje już user z tym samym emailem w bazie danych
        if (!user) {
            return res.status(401).send({ message: "Invalid email or password!" }) //jeśli nie istnieje - zwraca błąd
        }                
        const validPassword = await bcrypt.compare( //jeśli użytkownik zostanie znaleziony, sprawdza poprawność hasła za pomocą funkcji bcrypt.compare
            req.body.password,
            user.password
        )
        if (!validPassword) {
            return res.status(401).send({ message: "Invalid email or password!" }) //jeśli niepoprawne hasło - zwraca błąd
        }                    
        const token = user.generateAuthToken() //generowany jest authtoken
        res.status(200).send({ data: token, message: "Logged in successfully!" }) //komunikat sukces !!!! tu może date usunąć idk jeszcze !!!!
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" })
        console.log(error)
    }
});

module.exports = router;