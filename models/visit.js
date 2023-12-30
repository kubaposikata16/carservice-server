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
    service: { type: String, enum: [], required: function() { return this.serviceType !== null && this.serviceType !== undefined; } }, //pole serviceType musi coś zawierać
    carBrand: { type: String, enum: Object.keys(carModelEnum), required: true },
    carModel: { type: String, enum: [], required: function() { return this.carBrand !== null && this.carBrand !== undefined; } }, //pole carBrand musi coś zawierać
    date: { type: Date, required: true },
    time: { type: String, enum: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
        "11:00", "11:30", "12:00", "12:30", "13:00", 
        "13:30", "14:00", "14:30", "15:00"], required: true },
    /*time: {timeOptions: [{hour:"8:00", isValid: true}, {hour:"8:30", isValid: true}, {hour:"9:00", isValid: true}, {hour:"9:30", isValid: true},
    {hour:"10:00", isValid: true}, {hour:"10:30", isValid: true}, {hour:"11:00", isValid: true}, {hour:"11:30", isValid: true}, 
    {hour:"12:00", isValid: true}, {hour:"12:30", isValid: true}, {hour:"13:00", isValid: true}, {hour:"13:30", isValid: true}, 
    {hour:"14:00", isValid: true}, {hour:"14:30", isValid: true}, {hour:"15:00", isValid: true}], required: true },*/
    moreInfo: { type: String, required: false },
    carProductionYear: { type: Number, required: true },
    engine: { type: Number, required: true },
    vin: { type: String, required: true },
    registrationNumber: { type: String, required: true},
    status: {
        type: String,
        enum: ['Oczekuje na potwierdzenie', 'Zaakceptowano', 'W trakcie realizacji', 'Zakończono', 'Odwołano'],
        default: 'Oczekuje na potwierdzenie' //domyślna rola dla nowych użytkowników
    },
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
        /*time: Joi.object({
            timeOptions: Joi.array().items(
              Joi.object({
                hour: Joi.string().required(),
                isValid: Joi.boolean().required()
              })).required(),
              required: Joi.boolean().valid(true).required()
            }).required().label("Time"),*/
        moreInfo: Joi.string().allow("").label("More info"),
        carProductionYear: Joi.number().required().min(1886).max(2023).label("Car production year"),
        engine: Joi.number().required().min(0.5).max(8.0).label("Engine"),
        vin: Joi.string().required().pattern(new RegExp('^[A-HJ-NPR-Z0-9]{17}$')).label("VIN"),
        registrationNumber: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,8}$')).label("Registration number")
    }).options({ abortEarly: false }); //zwrócenie wszystkich błędów, a nie tylko pierwszego napotkanego
    
    return schema.validate(data);
}
module.exports = { Visit, validate };