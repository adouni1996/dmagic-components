
let _systemId = PUB._systemId;

//#region window.FN函数库
window.FN = {}//存放本站公共函数的对象
//函数：{ajax根据关键词获取关联数据列表的函数}
FN.ajaxlistBykeyword = async function ({ param = {} }) {
    let { data } = await axios({
        //请求接口
        method: "post",
        url: `${PUB.domain}/info/getListBykeyword`,
        data: param
    });
    return data.list;
}

//函数：{分组追加选中数据列表的函数}
FN.ajaxGroupAddSelectData = async function (arr) {
    let { tableData } = this.$refs.listData;
    let docLast = tableData.slice(0); //第一个元素
    let sortStart = lodash.get(docLast, `[0].sort`, 9999);
    let arrDataAdd = arr.map(doc => {
        return {
            sort: ++sortStart,
            _idRel: this.groupId,
            _idRel2: doc._id
        };
    });
    // return;

    let urlAdd = PUB.listCF.list_relation.url.add;
    let ajaxParam = {
        _data: arrDataAdd
    };
    Object.assign(ajaxParam, PUB.listCF.list_relation.paramAddonPublic); //合并公共参数
    let response = await axios({
        //请求接口
        method: "post",
        url: PUB.domain + urlAdd,
        data: ajaxParam //传递参数
    });

    this.$message.success("添加数据成功");
    this.arrSelect2 = []; //清除该数组，否则越积越多
    this.$refs.listData.getDataList(); //列表更新
}



//函数：{初始化处理arrLookup数组函数}
FN.initArrLookup = async function () {
    //****列表查询arrLookup数组由3部分组成：固定的查询，计分板的筛选参数，上方表单的筛选参数
    let arrLookupFromScore = this.arrLookup || []; //来自计分板筛选的arrLookup
    let formDataSearch = lodash.cloneDeep(this.formDataSearch); //深拷贝
    util.clearObj(formDataSearch); //调用：{清除对象中的空属性（null,undefined,空格等）}
    let isValid = util.isNotEmptyObj(formDataSearch); //调用：{判断是否为非空对象的函数}
    let arrLookupSearch = [];
    if (isValid) {
        //如果是非空对象
        arrLookupSearch.push({
            $match: {
                ...formDataSearch //**** */
            }
        });
    }

    //补充联合查询参数，很复杂！！！！

    //固定的查询部分
    let arrLookupFixed = [
        {
            //联合目标数据表
            $lookup: {
                from: "sheet232",
                localField: "_idRel2",
                foreignField: "_id",
                as: "relDoc2"
            }
        },
        //使用$project重新组装，此时targetDoc是数组形式
        {
            $project: {
                _id: 1,
                _idRel: 1,
                _idRel2: 1,
                sort: "$_data.sort", //序号获取
                targetDoc: "$relDoc2._data"
            }
        },
        //将targetDoc展开
        {
            $unwind: "$targetDoc"
        },
        //使用$project重新组装
        {
            $project: {
                _id: 1,
                _idRel: 1,
                _idRel2: 1,
                sort: 1, //序号获取
                title: "$targetDoc.title",
                link: "$targetDoc.link",//链接地址
                importance: "$targetDoc.importance",
                category: "$targetDoc.category",
                difficulty: "$targetDoc.difficulty",
                taskType: "$targetDoc.taskType",
                prior: "$targetDoc.prior",
                complete: "$targetDoc.complete",
                personCharge: "$targetDoc.personCharge",
                predictTime: "$targetDoc.predictTime",
                actualTime: "$targetDoc.actualTime",

            }
        }
    ];

    let arrLookup = [
        ...arrLookupFixed,
        ...arrLookupFromScore,
        ...arrLookupSearch
    ];
    this.$set(this.cfList.objParamAddon, "arrLookup", arrLookup);

    //****计分板统计分数需要的arrLookup数组由2部分组成：固定的查询，上方表单的筛选参数
    this.arrLookupScore = [...arrLookupFixed, ...arrLookupSearch];
}

//#endregion


