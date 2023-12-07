const jwt = require("jsonwebtoken")

function tokenVerification(req, res, next) {
    console.log("WEJSCIE DO TOKENA")
    let token = req.headers["x-access-token"] //pobranie tokenu z nagłówka
    //const pokemon = req.data
    if (!token) {
        res.status(403).send({ message: "No token provided!" }); //zwraca status - użytkownik nie ma dostępu
    }
    jwt.verify(token, process.env.JWTPRIVATEKEY, (error, decodeduser) => { //jeśli przesłano token - weryfikacja jego poprawności
        if (error) {
            console.log("Unauthorized!")
            res.status(401).send({ message: "Unauthorized!" }); //zwraca status - brak dostępu
        }
        console.log("Token correct, user: " + decodeduser._id)
        req.user = decodeduser
        next()
    })
}

module.exports = tokenVerification