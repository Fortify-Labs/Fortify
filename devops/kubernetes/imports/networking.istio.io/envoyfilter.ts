// generated by cdk8s
import { ApiObject } from 'cdk8s';
import { Construct } from 'constructs';

/**
 * 
 *
 * @schema EnvoyFilter
 */
export class EnvoyFilter extends ApiObject {
  /**
   * Defines a "EnvoyFilter" API object
   * @param scope the scope in which to define this object
   * @param name a scope-local name for the object
   * @param options configuration options
   */
  public constructor(scope: Construct, name: string, options: EnvoyFilterOptions = {}) {
    super(scope, name, {
      ...options,
      kind: 'EnvoyFilter',
      apiVersion: 'networking.istio.io/v1alpha3',
    });
  }
}

/**
 * @schema EnvoyFilter
 */
export interface EnvoyFilterOptions {
  /**
   * Customizing Envoy configuration generated by Istio. See more details at: https://istio.io/docs/reference/config/networking/envoy-filter.html
   *
   * @schema EnvoyFilter#spec
   */
  readonly spec?: EnvoyFilterSpec;

}

/**
 * Customizing Envoy configuration generated by Istio. See more details at: https://istio.io/docs/reference/config/networking/envoy-filter.html
 *
 * @schema EnvoyFilterSpec
 */
export interface EnvoyFilterSpec {
  /**
   * One or more patches with match conditions.
   *
   * @schema EnvoyFilterSpec#configPatches
   */
  readonly configPatches?: EnvoyFilterSpecConfigPatches[];

  /**
   * @schema EnvoyFilterSpec#workloadSelector
   */
  readonly workloadSelector?: EnvoyFilterSpecWorkloadSelector;

}

/**
 * @schema EnvoyFilterSpecConfigPatches
 */
export interface EnvoyFilterSpecConfigPatches {
  /**
   * @schema EnvoyFilterSpecConfigPatches#applyTo
   */
  readonly applyTo?: EnvoyFilterSpecConfigPatchesApplyTo;

  /**
   * Match on listener/route configuration/cluster.
   *
   * @schema EnvoyFilterSpecConfigPatches#match
   */
  readonly match?: EnvoyFilterSpecConfigPatchesMatch;

  /**
   * The patch to apply along with the operation.
   *
   * @schema EnvoyFilterSpecConfigPatches#patch
   */
  readonly patch?: EnvoyFilterSpecConfigPatchesPatch;

}

/**
 * @schema EnvoyFilterSpecWorkloadSelector
 */
export interface EnvoyFilterSpecWorkloadSelector {
  /**
   * @schema EnvoyFilterSpecWorkloadSelector#labels
   */
  readonly labels?: { [key: string]: string };

}

/**
 * @schema EnvoyFilterSpecConfigPatchesApplyTo
 */
export enum EnvoyFilterSpecConfigPatchesApplyTo {
  /** INVALID */
  INVALID = "INVALID",
  /** LISTENER */
  LISTENER = "LISTENER",
  /** FILTER_CHAIN */
  FILTER_CHAIN = "FILTER_CHAIN",
  /** NETWORK_FILTER */
  NETWORK_FILTER = "NETWORK_FILTER",
  /** HTTP_FILTER */
  HTTP_FILTER = "HTTP_FILTER",
  /** ROUTE_CONFIGURATION */
  ROUTE_CONFIGURATION = "ROUTE_CONFIGURATION",
  /** VIRTUAL_HOST */
  VIRTUAL_HOST = "VIRTUAL_HOST",
  /** HTTP_ROUTE */
  HTTP_ROUTE = "HTTP_ROUTE",
  /** CLUSTER */
  CLUSTER = "CLUSTER",
}

/**
 * Match on listener/route configuration/cluster.
 *
 * @schema EnvoyFilterSpecConfigPatchesMatch
 */
export interface EnvoyFilterSpecConfigPatchesMatch {
  /**
   * Match on envoy cluster attributes.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatch#cluster
   */
  readonly cluster?: EnvoyFilterSpecConfigPatchesMatchCluster;

  /**
   * The specific config generation context to match on.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatch#context
   */
  readonly context?: EnvoyFilterSpecConfigPatchesMatchContext;

  /**
   * Match on envoy listener attributes.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatch#listener
   */
  readonly listener?: EnvoyFilterSpecConfigPatchesMatchListener;

  /**
   * Match on properties associated with a proxy.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatch#proxy
   */
  readonly proxy?: EnvoyFilterSpecConfigPatchesMatchProxy;

  /**
   * Match on envoy HTTP route configuration attributes.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatch#routeConfiguration
   */
  readonly routeConfiguration?: EnvoyFilterSpecConfigPatchesMatchRouteConfiguration;

}

