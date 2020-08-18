import { MigrationInterface, QueryRunner } from "typeorm";

export class UserDateFields1597712596401 implements MigrationInterface {
	name = "UserDateFields1597712596401";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			'ALTER TABLE "user" ADD "created" TIMESTAMP NOT NULL DEFAULT now()',
		);
		await queryRunner.query(
			'ALTER TABLE "user" ADD "updated" TIMESTAMP NOT NULL DEFAULT now()',
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('ALTER TABLE "user" DROP COLUMN "updated"');
		await queryRunner.query('ALTER TABLE "user" DROP COLUMN "created"');
	}
}
