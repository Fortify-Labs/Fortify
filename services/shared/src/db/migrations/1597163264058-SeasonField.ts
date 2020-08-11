import { MigrationInterface, QueryRunner } from "typeorm";

export class SeasonField1597163264058 implements MigrationInterface {
	name = "SeasonField1597163264058";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'ALTER TABLE "match" ADD "season" character varying NOT NULL DEFAULT \'\'',
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "match" DROP COLUMN "season"');
	}
}
