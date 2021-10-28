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
    "quests._id quests.cities quests.min_price quests.max_price"
  )
  res.json({ listQuest: listQuest[0].quests })
})

router.get("/selectedQuest", async function (req, res, next) {
  var id = req.query.id
  var token = req.query.token
  //On récupére toutes les conversations, avec le dernier messages, le nom de l'utilisateur du dernier message.
  var listDiscussion = await ConversationModel.aggregate([
    { $match: { quest_id: ObjectId(id) } }, //Cherche toutes les conversations dont l'id de la quête = id
    { $project: { quest_id: 1, lastMessage: { $slice: ["$messages", -1] } } }, // On ne garde que le dernier message, le project permet de ne garder que les champs que l'on veux, le slice permet de ne prendre que le dernier element du tableau des messages de la conversation
    {
      $lookup: {
        //lookup permet de lier une autre collection grace au sender_id qui = users._id
        from: "users",
        localField: "lastMessage.sender_token",
        foreignField: "token",
        as: "users",
      },
    },
  ])

  console.log("listDiscussion", listDiscussion)

  //On ne garde que les informations utilent à renvoyer au front (lastMessage, User firestName et avatar, et l'id de la conversation)
  var listConversation = listDiscussion.map((d) => {
    console.log(d)
    return {
      lastMessage: d.lastMessage[0],
      user: {
        firstName: d.users[0].firstName,
        avatar: d.users[0].avatar,
      },
      _id: d._id,
    }
  })
  //On récupère les information de la quête sélectionnée
  var quest = await UserModel.findOne(
    { token: token },
    { quests: { $elemMatch: { _id: ObjectId(id) } } }
  )

  //On met tout en forme dans un objet à envoyer au front
  var conversations = {
    conversation: listConversation,
    quest: quest.quests,
  }

  res.json({ conversations })
})

router.get("/conversation", async function (req, res, next) {
  var id = req.query.id
  var token = req.query.token
  //On récupère tous les messages de la conversation selectionnée
  var messages = await ConversationModel.aggregate([
    // On récupère le document ayant l'id du Get
    { $match: { _id: ObjectId(id) } },
    //on permet de lire les sous documents, un peu comme un .map sur le tableau conversation.messages
    { $unwind: { path: "$messages" } },
    {
      //On fait la jointure avec la collection users pour récolter les informations de l'utilisateur ayant envoyé chaque message
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
        messages: 1,
        "users.firstName": 1,
        "users.avatar": 1,
      },
    },
  ])

  var quest = await UserModel.findOne(
    { token: token },
    { quests: { $elemMatch: { _id: messages[0].quest_id } } }
  )

  //On met tout en forme dans un objet à envoyer au front
  var messages = {
    listMessages: messages,
    quest: quest.quests,
  }
  res.json({ messages })
})

router.post("/addMessage", async function (req, res, next) {
  //user (sender), user (receiver), message, conversation id
  var newMessage = null
  if (req.body.id) {
    var newMessage = await ConversationModel.findOne({ _id: req.body.id })
  }
  console.log("newMessage", newMessage)
  if (newMessage === null) {
    var newMessage = new ConversationModel({
      accepted: false,
      sender_token: req.body.sender_token,
      receiver_token: req.body.receiver_token,
      quest_id: req.body.quest_id,
    })
    console.log("newMessage2", newMessage)
  }
  newMessage.messages.push({
    sender_token: req.body.sender_token,
    text: req.body.message,
  })

  var messageSaved = await newMessage.save()

  console.log("messageSaved", messageSaved)
  var result = false
  if (messageSaved) {
    result = true
  }

  res.json({ result, messageSaved })
})

module.exports = router
