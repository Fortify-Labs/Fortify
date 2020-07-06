// generated by cdk8s
import { ApiObject } from 'cdk8s';
import { Construct } from 'constructs';

/**
 * 
 *
 * @schema Sidecar
 */
export class Sidecar extends ApiObject {
  /**
   * Defines a "Sidecar" API object
   * @param scope the scope in which to define this object
   * @param name a scope-local name for the object
   * @param options configuration options
   */
  public constructor(scope: Construct, name: string, options: SidecarOptions = {}) {
    super(scope, name, {
      ...options,
      kind: 'Sidecar',
      apiVersion: 'networking.istio.io/v1alpha3',
    });
  }
}

/**
 * @schema Sidecar
 */
export interface SidecarOptions {
  /**
   * Configuration affecting network reachability of a sidecar. See more details at: https://istio.io/docs/reference/config/networking/sidecar.html
   *
   * @schema Sidecar#spec
   */
  readonly spec?: SidecarSpec;

}

/**
 * Configuration affecting network reachability of a sidecar. See more details at: https://istio.io/docs/reference/config/networking/sidecar.html
 *
 * @schema SidecarSpec
 */
export interface SidecarSpec {
  /**
   * @schema SidecarSpec#egress
   */
  readonly egress?: SidecarSpecEgress[];

  /**
   * @schema SidecarSpec#ingress
   */
  readonly ingress?: SidecarSpecIngress[];

  /**
   * @schema SidecarSpec#localhost
   */
  readonly localhost?: SidecarSpecLocalhost;

  /**
   * Configuration for the outbound traffic policy.
   *
   * @schema SidecarSpec#outboundTrafficPolicy
   */
  readonly outboundTrafficPolicy?: SidecarSpecOutboundTrafficPolicy;

  /**
   * @schema SidecarSpec#workloadSelector
   */
  readonly workloadSelector?: SidecarSpecWorkloadSelector;

}

/**
 * @schema SidecarSpecEgress
 */
export interface SidecarSpecEgress {
  /**
   * @schema SidecarSpecEgress#bind
   */
  readonly bind?: string;

  /**
   * @schema SidecarSpecEgress#captureMode
   */
  readonly captureMode?: SidecarSpecEgressCaptureMode;

  /**
   * @schema SidecarSpecEgress#hosts
   */
  readonly hosts?: string[];

  /**
   * @schema SidecarSpecEgress#localhostServerTls
   */
  readonly localhostServerTls?: SidecarSpecEgressLocalhostServerTls;

  /**
   * The port associated with the listener.
   *
   * @schema SidecarSpecEgress#port
   */
  readonly port?: SidecarSpecEgressPort;

}

/**
 * @schema SidecarSpecIngress
 */
export interface SidecarSpecIngress {
  /**
   * The IP to which the listener should be bound.
   *
   * @schema SidecarSpecIngress#bind
   */
  readonly bind?: string;

  /**
   * @schema SidecarSpecIngress#captureMode
   */
  readonly captureMode?: SidecarSpecIngressCaptureMode;

  /**
   * @schema SidecarSpecIngress#defaultEndpoint
   */
  readonly defaultEndpoint?: string;

  /**
   * @schema SidecarSpecIngress#localhostClientTls
   */
  readonly localhostClientTls?: SidecarSpecIngressLocalhostClientTls;

  /**
   * The port associated with the listener.
   *
   * @schema SidecarSpecIngress#port
   */
  readonly port?: SidecarSpecIngressPort;

}

/**
 * @schema SidecarSpecLocalhost
 */
export interface SidecarSpecLocalhost {
  /**
   * @schema SidecarSpecLocalhost#clientTls
   */
  readonly clientTls?: SidecarSpecLocalhostClientTls;

  /**
   * @schema SidecarSpecLocalhost#serverTls
   */
  readonly serverTls?: SidecarSpecLocalhostServerTls;

}

/**
 * Configuration for the outbound traffic policy.
 *
 * @schema SidecarSpecOutboundTrafficPolicy
 */
