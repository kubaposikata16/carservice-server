const router = require("express").Router();
const { User, validate } = require("../models/user"); //pobieranie modelu User
const bcrypt = require("bcrypt"); //biblioteka, która zapewnia haszowanie

router.post("/", async (req, res) => {
    try {
        const { error } = validate(req.body) //walidacja
        if (error) {
            return res.status(400).send({ message: error.details[0].message }) //jeśli błąd - zwraca jaki błąd
        }
        const user = await User.findOne({ email: req.body.email }) //sprawdzenie czy istnieje już user z tym samym emailem w bazie danych
        if (user) {
            return res.status(409).send({ message: "User with given email already exist!" }) //jeśli tak zwraca konflikt
        } //jeśli nie
        const salt = await bcrypt.genSalt(Number(process.env.SALT)) //generuje salt używany do haszowania hasła
        const hashPassword = await bcrypt.hash(req.body.password, salt) //haszowanie za pomocą salt i bcrypt
        await new User({ ...req.body, password: hashPassword }).save() //tworzy nowy obiekt User z danymi przesłanymi i zapisuje do bazy
        res.status(201).send({ message: "User created successfully!" }) //komunikat sukces
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" })
        console.log(error.message)
    }
});

router.get("/", async (req, res) => {
    try {
        const users = await User.find({}) //pobiera wszystkich użytkowników z bazy danych
        res.status(200).send({ data: users }) //status ok - zwraca użytkowników
    } catch (error) {
        res.status(500).send({ message: error.message })
        console.log(error.message)
    }
});

//edyjca?

//usuwanie?

module.exports = router;