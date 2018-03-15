import React from 'react';
import './css/home.css';
import Header from './components/header';
import Nav from './components/nav';
import Main from './components/main';
import Footer from './components/footer';

export default class Home extends React.Component {
    constructor() {
        super();
        this.state = {
            app: {},
            fullName: '',
            username: '',
            url: ''
        };

        this.handleUrlChange = this.handleUrlChange.bind(this);
    }

    componentDidMount() {
        fetch("/api/app-info").then(resp => resp.json()).then(json => {
            this.setState({
                app: json.app,
                fullName: json.fullName,
                username: json.username
            });
            document.title = this.state.app.name;
        });
    }

    handleUrlChange(url) {
        console.log("当前环境：" + process.env.NODE_ENV);
        if (process.env.NODE_ENV === "development") {
            url = url.startsWith("http://") ? url : "http://localhost:8383/" + url;
        }

        this.setState({ url });
    }

    render() {
        return (
            <div>
                <Header onUrlChange={this.handleUrlChange} fullName={this.state.fullName}/>
                <Nav onUrlChange={this.handleUrlChange}/>
                <Main url={this.state.url}/>
                <Footer app={this.state.app}/>
            </div>
        );
    }
}
