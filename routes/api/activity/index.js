const express = require('express');
const router = express.Router();
const db = require('../../../module/db');
const jwt = require('../../../module/jwt');
const moment = require('moment');



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
            




            let dicTime ={};//마감날짜 딕셔너리만들기
            for(let i = 0; i<timeResult.length; i++){
                dicTime[timeResult[i].idx]= timeResult[i].deadline;
                /*if(moment().format("YYYY-M-DD")<timeResult[i].deadline){
                    console.log(timeResult[i].deadline+" "+"seolw");
                }*/
                
            }//키값: 농활스케듈 인덱스, 벨류값: 마감날짜

            let dicMinPerson={};//농활최소인원 딕셔너리 만들기
            for(let j = 0; j<timeResult.length ; j++){
                dicMinPerson[timeResult[j].idx]=timeResult[j].minPerson;
            }//키값: 농활스케듈 인덱스 , 벨류값 : 농활최소인원
            
            let dicSchePerson={};//각 농활 스케쥴에 대한 딕셔너리
            for(let a = 0; a<timeResult.length ; a++){
                dicSchePerson[timeResult[a].idx] = timeResult[a].person;
            }//키값: 농활스케듈 인덱스, 벨류값: 농활스케쥴에 참여한 인원

            for(let b = 0; b<timeResult.length ; b++){//취소 2 , 완료 1, 신청중 0
                if(dicTime[timeResult[b].idx]>moment().format("YYYY-M-DD")){//데드라인 안 지났을 때
                    if(dicSchePerson[timeResult[b].idx]>dicMinPerson[timeResult[b].idx]){//인원 넘었을 때
                        console.log("success"+timeResult[b].idx);
                        var stateQuery1 = `UPDATE activity SET state = ? WHERE userIdx = ? AND scheIdx = ?`;
                        var stateResult1 = await db.queryParamArr(stateQuery1,[0,decoded.user_idx,timeResult[b].idx]);
                    //
                    }
                    else{//안 넘었을 때
                        var stateQuery = `UPDATE activity SET state = ? WHERE userIdx = ? AND scheIdx = ?`;
                        var stateResult = await db.queryParamArr(stateQuery,[0,decoded.user_idx,timeResult[b].idx]);
                        
                    }
                    
                }
                else{//지났을 때
                    if(dicSchePerson[timeResult[b].idx]>dicMinPerson[timeResult[b].idx]){//인원이 넘었을 때
                        
                        var stateQuery2 = `UPDATE activity SET state = ? WHERE userIdx = ? AND scheIdx = ?`;
                        var stateResult2 = await db.queryParamArr(stateQuery2,[1,decoded.user_idx,timeResult[b].idx]);
                        
    
                    }
                    else{//인원이 안 넘었을 때
                        console.log("fail"+timeResult[b].idx);
                        var stateQuery2 = `UPDATE activity SET state = ? WHERE userIdx = ? AND scheIdx = ?`;
                        var stateResult2 = await db.queryParamArr(stateQuery2,[2,decoded.user_idx,timeResult[b].idx]);
                        
                    }
                }              
            }
            


            

            let activityQuery = `SELECT date_format(s.startDate, "%Y-%c-%d") AS startDate,date_format(s.endDate, "%Y-%c-%d") AS endDate , 
            f.addr, n.period, n.name, a.state, n.price,
            abs(n.personLimit - s.person) as currentPerson,
            s.person, n.personLimit, s.idx
            FROM NONGHWAL.activity AS a, NONGHWAL.farm AS f, NONGHWAL.schedule AS s, NONGHWAL.nh AS n, NONGHWAL.user AS u
            WHERE a.scheIdx = s.idx AND s.nhIdx = n.idx AND n.farmIdx = f.idx
            AND a.userIdx = u.idx AND u.idx = ?`;
            let totalQuery = `SELECT COUNT(a.scheIdx) AS tcount, SUM(n.volunTime) AS ttime 
            FROM NONGHWAL.activity AS a, NONGHWAL.schedule AS s, NONGHWAL.nh AS n, NONGHWAL.user AS u 
            WHERE a.scheIdx = s.idx AND s.nhIdx = n.idx AND a.userIdx = u.idx AND u.idx =? AND a.state= ?;`
            let totalResult = await db.queryParamArr(totalQuery,[decoded.user_idx,1]);
            let activityResult = await db.queryParamArr(activityQuery,[decoded.user_idx]);
            
            let reviewQuery = `SELECT r.scheIdx, r.idx  FROM NONGHWAL.review AS r WHERE r.userIdx = ?`;
            let reviewResult = await db.queryParamArr(reviewQuery,[decoded.user_idx]);
            
            let reviewList = [];
            for(let r = 0; r<reviewResult.length; r++){
                reviewList.push(reviewResult[r].scheIdx);
                // 유저의 활동 중에서 state!
            }
            activityResult.filter((value, pos) => {
                if(value.state == 1){
                    console.log("sese"+value.idx);
                        if(reviewList.includes(value.idx)){//만약 스케듈에 대한 리뷰가 있으면
                            value.rState = 1;
                            
                        }else{//없으면
                            value.rState = 0;
                        }
                }
            });
    





            if(!activityResult&&!totalResult&&!reviewResult){
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

module.exports = router;
