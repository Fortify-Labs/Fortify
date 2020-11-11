package main

import (
	"os"

	"github.com/Fortify-Labs/Fortify/services/sentry-discord-webhook/pkg/discord"
	"github.com/Fortify-Labs/Fortify/services/sentry-discord-webhook/pkg/sentry"
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"

	_ "github.com/joho/godotenv/autoload"
)

// Version and build vars linked at compile time
var (
	Version string
	Build   string
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync() // flushes buffer, if any
	sugar := logger.Sugar()

	sugar.Infow("Starting...",
		"Version", Version,
		"Build", Build,
	)

	app := fiber.New(fiber.Config{
		DisableStartupMessage: os.Getenv("DISABLE_STARTUP_MESSAGE") != "",
	})

	app.Post("/sentry", func(c *fiber.Ctx) error {
		body := c.Body()

		if !sentry.VerifySignature(body, c.Get("Sentry-Hook-Signature")) {
			return c.SendStatus(401)
		}

		alert, err := sentry.UnmarshalIssueAlert(body)

		if err == nil {
			discord.SendMessage(&alert)
		} else {
			sugar.Errorw("An error occurred",
				"err", err.Error(),
			)
		}

		return c.SendStatus(200)
	})

	listenAddress, isSet := os.LookupEnv("LISTEN_ADDRESS")
	if !isSet {
		listenAddress = ":3000"
	}
	sugar.Fatal(app.Listen(listenAddress))
}
