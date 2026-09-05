import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import formatText from '../lib/formatText.tsx';
import { AIBehavior } from '../map/AIBehavior.tsx';
import { MaxHealth } from '../map/Configuration.tsx';
import Entity, { EntityType } from '../map/Entity.tsx';
import Player, { PlayerID } from '../map/Player.tsx';
import SpriteVector from '../map/SpriteVector.tsx';
import type Unit from '../map/Unit.tsx';
import { ID } from '../MapData.tsx';
import { AttackSprite } from './AttackSprite.tsx';
import { MovementType, MovementTypes } from './MovementType.tsx';
import { SoundName } from './Music.tsx';
import { getUnitCost, getUnitRadius, getUnitRange, hasUnlockedUnit, Skill } from './Skill.tsx';
import { SpriteVariant } from './SpriteVariants.tsx';
import type { TileInfo } from './Tile.tsx';
import TileID from './TileID.tsx';
import UnitID from './UnitID.tsx';

let _unitClass: typeof Unit;
const sprite = (x: number, y: number) => new SpriteVector(x, y);

export enum Ability {
  AccessBuildings = 0,
  Capture = 1,
  CreateBuildings = 2,
  CreateTracks = 3,
  Heal = 4,
  MoveAndAct = 5,
  Rescue = 6,
  Sabotage = 7,
  Supply = 8,
  Unfold = 9,
  Convert = 10,
  Morale = 11,
  Poison = 12,
  HeavyEquipment = 13,
}

export const Abilities = [
  Ability.AccessBuildings,
  Ability.Capture,
  Ability.Convert,
  Ability.CreateBuildings,
  Ability.CreateTracks,
  Ability.Heal,
  Ability.Morale,
  Ability.MoveAndAct,
  Ability.Rescue,
  Ability.Sabotage,
  Ability.Supply,
  Ability.Unfold,
  Ability.Poison,
  Ability.HeavyEquipment,
] as const;

export enum AttackType {
  LongRange,
  None,
  ShortRange,
}

export type UnitAnimationSprite = {
  fade?: boolean;
  frames: number;
  offset?: { x?: number; y?: number };
  position: SpriteVector;
};

export type AttackStance = 'long' | 'short' | 'once' | false;
export type Gender = 'male' | 'female' | 'unknown';

type SpriteConfig = {
  alternative?: SpriteVector;
  alternativeExplosionSprite?: UnitAnimationSprite;
  attackStance: AttackStance;
  direction?: 'left' | 'right';
  directionOffset: 1 | 2 | 3;
  explosionSprite?: UnitAnimationSprite;
  healSprite?: UnitAnimationSprite;
  invert: boolean;
  leaderAlternative?: boolean;
  name: SpriteVariant;
  offset?: { x?: number; y?: number };
  portrait: {
    position: SpriteVector;
    variants: 3 | 6;
  };
  position?: SpriteVector;
  slow?: boolean;
  transports?: SpriteVector;
  transportsMany?: SpriteVector;
  unfold?: SpriteVector;
  unfoldSounds?: {
    fold: SoundName;
    unfold: SoundName;
  };
  unfoldSprite?: {
    frames: number;
    position: SpriteVector;
  };
  withNavalExplosion?: boolean;
};

type UnitAbilityConfiguration = Readonly<{
  accessBuildings?: boolean;
  capture?: boolean;
  convert?: boolean;
  createBuildings?: boolean;
  createTracks?: boolean;
  heal?: boolean;
  heavyEquipment?: boolean;
  morale?: boolean;
  moveAndAct?: boolean;
  poison?: boolean;
  rescue?: boolean;
  sabotage?: boolean;
  supply?: boolean;
  unfold?: boolean;
}>;

class UnitAbilities {
  private readonly accessBuildings: boolean;
  private readonly capture: boolean;
  private readonly convert: boolean;
  private readonly createBuildings: boolean;
  private readonly createTracks: boolean;
  private readonly heal: boolean;
  private readonly heavyEquipment: boolean;
  private readonly morale: boolean;
  private readonly moveAndAct: boolean;
  private readonly poison: boolean;
  private readonly rescue: boolean;
  private readonly sabotage: boolean;
  private readonly supply: boolean;
  private readonly unfold: boolean;

  constructor({
    accessBuildings,
    capture,
    convert,
    createBuildings,
    createTracks,
    heal,
    heavyEquipment,
    morale,
    moveAndAct,
    poison,
    rescue,
    sabotage,
    supply,
    unfold,
  }: UnitAbilityConfiguration = {}) {
    this.accessBuildings = accessBuildings ?? false;
    this.capture = capture ?? false;
    this.convert = convert ?? false;
    this.createBuildings = createBuildings ?? false;
    this.createTracks = createTracks ?? false;
    this.heal = heal ?? false;
    this.heavyEquipment = heavyEquipment ?? false;
    this.morale = morale ?? false;
    this.moveAndAct = moveAndAct ?? false;
    this.poison = poison ?? false;
    this.rescue = rescue ?? false;
    this.sabotage = sabotage ?? false;
    this.supply = supply ?? false;
    this.unfold = unfold ?? false;
  }

  has(ability: Ability) {
    switch (ability) {
      case Ability.AccessBuildings:
        return this.accessBuildings;
      case Ability.Capture:
        return this.capture;
      case Ability.CreateBuildings:
        return this.createBuildings;
      case Ability.CreateTracks:
        return this.createTracks;
      case Ability.Convert:
        return this.convert;
      case Ability.Heal:
        return this.heal;
      case Ability.HeavyEquipment:
        return this.heavyEquipment;
      case Ability.Morale:
        return this.morale;
      case Ability.MoveAndAct:
        return this.moveAndAct;
      case Ability.Poison:
        return this.poison;
      case Ability.Rescue:
        return this.rescue;
      case Ability.Sabotage:
        return this.sabotage;
      case Ability.Supply:
        return this.supply;
      case Ability.Unfold:
        return this.unfold;
      default: {
        ability satisfies never;
        throw new UnknownTypeError('UnitBehaviors.has', ability);
      }
    }
  }

  copy({
    accessBuildings,
    capture,
    convert,
    createBuildings,
    createTracks,
    heal,
    heavyEquipment,
    morale,
    moveAndAct,
    poison,
    rescue,
    sabotage,
    supply,
    unfold,
  }: UnitAbilityConfiguration) {
    return new UnitAbilities({
      accessBuildings: accessBuildings ?? this.accessBuildings,
      capture: capture ?? this.capture,
      convert: convert ?? this.convert,
      createBuildings: createBuildings ?? this.createBuildings,
      createTracks: createTracks ?? this.createTracks,
      heal: heal ?? this.heal,
      heavyEquipment: heavyEquipment ?? this.heavyEquipment,
      morale: morale ?? this.morale,
      moveAndAct: moveAndAct ?? this.moveAndAct,
      poison: poison ?? this.poison,
      rescue: rescue ?? this.rescue,
      sabotage: sabotage ?? this.sabotage,
      supply: supply ?? this.supply,
      unfold: unfold ?? this.unfold,
    });
  }
}

type WeaponPositions = Readonly<{
  down?: SpriteVector;
  horizontal: SpriteVector;
  horizontalAlternative?: SpriteVector;
  up?: SpriteVector;
}>;

type WeaponAnimationConfiguaration = Readonly<{
  cell?: number;
  frames: number;
  leadingFrames?: number;
  mirror?: boolean;
  positions?: WeaponPositions;
  recoil: boolean;
  recoilDelay?: number;
  repeat?: number;
  rotate?: boolean;
  size?: number;
  trailingFrames?: number;
  unfoldPositions?: WeaponPositions;
}>;

export type AttackSpriteWithVariants = 'AttackOctopus';

export class WeaponAnimation {
  public readonly cell: number;
  public readonly frames: number;
  public readonly leadingFrames: number;
  public readonly mirror: boolean;
  public readonly positions: WeaponPositions | undefined;
  public readonly unfoldPositions: WeaponPositions | undefined;
  public readonly recoil: boolean;
  public readonly recoilDelay: number;
  public readonly repeat: number;
  public readonly rotate: boolean;
  public readonly size: number;
  public readonly trailingFrames: number;

  constructor(
    public readonly sprite: AttackSprite | AttackSpriteWithVariants,
    public readonly sound: SoundName | null,
    {
      cell,
      frames,
      leadingFrames,
      mirror,
      positions,
      recoil,
      recoilDelay,
      repeat,
      rotate,
      size,
      trailingFrames,
      unfoldPositions,
    }: WeaponAnimationConfiguaration,
  ) {
    this.cell = cell ?? 0;
    this.frames = frames;
    this.leadingFrames = leadingFrames || 0;
    this.mirror = mirror ?? false;
    this.positions = positions;
    this.unfoldPositions = unfoldPositions;
    this.recoil = recoil ?? true;
    this.recoilDelay = recoilDelay ?? this.frames;
    this.repeat = repeat ?? 1;
    this.rotate = rotate ?? true;
    this.size = size ?? 32;
    this.trailingFrames = trailingFrames || 0;
  }

  public getPosition(
    style: 'unfold' | null,
    direction: 'left' | 'right' | 'up' | 'down',
    mirror = false,
  ) {
    const positions = (style === 'unfold' && this.unfoldPositions) || this.positions;
    if (positions) {
      const offsetDirection =
        direction === 'left' || direction === 'right' ? 'horizontal' : direction;
      const alternative =
        mirror && offsetDirection === 'horizontal' && positions.horizontalAlternative;
      if (alternative) {
        return direction === 'left' ? { ...alternative, x: alternative.x * -1 } : alternative;
      }
      return positions[offsetDirection];
    }
    return null;
  }

  public copy({
    cell,
    frames,
    mirror,
    positions,
    recoil,
    repeat,
    rotate,
    size,
    sound,
  }: Omit<WeaponAnimationConfiguaration, 'frames' | 'recoil'> & {
    frames?: number;
    recoil?: boolean;
    sound?: SoundName;
  }): WeaponAnimation {
    return new WeaponAnimation(this.sprite, sound || this.sound, {
      cell: cell ?? this.cell,
      frames: frames ?? this.frames,
      mirror: mirror ?? this.mirror,
      positions: positions ?? this.positions,
      recoil: recoil ?? this.recoil,
      repeat: repeat ?? this.repeat,
      rotate: rotate ?? this.rotate,
      size: size ?? this.size,
    });
  }

  withSound(sound: SoundName) {
    return this.copy({ sound });
  }

  withTrailingFrames(trailingFrames: number) {
    return this.copy({ trailingFrames });
  }

  public repeats(repeat: number) {
    return this.copy({ repeat });
  }
}

export type WeaponID = number;
export type Supply = number;
type DamageMap = ReadonlyMap<EntityType, number>;

export class Weapon {
  constructor(
    private readonly internalName: string,
    public readonly damage: DamageMap,
    public readonly animation: WeaponAnimation,
    public readonly hitAnimation?:
      | WeaponAnimation
      | [horizontal: WeaponAnimation, up: WeaponAnimation, down: WeaponAnimation],
    public readonly supply?: Supply | null,
    public readonly flatDamage: boolean = false,
    public readonly id: WeaponID = 1,
  ) {}

  get name() {
    return this.internalName;
  }

  withId(id: WeaponID): Weapon {
    return new Weapon(
      this.internalName,
      this.damage,
      this.animation,
      this.hitAnimation,
      this.supply,
      this.flatDamage,
      id,
    );
  }

  withName(name: string) {
    return new Weapon(
      name,
      this.damage,
      this.animation,
      this.hitAnimation,
      this.supply,
      this.flatDamage,
      this.id,
    );
  }

  withDamage(damage: DamageMap): Weapon {
    return new Weapon(
      this.internalName,
      damage,
      this.animation,
      this.hitAnimation,
      this.supply,
      this.flatDamage,
      this.id,
    );
  }

  withSupply(supply: Supply): Weapon {
    return new Weapon(
      this.internalName,
      this.damage,
      this.animation,
      this.hitAnimation,
      supply,
      this.flatDamage,
      this.id,
    );
  }

  withAnimation(animation: WeaponAnimation): Weapon {
    return new Weapon(
      this.internalName,
      this.damage,
      animation,
      this.hitAnimation,
      this.supply,
      this.flatDamage,
      this.id,
    );
  }

