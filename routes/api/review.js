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

            
            let getReviewListQuery = `SELECT u.img AS uimg, u.name, s.startDate, r.star, r.content, 
            r.img AS rimg FROM user AS u, review AS r, schedule AS s
            WHERE r.scheIdx = s.idx AND u.idx = r.userIdx AND r.scheIdx = ? 
            GROUP BY r.userIdx`

            let getReviewListResult = await db.queryParamArr(getReviewListQuery, [scheIdx]);

            if(!getReviewListResult){
                res.status(500).send({
                    message : "Internal Server Error"
                })
            } else if(getReviewListResult.length < 1){
                res.status(400).send({
                    message : "No Reviews"
                })
            }else{
                let rvImages = new Array();
                let rvList = new Array();

                for(i=0; i<getReviewListResult.length; i++){
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
                    message : "Success to Get ReviewList",
                    rvListInfo : rvList
                    // rvImagesArr : rvImages
                })
            }
        }
    }
});

//활동한 농활 nhIdx에 속해있는 scheIdx 중에서 본인이 활동한 scheIdx에 리뷰를 추가 
router.post('/', upload.array('rImages', 20), async (req, res) => { 
    let token = req.headers.token;

    if(!token){
        res.status(400).send({
            message : "Null Value"
        })
    } else{
        let decoded = jwt.verify(token);
        if(decoded==-1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });
        }else{
            let scheIdx = req.body.scheIdx;

            //정당한 schedule idx인지 검사
            let checkQuery = "SELECT idx FROM schedule WHERE idx = ?"
            
            let checkResult = await db.queryParamArr(checkQuery, [scheIdx]);

            if(!checkResult){
                res.status(500).send({
                    message : "Internal Server Error"
                })
            } else if(checkResult.length<1){
                res.status(400).send({
                    message : "No schedule activity"
                })
            } else{
                let checkDuplicateReviewQuery = "SELECT userIdx, scheIdx FROM review WHERE userIdx = ? AND scheIdx = ?";
                let checkDuplicateReview = await db.queryParamArr(checkDuplicateReviewQuery, [decoded.user_idx, scheIdx]);

                if(!checkDuplicateReview){
                    res.status(500).send({
                        message : "Internal Server Error"
                    })
                } else if(checkDuplicateReview.length >= 1){
                    res.status(400).send({
                        message : "Already wrote Review"
                    })
                } else{
                    let rImages = req.files;
                    let content = req.body.content;
                    let star = req.body.star;

                    let tempArr = new Array();

                    for(i=0; i<rImages.length; i++){
                        tempArr[i] = rImages[i].location;
                    }
                    joinedImages = tempArr.join(',');

                    let insertReviewQuery = `INSERT INTO review (img, userIdx, content, scheIdx, star)
                    VALUES (?, ?, ?, ?, ?)`;

                    let insertReview = await db.queryParamArr(insertReviewQuery, [joinedImages, decoded.user_idx, content, 
                    scheIdx, star]);

                    if(!insertReview){
                        res.status(500).send({
                            message : "Internal Server Error"
                        })
                    } else{
                        res.status(200).send({
                            message : "Success to Review"
                        })
                    }
                }
            }
        }
    }
})

module.exports = router;
