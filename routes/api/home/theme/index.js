const express = require('express');
const router = express.Router();
const db = require('../../../../module/db');
const jwt = require('../../../../module/jwt');

router.get('/:themeIdx',async (req,res)=>{
    var tIdx = req.params.themeIdx;
    if(!tIdx){
        res.status(400).send({
            message: "Null Value"
        });
    }else{
        let showThemeQuery =`SELECT h.img AS farmerImg, f.addr, n.name, n.price, n.period,
        substring_index(group_concat(i.img separator ','), ',', 1) AS fImg,
        CASE WHEN date_sub(curdate(), INTERVAL 1 MONTH) > n.wtime THEN 0
        ELSE 1
        END AS 'newState'
        FROM NONGHWAL.farmer as h, NONGHWAL.nh AS n, NONGHWAL.farm AS f, NONGHWAL.farm_img AS i 
        WHERE h.idx = f.farmerIdx AND n.farmIdx = f.idx AND i.farmIdx = f.idx AND n.theme=? group by n.idx`;
        let showThemeResult = await db.queryParamArr(showThemeQuery,[tIdx]);
        if(!showThemeResult){
            res.status(500).send({
                message:"Internal server error!"
            });
        }else{
            res.status(200).send({
                message: "Success To show themeList",
                data:showThemeResult
            });
        }
    }
});



module.exports = router;
