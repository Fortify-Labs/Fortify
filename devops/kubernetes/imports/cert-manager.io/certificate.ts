// generated by cdk8s
import { ApiObject } from 'cdk8s';
import { Construct } from 'constructs';

/**
 * Certificate is a type to represent a Certificate from ACME
 *
 * @schema Certificate
 */
export class Certificate extends ApiObject {
  /**
   * Defines a "Certificate" API object
   * @param scope the scope in which to define this object
   * @param name a scope-local name for the object
   * @param options configuration options
   */
  public constructor(scope: Construct, name: string, options: CertificateOptions = {}) {
    super(scope, name, {
      ...options,
      kind: 'Certificate',
      apiVersion: 'cert-manager.io/v1alpha2',
    });
  }
}

/**
 * Certificate is a type to represent a Certificate from ACME
 *
 * @schema Certificate
 */
export interface CertificateOptions {
  /**
   * @schema Certificate#metadata
   */
  readonly metadata?: any;

  /**
   * CertificateSpec defines the desired state of Certificate. A valid Certificate requires at least one of a CommonName, DNSName, or URISAN to be valid.
   *
   * @schema Certificate#spec
   */
  readonly spec?: CertificateSpec;

}

/**
 * CertificateSpec defines the desired state of Certificate. A valid Certificate requires at least one of a CommonName, DNSName, or URISAN to be valid.
 *
 * @schema CertificateSpec
 */
export interface CertificateSpec {
  /**
   * CommonName is a common name to be used on the Certificate. The CommonName should have a length of 64 characters or fewer to avoid generating invalid CSRs. This value is ignored by TLS clients when any subject alt name is set. This is x509 behaviour: https://tools.ietf.org/html/rfc6125#section-6.4.4
   *
   * @schema CertificateSpec#commonName
   */
  readonly commonName?: string;

  /**
   * DNSNames is a list of subject alt names to be used on the Certificate.
   *
   * @schema CertificateSpec#dnsNames
   */
  readonly dnsNames?: string[];

  /**
   * Certificate default Duration
   *
   * @schema CertificateSpec#duration
   */
  readonly duration?: string;

  /**
   * EmailSANs is a list of Email Subject Alternative Names to be set on this Certificate.
   *
   * @schema CertificateSpec#emailSANs
   */
  readonly emailSANs?: string[];

  /**
   * IPAddresses is a list of IP addresses to be used on the Certificate
   *
   * @schema CertificateSpec#ipAddresses
   */
  readonly ipAddresses?: string[];

  /**
   * IsCA will mark this Certificate as valid for signing. This implies that the 'cert sign' usage is set
   *
   * @schema CertificateSpec#isCA
   */
  readonly isCA?: boolean;

  /**
   * IssuerRef is a reference to the issuer for this certificate. If the 'kind' field is not set, or set to 'Issuer', an Issuer resource with the given name in the same namespace as the Certificate will be used. If the 'kind' field is set to 'ClusterIssuer', a ClusterIssuer with the provided name will be used. The 'name' field in this stanza is required at all times.
   *
   * @schema CertificateSpec#issuerRef
   */
  readonly issuerRef: CertificateSpecIssuerRef;

  /**
   * KeyAlgorithm is the private key algorithm of the corresponding private key for this certificate. If provided, allowed values are either "rsa" or "ecdsa" If KeyAlgorithm is specified and KeySize is not provided, key size of 256 will be used for "ecdsa" key algorithm and key size of 2048 will be used for "rsa" key algorithm.
   *
   * @schema CertificateSpec#keyAlgorithm
   */
  readonly keyAlgorithm?: CertificateSpecKeyAlgorithm;

  /**
   * KeyEncoding is the private key cryptography standards (PKCS) for this certificate's private key to be encoded in. If provided, allowed values are "pkcs1" and "pkcs8" standing for PKCS#1 and PKCS#8, respectively. If KeyEncoding is not specified, then PKCS#1 will be used by default.
   *
   * @schema CertificateSpec#keyEncoding
   */
  readonly keyEncoding?: CertificateSpecKeyEncoding;

