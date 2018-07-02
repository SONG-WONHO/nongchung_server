const express = require('express');
const router = express.Router();
const db = require('../../../module/db');
const jwt = require('../../../module/jwt');
const crypto = require('crypto-promise');
const upload = require('../../../config/s3multer').uploadUserImage;

//내정보보기
router.get('/', async (req,res)=>{
    var token = req.headers.token;
    if(!token){
        res.status(400).send({
            message:"fail to show mypage from client, Null value"
        });
    }else{
        var decoded = jwt.verify(token);
        console.log(decoded);
        if(decoded ==-1){
            res.status(500).send({
                message:"token error"
            });
        }else{
            let mypageshowQuery = `SELECT user.mail, user.name, user.point,user.img 
            FROM user WHERE user.idx=?`;
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

router.put('/nickname',async (req,res)=>{
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
            let changingQuery = `UPDATE user SET user.nickname = ? WHERE idx =?`;
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
            let checkQuery = "SELECT * FROM user WHERE user.idx = ?";
            let checkResult = await db.queryParamArr(checkQuery,[decoded.user_idx]);
            let hashedpw = await crypto.pbkdf2(pw, checkResult[0].salt, 100000, 32, 'sha512');
            if(!checkResult){
                res.status(500).send({
                    message:"Internal server error"
                });
            }else{
                if(hashedpw.toString('base64')===checkResult[0].pw){
                    //console.log(hashedpw.toString('base64'));
                    const salt = await crypto.randomBytes(32);
                    const hashednewpw = await crypto.pbkdf2(newpw, salt.toString('base64'), 100000, 32, 'sha512');
                    let newpwQuery = `UPDATE user SET user.pw =?, user.salt=? WHERE user.idx = ?`;
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
                    res.status(200).send({//기존의 비번 확인한게 틀리면 400으로 처리
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
            let pointQuery = `SELECT SUM(n.point) 
            FROM NONGHWAL.schedule AS s, NONGHWAL.nh AS n, NONGHWAL.activity AS a, NONGHWAL.user AS u
            WHERE a.scheIdx = s.idx AND s.nhIdx = n.idx 
            AND a.userIdx = u.idx AND u.idx=? AND a.state = 1`;
            let pointResult = await db.queryParamArr(pointQuery,[decoded.user_idx]);
            //console.log(pointResult);
            let infoQuery = `SELECT f.addr, n.name, n.point,SUBSTRING_INDEX(GROUP_CONCAT(i.img SEPARATOR '|'),"|",1) AS img
            FROM NONGHWAL.farm AS f, NONGHWAL.schedule AS s, NONGHWAL.nh AS n, NONGHWAL.activity AS a, NONGHWAL.user AS u, NONGHWAL.farm_img AS i
            WHERE f.idx = n.farmIdx AND a.scheIdx = s.idx AND s.nhIdx = n.idx AND f.idx = i.farmIdx
            AND a.userIdx = u.idx AND u.idx=? AND a.state = 1 GROUP BY i.farmIdx`;
            let infoResult = await db.queryParamArr(infoQuery,[decoded.user_idx])
            //console.log(infoResult);
            if(!pointResult || !infoResult){
                res.status(500).send({
                    message:"Internal server error"
                })
            }else{
                res.status(200).send({
                    message:"success To show point",
                    userPoint:pointResult[0]['SUM(n.point)'],
                    data:infoResult
                })
            }
        }
    }
});
router.put('/photo',upload.single('image'),async (req,res)=>{
    var token = req.headers.token;
    var img = req.file.location;
    if(!img||!token){//토큰이나 이미지가 없으면 널포인트 에러
        res.status(400).send({
            message:"Null value"
        });
    }
    else{
        var decoded = jwt.verify(token);
        if(decoded == -1){
            res.status(500).send({
                message:"token error"
            });
        }else
        {
            let photoQuery = `UPDATE user SET user.img = ? WHERE user.idx = ?`;//유저테이블에사진 업데이트
            let photoResult = await db.queryParamArr(photoQuery,[img,decoded.user_idx]);
            if(!photoResult){
                res.status(500).send({
                    message:"Internal server error"
                });
            }
            else{
                res.status(200).send({
                    message:"success To change photo",
                    data:img
                });
            }
        }
        
    }
});



module.exports = router;