  withAnimationPositions(positions: WeaponPositions, mirror?: boolean): Weapon {
    return new Weapon(
      this.internalName,
      this.damage,
      this.animation.copy({
        mirror: mirror ?? this.animation.mirror,
        positions,
      }),
      this.hitAnimation,
      this.supply,
      this.flatDamage,
      this.id,
    );
  }

  withFlatDamage(): Weapon {
    return this.flatDamage
      ? this
      : new Weapon(
          this.internalName,
          this.damage,
          this.animation,
          this.hitAnimation,
          this.supply,
          true,
          this.id,
        );
  }

  getDamage(entity: Entity) {
    return this.damage.get(entity.info.type) || 0;
  }
}

type UnitConfiguration = {
  cost: number;
  fuel: number;
  healTypes?: ReadonlySet<EntityType>;
  radius: number;
  sabotageTypes?: ReadonlySet<EntityType>;
  supplyTypes?: ReadonlySet<EntityType>;
  vision: number;
};

type UnitAttackConfiguration = Readonly<{
  primaryWeapon: Weapon | null;
  type: AttackType;
  weapons: Map<WeaponID, Weapon> | null;
}>;

type UnitTransportEntityConfig = ReadonlySet<ID> | true;
type UnitTransportConfiguration = Readonly<{
  entities: ReadonlyMap<EntityType, UnitTransportEntityConfig>;
  limit: number;
}>;

export class UnitInfo {
  public readonly attack: UnitAttackConfiguration;
  public readonly configuration: Omit<UnitConfiguration, 'cost' | 'radius'>;
  private readonly cost: number;
  private readonly radius: number;
  private readonly range: [number, number] | null;
  public readonly sprite: Omit<SpriteConfig, 'direction'> & {
    direction: 1 | -1;
    position: SpriteVector;
  };
  private ammunitionSupply: ReadonlyMap<number, number> | null | undefined = undefined;

  constructor(
    public readonly id: ID,
    private readonly internalName: string,
    private internalCharacterName: string,
    public readonly gender: Gender,
    private readonly internalDescription: string,
    private readonly internalCharacterDescription: string,
    public readonly defense: number,
    public readonly type: EntityType,
    public readonly movementType: MovementType,
    configuration: UnitConfiguration,
    public readonly abilities: UnitAbilities,
    attack: Readonly<{
      range?: [number, number];
      type: AttackType;
      weapons?: ReadonlyArray<Weapon>;
    }> | null,
    public readonly transports: UnitTransportConfiguration | null,
    sprite: Omit<SpriteConfig, 'attackStance' | 'directionOffset' | 'invert'> & {
      attackStance?: 'long' | 'short' | 'once';
      directionOffset?: 1 | 2 | 3;
      invert?: false;
    },
  ) {
    this.cost = configuration.cost;
    this.radius = configuration.radius;
    this.configuration = configuration;
    this.sprite = {
      invert: true,
      ...sprite,
      attackStance: sprite.attackStance || false,
      direction: sprite.direction === 'right' ? -1 : 1,
      directionOffset: sprite.directionOffset || 1,
      position: sprite.position || new SpriteVector(0, 0),
    };

    this.range = attack?.range || null;
    this.attack = {
      type: AttackType.None,
      ...attack,
      primaryWeapon: attack?.weapons?.[0] || null,
      weapons: attack?.weapons
        ? new Map(attack.weapons.map((weapon, index) => [index + 1, weapon.withId(index + 1)]))
        : null,
    };
  }

  get name() {
    return this.internalName;
  }

  get characterName(): string {
    return this.internalCharacterName;
  }

  getOriginalCharacterName(): string {
    return this.internalCharacterName;
  }

  removeCustomCharacterName() {
    if (Object.prototype.hasOwnProperty.call(this, 'characterName')) {
      // @ts-expect-error
      delete this.characterName;
    }
  }

  setCharacterName(name: string) {
    Object.defineProperty(this, 'characterName', {
      configurable: true,
      value: name,
    });
  }

  get description(): string {
    return this.internalDescription;
  }

  get characterDescription(): string {
    const description = formatText(this.internalCharacterDescription, this, 'characterName');
    Object.defineProperty(this, 'characterDescription', {
      value: description,
      writable: true,
    });
    return description;
  }

  getOriginalCharacterDescription(): string {
    return this.internalCharacterDescription;
  }

  getCostFor(player: Player | null) {
    if (!player?.skills.size) {
      return this.cost;
    }

    return getUnitCost(this, this.cost, player.skills, player.activeSkills);
  }

  getRadiusFor(player: Player | null) {
    if (!player?.skills.size) {
      return this.radius;
    }

    return getUnitRadius(this, this.radius, player.skills, player.activeSkills);
  }

  getRangeFor(player: Player | null): [number, number] | null {
    if (!this.isLongRange() || !this.range) {
      return null;
    }

    if (!player?.skills.size) {
      return this.range;
    }

    return getUnitRange(this, this.range, player.skills, player.activeSkills);
  }

  canAct(player: Player) {
    if (this.hasAbility(Ability.MoveAndAct)) {
      return true;
    }

    return !!(
      player.skills.size &&
      this === Battleship &&
      player.activeSkills.has(Skill.UnitBattleShipMoveAndAct)
    );
  }

  hasAttack() {
    return this.attack.type !== AttackType.None;
  }

  isShortRange() {
    return this.attack.type === AttackType.ShortRange;
  }

  isLongRange() {
    return this.attack.type === AttackType.LongRange;
  }

  canAttackAt(distance: number, range: [number, number] | null) {
    if (this.isShortRange() && distance === 1) {
      return true;
    }

    if (!this.isLongRange() || !range) {
      return false;
    }

    const [low, high] = range;
    return !!(low >= 0 && high > 0 && distance >= low && distance <= high);
  }

  canTransportUnits(): this is {
    transports: UnitTransportConfiguration;
  } {
    return !!this.transports;
  }

  canTransportUnitType(info: UnitInfo) {
    return this.transports?.entities.has(info.type);
  }

  canTransport(unitInfo: UnitInfo, tile: TileInfo) {
    return !!(this.transports?.entities.has(unitInfo.type) && this.canDropFrom(unitInfo, tile));
  }

  canDropFrom(unitInfo: UnitInfo, tile: TileInfo) {
    const config = this.transports?.entities.get(unitInfo.type);
    return config && (config === true || config.has(tile.id));
  }

  canSabotageUnitType(info: UnitInfo) {
    return this.configuration?.sabotageTypes?.has(info.type);
  }

  hasAbility(ability: Ability) {
    return this.abilities.has(ability);
  }

  getAmmunitionSupply(): ReadonlyMap<number, number> | null {
    if (this.ammunitionSupply === undefined) {
      const { weapons } = this.attack;
      if (weapons) {
        const actualWeapons = [...weapons]
          .filter(([, { supply }]) => supply != null)
          .map(([id, { supply }]) => [id, supply]) as ReadonlyArray<[number, number]>;
        this.ammunitionSupply = new Map(actualWeapons);
      } else {
        this.ammunitionSupply = null;
      }
    }
    return this.ammunitionSupply;
  }

  create(
    player: Player | PlayerID,
    config?: {
      behavior?: AIBehavior | null;
      label?: PlayerID | null;
      name?: number | null;
    },
  ) {
    return new _unitClass(
      this.id,
      MaxHealth,
      typeof player === 'number' ? player : player.id,
      this.configuration.fuel,
      this.getAmmunitionSupply(),
      null,
      null,
      null,
      null,
      null,
      null,
      config?.label != null ? config.label : null,
      config?.name ?? null,
      config?.behavior || null,
      null,
      null,
    );
  }

  static setConstructor(unitClass: typeof Unit) {
    _unitClass = unitClass;
  }
}

const buff = (map: DamageMap, change: number) =>
  new Map([...map].map(([type, damage]) => [type, damage + change]));

const MGAnimation = new WeaponAnimation('MG', 'Attack/MG', {
  frames: 8,
  positions: {
    down: sprite(0.05, 0.55),
    horizontal: sprite(-0.5, 0.25),
    up: sprite(-0.03, -0.3),
  },
  recoil: false,
  repeat: 2,
});

const AntiAirAnimation = new WeaponAnimation('AntiAir', 'Attack/AntiAirGun', {
  frames: 8,
  positions: {
    down: sprite(0, 0.35),
    horizontal: sprite(-0.35, -0.13),
    up: sprite(0, -0.45),
  },
  recoil: false,
  size: 24,
});

const ArtilleryAnimation = new WeaponAnimation('Artillery', 'Attack/Artillery', {
  frames: 9,
  positions: {
    down: sprite(-0.2, 0.3),
    horizontal: sprite(-0.4, -0.19),
    up: sprite(0.25, -0.45),
  },
  recoil: true,
});

const HeavyArtilleryAnimation = new WeaponAnimation('HeavyArtillery', 'Attack/HeavyArtillery', {
  frames: 12,
  positions: {
    down: sprite(-0.2, 0.3),
    horizontal: sprite(-0.5, -0.3),
    up: sprite(0.25, -0.65),
  },
  recoil: true,
});

const SparkAnimation = new WeaponAnimation('Spark', null, {
  frames: 11,
  positions: {
    horizontal: sprite(0.1, 0.2),
  },
  recoil: false,
});

const EmptyAnimation = new WeaponAnimation('Empty', null, {
  frames: 16,
  recoil: false,
});

const OctopusBiteHitAnimationPositions = {
  horizontal: sprite(0.086, 0),
};

const OctopusBiteHitAnimation = new WeaponAnimation('AttackOctopus', 'Attack/TentacleWhip', {
  frames: 16,
  positions: OctopusBiteHitAnimationPositions,
  recoil: false,
});

const BiteAnimation = new WeaponAnimation('Empty', 'Attack/Bite', {
  frames: 15,
  recoil: false,
});

const BiteHitAnimation = new WeaponAnimation('Bite', null, {
  frames: 9,
  leadingFrames: 6,
  positions: {
    horizontal: sprite(-0.15, 0.5),
  },
  recoil: false,
  rotate: false,
  size: 64,
});

const PowHitAnimation = new WeaponAnimation('Pow', 'Attack/Pow', {
  frames: 7,
  leadingFrames: 8,
  positions: {
    horizontal: sprite(0, 0.5),
  },
  recoil: false,
  rotate: false,
  size: 64,
});

const SparkMiniAnimation = new WeaponAnimation('SparkMini', null, {
  frames: 9,
  positions: {
    horizontal: sprite(0, 0.1),
  },
  recoil: false,
  repeat: 2,
});

const SmokeAnimation = new WeaponAnimation('Smoke', null, {
  frames: 9,
  leadingFrames: 4,
  recoil: false,
  size: 40,
});

const ExplosionImpactAnimation = new WeaponAnimation('ExplosionImpact', 'ExplosionImpact', {
  frames: 10,
  leadingFrames: 10,
  recoil: false,
  size: 48,
});

const LightGunAnimation = new WeaponAnimation('LightGun', 'Attack/LightGun', {
  frames: 13,
  positions: {
    down: sprite(-0.3, 0.95),
    horizontal: sprite(-0.9, 0.13),
    up: sprite(0.13, -0.55),
  },
  recoil: true,
  size: 36,
});
const SAMAnimation = new WeaponAnimation('SAM', 'Attack/SAM', {
  frames: 12,
  positions: {
    horizontal: sprite(0.08, -0.15),
  },
  recoil: false,
  rotate: false,
  trailingFrames: 10,
});

const LightGun = new Weapon(
  'Light Gun',
  new Map([
    [EntityType.AirSoldier, 55],
    [EntityType.Amphibious, 90],
    [EntityType.Artillery, 90],
    [EntityType.Building, 70],
    [EntityType.Ground, 90],
    [EntityType.LowAltitude, 55],
    [EntityType.Rail, 75],
    [EntityType.Ship, 30],
    [EntityType.Soldier, 55],
    [EntityType.Structure, 60],
  ]),
  LightGunAnimation,
  SmokeAnimation,
);

const AntiShipMissile = new Weapon(
  'Anti Ship Missile',
  new Map([
    [EntityType.Amphibious, 100],
    [EntityType.Artillery, 60],
    [EntityType.Ground, 60],
    [EntityType.Rail, 50],
    [EntityType.Ship, 75],
    [EntityType.Soldier, 50],
    [EntityType.Structure, 60],
  ]),
  LightGunAnimation,
  ExplosionImpactAnimation,
).withAnimationPositions({
  down: sprite(-0.2, 0.95),
  horizontal: sprite(-0.75, 0.26),
  up: sprite(0.23, -0.55),
});

