const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const path = require("path");
const { PORT } = require("./config");
const { connectToSqlServer } = require("./config/db");

const app = express();

app.use(express.json());
app.use(fileUpload());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "/app_data")));
app.use(express.static("client/build"));

app.use("/login", require("./routes/authRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use("/employees", require("./routes/employeeRoutes"));
app.use("/salary", require("./routes/salaryRoutes"));
app.use("/payroll", require("./routes/payrollRoutes"));
app.use("/holiday-schedule", require("./routes/holidayRoutes"));
app.use("/department", require("./routes/departmentRoutes"));
app.use("/timelogs", require("./routes/timelogRoutes"));
app.use("/shifts", require("./routes/shiftRoutes"));
app.use("/shift-overrides", require("./routes/shiftOverrideRoutes"));
app.use("/inventory", require("./routes/inventoryRoutes"));

// SPA fallback: any non-API GET returns the client so client-side
// routes (/employee, /department, ...) survive a refresh / deep link.
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

connectToSqlServer().then(() => {
    app.listen(PORT, () => console.log("Server Started"));
});
