import { MigrationInterface, QueryRunner } from "typeorm";

export class TwitchLive1614860512074 implements MigrationInterface {
	name = "TwitchLive1614860512074";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "user" ADD "twitchLive" boolean');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "user" DROP COLUMN "twitchLive"');
	}
}
