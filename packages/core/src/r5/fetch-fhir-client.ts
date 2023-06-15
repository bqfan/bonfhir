/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BundleExecutor } from "./bundle-executor.js";
import {
  bundleNavigator,
  BundleNavigator,
  WithResolvableReferences,
} from "./bundle-navigator.js";
import { CustomResourceClass } from "./extensions.js";
import {
  ConcurrencyParameters,
  ConditionalSearchParameters,
  FhirClient,
  FhirClientError,
  FhirClientPatchBody,
  FhirClientSearchParameters,
  GeneralParameters,
  HistoryParameters,
  normalizePatchBody,
  normalizeSearchParameters,
  searchAllPages,
  searchByPage,
} from "./fhir-client.js";
import {
  AnyResource,
  AnyResourceType,
  Bundle,
  CapabilityStatement,
  ExtractResource,
  OperationOutcome,
  Retrieved,
} from "./fhir-types.codegen.js";
import {
  ExtractOperationResultType,
  Operation,
  OperationParameters,
} from "./operations.codegen.js";

/**
 * Allows to set the `Authorization` header to a static value.
 */
export type FetchFhirClientStaticAuthHeaderOptions = string;

/**
 * This function is invoked before each fetch operation to return the value for the
 * `Authorization` header.
 */
export type FetchFhirClientFunctionAuthHeaderOptions = (
  ...args: Parameters<typeof fetch>
) => Promise<string>;

export type FetchFhirClientAuthOptions =
  | FetchFhirClientStaticAuthHeaderOptions
  | FetchFhirClientFunctionAuthHeaderOptions;

export interface FetchFhirClientOptions {
  baseUrl: string | URL;

  /** The default value for preventConcurrentUpdates. Defaults to false */
  preventConcurrentUpdates?: boolean | null | undefined;

  /**
   * Can be used to set a FHIR version to accept from the server.
   * @see {@link https://hl7.org/fhir/http.html#version-parameter}
   */
  acceptFhirVersion?: string | null | undefined;

  /**
   * The fetch implementation to use. Defaults to the global fetch.
   */
  fetch?: typeof fetch | null | undefined;

  /**
   * Some options to setup authentication.
   */
  auth?: FetchFhirClientAuthOptions | null | undefined;
}

export class FetchFhirClient implements FhirClient {
  constructor(public options: FetchFhirClientOptions) {}

  read<TResourceType extends AnyResourceType>(
    type: TResourceType,
    id: string,
    options?: GeneralParameters | null | undefined
  ): Promise<Retrieved<ExtractResource<TResourceType>>>;
  read<TCustomResourceClass extends CustomResourceClass>(
    type: TCustomResourceClass,
    id: string,
    options?: GeneralParameters | null | undefined
  ): Promise<Retrieved<InstanceType<TCustomResourceClass>>>;
  public async read<
    TResourceType extends AnyResourceType,
    TCustomResourceClass extends CustomResourceClass
  >(
    type: TResourceType | TCustomResourceClass,
    id: string,
    options?: GeneralParameters | null | undefined
  ): Promise<
    | Retrieved<ExtractResource<TResourceType>>
    | Retrieved<InstanceType<TCustomResourceClass>>
  > {
    const { signal, ...remainingOptions } = options ?? {};
    const queryString = new URLSearchParams(
      remainingOptions as Record<string, string>
    ).toString();

    const resourceType = typeof type === "string" ? type : type.resourceType;
    return this.fetch(
      `${resourceType}/${id}${queryString ? `?${queryString}` : ""}`,
      { signal },
      type
    );
  }

