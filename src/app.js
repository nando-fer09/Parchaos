const express = require("express");
const { engine } = require("express-handlebars");
const myconnection = require("express-myconnection");
const mysql = require("mysql");
const session = require("express-session");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const app = express();

//PORT
app.set("port", 4003);

dotenv.config({ path: "./env/.env" });

//RECURSOS EN CARPETA PUBLIC
app.use("/resources", express.static("public"));
app.use("/resources", express.static(__dirname + "/public"));


//SERVER
app.listen(app.get("port"), () => {
  console.log("Listening your port ", app.get("port"));
});

//MOTOR DE PLANTILLAS HBS
app.set("views", __dirname + "/views");
app.engine(
  ".hbs",
  engine({
    extname: ".hbs",
    defaultLayout: false,
    layoutsDir: "views/layauts/",
  })
);
app.set("view engine", "hbs");

//MOTOR DE PLANTILLAS EJS
app.set("view engine", "ejs");

//BCRYPTJS PASSWORD ENCRYPT
const bcryptjs = require("bcryptjs");
const connection = require("express-myconnection");

// //MIDDLEWARE (YA INCORPORADO EN EXPRESS DESPUES DE VERSION 4.16.0)
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//VARIABLES SESSION
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

//MODULE CONNECTION OF DATABASE
const connectionx = require("../database/db");

//RUTAS DE PLANTILLA
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/index", (req, res) => {
  res.render("index");
});

//REGISTRATION
app.post("/register", async (req, res) => {
  const names = req.body.names;
  const lastname = req.body.lastname;
  const email = req.body.email;
  const password = req.body.password;

  try {
    let passwordHaash = await bcryptjs.hash(password, 10);
    connectionx.query(
      "INSERT INTO user SET ?",
      {
        names: names,
        lastname: lastname,
        email: email,
        password: passwordHaash,
      },
      async (error, results) => {
        if (error) {
          console.log(error);
          res.status(500).send("SERVER ERROR");
        } else {
          res.render("register", {
            alert: true,
            alertTitle: "Registration",
            alertMessage: "Succesful Registration!",
            alertIcon: "succes",
            showConfirmButton: false,
            timer: 1500,
            ruta: "",
          });
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send("SERVER ERROR");
  }
});

// AUTENTICATION (LOGIN)
app.post("/auth", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let passwordHaash = await bcryptjs.hash(password, 10);
  if (email && password) {
    connectionx.query(
      "SELECT * FROM user WHERE email = ?",
      [email],
      async (error, results) => {
        if (
          results.length == 0 ||
          !(await bcryptjs.compare(password, results[0].password))
        ) {
          res.render("login", {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Usuario y/o contraseña incorrecto",
            alertIcon: "error",
            showConfirmButton: true,
            timer: false,
            ruta: "login",
          });
        } else {
          req.session.loggedin = true;  
          req.session.names = results[0].names;
          res.render("login", {
            alert: true,
            alertTitle: "Succesfull user",
            alertMessage: "Login correcto!!",
            alertIcon: "success",
            showConfirmButton: false,
            timer: 1500,
            ruta: '',
          });
        }
      })
  } else {
    res.render("login", {
        alert: true,
        alertTitle: "Error",
        alertMessage: "Por favor ingrese un usuario y/o contraseña!!",
        alertIcon: "warning",
        showConfirmButton: true,
        timer: false,
        ruta: 'login',
      });
  }
});

// AUTH PAGES AFTER LOGGED
app.get('/',(req, res)=>{
    if(req.session.loggedin){
        res.render('index',{
            login: true,
            name: req.session.names
        });
    }else{
        res.render('index',{
            login: false,
            name: 'Debe iniciar sesion'
        })
    }
})

//LOGOUT
app.get('/logout', (req, res) =>{
    req.session.destroy(()=>{
        res.redirect('/')
    })
})


//RUTA PARA FILTRAR LA TABLE
app.get('/filtrar', (req, res) => {
  const type = req.query.type;

  //CONSULTA SQL PARA FILTRAR POR TYPE
  const sql = `SELECT * FROM type WHERE type LIKE 'beber'`;

  //EJECUTAR LA CONSULTA
  connectionx.query(sql, (err, result) => {
    if(err) {
      console.error('Error al ejecutar la consulta: ', err);
      res.status(500).send('error del servidor');
      return;
    }

    console.log(result);

    //ENVIAR RESULTADOS COMO RESPUESTA EN FORMATO JSON
    res.json(result);
  });
});