const CruiseMissile = new Weapon(
  'Cruise Missile',
  new Map([
    [EntityType.Amphibious, 80],
    [EntityType.Artillery, 90],
    [EntityType.Ground, 90],
    [EntityType.Rail, 95],
    [EntityType.Ship, 40],
    [EntityType.Soldier, 80],
    [EntityType.Structure, 80],
  ]),
  SAMAnimation.withTrailingFrames(6),
  SmokeAnimation,
);

const HeavyGun = new Weapon(
  'Heavy Gun',
  new Map([
    [EntityType.AirSoldier, 55],
    [EntityType.Amphibious, 115],
    [EntityType.Artillery, 115],
    [EntityType.Building, 70],
    [EntityType.Ground, 115],
    [EntityType.LowAltitude, 55],
    [EntityType.Rail, 95],
    [EntityType.Ship, 50],
    [EntityType.Soldier, 65],
    [EntityType.Structure, 80],
  ]),
  new WeaponAnimation('LightGun', 'Attack/HeavyGun', {
    frames: 13,
    positions: {
      down: sprite(-0.13, 0.95),
      horizontal: sprite(-0.9, 0.13),
      up: sprite(0.25, -0.55),
    },
    recoil: true,
    recoilDelay: 6,
    size: 36,
    trailingFrames: 7,
  }),
  ExplosionImpactAnimation,
);

const MG = new Weapon(
  'MG',
  new Map([
    [EntityType.AirSoldier, 65],
    [EntityType.Amphibious, 35],
    [EntityType.Artillery, 35],
    [EntityType.Ground, 35],
    [EntityType.Soldier, 80],
  ]),
  MGAnimation,
  SparkMiniAnimation,
);

const MiniGun = new Weapon(
  'Mini Gun',
  new Map([
    [EntityType.AirSoldier, 80],
    [EntityType.Amphibious, 70],
    [EntityType.Artillery, 90],
    [EntityType.Building, 70],
    [EntityType.Ground, 70],
    [EntityType.LowAltitude, 80],
    [EntityType.Rail, 50],
    [EntityType.Ship, 50],
    [EntityType.Soldier, 100],
    [EntityType.Structure, 30],
  ]),
  new WeaponAnimation('Minigun', 'Attack/MiniGun', {
    frames: 11,
    mirror: true,
    positions: {
      down: sprite(0.28, 0.67),
      horizontal: sprite(-0.27, 0.35),
      horizontalAlternative: sprite(0.56, 0.3),
      up: sprite(0.25, -0.3),
    },
    recoil: false,
  }),
  SparkAnimation,
);

const FlamethrowerWeapon = new Weapon(
  'Flamethrower',
  new Map([
    [EntityType.AirSoldier, 100],
    [EntityType.Amphibious, 70],
    [EntityType.Artillery, 75],
    [EntityType.Ground, 70],
    [EntityType.Soldier, 130],
    [EntityType.Structure, 60],
  ]),
  new WeaponAnimation('Flamethrower', 'Attack/Flamethrower', {
    frames: 24,
    positions: {
      down: sprite(-0.35, 1.1),
      horizontal: sprite(-1.1, -0.1),
      up: sprite(0.45, -0.9),
    },
    recoil: false,
  }),
  new WeaponAnimation('Flamethrower', null, {
    cell: 1,
    frames: 24,
    positions: {
      horizontal: sprite(0.1, 0),
    },
    recoil: false,
  }),
);

const AIUMiniGun = new Weapon(
  'Super Mini Gun',
  buff(MiniGun.damage, 40),
  new WeaponAnimation('Minigun', 'Attack/MiniGun', {
    frames: 11,
    positions: {
      down: sprite(0, 0.68),
      horizontal: sprite(-0.55, 0.1),
      up: sprite(0, -0.35),
    },
    recoil: false,
    repeat: 2,
  }),
  SparkAnimation,
);

const ArtilleryWeapon = new Weapon(
  'Artillery',
  new Map([
    [EntityType.AirSoldier, 80],
    [EntityType.Amphibious, 100],
    [EntityType.Artillery, 90],
    [EntityType.Ground, 100],
    [EntityType.LowAltitude, 80],
    [EntityType.Rail, 90],
    [EntityType.Ship, 60],
    [EntityType.Soldier, 100],
  ]),
  ArtilleryAnimation,
  SmokeAnimation,
);

const AirToAirMissile = new Weapon(
  'Air to Air Missile',
  new Map([
    [EntityType.Airplane, 115],
    [EntityType.AirSoldier, 130],
    [EntityType.LowAltitude, 130],
  ]),
  MGAnimation.withSound('Attack/AirToAirMissile'),
  SparkMiniAnimation,
);

const LightAirGun = new Weapon(
  'Light Air Gun',
  new Map([
    [EntityType.AirSoldier, 80],
    [EntityType.Amphibious, 65],
    [EntityType.Artillery, 85],
    [EntityType.Ground, 85],
    [EntityType.LowAltitude, 80],
    [EntityType.Rail, 75],
    [EntityType.Ship, 45],
    [EntityType.Soldier, 75],
  ]),
  MGAnimation,
  SparkMiniAnimation,
);

const Bomb = new Weapon(
  'Bomb',
  new Map([
    [EntityType.Amphibious, 115],
    [EntityType.Artillery, 100],
    [EntityType.Building, 70],
    [EntityType.Ground, 115],
    [EntityType.Rail, 110],
    [EntityType.Ship, 115],
    [EntityType.Soldier, 105],
    [EntityType.Structure, 50],
  ]),
  new WeaponAnimation('Bomb', 'Attack/Bomb', {
    frames: 9,
    positions: {
      down: sprite(0.3, 0.4),
      horizontal: sprite(-0.3, 0.2),
      up: sprite(-0.3, -0.4),
    },
    recoil: false,
    size: 24,
  }),
  SmokeAnimation,
);

const SoldierMG = MG.withDamage(
  new Map([
    [EntityType.AirSoldier, 65],
    [EntityType.Amphibious, 35],
    [EntityType.Artillery, 35],
    [EntityType.Ground, 35],
    [EntityType.LowAltitude, 65],
    [EntityType.Soldier, 60],
  ]),
).withAnimationPositions({
  ...MGAnimation.positions,
  horizontal: sprite(-0.5, 0.195),
});

const RocketLauncherWeapon = new Weapon(
  'Rocket Launcher',
  new Map([
    [EntityType.AirSoldier, 55],
    [EntityType.Amphibious, 95],
    [EntityType.Artillery, 95],
    [EntityType.Ground, 95],
    [EntityType.LowAltitude, 75],
    [EntityType.Rail, 65],
    [EntityType.Soldier, 35],
  ]),
  new WeaponAnimation('RocketLauncher', 'Attack/RocketLauncher', {
    frames: 11,
    positions: {
      down: sprite(-0.08, 0.9),
      horizontal: sprite(-0.97, 0.1),
      up: sprite(0.2, -0.56),
    },
    recoil: false,
  }),
);

const Bite = new Weapon(
  'Bite',
  new Map([
    [EntityType.AirSoldier, 100],
    [EntityType.Amphibious, 100],
    [EntityType.Artillery, 100],
    [EntityType.Ground, 100],
    [EntityType.LowAltitude, 100],
    [EntityType.Soldier, 120],
  ]),
  BiteAnimation,
  BiteHitAnimation,
);

const LightAirToAirMissile = AirToAirMissile.withName('Light Air To Air Missile')
  .withDamage(
    new Map([
      [EntityType.Airplane, 80],
      [EntityType.AirSoldier, 90],
      [EntityType.LowAltitude, 90],
    ]),
  )
  .withAnimationPositions({
    down: sprite(0, 0.55),
    horizontal: sprite(-0.15, 0.25),
    up: sprite(-0.03, -0.2),
  });

