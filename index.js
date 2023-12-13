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
const app = express();

//middleware
app.use(express.json())
app.use(cors())
const port = process.env.PORT || 8080

//definicja endpointów
//app.post("/users");                                   //nie wiem czy to ma być????
app.get("/users");                                      //tu może dodać tokenVerification????
app.get("/user", tokenVerification, currentUser);
app.put("/user", tokenVerification, currentUser);   //tu sie dlugo laduje
app.delete("/user", tokenVerification, currentUser);//tu sie dlugo laduje
app.post("/forms", tokenVerification, currentUser);
app.get("/forms");                                      //tu może dodać tokenVerification????
app.get("/form", tokenVerification, currentUser);       //currentvisist
app.put("/form", tokenVerification, currentUser);       //currentvisit, currenuser??
app.delete("/form", tokenVerification);    //currentvisit, currentuser

//dodanie routera dla każdej ścieżki
app.use("/users", usersRoutes);
app.use("/user", userRoutes);
app.use("/login", loginRoutes);
app.use("/forms", formsRoutes);
app.use("/form", formRoutes);

connection(); //połączenie z db

app.listen(port, () => console.log(`Nasłuchiwanie na porcie ${port}`));