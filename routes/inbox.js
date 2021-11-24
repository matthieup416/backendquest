var express = require("express")
var router = express.Router()
var UserModel = require("../models/users")
var ConversationModel = require("../models/conversations")
const { ObjectId } = require("mongodb")

//Route qui récupère toutes les quêtes de l'utilisateur pour créer le picker avec la liste des quêtes
router.get("/", async function (req, res, next) {
  var token = req.query.token

  // chercher toutes les quetes de l'uilisateur et on ne selectionne que les champs dont on a besoin
  var listQuest = await UserModel.find({ token: token }).select(
    "quests._id quests.city quests.min_price quests.max_price quests.min_surface quests.max_surface quests.type"
  )

  res.json({ listQuest: listQuest[0].quests })
})

router.get("/selectedQuest", async function (req, res, next) {
  var id = req.query.id //Quest_id
  var token = req.query.token
  //On récupére toutes les conversations, avec le dernier messages, le nom de l'utilisateur du dernier message.

  var conversations = await ConversationModel.aggregate([
    {
      $match: {
        quest_id: ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "offer_id",
        foreignField: "offers._id",
        as: "seller",
      },
    },
    {
      $unwind: {
        path: "$seller",
      },
    },
    {
      $project: {
        quest_id: 1,
        offer_id: 1,
        "seller.firstName": 1,
        "seller.avatar": 1,
        lastMessage: {
          $slice: ["$messages", -1],
        },
        offer: {
          $filter: {
            input: "$seller.offers",
            as: "offer",
            cond: {
              $eq: ["$$offer._id", "$offer_id"],
            },
          },
        },
      },
    },
  ])

  res.json({ conversations })
})

router.get("/conversation", async function (req, res, next) {
  var id = req.query.id
  //On récupère tous les messages de la conversation selectionnée
  var messages = await ConversationModel.aggregate([
    // On récupère le document ayant l'id du Get
    { $match: { _id: ObjectId(id) } },
    //on permet de lire les sous documents, un peu comme un .map sur le tableau conversation.messages
    { $unwind: { path: "$messages" } },
    {
      //On fait le lien avec la collection users pour récolter les informations de l'utilisateur ayant envoyé chaque message
      $lookup: {
        from: "users",
        localField: "messages.sender_token",
        foreignField: "token",
        as: "users",
      },
    },
    {
      //On filtre les champs récoltés pour ne garder que le firstname et l'avatar du user et la quest_id associée
      $project: {
        quest_id: 1,
        offer_id: 1,
        seller_token: 1,
        messages: 1,
        "users.firstName": 1,
        "users.avatar": 1,
      },
    },
  ])

  var offer = await UserModel.findOne(
    { token: messages[0].seller_token },
    { offers: { $elemMatch: { _id: messages[0].offer_id } } }
  )
  //On met tout en forme dans un objet à envoyer au front
  var messages = {
    listMessages: messages,
    offer: offer.offers,
  }
  res.json({ messages })
})

router.post("/addMessage", async function (req, res, next) {
  //user (sender), user (receiver), message, conversation id
  var newMessage = null
  if (req.body.id) {
    var newMessage = await ConversationModel.findOne({ _id: req.body.id })
  }
  if (newMessage === null) {
    var newMessage = new ConversationModel({
      accepted: false,
      buyer_token: req.body.buyer_token,
      seller_token: req.body.seller_token,
      quest_id: req.body.quest_id,
      offer_id: req.body.offer_id,
    })
  }
  newMessage.messages.push({
    sender_token: req.body.sender_token,
    text: req.body.message,
  })

  var messageSaved = await newMessage.save()

  var result = false
  if (messageSaved) {
    result = true
  }

  res.json({ result, messageSaved })
})

module.exports = router
