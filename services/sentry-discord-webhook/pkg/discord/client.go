package discord

import (
	"bytes"
	"net/http"
	"strings"

	"github.com/Fortify-Labs/Fortify/services/sentry-discord-webhook/internal/vault"
	"github.com/Fortify-Labs/Fortify/services/sentry-discord-webhook/pkg/sentry"
	"go.uber.org/zap"
)

// SendMessage - Send issue alert message to discord
func SendMessage(alert *sentry.IssueAlert) {
	logger, _ := zap.NewProduction()
	defer logger.Sync() // flushes buffer, if any
	sugar := logger.Sugar()

	webhook := Webhook{
		Username:  "Fortify Monitoring",
		AvatarURL: "https://fortify.gg/favicon.ico",
		Embeds: []Embed{
			{
				Title:       *alert.Data.TriggeredRule,
				URL:         *alert.Data.Event.WebURL,
				Description: *alert.Data.Event.Title,
				Color:       16727058,
			},
		},
	}

	jsonStr, err := webhook.Marshal()
	if err != nil {
		sugar.Errorw("An error occurred while marshaling webhook request body",
			"err", err.Error(),
		)
		return
	}

	secrets := vault.GetSecrets()
	webhooks := strings.Split(secrets.DiscordWebhooks, ";")

	client := &http.Client{}
	for _, url := range webhooks {
		res, err := client.Post(url, "application/json", bytes.NewBuffer((jsonStr)))

		if err != nil {
			panic(err)
		}
		defer res.Body.Close()

		if res.StatusCode >= 200 && res.StatusCode < 300 {
			sugar.Infow("Successfully executed webhook")
		}
	}
}
