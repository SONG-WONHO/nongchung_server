const express = require('express');
const router = express.Router();
const db = require('../../../module/db');
const jwt = require('../../../module/jwt');
const crypto = require('crypto-promise');

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
    if(!token || !nickname){
        res.status(400).send({
            message:"fail to change nickname from client,Null Value"
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
router.put('/password', async (req,res)=>{
    var token = req.headers.token;
    var pw = req.body.password;
    var newpw = req.body.newpw;

    if(!token || !pw ||!newpw){
        res.status(400).send({
            message:"Null value"
        });
    }
    else
    {
        var decoded = jwt.verify(token);
        if(decoded == -1){
            res.status(500).send({
                message:"token error"
            });
        }else{
            let checkQuery = "SELECT * FROM user WHERE user_idx = ?";
            let checkResult = await db.queryParamArr(checkQuery,[decoded.user_idx]);
            let hashedpw = await crypto.pbkdf2(pw, checkResult[0].user_salt, 100000, 32, 'sha512');
            if(!checkResult){
                res.status(500).send({
                    message:"Internal server error"
                });
            }else{
                if(hashedpw.toString('base64')===checkResult[0].user_pw){
                    //console.log(hashedpw.toString('base64'));
                    const salt = await crypto.randomBytes(32);
                    const hashednewpw = await crypto.pbkdf2(newpw, salt.toString('base64'), 100000, 32, 'sha512');
                    let newpwQuery = `UPDATE user SET user_pw =?, user_salt=? WHERE user_idx = ?`;
                    let newpwResult = await db.queryParamArr(newpwQuery,[hashednewpw.toString('base64'),salt.toString('base64'),decoded.user_idx]);
                    //console.log(hashednewpw.toString('base64'));
                    if(!newpwResult){
                        res.status(500).send({
                            message:"Internal server error"
                        });
                    }else{
                        res.status(200).send({
                            message:"Success To change PW"
                        });
                    }
                }else{
                    res.status(400).send({
                        message:"fail To change PW from client"
                    });
                }
            }
        }
    }
});

router.get('/point',async (req,res)=>{
    var token = req.headers.token;

    if(!token){
        res.status(400).send({
            message:"Null value"
        });
    }else{
        var decoded = jwt.verify(token);
        if(decoded==-1){
            res.status(500).send({
                message:"token error"
            });
        }
        else
        {
            let pointQuery = `SELECT * FROM NONGHWAL.shedule AS s, NONGHWAL.nh AS n, NONGHWAL.acitivty AS a WHERE a.sche_idx = s.sche_idx AND s.nh_idx = n.nh_idx`;
            let pointResult ;

        }

    }
});



module.exports = router;
