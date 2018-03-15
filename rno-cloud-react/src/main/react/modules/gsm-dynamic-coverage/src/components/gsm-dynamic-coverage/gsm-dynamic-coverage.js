import React from 'react';
import ReactDOM from 'react-dom';
import ol from "openlayers";
import {Button, DatePicker, Input, InputNumber, List, LocaleProvider, Select, Spin, Table} from 'antd';
import styled from 'styled-components';
import './ol-map.css';
import './ol.css';
import './popup.css';
import './gsm-dynamic-coverage.css';
import 'openlayers/config/jsdoc/api/template/static/styles/bootstrap.min.css';
import ContextMenu from 'ol-contextmenu'
import 'ol-contextmenu/dist/ol-contextmenu.css';
import zhCN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn';

moment.locale('zh-cn');

const {RangePicker} = DatePicker;
const Option = Select.Option;
const InputGroup = Input.Group;

const FloatLeftDiv = styled.div`
    float:left;
    margin-left:10px;
`;

let map;
let popup;
let cellLayerGroup;
let cellNameLayerGroup;
let clickedCellLayer;
let baseCellLayer;
let dynamicCoverageOverlay;
let queryCellOverlay;
let queryFreqOverlay;
let queryNCellOverlay;
let dis;

/**
 * 查看小区动态覆盖图(折线)
 */
function showDynaCoverage(cellId, enName, cellLon, cellLat) {
    let cityId = dis.state.cityId;
    let startDate = dis.state.startDate;
    let endDate = dis.state.endDate;
    //获取图形大小系数
    let imgCoeff = dis.state.imgCoeff;
    let valiNumber = /^[+]?[0-9]+(\.[0-9]+)?$/;   //验证数字
    if (!valiNumber.test(Number(imgCoeff))) {
        return;
    }
    if (Number(imgCoeff) <= 0 || Number(imgCoeff) > 0.5) {
        return;
    }
    dis.setState({loading: true});
    fetch('/api/dynamic-coverage/get-dynamic-coverage-data', {
        method: 'POST',
        body: "cityId=" + cityId +
        "&cellId=" + cellId +
        "&enName=" + enName +
        "&startDate=" + startDate +
        "&endDate=" + endDate
        ,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).then(resp => resp.json()).then(data => {
        dis.setState({loading: false});
        if (data === null) {
        }
        if (data !== null) {
            let curvePoints_12 = data['curvePoints_12'];
            if (curvePoints_12 !== null) {
                let pointArray_12 = [];
                for (let one in curvePoints_12) {
                    pointArray_12.push([one["lng"], one["lat"]]);
                }
                if (pointArray_12.length > 4) {
                    drawPolygon(curvePoints_12);
                } else {
                }
            } else {
            }
        }
    });
}

function drawPolygon(points) {
    map.removeLayer(dynamicCoverageOverlay);
    let coordinates = [];
    points.forEach(function (point) {
        coordinates.push([point.lng, point.lat]);
    });
    let styles = [
        new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'blue',
                width: 15 * dis.state.imgCoeff
            }),
            fill: new ol.style.Fill({
                color: 'rgba(0, 0, 255, 0.1)'
            })
        }),
        new ol.style.Style({
            image: new ol.style.Circle({
                radius: 15 * dis.state.imgCoeff,
                fill: new ol.style.Fill({
                    color: 'orange'
                })
            }),
            geometry: function (feature) {
                let coordinates = feature.getGeometry().getCoordinates()[0];
                return new ol.geom.MultiPoint(coordinates);
            }
        })
    ];
    let geojsonObject = {
        'type': 'FeatureCollection',
        'crs': {
            'type': 'name',
            'properties': {
                'name': 'EPSG:4326'
            }
        },
        'features': [{
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [coordinates]
            }
        }]
    };

    let source = new ol.source.Vector({
        features: (new ol.format.GeoJSON()).readFeatures(geojsonObject)
    });
    dynamicCoverageOverlay = new ol.layer.Vector({
        source: source,
        style: styles,
        zIndex: 100
    });
    map.addLayer(dynamicCoverageOverlay);
    map.getView().animate(coordinates[0])
}