export const Weapons = {
  AirToAirMissile,
  AIUMiniGun,
  AmphibiousLightGun: new Weapon(
    'Light Gun',
    new Map([
      ...LightGun.damage,

      [EntityType.Amphibious, 75],
      [EntityType.Ship, 55],
    ]),
    new WeaponAnimation('Amphibious', 'Attack/LightGun', {
      frames: 15,
      positions: {
        down: sprite(-0.08, 0.4),
        horizontal: sprite(-0.36, -0.07),
        up: sprite(0.1, -0.3),
      },
      recoil: true,
    }),
    SmokeAnimation,
  ),
  AntiAirGun: new Weapon(
    'Anti Air Gun',
    new Map([
      [EntityType.Airplane, 135],
      [EntityType.AirSoldier, 145],
      [EntityType.Amphibious, 65],
      [EntityType.Artillery, 65],
      [EntityType.Building, 70],
      [EntityType.Ground, 55],
      [EntityType.LowAltitude, 155],
      [EntityType.Rail, 60],
      [EntityType.Soldier, 50],
      [EntityType.Structure, 10],
    ]),
    AntiAirAnimation.repeats(2),
    SparkMiniAnimation,
  ),
  AntiArtilleryGun: new Weapon(
    'Anti Artillery Gun',
    new Map([[EntityType.Artillery, 100]]),
    MGAnimation,
  ),
  AntiShipMissile,
  Artillery: ArtilleryWeapon,
  Battery: new Weapon(
    'Artillery Battery',
    new Map([
      [EntityType.AirSoldier, 100],
      [EntityType.Amphibious, 130],
      [EntityType.Artillery, 130],
      [EntityType.Ground, 130],
      [EntityType.LowAltitude, 100],
      [EntityType.Rail, 90],
      [EntityType.Ship, 80],
      [EntityType.Soldier, 110],
    ]),
    ArtilleryAnimation.withSound('Attack/ArtilleryBattery'),
  ),
  Bazooka: RocketLauncherWeapon.withName('Bazooka')
    .withDamage(
      new Map([
        ...RocketLauncherWeapon.damage,

        [EntityType.Airplane, 100],
        [EntityType.AirSoldier, 110],
        [EntityType.Amphibious, 110],
        [EntityType.Artillery, 110],
        [EntityType.Ground, 110],
        [EntityType.LowAltitude, 110],
        [EntityType.Rail, 80],
        [EntityType.Ship, 80],
        [EntityType.Soldier, 110],
      ]),
    )
    .withAnimationPositions({
      down: sprite(-0.25, 0.9),
      horizontal: sprite(-0.97, 0.1),
      up: sprite(0.28, -0.8),
    }),
  Bite,
  Bomb,
  Cannon: new Weapon(
    'Cannon',
    new Map(buff(ArtilleryWeapon.damage, 10)),
    new WeaponAnimation('Cannon', 'Attack/Cannon', {
      frames: 14,
      positions: {
        down: sprite(-0.3, 2),
        horizontal: sprite(-0.97, 0.75),
        up: sprite(0.2, 0.25),
      },
      recoil: false,
      size: 80,
      trailingFrames: 6,
    }),
    ExplosionImpactAnimation,
  ),
  Club: new Weapon(
    'Club',
    new Map([
      [EntityType.AirSoldier, 100],
      [EntityType.Amphibious, 100],
      [EntityType.Artillery, 100],
      [EntityType.Building, 50],
      [EntityType.Ground, 100],
      [EntityType.Soldier, 120],
      [EntityType.Structure, 30],
    ]),
    EmptyAnimation.withSound('Attack/Club'),
    PowHitAnimation,
  ),
  CorrosiveAirToAirMissile: LightAirToAirMissile.withName('Corrosive Air Missile'),
  CorrosiveBomb: new Weapon(
    'Corrosive Bomb',
    new Map([
      [EntityType.Amphibious, 55],
      [EntityType.Artillery, 40],
      [EntityType.Ground, 50],
      [EntityType.Rail, 50],
      [EntityType.Ship, 55],
      [EntityType.Soldier, 45],
    ]),
    new WeaponAnimation('Acid', 'Attack/Bomb', {
      frames: 11,
      positions: {
        down: sprite(0, 1),
        horizontal: sprite(-0.9, 0.5),
        up: sprite(0, -0.5),
      },
      recoil: false,
      size: 36,
    }),
    new WeaponAnimation('AcidCloud', null, {
      frames: 8,
      leadingFrames: 3,
      recoil: false,
      size: 36,
    }),
  ),
  CruiseMissile,
  DroneBomb: Bomb.withName('Drone Bomb').withDamage(
    buff(
      (() => {
        const damage = new Map(Bomb.damage);
        damage.delete(EntityType.Building);
        damage.delete(EntityType.Structure);
        return damage;
      })(),
      -25,
    ),
  ),
  Flamethrower: FlamethrowerWeapon,
  Flask: new Weapon(
    'Flask',
    new Map([
      [EntityType.AirSoldier, 25],
      [EntityType.Amphibious, 25],
      [EntityType.Artillery, 25],
      [EntityType.Ground, 25],
      [EntityType.Rail, 25],
      [EntityType.Ship, 25],
      [EntityType.Soldier, 25],
    ]),
    new WeaponAnimation('Flask', 'Attack/SAM', {
      frames: 20,
      positions: {
        down: sprite(0, 1.3),
        horizontal: sprite(-1, 0),
        up: sprite(0, -1),
      },
      recoil: false,
      size: 48,
    }),
    new WeaponAnimation('FlaskExplosion', null, {
      frames: 8,
      leadingFrames: 10,
      recoil: false,
      size: 32,
    }),
    0,
    true,
  ),
  HeavyArtillery: new Weapon(
    'Heavy Artillery',
    new Map([
      [EntityType.AirSoldier, 120],
      [EntityType.Amphibious, 120],
      [EntityType.Artillery, 80],
      [EntityType.Ground, 120],
      [EntityType.Rail, 80],
      [EntityType.Ship, 80],
      [EntityType.Soldier, 120],
    ]),
    HeavyArtilleryAnimation,
    SmokeAnimation,
  ),
  HeavyGun,
  InfernoFlamethrower: FlamethrowerWeapon.withDamage(
    new Map([
      ...buff(FlamethrowerWeapon.damage, 15),
      ...buff(AirToAirMissile.damage, -15),

      [EntityType.Ship, 85],
    ]),
  ).withAnimationPositions({
    down: sprite(-0.35, 1.1),
    horizontal: sprite(-1, -0.2),
    up: sprite(0.45, -0.9),
  }),
  LightAirGun,
  LightAirToAirMissile,
  LightGun,
  MG,
  MiniGun,
  Pistol: new Weapon(
    'Pistol',
    buff(SoldierMG.damage, 20),
    new WeaponAnimation('Pistol', 'Attack/Pistol', {
      frames: 10,
      positions: {
        down: sprite(-0.1, 0.85),
        horizontal: sprite(-0.95, 0),
        up: sprite(0.22, -0.85),
      },
      recoil: true,
    }),
    SparkMiniAnimation,
  ),
  Punch: new Weapon(
    'Fist',
    new Map([
      [EntityType.AirSoldier, 50],
      [EntityType.Amphibious, 25],
      [EntityType.Artillery, 25],
      [EntityType.Ground, 25],
      [EntityType.Soldier, 50],
    ]),
    // UI/LongPress works great here, lol.
    new WeaponAnimation('Punch', 'UI/LongPress', {
      frames: 11,
      positions: {
        down: sprite(-0.1, 1),
        horizontal: sprite(-1, 0.2),
        up: sprite(0.1, -0.5),
      },
      recoil: true,
      size: 42,
      trailingFrames: 4,
    }),
    PowHitAnimation,
  ),
  Railgun: new Weapon(
    'Railgun',
    new Map([
      [EntityType.AirSoldier, 90],
      [EntityType.Amphibious, 130],
      [EntityType.Artillery, 90],
      [EntityType.Ground, 130],
      [EntityType.LowAltitude, 90],
      [EntityType.Rail, 90],
      [EntityType.Ship, 90],
      [EntityType.Soldier, 130],
    ]),
    new WeaponAnimation('Railgun', 'Attack/Railgun', {
      frames: 23,
      positions: {
        down: sprite(-0.15, 1.1),
        horizontal: sprite(-0.8, -0.1),
        up: sprite(0.15, -0.21),
      },
      recoil: true,
      recoilDelay: 17,
      size: 48,
      trailingFrames: 16,
    }),
    new WeaponAnimation('RailgunImpact', 'Attack/RailgunImpact', {
      frames: 16,
      leadingFrames: 23,
      positions: {
        horizontal: sprite(0, 0.35),
      },
      recoil: false,
      size: 64,
    }),
  ),
  Rocket: new Weapon(
    'Rocket',
    new Map([
      [EntityType.Airplane, 60],
      [EntityType.AirSoldier, 60],
      [EntityType.Amphibious, 90],
      [EntityType.Artillery, 70],
      [EntityType.Ground, 80],
      [EntityType.LowAltitude, 60],
      [EntityType.Rail, 60],
      [EntityType.Ship, 60],
      [EntityType.Soldier, 80],
    ]),
    new WeaponAnimation('Rocket', 'Attack/Rocket', {
      frames: 16,
      positions: {
        down: sprite(-0.5, 1.5),
        horizontal: sprite(-0.85, 0.17),
        up: sprite(0.8, -0.5),
      },
      recoil: true,
      size: 64,
      trailingFrames: 8,
    }),
    new WeaponAnimation('ExplosionImpact', 'ExplosionImpact', {
      frames: 10,
      leadingFrames: 14,
      recoil: false,
      size: 48,
    }),
  ),
  RocketLauncher: RocketLauncherWeapon,
  Rockets: new Weapon(
    'Rockets',
    new Map([
      [EntityType.Airplane, 90],
      [EntityType.AirSoldier, 70],
      [EntityType.LowAltitude, 90],
    ]),
    new WeaponAnimation('Rockets', 'Attack/Rockets', {
      frames: 9,
      positions: {
        down: sprite(0, 1.5),
        horizontal: sprite(-0.9, 0.2),
        up: sprite(0.35, -0.75),
      },
      recoil: true,
      size: 48,
      trailingFrames: 10,
    }),
    new WeaponAnimation('ExplosionImpact', 'ExplosionImpact', {
      frames: 10,
      leadingFrames: 9,
      recoil: false,
      size: 48,
    }),
  ),
  SAM: new Weapon(
    'SAM',
    new Map([
      [EntityType.Airplane, 140],
      [EntityType.AirSoldier, 150],
      [EntityType.LowAltitude, 150],
    ]),
    SAMAnimation,
    new WeaponAnimation('SAMImpact', 'Attack/SAMImpact', {
      frames: 12,
      leadingFrames: 10,
      positions: {
        horizontal: sprite(0.1, 0),
      },
      recoil: false,
      size: 42,
    }),
  ),
  SeaMG: MG.withDamage(
    new Map([
      [EntityType.AirSoldier, 80],
      [EntityType.Amphibious, 35],
      [EntityType.Artillery, 35],
      [EntityType.Ground, 35],
      [EntityType.LowAltitude, 80],
      [EntityType.Ship, 35],
      [EntityType.Soldier, 80],
    ]),
  ).withAnimationPositions({
    down: sprite(0.05, 0.55),
    horizontal: sprite(-0.3, 0.35),
    up: sprite(0.03, -0.2),
  }),
  Shotgun: new Weapon(
    'Shotgun',
    buff(SoldierMG.damage, 20),
    new WeaponAnimation('Shotgun', 'Attack/Shotgun', {
      frames: 17,
      positions: {
        down: sprite(0.1, 1.2),
        horizontal: sprite(-1, 0.115),
        up: sprite(0.1, -1),
      },
      recoil: false,
    }),
  ),
  SniperRifle: new Weapon(
    'Sniper Rifle',
    new Map([
      [EntityType.AirSoldier, 120],
      [EntityType.Amphibious, 70],
      [EntityType.Artillery, 100],
      [EntityType.Ground, 70],
      [EntityType.LowAltitude, 120],
      [EntityType.Rail, 50],
      [EntityType.Soldier, 120],
    ]),
    new WeaponAnimation('SniperRifle', 'Attack/SniperRifle', {
      frames: 14,
      positions: {
        down: sprite(0.05, 0.9),
        horizontal: sprite(-0.9, 0.23),
        up: sprite(-0.04, -0.55),
      },
      recoil: true,
      unfoldPositions: {
        down: sprite(0.05, 0.9),
        horizontal: sprite(-0.9, 0.45),
        up: sprite(-0.05, -0.75),
      },
    }),
  ),
  SoldierMG,
  SuperMiniGun: MiniGun.withName('Super Mini Gun').withDamage(buff(MiniGun.damage, 40)),
  TentacleWhip: new Weapon(
    'Tentacle Whip',
    new Map([
      [EntityType.AirSoldier, 100],
      [EntityType.Amphibious, 100],
      [EntityType.Artillery, 100],
      [EntityType.Ground, 100],
      [EntityType.LowAltitude, 100],
      [EntityType.Rail, 100],
      [EntityType.Ship, 120],
      [EntityType.Soldier, 120],
    ]),
    EmptyAnimation.withSound('Attack/TentacleWhip'),
    [
      OctopusBiteHitAnimation,
      OctopusBiteHitAnimation.copy({
        cell: 1,
        positions: {
          horizontal: sprite(0.08, OctopusBiteHitAnimationPositions.horizontal.x),
        },
        rotate: false,
      }),
      OctopusBiteHitAnimation.copy({
        cell: 2,
        positions: {
          horizontal: sprite(-0.044, -OctopusBiteHitAnimationPositions.horizontal.x),
        },
        rotate: false,
      }),
    ],
  ),
  Torpedo: new Weapon(
    'Torpedo',
    new Map([
      [EntityType.Amphibious, 90],
      [EntityType.Ship, 65],
      [EntityType.Structure, 50],
    ]),
    new WeaponAnimation('Torpedo', 'Attack/Torpedo', {
      frames: 9,
      positions: {
        down: sprite(-0.3, 0),
        horizontal: sprite(0, 0.2),
        up: sprite(0.3, 0),
      },
      recoil: false,
      trailingFrames: 14,
    }),
    new WeaponAnimation('Torpedo', 'Attack/TorpedoImpact', {
      cell: 1,
      frames: 14,
      leadingFrames: 9,
      positions: {
        down: sprite(-0.15, -0.05),
        horizontal: sprite(0.1, 0.2),
        up: sprite(0.15, -0.45),
      },
      recoil: false,
      rotate: false,
    }),
  ),
  ZombieBite: new Weapon(
    'Zombie Bite',
    buff(new Map([...Bite.damage, [EntityType.Rail, 80], [EntityType.Ship, 80]]), -50),
    BiteAnimation.withSound('Attack/ZombieBite'),
    BiteHitAnimation,
    5,
  ),
};

export const CaptureWeapon = new Weapon(
  'Capture',
  new Map(),
  MGAnimation.withSound('Unit/Load').repeats(1),
);

export const CapturedWeapon = new Weapon(
  'Capture',
  new Map(),
  EmptyAnimation.withSound('Unit/Capture').repeats(1),
);

const DefaultUnitAbilities = new UnitAbilities({
  accessBuildings: true,
  moveAndAct: true,
});
const DefaultShipUnitAbilities = new UnitAbilities({
  moveAndAct: true,
});
const PioneerUnitAbilities = DefaultUnitAbilities.copy({
  capture: true,
  createBuildings: true,
  createTracks: true,
  rescue: true,
});

const ZombieUnitAbilities = PioneerUnitAbilities.copy({ convert: true });

const DefaultUnitAbilitiesWithCapture = DefaultUnitAbilities.copy({
  capture: true,
});

const HealUnitAbilities = DefaultUnitAbilities.copy({
  heal: true,
});

const SaboteurUnitAbilities = DefaultUnitAbilities.copy({
  rescue: true,
  sabotage: true,
});

const DefaultSabotageTypes = new Set([
  EntityType.AirSoldier,
  EntityType.Amphibious,
  EntityType.Artillery,
  EntityType.Building,
  EntityType.Ground,
  EntityType.Soldier,
  EntityType.Invincible,
  EntityType.LowAltitude,
  EntityType.Rail,
  EntityType.Ship,
  EntityType.Structure,
]);

