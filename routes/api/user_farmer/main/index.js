const express = require('express');
const router = express.Router();

const routerMyFarm = require('./myFarm');
const routerMyNh = require('./myNh');
const routerMyReview =require('./myReview');

router.use('/myfarm', routerMyFarm);
router.use('/mynh', routerMyNh);
router.use('/myreview', routerMyReview);

//테스트
router.get('/', async (req,res)=>{

    res.status(200).send({
        message:"test"
    });
});

module.exports = router;