  vread<TResourceType extends AnyResourceType>(
    type: TResourceType,
    id: string,
    vid: string,
    options?: GeneralParameters | null | undefined
  ): Promise<Retrieved<ExtractResource<TResourceType>>>;
  vread<TCustomResourceClass extends CustomResourceClass>(
    type: TCustomResourceClass,
    id: string,
    vid: string,
    options?: GeneralParameters | null | undefined
  ): Promise<Retrieved<InstanceType<TCustomResourceClass>>>;
  public async vread<
    TResourceType extends AnyResourceType,
    TCustomResourceClass extends CustomResourceClass
  >(
    type: TResourceType | TCustomResourceClass,
    id: string,
    vid: string,
    options?: GeneralParameters | null | undefined
  ): Promise<
    | Retrieved<ExtractResource<TResourceType>>
    | Retrieved<InstanceType<TCustomResourceClass>>
  > {
    const { signal, ...remainingOptions } = options ?? {};
    const queryString = new URLSearchParams(
      remainingOptions as Record<string, string>
    ).toString();

    const resourceType = typeof type === "string" ? type : type.resourceType;
    return this.fetch(
      `${resourceType}/${id}/_history/${vid}${
        queryString ? `?${queryString}` : ""
      }`,
      { signal },
      type
    );
  }

  public async update<TResource extends AnyResource>(
    body: TResource,
    options?:
      | (GeneralParameters &
          ConcurrencyParameters &
          ConditionalSearchParameters<TResource["resourceType"]>)
      | null
      | undefined
  ): Promise<Retrieved<TResource>> {
    const { preventConcurrentUpdates, search, signal, ...remainingOptions } =
      options ?? {};
    const searchQueryString = normalizeSearchParameters(
      body.resourceType,
      search
    );
    const optionsQueryString = new URLSearchParams(
      remainingOptions as Record<string, string>
    ).toString();
    const queryString = [searchQueryString, optionsQueryString]
      .filter(Boolean)
      .join("&");

    const headers: Record<string, string> = {};
    if (
      (preventConcurrentUpdates || this.options.preventConcurrentUpdates) &&
      body.meta?.versionId
    ) {
      headers["If-Match"] = `W/"${body.meta.versionId}"`;
    }

    return this.fetch<Retrieved<TResource>>(
      `${[body.resourceType, body.id].filter(Boolean).join("/")}${
        queryString ? `?${queryString}` : ""
      }`,
      {
        method: "PUT",
        body: JSON.stringify(body),
        headers,
        signal,
      },
      body.constructor
    );
  }

  patch<TResourceType extends AnyResourceType>(
    type: TResourceType,
    id: string,
    body: FhirClientPatchBody<TResourceType>,
    options?:
      | (GeneralParameters &
          ConcurrencyParameters & {
            versionId?: string | null | undefined;
          } & ConditionalSearchParameters<TResourceType>)
      | null
      | undefined
  ): Promise<Retrieved<ExtractResource<TResourceType>>>;
  patch<TCustomResourceClass extends CustomResourceClass>(
    type: TCustomResourceClass,
    id: string,
    body: FhirClientPatchBody<TCustomResourceClass["resourceType"]>,
    options?:
      | (GeneralParameters &
          ConcurrencyParameters & {
            versionId?: string | null | undefined;
          } & ConditionalSearchParameters<TCustomResourceClass["resourceType"]>)
      | null
      | undefined
  ): Promise<Retrieved<InstanceType<TCustomResourceClass>>>;
  public async patch<
    TResourceType extends AnyResourceType,
    TCustomResourceClass extends CustomResourceClass
  >(
    type: TResourceType | TCustomResourceClass,
    id: string,
    body: FhirClientPatchBody<TResourceType>,
    options?:
      | (GeneralParameters &
          ConcurrencyParameters & {
            versionId?: string | null | undefined;
          } & ConditionalSearchParameters<TResourceType>)
      | null
      | undefined
  ): Promise<Retrieved<ExtractResource<TResourceType>>> {
    const {
      preventConcurrentUpdates,
      versionId,
      search,
      signal,
      ...remainingOptions
    } = options ?? {};
    const resourceType = typeof type === "string" ? type : type.resourceType;
    const searchQueryString = normalizeSearchParameters(
      resourceType as TResourceType,
      search
    );
    const optionsQueryString = new URLSearchParams(
      remainingOptions as Record<string, string>
    ).toString();
    const queryString = [searchQueryString, optionsQueryString]
      .filter(Boolean)
      .join("&");

    const headers: Record<string, string> = {};
    if (
      (preventConcurrentUpdates || this.options.preventConcurrentUpdates) &&
      versionId
    ) {
      headers["If-Match"] = `W/"${versionId}"`;
    }

    return this.fetch<Retrieved<Retrieved<ExtractResource<TResourceType>>>>(
      `${resourceType}/${id}${queryString ? `?${queryString}` : ""}`,
      {
        method: "PATCH",
        body: JSON.stringify(
          normalizePatchBody(resourceType as TResourceType, body)
        ),
        headers,
        signal,
      },
      type
    );
  }

