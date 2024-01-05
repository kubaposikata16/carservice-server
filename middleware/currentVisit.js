const { Visit } = require("../models/visit")

async function currentVisit(req, res, next) {
    try {
        const visitId = req.params.visitId
        const visit = await Visit.findById(visitId)
        if (!visit) {
            return res.status(404).send({ message: "Nie znaleziono wizyty" })
        }
        req.currentVisit = visit
        next()
    } catch (error) {
        res.status(500).send({ message: error.message })
        console.log(error.message)
    }
};

module.exports = currentVisit;