var mongoose = require("mongoose");

var express = require("express");
var router = express.Router();
var UserModel = require("../models/users");
const { ObjectId } = require("mongodb");

router.post("/addquest", async function (req, res, next) {
  console.log(req.body.quest);
  var user = await UserModel.findOne({
    token: req.body.token,
  });

  user.quests.push(req.body.quest);

  var userSaved = await user.save();

  if (userSaved) {
    result = true;
  } else {
    result = false;
  }

  res.json({ result });
});

router.get("/results", async function (req, res, next) {
  var token = req.query.token;
  var quest_id = req.query.quest_id;

  var quest = await UserModel.findOne({ token: token }, { quests: { $elemMatch: { _id: quest_id } } });
  quest = quest.quests[0];
  console.log("quest", quest);

  //On créé le tableau de condition avant de lancer la requête car on souhaite le modifier dynamiquement pour les checkbox is_new, is_old et si on a une market_date
  var options = {
    "offers.city": quest.city,
    "offers.type": quest.type,
    "offers.price": {
      $gte: quest.min_price,
      $lte: quest.max_price,
    },
    "offers.nb_pieces": {
      $gte: quest.pieces_min,
      $lte: quest.pieces_max,
    },
    "offers.surface": {
      $gte: quest.min_surface,
      $lte: quest.max_surface,
    },
    "offers.elevator": quest.elevator,
    "offers.parking": quest.parking,
    "offers.fiber_optics": quest.fiber_optics,
    "offers.pool": quest.pool,
    "offers.balcony": quest.balcony,
    "offers.terrace": quest.terrace,
    "offers.is_online": true,
    "offers.is_sold": false,
  };

  //Si on cherche du neuf et du vieux on ajoute une condition "or"
  if ((quest.is_new && quest.is_old) || (!quest.is_new && !quest.is_old)) {
    options["$or"] = [{ "offers.is_new": true }, { "offers.is_old": true }];
  } else {
    options["offers.is_new"] = quest.is_new;
    options["offers.is_old"] = quest.is_old;
  }
  //Si on a une date market_date, on souhaite seulement les offres plus récente ou = à cette date
  if (quest.market_date) {
    options["offers.created"] = { $gte: new Date(quest.market_date) };
  }

  console.log(options);

  var listOffers = await UserModel.aggregate([
    {
      $project: {
        firstName: 1,
        is_pro: 1,
        verified: 1,
        offers: 1,
      },
    },
    { $unwind: { path: "$offers" } },
    {
      $match: options,
    },
    { $sort: { "offers.created": -1 } },
    {
      $project: {
        firstName: 1,
        is_pro: 1,
        verified: 1,
        "offers.city": 1,
        "offers.type": 1,
        "offers.nb_pieces": 1,
        "offers.price": 1,
        "offers.surface": 1,
        "offers.created": 1,
        "offers.pictures": 1,
        "offers._id": 1,
      },
    },
  ]);

  res.json({ listOffers, quest });
});

router.get("/display-offer", async function (req, res, next) {
  var id = req.query.offerId;
  console.log("offerId", id);

  var offer = await UserModel.findOne({ "offers._id": id }, { offers: { $elemMatch: { _id: ObjectId(id) } } });
  console.log(offer);
  // on sélectionne uniquement les données de l'annonce
  let offerData = offer.offers[0];

  // je vais récupérer le firstname, le is_pro et l'avatar du user qui a publié l'offre
  var sellerId = offer._id;
  var seller = await UserModel.findOne({ _id: sellerId });
  console.log(seller.is_pro);
  let sellerData = {
    sellerToken: seller.token,
    sellerId: seller._id,
    firstName: seller.firstName,
    avatar: seller.avatar,
    is_pro: seller.is_pro,
  };

  // on renvoie au front les infos de l'annonce, et les infos du vendeur
  res.json({ offerData, sellerData });
});

router.post("/addoffer", async function (req, res, next) {
  console.log(req.body.offer);
  var user = await UserModel.findOne({
    token: req.body.token,
  });

  user.offers.push(req.body.offer);

  var userSaved = await user.save();

  if (userSaved) {
    result = true;
  } else {
    result = false;
  }

  res.json({ result });
});

module.exports = router;