  /**
   * KeySize is the key bit size of the corresponding private key for this certificate. If provided, value must be between 2048 and 8192 inclusive when KeyAlgorithm is empty or is set to "rsa", and value must be one of (256, 384, 521) when KeyAlgorithm is set to "ecdsa".
   *
   * @schema CertificateSpec#keySize
   */
  readonly keySize?: number;

  /**
   * Keystores configures additional keystore output formats stored in the `secretName` Secret resource.
   *
   * @schema CertificateSpec#keystores
   */
  readonly keystores?: CertificateSpecKeystores;

  /**
   * Organization is the organization to be used on the Certificate
   *
   * @schema CertificateSpec#organization
   */
  readonly organization?: string[];

  /**
   * Options to control private keys used for the Certificate.
   *
   * @schema CertificateSpec#privateKey
   */
  readonly privateKey?: CertificateSpecPrivateKey;

  /**
   * Certificate renew before expiration duration
   *
   * @schema CertificateSpec#renewBefore
   */
  readonly renewBefore?: string;

  /**
   * SecretName is the name of the secret resource to store this secret in
   *
   * @schema CertificateSpec#secretName
   */
  readonly secretName: string;

  /**
   * Full X509 name specification (https://golang.org/pkg/crypto/x509/pkix/#Name).
   *
   * @schema CertificateSpec#subject
   */
  readonly subject?: CertificateSpecSubject;

  /**
   * URISANs is a list of URI Subject Alternative Names to be set on this Certificate.
   *
   * @schema CertificateSpec#uriSANs
   */
  readonly uriSANs?: string[];

  /**
   * Usages is the set of x509 actions that are enabled for a given key. Defaults are ('digital signature', 'key encipherment') if empty
   *
   * @schema CertificateSpec#usages
   */
  readonly usages?: CertificateSpecUsages[];

}

/**
 * IssuerRef is a reference to the issuer for this certificate. If the 'kind' field is not set, or set to 'Issuer', an Issuer resource with the given name in the same namespace as the Certificate will be used. If the 'kind' field is set to 'ClusterIssuer', a ClusterIssuer with the provided name will be used. The 'name' field in this stanza is required at all times.
 *
 * @schema CertificateSpecIssuerRef
 */
export interface CertificateSpecIssuerRef {
  /**
   * @schema CertificateSpecIssuerRef#group
   */
  readonly group?: string;

  /**
   * @schema CertificateSpecIssuerRef#kind
   */
  readonly kind?: string;

  /**
   * @schema CertificateSpecIssuerRef#name
   */
  readonly name: string;

}

/**
 * KeyAlgorithm is the private key algorithm of the corresponding private key for this certificate. If provided, allowed values are either "rsa" or "ecdsa" If KeyAlgorithm is specified and KeySize is not provided, key size of 256 will be used for "ecdsa" key algorithm and key size of 2048 will be used for "rsa" key algorithm.
 *
 * @schema CertificateSpecKeyAlgorithm
 */
export enum CertificateSpecKeyAlgorithm {
  /** rsa */
  RSA = "rsa",
  /** ecdsa */
  ECDSA = "ecdsa",
}

/**
 * KeyEncoding is the private key cryptography standards (PKCS) for this certificate's private key to be encoded in. If provided, allowed values are "pkcs1" and "pkcs8" standing for PKCS#1 and PKCS#8, respectively. If KeyEncoding is not specified, then PKCS#1 will be used by default.
 *
 * @schema CertificateSpecKeyEncoding
 */
export enum CertificateSpecKeyEncoding {
  /** pkcs1 */
  PKCS1 = "pkcs1",
  /** pkcs8 */
  PKCS8 = "pkcs8",
}

/**
 * Keystores configures additional keystore output formats stored in the `secretName` Secret resource.
 *
 * @schema CertificateSpecKeystores
 */
