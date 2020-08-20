import { MigrationInterface, QueryRunner } from "typeorm";

export class RawTwitchResponseField1597939719749 implements MigrationInterface {
	name = "RawTwitchResponseField1597939719749";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "user" ADD "twitchRaw" json');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "user" DROP COLUMN "twitchRaw"');
	}
}
