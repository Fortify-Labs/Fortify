// generated by cdk8s
import { ApiObject } from 'cdk8s';
import { Construct } from 'constructs';

/**
 * 
 *
 * @schema VirtualService
 */
export class VirtualService extends ApiObject {
  /**
   * Defines a "VirtualService" API object
   * @param scope the scope in which to define this object
   * @param name a scope-local name for the object
   * @param options configuration options
   */
  public constructor(scope: Construct, name: string, options: VirtualServiceOptions = {}) {
    super(scope, name, {
      ...options,
      kind: 'VirtualService',
      apiVersion: 'networking.istio.io/v1alpha3',
    });
  }
}

/**
 * @schema VirtualService
 */
export interface VirtualServiceOptions {
  /**
   * Configuration affecting label/content routing, sni routing, etc. See more details at: https://istio.io/docs/reference/config/networking/virtual-service.html
   *
   * @schema VirtualService#spec
   */
  readonly spec?: VirtualServiceSpec;

}

/**
 * Configuration affecting label/content routing, sni routing, etc. See more details at: https://istio.io/docs/reference/config/networking/virtual-service.html
 *
 * @schema VirtualServiceSpec
 */
export interface VirtualServiceSpec {
  /**
   * A list of namespaces to which this virtual service is exported.
   *
   * @schema VirtualServiceSpec#exportTo
   */
  readonly exportTo?: string[];

  /**
   * The names of gateways and sidecars that should apply these routes.
   *
   * @schema VirtualServiceSpec#gateways
   */
  readonly gateways?: string[];

  /**
   * The destination hosts to which traffic is being sent.
   *
   * @schema VirtualServiceSpec#hosts
   */
  readonly hosts?: string[];

  /**
   * An ordered list of route rules for HTTP traffic.
   *
   * @schema VirtualServiceSpec#http
   */
  readonly http?: VirtualServiceSpecHttp[];

  /**
   * An ordered list of route rules for opaque TCP traffic.
   *
   * @schema VirtualServiceSpec#tcp
   */
  readonly tcp?: VirtualServiceSpecTcp[];

  /**
   * @schema VirtualServiceSpec#tls
   */
  readonly tls?: VirtualServiceSpecTls[];

}

/**
 * @schema VirtualServiceSpecHttp
 */
export interface VirtualServiceSpecHttp {
  /**
   * Cross-Origin Resource Sharing policy (CORS).
   *
   * @schema VirtualServiceSpecHttp#corsPolicy
   */
  readonly corsPolicy?: VirtualServiceSpecHttpCorsPolicy;

  /**
   * @schema VirtualServiceSpecHttp#delegate
   */
  readonly delegate?: VirtualServiceSpecHttpDelegate;

  /**
   * Fault injection policy to apply on HTTP traffic at the client side.
   *
   * @schema VirtualServiceSpecHttp#fault
   */
  readonly fault?: VirtualServiceSpecHttpFault;

  /**
   * @schema VirtualServiceSpecHttp#headers
   */
  readonly headers?: VirtualServiceSpecHttpHeaders;

  /**
   * @schema VirtualServiceSpecHttp#match
   */
  readonly match?: VirtualServiceSpecHttpMatch[];

  /**
   * @schema VirtualServiceSpecHttp#mirror
   */
  readonly mirror?: VirtualServiceSpecHttpMirror;

  /**
   * Percentage of the traffic to be mirrored by the `mirror` field.
   *
   * @schema VirtualServiceSpecHttp#mirrorPercent
   */
  readonly mirrorPercent?: number;

  /**
   * Percentage of the traffic to be mirrored by the `mirror` field.
   *
   * @schema VirtualServiceSpecHttp#mirrorPercentage
   */
  readonly mirrorPercentage?: VirtualServiceSpecHttpMirrorPercentage;

  /**
   * The name assigned to the route for debugging purposes.
   *
   * @schema VirtualServiceSpecHttp#name
   */
  readonly name?: string;

  /**
   * A HTTP rule can either redirect or forward (default) traffic.
   *
   * @schema VirtualServiceSpecHttp#redirect
   */
  readonly redirect?: VirtualServiceSpecHttpRedirect;

  /**
   * Retry policy for HTTP requests.
   *
   * @schema VirtualServiceSpecHttp#retries
   */
  readonly retries?: VirtualServiceSpecHttpRetries;

