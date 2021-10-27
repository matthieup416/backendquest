const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema({
  text: String,
  date: Date,
  sender_token: String,
});

const ConversationSchema = mongoose.Schema({
  accepted: Boolean,
  offer_id: { type: mongoose.Schema.Types.ObjectId, ref: "offers" },
  sender_token: String,
  receiver_token: String,
  quest_id: { type: mongoose.Schema.Types.ObjectId, ref: "offers" },
  messages: [MessageSchema],
});

const ConversationModel = mongoose.model("conversations", ConversationSchema);

module.exports = ConversationModel;