export interface SidecarSpecOutboundTrafficPolicy {
  /**
   * @schema SidecarSpecOutboundTrafficPolicy#egressProxy
   */
  readonly egressProxy?: SidecarSpecOutboundTrafficPolicyEgressProxy;

  /**
   * @schema SidecarSpecOutboundTrafficPolicy#mode
   */
  readonly mode?: SidecarSpecOutboundTrafficPolicyMode;

}

/**
 * @schema SidecarSpecWorkloadSelector
 */
export interface SidecarSpecWorkloadSelector {
  /**
   * @schema SidecarSpecWorkloadSelector#labels
   */
  readonly labels?: { [key: string]: string };

}

/**
 * @schema SidecarSpecEgressCaptureMode
 */
export enum SidecarSpecEgressCaptureMode {
  /** DEFAULT */
  DEFAULT = "DEFAULT",
  /** IPTABLES */
  IPTABLES = "IPTABLES",
  /** NONE */
  NONE = "NONE",
}

/**
 * @schema SidecarSpecEgressLocalhostServerTls
 */
export interface SidecarSpecEgressLocalhostServerTls {
  /**
   * REQUIRED if mode is `MUTUAL`.
   *
   * @schema SidecarSpecEgressLocalhostServerTls#caCertificates
   */
  readonly caCertificates?: string;

  /**
   * Optional: If specified, only support the specified cipher list.
   *
   * @schema SidecarSpecEgressLocalhostServerTls#cipherSuites
   */
  readonly cipherSuites?: string[];

  /**
   * @schema SidecarSpecEgressLocalhostServerTls#credentialName
   */
  readonly credentialName?: string;

  /**
   * @schema SidecarSpecEgressLocalhostServerTls#httpsRedirect
   */
  readonly httpsRedirect?: boolean;

  /**
   * Optional: Maximum TLS protocol version.
   *
   * @schema SidecarSpecEgressLocalhostServerTls#maxProtocolVersion
   */
  readonly maxProtocolVersion?: SidecarSpecEgressLocalhostServerTlsMaxProtocolVersion;

  /**
   * Optional: Minimum TLS protocol version.
   *
   * @schema SidecarSpecEgressLocalhostServerTls#minProtocolVersion
   */
  readonly minProtocolVersion?: SidecarSpecEgressLocalhostServerTlsMinProtocolVersion;

  /**
   * @schema SidecarSpecEgressLocalhostServerTls#mode
   */
  readonly mode?: SidecarSpecEgressLocalhostServerTlsMode;

  /**
   * REQUIRED if mode is `SIMPLE` or `MUTUAL`.
   *
   * @schema SidecarSpecEgressLocalhostServerTls#privateKey
   */
  readonly privateKey?: string;

  /**
   * REQUIRED if mode is `SIMPLE` or `MUTUAL`.
   *
   * @schema SidecarSpecEgressLocalhostServerTls#serverCertificate
   */
  readonly serverCertificate?: string;

  /**
   * @schema SidecarSpecEgressLocalhostServerTls#subjectAltNames
   */
  readonly subjectAltNames?: string[];

  /**
   * @schema SidecarSpecEgressLocalhostServerTls#verifyCertificateHash
   */
  readonly verifyCertificateHash?: string[];

  /**
   * @schema SidecarSpecEgressLocalhostServerTls#verifyCertificateSpki
   */
  readonly verifyCertificateSpki?: string[];

}

/**
 * The port associated with the listener.
 *
 * @schema SidecarSpecEgressPort
 */
export interface SidecarSpecEgressPort {
  /**
   * Label assigned to the port.
   *
   * @schema SidecarSpecEgressPort#name
   */
  readonly name?: string;

  /**
   * A valid non-negative integer port number.
   *
   * @schema SidecarSpecEgressPort#number
   */
  readonly number?: number;

  /**
   * The protocol exposed on the port.
   *
   * @schema SidecarSpecEgressPort#protocol
   */
  readonly protocol?: string;

}

