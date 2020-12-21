// generated by cdk8s
import { ApiObject, GroupVersionKind } from 'cdk8s';
import { Construct } from 'constructs';

/**
 * 
 *
 * @schema TraefikService
 */
export class TraefikService extends ApiObject {
  /**
   * Returns the apiVersion and kind for "TraefikService"
   */
  public static readonly GVK: GroupVersionKind = {
    apiVersion: 'traefik.containo.us/v1alpha1',
    kind: 'TraefikService',
  }

  /**
   * Renders a Kubernetes manifest for "TraefikService".
   *
   * This can be used to inline resource manifests inside other objects (e.g. as templates).
   *
   * @param props initialization props
   */
  public static manifest(props: TraefikServiceProps = {}): any {
    return {
      ...TraefikService.GVK,
      ...props,
    };
  }

  /**
   * Defines a "TraefikService" API object
   * @param scope the scope in which to define this object
   * @param id a scope-local name for the object
   * @param props initialization props
   */
  public constructor(scope: Construct, id: string, props: TraefikServiceProps = {}) {
    super(scope, id, TraefikService.manifest(props));
  }
}

/**
 * @schema TraefikService
 */
export interface TraefikServiceProps {
}
