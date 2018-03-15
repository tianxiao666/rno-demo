import React from 'react';

export default class Area extends React.Component {

    constructor(props) {
        super(props);
        const defaultArea = props.defaultArea;

        this.state = {
            province: Math.round(defaultArea / 10000) * 10000,
            city: Math.round(defaultArea / 100) * 100,
            provinces: [],
            cities: []
        };
    }

    componentDidMount() {
        fetch("/api/areas?parentId=0").then(resp => resp.json())
            .then(json => this.setState({provinces: json}));
        fetch("/api/areas?parentId=" + this.state.province).then(resp => resp.json())
            .then(json => this.setState({cities: json}));
    }

    render() {
        return (
            <span>
                <select value={this.state.province} onChange={this.handleChangeProvince.bind(this)}>
                    {this.state.provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={this.state.city} onChange={this.handleChangeCity.bind(this)}>
                    {this.state.cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </span>
        );
    }

    handleChangeProvince(event) {
        this.setState({province: event.target.value});
        fetch("/api/areas?parentId=" + event.target.value).then(resp => resp.json())
            .then(json => this.setState({cities: json}));
    }

    handleChangeCity(event) {
        this.setState({city: event.target.value});
    }
}