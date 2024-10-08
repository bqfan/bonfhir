import {
  AnyResource,
  CustomResourceClass,
  FhirClient,
  Retrieved,
  Subscription,
  SubscriptionFilterBy,
} from "@bonfhir/core/r5";

export interface FhirSubscription<
  TResource extends AnyResource | CustomResourceClass = AnyResource,
> {
  filterBy: SubscriptionFilterBy[];

  name: string;

  reason: string;

  /** The Subscription endpoint to hit (webhook url). */
  endpoint: string;

  /**
   * Use a custom (extended) resource class (instead of default FHIR resource).
   */
  customResource?: CustomResourceClass;

  /** The subscription handler. */
  handler: FhirSubscriptionHandler<TResource>;
}

export type FhirSubscriptionHandler<
  TResource extends AnyResource | CustomResourceClass = AnyResource,
> = (
  args: FhirSubscriptionHandlerArgs<TResource>,
) => Promise<FhirSubscriptionHandlerResult>;

export type FhirSubscriptionLogger = Pick<
  typeof console,
  "debug" | "info" | "warn" | "error"
>;

export interface FhirSubscriptionHandlerArgs<
  TResource extends AnyResource | CustomResourceClass = AnyResource,
> {
  fhirClient: FhirClient;

  /** The resource that matches the subscription. */
  resource: Retrieved<TResource>;

  /** The configured logger. */
  logger: FhirSubscriptionLogger | null | undefined;
}

export type FhirSubscriptionHandlerResult =
  | void
  | Promise<void>
  | object
  | Promise<object>;

export interface RegisterSubscriptionsArgs {
  fhirClient: FhirClient;

  logger: FhirSubscriptionLogger;

  /** The API base URL */
  baseUrl: string;

  /** The subscription payload, a.k.a. MIME type. Defaults to application/fhir+json */
  contentType?: Subscription["contentType"] | null | undefined;

  /** A secret shared between the API and the FHIR subscription use to secure the endpoint. */
  webhookSecret: string;

  /**
   * The name of the security header used. Defaults to "X-Subscription-Auth"
   */
  securityHeader?: string | null | undefined;

  /** The list of subscriptions to register */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscriptions: FhirSubscription<any>[];
}

/**
 * Create the Subscriptions for the webhooks.
 */
export async function registerSubscriptions(_args: RegisterSubscriptionsArgs) {
  throw new Error(`Subscriptions are not implemented yet in r5.`);
}
