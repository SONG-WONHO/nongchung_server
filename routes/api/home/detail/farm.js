const express = require('express');
const router = express.Router();
const db = require('../../../../module/db');
const jwt = require('../../../../module/jwt');


//농장 프로필
router.get('/:nhIdx', async (req, res) => {
    var nhIdx = req.params.nhIdx;
    var token = req.headers.token;
    if(!token || !nhIdx){
        res.status(400).send({
            message: "Null value"
        })
    }else{
        var decoded = jwt.verify(token);
        if(decoded == -1){
            res.status(500).send({
                message:"token error"
            });
        }else{
            let farmQuery = `SELECT farmer.idx AS farmerIdx,
            farm.addr,
            farm.name AS farmName
            ,farmer.fname AS farmerName, 
            farmer.img AS farmerImg, 
            farmer.fphone,
            farmer.comment
            FROM NONGHWAL.farm, NONGHWAL.farmer, NONGHWAL.nh
            WHERE farm.farmerIdx = farmer.idx AND nh.farmIdx = farm.idx AND nh.idx = ? `;//농부프로필~~!
            let farmResult = await db.queryParamArr(farmQuery,[nhIdx]);
            var farmerIdx = farmResult[0]["farmerIdx"]


            let nhInfoQuery1 = `SELECT nh.name AS nhName, farm.addr AS farmAddr, nh.period, nh.price, 
            nh.idx AS nhIdx,
            farm.idx AS farmIdx,
            CASE WHEN date_sub(curdate(), INTERVAL 1 MONTH) > nh.wtime THEN 0
            ELSE 1
            END AS 'newState'
			FROM NONGHWAL.farm, NONGHWAL.farmer, NONGHWAL.nh
            WHERE farm.farmerIdx = farmer.idx AND farm.idx = nh.farmIdx AND 
							farmer.idx = (SELECT farmer.idx 
											FROM NONGHWAL.farm, NONGHWAL.nh,NONGHWAL.farmer 
											WHERE farm.farmerIdx = farmer.idx AND farm.idx = nh.farmIdx AND nh.idx = ?)
                                            `;
            
            let imgQuery = `SELECT SUBSTRING_INDEX(GROUP_CONCAT(farm_img.img SEPARATOR '|'),"|",1) AS farmImg, farm.idx AS farmIdx FROM NONGHWAL.farm, NONGHWAL.farm_img
            WHERE farm.idx = farm_img.farmIdx AND farm.farmerIdx = ?
            group by farm.idx `;
            
            

            let nhInfoResult = await db.queryParamArr(nhInfoQuery1,[nhIdx]);
            let imgResult = await db.queryParamArr(imgQuery,[farmerIdx]);
            console.log(nhInfoResult[1]["farmIdx"]);
            console.log(imgResult);


            
            for(let a = 0; a <nhInfoResult.length; a++){
                if(nhInfoResult[a]["farmIdx"] == imgResult[a]["farmIdx"]){
                    nhInfoResult[a].farmImg = imgResult[a]["farmImg"];
                }
                console.log(nhInfoResult[a]["nhIdx"]);
                let checkBookedQuery = `SELECT EXISTS (SELECT * FROM bookmark WHERE userIdx = ? AND nhIdx = ?) as isBooked`;
                let checkBookedResult = await db.queryParamArr(checkBookedQuery, [decoded.user_idx, nhInfoResult[a]["nhIdx"]]);
                console.log(checkBookedResult);
                nhInfoResult[a].isBooked = checkBookedResult[0]["isBooked"];
                

                
            }

            console.log(nhInfoResult);
            if(!nhInfoResult || !imgResult || !farmResult ){
                res.status(500).send({
                    message:"Internal server Error!"
                });
            }else{
                res.status(200).send({
                    message:"success TO show farmer profile",
                    farmerInfo : farmResult[0],
                    data : nhInfoResult
                })
            }
        }
    }
});



module.exports = router;