  /**
   * Rewrite HTTP URIs and Authority headers.
   *
   * @schema VirtualServiceSpecHttp#rewrite
   */
  readonly rewrite?: VirtualServiceSpecHttpRewrite;

  /**
   * A HTTP rule can either redirect or forward (default) traffic.
   *
   * @schema VirtualServiceSpecHttp#route
   */
  readonly route?: VirtualServiceSpecHttpRoute[];

  /**
   * Timeout for HTTP requests.
   *
   * @schema VirtualServiceSpecHttp#timeout
   */
  readonly timeout?: string;

}

/**
 * @schema VirtualServiceSpecTcp
 */
export interface VirtualServiceSpecTcp {
  /**
   * @schema VirtualServiceSpecTcp#match
   */
  readonly match?: VirtualServiceSpecTcpMatch[];

  /**
   * The destination to which the connection should be forwarded to.
   *
   * @schema VirtualServiceSpecTcp#route
   */
  readonly route?: VirtualServiceSpecTcpRoute[];

}

/**
 * @schema VirtualServiceSpecTls
 */
export interface VirtualServiceSpecTls {
  /**
   * @schema VirtualServiceSpecTls#match
   */
  readonly match?: VirtualServiceSpecTlsMatch[];

  /**
   * The destination to which the connection should be forwarded to.
   *
   * @schema VirtualServiceSpecTls#route
   */
  readonly route?: VirtualServiceSpecTlsRoute[];

}

/**
 * Cross-Origin Resource Sharing policy (CORS).
 *
 * @schema VirtualServiceSpecHttpCorsPolicy
 */
export interface VirtualServiceSpecHttpCorsPolicy {
  /**
   * @schema VirtualServiceSpecHttpCorsPolicy#allowCredentials
   */
  readonly allowCredentials?: boolean;

  /**
   * @schema VirtualServiceSpecHttpCorsPolicy#allowHeaders
   */
  readonly allowHeaders?: string[];

  /**
   * List of HTTP methods allowed to access the resource.
   *
   * @schema VirtualServiceSpecHttpCorsPolicy#allowMethods
   */
  readonly allowMethods?: string[];

  /**
   * The list of origins that are allowed to perform CORS requests.
   *
   * @schema VirtualServiceSpecHttpCorsPolicy#allowOrigin
   */
  readonly allowOrigin?: string[];

  /**
   * String patterns that match allowed origins.
   *
   * @schema VirtualServiceSpecHttpCorsPolicy#allowOrigins
   */
  readonly allowOrigins?: VirtualServiceSpecHttpCorsPolicyAllowOrigins[];

  /**
   * @schema VirtualServiceSpecHttpCorsPolicy#exposeHeaders
   */
  readonly exposeHeaders?: string[];

  /**
   * @schema VirtualServiceSpecHttpCorsPolicy#maxAge
   */
  readonly maxAge?: string;

}

/**
 * @schema VirtualServiceSpecHttpDelegate
 */
export interface VirtualServiceSpecHttpDelegate {
  /**
   * Name specifies the name of the delegate VirtualService.
   *
   * @schema VirtualServiceSpecHttpDelegate#name
   */
  readonly name?: string;

  /**
   * Namespace specifies the namespace where the delegate VirtualService resides.
   *
   * @schema VirtualServiceSpecHttpDelegate#namespace
   */
  readonly namespace?: string;

}

/**
 * Fault injection policy to apply on HTTP traffic at the client side.
 *
 * @schema VirtualServiceSpecHttpFault
 */
export interface VirtualServiceSpecHttpFault {
  /**
   * @schema VirtualServiceSpecHttpFault#abort
   */
  readonly abort?: VirtualServiceSpecHttpFaultAbort;

  /**
   * @schema VirtualServiceSpecHttpFault#delay
   */
  readonly delay?: VirtualServiceSpecHttpFaultDelay;

}

/**
 * @schema VirtualServiceSpecHttpHeaders
 */
export interface VirtualServiceSpecHttpHeaders {
  /**
   * @schema VirtualServiceSpecHttpHeaders#request
   */
  readonly request?: VirtualServiceSpecHttpHeadersRequest;

  /**
   * @schema VirtualServiceSpecHttpHeaders#response
   */
  readonly response?: VirtualServiceSpecHttpHeadersResponse;

}

/**
 * @schema VirtualServiceSpecHttpMatch
 */