/**
 * The patch to apply along with the operation.
 *
 * @schema EnvoyFilterSpecConfigPatchesPatch
 */
export interface EnvoyFilterSpecConfigPatchesPatch {
  /**
   * Determines the filter insertion order.
   *
   * @schema EnvoyFilterSpecConfigPatchesPatch#filterClass
   */
  readonly filterClass?: EnvoyFilterSpecConfigPatchesPatchFilterClass;

  /**
   * Determines how the patch should be applied.
   *
   * @schema EnvoyFilterSpecConfigPatchesPatch#operation
   */
  readonly operation?: EnvoyFilterSpecConfigPatchesPatchOperation;

  /**
   * The JSON config of the object being patched.
   *
   * @schema EnvoyFilterSpecConfigPatchesPatch#value
   */
  readonly value?: any;

}

/**
 * Match on envoy cluster attributes.
 *
 * @schema EnvoyFilterSpecConfigPatchesMatchCluster
 */
export interface EnvoyFilterSpecConfigPatchesMatchCluster {
  /**
   * The exact name of the cluster to match.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchCluster#name
   */
  readonly name?: string;

  /**
   * The service port for which this cluster was generated.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchCluster#portNumber
   */
  readonly portNumber?: number;

  /**
   * The fully qualified service name for this cluster.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchCluster#service
   */
  readonly service?: string;

  /**
   * The subset associated with the service.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchCluster#subset
   */
  readonly subset?: string;

}

/**
 * The specific config generation context to match on.
 *
 * @schema EnvoyFilterSpecConfigPatchesMatchContext
 */
export enum EnvoyFilterSpecConfigPatchesMatchContext {
  /** ANY */
  ANY = "ANY",
  /** SIDECAR_INBOUND */
  SIDECAR_INBOUND = "SIDECAR_INBOUND",
  /** SIDECAR_OUTBOUND */
  SIDECAR_OUTBOUND = "SIDECAR_OUTBOUND",
  /** GATEWAY */
  GATEWAY = "GATEWAY",
}

/**
 * Match on envoy listener attributes.
 *
 * @schema EnvoyFilterSpecConfigPatchesMatchListener
 */
export interface EnvoyFilterSpecConfigPatchesMatchListener {
  /**
   * Match a specific filter chain in a listener.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchListener#filterChain
   */
  readonly filterChain?: EnvoyFilterSpecConfigPatchesMatchListenerFilterChain;

  /**
   * Match a specific listener by its name.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchListener#name
   */
  readonly name?: string;

  /**
   * @schema EnvoyFilterSpecConfigPatchesMatchListener#portName
   */
  readonly portName?: string;

  /**
   * @schema EnvoyFilterSpecConfigPatchesMatchListener#portNumber
   */
  readonly portNumber?: number;

}

/**
 * Match on properties associated with a proxy.
 *
 * @schema EnvoyFilterSpecConfigPatchesMatchProxy
 */
export interface EnvoyFilterSpecConfigPatchesMatchProxy {
  /**
   * @schema EnvoyFilterSpecConfigPatchesMatchProxy#metadata
   */
  readonly metadata?: { [key: string]: string };

  /**
   * @schema EnvoyFilterSpecConfigPatchesMatchProxy#proxyVersion
   */
  readonly proxyVersion?: string;

}

/**
 * Match on envoy HTTP route configuration attributes.
 *
 * @schema EnvoyFilterSpecConfigPatchesMatchRouteConfiguration
 */
export interface EnvoyFilterSpecConfigPatchesMatchRouteConfiguration {
  /**
   * @schema EnvoyFilterSpecConfigPatchesMatchRouteConfiguration#gateway
   */
  readonly gateway?: string;

  /**
   * Route configuration name to match on.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchRouteConfiguration#name
   */
  readonly name?: string;

  /**
   * Applicable only for GATEWAY context.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchRouteConfiguration#portName
   */
  readonly portName?: string;

  /**
   * @schema EnvoyFilterSpecConfigPatchesMatchRouteConfiguration#portNumber
   */
  readonly portNumber?: number;

  /**
   * @schema EnvoyFilterSpecConfigPatchesMatchRouteConfiguration#vhost
   */
  readonly vhost?: EnvoyFilterSpecConfigPatchesMatchRouteConfigurationVhost;

}

/**
 * Determines the filter insertion order.
 *
 * @schema EnvoyFilterSpecConfigPatchesPatchFilterClass
 */
export enum EnvoyFilterSpecConfigPatchesPatchFilterClass {
  /** UNSPECIFIED */
  UNSPECIFIED = "UNSPECIFIED",
  /** AUTHN */
  AUTHN = "AUTHN",
  /** AUTHZ */
  AUTHZ = "AUTHZ",
  /** STATS */
  STATS = "STATS",
}

