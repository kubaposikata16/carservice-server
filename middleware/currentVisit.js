const { Visit } = require("../models/visit")
//const jwt = require("jsonwebtoken")
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

async function currentVisit(req, res, next) {
    try {
        const visitId = req.params.visitId;
        const visit = await Visit.findById(visitId);
        if (!visit) {
            return res.status(404).send({ message: "Visit not found" })
        }
        req.currentVisit = visit //ustaw bieżącą wizytę w req.currentVisit
        next()
    } catch (error) {
        res.status(500).send({ message: error.message })
        console.log(error.message)
    }
}

module.exports = currentVisit