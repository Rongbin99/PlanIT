/**
 * @file 
 * @description
 * @copyright Rongbin Gu 2025
 */

import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        // TODO

        res.status(200).json( {
            message: "${req.params} SUCCESSFUL",
            data: {
                // TODO
            },
        })
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
});

router.post("/", async (req, res) => {
    try {
        // TODO

        res.status(201).json( {
            message: "",
            data: {
                // TODO
            },
        })
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
});

router.put("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // TODO

        res.status(200).json( {
            message: "${id} SUCCESSFUL",
            data: {
                // TODO
            },
        })
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // TODO

        res.status(200).json( {
            message: "${id} SUCCESSFUL",
            data: {
                // TODO
            },
        })
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
});

export { router as stocksRouter};
