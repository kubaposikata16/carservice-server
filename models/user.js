const mongoose = require("mongoose"); //import biblioteki Mongoose, która jest wspraciem dla MongoDB umożliwiającym ławe korzystanie z MongoDB w środowisku Node.js
const Joi = require("joi"); //import biblioteki Joi, która jest używana do walidacji danych w Node.js
const passwordComplexity = require("joi-password-complexity"); //rozszerzenie dla Joi umożliwiające definiowanie złożoności hasła i walidowanie haseł zgodnie z określonymi kryteriami
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
}, { collection: "UserAccounts" });

userSchema.methods.generateAuthToken = function () { //generowanie tokenu JWT na podstawie id użytkownika
    const token = jwt.sign({ _id: this._id }, process.env.JWTPRIVATEKEY, {
        expiresIn: "7d", //klucz prywatny, ważny 7 dni
    })
    return token
};

const CarServiceDB = mongoose.connection.useDb('CarService'); // Użycie konkretnej bazy danych
const User = CarServiceDB.model("User", userSchema); //tworzenie modelu 'User' na podstawie schematu 'userSchema'

const validate = (data) => {
    const schema = Joi.object({
        firstName: Joi.string().required().label("First Name"),
        lastName: Joi.string().required().label("Last Name"),
        email: Joi.string().email().required().label("Email"),
        password: passwordComplexity().required().label("Password"),
    });
    return schema.validate(data);
}

const validateLogin = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required().label("Email"),
        password: Joi.string().required().label("Password"),
    })
    return schema.validate(data)
};

module.exports = { User, validate, validateLogin }; //export by móc importować model i funkcje w innych częściach aplikacji