export interface VirtualServiceSpecHttpMatch {
  /**
   * @schema VirtualServiceSpecHttpMatch#authority
   */
  readonly authority?: VirtualServiceSpecHttpMatchAuthority;

  /**
   * Names of gateways where the rule should be applied.
   *
   * @schema VirtualServiceSpecHttpMatch#gateways
   */
  readonly gateways?: string[];

  /**
   * @schema VirtualServiceSpecHttpMatch#headers
   */
  readonly headers?: { [key: string]: VirtualServiceSpecHttpMatchHeaders };

  /**
   * Flag to specify whether the URI matching should be case-insensitive.
   *
   * @schema VirtualServiceSpecHttpMatch#ignoreUriCase
   */
  readonly ignoreUriCase?: boolean;

  /**
   * @schema VirtualServiceSpecHttpMatch#method
   */
  readonly method?: VirtualServiceSpecHttpMatchMethod;

  /**
   * The name assigned to a match.
   *
   * @schema VirtualServiceSpecHttpMatch#name
   */
  readonly name?: string;

  /**
   * Specifies the ports on the host that is being addressed.
   *
   * @schema VirtualServiceSpecHttpMatch#port
   */
  readonly port?: number;

  /**
   * Query parameters for matching.
   *
   * @schema VirtualServiceSpecHttpMatch#queryParams
   */
  readonly queryParams?: { [key: string]: VirtualServiceSpecHttpMatchQueryParams };

  /**
   * @schema VirtualServiceSpecHttpMatch#scheme
   */
  readonly scheme?: VirtualServiceSpecHttpMatchScheme;

  /**
   * @schema VirtualServiceSpecHttpMatch#sourceLabels
   */
  readonly sourceLabels?: { [key: string]: string };

  /**
   * Source namespace constraining the applicability of a rule to workloads in that namespace.
   *
   * @schema VirtualServiceSpecHttpMatch#sourceNamespace
   */
  readonly sourceNamespace?: string;

  /**
   * @schema VirtualServiceSpecHttpMatch#uri
   */
  readonly uri?: VirtualServiceSpecHttpMatchUri;

  /**
   * withoutHeader has the same syntax with the header, but has opposite meaning.
   *
   * @schema VirtualServiceSpecHttpMatch#withoutHeaders
   */
  readonly withoutHeaders?: { [key: string]: VirtualServiceSpecHttpMatchWithoutHeaders };

}

/**
 * @schema VirtualServiceSpecHttpMirror
 */
export interface VirtualServiceSpecHttpMirror {
  /**
   * The name of a service from the service registry.
   *
   * @schema VirtualServiceSpecHttpMirror#host
   */
  readonly host?: string;

  /**
   * Specifies the port on the host that is being addressed.
   *
   * @schema VirtualServiceSpecHttpMirror#port
   */
  readonly port?: VirtualServiceSpecHttpMirrorPort;

  /**
   * The name of a subset within the service.
   *
   * @schema VirtualServiceSpecHttpMirror#subset
   */
  readonly subset?: string;

}

/**
 * Percentage of the traffic to be mirrored by the `mirror` field.
 *
 * @schema VirtualServiceSpecHttpMirrorPercentage
 */
export interface VirtualServiceSpecHttpMirrorPercentage {
  /**
   * @schema VirtualServiceSpecHttpMirrorPercentage#value
   */
  readonly value?: number;

}

/**
 * A HTTP rule can either redirect or forward (default) traffic.
 *
 * @schema VirtualServiceSpecHttpRedirect
 */
export interface VirtualServiceSpecHttpRedirect {
  /**
   * @schema VirtualServiceSpecHttpRedirect#authority
   */
  readonly authority?: string;

  /**
   * @schema VirtualServiceSpecHttpRedirect#redirectCode
   */
  readonly redirectCode?: number;

  /**
   * @schema VirtualServiceSpecHttpRedirect#uri
   */
  readonly uri?: string;

}

/**
 * Retry policy for HTTP requests.
 *
 * @schema VirtualServiceSpecHttpRetries
 */
export interface VirtualServiceSpecHttpRetries {
  /**
   * Number of retries for a given request.
   *
   * @schema VirtualServiceSpecHttpRetries#attempts
   */
  readonly attempts?: number;

  /**
   * Timeout per retry attempt for a given request.
   *
   * @schema VirtualServiceSpecHttpRetries#perTryTimeout
   */
  readonly perTryTimeout?: string;

