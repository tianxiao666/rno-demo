import React from 'react';
import ol from 'openlayers';
import { Button, Select } from 'antd';
import styled from 'styled-components';
import './ol-map.css';
import './ol.css';
import './popup.css';
import './gsm-dynamic-coverage.css';

const Option = Select.Option;
const FloatLeftDiv = styled.div`
    float:left;
    margin-left:10px;
`;

const provinceData = ['Zhejiang', 'Jiangsu'];
const cityData = {
    Zhejiang: ['Hangzhou', 'Ningbo', 'Wenzhou'],
    Jiangsu: ['Nanjing', 'Suzhou', 'Zhenjiang'],
};
let map;
let cellLayerGroup;
let cellNameLayerGroup;
export default class Map extends React.Component{

    constructor(props){
        super(props);

        this.state = {
            showRightPanel : true,
            cities: cityData[provinceData[0]],
            secondCity: cityData[provinceData[0]][0],
            provinceId: 0,
            provinceTitle: "",
            cityId: 0,
            cityTitle: "",
            districtId: 0,
            districtTitle: "",
            provinceList : [],
            cityList: [],
            districtList: [],
            showCellName: false
        };

        this.loadCellInfo = this.loadCellInfo.bind(this);
        this.showCellName = this.showCellName.bind(this);
    }

    handleProvinceChange = (value) => {
        fetch("/api/areas?parentId="+value.key).then(resp=>resp.json()).then(cityJson=>{
            fetch("/api/areas?parentId="+cityJson[0].id).then(resp=>resp.json()).then(districtJson=> {
                map.getView().animate({
                    center: ol.proj.fromLonLat([districtJson[0].longitude, districtJson[0].latitude]),
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
        fetch("/api/areas?parentId="+value.key).then(resp=>resp.json()).then(json=>{
            map.getView().animate({
                center: ol.proj.fromLonLat([json[0].longitude, json[0].latitude]),
                duration: 1000,
                zoom: 12
            });
            this.setState({
                cityId: value.key,
                districtList:json,
                districtTitle: json[0].name
            });
        })
    }
    handleDistrictChange = (value) => {
        this.setState({districtTitle: value.label})
        fetch("/api/areas?parentId="+value.key).then(resp=>resp.json()).then(json=>{
            map.getView().animate({
                center: ol.proj.fromLonLat([json[0].longitude, json[0].latitude]),
                duration: 1000,
                zoom: 12
            });
        })
    }

    getProvinceCityDistrictOptions = (parentId, level)=>{
        fetch("/api/areas?parentId="+parentId).then(resp=>resp.json()).then(json=>{
            this.setState({[level]: json});
        })
    }

    loadCellInfo(){
        let filter = " AREA_ID=" + this.state.cityId;
        cellLayerGroup.getLayers().clear();
        let tiled = new ol.layer.Tile({
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
        cellLayerGroup.getLayers().push(tiled);
    }

    showCellName(){
        if(this.state.showCellName){
            cellNameLayerGroup.getLayers().clear();
            this.setState({showCellName: false});
        }else{
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

    componentDidMount(){

        //从区-> 市 -> 省反推，第一次获取的district指的是自身，后续都用前一级的parentId 来找上一级
        fetch("/api/get-current-user").then(resp=>resp.json()).then(currentArea=>{
            // 找到目标
            this.setState({districtId: currentArea.defaultArea});
            fetch("api/get-area-by-id?id="+currentArea.defaultArea).then(resp=>resp.json()).then(district=> {
                // 找到区
                this.setState({cityId: district.parentId});
                fetch("api/get-area-by-id?id="+district.parentId).then(resp=>resp.json()).then(city=> {
                    // 找到市
                    this.setState({
                        provinceId: city.parentId,
                        cityId: district.parentId,
                        cityTitle: city.name,
                        districtId: currentArea.defaultArea,
                        districtTitle: district.name
                    })

                    this.getProvinceCityDistrictOptions(0,"provinceList");
                    this.getProvinceCityDistrictOptions(city.parentId,"cityList");
                    this.getProvinceCityDistrictOptions(city.id,"districtList");

                    fetch("api/get-area-by-id?id="+city.parentId).then(resp=>resp.json()).then(province=> {
                        this.setState({provinceTitle: province.name});
                    });
                });
            });
        });
        cellLayerGroup = new ol.layer.Group({
            zIndex: 2,
            layers: []
        });
        cellNameLayerGroup = new ol.layer.Group();

        let baseLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'http://192.168.9.11:8081/styles/rno-omt/{z}/{x}/{y}.png',
                // url: 'http://rno-omt.hgicreate.com/styles/rno-omt/{z}/{x}/{y}.png',
                zIndex: 1
            })
        });
        map = new ol.Map({
            target: 'map',
            layers: [baseLayer, cellLayerGroup, cellNameLayerGroup],
            view: new ol.View({
                center: ol.proj.fromLonLat([113.355747, 23.127191]),
                zoom: 12
            })
        });

        const popupElement = document.getElementById('popup');
        let popup = new ol.Overlay({
            element: popupElement,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            }
        });
        map.addOverlay(popup);
    }

    rightPanelSwitcher(e){
        if(this.state.showRightPanel){
            document.getElementsByClassName("switch")[0].className="switch_hidden";
            document.getElementsByClassName("resource_list_icon")[0].className="resource_list_icon_hidden";
            this.setState({showRightPanel: false});
        }else if(this.state.showRightPanel === false){
            document.getElementsByClassName("switch_hidden")[0].className="switch";
            document.getElementsByClassName("resource_list_icon_hidden")[0].className="resource_list_icon";
            this.setState({showRightPanel: true});
        }
    }

    render(){

        const provinceOptions = this.state.provinceList.map(province => <Option value={province.id} key={province.id}>{province.name}</Option>);
        const cityOptions = this.state.cityList.map(city => <Option value={city.id} key={city.id}>{city.name}</Option>);
        const districtOptions = this.state.districtList.map(district => <Option value={district.id} key={district.id}>{district.name}</Option>);

        return(
            <div>
                <div id="map" className="map"><div id="popup" className="ol-popup"></div></div>
                <div className="dialog" style={{ top:48}}>
                    <FloatLeftDiv>
                        <Select labelInValue value={{key: this.state.provinceTitle}} style={{ width: 90 }} onChange={this.handleProvinceChange}>
                            {provinceOptions}
                        </Select>
                    </FloatLeftDiv>
                    <FloatLeftDiv>
                        <Select labelInValue value={{key: this.state.cityTitle}} style={{ width: 90 }} onChange={this.handleCityChange}>
                            {cityOptions}
                        </Select>
                    </FloatLeftDiv>
                    <FloatLeftDiv>
                        <Select labelInValue value={{key: this.state.districtTitle}} style={{ width: 90 }} onChange={this.handleDistrictChange}>
                            {districtOptions}
                        </Select>
                    </FloatLeftDiv>
                    <Button onClick={this.showCellName} type="primary" >开关小区名字</Button>
                </div>
                <div className="resource_list_icon">
                    <button onClick={this.rightPanelSwitcher.bind(this)} type="primary" className="switch"></button>
                    <div className="shad_v"></div>
                    <div className="load-cell-div">小区加载</div>
                    <Button onClick={this.loadCellInfo} type="primary">加载小区信息</Button>
                </div>
            </div>
        );
    }

}