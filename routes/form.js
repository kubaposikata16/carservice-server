const router = require("express").Router();
const { Visit, validate } = require("../models/visit");

router.post("/", async (req, res) => {
	try {
		const { error } = validate(req.body) //walidacja
		if(error) { //jeśli błąd w walidacji
			return res.status(400).send({ message: error.details[0].message }) //message jaki błąd
		}
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
            registrationNumber: req.body.registrationNumber
        });
        await newVisit.save(); //zapisywanie obiektu do bazy danych
        res.status(201).send({ message: "Visit created successfully!" }) //komunikat o utworzonej wizycie
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" })
		console.log(error)
	}
});

router.get("/", async (req, res) => {
    try {
        const users = await Visit.find({}) //pobiera wizytę z bazy danych
        res.status(200).send({ data: users }) //status ok - zwraca wizyte
    } catch (error) {
        res.status(500).send({ message: error.message })
		console.log(error.message)
    }
});

//edycja

//usuwanie?

module.exports = router;

/*
DODANIE FORM I FORMS TAK JAK Z USER I USERS ŻEBY MÓC TEŻ WYŚWIETLAĆ, EDYTOWAĆ, USUWAĆ WIZYTE PO ID
*/