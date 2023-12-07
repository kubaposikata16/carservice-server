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
    service: { type: String, enum: [], required: function() { return this.serviceType !== null && this.serviceType !== undefined; } },
    carBrand: { type: String, enum: Object.keys(carModelEnum), required: true },
    carModel: { type: String, enum: [], required: function() { return this.carBrand !== null && this.carBrand !== undefined; } },
    date: { type: Date, required: true },
    time: { type: String, enum: ["8:00", "8:30", "9:00", "9:30", "10:00", "10:30", 
        "11:00", "11:30", "12:00", "12:30", "13:00", 
        "13:30", "14:00", "14:30", "15:00"], required: true },
    moreInfo: { type: String },
    carProductionYear: { type: Number, min: 1950, max: 2023, required: true },
    engine: { type: String, required: true},
    vin: { type: String, required: true},
    registrationNumber: { type: String, required: true}
}, { collection: "Visits" });

visitSchema.path('service').validate(function(value) {
    return this.serviceType && serviceEnum[this.serviceType].includes(value);
}, 'Invalid service for selected service type');

visitSchema.path('carModel').validate(function(value) {
    return this.carBrand && carModelEnum[this.carBrand].includes(value);
}, 'Invalid car model for selected car brand');

const VisitDB = mongoose.connection.useDb('CarService'); // Użycie konkretnej bazy danych
const Visit = VisitDB.model("Visit", visitSchema);

const validate = (data) => {
    const schema = Joi.object({
        serviceType: Joi.string().valid(...Object.keys(serviceEnum)).required().label("Service type"),
        service: Joi.string().when('serviceType', {
            is: Joi.exist(),
            then: Joi.valid(...[].concat(...Object.values(serviceEnum))),
            otherwise: Joi.forbidden()
        }).label("Service"),
        carBrand: Joi.string().valid(...Object.keys(carModelEnum)).required().label("Car brand"),
        carModel: Joi.string().when('carBrand', {
            is: Joi.exist(),
            then: Joi.valid(...[].concat(...Object.values(carModelEnum))),
            otherwise: Joi.forbidden()
        }).label("Car model"),
        date: Joi.date().required().iso().min('now').label("Date").custom((value, helpers) => {
            const day = value.getDay(); //pobranie numeru dnia w tygodniu (0 - niedziela, 1 - poniedziałek, ...)
            if (day === 0 || day === 6) { //sprawdzenie czy to sobota (6) lub niedziela (0)
                return helpers.message('Date must be a weekday');
            }
            return value;
        }),
        time: Joi.string().required().label("Time"),
        moreInfo: Joi.string().label("More info"),
        carProductionYear: Joi.number().required().label("Car production year"),
        engine: Joi.string().required().label("Engine"),
        vin: Joi.string().required().label("VIN"),
        registrationNumber: Joi.string().required().label("Registration number")
    }).options({ abortEarly: false }); //zwrócenie wszystkich błędów, a nie tylko pierwszego napotkanego
    
    return schema.validate(data);
}
module.exports = { Visit, validate };