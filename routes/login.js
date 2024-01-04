const router = require("express").Router();
const { User, validateLogin } = require("../models/user");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
    try {
        const { error } = validateLogin(req.body)
        if (error) {
            return res.status(400).send({ message: error.details[0].message })
        }
        const user = await User.findOne({ email: req.body.email })
        if (!user) {
            return res.status(401).send({ message: "Invalid email or password!" })
        }   
        //jeśli użytkownik zostanie znaleziony, sprawdza poprawność hasła za pomocą funkcji bcrypt.compare             
        const validPassword = await bcrypt.compare(
            req.body.password,
            user.password
        )
        if (!validPassword) {
            return res.status(401).send({ message: "Invalid email or password!" })
        }                    
        const token = user.generateAuthToken() //generowany jest authtoken
        res.status(200).send({ data: token, message: "Logged in successfully!" })
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" })
        console.log(error)
    }
});

module.exports = router;