  public delete(
    resource: Retrieved<AnyResource>,
    options?: GeneralParameters | null | undefined
  ): Promise<void>;
  public delete(
    type: AnyResourceType,
    id: string,
    options?: GeneralParameters | null | undefined
  ): Promise<void>;
  public async delete(
    type: AnyResourceType | Retrieved<AnyResource>,
    id?: string | null | undefined | GeneralParameters,
    options?: GeneralParameters | null | undefined
  ): Promise<void> {
    if (typeof type !== "string") {
      return this.delete(
        type.resourceType,
        type.id,
        id as null | undefined | GeneralParameters
      );
    }

    const { signal, ...remainingOptions } = options ?? {};
    const queryString = new URLSearchParams(
      remainingOptions as Record<string, string>
    ).toString();
    await this.fetch(`${type}/${id}${queryString ? `?${queryString}` : ""}`, {
      method: "DELETE",
      signal,
    });
  }

  public history<TResource extends AnyResource>(
    resource: Retrieved<TResource>,
    options?: (GeneralParameters & HistoryParameters) | null | undefined
  ): Promise<BundleNavigator<Retrieved<TResource>>>;
  public history<TResourceType extends AnyResourceType>(
    type?: TResourceType | null | undefined,
    id?: string | null | undefined,
    options?: (GeneralParameters & HistoryParameters) | null | undefined
  ): Promise<BundleNavigator<Retrieved<ExtractResource<TResourceType>>>>;
  public async history<TResourceType extends AnyResourceType>(
    type?: TResourceType | Retrieved<AnyResource> | null | undefined,
    id?: string | (GeneralParameters & HistoryParameters) | null | undefined,
    options?: (GeneralParameters & HistoryParameters) | null | undefined
  ): Promise<BundleNavigator<Retrieved<ExtractResource<TResourceType>>>> {
    if (type && typeof type !== "string") {
      return (await this.history(
        type.resourceType,
        type.id,
        id as (GeneralParameters & HistoryParameters) | null | undefined
      )) as BundleNavigator<Retrieved<ExtractResource<TResourceType>>>;
    }

    const { signal, ...remainingOptions } = options ?? {};
    const queryString = new URLSearchParams(
      remainingOptions as Record<string, string>
    ).toString();

    return bundleNavigator(
      await this.fetch<Bundle<Retrieved<ExtractResource<TResourceType>>>>(
        `${[type, id, "_history"].filter(Boolean).join("/")}${
          queryString ? `?${queryString}` : ""
        }`,
        { signal }
      )
    );
  }

  public async create<TResource extends AnyResource>(
    body: TResource,
    options?:
      | (GeneralParameters &
          ConditionalSearchParameters<TResource["resourceType"]>)
      | null
      | undefined
  ): Promise<Retrieved<TResource>> {
    const { search, signal, ...remainingOptions } = options ?? {};
    const searchQueryString = normalizeSearchParameters(
      body.resourceType,
      search
    );
    const optionsQueryString = new URLSearchParams(
      remainingOptions as Record<string, string>
    ).toString();
    const queryString = [searchQueryString, optionsQueryString]
      .filter(Boolean)
      .join("&");

    return this.fetch<Retrieved<TResource>>(
      `${body.resourceType}${queryString ? `?${queryString}` : ""}`,
      {
        method: "POST",
        body: JSON.stringify(body),
        signal,
      },
      body.constructor
    );
  }

  public save<TResource extends AnyResource>(
    body: TResource,
    options?:
      | (GeneralParameters &
          ConcurrencyParameters &
          ConditionalSearchParameters<TResource["resourceType"]>)
      | null
      | undefined
  ): Promise<Retrieved<TResource>> {
    return body.id?.trim()
      ? this.update(body, options)
      : this.create(body, options);
  }