export const Pioneer = new UnitInfo(
  UnitID.Pioneer,
  'Pioneer',
  'Scout A',
  'male',
  `Pioneers are an essential utility unit capable of building and capturing structures as well as laying rail tracks. They lack an attack and are therefore vulnerable on the battlefield.`,
  '',
  0,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: 100,
    fuel: 40,
    radius: 3,
    vision: 2,
  },
  PioneerUnitAbilities,
  null,
  null,
  {
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 1 },
      position: sprite(8, 1),
    },
    name: 'Units-Pioneer',
    portrait: {
      position: sprite(4, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const Infantry = new UnitInfo(
  UnitID.Infantry,
  'Infantry',
  'Soldier B',
  'male',
  `Infantry units are standard foot soldiers, capable of capturing buildings. With minimal defense and a standard movement range, it is a balanced yet cheap unit. While Infantry is effective against all other foot soldiers, their ability to defend against stronger units is limited.`,
  '',
  5,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: 200,
    fuel: 50,
    radius: 3,
    vision: 2,
  },
  DefaultUnitAbilitiesWithCapture,
  { type: AttackType.ShortRange, weapons: [Weapons.SoldierMG] },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 1 },
      position: sprite(8, 1),
    },
    name: 'Units-Infantry',
    portrait: {
      position: sprite(3, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const RocketLauncher = new UnitInfo(
  3,
  'Rocket Launcher',
  'Gunner C',
  'male',
  `The Rocket Launcher excels in short-range combat with strong firepower against tanks and other ground units. It is limited by its slow movement and high cost, but is invaluable when defending against a barrage of tanks in your territory.`,
  '',
  15,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: 300,
    fuel: 40,
    radius: 3,
    vision: 2,
  },
  DefaultUnitAbilitiesWithCapture.copy({ heavyEquipment: true }),
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.RocketLauncher.withSupply(4)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-RocketLauncher',
    portrait: {
      position: sprite(2, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const APU = new UnitInfo(
  4,
  'APU',
  'Mech D',
  'female',
  `The APU, or Armored Personnel Unit, is a special ground unit with effective firepower against soldiers. Capable of traversing challenging terrains, its versatility in both offense and defense is amplified by its relatively low cost.`,
  '',
  25,
  EntityType.Ground,
  MovementTypes.HeavySoldier,
  {
    cost: 300,
    fuel: 40,
    radius: 4,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.MiniGun.withSupply(6)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-APU',
    portrait: {
      position: sprite(7, 0),
      variants: 3,
    },
  },
);

export const SmallTank = new UnitInfo(
  5,
  'Small Tank',
  'Tanker E',
  'female',
  `Built for combat, the Small Tank is moderately expensive but offers good firepower and robust defense against all other ground units. It can move far but has limited visibility in fog and is vulnerable to attacks from most soldiers.`,
  '',
  40,
  EntityType.Ground,
  MovementTypes.Tread,
  {
    cost: 375,
    fuel: 30,
    radius: 7,
    vision: 2,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.LightGun.withSupply(7)],
  },
  null,
  {
    direction: 'left',
    invert: false,
    name: 'Units-SmallTank',
    portrait: {
      position: sprite(10, 0),
      variants: 3,
    },
  },
);

const GroundSupplyTypes = new Set([
  EntityType.AirSoldier,
  EntityType.Amphibious,
  EntityType.Artillery,
  EntityType.Ground,
  EntityType.Soldier,
  EntityType.Rail,
  EntityType.Ship,
]);

export const Jeep = new UnitInfo(
  UnitID.Jeep,
  'Jeep',
  'Driver F',
  'male',
  `This unit is designed for fast mobility and has the ability to resupply other units. Its defense is low, making it vulnerable to enemy attacks. It can't engage in combat but is essential for logistics and exploration and can transport foot soldiers to the battlefield.`,
  '',
  10,
  EntityType.Ground,
  MovementTypes.Tires,
  {
    cost: 150,
    fuel: 60,
    radius: 7,
    supplyTypes: GroundSupplyTypes,
    vision: 2,
  },
  new UnitAbilities({
    accessBuildings: true,
    moveAndAct: true,
    supply: true,
  }),
  null,
  {
    entities: new Map([
      [EntityType.AirSoldier, true],
      [EntityType.Soldier, true],
    ]),
    limit: 2,
  },
  {
    direction: 'left',
    name: 'Units-Jeep',
    portrait: {
      position: sprite(15, 0),
      variants: 3,
    },
    transports: sprite(0, 3),
    transportsMany: sprite(0, 6),
  },
);

export const Artillery = new UnitInfo(
  UnitID.Artillery,
  'Artillery',
  'Artillery G',
  'male',
  `Artilleries are cost-effective long-range units that have to be positioned in order to attack. Though immobilized while in position, their strikes are particularly lethal against soldiers and light ground forces.`,
  '',
  10,
  EntityType.Artillery,
  MovementTypes.Tires,
  {
    cost: 250,
    fuel: 40,
    radius: 5,
    vision: 1,
  },
  new UnitAbilities({
    accessBuildings: true,
    moveAndAct: true,
    unfold: true,
  }),
  {
    range: [2, 4],
    type: AttackType.LongRange,
    weapons: [Weapons.Artillery.withSupply(7)],
  },
  null,
  {
    name: 'Units-MobileArtillery',
    portrait: {
      position: sprite(13, 0),
      variants: 3,
    },
    unfold: sprite(0, 4),
    unfoldSounds: {
      fold: 'Unit/ArtilleryFold',
      unfold: 'Unit/ArtilleryUnfold',
    },
    unfoldSprite: { frames: 5, position: sprite(0, 3) },
  },
);

export const Battleship = new UnitInfo(
  8,
  'Battleship',
  'Admiral H',
  'male',
  `Battleships are the queens of the sea, known for their highly effective long-range attacks. They are among the most expensive units, but when sighted by an opponent, a Battleship often brings disarray to their fleet and requires a strategic adjustment.`,
  '',
  30,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: 1000,
    fuel: 40,
    radius: 5,
    vision: 2,
  },
  new UnitAbilities(),
  {
    range: [3, 6],
    type: AttackType.LongRange,
    weapons: [Weapons.Battery.withSupply(4)],
  },
  null,
  {
    direction: 'left',
    invert: false,
    name: 'Units-BattleShip',
    portrait: {
      position: sprite(37, 0),
      variants: 3,
    },
  },
);

export const Helicopter = new UnitInfo(
  9,
  'Helicopter',
  'Pilot I',
  'male',
  `Helicopter units are essential for low-altitude air control. They can keep soldiers and other ground units at bay while building up a strong defense. Their high mobility and vision range make them particularly useful for scouting in fog.`,
  '',
  40,
  EntityType.LowAltitude,
  MovementTypes.LowAltitude,
  {
    cost: 300,
    fuel: 40,
    radius: 6,
    vision: 5,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.LightAirGun.withSupply(8).withAnimationPositions({
        ...Weapons.LightAirGun.animation.positions,
        horizontal: sprite(-0.4, 0.4),
      }),
    ],
  },
  null,
  {
    direction: 'right',
    name: 'Units-Helicopter',
    portrait: {
      position: sprite(12, 0),
      variants: 3,
    },
  },
);

export const Humvee = new UnitInfo(
  10,
  'Humvee',
  'Scout J',
  'male',
  `With their high visibility and large movement range, Humvees are particularly useful for scouting and taking out opposing artillery units. Their high mobility, coupled with their low defense, makes them vulnerable when they cross into enemy territory.`,
  '',
  20,
  EntityType.Ground,
  MovementTypes.Tires,
  {
    cost: 225,
    fuel: 50,
    radius: 8,
    vision: 5,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.MG.withDamage(new Map([...Weapons.MG.damage, [EntityType.LowAltitude, 55]]))
        .withSupply(7)
        .withAnimationPositions({
          down: sprite(0, 0.4),
          horizontal: sprite(-0.45, 0.15),
          up: sprite(0.03, -0.4),
        }),
      Weapons.AntiArtilleryGun.withSupply(5),
    ],
  },
  null,
  {
    direction: 'left',
    name: 'Units-Humvee',
    portrait: {
      position: sprite(14, 0),
      variants: 3,
    },
  },
);

export const AntiAir = new UnitInfo(
  11,
  'Anti Air',
  'Defense K',
  'female',
  `Anti Air tanks are the only ground units that are highly effective against all types of air units. They need to be heavily protected by surrounding units due to their weak defense.`,
  '',
  30,
  EntityType.Ground,
  MovementTypes.Tread,
  {
    cost: 250,
    fuel: 30,
    radius: 6,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.AntiAirGun.withSupply(10)],
  },
  null,
  {
    direction: 'left',
    invert: false,
    name: 'Units-AntiAir',
    portrait: {
      position: sprite(24, 0),
      variants: 3,
    },
  },
);

export const HeavyArtillery = new UnitInfo(
  UnitID.HeavyArtillery,
  'Heavy Artillery',
  'Heavy L',
  'male',
  `Heavy Artilleries are feared for their large attack range. They deal severe ranged damage, but they are vulnerable to any unit that can get close to them.`,
  '',
  5,
  EntityType.Artillery,
  MovementTypes.Tread,
  {
    cost: 650,
    fuel: 15,
    radius: 3,
    vision: 1,
  },
  new UnitAbilities({ accessBuildings: true }),
  {
    range: [3, 5],
    type: AttackType.LongRange,
    weapons: [Weapons.HeavyArtillery.withSupply(4)],
  },
  null,
  {
    direction: 'left',
    invert: false,
    name: 'Units-HeavyArtillery',
    portrait: {
      position: sprite(16, 0),
      variants: 3,
    },
  },
);

export const Lander = new UnitInfo(
  13,
  'Lander',
  'Captain M',
  'male',
  `Landers can transport soldiers across the sea. They are an essential unit for staging an attack on remote islands, but they lack offensive capabilities and need to be protected by other units.`,
  '',
  10,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: 225,
    fuel: 60,
    radius: 7,
    vision: 1,
  },
  DefaultShipUnitAbilities,
  null,
  {
    entities: new Map<EntityType, UnitTransportEntityConfig>([
      [EntityType.AirSoldier, true],
      [EntityType.Soldier, new Set([TileID.Beach])],
    ]),
    limit: 2,
  },
  {
    direction: 'left',
    name: 'Units-Lander',
    portrait: {
      position: sprite(40, 0),
      variants: 3,
    },
    transports: sprite(0, 3),
    transportsMany: sprite(0, 6),
  },
);

export const Sniper = new UnitInfo(
  UnitID.Sniper,
  'Sniper',
  'Sniper N',
  'female',
  `Snipers stand out as the only soldiers capable of long-range attacks. Though costly and requiring positioning to attack, they can make the necessary difference in securing strategic locations.`,
  '',
  15,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: 375,
    fuel: 40,
    radius: 4,
    vision: 1,
  },
  new UnitAbilities({
    accessBuildings: true,
    moveAndAct: true,
    unfold: true,
  }),
  {
    range: [2, 4],
    type: AttackType.LongRange,
    weapons: [Weapons.SniperRifle.withSupply(7)],
  },
  null,
  {
    alternativeExplosionSprite: {
      frames: 8,
      position: sprite(7, 9),
    },
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 1 },
      position: sprite(7, 1),
    },
    name: 'Units-Sniper',
    portrait: {
      position: sprite(1, 0),
      variants: 6,
    },
    slow: true,
    unfold: sprite(0, 8),
    unfoldSounds: {
      fold: 'Unit/SniperFold',
      unfold: 'Unit/SniperUnfold',
    },
    unfoldSprite: { frames: 8, position: sprite(0, 6) },
  },
);

export const Flamethrower = new UnitInfo(
  UnitID.Flamethrower,
  'Flamethrower',
  'Flame O',
  'unknown',
  `Flamethrowers specialize in close combat, wielding immense firepower effective against soldiers and light ground units. Howeveer, carrying a volatile gas tank on their backs results in low defense and makes them susceptible to attacks.`,
  '',
  0,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: 400,
    fuel: 30,
    radius: 4,
    vision: 3,
  },
  DefaultUnitAbilitiesWithCapture,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Flamethrower.withSupply(4)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-Flamethrower',
    portrait: {
      position: sprite(5, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const Saboteur = new UnitInfo(
  UnitID.Saboteur,
  'Saboteur',
  'Operative P',
  'male',
  `Saboteurs are the most mischievous of all units, capable of sabotaging opposing units and taking away their supplies. They can also rescue neutral units on the battlefield to join their cause. Because they don't carry weapons, they rely on their fists to defend themselves.`,
  '',
  10,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: 275,
    fuel: 40,
    radius: 6,
    sabotageTypes: DefaultSabotageTypes,
    vision: 1,
  },
  SaboteurUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Punch],
  },
  null,
  {
    attackStance: 'once',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 1 },
      position: sprite(7, 1),
    },
    name: 'Units-Saboteur',
    portrait: {
      position: sprite(9, 0),
      variants: 6,
    },
    slow: true,
  },
);

