# 因幡電機産業チョコ停ウォッチャーノード

## 機能概要

因幡電機産業チョコ停ウォッチャーの録画データや静止画データを読み出し、ia-cloudオブジェクトを生成するノードである。<br>
チョコ停ウォッチャーは、生産現場で搬送ラインなどをカメラで撮影し、異常があったタイミングの映像を録画するための製品である。トリガーが入力されると、トリガーの入力タイミング前後の録画データをロックファイルとして保存する。また、チョコ停ウォッチャーと接続したPCでチョコ停ウォッチャーViewerから録画モードなどの各設定や録画データの確認・操作ができる。<br>

## 機能詳細

### 動画収集機能

チョコ停ウォッチャーの録画データ(ロックファイル)を監視し、設定応じてia-cloudファイルデータオブジェクトとして出力する。<br>
収集方式には「都度収集」と「定期収集」の2つがある。都度収集は、ロックファイルが保存される毎に取得する。定期収集は、設定間隔毎にロックファイルを取得する。

#### -都度収集

固定周期(10秒)でチョコ停ウォッチャーのロックファイルを監視し、新しいロックファイルが存在した場合にはia-cloudファイルデータオブジェクトを出力すると共に、ロックファイルを削除する。

#### -定期収集

設定間隔(6、12、24時間のいずれか)でチョコ停ウォッチャーのロックファイル情報を取得し、新しいロックファイルが存在した場合にはia-cloudファイルデータオブジェクトを出力すると共に、ロックファイルを削除する。

### 静止画収集機能

チョコ停ウォッチャーから静止画取得コマンド(/xaccja/getCamImage)にて静止画データを取得する。「静止画出力」プロパティが「無し」の場合、静止画データを取得しない。<br>
静止画は定期、もしくはメッセージ入力時に収集できる。<br>
また、ia-cloudファイルデータオブジェクト、ローカルモニタ用静止画出力、その両方で出力できる。

#### 静止画収集方式

#### -定期収集

静止画の定期収集の設定周期(10、30分、1、2、6、12、24時間のいずれか)を設定する場合、その周期でチョコ停ウォッチャーから静止画データを取得し、出力する。

#### -入力メッセージによる静止画取得

msg.getImageがNULL、0、false 以外で入力された場合、チョコ停ウォッチャーから静止画を取得し、出力する。定期収集に設定している場合も、msg.getImageが入力された場合は同様に動作する。

#### 静止画データ出力形式

#### -静止画のia-cloudデータオブジェクト出力

「静止画出力」がia-cloud格納か両方に設定されている場合、チョコ停ウォッチャーから取得された静止画データをia-cloudデータオブジェクトで出力する。


#### -ローカルモニタ用静止画出力

「静止画出力」がノード出力か両方に設定されている場合、チョコ停ウォッチャーから取得された静止画データをノードの2nd出力からmsg.payloadとして出力する。<br>
ノードの2nd出力は、「静止画出力」でノード出力か両方を選択した場合、利用できるようになる。

### チョコ停ウォッチャーの設定機能

「チョコ停ウォッチャーの設定」タブからチョコ停ウォッチャーの各設定を変更することができる。Node-REDで既存の設定を確認することはできない。設定変更はフローをデプロイしてチョコ停ウォッチャーと接続したタイミングで反映される。<br>
また、Viewerの設定表示にはリロードすることで反映される。

### チョコ停ウォッチャー監視機能

固定周期(10秒)で、エラーコードとアラート状態を取得し、Node-REDステータス表示とデバッグペインへのメッセージ出力を行う。「アラーム＆イベントを出力する」プロパティがチェックされていれば、ia-cloudアラーム＆イベントデータオブジェクトを出力する。

## 入力メッセージ

チョコ停ウォッチャーがロックファイルを保存するためのトリガー送出を指示するメッセージと静止画取得のタイミングを指示するメッセージの2つ。

| 名称 | 種別 | 説明 |
|:----------|:-----:|:--------------------|
|msg.trigger|boolean/string/number/object|NULL、0、false 以外の時、チョコ停ウォッチャーへトリガーコマンドを送出する。その後、チョコ停ウォッチャーでロックファイルが保存される。| 
|msg.getImage|boolean/string/number/object|NULL、0、false 以外の時、チョコ停ウォッチャーから静止画を取得し、設定に応じてia-cloudファイルデータオブジェクトかmsg.payload、または両方を出力する。| 

## 出力メッセージ1

ia-cloudファイルデータオブジェクトをia-cloud CSへ格納するためのメッセージを出力する。ia-cloud-cnct ノードへの接続を想定している。

| 名称 | 種別 | 説明 |
|:----------|:-----:|:--------------------|
|request|string|ia-cloud APIのリクエスト。"store"固定。|
|dataObject|object|格納するia-cloudオブジェクト| 