  /**
   * Specifies the conditions under which retry takes place.
   *
   * @schema VirtualServiceSpecHttpRetries#retryOn
   */
  readonly retryOn?: string;

  /**
   * Flag to specify whether the retries should retry to other localities.
   *
   * @schema VirtualServiceSpecHttpRetries#retryRemoteLocalities
   */
  readonly retryRemoteLocalities?: boolean;

}

/**
 * Rewrite HTTP URIs and Authority headers.
 *
 * @schema VirtualServiceSpecHttpRewrite
 */
export interface VirtualServiceSpecHttpRewrite {
  /**
   * rewrite the Authority/Host header with this value.
   *
   * @schema VirtualServiceSpecHttpRewrite#authority
   */
  readonly authority?: string;

  /**
   * @schema VirtualServiceSpecHttpRewrite#uri
   */
  readonly uri?: string;

}

/**
 * @schema VirtualServiceSpecHttpRoute
 */
export interface VirtualServiceSpecHttpRoute {
  /**
   * @schema VirtualServiceSpecHttpRoute#destination
   */
  readonly destination?: VirtualServiceSpecHttpRouteDestination;

  /**
   * @schema VirtualServiceSpecHttpRoute#headers
   */
  readonly headers?: VirtualServiceSpecHttpRouteHeaders;

  /**
   * @schema VirtualServiceSpecHttpRoute#weight
   */
  readonly weight?: number;

}

/**
 * @schema VirtualServiceSpecTcpMatch
 */
export interface VirtualServiceSpecTcpMatch {
  /**
   * IPv4 or IPv6 ip addresses of destination with optional subnet.
   *
   * @schema VirtualServiceSpecTcpMatch#destinationSubnets
   */
  readonly destinationSubnets?: string[];

  /**
   * Names of gateways where the rule should be applied.
   *
   * @schema VirtualServiceSpecTcpMatch#gateways
   */
  readonly gateways?: string[];

  /**
   * Specifies the port on the host that is being addressed.
   *
   * @schema VirtualServiceSpecTcpMatch#port
   */
  readonly port?: number;

  /**
   * @schema VirtualServiceSpecTcpMatch#sourceLabels
   */
  readonly sourceLabels?: { [key: string]: string };

  /**
   * Source namespace constraining the applicability of a rule to workloads in that namespace.
   *
   * @schema VirtualServiceSpecTcpMatch#sourceNamespace
   */
  readonly sourceNamespace?: string;

  /**
   * IPv4 or IPv6 ip address of source with optional subnet.
   *
   * @schema VirtualServiceSpecTcpMatch#sourceSubnet
   */
  readonly sourceSubnet?: string;

}

/**
 * @schema VirtualServiceSpecTcpRoute
 */
export interface VirtualServiceSpecTcpRoute {
  /**
   * @schema VirtualServiceSpecTcpRoute#destination
   */
  readonly destination?: VirtualServiceSpecTcpRouteDestination;

  /**
   * @schema VirtualServiceSpecTcpRoute#weight
   */
  readonly weight?: number;

}

/**
 * @schema VirtualServiceSpecTlsMatch
 */
export interface VirtualServiceSpecTlsMatch {
  /**
   * IPv4 or IPv6 ip addresses of destination with optional subnet.
   *
   * @schema VirtualServiceSpecTlsMatch#destinationSubnets
   */
  readonly destinationSubnets?: string[];

  /**
   * Names of gateways where the rule should be applied.
   *
   * @schema VirtualServiceSpecTlsMatch#gateways
   */
  readonly gateways?: string[];

  /**
   * Specifies the port on the host that is being addressed.
   *
   * @schema VirtualServiceSpecTlsMatch#port
   */
  readonly port?: number;

  /**
   * SNI (server name indicator) to match on.
   *
   * @schema VirtualServiceSpecTlsMatch#sniHosts
   */
  readonly sniHosts?: string[];

  /**
   * @schema VirtualServiceSpecTlsMatch#sourceLabels
   */
  readonly sourceLabels?: { [key: string]: string };

  /**
   * Source namespace constraining the applicability of a rule to workloads in that namespace.
   *
   * @schema VirtualServiceSpecTlsMatch#sourceNamespace
   */
  readonly sourceNamespace?: string;

}

/**
 * @schema VirtualServiceSpecTlsRoute
 */
