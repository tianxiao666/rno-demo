import React from 'react';

export default class UserInfo extends React.Component {

    handleUserConfig(e) {
        e.stopPropagation();
        this.props.onUrlChange("rno4g/sys-user-config/sys-user-config.html");
    }

    handleApi(e) {
        e.stopPropagation();
        this.props.onUrlChange("swagger-ui.html");
    }

    handleSystemConfig(e) {
        e.stopPropagation();
        this.props.onUrlChange("system.html");
    }

    handleQuit(e) {
        e.stopPropagation();
        fetch("/api/logout").then(() => window.location.href = "/");
    }

    render() {
        return (
            <div className="user-info">
                <b>{this.props.fullName}，欢迎您！</b>
                <a href="#" onClick={this.handleUserConfig.bind(this)}>
                    我的设置
                </a>
                <span className="split"> | </span>
                <a href="#" onClick={this.handleApi.bind(this)}>API接口</a>
                <span className="split"> | </span>
                <a href="#" onClick={this.handleSystemConfig.bind(this)}>系统设置</a>
                <span className="quit">
                <a href="#" onClick={this.handleQuit.bind(this)}>退出</a>
            </span>
            </div>
        )
    }
}