  public search<TResourceType extends AnyResourceType>(
    type?: TResourceType | null | undefined,
    parameters?: FhirClientSearchParameters<TResourceType> | null | undefined,
    options?: GeneralParameters | null | undefined
  ): Promise<BundleNavigator<Retrieved<ExtractResource<TResourceType>>>>;
  public search<TCustomResourceClass extends CustomResourceClass>(
    type: TCustomResourceClass,
    parameters?:
      | FhirClientSearchParameters<TCustomResourceClass["resourceType"]>
      | null
      | undefined,
    options?: GeneralParameters | null | undefined
  ): Promise<BundleNavigator<Retrieved<InstanceType<TCustomResourceClass>>>>;
  public async search<
    TResourceType extends AnyResourceType,
    TCustomResourceClass extends CustomResourceClass
  >(
    type?: TResourceType | TCustomResourceClass | null | undefined,
    parameters?: FhirClientSearchParameters<TResourceType> | null | undefined,
    options?: GeneralParameters | null | undefined
  ): Promise<
    | BundleNavigator<Retrieved<ExtractResource<TResourceType>>>
    | BundleNavigator<Retrieved<InstanceType<TCustomResourceClass>>>
  > {
    const resourceType = typeof type === "string" ? type : type?.resourceType;

    const searchQueryString = normalizeSearchParameters(
      resourceType as TResourceType,
      parameters
    );
    const { signal, ...remainingOptions } = options ?? {};
    const optionsQueryString = new URLSearchParams(
      remainingOptions as Record<string, string>
    ).toString();
    const queryString = [searchQueryString, optionsQueryString]
      .filter(Boolean)
      .join("&");

    const response = await this.fetch<
      Bundle<Retrieved<ExtractResource<TResourceType>>>
    >(`${resourceType || ""}${queryString ? `?${queryString}` : ""}`, {
      signal,
    });

    return bundleNavigator(
      response,
      typeof type === "string" ? undefined : (type as CustomResourceClass)
    ) as BundleNavigator<Retrieved<ExtractResource<TResourceType>>>;
  }

  public searchOne<TResourceType extends AnyResourceType>(
    type?: TResourceType | null | undefined,
    parameters?: FhirClientSearchParameters<TResourceType> | null | undefined,
    options?: GeneralParameters | null | undefined
  ): Promise<
    WithResolvableReferences<Retrieved<ExtractResource<TResourceType>>>
  >;
  public searchOne<TCustomResourceClass extends CustomResourceClass>(
    type: TCustomResourceClass,
    parameters?:
      | FhirClientSearchParameters<TCustomResourceClass["resourceType"]>
      | null
      | undefined,
    options?: GeneralParameters | null | undefined
  ): Promise<
    WithResolvableReferences<Retrieved<InstanceType<TCustomResourceClass>>>
  >;
  public async searchOne<
    TResourceType extends AnyResourceType,
    TCustomResourceClass extends CustomResourceClass
  >(
    type?: TResourceType | TCustomResourceClass | null | undefined,
    parameters?: FhirClientSearchParameters<TResourceType> | null | undefined,
    options?: GeneralParameters | null | undefined
  ): Promise<
    | WithResolvableReferences<Retrieved<ExtractResource<TResourceType>>>
    | WithResolvableReferences<Retrieved<InstanceType<TCustomResourceClass>>>
  > {
    const navigator = await this.search<TResourceType>(
      type as TResourceType,
      parameters,
      options
    );
    return navigator.searchMatchOne<ExtractResource<TResourceType>>();
  }

  public searchByPage<TResourceType extends AnyResourceType>(
    type: TResourceType | null | undefined,
    search: FhirClientSearchParameters<TResourceType>,
    fn: (
      nav: BundleNavigator<Retrieved<ExtractResource<TResourceType>>>
    ) => unknown | Promise<unknown>,
    options?: GeneralParameters | null | undefined
  ): Promise<void>;
  public searchByPage<TCustomResourceClass extends CustomResourceClass>(
    type: TCustomResourceClass,
    search: FhirClientSearchParameters<TCustomResourceClass["resourceType"]>,
    fn: (
      nav: BundleNavigator<Retrieved<InstanceType<TCustomResourceClass>>>
    ) => unknown | Promise<unknown>,
    options?: GeneralParameters | null | undefined
  ): Promise<void>;
  public async searchByPage<
    TResourceType extends AnyResourceType,
    TCustomResourceClass extends CustomResourceClass
  >(
    type: TResourceType | TCustomResourceClass | null | undefined,
    search: FhirClientSearchParameters<TResourceType>,
    fn: (
      nav: BundleNavigator<Retrieved<ExtractResource<TResourceType>>>
    ) => unknown | Promise<unknown>,
    options?: GeneralParameters | null | undefined
  ): Promise<void> {
    return searchByPage(this, type as TResourceType, search, fn, options);
  }