function doSearchNCell(cellId, cityId, selectCellSearch) {
    if (cellId === "") {
        return;
    }
    if (ifHasSpecChar(cellId)) {
        return;
    }
    if (!isOnlyNumberAndComma(cellId)) {
        return;
    }
    let ncells = [];
    queryNCellOverlay.getSource().clear();
    fetch('../../api/dynamic-coverage/get-ncell-details?cell=' + cellId + '&cityId=' + cityId)
        .then(resp => resp.json())
        .then(data => {
            let obj = data;
            if (0 === obj.length) {
                return;
            }
            if (obj) {
                for (let i = 0; i < obj.length; i++) {
                    if (obj[i]['CELL_ID'] === cellId) {
                        continue;
                    }
                    ncells.push("'" + obj[i]['CELL_ID'] + "'");
                }
                if (!baseCellLayer){
                    dis.loadCellInfo();
                }
                let filter = `CELL_ID IN (` + ncells + `) and AREA_ID = '` + cityId +`'`;
                fetch("http://rno-gis.hgicreate.com/geoserver/rnoprod/ows?service=WFS&request=GetFeature" +
                    "&typeName=rnoprod%3ARNO_GSM_CELL_GEOM&outputFormat=application%2Fjson&CQL_FILTER=" + filter)
                    .then(resp => resp.json()).then(data => {
                    let view = map.getView();
                    let features = new ol.format.GeoJSON().readFeatures(data);
                    if (features.length) {
                        features.forEach(function (feature) {
                            let coordinate = [feature.get("LONGITUDE"), feature.get("LATITUDE")];
                            let url = baseCellLayer.getSource().getGetFeatureInfoUrl(
                                coordinate, view.getResolution(), view.getProjection(), {
                                    'INFO_FORMAT': 'application/json',
                                    'FEATURE_COUNT': 1000
                                });
                            if (url) {
                                fetch(url)
                                    .then(resp => resp.json())
                                    .then(data => {
                                        let features = new ol.format.GeoJSON().readFeatures(data);
                                        if (features.length) {
                                            queryNCellOverlay.getSource().addFeatures(features);
                                        }
                                    })
                            }
                        })
                        doSearchCell(cellId, selectCellSearch);
                    }
                })
            }
        })
}

function doSearchCell(cellIdFromOtherMethod, inputCellSearch, selectCellSearch) {
    let filter = '';
    if (cellIdFromOtherMethod !== -1) {
        filter = `CELL_ID in('` + cellIdFromOtherMethod + `')`;
    } else {
        let inputValue = inputCellSearch;
        if (inputValue === "") {
            return;
        }
        let queryType = selectCellSearch;
        let cellArr = inputValue.split(",");
        let cellStr = "";
        for (let i = 0; i < cellArr.length; i++) {
            if (cellArr[i] !== "") {
                if (ifHasSpecChar(cellArr[i])) {
                    return;
                }
                if (queryType === 'CELL_ID' || queryType === 'LAC' || queryType === 'CI') {
                    if (!isOnlyNumberAndComma(cellArr[i])) {
                        return;
                    }
                }
                cellStr += "'" + cellArr[i] + "',";
            }
        }
        cellStr = cellStr.substring(0, cellStr.length - 1);

        if (queryType === 'CELL_ID') {
            filter = `CELL_ID in (${cellStr})`;
        } else if (queryType === 'CHINESE_NAME') {
            filter = `CELL_NAME in (${cellStr})`
        }
        else if (queryType === 'ENGLISH_NAME') {
            filter = `EN_NAME in (${cellStr})`
        }
        else if (queryType === 'LAC') {
            filter = `LAC in (${cellStr})`
        } else if (queryType === 'CI') {
            filter = `CI in (${cellStr})`
        }
    }
    fetch("http://rno-gis.hgicreate.com/geoserver/rnoprod/ows?service=WFS&request=GetFeature&typeName=rnoprod%3ARNO_GSM_CELL_GEOM&outputFormat=application%2Fjson&CQL_FILTER=" + filter)
        .then(resp => resp.json()).then(data => {
        let features = new ol.format.GeoJSON().readFeatures(data);
        if (features.length) {
            queryCellOverlay.getSource().clear();
            clickedCellLayer.getSource().clear();
            queryCellOverlay.getSource().addFeatures(features);
            map.getView().animate({
                center: [features[0].get('LONGITUDE'), features[0].get('LATITUDE')],
                duration: 1000,
                zoom: 18
            });
        }
    })
}

function ifHasSpecChar(str) {
    let pattern = new RegExp("[~'!@#$%^&*()-+_=:]");
    return pattern.test(str);
}

