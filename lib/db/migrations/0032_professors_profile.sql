CREATE TABLE IF NOT EXISTS "ProfessorsProfile" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text REFERENCES "user"("id") ON DELETE CASCADE,
  "anonymousSessionId" text,
  "institutionId" text NOT NULL,
  "storeName" text NOT NULL,
  "markdown" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ProfessorsProfile_user_inst_idx"
  ON "ProfessorsProfile" ("userId", "anonymousSessionId", "institutionId");
