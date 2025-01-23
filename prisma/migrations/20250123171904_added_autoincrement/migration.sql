-- AlterTable
CREATE SEQUENCE space_id_seq;
ALTER TABLE "Space" ALTER COLUMN "id" SET DEFAULT nextval('space_id_seq');
ALTER SEQUENCE space_id_seq OWNED BY "Space"."id";
