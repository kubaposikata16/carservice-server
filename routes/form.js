const router = require("express").Router();
const { User } = require("../models/user")
const { Visit, validate } = require("../models/visit");
const currentUser = require('../middleware/currentUser');
const currentVisit = require('../middleware/currentVisit');
const { userVisitCanceled, statusChanged, visitCanceled } = require("../emailNotifications");

router.get("/", currentUser, async (req, res) => {
    try {
        const visit = await Visit.find({ createdBy: req.currentUser._id })
        res.status(200).send({ data: visit, message: "Szczegóły wizyty" })
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" })
        console.log(error)
    }
});

router.put("/status/:visitId", currentUser, async (req, res) => {
    try {
        const visitId = req.params.visitId
        const newStatus = req.body.status
        const visit = await Visit.findById(visitId)
        if (!visit) {
            return res.status(404).send({ message: "Podana wizyta nie została znaleziona" })
        }
        if (req.currentUser.role !== 'employee' && req.currentUser.role !== 'admin') {
            return res.status(403).send({ message: "Brak dostępu" })
        }
        visit.status = newStatus
        await visit.save()
        const createdByUser = await User.findById(visit.createdBy);
        if (!createdByUser) {
            return res.status(404).send({ message: "Nie znaleziono użytkownika" });
        }
        console.log("Visit ID before statusChanged:", visitId);
        await statusChanged(createdByUser.email, newStatus, visitId)
        console.log("Visit ID after statusChanged:", visitId);
        return res.status(200).send({ data: visit, message: "Status wizyty został zmieniony" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

router.delete("/:visitId", currentUser, currentVisit, async (req, res) => {
    try {
        const visitId = req.params.visitId
        const currentDateTime = new Date() //aktualna data i czas
        if (!req.currentVisit || req.currentVisit.createdBy.toString() !== req.currentUser._id.toString()) {
            return res.status(403).send({ message: "Brak dostępu" })
        }
        const visitDate = new Date(req.currentVisit.date)
        const visitTime = req.currentVisit.time
        const visitDateTime = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate(), 
        parseInt(visitTime.split(":")[0]), parseInt(visitTime.split(":")[1]), 0)
        const timeDiff = visitDateTime.getTime() - currentDateTime.getTime() 
        const timeDiffInHours = timeDiff / (1000 * 60 * 60)
        const minimumHoursForCancellation = 24
        const isFutureVisit = visitDateTime > currentDateTime 
        console.log("currentDateTime", currentDateTime)
        console.log("visitDateTime", visitDateTime)
        if (!isFutureVisit || timeDiffInHours < minimumHoursForCancellation) {
            return res.status(403).send({ message: "Wizytę można anulować do 24 godzin przed jej terminem" })
        }
        const deletedVisit = await Visit.findByIdAndDelete(visitId)
        if (!deletedVisit) {
            return res.status(404).send({ message: "Nie znaleziono wizyty" })
        }
        await userVisitCanceled(req.currentUser.email, visitId)
        res.status(200).send({ data: deletedVisit, message: "Anulowano wizytę" })
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" })
        console.log(error)
    }
});

router.delete("/forEmployeeOrAdmin/:visitId", async (req, res) => {
    try {
        const visitId = req.params.visitId
        const visitToDelete = await Visit.findById(visitId)
        if (!visitToDelete) {
            return res.status(404).send({ message: "Nie znaleziono wizyty" })
        }
        const createdByUserId = visitToDelete.createdBy
        const user = await User.findById(createdByUserId)
        if (!user) {
            return res.status(404).send({ message: "Nie znaleziono użytkownika" })
        }
        const email = user.email
        const deletedVisit = await Visit.findByIdAndDelete(visitId)
        if (!deletedVisit) {
            return res.status(404).send({ message: "Nie znaleziono wizyty" })
        }
        await visitCanceled(email, visitId)
        res.status(200).send({ data: deletedVisit, message: "Anulowano wizytę" })
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" })
        console.log(error)
    }
});

module.exports = router;