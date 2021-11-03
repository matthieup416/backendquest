var mongoose = require("mongoose");
var express = require("express");
const axios = require("axios");

var uniqid = require("uniqid");
var fs = require("fs");

var router = express.Router();
var UserModel = require("../models/users");
const { ObjectId } = require("mongodb");
const { response } = require("express");

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

  const apiURL = `http://api.positionstack.com/v1/forward?access_key=2373330d53389309f778b537f08b4603&query=${quest.city}`;
  const apiResponse = await axios.get(apiURL);
  console.log("apiResponse", apiResponse.data.data);
  const cityCoord = apiResponse.data.data[0];
  var latitudeMin = cityCoord.latitude - (quest.rayon * 0.01) / 1.11;
  var latitudeMax = cityCoord.latitude + (quest.rayon * 0.01) / 1.11;
  var longitudeMin = cityCoord.longitude - (quest.rayon * 0.01) / 1.11;
  var longitudeMax = cityCoord.longitude + (quest.rayon * 0.01) / 1.11;

  //On créé le tableau de condition avant de lancer la requête car on souhaite le modifier dynamiquement pour les checkbox is_new, is_old et si on a une market_date
  var options = {
    "offers.latitude": {
      $gte: latitudeMin,
      $lte: latitudeMax,
    },
    "offers.longitude": {
      $gte: longitudeMin,
      $lte: longitudeMax,
    },
    "offers.type": quest.type,
    "offers.price": {
      $gte: quest.min_price,
      $lte: quest.max_price,
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

  if (quest.pieces_max === 6) {
    options["offers.nb_pieces"] = { $gte: quest.pieces_min };
  } else {
    options["offers.nb_pieces"] = {
      $gte: quest.pieces_min,
      $lte: quest.pieces_max,
    };
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
  var user = await UserModel.findOne({
    token: req.body.token,
  });

  /// On envoie le nom de la ville à l'API PositionStack pour récupérer les coordonnées GPS de la ville
  // On utilise la librairie AXIOS pour faire des calls API depuis notre backend
  const apiURL = `http://api.positionstack.com/v1/forward?access_key=2373330d53389309f778b537f08b4603&query=${req.body.offer.city}`;
  const apiResponse = await axios.get(apiURL);
  var newOffer = req.body.offer;
  // Une fois les coordonnées de la ville récupérées, on va modifier de facon aléatoire ces coordonnées afin d'obtenir des points légèrement différents sur la carte
  // création d'un entier aléatoire entre -15 et 15 qu'on utilisera ensuite pour ajouter ou retirer 1.5km à la latitude et à la longitude pour que les offres sur une même ville soient légérement distants sur une carte
  function entierAleatoire(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  var entier = entierAleatoire(-15, 15);
  console.log(entier);
  /// on sait que 0.001° = 111 m
  var hundredMetersMultiplier = 0.001;
  var finalLatitude = apiResponse.data.data[0].latitude + hundredMetersMultiplier * entier;
  var finalLongitude = apiResponse.data.data[0].longitude + hundredMetersMultiplier * entier;
  console.log(finalLatitude);
  console.log(finalLongitude);

  newOffer.latitude = finalLatitude;
  newOffer.longitude = finalLongitude;
  /// Une fois toutes les infos rassemblées on push l'offre
  user.offers.push(newOffer);

  var userSaved = await user.save();

  if (userSaved) {
    result = true;
  } else {
    result = false;
  }

  res.json({ result });
});

router.get("/resultsmap", async function (req, res, next) {
  var token = req.query.token;
  var quest_id = req.query.quest_id;

  var quest = await UserModel.findOne({ token: token }, { quests: { $elemMatch: { _id: quest_id } } });
  quest = quest.quests[0];
  console.log("quest", quest);

  /// On envoie le nom de la ville à l'API PositionStack pour récupérer les coordonnées GPS de la ville
  // On utilise la librairie AXIOS pour faire des calls API depuis notre backend
  const apiURL = `http://api.positionstack.com/v1/forward?access_key=2373330d53389309f778b537f08b4603&query=${quest.city}`;
  const apiResponse = await axios.get(apiURL);
  console.log("apiResponse", apiResponse.data.data);
  const cityCoord = apiResponse.data.data[0];
  var latitudeMin = cityCoord.latitude - (quest.rayon * 0.01) / 1.11;
  var latitudeMax = cityCoord.latitude + (quest.rayon * 0.01) / 1.11;
  var longitudeMin = cityCoord.longitude - (quest.rayon * 0.01) / 1.11;
  var longitudeMax = cityCoord.longitude + (quest.rayon * 0.01) / 1.11;
  //On créé le tableau de condition avant de lancer la requête car on souhaite le modifier dynamiquement pour les checkbox is_new, is_old et si on a une market_date
  var options = {
    "offers.latitude": {
      $gte: latitudeMin,
      $lte: latitudeMax,
    },
    "offers.longitude": {
      $gte: longitudeMin,
      $lte: longitudeMax,
    },
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
        "offers.latitude": 1,
        "offers.longitude": 1,
      },
    },
  ]);
  console.log("cityCoord", cityCoord);
  res.json({ listOffers, quest, cityCoord });
});

router.get("/countresults", async function (req, res, next) {
  var token = req.query.token;
  var quest_id = req.query.quest_id;

  var quest = await UserModel.findOne({ token: token }, { quests: { $elemMatch: { _id: quest_id } } });
  quest = quest.quests[0];

  const apiURL = `http://api.positionstack.com/v1/forward?access_key=2373330d53389309f778b537f08b4603&query=${quest.city}`;
  const apiResponse = await axios.get(apiURL);
  const cityCoord = apiResponse.data.data[0];
  var latitudeMin = cityCoord.latitude - (quest.rayon * 0.01) / 1.11;
  var latitudeMax = cityCoord.latitude + (quest.rayon * 0.01) / 1.11;
  var longitudeMin = cityCoord.longitude - (quest.rayon * 0.01) / 1.11;
  var longitudeMax = cityCoord.longitude + (quest.rayon * 0.01) / 1.11;

  //On créé le tableau de condition avant de lancer la requête car on souhaite le modifier dynamiquement pour les checkbox is_new, is_old et si on a une market_date
  var options = {
    "offers.latitude": {
      $gte: latitudeMin,
      $lte: latitudeMax,
    },
    "offers.longitude": {
      $gte: longitudeMin,
      $lte: longitudeMax,
    },
    "offers.type": quest.type,
    "offers.price": {
      $gte: quest.min_price,
      $lte: quest.max_price,
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

  if (quest.pieces_max === 6) {
    options["offers.nb_pieces"] = { $gte: quest.pieces_min };
  } else {
    options["offers.nb_pieces"] = {
      $gte: quest.pieces_min,
      $lte: quest.pieces_max,
    };
  }
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

  res.json({ listOffers: listOffers.length });
});

var cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: "dppkmed1y",
  api_key: "268693392323966",
  api_secret: "N0ORgeJRU0z914NPPEBKnH3aJ-I",
});

router.post("/upload", async function (req, res, next) {
  var pictureName = "./tmp/" + uniqid() + ".jpg";
  var resultCopy = await req.files.avatar.mv(pictureName);

  if (!resultCopy) {
    var resultCloudinary = await cloudinary.uploader.upload(pictureName);

    var user = await UserModel.findOneAndUpdate({ token: req.body.token }, { avatar: resultCloudinary.url }, { new: true });

    console.log("user", user);

    res.json({ url: resultCloudinary.url, result: true });
  } else {
    res.json({ error: resultCopy, result: false });
  }

  fs.unlinkSync(pictureName);
});

module.exports = router;
