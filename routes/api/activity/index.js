const express = require('express');
const router = express.Router();


/* 테스트용 입니다. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'api/activity' });
});

module.exports = router;
