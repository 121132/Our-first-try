import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LifeCountUI')
export class LifeCountUI extends Component {

    @property(Label)
    numberLabel:Label = null;

    updateUI(count:number){
        this.numberLabel.string = count.toString();
    }
}