//#region 公共字典对象配置
PUB.objDictArr = {
    taskType: [
        { value: 1, label: "新需求" },
        { value: 2, label: "bug" },
        { value: 3, label: "其他" }
    ],
    difficulty: [
        { value: 1, label: "简单" },
        { value: 2, label: "一般" },
        { value: 3, label: "困难" },
        { value: 4, label: "很难" }
    ],
    prior: [
        { value: 1, label: "很高" },
        { value: 2, label: "高" },
        { value: 3, label: "中" },
        { value: 4, label: "低" }
    ],
    complete: [
        { value: 0, label: "0%" },
        { value: 0.1, label: "10%" },
        { value: 0.2, label: "20%" },
        { value: 0.3, label: "30%" },
        { value: 0.4, label: "40%" },
        { value: 0.5, label: "50%" },
        { value: 0.6, label: "60%" },
        { value: 0.7, label: "70%" },
        { value: 0.8, label: "80%" },
        { value: 0.9, label: "90%" },
        { value: 1, label: "100%" },
    ],
    complete2: [
        { value: 1, label: "未开始" },//complete==0
        { value: 2, label: "进行中" },//complete>0&&complete>1
        { value: 3, label: "已完成" },//complete>0&&complete>1
    ],
}
//{"P7": Im,"P5":{ $gte: DataStart,$lte: DataEnd } }
PUB.dict = {};//公共数据字典对象，里面会有多个子数据字典对象
//for of循环遍历对象，for of不能直接处理对象，本质上是同个Object.keys拼装一个新数组进行辅助
for (var key of Object.keys(PUB.objDictArr)) {
    PUB.dict[key] = {}
    let arrOpt = PUB.objDictArr[key];
    arrOpt.forEach(itemEach => {//循环：{000数组}
        PUB.dict[key][itemEach.value] = itemEach
    })
}
/**
    * @name 获取数据字典值函数
    * @param dictName字典名，value值
    */
PUB.formatterDict = function (dictName, value) {
    return lodash.get(PUB.dict, `${dictName}.${value}.label`);
}
//#endregion


//#region 其他公共变量
//公共的列表对象
PUB.listCF = {}
PUB.listUrl = {
    list: `/info/getCommonList`, //列表接口
    add: "/info/commonAdd", //新增接口
    modify: "/info/commonModify", //修改接口
    detail: "/info/commonDetail",
    delete: "/info/commonDelete" //删除接口
}
PUB.listCFCommon = {
    url: PUB.listUrl,
    columnOperate: { "min-width": 160 },
    //列表单项操作按钮的配置
    singleBtns: {
        addon: [
            util.cfList.sBtns.detail,
            util.cfList.sBtns.modify,
            util.cfList.sBtns.delete,
        ]
    },

}
let sBtnDetail = {
    uiType: "link",
    text: "详情",
    target: "_blank",
    //地址格式函数
    urlFormatter: function (row) {
        return `#/detail_data?dataId=${row._id}`;
    }
}



let sBtnLink = {
    uiType: "link",
    text: "打开链接",
    title: "打开链接",
    target: "_blank",
    urlFormatter: function (row) {
        return `${row.link}`;
    },
    cfElBtn: {
        circle: true,
        icon: "el-icon-link"
    }
}
PUB.singleBtns_copy_detail = {
    addon: [
        ...util.cfList.sBtns.arrAllBtns,
        sBtnDetail,
    ]
}

PUB.singleBtns_copy_detail_sort = {
    addon: [
        ...util.cfList.sBtns.arrAllBtns,
        ...util.cfList.sBtns.arrSortBtns,
        util.cfList.sBtns.detailEntity,
    ]
}




PUB.listCFCommon2 = {
    url: PUB.listUrl,
    columnOperate: { "min-width": 230 },
    //列表单项操作按钮的配置
    singleBtns: PUB.singleBtns_copy_detail,
    //objParamAddon列表接口的附加参数

}

PUB.singleBtns_copy_link = {
    addon: [
        ...util.cfList.sBtns.arrAllBtns,

        sBtnLink,
    ]
}

PUB.singleBtns_copy_link_sort = {
    addon: [
        ...util.cfList.sBtns.arrAllBtns,
        ...util.cfList.sBtns.arrSortBtns,
        sBtnLink,
    ]
}



