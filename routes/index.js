var mongoose = require("mongoose")

var express = require("express")
var router = express.Router()
var UserModel = require("../models/users")

router.post("/addquest", async function (req, res, next) {
  console.log(req.body)
  var user = await UserModel.findOne({
    token: req.body.token,
  })

  user.quests.push(req.body.quest)

  var userSaved = await user.save()

  if (userSaved) {
    result = true
  } else {
    result = false
  }

  res.json({ result })
})

router.get("/display-offer", async function (req, res, next) {
  var token = req.query.token
  console.log(req.query.offerId)

  var user = await UserModel.findOne({
    "offers._id": req.query.offerId,
  }).select("offers")

  console.log(user.offers)
  let finalOffer = user.offers.filter((e) => e._id !== req.query.offerId)
  console.log(finalOffer)
  // var offersObject = user.offers

  //  let array = Object(offersObject)

  res.json({ user })
})

module.exports = router
