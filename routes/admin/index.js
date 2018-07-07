const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {
    res.render("index", {title:"asfasdfasdfasdf"})
});

module.exports = router;
