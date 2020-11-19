package vault

import (
	"fmt"
	"os"
	"sync"

	vault "github.com/hashicorp/vault/api"
	"github.com/mitchellh/mapstructure"
	"go.uber.org/zap"

	// Load env variables
	_ "github.com/joho/godotenv/autoload"
)

// Secrets - Struct for secret stored in vault
type Secrets struct {
	ClientSecret    string `mapstructure:"clientSecret"`
	DiscordWebhooks string `mapstructure:"discordWebhooks"`
}

var client *vault.Client
var once sync.Once

func init() {
	logger, _ := zap.NewProduction()
	defer logger.Sync() // flushes buffer, if any
	sugar := logger.Sugar()

	once.Do(func() {
		var err error
		client, err = vault.NewClient(vault.DefaultConfig())

		if err != nil {
			sugar.Panicw("Error while accessing vault",
				"error", err,
			)
		}
	})

}

// GetSealStatus - Get vault seal status
func GetSealStatus() (*vault.SealStatusResponse, error) {
	return client.Sys().SealStatus()
}

// GetSecrets - Fetch the necessary secrets from vault
func GetSecrets() Secrets {
	logger, _ := zap.NewProduction()
	defer logger.Sync() // flushes buffer, if any
	sugar := logger.Sugar()

	secretName := fmt.Sprintf("/secret/data%s/sentry-webhook/%s", os.Getenv("VAULT_ENVIRONMENT"), os.Getenv("WEBHOOK_ENV"))
	secret, err := client.Logical().Read(secretName)

	if err != nil {
		sugar.Panicw("Error while reading secret",
			"secretName", secretName,
			"error", err,
		)
	}

	var secrets Secrets
	if err := mapstructure.Decode(secret.Data["data"], &secrets); err != nil {
		sugar.Panicw("Error while unmarshalling secret", "err", err)
	}

	return secrets
}
