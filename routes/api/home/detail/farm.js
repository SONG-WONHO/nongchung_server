const express = require('express');
const router = express.Router();

//테스트용입니다.
router.get('/', (req, res, next) => {
    res.render('index', { title: 'dfasfsdfffffffffffffffffffffffffffarmasdf' });
});

module.exports = router;