export const TransportHelicopter = new UnitInfo(
  17,
  'Transport Chopper',
  'Airlift Q',
  'male',
  `Transport Helicopters can resupply air units, ensuring that a fleet doesn't run out of supplies and risk crashing. They can also transport up to two soldiers across the battlefield.`,
  '',
  30,
  EntityType.LowAltitude,
  MovementTypes.LowAltitude,
  {
    cost: 200,
    fuel: 60,
    radius: 7,
    supplyTypes: new Set([EntityType.AirSoldier, EntityType.LowAltitude, EntityType.Airplane]),
    vision: 3,
  },
  new UnitAbilities({
    accessBuildings: true,
    moveAndAct: true,
    supply: true,
  }),
  null,
  {
    entities: new Map([
      [EntityType.AirSoldier, true],
      [EntityType.Soldier, true],
    ]),
    limit: 2,
  },
  {
    direction: 'right',
    name: 'Units-TransportHelicopter',
    portrait: {
      position: sprite(18, 0),
      variants: 3,
    },
  },
);

export const FighterJet = new UnitInfo(
  UnitID.FighterJet,
  'Fighter Jet',
  'Ace R',
  'unknown',
  `Fighter Jets ensure air superiority with their high mobility and firepower against other air units. While they cannot win a battle alone, lacking Fighter Jets in a fleet means ceding air control to the opponent.`,
  '',
  60,
  EntityType.Airplane,
  MovementTypes.Air,
  {
    cost: 550,
    fuel: 50,
    radius: 8,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.AirToAirMissile.withAnimationPositions(
        {
          down: sprite(0.2, 0.3),
          horizontal: sprite(-0.15, 0.25),
          horizontalAlternative: sprite(0.15, 0.05),
          up: sprite(0.2, 0.1),
        },
        true,
      ).withSupply(8),
    ],
  },
  null,
  {
    direction: 'right',
    name: 'Units-FighterJet',
    portrait: {
      position: sprite(19, 0),
      variants: 3,
    },
  },
);

export const Bomber = new UnitInfo(
  UnitID.Bomber,
  'Bomber',
  'Bomber Z2',
  'male',
  `If Fighter Jets are the kings of the air, Bombers are the queens. They can deal massive damage to ground units and buildings but have no defenses against air units.`,
  '',
  55,
  EntityType.Airplane,
  MovementTypes.Air,
  {
    cost: 800,
    fuel: 40,
    radius: 6,
    vision: 2,
  },
  DefaultUnitAbilities,
  { type: AttackType.ShortRange, weapons: [Weapons.Bomb.withSupply(5)] },
  null,
  {
    direction: 'right',
    name: 'Units-Bomber',
    portrait: {
      position: sprite(23, 0),
      variants: 3,
    },
  },
);

export const Jetpack = new UnitInfo(
  20,
  'Jetpack',
  'Flyer S',
  'male',
  `Jetpacks are a new invention. They can navigate almost all terrain types and are effective against air and ground units. They can capture buildings, but their low fuel supply makes them a risky investment.`,
  '',
  20,
  EntityType.AirSoldier,
  MovementTypes.AirInfantry,
  {
    cost: 300,
    fuel: 30,
    radius: 4,
    vision: 2,
  },
  DefaultUnitAbilitiesWithCapture,
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.SoldierMG.withSupply(5).withAnimationPositions({
        down: sprite(0.03, 0.45),
        horizontal: sprite(-0.45, 0.07),
        up: sprite(0, -0.4),
      }),
      AirToAirMissile.withSupply(3)
        .withDamage(buff(AirToAirMissile.damage, -15))
        .withAnimationPositions({
          down: sprite(0.03, 0.45),
          horizontal: sprite(-0.45, 0.07),
          up: sprite(0, -0.4),
        }),
    ],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-Jetpack',
    portrait: {
      position: sprite(8, 0),
      variants: 3,
    },
    withNavalExplosion: true,
  },
);

export const SeaPatrol = new UnitInfo(
  21,
  'Sea Patrol',
  'Patrol T',
  'female',
  `Low-altitude Sea Patrol units are inexpensive and incredibly useful for securing coastal areas against ships and other low-altitude aircraft. However, their low mobility makes them particularly vulnerable to air attacks, and crash landings on islands are not uncommon.`,
  '',
  30,
  EntityType.LowAltitude,
  MovementTypes.LowAltitude,
  {
    cost: 200,
    fuel: 40,
    radius: 4,
    vision: 4,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [
      LightAirGun.withDamage(
        new Map([
          [EntityType.AirSoldier, 100],
          [EntityType.Amphibious, 70],
          [EntityType.Artillery, 55],
          [EntityType.Ground, 55],
          [EntityType.LowAltitude, 100],
          [EntityType.Rail, 55],
          [EntityType.Ship, 85],
          [EntityType.Soldier, 40],
        ]),
      ).withSupply(5),
    ],
  },
  null,
  {
    direction: 'right',
    name: 'Units-SeaPatrol',
    portrait: {
      position: sprite(17, 0),
      variants: 3,
    },
  },
);

export const AcidBomber = new UnitInfo(
  UnitID.AcidBomber,
  'Acid Bomber',
  'Chemist U',
  'female',
  `Acid Bombers excel in aerial assaults, deploying corrosive bombs that inflict poison damage over time. Their primary weapon, the Corrosive Bomb, can devastate ground and naval units alike. Equipped with Corrosive Air-to-Air Missiles, they can also engage enemy aircraft effectively. However, their chemical payloads are low, which means they have limited ammunition, making resupply crucial for sustained operations.`,
  '',
  60,
  EntityType.Airplane,
  MovementTypes.Air,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 30,
    radius: 5,
    vision: 1,
  },
  DefaultUnitAbilities.copy({ poison: true }),
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.CorrosiveBomb.withSupply(4), Weapons.CorrosiveAirToAirMissile.withSupply(3)],
  },
  null,
  {
    direction: 'right',
    name: 'Units-AcidBomber',
    portrait: {
      position: sprite(25, 0),
      variants: 3,
    },
  },
);

export const DroneBomber = new UnitInfo(
  UnitID.DroneBomber,
  'Drone Bomber',
  'Drone A3',
  'unknown',
  `A battleship of the skies? That's what the Drone Bomber is. Equipped with high powered cluster bombs and built with heavy armor, the Drone Bomber is the peregrine falcon of all military aircraft. Unlike the conventional bomber unit, the Drone Bomber can attack from a distance, making it ideal against anti-air units and other heavy armor. The Drone Bomber was commissioned as part of Project Pegasus, a technical marvel in engineering and aviation as it's the first automated military aircraft ever produced.`,
  '',
  50,
  EntityType.Airplane,
  MovementTypes.Air,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 50,
    radius: 5,
    vision: 3,
  },
  new UnitAbilities({ accessBuildings: true }),
  {
    range: [3, 5],
    type: AttackType.LongRange,
    weapons: [Weapons.DroneBomb.withSupply(5)],
  },
  null,
  {
    direction: 'right',
    name: 'Units-Drone',
    portrait: {
      position: sprite(22, 0),
      variants: 3,
    },
  },
);

export const ReconDrone = new UnitInfo(
  24,
  'Recon Drone',
  'Recon B3',
  'unknown',
  `Unknown`,
  '',
  15,
  EntityType.Airplane,
  MovementTypes.Air,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 60,
    radius: 7,
    vision: 5,
  },
  DefaultUnitAbilities,
  { type: AttackType.ShortRange, weapons: [Weapons.MG.withSupply(5)] },
  null,
  {
    direction: 'right',
    name: 'Units-ReconDrone',
    portrait: {
      position: sprite(21, 0),
      variants: 3,
    },
  },
);

export const XFighter = new UnitInfo(
  UnitID.XFighter,
  'X-Fighter',
  'Ace V',
  'female',
  `The X-Fighter is a cheap and fast air unit that can attack other air units directly or indirectly. X-Fighters are not strong, but they can lure enemy air units into traps and attack them from a distance.`,
  '',
  30,
  EntityType.Airplane,
  MovementTypes.Air,
  {
    cost: 250,
    fuel: 40,
    radius: 5,
    vision: 2,
  },
  DefaultUnitAbilities,
  {
    range: [1, 2],
    type: AttackType.LongRange,
    weapons: [Weapons.LightAirToAirMissile.withSupply(5)],
  },
  null,
  {
    direction: 'right',
    name: 'Units-XFighter',
    portrait: {
      position: sprite(20, 0),
      variants: 3,
    },
  },
);

export const Medic = new UnitInfo(
  UnitID.Medic,
  'Medic',
  'Medic W',
  'male',
  `Medics are essential on a battlefield with constrained resources. They can patch up wounded soldiers right at the frontlines and keep them going long enough to potentially turn the tide of battle.`,
  '',
  0,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: 250,
    fuel: 80,
    healTypes: new Set([EntityType.Soldier, EntityType.AirSoldier]),
    radius: 4,
    vision: 1,
  },
  HealUnitAbilities.copy({ rescue: true }),
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Punch],
  },
  null,
  {
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 1 },
      position: sprite(7, 1),
    },
    healSprite: {
      frames: 8,
      position: sprite(0, 6),
    },
    name: 'Units-Medic',
    portrait: {
      position: sprite(0, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const AmphibiousTank = new UnitInfo(
  27,
  'Amphibious Tank',
  'Amphib X',
  'male',
  `Amphibious Tanks are versatile units that can move on both land and water. Their attack power is similar to Small Tanks but they can additionally navigate the sea and deal meaningful damage to ships.`,
  '',
  35,
  EntityType.Amphibious,
  MovementTypes.Amphibious,
  {
    cost: 450,
    fuel: 25,
    radius: 6,
    vision: 2,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.AmphibiousLightGun.withSupply(10)],
  },
  null,
  {
    alternative: sprite(0, 3),
    direction: 'left',
    name: 'Units-Amphibious',
    portrait: {
      position: sprite(11, 0),
      variants: 3,
    },
  },
);

export const Destroyer = new UnitInfo(
  28,
  'Destroyer',
  'Destroyer Y',
  'male',
  `Destroyers are among the most versatile naval units. Technological advances allow Destroyers to be highly effective against air and ground units, but they are vulnerable to other naval units.`,
  '',
  30,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: 350,
    fuel: 60,
    radius: 6,
    vision: 3,
  },
  DefaultShipUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.SAM.withSupply(6), CruiseMissile.withSupply(4)],
  },
  null,
  {
    direction: 'left',
    invert: false,
    name: 'Units-Destroyer',
    portrait: {
      position: sprite(35, 0),
      variants: 3,
    },
  },
);

export const Frigate = new UnitInfo(
  29,
  'Frigate',
  'Frigate Z',
  'male',
  `The Frigate is every naval fleet's workhorse. It's a dual short- and long-range unit that is highly effective against ships. Its lower mobility is countered by its ability to attack from a distance.`,
  '',
  10,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: 400,
    fuel: 60,
    radius: 5,
    vision: 3,
  },
  DefaultShipUnitAbilities,
  {
    range: [1, 2],
    type: AttackType.LongRange,
    weapons: [Weapons.AntiShipMissile.withSupply(8)],
  },
  null,
  {
    direction: 'left',
    name: 'Units-Frigate',
    portrait: {
      position: sprite(39, 0),
      variants: 3,
    },
  },
);

export const Hovercraft = new UnitInfo(
  30,
  'Hovercraft',
  'Hover A2',
  'male',
  `Hovercrafts are gigantic barges that can transport up to four ground units across the sea. While they cannot attack, they have entertainment and relaxation facilities on board, which keep their loaded troops in high spirits. This morale boost often enables devastating surprise attacks immediately upon landing on enemy shores.`,
  '',
  20,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: 400,
    fuel: 60,
    radius: 7,
    vision: 3,
  },
  DefaultShipUnitAbilities,
  null,
  {
    entities: new Map<EntityType, UnitTransportEntityConfig>([
      [EntityType.Soldier, new Set([TileID.Beach])],
      [EntityType.AirSoldier, true],
      [EntityType.Ground, new Set([TileID.Beach])],
      [EntityType.Artillery, new Set([TileID.Beach])],
    ]),
    limit: 4,
  },
  {
    direction: 'left',
    invert: false,
    name: 'Units-Hovercraft',
    portrait: {
      position: sprite(34, 0),
      variants: 3,
    },
  },
);

