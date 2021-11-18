var express = require("express")
var router = express.Router()

var uid2 = require("uid2")
var bcrypt = require("bcrypt")

var UserModel = require("../models/users")

// Inscription

router.post("/sign-up", async function (req, res, next) {
  var error = []
  var result = false
  var saveUser = null
  var token = null

  const data = await UserModel.findOne({
    email: req.body.emailFromFront,
  })

  if (data != null) {
    error.push("utilisateur déjà présent")
  }

  if (
    req.body.usernameFromFront == "" ||
    req.body.firstNameFromFront == "" ||
    req.body.lastNameFromFront == "" ||
    req.body.emailFromFront == "" ||
    req.body.phoneFromFront == ""
  ) {
    error.push("champs vides")
  }

  if (error.length == 0) {
    var hash = bcrypt.hashSync(req.body.passwordFromFront, 10)
    var newUser = new UserModel({
      firstName: req.body.firstNameFromFront,
      lastName: req.body.lastNameFromFront,
      email: req.body.emailFromFront,
      phone: req.body.phoneFromFront,
      password: hash,
      token: uid2(32),
    })

    saveUser = await newUser.save()

    if (saveUser) {
      result = true
      token = saveUser.token
    }
  }

  res.json({ result, dataUser: saveUser, error, token })
})

// Connexion

router.post("/sign-in", async function (req, res, next) {
  var result = false
  var error = []
  console.log(req.body)
  var dataUser = {
    token: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  }

  if (req.body.emailFromFront == "" || req.body.passwordFromFront == "") {
    error.push("champs vides")
  }

  if (error.length == 0) {
    const user = await UserModel.findOne({
      email: req.body.emailFromFront,
    })

    if (user) {
      if (bcrypt.compareSync(req.body.passwordFromFront, user.password)) {
        result = true
        dataUser = {
          token: user.token,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        }
      } else {
        result = false
        error.push("mot de passe incorrect")
      }
    } else {
      error.push("email incorrect")
    }
  }

  res.json({ result, error, dataUser })
})

module.exports = router
