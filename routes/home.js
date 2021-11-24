var express = require("express")
var router = express.Router()

var UserModel = require("../models/users")

// Récupération des données de l'utilisateur via son token.

router.get("/userDetail", async (req, res) => {
  var result = false
  var user = await UserModel.findOne({
    token: req.query.token,
  })
  if (user != null) {
    result = true
  }
  res.json({ result, user })
})

// Modifications profil

router.put("/updateUser", async (req, res) => {
  UserModel.updateOne(
    { token: req.body.token },
    { job: req.body.job, description: req.body.description },
    (err, docs) => {
      if (!err) {
        console.log(docs)
        res.json({ success: true })
      } else {
        console.log(err)
        res.status(402).json({ success: false })
      }
    }
  )
})

module.exports = router