  public async searchAllPages<TResourceType extends AnyResourceType>(
    type: TResourceType | null | undefined,
    search: FhirClientSearchParameters<TResourceType>,
    options?: GeneralParameters | null | undefined
  ): Promise<BundleNavigator<ExtractResource<TResourceType>>>;
  public async searchAllPages<TCustomResourceClass extends CustomResourceClass>(
    type: TCustomResourceClass,
    search: FhirClientSearchParameters<TCustomResourceClass["resourceType"]>,
    options?: GeneralParameters | null | undefined
  ): Promise<BundleNavigator<Retrieved<InstanceType<TCustomResourceClass>>>>;
  public async searchAllPages<
    TResourceType extends AnyResourceType,
    TCustomResourceClass extends CustomResourceClass
  >(
    type: TResourceType | TCustomResourceClass | null | undefined,
    search:
      | FhirClientSearchParameters<TResourceType>
      | FhirClientSearchParameters<TCustomResourceClass["resourceType"]>,
    options?: GeneralParameters | null | undefined
  ): Promise<
    | BundleNavigator<ExtractResource<TResourceType>>
    | BundleNavigator<Retrieved<InstanceType<TCustomResourceClass>>>
  > {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return searchAllPages(this, type as any, search as any, options) as any;
  }

  public async capabilities(
    mode?: "full" | "normative" | "terminology" | null | undefined
  ): Promise<CapabilityStatement> {
    return this.fetch<CapabilityStatement>(
      `metadata${mode ? `?mode=${mode}` : ""}`
    );
  }

  public batch(): BundleExecutor;
  public batch(
    body: Bundle & { type: "batch" },
    options?: GeneralParameters | null | undefined
  ): Promise<Bundle>;
  public batch(
    body?: Bundle & { type: "batch" },
    options?: GeneralParameters | null | undefined
  ): Promise<Bundle> | BundleExecutor {
    if (!body) {
      return new BundleExecutor(this, "batch");
    }

    const { signal, ...remainingOptions } = options ?? {};
    const queryString = new URLSearchParams(
      remainingOptions as Record<string, string>
    ).toString();

    return this.fetch<Bundle>(queryString ? `?${queryString}` : "", {
      method: "POST",
      body: JSON.stringify(body),
      signal,
    });
  }

  public transaction(): BundleExecutor;
  public transaction(
    body: Bundle & { type: "transaction" },
    options?: GeneralParameters | null | undefined
  ): Promise<Bundle>;
  public transaction(
    body?: Bundle & { type: "transaction" },
    options?: GeneralParameters | null | undefined
  ): Promise<Bundle> | BundleExecutor {
    if (!body) {
      return new BundleExecutor(this, "transaction");
    }

    const { signal, ...remainingOptions } = options ?? {};
    const queryString = new URLSearchParams(
      remainingOptions as Record<string, string>
    ).toString();

    return this.fetch<Bundle>(queryString ? `?${queryString}` : "", {
      method: "POST",
      body: JSON.stringify(body),
      signal,
    });
  }

