import { LeaderboardTypeNumbersEnum } from "../../definitions/leaderboard";
import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryColumn,
} from "typeorm";
import { User } from "./user";

@Entity()
export class MmrStats {
	/**
	 * Auto-generated date
	 */
	@CreateDateColumn()
	time!: Date;

	@Column()
	mmr!: number;

	@Column()
	rank!: number;

	@ManyToOne(() => User, (user) => user.mmrStats, {
		nullable: true,
		cascade: true,
	})
	user!: User;

	@Column()
	type!: LeaderboardTypeNumbersEnum;

	/**
	 * @deprecated This is only used so that typeorm doesn't complain about a missing primary key
	 *
	 * A primary key is not needed for timescaledb hypertables
	 */
	@PrimaryColumn({ insert: false, select: false, update: false })
	primaryColumn!: number;
}
