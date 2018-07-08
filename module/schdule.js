const schedule = require('node-schedule');
const db = require('./db');

//반복주기 => 매일 아침 9시
const scheduler = schedule.scheduleJob('*/3 * * * * *', async ()=>{
    console.log(1);
    //실행될 작업
    // 인기농활 만들어서 테이블로 저장하기
    let popul_query1 =
        `DROP table nh_popular`;
    let popul_query2 =
        `CREATE table nh_popular
        SELECT 
            nh.idx, 
            nh.name, 
            nh.price, 
            nh.star, 
            nh.period, 
            nh.addr, 
            substring_index(group_concat(farm_img.img separator ','), ',', 1) as img  
        FROM 
            (SELECT 
                nh.idx, 
                nh.name, 
                nh.price, 
                nh.star, 
                nh.period, 
                farm.addr, 
                farm.idx 
            AS farmIdx
            FROM 
                (SELECT 
                    nh.idx, 
                    nh.name, 
                    nh.price, 
                    nh.star, 
                    nh.period, 
                    nh.farmIdx 
                FROM nh 
                RIGHT JOIN 
                    (SELECT 
                        distinct nhIdx 
                        FROM NONGHWAL.schedule 
                        WHERE deadline > curdate()) as schedule 
                        on schedule.nhIdx = nh.idx) 
                    AS nh, farm 
                    WHERE nh.farmIdx = farm.idx) 
                    AS nh, farm_img 
                    WHERE farm_img.farmIdx = nh.farmIdx 
                    group by idx
                    order by star desc;`;
    let popul_query3 =
        `alter table nh_popular change idx nhIdx int;`;
    let popul_query4 =
        `ALTER TABLE NONGHWAL.nh_popular 
        ADD COLUMN idx INT NOT NULL AUTO_INCREMENT AFTER img,
        ADD PRIMARY KEY (idx);`;

    await db.queryParamNone(popul_query1);
    await db.queryParamNone(popul_query2);
    await db.queryParamNone(popul_query3);
    await db.queryParamNone(popul_query4);

    let new_query1 =
        `DROP table nh_new`;
    let new_query2 =
        `CREATE TABLE nh_new       
       SELECT 
            nh.idx, 
            nh.name, 
            nh.price, 
            nh.star, 
            nh.period, 
            nh.addr,
            
            substring_index(group_concat(farm_img.img separator ','), ',', 1) as img  
        FROM 
            (SELECT 
                nh.idx, 
                nh.name, 
                nh.price, 
                nh.star, 
                nh.period, 
                farm.addr, 
                farm.idx
            AS farmIdx
            FROM 
                (SELECT 
                    nh.idx, 
                    nh.name, 
                    nh.price, 
                    nh.star, 
                    nh.period, 
                    nh.farmIdx,
					nh.wtime
                FROM nh 
                RIGHT JOIN 
                    (SELECT 
                        distinct nhIdx 
                        FROM NONGHWAL.schedule 
                        WHERE deadline > curdate()) as schedule 
                        on schedule.nhIdx = nh.idx) 
                    AS nh, farm 
                    WHERE nh.farmIdx = farm.idx) 
                    AS nh, farm_img 
                    WHERE farm_img.farmIdx = nh.farmIdx 
                    group by idx
                    order by idx desc`;
    let new_query3 =
        `alter table nh_new change idx nhIdx int;`;
    let new_query4 =
        `ALTER TABLE NONGHWAL.nh_new 
        ADD COLUMN idx INT NOT NULL AUTO_INCREMENT AFTER img,
        ADD PRIMARY KEY (idx);`;

    await db.queryParamNone(new_query1);
    await db.queryParamNone(new_query2);
    await db.queryParamNone(new_query3);
    await db.queryParamNone(new_query4);

});

module.exports = scheduler;