export interface VirtualServiceSpecTlsRoute {
  /**
   * @schema VirtualServiceSpecTlsRoute#destination
   */
  readonly destination?: VirtualServiceSpecTlsRouteDestination;

  /**
   * @schema VirtualServiceSpecTlsRoute#weight
   */
  readonly weight?: number;

}

/**
 * @schema VirtualServiceSpecHttpCorsPolicyAllowOrigins
 */
export interface VirtualServiceSpecHttpCorsPolicyAllowOrigins {
  /**
   * @schema VirtualServiceSpecHttpCorsPolicyAllowOrigins#exact
   */
  readonly exact?: string;

  /**
   * @schema VirtualServiceSpecHttpCorsPolicyAllowOrigins#prefix
   */
  readonly prefix?: string;

  /**
   * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
   *
   * @schema VirtualServiceSpecHttpCorsPolicyAllowOrigins#regex
   */
  readonly regex?: string;

}

/**
 * @schema VirtualServiceSpecHttpFaultAbort
 */
export interface VirtualServiceSpecHttpFaultAbort {
  /**
   * @schema VirtualServiceSpecHttpFaultAbort#grpcStatus
   */
  readonly grpcStatus?: string;

  /**
   * @schema VirtualServiceSpecHttpFaultAbort#http2Error
   */
  readonly http2Error?: string;

  /**
   * HTTP status code to use to abort the Http request.
   *
   * @schema VirtualServiceSpecHttpFaultAbort#httpStatus
   */
  readonly httpStatus?: number;

  /**
   * Percentage of requests to be aborted with the error code provided.
   *
   * @schema VirtualServiceSpecHttpFaultAbort#percentage
   */
  readonly percentage?: VirtualServiceSpecHttpFaultAbortPercentage;

}

/**
 * @schema VirtualServiceSpecHttpFaultDelay
 */
export interface VirtualServiceSpecHttpFaultDelay {
  /**
   * @schema VirtualServiceSpecHttpFaultDelay#exponentialDelay
   */
  readonly exponentialDelay?: string;

  /**
   * Add a fixed delay before forwarding the request.
   *
   * @schema VirtualServiceSpecHttpFaultDelay#fixedDelay
   */
  readonly fixedDelay?: string;

  /**
   * Percentage of requests on which the delay will be injected (0-100).
   *
   * @schema VirtualServiceSpecHttpFaultDelay#percent
   */
  readonly percent?: number;

  /**
   * Percentage of requests on which the delay will be injected.
   *
   * @schema VirtualServiceSpecHttpFaultDelay#percentage
   */
  readonly percentage?: VirtualServiceSpecHttpFaultDelayPercentage;

}

/**
 * @schema VirtualServiceSpecHttpHeadersRequest
 */
export interface VirtualServiceSpecHttpHeadersRequest {
  /**
   * @schema VirtualServiceSpecHttpHeadersRequest#add
   */
  readonly add?: { [key: string]: string };

  /**
   * @schema VirtualServiceSpecHttpHeadersRequest#remove
   */
  readonly remove?: string[];

  /**
   * @schema VirtualServiceSpecHttpHeadersRequest#set
   */
  readonly set?: { [key: string]: string };

}

/**
 * @schema VirtualServiceSpecHttpHeadersResponse
 */
export interface VirtualServiceSpecHttpHeadersResponse {
  /**
   * @schema VirtualServiceSpecHttpHeadersResponse#add
   */
  readonly add?: { [key: string]: string };

  /**
   * @schema VirtualServiceSpecHttpHeadersResponse#remove
   */
  readonly remove?: string[];

  /**
   * @schema VirtualServiceSpecHttpHeadersResponse#set
   */
  readonly set?: { [key: string]: string };

}

/**
 * @schema VirtualServiceSpecHttpMatchAuthority
 */
export interface VirtualServiceSpecHttpMatchAuthority {
  /**
   * @schema VirtualServiceSpecHttpMatchAuthority#exact
   */
  readonly exact?: string;

  /**
   * @schema VirtualServiceSpecHttpMatchAuthority#prefix
   */
  readonly prefix?: string;

  /**
   * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
   *
   * @schema VirtualServiceSpecHttpMatchAuthority#regex
   */
  readonly regex?: string;

}

/**
 * @schema VirtualServiceSpecHttpMatchHeaders
 */
