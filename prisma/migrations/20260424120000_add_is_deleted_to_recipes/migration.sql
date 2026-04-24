-- Soft delete flag for recipes
ALTER TABLE "recipes" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- Compound index to accelerate user-scoped queries that filter out deleted rows
CREATE INDEX "recipes_user_id_is_deleted_idx" ON "recipes" ("user_id", "is_deleted");
