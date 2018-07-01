const express = require('express');
const router = express.Router();
const db = require('../../../module/db');
const jwt = require('../../../module/jwt');

//내정보보기
router.get('/', async (req,res)=>{
    var token = req.headers.token;
    if(!token){
        res.status(400).send({
            message:"fail to show mypage from client"
        });
    }else{
        let decoded = jwt.verify(token);
        if(decoded ==-1){
            res.status(500).send({
                message:"token error"
            });
        }else{
            let mypageshowQuery = `SELECT user_mail, user_name, user_point,user_img 
            FROM user WHERE user_idx=?`;
            let mypageshowResult = await db.queryParamArr(mypageshowQuery,[decoded.user_idx]);
            if(!mypageshowResult){
                res.status(500).send({
                    message:"fail to show mypage from server"
                });
            }else{
                res.status(200).send({
                    message:"success to show mypage",
                    data:mypageshowResult
                });
            }
        }
    }
});


module.exports = router;
