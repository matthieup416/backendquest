var express = require("express")
var router = express.Router()

var UserModel = require("../models/users")

router.get("/userDetail", async (req, res) => {
    try {
        var user = await UserModel.findOne({
            token: req.query.token,
        });
        res.send({ result: user, success: true });
    } catch (error) {
        res.status(404).json({ err: error, success: false });
    }
    res.json({ result })
});

module.exports = router