PUB.listCFCommon3 = {
    url: PUB.listUrl,
    columnOperate: { "min-width": 230 },
    //列表单项操作按钮的配置
    singleBtns: PUB.singleBtns_copy_link,
    //objParamAddon列表接口的附加参数

}
PUB.singleBtns4 = {
    addon: [
        ...util.cfList.sBtns.arrAllBtns,
        sBtnDetail,
        sBtnLink,
    ]
}
//第四套-有详情和链接按钮
PUB.listCFCommon4 = {
    url: PUB.listUrl,
    columnOperate: { "min-width": 290 },
    //列表单项操作按钮的配置
    singleBtns: PUB.singleBtns4,

}
//函数：{补充熟悉度ajax配置（动态数据字典）函数}
window.setFamiliarityAjaxCF = function (listCF, idKey = "_id") {
    util.setObjDefault(listCF, { dynamicDict: [] });
    let dict = {
        ajax: {
            param: { _systemId, _dataType: "familiarity", findJson: { userId: PUB.$sys.userId }, },
            url: "/info/getCommonList",
        },
        populateColumn: "familiarityDoc",
        idColumn: idKey,
        idColumn2: "_idRel"
    }
    listCF.dynamicDict.push(dict)
}
//#endregion

//#region MIX混入

MIX.listGroupData = {
    props: {
        groupDoc: {},
        groupId: {},
        dataType: {
            default: "note"
        },//数据类型

    },
    data() {
        return {
            readyAddDialogEntity: true,//是否准备好新增实体的弹窗组件-用于复制时重现初始化
            cfAddDialogEntity: {
              copyId: "5e84ae2520a342107c0ad688",
              listType: "common", //通用型列表-影响urlAdd
              cfFormAdd: { paramAddonInit: { _systemId: "sys_api", _dataType: this.dataType } }
            },
            //编辑实体数据弹窗配置
            cfEditDialogEntity: {
                listType: "common", //通用型列表-影响urlModify
                cfFormModify: {
                    paramAddonInit: { _id: "", _systemId: PUB._systemId, _dataType: this.dataType }
                }
            },
            arrSelect2: [],
            cfSelectList2: {
                hideCollection: true,
                dataName: lodash.get(DYDICT, `dataType.${this.dataType}.label`),
                valueKey: "_id",
                labelKey: "title",
                pageName: "tangball_article",
                multiple: true, //多选
                //需要保留的集合字段
                selectJson: { _id: 1, title: 1 },
                cfList: util.deepCopy(PUB.listCF[`list_${this.dataType}`])
            },
            //查询表单配置
            cfFormSearch: {
                inline: true, size: "mini", formItems: [F_ITEMS.importance],
                btns: [{ text: "查询", event: "submit", type: "primary", size: "mini" }]
            },
            formDataSearch: {},
            ready: false,
            cfList: util.deepCopy(PUB.listCF[`detail_group_${this.dataType}`]),
            arrLookupScore: null //计分板需要联合查询配置数组-
        };
    },
    computed: {
        //用于监听变化
        arrLookup: function () {
            return this.$store.state.arrLookup[this.cfList.listIndex];
        }
    },
    methods: {
        //函数：{单条数据操作事件}-临时
        async singleEvent(actionType, doc) {
            let arrNeedRefresh = ["up", "down", "top", "bottom"]
            if (arrNeedRefresh.includes(actionType)) {//如果是排序类操作
                await util.ajaxGroupDataSort(actionType, doc);
                this.$refs.listData.getDataList(); //列表更新
            }
            let { _idRel2 } = doc
            if (actionType == "edit_entity") {//如果是编辑实体数据

                this.cfEditDialogEntity.cfFormModify.paramAddonInit._id = _idRel2//***修改数据id
                this.cfEditDialogEntity.visible = true;//打开弹窗
            } else if (actionType == "copy_entity") {
                console.log(`doc._id:${doc._id}`);
                this.cfAddDialogEntity.copyId = _idRel2;
                this.readyAddDialogEntity = false;
                await this.$nextTick();//延迟到视图更新
                this.readyAddDialogEntity = true;



                this.cfAddDialogEntity.visible = true;//打开弹窗

            }
        },
        bacthEvent(actionType, doc) {
            if (actionType == "add_entity") {//如果{事件类型}是新增实体
                this.cfAddDialogEntity.visible = true;//打开弹窗
            }
        },
        async afterAddEntity(doc) {
            this.ajaxGroupAddData([doc])//调用：{000函数}
        },
        //函数：{选择并添加数据后的ajax操作函数}
        afterSelect: FN.ajaxGroupAddSelectData,
        ajaxGroupAddData: FN.ajaxGroupAddSelectData,//函数：{添加数据到分组的ajax操作函数}
        //函数：{初始化处理arrLookup数组函数}
        initArrLookup: FN.initArrLookup,
        //函数：{查询表单提交的回调函数}
        async searchList() {
            this.initArrLookup(); //调用：{初始化处理arrLookup数组函数}
            await this.$nextTick(); //延迟到视图更新
            this.$refs.listData.getDataList(); //列表更新
        },
        //函数：{列表查询后的回调函数}
        async afterSearch(list) {

            //设置id数组
            this.$refs.scorePanel.ajaxGetScore(); //调用：{ajax获取分数函数}
            if (this.$refs.scorePanel.focusId == undefined) {
                //如果没有筛选熟悉度（这里的触发机制还需进一步优化，没有必要一直调用）
                this.updateGroupCountData(); //调用：{更新当前分组的数据量的函数}
            }
        },
        //函数：{更新当前分组的数据量的函数}
        async updateGroupCountData() {
            let urlModify = PUB.listCF.list_group.url.modify;
            let ajaxParam = {
                _id: this.groupId, _data: { countData: this.$refs.listData.allCount } //获取列表的数据总量
            };
            Object.assign(ajaxParam, PUB.listCF.list_group.paramAddonPublic); //合并公共参数
            let response = await axios({
                //请求接口
                method: "post", url: PUB.domain + urlModify,
                data: ajaxParam //传递参数
            });
        },
        //函数：{增加排除当前分组数据的查询条件的函数}
        async excludeCurrGroup() {
            /****************************补充排除当前所属分组的查询参数-START****************************/
            let { cfList } = this.cfSelectList2;
            cfList.objParamAddon = cfList.objParamAddon || {};
            cfList.objParamAddon.findJson = cfList.objParamAddon.findJson || {};
            let findjsonAdd = {
                "$or": [{
                    "_data.arrGroup": {
                        "$elemMatch": {
                            "_idRel": {
                                "$ne": this.groupId//不属于当前分组
                            }
                        }
                    }
                }, {
                    "_data.arrGroup": {
                        "$exists": false//分组不存在
                    }
                }, {
                    "_data.countGroup": 0//分组数为0
                }]
            }

            cfList.objParamAddon.findJson = { ...cfList.objParamAddon.findJson, ...findjsonAdd };
            /****************************补充排除当前所属分组的查询参数-END****************************/
        },

    },
    async created() {

        this.excludeCurrGroup()//调用：{增加排除当前分组数据的查询条件的函数}

        /****************************弱化新增按钮-START****************************/
        let { addon } = this.cfList.batchBtns;
        let itemAdd = addon.find(doc => doc.eventType == "add");
        Object.assign(itemAdd, { text: "新增关联Id", cfElBtn: {} }); //合并对象-

        /****************************弱化新增按钮-END****************************/


        this.cfList.customDetail = true; //开启自定义详情弹窗
        this.$set(this.cfList.objParamAddon.findJson, "_idRel", this.groupId);
        this.initArrLookup(); //调用：{初始化处理arrLookup数组函数}
        this.ready = true;
        //补充熟悉度ajax配置（动态数据字典）,注意要传_idRel2
        window.setFamiliarityAjaxCF(this.cfList, "_idRel2");


        /****************************补充编辑实体数据按钮-START****************************/
        let sBtnEditEntity = { eventType: "edit_entity", text: "编辑", };
        this.cfList.singleBtns.addon.push(sBtnEditEntity);
        /****************************补充编辑实体数据按钮-END****************************/

    }
}
//#endregion



