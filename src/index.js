const express = require("express");
//const mqtt = require('mqtt');
const sql = require('mssql');
const morgan = require("morgan");
const cors = require("cors");
const colors = require("colors");
const bot = require("./routes/telegram.js")

//instances
const app = express();

//express config
app.use(morgan("tiny"));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);
app.use(cors());

//express routes 
app.use("/api/v1", require("./routes/setup.js"))


//listener
app.listen(3001, () => {
  console.log("API server listening on port 3001");
}); 

bot.sendBot("1228075428", "Hola desde Index")

function makeid(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@*?%&$#" 
  for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

module.exports = app;