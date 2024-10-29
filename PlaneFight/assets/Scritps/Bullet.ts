import { _decorator, Component, Node, sp } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Bullet')
export class Bullet extends Component {
    @property
    speed:number = 200;

    start() {

    }

    update(deltaTime: number) {
        const position = this.node.position;
        this.node.setPosition(position.x,position.y+this.speed*deltaTime,position.z);

        if(position.y>440){
            this.node.destroy();
        }
    }
}


