var mongoose = require("mongoose")

var user = "test"
var password = "test"
var server = "cluster0.orqbr.mongodb.net"
var bddname = "quest"

var options = {
  connectTimeoutMS: 5000,
  useNewUrlParser: true,
  useUnifiedTopology: true,
}

mongoose.connect(
  "mongodb+srv://" +
    user +
    ":" +
    password +
    "@" +
    server +
    "/" +
    bddname +
    "?retryWrites=true&w=majority",
  options,
  function (error) {
    if (error == null) {
      console.log("Connexion rÃ©ussie")
    } else {
      console.log(error)
    }
  }
)
