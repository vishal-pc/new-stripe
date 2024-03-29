require("dotenv").config();
const bodyParser = require("body-parser");

const app = require("express")();
app.use(bodyParser.json());
var http = require("http").Server(app);
const { STRIPE_SECRET_KEY, STRIPE_WEB_HOOK_SECRET_KEY } = process.env;

const stripe = require("stripe")(STRIPE_SECRET_KEY);
const endpointSecret = STRIPE_WEB_HOOK_SECRET_KEY;

const paymentRoute = require("./routes/paymentRoute");

app.use("/", paymentRoute);

app.post(
  "/webhooks",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    let session = "";
    const signature = req.headers["stripe-signature"];
    const payload = req.body;
    console.log("Receive sig ==>", signature);
    console.log("Receive payload ==>", payload);
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret
      );
      console.log("Received Stripe webhook:", event);

      switch (event.type) {
        case "checkout.session.async_payment_failed":
          session = event.data.object;
          break;
        case "checkout.session.completed":
          session = event.data.object;
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Error processing Stripe webhook:", err);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

http.listen(8080, function () {
  console.log("Server is running");
});
