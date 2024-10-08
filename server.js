const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const technicianRoutes = require("./routes/technicianRoutes");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const socketHandler = require("./utils/socketHandler");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: "https://www.techcare.live",
  methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cookieParser());

const io = new Server(server, {
  cors: corsOptions,
});

app.get("/", (req, res) => {
  res.json({message: "TechCare server starts"})
})

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/technician", technicianRoutes);

app.use("*", (req, res) => {
  res.status(200).json({ message: "TechCare API" });
});

socketHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
 
app.set("io", io);
