import { _decorator, Component, Node, input, Input, EventKeyboard, KeyCode, Prefab, instantiate, color, Vec3, math, Label, sys, director } from 'cc';
import { AwardManage } from './AwardManage';
import { PlayerManage } from './PlayerManage'
const { ccclass, property } = _decorator;

@ccclass('AISnake')
export class AISnake extends Component {
    
    private direction: string = '';     // 当前方向
    private bestDirection: string = ''; // 最优方向
    private speed: number = 50;         // 蛇的移动速度
    private gridSize: number = 50;      // 网格大小
    private moveTime: number = 0;       // 计时器
    private moveTimer: number = 0.2;    // 每0.2秒执行一次移动
    public flag: boolean = false;       // 游戏结束标志
    private positionX: number = 0;      // 蛇头的X坐标
    private positionY: number = 0;      // 蛇头的Y坐标

    private tail: { node: Node, direction: string }[] = []; // 存储蛇身的节点和方向

    @property(Prefab)
    bodyPrefab: Prefab = null;  // 蛇身的预制体

    @property(Node)
    awardManager: Node = null; // 奖励管理节点
    private awardManageScript: AwardManage = null; // 奖励管理脚本

    @property(Node)
    playerSnake: Node = null;  // 玩家蛇
    private PlayerManageScript: PlayerManage = null; // 玩家蛇脚本
    
    @property(Label)
    score: Label = null;
    private playerScore: number = 0; // 得分

    start() {
        this.positionX = this.node.position.x;
        this.positionY = this.node.position.y;
        this.direction = 'right';  // 初始化方向
        this.awardManageScript = this.awardManager.getComponent(AwardManage);
        this.PlayerManageScript = this.playerSnake.getComponent(PlayerManage);
    }

