import React from 'react';
import {Link,Route,BrowserRouter as Router} from 'react-router-dom'
import { Menu, Button, Icon, notification} from 'antd';
import gsmInterferMatrix from './gsm-interfer-matrix';
import Map from './ol-map/ol-map';
import GsmDynamicCoverage from './gsm-dynamic-coverage/gsm-dynamic-coverage';

const SubMenu = Menu.SubMenu;

export default class Nav extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            menu: []
        };
        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {
        fetch("/api/app-menu").then(resp => resp.json()).then(json => {
            this.setState({menu: json});
        }).catch(error => {
            console.log("服务器正在维护");
            const key = `open${Date.now()}`;
            const btn = (
                <Button type="primary" size="small" onClick={() => notification.close(key)}>
                    好的
                </Button>
            );
            notification.open({
                message: '服务出现异常',
                description: '服务器连接出错，可能正在维护.',
                btn,
                key,
            });
        });
    }

    handleClick(e) {
        console.log('click', e);
    }

    render() {
        const Home=()=>(
            <h2>主页</h2>
        )
        const Hot=()=>(<div><h2>热门</h2></div>)
        const menuHtml= this.state.menu.map(m=>{
            return(
                <SubMenu key={m.id} title={<span><Icon type="appstore" /><span>{m.name}</span></span>}>
                    {
                        m.children.map(mm => {

                            if(mm.children.length ===0 ){
                                return (
                                    <Menu.Item key={mm.id}>
                                        <Link to={mm.url}>
                                            <span className="nav-text">{mm.name}</span>
                                        </Link>
                                    </Menu.Item>
                                )
                            }else{
                                return (
                                    <SubMenu key={mm.id} title={<span><Icon type="appstore" /><span>{mm.name}</span></span>}>
                                        {
                                            mm.children.map(mmm => {
                                                if(mmm.children.length ===0 ) {
                                                    return (
                                                        <Menu.Item key={mmm.id}>
                                                            <Link to={mmm.url}>
                                                                <span className="nav-text">{mmm.name}</span>
                                                            </Link>
                                                        </Menu.Item>
                                                    )
                                                }else return null;
                                            })
                                        }
                                    </SubMenu>
                                )
                            }
                        })
                    }
                </SubMenu>
            );
        });
        return (
            <Router>
                <div>
                    <Menu onClick={this.handleClick}  mode="horizontal">
                        {menuHtml}
                    </Menu>
                    <Route path="/gsmInterferMatrix" component={gsmInterferMatrix} />
                    <Route path="/home" component={Home} />
                    <Route path="/hot" component={Hot} />
                    <Route path="/ol-map" component={Map} />
                    <Route path="/gsm-dynamic-coverage" component={GsmDynamicCoverage} />
                </div>
            </Router>
        );
    }
}
