const router = require("express").Router();
const { Visit, validate } = require("../models/visit");
const currentUser = require('../middleware/currentUser');
const currentVisit = require('../middleware/currentVisit');

router.get("/", currentUser, async (req, res) => {
    try {
        const visit = await Visit.find({ createdBy: req.currentUser._id }) //znalezienie wizyt utworzonych przed danego usera
        res.status(200).send({ data: visit, message: "Visit details" }) //wyświetla dane wizyty
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" })
        console.log(error)
    }
});

/*
//dodanie tego pozwalałoby userowi na edycje wizyty po jej zatwierdzeniu - user powinien jedynie anulować wizytę (delete) po jej zatwierdzeniu jeśli mu coś nie pasuje
router.put("/:visitId", async (req, res) => {
    try {
        const visitId = req.params.visitId //pobiera visitId
        const newData = req.body //pobiera dane z żądania do edycji
        const { error } = validate(newData) //walidacja
        if (error) {
            return res.status(400).send({ message: error.details[0].message }) //jeśli błąd - zwraca jaki błąd
        }
        const updatedVisit = await Visit.findByIdAndUpdate(visitId, req.body, { new: true }) //sprawdza czy istnieje wizyta z takim visitId i ją aktualizuje
        if (!updatedVisit) {
            return res.status(404).send({ message: "Visit not found" }) //jeśli nie - zwraca błąd
        }
        res.status(200).send({ data: updatedVisit, message: "Visit updated successfully" }) //status ok - update danych
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" })
        console.log(error)
    }
});
*/

/*
router.delete("/:visitId", async (req, res) => {  //!!!!!!!!!!!! do poprawy !!!!!!!!!!!!!
    try {
        const visitId = req.params.visitId; //pobiera visitId
        const deletedVisit = await Visit.findByIdAndDelete(visitId) //sprawdza czy istnieje wizyta z visitId i usuwa ją
        if (!deletedVisit) {
            return res.status(404).send({ message: "Visit not found" }) //sprawdza czy wizyta została usunięta
        }
        res.status(200).send({ data: deletedVisit, message: "Visit deleted successfully" }) //jeśli usunięty zwraca sukces
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" })
        console.log(error)
    }
});
*/

router.delete("/:visitId", currentUser, currentVisit, async (req, res) => {
    try {
        const visitId = req.params.visitId
        const currentDateTime = new Date() //aktualna data i czas
        //sprawdzamy, czy bieżąca wizyta należy do zalogowanego użytkownika
        if (!req.currentVisit || !req.currentVisit.userId == req.currentUser._id) {
            return res.status(403).send({ message: "You are not authorized to delete this visit" })
        }
        const visitDateTime = new Date(req.currentVisit.date + ' ' + req.currentVisit.time) //data i czas wizyty
        const timeDiff = visitDateTime - currentDateTime //różnica czasu między obecnym a wizytą
        const timeDiffInHours = timeDiff / (1000 * 60 * 60) //różnica czasu w godzinach
        const minimumHoursForCancellation = 24
        if (timeDiffInHours <= minimumHoursForCancellation) {
            return res.status(403).send({ message: "It's too late to cancel this visit" });
        }
        const deletedVisit = await Visit.findByIdAndDelete(visitId)
        if (!deletedVisit) {
            return res.status(404).send({ message: "Visit not found" })
        }
        res.status(200).send({ data: deletedVisit, message: "Visit deleted successfully" })
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" })
        //console.log(error)
        console.error(error);
    }
});


module.exports = router;