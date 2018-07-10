const jwt = require('jsonwebtoken');

//secret key import
const secretKey = require('../config/secretKey.js').jwtSecret;

module.exports = {

    sign : function(user_idx) {
        //옵션
        const options = {
            algorithm : "HS256",
            expiresIn : 60 * 60 * 24 * 30 //30 days
        };

        //페이로드
        const payload = {
            user_idx : user_idx
        };

        //토큰 생성
        let token = jwt.sign(payload, secretKey, options);

        //토큰 반환
        return token;
    },

    verify : function(token) {
        let decoded;
        try {
            decoded = jwt.verify(token, secretKey);
        }
        catch(err) {
            if(err.message === 'jwt expired') console.log('expired token');
            else if(err.message === 'invalid token') console.log('invalid token');
        }
        if(!decoded) {
            return -1;
        }else {
            return decoded;
        }
    }
};