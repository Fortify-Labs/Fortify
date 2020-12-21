// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse and unparse this JSON data, add this code to your project and do:
//
//    issueAlert, err := UnmarshalIssueAlert(bytes)
//    bytes, err = issueAlert.Marshal()

package sentry

import "encoding/json"

// UnmarshalIssueAlert - Unmarshal sentry issue alert from incoming webhooks
func UnmarshalIssueAlert(data []byte) (IssueAlert, error) {
	var r IssueAlert
	err := json.Unmarshal(data, &r)
	return r, err
}

// Marshal - Marshal a incoming issue alert message
func (r *IssueAlert) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

// IssueAlert - Incoming webhook message from sentry
type IssueAlert struct {
	Action *string `json:"action,omitempty"`
	// Actor        *Actor          `json:"actor,omitempty"`
	Data         *IssueAlertData `json:"data,omitempty"`
	Installation *Installation   `json:"installation,omitempty"`
}

// // Actor - Sentry actor causing the message
// type Actor struct {
// 	ID   *int64  `json:"id,omitempty"`
// 	Name *string `json:"name,omitempty"`
// 	Type *string `json:"type,omitempty"`
// }

// IssueAlertData - Sentry alert data & information
type IssueAlertData struct {
	Event         *Event  `json:"event,omitempty"`
	TriggeredRule *string `json:"triggered_rule,omitempty"`
}

// Event - Sentry alerted event
type Event struct {
	Ref            *int64          `json:"_ref,omitempty"`
	RefVersion     *int64          `json:"_ref_version,omitempty"`
	Contexts       *Contexts       `json:"contexts,omitempty"`
	Culprit        *string         `json:"culprit,omitempty"`
	Datetime       *string         `json:"datetime,omitempty"`
	Dist           interface{}     `json:"dist"`
	EventID        *string         `json:"event_id,omitempty"`
	Exception      *Exception      `json:"exception,omitempty"`
	Fingerprint    []string        `json:"fingerprint,omitempty"`
	GroupingConfig *GroupingConfig `json:"grouping_config,omitempty"`
	Hashes         []string        `json:"hashes,omitempty"`
	IssueURL       *string         `json:"issue_url,omitempty"`
	KeyID          *string         `json:"key_id,omitempty"`
	Level          *string         `json:"level,omitempty"`
	Location       *string         `json:"location,omitempty"`
	Logger         *string         `json:"logger,omitempty"`
	Message        *string         `json:"message,omitempty"`
	Metadata       *Metadata       `json:"metadata,omitempty"`
	Platform       *string         `json:"platform,omitempty"`
	Project        *int64          `json:"project,omitempty"`
	Received       *float64        `json:"received,omitempty"`
	Release        interface{}     `json:"release"`
	Request        *Request        `json:"request,omitempty"`
	SDK            *SDK            `json:"sdk,omitempty"`
	Tags           [][]string      `json:"tags,omitempty"`
	TimeSpent      interface{}     `json:"time_spent"`
	Timestamp      *float64        `json:"timestamp,omitempty"`
	Title          *string         `json:"title,omitempty"`
	Type           *string         `json:"type,omitempty"`
	URL            *string         `json:"url,omitempty"`
	User           *User           `json:"user,omitempty"`
	Version        *string         `json:"version,omitempty"`
	WebURL         *string         `json:"web_url,omitempty"`
}

// Contexts - Event contexts
type Contexts struct{}

// Exception - Exception that occurred
type Exception struct {
	Values []Value `json:"values,omitempty"`
}

// Value - Exception information
type Value struct {
	Mechanism  *Mechanism  `json:"mechanism,omitempty"`
	Stacktrace *Stacktrace `json:"stacktrace,omitempty"`
	Type       *string     `json:"type,omitempty"`
	Value      *string     `json:"value,omitempty"`
}

// Mechanism -
type Mechanism struct {
	Data        *MechanismData `json:"data,omitempty"`
	Description interface{}    `json:"description"`
	Handled     *bool          `json:"handled,omitempty"`
	HelpLink    interface{}    `json:"help_link"`
	Meta        interface{}    `json:"meta"`
	Synthetic   interface{}    `json:"synthetic"`
	Type        *string        `json:"type,omitempty"`
}

// MechanismData -
type MechanismData struct {
	Message *string `json:"message,omitempty"`
	Mode    *string `json:"mode,omitempty"`
	Name    *string `json:"name,omitempty"`
}

// Stacktrace -
type Stacktrace struct {
	Frames []Frame `json:"frames,omitempty"`
}

// Frame -
type Frame struct {
	AbsPath         *string     `json:"abs_path,omitempty"`
	Colno           *int64      `json:"colno,omitempty"`
	ContextLine     *string     `json:"context_line"`
	Data            *FrameData  `json:"data,omitempty"`
	Errors          interface{} `json:"errors"`
	Filename        *string     `json:"filename,omitempty"`
	Function        interface{} `json:"function"`
	ImageAddr       interface{} `json:"image_addr"`
	InApp           *bool       `json:"in_app,omitempty"`
	InstructionAddr interface{} `json:"instruction_addr"`
	Lineno          *int64      `json:"lineno,omitempty"`
	Module          *string     `json:"module"`
	Package         interface{} `json:"package"`
	Platform        interface{} `json:"platform"`
	PostContext     interface{} `json:"post_context"`
	PreContext      interface{} `json:"pre_context"`
	RawFunction     interface{} `json:"raw_function"`
	Symbol          interface{} `json:"symbol"`
	SymbolAddr      interface{} `json:"symbol_addr"`
	Trust           interface{} `json:"trust"`
	Vars            interface{} `json:"vars"`
}

