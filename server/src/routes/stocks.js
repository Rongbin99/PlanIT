import express from 'express';

const router = express.Router();

router.get("/read", async (req, res) => {
    res.json("Your mom!");
});

router.get("/create", async (req, res) => {
    res.json("Your mom!");
});

router.get("/update", async (req, res) => {
    res.json("Your mom!");
});

router.get("/delete", async (req, res) => {
    res.json("Your mom!");
});

export { router as stocksRouter};