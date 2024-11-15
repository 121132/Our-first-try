import { _decorator, Button, Component, director, Node, sys, System } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameOverManage')
export class GameOverManage extends Component {

    @property(Node)
    win: Node = null;
    @property(Node)
    lose: Node = null;

    @property(Node)
    restart: Node = null;
    @property(Node)
    quit: Node = null;

    private playerFlag: string = null;
    private playerScore: string = null;
    private aiFlag: string = null;
    private aiScore: string = null;


    start() {
        this.playerFlag = sys.localStorage.getItem('playerFlag'); // 获取数据
        this.playerScore = sys.localStorage.getItem('playerScore');
        this.aiFlag = sys.localStorage.getItem('aiFlag');
        this.aiScore = sys.localStorage.getItem('aiScore');
        if (this.playerFlag == 'true') {
            this.lose.active = true;
            this.win.active = false;
        }else if (this.aiFlag == 'true') {
            this.win.active = true;
            this.lose.active = false;
        }
    }

    onLoad() {
        this.restart.on('click', this.restartGame, this);
        this.quit.on('click', this.quitGame, this);
    }

    restartGame(){
        director.loadScene('scene_main')
    }

    quitGame(){
        sys.localStorage.clear();
        // director.end();

    }
}

