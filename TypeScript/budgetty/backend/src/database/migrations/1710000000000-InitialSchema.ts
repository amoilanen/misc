import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1710000000000 implements MigrationInterface {
    name = 'InitialSchema1710000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "email" character varying NOT NULL,
            "password" character varying,
            "firstName" character varying,
            "lastName" character varying,
            "googleId" character varying,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
            CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE TABLE "categories" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying NOT NULL,
            "type" character varying NOT NULL,
            "userId" uuid,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_24d0f151763b9f70c56a5853a0b" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE TABLE "transactions" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "amount" numeric NOT NULL,
            "type" character varying NOT NULL,
            "description" character varying,
            "date" TIMESTAMP NOT NULL,
            "userId" uuid NOT NULL,
            "categoryId" uuid,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_a219afd8eef124f68c95aff26d4" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_2296b7fe127d45aaeb7043d21e0" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_6bb58f12ea6e2e1d5a4c8c5c6c6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_6bb58f12ea6e2e1d5a4c8c5c6c7" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_6bb58f12ea6e2e1d5a4c8c5c6c7"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_6bb58f12ea6e2e1d5a4c8c5c6c6"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_2296b7fe127d45aaeb7043d21e0"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
} 