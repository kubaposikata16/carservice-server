require('dotenv').config(); //wczytanie zmienncyh środowiskowych z pliku .env

//ścieżki
const usersRoutes = require("./routes/users");
const userRoutes = require("./routes/user");
const loginRoutes = require("./routes/login");
const formRoutes = require("./routes/form");

//importy modułów
const express = require('express');
const connection = require('./db');
const tokenVerification = require('./middleware/tokenVerification')
const currentUser = require('./middleware/currentUser')
const app = express();

//middleware
app.use(express.json())

//definicja endpointów
app.get("/", (req,res) => {
    console.log(req)
    return res.status(234).send("Hello!")
});
app.get("/user/", tokenVerification, currentUser);

//dodanie routera dla każdej ścieżki
app.use("/users", usersRoutes);
app.use("/user", userRoutes);
app.use("/login", loginRoutes);
app.use("/form", formRoutes);

connection(); //połączenie z db

app.listen(3000, () => console.log(`Nasłuchiwanie na porcie 3000`));