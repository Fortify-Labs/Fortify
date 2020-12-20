import { MigrationInterface, QueryRunner } from "typeorm";

export class SmurfDetection1608493463023 implements MigrationInterface {
	name = "SmurfDetection1608493463023";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'ALTER TABLE "user" ADD "mainAccountSteamid" character varying',
		);
		await queryRunner.query(
			'ALTER TABLE "user" ADD CONSTRAINT "FK_a38c5af3a2142f1e05135778af5" FOREIGN KEY ("mainAccountSteamid") REFERENCES "user"("steamid") ON DELETE NO ACTION ON UPDATE NO ACTION',
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'ALTER TABLE "user" DROP CONSTRAINT "FK_a38c5af3a2142f1e05135778af5"',
		);
		await queryRunner.query(
			'ALTER TABLE "user" DROP COLUMN "mainAccountSteamid"',
		);
	}
}
