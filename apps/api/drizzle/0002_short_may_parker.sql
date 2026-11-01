CREATE INDEX "session_userId_index" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_expiresAt_index" ON "session" USING btree ("expiresAt");