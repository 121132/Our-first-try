import { _decorator, Component, Node, input, Input, EventKeyboard, KeyCode, Prefab, instantiate, color, Vec3, Label, sys, director } from 'cc';
import { AwardManage } from './AwardManage';
import { AISnake } from './AISnake';
const { ccclass, property } = _decorator;

@ccclass('PlayerManage')
export class PlayerManage extends Component {

    private direction: string = '';  // 当前方向
    private speed: number = 50;      // 蛇的移动速度
    private gridSize: number = 50;   // 网格大小
    private moveTime: number = 0;    // 计时器
    private moveTimer: number = 0.2; // 每0.2秒执行一次移动
    public flag: boolean = false;    // 游戏结束标志
    private positionX: number = 0;   // 蛇头的X坐标
    private positionY: number = 0;   // 蛇头的Y坐标

    private tail: { node: Node, direction: string }[] = []; // 存储蛇身的节点和方向

    @property(Prefab)
    bodyPrefab: Prefab = null; // 蛇身的预制体

    @property(Node)
    awardManager: Node = null; // 奖励管理节点
    private awardManageScript: AwardManage = null; // 奖励管理脚本

    @property(Node)
    aiSnake: Node = null; // 电脑蛇节点
    private AISnakeScript: AISnake = null; // 电脑蛇脚本

    @property(Label)
    score: Label = null;
    private playerScore: number = 0; // 得分

