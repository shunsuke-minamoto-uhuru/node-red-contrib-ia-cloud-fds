module.exports = function(RED) {
    "use strict";
    var settings = RED.settings;
    var events = require("events");
    var serialp = require("serialport");
    var moment = require("moment");
    var fs = require("fs");
    var sensor = require("./sensor");
    
    var bufMaxSize = 32768;  // Max serial buffer size, for inputs...
    var gEnOceanData = "";

    // EnOcean-obj node function definition
    function EnOceanObjNode(config) {
        RED.nodes.createNode(this,config);
        this.object_key = config.object_key;
        this.object_desc = config.object_desc;
        this.enoceancom = config.enoceancom;
        this.enoceandataitem = config.enoceandataitem;
        
        var serialPool = config.enoceancom.serialPool;
        
        var enCom = RED.nodes.getNode(this.enoceancom);
        var node = this;
        var linkObj = [];
        var linkData = {};
        var EnObjects = [{}];
        node.status({fill:"blue", shape:"ring", text:"runtime.preparing"});

        if (config.confsel == "fileSet"){
          // 設定ファイルの場合、ファイルを読み込んで、オブジェクトに展開
          try{
              //EnObjects = JSON.parse(fs.readFileSync(config.configfile,'utf8')).EnObjects;
              EnObjects = JSON.parse(config.configdata);
              console.log('EnObjects = ' + EnObjects);
              console.log('The number of EnObjects = ' + EnObjects.length);
          } catch(e) {
              //エラーの場合は、nodeステータスを変更。
              //node.status({fill:"red",shape:"ring",text:"runtime.badFilePath"});
              //node.error(RED._("runtime.badFilePath"), configObj);
              node.status({fill:"red",shape:"ring",text:"JSON読み込みエラー"});
              configObj = null;
          }
        } else {
            // オブジェクトがプロパティで設定されている場合、プロパティを読み込んでオブジェクトを生成
            var EnDataNode = (RED.nodes.getNode(config.enoceandataitem));
            node.log('EnDataNode = ' + JSON.stringify(EnDataNode));
            node.log('EnDataNode.dItems = ' + JSON.stringify(EnDataNode.dItems));
            
            EnObjects = [{options:{}, ObjectContent:{}}];
            EnObjects[0].options.sensor_id = EnDataNode.sensor_id;
            EnObjects[0].options.sensor_kind = EnDataNode.sensor_kind;
            EnObjects[0].objectName = "ObjectName";           // 仮設定
            EnObjects[0].objectKey = config.object_key;
            EnObjects[0].objectDescription = config.object_desc;
            EnObjects[0].ObjectContent.contentType = "iaCloudData";
            EnObjects[0].ObjectContent.contentData = EnDataNode.dItems;
        }
        if (EnObjects) {
            // 取り合えず EnObjects は要素数1としてコードを書く
            var len = EnObjects.length;
            for (var i = 0; i < len; i++) {
              linkData = {};
              linkData.sensor_id = EnObjects[i].options.sensor_id;
              linkData.nodeId = node.id;
              linkData.objectKey = EnObjects[i].objectKey;
              linkObj.push(linkData);
            }
        }
        //EnOcean-com nodeのデータ追加メソッドを呼ぶ
        enCom.addLinkData(linkObj);
        node.status({fill:"green", shape:"dot", text:"送信準備中"});
        
        //EnOceanObjNode.prototype.linkDatachangeListener = function (element) {
        this.linkDatachangeListener = function (element) {
            // 引数に [objectKey, radio_data] を受け取る
            iaCloudObjectSend(element);
        }

        var iaCloudObjectSend = function(element) {
            node.status({fill:"blue",shape:"ring",text:"runtime.preparing"});

            var msg = {request: "store", dataObject:{ObjectContent:{}}};
            var contentData = [];

            var iaObject = EnObjects.find(function(objItem, idx) {
                node.log('objItem.objectKey = ' + objItem.objectKey);
                node.log('element[0] = ' + element[0]);
                return (objItem.objectKey == element[0]);
            });
            
            if (iaObject) {
                msg.dataObject.objectKey = element[0];
                msg.dataObject.timeStamp = moment().format();
                msg.dataObject.objectType = "iaCloudObject";
                msg.dataObject.objectDescription = iaObject.objectDescription;
                msg.dataObject.ObjectContent.contentType = "iaCloudData";

                var options = iaObject.options;
                node.log('options = ' + JSON.stringify(options));
                var sensor_val = [];
                // TODO: センサー毎にコードを追加しなければならないので構成を検討する必要有り
                if (options.sensor_kind == "u-rd") {
                    sensor_val = sensor.calc_ac(element[1]);
                    node.log('calculate ac value = ' + sensor_val);
                } else {
                    sensor_val = sensor.calc_temperature(element[1]);
                    node.log('calculate temperature value = ' + sensor_val);
                }
                var contentData = iaObject.ObjectContent.contentData;
                contentData.some(function(dItem, idx) {
                    if ((idx + 1) > sensor_val.length) {
                        return true;
                    }
                    dItem.dataValue = sensor_val[idx];
                });

                msg.dataObject.ObjectContent.contentData = contentData;
                console.log(JSON.stringify(msg.dataObject));
                node.send(msg);
                /* node.status({fill:"green", shape:"dot", text:"runtime.sent"}); */
                node.status({fill:"green",shape:"dot",text:"データ送信済み"});
            } else {
                node.log('!!! 受信したobjectKeyは設定情報の中には含まれません。メッセージ送信はしません。 !!!');
            }
        }

        this.on("input", function(msg) {
            // 処理なし
        });

        this.on("close", function(done) {
            if (this.serialConfig) {
                // TODO: ここのserialPoolをSerialPortノードから取得するようにする
                serialPool.close(this.serialConfig.serialport,done);
            }
            else {
                done();
            }
        });
    }
    RED.nodes.registerType("EnOcean-obj",EnOceanObjNode);
}