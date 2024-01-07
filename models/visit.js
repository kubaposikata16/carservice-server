const mongoose = require("mongoose");
const Joi = require("joi");

const serviceEnum = {
    "Badania techniczne": ["Badania techniczne"],
    "Diagnostyka": ["Diagnostyka komputerowa"],
    "Geometria i zbieżność": ["Geometria i zbieżność"],
    "Hamulce": ["Wymiana klocków hamulcowych", "Wymiana płynu hamulcowego", "Wymiana tarcz hamulcowych"],
    "Klimatyzacja": ["Diagnostyka niedziałającej klimatyzacji", "Wymiana filtra"],
    "Koła i opony": ["Wymiana kół", "Wymiana opon"],
    "Naprawy i usterki": ["Naprawy i usterki"],
    "Obsługa okresowa": ["Przegląd okresowy", "Przegląd przed zakupem", "Wymiana oleju"],
};

const carModelEnum = {
    "Audi": ["A1", "A3", "A4", "A5", "A6", "Q3", "Q5"],
    "BMW": ["M3", "M4", "M5", "Seria 1", "Seria 3", "Seria 5", "X1", "X3", "X5"],
    "Chevrolet": ["Camaro", "Corvette", "Cruze", "Malibu", "Spark", "Trax"],
    "Citroen": ["Berlingo", "C1", "C3", "C4", "C5", "Cactus"],
    "Fiat": ["500", "500L", "500X", "Panda", "Punto", "Tipo"],
    "Ford": ["EcoSport", "Fiesta", "Focus", "Kuga", "Mondeo", "Mustang"],
    "Honda": ["Accord", "Civic", "City", "CR-V", "HR-V", "Jazz"],
    "Hyundai": ["i20", "i30", "Kona", "Santa Fe", "Sonata", "Tucson"],
    "Mercedes-Benz": ["AMG GT", "GLC", "Klasa A", "Klasa C", "Klasa E", "Klasa G"],
    "Nissan": ["Juke", "Leaf", "Micra", "Navara", "Qashqai", "X-Trail"],
    "Opel": ["Astra", "Corsa", "Crossland", "Grandland", "Insignia", "Mokka"],
    "Renault": ["Captur", "Clio", "Duster", "Kadjar", "Megane", "Scenic", "Twingo"],
    "SEAT": ["Alhambra", "Arona", "Ateca", "Ibiza", "Leon", "Tarraco"],
    "Skoda": ["Fabia", "Karoq", "Kodiaq", "Octavia", "Scala", "Superb"],
    "Toyota": ["Auris", "Aygo", "Camry", "Corolla", "RAV4", "Yaris"],
    "Volkswagen": ["Arteon", "Golf", "Passat", "Polo", "T-Roc", "Tiguan"],
};

const visitSchema = new mongoose.Schema({
    serviceType: { type: String, enum: Object.keys(serviceEnum), required: true },
    service: { type: String, enum: [], required: function() { return this.serviceType !== null && this.serviceType !== undefined; } },
    carBrand: { type: String, enum: Object.keys(carModelEnum), required: true },
    carModel: { type: String, enum: [], required: function() { return this.carBrand !== null && this.carBrand !== undefined; } }, 
    date: { type: Date, required: true },
    time: { type: String, enum: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
        "11:00", "11:30", "12:00", "12:30", "13:00", 
        "13:30", "14:00", "14:30", "15:00"], required: true },
    moreInfo: { type: String, required: false },
    carProductionYear: { type: Number, required: true },
    engine: { type: Number, required: true },
    vin: { type: String, required: true },
    registrationNumber: { type: String, required: true},
    status: {
        type: String,
        enum: ['Oczekuje na potwierdzenie', 'Zaakceptowano', 'W trakcie realizacji', 'Zakończono'],
        default: 'Oczekuje na potwierdzenie'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { collection: "Visits" });

visitSchema.path("service").validate(function(value) { 
    return this.serviceType && serviceEnum[this.serviceType].includes(value)
}, "Invalid service for selected service type");

visitSchema.path("carModel").validate(function(value) { 
    return this.carBrand && carModelEnum[this.carBrand].includes(value)
}, "Invalid car model for selected car brand");

const VisitDB = mongoose.connection.useDb("CarService");
const Visit = VisitDB.model("Visit", visitSchema);

const validate = (data) => {
    const schema = Joi.object({
        serviceType: Joi.string().valid(...Object.keys(serviceEnum)).required().label("Service type"),
        service: Joi.string().when("serviceType", {
            is: Joi.exist(),
            then: Joi.valid(...[].concat(...Object.values(serviceEnum))),
            otherwise: Joi.forbidden()
        }).label("Service"),
        carBrand: Joi.string().valid(...Object.keys(carModelEnum)).required().label("Car brand"),
        carModel: Joi.string().when("carBrand", {
            is: Joi.exist(),
            then: Joi.valid(...[].concat(...Object.values(carModelEnum))),
            otherwise: Joi.forbidden()
        }).label("Car model"),
        date: Joi.date().required().iso().min("now").label("Date").custom((value, helpers) => { 
            const day = value.getDay() 
            if (day === 0 ) { 
                return helpers.message("Date must be a weekday (Monday-Saturday")
            }
            return value
        }),
        time: Joi.string().required().label("Time"),
        moreInfo: Joi.string().allow("").label("More info"),
        carProductionYear: Joi.number().required().min(1886).max(2023).label("Car production year"),
        engine: Joi.number().required().min(0.5).max(8.0).label("Engine"),
        vin: Joi.string().required().pattern(new RegExp('^[A-HJ-NPR-Z0-9]{17}$')).label("VIN"),
        registrationNumber: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,8}$')).label("Registration number")
    }).options({ abortEarly: false });
    return schema.validate(data)
}

module.exports = { Visit, validate };