export const PatrolShip = new UnitInfo(
  31,
  'Patrol Ship',
  'Patrol B2',
  'female',
  `The Patrol Ship is an amphibious unit capable of capture both on land and at sea. It can help secure an early economic advantage by taking control of Oil Rigs and Shipyards. It is strong against soldiers but weak against other unit types.`,
  '',
  20,
  EntityType.Amphibious,
  MovementTypes.Amphibious,
  {
    cost: 300,
    fuel: 60,
    radius: 5,
    vision: 3,
  },
  DefaultUnitAbilitiesWithCapture,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.SeaMG.withSupply(6)],
  },
  null,
  {
    alternative: sprite(0, 3),
    direction: 'left',
    name: 'Units-SmallHovercraft',
    portrait: {
      position: sprite(36, 0),
      variants: 3,
    },
  },
);

const EntityTypesToSupport = new Set([
  EntityType.Amphibious,
  EntityType.Artillery,
  EntityType.Ground,
  EntityType.Soldier,
  EntityType.Rail,
  EntityType.Ship,
]);
export const SupportShip = new UnitInfo(
  32,
  'Support Ship',
  'Support C2',
  'male',
  `The Support Ship can heal and resupply both ground units and ships in its vicinity. While it is not usually seen on the frontlines when a battle commences, it is essential for maintaining supply lines and keeping a fleet in fighting shape.`,
  '',
  40,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: 275,
    fuel: 90,
    healTypes: EntityTypesToSupport,
    radius: 6,
    supplyTypes: EntityTypesToSupport,
    vision: 5,
  },
  new UnitAbilities({
    heal: true,
    moveAndAct: true,
    rescue: true,
    supply: true,
  }),
  null,
  null,
  {
    direction: 'left',
    name: 'Units-SupportShip',
    portrait: {
      position: sprite(41, 0),
      variants: 3,
    },
  },
);

export const Corvette = new UnitInfo(
  33,
  'Corvette',
  'Corvette D2',
  'female',
  `The Corvette is the smallest of ships, but its torpedoes can deal significant damage to other ships. Coupled with its low cost and high mobility, it can be devastating to even the largest of fleets when it catches them off guard.`,
  '',
  0,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: 200,
    fuel: 30,
    radius: 6,
    vision: 1,
  },
  DefaultShipUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Torpedo.withSupply(5)],
  },
  null,
  {
    direction: 'left',
    name: 'Units-Corvette',
    portrait: {
      position: sprite(38, 0),
      variants: 3,
    },
  },
);

export const Mammoth = new UnitInfo(
  34,
  'Mammoth',
  'Mammoth E2',
  'male',
  `Unmatched in firepower on the battlefield, the Mammoth is slow but can deal massive damage to distant units. Novel technology enables the Mammoth to move and attack simultaneously, making it extremely dangerous in the hands of a skilled commander.`,
  '',
  35,
  EntityType.Rail,
  MovementTypes.Rail,
  {
    cost: 900,
    fuel: 30,
    radius: 4,
    vision: 1,
  },
  DefaultUnitAbilities,
  {
    range: [2, 4],
    type: AttackType.LongRange,
    weapons: [Weapons.Railgun.withSupply(6)],
  },
  null,
  {
    direction: 'left',
    name: 'Units-Mammoth',
    portrait: {
      position: sprite(42, 0),
      variants: 3,
    },
  },
);

export const TransportTrain = new UnitInfo(
  35,
  'Transport Train',
  'Conductor F2',
  'female',
  `While primarily a unit for transporting other ground units to the frontlines quickly, the Transport Train also boasts a formidable attack. Coupled with its high defense it can clear a path for loaded troops and protect them.`,
  '',
  30,
  EntityType.Rail,
  MovementTypes.Rail,
  {
    cost: 325,
    fuel: 30,
    radius: 7,
    vision: 2,
  },
  new UnitAbilities({
    moveAndAct: true,
  }),
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.HeavyGun.withDamage(
        new Map([
          [EntityType.AirSoldier, 55],
          [EntityType.Amphibious, 125],
          [EntityType.Artillery, 125],
          [EntityType.Building, 70],
          [EntityType.Ground, 125],
          [EntityType.LowAltitude, 55],
          [EntityType.Rail, 115],
          [EntityType.Ship, 70],
          [EntityType.Soldier, 85],
          [EntityType.Structure, 80],
        ]),
      ).withSupply(5),
    ],
  },
  {
    entities: new Map([
      [EntityType.AirSoldier, true],
      [EntityType.Soldier, true],
      [EntityType.Ground, true],
      [EntityType.Artillery, true],
      [EntityType.Amphibious, true],
    ]),
    limit: 4,
  },
  {
    direction: 'left',
    name: 'Units-TransportTrain',
    portrait: {
      position: sprite(43, 0),
      variants: 3,
    },
  },
);

export const Dinosaur = new UnitInfo(
  UnitID.Dinosaur,
  'Dinosaur',
  'Beast G2',
  'unknown',
  'A Dinosaur in this day and age?? How did it get here? Do you think it hatched from an Easter Egg?',
  '',
  25,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 100,
    radius: 3,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Bite.withDamage(buff(Weapons.Bite.damage, 40))],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-Dinosaur',
    portrait: {
      position: sprite(44, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const HeavyTank = new UnitInfo(
  37,
  'Heavy Tank',
  'Heavy H2',
  'male',
  `The Heavy Tank strikes a perfect balance between firepower, defense, and mobility. It excels in most head-to-head battles and can withstand significant damage. Armies typically field a few Heavy Tanks to lead charges and break through enemy lines.`,
  '',
  60,
  EntityType.Ground,
  MovementTypes.Tread,
  {
    cost: 600,
    fuel: 25,
    radius: 5,
    vision: 2,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.HeavyGun.withSupply(10),
      Weapons.MG.withAnimationPositions({
        down: sprite(-0.06, 0.65),
        horizontal: sprite(-0.4, 0.13),
        up: sprite(-0.08, -0.35),
      }),
    ],
  },
  null,
  {
    direction: 'left',
    name: 'Units-HeavyTank',
    portrait: {
      position: sprite(47, 0),
      variants: 3,
    },
  },
);

export const SuperTank = new UnitInfo(
  UnitID.SuperTank,
  'Super Tank',
  'Super I2',
  'male',
  `The Super Tank is among the most powerful units with extremely high firepower and defense. Unfortunately, due to the complexity of their design nobody has figured out how to build new Super Tanks. They can only be acquired by rescuing them on the battlefield.`,
  '',
  70,
  EntityType.Ground,
  MovementTypes.Tread,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 20,
    radius: 3,
    vision: 1,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.HeavyGun.withDamage(buff(Weapons.HeavyGun.damage, 25)).withSupply(10)],
  },
  null,
  {
    direction: 'left',
    name: 'Units-SuperTank',
    portrait: {
      position: sprite(48, 0),
      variants: 3,
    },
  },
);

export const HumveeAvenger = new UnitInfo(
  UnitID.HumveeAvenger,
  'Humvee Avenger',
  'Avenger J2',
  'female',
  `The Humvee Avenger is a fast-moving but rare anti-air unit. Its high speed lets it quickly reposition to defend against opposing air units. While it can't target ground units, it can provide valuable support to other units on the battlefield.`,
  '',
  20,
  EntityType.Ground,
  MovementTypes.Tires,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 30,
    radius: 6,
    vision: 5,
  },
  DefaultUnitAbilities,
  {
    range: [1, 2],
    type: AttackType.LongRange,
    weapons: [Weapons.Rockets.withSupply(4)],
  },
  null,
  {
    direction: 'left',
    name: 'Units-HumveeAvenger',
    portrait: {
      position: sprite(49, 0),
      variants: 3,
    },
  },
);

export const ArtilleryHumvee = new UnitInfo(
  40,
  'Artillery Humvee',
  'Unknown',
  'female',
  `Unknown`,
  '',
  30,
  EntityType.Ground,
  MovementTypes.Tires,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 40,
    radius: 6,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    range: [2, 3],
    type: AttackType.LongRange,
    weapons: [Weapons.Rocket.withSupply(10)],
  },
  null,
  {
    direction: 'left',
    name: 'Units-ArtilleryHumvee',
    portrait: {
      position: sprite(50, 0),
      variants: 3,
    },
  },
);

export const SupplyTrain = new UnitInfo(
  41,
  'Supply Train',
  'Supply K2',
  'male',
  `Supply Trains are among the most cost effective units when it comes to attacking other ground units. They are capable of supplying other units on the battlefield and they can help with keeping supply lines open.`,
  '',
  40,
  EntityType.Rail,
  MovementTypes.Rail,
  {
    cost: 200,
    fuel: 60,
    radius: 6,
    supplyTypes: GroundSupplyTypes,
    vision: 1,
  },
  new UnitAbilities({
    moveAndAct: true,
    supply: true,
  }),
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.LightGun.withDamage(
        new Map([
          ...LightGun.damage,

          [EntityType.Amphibious, 75],
          [EntityType.Ship, 55],
        ]),
      ).withSupply(5),
    ],
  },
  null,
  {
    direction: 'left',
    name: 'Units-SupplyTrain',
    portrait: {
      position: sprite(46, 0),
      variants: 3,
    },
  },
);

export const Truck = new UnitInfo(
  42,
  'Truck',
  'Unknown',
  'female',
  `Unknown`,
  '',
  40,
  EntityType.Ground,
  MovementTypes.Tires,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 100,
    radius: 8,
    supplyTypes: GroundSupplyTypes,
    vision: 2,
  },
  new UnitAbilities({
    accessBuildings: true,
    moveAndAct: true,
    supply: true,
  }),
  null,
  {
    entities: new Map([
      [EntityType.AirSoldier, true],
      [EntityType.Soldier, true],
    ]),
    limit: 4,
  },
  {
    direction: 'left',
    name: 'Units-Truck',
    portrait: {
      position: sprite(52, 0),
      variants: 3,
    },
  },
);

export const Octopus = new UnitInfo(
  UnitID.Octopus,
  'Octopus',
  'Octopus L2',
  'unknown',
  `Octopus units are a formidable naval force, known for their tentacle whips that deal significant damage to ships and ground units. Wait, isn't anyone curious why octopi are part of the fleet? They just… exist?`,
  '',
  5,
  EntityType.Ship,
  MovementTypes.Ship,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 200,
    radius: 5,
    vision: 2,
  },
  DefaultShipUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.TentacleWhip.withSupply(10)],
  },
  null,
  {
    attackStance: 'long',
    directionOffset: 3,
    explosionSprite: {
      frames: 8,
      position: sprite(0, 2),
    },
    name: 'Units-Octopus',
    portrait: {
      position: sprite(29, 0),
      variants: 3,
    },
  },
);

export const Dragon = new UnitInfo(
  UnitID.Dragon,
  'Dragon',
  'Dragon M2',
  'unknown',
  `Dragons are kind of like a multiversal Flamethrower unit, if you think about it. Except they can also fly, are huge, and people tend to freeze when they see a Dragon. So, not really like a Flamethrower unit at all. But they do breathe fire!`,
  '',
  25,
  EntityType.AirSoldier,
  MovementTypes.AirInfantry,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 50,
    radius: 4,
    vision: 3,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [
      Weapons.Flamethrower.withDamage(
        buff(
          new Map([
            ...Weapons.Flamethrower.damage,

            [EntityType.LowAltitude, 90],
            [EntityType.Ship, 70],
          ]),
          40,
        ),
      )
        .withSupply(6)
        .withAnimationPositions({
          down: sprite(-0.4, 1),
          horizontal: sprite(-0.85, -0.05),
          up: sprite(0.4, -0.85),
        }),
    ],
  },
  null,
  {
    alternative: sprite(0, 6),
    alternativeExplosionSprite: {
      frames: 8,
      position: sprite(0, 0),
    },
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-Dragon',
    portrait: {
      position: sprite(28, 0),
      variants: 3,
    },
    withNavalExplosion: true,
  },
);