/**
 * @schema SidecarSpecIngressCaptureMode
 */
export enum SidecarSpecIngressCaptureMode {
  /** DEFAULT */
  DEFAULT = "DEFAULT",
  /** IPTABLES */
  IPTABLES = "IPTABLES",
  /** NONE */
  NONE = "NONE",
}

/**
 * @schema SidecarSpecIngressLocalhostClientTls
 */
export interface SidecarSpecIngressLocalhostClientTls {
  /**
   * @schema SidecarSpecIngressLocalhostClientTls#caCertificates
   */
  readonly caCertificates?: string;

  /**
   * REQUIRED if mode is `MUTUAL`.
   *
   * @schema SidecarSpecIngressLocalhostClientTls#clientCertificate
   */
  readonly clientCertificate?: string;

  /**
   * @schema SidecarSpecIngressLocalhostClientTls#credentialName
   */
  readonly credentialName?: string;

  /**
   * @schema SidecarSpecIngressLocalhostClientTls#mode
   */
  readonly mode?: SidecarSpecIngressLocalhostClientTlsMode;

  /**
   * REQUIRED if mode is `MUTUAL`.
   *
   * @schema SidecarSpecIngressLocalhostClientTls#privateKey
   */
  readonly privateKey?: string;

  /**
   * SNI string to present to the server during TLS handshake.
   *
   * @schema SidecarSpecIngressLocalhostClientTls#sni
   */
  readonly sni?: string;

  /**
   * @schema SidecarSpecIngressLocalhostClientTls#subjectAltNames
   */
  readonly subjectAltNames?: string[];

}

/**
 * The port associated with the listener.
 *
 * @schema SidecarSpecIngressPort
 */
export interface SidecarSpecIngressPort {
  /**
   * Label assigned to the port.
   *
   * @schema SidecarSpecIngressPort#name
   */
  readonly name?: string;

  /**
   * A valid non-negative integer port number.
   *
   * @schema SidecarSpecIngressPort#number
   */
  readonly number?: number;

  /**
   * The protocol exposed on the port.
   *
   * @schema SidecarSpecIngressPort#protocol
   */
  readonly protocol?: string;

}

/**
 * @schema SidecarSpecLocalhostClientTls
 */
export interface SidecarSpecLocalhostClientTls {
  /**
   * @schema SidecarSpecLocalhostClientTls#caCertificates
   */
  readonly caCertificates?: string;

  /**
   * REQUIRED if mode is `MUTUAL`.
   *
   * @schema SidecarSpecLocalhostClientTls#clientCertificate
   */
  readonly clientCertificate?: string;

  /**
   * @schema SidecarSpecLocalhostClientTls#credentialName
   */
  readonly credentialName?: string;

  /**
   * @schema SidecarSpecLocalhostClientTls#mode
   */
  readonly mode?: SidecarSpecLocalhostClientTlsMode;

  /**
   * REQUIRED if mode is `MUTUAL`.
   *
   * @schema SidecarSpecLocalhostClientTls#privateKey
   */
  readonly privateKey?: string;

  /**
   * SNI string to present to the server during TLS handshake.
   *
   * @schema SidecarSpecLocalhostClientTls#sni
   */
  readonly sni?: string;

  /**
   * @schema SidecarSpecLocalhostClientTls#subjectAltNames
   */
  readonly subjectAltNames?: string[];

}

/**
 * @schema SidecarSpecLocalhostServerTls
 */
export interface SidecarSpecLocalhostServerTls {
  /**
   * REQUIRED if mode is `MUTUAL`.
   *
   * @schema SidecarSpecLocalhostServerTls#caCertificates
   */
  readonly caCertificates?: string;

  /**
   * Optional: If specified, only support the specified cipher list.
   *
   * @schema SidecarSpecLocalhostServerTls#cipherSuites
   */
  readonly cipherSuites?: string[];

  /**
   * @schema SidecarSpecLocalhostServerTls#credentialName
   */
  readonly credentialName?: string;

