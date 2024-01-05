const router = require("express").Router();
const { User, validate } = require("../models/user");
const bcrypt = require("bcrypt"); //biblioteka, która zapewnia haszowanie
const { userAccountCreated } = require("../emailNotifications");

router.post("/", async (req, res) => {
    try {
        const { error } = validate(req.body)
        if (error) {
            return res.status(400).send({ message: error.details[0].message })
        }
        const { firstName, lastName, email, password, phoneNumber } = req.body;
        const existingUser  = await User.findOne({ email: req.body.email })
        if (existingUser) {
            return res.status(409).send({ message: "Podany e-mail jest zajęty" })
        }
        const salt = await bcrypt.genSalt(Number(process.env.SALT)) //generuje salt używany do haszowania hasła
        const hashPassword = await bcrypt.hash(req.body.password, salt) //haszowanie za pomocą salt i bcrypt
        const newUser = new User({ //tworzenie obiektu
            firstName,
            lastName,
            email,
            password: hashPassword,
            phoneNumber,
            role: 'client'
        })
        await newUser.save() //zapisanie go do bazy danych
        await userAccountCreated(email);
        const token = newUser.generateAuthToken() //od razu zalogowany po rejestracji
        res.status(201).send({ data: token, message: "Konto zostało utworzone" })
    } catch (error) {
        res.status(500).send({ message: error.message })
        console.log(error.message)
    }
});

router.get("/forAdmin", async (req, res) => {
    try {
        const users = await User.find({})
        res.status(200).send({ data: users })
    } catch (error) {
        res.status(500).send({ message: error.message })
        console.log(error.message)
    }
});

router.get("/forEmployee", async (req, res) => {
    try {
        const users = await User.find({ role: { $in: ['client', 'employee'] } })
        res.status(200).send({ data: users })
    } catch (error) {
        res.status(500).send({ message: error.message })
        console.log(error.message)
    }
});

module.exports = router;