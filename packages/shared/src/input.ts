export interface InputFrame {
  moveX: number;
  moveZ: number;
  yaw: number;
  pitch: number;
  jump: boolean;
  dash: boolean;
  fire: boolean;
  grenade: boolean;
  reload: boolean;
  melee: boolean;
}

export function createEmptyInputFrame(): InputFrame {
  return {
    moveX: 0,
    moveZ: 0,
    yaw: 0,
    pitch: 0,
    jump: false,
    dash: false,
    fire: false,
    grenade: false,
    reload: false,
    melee: false,
  };
}
