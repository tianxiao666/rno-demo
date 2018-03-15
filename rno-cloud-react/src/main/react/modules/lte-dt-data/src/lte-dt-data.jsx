import React from 'react';
import Content from './components/content';

import { LocaleProvider } from 'antd';
import 'antd/dist/antd.css';
import zhCN from 'antd/lib/locale-provider/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

export default function LteDtData(props) {
    return (
        <LocaleProvider locale={zhCN}>
            <div>
                <Content />
            </div>
        </LocaleProvider>
    );
}