//#region 【多】标准列表页配置
//#region 管理员列表页
{
    let _dataType = "admin";

    PUB.listCF.list_admin = {
        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "list_admin", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦
        threeTitle: "管理员", //面包屑2级菜单
        ...PUB.listCFCommon2,//展开公共配置
        //objParamAddon列表接口的附加参数
        objParamAddon: {
            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },


        //-------详情字段数组-------
        detailItems: ["Id", "userName", "passWord"],
        //-------列配置数组-------
        columns: ["Id", "userName", "passWord", "nickName", "role"],
        //-------筛选表单字段数组-------
        searchFormItems: ["Id"],
        //-------新增、修改表单字段数组-------
        formItems: ["userName", "passWord", "nickName", "role"],


    }
    util.reformCFListItem(PUB.listCF.list_admin)
}
//#endregion

//#region 所有数据列表页
{

    let _dataType = "$all";

    PUB.listCF.list_all = {
        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "list_all", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦
        breadcrumb: [
            { value: "首页", path: "#/listHome" },
            { value: "所有数据" }
        ],
        ...PUB.listCFCommon2,//展开公共配置
        objParamAddon: {
            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },


        //-------详情字段数组-------
        detailItems: ["title", "desc"],
        //-------列配置数组-------
        columns: ["title_fixed", "desc"],
        //-------筛选表单字段数组-------
        searchFormItems: ["title_search"],
        //-------新增、修改表单字段数组-------
        formItems: ["title", "desc"],


    }
    util.reformCFListItem(PUB.listCF.list_all)
}
//#endregion

