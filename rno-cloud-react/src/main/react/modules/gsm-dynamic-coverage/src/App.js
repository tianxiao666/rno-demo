import React, {Component} from 'react';
import './App.css';
import './css/home.css';
import 'antd/dist/antd.css';
import Nav from './components/nav'

class App extends Component {
    render() {
        return (
            <div className="App">
                <Nav/>
            </div>
        );
    }
}

export default App;
