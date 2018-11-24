var UIBase = require('UIBase')
var ShaderUtils = require("ShaderUtils")
var net = require("NetPomelo")
//var unmatchProto = require('unmatchProto')
var consts = require('consts')
var selectHeroProto = require("selectHeroProto")
var confirmHeroProto = require("confirmHeroProto")
var dataCenter = require('DataCenter')
//var heroData = require('Hero')
var datamgr = require('DataMgr')
//var constant = require('constants')
//var combatMgr = require('CombatMgr')
var constant = require('Constant')
//var constants = require('constants')
var playerData = require('playerData')
cc.Class({
    extends: UIBase,

    properties: {
        matchUI: cc.Node,
        man: sp.Skeleton,
        woman: sp.Skeleton,
        cdTimeLable: cc.Label,
        cdTime: 30,
        _CDState: true,
        pipei: cc.Node,
        dot: cc.Node,
        chen_name: cc.Label,
        yu_name: cc.Label,
        selectMan_light: cc.Node,
        selectWomen_light: cc.Node,
        start_pipei: cc.Label,
        pipeiIngBg: cc.Node,
        match: cc.Node,
        enter: cc.Node,
        loadBegin: false,
        showNode0: cc.Node,
        showNode1: cc.Node,
        heroIcons: cc.SpriteAtlas,
        
    },
    onLoad() {
        this._heros = {
            1000: {
                sk: this.man,
                light: this.selectMan_light,
            },
            2000: {
                sk: this.woman,
                light: this.selectWomen_light,
            }
        }
        this._lastSelectedHeroid = 0;
         this._mgr = cc.find('Canvas').getComponent('UIMgr');
    },
    initData(teamA,unComFirm,leftTime) {
        dataCenter.otherLoadRes = {};
        if (!this._background) {
            var bg = cc.find('Canvas/background');
            this._background = cc.instantiate(bg);
            this._background.parent = this.node;
            this._background.zIndex = -2;
            var fg = cc.find('Canvas/frontground');
            this._foreground = cc.instantiate(fg);
            this._foreground.parent = this.node;
            this._foreground.zIndex = -1;
        }
        this._uimgr = cc.find('Canvas').getComponent('UIMgr');
        var chen = datamgr.hero[1000];
        var yu = datamgr.hero[2000];
        this.chen_name.string = chen.HeroName;
        this.yu_name.string = yu.HeroName;
        this._uid2ShowNode = {};
        let checkComFirm = [];
        this.enter.active = true;

        if (unComFirm!=null) {
            for (var i in unComFirm) {
                checkComFirm.push(unComFirm[i]);
            }
        } //未点准备
        for (var i in teamA) {
            var uid = teamA[i].uid;
            this._uid2ShowNode[uid] = this["showNode" + i];
            this._uid2ShowNode[uid].getChildByName("user_name").getComponent(cc.Label).string = teamA[i].name;
            this._uid2ShowNode[uid].getChildByName("label").active = false;//初次登录
            
            if (teamA[i].heroid !=undefined) {
                if (teamA[i].heroid!=0) {
                    var showNode = this._uid2ShowNode[teamA[i].uid];
                    var heroData = datamgr.hero[teamA[i].heroid];
                    dataCenter.userName = heroData.HeroName;
                    var icon = showNode.getChildByName("icon");
                    icon.active = true;
                    icon.getComponent(cc.Sprite).spriteFrame = this.heroIcons.getSpriteFrame(heroData.HeroIcon);
                    this.enter.active = false;

                    if (playerData.id == uid) {
                        var curInfo = this._heros[teamA[i].heroid];
                        ShaderUtils.setShader(curInfo.sk, "normal");
                        curInfo.light.active = true;
                        this._lastSelectedHeroid = teamA[i].heroid;
                    }//自己看的

                    for (let j = 0 ;j< checkComFirm.length;j++) {

                       var showNoneColor = this._uid2ShowNode[checkComFirm[j]];
                       if (showNoneColor!=undefined) {
                        var iconColor = showNoneColor.getChildByName("icon");
                        ShaderUtils.setShader(iconColor.getComponent(cc.Sprite), "gray"); 
                       }
                        
                       if (dataCenter.uuid == checkComFirm[j]) {
                       // cc.log("没有点准备 a");
                        this.enter.active = true;
                       }
                    }
                }//选了
        }
        }
        if (leftTime!=null) {
          var num = parseInt(leftTime /1000);
          cc.log(num);
          this.cdTime = num;
        }//重连时间
        else {
            this.cdTime = constant.ReadyTimer;
        }

        dataCenter.teamA = teamA;
        cc.log(teamA,"teamA");
        
    },

    onEnable() {
        this._CDState = true;
        this.loadBegin = false;
        for (var heroid in this._heros) {
            var sk = this._heros[heroid].sk;
            sk.node.parent.active = true;
            ShaderUtils.setShader(sk, "gray");
        }
        //normal
    },

    onDisable() {

    },

    start() {

    },

    update(dt) {
        if (this._CDState) {
            this.cdTime -= dt;
            var temp = Math.floor(this.cdTime);
            this.cdTimeLable.string = temp.toString();
            if (this.cdTime <= 0) {
                this.cdTimeLable.string = '0';
                this._CDState = false;
            }
        }
    },


    selectHero(event, heroid) {   
        var that = this;
        var heroData = datamgr.hero[heroid];
        dataCenter.userName = heroData.HeroName;
        if (this._lastSelectedHeroid === heroid) {
            that._mgr.showTips('你已选择'+heroData.HeroName);
            return;
        }
        net.Request(new selectHeroProto(heroid), function (data) {
            if (data.code == consts.SelectHeroCode.OK) {
                if (that._lastSelectedHeroid) {
                    var lastInfo = that._heros[that._lastSelectedHeroid];
                    ShaderUtils.setShader(lastInfo.sk, "gray");
                    lastInfo.light.active = false;
                }
                that._lastSelectedHeroid = heroid;
                var showNode = that._uid2ShowNode[dataCenter.uuid];
                var icon = showNode.getChildByName("icon");
                icon.active = true;
                icon.getComponent(cc.Sprite).spriteFrame = that.heroIcons.getSpriteFrame(heroData.HeroIcon);
                ShaderUtils.setShader(icon.getComponent(cc.Sprite), "gray");
                var curInfo = that._heros[heroid];
                ShaderUtils.setShader(curInfo.sk, "normal");
                curInfo.light.active = true;
            }
            else if (data.code == consts.SelectHeroCode.BE_SELECEED) {
                that._mgr.showTips(heroData.HeroName + '已经被选');
            }
            else if (data.code == consts.SelectHeroCode.NOT_EXIST) {
                that._mgr.showTips('没有改英雄');
            }
            else if (data.code == consts.SelectHeroCode.ALREADY_CONFIRMED) {
                that._mgr.showTips('已经确认了');
            }
        });
    },
    beginFight() {
        if (!this._lastSelectedHeroid) {
            this._mgr.showTips('请选择一个角色!');
            return;
        }
        var that = this;
        net.Request(new confirmHeroProto(), function (data) {
            if (data.code == consts.Code.OK) {
                var showNode = that._uid2ShowNode[dataCenter.uuid];
                var icon = showNode.getChildByName("icon");
                ShaderUtils.setShader(icon.getComponent(cc.Sprite), "normal");
                that.enter.active = false;
            }
        });//点击准备执行
    },
    beginLoadCD(data) {
        this._CDState = true;
        cc.log(data,"加载前倒计时");
        this.cdTime = constant.ReadyStartTimer;
        var heroid = data[dataCenter.uuid];
        dataCenter.userName = datamgr.hero[heroid].HeroName;
        dataCenter.loadProjess = data;
    },
    showTeamSelect(data) {
        var uid = data.uid, heroid = data.heroid;
        var showNode = this._uid2ShowNode[uid];
        var icon = showNode.getChildByName("icon");
        icon.active = true;
        icon.getComponent(cc.Sprite).spriteFrame = this.heroIcons.getSpriteFrame(datamgr.hero[heroid].HeroIcon);
        ShaderUtils.setShader(icon.getComponent(cc.Sprite), "gray");
    },

    showTeamPrepare(data) {
        var uid = data.uid, heroid = data.heroid;
        var showNode = this._uid2ShowNode[uid];
        var icon = showNode.getChildByName("icon");
        ShaderUtils.setShader(icon.getComponent(cc.Sprite), "normal");
    },

    // startLoad(data) {
    //     this.loadBegin = true;
    //     var teams = [data.teamInfo.teamA, data.teamInfo.teamB];
    //     for (var team of teams) {
    //         for (var i in team) {
    //             if (team[i].uid === dataCenter.uuid)
    //                 continue
    //             var heroid = team[i].heroid;
    //             if (!heroid)
    //                 continue;
    //             this._heros[heroid].sk.node.parent.active = false;
    //         }
    //     }
    // },

    fightBegin() {
        this.loadBegin = false;
    }
});
