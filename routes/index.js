var mongoose = require("mongoose")

var express = require("express")
var router = express.Router()
var UserModel = require("../models/users")
const { ObjectId } = require("mongodb")

router.post("/addquest", async function (req, res, next) {
  console.log(req.body.quest)
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
  var id = req.query.offerId

  var offer = await UserModel.findOne(
    { "offers._id": id },
    { offers: { $elemMatch: { _id: ObjectId(id) } } }
  )
  // on sélectionne uniquement les données de l'annonce
  let offerData = offer.offers[0]

  // je vais récupérer le firstname, le is_pro et l'avatar du user qui a publié l'offre
  var sellerId = offer._id
  var seller = await UserModel.findOne({ _id: sellerId })
  console.log(seller.is_pro)
  let sellerData = {
    sellerToken: seller.token,
    sellerId: seller._id,
    firstName: seller.firstName,
    avatar: seller.avatar,
    is_pro: seller.is_pro,
  }

  // on renvoie au front les infos de l'annonce, et les infos du vendeur
  res.json({ offerData, sellerData })
})

module.exports = router
