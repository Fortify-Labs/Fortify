package sentry

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"

	"github.com/Fortify-Labs/Fortify/services/sentry-discord-webhook/internal/vault"
	"go.uber.org/zap"
)

// VerifySignature - Verify the authenticity of the request originating sentry
func VerifySignature(message []byte, messageMAC string) bool {
	logger, _ := zap.NewProduction()
	defer logger.Sync() // flushes buffer, if any
	sugar := logger.Sugar()

	secrets := vault.GetSecrets()

	mac := hmac.New(sha256.New, []byte(secrets.ClientSecret))
	mac.Write(message)
	expectedMAC := mac.Sum(nil)

	decodedMessageMAC, err := hex.DecodeString(messageMAC)

	if err != nil {
		sugar.Errorw("Error while decoding message mac string",
			"decodedMessageMAC", decodedMessageMAC,
		)
		return false
	}

	return hmac.Equal(decodedMessageMAC, expectedMAC)
}
