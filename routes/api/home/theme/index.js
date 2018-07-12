const express = require('express');
const router = express.Router();
const db = require('../../../../module/db');
const jwt = require('../../../../module/jwt');

router.get('/:themeIdx',async (req,res)=>{
    var tIdx = req.params.themeIdx;
    console.log(tIdx);
    
    if(!tIdx){
        res.status(400).send({
            message: "Null Value"
        });
    }else{
        if(tIdx != 0 && tIdx != 1 && tIdx != 2 && tIdx != 3 && tIdx != 4 && tIdx != 5  )
        {
            console.log("잘못된 요청");
            res.status(400).send({
                message:"Invalid value"
            });
        }else{
        let showThemeQuery =`SELECT farmer.img AS farmerImg, nh.name, nh.img AS fImg, nh.period, nh.price, nh.addr,nh.idx AS nhIdx,nh.theme,
        CASE WHEN date_sub(curdate(), INTERVAL 1 MONTH) > nh.wtime THEN 0
                ELSE 1
                END AS 'newState'
        FROM (SELECT img, idx FROM farmer) AS farmer
        LEFT JOIN(SELECT  farm.farmerIdx, nh.farmIdx, nh.name, farm.img, farm.addr, nh.price, nh.period, nh.idx, nh.wtime, nh.theme
        FROM (SELECT name,farmIdx, price, period,idx,wtime,theme FROM nh) AS nh
        LEFT JOIN (SELECT farmIdx, img, farmerIdx, addr
        FROM farm
        LEFT JOIN(SELECT farmIdx,img FROM NONGHWAL.farm_img)AS farmImg ON farm.idx = farmImg.farmIdx group by farm.idx) AS farm ON nh.farmIdx = farm.farmIdx) AS nh
        ON farmer.idx =nh.farmerIdx
        WHERE nh.theme = ?`;
        
        /*`SELECT h.img AS farmerImg, f.addr, n.name, n.price, n.period, n.idx AS nhIdx,
        substring_index(group_concat(i.img separator ','), ',', 1) AS fImg,
        CASE WHEN date_sub(curdate(), INTERVAL 1 MONTH) > n.wtime THEN 0
        ELSE 1
        END AS 'newState'
        FROM NONGHWAL.farmer as h, NONGHWAL.nh AS n, NONGHWAL.farm AS f, NONGHWAL.farm_img AS i 
        WHERE h.idx = f.farmerIdx AND n.farmIdx = f.idx AND i.farmIdx = f.idx AND n.theme=? group by n.idx`;*/

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
    }
});



module.exports = router;
