// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse and unparse this JSON data, add this code to your project and do:
//
//    webhook, err := UnmarshalWebhook(bytes)
//    bytes, err = webhook.Marshal()

package discord

import "encoding/json"

// UnmarshalWebhook - Unmarshal to a discord webhook
func UnmarshalWebhook(data []byte) (Webhook, error) {
	var r Webhook
	err := json.Unmarshal(data, &r)
	return r, err
}

// Marshal - Marshal to a byte representation
func (r *Webhook) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

// Webhook - Discord Webhook structure
type Webhook struct {
	Username  string  `json:"username"`
	AvatarURL string  `json:"avatar_url"`
	Content   string  `json:"content"`
	Embeds    []Embed `json:"embeds"`
}

// Embed - Discord embed message structure
type Embed struct {
	Author      Author  `json:"author"`
	Title       string  `json:"title"`
	URL         string  `json:"url"`
	Description string  `json:"description"`
	Color       int64   `json:"color"`
	Fields      []Field `json:"fields"`
	Thumbnail   Image   `json:"thumbnail"`
	Image       Image   `json:"image"`
	Footer      Footer  `json:"footer"`
}

// Author - Discord embedded message author structure
type Author struct {
	Name    string `json:"name"`
	URL     string `json:"url"`
	IconURL string `json:"icon_url"`
}

// Field - Discord embedded message field structure
type Field struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Inline *bool  `json:"inline,omitempty"`
}

// Footer - Discord embedded message footer structure
type Footer struct {
	Text    string `json:"text"`
	IconURL string `json:"icon_url"`
}

// Image - Discord embedded message image structure
type Image struct {
	URL string `json:"url"`
}
