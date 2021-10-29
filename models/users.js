const mongoose = require("mongoose");

const QuestSchema = mongoose.Schema({
  city: String,
  rayon: Number,
  type: String,
  min_price: Number,
  max_price: Number,
  min_surface: Number,
  max_surface: Number,
  outdoor_surface: Number,
  pieces_min: Number,
  pieces_max: Number,
  elevator: Boolean,
  garage: Boolean,
  parking: Boolean,
  is_old: Boolean,
  is_new: Boolean,
  fiber_optics: Boolean,
  pool: Boolean,
  balcony: Boolean,
  terrace: Boolean,
  created: Date,
  market_date: Date,
  open_to_pro: Boolean,
  is_online: Boolean,
  social_text: String,
});

const OfferSchema = mongoose.Schema({
  city: String,
  type: String,
  price: Number,
  surface: Number,
  description: String,
  social_text: String,
  nb_pieces: Number,
  elevator: Boolean,
  parking: Boolean,
  fiber_optics: Boolean,
  pool: Boolean,
  balcony: Boolean,
  terrace: Boolean,
  outdoor_surface: Number,
  created: Date,
  open_to_pro: Boolean,
  is_online: Boolean,
  is_new: Boolean,
  is_old: Boolean,
  exclusive: Boolean,
  pictures: [
    {
      url: String,
    },
  ],
  is_sold: Boolean,
  is_new: Boolean,
  is_old: Boolean,
});

const UserSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  password: String,
  token: String,
  id_card: String,
  avatar: String,
  category: String, //acheteur ou vendeur ---> retiré
  is_pro: Boolean, // pro ou particulier
  verified: Boolean, //Si particulier vérifié
  description: String,
  job: String, //profil acheteur
  quests: [QuestSchema],
  offers: [OfferSchema],
});

const UserModel = mongoose.model("users", UserSchema);

module.exports = UserModel;
