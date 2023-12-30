const router = require("express").Router();
const { Visit, validate } = require("../models/visit");
const currentUser = require('../middleware/currentUser');

router.post("/", currentUser, async (req, res) => {
	try {
		const { error } = validate(req.body) //walidacja
		if(error) { //jeśli błąd w walidacji
			return res.status(400).send({ message: error.details[0].message }) //message jaki błąd
		}/*
		const newVisit = new Visit({ //tworzenie obiektu na podstawie wcześniej utworzonego modelu
            serviceType: req.body.serviceType,
            service: req.body.service,
            carBrand: req.body.carBrand,
            carModel: req.body.carModel,
			date: req.body.date,
            time: req.body.time,
            moreInfo: req.body.moreInfo,
            carProductionYear: req.body.carProductionYear,
            engine: req.body.engine,
            vin: req.body.vin,
            registrationNumber: req.body.registrationNumber,
            createdBy: req.currentUser._id
        })*/
        // Sprawdź, czy istnieje już wizyta na podaną datę i godzinę
        const existingVisit = await Visit.findOne({
            date: req.body.date,
            time: req.body.time,
        })
        if (existingVisit) {
            return res.status(400).send({ message: "This time slot is already booked!" })
        }
        await new Visit({ ...req.body, createdBy: req.currentUser._id }).save() //tworzy nowy obiekt User z danymi przesłanymi i zapisuje do bazy
        //await newVisit.save(); //zapisywanie obiektu do bazy danych
        res.status(201).send({ message: "Visit created successfully!" }) //komunikat o utworzonej wizycie
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" })
		console.log(error)
	}
});

router.get("/", async (req, res) => {
    try {
        const users = await Visit.find({}) //pobiera wizyty z bazy danych
        res.status(200).send({ data: users }) //status ok - zwraca wizyty
    } catch (error) {
        res.status(500).send({ message: error.message })
		console.log(error.message)
    }
});

router.get("/userVisits/:userId", async (req, res) => {
    try {
        const userId = req.params.userId
        // Pobranie wizyt danego użytkownika na podstawie jego ID
        const userVisits = await Visit.find({ createdBy: userId });
        if (!userVisits) {
            return res.status(404).send({ message: "User visits not found" })
        }
        res.status(200).send({ data: userVisits })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

module.exports = router;