function isOnlyNumberAndComma(str) {
    let reg = /^[0-9,-]+$/;
    return reg.test(str);
}

export default class Map extends React.Component {

    constructor(props) {
        super(props);
        let date = new Date();
        const ed = date.toLocaleDateString();
        this.state = {
            showRightPanel: true,
            provinceId: 0,
            provinceTitle: "",
            cityId: 0,
            cityTitle: "",
            districtId: 0,
            districtTitle: "",
            provinceList: [],
            cityList: [],
            districtList: [],
            showCellName: false,
            startDate: "2014/01/01",
            endDate: ed,
            imgCoeff: 0.2,
            tableFeatures: [],
            loading: false,
            searchPanelzIndex: -1,
            inputCellSearch: "10299-17275",
            selectCellSearch: "CELL_ID",
            inputNCellSearch: "10299-17275",
            inputFreqSearch: 1,
        };
        dis = this;

        this.loadCellInfo = this.loadCellInfo.bind(this);
        this.showCellName = this.showCellName.bind(this);
        this.onDatePickerChange = this.onDatePickerChange.bind(this);
        this.onImgCoeffChange = this.onImgCoeffChange.bind(this);
        this.onInputCellSearchChange = this.onInputCellSearchChange.bind(this);
        this.onSelectCellSearchChange = this.onSelectCellSearchChange.bind(this);
        this.searchCell = this.searchCell.bind(this);
        this.onInputNCellSearchChange = this.onInputNCellSearchChange.bind(this);
        this.searchNCell = this.searchNCell.bind(this);
        this.onInputFreqSearchChange = this.onInputFreqSearchChange.bind(this);
        this.searchFreq = this.searchFreq.bind(this);
    }

    handleProvinceChange = (value) => {
        fetch("/api/areas?parentId=" + value.key).then(resp => resp.json()).then(cityJson => {
            fetch("/api/areas?parentId=" + cityJson[0].id).then(resp => resp.json()).then(districtJson => {
                map.getView().animate({
                    center: [districtJson[0].longitude, districtJson[0].latitude],
                    duration: 1000,
                    zoom: 12
                });
                this.setState({
                    provinceId: value.key,
                    cityList: cityJson,
                    provinceTitle: value.label,
                    cityTitle: cityJson[0].name,
                    districtList: districtJson,
                    districtTitle: districtJson[0].name
                });
            });
        });
    }
    handleCityChange = (value) => {
        this.setState({cityTitle: value.label})
        fetch("/api/areas?parentId=" + value.key).then(resp => resp.json()).then(json => {
            map.getView().animate({
                center: [json[0].longitude, json[0].latitude],
                duration: 1000,
                zoom: 12
            });
            this.setState({
                cityId: value.key,
                districtList: json,
                districtTitle: json[0].name
            });
        })
    }
    handleDistrictChange = (value) => {
        this.setState({districtTitle: value.label})
        fetch("/api/areas?parentId=" + value.key).then(resp => resp.json()).then(json => {
            map.getView().animate({
                center: [json[0].longitude, json[0].latitude],
                duration: 1000,
                zoom: 12
            });
        })
    }

    getProvinceCityDistrictOptions = (parentId, level) => {
        fetch("/api/areas?parentId=" + parentId).then(resp => resp.json()).then(json => {
            this.setState({[level]: json});
        })
    }

    loadCellInfo() {
        let filter = " AREA_ID=" + this.state.cityId;
        cellLayerGroup.getLayers().clear();
        baseCellLayer = new ol.layer.Tile({
            zIndex: 2,
            source: new ol.source.TileWMS({
                url: 'http://rno-gis.hgicreate.com/geoserver/rnoprod/wms',
                params: {
                    FORMAT: 'image/png',
                    VERSION: '1.1.1',
                    tiled: true,
                    STYLES: '',
                    LAYERS: 'rnoprod:RNO_GSM_CELL_GEOM',
                    CQL_FILTER: filter
                }
            }),
            opacity: 0.5
        });
        cellLayerGroup.getLayers().push(baseCellLayer);
    }

