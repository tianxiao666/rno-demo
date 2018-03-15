import React from 'react';

import { Tabs, Row, Col, Breadcrumb, DatePicker  } from 'antd';
const TabPane = Tabs.TabPane;

function callback(key) {
    console.log(key);
}

export default function Content() {
    return (
        <div>
            <Row>
                <Col span={1}/>
                <Col span={22}>
                    <Breadcrumb>
                        <Breadcrumb.Item>网优</Breadcrumb.Item>
                        <Breadcrumb.Item><a href="">LTE路测</a></Breadcrumb.Item>
                        <Breadcrumb.Item>LTE路测数据库</Breadcrumb.Item>
                    </Breadcrumb>
                </Col>
                <Col span={1}/>
            </Row>
            <Row>
                <Col span={1}/>
                <Col span={22}>
                    <Tabs onChange={callback} type="card">
                        <TabPane tab="路测数据导入" key="1">
                            <div style={{'background-color': '#aaaaaa', height: '500px'}}>
                                上传时间：<DatePicker />
                            </div>
                        </TabPane>
                        <TabPane tab="路测数据记录" key="2">
                            <div style={{'background-color': '#cccccc', height: '500px'}}>

                            </div>
                        </TabPane>
                    </Tabs>
                </Col>
                <Col span={1}/>
            </Row>
        </div>
    )
}