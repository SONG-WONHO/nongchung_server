const express = require('express');
const router = express.Router();
const db = require('../../../module/db');
const jwt = require('../../../module/jwt');



//내활동
router.get('/', async (req,res)=>{
    var token = req.headers.token;
    if(!token){
        res.status(400).send({
            message:"fail to show activity from client"
        });
    }else{
        let decoded = jwt.verify(token);
        if(decoded==-1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });
        }else{
            let activityQuery = `SELECT s.startDate, s.endDate, f.addr, n.period, n.name
            FROM NONGHWAL.activity AS a, NONGHWAL.farm AS f, NONGHWAL.schedule AS s, NONGHWAL.nh AS n, NONGHWAL.user AS u
            WHERE a.scheIdx = s.idx AND s.nhIdx = n.idx AND n.farmIdx = f.idx
            AND a.userIdx = u.idx AND u.idx = ?`;
            let activityResult = await db.queryParamArr(activityQuery,[decoded.user_idx]);
            if(!activityResult){
                res.status(500).send({
                    message:"Internal server error"
                });
            }else{
                res.status(200).send({
                    message:"success to show activity",
                    data : activityResult
                });
            }
        }   
    }
});

module.exports = router;
