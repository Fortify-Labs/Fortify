package sentry

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"os"

	"go.uber.org/zap"
)

// VerifySignature - Verify the authenticity of the request originating sentry
func VerifySignature(message []byte, messageMAC string) bool {
	mac := hmac.New(sha256.New, []byte(os.Getenv("SENTRY_CLIENT_SECRET")))
	mac.Write(message)
	expectedMAC := mac.Sum(nil)

	decodedMessageMAC, err := hex.DecodeString(messageMAC)

	logger, _ := zap.NewProduction()
	defer logger.Sync() // flushes buffer, if any
	sugar := logger.Sugar()

	if err != nil {
		sugar.Errorw("Error while decoding message mac string",
			"decodedMessageMAC", decodedMessageMAC,
		)
		return false
	}

	return hmac.Equal(decodedMessageMAC, expectedMAC)
}