//#region 文章分类列表页
{

    let _dataType = "article_category";
    PUB.listCF.list_article_category = {
        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "list_article_category", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦
        threeTitle: "文章分类", //面包屑2级菜单
        ...PUB.listCFCommon2,//展开公共配置
        //objParamAddon列表接口的附加参数
        objParamAddon: {
            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },

        //-------详情字段数组-------
        detailItems: ["category_name", "category_remark"],
        //-------列配置数组-------
        columns: ["category_name", "category_remark"],
        //-------筛选表单字段数组-------
        searchFormItems: ["category_name"],
        //-------新增、修改表单字段数组-------
        formItems: ["category_name", "category_remark"],


    }
    util.reformCFListItem(PUB.listCF.list_article_category)
}
//#endregion

//#region 文章列表页
{

    let _dataType = "article";
    PUB.listCF.list_article = {
        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "list_article", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦
        threeTitle: "文章", //面包屑2级菜单
        ...PUB.listCFCommon2,//展开公共配置
        //objParamAddon列表接口的附加参数
        objParamAddon: {
            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },

        //-------详情字段数组-------
        detailItems: ["title", "desc"],
        //-------列配置数组-------
        columns: ["title_fixed", "desc"],
        //-------筛选表单字段数组-------
        searchFormItems: ["title_search"],
        //-------新增、修改表单字段数组-------
        formItems: ["title", "desc", "detail"],


    }
    util.reformCFListItem(PUB.listCF.list_article)
}
//#endregion

//#region 数据类型列表页
{

    let _dataType = "data_type";

    PUB.listCF.list_data_type = {
        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "list_data_type", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦
        breadcrumb: [
            { value: "首页", path: "#/listHome" },
            { value: "数据类型" }
        ],
        ...PUB.listCFCommon2,//展开公共配置
        //objParamAddon列表接口的附加参数
        objParamAddon: {
            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },

        //-------详情字段数组-------
        detailItems: ["_id", "dataTypekey", "title", "desc"],
        //-------列配置数组-------
        columns: ["title_fixed", "dataTypekey", "desc"],
        //-------筛选表单字段数组-------
        searchFormItems: ["title_search", "dataTypekey"],
        //-------新增、修改表单字段数组-------
        formItems: ["dataTypekey", "title", "desc"],


    }
    util.reformCFListItem(PUB.listCF.list_data_type)
}
//#endregion

//#region 分组列表页
{

    let _dataType = "group";

    PUB.listCF.list_group = {
        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "list_group", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦
        breadcrumb: [
            { value: "首页", path: "#/listHome" },
            { value: "分组" }
        ],
        ...PUB.listCFCommon,//展开公共配置
        //列表单项操作按钮的配置
        singleBtns: {
            addon: [
                ...util.cfList.sBtns.arrAllBtns,
                {
                    uiType: "link",
                    text: "分组详情",
                    target: "_blank",
                    url: "#/detail_group?groupId=" //这里要配置好参数名，内部会把参数加进来
                }
            ]
        },
        objParamAddon: {
            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },

        //-------详情字段数组-------
        detailItems: ["_id", "title", "alias", "desc", "group_dataType"],
        //-------列配置数组-------
        columns: ["title_fixed", "_id", "alias", "desc", "group_dataType"],
        //-------筛选表单字段数组-------
        searchFormItems: ["title_search", "group_dataType", "alias"],
        //-------新增、修改表单字段数组-------
        formItems: ["title", "alias", "group_dataType", "desc"],


    }
    util.reformCFListItem(PUB.listCF.list_group)
}
//#endregion

//#region 笔记分类列表页
{

    let _dataType = "note_category";
    PUB.listCF.list_note_category = {
        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "list_note_category", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦
        breadcrumb: [
            { value: "首页", path: "#/listHome" },
            { value: "笔记分类" }
        ],
        ...PUB.listCFCommon2,//展开公共配置
        //objParamAddon列表接口的附加参数
        objParamAddon: {
            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },


        //-------详情字段数组-------
        detailItems: ["title", "desc", "category"],
        //-------列配置数组-------
        columns: ["title_fixed", "desc", "category"],
        //-------筛选表单字段数组-------
        searchFormItems: ["title_search"],
        //-------新增、修改表单字段数组-------
        formItems: ["title", "desc"],


    }
    util.reformCFListItem(PUB.listCF.list_note_category)
}
//#endregion

