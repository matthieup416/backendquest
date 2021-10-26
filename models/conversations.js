const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema({
  text: String,
  date: Date,
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
});

const ConversationSchema = mongoose.Schema({
  accepted: Boolean,
  offer_id: { type: mongoose.Schema.Types.ObjectId, ref: "offers" },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  quest_id: { type: mongoose.Schema.Types.ObjectId, ref: "offers" },
  messages: [MessageSchema],
});

const ConversationModel = mongoose.model("conversations", ConversationSchema);

module.exports = ConversationModel;