    update(deltaTime: number) {
        if (!this.flag && !this.PlayerManageScript.flag) {
            this.moveTime += deltaTime;
            if (this.moveTime >= this.moveTimer) {
                this.moveTime = 0;
                if (((this.node.position.x - this.positionX) % this.gridSize <= 0.2 || (this.node.position.x - this.positionX) % this.gridSize >= 0.8) && ((this.node.position.y - this.positionY) % this.gridSize <= 0.2 || (this.node.position.y - this.positionY) % this.gridSize >= 0.8)) {
                    this.bestDirection = this.chooseDirection(8); // 选择最佳方向
                    this.move();  // 移动蛇头                                         
                    // 奖励碰撞检测
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
            //     console.log("ai结束！");  // 输出结束信息
            // }else {
            //     console.log("wj结束！");
            // }
            sys.localStorage.setItem('aiFlag', this.flag);  // 存储数据
            sys.localStorage.setItem('aiScore', this.score);  // 存储数据
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

    // 检查蛇头是否与蛇身碰撞
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
        if (this.checkCollisionWithBody(this.node.position) || this.PlayerManageScript.checkCollisionWithBody(this.node.position)) {    
            this.flag = true;  // 设置游戏结束标志
            return;
        }

        // 记录原来蛇头的位置
        const previousHeadPosition = { x: this.node.position.x, y: this.node.position.y };

        if (this.direction === 'up' && this.bestDirection === 'down') {
            if (this.node.position.x < 0) {
                this.bestDirection = 'right';
            }else {
                this.bestDirection = 'left';
            }
        }
        if (this.direction === 'down' && this.bestDirection === 'up') {
            if (this.node.position.x < 0) {
                this.bestDirection = 'right';
            }else {
                this.bestDirection = 'left';
            }
        }
        if (this.direction === 'left' && this.bestDirection === 'right') {
            if (this.node.position.y < 0) {
                this.bestDirection = 'up';
            }else {
                this.bestDirection = 'down';
            }
        }
        if (this.direction === 'right' && this.bestDirection === 'left') {
            if (this.node.position.y < 0) {
                this.bestDirection = 'up';
            }else {
                this.bestDirection = 'down';
            }
        }
        this.direction = this.bestDirection;

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

    chooseDirection(depth: number): string {
        let bestDirection = this.direction;
        let maxScore = -Infinity;
    
        // 遍历所有可能的方向
        const directions = ['up', 'down', 'left', 'right'];
        for (let dir of directions) {
            // 模拟多步移动，评估总分
            const score = this.simulateMove(dir, depth);
            if (score > maxScore) {
                maxScore = score;
                bestDirection = dir;
            }
        }
    
        // 最佳方向
        return bestDirection;
    }
    
    // 模拟在指定方向上的一系列移动，递归评估总分
    simulateMove(direction: string, depth: number): number {
        if (depth === 0 || this.flag) {
            return 0;
        }
    
        // 评估即时分数
        const immediateScore = this.evaluateMove(direction);
        if (immediateScore < 0) return immediateScore; // 撞墙或撞玩家蛇直接返回负分
    
        // 根据即时分数 + 后续步骤的总分来获得该路径的总分
        const nextDirection = this.chooseDirection(depth - 1);
        const futureScore = this.simulateMove(nextDirection, depth - 1);
    
        return immediateScore + futureScore;
    }

    // 评估单步移动的分数
    evaluateMove(direction: string): number {
        const newHeadPosition = this.getNewPosition(direction);
        let score = 0;

        // 往奖励方向移动加分，即去吃奖励
        if (this.awardManageScript.getAwards().length !== 0 && this.awardManageScript.getNearestAwardDistance(newHeadPosition) < this.awardManageScript.getNearestAwardDistance(this.node.position)) {
            score += 500
        }
    
        // 碰墙扣分
        if (this.isCollisionWithWall(newHeadPosition)) {
            score -= 10000;
        }

        // 碰玩家蛇扣分
        if (this.isCollisionWithPlayerSnake(newHeadPosition)) {
            score -= 10000;
        }

        // 撞到自己身体扣分
        if (this.checkCollisionWithBody(newHeadPosition)) {
            score -= 10000;
        }
    
        // 阻挡玩家蛇额外加分
        if (this.isBlockingPlayerSnake(newHeadPosition, this.node.position)) {
            score += 100;
        }
    
        return score;
    }


    // 根据方向获取蛇头的新的位置
    getNewPosition(direction: string): Vec3 {
        const newPosition = new Vec3(this.node.position.x, this.node.position.y, 0);

        switch (direction) {
            case 'up':
                newPosition.y += this.gridSize;
                break;
            case 'down':
                newPosition.y -= this.gridSize;
                break;
            case 'left':
                newPosition.x -= this.gridSize;
                break;
            case 'right':
                newPosition.x += this.gridSize;
                break;
        }

        return newPosition;
    }

    // 检查是否会撞到墙
    isCollisionWithWall(position: Vec3): boolean {
        return (
            position.x < -655 || position.x > 655 ||
            position.y < -380 || position.y > 380
        );
    }

    // 检查是否会撞到玩家蛇
    isCollisionWithPlayerSnake(position: Vec3): boolean {
        return this.PlayerManageScript.checkCollisionWithBody(position);
    }

    // 检查是否可以阻碍玩家蛇吃到奖励
    isBlockingPlayerSnake(newPosition: Vec3, position: Vec3): boolean {
        if (this.awardManageScript.getAwards().length === 0) {
            return false;
        }
    
        // 获取奖励和玩家蛇的当前位置
        const foodPosition = this.awardManageScript.getNearestAwardPosition(this.playerSnake.position).position;
        const playerPosition = this.playerSnake.position;
    

        // 计算玩家蛇和食物之间连线的距离
        const lineLength = Math.sqrt(Math.pow(foodPosition.x - playerPosition.x, 2) + Math.pow(foodPosition.y - playerPosition.y, 2));
        if (lineLength === 0) return false;  // 避免除以0的情况（玩家蛇和食物在同一个位置）

        // 点到直线的距离公式
        const distanceNew = Math.abs(
            (foodPosition.y - playerPosition.y) * newPosition.x -
            (foodPosition.x - playerPosition.x) * newPosition.y +
            foodPosition.x * playerPosition.y -
            foodPosition.y * playerPosition.x
        ) / lineLength;

        const distanceOld = Math.abs(
            (foodPosition.y - playerPosition.y) * position.x -
            (foodPosition.x - playerPosition.x) * position.y +
            foodPosition.x * playerPosition.y -
            foodPosition.y * playerPosition.x
        ) / lineLength;

        // 判断蛇头位置是否在误差范围内，即接近玩家蛇和食物的连线
        return distanceNew < distanceOld;
    }
    
    // 得到身体节点
    getTail(): { node: Node, direction: string }[] {
        return this.tail;
    }
}