export interface CertificateSpecKeystores {
  /**
   * JKS configures options for storing a JKS keystore in the `spec.secretName` Secret resource.
   *
   * @schema CertificateSpecKeystores#jks
   */
  readonly jks?: CertificateSpecKeystoresJks;

  /**
   * PKCS12 configures options for storing a PKCS12 keystore in the `spec.secretName` Secret resource.
   *
   * @schema CertificateSpecKeystores#pkcs12
   */
  readonly pkcs12?: CertificateSpecKeystoresPkcs12;

}

/**
 * Options to control private keys used for the Certificate.
 *
 * @schema CertificateSpecPrivateKey
 */
export interface CertificateSpecPrivateKey {
  /**
   * RotationPolicy controls how private keys should be regenerated when a re-issuance is being processed. If set to Never, a private key will only be generated if one does not already exist in the target `spec.secretName`. If one does exists but it does not have the correct algorithm or size, a warning will be raised to await user intervention. If set to Always, a private key matching the specified requirements will be generated whenever a re-issuance occurs. Default is 'Never' for backward compatibility.
   *
   * @default Never' for backward compatibility.
   * @schema CertificateSpecPrivateKey#rotationPolicy
   */
  readonly rotationPolicy?: string;

}

/**
 * Full X509 name specification (https://golang.org/pkg/crypto/x509/pkix/#Name).
 *
 * @schema CertificateSpecSubject
 */
export interface CertificateSpecSubject {
  /**
   * Countries to be used on the Certificate.
   *
   * @schema CertificateSpecSubject#countries
   */
  readonly countries?: string[];

  /**
   * Cities to be used on the Certificate.
   *
   * @schema CertificateSpecSubject#localities
   */
  readonly localities?: string[];

  /**
   * Organizational Units to be used on the Certificate.
   *
   * @schema CertificateSpecSubject#organizationalUnits
   */
  readonly organizationalUnits?: string[];

  /**
   * Postal codes to be used on the Certificate.
   *
   * @schema CertificateSpecSubject#postalCodes
   */
  readonly postalCodes?: string[];

  /**
   * State/Provinces to be used on the Certificate.
   *
   * @schema CertificateSpecSubject#provinces
   */
  readonly provinces?: string[];

  /**
   * Serial number to be used on the Certificate.
   *
   * @schema CertificateSpecSubject#serialNumber
   */
  readonly serialNumber?: string;

  /**
   * Street addresses to be used on the Certificate.
   *
   * @schema CertificateSpecSubject#streetAddresses
   */
  readonly streetAddresses?: string[];

}

/**
 * KeyUsage specifies valid usage contexts for keys. See: https://tools.ietf.org/html/rfc5280#section-4.2.1.3      https://tools.ietf.org/html/rfc5280#section-4.2.1.12 Valid KeyUsage values are as follows: "signing", "digital signature", "content commitment", "key encipherment", "key agreement", "data encipherment", "cert sign", "crl sign", "encipher only", "decipher only", "any", "server auth", "client auth", "code signing", "email protection", "s/mime", "ipsec end system", "ipsec tunnel", "ipsec user", "timestamping", "ocsp signing", "microsoft sgc", "netscape sgc"
 *
 * @schema CertificateSpecUsages
 */
