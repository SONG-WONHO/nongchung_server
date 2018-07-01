module.exports = {

    //파라미터가 없는 SQL 문
    checkNull :  (value) => {

        for (let v of value) {

            if (v === "") {

                return 1;
            }
        }

        return 0;
    }
};