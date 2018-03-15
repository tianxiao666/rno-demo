import React from 'react';

// 在HTML5的Session存储中保存菜单位置，使浏览器在刷新后能回到之前的界面
const STORAGE_KEY = 'rno-selected-menu-storage';
const selectedMenuStorage = {
    fetch: function () {
        if (sessionStorage.getItem(STORAGE_KEY)) {
            return JSON.parse(sessionStorage.getItem(STORAGE_KEY));
        } else {
            return null;
        }
    },
    save: function (selectedMenu) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedMenu));
    }
};

export default class Nav extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            menu: [],
            hover1: -1,
            hover2: -1,
            hover3: -1,
            menuSelected1: -1,
            menuSelected2: -1,
            menuSelected3: -1,
        };
        this.onMouseEnter1 = this.onMouseEnter1.bind(this);
        this.onMouseLeave1 = this.onMouseLeave1.bind(this);
        this.onMouseEnter2 = this.onMouseEnter2.bind(this);
        this.onMouseLeave2 = this.onMouseLeave2.bind(this);
        this.onMouseEnter3 = this.onMouseEnter3.bind(this);
        this.onMouseLeave3 = this.onMouseLeave3.bind(this);
        this.onClick2 = this.onClick2.bind(this);
        this.onClick3 = this.onClick3.bind(this);
    }

    onMouseEnter1(e) {
        this.setState({
            hover1: e.target.value,
        });
    }

    onMouseLeave1(e) {
        this.setState({
            hover1: -1,
        });
    }

    onMouseEnter2(e) {
        this.setState({
            hover2: e.target.value,
        });
    }

    onMouseLeave2(e) {
        this.setState({
            hover2: -1,
        });
    }

    onMouseEnter3(e) {
        this.setState({
            hover3: e.target.value,
        });
    }

    onMouseLeave3(e) {
        this.setState({
            hover3: -1,
        });
    }

    onClick2(e) {
        e.stopPropagation();
        const m2 = this.state.menu.map(m => m.children.filter(mm => mm.id === e.target.value))
            .filter(result => result.length > 0)[0][0];
        if (m2.children.length === 0) {
            this.setState({
                menuSelected3: -1,
                menuSelected2: m2.id,
                menuSelected1: m2.pid
            });

            // 保存菜单位置到HTML5本地存储
            selectedMenuStorage.save({
                menuLevel: 2,
                menuId: m2.id
            });

            this.props.onUrlChange(m2.url);
        }
    }

    onClick3(e) {
        e.stopPropagation();
        const m3 = this.state.menu.map(m => m.children
            .map(mm => mm.children.filter(mmm => mmm.id === e.target.value)))
            .map(mmmm => mmmm.filter(mmmmm => mmmmm.length > 0)).filter(r => r.length > 0)[0][0][0];

        const m2 = this.state.menu.map(m => m.children.filter(mm => mm.id === m3.pid))
            .filter(r => r.length > 0)[0][0];

        this.setState({
            menuSelected3: m3.id,
            menuSelected2: m2.id,
            menuSelected1: m2.pid
        });

        selectedMenuStorage.save({
            menuLevel: 3,
            menuId: m3.id
        });

        this.props.onUrlChange(m3.url);
    }

    componentDidMount() {
        fetch("/api/app-menu").then(resp => resp.json()).then(json => {
            this.setState({menu: json});
            this.restoreSelectedMenu();
        });
    }

    // 获取保存在HTML5 Session存储的菜单位置，恢复显示
    restoreSelectedMenu() {
        let selectedMenu = selectedMenuStorage.fetch();
        if (!(selectedMenu)) {
            // 缺省菜单项，取到菜单第一项可点击的功能（可能在第2级第1项也可能在第3级级第1项）
            const m2 = this.state.menu[0].children[0];
            selectedMenu = m2.children ?
                {
                    menuLevel: 2,
                    menuId: m2.id
                } : {
                    menuLevel: 3,
                    menuId: m2.children[0].id
                }
        }

        selectedMenu.menuLevel === 2 ?
            this.onClick2({
                target: {value: selectedMenu.menuId},
                stopPropagation: () => {
                }
            })
            :
            this.onClick3({
                target: {value: selectedMenu.menuId},
                stopPropagation: () => {
                }
            })
    }

    render() {
        const navHtml = this.state.menu.map(m => {
                return (
                    <li key={m.id}
                        value={m.id}
                        className={`firstLevelMenu
                        ${this.state.hover1 === m.id ? 'firstLevelMenuOn' : ''}
                        ${this.state.menuSelected1 === m.id ? 'firstLevelMenuSelected' : ''}
                        `}
                        onMouseEnter={this.onMouseEnter1}
                        onMouseLeave={this.onMouseLeave1}>
                        {m.name}
                        <ul className={this.state.hover1 === m.id ? '' : 'hidden'}>
                            {m.children.map(m2 =>
                                <li key={m2.id}
                                    value={m2.id}
                                    className={`secondLevelMenu
                                    ${this.state.hover2 === m2.id ? 'secondLevelMenuOn' : ''}
                                    ${this.state.menuSelected2 === m2.id ? 'secondLevelMenuSelected' : ''}
                                    `}
                                    onMouseEnter={this.onMouseEnter2}
                                    onMouseLeave={this.onMouseLeave2}
                                    onClick={this.onClick2}>
                                    {m2.name}
                                    {m2.children.length > 0 && (
                                        <span>
                                            <div style={{float: 'right'}}>
                                                <span className='arrow'/>
                                            </div>
                                            <ul className={`thirdMenu
                                            ${this.state.hover2 === m2.id ? '' : 'hidden'}
                                            `}>
                                                {m2.children.map(m3 =>
                                                    <li key={m3.id}
                                                        value={m3.id}
                                                        className={`thirdLevelMenu
                                                       ${this.state.hover3 === m3.id ? 'thirdLevelMenuOn' : ''}
                                                       ${this.state.menuSelected3 === m3.id ? 'thirdLevelMenuSelected' : ''}
                                                       `}
                                                        onMouseEnter={this.onMouseEnter3}
                                                        onMouseLeave={this.onMouseLeave3}
                                                        onClick={this.onClick3}>
                                                        {m3.name}
                                                    </li>)}
                                            </ul>
                                        </span>
                                    )}
                                </li>)
                            }
                        </ul>
                    </li>);
            }
        );

        return (
            <nav>
                <ul>
                    {navHtml}
                </ul>
            </nav>
        );
    }
}