/**
 * Determines how the patch should be applied.
 *
 * @schema EnvoyFilterSpecConfigPatchesPatchOperation
 */
export enum EnvoyFilterSpecConfigPatchesPatchOperation {
  /** INVALID */
  INVALID = "INVALID",
  /** MERGE */
  MERGE = "MERGE",
  /** ADD */
  ADD = "ADD",
  /** REMOVE */
  REMOVE = "REMOVE",
  /** INSERT_BEFORE */
  INSERT_BEFORE = "INSERT_BEFORE",
  /** INSERT_AFTER */
  INSERT_AFTER = "INSERT_AFTER",
  /** INSERT_FIRST */
  INSERT_FIRST = "INSERT_FIRST",
  /** REPLACE */
  REPLACE = "REPLACE",
}

/**
 * Match a specific filter chain in a listener.
 *
 * @schema EnvoyFilterSpecConfigPatchesMatchListenerFilterChain
 */
export interface EnvoyFilterSpecConfigPatchesMatchListenerFilterChain {
  /**
   * Applies only to sidecars.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchListenerFilterChain#applicationProtocols
   */
  readonly applicationProtocols?: string;

  /**
   * The name of a specific filter to apply the patch to.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchListenerFilterChain#filter
   */
  readonly filter?: EnvoyFilterSpecConfigPatchesMatchListenerFilterChainFilter;

  /**
   * The name assigned to the filter chain.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchListenerFilterChain#name
   */
  readonly name?: string;

  /**
   * The SNI value used by a filter chain's match condition.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchListenerFilterChain#sni
   */
  readonly sni?: string;

  /**
   * Applies only to SIDECAR_INBOUND context.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchListenerFilterChain#transportProtocol
   */
  readonly transportProtocol?: string;

}

/**
 * @schema EnvoyFilterSpecConfigPatchesMatchRouteConfigurationVhost
 */
export interface EnvoyFilterSpecConfigPatchesMatchRouteConfigurationVhost {
  /**
   * @schema EnvoyFilterSpecConfigPatchesMatchRouteConfigurationVhost#name
   */
  readonly name?: string;

  /**
   * Match a specific route within the virtual host.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchRouteConfigurationVhost#route
   */
  readonly route?: EnvoyFilterSpecConfigPatchesMatchRouteConfigurationVhostRoute;

}

/**
 * The name of a specific filter to apply the patch to.
 *
 * @schema EnvoyFilterSpecConfigPatchesMatchListenerFilterChainFilter
 */
export interface EnvoyFilterSpecConfigPatchesMatchListenerFilterChainFilter {
  /**
   * The filter name to match on.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchListenerFilterChainFilter#name
   */
  readonly name?: string;

  /**
   * @schema EnvoyFilterSpecConfigPatchesMatchListenerFilterChainFilter#subFilter
   */
  readonly subFilter?: EnvoyFilterSpecConfigPatchesMatchListenerFilterChainFilterSubFilter;

}

/**
 * Match a specific route within the virtual host.
 *
 * @schema EnvoyFilterSpecConfigPatchesMatchRouteConfigurationVhostRoute
 */
export interface EnvoyFilterSpecConfigPatchesMatchRouteConfigurationVhostRoute {
  /**
   * Match a route with specific action type.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchRouteConfigurationVhostRoute#action
   */
  readonly action?: EnvoyFilterSpecConfigPatchesMatchRouteConfigurationVhostRouteAction;

  /**
   * @schema EnvoyFilterSpecConfigPatchesMatchRouteConfigurationVhostRoute#name
   */
  readonly name?: string;

}

/**
 * @schema EnvoyFilterSpecConfigPatchesMatchListenerFilterChainFilterSubFilter
 */
export interface EnvoyFilterSpecConfigPatchesMatchListenerFilterChainFilterSubFilter {
  /**
   * The filter name to match on.
   *
   * @schema EnvoyFilterSpecConfigPatchesMatchListenerFilterChainFilterSubFilter#name
   */
  readonly name?: string;

}

/**
 * Match a route with specific action type.
 *
 * @schema EnvoyFilterSpecConfigPatchesMatchRouteConfigurationVhostRouteAction
 */
export enum EnvoyFilterSpecConfigPatchesMatchRouteConfigurationVhostRouteAction {
  /** ANY */
  ANY = "ANY",
  /** ROUTE */
  ROUTE = "ROUTE",
  /** REDIRECT */
  REDIRECT = "REDIRECT",
  /** DIRECT_RESPONSE */
  DIRECT_RESPONSE = "DIRECT_RESPONSE",
}

