// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import connect from "./config.js";
// import fs from "node:fs";
// import { setupAutoProfitUpdates } from "./cronJobs.js";

// const app = express();

// // Define allowed origins
// const allowedOrigins = [
//   "https://ecominex.com",
//   "https://mining-x-miningforuaes-projects.vercel.app",
//   "http://localhost:3000",
//   "http://localhost:5173",
//   "http://127.0.0.1:3000",
//   "http://127.0.0.1:5173",
//   "https://ecomine-mining.vercel.app",
//   "https://ecominex.net",
//   "https://www.ecominex.net",
//   "https://ecominex.vercel.app"
// ].filter(Boolean);

// // CORS configuration
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin) {
//       return callback(null, true);
//     }

//     if (allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       console.log("Blocked origin:", origin);
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
//   allowedHeaders: [
//     "Content-Type",
//     "Authorization",
//     "X-Requested-With",
//     "Accept",
//   ],
//   exposedHeaders: ["Set-Cookie"],
//   maxAge: 86400,
// };

// // Apply CORS middleware
// app.use(cors(corsOptions));

// // Security headers middleware
// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   if (allowedOrigins.includes(origin)) {
//     res.header("Access-Control-Allow-Origin", origin);
//   }
//   res.header("Access-Control-Allow-Credentials", "true");
//   res.header(
//     "Access-Control-Allow-Methods",
//     "GET,PUT,POST,DELETE,UPDATE,OPTIONS"
//   );
//   res.header(
//     "Access-Control-Allow-Headers",
//     "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
//   );

//   if (req.method === "OPTIONS") {
//     return res.status(200).end();
//   }
//   next();
// });

// // Middleware
// app.use(cookieParser());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Dynamic route loading
// const port = process.env.PORT || 8000;
// const routeFiles = fs.readdirSync("./routes");

// // Routes setup
// for (const file of routeFiles) {
//   try {
//     const route = await import(`./routes/${file}`);
//     console.log(route)
//     app.use("/api/v1", route.default);
//   } catch (err) {
//     console.error(`Failed to load route file: ${file}`, err.message);
//   }
// }

// const server = async () => {
//   try {
//     await connect();
//     setupAutoProfitUpdates();
//     app.listen(port, () => {
//       console.log(`Server is running on port ${port}`);
//       console.log("Allowed origins:", allowedOrigins);
//     });
//   } catch (error) {
//     console.error("Failed to start server:", error.message);
//     process.exit(1);
//   }
// };

// server();

// await connect();
// setupAutoProfitUpdates();

// app.get("/", (req, res) => {
//   res.send("Backend running successfully 🚀");
// });
























import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connect from "./config/config.js";
import fs from "node:fs";
import path from "node:path";

const app = express();

// ✅ Vercel does NOT allow app.listen()
(async () => {
  await connect();
    const port = process.env.PORT || 8000;
  app.listen(port, () => {
    console.log(`✅ Local server running on http://localhost:${port}`);
  });
})();

// ✅ Middlewares
app.use(express.json());
app.use(cookieParser());

// ✅ CORS
app.use(
  cors({
    origin: [
      "https://ecominex.com",
      "https://ecominex.net",
      "https://ecominex.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000"
    ],
    credentials: true,
  })
);

// ✅ STATIC TEST ROUTE
app.get("/", (req, res) => {
  res.send("✅ Backend deployed on Vercel and running!");
});

// ✅ Load routes manually instead of fs.readdirSync (fs FAILS on Vercel)
import authRoutes from "./routes/authRouter.js";
import withdrawal from "./routes/withdrawalRoutes.js"
import deposite from "./routes/depositeRoutes.js"
// import walletRoutes from "./routes/";

app.use("/api/v1/", authRoutes);
app.use("/api/v1/",withdrawal)
app.use("/api/v1/",deposite)
// app.use("/api/v1/wallet", walletRoutes);




const start = () => {
    connect();
    const port = process.env.PORT || 8000;
//   app.listen(port, () => {
//     console.log(`✅ Local server running on http://localhost:${port}`);
//   });
}

export default start;  