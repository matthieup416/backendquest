var mongoose = require("mongoose");

var express = require("express");
var router = express.Router();
var UserModel = require("../models/users");

router.post("/addquest", async function (req, res, next) {
  console.log(req.body);
  var user = await UserModel.findOne({
    token: "G8RIZjX6we4_p4fIsrCXL8oaojFjvcRg",
  });

  user.quests.push(req.body);

  var userSaved = await user.save();

  if (userSaved) {
    result = true;
  } else {
    result = false;
  }

  res.json({ result });
});
module.exports = router;
