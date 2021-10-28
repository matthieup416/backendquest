var mongoose = require("mongoose");

var express = require("express");
var router = express.Router();
var UserModel = require("../models/users");

router.post("/addquest", async function (req, res, next) {
  console.log(req.body);
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
  console.log(quest);

  //On créé le tableau de condition avant de lancer la requête car on souhaite le modifier dynamiquement pour les checkbox is_new, is_old et si on a une market_date
  var options = {
    "offers.city": quest.city,
    "offers.type": quest.type,
    "offers.price": {
      $gte: quest.min_price,
      $lte: quest.max_price,
    },
    "offers.nb_piece": {
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
  if (quest.is_new && quest.is_old) {
    options["$or"] = [{ "offers.is_new": true }, { "offers.is_old": true }];
  } else {
    options["offers.is_new"] = quest.is_new;
    options["offers.is_old"] = quest.is_old;
  }

  if (quest.market_date) {
    options["offers.market_date"] = "";
  }

  console.log(options);
  console.log("date", new Date());
  console.log("date", new Date("2021-10-17T07:55:06"));

  var listOffers = await UserModel.aggregate([
    {
      $project: {
        firstName: 1,
        offers: 1,
      },
    },
    { $unwind: { path: "$offers" } },
    {
      $match: options,
    },
  ]);

  res.json({ listOffers });
});

module.exports = router;
