import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

export interface ActiveAlliance {
	id: number;
	level: number;
}

export abstract class Stats {
	@Column()
	id!: number;

	@Column()
	win!: number;

	@Column()
	averageMMR!: number;

	@Column()
	round!: number;

	@Column()
	gameMode!: number;

	@CreateDateColumn()
	time!: Date;

	@Column({ type: "jsonb" })
	activeAlliances!: ActiveAlliance[];

	/**
	 * @deprecated This is only used so that typeorm doesn't complain about a missing primary key
	 *
	 * A primary key is not needed for timescaledb hypertables
	 */
	@PrimaryColumn({ select: false, insert: false, update: false })
	primaryColumn!: number;
}

@Entity()
export class UnitStats extends Stats {
	@Column()
	rank!: number;

	@Column({ nullable: true, type: "jsonb" })
	items?: number[];

	@Column({ nullable: true, type: "jsonb" })
	underlordTalent?: number[];
}

@Entity()
export class ItemStats extends Stats {}

@Entity()
export class SynergyStats extends Stats {
	@Column()
	rank?: number;
}
