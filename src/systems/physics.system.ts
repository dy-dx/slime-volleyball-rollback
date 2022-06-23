import { IScoreComp, IPhysicsComp, IPositionComp } from '../components.js';
import { IEntity } from '../entities/entity.js';
import ISystem from './system.js';

interface IScoreEntity extends IEntity {
  scoreComp: IScoreComp;
}

interface IPhysicsEntity extends IEntity {
  physicsComp: IPhysicsComp;
  positionComp: IPositionComp;
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

const FUDGE = 5; // not sure why this is needed
function collisionBallSlime(ball: IPhysicsEntity, slime: IPhysicsEntity) {
  const {
    positionComp: { x, y },
    physicsComp: { radius, velocityX, velocityY },
  } = ball;
  const s = { ...slime.positionComp, ...slime.physicsComp };
  const dx = 2 * (x - s.x);
  const dy = y - s.y;
  const dist = Math.trunc(Math.sqrt(dx * dx + dy * dy));

  const dVelocityX = velocityX - s.velocityX;
  const dVelocityY = velocityY - s.velocityY;

  if (dy > 0 && dist < radius + s.radius && dist > FUDGE) {
    ball.positionComp.x = s.x + Math.trunc((Math.trunc((s.radius + radius) / 2) * dx) / dist);
    ball.positionComp.y = s.y + Math.trunc(((s.radius + radius) * dy) / dist);

    const something = Math.trunc((dx * dVelocityX + dy * dVelocityY) / dist);

    if (something <= 0) {
      ball.physicsComp.velocityX += Math.trunc(s.velocityX - (2 * dx * something) / dist);
      ball.physicsComp.velocityY += Math.trunc(s.velocityY - (2 * dy * something) / dist);
    }
  }
}

function updateBall(ball: IPhysicsEntity, physicsEntities: IPhysicsEntity[]) {
  physicsEntities.forEach((e) => {
    if (e.isBall) {
      return;
    }
    collisionBallSlime(ball, e);
    // clamp velocities after collision
    const { velocityX, velocityY, maxSpeedX, maxSpeedY } = ball.physicsComp;
    ball.physicsComp.velocityX = clamp(velocityX, -maxSpeedX, maxSpeedX);
    ball.physicsComp.velocityY = clamp(velocityY, -maxSpeedY, maxSpeedY);
  });

  const { physicsComp: phys, positionComp: pos } = ball;
  // handle wall hits
  if (pos.x < 15) {
    pos.x = 15;
    phys.velocityX = -phys.velocityX;
  } else if (pos.x > 985) {
    pos.x = 985;
    phys.velocityX = -phys.velocityX;
  }
  // hits the post
  if (pos.x > 480 && pos.x < 520 && pos.y < 140) {
    // bounces off top of net
    if (phys.velocityY < 0 && pos.y > 130) {
      phys.velocityY *= -1;
      pos.y = 130;
    } else if (pos.x < 500) {
      // hits side of net
      pos.x = 480;
      phys.velocityX = phys.velocityX >= 0 ? -phys.velocityX : phys.velocityX;
    } else {
      pos.x = 520;
      phys.velocityX = phys.velocityX <= 0 ? -phys.velocityX : phys.velocityX;
    }
  }

  // if the ball hit the ground, round is over
  if (pos.y <= 0) {
    phys.velocityX = 0;
  }
}

export default class PhysicsSystem implements ISystem {
  public update(entities: IEntity[], dt: number): void {
    const level = entities.find((e): e is IScoreEntity => !!e.scoreComp);
    if (level && level.scoreComp.freezeTime > 0) {
      return;
    }

    const physicsEntities = entities.filter((e): e is IPhysicsEntity => !!e.physicsComp);

    physicsEntities.forEach((e) => {
      const pos: IPositionComp = e.positionComp;
      const { velocityX, velocityY, maxSpeedY } = e.physicsComp;
      pos.x += velocityX * dt;
      pos.y += velocityY * dt;
      // Clamp y to the ground, but don't clamp x yet. Needs to be done separately.
      pos.y = Math.max(pos.y, 0);
      // gravity
      e.physicsComp.velocityY += e.physicsComp.accelerationY;
      e.physicsComp.velocityY = clamp(e.physicsComp.velocityY, -maxSpeedY, maxSpeedY);
    });

    const ball = physicsEntities.find((e) => e.isBall);
    const slimes = physicsEntities.filter((e) => !e.isBall);

    slimes.forEach(({ positionComp: pos }) => {
      pos.x = clamp(pos.x, pos.minX!, pos.maxX!);
    });

    if (!ball) return;

    updateBall(ball, physicsEntities);
  }
}