  public execute<TOperation extends Operation>(
    operation: TOperation
  ): Promise<ExtractOperationResultType<TOperation>>;
  public execute<TOperationResult>(
    operation: OperationParameters
  ): Promise<TOperationResult>;
  public async execute<
    TOperationResult,
    TOperation extends Operation<TOperationResult>
  >(operation: TOperation | OperationParameters): Promise<TOperationResult> {
    const operationParameters = (operation as Operation<TOperationResult>)
      .getParameters
      ? (operation as Operation<TOperationResult>).getParameters()
      : (operation as OperationParameters);
    const prefix = [
      operationParameters.resourceType,
      operationParameters.resourceId,
    ]
      .filter(Boolean)
      .join("/");
    const queryString =
      !operationParameters.affectsState &&
      operationParameters.parameters &&
      Object.values(operationParameters.parameters).length > 0
        ? new URLSearchParams(
            operationParameters.parameters as Record<string, string>
          ).toString()
        : undefined;
    return this.fetch<TOperationResult>(
      `${prefix ? `${prefix}/` : ""}${operationParameters.operation}${
        queryString ? `?${queryString}` : ""
      }`,
      {
        method: operationParameters.affectsState ? "POST" : "GET",
        body:
          operationParameters.affectsState && operationParameters.parameters
            ? JSON.stringify(operationParameters.parameters)
            : undefined,
      }
    );
  }

  public async fetchPage<TResource extends AnyResource>(
    resource: string | URL,
    init?: Parameters<typeof fetch>[1]
  ): Promise<BundleNavigator<Retrieved<TResource>>>;
  fetchPage<TCustomResourceClass extends CustomResourceClass>(
    resource: string | URL,
    init?: Parameters<typeof fetch>[1],
    customType?: TCustomResourceClass | null | undefined
  ): Promise<BundleNavigator<Retrieved<InstanceType<TCustomResourceClass>>>>;
  public async fetchPage<TResource extends AnyResource>(
    resource: string | URL,
    init?: Parameters<typeof fetch>[1],
    customType?: CustomResourceClass | null | undefined
  ): Promise<BundleNavigator<Retrieved<TResource>>> {
    const response = await this.fetch<Bundle<Retrieved<TResource>>>(
      resource,
      init
    );
    if (response.resourceType !== "Bundle") {
      throw new FhirClientError(
        undefined,
        undefined,
        {
          resource,
          response,
        },
        `Page response for ${resource} does not appear to be a bundle - ${response.resourceType}`
      );
    }

    return bundleNavigator(
      response,
      customType || undefined
    ) as BundleNavigator<Retrieved<TResource>>;
  }

  public async fetch<T = unknown>(
    resource: string | URL,
    init?: Parameters<typeof fetch>[1],
    customType?:
      | string
      // eslint-disable-next-line @typescript-eslint/ban-types
      | Function
      | null
      | undefined
  ): Promise<T> {
    let targetUrl = typeof resource === "string" ? resource : resource.href;

    if (
      /^(?:[a-z]+:)?\/\//.test(targetUrl) &&
      !targetUrl.startsWith(this.options.baseUrl?.toString())
    ) {
      throw new Error(
        `Unable to fetch ${targetUrl} as it is not part of the baseUrl ${this.options.baseUrl}`
      );
    } else {
      targetUrl = new URL(targetUrl, this.options.baseUrl).toString();
    }

    const finalInit = {
      ...init,
      headers: {
        Accept: `application/fhir+json${
          this.options.acceptFhirVersion
            ? `; fhirVersion=${this.options.acceptFhirVersion}`
            : ""
        }`,
        "Content-Type": "application/fhir+json",
        ...init?.headers,
      } as Record<string, string>,
    };

    if (!finalInit.headers.Authorization && this.options.auth) {
      finalInit.headers["Authorization"] =
        typeof this.options.auth === "function"
          ? await this.options.auth(targetUrl, finalInit)
          : this.options.auth;
    }

    const response = await (this.options.fetch || fetch)(targetUrl, finalInit);

    if (!response.ok) {
      // We clone the response to allow the use code to re-read the body if need be.
      const clonedResponse = response.clone();
      let operationOutcome: OperationOutcome | undefined;
      try {
        const tryOperationOutcome = (await response.json()) as OperationOutcome;
        if (tryOperationOutcome?.resourceType === "OperationOutcome") {
          operationOutcome = tryOperationOutcome;
        }
      } catch {
        // We ignore the deserialization error and return the original error.
      }
      throw new FhirClientError(clonedResponse.status, operationOutcome, {
        response: clonedResponse,
      });
    }

    const responseText = await response.text();
    const parsedResponse = responseText ? JSON.parse(responseText) : undefined;
    if (customType && typeof customType !== "string") {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return new customType(parsedResponse);
    }
    return parsedResponse;
  }
}
