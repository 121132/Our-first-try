import { _decorator, AudioClip, Component, director, Node } from 'cc';
import { BombUI } from './UI/BombUI';
import { ScoreUI } from './UI/ScoreUI';
import { Player } from './Player';
import { GameOverUI } from './UI/GameOverUI';
import { AudioMgr } from './AudioMgr';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    private static instance:GameManager;

    public static getInstance():GameManager{
        return this.instance;
    }
    @property
    private bombNumber:number = 0;
    @property(BombUI)
    bombUI:BombUI = null;
    @property
    private score:number = 0;
    @property(ScoreUI)
    scoreUI:ScoreUI = null;
    @property(Player)
    player:Player = null;
    @property(Node)
    pauseButtonNode:Node =null;
    @property(Node)
    resumeButtonNode:Node = null;
    @property(GameOverUI)
    gameoverUI:GameOverUI = null;

    @property(AudioClip)
    gameMusic:AudioClip=null;
    @property(AudioClip)
    buttonAudio:AudioClip = null;
    @property(AudioClip)
    gameoverAudio:AudioClip = null;

    protected onLoad(): void {
        GameManager.instance = this;
    }
    protected start(): void {
        AudioMgr.inst.play(this.gameMusic,0.1);
    }

    public AddBomb(){
        this.bombNumber+=1;
        this.bombUI.updateUI(this.bombNumber);
    }
    public GetBombNumber():number{
        return this.bombNumber;
    }

    public addScore(s:number){
        this.score+=s;
        this.scoreUI.updateUI(this.score);
    }

    onPauseButtonClick(){ 
        AudioMgr.inst.playOneShot(this.buttonAudio,1);
        AudioMgr.inst.pause();
        director.pause();
        this.player.disableControl();
        this.pauseButtonNode.active=false;
        this.resumeButtonNode.active=true;
    }

    onResumeButtonClick(){
        AudioMgr.inst.playOneShot(this.buttonAudio,1);
        AudioMgr.inst.resume();
        director.resume();
        this.player.enableControl();
        this.pauseButtonNode.active=true;
        this.resumeButtonNode.active=false;
    }

    gameOver(){
        AudioMgr.inst.playOneShot(this.gameoverAudio);
        this.onPauseButtonClick();
        //显示gameover ui 更新分数

        let hScore = localStorage.getItem("HighestScore");
        let hScoreInt = 0;

        if(hScore!==null){
            hScoreInt = parseInt(hScore,10);
        }

        if(this.score>hScoreInt){
            localStorage.setItem("HighestScore",this.score.toString());
        }

        this.gameoverUI.showGameOverUI(hScoreInt,this.score);
    }

    onRestartButtonClick(){
        AudioMgr.inst.playOneShot(this.buttonAudio,1);
        this.onResumeButtonClick();
        director.loadScene(director.getScene().name);
    } 
    isHaveBomb():boolean{
        return this.bombNumber>0;
    }

    useBomb(){
        this.bombNumber-=1;
        this.bombUI.updateUI(this.bombNumber);
    }

}