// FrameData -
type FrameData struct {
	OrigInApp *int64 `json:"orig_in_app,omitempty"`
}

// GroupingConfig -
type GroupingConfig struct {
	Enhancements *string `json:"enhancements,omitempty"`
	ID           *string `json:"id,omitempty"`
}

// Metadata -
type Metadata struct {
	Filename *string `json:"filename,omitempty"`
	Type     *string `json:"type,omitempty"`
	Value    *string `json:"value,omitempty"`
}

// Request -
type Request struct {
	Cookies             interface{}   `json:"cookies"`
	Data                interface{}   `json:"data"`
	Env                 interface{}   `json:"env"`
	Fragment            interface{}   `json:"fragment"`
	Headers             [][]string    `json:"headers,omitempty"`
	InferredContentType interface{}   `json:"inferred_content_type"`
	Method              interface{}   `json:"method"`
	QueryString         []interface{} `json:"query_string,omitempty"`
	URL                 *string       `json:"url,omitempty"`
}

// SDK -
type SDK struct {
	Integrations []string  `json:"integrations,omitempty"`
	Name         *string   `json:"name,omitempty"`
	Packages     []Package `json:"packages,omitempty"`
	Version      *string   `json:"version,omitempty"`
}

// Package -
type Package struct {
	Name    *string `json:"name,omitempty"`
	Version *string `json:"version,omitempty"`
}

// User -
type User struct {
	IPAddress *string `json:"ip_address,omitempty"`
}

// Installation -
type Installation struct {
	UUID *string `json:"uuid,omitempty"`
}

// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse and unparse this JSON data, add this code to your project and do:
//
//    metricAlert, err := UnmarshalMetricAlert(bytes)
//    bytes, err = metricAlert.Marshal()

// UnmarshalMetricAlert - Unmarshal a metric alert
func UnmarshalMetricAlert(data []byte) (MetricAlert, error) {
	var r MetricAlert
	err := json.Unmarshal(data, &r)
	return r, err
}

// Marshal - Marshal a metric alert
func (r *MetricAlert) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

// MetricAlert - Sentry metric alert
type MetricAlert struct {
	Action *string `json:"action,omitempty"`
	// Actor        *Actor        `json:"actor,omitempty"`
	Data         *Data         `json:"data,omitempty"`
	Installation *Installation `json:"installation,omitempty"`
}

// Data - Alert data
type Data struct {
	DescriptionText  *string           `json:"description_text,omitempty"`
	DescriptionTitle *string           `json:"description_title,omitempty"`
	MetricAlert      *MetricAlertClass `json:"metric_alert,omitempty"`
	WebURL           *string           `json:"web_url,omitempty"`
}

// MetricAlertClass - A metric alert class
type MetricAlertClass struct {
	AlertRule      *AlertRule  `json:"alert_rule,omitempty"`
	DateClosed     interface{} `json:"date_closed"`
	DateCreated    *string     `json:"date_created,omitempty"`
	DateDetected   *string     `json:"date_detected,omitempty"`
	DateStarted    *string     `json:"date_started,omitempty"`
	ID             *string     `json:"id,omitempty"`
	Identifier     *string     `json:"identifier,omitempty"`
	OrganizationID *string     `json:"organization_id,omitempty"`
	Projects       []string    `json:"projects,omitempty"`
	Status         *int64      `json:"status,omitempty"`
	StatusMethod   *int64      `json:"status_method,omitempty"`
	Title          *string     `json:"title,omitempty"`
	Type           *int64      `json:"type,omitempty"`
}

// AlertRule - A sentry alert rule
type AlertRule struct {
	Aggregate          *string       `json:"aggregate,omitempty"`
	CreatedBy          interface{}   `json:"created_by"`
	Dataset            *string       `json:"dataset,omitempty"`
	DateCreated        *string       `json:"date_created,omitempty"`
	DateModified       *string       `json:"date_modified,omitempty"`
	Environment        interface{}   `json:"environment"`
	ID                 *string       `json:"id,omitempty"`
	IncludeAllProjects *bool         `json:"include_all_projects,omitempty"`
	Name               *string       `json:"name,omitempty"`
	OrganizationID     *string       `json:"organization_id,omitempty"`
	Projects           []string      `json:"projects,omitempty"`
	Query              *string       `json:"query,omitempty"`
	Resolution         *int64        `json:"resolution,omitempty"`
	ResolveThreshold   interface{}   `json:"resolve_threshold"`
	Status             *int64        `json:"status,omitempty"`
	ThresholdPeriod    *int64        `json:"threshold_period,omitempty"`
	ThresholdType      *int64        `json:"threshold_type,omitempty"`
	TimeWindow         *int64        `json:"time_window,omitempty"`
	Triggers           []interface{} `json:"triggers,omitempty"`
}