#### ia-cloudファイルデータオブジェクトの構成

```
{
    request: "store" //ia-cloud APIのrequest。"store"固定。
    dataObject: object //ia-cloudオブジェクト
        objectType: "iaCloudObject"
        objectContent: object
            contentType: "Filedata"
            contentData: array[5]
                0: object
                    commonName: "File Name"
                    dataValue: "ファイル名"
                1: object
                    commonName: "MIME Type"
                    dataValue: "MIMEタイプ"
                2: object
                    commonName: "Encoding"
                    dataValue: "base64"
                3: object
                    commonName: "Size"
                    dataValue: サイズ
                4: object
                    commonName: "file path"
                    dataValue: "ファイルパス"
        objectKey: "オブジェクトキー" //ia-cloudオブジェクトキー
        objectDescription: "オブジェクト説明" //ia-cloudオブジェクトの説明
        timestamp: "タイムスタンプ"
    _msgid: "メッセージID"
}
```

## 出力メッセージ2

チョコ停ウォッチャーから取得した静止画を表示するためのメッセージを出力する。「静止画出力」でノード出力か両方を選択した場合に利用できる2nd出力。

| 名称 | 種別 | 説明 |
|:----------|:-----:|:--------------------|
|msg.payload|stream|MIME type image/jpeg の静止画データ|

## プロパティ

本ノードは以下のプロパティを持つ。

| 名称 | 種別 | 説明 | 備考 |
|:----------|:-----:|:-----|:-------|
|チョコ停ウォッチャーアドレス|string|接続するチョコ停ウォッチャーのネットワークアドレス|
|ノード名称|string|本ノードの名称|
|configReady|boolean|必須のプロパティがすべて設定済みかを表すフラグ|非表示のプロパティ|

**チョコ停ウォッチャーの設定タブ**<br>
チョコ停ウォッチャーの設定を変更するためのプロパティ。
「時計を同期」以外の項目は、セレクトボックスによる選択である。選択肢の「本体のまま」は、チョコ停ウォッチャーの既存の設定を変更しない。(チョコ停ウォッチャーViewerの設定表示はリロードすると変更される。)

| 名称 | 種別 | 説明 |
|:----------|:-----:|:--------------------|
|時計を同期|boolean| 起動時とロックファイル読み出し時に、チョコ停ウォッチャーの時計をNode-REDアプリケーションと同期する場合にチェックする。|
|録画モード|string| ループ&トリガーロック、トリガーオンリー、本体のままのいずれか。　|
|録画単位|string| トリガーオンリーモードの場合、20秒、40秒、本体のままのいずれか。ループ&トリガーロックモードの場合、1、3、5、10分、本体のままのいずれか。|
|スピーカ音量|string| チョコ停ウォッチャーのスピーカの設定音量。大、中、小、OFF、本体のままのいずれか。|
|カメラアングル|string| チョコ停ウォッチャーのカメラアングル。110度、180度、本体のままのいずれか。|

**データ収集機能設定タブ**<br>
チョコ停ウォッチャーからのデータ取得について設定するためのプロパティ。
各項目とも、セレクトボックスによる選択である。

| 名称 | 種別 | 説明 |
|:----------|:-----:|:--------------------|
|動画収集方式|string| 都度収集、定期収集のいずれか。|
|動画収集周期|string| 定期収集の場合の収集周期、6、12、24時間のいずれか。都度収集の場合は選択不可。|
|静止画出力|string| 静止画の出力先。無し、ia-cloudオブジェクト出力、ノード出力、両方のいずれか。ローカルモニタ出力か両方を選択した場合、2nd出力の接続が可能。|
|静止画収集周期|string| 静止画定期収集する場合の周期。msg.getImage入力による収集のみ、10、30分、1、3、6、12、24時間のいずれか。|

**オブジェクトの設定タブ**<br>
オブジェクトの内容を設定するためのプロパティ。

| 名称 | 種別 | 説明 |
|:----------|:-----:|:--------------------|
|オブジェクトキー|string| ia-cloudオブジェクトのobjectKeyとして使われる。|
|オブジェクトの説明|string| ia-cloudオブジェクトのobjectDescriptionとして使われる。|
|アラーム＆イベントを出力する|boolean| チョコ停ウォッチャーとのエラー情報をia-cloudアラーム＆イベントデータオブジェクトとして出力する場合にチェックを入れる。|
|A&Eのオブジェクトキー|string|ia-cloudアラーム＆イベントデータオブジェクトのobjectKeyとして使われる。|
|A&Eのオブジェクトの説明|string|ia-cloudアラーム＆イベントデータオブジェクトのobjectDescriptionとして使われる。|