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
            let activityQuery = `SELECT s.sche_start_date, s.sche_end_date, f.farm_addr, n.nh_period,n.nh_name
            FROM NONGHWAL.activity AS a, NONGHWAL.farm AS f, NONGHWAL.schedule AS s, NONGHWAL.nh AS n, NONGHWAL.user AS u
            WHERE a.sche_idx = s.sche_idx AND s.nh_idx = n.nh_idx AND n.farm_idx = f.farm_idx
            AND a.user_idx = u.user_idx AND u.user_idx = ?`;
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
