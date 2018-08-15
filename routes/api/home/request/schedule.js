const express = require('express');
const router = express.Router();
const check = require('../../../../module/check');
const db = require('../../../../module/db');

//신청하기 - 날짜리스트 보기
router.get('/', async (req, res, next) => {
    let schIdx = req.query.idx;

    //스케쥴 인덱스를 안 줬을 때
    if (check.checkNull(schIdx)) {
        res.status(400).send({
            message: "Null Value"
        })
    }
    //스케쥴 인덱스를 줬을 때
    else {
        //대원뽑기
        //스케츌 총 인원  쿼리
        let selectFriendQuery = `SELECT nh.personLimit, idx AS nhIdx
        FROM nh 
        JOIN (SELECT schedule.nhIdx  FROM schedule WHERE schedule.idx = ?) AS schedule 
        ON schedule.nhIdx = nh.idx
        `;

        // 성비 쿼리 & 참여인원 쿼리
        let selectSexRatioQuery = `SELECT  birth,user.sex, userIdx
        FROM activity
        JOIN(SELECT idx, sex, (YEAR(CURDATE())-YEAR(birth)+1) AS birth FROM user) AS user
        ON(userIdx = user.idx)
        WHERE scheIdx = ?
        group by userIdx;`;
        

        //대원결과
        //1 스케쥴 총 인원 쿼리 2. 성비 쿼리 3. 참여 인원 쿼리 
        let selectFriendResult = await db.queryParamArr(selectFriendQuery, [schIdx]);
        let selectSexRatioResult = await db.queryParamArr(selectSexRatioQuery,[schIdx]);
        
        
        //남녀 뽑기                
        let woman  = 0;
        let man = 0;
        let age = 0;
        for (let i = 0; i < selectSexRatioResult.length; i++){
            if(selectSexRatioResult[i].sex == 1){
                man++;
            }else{
                woman++;
            }
            age += selectSexRatioResult[i].birth; 
        }
        console.log(age);
        age =  age/selectSexRatioResult.length;
        if(selectSexRatioResult.length == 0){
            age = 0;
        }

        let Info = [{

            womanCount : woman ,
            manCount : man ,
            attendCount : selectSexRatioResult.length,
            personLimit :  selectFriendResult[0].personLimit,
            ageAverage : age,
            name: "temp",
            nickname: "temp",
            img: "temp"
        }];

        //쿼리 수행도중 에러가 있을 때

        if (!selectFriendResult && !selectSexRatioResult) {
            res.status(500).send({
                message : "Internal Server Error"
            });
            return;
        }

        res.status(200).send({
            message:"Success To Get Data",
            friendsInfo: Info
        })

    }
});


module.exports = router;
