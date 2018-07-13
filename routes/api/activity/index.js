const express = require('express');
const router = express.Router();
const db = require('../../../module/db');
const jwt = require('../../../module/jwt');
const moment = require('moment');
const upload = require('../../../config/s3multer').uploadReviewImage;





//내활동보기forweb

router.get('/complete',async (req,res)=>{
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
            //규격을 2018-4-12식으로 맞춘 deadline과 농활의 최소값, 스케듈 인덱스, 스케듈 신청한 사람 값 
            let timeQuery = `SELECT date_format(s.deadline, "%Y-%c-%d") AS deadline , n.minPerson, s.idx, s.person
            FROM NONGHWAL.activity AS a, NONGHWAL.schedule AS s, NONGHWAL.nh AS n
            WHERE a.scheIdx = s.Idx AND s.nhIdx = n.idx AND a.userIdx = ?`;
            let timeResult = await db.queryParamArr(timeQuery,[decoded.user_idx]);
            
            let dicMinPerson={};//농활최소인원 딕셔너리 만들기
            for(let j = 0; j<timeResult.length ; j++){
                dicMinPerson[timeResult[j].idx]=timeResult[j].minPerson;
            }//키값: 농활스케듈 인덱스 , 벨류값 : 농활최소인원
            
            let dicSchePerson={};//각 농활 스케쥴에 대한 딕셔너리
            for(let a = 0; a<timeResult.length ; a++){
                dicSchePerson[timeResult[a].idx] = timeResult[a].person;
            }//키값: 농활스케듈 인덱스, 벨류값: 농활스케쥴에 참여한 인원

            //0 : 입금 대기(신청중) | 1: 입금 완료 (신청중)
            //2 : 완료 | 3 : 취소




            let stateQuery = `UPDATE NONGHWAL.activity AS a JOIN NONGHWAL.schedule AS s 
            ON a.scheIdx = s.idx 
            SET a.state = ?
            WHERE s.deadline > CURDATE()`; //데드라인이 안넘는 것

            //조건 추가 
            let stateResult = await db.queryParamArr(stateQuery,[0]);
            for(let a= 0 ;a<timeResult.length; a++){
                if(dicSchePerson[timeResult[a].idx]>dicMinPerson[timeResult[a].idx]){
                    let stateQuery2 = `
                    UPDATE NONGHWAL.activity AS a
                    JOIN NONGHWAL.schedule AS s 
                    ON a.scheIdx = s.idx 
                    SET a.state = ?
                    WHERE s.deadline < CURDATE() AND s.idx =?`;//데드라인이 넘었는데 미니멈 넘은 것
                    let stateResult2 = await db.queryParamArr(stateQuery2,[1,timeResult[a].idx]);
                    if(!stateResult2){
                        res.status(500).send({
                            message:"Internal server error!"
                        });
                    }
                }else{
                    let stateQuery1 = `
                    UPDATE NONGHWAL.activity AS a
                    JOIN NONGHWAL.schedule AS s 
                    ON a.scheIdx = s.idx 
                    SET a.state = ?
                    WHERE s.deadline < CURDATE() AND s.idx =?`;//데드라인이 넘었는데 미니멈 안 넘은 것
                    let stateResult2 = await db.queryParamArr(stateQuery1,[2,,timeResult[a].idx]);
                    if(!stateResult2){
                        res.status(500).send({
                            message:"Internal server error!"
                        });
                    }
                }
                
                
            }
            

            
            let activityQuery = `SELECT date_format(s.startDate, "%Y.%c.%d") AS startDate,date_format(s.endDate, "%Y.%c.%d") AS endDate , 
            f.addr, n.period, n.name, a.state, n.price,
            abs(n.personLimit - s.person) as currentPerson,
            s.person, n.personLimit, s.idx,i.img
            FROM NONGHWAL.activity AS a, NONGHWAL.farm AS f, NONGHWAL.farm_img AS i,NONGHWAL.schedule AS s, NONGHWAL.nh AS n, NONGHWAL.user AS u
            WHERE a.scheIdx = s.idx AND s.nhIdx = n.idx AND n.farmIdx = f.idx AND i.farmIdx = f.idx
            AND a.userIdx = u.idx AND u.idx = ? AND a.state = ? GROUP BY s.idx`;
            
            let totalQuery = `SELECT COUNT(a.scheIdx) AS tcount, SUM(n.volunTime) AS ttime 
            FROM NONGHWAL.activity AS a, NONGHWAL.schedule AS s, NONGHWAL.nh AS n, NONGHWAL.user AS u 
            WHERE a.scheIdx = s.idx AND s.nhIdx = n.idx AND a.userIdx = u.idx AND u.idx =? AND a.state= ?;`

            let totalResult = await db.queryParamArr(totalQuery,[decoded.user_idx,1]);
            let activityResult = await db.queryParamArr(activityQuery,[decoded.user_idx,1]);
            
            let reviewQuery = `SELECT r.scheIdx, r.idx  FROM NONGHWAL.review AS r WHERE r.userIdx = ?`;
            let reviewResult = await db.queryParamArr(reviewQuery,[decoded.user_idx]);
            
            let reviewList = [];
            
            for(let r = 0; r<reviewResult.length; r++){
                reviewList.push(reviewResult[r].scheIdx);
                // 유저의 활동 중에서 state!
            }
            activityResult.filter((value, pos) => {
                if(reviewList.includes(value.idx)){//만약 스케듈에 대한 리뷰가 있으면
                    value.rState = 1;
                    
                }else{//없으면
                    value.rState = 0;
                }
            });
            if(!activityResult || !totalResult ||!reviewResult || !timeResult || !stateResult){
                res.status(500).send({
                    message:"Internal server error"
                });
            }else{
                res.status(200).send({
                    message:"success to show activity",
                    total : totalResult[0],
                    data : activityResult
                });
            }
        }   
    }

});



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
            //규격을 2018-4-12식으로 맞춘 deadline과 농활의 최소값, 스케듈 인덱스, 스케듈 신청한 사람 값 
            let timeQuery = `SELECT date_format(s.deadline, "%Y-%c-%d") AS deadline , n.minPerson, s.idx, s.person
            FROM NONGHWAL.activity AS a, NONGHWAL.schedule AS s, NONGHWAL.nh AS n
            WHERE a.scheIdx = s.Idx AND s.nhIdx = n.idx AND a.userIdx = ?`;
            let timeResult = await db.queryParamArr(timeQuery,[decoded.user_idx]);
            

            let dicMinPerson={};//농활최소인원 딕셔너리 만들기
            for(let j = 0; j<timeResult.length ; j++){
                dicMinPerson[timeResult[j].idx]=timeResult[j].minPerson;
            }//키값: 농활스케듈 인덱스 , 벨류값 : 농활최소인원
            
            let dicSchePerson={};//각 농활 스케쥴에 대한 딕셔너리
            for(let a = 0; a<timeResult.length ; a++){
                dicSchePerson[timeResult[a].idx] = timeResult[a].person;
            }//키값: 농활스케듈 인덱스, 벨류값: 농활스케쥴에 참여한 인원

                    //취소 2 , 완료 1, 신청중 0
            let stateQuery = `UPDATE NONGHWAL.activity AS a JOIN NONGHWAL.schedule AS s 
            ON a.scheIdx = s.idx 
            SET a.state = ?
            WHERE s.deadline > CURDATE()`; //데드라인이 안넘는 것
            let stateResult = await db.queryParamArr(stateQuery,[0]);
            for(let a= 0 ;a<timeResult.length; a++){
                if(dicSchePerson[timeResult[a].idx]>dicMinPerson[timeResult[a].idx]){
                    let stateQuery2 = `
                    UPDATE NONGHWAL.activity AS a
                    JOIN NONGHWAL.schedule AS s 
                    ON a.scheIdx = s.idx 
                    SET a.state = ?
                    WHERE s.deadline < CURDATE() AND s.idx =?`;//데드라인이 넘었는데 미니멈 넘은 것
                    let stateResult2 = await db.queryParamArr(stateQuery2,[1,timeResult[a].idx]);
                }else{
                    let stateQuery1 = `
                    UPDATE NONGHWAL.activity AS a
                    JOIN NONGHWAL.schedule AS s 
                    ON a.scheIdx = s.idx 
                    SET a.state = ?
                    WHERE s.deadline < CURDATE() AND s.idx =?`;//데드라인이 넘었는데 미니멈 안 넘은 것
                    let stateResult2 = await db.queryParamArr(stateQuery1,[2,,timeResult[a].idx]);
                }
            }
            

            
            let activityQuery = `SELECT date_format(s.startDate, "%Y.%c.%d") AS startDate,
            date_format(s.endDate, "%Y.%c.%d") AS endDate , 
            f.addr, n.period, n.name, a.state, n.price,
            abs(n.personLimit - s.person) as currentPerson,
            s.person, n.personLimit, s.idx, i.img
            FROM NONGHWAL.activity AS a, NONGHWAL.farm AS f,NONGHWAL.farm_img AS i, NONGHWAL.schedule AS s, NONGHWAL.nh AS n, NONGHWAL.user AS u
            WHERE a.scheIdx = s.idx AND s.nhIdx = n.idx AND n.farmIdx = f.idx AND i.farmIdx = f.idx
            AND a.userIdx = u.idx AND u.idx = ? GROUP BY s.idx`;
            let totalQuery = `SELECT COUNT(a.scheIdx) AS tcount, SUM(n.volunTime) AS ttime 
            FROM NONGHWAL.activity AS a, NONGHWAL.schedule AS s, NONGHWAL.nh AS n, NONGHWAL.user AS u 
            WHERE a.scheIdx = s.idx AND s.nhIdx = n.idx AND a.userIdx = u.idx AND u.idx =? AND a.state= ?;`
            let totalResult = await db.queryParamArr(totalQuery,[decoded.user_idx,1]);
            let activityResult = await db.queryParamArr(activityQuery,[decoded.user_idx]);
            
            let reviewQuery = `SELECT r.scheIdx, r.idx  FROM NONGHWAL.review AS r WHERE r.userIdx = ?`;
            let reviewResult = await db.queryParamArr(reviewQuery,[decoded.user_idx]);
            
            let reviewList = [];
            let dicReview={};//리뷰인덱스에 해당하는 스케듈값
            for(let j = 0; j<reviewResult.length ; j++){
                dicReview[reviewResult[j].scheIdx]=reviewResult[j].idx;
            }
            console.log(dicReview);
            console.log(Object.keys(dicReview));
            for(let a = 0 ; a< totalResult.lenght; a++){
                if(totalResult[a][ttime] == NULL && totalResult[a][ttime] == [] && totalResult[a][ttime] == {}){
                    console.log("ffkf");
                    totalResult[a][ttime] = 0;
                }
                
            }


            for(let r = 0; r<reviewResult.length; r++){
                reviewList.push(reviewResult[r].scheIdx);//스케쥴인덱스를 넣어준다.
                
            }
            activityResult.filter((value, pos) => {
                if(value.state == 1){
                    
                    if(reviewList.includes(value.idx)){//만약 스케듈에 대한 리뷰가 있으면
                        value.rState = 1;
                        
                    }else{//없으면
                        value.rState = 0;
                    }
                }
            });
            for(let c = 0; c<activityResult.length; c++){
                if(activityResult[c].rState == 1){
                    activityResult[c].rIdx = dicReview[activityResult[c].idx];

                }
            }


            
            if(!activityResult || !totalResult ||!reviewResult || !timeResult || !stateResult){
                res.status(500).send({
                    message:"Internal server error"
                });
            }else{
                res.status(200).send({
                    message:"success to show activity",
                    total : totalResult,
                    data : activityResult
                });
            }
        }   
    }
});
router.put('/review', upload.array('rImages', 20), async (req, res)=>{
    var token = req.headers.token;
    var rIdx = req.body.rIdx;
    var content = req.body.content;
    var rImage = req.files;
    var star = req.body.star;
    console.log(req.body);
    if(!token||!rIdx||!content){
        res.status(400).send({
            message:"Null value"
        });
    }else{
        var decoded = jwt.verify(token);
        if(decoded==-1){
            res.status(500).send({
                message:"token error"
            });
            console.log("토큰에러찡");
        }else{
            let tempImg = [];
            for(let a = 0; a<rImage.length; a++){
                tempImg.push(rImage[a].location);
            }
            let joinedImages = tempImg.join(',');
            //console.log(tempImg);
            //console.log(joinedImages);
            

            let reviewChangeQuery  = `UPDATE NONGHWAL.review SET review.content =?, review.img =?, review.star=? WHERE review.idx = ?`;
            let reviewChangeResult = await db.queryParamArr(reviewChangeQuery,[content,joinedImages,star,rIdx]);
            console.log("바뀌었나??"+reviewChangeResult);
            if(!reviewChangeResult){
                res.status(500).send({
                    message:"Internal server error"

                });
                console.log("업뎃xX");
            }else{
                res.status(200).send({
                    message:"success To update review"
                });
                console.log("업뎃 됐음...");
            

            }

        }

    }
});
router.get('/review/:scheIdx',async(req,res)=>{
    var scheIdx = req.params.scheIdx;
    var token = req.headers.token;
    if(!token || !scheIdx){
        res.status(400).send({
            message:"Null Value"
        });
    }else{
        // 정당한 리뷰일 때 수정해야 함
        
        var decoded = jwt.verify(token);
        if(decoded == -1){
            res.status(500).send({
                message:"token error"
            });
        }else{
            
            let showingQuery = `SELECT content, star, img, idx AS rIdx FROM NONGHWAL.review WHERE review.userIdx = ? AND review.scheIdx = ?`;
            let showingResult = await db.queryParamArr(showingQuery,[decoded.user_idx, scheIdx]);
            
            for(let a = 0;a<showingResult.length; a++){
                var b = showingResult[a].img;
                var aaa= b.split(",");
                console.log('aasas');
                showingResult[a].img = aaa;
            }
            console.log(showingResult);
            if(showingResult == [])
            {
                res.status(400).send({
                    message : "No reviews"
                });
            }
            
            if(!showingResult){
                res.status(500).send({
                    message:"Internal server error"
                });

            }else{
                res.status(200).send({
                    message:"Sucess To show review INFO",
                    data : showingResult[0]
                });
            }
        }
        
    }


});

module.exports = router;
