var app = require("../app")
var request = require("supertest")
const mongoose = require("mongoose")

test("test ajout offre", async () => {
  await request(app)
    .post("/addoffer")
    .send({
      token: "UdQxBmsipgFdvtQvrsqQTg_WopWmh9Jj",
      offer: {
        city: "Monaco",
        type: "appartement",
        price: 649000,
        surface: 220,
        description: "description description ",
        social_text:
          "social text socialxt social text social social ttext soc ",
        nb_pieces: 12,
        elevator: true,
        parking: true,
        fiber_optics: true,
        pool: false,
        balcony: true,
        terrace: true,
        created: "2021-10-28T07:53:36.724+00:00",
        outdoor_surface: 0,
        open_to_pro: true,
        is_online: true,
        exclusive: true,
        pictures: [
          {
            url: "https://www.phillyaptrentals.com/wp-content/uploads/2020/08/apartment-complex-scaled.jpg",
          },
          {
            url: "https://www.phillyaptrentals.com/wp-content/uploads/2021/10/rent-concession-wifi.jpg",
          },
        ],
        is_sold: false,
        is_new: false,
        is_old: true,
      },
    })
    .expect(200)
    .expect("Content-Type", /json/)
    .then((response) => {
      expect(response.body.result).toBe(true)
    })
})

test("test signin email & password", async () => {
  await request(app)
    .post("/users/sign-in")
    .send({ emailFromFront: "matthieu@quest.immo", passwordFromFront: "007" })
    .expect(200)
    .expect("Content-Type", /json/)
    .then((response) => {
      expect(response.body.dataUser.token).toBe(
        "pBXGXMxyXqO019k_U_VBQNH4zjbivCoR"
      )
    })
})

test("test- Wrong usertoken", async () => {
  await request(app)
    .get("/home/userDetail")
    .query({ token: "badToken" })
    .expect("Content-Type", /json/)
    .then((response) => {
      expect(response.body.result).toBe(false)
    })
})

afterAll(() => {
  mongoose.connection.close()
})
