const router = require("express").Router();
const { User } = require("../models/user")
const { Visit, validate } = require("../models/visit");
const currentUser = require('../middleware/currentUser');
const currentVisit = require('../middleware/currentVisit');
const { userVisitCanceled, statusChanged, visitCanceled } = require("../emailNotifications");

router.get("/", currentUser, async (req, res) => {
    try {
        const visit = await Visit.find({ createdBy: req.currentUser._id })
        res.status(200).send({ data: visit, message: "Visit details" })
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
            return res.status(404).send({ message: "Visit not found" })
        }
        //aktualizacja pola status, jeśli użytkownik ma odpowiednie uprawnienia
        if (req.currentUser.role !== 'employee' && req.currentUser.role !== 'admin') {
            return res.status(403).send({ message: "Access forbidden!" })
        }
        visit.status = newStatus
        await visit.save()
        const createdByUser = await User.findById(visit.createdBy);
        if (!createdByUser) {
            return res.status(404).send({ message: "User not found" });
        }
        await statusChanged(createdByUser.email, newStatus)
        return res.status(200).send({ data: visit, message: "Visit status updated successfully" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
});

router.delete("/:visitId", currentUser, currentVisit, async (req, res) => {
    try {
        const visitId = req.params.visitId
        const currentDateTime = new Date() //aktualna data i czas
        if (!req.currentVisit || req.currentVisit.createdBy.toString() !== req.currentUser._id.toString()) {
            return res.status(403).send({ message: "You are not authorized to delete this visit" })
        }
        const visitDate = new Date(req.currentVisit.date)
        const visitTime = req.currentVisit.time
        const visitDateTime = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate(), parseInt(visitTime.split(":")[0]), parseInt(visitTime.split(":")[1]), 0)
        const timeDiff = visitDateTime.getTime() - currentDateTime.getTime() //różnica czasu między obecnym a wizytą w milisekundach
        const timeDiffInHours = timeDiff / (1000 * 60 * 60) //różnica czasu w godzinach
        const minimumHoursForCancellation = 24
        const isFutureVisit = visitDateTime > currentDateTime //sprawdzamy, czy wizyta jest w przyszłości
        console.log("currentDateTime", currentDateTime)
        console.log("visitDateTime", visitDateTime)
        if (!isFutureVisit || timeDiffInHours < minimumHoursForCancellation) {
            return res.status(403).send({ message: "It's too late to cancel this visit" })
        }
        const deletedVisit = await Visit.findByIdAndDelete(visitId)
        if (!deletedVisit) {
            return res.status(404).send({ message: "Visit not found" })
        }
        await userVisitCanceled(req.currentUser.email, visitId)
        res.status(200).send({ data: deletedVisit, message: "Visit deleted successfully" })
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
            return res.status(404).send({ message: "Visit not found" })
        }
        const createdByUserId = visitToDelete.createdBy
        const user = await User.findById(createdByUserId)
        if (!user) {
            return res.status(404).send({ message: "User not found" })
        }
        const email = user.email
        const deletedVisit = await Visit.findByIdAndDelete(visitId)
        if (!deletedVisit) {
            return res.status(404).send({ message: "Visit not found" })
        }
        await visitCanceled(email, visitId)
        res.status(200).send({ data: deletedVisit, message: "Visit deleted successfully" })
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" })
        console.log(error)
    }
});

module.exports = router;