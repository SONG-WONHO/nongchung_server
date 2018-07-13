const fcmServerKey = require('../config/secretKey').fcmSecret;
const apnServerKey = require('../config/secretKey').apnSecret;
const FCM = require('fcm-node');
const apn = require('apn');

/*
notification
notification: 0 ==> 암묵적 데이터
notification: 1 ==> 명시적 데이터
 */

/*
notification: {
title: 'aaa',
body: 'bbb'
};
 */

module.exports = {

    //FCM  구현
    fcm: function fcmFunction (clientToken, status, notification, notifiBody) {

        let push_data;

        //명시적으로 알리고 싶을 때
        if (notification === 1) {

            //푸시 정보
            push_data = {
                //목적지
                to: clientToken,
                //노티피
                notification: notifiBody,
                //우선순위
                priority: "high",
                //패키지이름
                restricted_package_name: "com.youth.farm_volunteering",
                //보낼 데이터
                data: {
                    status: status
                }
            };
        }

        //암시적으로 알리고 싶을 때
        else {
            //푸시 정보
            push_data = {
                //목적지
                to: clientToken,
                //우선순위
                priority: "high",
                //패키지이름
                restricted_package_name: "com.youth.farm_volunteering",
                //보낼 데이터
                data: {
                    status: status
                }
            };
        }

        const fcm = new FCM(fcmServerKey);

        //보내기
        fcm.send(push_data, function (err, response) {

            if (err) {
                console.log("error");
                console.log(err);

            } else {
                console.log("push");
                console.log(response);
            }
        })
    },

    //APNs 구현
    apn: function apnFunction (clientToken, status, notification, notifiBody) {
        //전역정보
        let dev_options = {
            token: {
                key: apnServerKey.key,
                keyId: apnServerKey.keyId,
                teamId: apnServerKey.teamId
            },

            production: false
        };

        let apnProvider = new apn.Provider(dev_options);

        let note = new apn.Notification();

        //명시적으로 알리고 싶을 때
        if (notification === 1) {
            note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
            note.badge = 1;
            note.alert = notifiBody.body;
            note.sound = "ping.aiff";
            note.payload = {'status':status};
            note.topic = "com.nongchung.nongchung";
        }

        //암묵적으로 알리고 싶을 때
        else {
            note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
            note.payload = {'status':status};
            note.topic = "com.nongchung.nongchung";
        }

        apnProvider.send(note, clientToken).then( (result) => {
            console.log(result.failed);
        });
    },

    //Badge 초기화
    apnInitializationBagde: function (clientToken) {

        let dev_options = {
            token: {
                key: apnServerKey.key,
                keyId: apnServerKey.keyId,
                teamId: apnServerKey.teamId
            },

            production: false
        };

        let apnProvider = new apn.Provider(dev_options);
        let note = new apn.Notification();

        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        note.badge = 0;
        note.topic = "com.nongchung.nongchung";

        apnProvider.send(note, clientToken).then( (result) => {
            console.log(result.failed);
        });
    }
};