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
app.post("/users"); //rejestracja - każdy
app.get("/users/forEmployee", tokenVerification, checkUserRole(['employee'])); //wyświetlanie użytkowników(klientów i pracowników) w systemie - pracownik
app.get("/users/forAdmin", tokenVerification, checkUserRole(['admin'])); //wyświetlanie użytkowników(wszystkich) w systemie - admin

app.post("/login"); //logowanie - każdy

app.get("/user", tokenVerification, currentUser); //wyświetlanie danych zalogowanego użytkownika - każdy
app.put("/user", tokenVerification, currentUser); //edycja danych zalogowanego użytkownika - każdy
app.put("/user/:userId", tokenVerification, checkUserRole(['admin'])); //edycja danych dowolnego użytkownika w systemie - admin
app.put("/user/role/:userId", tokenVerification, currentUser, checkUserRole(['admin'])); //zmienianie roli dowolnego użytkownika w systemie - admin
app.delete("/user", tokenVerification, currentUser); //usuwanie konta zalogowanego użytkownika - każdy
app.delete("/user/:userId", tokenVerification, checkUserRole(['admin'])); //usuwanie konta dowolnego użytkownika w systemie - admin

app.post("/forms", tokenVerification, currentUser); //dodawanie nowej wizyty przez zalogowanego użytkownika - klient
//post dla forms (admin i pracownik mogą dodać wizytę ale z id klienta)
app.get("/forms", tokenVerification, checkUserRole(['employee', 'admin'])); //wyświetlanie wszystkich wizyt - admin, pracownik

app.get("/form", tokenVerification, currentUser); //wyświetlanie wizyt zalogowanego użytkownika - każdy ALBO tylko klient bo wsm tylko on umawia
// put dla form visitId ale tylko z data i godzina (pracownik i klient)
app.put("/form/status/:visitId", tokenVerification, currentUser, checkUserRole(['employee', 'admin'])); //zmiana statusu wizyty - klient i pracownik
app.delete("/form/:visitId", tokenVerification, currentUser, currentVisit); //anulowanie wizyty zalogowanego użytkownika
app.delete("/form/forEmployeeOrAdmin/:visitId", tokenVerification, checkUserRole(['employee', 'admin'])); //anulowanie wizyty dowolnego użytkownika - pracownik i admin

//dodanie routera dla każdej ścieżki
app.use("/users", usersRoutes);
app.use("/user", userRoutes);
app.use("/login", loginRoutes);
app.use("/forms", formsRoutes);
app.use("/form", formRoutes);

connection(); //połączenie z db

app.listen(port, () => console.log(`Nasłuchiwanie na porcie ${port}`));