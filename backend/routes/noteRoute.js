const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const auth = require("../middleware/auth");


//get note 
router.get("/", auth, async(req, res) => {
    const notes = await Note.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(notes);
})

// Create new note
router.post("/", auth, async (req, res) => {
    const note = await Note.create({
        userId: req.user.id,
        title: req.body.title || "Untitled",
        content: ""
    });
    res.json(note);
});

//update my note 
router.put("/:id", auth, async (req, res) => {
    const note = await Note.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { title: req.body.title, content: req.body.content },
        { new: true }
    );
    res.json(note);
});

// Delete note
router.delete("/:id", auth, async (req, res) => {
    await Note.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Note deleted" });
});

module.exports = router;
