const router = require("express").Router();
const { Visit, validate } = require("../models/visit");
const currentUser = require('../middleware/currentUser');
const { userVisitCreated } = require("../emailNotifications")

router.post("/", currentUser, async (req, res) => {
	try {
		const { error } = validate(req.body)
		if(error) {
			return res.status(400).send({ message: error.details[0].message })
		}
        //sprawdź, czy istnieje już wizyta na podaną datę i godzinę
        const existingVisit = await Visit.findOne({
            date: req.body.date,
            time: req.body.time,
        })
        if (existingVisit) {
            return res.status(400).send({ message: "Podany termin jest już zajęty" })
        }
        const newVisit = new Visit({ ...req.body, createdBy: req.currentUser._id })
        const savedVisit = await newVisit.save()
        const newVisitId = savedVisit._id
        await userVisitCreated(req.currentUser.email, req.body, newVisitId)
        res.status(201).send({ message: "Umówiono wizytę" })
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" })
		console.log(error)
	}
});

router.get("/", async (req, res) => {
    try {
        const users = await Visit.find({})
        res.status(200).send({ data: users })
    } catch (error) {
        res.status(500).send({ message: error.message })
		console.log(error.message)
    }
});

router.get("/userVisits/:userId", async (req, res) => {
    try {
        const userId = req.params.userId
        const userVisits = await Visit.find({ createdBy: userId })
        if (!userVisits) {
            return res.status(404).send({ message: "Podana wizyta nie została znaleziona" })
        }
        res.status(200).send({ data: userVisits })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

router.get('/available-hours/:date', async (req, res) => {
    try {
        const requestedDate = req.params.date
        //pobranie godzin zdefiniowanych w schemacie
        const definedHours = Visit.schema.path('time').enumValues
        //sprawdzenie zajętych godzin dla danego dnia w bazie danych
        const occupiedHours = await Visit.find({ date: requestedDate }, 'time')
        const occupiedTimes = occupiedHours.map(visit => visit.time)
        //filtrowanie dostępnych godzin na podstawie zdefiniowanych godzin i zajętych godzin
        const availableHours = definedHours.filter(hour => !occupiedTimes.includes(hour))
        res.status(200).json({ availableHours })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
});

module.exports = router;