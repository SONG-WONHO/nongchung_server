const schedule = require('node-schedule');
const apn = require('../module/push').apn;
const emoji = require('node-emoji');
// const moment = require('moment');

let count = 0;

//반복주기 => 매일 아침 6시
const scheduler = schedule.scheduleJob(' 0 */5 * * * *', async ()=>{

    console.log(1);

    switch (count % 5) {

        case 0:
            apn('B9193033982E28D326ECA0C4DFB8ADB2AFEB4A714FF22CF931A0BC88097D6CD5',200, 1, {body:"(광고)"+ emoji.get("strawberry") + "논산 딸기 신청 농활 마감이 얼마남지 않았습니다. 빨리 신청해주세요 !"});
            break;
        case 1:
            apn('B9193033982E28D326ECA0C4DFB8ADB2AFEB4A714FF22CF931A0BC88097D6CD5',200, 1, {body:"(광고)"+ emoji.get("grapes") + "영동 포도 신청 농활 마감이 얼마남지 않았습니다. 빨리 신청해주세요 !"});
            break;
        case 2:
            apn('B9193033982E28D326ECA0C4DFB8ADB2AFEB4A714FF22CF931A0BC88097D6CD5',200, 1, {body:"(광고)"+ emoji.get("pear") + "나주 배 신청 농활 마감이 얼마남지 않았습니다. 빨리 신청해주세요 !"});
            break;
        case 3:
            apn('B9193033982E28D326ECA0C4DFB8ADB2AFEB4A714FF22CF931A0BC88097D6CD5',200, 1, {body:"(광고)"+ emoji.get("watermelon") + "창원 수박 신청 농활 마감이 얼마남지 않았습니다. 빨리 신청해주세요 !"});
            break;
        case 4:
            apn('B9193033982E28D326ECA0C4DFB8ADB2AFEB4A714FF22CF931A0BC88097D6CD5',200, 1, {body:"(광고)"+ emoji.get("apple") + "고창 사과 신청 농활 마감이 얼마남지 않았습니다. 빨리 신청해주세요 !"});
            break;
    }

    count ++;
});

module.exports = scheduler;