  /**
   * @schema SidecarSpecLocalhostServerTls#httpsRedirect
   */
  readonly httpsRedirect?: boolean;

  /**
   * Optional: Maximum TLS protocol version.
   *
   * @schema SidecarSpecLocalhostServerTls#maxProtocolVersion
   */
  readonly maxProtocolVersion?: SidecarSpecLocalhostServerTlsMaxProtocolVersion;

  /**
   * Optional: Minimum TLS protocol version.
   *
   * @schema SidecarSpecLocalhostServerTls#minProtocolVersion
   */
  readonly minProtocolVersion?: SidecarSpecLocalhostServerTlsMinProtocolVersion;

  /**
   * @schema SidecarSpecLocalhostServerTls#mode
   */
  readonly mode?: SidecarSpecLocalhostServerTlsMode;

  /**
   * REQUIRED if mode is `SIMPLE` or `MUTUAL`.
   *
   * @schema SidecarSpecLocalhostServerTls#privateKey
   */
  readonly privateKey?: string;

  /**
   * REQUIRED if mode is `SIMPLE` or `MUTUAL`.
   *
   * @schema SidecarSpecLocalhostServerTls#serverCertificate
   */
  readonly serverCertificate?: string;

  /**
   * @schema SidecarSpecLocalhostServerTls#subjectAltNames
   */
  readonly subjectAltNames?: string[];

  /**
   * @schema SidecarSpecLocalhostServerTls#verifyCertificateHash
   */
  readonly verifyCertificateHash?: string[];

  /**
   * @schema SidecarSpecLocalhostServerTls#verifyCertificateSpki
   */
  readonly verifyCertificateSpki?: string[];

}

/**
 * @schema SidecarSpecOutboundTrafficPolicyEgressProxy
 */
export interface SidecarSpecOutboundTrafficPolicyEgressProxy {
  /**
   * The name of a service from the service registry.
   *
   * @schema SidecarSpecOutboundTrafficPolicyEgressProxy#host
   */
  readonly host?: string;

  /**
   * Specifies the port on the host that is being addressed.
   *
   * @schema SidecarSpecOutboundTrafficPolicyEgressProxy#port
   */
  readonly port?: SidecarSpecOutboundTrafficPolicyEgressProxyPort;

  /**
   * The name of a subset within the service.
   *
   * @schema SidecarSpecOutboundTrafficPolicyEgressProxy#subset
   */
  readonly subset?: string;

}

/**
 * @schema SidecarSpecOutboundTrafficPolicyMode
 */
export enum SidecarSpecOutboundTrafficPolicyMode {
  /** REGISTRY_ONLY */
  REGISTRY_ONLY = "REGISTRY_ONLY",
  /** ALLOW_ANY */
  ALLOW_ANY = "ALLOW_ANY",
}

/**
 * Optional: Maximum TLS protocol version.
 *
 * @schema SidecarSpecEgressLocalhostServerTlsMaxProtocolVersion
 */
export enum SidecarSpecEgressLocalhostServerTlsMaxProtocolVersion {
  /** TLS_AUTO */
  TLS_AUTO = "TLS_AUTO",
  /** TLSV1_0 */
  TLSV1_0 = "TLSV1_0",
  /** TLSV1_1 */
  TLSV1_1 = "TLSV1_1",
  /** TLSV1_2 */
  TLSV1_2 = "TLSV1_2",
  /** TLSV1_3 */
  TLSV1_3 = "TLSV1_3",
}

/**
 * Optional: Minimum TLS protocol version.
 *
 * @schema SidecarSpecEgressLocalhostServerTlsMinProtocolVersion
 */
export enum SidecarSpecEgressLocalhostServerTlsMinProtocolVersion {
  /** TLS_AUTO */
  TLS_AUTO = "TLS_AUTO",
  /** TLSV1_0 */
  TLSV1_0 = "TLSV1_0",
  /** TLSV1_1 */
  TLSV1_1 = "TLSV1_1",
  /** TLSV1_2 */
  TLSV1_2 = "TLSV1_2",
  /** TLSV1_3 */
  TLSV1_3 = "TLSV1_3",
}

