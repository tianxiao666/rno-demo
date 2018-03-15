import React from 'react';
import Logo from '../images/hgicreate-rno-logo.png';
import HeaderInfo from "./header-info";

export default class Header extends React.Component {
    render() {
        return (
            <header>
                <div className="logo"><img src={Logo} alt="Logo"/></div>
                <HeaderInfo {...this.props}/>
            </header>
        );
    }
}
