package main

import (
	"net/http"
	"os"
	"time"

	"github.com/Fortify-Labs/Fortify/services/sentry-discord-webhook/internal/vault"
	"github.com/Fortify-Labs/Fortify/services/sentry-discord-webhook/pkg/discord"
	"github.com/Fortify-Labs/Fortify/services/sentry-discord-webhook/pkg/sentry"
	"github.com/gofiber/fiber/v2"
	"github.com/heptiolabs/healthcheck"
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

	seal, err := vault.GetSealStatus()
	if err != nil {
		sugar.Panicw("Error while fetching vault seal status", "err", err)
	}
	sugar.Infow("Vault connected", "seal.ClusterName", seal.ClusterName, "seal.Version", seal.Version)
	// Fetch secrets to validate that the connection works before going idle
	vault.GetSecrets()

	// Health checks
	health := healthcheck.NewHandler()
	upstreamHost := "discord.com"
	health.AddReadinessCheck(
		"upstream-dep-dns",
		healthcheck.DNSResolveCheck(upstreamHost, 50*time.Millisecond))
	// Add a liveness check to detect Goroutine leaks. If this fails we want
	// to be restarted/rescheduled.
	health.AddLivenessCheck("goroutine-threshold", healthcheck.GoroutineCountCheck(100))
	// Listen on port 9000, as all other services
	go http.ListenAndServe("0.0.0.0:9000", health)

	// Application rest endpoints
	app := fiber.New(fiber.Config{
		DisableStartupMessage: os.Getenv("DISABLE_STARTUP_MESSAGE") != "",
	})

	app.Post("/sentry", func(c *fiber.Ctx) error {
		body := c.Body()

		defer func() {
			if r := recover(); r != nil {
				sugar.Errorw("Could not handle ", "body", string(body), "r", r)
			}
		}()

		if !sentry.VerifySignature(body, c.Get("Sentry-Hook-Signature")) {
			return c.SendStatus(401)
		}

		issueAlert, err := sentry.UnmarshalIssueAlert(body)

		if err == nil {
			discord.SendMessage(&issueAlert)
		}

		metricAlert, err := sentry.UnmarshalMetricAlert(body)

		if err == nil {
			discord.SendMetricAlertMessage(&metricAlert)
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
