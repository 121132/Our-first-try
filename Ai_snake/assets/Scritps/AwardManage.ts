import { _decorator, Component, Node, Prefab, instantiate, Vec3, math, director } from 'cc';
import { AISnake } from './AISnake';
import { PlayerManage } from './PlayerManage';
const { ccclass, property } = _decorator;

@ccclass('AwardManage')
export class AwardManage extends Component {

    @property(Prefab)
    awardPrefab: Prefab = null; // 奖励的预制体

    private gridSize: number = 50; // 网格大小
    private gridWidth: number = 26;  // 水平网格数 - 1 27
    private gridHeight: number = 15; // 垂直网格数 - 1 16
    
    private awards: Node[] = []; // 存储生成的奖励

    @property(Node)
    aiSnake: Node = null;
    private AISnakeScript: AISnake = null;

    @property(Node)
    playerSnake: Node = null;
    private PlayerManageScript: PlayerManage = null;

    @property(Node)
    pauseButton: Node = null;
    @property(Node)
    resumeButton: Node = null;

    start() {
        this.AISnakeScript = this.aiSnake.getComponent(AISnake);
        this.PlayerManageScript = this.playerSnake.getComponent(PlayerManage);
        this.schedule(this.spawnAward, 1); // 隔4秒生成一个新的奖励
    }

    // 随机生成奖励,保证不会重叠
    RadomAward(): Vec3{
        // 随机位置生成奖励
        let randomX = math.randomRangeInt(0, this.gridWidth) * this.gridSize;
        let randomY = math.randomRangeInt(0, this.gridHeight) * this.gridSize;
        // 生成奖励的位置
        let position = new Vec3(randomX - this.gridWidth * this.gridSize / 2, randomY - this.gridHeight * this.gridSize / 2, 0);
        while (this.isOverlap(position)) {
            // 随机位置生成奖励
            randomX = math.randomRangeInt(0, this.gridWidth) * this.gridSize;
            randomY = math.randomRangeInt(0, this.gridHeight) * this.gridSize;
            // 生成奖励的位置
            position = new Vec3(randomX - this.gridWidth * this.gridSize / 2, randomY - this.gridHeight * this.gridSize / 2, 0);
        }
        return position;
    }

    // 添加奖励
    spawnAward() {
        const award = instantiate(this.awardPrefab);
        this.node.addChild(award);
        award.setPosition(this.RadomAward());
        // 保存奖励节点
        this.awards.push(award);  
    }

    // 判断奖励是否生成在蛇身上
    isOverlap(position: Vec3): boolean{
        const tail = [];
        this.AISnakeScript.getTail().forEach(element => {
            tail.push(element.node);
        });
        tail.push(this.aiSnake);
        this.PlayerManageScript.getTail().forEach(element => {
            tail.push(element.node);
        });
        tail.push(this.playerSnake);
        const tolerance = 0.5;  // 设置容忍范围
        for (let i = 0; i < tail.length; i++) {
            const body = tail[i];
            if (Math.abs(position.x - body.position.x) < tolerance &&
                Math.abs(position.y - body.position.y) < tolerance) {
                // 如果蛇头与身体部分在误差范围内，触发碰撞逻辑
                return true;
            }
        }
        return false;
    }

    // 检查是否有奖励被吃到
    checkCollision(snakeHead: Node): boolean {
        if (this.awards.length === 0) { // 防止 this.getNearestAwardPosition(snakeHead) 返回null
            return false;
        }
        if(Vec3.distance(snakeHead.position, this.getNearestAwardPosition(snakeHead.position).position) < this.gridSize / 2) {
            this.getNearestAwardPosition(snakeHead.position).destroy();
            this.awards = this.awards.filter((node)=>{
                return node !== this.getNearestAwardPosition(snakeHead.position);
            });
            return true;
        }
        return false;
    }

    // AI蛇检查下一步是否会吃到奖励（不会触发奖励的销毁）
    checkCollisionPosition(newHeadPosition: Vec3): boolean {

        if (this.awards.length === 0) { // 防止 this.getNearestAwardPosition(snakeHead) 返回null
            return false;
        }
        if(Vec3.distance(newHeadPosition, this.getNearestAwardPosition(newHeadPosition).position) < this.gridSize / 2) {
            return true;
        }
        return false;
    }

    // 得到最近的奖励节点
    getNearestAwardPosition(headPosition: Vec3): Node {

        let minAward = this.awards[0];
        let minDistance  = Vec3.distance(headPosition, this.awards[0].position);
        for (let i = this.awards.length - 1; i > 0; i--) {
            const award = this.awards[i];
            if (Vec3.distance(headPosition, award.position) < minDistance) {
                minDistance = Vec3.distance(headPosition, award.position);
                minAward = award;
            }
        }
        return minAward;
    }

    // 得到最近的奖励节点的距离
    getNearestAwardDistance(headPosition: Vec3): number {

        let minDistance  = Vec3.distance(headPosition, this.awards[0].position);
        for (let i = this.awards.length - 1; i > 0; i--) {
            const award = this.awards[i];
            if (Vec3.distance(headPosition, award.position) < minDistance) {
                minDistance = Vec3.distance(headPosition, award.position);
            }
        }
        return minDistance;
    }

    getAwards(): Node[] {
        return this.awards;
    }

    onDestroy() {
        // 注销定时器
        this.unschedule(this.spawnAward);
    }

    onClickPauseButton(){
        director.pause();
        this.pauseButton.active = false;
        this.resumeButton.active = true;
    }

    onClickResumeButton(){
        director.resume();
        this.pauseButton.active = true;
        this.resumeButton.active = false;
    }
}
