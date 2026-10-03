ALTER TABLE "orders" ALTER COLUMN "recipient_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "phone" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "address_line" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "city" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "state" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "country" DROP NOT NULL;