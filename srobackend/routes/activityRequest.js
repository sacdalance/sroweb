
import express from 'express';
const router = express.Router();


router.get("/", (req, res) => {
  res.send("Data from the database will be here");
});

router.post("/", (req, res) => {
    res.send("");
});

router.put("/", (req, res) => {
    res.send("");
});

router.delete("/", (req, res) => {
    res.send("");
});

export default router;