/**
 * @schema SidecarSpecEgressLocalhostServerTlsMode
 */
export enum SidecarSpecEgressLocalhostServerTlsMode {
  /** PASSTHROUGH */
  PASSTHROUGH = "PASSTHROUGH",
  /** SIMPLE */
  SIMPLE = "SIMPLE",
  /** MUTUAL */
  MUTUAL = "MUTUAL",
  /** AUTO_PASSTHROUGH */
  AUTO_PASSTHROUGH = "AUTO_PASSTHROUGH",
  /** ISTIO_MUTUAL */
  ISTIO_MUTUAL = "ISTIO_MUTUAL",
}

/**
 * @schema SidecarSpecIngressLocalhostClientTlsMode
 */
export enum SidecarSpecIngressLocalhostClientTlsMode {
  /** DISABLE */
  DISABLE = "DISABLE",
  /** SIMPLE */
  SIMPLE = "SIMPLE",
  /** MUTUAL */
  MUTUAL = "MUTUAL",
  /** ISTIO_MUTUAL */
  ISTIO_MUTUAL = "ISTIO_MUTUAL",
}

/**
 * @schema SidecarSpecLocalhostClientTlsMode
 */
export enum SidecarSpecLocalhostClientTlsMode {
  /** DISABLE */
  DISABLE = "DISABLE",
  /** SIMPLE */
  SIMPLE = "SIMPLE",
  /** MUTUAL */
  MUTUAL = "MUTUAL",
  /** ISTIO_MUTUAL */
  ISTIO_MUTUAL = "ISTIO_MUTUAL",
}

/**
 * Optional: Maximum TLS protocol version.
 *
 * @schema SidecarSpecLocalhostServerTlsMaxProtocolVersion
 */
export enum SidecarSpecLocalhostServerTlsMaxProtocolVersion {
  /** TLS_AUTO */
  TLS_AUTO = "TLS_AUTO",
  /** TLSV1_0 */
  TLSV1_0 = "TLSV1_0",
  /** TLSV1_1 */
  TLSV1_1 = "TLSV1_1",
  /** TLSV1_2 */
  TLSV1_2 = "TLSV1_2",
  /** TLSV1_3 */
  TLSV1_3 = "TLSV1_3",
}

/**
 * Optional: Minimum TLS protocol version.
 *
 * @schema SidecarSpecLocalhostServerTlsMinProtocolVersion
 */
export enum SidecarSpecLocalhostServerTlsMinProtocolVersion {
  /** TLS_AUTO */
  TLS_AUTO = "TLS_AUTO",
  /** TLSV1_0 */
  TLSV1_0 = "TLSV1_0",
  /** TLSV1_1 */
  TLSV1_1 = "TLSV1_1",
  /** TLSV1_2 */
  TLSV1_2 = "TLSV1_2",
  /** TLSV1_3 */
  TLSV1_3 = "TLSV1_3",
}

/**
 * @schema SidecarSpecLocalhostServerTlsMode
 */
export enum SidecarSpecLocalhostServerTlsMode {
  /** PASSTHROUGH */
  PASSTHROUGH = "PASSTHROUGH",
  /** SIMPLE */
  SIMPLE = "SIMPLE",
  /** MUTUAL */
  MUTUAL = "MUTUAL",
  /** AUTO_PASSTHROUGH */
  AUTO_PASSTHROUGH = "AUTO_PASSTHROUGH",
  /** ISTIO_MUTUAL */
  ISTIO_MUTUAL = "ISTIO_MUTUAL",
}

/**
 * Specifies the port on the host that is being addressed.
 *
 * @schema SidecarSpecOutboundTrafficPolicyEgressProxyPort
 */
export interface SidecarSpecOutboundTrafficPolicyEgressProxyPort {
  /**
   * @schema SidecarSpecOutboundTrafficPolicyEgressProxyPort#number
   */
  readonly number?: number;

}

