var express = require("express")
var router = express.Router()

var UserModel = require("../models/users")

router.get("/userDetail", async (req, res) => {
    var result = false;
    var user = await UserModel.findOne({
        token: req.query.token
    })
    if (user != null) {
        result = true
    }
    console.log(result)
    console.log(user)
    res.json({ result, user })
})

module.exports = router