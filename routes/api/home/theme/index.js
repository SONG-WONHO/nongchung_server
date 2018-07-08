const express = require('express');
const router = express.Router();
const db = require('../../../../module/db');
const jwt = require('../../../../module/jwt');

router.get('/', async (req, res, next) => {
    let nhTheme = [
        {
            "idx":1,
            "img" :"https://nonghwal.s3.ap-northeast-2.amazonaws.com/user/1531065972519.ab.png"
            
        },
        {
            "idx":2,
            "img":"https://nonghwal.s3.ap-northeast-2.amazonaws.com/user/1531065972519.ab.png"
            
        },
        {
            "idx":3,
            "img":"https://nonghwal.s3.ap-northeast-2.amazonaws.com/user/1531065972519.ab.png"
            
        },
        {
            "idx":4,
            "img":"https://nonghwal.s3.ap-northeast-2.amazonaws.com/user/1531065972519.ab.png"
            
        },
        {
            "idx":5,
            "img":"https://nonghwal.s3.ap-northeast-2.amazonaws.com/user/1531065972519.ab.png"
        }
    ];//테마별 농활 사진 보내주는 더미데이터

    res.status(200).send({
        message: "success To show THEME",
        data:nhTheme
    });
});


module.exports = router;