//#region 笔记列表页
{

    let _dataType = "note";
    PUB.listCF.list_note = {
        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "list_note", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦
        breadcrumb: [
            { value: "首页", path: "#/listHome" },
            { value: "笔记" }
        ],
        ...PUB.listCFCommon2,//展开公共配置
        //批量操作按钮的配置
        batchBtns: {
            addon: [
                util.cfList.bBtns.add,
                util.cfList.bBtns.delete,
                { uiType: "slot", slot: "slot_in_toolbar" }
            ],
        },
        //dynamicDict动态数据字典配置
        dynamicDict: [
            DYDICT.note_category
        ],
        //objParamAddon列表接口的附加参数
        objParamAddon: {
            _systemId,
            _dataType,
            //传入联表查询参数
            arrLookup: []
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },

        //操作列配置
        columnOperate: {
            "min-width": 210
        },


        //-------详情字段数组-------
        detailItems: ["title", "keyword", "detail", "desc", "category", "importance", "difficulty", "_id", "demoList", "note_linkList", "note_noteList"],
        //-------列配置数组-------
        columns: ["_id", "title_fixed_edit", "countGroup", "keyword_edit", "familiarity_select", "importance_edit", "difficulty_edit", "category_multiple", "demoList"],
        //-------筛选表单字段数组-------
        searchFormItems: ["title_search", "note_category", "importance", "difficulty", "countGroup"],
        //-------新增、修改表单字段数组-------
        formItems: ["title", "link", "importance_radio", "difficulty_radio", "keyword", "note_category", "desc", "detail"],


    }
    util.reformCFListItem(PUB.listCF.list_note)
}
//#endregion

//***注意位置-补充表单字段，因为这个字段需要继承PUB.listCF.list_note
F_ITEMS.relNoteList = {
    ...D_ITEMS.relNoteList,
    type: "select_list_data",
    cfSelectList: {
        //选择列表配置
        dataName: "笔记",
        valueKey: "_id",
        labelKey: "title",
        multiple: true, //多选
        //需要保留的集合字段
        selectJson: {
            _id: 1,
            title: 1
        },
        cfList: util.deepCopy(PUB.listCF.list_note)
    }
};

//#region 关系列表页
{

    let _dataType = "relation";

    PUB.listCF.list_relation = {
        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "list_relation", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦
        breadcrumb: [
            { value: "首页", path: "#/listHome" },
            { value: "关系数据" }
        ],
        ...PUB.listCFCommon2,//展开公共配置
        objParamAddon: {
            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },


        //-------详情字段数组-------
        detailItems: ["_id", "_idRel", "_idRel2", "sort"],
        //-------列配置数组-------
        columns: ["_id", "_idRel", "_idRel2", "sort"],
        //-------筛选表单字段数组-------
        searchFormItems: ["_idRel", "_idRel2"],
        //-------新增、修改表单字段数组-------
        formItems: ["_idRel", "_idRel2", "sort"],


    }
    util.reformCFListItem(PUB.listCF.list_relation)
}
//#endregion
//#region 角色列表页
{
    let _dataType = "role";
    PUB.listCF.list_role = {
        // powerPath: "systemManage.list_role",//权限路径
        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "list_role", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦
        threeTitle: "角色", //面包屑2级菜单
        ...PUB.listCFCommon2,//展开公共配置
        objParamAddon: {
            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },

        //-------详情字段数组-------
        detailItems: ["Id", "roleName", "rolePower"],
        //-------列配置数组-------
        columns: ["Id", "roleName", "rolePower"],
        //-------筛选表单字段数组-------
        searchFormItems: ["Id"],
        //-------新增、修改表单字段数组-------
        formItems: ["roleName", "rolePower"],


    }
    util.reformCFListItem(PUB.listCF.list_role)
}
//#endregion
//#region 网址列表页
{

    let _dataType = "url";

    PUB.listCF.list_url = {
        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "list_url", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦
        breadcrumb: [
            { value: "首页", path: "#/listHome" },
            { value: "网址" }
        ],
        ...PUB.listCFCommon3,//展开公共配置
        //objParamAddon列表接口的附加参数
        // singleBtns:PUB.singleBtns_copy_link_sort,
        objParamAddon: {
            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },


        //-------详情字段数组-------
        detailItems: ["title", "desc", "link"],
        //-------列配置数组-------
        columns: ["title_fixed", "_id", "desc", "link"],
        //-------筛选表单字段数组-------
        searchFormItems: ["title_search"],
        //-------新增、修改表单字段数组-------
        formItems: ["title", "link", "desc", "album"],


    }
    util.reformCFListItem(PUB.listCF.list_url)
}
//#endregion

