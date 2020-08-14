import { MigrationInterface, QueryRunner } from "typeorm";

export class MatchPlayerName1597425777159 implements MigrationInterface {
	name = "MatchPlayerName1597425777159";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'ALTER TABLE "match_player" ADD "name" character varying NOT NULL DEFAULT \'\'',
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'ALTER TABLE "match_player" DROP COLUMN "name"',
		);
	}
}
