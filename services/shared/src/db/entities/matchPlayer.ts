import { Entity, PrimaryColumn, OneToMany } from "typeorm";
import { MatchSlot } from "./matchSlot";

// This entity will be used for players that do not have a fortify account
@Entity()
export class MatchPlayer {
	@PrimaryColumn()
	steamid!: string;

	@OneToMany(() => MatchSlot, (slot) => slot.matchPlayer)
	matchSlots!: MatchSlot[];
}
