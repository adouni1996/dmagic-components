"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

window.PUB = window.PUB || {};
//PUB.domain = "http://localhost:3000"
PUB.domain = 'http://test.dmagic.cn';
//PUB.domain = "https://www.dmagic.cn"
PUB.urlUpload = "https://up-z2.qiniup.com"; //七牛云上传地址（域名）
PUB.urlGetQiniuToken = PUB.domain + "/api_third_part/get_qiniu_token?scope=dmagic";
PUB.systemName = "前端学习系统";
PUB.KeySys = "api";
var _systemId = "sys_" + PUB.KeySys;
PUB._systemId = _systemId;

window.FN = window.FN || {};

//函数：{获取规格链id函数}
FN.getIdSpecChian = function (arrSpecSelected) {
    var arrId = arrSpecSelected.map(function (doc) {
        return lodash.get(doc, "objSOp.__id");
    });
    return arrId.sort().join("__");
};

//函数：{获取规格链名称函数}
FN.getNameSpecChian = function (arrSpecSelected) {
    var arrId = arrSpecSelected.map(function (doc) {
        return lodash.get(doc, "objSOp.name");
    });
    return arrId.join(" + ");
};

//函数：{标记不符合条件的组合结果项的函数}
FN.handelCombResult = function (_ref) {
    var listSpecs = _ref.listSpecs,
        arrResult = _ref.arrResult;

    /****************************标记不符合条件的项-START****************************/
    //循环：{规格数组}
    listSpecs.forEach(function (itemEach, index) {
        if (!itemEach.objSpecTerm) return;
        var indexTerm = void 0; //条件规格所在的位置
        var valTerm = void 0; //条件值
        for (var prop in itemEach.objSpecTerm) {
            indexTerm = listSpecs.findIndex(function (doc) {
                return doc.name == prop;
            });
            valTerm = itemEach.objSpecTerm[prop];
        }
        //循环：{组合结果数组}
        arrResult.forEach(function (itemEach) {
            console.log("itemEach[indexTerm].name:", itemEach[indexTerm].name);
            var flag = itemEach[indexTerm].name != valTerm;
            console.log("flag:", flag);
            if (flag) {
                itemEach[index] = { name: "——" };
            }
        });
    });
    return arrResult;
    /****************************标记不符合条件的项-END****************************/
};

//函数：{规格价格列表去重函数}
FN.uniqListSpecPrice = function (listSpecPrice) {
    var listSpecPriceNew = [];
    //循环：{规格价格列表}
    listSpecPrice.forEach(function (itemEach) {
        var obj = listSpecPriceNew.find(function (doc) {
            return doc.id == itemEach.id;
        });
        //如果{000}000
        if (!obj) {
            listSpecPriceNew.push(itemEach);
        }
    });
    return listSpecPriceNew;
};

//变量：{规格列表}
var listSpecs = [{
    __id: "jixing",
    name: "机型",
    options: [{
        "__id": "jixing_1",
        "name": "风管机",
        "imgSrc": "https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=938396482,3800816148&fm=26&gp=0.jpg"
    }, {
        "__id": "jixing_2",
        "name": "挂机",
        "imgSrc": "https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=3038639374,564763994&fm=26&gp=0.jpg"
    }]
}, {
    __id: "pishu",
    name: "匹数",
    options: [{
        __id: "pishu_1",
        name: "1~3匹",
        imgSrc: ""
    }, {
        __id: "pishu_2",
        name: "3匹以上",
        imgSrc: ""
    }]
}];

//变量：{表单数据}
var formData = {
    listSpecs: listSpecs,
    listSpecPrice: [{ "spec0": "风管机", "spec1": "1~3匹", "id": "jixing_1__pishu_1", "price1": 0, "stock": 1 }, { "spec0": "风管机", "spec1": "3匹以上", "id": "jixing_1__pishu_2", "price": 2, "stock": 2 }, { "spec0": "挂机", "spec1": "1~3匹", "id": "jixing_2__pishu_1", "price": 3, "stock": 3 }, { "spec0": "挂机", "spec1": "3匹以上", "id": "jixing_2__pishu_2", "price": 4, "stock": 4 }],
    dictSpecPrice: {
        jixing_1__pishu_1: { price: 1, stock: 1 },
        jixing_1__pishu_2: { price: 2, stock: 2 },
        jixing_2__pishu_1: { price: 3, stock: 3 },
        jixing_2__pishu_2: { price: 4, stock: 4 }
    }

    //#region MIX.goods_cart:商品购物车混入配置
};{
    var _methods;

    var T = void 0;
    MIX.goods_cart = {
        data: function data() {
            return {};
        },

        methods: (_methods = {
            //函数：{000函数}
            aaa: function aaa(xxx) {
                return xxx;
            }
        }, _defineProperty(_methods, "aaa", function aaa(xxx) {
            return xxx;
        }), _defineProperty(_methods, "aaa", function aaa(xxx) {
            return xxx;
        }), _defineProperty(_methods, "aaa", function aaa(xxx) {
            return xxx;
        }), _methods),
        created: function created() {
            T = this;
        },
        mounted: function mounted() {}
    };
}
//#endregion