export enum CertificateSpecUsages {
  /** signing */
  SIGNING = "signing",
  /** digital signature */
  DIGITAL_SIGNATURE = "digital signature",
  /** content commitment */
  CONTENT_COMMITMENT = "content commitment",
  /** key encipherment */
  KEY_ENCIPHERMENT = "key encipherment",
  /** key agreement */
  KEY_AGREEMENT = "key agreement",
  /** data encipherment */
  DATA_ENCIPHERMENT = "data encipherment",
  /** cert sign */
  CERT_SIGN = "cert sign",
  /** crl sign */
  CRL_SIGN = "crl sign",
  /** encipher only */
  ENCIPHER_ONLY = "encipher only",
  /** decipher only */
  DECIPHER_ONLY = "decipher only",
  /** any */
  ANY = "any",
  /** server auth */
  SERVER_AUTH = "server auth",
  /** client auth */
  CLIENT_AUTH = "client auth",
  /** code signing */
  CODE_SIGNING = "code signing",
  /** email protection */
  EMAIL_PROTECTION = "email protection",
  /** s/mime */
  S_MIME = "s/mime",
  /** ipsec end system */
  IPSEC_END_SYSTEM = "ipsec end system",
  /** ipsec tunnel */
  IPSEC_TUNNEL = "ipsec tunnel",
  /** ipsec user */
  IPSEC_USER = "ipsec user",
  /** timestamping */
  TIMESTAMPING = "timestamping",
  /** ocsp signing */
  OCSP_SIGNING = "ocsp signing",
  /** microsoft sgc */
  MICROSOFT_SGC = "microsoft sgc",
  /** netscape sgc */
  NETSCAPE_SGC = "netscape sgc",
}

/**
 * JKS configures options for storing a JKS keystore in the `spec.secretName` Secret resource.
 *
 * @schema CertificateSpecKeystoresJks
 */
export interface CertificateSpecKeystoresJks {
  /**
   * Create enables JKS keystore creation for the Certificate. If true, a file named `keystore.jks` will be created in the target Secret resource, encrypted using the password stored in `passwordSecretRef`. The keystore file will only be updated upon re-issuance.
   *
   * @schema CertificateSpecKeystoresJks#create
   */
  readonly create: boolean;

  /**
   * PasswordSecretRef is a reference to a key in a Secret resource containing the password used to encrypt the JKS keystore.
   *
   * @schema CertificateSpecKeystoresJks#passwordSecretRef
   */
  readonly passwordSecretRef: CertificateSpecKeystoresJksPasswordSecretRef;

}

/**
 * PKCS12 configures options for storing a PKCS12 keystore in the `spec.secretName` Secret resource.
 *
 * @schema CertificateSpecKeystoresPkcs12
 */
export interface CertificateSpecKeystoresPkcs12 {
  /**
   * Create enables PKCS12 keystore creation for the Certificate. If true, a file named `keystore.p12` will be created in the target Secret resource, encrypted using the password stored in `passwordSecretRef`. The keystore file will only be updated upon re-issuance.
   *
   * @schema CertificateSpecKeystoresPkcs12#create
   */
  readonly create: boolean;

  /**
   * PasswordSecretRef is a reference to a key in a Secret resource containing the password used to encrypt the PKCS12 keystore.
   *
   * @schema CertificateSpecKeystoresPkcs12#passwordSecretRef
   */
  readonly passwordSecretRef: CertificateSpecKeystoresPkcs12PasswordSecretRef;

}

/**
 * PasswordSecretRef is a reference to a key in a Secret resource containing the password used to encrypt the JKS keystore.
 *
 * @schema CertificateSpecKeystoresJksPasswordSecretRef
 */
export interface CertificateSpecKeystoresJksPasswordSecretRef {
  /**
   * The key of the secret to select from. Must be a valid secret key.
   *
   * @schema CertificateSpecKeystoresJksPasswordSecretRef#key
   */
  readonly key?: string;

  /**
   * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
   *
   * @schema CertificateSpecKeystoresJksPasswordSecretRef#name
   */
  readonly name: string;

}

/**
 * PasswordSecretRef is a reference to a key in a Secret resource containing the password used to encrypt the PKCS12 keystore.
 *
 * @schema CertificateSpecKeystoresPkcs12PasswordSecretRef
 */
export interface CertificateSpecKeystoresPkcs12PasswordSecretRef {
  /**
   * The key of the secret to select from. Must be a valid secret key.
   *
   * @schema CertificateSpecKeystoresPkcs12PasswordSecretRef#key
   */
  readonly key?: string;

  /**
   * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
   *
   * @schema CertificateSpecKeystoresPkcs12PasswordSecretRef#name
   */
  readonly name: string;

}

