const router = require("express").Router();
const { User, validate } = require("../models/user"); //pobieranie modelu User
const bcrypt = require("bcrypt"); //biblioteka, która zapewnia haszowanie

router.post("/", async (req, res) => {
    try {
        const { error } = validate(req.body) //walidacja
        if (error) {
            return res.status(400).send({ message: error.details[0].message }) //jeśli błąd - zwraca jaki błąd
        }
        const { firstName, lastName, email, password, phoneNumber } = req.body; //to sprawdzić dlaczego password jest takie
        const existingUser  = await User.findOne({ email: req.body.email }) //sprawdzenie czy istnieje już user z tym samym emailem w bazie danych
        if (existingUser) {
            return res.status(409).send({ message: "User with given email already exist!" }) //jeśli tak zwraca konflikt
        } //jeśli nie
        const salt = await bcrypt.genSalt(Number(process.env.SALT)) //generuje salt używany do haszowania hasła
        const hashPassword = await bcrypt.hash(req.body.password, salt) //haszowanie za pomocą salt i bcrypt
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashPassword,
            phoneNumber,
            role: 'client'
        })
        await newUser.save() //tworzy nowy obiekt User z danymi przesłanymi i zapisuje do bazy
        const token = newUser.generateAuthToken() //od razu zalogowany po rejestracji
        res.status(201).send({ data: token, message: "User created successfully!" }) //komunikat sukces
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" })
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
        // Pobranie użytkowników z rangami 'client' i 'employee'
        const users = await User.find({ role: { $in: ['client', 'employee'] } })
        res.status(200).send({ data: users })
    } catch (error) {
        res.status(500).send({ message: error.message })
        console.log(error.message)
    }
});

module.exports = router