//#region 视频列表页
{

    let _dataType = "vedio";

    PUB.listCF.list_vedio = {
        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "list_vedio", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦
        breadcrumb: [
            { value: "首页", path: "#/listHome" },
            { value: "教学视频" }
        ],
        ...PUB.listCFCommon2,//展开公共配置

        objParamAddon: {
            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },


        //-------详情字段数组-------
        detailItems: ["title", "desc", "link", "vedio", "detail"],
        //-------列配置数组-------
        columns: ["title_fixed", "keyword_edit", "countGroup", "_id", "desc", "vedio", "link"],
        //-------筛选表单字段数组-------
        searchFormItems: ["title_search", "countGroup"],
        //-------新增、修改表单字段数组-------
        formItems: ["title", "keyword", "desc", "link", "vedio"],


    }
    util.reformCFListItem(PUB.listCF.list_vedio)
}
//#endregion





//变量：{分组数据列表的单项操作按钮配置}
PUB.singleBtns_list_group_data = {
    addon: [
        util.cfList.sBtns.copyEntity,
        util.cfList.sBtns.delete,
        ...util.cfList.sBtns.arrSortBtns,
        util.cfList.sBtns.detailEntity,
    ]
}


PUB.cfListGPublic = {

    isShowBreadcrumb: false, //面包屑
    isShowSearchForm: false, //查询表单-
    idKey: "_id", //键名
    pageSize: 20,
    focusMenu: false, //进行菜单聚焦
    ...PUB.listCFCommon3, //展开公共配置
    singleBtns: PUB.singleBtns_list_group_data,
    batchBtns: {
        addon: [
            { uiType: "slot", slot: "slot_btn_select" },
            util.cfList.bBtns.addEntity,
            util.cfList.bBtns.add,
            util.cfList.bBtns.delete,
        ],
    },
    sortJsonDefault: { "sort": -1 },
    findJsonDefault: {},

}



//#region 【多】分组列表配置函数

{

    let _dataType = "relation";



    PUB.listCF.detail_group_group = {
        ...PUB.cfListGPublic,
        listIndex: "detail_group_group", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦
        ...PUB.listCFCommon,//展开公共配置
        //批量操作按钮的配置
        batchBtns: {

            addon: [
                { uiType: "slot", slot: "slot_btn_select" },
                util.cfList.bBtns.add,

                util.cfList.bBtns.delete,
                { uiType: "slot", slot: "slot_in_toolbar" }
            ],
        },
        //列表单项操作按钮的配置
        singleBtns: {
            addon: [
                // util.cfList.sBtns.detail,
                util.cfList.sBtns.modify,
                util.cfList.sBtns.copy,
                util.cfList.sBtns.delete,

                ...util.cfList.sBtns.arrSortBtns,
                {
                    uiType: "link",
                    text: "查看分组",
                    target: "_blank",
                    //地址格式函数
                    urlFormatter: function (row) {
                        return `#/detail_group?groupId=${row._idRel2}`;
                    },
                }
            ]
        },
        sortJsonDefault: {
            "sort": -1
        },
        findJsonDefault: {

        },
        objParamAddon: {
            findJson: {},

            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },
        //dynamicDict动态数据字典配置
        dynamicDict: [
            DYDICT.note_category
        ],



        //-------详情字段数组-------
        detailItems: ["title", "desc", "countData", "_id", "_idRel", "_idRel2", "sort"],
        //-------列配置数组-------
        columns: ["title_fixed", "countData", "myScore", "group_dataType", "desc", "sort"],
        //-------筛选表单字段数组-------
        searchFormItems: [],
        //-------新增、修改表单字段数组-------
        formItems: ["_idRel", "_idRel2", "sort"],





    }
    //#endregion
    util.reformCFListItem(PUB.listCF.detail_group_group)

}
//#endregion