export const Bear = new UnitInfo(
  UnitID.Bear,
  'Bear',
  'Bear N2',
  'female',
  `This is a Bear, and Bears tend to be huge. Usually found in forests and mountains, they are hunted for their fur and meat. But this Bear is different. It's a unit in a game. So, don't hunt it, just fight it!`,
  '',
  25,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 100,
    radius: 2,
    vision: 2,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Bite],
  },
  null,
  {
    attackStance: 'once',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-Bear',
    portrait: {
      position: sprite(45, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const Alien = new UnitInfo(
  UnitID.Alien,
  'Alien',
  'Alien O2',
  'unknown',
  `Alien units aren't really that special. They're just like any other soldier, except they come from another dimension. Rumored to possess advanced technology and abilities, and known to travel in spaceships — but other than that, they're just like any other soldier. Really.`,
  '',
  10,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 20,
    radius: 4,
    sabotageTypes: DefaultSabotageTypes,
    vision: 1,
  },
  SaboteurUnitAbilities.copy({ poison: true }),
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Bite.withDamage(buff(Weapons.Bite.damage, -70))],
  },
  null,
  {
    attackStance: 'once',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 2 },
      position: sprite(7, 1),
    },
    name: 'Units-Alien',
    portrait: {
      position: sprite(26, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const Zombie = new UnitInfo(
  UnitID.Zombie,
  'Zombie',
  'Zombie P2',
  'unknown',
  `Zombies are slow but extremely dangerous. A hit from a Zombie infects the opponent, converting them to the Zombie faction. A Zombie faction? Yes, that's right. They are a formidable faction, and they are coming for all of us.`,
  '',
  0,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 20,
    radius: 3,
    vision: 1,
  },
  ZombieUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.ZombieBite],
  },
  null,
  {
    attackStance: 'once',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 2 },
      position: sprite(7, 1),
    },
    name: 'Units-Zombie',
    portrait: {
      position: sprite(27, 0),
      variants: 3,
    },
    slow: true,
  },
);
export const Ogre = new UnitInfo(
  UnitID.Ogre,
  'Ogre',
  'Ogre Q2',
  'male',
  `Ogres are from a different world. They are huge, slow, and powerful. They are known to wield clubs and are capable of dealing massive damage to ground units.`,
  '',
  0,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 20,
    radius: 3,
    vision: 1,
  },
  DefaultUnitAbilitiesWithCapture,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Club],
  },
  null,
  {
    attackStance: 'once',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-Ogre',
    portrait: {
      position: sprite(30, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const Brute = new UnitInfo(
  UnitID.Brute,
  'Brute',
  'Brute R2',
  'male',
  `The Brute is a huge, slow-moving unit with a powerful shotgun. Its high defense and attack power make it a force to be reckoned with anywhere on the battlefield. If you see a Brute, you better have a plan to deal with it.`,
  '',
  50,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 60,
    radius: 4,
    vision: 1,
  },
  DefaultUnitAbilitiesWithCapture,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.Shotgun.withSupply(6)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 2 },
      position: sprite(7, 1),
    },
    name: 'Units-Brute',
    portrait: {
      position: sprite(33, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const Commander = new UnitInfo(
  UnitID.Commander,
  'Commander',
  'Commander S2',
  'male',
  `Armies are composed of master strategists and troops on the ground executing orders. Then there's the Commander unit, who can neither strategize nor execute effectively. They excel in scheduling unnecessary meetings and perpetuating confusion under the guise of "alignment". Equipped only with a pistol, one has to wonder: What exactly is their purpose?`,
  '',
  20,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 30,
    radius: 2,
    vision: 1,
  },
  DefaultUnitAbilitiesWithCapture.copy({ morale: true }),
  { type: AttackType.ShortRange, weapons: [Weapons.Pistol.withSupply(5)] },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 1 },
      position: sprite(7, 1),
    },
    name: 'Units-Commander',
    portrait: {
      position: sprite(32, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const Cannon = new UnitInfo(
  UnitID.Cannon,
  'Cannon',
  'Cannon T2',
  'male',
  'A prototype unit with a powerful cannon but almost no mobility. Only a limited number of these units were produced before the project was scrapped.',
  '',
  40,
  EntityType.Artillery,
  MovementTypes.Tires,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 40,
    radius: 1,
    vision: 1,
  },
  new UnitAbilities({
    accessBuildings: true,
    moveAndAct: true,
    unfold: true,
  }),
  {
    range: [2, 6],
    type: AttackType.LongRange,
    weapons: [Weapons.Cannon.withSupply(7)],
  },
  null,
  {
    name: 'Units-Cannon',
    offset: { y: 3 },
    portrait: {
      position: sprite(51, 0),
      variants: 3,
    },
    unfold: sprite(0, 4),
    unfoldSounds: {
      fold: 'Unit/CannonFold',
      unfold: 'Unit/CannonUnfold',
    },
    unfoldSprite: {
      frames: 8,
      position: sprite(0, 3),
    },
  },
);

export const SuperAPU = new UnitInfo(
  UnitID.SuperAPU,
  'Super APU',
  'Super Brute U2',
  'male',
  `The Super APU, the original version of the APU, is equipped with a powerful minigun and has higher defense compared to the regular APU. It can tear through enemy units with ease and requires a concerted effort to be taken down.`,
  '',
  30,
  EntityType.Ground,
  MovementTypes.HeavySoldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 60,
    radius: 5,
    vision: 4,
  },
  DefaultUnitAbilities,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.SuperMiniGun.withSupply(10)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-SuperAPU',
    portrait: {
      position: sprite(53, 0),
      variants: 3,
    },
  },
);

export const BazookaBear = new UnitInfo(
  UnitID.BazookaBear,
  'Bazooka Bear',
  'Bazooka V2',
  'unknown',
  `As an all-rounder, the Bazooka Bear can attack every other unit. Its low mobility is compensated by high long-range attack power. Many have asked: Why is it a bear with a bazooka? You'll have to ask the squad leader that question!`,
  '',
  10,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 100,
    radius: 3,
    vision: 2,
  },
  DefaultUnitAbilities,
  {
    range: [1, 2],
    type: AttackType.LongRange,
    weapons: [Weapons.Bazooka.withSupply(5)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    leaderAlternative: true,
    name: 'Units-BazookaBear',
    portrait: {
      position: sprite(31, 0),
      variants: 3,
    },
    slow: true,
  },
);

export const AIU = new UnitInfo(
  UnitID.AIU,
  'AIU',
  'AIU W2',
  'male',
  `The AIU, or Artificial Intelligence Unit, is a highly advanced robot — possibly sent from another universe — to wreak havoc on the battlefield. It boasts extremely strong defense and is equipped with a powerful minigun.`,
  '',
  40,
  EntityType.Soldier,
  MovementTypes.HeavySoldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 60,
    radius: 5,
    vision: 4,
  },
  DefaultUnitAbilitiesWithCapture,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.AIUMiniGun.withSupply(10)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-AIU',
    portrait: {
      position: sprite(54, 0),
      variants: 3,
    },
  },
);

export const InfernoJetpack = new UnitInfo(
  UnitID.InfernoJetpack,
  'Inferno Jetpack',
  'Inferno X2',
  'unknown',
  `Flamethrowers that can fly? Inferno Jetpacks are highly mobile and can attack all unit types. They are extremely rare, dangerous, and can only be found in the most intense battles.`,
  '',
  35,
  EntityType.AirSoldier,
  MovementTypes.AirInfantry,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 50,
    radius: 5,
    vision: 3,
  },
  DefaultUnitAbilitiesWithCapture,
  {
    type: AttackType.ShortRange,
    weapons: [Weapons.InfernoFlamethrower.withSupply(6)],
  },
  null,
  {
    attackStance: 'short',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      position: sprite(7, 1),
    },
    name: 'Units-InfernoJetpack',
    portrait: {
      position: sprite(56, 0),
      variants: 3,
    },
    withNavalExplosion: true,
  },
);

export const Scientist = new UnitInfo(
  UnitID.Scientist,
  'Scientist',
  'Scientist Y2',
  'male',
  `Much like their work, Scientist units are highly specialized. Their goal is to wear down the enemy frontlines from a safe distance. Then another unit can finish the job, and the Scientist can get back to their research.`,
  '',
  10,
  EntityType.Soldier,
  MovementTypes.Soldier,
  {
    cost: Number.POSITIVE_INFINITY,
    fuel: 30,
    radius: 3,
    vision: 2,
  },
  new UnitAbilities({
    accessBuildings: true,
    moveAndAct: true,
  }),
  {
    range: [2, 2],
    type: AttackType.LongRange,
    weapons: [Weapons.Flask.withSupply(5)],
  },
  null,
  {
    attackStance: 'once',
    directionOffset: 2,
    explosionSprite: {
      frames: 8,
      offset: { y: 3 },
      position: sprite(7, 1),
    },
    name: 'Units-Scientist',
    portrait: {
      position: sprite(55, 0),
      variants: 3,
    },
    slow: true,
  },
);

// The order of units must not be changed.
const Units = [
  Pioneer,
  Infantry,
  RocketLauncher,
  APU,
  SmallTank,
  Jeep,
  Artillery,
  Battleship,
  Helicopter,
  Humvee,
  AntiAir,
  HeavyArtillery,
  Lander,
  Sniper,
  Flamethrower,
  Saboteur,
  TransportHelicopter,
  FighterJet,
  Bomber,
  Jetpack,
  SeaPatrol,
  AcidBomber,
  DroneBomber,
  ReconDrone,
  XFighter,
  Medic,
  AmphibiousTank,
  Destroyer,
  Frigate,
  Hovercraft,
  PatrolShip,
  SupportShip,
  Corvette,
  Mammoth,
  TransportTrain,
  Dinosaur,
  HeavyTank,
  SuperTank,
  HumveeAvenger,
  ArtilleryHumvee,
  SupplyTrain,
  Truck,
  Octopus,
  Dragon,
  Bear,
  Alien,
  Zombie,
  Ogre,
  Brute,
  Commander,
  Cannon,
  SuperAPU,
  BazookaBear,
  AIU,
  InfernoJetpack,
  Scientist,
];

export const InitialPortraits = new Set([Pioneer, Sniper, Flamethrower]);

export const SpecialUnits = new Set([
  BazookaBear,
  Bear,
  Dinosaur,
  Dragon,
  Octopus,
  Ogre,
  InfernoJetpack,
]);

export const SecretUnits = new Set([Truck, ArtilleryHumvee, ReconDrone, AIU]);

export const DefaultSupplyUnits = {
  air: TransportHelicopter,
  land: Jeep,
  naval: SupportShip,
} as const;

export function getUnitInfo(id: number): UnitInfo | null {
  return Units[id - 1] || null;
}

export function getUnitInfoOrThrow(id: number): UnitInfo {
  const unit = getUnitInfo(id);
  if (!unit) {
    throw new Error(`getUnitInfoOrThrow: Could not find unit with id '${id}'.`);
  }
  return unit;
}

const units = Units.slice().sort((infoA, infoB) => {
  if (infoA.movementType.sortOrder === infoB.movementType.sortOrder) {
    return infoA.getCostFor(null) - infoB.getCostFor(null);
  }
  return infoA.movementType.sortOrder - infoB.movementType.sortOrder;
});

export function filterUnits(
  fn: (unitInfo: UnitInfo) => boolean | undefined,
): ReadonlyArray<UnitInfo> {
  return units.filter(fn);
}

export function mapUnits<T>(fn: (unitInfo: UnitInfo, index: number) => T): Array<T> {
  return units.map(fn);
}

export function mapUnitsWithContentRestriction<T>(
  fn: (unitInfo: UnitInfo, index: number) => T,
  skills: ReadonlySet<Skill>,
): Array<T> {
  return units
    .filter(
      (unit) =>
        (!SpecialUnits.has(unit) && unit.getCostFor(null) < Number.POSITIVE_INFINITY) ||
        hasUnlockedUnit(unit, skills),
    )
    .map(fn);
}

export function getAllUnits(): ReadonlyArray<UnitInfo> {
  return units;
}

export function mapMovementTypes<T>(fn: (movementType: MovementType) => T): Array<T> {
  return (Object.keys(MovementTypes) as ReadonlyArray<keyof typeof MovementTypes>).map((key) =>
    fn(MovementTypes[key]),
  );
}

export function mapWeapons<T>(fn: (weapon: Weapon) => T): Array<T> {
  return (Object.keys(Weapons) as ReadonlyArray<keyof typeof Weapons>).map((key) =>
    fn(Weapons[key]),
  );
}
