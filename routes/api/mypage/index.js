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
        var decoded = jwt.verify(token);
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
                    message:"Internal server Error!"
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

router.put('/',async (req,res)=>{
    var token = req.headers.token;
    var nickname = req.body.nickname;
    if(!token){
        res.status(400).send({
            message:"fail to change nickname from client"
        });
    }else{
        var decoded = jwt.verify(token);
        if(decoded == -1){
            res.status(500).send({
                message:"token error"
            });
        }else{
            let changingQuery = `UPDATE user SET user_nickname = ? WHERE user_idx =?`;
            let changingResult = await db.queryParamArr(changingQuery,[nickname,decoded.user_idx]);
            if(!changingResult){
                res.status(500).send({
                    message:"Internal server error"
                });
            }else{
                //console.log(changingResult.changedRows);
                res.status(200).send({
                    message : "Success to change nickname",
                    data : nickname
                    
                });
            }
        }

    }
});



module.exports = router;
