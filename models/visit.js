const mongoose = require("mongoose");
const Joi = require("joi");

const serviceEnum = {
    "Naprawy i usterki": ["Naprawy i usterki"],
    "Koła i opony": ["Wymiana opon", "wymiana kół"],
    "Obsługa okresowa": ["Wymiana oleju", "Przegląd okresowy", "Przegląd przed zakupem"],
    "Hamulce": ["Wymiana klocków hamulcowych", "Wymiana tarcz hamulcowych", "Wymiana płynu hamulcowego"],
    "Diagnostyka": ["Diagnostyka komputerowa"],
    "Geometria i zbieżność": ["Geometria i zbieżność"],
    "Klimatyzacja": ["Diagnostyka niedziałającej klimatyzacji","Wymiana filtra"],
    "Badania techniczne": ["Badania techniczne"]
};

const carModelEnum = {
    Volkswagen: ["Amarok", "Passat"],
    Opel: ["GT", "Insignia"],
    Ford: ["Mondeo", "Focus"],
    BMW: ["M3", "M4", "M5"],
    Audi: ["A3","A4"],
    "Mercedes-Benz": ["AMG GT","Klasa G"],
    Toyota: ["Auris","Supra"],
    Renault: ["Clio","Twingo"],
    Skoda: ["Octavia","Fabia"]
};

const visitSchema = new mongoose.Schema({
    serviceType: { type: String, enum: Object.keys(serviceEnum), required: true },
    service: { type: String, enum: [], required: function() { return this.serviceType !== null && this.serviceType !== undefined; } }, //pole serviceType musi coś zawierać
    carBrand: { type: String, enum: Object.keys(carModelEnum), required: true },
    carModel: { type: String, enum: [], required: function() { return this.carBrand !== null && this.carBrand !== undefined; } }, //pole carBrand musi coś zawierać
    date: { type: Date, required: true },
    time: { type: String, enum: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
        "11:00", "11:30", "12:00", "12:30", "13:00", 
        "13:30", "14:00", "14:30", "15:00"], required: true },
    moreInfo: { type: String, required: false },
    carProductionYear: { type: Number, required: true },
    engine: { type: Number, required: true },
    vin: { type: String, required: true },
    registrationNumber: { type: String, required: true},
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } //pole określające autora wizyty
}, { collection: "Visits" });

visitSchema.path("service").validate(function(value) { //udostępnienie wartości dla konkretnego serviceType
    return this.serviceType && serviceEnum[this.serviceType].includes(value);
}, "Invalid service for selected service type");

visitSchema.path("carModel").validate(function(value) { //udostępnienie wartości dla konkretnego carBrand
    return this.carBrand && carModelEnum[this.carBrand].includes(value);
}, "Invalid car model for selected car brand");

const VisitDB = mongoose.connection.useDb("CarService"); // Użycie konkretnej bazy danych
const Visit = VisitDB.model("Visit", visitSchema);

const validate = (data) => {
    const schema = Joi.object({
        serviceType: Joi.string().valid(...Object.keys(serviceEnum)).required().label("Service type"),
        service: Joi.string().when("serviceType", {
            is: Joi.exist(), //jeśli pole serviceType istnieje
            then: Joi.valid(...[].concat(...Object.values(serviceEnum))), //service zgodny z wartościami w serviceType
            otherwise: Joi.forbidden() //inaczej zabronione, czyli nie można użyć
        }).label("Service"),
        carBrand: Joi.string().valid(...Object.keys(carModelEnum)).required().label("Car brand"),
        carModel: Joi.string().when("carBrand", {
            is: Joi.exist(), //jeśli pole carBran istnieje
            then: Joi.valid(...[].concat(...Object.values(carModelEnum))), //carModel zgodny z wartościami w carBrand
            otherwise: Joi.forbidden() //inaczej zabronione, czyli nie można użyć
        }).label("Car model"),
        date: Joi.date().required().iso().min("now").label("Date").custom((value, helpers) => { //iso - format ISO (YYYY-MM-DD); min(now) - data conajmniej bieżąca(dzisiaj)
            const day = value.getDay(); //pobranie numeru dnia w tygodniu (0 - niedziela, 1 - poniedziałek, ...)
            if (day === 0 ) { //sprawdzenie niedziela (0)
                return helpers.message("Date must be a weekday (Monday-Saturday");
            }
            return value;
        }),
        time: Joi.string().required().label("Time"),
        moreInfo: Joi.string().allow("").label("More info"),
        carProductionYear: Joi.number().required().min(1886).max(2023).label("Car production year"),
        engine: Joi.number().required().min(0.5).max(8.0).label("Engine"),
        vin: Joi.string().required().pattern(new RegExp('^[A-HJ-NPR-Z0-9]{17}$')).label("VIN"),
        registrationNumber: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,8}$')).label("Registration number")
    }).options({ abortEarly: false }); //zwrócenie wszystkich błędów, a nie tylko pierwszego napotkanego
    
    return schema.validate(data);
}
module.exports = { Visit, validate };