// generated by cdk8s
import { ApiObject } from 'cdk8s';
import { Construct } from 'constructs';

/**
 * 
 *
 * @schema AuthorizationPolicy
 */
export class AuthorizationPolicy extends ApiObject {
  /**
   * Defines a "AuthorizationPolicy" API object
   * @param scope the scope in which to define this object
   * @param name a scope-local name for the object
   * @param options configuration options
   */
  public constructor(scope: Construct, name: string, options: AuthorizationPolicyOptions = {}) {
    super(scope, name, {
      ...options,
      kind: 'AuthorizationPolicy',
      apiVersion: 'security.istio.io/v1beta1',
    });
  }
}

/**
 * @schema AuthorizationPolicy
 */
export interface AuthorizationPolicyOptions {
  /**
   * Configuration for access control on workloads. See more details at: https://istio.io/docs/reference/config/security/authorization-policy.html
   *
   * @schema AuthorizationPolicy#spec
   */
  readonly spec?: AuthorizationPolicySpec;

}

/**
 * Configuration for access control on workloads. See more details at: https://istio.io/docs/reference/config/security/authorization-policy.html
 *
 * @schema AuthorizationPolicySpec
 */
export interface AuthorizationPolicySpec {
  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpec#action
   */
  readonly action?: AuthorizationPolicySpecAction;

  /**
   * Specifies detailed configuration of the CUSTOM action.
   *
   * @schema AuthorizationPolicySpec#provider
   */
  readonly provider?: AuthorizationPolicySpecProvider;

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpec#rules
   */
  readonly rules?: AuthorizationPolicySpecRules[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpec#selector
   */
  readonly selector?: AuthorizationPolicySpecSelector;

}

/**
 * Optional.
 *
 * @schema AuthorizationPolicySpecAction
 */
export enum AuthorizationPolicySpecAction {
  /** ALLOW */
  ALLOW = "ALLOW",
  /** DENY */
  DENY = "DENY",
  /** AUDIT */
  AUDIT = "AUDIT",
  /** CUSTOM */
  CUSTOM = "CUSTOM",
}

/**
 * Specifies detailed configuration of the CUSTOM action.
 *
 * @schema AuthorizationPolicySpecProvider
 */
export interface AuthorizationPolicySpecProvider {
  /**
   * Specifies the name of the extension provider.
   *
   * @schema AuthorizationPolicySpecProvider#name
   */
  readonly name?: string;

}

/**
 * @schema AuthorizationPolicySpecRules
 */
export interface AuthorizationPolicySpecRules {
  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRules#from
   */
  readonly from?: AuthorizationPolicySpecRulesFrom[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRules#to
   */
  readonly to?: AuthorizationPolicySpecRulesTo[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRules#when
   */
  readonly when?: AuthorizationPolicySpecRulesWhen[];

}

/**
 * Optional.
 *
 * @schema AuthorizationPolicySpecSelector
 */
export interface AuthorizationPolicySpecSelector {
  /**
   * @schema AuthorizationPolicySpecSelector#matchLabels
   */
  readonly matchLabels?: { [key: string]: string };

}

/**
 * @schema AuthorizationPolicySpecRulesFrom
 */
export interface AuthorizationPolicySpecRulesFrom {
  /**
   * Source specifies the source of a request.
   *
   * @schema AuthorizationPolicySpecRulesFrom#source
   */
  readonly source?: AuthorizationPolicySpecRulesFromSource;

}

/**
 * @schema AuthorizationPolicySpecRulesTo
 */
export interface AuthorizationPolicySpecRulesTo {
  /**
   * Operation specifies the operation of a request.
   *
   * @schema AuthorizationPolicySpecRulesTo#operation
   */
  readonly operation?: AuthorizationPolicySpecRulesToOperation;

}

/**
 * @schema AuthorizationPolicySpecRulesWhen
 */
export interface AuthorizationPolicySpecRulesWhen {
  /**
   * The name of an Istio attribute.
   *
   * @schema AuthorizationPolicySpecRulesWhen#key
   */
  readonly key?: string;

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesWhen#notValues
   */
  readonly notValues?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesWhen#values
   */
  readonly values?: string[];

}

/**
 * Source specifies the source of a request.
 *
 * @schema AuthorizationPolicySpecRulesFromSource
 */
export interface AuthorizationPolicySpecRulesFromSource {
  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesFromSource#ipBlocks
   */
  readonly ipBlocks?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesFromSource#namespaces
   */
  readonly namespaces?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesFromSource#notIpBlocks
   */
  readonly notIpBlocks?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesFromSource#notNamespaces
   */
  readonly notNamespaces?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesFromSource#notPrincipals
   */
  readonly notPrincipals?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesFromSource#notRemoteIpBlocks
   */
  readonly notRemoteIpBlocks?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesFromSource#notRequestPrincipals
   */
  readonly notRequestPrincipals?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesFromSource#principals
   */
  readonly principals?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesFromSource#remoteIpBlocks
   */
  readonly remoteIpBlocks?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesFromSource#requestPrincipals
   */
  readonly requestPrincipals?: string[];

}

/**
 * Operation specifies the operation of a request.
 *
 * @schema AuthorizationPolicySpecRulesToOperation
 */
export interface AuthorizationPolicySpecRulesToOperation {
  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesToOperation#hosts
   */
  readonly hosts?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesToOperation#methods
   */
  readonly methods?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesToOperation#notHosts
   */
  readonly notHosts?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesToOperation#notMethods
   */
  readonly notMethods?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesToOperation#notPaths
   */
  readonly notPaths?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesToOperation#notPorts
   */
  readonly notPorts?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesToOperation#paths
   */
  readonly paths?: string[];

  /**
   * Optional.
   *
   * @schema AuthorizationPolicySpecRulesToOperation#ports
   */
  readonly ports?: string[];

}