    start() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        this.positionX = this.node.position.x;
        this.positionY = this.node.position.y;
        this.direction = 'right';  // 初始化方向
        this.awardManageScript = this.awardManager.getComponent(AwardManage);
        this.AISnakeScript = this.aiSnake.getComponent(AISnake);
    }

    update(deltaTime: number) {
        if (!this.flag && !this.AISnakeScript.flag) {
            this.moveTime += deltaTime;
            if (this.moveTime >= this.moveTimer) {
                this.moveTime = 0;
                if (((this.node.position.x - this.positionX) % this.gridSize <= 0.2 || (this.node.position.x - this.positionX) % this.gridSize >= 0.8) && ((this.node.position.y - this.positionY) % this.gridSize <= 0.2 || (this.node.position.y - this.positionY) % this.gridSize >= 0.8)) {
                    this.move();  // 移动蛇头                                         
                    // 碰撞检测
                    if (this.awardManageScript.checkCollision(this.node)) {
                        this.addBody();  // 增加蛇身
                        this.playerScore += 10;
                        this.score.string = this.playerScore.toString();
                    }
                }
            }
        } else {
            this.awardManageScript.onDestroy();
            // if (this.flag) {
            //     console.log("wj结束！");  // 输出结束信息
            // }else {
            //     console.log("ai结束！");
            // }
            sys.localStorage.setItem('playerFlag', this.flag);  // 存储数据
            sys.localStorage.setItem('playerScore', this.score);  // 存储数据
            director.loadScene('scene_over');
        }       
    }

    // 增加蛇身
    addBody() {
        
        // 创建蛇身
        const body = instantiate(this.bodyPrefab);
        this.node.parent.addChild(body);
    
        // 如果有蛇身，蛇尾部的身体部分位置是基于蛇尾部分的位置
        if (this.tail.length > 0) {
            const lastBody = this.tail[this.tail.length - 1];
            body.setPosition(lastBody.node.position.x, lastBody.node.position.y, 0);
        } else {
            // 如果是第一个蛇身，设置为蛇头前进后的一个格子位置
            switch (this.direction) {
                case 'up':
                    body.setPosition(this.node.position.x, this.node.position.y - this.gridSize, 0);  // 蛇头向上，蛇身向下
                    break;
                case 'down':
                    body.setPosition(this.node.position.x, this.node.position.y + this.gridSize, 0);  // 蛇头向下，蛇身向上
                    break;
                case 'left':
                    body.setPosition(this.node.position.x + this.gridSize, this.node.position.y, 0);  // 蛇头向左，蛇身向右
                    break;
                case 'right':
                    body.setPosition(this.node.position.x - this.gridSize, this.node.position.y, 0);  // 蛇头向右，蛇身向左
                    break;
            }
        }
    
        // 新增身体部分，记录它的位置和方向
        this.tail.push({ node: body, direction: this.direction });
    }

    checkCollisionWithBody(headPosition: Vec3): boolean {
        const tolerance = 0.1;  // 设置容忍范围
        for (let i = 0; i < this.tail.length; i++) {
            const body = this.tail[i];
            if (Math.abs(headPosition.x - body.node.position.x) < tolerance &&
                Math.abs(headPosition.y - body.node.position.y) < tolerance) {
                // 如果蛇头与身体部分在误差范围内，触发碰撞逻辑
                return true;
            }
        }
        return false;
    }

    // 更新蛇的身体位置
    move() {

        // 检查碰撞
        if (this.checkCollisionWithBody(this.node.position) || this.AISnakeScript.checkCollisionWithBody(this.node.position)) {    
            this.flag = true;  // 设置游戏结束标志
            return;
        }

        // 先更新蛇头的位置
        const previousHeadPosition = { x: this.node.position.x, y: this.node.position.y };

        // 根据当前方向移动蛇头
        switch (this.direction) {
            case 'up':
                if ((this.node.position.y + this.speed) <= 380) {
                    this.node.setPosition(this.node.position.x, this.node.position.y + this.speed, 0);
                } else {
                    this.flag = true;
                }       
                break;
            case 'down':
                if ((this.node.position.y - this.speed) >= -380) {
                    this.node.setPosition(this.node.position.x, this.node.position.y - this.speed, 0);
                } else {
                    this.flag = true;
                }
                break;
            case 'left':
                if ((this.node.position.x - this.speed) >= -655) {
                    this.node.setPosition(this.node.position.x - this.speed, this.node.position.y, 0);
                } else {
                    this.flag = true;
                }
                break;
            case 'right':
                if ((this.node.position.x + this.speed) <= 655) {
                    this.node.setPosition(this.node.position.x + this.speed, this.node.position.y, 0);
                } else {
                    this.flag = true;
                }
                break;
        }

        // 更新蛇身的位置
        for (let i = this.tail.length - 1; i > 0; i--) {
            const currentBody = this.tail[i];
            const prevBody = this.tail[i - 1];

            // 更新身体的位置，不会跟随蛇头的方向，而是保持自己的运动方向
            currentBody.node.setPosition(prevBody.node.position.x, prevBody.node.position.y, 0);

            // 更新蛇身的方向
            currentBody.direction = prevBody.direction;
        }

        // 更新蛇身第一个部分（即新的蛇头）的位置
        if (this.tail.length > 0) {
            this.tail[0].node.setPosition(previousHeadPosition.x, previousHeadPosition.y, 0);
        }
    }

    // 键盘输入处理
    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.KEY_W:
                if (this.tail.length > 0) { // 排除有蛇尾的情况下掉头
                    if (this.direction != 'down') {
                        this.direction = 'up';
                    }
                }else {
                    this.direction = 'up';
                }                
                break;
            case KeyCode.KEY_S:
                if (this.tail.length > 0) {
                    if (this.direction != 'up') {
                        this.direction = 'down';
                    }
                }else {
                    this.direction = 'down';
                }             
                break;
            case KeyCode.KEY_A:
                if (this.tail.length > 0) {
                    if (this.direction != 'right') {
                        this.direction = 'left';
                    }
                }else {
                    this.direction = 'left';
                }    
                break;
            case KeyCode.KEY_D:
                if (this.tail.length > 0) {
                    if (this.direction != 'left') {
                        this.direction = 'right';                    
                    }
                }else {
                    this.direction = 'right';
                }
                break;
        }
    }

    // 得到身体节点
    getTail(): {node: Node, direction: string}[] {
        return this.tail;
    }
}
