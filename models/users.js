const mongoose = require("mongoose")

const QuestSchema = mongoose.Schema({
  cities: [
    {
      name: String,
      rayon: Number,
    },
  ],
  type: String,
  min_price: Number,
  max_price: Number,
  min_surface: Number,
  max_surface: Number,
  outdoor_surface: Number,
  nb_pieces: Number,
  floor_type: String,
  floor_max: Number,
  elevator: Boolean,
  garage: Boolean,
  parking: Boolean,
  fiber_optics: Boolean,
  pool: Boolean,
  balcony: Boolean,
  terrace: Boolean,
  is_new: Boolean,
  market_date: Date,
  creation_date: Date,
  open_to_pro: Boolean,
  is_online: Boolean,
  social_text: String,
})

const OfferSchema = mongoose.Schema({
  city: String,
  type: String,
  price: Number,
  surface: Number,
  description: String,
  social_text: String,
  nb_piece: Number,
  floor_type: String,
  floor_number: Number,
  elevator: Boolean,
  garage: Boolean,
  parking: Boolean,
  fiber_optics: Boolean,
  pool: Boolean,
  balcony: Boolean,
  terrace: Boolean,
  outdoor_surface: Number,
  market_date: Date,
  creation_date: Date,
  open_to_pro: Boolean,
  is_online: Boolean,
  exclusive: Boolean,
  pictures: [
    {
      url: String,
    },
  ],
  is_sold: Boolean,
})

const UserSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  password: String,
  token: String,
  id_card: String,
  avatar: String,
  category: String,
  type: String,
  verified: Boolean,
  description: String,
  job: String,
  quests: [QuestSchema],
  offers: [OfferSchema],
})

const UserModel = mongoose.model("users", UserSchema)

module.exports = UserModel
