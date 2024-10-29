import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameOverUI')
export class GameOverUI extends Component {
    @property(Label)
    highestScoreLabel:Label = null;
    @property(Label)
    currentScoreLabel:Label = null;


    showGameOverUI(highestScore:number,currentScore:number){
        this.node.active=true;

        this.highestScoreLabel.string = highestScore.toString();
        this.currentScoreLabel.string = currentScore.toString();
    }
}


