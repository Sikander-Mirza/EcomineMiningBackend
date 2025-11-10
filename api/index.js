// api/index.js
import app from "../src/app.js";
import connect from "../src/config/config.js";

export default async function handler(req, res) {
    console.log("checking")
  await connect();

  return app(req, res);
}
