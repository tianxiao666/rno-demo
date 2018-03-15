import React from 'react';

export default class Main extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            mainHeight: document.documentElement.clientHeight - 135
        };

        this.handleResize = this.handleResize.bind(this);
    }

    handleResize() {
        this.setState({mainHeight: document.documentElement.clientHeight - 135});
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    render() {
        return (
            <main style={{height: this.state.mainHeight + 'px'}}>
                <iframe src={this.props.url}/>
            </main>
        );
    }
}
