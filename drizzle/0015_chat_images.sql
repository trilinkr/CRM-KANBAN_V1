CREATE TABLE "chat_images" (
  "message_id" uuid PRIMARY KEY NOT NULL REFERENCES "chat_messages"("id") ON DELETE CASCADE,
  "data" bytea NOT NULL,
  "size" integer NOT NULL CHECK ("size" > 0 AND "size" <= 358400 AND "size" = octet_length("data")),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
