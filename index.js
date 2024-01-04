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
app.post("/users"); //rejestracja
app.get("/users/forEmployee", tokenVerification, checkUserRole(['employee'])); //wyświetlanie użytkowników(klientów i pracowników) w systemie
app.get("/users/forAdmin", tokenVerification, checkUserRole(['admin'])); //wyświetlanie użytkowników(wszystkich) w systemie

app.post("/login"); //logowanie

app.get("/user", tokenVerification, currentUser); //wyświetlanie danych zalogowanego użytkownika
app.get("/user/:userID", tokenVerification, checkUserRole(['employee', 'admin'])); //wyświetlanie danych dowolnego użytkownika
app.put("/user", tokenVerification, currentUser); //edycja danych zalogowanego użytkownika
app.put("/user/:userId", tokenVerification, checkUserRole(['admin'])); //edycja danych dowolnego użytkownika w systemie
app.put("/user/role/:userId", tokenVerification, currentUser, checkUserRole(['admin'])); //zmienianie roli dowolnego użytkownika w systemie
app.delete("/user", tokenVerification, currentUser); //usuwanie konta zalogowanego użytkownika
app.delete("/user/:userId", tokenVerification, checkUserRole(['admin'])); //usuwanie konta dowolnego użytkownika w systemie
app.post("/user/reset-password"); //podanie emaila i wsyłanie maila z linkiem do resetu hasła
app.put("/user/reset-password/:token"); //edycja hasła poprzez link z maila

app.post("/forms", tokenVerification, currentUser); //dodawanie nowej wizyty przez zalogowanego użytkownika
app.get("/forms", tokenVerification, checkUserRole(['employee', 'admin'])); //wyświetlanie wszystkich wizyt
app.get("/forms/userVisits/:visitId", tokenVerification, checkUserRole(['employee', 'admin'])); //wyświetlanie wizyt danego użytkownika
app.get("available-hours/:date", tokenVerification); //wyświetlanie dostępnych godzin

app.get("/form", tokenVerification, currentUser); //wyświetlanie wizyt zalogowanego użytkownika
app.put("/form/status/:visitId", tokenVerification, currentUser, checkUserRole(['employee', 'admin'])); //zmiana statusu wizyty
app.delete("/form/:visitId", tokenVerification, currentUser, currentVisit); //anulowanie wizyty zalogowanego użytkownika
app.delete("/form/forEmployeeOrAdmin/:visitId", tokenVerification, checkUserRole(['employee', 'admin'])); //anulowanie wizyty dowolnego użytkownika w systemie

//dodanie routera dla każdej ścieżki
app.use("/users", usersRoutes);
app.use("/user", userRoutes);
app.use("/login", loginRoutes);
app.use("/forms", formsRoutes);
app.use("/form", formRoutes);

connection(); //połączenie z db

app.listen(port, () => console.log(`Nasłuchiwanie na porcie ${port}`));