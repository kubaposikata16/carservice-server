const jwt = require("jsonwebtoken");

function tokenVerification(req, res, next) {
    console.log("WEJSCIE DO TOKENA")
    let token = req.headers["x-access-token"] //pobranie tokenu z nagłówka
    if (!token) {
        res.status(403).send({ message: "No token provided!" })
    }
    jwt.verify(token, process.env.JWTPRIVATEKEY, (error, decodeduser) => { //jeśli przesłano token - weryfikacja jego poprawności
        if (error) {
            console.log("Unauthorized!")
            res.status(401).send({ message: "Unauthorized!" })
        }
        if (decodeduser && decodeduser._id) {
            console.log("Token correct, decoded user _id:", decodeduser._id)
            req.user = decodeduser
            next()
        } else {
            return res.status(401).send({ message: "Unauthorized!" })
        }
    })
};

module.exports = tokenVerification;