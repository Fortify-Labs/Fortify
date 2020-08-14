import { Entity, PrimaryColumn, OneToMany, Column } from "typeorm";
import { MatchSlot } from "./matchSlot";

// This entity will be used for players that do not have a fortify account
@Entity()
export class MatchPlayer {
	// --- ID ---
	@PrimaryColumn()
	steamid!: string;

	// --- Properties ---
	@Column({ default: "" })
	name!: string;

	@Column({
		nullable: true,
	})
	rankTier?: number;

	// --- Relations ---
	@OneToMany(() => MatchSlot, (slot) => slot.matchPlayer)
	matchSlots!: MatchSlot[];
}
