import {
  AnyResourceType,
  ExtractResource,
  FhirClientSearchParameters,
  FhirSearchBuilder,
  Reference,
  Resource,
  ResourceTypeOf,
  cloneResource,
  id,
  normalizeSearchParameters,
  reference,
} from "@bonfhir/core/r5";
import { useFhirRead, useFhirSearch } from "@bonfhir/query/r5";
import { ReactElement, ReactNode, useState } from "react";
import { useFhirUIContext } from "../../context";
import { FhirInputCommonProps } from "./common";

export type FhirInputResourceProps<
  TRendererProps = any,
  TResourceType extends AnyResourceType = AnyResourceType,
> = FhirInputCommonProps & {
  placeholder?: string | null | undefined;
  resourceType: TResourceType;
  search?: (
    query: string,
  ) => FhirClientSearchParameters<ResourceTypeOf<TResourceType>>;
  display?:
    | ((resource: ExtractResource<TResourceType>) => ReactNode)
    | null
    | undefined;
  className?: string | undefined;
  style?: Record<string, any> | undefined;
  rendererProps?: TRendererProps;
} & (
    | {
        type: "Resource";
        value?: ExtractResource<TResourceType> | string | null | undefined;
        onChange?: (value: ExtractResource<TResourceType> | undefined) => void;
      }
    | {
        type: "Reference";
        value?: Reference | null | undefined;
        onChange?: (
          value: Reference<ExtractResource<TResourceType>> | undefined,
        ) => void;
      }
  );

export function FhirInputResource<
  TRendererProps = any,
  TResourceType extends AnyResourceType = AnyResourceType,
>(
  props: FhirInputResourceProps<TRendererProps, TResourceType>,
): ReactElement | null {
  const { render } = useFhirUIContext();
  const [searchParam, setSearchParams] =
    useState<FhirClientSearchParameters<ResourceTypeOf<TResourceType>>>("");

  const searchQuery = useFhirSearch(props.resourceType, searchParam);
  const valueQuery = useFhirRead(
    props.resourceType,
    props.value ? id(props.value as any) : "",
    {
      query: {
        enabled: !!props.value && !!id(props.value as any),
      },
    },
  );

  return render("FhirInputResource", {
    ...props,
    value: valueQuery.data || undefined,
    onSearch: (query: string) => {
      if (props.search) {
        const normalizedSearch = normalizeSearchParameters(
          props.resourceType,
          props.search(query),
        );
        setSearchParams(normalizedSearch ?? "");
      } else {
        setSearchParams(
          new FhirSearchBuilder().stringParam("_text", query).href,
        );
      }
    },
    onChange: (value: Resource | undefined) => {
      if (!value) {
        props.onChange?.(undefined);
      }

      if (props.type === "Reference") {
        props.onChange?.(reference(value as any));
      }

      if (props.type === "Resource") {
        props.onChange?.(cloneResource(value as any));
      }
    },
    data: searchQuery.data?.searchMatch() ?? [],
    display:
      props.display ??
      ((resource: Resource) =>
        reference(resource as any)?.display ??
        `${resource.resourceType}/${resource.id}`),
    error: valueQuery.error ?? searchQuery.error,
  });
}

export type FhirInputResourceRendererProps<TRendererProps = any> =
  FhirInputResourceProps<TRendererProps> & {
    value: Resource | undefined;
    onChange: (value: Resource | undefined) => void;
    onSearch: (query: string) => void;
    data: Resource[];
    display: (resource: Resource) => string;
    error: unknown | undefined;
  };

export type FhirInputResourceRenderer = (
  props: FhirInputResourceRendererProps,
) => ReactElement | null;
