import React from 'react';

export default function Footer(props) {
    return (
        <footer>
            <span>{ props.app.name } { props.app.version }</span>
            <a href="">使用说明书下载</a>
            <span>维护热线: 020-28817300-201 Copyright © 广东海格怡创科技有限公司 |</span>
            <a href="http://www.miitbeian.gov.cn/" target="new">粤ICP备12023904号</a>
        </footer>
    );
}
