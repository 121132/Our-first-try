import { _decorator, Animation, AudioClip, Collider2D, Component, Contact2DType, EventTouch, Input, input, instantiate, IPhysics2DContact, Node, Prefab, Sprite, Vec3 } from 'cc';
import { Reward, RewardType } from './Reward';
import { GameManager } from './GameManager';
import { LifeCountUI } from './UI/LifeCountUI';
import { AudioMgr } from './AudioMgr';
const { ccclass, property } = _decorator;

enum ShootType{
    None,
    OneShoot,
    TwoShoot
};

@ccclass('Player')
export class Player extends Component {

    @property
    shootRate:number = 0.5;
    @property(Node)
    bulletParent:Node = null;
    @property(Prefab)
    bullet1Prefab:Prefab=null;
    @property(Node)
    position1:Node = null;

    @property(Prefab)
    bullet2Prefab:Prefab=null;
    @property(Node)
    position2:Node = null;
    @property(Node)
    position3:Node = null;

    @property
    shootType:ShootType = ShootType.OneShoot;

    @property
    lifeCount:number = 3;
    @property(Animation)
    anim:Animation = null;

    
    @property
    animHit:string = "";
    @property
    animDown:string = "";

    @property
    invincibleTime:number = 1;

    @property
    twoShootTime:number = 5;

    @property(LifeCountUI)
    lifeCountUI:LifeCountUI = null;
    @property(AudioClip)
    bulletAudio:AudioClip = null;
    @property(AudioClip)
    getBombAudio:AudioClip = null;
    @property(AudioClip)
    getDoubleAudio:AudioClip = null;

    twoShootTimer:number = 0;
    isInvincible:boolean = false;
    invincibleTimer:number = 0;
    shootTimer:number = 0;
    collider:Collider2D = null;
    private canControl:boolean = true;



    protected onLoad(): void {
        input.on(Input.EventType.TOUCH_MOVE,this.onTouchMove,this);

        // 注册单个碰撞体的回调函数
        this.collider = this.getComponent(Collider2D);
        if (this.collider) {
            this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }
    protected start(): void {
        this.lifeCountUI.updateUI(this.lifeCount);
    }
    protected onDestroy(): void {
        input.off(Input.EventType.TOUCH_MOVE,this.onTouchMove,this);
        if (this.collider) {
            this.collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        const reward = otherCollider.getComponent(Reward);
        if(reward){
            this.onContactToReward(reward);
        }else{
            this.onContactToEnemy();
        }
    }

    transitionToTwoShoot(){
        this.shootType = ShootType.TwoShoot;
        this.twoShootTimer = 0;
    }
    transitionToOneShoot(){
        this.shootType = ShootType.OneShoot;
    }

    lastReward:Reward = null;

    onContactToReward(reward:Reward){
        if(reward==this.lastReward){
            return;
        }
        this.lastReward = reward;
        switch(reward.rewardType){
            case RewardType.TwoShoot:
                AudioMgr.inst.playOneShot(this.getDoubleAudio);
                this.transitionToTwoShoot();
                break;
            case RewardType.Bomb:
                AudioMgr.inst.playOneShot(this.getBombAudio);
                GameManager.getInstance().AddBomb();
                break;
        }

        reward.getComponent(Sprite).enabled =false;
        reward.getComponent(Collider2D).enabled = false;
    }
    onContactToEnemy(){
        if(this.isInvincible)return;

        this.isInvincible = true;
        this.invincibleTimer=0;

        this.changeLifeCount(-1);
        if(this.lifeCount>0){
            this.anim.play(this.animHit);
        }else{
            this.anim.play(this.animDown);
        }
        
        if(this.lifeCount<=0){
            this.shootType = ShootType.None;
            if(this.collider){
                this.collider.enabled =false;
            }
            this.scheduleOnce(()=>{
                GameManager.getInstance().gameOver();
            },0.4);
            
        }
    }

    changeLifeCount(count:number){
        this.lifeCount+=count;
        this.lifeCountUI.updateUI(this.lifeCount);
    }

    onTouchMove(event:EventTouch){

        if(this.canControl==false)return;
        if(this.lifeCount<1)return;
        
        const p = this.node.position;

        let targetPosition= new Vec3(p.x+event.getDeltaX(),p.y+event.getDeltaY(),p.z);

        if(targetPosition.x<-230){
            targetPosition.x = -230;
        }
        if(targetPosition.x>230){
            targetPosition.x=230;
        }
        if(targetPosition.y>380){
            targetPosition.y = 380;
        }
        if(targetPosition.y<-380){
            targetPosition.y=-380;
        }

        this.node.setPosition(targetPosition);

    }

    protected update(dt: number): void {
        switch(this.shootType){
            case ShootType.OneShoot:
                this.oneShoot(dt);
                break;
            case ShootType.TwoShoot:
                this.twoShoot(dt);
                break;
        }

        if(this.isInvincible){
            this.invincibleTimer+=dt;
            if(this.invincibleTimer>this.invincibleTime){
                this.isInvincible = false;
            }
        }
        
    }

    oneShoot(dt: number){
        this.shootTimer+=dt;
        if(this.shootTimer>=this.shootRate){
            AudioMgr.inst.playOneShot(this.bulletAudio,0.1);
            this.shootTimer=0;
            const bullet1 = instantiate(this.bullet1Prefab);
            this.bulletParent.addChild(bullet1);
            bullet1.setWorldPosition(this.position1.worldPosition);
        }
    }
    twoShoot(dt: number){
        this.twoShootTimer+=dt;
        if(this.twoShootTimer>this.twoShootTime){
            this.transitionToOneShoot();
        }


        this.shootTimer+=dt;
        if(this.shootTimer>=this.shootRate){
            AudioMgr.inst.playOneShot(this.bulletAudio,0.1);
            this.shootTimer=0;
            const bullet1 = instantiate(this.bullet2Prefab);
            const bullet2 = instantiate(this.bullet2Prefab);
            this.bulletParent.addChild(bullet1);
            this.bulletParent.addChild(bullet2);
            bullet1.setWorldPosition(this.position2.worldPosition);
            bullet2.setWorldPosition(this.position3.worldPosition);
        }
    }

    disableControl(){
        this.canControl = false;
    }
    enableControl(){
        this.canControl = true;
    }

}


