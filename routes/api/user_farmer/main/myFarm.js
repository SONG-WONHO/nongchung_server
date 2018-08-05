const express = require('express');
const router = express.Router();

//테스트
router.get('/', async (req,res)=>{

    res.status(200).send({
        message:"test"
    });
});

module.exports = router;
