import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import applicationRoutes from "./routes/applicationRoutes.js";

dotenv.config();
const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
}));

app.use(express.json());

app.use((req, res, next) => {
    console.log("Request received:", req.method, req.url);
    next();
});

app.get("/", (req, res) => {
    res.send("Hello from CareerFlow Express server!");
});

app.use("/applications", applicationRoutes);


app.post("/webhooks/email", (req, res) => {
    const event = req.body;

    if (
        !event ||
        typeof event.eventId !== "string" ||
        typeof event.type !== "string"
    ) {
        return res.status(400).json({
            error: "Invalid webhook payload",
        });
    }

    console.log("Email webhook received:", {
        eventId: event.eventId,
        type: event.type,
    });

    return res.status(200).json({
        received: true,
    });
});


app.use((req, res) => {
    return res.status(404).json({
        error: "Route not found"
    });
});

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            error: "Invalid JSON format"
        });
    }

    next(err);
});

const PORT = process.env.PORT || 3001;

async function startServer() {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Express server running on port ${PORT}`);
    });
}

startServer();