export interface VirtualServiceSpecHttpMatchHeaders {
  /**
   * @schema VirtualServiceSpecHttpMatchHeaders#exact
   */
  readonly exact?: string;

  /**
   * @schema VirtualServiceSpecHttpMatchHeaders#prefix
   */
  readonly prefix?: string;

  /**
   * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
   *
   * @schema VirtualServiceSpecHttpMatchHeaders#regex
   */
  readonly regex?: string;

}

/**
 * @schema VirtualServiceSpecHttpMatchMethod
 */
export interface VirtualServiceSpecHttpMatchMethod {
  /**
   * @schema VirtualServiceSpecHttpMatchMethod#exact
   */
  readonly exact?: string;

  /**
   * @schema VirtualServiceSpecHttpMatchMethod#prefix
   */
  readonly prefix?: string;

  /**
   * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
   *
   * @schema VirtualServiceSpecHttpMatchMethod#regex
   */
  readonly regex?: string;

}

/**
 * @schema VirtualServiceSpecHttpMatchQueryParams
 */
export interface VirtualServiceSpecHttpMatchQueryParams {
  /**
   * @schema VirtualServiceSpecHttpMatchQueryParams#exact
   */
  readonly exact?: string;

  /**
   * @schema VirtualServiceSpecHttpMatchQueryParams#prefix
   */
  readonly prefix?: string;

  /**
   * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
   *
   * @schema VirtualServiceSpecHttpMatchQueryParams#regex
   */
  readonly regex?: string;

}

/**
 * @schema VirtualServiceSpecHttpMatchScheme
 */
export interface VirtualServiceSpecHttpMatchScheme {
  /**
   * @schema VirtualServiceSpecHttpMatchScheme#exact
   */
  readonly exact?: string;

  /**
   * @schema VirtualServiceSpecHttpMatchScheme#prefix
   */
  readonly prefix?: string;

  /**
   * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
   *
   * @schema VirtualServiceSpecHttpMatchScheme#regex
   */
  readonly regex?: string;

}

/**
 * @schema VirtualServiceSpecHttpMatchUri
 */
export interface VirtualServiceSpecHttpMatchUri {
  /**
   * @schema VirtualServiceSpecHttpMatchUri#exact
   */
  readonly exact?: string;

  /**
   * @schema VirtualServiceSpecHttpMatchUri#prefix
   */
  readonly prefix?: string;

  /**
   * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
   *
   * @schema VirtualServiceSpecHttpMatchUri#regex
   */
  readonly regex?: string;

}

/**
 * @schema VirtualServiceSpecHttpMatchWithoutHeaders
 */
export interface VirtualServiceSpecHttpMatchWithoutHeaders {
  /**
   * @schema VirtualServiceSpecHttpMatchWithoutHeaders#exact
   */
  readonly exact?: string;

  /**
   * @schema VirtualServiceSpecHttpMatchWithoutHeaders#prefix
   */
  readonly prefix?: string;

  /**
   * RE2 style regex-based match (https://github.com/google/re2/wiki/Syntax).
   *
   * @schema VirtualServiceSpecHttpMatchWithoutHeaders#regex
   */
  readonly regex?: string;

}

/**
 * Specifies the port on the host that is being addressed.
 *
 * @schema VirtualServiceSpecHttpMirrorPort
 */
export interface VirtualServiceSpecHttpMirrorPort {
  /**
   * @schema VirtualServiceSpecHttpMirrorPort#number
   */
  readonly number?: number;

}

/**
 * @schema VirtualServiceSpecHttpRouteDestination
 */
export interface VirtualServiceSpecHttpRouteDestination {
  /**
   * The name of a service from the service registry.
   *
   * @schema VirtualServiceSpecHttpRouteDestination#host
   */
  readonly host?: string;

  /**
   * Specifies the port on the host that is being addressed.
   *
   * @schema VirtualServiceSpecHttpRouteDestination#port
   */
  readonly port?: VirtualServiceSpecHttpRouteDestinationPort;

  /**
   * The name of a subset within the service.
   *
   * @schema VirtualServiceSpecHttpRouteDestination#subset
   */
  readonly subset?: string;

}

/**
 * @schema VirtualServiceSpecHttpRouteHeaders
 */
export interface VirtualServiceSpecHttpRouteHeaders {
  /**
   * @schema VirtualServiceSpecHttpRouteHeaders#request
   */
  readonly request?: VirtualServiceSpecHttpRouteHeadersRequest;