    showCellName() {
        if (this.state.showCellName) {
            cellNameLayerGroup.getLayers().clear();
            this.setState({showCellName: false});
        } else {
            this.setState({showCellName: true});
            let filter = "AREA_ID=" + this.state.cityId;
            cellNameLayerGroup.getLayers().clear();
            let cellNameLayer = new ol.layer.Tile({
                zIndex: 4,
                source: new ol.source.TileWMS({
                    url: 'http://rno-gis.hgicreate.com/geoserver/rnoprod/wms',
                    params: {
                        FORMAT: 'image/png',
                        VERSION: '1.1.1',
                        TILED: true,
                        STYLES: '',
                        LAYERS: 'rnoprod:RNO_GSM_CELL_CENTROID',
                        'CQL_FILTER': filter
                    }
                }),
                opacity: 0.5
            });
            cellNameLayerGroup.getLayers().push(cellNameLayer);
        }
    }

    onDatePickerChange(date, dateString) {
        this.setState({startDate: dateString[0], endDate: dateString[1]});
    }

    clearAll() {
        map.removeLayer(dynamicCoverageOverlay);
        queryCellOverlay.getSource().clear();
        queryFreqOverlay.getSource().clear();
        queryNCellOverlay.getSource().clear();
    }

    componentDidMount() {
        //从区-> 市 -> 省反推，第一次获取的district指的是自身，后续都用前一级的parentId 来找上一级
        fetch("/api/get-current-user").then(resp => resp.json()).then(currentArea => {
            // 找到目标
            this.setState({districtId: currentArea.defaultArea});
            fetch("api/get-area-by-id?id=" + currentArea.defaultArea).then(resp => resp.json()).then(district => {
                // 找到区
                this.setState({cityId: district.parentId});
                fetch("api/get-area-by-id?id=" + district.parentId).then(resp => resp.json()).then(city => {
                    // 找到市
                    this.setState({
                        provinceId: city.parentId,
                        cityId: district.parentId,
                        cityTitle: city.name,
                        districtId: currentArea.defaultArea,
                        districtTitle: district.name
                    })

                    this.getProvinceCityDistrictOptions(0, "provinceList");
                    this.getProvinceCityDistrictOptions(city.parentId, "cityList");
                    this.getProvinceCityDistrictOptions(city.id, "districtList");

                    fetch("api/get-area-by-id?id=" + city.parentId).then(resp => resp.json()).then(province => {
                        this.setState({provinceTitle: province.name});
                    });
                });
            });
        });
        let redStyle = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'yellow',
                size: 5
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255, 0, 0, 1.0)'
            })
        });
        let greenStyle = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'yellow',
                size: 5
            }),
            fill: new ol.style.Fill({
                color: 'rgba(0, 255, 0, 1.0)'
            })
        });
        let blueStyle = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'yellow',
                size: 5
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255, 100, 255, 1.0)'
            })
        });
        cellLayerGroup = new ol.layer.Group({
            zIndex: 2,
            layers: []
        });
        cellNameLayerGroup = new ol.layer.Group();
        clickedCellLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            zIndex: 20,
            style: redStyle
        });
        queryCellOverlay = new ol.layer.Vector({
            zIndex: 11,
            source: new ol.source.Vector(),
            style: greenStyle
        });
        queryFreqOverlay = new ol.layer.Vector({
            zIndex: 6,
            source: new ol.source.Vector(),
            style: blueStyle
        });
        queryNCellOverlay = new ol.layer.Vector({
            zIndex: 5,
            source: new ol.source.Vector(),
            style: redStyle
        });
        let baseLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'http://192.168.9.11:8081/styles/rno-omt/{z}/{x}/{y}.png',
                zIndex: 1
            })
        });
        map = new ol.Map({
            target: 'map',
            layers: [baseLayer, cellLayerGroup, cellNameLayerGroup, clickedCellLayer, queryCellOverlay, queryFreqOverlay, queryNCellOverlay],
            view: new ol.View({
                projection: 'EPSG:4326',
                center: [113.355747, 23.127191],
                zoom: 16
            })
        });

        const popupElement = document.getElementById('popup');
        popup = new ol.Overlay({
            element: popupElement,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            }
        });
        map.addOverlay(popup);
        map.on('singleclick', function (evt) {
            if (map.getView().getZoom() < 15) {
                return;
            }
            popupElement.style = "visibility: hidden";
            let view = map.getView();
            if (baseCellLayer) {
                let url = baseCellLayer.getSource().getGetFeatureInfoUrl(
                    evt.coordinate, view.getResolution(), view.getProjection(), {
                        'INFO_FORMAT': 'application/json',
                        'FEATURE_COUNT': 1000
                    });
                if (url) {
                    fetch(url).then(resp => resp.json()).then(json => {
                        let features = new ol.format.GeoJSON().readFeatures(json);
                        if (features.length > 0) {
                            clickedCellLayer.getSource().clear();
                            clickedCellLayer.getSource().addFeatures(features);
                            popup.setPosition(evt.coordinate);
                            popupElement.style = "visibility: visible";
                            dis.setState({tableFeatures: features});
                        }
                        else {
                            clickedCellLayer.getSource().clear();
                        }
                    }).catch(function (err) {
                        console.error(err);
                    });
                }
            }
        });

        //地图小区右键菜单
        let contextMenuItems = [
            {
                text: '动态覆盖图',
                callback: function (evt) {
                    let features = clickedCellLayer.getSource().getFeatures();
                    if (features.length === 1) {
                        showDynaCoverage(features[0].get('CELL_ID'), features[0].get('EN_NAME'), features[0].get('LONGITUDE'), features[0].get('LATITUDE'));
                    }
                }
            },
            {
                text: '查邻区',
                callback: function (evt) {
                    let features = clickedCellLayer.getSource().getFeatures();
                    doSearchNCell(features[0].get('CELL_ID'), dis.state.cityId, dis.state.selectCellSearch);
                }
            }
        ];
        let contextmenu = new ContextMenu({
            width: 135,
            items: contextMenuItems
        });
        map.addControl(contextmenu);
        contextmenu.on('beforeopen', function (evt) {
            if (baseCellLayer) {
                let view = map.getView();
                let url = baseCellLayer.getSource().getGetFeatureInfoUrl(evt.coordinate, view.getResolution(), view.getProjection(), {
                    'INFO_FORMAT': 'application/json',
                    'FEATURE_COUNT': 1000
                });
                if (url) {
                    fetch(url).then(resp => resp.json()).then(data => {
                        let features = new ol.format.GeoJSON().readFeatures(data);
                        if (features.length > 0) {
                            clickedCellLayer.getSource().clear();
                            clickedCellLayer.getSource().addFeatures(features);
                        } else {
                            clickedCellLayer.getSource().clear();
                        }
                    });
                }
            }

        });
    }

    rightPanelSwitcher(e) {
        if (this.state.showRightPanel) {
            document.getElementsByClassName("switch")[0].className = "switch_hidden";
            document.getElementsByClassName("resource_list_icon")[0].className = "resource_list_icon_hidden";
            this.setState({showRightPanel: false});
        } else if (this.state.showRightPanel === false) {
            document.getElementsByClassName("switch_hidden")[0].className = "switch";
            document.getElementsByClassName("resource_list_icon_hidden")[0].className = "resource_list_icon";
            this.setState({showRightPanel: true});
        }
    }

    onImgCoeffChange = (value) => {
        this.setState({imgCoeff: value});
    }

    onInputCellSearchChange = (event) => {
        this.setState({inputCellSearch: event.target.value})
    }
    onSelectCellSearchChange = (value) => {
        this.setState({selectCellSearch: value});
    }
    onInputNCellSearchChange = (event) => {
        this.setState({inputNCellSearch: event.target.value})
    }
    onInputFreqSearchChange = (event) => {
        this.setState({inputFreqSearch: event.target.value});
    }

    searchCell() {
        doSearchCell(-1, this.state.inputCellSearch, this.state.selectCellSearch);
    }

    searchNCell() {
        let cellId = this.state.inputNCellSearch;
        doSearchNCell(cellId, dis.state.cityId, dis.state.inputCellSearch, dis.state.selectCellSearch);
    }

    searchFreq() {
        this.doSearchFreq()
    }

    doSearchFreq() {
        let cityId = this.state.cityId;
        let freq = this.state.inputFreqSearch;
        let filter = `BCCH = '` + freq + `' and AREA_ID = '` + cityId + `'`;
        fetch("http://rno-gis.hgicreate.com/geoserver/rnoprod/ows?service=WFS&request=GetFeature&typeName=rnoprod%3ARNO_GSM_CELL_GEOM&outputFormat=application%2Fjson&CQL_FILTER=" + filter)
            .then(resp => resp.json()).then(data => {
            queryFreqOverlay.getSource().clear();
            let view = map.getView();
            let features = new ol.format.GeoJSON().readFeatures(data);
            if (features.length) {
                features.forEach(function (feature) {
                    if (baseCellLayer) {
                        let coordinate = [feature.get("LONGITUDE"), feature.get("LATITUDE")];
                        let url = baseCellLayer.getSource().getGetFeatureInfoUrl(
                            coordinate, view.getResolution(), view.getProjection(), {
                                'INFO_FORMAT': 'application/json',
                                'FEATURE_COUNT': 1000
                            });
                        if (url) {
                            fetch(url).then(resp => resp.json()).then(data => {
                                let features = new ol.format.GeoJSON().readFeatures(data);
                                if (features.length) {
                                    queryFreqOverlay.getSource().addFeatures(features);
                                }
                            })
                        }
                    }
                })
                map.getView().animate({
                    center: [features[0].get("LONGITUDE"), features[0].get("LATITUDE")],
                    duration: 2000
                })
            }
        })
    }

    switchSearchPanel() {
        if (dis.state.searchPanelzIndex === -1) {
            dis.setState({searchPanelzIndex: 20});
        } else {
            dis.setState({searchPanelzIndex: -1});
        }
        let searchPanel = document.getElementById("searchPanel");
        searchPanel.style = "top:115px;z-Index:" + dis.state.searchPanelzIndex;
    }

    render() {

        const provinceOptions = this.state.provinceList.map(province => <Option value={province.id}
                                                                                key={province.id}>{province.name}</Option>);
        const cityOptions = this.state.cityList.map(city => <Option value={city.id} key={city.id}>{city.name}</Option>);
        const districtOptions = this.state.districtList.map(district => <Option value={district.id}
                                                                                key={district.id}>{district.name}</Option>);
        const dateFormat = 'YYYY/MM/DD';

        return (
            <div>
                <div id="map" className="map">
                    <div id="popup" className="ol-popup">
                        <ListDemo data={this.state.tableFeatures}/>
                    </div>
                </div>
                <div className="dialog" style={{top: 55}}>
                    <FloatLeftDiv>
                        <Select labelInValue value={{key: this.state.provinceTitle}} style={{width: 90}}
                                onChange={this.handleProvinceChange}>
                            {provinceOptions}
                        </Select>
                    </FloatLeftDiv>
                    <FloatLeftDiv>
                        <Select labelInValue value={{key: this.state.cityTitle}} style={{width: 90}}
                                onChange={this.handleCityChange}>
                            {cityOptions}
                        </Select>
                    </FloatLeftDiv>
                    <FloatLeftDiv>
                        <Select labelInValue value={{key: this.state.districtTitle}} style={{width: 90}}
                                onChange={this.handleDistrictChange}>
                            {districtOptions}
                        </Select>
                    </FloatLeftDiv>
                    <Button id="queryButton" onClick={this.switchSearchPanel} className="map-tools-panel"
                            type="primary">开关搜索面板</Button>
                    <Button onClick={this.showCellName} type="primary">开关小区名字</Button>
                </div>

                <div id="searchPanel" className="dialog2" style={{top: 115, zIndex: this.state.searchPanelzIndex}}>
                    <div className="dialog_header">
                        <div className="dialog_title">小区查找</div>
                        <div className="dialog_tool">
                            <div className="dialog_tool_close dialog_closeBtn" onClick={this.switchSearchPanel}></div>
                        </div>
                    </div>
                    <div className="dialog_content">
                        <div>
                            <InputGroup compact>
                                <Input style={{width: 250}} addonBefore="输入主小区：" value={this.state.inputCellSearch}
                                       onChange={this.onInputCellSearchChange}/>
                                <Select style={{width: 110}} value={this.state.selectCellSearch}
                                        onChange={this.onSelectCellSearchChange}>
                                    <Option value="CELL_ID">小区ID</Option>
                                    <Option value="CHINESE_NAME">小区中文名</Option>
                                    <Option value="ENGLISH_NAME">小区英文名</Option>
                                    <Option value="LAC">LAC</Option>
                                    <Option value="CI">CI</Option>
                                </Select>
                                <Button onClick={this.searchCell} type="primary">搜小区</Button>
                            </InputGroup>
                        </div>

                        <div style={{marginTop: 5}}>
                            <Input style={{width: 360}} addonBefore="输入主小区ID：" value={this.state.inputNCellSearch}
                                   onChange={this.onInputNCellSearchChange}/>
                            <Button onClick={this.searchNCell} type="primary">搜邻区</Button>
                        </div>

                        <div style={{marginTop: 5}}>
                            <Input style={{width: 360}} addonBefore="输入频点：" value={this.state.inputFreqSearch}
                                   onChange={this.onInputFreqSearchChange}/>
                            <Button onClick={this.searchFreq} type="primary">搜频点</Button>
                        </div>
                    </div>
                </div>

                <div className="resource_list_icon">
                    <button onClick={this.rightPanelSwitcher.bind(this)} className="switch"></button>
                    <div className="shad_v"></div>
                    <div className="load-cell-div">小区加载</div>
                    <br/>
                    <Button onClick={this.loadCellInfo} type="primary">加载小区信息</Button>
                    <br/><br/>
                    <div className="load-cell-div">日期选择</div>
                    <br/>
                    <LocaleProvider locale={zhCN}>
                        <RangePicker
                            defaultValue={[moment(this.state.startDate, dateFormat), moment(this.state.endDate, dateFormat)]}
                            format={dateFormat} onChange={this.onDatePickerChange}/>
                    </LocaleProvider>
                    <br/><br/>
                    <div className="load-cell-div">图形系数</div>
                    <br/>
                    <InputNumber style={{width: 200}} placeholder="输入图形系数，取值0到0.5" value={this.state.imgCoeff} min={0}
                                 max={10} step={0.1} onChange={this.onImgCoeffChange}/><br/><br/>
                    <Button onClick={this.clearAll} type="primary">清除覆盖图</Button><br/><br/>
                    <PopupTable data={this.state.tableFeatures}/>
                </div>
                <LoadingCover>
                    <Child/>
                </LoadingCover>
            </div>
        );
    }
}

