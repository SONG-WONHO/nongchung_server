const express = require('express');
const router = express.Router();

const db = require('../../module/db');
const check = require('../../module/check');
const jwt = require('../../module/jwt');
const upload = require('../../config/s3multer').uploadReviewImage;

//리뷰보기
//해당 농활의 후기 목록을 불러옴
router.get('/', async (req, res, next) => {

    //어떤 스케쥴인지 받기
    let scheIdx = req.query.scheIdx;

    //비어있는 값인지 검증
    if(check.checkNull([scheIdx])) {
        res.status(400).send({
            message: "Null Value"
        })
    }
    //안비어있을 때
    else {

        //정당한 스케줄인 지 검증하기
        let selectQuery = "SELECT nhIdx FROM schedule WHERE idx = ?";
        let selectResult = await db.queryParamArr(selectQuery, [scheIdx]);

        console.log(selectResult);

        if (!selectResult) {
            res.status(500).send({
                message : "Internal Server Error"
            })

        //정당한 스케줄이 아닐때
        } else if (selectResult.length < 1) {
            res.status(400).send({
                message: "No schedule activity"
            })

        //정당한 스케줄이라면?
        } else {
            //스케쥴에 해당하는 농활 인덱스 얻기
            let nhIdx = selectResult[0].nhIdx;
            console.log(nhIdx);
            
            let getReviewListQuery =
                `SELECT uimg, name, date_format(startDate, "%Y-%m-%d") as startDate, star, content, rimg 
                FROM 
                    (SELECT 
                        schedule.idx, startDate, star, content, img AS rimg, userIdx 
                    FROM (select * from schedule WHERE nhIdx = ?) AS schedule 
                    inner join review 
                    ON schedule.idx = review.scheIdx) AS schedule
                LEFT JOIN
                    (SELECT idx AS userIdx,img AS uimg, name FROM user) AS user 
                    ON schedule.userIdx = user.userIdx`;

            let getReviewListResult = await db.queryParamArr(getReviewListQuery, [nhIdx]);

            console.log(getReviewListResult);

            //쿼리수행 중 에러가 있을 때
            if(!getReviewListResult){
                res.status(500).send({
                    message : "Internal Server Error"
                })
            }
            //만약 값이 없다면
            else if(getReviewListResult.length < 1){
                res.status(400).send({
                    message : "No Reviews"
                })
            }
            //값이 있다면
            else{
                let rvImages = [];
                let rvList = [];

                for(let i=0; i<getReviewListResult.length; i++) {
                    rvImages[i] = getReviewListResult[i].rimg.split(',');
                    rvList[i] = {
                        "uimg" : getReviewListResult[i].uimg,
                        "name" : getReviewListResult[i].name,
                        "startDate" : getReviewListResult[i].startDate,
                        "star" : getReviewListResult[i].star,
                        "content" : getReviewListResult[i].content,
                        "rvImages" : rvImages[i]
                    }
                }
                
                res.status(200).send({
                    message : "Success to Get Review List",
                    rvListInfo : rvList
                })
            }
        }
    }
});

//활동한 농활 nhIdx에 속해있는 scheIdx 중에서 본인이 활동한 scheIdx에 리뷰를 추가 
router.post('/', upload.array('rImages', 20), async (req, res) => {

    //토큰 받기
    let token = req.headers.token;

    //토큰이 없다면?
    if(!token){
        console.log("no token");
        res.status(400).send({
            message : "Null Value"
        })
    }
    //토큰이 있을 때
    else{
        let decoded = jwt.verify(token);

        //토큰값에 에러가 있다면?
        if(decoded===-1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });
        }

        //에러가 없을 때
        else{
            let scheIdx = req.body.scheIdx;

            //정당한 schedule idx인지 검사
            let checkQuery = "SELECT idx FROM schedule WHERE idx = ?";
            
            let checkResult = await db.queryParamArr(checkQuery, [scheIdx]);

            //쿼리수행 중 에러가 있을 때
            if(!checkResult){
                res.status(500).send({
                    message : "Internal Server Error"
                })
            }
            //정당하지 않은 스케쥴 인덱스일 때
            else if(checkResult.length<1){
                console.log("no schedule");
                res.status(400).send({

                    message : "No schedule activity"
                })
            }
            //정당한 스케쥴 인덱스일 때
            else{

                //리뷰를 중복해서 쓰는 건지 검사
                let checkDuplicateReviewQuery = "SELECT userIdx, scheIdx FROM review WHERE userIdx = ? AND scheIdx = ?";
                let checkDuplicateReview = await db.queryParamArr(checkDuplicateReviewQuery, [decoded.user_idx, scheIdx]);

                //쿼리 수행중 에러가 있을 때
                if(!checkDuplicateReview){
                    res.status(500).send({
                        message : "Internal Server Error"
                    })
                }
                //중복해서 썼다면?
                else if(checkDuplicateReview.length >= 1){
                    console.log("already");
                    res.status(400).send({
                        message : "Already wrote Review"
                    })
                }
                //중복이 아닐 때
                else{
                    let rImages = req.files;
                    let content = req.body.content;
                    let star = req.body.star;

                    console.log(rImages, content, star);

                    let tempArr = [];

                    for(let i=0; i<rImages.length; i++) {
                        tempArr[i] = rImages[i].location;
                    }
                    let joinedImages = tempArr.join(',');
                    
                    let showingQuery = `SELECT nh.period, date_format(schedule.startDate,"%Y.%m.%d") AS startDate
                    , date_format(schedule.endDate,"%Y.%m.%d") AS endDate
                    FROM NONGHWAL.review, NONGHWAL.schedule, NONGHWAL.nh
                    WHERE review.scheIdx = schedule.idx AND nh.idx = schedule.nhIdx
                    AND review.scheIdx = ?`;

                    let insertReviewQuery =
                        `INSERT INTO review (img, userIdx, content, scheIdx, star) 
                        VALUES (?, ?, ?, ?, ?)`;

                    let insertReview = await db.queryParamArr(insertReviewQuery, [joinedImages, decoded.user_idx, content, scheIdx, star]);
                    let showingResult = await db.queryParamArr(showingQuery, [scheIdx]);
                    
                    //쿼리수행 중 에러가 있을 때
                    if(!insertReview){
                        res.status(500).send({
                            message : "Internal Server Error"
                        })
                    }
                    //에러가 없다면?
                    else{
                        res.status(200).send({
                            message : "Success to Review",
                            data : showingResult
                            
                        })
                    }
                }
            }
        }
    }
});

module.exports = router;