//#region 分组下的笔记列表页
{

    let _dataType = "relation";

    PUB.listCF.detail_group_note = {
        isShowBreadcrumb: false,//面包屑
        isShowSearchForm: false,//查询表单-这个去掉会筛选所有数据

        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "detail_group_note", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦
        ...PUB.listCFCommon,//展开公共配置
        //批量操作按钮的配置
        batchBtns: {

            addon: [
                { uiType: "slot", slot: "slot_btn_select" },
                util.cfList.bBtns.add,
                util.cfList.bBtns.delete,
                { uiType: "slot", slot: "slot_in_toolbar" }
            ],
        },
        //列表单项操作按钮的配置
        singleBtns: PUB.singleBtns_copy_detail_sort,
        sortJsonDefault: {
            "sort": -1
        },
        // findJsonDefault: {

        // },
        objParamAddon: {
            findJson: {},//用了这个就不要使用findJsonDefault
            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },
        //dynamicDict动态数据字典配置
        dynamicDict: [
            DYDICT.note_category
        ],



        //-------详情字段数组-------
        detailItems: ["title", "detail", "desc", "category", "importance", "_id", "_idRel", "_idRel2", "sort"],
        //-------列配置数组-------
        columns: ["title_fixed", "familiarity_select", "importance", "difficulty", "category_multiple", "sort"],
        //-------筛选表单字段数组-------
        searchFormItems: ["importance"],
        //-------新增、修改表单字段数组-------
        formItems: ["_idRel", "_idRel2", "sort"],





    }
    util.reformCFListItem(PUB.listCF.detail_group_note)

}
//#endregion
//#region 分组下的网址列表页
{

    let _dataType = "relation";



    PUB.listCF.detail_group_url = {
        isShowBreadcrumb: false,//面包屑
        isShowSearchForm: false,//查询表单
        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "detail_group_url", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦

        // ...PUB.listCFCommon,//展开公共配置
        ...PUB.listCFCommon3,//展开公共配置
        singleBtns: PUB.singleBtns_copy_link_sort,
        batchBtns: {
            addon: [
                { uiType: "slot", slot: "slot_btn_select" },
                util.cfList.bBtns.add,
                util.cfList.bBtns.delete,

            ],
        },
        sortJsonDefault: {
            "sort": -1
        },
        findJsonDefault: {

        },
        objParamAddon: {
            findJson: {},

            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },
        //dynamicDict动态数据字典配置
        dynamicDict: [
            DYDICT.note_category
        ],


        //-------详情字段数组-------
        detailItems: ["title", "desc", "countData", "_id", "_idRel", "_idRel2", "sort"],
        //-------列配置数组-------
        columns: ["title_fixed", "_id", "desc", "link", "sort"],
        //-------筛选表单字段数组-------
        searchFormItems: [],
        //-------新增、修改表单字段数组-------
        formItems: ["_idRel", "_idRel2", "sort"],






    }

    util.reformCFListItem(PUB.listCF.detail_group_url)

}
//#endregion

//#region 分组下的视频列表页
{
    let _dataType = "relation";


    PUB.listCF.detail_group_vedio = {
        isShowBreadcrumb: false,//面包屑
        isShowSearchForm: false,//查询表单-
        idKey: "_id", //键名
        pageSize: 20,
        listIndex: "detail_group_vedio", //vuex对应的字段~
        focusMenu: true, //进行菜单聚焦

        // ...PUB.listCFCommon,//展开公共配置
        ...PUB.listCFCommon3,//展开公共配置
        singleBtns: PUB.singleBtns_copy_detail_sort,
        batchBtns: {
            addon: [
                { uiType: "slot", slot: "slot_btn_select" },
                util.cfList.bBtns.add,
                util.cfList.bBtns.delete,

            ],
        },
        sortJsonDefault: {
            "sort": -1
        },
        findJsonDefault: {

        },
        objParamAddon: {
            findJson: {},

            _systemId,
            _dataType
        },
        //公共的附加参数，针对所有接口
        paramAddonPublic: {
            _systemId,
            _dataType
        },
        //dynamicDict动态数据字典配置
        dynamicDict: [
            DYDICT.note_category
        ],



        //-------详情字段数组-------
        detailItems: ["title", "desc", "countData", "_id", "_idRel", "_idRel2", "sort"],
        //-------列配置数组-------
        columns: ["title_fixed", "_id", "desc", "link", "sort"],
        //-------筛选表单字段数组-------
        searchFormItems: [],
        //-------新增、修改表单字段数组-------
        formItems: ["_idRel", "_idRel2", "sort"],





    }
    util.reformCFListItem(PUB.listCF.detail_group_vedio)
}
//#endregion


//#endregion


