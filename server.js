const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const technicianRoutes = require("./routes/technicianRoutes");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();
connectDB();
const app = express();

app.use(express.json({ limit: "100mb" })); 
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/technician", technicianRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

