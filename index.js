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
connection();
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
app.get("/users/forEmployee", tokenVerification, checkUserRole(['employee, admin']));
app.get("/users/forAdmin", tokenVerification, checkUserRole(['admin']));

app.post("/login"); //logowanie

app.get("/user", tokenVerification, currentUser);
app.get("/user/:userID", tokenVerification, checkUserRole(['employee', 'admin']));
app.put("/user", tokenVerification, currentUser);
app.put("/user/:userId", tokenVerification, checkUserRole(['admin']));
app.put("/user/role/:userId", tokenVerification, currentUser, checkUserRole(['admin']));
app.delete("/user", tokenVerification, currentUser);
app.delete("/user/:userId", tokenVerification, checkUserRole(['admin']));
app.post("/user/reset-password");
app.put("/user/reset-password/:token");

app.post("/forms", tokenVerification, currentUser);
app.get("/forms", tokenVerification, checkUserRole(['employee', 'admin']));
app.get("/forms/userVisits/:visitId", tokenVerification, checkUserRole(['employee', 'admin']));
app.get("available-hours/:date", tokenVerification);

app.get("/form", tokenVerification, currentUser);
app.put("/form/status/:visitId", tokenVerification, currentUser, checkUserRole(['employee', 'admin']));
app.delete("/form/:visitId", tokenVerification, currentUser, currentVisit);
app.delete("/form/forEmployeeOrAdmin/:visitId", tokenVerification, checkUserRole(['employee', 'admin']));

//dodanie routera dla każdej ścieżki
app.use("/users", usersRoutes);
app.use("/user", userRoutes);
app.use("/login", loginRoutes);
app.use("/forms", formsRoutes);
app.use("/form", formRoutes);

connection(); //połączenie z db

app.listen(port, () => console.log(`Nasłuchiwanie na porcie ${port}`));