  /**
   * @schema VirtualServiceSpecHttpRouteHeaders#response
   */
  readonly response?: VirtualServiceSpecHttpRouteHeadersResponse;

}

/**
 * @schema VirtualServiceSpecTcpRouteDestination
 */
export interface VirtualServiceSpecTcpRouteDestination {
  /**
   * The name of a service from the service registry.
   *
   * @schema VirtualServiceSpecTcpRouteDestination#host
   */
  readonly host?: string;

  /**
   * Specifies the port on the host that is being addressed.
   *
   * @schema VirtualServiceSpecTcpRouteDestination#port
   */
  readonly port?: VirtualServiceSpecTcpRouteDestinationPort;

  /**
   * The name of a subset within the service.
   *
   * @schema VirtualServiceSpecTcpRouteDestination#subset
   */
  readonly subset?: string;

}

/**
 * @schema VirtualServiceSpecTlsRouteDestination
 */
export interface VirtualServiceSpecTlsRouteDestination {
  /**
   * The name of a service from the service registry.
   *
   * @schema VirtualServiceSpecTlsRouteDestination#host
   */
  readonly host?: string;

  /**
   * Specifies the port on the host that is being addressed.
   *
   * @schema VirtualServiceSpecTlsRouteDestination#port
   */
  readonly port?: VirtualServiceSpecTlsRouteDestinationPort;

  /**
   * The name of a subset within the service.
   *
   * @schema VirtualServiceSpecTlsRouteDestination#subset
   */
  readonly subset?: string;

}

/**
 * Percentage of requests to be aborted with the error code provided.
 *
 * @schema VirtualServiceSpecHttpFaultAbortPercentage
 */
export interface VirtualServiceSpecHttpFaultAbortPercentage {
  /**
   * @schema VirtualServiceSpecHttpFaultAbortPercentage#value
   */
  readonly value?: number;

}

/**
 * Percentage of requests on which the delay will be injected.
 *
 * @schema VirtualServiceSpecHttpFaultDelayPercentage
 */
export interface VirtualServiceSpecHttpFaultDelayPercentage {
  /**
   * @schema VirtualServiceSpecHttpFaultDelayPercentage#value
   */
  readonly value?: number;

}

/**
 * Specifies the port on the host that is being addressed.
 *
 * @schema VirtualServiceSpecHttpRouteDestinationPort
 */
export interface VirtualServiceSpecHttpRouteDestinationPort {
  /**
   * @schema VirtualServiceSpecHttpRouteDestinationPort#number
   */
  readonly number?: number;

}

/**
 * @schema VirtualServiceSpecHttpRouteHeadersRequest
 */
export interface VirtualServiceSpecHttpRouteHeadersRequest {
  /**
   * @schema VirtualServiceSpecHttpRouteHeadersRequest#add
   */
  readonly add?: { [key: string]: string };

  /**
   * @schema VirtualServiceSpecHttpRouteHeadersRequest#remove
   */
  readonly remove?: string[];

  /**
   * @schema VirtualServiceSpecHttpRouteHeadersRequest#set
   */
  readonly set?: { [key: string]: string };

}

/**
 * @schema VirtualServiceSpecHttpRouteHeadersResponse
 */
export interface VirtualServiceSpecHttpRouteHeadersResponse {
  /**
   * @schema VirtualServiceSpecHttpRouteHeadersResponse#add
   */
  readonly add?: { [key: string]: string };

  /**
   * @schema VirtualServiceSpecHttpRouteHeadersResponse#remove
   */
  readonly remove?: string[];

  /**
   * @schema VirtualServiceSpecHttpRouteHeadersResponse#set
   */
  readonly set?: { [key: string]: string };

}

/**
 * Specifies the port on the host that is being addressed.
 *
 * @schema VirtualServiceSpecTcpRouteDestinationPort
 */
export interface VirtualServiceSpecTcpRouteDestinationPort {
  /**
   * @schema VirtualServiceSpecTcpRouteDestinationPort#number
   */
  readonly number?: number;

}

/**
 * Specifies the port on the host that is being addressed.
 *
 * @schema VirtualServiceSpecTlsRouteDestinationPort
 */
export interface VirtualServiceSpecTlsRouteDestinationPort {
  /**
   * @schema VirtualServiceSpecTlsRouteDestinationPort#number
   */
  readonly number?: number;

}
