import express from "express";
import Application from "../models/Application.js";

const allowedStatuses = [
    "Applied",
    "Interview",
    "Offer",
    "Rejected"
];

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { status, search, sortBy, order, page, limit } = req.query;

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: "Invalid application status"
            });
        }

        function escapeRegex(value) {
            return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }

        const filter = {};

        if (status) {
            filter.status = status;
        }
        if (search && search.trim() !== "") {
            const escapedSearch = escapeRegex(search.trim())

            filter.$or = [
                { company: { $regex: escapedSearch, $options: 'i' } },
                { position: { $regex: escapedSearch, $options: 'i' } },
            ]
        }

        const pageNumber = page === undefined ? 1 : Number(page);
        const limitNumber = limit === undefined ? 10 : Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1 ||
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 100
        ) {
            return res.status(400).json({
                error: "Page must be a positive integer and limit must be between 1 and 100"
            });
        }

        const allowedSortFields = [
            "company",
            "position",
            "status",
            "dateApplied"
        ];

        if (sortBy && !allowedSortFields.includes(sortBy)) {
            return res.status(400).json({
                error: "Invalid sort field"
            });
        }

        if (order && !["asc", "desc"].includes(order)) {
            return res.status(400).json({
                error: "Invalid sort order"
            });
        }

        const skip = (pageNumber - 1) * limitNumber;
        const sortDirection = order === "desc" ? -1 : 1;
        const sortOptions = sortBy
            ? { [sortBy]: sortDirection, _id: 1 }
            : { dateApplied: -1, _id: 1 };

        const [applications, total, statusCounts] = await Promise.all([
            Application.find(filter)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNumber),

            Application.countDocuments(filter),

            Application.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const counts = {
            total: await Application.countDocuments(),
            Applied: 0,
            Interview: 0,
            Offer: 0,
            Rejected: 0
        };

        for (const item of statusCounts) {
            counts[item._id] = item.count;
        }

        const totalPages = Math.ceil(total / limitNumber);

        return res.json({
            data: applications,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages
            },
            statistics: counts
        });

    } catch (error) {
        console.error("GET /applications failed:", error);

        return res.status(500).json({
            error: "Failed to fetch applications"
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }
        res.json(application);
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                error: "Invalid application ID"
            });
        }

        console.error("GET /applications/:id failed:", error);

        return res.status(500).json({
            error: "Failed to fetch application"
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { company, position, status } = req.body;

        if (
            typeof company !== "string" ||
            typeof position !== "string" ||
            typeof status !== "string" ||
            !company.trim() ||
            !position.trim() ||
            !status.trim()
        ) {
            return res.status(400).json({
                error: "Company, position, and status must be non-empty strings"
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: "Invalid application status"
            });
        }

        const cleanCompany = company.trim();
        const cleanPosition = position.trim();

        // Determine today's UTC calendar-day range.
        const now = new Date();
        const startOfDay = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        ));

        const endOfDay = new Date(startOfDay);
        endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

        // Match company and position exactly, ignoring letter case.
        const companyPattern = new RegExp(
            "^" + cleanCompany.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$",
            "i"
        );

        const positionPattern = new RegExp(
            "^" + cleanPosition.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$",
            "i"
        );

        const duplicate = await Application.findOne({
            company: companyPattern,
            position: positionPattern,
            dateApplied: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        });

        if (duplicate) {
            return res.status(409).json({
                error: "This company and job position have already been added for today."
            });
        }

        const newApplication = await Application.create({
            company: cleanCompany,
            position: cleanPosition,
            status
        });

        return res.status(201).json(newApplication);

    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                error: error.message
            });
        }

        console.error("POST /applications failed:", error);

        return res.status(500).json({
            error: "Failed to create application"
        });
    }
});

router.patch("/:id", async (req, res) => {
    try {
        const allowedFields = ["company", "position", "status"];
        const updates = Object.keys(req.body);

        if (
            updates.length === 0 ||
            updates.some((field) => !allowedFields.includes(field))
        ) {
            return res.status(400).json({
                error: "Provide valid fields to update: company, position, status"
            });
        }

        if (
            req.body.company !== undefined &&
            (typeof req.body.company !== "string" ||
                !req.body.company.trim())
        ) {
            return res.status(400).json({
                error: "Company must be a non-empty string"
            });
        }

        if (
            req.body.position !== undefined &&
            (typeof req.body.position !== "string" ||
                !req.body.position.trim())
        ) {
            return res.status(400).json({
                error: "Position must be a non-empty string"
            });
        }

        if (
            req.body.status !== undefined &&
            !allowedStatuses.includes(req.body.status)
        ) {
            return res.status(400).json({
                error: "Invalid application status"
            });
        }

        const currentApplication = await Application.findById(req.params.id);

        if (!currentApplication) {
            return res.status(404).json({
                error: "Application not found"
            });
        }

        const company =
            req.body.company !== undefined
                ? req.body.company.trim()
                : currentApplication.company;

        const position =
            req.body.position !== undefined
                ? req.body.position.trim()
                : currentApplication.position;

        const startOfDay = new Date(Date.UTC(
            currentApplication.dateApplied.getUTCFullYear(),
            currentApplication.dateApplied.getUTCMonth(),
            currentApplication.dateApplied.getUTCDate()
        ));

        const endOfDay = new Date(startOfDay);
        endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

        const escapeRegex = (value) =>
            value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const duplicate = await Application.findOne({
            _id: { $ne: currentApplication._id },
            company: new RegExp("^" + escapeRegex(company) + "$", "i"),
            position: new RegExp("^" + escapeRegex(position) + "$", "i"),
            dateApplied: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        });

        if (duplicate) {
            return res.status(409).json({
                error: "Another application already exists for this company, position, and date."
            });
        }

        if (req.body.company !== undefined) {
            currentApplication.company = company;
        }

        if (req.body.position !== undefined) {
            currentApplication.position = position;
        }

        if (req.body.status !== undefined) {
            currentApplication.status = req.body.status;
        }

        await currentApplication.save();

        return res.json(currentApplication);

    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                error: "Invalid application ID"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                error: error.message
            });
        }

        console.error("PATCH /applications/:id failed:", error);

        return res.status(500).json({
            error: "Failed to update application"
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const application = await Application.findByIdAndDelete(
            req.params.id
        );

        if (!application) {
            return res.status(404).json({
                error: "Application not found"
            });
        }

        res.json({
            message: "Application deleted successfully"
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                error: "Invalid application ID"
            });
        }

        res.status(500).json({
            error: "Failed to delete application"
        });
    }
});

export default router;