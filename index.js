require('dotenv').config(); //wczytanie zmienncyh środowiskowych z pliku .env

//ścieżki
const usersRoutes = require("./routes/users");
const userRoutes = require("./routes/user");
const loginRoutes = require("./routes/login");
const formsRoutes = require("./routes/forms");
const formRoutes = require("./routes/form");

//importy modułów
const express = require('express');
const connection = require('./db');
const cors = require('cors');
const tokenVerification = require('./middleware/tokenVerification');
const currentUser = require('./middleware/currentUser');
const currentVisit = require('./middleware/currentVisit');
const checkUserRole = require('./middleware/checkUserRole');
const app = express();

//middleware
app.use(express.json())
app.use(cors())
const port = process.env.PORT || 8080

//definicja endpointów
app.post("/users");
app.get("/users", tokenVerification, checkUserRole(['employee', 'admin']));

app.post("/login");

app.get("/user", tokenVerification, currentUser);
app.put("/user", tokenVerification, currentUser);
app.put("/role/:userId", tokenVerification, checkUserRole('admin'));
app.delete("/user", tokenVerification, currentUser);

app.post("/forms", tokenVerification, currentUser); //checkUserRole('client') chyba że pracownik też będzie mógł dodać wizyty np jeśli coś mu wypadnie i zadzwoni do klienta i umówi się na nową datę i starą wizytę anuluje i utworzy nową
app.get("/forms", tokenVerification, checkUserRole(['employee', 'admin']));

app.get("/form", tokenVerification, currentUser);
//app.put("/form", tokenVerification, currentUser); //raczej bez tego bo lepiej żeby w razie zmiany czegoś w wizycie anulować ją i zrobić nową
app.delete("/form/:visitId", tokenVerification, currentUser, currentVisit);

//dodanie routera dla każdej ścieżki
app.use("/users", usersRoutes);
app.use("/user", userRoutes);
app.use("/login", loginRoutes);
app.use("/forms", formsRoutes);
app.use("/form", formRoutes);

connection(); //połączenie z db

app.listen(port, () => console.log(`Nasłuchiwanie na porcie ${port}`));