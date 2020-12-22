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

	if alert.Data.TriggeredRule == nil || alert.Data.Event == nil {
		sugar.Infow("TriggeredRule or Event is nil", "alert", alert)
		return
	}

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

// SendMetricAlertMessage - Send metric alert message to discord
func SendMetricAlertMessage(alert *sentry.MetricAlert) {
	logger, _ := zap.NewProduction()
	defer logger.Sync() // flushes buffer, if any
	sugar := logger.Sugar()

	if alert.Data == nil ||
		alert.Data.MetricAlert == nil ||
		alert.Data.MetricAlert.Title == nil ||
		alert.Data.WebURL == nil ||
		alert.Data.DescriptionTitle == nil {

		sugar.Infow("Data, MetricAlert, WebURL or DescriptionTitle is nil", "alert", alert)
		return
	}

	webhook := Webhook{
		Username:  "Fortify Monitoring",
		AvatarURL: "https://fortify.gg/favicon.ico",
		Embeds: []Embed{
			{
				Title:       *alert.Data.MetricAlert.Title,
				URL:         *alert.Data.WebURL,
				Description: *alert.Data.DescriptionTitle,
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