function Child() {
    return (
        <div className="spinCover">
            <Spin/>
        </div>
    );
}

class ListDemo extends React.Component {

    render() {
        let dataSource = [];
        for (let i = 0; i < this.props.data.length; i++) {
            let id = this.props.data[i].get('CELL_ID');
            let enName = this.props.data[i].get('EN_NAME');
            let chineseName = this.props.data[i].get('CELL_NAME');
            let latitude = this.props.data[i].get('LATITUDE');
            let longitude = this.props.data[i].get('LONGITUDE');
            dataSource.push({
                key: id,
                id: id,
                enName: enName,
                chineseName: chineseName,
                longitude: longitude,
                latitude: latitude,
                operation: "operation"
            })
        }
        return (
            <List
                itemLayout="horizontal"
                dataSource={dataSource}
                renderItem={item => (
                    <List.Item key={item.id}>
                        <List.Item.Meta
                            title={<a href="#" onClick={console.log(item.id)}>{item.id} {item.chineseName}</a>}
                        />
                    </List.Item>
                )}
            />
        )
    }
}

class PopupTable extends React.Component {

    render() {
        const columns = [{
            title: '小区ID',
            dataIndex: 'id',
        }, {
            title: '小区中文名',
            dataIndex: 'chineseName',
        }, {
            title: '操作',
            dataIndex: 'operation',
            render: (text, record) => {
                return (
                    <a href="#"
                       onClick={() => showDynaCoverage(record.id, record.enName, record.longitude, record.latitude)}>查询动态覆盖图</a>
                );
            }
        }];

        let dataSource = [];

        for (let i = 0; i < this.props.data.length; i++) {
            let id = this.props.data[i].get('CELL_ID');
            let enName = this.props.data[i].get('EN_NAME');
            let chineseName = this.props.data[i].get('CELL_NAME');
            let latitude = this.props.data[i].get('LATITUDE');
            let longitude = this.props.data[i].get('LONGITUDE');
            dataSource.push({
                key: id,
                id: id,
                enName: enName,
                chineseName: chineseName,
                longitude: longitude,
                latitude: latitude,
                operation: "operation"
            })
        }
        return (<Table pagination={{defaultPageSize: 5}} columns={columns} dataSource={dataSource}/>)
    }
}

class LoadingCover extends React.Component {
    constructor(props) {
        super(props);
        this.el = document.createElement('div');
        this.loadingCover = document.getElementById("loading-cover");
    }

    componentDidMount() {
        this.loadingCover.appendChild(this.el);
    }

    componentWillUnmount() {
        this.loadingCover.removeChild(this.el);
    }

    render() {
        if (dis.state.loading) {
            return ReactDOM.createPortal(
                this.props.children,
                this.el,
            );
        } else {
            return null;
        }
    }
}